const mineflayer = require('mineflayer');
const { pathfinder, Movements } = require('mineflayer-pathfinder');
const { EventEmitter } = require('events');
const { EVENTS } = require('../config/constants');
const Inventory = require('./inventory');
const TreeHarvester = require('./treeHarvester');
const BotAI = require('../ai/BotAI');
const Movement = require('./movement');
const { DEFAULT_SETTINGS, COMMANDS } = require('../config/constants');
require('dotenv').config();

/**
 * Main TreeBot class that coordinates all bot functionality
 */
class TreeBot extends EventEmitter {
    /**
     * Initialize the TreeBot
     * @param {string} host - Server host
     * @param {number} port - Server port
     * @param {string} username - Bot username
     */
    constructor(host = DEFAULT_SETTINGS.HOST, port = DEFAULT_SETTINGS.PORT, username = DEFAULT_SETTINGS.USERNAME) {
        super();
        this.host = host;
        this.port = port;
        this.username = username;
        
        this.ai = new BotAI(process.env.GEMINI_API_KEY);
        this.connectBot();
    }

    /**
     * Connect to Minecraft server
     */
    connectBot() {
        console.log(`Attempting to connect to ${this.host}:${this.port} as ${this.username}`);

        this.bot = mineflayer.createBot({
            host: this.host,
            port: this.port,
            username: this.username,
            version: DEFAULT_SETTINGS.VERSION
        });

        this.bot.loadPlugin(pathfinder);

        // Initialize bot components after connection
        this.movement = new Movement(this.bot);
        this.inventory = new Inventory(this.bot);
        this.harvester = new TreeHarvester(this.bot);

        this.setupEventHandlers();
    }

    /**
     * Set up event handlers
     */
    setupEventHandlers() {
        this.bot.on('error', this.handleError.bind(this));
        this.bot.on('end', this.handleDisconnect.bind(this));
        this.bot.once('spawn', this.handleSpawn.bind(this));
        this.bot.on('chat', this.handleChat.bind(this));
        this.bot.on('physicsTick', this.handlePhysicsTick.bind(this));

        this.bot.once('spawn', () => {
            this.emit(EVENTS.BOT_CONNECTED);
            this.bot.chat('TreeBot connected and ready to help!');
        });

        this.bot.on('chat', async (username, message) => {
            if (username === this.bot.username) return;
            
            this.emit(EVENTS.COMMAND_RECEIVED, {
                username,
                message
            });

            try {
                const context = {
                    playerName: username,
                    inventory: this.inventory.getInventoryStatus(),
                    isHarvesting: this.harvester.isHarvesting
                };

                const response = await this.ai.processMessage(message, context);
                await this.executeCommand(response, username);
                
                this.emit(EVENTS.COMMAND_EXECUTED, {
                    username,
                    message,
                    response,
                    success: true
                });
                
            } catch (error) {
                console.error('Error processing command:', error);
                this.bot.chat("I couldn't process that command.");
                
                this.emit(EVENTS.BOT_ERROR, {
                    error: error.message,
                    command: message
                });
            }
        });

        this.bot.on('error', (error) => {
            console.error('Bot error:', error);
            this.emit(EVENTS.BOT_ERROR, {
                error: error.message
            });
        });

        this.bot.on('end', () => {
            this.emit(EVENTS.BOT_DISCONNECTED);
        });
    }

    /**
     * Handle bot errors
     * @param {Error} err - Error object
     */
    handleError(err) {
        console.error('Bot error:', err);
        console.log('Please make sure:');
        console.log('1. Your Minecraft server is running');
        console.log('2. The server IP and port are correct');
        console.log('3. The Minecraft version matches your server');
    }

    /**
     * Handle bot disconnection
     */
    handleDisconnect() {
        console.log('Bot disconnected. Attempting to reconnect in 5 seconds...');
        setTimeout(() => this.connectBot(), 5000);
    }

    /**
     * Handle bot spawn
     */
    handleSpawn() {
        console.log('Bot spawned');
        const mcData = require('minecraft-data')(this.bot.version);
        const defaultMove = new Movements(this.bot, mcData);
        this.bot.pathfinder.setMovements(defaultMove);
    }

    /**
     * Handle chat messages
     * @param {string} username - Username of message sender
     * @param {string} message - Chat message
     */
    async handleChat(username, message) {
        if (username === this.bot.username) return;
        if (message.startsWith('/')) return;

        // Check if bot is mentioned
        const botMentioned = message.toLowerCase().includes("@" + this.bot.username.toLowerCase());
        if (!botMentioned) return;

        const aiResponse = await this.ai.processMessage(message, { playerName: username, bot: {
            name: this.bot.username,
            position: {
                x: this.bot.entity.position.x,
                y: this.bot.entity.position.y,
                z: this.bot.entity.position.z
            },
            health: this.bot.health,
        } });

        if (aiResponse.type === 'command') {
            this.stopAllActions();
            await this.executeCommand(aiResponse, username);
            return;
        }
        
        this.bot.chat(aiResponse.response);
    }

    /**
     * Execute a command
     * @param {Object} aiResponse - AI response object
     * @param {string} username - Username who issued the command
     */
    async executeCommand(aiResponse, username) {
        switch (aiResponse.command) {
            case COMMANDS.FIND_TREES:
                await this.harvester.startHarvest(aiResponse.parameters);
                break;
            case COMMANDS.GIVE_WOOD:
                await this.inventory.giveWoodToPlayer(username, aiResponse.parameters);
                break;
            case COMMANDS.FOLLOW_ME:
                await this.movement.followPlayer(username, aiResponse.parameters);
                break;
            case COMMANDS.STOP:
                this.stopAllActions();
                break;
            case COMMANDS.CHECK_INVENTORY:
                await this.inventory.checkInventory(aiResponse.parameters);
                break;
        }
    }

    /**
     * Handle physics tick
     */
    handlePhysicsTick() {
        this.movement.updateFollowing();
    }

    /**
     * Stop all bot actions
     */
    stopAllActions() {
        this.movement.stop();
        this.harvester.stop();
    }
}

// Create and export the bot instance
const treeBot = new TreeBot();

// Log available commands
console.log('Use these commands in Minecraft chat:');
console.log(`- "${COMMANDS.FIND_TREES}" to make the bot search and cut down trees`);
console.log(`- "${COMMANDS.GIVE_WOOD}" to receive collected wood`);
console.log(`- "${COMMANDS.FOLLOW_ME}" to make the bot follow you`);
console.log(`- "${COMMANDS.STOP}" to stop the bot's current action`);
console.log(`- "${COMMANDS.CHECK_INVENTORY}" to check the bot's inventory`);

module.exports = TreeBot;

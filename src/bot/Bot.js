const mineflayer = require('mineflayer');
const { pathfinder, Movements } = require('mineflayer-pathfinder');
const { EventEmitter } = require('events');
const { EVENTS } = require('../config/constants');

// Components
const Inventory = require('./inventory');
const TreeHarvester = require('./treeHarvester');
const BotAI = require('../ai/BotAI');
const Movement = require('./movement');
const Engage = require('./engage');

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
        this._initializeComponents();
        this._setupEventHandlers();
    }

    _initializeComponents() {
        this.movement = new Movement(this.bot);
        this.inventory = new Inventory(this.bot);
        this.harvester = new TreeHarvester(this.bot);
        this.engage = new Engage(this.bot);
    }

    /**
     * Set up event handlers
     */
    _setupEventHandlers() {
        this.bot.on('error', this._handleError.bind(this));
        this.bot.on('end', this._handleDisconnect.bind(this));
        this.bot.once('spawn', this._handleSpawn.bind(this));
        this.bot.on('chat', this._handleChat.bind(this));
        this.bot.on('physicsTick', this._handlePhysicsTick.bind(this));
        this.bot.once('spawn', () => {
            this.emit(EVENTS.BOT_CONNECTED);
            this.bot.chat('TreeBot connected and ready to help!');
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
    _handleError(err) {
        console.error('Bot error:', err);
        console.log('Please make sure:');
        console.log('1. Your Minecraft server is running');
        console.log('2. The server IP and port are correct');
        console.log('3. The Minecraft version matches your server');
    }

    /**
     * Handle bot disconnection
     */
    _handleDisconnect() {
        console.log('Bot disconnected. Attempting to reconnect in 5 seconds...');
        setTimeout(() => this.connectBot(), 5000);
    }

    /**
     * Handle bot spawn
     */
    _handleSpawn() {
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
    async _handleChat(username, message) {
        if (username === this.bot.username) return;
        if (message.startsWith('/')) return;
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
            console.log(`Executing command: ${aiResponse.command}`);
            await this._executeCommand(aiResponse, username);
            return;
        }
        this.bot.chat(aiResponse.response);
    }

    /**
     * Execute a command
     * @param {Object} aiResponse - AI response object
     * @param {string} username - Username who issued the command
     */
    async _executeCommand(aiResponse, username) {
        switch (aiResponse.command) {
            case COMMANDS.FIND_TREES:
                await this.harvester.startHarvest(aiResponse.parameters, this.inventory);
                break;
            case COMMANDS.GIVE_WOOD:
                await this.inventory.giveWoodToPlayer(username, aiResponse.parameters);
                break;
            case COMMANDS.FOLLOW_ME:
                await this.movement.followPlayer(username, aiResponse.parameters);
                break;
            case COMMANDS.STOP:
                this._stopAllActions();
                break;
            case COMMANDS.CHECK_INVENTORY:
                await this.inventory.checkInventory(aiResponse.parameters);
                break;
            case COMMANDS.ENGAGE:
                await this.engage.startEngaging(aiResponse.parameters, this.inventory);
                break;
        }
    }

    /**
     * Handle physics tick
     */
    _handlePhysicsTick() {
        this.movement.updateFollowing();
        this.engage.updateEngaging();
    }

    /**
     * Stop all bot actions
     */
    _stopAllActions() {
        this.movement.stop();
        this.harvester.stop();
        this.engage.stopEngaging();
    }
}

new TreeBot();
console.log('Use these commands in Minecraft chat:');
console.log(`- "${COMMANDS.FIND_TREES}" to make the bot search and cut down trees`);
console.log(`- "${COMMANDS.GIVE_WOOD}" to receive collected wood`);
console.log(`- "${COMMANDS.FOLLOW_ME}" to make the bot follow you`);
console.log(`- "${COMMANDS.STOP}" to stop the bot's current action`);
console.log(`- "${COMMANDS.CHECK_INVENTORY}" to check the bot's inventory`);
console.log(`- "${COMMANDS.ENGAGE}" to engage a target entity`);

module.exports = TreeBot;

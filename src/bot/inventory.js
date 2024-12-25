const { goals } = require('mineflayer-pathfinder');
const { GoalNear } = goals;
const { TREE_BLOCKS } = require('../config/constants');

/**
 * Inventory management for TreeBot
 */
class Inventory {
    /**
     * Initialize inventory handler
     * @param {Object} bot - Mineflayer bot instance
     */
    constructor(bot) {
        this.bot = bot;
    }

    /**
     * Give wood items to a player
     * @param {string} username - Username of player to give wood to
     * @param {Object} params - Parameters for giving wood
     * @returns {Promise<void>}
     */
    async giveWoodToPlayer(username, params = {}) {
        const player = this.bot.players[username];
        if (!player || !player.entity) {
            this.bot.chat("I can't find you!");
            return;
        }

        const woodType = params.woodType || 'any';
        const amount = params.amount || 'all';

        const woodItems = this.bot.inventory.items().filter(item => 
            woodType === 'any' ? 
                TREE_BLOCKS.some(treeName => item.name.includes(treeName)) :
                item.name.includes(`${woodType}_log`)
        );

        if (woodItems.length === 0) {
            this.bot.chat("I don't have any wood to give! Let me check my inventory:");
            await this.checkInventory();
            return;
        }

        try {
            await this.bot.pathfinder.goto(new GoalNear(
                player.entity.position.x, 
                player.entity.position.y, 
                player.entity.position.z, 
                2
            ));

            for (const wood of woodItems) {
                const giveAmount = amount === 'all' ? wood.count : Math.min(wood.count, amount);
                await this.bot.toss(wood.type, null, giveAmount);
                this.bot.chat(`Giving ${giveAmount} ${wood.name}`);
            }
            
            this.bot.chat("Here's your wood!");
        } catch (err) {
            console.error('Error giving wood:', err);
            this.bot.chat("Sorry, I couldn't give you the wood!");
        }
    }

    /**
     * Check and report inventory contents
     * @param {Object} params - Parameters for inventory check
     */
    async checkInventory(params = {}) {
        const inventory = this.bot.inventory.items();
        const itemType = params.itemType || 'all';
        
        const filteredItems = itemType === 'all' ? 
            inventory : 
            inventory.filter(item => item.name.includes(itemType));

        const itemsList = filteredItems
            .map(item => `${item.name.toUpperCase().replaceAll('_', ' ')}: ${item.count}`)
            .join(', ');

        this.bot.chat(itemsList || "My inventory is empty!");
    }
}

module.exports = Inventory;

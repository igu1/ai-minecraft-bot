const { goals } = require('mineflayer-pathfinder');
const { GoalNear } = goals;
const { TREE_BLOCKS, EVENTS } = require('../config/constants');
const { EventEmitter } = require('events');

/**
 * Inventory management for TreeBot
 * @extends EventEmitter
 */
class Inventory extends EventEmitter {
    /**
     * Initialize inventory handler
     * @param {Object} bot - Mineflayer bot instance
     */
    constructor(bot) {
        super();
        this.bot = bot;
        this.bot.on('spawn', this.setupInventoryEvents.bind(this));
    }

    setupInventoryEvents() {
        if (!this.bot.inventory) {
            console.log('Inventory not found! Is this a server issue?');
            return;
        }
        this.bot.inventory.on('updateSlot', () => {
            const status = this.getInventoryStatus();
            this.emit(EVENTS.INVENTORY_UPDATED, status);
            if (this.bot.inventory.emptySlotCount() === 0) {
                this.emit(EVENTS.INVENTORY_FULL, status);
            }
        });
    }

    /**
     * Get current inventory status
     * @returns {Object} Inventory status
     */
    getInventoryStatus() {
        const items = this.bot.inventory.items();
        return {
            emptySlots: this.bot.inventory.emptySlotCount(),
            totalSlots: this.bot.inventory.slots.length,
            items: items.map(item => ({
                name: item.name,
                count: item.count,
                slot: item.slot
            }))
        };
    }


    setSword() {
        const sword = this.bot.heldItem;
        if (sword && sword.name.includes('sword')) {
            return;
        }
        const swordInInventory = this.bot.inventory.items().find(item => item.name.includes('sword'));
        if (swordInInventory) {
            this.bot.equip(swordInInventory, 'hand');
        }else {
            this.bot.chat("I don't have a sword!, it will be nice to have one! For now I'll just use my hands! its ok");
        }
    }

    setPickaxe() {
        const pickaxe = this.bot.heldItem;
        if (pickaxe && pickaxe.name.includes('pickaxe')) {
            return;
        }
        const pickaxeInInventory = this.bot.inventory.items().find(item => item.name.includes('pickaxe'));
        if (pickaxeInInventory) {
            this.bot.equip(pickaxeInInventory, 'hand');
        }else {
            this.bot.chat("I don't have a pickaxe!, it will be nice to have one! For now I'll just use my hands!");
        }
    }

    setAxe() {
        const axe = this.bot.heldItem;
        if (axe && axe.name.includes('axe')) {
            return;
        }
        const axeInInventory = this.bot.inventory.items().find(item => {
            console.log(item);
            return item.name.includes('axe');
        });
        if (axeInInventory) {
            this.bot.equip(axeInInventory, 'hand');
        }else {
            this.bot.chat("I don't have an axe!, it will be nice to have one! For now I'll just use my hands!");
        }
    }

    setShovel() {
        const shovel = this.bot.heldItem;
        if (shovel && shovel.name.includes('shovel')) {
            return;
        }
        const shovelInInventory = this.bot.inventory.items().find(item => item.name.includes('shovel'));
        if (shovelInInventory) {
            this.bot.equip(shovelInInventory, 'hand');
        }else {
            this.bot.chat("I don't have a shovel!, it will be nice to have one!, For now I'll just use my hands!");
        }
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
            if (woodType === 'any') {
                this.bot.chat("I don't have any wood!");
            } else {
                this.bot.chat(`I don't have any ${woodType} wood!`);
            }
            return;
        }

        try {
            await this.bot.pathfinder.goto(new GoalNear(
                player.entity.position.x, 
                player.entity.position.y, 
                player.entity.position.z, 
                2
            ));

            let totalGiven = 0;
            for (const wood of woodItems) {
                const giveAmount = amount === 'all' ? wood.count : Math.min(wood.count, amount);
                await this.bot.toss(wood.type, null, giveAmount);
                totalGiven += giveAmount;
                this.bot.chat(`Giving ${giveAmount} ${wood.name}`);
            }
            
            // Emit wood given event
            this.emit(EVENTS.WOOD_GIVEN, {
                recipient: username,
                woodType,
                amount: totalGiven
            });
            
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
        this.emit(EVENTS.INVENTORY_UPDATED, this.getInventoryStatus());
    }
}

module.exports = Inventory;

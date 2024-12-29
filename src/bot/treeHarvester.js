const { goals } = require('mineflayer-pathfinder');
const { GoalNear } = goals;
const { EventEmitter } = require('events');
const { TREE_BLOCKS, DEFAULT_SETTINGS, EVENTS } = require('../config/constants');
const { getTool } = require('../utils/tools');

/**
 * Tree harvesting functionality for TreeBot
 * @extends EventEmitter
 */
class TreeHarvester extends EventEmitter {
    /**
     * Initialize tree harvester
     * @param {Object} bot - Mineflayer bot instance
     */
    constructor(bot) {
        super();
        this.bot = bot;
        this.isHarvesting = false;
        this.tool = null;
    }

    /**
     * Start harvesting trees
     * @param {Object} params - Harvesting parameters
     * @param {Object} inventory - Inventory object
     * @returns {Promise<void>}
     */
    async startHarvest(params = {}, inventory) {
        if (this.isHarvesting) {
            this.bot.chat("I'm already harvesting trees!");
            return;
        }

        this.isHarvesting = true;
        this.emit(EVENTS.HARVEST_START, params);
        this.bot.chat("Starting tree harvest...");
        
        try {
            let harvestedCount = 0;
            const maxCount = params.maxCount || DEFAULT_SETTINGS.MAX_TREES;
            const treeType = params.treeType || 'any';

            while (harvestedCount < maxCount && this.isHarvesting) {
                const tree = this.findNearestTree(treeType);
                if (!tree) {
                    this.bot.chat(`No more ${treeType} trees found nearby.`);
                    break;
                }
                this.emit(EVENTS.TREE_FOUND, {
                    position: tree.position,
                    type: tree.name
                });
                
                getTool(inventory, params.tool || 'axe');
                const success = await this.harvestTree(tree);
                if (success) {
                    harvestedCount++;
                    this.bot.chat(`Harvested ${treeType} tree ${harvestedCount}/${maxCount}`);
                }
            }
            
            this.isHarvesting = false;
            this.emit(EVENTS.HARVEST_COMPLETE, { 
                harvestedCount,
                treeType,
                success: true
            });
            this.bot.chat("Tree harvesting complete!");
            
        } catch (error) {
            console.error('Error during tree harvesting:', error);
            this.bot.chat("Something went wrong while harvesting trees.");
            this.isHarvesting = false;
            this.emit(EVENTS.HARVEST_COMPLETE, { 
                error: error.message,
                success: false
            });
        }
    }

    /**
     * Find the nearest tree of specified type
     * @param {string} treeType - Type of tree to find
     * @returns {Object|null} - Found tree block or null
     */
    findNearestTree(treeType = 'any') {
        const maxDistance = DEFAULT_SETTINGS.SEARCH_RADIUS;
        const verticalSearch = DEFAULT_SETTINGS.VERTICAL_SEARCH;
        let closestTree = null;
        let closestDistance = maxDistance;

        for (let x = -maxDistance; x <= maxDistance; x++) {
            for (let y = -verticalSearch; y <= verticalSearch; y++) {
                for (let z = -maxDistance; z <= maxDistance; z++) {
                    const pos = this.bot.entity.position.offset(x, y, z);
                    const block = this.bot.blockAt(pos);
                    
                    if (block && this.isTreeLog(block, treeType)) {
                        const distance = this.bot.entity.position.distanceTo(pos);
                        if (distance < closestDistance) {
                            closestTree = block;
                            closestDistance = distance;
                        }
                    }
                }
            }
        }
        return closestTree;
    }

    /**
     * Check if a block is a tree log of specified type
     * @param {Object} block - Block to check
     * @param {string} treeType - Type of tree to check for
     * @returns {boolean}
     */
    isTreeLog(block, treeType = 'any') {
        if (treeType === 'any') {
            return TREE_BLOCKS.some(treeName => block.name.includes(treeName));
        }
        return block.name.includes(`${treeType}_log`);
    }

    /**
     * Harvest a specific tree
     * @param {Object} treeBlock - Tree block to harvest
     * @returns {Promise<boolean>}
     */
    async harvestTree(treeBlock) {
        try {
            // Set a timeout for pathfinding (10 seconds)
            const pathfindingTimeout = setTimeout(() => {
                this.bot.pathfinder.stop();
                throw new Error('Pathfinding timeout: Could not reach tree');
            }, 10000);

            try {
                await this.bot.pathfinder.goto(new GoalNear(
                    treeBlock.position.x, 
                    treeBlock.position.y, 
                    treeBlock.position.z, 
                    2
                ));
            } finally {
                clearTimeout(pathfindingTimeout);
            }
            
            // Check if we actually reached close enough to the tree
            const distanceToTree = this.bot.entity.position.distanceTo(treeBlock.position);
            if (distanceToTree > 4) { // If we're too far, something went wrong
                throw new Error(`Could not get close enough to tree. Distance: ${distanceToTree}`);
            }

            let currentBlock = treeBlock;
            while (currentBlock && this.isTreeLog(currentBlock)) {
                if (!this.isHarvesting) break; // Check if harvesting was stopped
                
                try {
                    await this.bot.dig(currentBlock);
                    await new Promise(resolve => setTimeout(resolve, 500));
                
                    const droppedLogs = Object.values(this.bot.entities).filter(entity => 
                        entity.type === 'object' && 
                        TREE_BLOCKS.some(treeName => entity.name.includes(treeName)) &&
                        entity.position.distanceTo(this.bot.entity.position) < 5
                    );

                    for (const log of droppedLogs) {
                        if (!this.isHarvesting) break;
                        
                        const collectTimeout = setTimeout(() => {
                            this.bot.pathfinder.stop();
                            this.bot.chat("I couldn't reach the log.");
                            throw new Error('Pathfinding timeout: Could not reach log');
                        }, 5000);

                        try {
                            await this.bot.pathfinder.goto(new GoalNear(
                                log.position.x, 
                                log.position.y, 
                                log.position.z, 
                                1
                            ));
                            await new Promise(resolve => setTimeout(resolve, 500));
                        } catch (err) {
                            console.error('Error collecting log:', err);
                        } finally {
                            clearTimeout(collectTimeout);
                        }
                    }
                    currentBlock = this.bot.blockAt(currentBlock.position.offset(0, 1, 0));
                } catch (err) {
                    console.error('Error breaking tree block:', err);
                    break; // Break the loop if we can't break a block
                }
            }
            
            return true;
        } catch (err) {
            console.error('Error harvesting tree:', err);
            this.bot.chat(`Failed to harvest tree: ${err.message}`);
            return false;
        }
    }

    /**
     * Stop harvesting
     */
    stop() {
        if (this.t) {
            this.isHarvesting = false;
            this.bot.chat("Stopping tree harvest.");
        }
    }
}

module.exports = TreeHarvester;

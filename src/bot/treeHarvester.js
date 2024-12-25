const { goals } = require('mineflayer-pathfinder');
const { GoalNear } = goals;
const { TREE_BLOCKS, DEFAULT_SETTINGS } = require('../config/constants');

/**
 * Tree harvesting functionality for TreeBot
 */
class TreeHarvester {
    /**
     * Initialize tree harvester
     * @param {Object} bot - Mineflayer bot instance
     */
    constructor(bot) {
        this.bot = bot;
        this.isHarvesting = false;
    }

    /**
     * Start harvesting trees
     * @param {Object} params - Harvesting parameters
     * @returns {Promise<void>}
     */
    async startHarvest(params = {}) {
        if (this.isHarvesting) {
            this.bot.chat("I'm already harvesting trees!");
            return;
        }

        this.isHarvesting = true;
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

                const success = await this.harvestTree(tree);
                if (success) {
                    harvestedCount++;
                    this.bot.chat(`Harvested ${treeType} tree ${harvestedCount}/${maxCount}`);
                }
            }
            
            this.isHarvesting = false;
            this.bot.chat("Finished harvesting trees!");
        } catch (err) {
            console.error('Error during tree harvest:', err);
            this.bot.chat("Error during tree harvest!");
            this.isHarvesting = false;
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
            await this.bot.pathfinder.goto(new GoalNear(
                treeBlock.position.x, 
                treeBlock.position.y, 
                treeBlock.position.z, 
                2
            ));
            
            let currentBlock = treeBlock;
            while (currentBlock && this.isTreeLog(currentBlock)) {
                await this.bot.dig(currentBlock);
                await new Promise(resolve => setTimeout(resolve, 500));
            
                // Collect dropped items
                const droppedLogs = Object.values(this.bot.entities).filter(entity => 
                    entity.type === 'object' && 
                    TREE_BLOCKS.some(treeName => entity.name.includes(treeName)) &&
                    entity.position.distanceTo(this.bot.entity.position) < 5
                );

                for (const log of droppedLogs) {
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
                    }
                }
                currentBlock = this.bot.blockAt(currentBlock.position.offset(0, 1, 0));
            }
            
            return true;
        } catch (err) {
            console.error('Error harvesting tree:', err);
            return false;
        }
    }

    /**
     * Stop harvesting
     */
    stop() {
        this.isHarvesting = false;
    }
}

module.exports = TreeHarvester;

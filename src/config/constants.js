/**
 * Constants used throughout the application
 */
module.exports = {
    TREE_BLOCKS: [
        'oak_log',
        'birch_log',
        'spruce_log',
        'jungle_log',
        'acacia_log',
        'dark_oak_log'
    ],

    // Default bot settings
    DEFAULT_SETTINGS: {
        HOST: '127.0.0.1',
        PORT: 25565,
        USERNAME: 'AI',
        VERSION: '1.20.4',
        MODEL: 'llama-3.1-8b-instant',
        FOLLOW_DISTANCE: 2,
        MAX_TREES: 5,
        SEARCH_RADIUS: 32,
        VERTICAL_SEARCH: 4
    },

    // Command types
    COMMANDS: {
        FIND_TREES: 'find trees',
        GIVE_WOOD: 'give wood',
        FOLLOW_ME: 'follow me',
        STOP: 'stop',
        CHECK_INVENTORY: 'check inventory',
        ENGAGE: 'engage'
    },

    // Tools
    TOOLS: {
        SWORD: 'sword',
        PICKAXE: 'pickaxe',
        AXE: 'axe',
        SHOVEL: 'shovel',
        BOW: 'bow'
    },

    // Animal types
    FOOD_ANIMALS: [
        'cow',
        'chicken',
        'pig',
        'sheep',
        'rabbit',
        'horse',
        'donkey',
        'mule',
        'llama',
        'parrot',
        'tropical_fish',
        'cod',
        'salmon',
        'squid',
        'pufferfish'
    ],

    // Mobs
    HOSTILE_MOBS: [
        'cave_spider',
        'elder_guardian',
        'enderman',
        'giant',
        'guardian',
        'husk',
        'magma_cube',
        'silverfish',
        'skeleton',
        'slime',
        'spider',
        'zombie',
        'zombie_pigman',
        'zombie_villager'
    ],

    // MOBS TO RUN AWAY FROM
    DANGER_MOBS: [
        'endermite',
        'ghoul',
        'creeper',
        'ghast',
        'witch',
        'ender_dragon',
        'blaze',
        'skeleton_horse',
        'wither_skeleton',
        'wither',
        'zombie_horse',
        'zombie_villager'
    ],

    // Event types
    EVENTS: {
        // Inventory events
        INVENTORY_FULL: 'inventoryFull',
        INVENTORY_UPDATED: 'inventoryUpdated',
        
        // Harvesting events
        HARVEST_START: 'harvestStart',
        HARVEST_COMPLETE: 'harvestComplete',
        TREE_FOUND: 'treeFound',
        WOOD_GIVEN: 'woodGiven',
        
        // AI processing events
        AI_PROCESSING_START: 'aiProcessingStart',
        AI_PROCESSING_COMPLETE: 'aiProcessingComplete',
        AI_PROCESSING_ERROR: 'aiProcessingError',
        PROMPT_BUILT: 'promptBuilt',
        CHAT_HISTORY_UPDATED: 'chatHistoryUpdated',
        
        // Response parsing events
        PARSE_START: 'parseStart',
        PARSE_COMPLETE: 'parseComplete',
        PARSE_ERROR: 'parseError',
        COMMAND_PARSE_START: 'commandParseStart',
        COMMAND_PARSE_COMPLETE: 'commandParseComplete',
        COMMAND_PARSE_ERROR: 'commandParseError',
        
        // Bot events
        BOT_CONNECTED: 'botConnected',
        BOT_DISCONNECTED: 'botDisconnected',
        BOT_ERROR: 'botError',
        COMMAND_RECEIVED: 'commandReceived',
        COMMAND_EXECUTED: 'commandExecuted'
    }
};

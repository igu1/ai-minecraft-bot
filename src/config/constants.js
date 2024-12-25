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
        PORT: 51626,
        USERNAME: 'TreeBot',
        VERSION: '1.20.4',
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
        CHECK_INVENTORY: 'check inventory'
    }
};

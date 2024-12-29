const { Inventory } = require('../bot/inventory');

module.exports = {
    getTool(inv, toolName) {
        switch (toolName) {
            case 'pickaxe':
                return inv.setPickaxe();
            case 'shovel':
                return inv.setShovel();
            case 'axe':
                return inv.setAxe();
            case 'sword':
                return inv.setSword();
            default:
                return null;
        }
    }
}
const { goals } = require('mineflayer-pathfinder');
const { GoalNear } = goals;

/**
 * Movement related functions for the TreeBot
 */
class Movement {
    /**
     * Initialize movement handler
     * @param {Object} bot - Mineflayer bot instance
     */
    constructor(bot) {
        this.bot = bot;
        this.followingPlayer = null;
        this.followDistance = 2;
    }

    /**
     * Start following a player
     * @param {string} username - Username of player to follow
     * @param {Object} params - Following parameters
     * @returns {Promise<void>}
     */
    async followPlayer(username, params = {}) {
        const player = this.bot.players[username];
        if (!player || !player.entity) {
            this.bot.chat("I can't find you!");
            return;
        }

        // Update following state
        this.followingPlayer = username;
        this.followDistance = params.distance ? Number(params.distance) : 2;
        
        this.bot.chat(`Following ${username} at distance ${this.followDistance} blocks`);
        
        // Initial movement to player
        try {
            const playerPos = player.entity.position;
            await this.bot.pathfinder.goto(new GoalNear(
                playerPos.x, 
                playerPos.y, 
                playerPos.z, 
                this.followDistance
            ));
        } catch (err) {
            if (err.message !== 'GoalChanged') {
                console.error('Error following player:', err);
                this.bot.chat("I'm having trouble following you!");
            }
        }
    }

    /**
     * Update following behavior on physics tick
     */
    updateFollowing() {
        if (this.followingPlayer) {
            const player = this.bot.players[this.followingPlayer];
            if (player && player.entity) {
                const playerPos = player.entity.position;
                const botPos = this.bot.entity.position;
                const distance = botPos.distanceTo(playerPos);
                
                if (distance > this.followDistance + 1 && !this.bot.pathfinder.isMoving()) {
                    try {
                        this.bot.pathfinder.setGoal(new GoalNear(
                            playerPos.x, 
                            playerPos.y, 
                            playerPos.z, 
                            this.followDistance
                        ));
                    } catch (err) {
                        if (err.message !== 'GoalChanged') {
                            console.error('Error updating follow position:', err);
                        }
                    }
                }
            } else {
                this.followingPlayer = null;
                this.bot.chat("I lost track of you!");
            }
        }
    }

    /**
     * Stop current movement
     */
    stop() {
        this.followingPlayer = null;
        try {
            this.bot.pathfinder.stop();
            this.bot.pathfinder.setGoal(null);
        } catch (err) {
            console.error('Error stopping movement:', err);
        }
    }
}

module.exports = Movement;

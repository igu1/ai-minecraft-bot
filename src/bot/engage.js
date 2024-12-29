const { EventEmitter } = require('events');
const { goals } = require('mineflayer-pathfinder');
const { GoalNear } = goals;
const { EVENTS, HOSTILE_MOBS, FOOD_ANIMALS, DANGER_MOBS } = require('../config/constants');
const { getTool } = require('../utils/tools');

/**
 * Handles combat and entity targeting
 * @extends EventEmitter
 */
class Engage extends EventEmitter {
    /**
     * Initialize combat handler
     * @param {Object} bot - Mineflayer bot instance
     */
    constructor(bot) {
        super();
        this.bot = bot;
        this.isEngaging = false;
        this.currentTarget = null;
        this.targetParams = [];
        this.attackCooldown = null;
        this.inventory = null;
        this.killCount = 0;
        this.targetCount = 1;

        // Listen for entity death events
        this.bot.on('entityDead', (entity) => {
            if (this.isEngaging && entity === this.currentTarget) {
                this.killCount++;
                if (this.killCount >= this.targetCount) {
                    this.bot.chat("Killed all targets!");
                    this.stopEngaging();
                }
            }
        });
    }

    /**
     * Start engaging with targets
     * @param {Object} params - Engagement parameters
     */
    async startEngaging(params = {}, inventory) {
        try {
            if (this.isEngaging) {
                this.bot.chat("I'm already in combat!");
                return;
            }
            this.inventory = inventory
            this.targetParams = params.target || {};
            this.targetCount = this.targetParams.count || 1;
            this.killCount = 0;
            this.isEngaging = true;
            this.emit(EVENTS.ENGAGE_START, { params });
        } catch (error) {
            console.error('Error starting engagement:', error);
            this.emit(EVENTS.ENGAGE_ERROR, { error: error.message });
            this.stopEngaging();
        }
    }

    /**
     * Update engaging state and handle combat
     */
    async updateEngaging() {
        if (!this.isEngaging) return;
        try {
            const nearbyEntities = this.getNearbyEntities();

            if (nearbyEntities.length) {
                this.currentTarget = nearbyEntities[0];

                if (!this.attackCooldown || this.attackCooldown < Date.now()) {
                    if (this.inventory) {
                        getTool(this.inventory, this.tool || 'sword');
                    }
                    this.bot.pathfinder.setGoal(new GoalNear(
                        this.currentTarget.position.x,
                        this.currentTarget.position.y,
                        this.currentTarget.position.z,
                        1
                    ));
                    this.bot.attack(this.currentTarget);
                    this.attackCooldown = Date.now() + 1000;
                }
            } else {
                if (this.killCount < this.targetCount) {
                    
                } else {
                    this.bot.chat("I can't find any valid targets nearby!");
                    this.stopEngaging();
                }
                return;
            }

        } catch (error) {
            console.error('Error in combat loop:', error);
            this.emit(EVENTS.ENGAGE_ERROR, { error: error.message });
            this.stopEngaging();
        }
        setTimeout(() => this.updateEngaging(), 250);
    }

    getNearbyEntities() {
        const entities = this.bot.entities;
        const targets = this.targetParams?.entityNames || 'any';
        const nearbyEntities = Object.values(entities).filter(entity => {
            if (!this._isTargetInRange(entity)) return false;
            if (!this._isValidTarget(entity)) return false;
            if (targets === 'any') return true;
            if (targets.includes(entity.name)) return true;
            if (targets.includes(entity.displayName)) return true;
            if (targets.includes(entity.displayName?.toLowerCase())) return true;
            return false;
        });

        return nearbyEntities.sort((a, b) => {
            const aDistance = a.position.distanceTo(this.bot.entity.position);
            const bDistance = b.position.distanceTo(this.bot.entity.position);
            return aDistance - bDistance;
        });
    }
    

    /**
     * Check if target is valid
     * @param {Object} entity - Target entity
     * @returns {boolean} Is target valid
     *
     * A target is valid if:
     * 1. It is alive
     * 2. It is not the bot itself
     * 3. It has a position
     * 4. It is not a danger mob
     * 5. It is either a hostile mob or a food animal
     */
    _isValidTarget(entity) {
        const isValid = entity && 
            entity.displayName && 
            entity.position && 
            entity.username !== this.bot.username;
        if (!isValid) return false;
        const isHostile = HOSTILE_MOBS.includes(entity.displayName?.toLowerCase());
        const isFoodAnimal = FOOD_ANIMALS.includes(entity.displayName?.toLowerCase());
        const isDangerMob = DANGER_MOBS.includes(entity.displayName?.toLowerCase());    
        return isValid && (isHostile || isFoodAnimal) && !isDangerMob;
    }

    /**
     * Check if target is in range
     * @param {Object} entity - Target entity
     * @returns {boolean} Is target in range
     */
    _isTargetInRange(entity) {
        const distance = entity.position.distanceTo(this.bot.entity.position);
        return distance <= 50;
    }

    /**
     * Stop engaging
     */
    stopEngaging() {
        this.isEngaging = false;
        this.currentTarget = null;
        this.targetParams = [];
        this.attackCooldown = 0;
        this.emit(EVENTS.ENGAGE_STOP, { 
            killCount: this.killCount,
            targetCount: this.targetCount
        });
        
        // Reset counters
        this.killCount = 0;
        this.targetCount = 1;
    }
}

module.exports = Engage;

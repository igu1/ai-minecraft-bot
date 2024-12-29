const { EventEmitter } = require('events');
const { EVENTS } = require('../config/constants');

/**
 * Parse and process AI responses
 */
class ResponseParser extends EventEmitter {
    constructor() {
        super();
    }

    /**
     * Parse a function call from AI response
     * @param {string} response - AI response text
     * @returns {Object|null} Parsed function call or null
     */
    static parseFunctionCall(response) {
        const functionCallRegex = /(\w+)\((.*?)\)/;
        const match = response.match(functionCallRegex);
        if (match) {
            const [_, name, paramsStr] = match;
            let parameters = {};

            try {
                parameters = paramsStr ? JSON.parse(paramsStr) : {};

                if (parameters.distance) {
                    parameters.distance = Number(parameters.distance);
                }
                if (parameters.maxCount) {
                    parameters.maxCount = Number(parameters.maxCount);
                }
                if (parameters.target) {
                    parameters.target = parameters.target == 'null' ? null : parameters.target;
                }

            } catch (e) {
                console.warn('Could not parse parameters:', paramsStr);
            }

            return {
                name,
                parameters
            };
        }
        return null;
    }

    /**
     * Extract response parameters from function call
     * @param {Object} functionCall - Parsed function call
     * @returns {Object} Extracted parameters
     */
    static extractResponseParams(functionCall) {
        const params = functionCall.parameters || {};
        return {
            treeType: params.treeType || 'any',
            woodType: params.woodType || 'any',
            playerName: params.playerName || 'player',
            target: params.target || {
                entityType: params.entityType || 'any',
                entityNames: params.entityNames || [],
                count: params.count ? Number(params.count) : 1,
            },
            tool: params.tool || 'sword',
            distance: params.distance ? Number(params.distance) : 2,
            items: params.items || 'nothing'
        };
    }

    /**
     * Get appropriate response type for a function
     * @param {string} functionName - Name of the function
     * @returns {string} Response type
     */
    static getResponseType(functionName) {
        const responseTypes = {
            findTrees: 'startingHarvest',
            giveWood: 'givingWood',
            followPlayer: 'following',
            stopAction: 'stopping',
            checkInventory: 'inventory',
            engage: 'engaging'
        };
        return responseTypes[functionName] || 'greetings';
    }
}

module.exports = ResponseParser;

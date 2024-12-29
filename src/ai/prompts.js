/**
 * AI prompt templates and utilities
 */
class Prompts {
    /**
     * Create a function call prompt
     * @param {Object} config - Bot configuration
     * @param {Array} functionDefs - Function definitions
     * @param {string} message - User message
     * @param {Object} context - Message context
     * @returns {string}
     */
    static createFunctionCallPrompt(config, functionDefs, message, context = {}) {
        if (!config) return '';
        return `You are ${config?.name || ''}, ${config?.description || ''}.
                Available functions:
                ${JSON.stringify(functionDefs, null, 2)}

                Example function calls:
                ${Object.entries(config?.capabilities || {}).map(([name, cap]) =>
                    `${name}(${JSON.stringify(cap.parameters.properties || {})}) - Example: "${cap.examples?.[0] || ''}"`
                ).join('\n')}

                Current context:
                - Player speaking: ${context?.playerName || 'unknown'}
                - Bot name: ${context?.bot?.name || ''}
                - Bot position: ${Math.round(context?.bot?.position?.x || 0)}, ${Math.round(context?.bot?.position?.y || 0)}, ${Math.round(context?.bot?.position?.z || 0)}
                - Bot health: ${Math.round(context?.bot?.health || 0)}


                User message: "${message}"

                If the user's request matches one of the available functions, respond with a natural message that includes the function call in this format: functionName({"param": "value"})
                Otherwise, respond naturally without any function calls.

                Remember:
                0. IMPORTANT: USE YOU CONTEXT TO RESPOND
                1. Include the complete function call with parameters if applicable
                2. Keep responses short and friendly
                3. Stay in character as a helpful Minecraft bot
                4. Use the most specific function for the user's request`;
    }

    /**
     * Get a random response from the response templates
     * @param {Object} responses - Response templates
     * @param {string} type - Response type
     * @param {Object} params - Parameters to fill in template
     * @returns {string}
     */
    static getRandomResponse(responses, type, params = {}) {
        const templates = responses?.[type];
        if (!templates) return '';
        let response = templates[Math.floor(Math.random() * templates.length)];
        Object.entries(params).forEach(([key, value]) => {
            response = response.replace(`{${key}}`, value);
        });
        return response;
    }
}

module.exports = Prompts;

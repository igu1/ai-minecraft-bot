const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const Prompts = require('./prompts');
const ResponseParser = require('./responseParser');

/**
 * AI handler for TreeBot using Google's Generative AI
 */
class BotAI {
    /**
     * Initialize the AI handler
     * @param {string} apiKey - Google Generative AI API key
     */
    constructor(apiKey) {
        this.genAI = new GoogleGenerativeAI(apiKey || process.env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
        this.config = JSON.parse(fs.readFileSync(path.join(__dirname, '../config/bot-config.json'), 'utf8'));
        this.functionDefs = this.createFunctionDefinitions();
    }

    /**
     * Create function definitions from config
     * @returns {Array} Function definitions
     */
    createFunctionDefinitions() {
        return Object.values(this.config.capabilities).map(cap => ({
            name: cap.name,
            description: cap.description,
            parameters: cap.parameters
        }));
    }

    /**
     * Process a user message
     * @param {string} message - User message
     * @param {Object} context - Message context
     * @returns {Promise<Object>} Response object
     */
    async processMessage(message, context = {}) {
        console.log('Processing message:', message);
        try {
            const prompt = Prompts.createFunctionCallPrompt(
                this.config,
                this.functionDefs,
                message,
                context
            );

            const result = await this.model.generateContent(prompt);
            const response = result.response.text().trim();
            console.log('AI Response:', response);

            try {
                const functionCall = ResponseParser.parseFunctionCall(response);
                console.log('Parsed function call:', functionCall);

                if (functionCall) {
                    const capability = this.config.capabilities[functionCall.name];
                    if (capability) {
                        console.log('Capability found:', capability);
                        const responseType = ResponseParser.getResponseType(functionCall.name);
                        console.log('Response type:', responseType);
                        
                        const responseParams = {
                            ...ResponseParser.extractResponseParams(functionCall),
                            playerName: context.playerName
                        };
                        console.log('Response params:', responseParams);
                        
                        return {
                            type: 'command',
                            command: capability.command,
                            parameters: {
                                ...functionCall.parameters,
                                playerName: context.playerName
                            },
                            response: Prompts.getRandomResponse(
                                this.config.responses,
                                responseType,
                                responseParams
                            )
                        };
                    }
                }
            } catch (e) {
                console.error('Error parsing function call:', e);
                return {
                    type: 'error',
                    response: Prompts.getRandomResponse(this.config.responses, 'error')
                };
            }

            return {
                type: 'conversation',
                response: response
            };
        } catch (error) {
            console.error('Error processing message with Gemini AI:', error);
            return {
                type: 'error',
                response: Prompts.getRandomResponse(this.config.responses, 'error')
            };
        }
    }
}

module.exports = BotAI;

const { Groq } = require('groq-sdk');
const fs = require('fs');
const path = require('path');
const Prompts = require('./prompts');
const ResponseParser = require('./responseParser');
const { EventEmitter } = require('events');

/**
 * AI handler for TreeBot using Groq's AI
 */
class BotAI extends EventEmitter {
    /**
     * Initialize the AI handler
     * @param {string} apiKey - Groq API key
     */
    constructor(apiKey) {
        super();
        this.client = new Groq({
            apiKey: apiKey || process.env.GROQ_API_KEY
        });
        this.model = "llama-3.3-70b-versatile";
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
        try {
            this.emit('aiProcessingStart', { message, context });
            console.log(context)
            const prompt = Prompts.createFunctionCallPrompt(
                this.config,
                this.functionDefs,
                message,
                context
            );
            const chatCompletion = await this.client.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: this.model,
            });
            const response = chatCompletion.choices[0].message.content.trim();
            try {
                const functionCall = ResponseParser.parseFunctionCall(response);
                if (functionCall) {
                    const capability = this.config.capabilities[functionCall.name];
                    if (capability) {
                        const responseType = ResponseParser.getResponseType(functionCall.name);
                        const responseParams = {
                            ...ResponseParser.extractResponseParams(functionCall),
                            playerName: context.playerName
                        };              
                        this.emit('aiProcessingComplete', { 
                            message, 
                            response: {
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
                            },
                            success: true 
                        });
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
                this.emit('aiProcessingError', { 
                    message, 
                    error: e.message 
                });
                return {
                    type: 'error',
                    response: Prompts.getRandomResponse(this.config.responses, 'error')
                };
            }

            this.emit('aiProcessingComplete', { 
                message, 
                response: {
                    type: 'conversation',
                    response: response
                },
                success: true 
            });
            return {
                type: 'conversation',
                response: response
            };
        } catch (error) {
            console.error('Error processing message with Groq AI:', error);
            this.emit('aiProcessingError', { 
                message, 
                error: error.message 
            });
            return {
                type: 'error',
                response: Prompts.getRandomResponse(this.config.responses, 'error')
            };
        }
    }
}

module.exports = BotAI;

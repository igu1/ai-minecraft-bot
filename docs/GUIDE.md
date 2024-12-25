# TreeBot: Complete Guide

## Table of Contents
1. [Introduction](#introduction)
2. [How It Works](#how-it-works)
3. [Components Explained](#components-explained)
4. [Examples](#examples)
5. [Troubleshooting](#troubleshooting)

## Introduction

TreeBot is a Minecraft bot that can understand natural language commands to perform tasks like finding and cutting trees, following players, and managing inventory. It uses Google's Generative AI (Gemini) to understand player commands.

## How It Works

When a player types a message in Minecraft chat:

1. Message Flow:
```
Player types: "TreeBot find some oak trees"
↓
Bot checks if message mentions "TreeBot"
↓
Sends message to Google AI to understand the command
↓
AI returns a function call: findTrees({"treeType": "oak"})
↓
Bot executes the command and responds
```

2. Basic Usage Example:
```
Player: "TreeBot follow me"
Bot: "I'll follow you, PlayerName!"
[Bot starts following the player]

Player: "TreeBot stop"
Bot: "Stopping current task."
[Bot stops following]
```

## Components Explained

### 1. TreeBot.js (Main Bot)

This is the main controller. Think of it as the bot's brain that coordinates everything.

```javascript
// Example: How the bot processes a chat message
async handleChat(username, message) {
    // Ignore if message is from bot itself
    if (username === this.bot.username) return;
    
    // Only respond if bot is mentioned
    if (!message.includes("TreeBot")) return;
    
    // Process message with AI
    const response = await this.ai.processMessage(message);
    
    // Execute command if AI understood it
    if (response.command === "find trees") {
        this.startHarvesting();
    }
}
```

### 2. BotAI.js (Natural Language Understanding)

This component helps the bot understand player messages using Google's AI.

```javascript
// Example: How AI processes a message
async processMessage(message) {
    // 1. Create a prompt for the AI
    const prompt = `You are TreeBot. Understand this message: "${message}"`;
    
    // 2. Send to Google AI
    const result = await this.model.generateContent(prompt);
    
    // 3. Parse the response
    // If player said "find 3 oak trees", AI might return:
    // findTrees({"treeType": "oak", "maxCount": 3})
    
    return {
        command: "find trees",
        parameters: { treeType: "oak", maxCount: 3 }
    };
}
```

### 3. TreeHarvester.js (Tree Management)

Handles everything related to finding and cutting trees.

```javascript
// Example: How the bot finds trees
findNearestTree(treeType = "oak") {
    // Look in a 32-block radius
    for (let x = -32; x <= 32; x++) {
        for (let z = -32; z <= 32; z++) {
            // Check if block is a tree
            const block = this.bot.blockAt(pos);
            if (block.name === treeType + "_log") {
                return block;
            }
        }
    }
}
```

## Examples

### 1. Finding Trees
```
Player: "TreeBot can you find some oak trees?"
What happens:
1. AI understands you want oak trees
2. Bot starts scanning nearby blocks
3. When it finds an oak tree:
   - Walks to the tree
   - Cuts it down
   - Collects dropped wood
4. Repeats until done
```

### 2. Following Players
```
Player: "TreeBot follow me at distance 3"
What happens:
1. AI understands follow command with distance
2. Bot starts following:
   - Checks player position every tick
   - Moves if distance > 3 blocks
   - Stops if player is lost
```

### 3. Giving Wood
```
Player: "TreeBot give me 5 oak logs"
What happens:
1. AI parses wood type and amount
2. Bot checks inventory
3. If it has oak logs:
   - Walks to player
   - Drops specified amount
4. If not, tells player it doesn't have wood
```

## Configuration Files

### 1. bot-config.json
This file defines what the bot can understand and do:

```json
{
    "capabilities": {
        "findTrees": {
            "command": "find trees",
            "parameters": {
                "treeType": ["oak", "birch", "spruce"],
                "maxCount": "number"
            }
        }
    }
}
```

### 2. constants.js
Defines important values used throughout the code:

```javascript
const TREE_BLOCKS = ['oak_log', 'birch_log'];
const DEFAULT_SETTINGS = {
    FOLLOW_DISTANCE: 2,
    MAX_TREES: 5
};
```

## Common Commands

1. **Finding Trees**:
   - "TreeBot find trees"
   - "TreeBot cut down 3 oak trees"
   - "TreeBot harvest some birch trees"

2. **Following**:
   - "TreeBot follow me"
   - "TreeBot follow me at distance 4"
   - "TreeBot stop following"

3. **Inventory**:
   - "TreeBot what's in your inventory?"
   - "TreeBot give me wood"
   - "TreeBot give me 5 oak logs"

## Troubleshooting

1. **Bot Not Responding**
   - Make sure you mentioned "TreeBot" in your message
   - Check if bot is connected to server
   - Verify your API key is correct

2. **Bot Can't Find Trees**
   - Make sure you're in a forest biome
   - Check if trees are within 32 blocks
   - Try specifying tree type: "find oak trees"

3. **Following Issues**
   - Don't move too fast
   - Stay within sight of bot
   - Use "stop" command if bot gets stuck

## Setting Up

1. Install Node.js
2. Clone the repository
3. Create `.env` file:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```
4. Install dependencies:
   ```bash
   npm install
   ```
5. Start the bot:
   ```bash
   npm start
   ```

## How to Get Help

1. Check this guide
2. Ask the bot: "TreeBot what can you do?"
3. Try simple commands first
4. Use specific commands if bot is confused

Remember: The bot works best with clear, simple commands. Always mention "TreeBot" so it knows you're talking to it!

# TreeBot Code Documentation

## File Structure Explained

```
src/
├── bot/           # Bot behavior
│   ├── TreeBot.js       # Main bot class
│   ├── movement.js      # Movement logic
│   ├── inventory.js     # Item management
│   └── treeHarvester.js # Tree handling
├── ai/            # AI processing
│   ├── BotAI.js         # AI integration
│   ├── prompts.js       # AI prompts
│   └── responseParser.js # Response handling
└── config/        # Configuration
    ├── bot-config.json  # Bot settings
    └── constants.js     # Shared constants
```

## Main Components Explained

### 1. TreeBot Class (TreeBot.js)

This is the main bot class that coordinates everything:

```javascript
class TreeBot {
    constructor() {
        // Initialize components
        this.ai = new BotAI();           // Handles AI
        this.movement = new Movement();   // Handles movement
        this.inventory = new Inventory(); // Handles items
        this.harvester = new TreeHarvester(); // Handles trees
    }

    // When a player sends a message
    async handleChat(username, message) {
        // 1. Check if bot was mentioned
        if (!message.includes(this.username)) return;

        // 2. Process with AI
        const response = await this.ai.processMessage(message);

        // 3. Execute command
        if (response.type === 'command') {
            switch (response.command) {
                case 'find trees':
                    await this.harvester.startHarvest();
                    break;
                // ... other commands
            }
        }
    }
}
```

### 2. Movement System (movement.js)

Handles how the bot moves around:

```javascript
class Movement {
    // Follow a player
    async followPlayer(username, distance = 2) {
        const player = this.bot.players[username];
        
        // Update every game tick
        this.bot.on('physicsTick', () => {
            // Calculate distance to player
            const playerPos = player.entity.position;
            const botPos = this.bot.entity.position;
            
            // Move if too far
            if (botPos.distanceTo(playerPos) > distance) {
                this.bot.pathfinder.goto(playerPos);
            }
        });
    }
}
```

### 3. Tree Harvester (treeHarvester.js)

Handles finding and cutting trees:

```javascript
class TreeHarvester {
    // Start harvesting trees
    async startHarvest(type = 'oak', count = 5) {
        for (let i = 0; i < count; i++) {
            // 1. Find nearest tree
            const tree = this.findNearestTree(type);
            if (!tree) break;

            // 2. Go to tree
            await this.bot.pathfinder.goto(tree.position);

            // 3. Cut tree
            await this.bot.dig(tree);

            // 4. Collect drops
            await this.collectDroppedItems();
        }
    }
}
```

### 4. AI System (BotAI.js)

Processes player messages:

```javascript
class BotAI {
    async processMessage(message) {
        // 1. Create AI prompt
        const prompt = `
            You are TreeBot.
            User says: "${message}"
            Return a command if you understand it.
        `;

        // 2. Get AI response
        const response = await this.model.generateContent(prompt);

        // 3. Parse response
        const command = this.parseCommand(response);

        // 4. Return result
        return {
            type: 'command',
            command: command.name,
            parameters: command.params
        };
    }
}
```

## Example Workflows

### 1. Finding Trees

```javascript
// Player types: "TreeBot find 3 oak trees"

// 1. AI processes message
const response = await ai.processMessage(message);
// Returns: { command: "find trees", parameters: { type: "oak", count: 3 } }

// 2. Bot executes command
await harvester.startHarvest("oak", 3);

// 3. Harvester finds trees
const tree = findNearestTree("oak");

// 4. Bot moves to tree
await movement.goTo(tree.position);

// 5. Bot cuts tree
await bot.dig(tree);
```

### 2. Following Player

```javascript
// Player types: "TreeBot follow me"

// 1. AI understands command
const response = await ai.processMessage(message);
// Returns: { command: "follow", parameters: { player: "PlayerName" } }

// 2. Movement system takes over
await movement.followPlayer(playerName);

// 3. Updates every tick
bot.on('physicsTick', () => {
    // Check distance
    const distance = getDistanceToPlayer();
    
    // Move if needed
    if (distance > maxDistance) {
        movement.moveToward(player);
    }
});
```

## Important Functions Explained

### Finding Trees
```javascript
findNearestTree(type) {
    // Look in a 32-block radius
    for (let x = -32; x <= 32; x++) {
        for (let z = -32; z <= 32; z++) {
            // Get block at position
            const block = bot.blockAt(position);
            
            // Check if it's the right type
            if (block.name === type + "_log") {
                return block;
            }
        }
    }
}
```

### Moving to Location
```javascript
async moveTo(position) {
    // Create movement goal
    const goal = new GoalNear(position.x, position.y, position.z, 1);
    
    // Start pathfinding
    await bot.pathfinder.goto(goal);
}
```

### Giving Items
```javascript
async giveItems(player, itemType, amount) {
    // 1. Find items in inventory
    const items = bot.inventory.items().filter(
        item => item.name === itemType
    );
    
    // 2. Move to player
    await moveTo(player.position);
    
    // 3. Drop items
    for (const item of items) {
        await bot.toss(item.type, null, amount);
    }
}
```

## Common Patterns

### Error Handling
```javascript
try {
    await someAction();
} catch (err) {
    console.error('Error:', err);
    bot.chat("Sorry, I had trouble with that!");
}
```

### Distance Checking
```javascript
function isInRange(position, range = 32) {
    return bot.entity.position.distanceTo(position) <= range;
}
```

### Item Collection
```javascript
async collectNearbyItems() {
    const items = Object.values(bot.entities).filter(
        entity => entity.type === 'object'
    );
    
    for (const item of items) {
        await movement.moveTo(item.position);
    }
}
```

## Tips and Best Practices

1. **Always Check Range**
   ```javascript
   if (!isInRange(target)) {
       bot.chat("That's too far away!");
       return;
   }
   ```

2. **Handle Interruptions**
   ```javascript
   let isWorking = true;
   bot.on('stop', () => {
       isWorking = false;
   });
   ```

3. **Give Feedback**
   ```javascript
   bot.chat("Starting task...");
   await doTask();
   bot.chat("Task complete!");
   ```

Remember: The bot operates in an async environment, so always use proper async/await patterns and error handling!

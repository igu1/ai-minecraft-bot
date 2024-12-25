# Minecraft TreeBot

A smart Minecraft bot that can find, harvest, and collect trees using natural language commands. Built with Mineflayer and Google's Generative AI.

## Features

- Natural language command processing
- Smart tree detection and harvesting
- Inventory management
- Player following
- Multiple wood type support

## Requirements

- Node.js v18+
- Minecraft Java Edition 1.20.4
- A Google Generative AI API key

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Create a `.env` file in the root directory with your Google API key:
```
GEMINI_API_KEY=your_api_key_here
```

## Usage

1. Start your Minecraft server
2. Run the bot:
```bash
node src/bot/TreeBot.js
```

## Commands

Use these commands in Minecraft chat (replace TreeBot with your bot's name):

- `TreeBot find trees` - Make the bot search and cut down trees
  - Optional: Specify type and count: `TreeBot find 3 oak trees`
  
- `TreeBot give wood` - Receive collected wood
  - Optional: Specify type and amount: `TreeBot give me 5 birch logs`
  
- `TreeBot follow me` - Make the bot follow you
  - Optional: Specify distance: `TreeBot follow me at distance 4`
  
- `TreeBot stop` - Stop the bot's current action
  
- `TreeBot check inventory` - Check what the bot is carrying

## Project Structure

```
minecraft-bot/
├── src/
│   ├── bot/           # Bot-related code
│   ├── ai/            # AI and NLP processing
│   └── config/        # Configuration files
├── test/              # Test files
├── logs/              # Log files
├── .env              # Environment variables
└── README.md         # Documentation
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

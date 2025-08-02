# Scribble Royale

A browser-based multiplayer fighting game where players draw their own fighters and battle them in real-time combat.

## Project Structure

```
/
├── src/
│   ├── scenes/           # Phaser scene classes
│   │   ├── MenuScene.js
│   │   ├── DrawingScene.js
│   │   ├── CombatScene.js
│   │   └── ResultsScene.js
│   ├── components/       # Game component classes
│   │   ├── GameManager.js
│   │   ├── Fighter.js
│   │   ├── DrawingCanvas.js
│   │   └── InputHandler.js
│   ├── server/          # Server-side code
│   │   ├── RoomManager.js
│   │   └── WebSocketServer.js
│   ├── utils/           # Helper functions
│   │   ├── pngUtils.js
│   │   └── gameEvents.js
│   └── main.js          # Phaser game initialization
├── assets/              # Game assets (sprites, sounds)
├── tests/               # Test files
├── index.html           # Main entry point
├── server.js            # HTTP and WebSocket server
└── package.json         # Dependencies and scripts
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Open your browser and navigate to `http://localhost:3000`

## Technology Stack

- **Frontend**: Phaser 3, HTML5 Canvas API, WebSocket Client
- **Backend**: Node.js, WebSocket Server
- **Architecture**: Scene-based with component modularity

## Development Status

✅ Project structure and Phaser 3 foundation set up
⏳ Additional features will be implemented in subsequent tasks

## Requirements Addressed

- **Requirement 7.1**: Game loads completely in browser using Phaser framework
- Project structure supports all planned game phases and components
- Development environment ready for iterative feature development
# Project Structure

## Root Level
- `index.html` - Main entry point for the browser game
- `package.json` - Node.js dependencies and scripts
- `server.js` - WebSocket server entry point (if separate from client)

## Recommended Directory Structure
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
│   └── utils/           # Helper functions
│       ├── pngUtils.js
│       └── gameEvents.js
├── assets/              # Game assets (sprites, sounds)
├── tests/               # Test files
└── dist/                # Built/compiled files
```

## File Organization Principles
- **Scene Separation**: Each game phase (menu, drawing, combat, results) has its own scene file
- **Component Modularity**: Core game logic separated into reusable components
- **Client/Server Split**: Clear separation between browser and server code
- **Asset Management**: Centralized asset storage for Phaser loading
- **Test Coverage**: Parallel test structure matching source organization

## Naming Conventions
- **Classes**: PascalCase (GameManager, DrawingCanvas, Fighter)
- **Files**: Match class names (GameManager.js, DrawingCanvas.js)
- **Scenes**: Suffix with "Scene" (MenuScene, CombatScene)
- **Constants**: UPPER_SNAKE_CASE for game constants
- **Events**: camelCase for WebSocket event types

## Key Architectural Boundaries
- **Client-Server**: Clear separation via WebSocket interface
- **Scene Isolation**: Each scene manages its own state and UI
- **Component Encapsulation**: Each component handles specific functionality
- **Asset Pipeline**: Transparent PNG handling separate from general assets
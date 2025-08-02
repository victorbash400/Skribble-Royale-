# Technology Stack

## Frontend
- **Phaser 3**: Core game engine for rendering, physics, and asset management
- **HTML5 Canvas API**: Drawing functionality with transparent background support
- **WebSocket Client**: Real-time multiplayer communication
- **TypeScript/JavaScript**: Primary development language
- **Browser-native**: No external dependencies or installations required

## Backend
- **Node.js**: Server runtime
- **WebSocket Server**: Real-time communication for multiplayer functionality
- **Room Management System**: Custom implementation for game sessions

## Key Technical Requirements
- **Transparent PNG Support**: Drawings must maintain transparency for proper sprite rendering
- **60fps Performance**: Consistent frame rates during combat with custom sprites
- **Real-time Synchronization**: WebSocket-based state management between players
- **Cross-browser Compatibility**: Chrome, Firefox, Safari, Edge support

## Development Commands
Since this is a browser-based game, typical commands would include:
- `npm start` or `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm test` - Run test suite
- `node server.js` - Start WebSocket server (if separate)

## Architecture Patterns
- **Scene-based Architecture**: Phaser scenes for different game phases (Menu, Drawing, Combat, Results)
- **Component-based Design**: Modular classes (GameManager, Fighter, DrawingCanvas, RoomManager)
- **Event-driven Communication**: WebSocket events for multiplayer synchronization
- **State Management**: Centralized game state with real-time broadcasting
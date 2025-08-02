# How to Run Scribble Royale

## 🎮 **The Game is Now Fully Playable!**

All core features are implemented and working:
- ✅ Multiplayer room system
- ✅ Drawing your fighter
- ✅ Real-time combat with controls
- ✅ Win/lose detection and results

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Game Server
```bash
npm start
```

This will start:
- **HTTP Server** on `http://localhost:3000` (serves the game)
- **WebSocket Server** on `ws://localhost:8080` (handles multiplayer)

### 3. Play the Game

1. **Open your browser** and go to `http://localhost:3000`
2. **Create or join a room** using the menu
3. **Draw your fighter** using the drawing canvas
4. **Fight in real-time** using WASD/Arrow keys and Enter/X/Z to attack
5. **View results** and play again!

## 🎯 Game Controls

### Drawing Phase
- **Mouse/Touch**: Draw your fighter
- **Clear Button**: Clear the canvas
- **Submit Button**: Enter combat with your drawing

### Combat Phase
- **WASD** or **Arrow Keys**: Move left/right and jump
- **Enter**, **X**, or **Z**: Attack
- **Health bars** show damage taken
- **First to reach 0 health loses!**

### Results Phase
- **R Key** or **Play Again Button**: Start new round
- **M Key** or **Main Menu Button**: Return to menu

## 🌐 Multiplayer

- **Room Capacity**: 2 players maximum
- **Room Codes**: 6-character codes (e.g., "ABC123")
- **Real-time Sync**: All actions synchronized between players
- **Lag Compensation**: Smooth gameplay even with network delays

## 🧪 Testing

Run the comprehensive test suite:
```bash
# Test all game systems
npm test

# Or run individual test files
node test-combat-mechanics.js
node test-multiplayer-sync.js
node test-results-system.js
node test-websocket-server.js
```

## 🛠 Development

### File Structure
```
├── src/
│   ├── components/     # Core game components
│   ├── scenes/         # Phaser game scenes
│   ├── server/         # WebSocket server code
│   └── utils/         # Utility functions
├── assets/            # Game assets
├── tests/            # Unit tests
└── index.html        # Main game page
```

### Key Components
- **GameManager**: Handles scenes and networking
- **Fighter**: Character with combat mechanics
- **InputHandler**: Keyboard controls
- **WebSocketServer**: Multiplayer infrastructure
- **RoomManager**: Room and player management

## 🎉 Features Implemented

### Core Game Loop ✅
1. **Menu Scene** - Create/join rooms
2. **Drawing Scene** - Draw custom fighters
3. **Combat Scene** - Real-time fighting
4. **Results Scene** - Win/lose display

### Advanced Features ✅
- **Custom Fighter Sprites** from drawings
- **Real-time Multiplayer** with lag compensation
- **Combat System** with damage, knockback, effects
- **Network Synchronization** for all game states
- **Win/Lose Detection** with detailed statistics
- **Play Again** functionality

## 🔧 Configuration

### Environment Variables
- `PORT`: HTTP server port (default: 3000)
- `WS_PORT`: WebSocket server port (default: 8080)

### Customization
- Modify combat settings in `Fighter.js`
- Adjust network settings in `GameManager.js`  
- Change room settings in `RoomManager.js`

## 🌟 Ready to Play!

The game is fully functional and ready for multiplayer battles. Gather a friend, create a room, draw your fighters, and duke it out in real-time combat!

**Have fun drawing and fighting! 🎨⚔️**
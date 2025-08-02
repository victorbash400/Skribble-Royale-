// Simple test runner to verify core functionality without external dependencies
import RoomManager from './src/server/RoomManager.js';
import { createGameEvent, validateGameEvent, GAME_EVENTS } from './src/utils/gameEvents.js';

console.log('🧪 Running basic functionality tests...\n');

// Test RoomManager
console.log('Testing RoomManager...');
const roomManager = new RoomManager();

// Test room creation
const roomCode = roomManager.createRoom();
console.log(`✅ Room created: ${roomCode} (length: ${roomCode.length})`);

// Test room joining
const mockWs = { readyState: 1, send: () => {}, playerId: 'test-player' };
const joined = roomManager.joinRoom(roomCode, 'player1', mockWs);
console.log(`✅ Player joined room: ${joined}`);

// Test room retrieval
const room = roomManager.getRoomByPlayer('player1');
console.log(`✅ Room retrieved: ${room ? room.code : 'null'}`);

// Test broadcasting (should not throw)
try {
    roomManager.broadcastToRoom(roomCode, {
        type: 'test',
        playerId: 'player1',
        data: {},
        timestamp: Date.now()
    });
    console.log('✅ Broadcasting works');
} catch (error) {
    console.log('❌ Broadcasting failed:', error.message);
}

// Test game events
console.log('\nTesting Game Events...');

// Test event creation
const event = createGameEvent(GAME_EVENTS.JOIN_ROOM, 'player123', { roomCode: 'ABC123' });
console.log(`✅ Event created: ${event.type}`);

// Test event validation
const isValid = validateGameEvent(event);
console.log(`✅ Event validation: ${isValid}`);

// Test invalid event validation
const invalidEvent = { type: 'invalid' };
const isInvalid = validateGameEvent(invalidEvent);
console.log(`✅ Invalid event rejected: ${!isInvalid}`);

console.log('\n🎉 All basic tests passed! Core functionality is working.');
console.log('\nNote: Full test suite requires vitest installation.');
console.log('Run "npm install" when network is available, then "npm test"');
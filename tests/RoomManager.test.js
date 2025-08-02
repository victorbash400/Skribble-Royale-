import { describe, it, expect, beforeEach, vi } from 'vitest';
import RoomManager from '../src/server/RoomManager.js';

describe('RoomManager', () => {
    let roomManager;
    let mockWebSocket;

    beforeEach(() => {
        roomManager = new RoomManager();
        mockWebSocket = {
            readyState: 1, // WebSocket.OPEN
            send: vi.fn(),
            playerId: 'test-player-1'
        };
    });

    describe('createRoom', () => {
        it('should create a room with a unique 6-character code', () => {
            const roomCode = roomManager.createRoom();
            
            expect(roomCode).toBeDefined();
            expect(roomCode).toHaveLength(6);
            expect(roomManager.rooms.has(roomCode)).toBe(true);
        });

        it('should create rooms with different codes', () => {
            const roomCode1 = roomManager.createRoom();
            const roomCode2 = roomManager.createRoom();
            
            expect(roomCode1).not.toBe(roomCode2);
        });

        it('should initialize room with correct structure', () => {
            const roomCode = roomManager.createRoom();
            const room = roomManager.rooms.get(roomCode);
            
            expect(room).toMatchObject({
                code: roomCode,
                players: expect.any(Set),
                gameState: {
                    phase: 'menu',
                    roomCode: roomCode,
                    players: {},
                    winner: null
                },
                createdAt: expect.any(Date),
                lastActivity: expect.any(Date)
            });
            expect(room.players.size).toBe(0);
        });
    });

    describe('joinRoom', () => {
        let roomCode;

        beforeEach(() => {
            roomCode = roomManager.createRoom();
        });

        it('should allow a player to join an existing room', () => {
            const result = roomManager.joinRoom(roomCode, 'player1', mockWebSocket);
            
            expect(result).toBe(true);
            
            const room = roomManager.rooms.get(roomCode);
            expect(room.players.has('player1')).toBe(true);
            expect(room.gameState.players['player1']).toMatchObject({
                id: 'player1',
                ready: false,
                fighterImage: null,
                health: 100,
                position: { x: 0, y: 0 },
                ws: mockWebSocket
            });
        });

        it('should track player room mapping', () => {
            roomManager.joinRoom(roomCode, 'player1', mockWebSocket);
            
            expect(roomManager.playerRooms.get('player1')).toBe(roomCode);
        });

        it('should return false for non-existent room', () => {
            const result = roomManager.joinRoom('INVALID', 'player1', mockWebSocket);
            
            expect(result).toBe(false);
        });

        it('should not allow more than 2 players in a room', () => {
            const mockWs2 = { ...mockWebSocket, playerId: 'test-player-2' };
            const mockWs3 = { ...mockWebSocket, playerId: 'test-player-3' };
            
            expect(roomManager.joinRoom(roomCode, 'player1', mockWebSocket)).toBe(true);
            expect(roomManager.joinRoom(roomCode, 'player2', mockWs2)).toBe(true);
            expect(roomManager.joinRoom(roomCode, 'player3', mockWs3)).toBe(false);
            
            const room = roomManager.rooms.get(roomCode);
            expect(room.players.size).toBe(2);
        });

        it('should remove player from previous room when joining new room', () => {
            const roomCode2 = roomManager.createRoom();
            
            roomManager.joinRoom(roomCode, 'player1', mockWebSocket);
            roomManager.joinRoom(roomCode2, 'player1', mockWebSocket);
            
            const room1 = roomManager.rooms.get(roomCode);
            const room2 = roomManager.rooms.get(roomCode2);
            
            // Room1 should be cleaned up since it became empty
            expect(room1).toBeUndefined();
            expect(room2.players.has('player1')).toBe(true);
            expect(roomManager.playerRooms.get('player1')).toBe(roomCode2);
        });
    });

    describe('leaveRoom', () => {
        let roomCode;

        beforeEach(() => {
            roomCode = roomManager.createRoom();
            roomManager.joinRoom(roomCode, 'player1', mockWebSocket);
        });

        it('should remove player from room', () => {
            roomManager.leaveRoom(roomCode, 'player1');
            
            const room = roomManager.rooms.get(roomCode);
            // Room should be cleaned up since it became empty
            expect(room).toBeUndefined();
            expect(roomManager.playerRooms.get('player1')).toBeUndefined();
        });

        it('should clean up empty rooms', () => {
            roomManager.leaveRoom(roomCode, 'player1');
            
            expect(roomManager.rooms.has(roomCode)).toBe(false);
        });

        it('should not clean up rooms with remaining players', () => {
            const mockWs2 = { ...mockWebSocket, playerId: 'test-player-2' };
            roomManager.joinRoom(roomCode, 'player2', mockWs2);
            roomManager.leaveRoom(roomCode, 'player1');
            
            expect(roomManager.rooms.has(roomCode)).toBe(true);
            const room = roomManager.rooms.get(roomCode);
            expect(room.players.size).toBe(1);
        });

        it('should handle leaving non-existent room gracefully', () => {
            expect(() => {
                roomManager.leaveRoom('INVALID', 'player1');
            }).not.toThrow();
        });

        it('should handle null roomCode gracefully', () => {
            expect(() => {
                roomManager.leaveRoom(null, 'player1');
            }).not.toThrow();
        });
    });

    describe('broadcastToRoom', () => {
        let roomCode;
        let mockWs2;

        beforeEach(() => {
            roomCode = roomManager.createRoom();
            mockWs2 = {
                readyState: 1,
                send: vi.fn(),
                playerId: 'test-player-2'
            };
            
            roomManager.joinRoom(roomCode, 'player1', mockWebSocket);
            roomManager.joinRoom(roomCode, 'player2', mockWs2);
        });

        it('should send message to all players in room', () => {
            const event = {
                type: 'test_event',
                playerId: 'player1',
                data: { message: 'hello' },
                timestamp: Date.now()
            };
            
            roomManager.broadcastToRoom(roomCode, event);
            
            expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify(event));
            expect(mockWs2.send).toHaveBeenCalledWith(JSON.stringify(event));
        });

        it('should handle non-existent room gracefully', () => {
            const event = { type: 'test', playerId: 'player1', data: {}, timestamp: Date.now() };
            
            expect(() => {
                roomManager.broadcastToRoom('INVALID', event);
            }).not.toThrow();
        });

        it('should skip disconnected players', () => {
            mockWebSocket.readyState = 3; // WebSocket.CLOSED
            
            const event = { type: 'test', playerId: 'player1', data: {}, timestamp: Date.now() };
            roomManager.broadcastToRoom(roomCode, event);
            
            expect(mockWebSocket.send).not.toHaveBeenCalled();
            expect(mockWs2.send).toHaveBeenCalledWith(JSON.stringify(event));
        });

        it('should remove players with failed sends', () => {
            mockWebSocket.send.mockImplementation(() => {
                throw new Error('Connection failed');
            });
            
            const event = { type: 'test', playerId: 'player1', data: {}, timestamp: Date.now() };
            roomManager.broadcastToRoom(roomCode, event);
            
            const room = roomManager.rooms.get(roomCode);
            expect(room.players.has('player1')).toBe(false);
            expect(room.players.has('player2')).toBe(true);
        });
    });

    describe('getRoomByPlayer', () => {
        it('should return room for player in room', () => {
            const roomCode = roomManager.createRoom();
            roomManager.joinRoom(roomCode, 'player1', mockWebSocket);
            
            const room = roomManager.getRoomByPlayer('player1');
            expect(room.code).toBe(roomCode);
        });

        it('should return null for player not in room', () => {
            const room = roomManager.getRoomByPlayer('nonexistent');
            expect(room).toBeNull();
        });
    });

    describe('updateGameState', () => {
        it('should update game state for existing room', () => {
            const roomCode = roomManager.createRoom();
            const updates = { phase: 'combat', winner: 'player1' };
            
            roomManager.updateGameState(roomCode, updates);
            
            const room = roomManager.rooms.get(roomCode);
            expect(room.gameState.phase).toBe('combat');
            expect(room.gameState.winner).toBe('player1');
        });

        it('should handle non-existent room gracefully', () => {
            expect(() => {
                roomManager.updateGameState('INVALID', { phase: 'combat' });
            }).not.toThrow();
        });
    });

    describe('generateRoomCode', () => {
        it('should generate unique codes', () => {
            const codes = new Set();
            for (let i = 0; i < 100; i++) {
                codes.add(roomManager.generateRoomCode());
            }
            expect(codes.size).toBe(100);
        });

        it('should generate 6-character codes', () => {
            for (let i = 0; i < 10; i++) {
                const code = roomManager.generateRoomCode();
                expect(code).toHaveLength(6);
                expect(code).toMatch(/^[A-Z0-9]{6}$/);
            }
        });
    });

    describe('cleanupInactiveRooms', () => {
        it('should remove rooms inactive for more than specified minutes', () => {
            const roomCode = roomManager.createRoom();
            const room = roomManager.rooms.get(roomCode);
            
            // Set last activity to 31 minutes ago
            room.lastActivity = new Date(Date.now() - 31 * 60 * 1000);
            
            const cleanedCount = roomManager.cleanupInactiveRooms(30);
            
            expect(cleanedCount).toBe(1);
            expect(roomManager.rooms.has(roomCode)).toBe(false);
        });

        it('should keep active rooms', () => {
            const roomCode = roomManager.createRoom();
            const room = roomManager.rooms.get(roomCode);
            
            // Set last activity to 29 minutes ago
            room.lastActivity = new Date(Date.now() - 29 * 60 * 1000);
            
            const cleanedCount = roomManager.cleanupInactiveRooms(30);
            
            expect(cleanedCount).toBe(0);
            expect(roomManager.rooms.has(roomCode)).toBe(true);
        });
    });
});
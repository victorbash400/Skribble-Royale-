// MenuScene tests for room functionality
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import MenuScene from '../src/scenes/MenuScene.js';

// Mock GameManager
class MockGameManager {
    constructor() {
        this.playerId = 'test-player-123';
        this.connectionStatus = 'connected';
        this.createRoomResult = true;
        this.joinRoomResult = true;
    }

    getConnectionStatus() {
        return this.connectionStatus;
    }

    async createRoom() {
        return this.createRoomResult;
    }

    async joinRoom(code) {
        return this.joinRoomResult;
    }
}

describe('MenuScene', () => {
    let menuScene;
    let mockGameManager;
    let mockDocument;

    beforeEach(() => {
        // Mock DOM
        mockDocument = {
            createElement: vi.fn().mockReturnValue({
                type: '',
                placeholder: '',
                maxLength: 0,
                style: {},
                value: '',
                addEventListener: vi.fn(),
                parentNode: {
                    removeChild: vi.fn()
                }
            }),
            body: {
                appendChild: vi.fn()
            }
        };
        global.document = mockDocument;

        // Mock window.gameManager
        mockGameManager = new MockGameManager();
        global.window = { gameManager: mockGameManager };

        // Create MenuScene instance
        menuScene = new MenuScene();
        
        // Mock Phaser methods that aren't in the global mock
        menuScene.events = {
            on: vi.fn()
        };
        menuScene.add = {
            text: vi.fn().mockReturnValue({
                setOrigin: vi.fn().mockReturnThis(),
                setText: vi.fn().mockReturnThis(),
                setFill: vi.fn().mockReturnThis()
            }),
            rectangle: vi.fn().mockReturnValue({
                setInteractive: vi.fn().mockReturnValue({
                    on: vi.fn().mockReturnThis()
                })
            })
        };
        
        // Initialize scene
        menuScene.create();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Room Code Validation', () => {
        test('should validate correct room codes', () => {
            expect(menuScene.validateRoomCode('ABC123')).toBe(true);
            expect(menuScene.validateRoomCode('XYZ789')).toBe(true);
            expect(menuScene.validateRoomCode('123456')).toBe(true);
        });

        test('should reject invalid room codes', () => {
            expect(menuScene.validateRoomCode('')).toBe(false);
            expect(menuScene.validateRoomCode('ABC12')).toBe(false); // Too short
            expect(menuScene.validateRoomCode('ABC1234')).toBe(false); // Too long
            expect(menuScene.validateRoomCode('abc123')).toBe(false); // Lowercase
            expect(menuScene.validateRoomCode('ABC-12')).toBe(false); // Special chars
            expect(menuScene.validateRoomCode(null)).toBe(false);
            expect(menuScene.validateRoomCode(undefined)).toBe(false);
        });
    });

    describe('Room Creation', () => {
        test('should create room when connected', async () => {
            mockGameManager.connectionStatus = 'connected';
            mockGameManager.createRoomResult = true;

            await menuScene.createRoom();

            expect(mockGameManager.createRoom).toHaveBeenCalled();
            expect(menuScene.isWaitingForResponse).toBe(true);
        });

        test('should not create room when disconnected', async () => {
            mockGameManager.connectionStatus = 'disconnected';

            await menuScene.createRoom();

            expect(mockGameManager.createRoom).not.toHaveBeenCalled();
            expect(menuScene.statusMessage.setText).toHaveBeenCalledWith('Not connected to server');
        });

        test('should not create room when already waiting for response', async () => {
            menuScene.isWaitingForResponse = true;

            await menuScene.createRoom();

            expect(mockGameManager.createRoom).not.toHaveBeenCalled();
        });

        test('should handle room creation failure', async () => {
            mockGameManager.connectionStatus = 'connected';
            mockGameManager.createRoomResult = false;

            await menuScene.createRoom();

            expect(menuScene.statusMessage.setText).toHaveBeenCalledWith('Failed to create room');
            expect(menuScene.isWaitingForResponse).toBe(false);
        });
    });

    describe('Room Joining', () => {
        beforeEach(() => {
            // Mock room code input
            menuScene.roomCodeInput = {
                value: 'ABC123'
            };
        });

        test('should join room with valid code when connected', async () => {
            mockGameManager.connectionStatus = 'connected';
            mockGameManager.joinRoomResult = true;

            await menuScene.joinRoom();

            expect(mockGameManager.joinRoom).toHaveBeenCalledWith('ABC123');
            expect(menuScene.isWaitingForResponse).toBe(true);
        });

        test('should not join room when disconnected', async () => {
            mockGameManager.connectionStatus = 'disconnected';

            await menuScene.joinRoom();

            expect(mockGameManager.joinRoom).not.toHaveBeenCalled();
            expect(menuScene.statusMessage.setText).toHaveBeenCalledWith('Not connected to server');
        });

        test('should not join room with invalid code', async () => {
            menuScene.roomCodeInput.value = 'ABC12'; // Too short

            await menuScene.joinRoom();

            expect(mockGameManager.joinRoom).not.toHaveBeenCalled();
            expect(menuScene.statusMessage.setText).toHaveBeenCalledWith('Please enter a valid 6-character room code');
        });

        test('should not join room when already waiting for response', async () => {
            menuScene.isWaitingForResponse = true;

            await menuScene.joinRoom();

            expect(mockGameManager.joinRoom).not.toHaveBeenCalled();
        });

        test('should handle room joining failure', async () => {
            mockGameManager.connectionStatus = 'connected';
            mockGameManager.joinRoomResult = false;

            await menuScene.joinRoom();

            expect(menuScene.statusMessage.setText).toHaveBeenCalledWith('Failed to join room');
            expect(menuScene.isWaitingForResponse).toBe(false);
        });
    });

    describe('Game Manager Events', () => {
        test('should handle room_created event', () => {
            const eventData = { roomCode: 'ABC123' };
            
            menuScene.handleGameManagerEvent('room_created', eventData);

            expect(menuScene.roomCodeDisplay.setText).toHaveBeenCalledWith('Room Code: ABC123');
            expect(menuScene.statusMessage.setText).toHaveBeenCalledWith('Room created! Share the code with your opponent.');
            expect(menuScene.isWaitingForResponse).toBe(false);
        });

        test('should handle room_joined event', () => {
            const eventData = { roomCode: 'XYZ789' };
            
            menuScene.handleGameManagerEvent('room_joined', eventData);

            expect(menuScene.roomCodeDisplay.setText).toHaveBeenCalledWith('Joined Room: XYZ789');
            expect(menuScene.statusMessage.setText).toHaveBeenCalledWith('Successfully joined room! Waiting for opponent...');
            expect(menuScene.isWaitingForResponse).toBe(false);
        });

        test('should handle player_joined event', () => {
            mockGameManager.playerId = 'player1';
            const eventData = { playerId: 'player2' };
            
            menuScene.handleGameManagerEvent('player_joined', eventData);

            expect(menuScene.statusMessage.setText).toHaveBeenCalledWith('Opponent joined! Starting game...');
        });

        test('should handle room_error event', () => {
            const eventData = { message: 'Custom error message' };
            
            menuScene.handleGameManagerEvent('room_error', eventData);

            expect(menuScene.statusMessage.setText).toHaveBeenCalledWith('Custom error message');
            expect(menuScene.isWaitingForResponse).toBe(false);
        });

        test('should handle room_full event', () => {
            menuScene.handleGameManagerEvent('room_full', {});

            expect(menuScene.statusMessage.setText).toHaveBeenCalledWith('Room is full');
            expect(menuScene.isWaitingForResponse).toBe(false);
        });

        test('should handle room_not_found event', () => {
            menuScene.handleGameManagerEvent('room_not_found', {});

            expect(menuScene.statusMessage.setText).toHaveBeenCalledWith('Room not found');
            expect(menuScene.isWaitingForResponse).toBe(false);
        });

        test('should handle connection_status event', () => {
            const updateSpy = vi.spyOn(menuScene, 'updateConnectionStatus');
            
            menuScene.handleGameManagerEvent('connection_status', {});

            expect(updateSpy).toHaveBeenCalled();
        });
    });

    describe('Connection Status Display', () => {
        test('should show connected status', () => {
            mockGameManager.connectionStatus = 'connected';
            
            menuScene.updateConnectionStatus();

            expect(menuScene.connectionText.setText).toHaveBeenCalledWith('Connected');
            expect(menuScene.connectionText.setFill).toHaveBeenCalledWith('#00ff00');
        });

        test('should show disconnected status', () => {
            mockGameManager.connectionStatus = 'disconnected';
            
            menuScene.updateConnectionStatus();

            expect(menuScene.connectionText.setText).toHaveBeenCalledWith('Disconnected');
            expect(menuScene.connectionText.setFill).toHaveBeenCalledWith('#ff0000');
        });

        test('should show error status', () => {
            mockGameManager.connectionStatus = 'error';
            
            menuScene.updateConnectionStatus();

            expect(menuScene.connectionText.setText).toHaveBeenCalledWith('Connection Error');
            expect(menuScene.connectionText.setFill).toHaveBeenCalledWith('#ff0000');
        });

        test('should show connecting status for unknown status', () => {
            mockGameManager.connectionStatus = 'unknown';
            
            menuScene.updateConnectionStatus();

            expect(menuScene.connectionText.setText).toHaveBeenCalledWith('Connecting...');
            expect(menuScene.connectionText.setFill).toHaveBeenCalledWith('#ffff00');
        });
    });

    describe('Input Field Management', () => {
        test('should create room code input field', () => {
            expect(mockDocument.createElement).toHaveBeenCalledWith('input');
            expect(mockDocument.body.appendChild).toHaveBeenCalled();
        });

        test('should clean up input field on destroy', () => {
            const mockRemoveChild = vi.fn();
            menuScene.roomCodeInput = {
                parentNode: {
                    removeChild: mockRemoveChild
                }
            };

            // Simulate destroy event
            const destroyCallback = menuScene.events.on.mock.calls.find(call => call[0] === 'destroy')[1];
            destroyCallback();

            expect(mockRemoveChild).toHaveBeenCalledWith(menuScene.roomCodeInput);
        });
    });
});

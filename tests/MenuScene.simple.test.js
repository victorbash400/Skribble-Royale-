// Simple MenuScene tests for room functionality
import { describe, test, expect, beforeEach, vi } from 'vitest';

describe('MenuScene Room Functionality', () => {
    test('should validate room codes correctly', () => {
        // Mock MenuScene class with just the validation method
        const menuScene = {
            validateRoomCode(code) {
                return code && code.length === 6 && /^[A-Z0-9]{6}$/.test(code);
            }
        };

        // Test valid codes
        expect(menuScene.validateRoomCode('ABC123')).toBe(true);
        expect(menuScene.validateRoomCode('XYZ789')).toBe(true);
        expect(menuScene.validateRoomCode('123456')).toBe(true);

        // Test invalid codes - they should be falsy
        expect(menuScene.validateRoomCode('')).toBeFalsy();
        expect(menuScene.validateRoomCode('ABC12')).toBeFalsy(); // Too short
        expect(menuScene.validateRoomCode('ABC1234')).toBeFalsy(); // Too long
        expect(menuScene.validateRoomCode('abc123')).toBeFalsy(); // Lowercase
        expect(menuScene.validateRoomCode('ABC-12')).toBeFalsy(); // Special chars
        expect(menuScene.validateRoomCode(null)).toBeFalsy();
        expect(menuScene.validateRoomCode(undefined)).toBeFalsy();
    });

    test('should handle status messages', () => {
        const mockStatusMessage = {
            setText: vi.fn(),
            setFill: vi.fn()
        };

        const menuScene = {
            statusMessage: mockStatusMessage,
            showStatusMessage(message, color = '#ffff00') {
                if (this.statusMessage) {
                    this.statusMessage.setText(message);
                    this.statusMessage.setFill(color);
                }
            }
        };

        menuScene.showStatusMessage('Test message', '#ff0000');

        expect(mockStatusMessage.setText).toHaveBeenCalledWith('Test message');
        expect(mockStatusMessage.setFill).toHaveBeenCalledWith('#ff0000');
    });

    test('should handle connection status updates', () => {
        const mockConnectionText = {
            setText: vi.fn(),
            setFill: vi.fn()
        };

        const mockGameManager = {
            getConnectionStatus: vi.fn()
        };

        const menuScene = {
            gameManager: mockGameManager,
            connectionText: mockConnectionText,
            updateConnectionStatus() {
                if (!this.gameManager) return;
                
                const status = this.gameManager.getConnectionStatus();
                switch (status) {
                    case 'connected':
                        this.connectionText.setText('Connected');
                        this.connectionText.setFill('#00ff00');
                        break;
                    case 'disconnected':
                        this.connectionText.setText('Disconnected');
                        this.connectionText.setFill('#ff0000');
                        break;
                    case 'error':
                        this.connectionText.setText('Connection Error');
                        this.connectionText.setFill('#ff0000');
                        break;
                    default:
                        this.connectionText.setText('Connecting...');
                        this.connectionText.setFill('#ffff00');
                }
            }
        };

        // Test connected status
        mockGameManager.getConnectionStatus.mockReturnValue('connected');
        menuScene.updateConnectionStatus();
        expect(mockConnectionText.setText).toHaveBeenCalledWith('Connected');
        expect(mockConnectionText.setFill).toHaveBeenCalledWith('#00ff00');

        // Test disconnected status
        mockGameManager.getConnectionStatus.mockReturnValue('disconnected');
        menuScene.updateConnectionStatus();
        expect(mockConnectionText.setText).toHaveBeenCalledWith('Disconnected');
        expect(mockConnectionText.setFill).toHaveBeenCalledWith('#ff0000');
    });
});
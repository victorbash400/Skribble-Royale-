import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import InputHandler from '../src/components/InputHandler.js';

// Mock DOM document
const mockDocument = {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
};

// Mock global document
global.document = mockDocument;

describe('InputHandler', () => {
    let inputHandler;
    let mockKeyEvent;

    beforeEach(() => {
        vi.clearAllMocks();
        inputHandler = new InputHandler();
        
        // Create mock keyboard event
        mockKeyEvent = {
            code: 'KeyA',
            key: 'a',
            preventDefault: vi.fn()
        };
    });

    afterEach(() => {
        if (inputHandler && inputHandler.isInitialized) {
            inputHandler.destroy();
        }
    });

    describe('Constructor', () => {
        it('should initialize with default values', () => {
            expect(inputHandler.keys).toEqual({});
            expect(inputHandler.isInitialized).toBe(false);
            expect(inputHandler.attackCooldown).toBe(0);
            expect(inputHandler.attackCooldownTime).toBe(500);
            expect(inputHandler.lastAttackTime).toBe(0);
        });

        it('should have default key mappings', () => {
            expect(inputHandler.keyMappings).toEqual({
                left: ['ArrowLeft', 'KeyA'],
                right: ['ArrowRight', 'KeyD'],
                jump: ['ArrowUp', 'KeyW', 'Space'],
                attack: ['Enter', 'KeyX', 'KeyZ']
            });
        });

        it('should bind event handler methods', () => {
            expect(typeof inputHandler.handleKeyDown).toBe('function');
            expect(typeof inputHandler.handleKeyUp).toBe('function');
        });
    });

    describe('Initialization', () => {
        it('should initialize and add event listeners', () => {
            inputHandler.initialize();
            
            expect(inputHandler.isInitialized).toBe(true);
            expect(mockDocument.addEventListener).toHaveBeenCalledWith('keydown', inputHandler.handleKeyDown);
            expect(mockDocument.addEventListener).toHaveBeenCalledWith('keyup', inputHandler.handleKeyUp);
        });

        it('should not initialize twice', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            
            inputHandler.initialize();
            inputHandler.initialize();
            
            expect(consoleSpy).toHaveBeenCalledWith('InputHandler already initialized');
            expect(mockDocument.addEventListener).toHaveBeenCalledTimes(2); // Only called once
            
            consoleSpy.mockRestore();
        });
    });

    describe('Key Event Handling', () => {
        beforeEach(() => {
            inputHandler.initialize();
        });

        it('should handle keydown events', () => {
            const event = { code: 'KeyA', key: 'a', preventDefault: vi.fn() };
            
            inputHandler.handleKeyDown(event);
            
            expect(inputHandler.keys['KeyA']).toBe(true);
            expect(event.preventDefault).toHaveBeenCalled();
        });

        it('should handle keyup events', () => {
            const event = { code: 'KeyA', key: 'a', preventDefault: vi.fn() };
            
            // First press the key
            inputHandler.handleKeyDown(event);
            expect(inputHandler.keys['KeyA']).toBe(true);
            
            // Then release it
            inputHandler.handleKeyUp(event);
            expect(inputHandler.keys['KeyA']).toBe(false);
        });

        it('should handle invalid events gracefully', () => {
            expect(() => inputHandler.handleKeyDown(null)).not.toThrow();
            expect(() => inputHandler.handleKeyDown({})).not.toThrow();
            expect(() => inputHandler.handleKeyUp(null)).not.toThrow();
            expect(() => inputHandler.handleKeyUp({})).not.toThrow();
        });

        it('should prevent default for game keys', () => {
            const gameKeyEvent = { code: 'KeyA', key: 'a', preventDefault: vi.fn() };
            const nonGameKeyEvent = { code: 'KeyQ', key: 'q', preventDefault: vi.fn() };
            
            inputHandler.handleKeyDown(gameKeyEvent);
            inputHandler.handleKeyDown(nonGameKeyEvent);
            
            expect(gameKeyEvent.preventDefault).toHaveBeenCalled();
            expect(nonGameKeyEvent.preventDefault).not.toHaveBeenCalled();
        });
    });

    describe('Key State Checking', () => {
        beforeEach(() => {
            inputHandler.initialize();
        });

        it('should check if specific key is pressed', () => {
            expect(inputHandler.isKeyPressed('KeyA')).toBe(false);
            
            inputHandler.keys['KeyA'] = true;
            expect(inputHandler.isKeyPressed('KeyA')).toBe(true);
            
            inputHandler.keys['KeyA'] = false;
            expect(inputHandler.isKeyPressed('KeyA')).toBe(false);
        });

        it('should check if action is pressed', () => {
            expect(inputHandler.isActionPressed('left')).toBe(false);
            
            // Press ArrowLeft (mapped to left action)
            inputHandler.keys['ArrowLeft'] = true;
            expect(inputHandler.isActionPressed('left')).toBe(true);
            
            // Press KeyA (also mapped to left action)
            inputHandler.keys['ArrowLeft'] = false;
            inputHandler.keys['KeyA'] = true;
            expect(inputHandler.isActionPressed('left')).toBe(true);
        });

        it('should return false for unknown actions', () => {
            expect(inputHandler.isActionPressed('unknown')).toBe(false);
        });
    });

    describe('Movement Controls', () => {
        beforeEach(() => {
            inputHandler.initialize();
        });

        it('should detect left movement', () => {
            expect(inputHandler.isLeftPressed()).toBe(false);
            
            inputHandler.keys['ArrowLeft'] = true;
            expect(inputHandler.isLeftPressed()).toBe(true);
            
            inputHandler.keys['ArrowLeft'] = false;
            inputHandler.keys['KeyA'] = true;
            expect(inputHandler.isLeftPressed()).toBe(true);
        });

        it('should detect right movement', () => {
            expect(inputHandler.isRightPressed()).toBe(false);
            
            inputHandler.keys['ArrowRight'] = true;
            expect(inputHandler.isRightPressed()).toBe(true);
            
            inputHandler.keys['ArrowRight'] = false;
            inputHandler.keys['KeyD'] = true;
            expect(inputHandler.isRightPressed()).toBe(true);
        });

        it('should detect jump input', () => {
            expect(inputHandler.isJumpPressed()).toBe(false);
            
            inputHandler.keys['ArrowUp'] = true;
            expect(inputHandler.isJumpPressed()).toBe(true);
            
            inputHandler.keys['ArrowUp'] = false;
            inputHandler.keys['KeyW'] = true;
            expect(inputHandler.isJumpPressed()).toBe(true);
            
            inputHandler.keys['KeyW'] = false;
            inputHandler.keys['Space'] = true;
            expect(inputHandler.isJumpPressed()).toBe(true);
        });

        it('should get movement direction', () => {
            expect(inputHandler.getMovementDirection()).toBe(0);
            
            // Left only
            inputHandler.keys['ArrowLeft'] = true;
            expect(inputHandler.getMovementDirection()).toBe(-1);
            
            // Right only
            inputHandler.keys['ArrowLeft'] = false;
            inputHandler.keys['ArrowRight'] = true;
            expect(inputHandler.getMovementDirection()).toBe(1);
            
            // Both pressed (should cancel out)
            inputHandler.keys['ArrowLeft'] = true;
            inputHandler.keys['ArrowRight'] = true;
            expect(inputHandler.getMovementDirection()).toBe(0);
        });
    });

    describe('Attack System', () => {
        beforeEach(() => {
            inputHandler.initialize();
            // Mock Date.now for consistent testing
            vi.spyOn(Date, 'now').mockReturnValue(1000);
        });

        afterEach(() => {
            vi.restoreAllMocks();
        });

        it('should detect attack input when not on cooldown', () => {
            inputHandler.keys['Enter'] = true;
            
            expect(inputHandler.isAttackPressed()).toBe(true);
            expect(inputHandler.lastAttackTime).toBe(1000);
        });

        it('should respect attack cooldown', () => {
            inputHandler.keys['Enter'] = true;
            
            // First attack should work
            expect(inputHandler.isAttackPressed()).toBe(true);
            
            // Immediate second attack should be blocked
            expect(inputHandler.isAttackPressed()).toBe(false);
            
            // Attack after cooldown should work
            Date.now.mockReturnValue(1600); // 600ms later (> 500ms cooldown)
            expect(inputHandler.isAttackPressed()).toBe(true);
        });

        it('should check if attack is on cooldown', () => {
            inputHandler.keys['Enter'] = true;
            
            expect(inputHandler.isAttackOnCooldown()).toBe(false);
            
            // Trigger attack
            inputHandler.isAttackPressed();
            expect(inputHandler.isAttackOnCooldown()).toBe(true);
            
            // After cooldown
            Date.now.mockReturnValue(1600);
            expect(inputHandler.isAttackOnCooldown()).toBe(false);
        });

        it('should get remaining cooldown time', () => {
            inputHandler.keys['Enter'] = true;
            
            // No cooldown initially
            expect(inputHandler.getAttackCooldownRemaining()).toBe(0);
            
            // Trigger attack
            inputHandler.isAttackPressed();
            
            // Check remaining cooldown
            Date.now.mockReturnValue(1200); // 200ms later
            expect(inputHandler.getAttackCooldownRemaining()).toBe(300); // 300ms remaining
            
            // After cooldown expires
            Date.now.mockReturnValue(1600);
            expect(inputHandler.getAttackCooldownRemaining()).toBe(0);
        });

        it('should work with different attack keys', () => {
            // Test Enter key
            inputHandler.keys['Enter'] = true;
            expect(inputHandler.isAttackPressed()).toBe(true);
            
            // Reset for next test
            Date.now.mockReturnValue(2000);
            inputHandler.keys['Enter'] = false;
            
            // Test KeyX
            inputHandler.keys['KeyX'] = true;
            expect(inputHandler.isAttackPressed()).toBe(true);
            
            // Reset for next test
            Date.now.mockReturnValue(3000);
            inputHandler.keys['KeyX'] = false;
            
            // Test KeyZ
            inputHandler.keys['KeyZ'] = true;
            expect(inputHandler.isAttackPressed()).toBe(true);
        });
    });

    describe('Utility Methods', () => {
        beforeEach(() => {
            inputHandler.initialize();
        });

        it('should identify game keys', () => {
            expect(inputHandler.isGameKey('KeyA')).toBe(true); // Left movement
            expect(inputHandler.isGameKey('ArrowRight')).toBe(true); // Right movement
            expect(inputHandler.isGameKey('Space')).toBe(true); // Jump
            expect(inputHandler.isGameKey('Enter')).toBe(true); // Attack
            expect(inputHandler.isGameKey('KeyQ')).toBe(false); // Not a game key
        });

        it('should update state', () => {
            const deltaTime = 16; // 16ms frame time
            
            // Set some cooldown
            inputHandler.attackCooldown = 100;
            
            inputHandler.update(deltaTime);
            
            expect(inputHandler.attackCooldown).toBe(84); // 100 - 16
        });

        it('should set custom key mappings', () => {
            const customMappings = {
                left: ['KeyH'],
                attack: ['KeyJ', 'KeyK']
            };
            
            inputHandler.setKeyMappings(customMappings);
            
            expect(inputHandler.keyMappings.left).toEqual(['KeyH']);
            expect(inputHandler.keyMappings.attack).toEqual(['KeyJ', 'KeyK']);
            expect(inputHandler.keyMappings.right).toEqual(['ArrowRight', 'KeyD']); // Unchanged
        });

        it('should reset all keys', () => {
            inputHandler.keys = { 'KeyA': true, 'KeyD': true };
            
            inputHandler.resetKeys();
            
            expect(inputHandler.keys).toEqual({});
        });
    });

    describe('Cleanup', () => {
        it('should destroy and remove event listeners', () => {
            inputHandler.initialize();
            expect(inputHandler.isInitialized).toBe(true);
            
            inputHandler.destroy();
            
            expect(inputHandler.isInitialized).toBe(false);
            expect(mockDocument.removeEventListener).toHaveBeenCalledWith('keydown', inputHandler.handleKeyDown);
            expect(mockDocument.removeEventListener).toHaveBeenCalledWith('keyup', inputHandler.handleKeyUp);
            expect(inputHandler.keys).toEqual({});
        });

        it('should handle destroy when not initialized', () => {
            expect(() => inputHandler.destroy()).not.toThrow();
            expect(mockDocument.removeEventListener).not.toHaveBeenCalled();
        });
    });

    describe('Integration Scenarios', () => {
        beforeEach(() => {
            inputHandler.initialize();
        });

        it('should handle complex movement combinations', () => {
            // Start moving left
            inputHandler.keys['ArrowLeft'] = true;
            expect(inputHandler.getMovementDirection()).toBe(-1);
            
            // Add jump while moving left
            inputHandler.keys['Space'] = true;
            expect(inputHandler.getMovementDirection()).toBe(-1);
            expect(inputHandler.isJumpPressed()).toBe(true);
            
            // Change to moving right while jumping
            inputHandler.keys['ArrowLeft'] = false;
            inputHandler.keys['ArrowRight'] = true;
            expect(inputHandler.getMovementDirection()).toBe(1);
            expect(inputHandler.isJumpPressed()).toBe(true);
            
            // Stop all movement
            inputHandler.keys['ArrowRight'] = false;
            inputHandler.keys['Space'] = false;
            expect(inputHandler.getMovementDirection()).toBe(0);
            expect(inputHandler.isJumpPressed()).toBe(false);
        });

        it('should handle attack while moving', () => {
            vi.spyOn(Date, 'now').mockReturnValue(1000);
            
            // Move and attack simultaneously
            inputHandler.keys['ArrowRight'] = true;
            inputHandler.keys['Enter'] = true;
            
            expect(inputHandler.getMovementDirection()).toBe(1);
            expect(inputHandler.isAttackPressed()).toBe(true);
            
            // Attack should be on cooldown but movement should continue
            expect(inputHandler.getMovementDirection()).toBe(1);
            expect(inputHandler.isAttackPressed()).toBe(false);
            
            vi.restoreAllMocks();
        });
    });
});
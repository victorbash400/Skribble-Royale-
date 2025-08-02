import { describe, it, expect } from 'vitest';
import { 
    GAME_EVENTS, 
    createGameEvent, 
    validateGameEvent, 
    serializeGameEvent, 
    deserializeGameEvent 
} from '../src/utils/gameEvents.js';

describe('gameEvents', () => {
    describe('GAME_EVENTS constants', () => {
        it('should have all required event types', () => {
            expect(GAME_EVENTS.JOIN_ROOM).toBe('join_room');
            expect(GAME_EVENTS.PLAYER_READY).toBe('player_ready');
            expect(GAME_EVENTS.FIGHTER_SUBMIT).toBe('fighter_submit');
            expect(GAME_EVENTS.MOVE).toBe('move');
            expect(GAME_EVENTS.ATTACK).toBe('attack');
            expect(GAME_EVENTS.DAMAGE).toBe('damage');
            expect(GAME_EVENTS.GAME_OVER).toBe('game_over');
            expect(GAME_EVENTS.ROOM_CREATED).toBe('room_created');
            expect(GAME_EVENTS.ROOM_JOINED).toBe('room_joined');
            expect(GAME_EVENTS.PLAYER_DISCONNECTED).toBe('player_disconnected');
        });
    });

    describe('createGameEvent', () => {
        it('should create a valid game event with required fields', () => {
            const event = createGameEvent('test_type', 'player123', { key: 'value' });
            
            expect(event).toMatchObject({
                type: 'test_type',
                playerId: 'player123',
                data: { key: 'value' },
                timestamp: expect.any(Number)
            });
        });

        it('should create event with empty data object by default', () => {
            const event = createGameEvent('test_type', 'player123');
            
            expect(event.data).toEqual({});
        });

        it('should set timestamp to current time', () => {
            const before = Date.now();
            const event = createGameEvent('test_type', 'player123');
            const after = Date.now();
            
            expect(event.timestamp).toBeGreaterThanOrEqual(before);
            expect(event.timestamp).toBeLessThanOrEqual(after);
        });
    });

    describe('validateGameEvent', () => {
        it('should validate a correct game event', () => {
            const event = {
                type: GAME_EVENTS.JOIN_ROOM,
                playerId: 'player123',
                data: { roomCode: 'ABC123' },
                timestamp: Date.now()
            };
            
            expect(validateGameEvent(event)).toBe(true);
        });

        it('should reject null or undefined events', () => {
            expect(validateGameEvent(null)).toBe(false);
            expect(validateGameEvent(undefined)).toBe(false);
        });

        it('should reject non-object events', () => {
            expect(validateGameEvent('string')).toBe(false);
            expect(validateGameEvent(123)).toBe(false);
            expect(validateGameEvent(true)).toBe(false);
        });

        it('should reject events missing required fields', () => {
            expect(validateGameEvent({})).toBe(false);
            expect(validateGameEvent({ type: 'test' })).toBe(false);
            expect(validateGameEvent({ type: 'test', playerId: 'player1' })).toBe(false);
            expect(validateGameEvent({ 
                type: 'test', 
                playerId: 'player1', 
                timestamp: Date.now() 
            })).toBe(false); // missing data
        });

        it('should reject events with invalid event types', () => {
            const event = {
                type: 'invalid_event_type',
                playerId: 'player123',
                data: {},
                timestamp: Date.now()
            };
            
            expect(validateGameEvent(event)).toBe(false);
        });

        it('should accept events with empty data object', () => {
            const event = {
                type: GAME_EVENTS.PLAYER_READY,
                playerId: 'player123',
                data: {},
                timestamp: Date.now()
            };
            
            expect(validateGameEvent(event)).toBe(true);
        });
    });

    describe('serializeGameEvent', () => {
        it('should serialize a valid game event to JSON string', () => {
            const event = {
                type: GAME_EVENTS.JOIN_ROOM,
                playerId: 'player123',
                data: { roomCode: 'ABC123' },
                timestamp: 1234567890
            };
            
            const serialized = serializeGameEvent(event);
            const expected = JSON.stringify(event);
            
            expect(serialized).toBe(expected);
        });

        it('should handle serialization errors gracefully', () => {
            // Create an object with circular reference
            const circularEvent = {
                type: GAME_EVENTS.JOIN_ROOM,
                playerId: 'player123',
                data: {},
                timestamp: Date.now()
            };
            circularEvent.data.self = circularEvent;
            
            const result = serializeGameEvent(circularEvent);
            expect(result).toBeNull();
        });
    });

    describe('deserializeGameEvent', () => {
        it('should deserialize a valid JSON string to game event', () => {
            const event = {
                type: GAME_EVENTS.JOIN_ROOM,
                playerId: 'player123',
                data: { roomCode: 'ABC123' },
                timestamp: 1234567890
            };
            const jsonString = JSON.stringify(event);
            
            const deserialized = deserializeGameEvent(jsonString);
            expect(deserialized).toEqual(event);
        });

        it('should return null for invalid JSON', () => {
            const result = deserializeGameEvent('invalid json');
            expect(result).toBeNull();
        });

        it('should return null for valid JSON but invalid game event', () => {
            const invalidEvent = { invalid: 'event' };
            const jsonString = JSON.stringify(invalidEvent);
            
            const result = deserializeGameEvent(jsonString);
            expect(result).toBeNull();
        });

        it('should validate deserialized events', () => {
            const validEvent = {
                type: GAME_EVENTS.MOVE,
                playerId: 'player123',
                data: { direction: 'left' },
                timestamp: Date.now()
            };
            const jsonString = JSON.stringify(validEvent);
            
            const result = deserializeGameEvent(jsonString);
            expect(result).toEqual(validEvent);
        });
    });

    describe('integration tests', () => {
        it('should create, serialize, and deserialize events correctly', () => {
            const originalEvent = createGameEvent(
                GAME_EVENTS.FIGHTER_SUBMIT, 
                'player456', 
                { fighterImage: 'base64data' }
            );
            
            const serialized = serializeGameEvent(originalEvent);
            const deserialized = deserializeGameEvent(serialized);
            
            expect(deserialized).toEqual(originalEvent);
            expect(validateGameEvent(deserialized)).toBe(true);
        });
    });
});
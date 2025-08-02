// Game event constants and utilities for WebSocket communication

export const GAME_EVENTS = {
    JOIN_ROOM: 'join_room',
    PLAYER_READY: 'player_ready',
    FIGHTER_SUBMIT: 'fighter_submit',
    MOVE: 'move',
    ATTACK: 'attack',
    DAMAGE: 'damage',
    DAMAGE_DEALT: 'damage_dealt',
    HEALTH_UPDATE: 'health_update',
    GAME_OVER: 'game_over',
    ROOM_CREATED: 'room_created',
    ROOM_JOINED: 'room_joined',
    PLAYER_DISCONNECTED: 'player_disconnected',
    CREATE_ROOM: 'create_room',
    PLAYER_JOINED: 'player_joined',
    CONNECTION_ESTABLISHED: 'connection_established',
    ERROR: 'error'
};

export function createGameEvent(type, playerId, data = {}) {
    return {
        type,
        playerId,
        data,
        timestamp: Date.now()
    };
}

export function validateGameEvent(event) {
    if (!event || typeof event !== 'object') {
        return false;
    }
    
    // Check required fields
    if (!event.type || !event.playerId || !event.timestamp) {
        return false;
    }
    
    // Check if event type is valid
    if (!Object.values(GAME_EVENTS).includes(event.type)) {
        return false;
    }
    
    // Check if data field exists (can be empty object)
    if (event.data === undefined) {
        return false;
    }
    
    return true;
}

export function serializeGameEvent(event) {
    try {
        return JSON.stringify(event);
    } catch (error) {
        console.error('Failed to serialize game event:', error);
        return null;
    }
}

export function deserializeGameEvent(eventString) {
    try {
        const event = JSON.parse(eventString);
        return validateGameEvent(event) ? event : null;
    } catch (error) {
        console.error('Failed to deserialize game event:', error);
        return null;
    }
}
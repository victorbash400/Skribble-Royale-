class RoomManager {
    constructor() {
        this.rooms = new Map();
        this.playerRooms = new Map(); // Track which room each player is in
    }

    createRoom() {
        // Generate a unique 6-character room code
        const roomCode = this.generateRoomCode();
        
        const room = {
            code: roomCode,
            players: new Set(),
            gameState: {
                phase: 'menu',
                roomCode: roomCode,
                players: {},
                winner: null
            },
            createdAt: new Date(),
            lastActivity: new Date()
        };
        
        this.rooms.set(roomCode, room);
        console.log(`Room created: ${roomCode}`);
        return roomCode;
    }

    joinRoom(roomCode, playerId, ws) {
        const room = this.rooms.get(roomCode);
        
        if (!room) {
            console.log(`Room ${roomCode} not found`);
            return false;
        }
        
        if (room.players.size >= 2) {
            console.log(`Room ${roomCode} is full`);
            return false;
        }
        
        // Remove player from any existing room first
        this.leaveRoom(this.playerRooms.get(playerId), playerId);
        
        // Add player to room
        room.players.add(playerId);
        room.gameState.players[playerId] = {
            id: playerId,
            ready: false,
            fighterImage: null,
            health: 100,
            position: { x: 0, y: 0 },
            ws: ws // Store WebSocket connection for broadcasting
        };
        
        // Initialize server health tracking if room is in combat phase
        if (room.gameState.phase === 'combat') {
            if (!room.serverHealth) {
                room.serverHealth = {};
            }
            room.serverHealth[playerId] = 100;
            console.log(`🏥 Initialized health for joining player ${playerId}: 100`);
        }
        
        this.playerRooms.set(playerId, roomCode);
        room.lastActivity = new Date();
        
        console.log(`Player ${playerId} joined room ${roomCode}. Players: ${room.players.size}/2`);
        return true;
    }

    leaveRoom(roomCode, playerId) {
        if (!roomCode) return;
        
        const room = this.rooms.get(roomCode);
        if (!room) return;
        
        room.players.delete(playerId);
        delete room.gameState.players[playerId];
        this.playerRooms.delete(playerId);
        
        console.log(`Player ${playerId} left room ${roomCode}. Players: ${room.players.size}/2`);
        
        // Notify remaining players
        this.broadcastToRoom(roomCode, {
            type: 'player_disconnected',
            playerId: playerId,
            data: {},
            timestamp: Date.now()
        });
        
        // Clean up empty rooms
        if (room.players.size === 0) {
            this.cleanupRoom(roomCode);
        }
    }

    broadcastToRoom(roomCode, event, excludePlayerId = null, silent = false) {
        const room = this.rooms.get(roomCode);
        if (!room) {
            if (!silent) console.log(`Cannot broadcast to room ${roomCode}: room not found`);
            return;
        }
        
        const message = JSON.stringify(event);
        let sentCount = 0;
        
        // Send to all players in the room (except excluded player)
        for (const playerId of room.players) {
            // Skip excluded player
            if (excludePlayerId && playerId === excludePlayerId) {
                continue;
            }
            
            const player = room.gameState.players[playerId];
            if (event.type === 'game_over') {
                console.log(`🔍 Trying to send game_over to player ${playerId}, ws state: ${player?.ws?.readyState}`);
            }
            
            if (player && player.ws && player.ws.readyState === 1) { // WebSocket.OPEN = 1
                try {
                    player.ws.send(message);
                    sentCount++;
                    if (event.type === 'game_over') {
                        console.log(`✅ Successfully sent game_over to player ${playerId}`);
                    }
                } catch (error) {
                    console.error(`Failed to send message to player ${playerId}:`, error);
                    // Remove disconnected player
                    this.leaveRoom(roomCode, playerId);
                }
            } else {
                if (event.type === 'game_over') {
                    console.log(`❌ Cannot send game_over to player ${playerId} - ws not ready`);
                }
            }
        }
        
        if (!silent || event.type === 'game_over') {
            console.log(`📡 Broadcasted event ${event.type} to ${sentCount} players in room ${roomCode} (${room.players.size} total players)`);
        }
        room.lastActivity = new Date();
    }

    cleanupRoom(roomCode) {
        const room = this.rooms.get(roomCode);
        if (room) {
            // Remove all players from tracking
            for (const playerId of room.players) {
                this.playerRooms.delete(playerId);
            }
            
            this.rooms.delete(roomCode);
            console.log(`Room ${roomCode} cleaned up`);
        }
    }

    getRoomByPlayer(playerId) {
        const roomCode = this.playerRooms.get(playerId);
        return roomCode ? this.rooms.get(roomCode) : null;
    }

    updateGameState(roomCode, updates) {
        const room = this.rooms.get(roomCode);
        if (room) {
            Object.assign(room.gameState, updates);
            room.lastActivity = new Date();
        }
    }

    generateRoomCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        
        // Generate until we get a unique code
        do {
            result = '';
            for (let i = 0; i < 6; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
        } while (this.rooms.has(result));
        
        return result;
    }

    // Cleanup inactive rooms (called periodically)
    cleanupInactiveRooms(maxInactiveMinutes = 30) {
        const now = new Date();
        const roomsToCleanup = [];
        
        for (const [roomCode, room] of this.rooms) {
            const inactiveMinutes = (now - room.lastActivity) / (1000 * 60);
            if (inactiveMinutes > maxInactiveMinutes) {
                roomsToCleanup.push(roomCode);
            }
        }
        
        roomsToCleanup.forEach(roomCode => {
            console.log(`Cleaning up inactive room: ${roomCode}`);
            this.cleanupRoom(roomCode);
        });
        
        return roomsToCleanup.length;
    }
}

export default RoomManager;
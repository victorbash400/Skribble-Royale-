import { WebSocketServer as WSServer } from 'ws';
import RoomManager from './RoomManager.js';
import { GAME_EVENTS } from '../utils/gameEvents.js';

class WebSocketServer {
    constructor(port = 8080) {
        this.port = port;
        this.wss = null;
        this.roomManager = new RoomManager();
        this.playerConnections = new Map(); // Track player connections
    }

    start() {
        this.wss = new WSServer({ port: this.port });
        
        this.wss.on('connection', (ws) => {
            this.handleConnection(ws);
        });

        // Start periodic cleanup of inactive rooms
        setInterval(() => {
            const cleanedCount = this.roomManager.cleanupInactiveRooms();
            if (cleanedCount > 0) {
                console.log(`Cleaned up ${cleanedCount} inactive rooms`);
            }
        }, 5 * 60 * 1000); // Every 5 minutes

        console.log(`WebSocket server started on port ${this.port}`);
    }

    handleConnection(ws) {
        console.log('New WebSocket connection established');
        
        // Generate unique player ID for this connection
        const playerId = this.generatePlayerId();
        ws.playerId = playerId;
        this.playerConnections.set(playerId, ws);

        // Set up message handler
        ws.on('message', (data) => {
            this.handleMessage(ws, data);
        });

        // Set up disconnection handler
        ws.on('close', () => {
            this.handleDisconnection(ws);
        });

        // Set up error handler
        ws.on('error', (error) => {
            console.error(`WebSocket error for player ${playerId}:`, error);
            this.handleDisconnection(ws);
        });

        // Send connection confirmation
        this.sendToPlayer(ws, {
            type: 'connection_established',
            playerId: playerId,
            data: { playerId },
            timestamp: Date.now()
        });
    }

    handleMessage(ws, data) {
        try {
            const message = JSON.parse(data.toString());
            const { type, playerId, data: eventData } = message;

            // Only log attack messages for debugging
            if (type === 'player_action' && eventData.action === 'attack') {
                console.log(`Received ${type} from player ${playerId} - ${eventData.action}`);
            } else if (type !== 'player_action') {
                console.log(`Received ${type} from player ${playerId}`);
            }

            // Validate that the player ID matches the connection
            if (playerId !== ws.playerId) {
                console.warn(`Player ID mismatch: expected ${ws.playerId}, got ${playerId}`);
                return;
            }

            switch (type) {
                case GAME_EVENTS.JOIN_ROOM:
                    this.handleJoinRoom(ws, playerId, eventData);
                    break;
                
                case 'create_room':
                    this.handleCreateRoom(ws, playerId);
                    break;
                
                case GAME_EVENTS.PLAYER_READY:
                    this.handlePlayerReady(ws, playerId, eventData);
                    break;
                
                case GAME_EVENTS.FIGHTER_SUBMIT:
                    this.handleFighterSubmit(ws, playerId, eventData);
                    break;
                
                case GAME_EVENTS.MOVE:
                case GAME_EVENTS.ATTACK:
                case GAME_EVENTS.DAMAGE:
                    this.handleGameAction(ws, playerId, type, eventData);
                    break;
                
                case 'player_action':
                    this.handlePlayerAction(ws, playerId, eventData);
                    break;
                
                case 'game_state_update':
                    this.handleGameAction(ws, playerId, type, eventData);
                    break;
                
                case 'restart_game':
                    this.handleRestartGame(ws, playerId);
                    break;
                
                default:
                    console.warn(`Unknown message type: ${type}`);
            }
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
            this.sendError(ws, 'Invalid message format');
        }
    }

    handleDisconnection(ws) {
        const playerId = ws.playerId;
        console.log(`WebSocket disconnection for player ${playerId}`);
        
        if (playerId) {
            // Remove player from any room they're in
            const room = this.roomManager.getRoomByPlayer(playerId);
            if (room) {
                this.roomManager.leaveRoom(room.code, playerId);
            }
            
            // Clean up connection tracking
            this.playerConnections.delete(playerId);
        }
    }

    handleCreateRoom(ws, playerId) {
        const roomCode = this.roomManager.createRoom();
        
        // Automatically join the player to the created room
        const joined = this.roomManager.joinRoom(roomCode, playerId, ws);
        
        if (joined) {
            this.sendToPlayer(ws, {
                type: 'room_created',
                playerId: playerId,
                data: { roomCode },
                timestamp: Date.now()
            });
        } else {
            this.sendToPlayer(ws, {
                type: 'room_error',
                playerId: playerId,
                data: { message: 'Failed to create room' },
                timestamp: Date.now()
            });
        }
    }

    handleJoinRoom(ws, playerId, eventData) {
        const { roomCode } = eventData;
        
        if (!roomCode) {
            this.sendError(ws, 'Room code is required');
            return;
        }

        const joined = this.roomManager.joinRoom(roomCode, playerId, ws);
        
        if (joined) {
            // Get room directly by roomCode to avoid race conditions
            const room = this.roomManager.rooms.get(roomCode);
            
            if (!room) {
                console.error(`Room ${roomCode} not found after joining`);
                this.sendError(ws, 'Failed to find room after joining');
                return;
            }
            
            // Send join confirmation to the player
            this.sendToPlayer(ws, {
                type: 'room_joined',
                playerId: playerId,
                data: { 
                    roomCode,
                    playerCount: room.players.size,
                    gameState: room.gameState
                },
                timestamp: Date.now()
            });

            // Broadcast to other players in the room
            this.roomManager.broadcastToRoom(roomCode, {
                type: 'player_joined',
                playerId: playerId,
                data: { 
                    playerCount: room.players.size,
                    newPlayerId: playerId
                },
                timestamp: Date.now()
            });
        } else {
            // Check specific failure reason
            const room = this.roomManager.rooms.get(roomCode);
            if (!room) {
                this.sendToPlayer(ws, {
                    type: 'room_not_found',
                    playerId: playerId,
                    data: { message: 'Room not found' },
                    timestamp: Date.now()
                });
            } else if (room.players.size >= 2) {
                this.sendToPlayer(ws, {
                    type: 'room_full',
                    playerId: playerId,
                    data: { message: 'Room is full' },
                    timestamp: Date.now()
                });
            } else {
                this.sendToPlayer(ws, {
                    type: 'room_error',
                    playerId: playerId,
                    data: { message: 'Failed to join room' },
                    timestamp: Date.now()
                });
            }
        }
    }

    handlePlayerReady(ws, playerId, eventData) {
        const room = this.roomManager.getRoomByPlayer(playerId);
        if (!room) {
            this.sendError(ws, 'Player not in a room');
            return;
        }

        // Update player ready status
        if (room.gameState.players[playerId]) {
            room.gameState.players[playerId].ready = true;
        }

        // Broadcast ready status to room
        this.roomManager.broadcastToRoom(room.code, {
            type: GAME_EVENTS.PLAYER_READY,
            playerId: playerId,
            data: eventData,
            timestamp: Date.now()
        });
    }

    handleFighterSubmit(ws, playerId, eventData) {
        const room = this.roomManager.getRoomByPlayer(playerId);
        if (!room) {
            this.sendError(ws, 'Player not in a room');
            return;
        }

        // Store fighter image for the player
        if (room.gameState.players[playerId]) {
            room.gameState.players[playerId].fighterImage = eventData.fighterImage;
            room.gameState.players[playerId].ready = true;
        }

        // Broadcast fighter submission to room
        this.roomManager.broadcastToRoom(room.code, {
            type: GAME_EVENTS.FIGHTER_SUBMIT,
            playerId: playerId,
            data: eventData,
            timestamp: Date.now()
        });

        // Check if all players are ready to start combat
        const allPlayersReady = Object.values(room.gameState.players).every(player => player.ready);
        const hasEnoughPlayers = room.players.size >= 2;

        if (allPlayersReady && hasEnoughPlayers) {
            console.log(`All players ready in room ${room.code}, starting combat phase`);
            
            // Update game phase and track combat start time
            room.gameState.phase = 'combat';
            room.combatStartTime = Date.now();
            
            // Broadcast phase change to all players
            this.roomManager.broadcastToRoom(room.code, {
                type: 'phase_change',
                playerId: 'server',
                data: { 
                    phase: 'combat',
                    gameState: room.gameState
                },
                timestamp: Date.now()
            });
        }
    }

    handlePlayerAction(ws, playerId, eventData) {
        // Only log attacks for debugging
        if (eventData.action === 'attack') {
            console.log(`🔧 handlePlayerAction called for ${playerId} with action: ${eventData.action}`);
        }
        
        const room = this.roomManager.getRoomByPlayer(playerId);
        if (!room) {
            console.log(`❌ Player ${playerId} not found in any room`);
            this.sendError(ws, 'Player not in a room');
            return;
        }

        // Handle server-authoritative actions
        if (eventData.action === 'attack') {
            console.log(`🎯 Routing attack action to server handler`);
            this.handleRealtimeAction(room, playerId, eventData);
        } else {
            // Broadcast non-attack actions to all players in the room
            this.roomManager.broadcastToRoom(room.code, {
                type: 'player_action',
                playerId: playerId,
                data: eventData,
                timestamp: Date.now()
            }, null, true); // Silent broadcast
        }
    }

    handleGameAction(ws, playerId, actionType, eventData) {
        const room = this.roomManager.getRoomByPlayer(playerId);
        if (!room) {
            this.sendError(ws, 'Player not in a room');
            return;
        }

        // Add server timestamp for authoritative timing
        const serverTimestamp = Date.now();
        const actionWithTiming = {
            ...eventData,
            serverTimestamp,
            clientTimestamp: eventData.timestamp || serverTimestamp
        };

        // Handle specific action types with validation
        switch (actionType) {
            case 'player_action':
                this.handleRealtimeAction(room, playerId, actionWithTiming);
                break;
                
            case 'game_state_update':
                this.handleGameStateUpdate(room, playerId, actionWithTiming);
                break;
                
            default:
                // Broadcast regular game action to all players in room
                this.roomManager.broadcastToRoom(room.code, {
                    type: actionType,
                    playerId: playerId,
                    data: actionWithTiming,
                    timestamp: serverTimestamp
                });
        }
    }

    handleRealtimeAction(room, playerId, actionData) {
        // Store action in room's action history for conflict resolution
        if (!room.actionHistory) {
            room.actionHistory = [];
        }

        room.actionHistory.push({
            playerId,
            action: actionData,
            timestamp: actionData.serverTimestamp
        });

        // Keep only recent actions (last 10 seconds)
        const cutoff = Date.now() - 10000;
        room.actionHistory = room.actionHistory.filter(
            entry => entry.timestamp > cutoff
        );

        // Handle special actions that need server authority
        console.log(`🔍 actionData:`, actionData);
        if (actionData.action === 'attack') {
            console.log(`🎯 Server received attack from ${playerId}`);
            this.handleServerAttack(room, playerId, actionData);
        } else {
            // Broadcast regular action to all other players
            this.roomManager.broadcastToRoom(room.code, {
                type: 'player_action',
                playerId: playerId,  
                data: actionData,
                timestamp: actionData.serverTimestamp
            }, playerId, true); // Exclude sender, silent broadcast
        }
    }

    handleServerAttack(room, attackerPlayerId, attackData) {
        console.log(`🗡️ Server processing attack from ${attackerPlayerId}`);
        
        // Initialize server health tracking if needed
        if (!room.serverHealth) {
            room.serverHealth = {};
            // Initialize all players in room with 100 health
            Object.keys(room.gameState.players).forEach(playerId => {
                room.serverHealth[playerId] = 100;
            });
        }
        
        const attackerPosition = attackData.position;
        const attackRange = 80;
        const attackDamage = 5 + Math.floor(Math.random() * 6); // 5-10 damage
        
        // Find all other players in the room and damage them (simplified for debugging)
        Object.keys(room.gameState.players).forEach(targetPlayerId => {
            if (targetPlayerId === attackerPlayerId) return; // Don't attack self
            
            // For debugging: always consider in range if they're in the same room
            if (room.serverHealth[targetPlayerId] > 0) {
                // Apply damage on server
                const oldHealth = room.serverHealth[targetPlayerId];
                const newHealth = Math.max(0, oldHealth - attackDamage);
                room.serverHealth[targetPlayerId] = newHealth;
                
                console.log(`💥 Server damage: ${attackerPlayerId} → ${targetPlayerId} (${attackDamage} dmg, ${oldHealth} → ${newHealth} hp)`);
                
                // Broadcast authoritative damage event
                this.roomManager.broadcastToRoom(room.code, {
                    type: 'server_damage',
                    data: {
                        attackerId: attackerPlayerId,
                        targetId: targetPlayerId,
                        damage: attackDamage,
                        newHealth: newHealth,
                        attackerPosition: attackerPosition
                    },
                    timestamp: Date.now()
                });
                
                // Check for game over
                if (newHealth <= 0) {
                    this.checkGameOver(room, targetPlayerId);
                }
            }
        });
        
        // Also broadcast the attack animation to all players
        this.roomManager.broadcastToRoom(room.code, {
            type: 'player_action',
            playerId: attackerPlayerId,
            data: attackData,
            timestamp: Date.now()
        }, null, true);
    }

    handleDamageEvent(room, attackerPlayerId, damageData) {
        const { targetPlayerId, damage, attackerPosition, targetPosition } = damageData;
        
        // Validate damage event
        if (!targetPlayerId || !damage || damage <= 0 || damage > 50) {
            console.warn(`Invalid damage event from ${attackerPlayerId}: damage=${damage}`);
            return;
        }

        // Validate that target exists in room
        if (!room.gameState.players[targetPlayerId]) {
            console.warn(`Damage target ${targetPlayerId} not found in room ${room.code}`);
            return;
        }

        // Validate distance (anti-cheat)
        if (attackerPosition && targetPosition) {
            const distance = Math.sqrt(
                Math.pow(attackerPosition.x - targetPosition.x, 2) + 
                Math.pow(attackerPosition.y - targetPosition.y, 2)
            );
            
            if (distance > 100) { // Max attack range + buffer
                console.warn(`Suspicious attack distance: ${distance} from ${attackerPlayerId}`);
                return;
            }
        }

        // Update server-side health tracking
        if (!room.serverState) {
            room.serverState = {
                playerHealth: {}
            };
        }

        // Initialize health if not tracked
        if (room.serverState.playerHealth[targetPlayerId] === undefined) {
            room.serverState.playerHealth[targetPlayerId] = 100;
        }

        // Apply damage server-side
        const oldHealth = room.serverState.playerHealth[targetPlayerId];
        const newHealth = Math.max(0, oldHealth - damage);
        room.serverState.playerHealth[targetPlayerId] = newHealth;

        console.log(`🎯 Server validated damage: ${attackerPlayerId} → ${targetPlayerId} (${damage} dmg, ${oldHealth} → ${newHealth} hp)`);

        // Broadcast validated damage event to all players
        this.roomManager.broadcastToRoom(room.code, {
            type: 'player_action',
            playerId: attackerPlayerId,
            data: {
                ...damageData,
                validatedHealth: newHealth,
                serverValidated: true
            },
            timestamp: Date.now()
        });

        // Check for game over condition
        if (newHealth <= 0) {
            this.checkGameOver(room, targetPlayerId);
        }
    }

    checkGameOver(room, defeatedPlayerId) {
        // Ensure serverHealth is initialized for all players
        if (!room.serverHealth) {
            room.serverHealth = {};
        }
        
        // Check ONLY players who are actually being tracked in serverHealth
        const alivePlayers = Object.keys(room.serverHealth).filter(playerId => {
            const health = room.serverHealth[playerId];
            return health > 0;
        });

        if (alivePlayers.length <= 1) {
            const winner = alivePlayers[0] || null;
            
            console.log(`🏆 Game over in room ${room.code}. Winner: ${winner || 'Draw'}`);
            
            // Update room state
            room.gameState.phase = 'results';
            room.gameState.winner = winner;

            // Broadcast game over
            this.roomManager.broadcastToRoom(room.code, {
                type: 'game_over',
                playerId: 'server',
                data: {
                    winner: winner,
                    defeatedPlayer: defeatedPlayerId,
                    finalHealth: room.serverHealth,
                    gameStats: {
                        roomCode: room.code,
                        duration: Date.now() - room.combatStartTime,
                        playerCount: Object.keys(room.gameState.players).length
                    }
                },
                timestamp: Date.now()
            });
        }
    }

    handleGameStateUpdate(room, playerId, stateData) {
        // Merge state update into room's authoritative state
        if (!room.authoritativeState) {
            room.authoritativeState = {
                version: 0,
                fighters: {},
                lastUpdate: Date.now()
            };
        }

        // Only accept newer state versions
        if (stateData.version > room.authoritativeState.version) {
            room.authoritativeState = {
                ...room.authoritativeState,
                ...stateData,
                version: stateData.version,
                lastUpdate: Date.now()
            };

            // Broadcast authoritative state to all players
            this.roomManager.broadcastToRoom(room.code, {
                type: 'game_state_update',
                playerId: 'server',
                data: room.authoritativeState,
                timestamp: Date.now()
            });
        }
    }

    sendToPlayer(ws, event) {
        if (ws.readyState === 1) { // WebSocket.OPEN = 1
            try {
                ws.send(JSON.stringify(event));
            } catch (error) {
                console.error('Failed to send message to player:', error);
            }
        }
    }

    sendError(ws, errorMessage) {
        this.sendToPlayer(ws, {
            type: 'error',
            playerId: ws.playerId,
            data: { message: errorMessage },
            timestamp: Date.now()
        });
    }

    generatePlayerId() {
        return 'player_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
    }

    handleRestartGame(ws, playerId) {
        const room = this.roomManager.getRoomByPlayer(playerId);
        if (!room) {
            this.sendError(ws, 'Player not in a room');
            return;
        }

        console.log(`🔄 Restarting game in room ${room.code}`);
        
        // Reset room state
        room.gameState.phase = 'drawing';
        room.gameState.winner = null;
        room.combatStartTime = null;
        
        // Reset server health tracking
        room.serverHealth = {};
        
        // Reset all players to not ready
        Object.keys(room.gameState.players).forEach(playerId => {
            if (room.gameState.players[playerId]) {
                room.gameState.players[playerId].ready = false;
                room.gameState.players[playerId].fighterImage = null;
            }
        });
        
        // Broadcast restart to all players
        this.roomManager.broadcastToRoom(room.code, {
            type: 'game_restart',
            playerId: 'server',
            data: {
                phase: 'drawing',
                gameState: room.gameState
            },
            timestamp: Date.now()
        });
    }

    // Get server statistics
    getStats() {
        return {
            connectedPlayers: this.playerConnections.size,
            activeRooms: this.roomManager.rooms.size,
            totalPlayersInRooms: Array.from(this.roomManager.rooms.values())
                .reduce((total, room) => total + room.players.size, 0)
        };
    }
}

export default WebSocketServer;
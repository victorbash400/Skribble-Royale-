class GameManager {
    constructor() {
        this.currentScene = 'MenuScene';
        this.socket = null;
        this.roomCode = null;
        this.playerId = this.generatePlayerId();
        this.game = null;
        this.gameState = {
            phase: 'menu',
            roomCode: null,
            players: {},
            winner: null
        };
        this.connectionStatus = 'disconnected';
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    generatePlayerId() {
        return 'player_' + Math.random().toString(36).substring(2, 11);
    }

    initializeGame() {
        console.log('GameManager initialized');
        this.connectWebSocket();
    }

    connectWebSocket() {
        try {
            // Connect to WebSocket server (will be implemented when server is ready)
            const wsUrl = 'ws://localhost:8080';
            this.socket = new WebSocket(wsUrl);
            
            this.socket.onopen = () => {
                console.log('WebSocket connected');
                this.connectionStatus = 'connected';
                this.reconnectAttempts = 0;
                this.notifyScenes('connection_status', { status: 'connected' });
            };

            this.socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    
                    // Only log important messages
                    if (data.type === 'game_over' || data.type === 'server_damage') {
                        console.log('📨 WebSocket received:', data.type);
                    }
                    
                    // Special handling for game_over
                    if (data.type === 'game_over') {
                        console.log('🎯 Game over message received from server');
                    }
                    
                    this.handleServerMessage(data);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                    console.error('Raw message data:', event.data);
                }
            };

            this.socket.onclose = () => {
                console.log('WebSocket disconnected');
                this.connectionStatus = 'disconnected';
                this.notifyScenes('connection_status', { status: 'disconnected' });
                this.attemptReconnect();
            };

            this.socket.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.connectionStatus = 'error';
                this.notifyScenes('connection_status', { status: 'error' });
            };

        } catch (error) {
            console.error('Failed to initialize WebSocket:', error);
            this.connectionStatus = 'error';
        }
    }

    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
            console.log(`Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
            
            setTimeout(() => {
                this.connectWebSocket();
            }, delay);
        } else {
            console.error('Max reconnection attempts reached');
            this.notifyScenes('connection_failed', { attempts: this.reconnectAttempts });
        }
    }

    handleServerMessage(data) {
        // Only log game_over and other important messages, not all messages
        if (data.type === 'game_over' || data.type === 'game_restart') {
            console.log('🔥 IMPORTANT: Received server message:', data);
        }
        
        switch (data.type) {
            case 'room_created':
                this.roomCode = data.data.roomCode;
                this.gameState.roomCode = data.data.roomCode;
                this.notifyScenes('room_created', data);
                break;
                
            case 'room_joined':
                this.roomCode = data.data.roomCode;
                this.gameState.roomCode = data.data.roomCode;
                this.gameState.players = data.data.players;
                this.notifyScenes('room_joined', data);
                break;
                
            case 'player_joined':
                // Update player list
                if (data.data.newPlayerId && data.data.newPlayerId !== this.playerId) {
                    console.log(`Player ${data.data.newPlayerId} joined the room`);
                }
                this.notifyScenes('player_joined', data);
                break;
                
            case 'player_action':
                // Handle real-time player actions
                this.handleNetworkPlayerAction(data.data);
                // Also notify the current scene
                this.notifyScenes('player_action', data);
                break;
                
            case 'game_state_update':
                // Handle game state synchronization
                this.updateGameStateFromNetwork(data.data);
                break;
                
            case 'connection_established':
                this.playerId = data.data.playerId;
                this.connectionStatus = 'connected';
                this.reconnectAttempts = 0;
                console.log(`Connected as player: ${this.playerId}`);
                this.notifyScenes('connection_established', data);
                break;
                
            case 'player_left':
                if (data.data.playerId) {
                    delete this.gameState.players[data.data.playerId];
                    console.log(`Player ${data.data.playerId} left the room`);
                }
                this.notifyScenes('player_left', data);
                break;
                
            case 'phase_change':
                console.log('GameManager received phase_change:', data);
                this.gameState.phase = data.data.phase;
                // Update game state with server data if available
                if (data.data.gameState) {
                    this.gameState = { ...this.gameState, ...data.data.gameState };
                    console.log('Updated game state:', this.gameState);
                }
                this.handlePhaseChange(data.data.phase);
                break;
                
            case 'error':
                console.error('Server error:', data.data.message);
                this.notifyScenes('server_error', data);
                break;
            case 'server_damage':
                console.log('GameManager received server_damage:', data);
                this.notifyScenes('server_damage', data);
                break;
                
            case 'game_restart':
                console.log('GameManager received game_restart:', data);
                this.gameState = { ...this.gameState, ...data.data.gameState };
                this.handlePhaseChange(data.data.phase);
                break;
                
            case 'game_over':
                console.log('🎯 GameManager received game_over:', data);
                this.notifyScenes('game_over', data);
                break;
                
            default:
                this.notifyScenes(data.type, data);
        }
    }

    handlePhaseChange(phase) {
        console.log(`Game phase changed to: ${phase}`, 'Current scene:', this.currentScene);
        
        switch (phase) {
            case 'drawing':
                this.switchScene('DrawingScene');
                break;
            case 'combat':
                this.switchScene('CombatScene');
                break;
            case 'results':
                this.switchScene('ResultsScene');
                break;
            case 'menu':
                this.switchScene('MenuScene');
                break;
        }
    }

    switchScene(sceneName) {
        if (!this.game) {
            console.error('Game instance not available for scene switching');
            return;
        }

        console.log(`Switching from ${this.currentScene} to ${sceneName}`);
        
        try {
            // Stop current scene if it exists
            if (this.currentScene && this.game.scene.isActive(this.currentScene)) {
                this.game.scene.stop(this.currentScene);
            }
            
            // Start new scene
            this.game.scene.start(sceneName);
            this.currentScene = sceneName;
            
            console.log(`Successfully switched to ${sceneName}`);
        } catch (error) {
            console.error(`Error switching to scene ${sceneName}:`, error);
        }
    }

    notifyScenes(eventType, data) {
        if (!this.game) {
            console.log('❌ notifyScenes: No game instance');
            return;
        }
        
        // Only log important events
        if (eventType === 'game_over' || eventType === 'server_damage') {
            console.log(`📢 notifyScenes: ${eventType} to scene ${this.currentScene}`);
        }
        
        // Notify the current active scene about the event
        const activeScene = this.game.scene.getScene(this.currentScene);
        
        if (!activeScene) {
            console.log(`❌ notifyScenes: No active scene found for ${this.currentScene}`);
            return;
        }
        
        if (typeof activeScene.handleGameManagerEvent !== 'function') {
            console.log(`❌ notifyScenes: Scene ${this.currentScene} has no handleGameManagerEvent function`);
            return;
        }
        
        // Only log important events
        if (eventType === 'game_over' || eventType === 'server_damage') {
            console.log(`✅ notifyScenes: Calling handleGameManagerEvent on ${this.currentScene}`);
        }
        activeScene.handleGameManagerEvent(eventType, data);
    }

    async joinRoom(code) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            console.error('WebSocket not connected');
            return false;
        }

        try {
            this.sendGameEvent({
                type: 'join_room',
                playerId: this.playerId,
                data: { roomCode: code }
            });
            return true;
        } catch (error) {
            console.error('Error joining room:', error);
            return false;
        }
    }

    async createRoom() {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            console.error('WebSocket not connected');
            return null;
        }

        try {
            this.sendGameEvent({
                type: 'create_room',
                playerId: this.playerId,
                data: {}
            });
            return true; // Room code will be received via WebSocket message
        } catch (error) {
            console.error('Error creating room:', error);
            return null;
        }
    }

    sendGameEvent(event) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            console.warn('Cannot send event - WebSocket not connected:', event);
            return;
        }

        try {
            const message = {
                ...event,
                timestamp: Date.now(),
                playerId: this.playerId
            };
            
            this.socket.send(JSON.stringify(message));
            console.log('Sent game event:', message);
        } catch (error) {
            console.error('Error sending game event:', error);
        }
    }

    getGameState() {
        return { ...this.gameState };
    }

    getConnectionStatus() {
        return this.connectionStatus;
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        this.connectionStatus = 'disconnected';
    }

    // Test method to verify GameManager functionality
    testSceneSwitching() {
        console.log('Testing scene switching functionality...');
        const scenes = ['MenuScene', 'DrawingScene', 'CombatScene', 'ResultsScene'];
        let currentIndex = 0;
        
        const switchNext = () => {
            if (currentIndex < scenes.length) {
                console.log(`Switching to ${scenes[currentIndex]}`);
                this.switchScene(scenes[currentIndex]);
                currentIndex++;
                setTimeout(switchNext, 1000);
            } else {
                console.log('Scene switching test completed!');
            }
        };
        
        switchNext();
    }

    /**
     * Send player action to other players in real-time
     * @param {object} actionData - Action data to send
     */
    sendPlayerAction(actionData) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            console.warn('Cannot send player action: WebSocket not connected');
            return false;
        }

        const message = {
            type: 'player_action',
            playerId: this.playerId,
            data: {
                ...actionData,
                timestamp: Date.now(),
                sequenceId: this.generateSequenceId()
            }
        };

        try {
            this.socket.send(JSON.stringify(message));
            return true;
        } catch (error) {
            console.error('Error sending player action:', error);
            return false;
        }
    }

    /**
     * Broadcast game state to all players in room
     * @param {object} gameStateUpdate - Game state data to broadcast
     */
    broadcastGameState(gameStateUpdate) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            console.warn('Cannot broadcast game state: WebSocket not connected');
            return false;
        }

        const message = {
            type: 'game_state_update',
            playerId: this.playerId,
            data: {
                ...gameStateUpdate,
                timestamp: Date.now(),
                version: this.incrementStateVersion()
            }
        };

        try {
            this.socket.send(JSON.stringify(message));
            return true;
        } catch (error) {
            console.error('Error broadcasting game state:', error);
            return false;
        }
    }

    /**
     * Update local game state with network data
     * @param {object} networkState - Game state from network
     */
    updateGameStateFromNetwork(networkState) {
        if (!networkState || !networkState.version) return;

        // Only apply newer states to prevent rollback
        if (networkState.version > (this.gameState.stateVersion || 0)) {
            console.log(`Applying network state update v${networkState.version}`);
            
            // Merge network state with local state
            this.gameState = {
                ...this.gameState,
                ...networkState,
                stateVersion: networkState.version,
                lastNetworkUpdate: Date.now()
            };

            // Notify current scene of state update
            this.notifyScenes('game_state_update', this.gameState);
        }
    }

    /**
     * Handle incoming player actions from network
     * @param {object} actionData - Player action data
     */
    handleNetworkPlayerAction(actionData) {
        const { playerId, action, timestamp, sequenceId } = actionData;
        
        // Don't process our own actions
        if (playerId === this.playerId) return;

        // Add lag compensation
        const networkLatency = Date.now() - timestamp;
        const compensatedData = this.applyLagCompensation(actionData, networkLatency);

        // Only log important actions
        if (action === 'attack' || action === 'damage') {
            console.log(`Processing network action from ${playerId}: ${action} (latency: ${networkLatency}ms)`);
        }

        // Notify current scene
        this.notifyScenes('player_action', compensatedData);

        // Store for conflict resolution
        this.storeNetworkAction(compensatedData);
    }

    /**
     * Apply lag compensation to network actions
     * @param {object} actionData - Original action data
     * @param {number} latency - Network latency in ms
     * @returns {object} Compensated action data
     */
    applyLagCompensation(actionData, latency) {
        const compensated = { ...actionData };

        // For movement actions, predict position based on latency
        if (actionData.action === 'move' && actionData.position && actionData.direction) {
            const moveSpeed = 150; // pixels per second
            const compensationDistance = (moveSpeed * latency / 1000) * actionData.direction;
            
            compensated.position = {
                x: actionData.position.x + compensationDistance,
                y: actionData.position.y
            };

        }

        return compensated;
    }

    /**
     * Handle conflicts between simultaneous actions
     * @param {object} localAction - Local player action
     * @param {object} networkAction - Network player action
     * @returns {object} Resolved action
     */
    resolveActionConflict(localAction, networkAction) {
        // Server timestamp takes precedence
        if (networkAction.serverTimestamp && localAction.timestamp) {
            if (networkAction.serverTimestamp < localAction.timestamp) {
                console.log('Network action has priority (earlier server timestamp)');
                return networkAction;
            }
        }

        // For simultaneous attacks, player with lower ID wins
        if (localAction.action === 'attack' && networkAction.action === 'attack') {
            const localPlayerId = this.playerId;
            const networkPlayerId = networkAction.playerId;
            
            if (localPlayerId < networkPlayerId) {
                console.log('Local attack wins conflict resolution');
                return localAction;
            } else {
                console.log('Network attack wins conflict resolution');
                return networkAction;
            }
        }

        // Default to network action for simplicity
        return networkAction;
    }

    /**
     * Store network actions for conflict resolution
     * @param {object} actionData - Action to store
     */
    storeNetworkAction(actionData) {
        if (!this.networkActionHistory) {
            this.networkActionHistory = [];
        }

        this.networkActionHistory.push({
            ...actionData,
            receivedAt: Date.now()
        });

        // Keep only recent actions (last 5 seconds)
        const cutoff = Date.now() - 5000;
        this.networkActionHistory = this.networkActionHistory.filter(
            action => action.receivedAt > cutoff
        );
    }

    /**
     * Generate unique sequence ID for actions
     * @returns {string} Sequence ID
     */
    generateSequenceId() {
        if (!this.sequenceCounter) {
            this.sequenceCounter = 0;
        }
        return `${this.playerId}_${++this.sequenceCounter}_${Date.now()}`;
    }

    /**
     * Increment state version for conflict resolution
     * @returns {number} New state version
     */
    incrementStateVersion() {
        if (!this.gameState.stateVersion) {
            this.gameState.stateVersion = 0;
        }
        return ++this.gameState.stateVersion;
    }

    /**
     * Get network statistics for debugging
     * @returns {object} Network stats
     */
    getNetworkStats() {
        return {
            connected: this.socket && this.socket.readyState === WebSocket.OPEN,
            latency: this.getAverageLatency(),
            actionsHistory: this.networkActionHistory ? this.networkActionHistory.length : 0,
            stateVersion: this.gameState.stateVersion || 0,
            lastNetworkUpdate: this.gameState.lastNetworkUpdate || null
        };
    }

    /**
     * Calculate average network latency
     * @returns {number} Average latency in ms
     */
    getAverageLatency() {
        if (!this.networkActionHistory || this.networkActionHistory.length === 0) {
            return 0;
        }

        const recent = this.networkActionHistory.slice(-10); // Last 10 actions
        const latencies = recent.map(action => action.receivedAt - action.timestamp);
        return latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
    }

    // Method to get current scene info for debugging
    getSceneInfo() {
        return {
            currentScene: this.currentScene,
            gameState: this.gameState,
            connectionStatus: this.connectionStatus,
            playerId: this.playerId,
            roomCode: this.roomCode,
            networkStats: this.getNetworkStats()
        };
    }
}

export default GameManager;
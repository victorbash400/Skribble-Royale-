class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
        this.gameManager = null;
        this.roomCodeInput = null;
        this.roomCodeDisplay = null;
        this.statusMessage = null;
        this.isWaitingForResponse = false;
        this.isTransitioning = false;
    }

    preload() {
        // Assets will be loaded here in future tasks
    }

    create() {
        console.log('MenuScene created');
        
        // Get reference to GameManager
        this.gameManager = window.gameManager;
        
        // Title
        this.add.text(400, 80, 'Scribble Royale', {
            fontSize: '48px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(400, 130, 'Draw your fighter and battle!', {
            fontSize: '18px',
            fill: '#cccccc',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Connection status display
        this.connectionText = this.add.text(400, 170, 'Connecting...', {
            fontSize: '14px',
            fill: '#ffff00',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.createRoomUI();
        this.updateConnectionStatus();
    }

    createRoomUI() {
        // Create Room Section
        this.add.text(300, 220, 'Create New Room', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const createButton = this.add.rectangle(300, 260, 180, 40, 0x4CAF50)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.createRoom())
            .on('pointerover', () => createButton.setFillStyle(0x45a049))
            .on('pointerout', () => createButton.setFillStyle(0x4CAF50));

        this.add.text(300, 260, 'Create Room', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Join Room Section
        this.add.text(500, 220, 'Join Existing Room', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Room code input field (HTML element)
        this.createRoomCodeInput();

        const joinButton = this.add.rectangle(500, 300, 180, 40, 0x2196F3)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.joinRoom())
            .on('pointerover', () => joinButton.setFillStyle(0x1976D2))
            .on('pointerout', () => joinButton.setFillStyle(0x2196F3));

        this.add.text(500, 300, 'Join Room', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Room code display (for created rooms)
        this.roomCodeDisplay = this.add.text(400, 360, '', {
            fontSize: '18px',
            fill: '#00ff00',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Status message
        this.statusMessage = this.add.text(400, 400, '', {
            fontSize: '14px',
            fill: '#ffff00',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Instructions
        this.add.text(400, 450, 'Share the room code with your opponent to start playing!', {
            fontSize: '12px',
            fill: '#888888',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
    }

    createRoomCodeInput() {
        // Create HTML input element for room code
        const inputElement = document.createElement('input');
        inputElement.type = 'text';
        inputElement.placeholder = 'Enter room code';
        inputElement.maxLength = 6;
        inputElement.style.position = 'absolute';
        inputElement.style.left = '420px';
        inputElement.style.top = '265px';
        inputElement.style.width = '160px';
        inputElement.style.height = '30px';
        inputElement.style.fontSize = '16px';
        inputElement.style.textAlign = 'center';
        inputElement.style.backgroundColor = '#333333';
        inputElement.style.color = '#ffffff';
        inputElement.style.border = '2px solid #666666';
        inputElement.style.borderRadius = '4px';
        inputElement.style.outline = 'none';

        // Add event listeners
        inputElement.addEventListener('input', (e) => {
            // Convert to uppercase and limit to alphanumeric
            e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        });

        inputElement.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.joinRoom();
            }
        });

        // Add paste support
        inputElement.addEventListener('paste', (e) => {
            e.preventDefault();
            const paste = (e.clipboardData || window.clipboardData).getData('text');
            const cleaned = paste.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6);
            e.target.value = cleaned;
        });

        // Add focus styling
        inputElement.addEventListener('focus', () => {
            inputElement.style.borderColor = '#4CAF50';
        });

        inputElement.addEventListener('blur', () => {
            inputElement.style.borderColor = '#666666';
        });

        document.body.appendChild(inputElement);
        this.roomCodeInput = inputElement;

        // Clean up input when scene is destroyed
        this.events.on('destroy', () => {
            if (this.roomCodeInput && this.roomCodeInput.parentNode) {
                this.roomCodeInput.parentNode.removeChild(this.roomCodeInput);
            }
        });
    }

    async createRoom() {
        if (this.isWaitingForResponse) {
            console.log('Already waiting for room creation response, ignoring');
            return;
        }
        
        if (!this.gameManager || this.gameManager.getConnectionStatus() !== 'connected') {
            this.showStatusMessage('Not connected to server', '#ff0000');
            return;
        }

        this.isWaitingForResponse = true;
        this.showStatusMessage('Creating room...', '#ffff00');

        // Set timeout for room creation
        const timeoutId = setTimeout(() => {
            if (this.isWaitingForResponse) {
                this.showStatusMessage('Room creation timed out', '#ff0000');
                this.isWaitingForResponse = false;
            }
        }, 10000); // 10 second timeout

        try {
            const success = await this.gameManager.createRoom();
            clearTimeout(timeoutId);
            
            if (!success) {
                this.showStatusMessage('Failed to create room', '#ff0000');
                this.isWaitingForResponse = false;
            }
            // Success will be handled by handleGameManagerEvent
        } catch (error) {
            clearTimeout(timeoutId);
            console.error('Error creating room:', error);
            this.showStatusMessage('Error creating room', '#ff0000');
            this.isWaitingForResponse = false;
        }
    }

    async joinRoom() {
        if (this.isWaitingForResponse) {
            console.log('Already waiting for room join response, ignoring');
            return;
        }
        
        if (!this.gameManager || this.gameManager.getConnectionStatus() !== 'connected') {
            this.showStatusMessage('Not connected to server', '#ff0000');
            return;
        }

        const roomCode = this.roomCodeInput ? this.roomCodeInput.value.trim() : '';
        
        if (!this.validateRoomCode(roomCode)) {
            this.showStatusMessage('Please enter a valid 6-character room code', '#ff0000');
            return;
        }

        this.isWaitingForResponse = true;
        this.showStatusMessage('Joining room...', '#ffff00');

        // Set timeout for room joining
        const timeoutId = setTimeout(() => {
            if (this.isWaitingForResponse) {
                this.showStatusMessage('Room join timed out', '#ff0000');
                this.isWaitingForResponse = false;
            }
        }, 10000); // 10 second timeout

        try {
            const success = await this.gameManager.joinRoom(roomCode);
            clearTimeout(timeoutId);
            
            if (!success) {
                this.showStatusMessage('Failed to join room', '#ff0000');
                this.isWaitingForResponse = false;
            }
            // Success will be handled by handleGameManagerEvent
        } catch (error) {
            clearTimeout(timeoutId);
            console.error('Error joining room:', error);
            this.showStatusMessage('Error joining room', '#ff0000');
            this.isWaitingForResponse = false;
        }
    }

    validateRoomCode(code) {
        // Room code should be exactly 6 characters, alphanumeric
        return code && code.length === 6 && /^[A-Z0-9]{6}$/.test(code);
    }

    showStatusMessage(message, color = '#ffff00') {
        if (this.statusMessage) {
            this.statusMessage.setText(message);
            this.statusMessage.setFill(color);
        }
    }

    handleGameManagerEvent(eventType, data) {
        console.log(`MenuScene received event: ${eventType}`, data);
        
        switch (eventType) {
            case 'connection_status':
                this.updateConnectionStatus();
                break;
            case 'room_created':
                this.isWaitingForResponse = false;
                const createdRoomCode = data.data?.roomCode || data.roomCode;
                this.roomCodeDisplay.setText(`Room Code: ${createdRoomCode}`);
                this.showStatusMessage('Room created! Starting drawing phase...', '#00ff00');
                console.log(`Room created and joined: ${createdRoomCode}`);
                // Automatically transition to drawing scene
                setTimeout(() => {
                    if (this.gameManager && this.gameManager.currentScene === 'MenuScene' && !this.isTransitioning) {
                        this.isTransitioning = true;
                        this.gameManager.handlePhaseChange('drawing');
                    }
                }, 1500);
                break;
            case 'room_joined':
                this.isWaitingForResponse = false;
                const joinedRoomCode = data.data?.roomCode || data.roomCode;
                this.roomCodeDisplay.setText(`Joined Room: ${joinedRoomCode}`);
                this.showStatusMessage('Successfully joined room! Starting drawing phase...', '#00ff00');
                console.log(`Joined room: ${joinedRoomCode}`);
                // Automatically transition to drawing scene
                setTimeout(() => {
                    if (this.gameManager && this.gameManager.currentScene === 'MenuScene' && !this.isTransitioning) {
                        this.isTransitioning = true;
                        this.gameManager.handlePhaseChange('drawing');
                    }
                }, 1500);
                break;
            case 'player_joined':
                if (data.playerId !== this.gameManager.playerId) {
                    this.showStatusMessage('Opponent joined! Starting game...', '#00ff00');
                    // Auto-start game after short delay
                    setTimeout(() => {
                        if (this.gameManager && this.gameManager.currentScene === 'MenuScene') {
                            this.gameManager.handlePhaseChange('drawing');
                        }
                    }, 2000);
                }
                break;
            case 'player_left':
                if (data.playerId !== this.gameManager.playerId) {
                    this.showStatusMessage('Opponent left the room', '#ff8800');
                }
                break;
            case 'connection_failed':
                this.connectionText.setText('Connection failed - Please refresh');
                this.connectionText.setFill('#ff0000');
                this.showStatusMessage('Connection lost', '#ff0000');
                this.isWaitingForResponse = false;
                break;
            case 'room_error':
                this.isWaitingForResponse = false;
                this.showStatusMessage(data.message || 'Room error occurred', '#ff0000');
                break;
            case 'room_full':
                this.isWaitingForResponse = false;
                this.showStatusMessage('Room is full', '#ff0000');
                break;
            case 'room_not_found':
                this.isWaitingForResponse = false;
                this.showStatusMessage('Room not found', '#ff0000');
                break;
        }
    }

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

    update() {
        // Menu update logic will be added in future tasks
    }
}

export default MenuScene;
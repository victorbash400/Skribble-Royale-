class ResultsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ResultsScene' });
        this.gameManager = null;
        this.gameResult = null;
        this.playAgainButton = null;
        this.backToMenuButton = null;
    }

    preload() {
        // Results assets will be loaded here in future tasks
    }

    create() {
        console.log('ResultsScene created');
        
        // Get reference to GameManager
        this.gameManager = window.gameManager;
        
        // Get game result from game state
        const gameState = this.gameManager ? this.gameManager.getGameState() : null;
        this.gameResult = gameState ? gameState.gameResult : null;
        
        // Create background
        this.createBackground();
        
        // Create results display
        this.createResultsDisplay();
        
        // Create player stats
        this.createPlayerStats();
        
        // Create action buttons
        this.createActionButtons();
        
        // Create room info
        this.createRoomInfo();
    }

    createBackground() {
        // Paper-like background that fills the screen
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        const bgRect = this.add.rectangle(centerX, centerY, width, height, 0xf8f8f8);
        
        // Add paper texture with subtle dots instead of stars
        for (let i = 0; i < 30; i++) {
            const dot = this.add.circle(
                Math.random() * width,
                Math.random() * height,
                1,
                0xd0d0d0,
                0.3
            );
        }
        
        // Add some doodly decorative elements
        this.drawDoodleFrame(centerX, centerY, width * 0.8, height * 0.8);
        
        // Add a distinctive element to verify this version is loading
        this.add.text(centerX, 20, '🎨 DOODLE RESULTS v2.0', {
            fontSize: '14px',
            fill: '#e74c3c',
            fontFamily: 'Comic Sans MS, cursive, sans-serif',
            fontStyle: 'bold'
        }).setOrigin(0.5);
    }

    drawDoodleFrame(centerX, centerY, frameWidth, frameHeight) {
        // Draw a hand-drawn style frame around the results
        const halfWidth = frameWidth / 2;
        const halfHeight = frameHeight / 2;
        
        // Top line (slightly wavy)
        for (let i = 0; i < 10; i++) {
            const x1 = centerX - halfWidth + (i * frameWidth / 10);
            const x2 = centerX - halfWidth + ((i + 1) * frameWidth / 10);
            const y = centerY - halfHeight + Math.sin(i) * 2;
            this.add.line(x1, y, 0, 0, x2 - x1, 0, 0x2c3e50).setLineWidth(2, 2);
        }
        
        // Bottom line
        for (let i = 0; i < 10; i++) {
            const x1 = centerX - halfWidth + (i * frameWidth / 10);
            const x2 = centerX - halfWidth + ((i + 1) * frameWidth / 10);
            const y = centerY + halfHeight + Math.sin(i + 5) * 2;
            this.add.line(x1, y, 0, 0, x2 - x1, 0, 0x2c3e50).setLineWidth(2, 2);
        }
        
        // Left and right lines
        for (let i = 0; i < 8; i++) {
            const y1 = centerY - halfHeight + (i * frameHeight / 8);
            const y2 = centerY - halfHeight + ((i + 1) * frameHeight / 8);
            const xLeft = centerX - halfWidth + Math.cos(i) * 2;
            const xRight = centerX + halfWidth + Math.cos(i + 3) * 2;
            
            this.add.line(xLeft, y1, 0, 0, 0, y2 - y1, 0x2c3e50).setLineWidth(2, 2);
            this.add.line(xRight, y1, 0, 0, 0, y2 - y1, 0x2c3e50).setLineWidth(2, 2);
        }
    }

    createResultsDisplay() {
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;
        
        if (!this.gameResult) {
            this.add.text(centerX, centerY - 100, 'No Game Results Available', {
                fontSize: '32px',
                fill: '#2c3e50',
                fontFamily: 'Comic Sans MS, cursive, sans-serif',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            return;
        }

        // Main result title with doodly style
        let titleText, titleColor, emoji;
        if (this.gameResult.isDraw) {
            titleText = 'It\'s a Draw!';
            titleColor = '#f39c12';
            emoji = '🤝';
        } else if (this.gameResult.isLocalPlayerWinner) {
            titleText = 'You Won!';
            titleColor = '#27ae60';
            emoji = '🎉';
        } else {
            titleText = 'You Lost';
            titleColor = '#e74c3c';
            emoji = '😅';
        }

        // Add emoji above title
        this.add.text(centerX, centerY - 150, emoji, {
            fontSize: '64px'
        }).setOrigin(0.5);

        const mainTitle = this.add.text(centerX, centerY - 80, titleText, {
            fontSize: '48px',
            fill: titleColor,
            fontFamily: 'Comic Sans MS, cursive, sans-serif',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Add doodly underline
        this.add.line(centerX, centerY - 50, -120, 0, 120, 0, titleColor)
            .setLineWidth(4, 4);

        // Subtitle with winner info
        if (!this.gameResult.isDraw && this.gameResult.winnerName) {
            const subtitle = this.gameResult.isLocalPlayerWinner 
                ? 'You emerged victorious!' 
                : `${this.gameResult.winnerName} wins the battle!`;
                
            this.add.text(centerX, centerY - 20, subtitle, {
                fontSize: '20px',
                fill: '#555555',
                fontFamily: 'Comic Sans MS, cursive, sans-serif',
                fontStyle: 'italic'
            }).setOrigin(0.5);
        } else if (this.gameResult.isDraw) {
            this.add.text(centerX, centerY - 20, 'Both fighters fell in combat!', {
                fontSize: '20px',
                fill: '#555555',
                fontFamily: 'Comic Sans MS, cursive, sans-serif',
                fontStyle: 'italic'
            }).setOrigin(0.5);
        }

        // Game duration in a paper note style
        const durationMinutes = Math.floor(this.gameResult.gameDuration / 60000);
        const durationSeconds = Math.floor((this.gameResult.gameDuration % 60000) / 1000);
        const durationText = durationMinutes > 0 
            ? `${durationMinutes}m ${durationSeconds}s`
            : `${durationSeconds}s`;

        // Paper note background for duration
        const durationNote = this.add.rectangle(centerX, centerY + 20, 200, 30, 0xfff9c4);
        durationNote.setStrokeStyle(2, 0xe0e0e0);
        durationNote.angle = 1;

        this.add.text(centerX, centerY + 20, `⏱️ Battle Time: ${durationText}`, {
            fontSize: '16px',
            fill: '#2c3e50',
            fontFamily: 'Comic Sans MS, cursive, sans-serif',
            fontStyle: 'bold'
        }).setOrigin(0.5);
    }

    createPlayerStats() {
        if (!this.gameResult || !this.gameResult.finalStats) return;

        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;

        // Stats container with doodly header
        const statsY = centerY + 80;
        this.add.text(centerX, statsY - 30, '📊 Battle Report', {
            fontSize: '22px',
            fill: '#2c3e50',
            fontFamily: 'Comic Sans MS, cursive, sans-serif',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Player stats with doodly styling
        const playerIds = Object.keys(this.gameResult.finalStats);
        const playerCount = playerIds.length;
        const spacing = playerCount > 1 ? 300 : 0;
        const startX = centerX - (spacing * (playerCount - 1)) / 2;

        playerIds.forEach((playerId, index) => {
            const stats = this.gameResult.finalStats[playerId];
            const x = startX + (index * spacing);
            const isLocalPlayer = playerId === this.gameManager.playerId;
            const isWinner = playerId === this.gameResult.winnerId;

            // Player card background - paper style
            const cardColor = isWinner ? 0xd5f4e6 : (isLocalPlayer ? 0xe8f4f8 : 0xf8e8e8);
            const playerCard = this.add.rectangle(x, statsY + 40, 250, 120, cardColor);
            playerCard.setStrokeStyle(3, 0x2c3e50);
            playerCard.angle = Math.random() * 2 - 1; // Slight tilt

            // Player name with doodly font
            const playerName = isLocalPlayer ? 'You 😊' : `Player ${playerId.slice(-3)} 🎮`;
            const nameColor = isWinner ? '#27ae60' : (isLocalPlayer ? '#3498db' : '#2c3e50');
            
            this.add.text(x, statsY + 10, playerName, {
                fontSize: '18px',
                fill: nameColor,
                fontFamily: 'Comic Sans MS, cursive, sans-serif',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            // Health bar visual - doodly style
            const healthBarBg = this.add.rectangle(x, statsY + 35, 200, 15, 0xecf0f1);
            healthBarBg.setStrokeStyle(2, 0x2c3e50);
            
            const healthWidth = (stats.healthPercentage / 100) * 190;
            const healthColor = stats.healthPercentage > 60 ? 0x27ae60 : 
                               (stats.healthPercentage > 30 ? 0xf39c12 : 0xe74c3c);
            
            if (healthWidth > 0) {
                const healthBar = this.add.rectangle(x - 95 + healthWidth/2, statsY + 35, healthWidth, 11, healthColor);
            }

            // Health text with doodly font
            this.add.text(x, statsY + 55, `❤️ ${stats.finalHealth}/${stats.maxHealth} HP`, {
                fontSize: '14px',
                fill: '#2c3e50',
                fontFamily: 'Comic Sans MS, cursive, sans-serif',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            // Status with emojis
            const statusText = stats.survived ? '🎉 SURVIVED' : '💀 DEFEATED';
            const statusColor = stats.survived ? '#27ae60' : '#e74c3c';
            
            this.add.text(x, statsY + 75, statusText, {
                fontSize: '12px',
                fill: statusColor,
                fontFamily: 'Comic Sans MS, cursive, sans-serif',
                fontStyle: 'bold'
            }).setOrigin(0.5);
        });
    }

    createActionButtons() {
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;
        const buttonY = centerY + 180;
        
        // Play Again button with doodly style
        this.playAgainButton = this.createDoodleButton(centerX - 100, buttonY, '🔄 Play Again', 0x27ae60, () => {
            this.handlePlayAgain();
        });

        // Back to Menu button with doodly style
        this.backToMenuButton = this.createDoodleButton(centerX + 100, buttonY, '🏠 Main Menu', 0x3498db, () => {
            this.handleBackToMenu();
        });

        // Controls instruction with doodly font
        this.add.text(centerX, buttonY + 60, 'Press R to play again, M for menu', {
            fontSize: '14px',
            fill: '#7f8c8d',
            fontFamily: 'Comic Sans MS, cursive, sans-serif',
            fontStyle: 'italic'
        }).setOrigin(0.5);

        // Keyboard controls
        this.input.keyboard.on('keydown-R', () => this.handlePlayAgain());
        this.input.keyboard.on('keydown-M', () => this.handleBackToMenu());
    }

    createDoodleButton(x, y, text, color, callback) {
        // Doodly button background
        const button = this.add.rectangle(x, y, 180, 45, color);
        button.setInteractive({ useHandCursor: true });
        button.setStrokeStyle(3, 0x2c3e50);
        button.angle = Math.random() * 2 - 1; // Slight random tilt

        // Button text with doodly font
        const buttonText = this.add.text(x, y, text, {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Comic Sans MS, cursive, sans-serif',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Button interactions with doodly effects
        button.on('pointerover', () => {
            button.setScale(1.05);
            this.tweens.add({
                targets: button,
                angle: button.angle + 1,
                duration: 100
            });
        });

        button.on('pointerout', () => {
            button.setScale(1);
            this.tweens.add({
                targets: button,
                angle: button.angle - 1,
                duration: 100
            });
        });

        button.on('pointerdown', () => {
            button.setScale(0.95);
        });

        button.on('pointerup', () => {
            button.setScale(1.05);
            callback();
        });

        return { button, text: buttonText };
    }

    createRoomInfo() {
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;
        
        const gameState = this.gameManager ? this.gameManager.getGameState() : null;
        if (gameState && gameState.roomCode) {
            // Paper note for room info
            const roomNote = this.add.rectangle(centerX, centerY + 280, 150, 25, 0xfff9c4);
            roomNote.setStrokeStyle(2, 0xe0e0e0);
            roomNote.angle = -2;
            
            this.add.text(centerX, centerY + 280, `🏠 Room: ${gameState.roomCode}`, {
                fontSize: '12px',
                fill: '#2c3e50',
                fontFamily: 'Comic Sans MS, cursive, sans-serif',
                fontStyle: 'bold'
            }).setOrigin(0.5);
        }
    }

    handlePlayAgain() {
        console.log('Play Again requested');
        
        // Reset game state for new round
        if (this.gameManager) {
            this.gameManager.gameState.phase = 'drawing';
            this.gameManager.gameState.gameResult = null;
            this.gameManager.gameState.winner = null;
            
            // Broadcast play again request
            this.gameManager.broadcastGameState({
                phase: 'drawing',
                playAgain: true,
                timestamp: Date.now()
            });
            
            // Transition to drawing scene
            this.gameManager.switchScene('DrawingScene');
        }
    }

    handleBackToMenu() {
        console.log('Back to Menu requested');
        
        // Reset game state
        if (this.gameManager) {
            this.gameManager.gameState = {
                phase: 'menu',
                players: {},
                roomCode: null
            };
            
            // Transition to menu scene
            this.gameManager.switchScene('MenuScene');
        }
    }

    handleGameManagerEvent(eventType, data) {
        console.log(`ResultsScene received event: ${eventType}`, data);
        
        switch (eventType) {
            case 'game_state_update':
                // Handle play again requests from other players
                if (data.playAgain) {
                    console.log('Other player requested play again');
                    // Could show notification or auto-transition
                }
                break;
                
            case 'player_left':
                // Handle player disconnection
                this.add.text(400, 580, 'A player has disconnected', {
                    fontSize: '12px',
                    fill: '#ff6666',
                    fontFamily: 'Arial'
                }).setOrigin(0.5);
                break;
        }
    }

    shutdown() {
        // Clean up results scene
        console.log('ResultsScene shut down and cleaned up');
    }

    update() {
        // Results scene update logic (minimal for now)
    }
}

export default ResultsScene;
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
        // Create gradient background
        const bgRect = this.add.rectangle(400, 300, 800, 600, 0x1a1a2e);
        
        // Add decorative elements
        for (let i = 0; i < 20; i++) {
            const star = this.add.circle(
                Math.random() * 800,
                Math.random() * 600,
                Math.random() * 3 + 1,
                0xffffff,
                0.3
            );
            
            // Animate stars
            this.tweens.add({
                targets: star,
                alpha: 0.1,
                duration: 2000 + Math.random() * 3000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    createResultsDisplay() {
        if (!this.gameResult) {
            this.add.text(400, 150, 'No Game Results Available', {
                fontSize: '32px',
                fill: '#ffffff',
                fontFamily: 'Arial'
            }).setOrigin(0.5);
            return;
        }

        // Main result title
        let titleText, titleColor;
        if (this.gameResult.isDraw) {
            titleText = 'DRAW!';
            titleColor = '#ffaa00';
        } else if (this.gameResult.isLocalPlayerWinner) {
            titleText = 'VICTORY!';
            titleColor = '#00ff66';
        } else {
            titleText = 'DEFEAT';
            titleColor = '#ff3366';
        }

        const mainTitle = this.add.text(400, 120, titleText, {
            fontSize: '48px',
            fill: titleColor,
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Add glow effect to title
        mainTitle.setStroke('#ffffff', 2);

        // Subtitle with winner info
        if (!this.gameResult.isDraw && this.gameResult.winnerName) {
            const subtitle = this.gameResult.isLocalPlayerWinner 
                ? 'You emerged victorious!' 
                : `${this.gameResult.winnerName} wins the battle!`;
                
            this.add.text(400, 170, subtitle, {
                fontSize: '20px',
                fill: '#cccccc',
                fontFamily: 'Arial'
            }).setOrigin(0.5);
        } else if (this.gameResult.isDraw) {
            this.add.text(400, 170, 'Both fighters fell in combat!', {
                fontSize: '20px',
                fill: '#cccccc',
                fontFamily: 'Arial'
            }).setOrigin(0.5);
        }

        // Game duration
        const durationMinutes = Math.floor(this.gameResult.gameDuration / 60000);
        const durationSeconds = Math.floor((this.gameResult.gameDuration % 60000) / 1000);
        const durationText = durationMinutes > 0 
            ? `${durationMinutes}m ${durationSeconds}s`
            : `${durationSeconds}s`;

        this.add.text(400, 200, `Battle Duration: ${durationText}`, {
            fontSize: '16px',
            fill: '#999999',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
    }

    createPlayerStats() {
        if (!this.gameResult || !this.gameResult.finalStats) return;

        // Stats container
        const statsY = 280;
        this.add.text(400, statsY - 30, 'Final Battle Statistics', {
            fontSize: '22px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Player stats
        const playerIds = Object.keys(this.gameResult.finalStats);
        const playerCount = playerIds.length;
        const spacing = playerCount > 1 ? 300 : 0;
        const startX = 400 - (spacing * (playerCount - 1)) / 2;

        playerIds.forEach((playerId, index) => {
            const stats = this.gameResult.finalStats[playerId];
            const x = startX + (index * spacing);
            const isLocalPlayer = playerId === this.gameManager.playerId;
            const isWinner = playerId === this.gameResult.winnerId;

            // Player card background
            const cardColor = isWinner ? 0x2d5016 : (isLocalPlayer ? 0x2d2d50 : 0x4a2d2d);
            const playerCard = this.add.rectangle(x, statsY + 40, 250, 120, cardColor, 0.8);
            playerCard.setStroke(isWinner ? 0x66ff66 : 0x666666, 2);

            // Player name
            const playerName = isLocalPlayer ? 'You' : `Player ${playerId.slice(-3)}`;
            const nameColor = isWinner ? '#66ff66' : (isLocalPlayer ? '#6666ff' : '#ffffff');
            
            this.add.text(x, statsY + 10, playerName, {
                fontSize: '18px',
                fill: nameColor,
                fontFamily: 'Arial',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            // Health bar visual
            const healthBarBg = this.add.rectangle(x, statsY + 35, 200, 20, 0x333333);
            const healthWidth = (stats.healthPercentage / 100) * 200;
            const healthColor = stats.healthPercentage > 60 ? 0x00ff00 : 
                               (stats.healthPercentage > 30 ? 0xffff00 : 0xff0000);
            
            if (healthWidth > 0) {
                this.add.rectangle(x - 100 + healthWidth/2, statsY + 35, healthWidth, 20, healthColor);
            }

            // Health text
            this.add.text(x, statsY + 55, `${stats.finalHealth}/${stats.maxHealth} HP`, {
                fontSize: '14px',
                fill: '#ffffff',
                fontFamily: 'Arial'
            }).setOrigin(0.5);

            // Status
            const statusText = stats.survived ? 'SURVIVED' : 'DEFEATED';
            const statusColor = stats.survived ? '#00ff00' : '#ff6666';
            
            this.add.text(x, statsY + 75, statusText, {
                fontSize: '12px',
                fill: statusColor,
                fontFamily: 'Arial',
                fontStyle: 'bold'
            }).setOrigin(0.5);
        });
    }

    createActionButtons() {
        const buttonY = 480;
        
        // Play Again button
        this.playAgainButton = this.createButton(300, buttonY, 'Play Again', '#4CAF50', () => {
            this.handlePlayAgain();
        });

        // Back to Menu button
        this.backToMenuButton = this.createButton(500, buttonY, 'Main Menu', '#2196F3', () => {
            this.handleBackToMenu();
        });

        // Controls instruction
        this.add.text(400, 530, 'Click buttons or press R to play again, M for menu', {
            fontSize: '14px',
            fill: '#999999',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Keyboard controls
        this.input.keyboard.on('keydown-R', () => this.handlePlayAgain());
        this.input.keyboard.on('keydown-M', () => this.handleBackToMenu());
    }

    createButton(x, y, text, color, callback) {
        // Button background
        const button = this.add.rectangle(x, y, 150, 40, Phaser.Display.Color.HexStringToColor(color).color);
        button.setInteractive();
        button.setStroke(0xffffff, 2);

        // Button text
        const buttonText = this.add.text(x, y, text, {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Button interactions
        button.on('pointerover', () => {
            button.setScale(1.05);
            button.setStroke(0xffffff, 3);
        });

        button.on('pointerout', () => {
            button.setScale(1);
            button.setStroke(0xffffff, 2);
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
        const gameState = this.gameManager ? this.gameManager.getGameState() : null;
        if (gameState && gameState.roomCode) {
            this.add.text(400, 560, `Room: ${gameState.roomCode}`, {
                fontSize: '12px',
                fill: '#666666',
                fontFamily: 'Arial'
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
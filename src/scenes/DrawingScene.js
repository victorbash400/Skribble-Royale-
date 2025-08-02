import DrawingCanvas from '../components/DrawingCanvas.js';

class DrawingScene extends Phaser.Scene {
    constructor() {
        super({ key: 'DrawingScene' });
        this.gameManager = null;
        this.drawingCanvas = null;
        this.isDrawingComplete = false;
        this.isWaitingForOpponent = false;
        this.currentTool = 'brush';
        this.brushSize = 5;
        this.brushColor = '#000000';
        
        // UI elements
        this.titleText = null;
        this.statusText = null;
        this.roomText = null;
        this.toolButtons = {};
        this.colorButtons = {};
        this.sizeSlider = null;
        this.submitButton = null;
        this.clearButton = null;
        this.canvasContainer = null;
    }

    preload() {
        // No assets needed for drawing scene
    }

    create() {
        console.log('DrawingScene created');
        
        // Get reference to GameManager
        this.gameManager = window.gameManager;
        
        // Create UI elements
        this.createUI();
        
        // Initialize drawing canvas
        this.initializeDrawingCanvas();
        
        // Set up drawing tools
        this.createDrawingTools();
        
        // Update status based on game state
        this.updateDrawingStatus();
    }

    createUI() {
        // Get screen dimensions
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;
        
        // Doodly title with hand-drawn feel
        this.titleText = this.add.text(centerX, 40, 'Draw Your Fighter!', {
            fontSize: '42px',
            fill: '#2c3e50',
            fontFamily: 'Comic Sans MS, cursive, sans-serif',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Add a doodly underline
        this.add.line(centerX, 65, -150, 0, 150, 0, 0x2c3e50)
            .setLineWidth(3, 3);

        // Subtitle with paper-like styling
        this.statusText = this.add.text(centerX, 90, 'Grab your pencil and sketch your warrior on paper!', {
            fontSize: '16px',
            fill: '#555555',
            fontFamily: 'Comic Sans MS, cursive, sans-serif',
            fontStyle: 'italic'
        }).setOrigin(0.5);

        // Room info with paper note styling
        const gameState = this.gameManager ? this.gameManager.getGameState() : null;
        if (gameState && gameState.roomCode) {
            // Paper note background - clickable
            const roomBg = this.add.rectangle(centerX, 125, 160, 30, 0xfff9c4);
            roomBg.setStrokeStyle(2, 0xe0e0e0);
            roomBg.angle = -1; // Slight tilt for hand-drawn feel
            roomBg.setInteractive({ useHandCursor: true });
            
            this.roomText = this.add.text(centerX, 125, `📋 Room: ${gameState.roomCode}`, {
                fontSize: '14px',
                fill: '#333333',
                fontFamily: 'Comic Sans MS, cursive, sans-serif',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            
            // Make room text clickable too
            this.roomText.setInteractive({ useHandCursor: true });
            
            // Add click-to-copy functionality
            const copyRoomCode = () => {
                this.copyToClipboard(gameState.roomCode);
                this.showCopyFeedback(centerX, 125);
            };
            
            roomBg.on('pointerdown', copyRoomCode);
            this.roomText.on('pointerdown', copyRoomCode);
            
            // Add hover effects
            const hoverIn = () => {
                roomBg.setFillStyle(0xfff5b7);
                this.roomText.setFill('#2c3e50');
            };
            
            const hoverOut = () => {
                roomBg.setFillStyle(0xfff9c4);
                this.roomText.setFill('#333333');
            };
            
            roomBg.on('pointerover', hoverIn);
            roomBg.on('pointerout', hoverOut);
            this.roomText.on('pointerover', hoverIn);
            this.roomText.on('pointerout', hoverOut);
        }

        // Doodly arrow pointing to canvas
        this.add.text(centerX, 165, '↓ Your drawing pad ↓', {
            fontSize: '14px',
            fill: '#777777',
            fontFamily: 'Comic Sans MS, cursive, sans-serif'
        }).setOrigin(0.5);

        // HTML canvas will be added in initializeDrawingCanvas()
    }

    initializeDrawingCanvas() {
        // Create drawing canvas with paper-like dimensions
        this.drawingCanvas = new DrawingCanvas(400, 300);
        
        // Paper-like canvas styling
        const canvas = this.drawingCanvas.getCanvas();
        canvas.style.position = 'absolute';
        canvas.style.left = '50%';
        canvas.style.top = '290px';
        canvas.style.transform = 'translateX(-50%) rotate(-0.5deg)'; // Slight paper tilt
        canvas.style.zIndex = '5';
        canvas.style.backgroundColor = '#ffffff';
        canvas.style.borderRadius = '0px'; // Sharp corners like real paper
        canvas.style.border = 'none';
        canvas.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1), 0 0 0 1px #e0e0e0'; // Paper shadow
        canvas.style.display = 'block';
        canvas.style.cursor = 'url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTMgMTdMMTcgM0wyMSA3TDcgMjFIM1YxN1oiIHN0cm9rZT0iIzMzMzMzMyIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+") 12 12, auto'; // Pencil cursor
        
        // Add paper texture with subtle grid lines
        const paperOverlay = document.createElement('div');
        paperOverlay.style.position = 'absolute';
        paperOverlay.style.left = '50%';
        paperOverlay.style.top = '290px';
        paperOverlay.style.transform = 'translateX(-50%) rotate(-0.5deg)';
        paperOverlay.style.width = '400px';
        paperOverlay.style.height = '300px';
        paperOverlay.style.backgroundColor = 'transparent';
        paperOverlay.style.backgroundImage = `
            linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)
        `;
        paperOverlay.style.backgroundSize = '20px 20px';
        paperOverlay.style.pointerEvents = 'none';
        paperOverlay.style.zIndex = '6';
        
        // Add subtle hover effect for paper
        canvas.addEventListener('mouseenter', () => {
            canvas.style.boxShadow = '0 6px 12px rgba(0,0,0,0.15), 0 0 0 1px #d0d0d0';
            canvas.style.transition = 'box-shadow 0.2s ease';
        });
        
        canvas.addEventListener('mouseleave', () => {
            canvas.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1), 0 0 0 1px #e0e0e0';
        });
        
        // Add both canvas and overlay to DOM
        document.body.appendChild(canvas);
        document.body.appendChild(paperOverlay);
        
        console.log('Paper-like drawing canvas initialized');
    }

    createDrawingTools() {
        const toolY = 220;
        const leftToolX = Math.min(120, this.cameras.main.width * 0.1); // 10% from left edge or 120px max
        const rightToolX = Math.max(this.cameras.main.width - 120, this.cameras.main.width * 0.9); // 10% from right edge
        
        // Pencil case header (left side)
        this.add.text(leftToolX, toolY - 30, 'Pencil Case', {
            fontSize: '18px',
            fill: '#2c3e50',
            fontFamily: 'Comic Sans MS, cursive, sans-serif',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Hand-drawn style tool buttons
        this.toolButtons.brush = this.add.rectangle(leftToolX, toolY, 85, 30, 0xf39c12)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.selectTool('brush'))
            .on('pointerover', () => this.toolButtons.brush.setFillStyle(0xe67e22))
            .on('pointerout', () => this.selectTool(this.currentTool));
        this.toolButtons.brush.setStrokeStyle(2, 0x2c3e50);
        
        this.add.text(leftToolX, toolY, '✏️ Pencil', {
            fontSize: '14px',
            fill: '#2c3e50',
            fontFamily: 'Comic Sans MS, cursive, sans-serif',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.toolButtons.eraser = this.add.rectangle(leftToolX, toolY + 40, 85, 30, 0xffc0cb)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.selectTool('eraser'))
            .on('pointerover', () => this.toolButtons.eraser.setFillStyle(0xffb6c1))
            .on('pointerout', () => this.selectTool(this.currentTool));
        this.toolButtons.eraser.setStrokeStyle(2, 0x2c3e50);
        
        this.add.text(leftToolX, toolY + 40, '🧹 Eraser', {
            fontSize: '14px',
            fill: '#2c3e50',
            fontFamily: 'Comic Sans MS, cursive, sans-serif',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Crayon box
        this.add.text(leftToolX, toolY + 90, 'Crayon Box', {
            fontSize: '16px',
            fill: '#2c3e50',
            fontFamily: 'Comic Sans MS, cursive, sans-serif',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const colors = ['#000000', '#e74c3c', '#27ae60', '#3498db', '#f1c40f', '#9b59b6', '#34495e', '#e67e22'];
        colors.forEach((color, index) => {
            const row = Math.floor(index / 4);
            const col = index % 4;
            const x = leftToolX - 35 + (col * 18);
            const y = toolY + 115 + (row * 22);
            
            this.colorButtons[color] = this.add.circle(x, y, 8, parseInt(color.replace('#', '0x')))
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.selectColor(color));
            
            this.colorButtons[color].setStrokeStyle(2, 0x2c3e50);
        });

        // Pencil thickness
        this.add.text(leftToolX, toolY + 165, 'Thickness', {
            fontSize: '16px',
            fill: '#2c3e50',
            fontFamily: 'Comic Sans MS, cursive, sans-serif',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const sizes = [2, 5, 8, 12];
        sizes.forEach((size, index) => {
            const x = leftToolX - 50 + (index * 25);
            const button = this.add.circle(x, toolY + 190, 8, 0xecf0f1)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.selectSize(size))
                .on('pointerover', () => button.setFillStyle(0xbdc3c7))
                .on('pointerout', () => button.setFillStyle(0xecf0f1));
            
            button.setStrokeStyle(2, 0x2c3e50);
            
            this.add.text(x, toolY + 190, size.toString(), {
                fontSize: '10px',
                fill: '#2c3e50',
                fontFamily: 'Comic Sans MS, cursive, sans-serif',
                fontStyle: 'bold'
            }).setOrigin(0.5);
        });

        // Action buttons (right side) - paper style
        // Clear button (looks like an eraser)
        this.clearButton = this.add.rectangle(rightToolX, toolY + 40, 85, 35, 0xe74c3c)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.clearCanvas())
            .on('pointerover', () => this.clearButton.setFillStyle(0xc0392b))
            .on('pointerout', () => this.clearButton.setFillStyle(0xe74c3c));
        this.clearButton.setStrokeStyle(2, 0x2c3e50);
        this.clearButton.angle = 2; // Slight tilt
        
        this.add.text(rightToolX, toolY + 40, '🗑️ Clear\nPaper', {
            fontSize: '12px',
            fill: '#ffffff',
            fontFamily: 'Comic Sans MS, cursive, sans-serif',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5);

        // Submit button (looks like turning in homework)
        this.submitButton = this.add.rectangle(rightToolX, toolY + 90, 85, 40, 0x27ae60)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.submitDrawing())
            .on('pointerover', () => this.submitButton.setFillStyle(0x229954))
            .on('pointerout', () => this.submitButton.setFillStyle(0x27ae60));
        this.submitButton.setStrokeStyle(2, 0x2c3e50);
        this.submitButton.angle = -1; // Slight tilt
        
        this.add.text(rightToolX, toolY + 90, '📝 Turn In\nDrawing', {
            fontSize: '12px',
            fill: '#ffffff',
            fontFamily: 'Comic Sans MS, cursive, sans-serif',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5);

        // Initialize tool selection
        this.selectTool('brush');
    }

    selectTool(tool) {
        this.currentTool = tool;
        
        // Update button appearances
        Object.keys(this.toolButtons).forEach(toolName => {
            const button = this.toolButtons[toolName];
            if (toolName === tool) {
                button.setFillStyle(toolName === 'brush' ? 0x4CAF50 : 0x666666);
                button.setStrokeStyle(3, 0xFFFFFF);
            } else {
                button.setFillStyle(0x333333);
                button.setStrokeStyle(1, 0x666666);
            }
        });

        // Update drawing canvas tool
        if (this.drawingCanvas) {
            if (tool === 'brush') {
                this.drawingCanvas.setBrushTool(this.brushSize, this.brushColor);
            } else if (tool === 'eraser') {
                this.drawingCanvas.setEraserTool(this.brushSize);
            }
        }
    }

    selectColor(color) {
        this.brushColor = color;
        
        // Update color button appearances
        Object.keys(this.colorButtons).forEach(colorValue => {
            const button = this.colorButtons[colorValue];
            if (colorValue === color) {
                button.setStrokeStyle(3, 0xFFFFFF);
            } else {
                button.setStrokeStyle(1, 0x333333);
            }
        });

        // Update drawing canvas if brush is selected
        if (this.currentTool === 'brush' && this.drawingCanvas) {
            this.drawingCanvas.setBrushTool(this.brushSize, this.brushColor);
        }
    }

    selectSize(size) {
        this.brushSize = size;
        
        // Update drawing canvas
        if (this.drawingCanvas) {
            if (this.currentTool === 'brush') {
                this.drawingCanvas.setBrushTool(this.brushSize, this.brushColor);
            } else if (this.currentTool === 'eraser') {
                this.drawingCanvas.setEraserTool(this.brushSize);
            }
        }
    }

    clearCanvas() {
        if (this.drawingCanvas) {
            this.drawingCanvas.clear();
            console.log('Canvas cleared');
        }
    }

    submitDrawing() {
        if (!this.drawingCanvas) {
            console.error('Drawing canvas not available');
            return;
        }

        // Check if there's actually a drawing
        const bounds = this.drawingCanvas.getDrawingBounds();
        if (!bounds) {
            this.updateStatus('Please draw something before submitting!', '#FF5722');
            return;
        }

        // Export drawing as PNG
        const pngData = this.drawingCanvas.exportToPNG();
        if (!pngData) {
            this.updateStatus('Error exporting drawing. Please try again.', '#FF5722');
            return;
        }

        // Mark drawing as complete
        this.isDrawingComplete = true;
        this.isWaitingForOpponent = true;

        // Send drawing to server
        if (this.gameManager) {
            this.gameManager.sendGameEvent({
                type: 'fighter_submit',
                data: {
                    fighterImage: pngData,
                    playerId: this.gameManager.playerId
                }
            });
        }

        // Update UI
        this.updateStatus('Drawing submitted! Waiting for opponent...', '#4CAF50');
        this.disableDrawingTools();

        console.log('Drawing submitted successfully');
    }

    disableDrawingTools() {
        // Disable all interactive elements
        Object.values(this.toolButtons).forEach(button => {
            button.disableInteractive();
            button.setAlpha(0.5);
        });
        
        Object.values(this.colorButtons).forEach(button => {
            button.disableInteractive();
            button.setAlpha(0.5);
        });

        this.clearButton.disableInteractive();
        this.clearButton.setAlpha(0.5);
        
        this.submitButton.disableInteractive();
        this.submitButton.setAlpha(0.5);

        // Hide the drawing canvas
        if (this.drawingCanvas) {
            const canvas = this.drawingCanvas.getCanvas();
            canvas.style.pointerEvents = 'none';
            canvas.style.opacity = '0.7';
        }
    }

    enableDrawingTools() {
        // Re-enable all interactive elements
        Object.values(this.toolButtons).forEach(button => {
            button.setInteractive();
            button.setAlpha(1);
        });
        
        Object.values(this.colorButtons).forEach(button => {
            button.setInteractive();
            button.setAlpha(1);
        });

        this.clearButton.setInteractive();
        this.clearButton.setAlpha(1);
        
        this.submitButton.setInteractive();
        this.submitButton.setAlpha(1);

        // Show the drawing canvas
        if (this.drawingCanvas) {
            const canvas = this.drawingCanvas.getCanvas();
            canvas.style.pointerEvents = 'auto';
            canvas.style.opacity = '1';
        }
    }

    updateStatus(message, color = '#cccccc') {
        if (this.statusText) {
            this.statusText.setText(message);
            this.statusText.setFill(color);
        }
    }

    updateDrawingStatus() {
        const gameState = this.gameManager ? this.gameManager.getGameState() : null;
        if (!gameState) return;

        const players = Object.values(gameState.players || {});
        const readyPlayers = players.filter(player => player.ready || player.fighterImage);
        
        if (this.isDrawingComplete) {
            if (readyPlayers.length >= 2) {
                this.updateStatus('Both players ready! Starting combat...', '#4CAF50');
            } else {
                this.updateStatus('Waiting for opponent to finish drawing...', '#FFC107');
            }
        } else {
            this.updateStatus('Create your fighter by drawing on the canvas below', '#cccccc');
        }
    }

    handleGameManagerEvent(eventType, data) {
        console.log(`DrawingScene received event: ${eventType}`, data);
        
        switch (eventType) {
            case 'game_state_update':
                this.updateDrawingStatus();
                break;
            case 'player_joined':
                this.updateStatus(`Player joined: ${data.playerId}`, '#00ff00');
                break;
            case 'player_left':
                this.updateStatus(`Player left: ${data.playerId}`, '#ff9800');
                // Re-enable drawing if opponent left
                if (this.isWaitingForOpponent) {
                    this.isWaitingForOpponent = false;
                    this.enableDrawingTools();
                    this.updateStatus('Opponent left. You can continue drawing.', '#ff9800');
                }
                break;
            case 'fighter_submit':
                if (data.playerId !== this.gameManager.playerId) {
                    this.updateStatus('Opponent finished drawing!', '#4CAF50');
                }
                this.updateDrawingStatus();
                break;
            case 'phase_change':
                if (data.phase === 'combat') {
                    this.updateStatus('Both players ready! Starting combat...', '#4CAF50');
                }
                break;
            case 'connection_status':
                if (data.status === 'disconnected') {
                    this.updateStatus('Connection lost. Trying to reconnect...', '#FF5722');
                } else if (data.status === 'connected') {
                    this.updateStatus('Connected! Draw your fighter below.', '#4CAF50');
                }
                break;
        }
    }

    shutdown() {
        // Clean up drawing canvas when scene shuts down
        if (this.drawingCanvas) {
            const canvas = this.drawingCanvas.getCanvas();
            if (canvas && canvas.parentNode) {
                canvas.parentNode.removeChild(canvas);
            }
            this.drawingCanvas = null;
        }
        
        console.log('DrawingScene shut down and cleaned up');
    }

    init() {
        // Show drawing canvas when entering this scene
        if (this.drawingCanvas) {
            const canvas = this.drawingCanvas.getCanvas();
            canvas.style.display = 'block';
        }
    }

    sleep() {
        // Hide drawing canvas when leaving this scene
        if (this.drawingCanvas) {
            const canvas = this.drawingCanvas.getCanvas();
            canvas.style.display = 'none';
        }
    }

    copyToClipboard(text) {
        try {
            // Modern way using Clipboard API
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(text).then(() => {
                    console.log('Room code copied to clipboard:', text);
                }).catch(err => {
                    console.error('Failed to copy to clipboard:', err);
                    this.fallbackCopyToClipboard(text);
                });
            } else {
                // Fallback for older browsers or non-secure contexts
                this.fallbackCopyToClipboard(text);
            }
        } catch (error) {
            console.error('Copy to clipboard error:', error);
            this.fallbackCopyToClipboard(text);
        }
    }

    fallbackCopyToClipboard(text) {
        try {
            // Create temporary textarea element
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            
            if (successful) {
                console.log('Room code copied to clipboard (fallback):', text);
            } else {
                console.error('Fallback copy failed');
            }
        } catch (err) {
            console.error('Fallback copy error:', err);
        }
    }

    showCopyFeedback(x, y) {
        // Create a temporary "Copied!" message
        const feedbackText = this.add.text(x, y - 30, '✅ Copied!', {
            fontSize: '12px',
            fill: '#27ae60',
            fontFamily: 'Comic Sans MS, cursive, sans-serif',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Animate the feedback
        this.tweens.add({
            targets: feedbackText,
            y: y - 50,
            alpha: 0,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => {
                feedbackText.destroy();
            }
        });

        // Also briefly highlight the room code background
        if (this.roomText) {
            const originalColor = this.roomText.style.color;
            this.roomText.setFill('#27ae60');
            
            this.time.delayedCall(300, () => {
                if (this.roomText) {
                    this.roomText.setFill('#333333');
                }
            });
        }
    }

    update() {
        // Update drawing status periodically
        if (this.time.now % 1000 < 16) { // Roughly every second
            this.updateDrawingStatus();
        }
    }
}

export default DrawingScene;
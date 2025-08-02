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
        // Modern title with gradient effect simulation
        this.titleText = this.add.text(400, 40, 'Draw Your Fighter!', {
            fontSize: '36px',
            fill: '#4CAF50',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Subtitle with better spacing
        this.statusText = this.add.text(400, 80, 'Create your unique fighter by drawing on the canvas', {
            fontSize: '16px',
            fill: '#e0e0e0',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Room info with modern styling
        const gameState = this.gameManager ? this.gameManager.getGameState() : null;
        if (gameState && gameState.roomCode) {
            // Room code with background
            const roomBg = this.add.rectangle(400, 115, 150, 25, 0x2c2c2c);
            roomBg.setStrokeStyle(1, 0x4CAF50);
            
            this.roomText = this.add.text(400, 115, `Room: ${gameState.roomCode}`, {
                fontSize: '14px',
                fill: '#4CAF50',
                fontFamily: 'Arial',
                fontStyle: 'bold'
            }).setOrigin(0.5);
        }

        // Add canvas area indicator
        this.add.text(400, 150, '⬇ Draw Here ⬇', {
            fontSize: '14px',
            fill: '#888888',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // HTML canvas will be added in initializeDrawingCanvas()
    }

    initializeDrawingCanvas() {
        // Create drawing canvas instance (slightly smaller for better fit)
        this.drawingCanvas = new DrawingCanvas(380, 320);
        
        // Modern, centered canvas styling
        const canvas = this.drawingCanvas.getCanvas();
        canvas.style.position = 'absolute';
        canvas.style.left = '50%';
        canvas.style.top = '280px';
        canvas.style.transform = 'translateX(-50%)'; // Perfect centering
        canvas.style.zIndex = '5';
        canvas.style.backgroundColor = '#ffffff';
        canvas.style.borderRadius = '12px';
        canvas.style.border = '3px solid #4CAF50';
        canvas.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3), 0 4px 8px rgba(76,175,80,0.2)';
        canvas.style.display = 'block';
        canvas.style.cursor = 'crosshair';
        
        // Add subtle animation on hover
        canvas.addEventListener('mouseenter', () => {
            canvas.style.transform = 'translateX(-50%) scale(1.02)';
            canvas.style.transition = 'transform 0.2s ease';
        });
        
        canvas.addEventListener('mouseleave', () => {
            canvas.style.transform = 'translateX(-50%) scale(1)';
        });
        
        // Add canvas to the DOM
        document.body.appendChild(canvas);
        
        console.log('Modern drawing canvas initialized and centered');
    }

    createDrawingTools() {
        const toolY = 200; // Move tools to the left side of canvas
        
        // Tools section header
        this.add.text(120, toolY - 30, 'Drawing Tools', {
            fontSize: '16px',
            fill: '#4CAF50',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Tool selection buttons (vertical layout)
        this.toolButtons.brush = this.add.rectangle(120, toolY, 80, 35, 0x4CAF50)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.selectTool('brush'))
            .on('pointerover', () => this.toolButtons.brush.setFillStyle(0x45a049))
            .on('pointerout', () => this.selectTool(this.currentTool));
        
        this.add.text(120, toolY, '🖌️ Brush', {
            fontSize: '12px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.toolButtons.eraser = this.add.rectangle(120, toolY + 45, 80, 35, 0x666666)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.selectTool('eraser'))
            .on('pointerover', () => this.toolButtons.eraser.setFillStyle(0x777777))
            .on('pointerout', () => this.selectTool(this.currentTool));
        
        this.add.text(120, toolY + 45, '🧽 Eraser', {
            fontSize: '12px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Color palette section
        this.add.text(120, toolY + 100, 'Colors', {
            fontSize: '14px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const colors = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#FFFFFF', '#FFA500'];
        colors.forEach((color, index) => {
            const row = Math.floor(index / 4);
            const col = index % 4;
            const x = 85 + (col * 20);
            const y = toolY + 130 + (row * 25);
            
            this.colorButtons[color] = this.add.rectangle(x, y, 18, 18, parseInt(color.replace('#', '0x')))
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.selectColor(color));
            
            // Add border for white color visibility
            if (color === '#FFFFFF') {
                this.colorButtons[color].setStrokeStyle(1, 0x666666);
            }
        });

        // Size controls section
        this.add.text(120, toolY + 190, 'Brush Size', {
            fontSize: '14px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const sizes = [2, 5, 10, 15];
        sizes.forEach((size, index) => {
            const x = 85 + (index * 20);
            const button = this.add.rectangle(x, toolY + 215, 18, 18, 0x555555)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.selectSize(size))
                .on('pointerover', () => button.setFillStyle(0x777777))
                .on('pointerout', () => button.setFillStyle(0x555555));
            
            this.add.text(x, toolY + 215, size.toString(), {
                fontSize: '10px',
                fill: '#ffffff',
                fontFamily: 'Arial'
            }).setOrigin(0.5);
        });

        // Action buttons section (right side of canvas)
        const actionX = 680;
        
        this.clearButton = this.add.rectangle(actionX, toolY + 50, 90, 40, 0xFF5722)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.clearCanvas())
            .on('pointerover', () => this.clearButton.setFillStyle(0xe64a19))
            .on('pointerout', () => this.clearButton.setFillStyle(0xFF5722));
        
        this.add.text(actionX, toolY + 50, '🗑️ Clear', {
            fontSize: '14px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.submitButton = this.add.rectangle(actionX, toolY + 100, 90, 45, 0x2196F3)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.submitDrawing())
            .on('pointerover', () => this.submitButton.setFillStyle(0x1976D2))
            .on('pointerout', () => this.submitButton.setFillStyle(0x2196F3));
        
        this.add.text(actionX, toolY + 100, '✅ Submit\nDrawing', {
            fontSize: '12px',
            fill: '#ffffff',
            fontFamily: 'Arial',
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

    update() {
        // Update drawing status periodically
        if (this.time.now % 1000 < 16) { // Roughly every second
            this.updateDrawingStatus();
        }
    }
}

export default DrawingScene;
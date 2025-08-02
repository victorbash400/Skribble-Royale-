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
        // Title
        this.titleText = this.add.text(400, 50, 'Draw Your Fighter!', {
            fontSize: '32px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Status text
        this.statusText = this.add.text(400, 90, 'Create your fighter by drawing on the canvas below', {
            fontSize: '16px',
            fill: '#cccccc',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Room info
        const gameState = this.gameManager ? this.gameManager.getGameState() : null;
        if (gameState && gameState.roomCode) {
            this.roomText = this.add.text(400, 120, `Room: ${gameState.roomCode}`, {
                fontSize: '14px',
                fill: '#00ff00',
                fontFamily: 'Arial'
            }).setOrigin(0.5);
        }

        // Canvas container placeholder (will be replaced with HTML canvas)
        this.canvasContainer = this.add.rectangle(400, 300, 420, 420, 0x333333, 0.3);
        this.canvasContainer.setStrokeStyle(2, 0x666666);
    }

    initializeDrawingCanvas() {
        // Create drawing canvas instance
        this.drawingCanvas = new DrawingCanvas(400, 400);
        
        // Position the canvas in the center of the screen
        const canvas = this.drawingCanvas.getCanvas();
        canvas.style.position = 'absolute';
        canvas.style.left = '200px'; // Center horizontally (400px game width / 2 - 200px canvas width / 2)
        canvas.style.top = '100px';  // Position below UI elements
        canvas.style.zIndex = '10';
        canvas.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        canvas.style.borderRadius = '8px';
        
        // Add canvas to the DOM
        document.body.appendChild(canvas);
        
        console.log('Drawing canvas initialized and added to DOM');
    }

    createDrawingTools() {
        // Tool selection buttons
        const toolY = 550;
        
        // Brush tool button
        this.toolButtons.brush = this.add.rectangle(200, toolY, 80, 40, 0x4CAF50)
            .setInteractive()
            .on('pointerdown', () => this.selectTool('brush'));
        
        this.add.text(200, toolY, 'Brush', {
            fontSize: '14px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Eraser tool button
        this.toolButtons.eraser = this.add.rectangle(300, toolY, 80, 40, 0x666666)
            .setInteractive()
            .on('pointerdown', () => this.selectTool('eraser'));
        
        this.add.text(300, toolY, 'Eraser', {
            fontSize: '14px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Color selection buttons
        const colors = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'];
        colors.forEach((color, index) => {
            const x = 420 + (index * 35);
            this.colorButtons[color] = this.add.rectangle(x, toolY, 30, 30, parseInt(color.replace('#', '0x')))
                .setInteractive()
                .on('pointerdown', () => this.selectColor(color));
        });

        // Size controls
        this.add.text(200, toolY + 50, 'Size:', {
            fontSize: '14px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });

        // Size buttons (simplified slider alternative)
        const sizes = [2, 5, 10, 15];
        sizes.forEach((size, index) => {
            const x = 250 + (index * 40);
            const button = this.add.rectangle(x, toolY + 50, 35, 25, 0x555555)
                .setInteractive()
                .on('pointerdown', () => this.selectSize(size));
            
            this.add.text(x, toolY + 50, size.toString(), {
                fontSize: '12px',
                fill: '#ffffff',
                fontFamily: 'Arial'
            }).setOrigin(0.5);
        });

        // Action buttons
        this.clearButton = this.add.rectangle(500, toolY + 50, 80, 40, 0xFF5722)
            .setInteractive()
            .on('pointerdown', () => this.clearCanvas());
        
        this.add.text(500, toolY + 50, 'Clear', {
            fontSize: '14px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.submitButton = this.add.rectangle(600, toolY + 50, 100, 40, 0x2196F3)
            .setInteractive()
            .on('pointerdown', () => this.submitDrawing());
        
        this.add.text(600, toolY + 50, 'Submit', {
            fontSize: '14px',
            fill: '#ffffff',
            fontFamily: 'Arial'
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
            this.drawingCanvas.removeFromDOM();
            this.drawingCanvas = null;
        }
        
        console.log('DrawingScene shut down and cleaned up');
    }

    update() {
        // Update drawing status periodically
        if (this.time.now % 1000 < 16) { // Roughly every second
            this.updateDrawingStatus();
        }
    }
}

export default DrawingScene;
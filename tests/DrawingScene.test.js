import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import DrawingScene from '../src/scenes/DrawingScene.js';
import DrawingCanvas from '../src/components/DrawingCanvas.js';

// Mock Phaser Scene methods
const mockPhaserMethods = {
    add: {
        text: vi.fn().mockReturnValue({
            setOrigin: vi.fn().mockReturnThis(),
            setText: vi.fn().mockReturnThis(),
            setFill: vi.fn().mockReturnThis()
        }),
        rectangle: vi.fn().mockReturnValue({
            setInteractive: vi.fn().mockReturnThis(),
            on: vi.fn().mockReturnThis(),
            setStrokeStyle: vi.fn().mockReturnThis(),
            setFillStyle: vi.fn().mockReturnThis(),
            disableInteractive: vi.fn().mockReturnThis(),
            setAlpha: vi.fn().mockReturnThis()
        })
    },
    time: {
        now: 0
    }
};

// Mock GameManager
const mockGameManager = {
    playerId: 'test-player-1',
    getGameState: vi.fn().mockReturnValue({
        phase: 'drawing',
        roomCode: 'TEST123',
        players: {
            'test-player-1': { id: 'test-player-1', ready: false },
            'test-player-2': { id: 'test-player-2', ready: false }
        }
    }),
    sendGameEvent: vi.fn()
};

// Mock DOM methods
Object.defineProperty(document, 'body', {
    value: {
        appendChild: vi.fn(),
        removeChild: vi.fn()
    },
    writable: true
});

describe('DrawingScene', () => {
    let drawingScene;
    let mockCanvas;

    beforeEach(() => {
        // Set up global mocks
        global.window = {
            gameManager: mockGameManager
        };

        // Mock DrawingCanvas
        mockCanvas = {
            getCanvas: vi.fn().mockReturnValue({
                style: {},
                addEventListener: vi.fn()
            }),
            setBrushTool: vi.fn(),
            setEraserTool: vi.fn(),
            clear: vi.fn(),
            getDrawingBounds: vi.fn(),
            exportToPNG: vi.fn(),
            removeFromDOM: vi.fn()
        };

        vi.mock('../src/components/DrawingCanvas.js', () => ({
            default: vi.fn().mockImplementation(() => mockCanvas)
        }));

        // Create DrawingScene instance
        drawingScene = new DrawingScene();
        
        // Mock Phaser Scene methods
        Object.assign(drawingScene, mockPhaserMethods);
    });

    afterEach(() => {
        vi.clearAllMocks();
        delete global.window;
    });

    describe('Initialization', () => {
        it('should initialize with correct default values', () => {
            expect(drawingScene.key).toBe('DrawingScene');
            expect(drawingScene.isDrawingComplete).toBe(false);
            expect(drawingScene.isWaitingForOpponent).toBe(false);
            expect(drawingScene.currentTool).toBe('brush');
            expect(drawingScene.brushSize).toBe(5);
            expect(drawingScene.brushColor).toBe('#000000');
        });

        it('should create UI elements on scene creation', () => {
            drawingScene.create();

            expect(drawingScene.add.text).toHaveBeenCalledWith(
                400, 50, 'Draw Your Fighter!',
                expect.objectContaining({
                    fontSize: '32px',
                    fill: '#ffffff'
                })
            );

            expect(drawingScene.add.text).toHaveBeenCalledWith(
                400, 120, 'Room: TEST123',
                expect.objectContaining({
                    fontSize: '14px',
                    fill: '#00ff00'
                })
            );
        });

        it('should initialize drawing canvas on creation', () => {
            drawingScene.create();

            expect(drawingScene.drawingCanvas).toBeDefined();
            expect(mockCanvas.getCanvas).toHaveBeenCalled();
            expect(document.body.appendChild).toHaveBeenCalled();
        });
    });

    describe('Tool Selection', () => {
        beforeEach(() => {
            drawingScene.create();
        });

        it('should select brush tool correctly', () => {
            drawingScene.selectTool('brush');

            expect(drawingScene.currentTool).toBe('brush');
            expect(mockCanvas.setBrushTool).toHaveBeenCalledWith(5, '#000000');
        });

        it('should select eraser tool correctly', () => {
            drawingScene.selectTool('eraser');

            expect(drawingScene.currentTool).toBe('eraser');
            expect(mockCanvas.setEraserTool).toHaveBeenCalledWith(5);
        });

        it('should select color correctly', () => {
            drawingScene.selectColor('#FF0000');

            expect(drawingScene.brushColor).toBe('#FF0000');
        });

        it('should select size correctly', () => {
            drawingScene.selectSize(10);

            expect(drawingScene.brushSize).toBe(10);
        });
    });

    describe('Drawing Operations', () => {
        beforeEach(() => {
            drawingScene.create();
        });

        it('should clear canvas when clear button is pressed', () => {
            drawingScene.clearCanvas();

            expect(mockCanvas.clear).toHaveBeenCalled();
        });

        it('should not submit empty drawing', () => {
            mockCanvas.getDrawingBounds.mockReturnValue(null);

            drawingScene.submitDrawing();

            expect(drawingScene.isDrawingComplete).toBe(false);
            expect(mockGameManager.sendGameEvent).not.toHaveBeenCalled();
        });

        it('should submit valid drawing', () => {
            mockCanvas.getDrawingBounds.mockReturnValue({ minX: 10, minY: 10, maxX: 50, maxY: 50 });
            mockCanvas.exportToPNG.mockReturnValue('data:image/png;base64,test-data');

            drawingScene.submitDrawing();

            expect(drawingScene.isDrawingComplete).toBe(true);
            expect(drawingScene.isWaitingForOpponent).toBe(true);
            expect(mockGameManager.sendGameEvent).toHaveBeenCalledWith({
                type: 'fighter_submit',
                data: {
                    fighterImage: 'data:image/png;base64,test-data',
                    playerId: 'test-player-1'
                }
            });
        });

        it('should handle export error gracefully', () => {
            mockCanvas.getDrawingBounds.mockReturnValue({ minX: 10, minY: 10, maxX: 50, maxY: 50 });
            mockCanvas.exportToPNG.mockReturnValue(null);

            drawingScene.submitDrawing();

            expect(drawingScene.isDrawingComplete).toBe(false);
            expect(mockGameManager.sendGameEvent).not.toHaveBeenCalled();
        });
    });

    describe('Game Manager Events', () => {
        beforeEach(() => {
            drawingScene.create();
        });

        it('should handle player joined event', () => {
            const updateStatusSpy = vi.spyOn(drawingScene, 'updateStatus');

            drawingScene.handleGameManagerEvent('player_joined', { playerId: 'new-player' });

            expect(updateStatusSpy).toHaveBeenCalledWith('Player joined: new-player', '#00ff00');
        });

        it('should handle player left event', () => {
            const updateStatusSpy = vi.spyOn(drawingScene, 'updateStatus');
            drawingScene.isWaitingForOpponent = true;

            drawingScene.handleGameManagerEvent('player_left', { playerId: 'other-player' });

            expect(updateStatusSpy).toHaveBeenCalledWith('Opponent left. You can continue drawing.', '#ff9800');
            expect(drawingScene.isWaitingForOpponent).toBe(false);
        });

        it('should handle fighter submit event from opponent', () => {
            const updateStatusSpy = vi.spyOn(drawingScene, 'updateStatus');

            drawingScene.handleGameManagerEvent('fighter_submit', { playerId: 'other-player' });

            expect(updateStatusSpy).toHaveBeenCalledWith('Opponent finished drawing!', '#4CAF50');
        });

        it('should handle connection status events', () => {
            const updateStatusSpy = vi.spyOn(drawingScene, 'updateStatus');

            drawingScene.handleGameManagerEvent('connection_status', { status: 'disconnected' });
            expect(updateStatusSpy).toHaveBeenCalledWith('Connection lost. Trying to reconnect...', '#FF5722');

            drawingScene.handleGameManagerEvent('connection_status', { status: 'connected' });
            expect(updateStatusSpy).toHaveBeenCalledWith('Connected! Draw your fighter below.', '#4CAF50');
        });

        it('should handle phase change to combat', () => {
            const updateStatusSpy = vi.spyOn(drawingScene, 'updateStatus');

            drawingScene.handleGameManagerEvent('phase_change', { phase: 'combat' });

            expect(updateStatusSpy).toHaveBeenCalledWith('Both players ready! Starting combat...', '#4CAF50');
        });
    });

    describe('Status Updates', () => {
        beforeEach(() => {
            drawingScene.create();
        });

        it('should update drawing status based on game state', () => {
            mockGameManager.getGameState.mockReturnValue({
                players: {
                    'test-player-1': { ready: false },
                    'test-player-2': { ready: false }
                }
            });

            drawingScene.updateDrawingStatus();

            expect(drawingScene.statusText.setText).toHaveBeenCalledWith(
                'Create your fighter by drawing on the canvas below'
            );
        });

        it('should show waiting status when drawing is complete', () => {
            drawingScene.isDrawingComplete = true;
            mockGameManager.getGameState.mockReturnValue({
                players: {
                    'test-player-1': { ready: true },
                    'test-player-2': { ready: false }
                }
            });

            drawingScene.updateDrawingStatus();

            expect(drawingScene.statusText.setText).toHaveBeenCalledWith(
                'Waiting for opponent to finish drawing...'
            );
        });

        it('should show ready status when both players are ready', () => {
            drawingScene.isDrawingComplete = true;
            mockGameManager.getGameState.mockReturnValue({
                players: {
                    'test-player-1': { ready: true },
                    'test-player-2': { ready: true }
                }
            });

            drawingScene.updateDrawingStatus();

            expect(drawingScene.statusText.setText).toHaveBeenCalledWith(
                'Both players ready! Starting combat...'
            );
        });
    });

    describe('Cleanup', () => {
        beforeEach(() => {
            drawingScene.create();
        });

        it('should clean up drawing canvas on shutdown', () => {
            drawingScene.shutdown();

            expect(mockCanvas.removeFromDOM).toHaveBeenCalled();
            expect(drawingScene.drawingCanvas).toBeNull();
        });
    });

    describe('Tool State Management', () => {
        beforeEach(() => {
            drawingScene.create();
        });

        it('should disable drawing tools after submission', () => {
            drawingScene.disableDrawingTools();

            // Check that interactive elements are disabled
            Object.values(drawingScene.toolButtons).forEach(button => {
                expect(button.disableInteractive).toHaveBeenCalled();
                expect(button.setAlpha).toHaveBeenCalledWith(0.5);
            });

            expect(drawingScene.clearButton.disableInteractive).toHaveBeenCalled();
            expect(drawingScene.submitButton.disableInteractive).toHaveBeenCalled();
        });

        it('should enable drawing tools when needed', () => {
            drawingScene.enableDrawingTools();

            // Check that interactive elements are enabled
            Object.values(drawingScene.toolButtons).forEach(button => {
                expect(button.setInteractive).toHaveBeenCalled();
                expect(button.setAlpha).toHaveBeenCalledWith(1);
            });

            expect(drawingScene.clearButton.setInteractive).toHaveBeenCalled();
            expect(drawingScene.submitButton.setInteractive).toHaveBeenCalled();
        });
    });
});
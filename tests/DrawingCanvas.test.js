import { describe, it, expect, beforeEach, vi } from 'vitest';
import DrawingCanvas from '../src/components/DrawingCanvas.js';

// Mock DOM methods
global.document = {
    createElement: vi.fn(() => ({
        width: 0,
        height: 0,
        style: {},
        addEventListener: vi.fn(),
        getContext: vi.fn(() => ({
            clearRect: vi.fn(),
            beginPath: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn(),
            stroke: vi.fn(),
            getImageData: vi.fn(() => ({
                data: new Uint8ClampedArray(400 * 400 * 4)
            })),
            toDataURL: vi.fn(() => 'data:image/png;base64,mockPNGData')
        })),
        toDataURL: vi.fn(() => 'data:image/png;base64,mockPNGData'),
        parentNode: null,
        appendChild: vi.fn(),
        removeChild: vi.fn()
    }))
};

describe('DrawingCanvas', () => {
    let drawingCanvas;
    let mockCanvas;
    let mockContext;

    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks();
        
        // Create mock canvas and context
        mockCanvas = {
            width: 400,
            height: 400,
            style: {},
            addEventListener: vi.fn(),
            getContext: vi.fn(),
            toDataURL: vi.fn(() => 'data:image/png;base64,mockPNGData'),
            parentNode: null
        };

        mockContext = {
            clearRect: vi.fn(),
            beginPath: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn(),
            stroke: vi.fn(),
            getImageData: vi.fn(() => ({
                data: new Uint8ClampedArray(400 * 400 * 4)
            })),
            lineCap: '',
            lineJoin: '',
            globalCompositeOperation: '',
            strokeStyle: '',
            lineWidth: 0
        };

        mockCanvas.getContext.mockReturnValue(mockContext);
        global.document.createElement.mockReturnValue(mockCanvas);

        drawingCanvas = new DrawingCanvas(400, 400);
    });

    describe('Initialization', () => {
        it('should initialize with default dimensions', () => {
            const canvas = new DrawingCanvas();
            expect(canvas.width).toBe(400);
            expect(canvas.height).toBe(400);
        });

        it('should initialize with custom dimensions', () => {
            const canvas = new DrawingCanvas(500, 300);
            expect(canvas.width).toBe(500);
            expect(canvas.height).toBe(300);
        });

        it('should create canvas element with correct properties', () => {
            expect(global.document.createElement).toHaveBeenCalledWith('canvas');
            expect(mockCanvas.width).toBe(400);
            expect(mockCanvas.height).toBe(400);
            expect(mockCanvas.style.border).toBe('2px solid #333');
            expect(mockCanvas.style.cursor).toBe('crosshair');
        });

        it('should initialize transparent canvas context', () => {
            expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
            expect(mockContext.clearRect).toHaveBeenCalledWith(0, 0, 400, 400);
            expect(mockContext.lineCap).toBe('round');
            expect(mockContext.lineJoin).toBe('round');
            expect(mockContext.globalCompositeOperation).toBe('source-over');
        });

        it('should set up event listeners', () => {
            expect(mockCanvas.addEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function));
            expect(mockCanvas.addEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
            expect(mockCanvas.addEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function));
            expect(mockCanvas.addEventListener).toHaveBeenCalledWith('mouseout', expect.any(Function));
            expect(mockCanvas.addEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function));
            expect(mockCanvas.addEventListener).toHaveBeenCalledWith('touchmove', expect.any(Function));
            expect(mockCanvas.addEventListener).toHaveBeenCalledWith('touchend', expect.any(Function));
        });
    });

    describe('Drawing Operations', () => {
        it('should start drawing at specified coordinates', () => {
            drawingCanvas.startDrawing(100, 150);
            
            expect(drawingCanvas.isDrawing).toBe(true);
            expect(drawingCanvas.lastX).toBe(100);
            expect(drawingCanvas.lastY).toBe(150);
            expect(mockContext.beginPath).toHaveBeenCalled();
            expect(mockContext.moveTo).toHaveBeenCalledWith(100, 150);
        });

        it('should set brush properties when starting to draw with brush tool', () => {
            drawingCanvas.setBrushTool(10, '#ff0000');
            drawingCanvas.startDrawing(50, 75);
            
            expect(mockContext.globalCompositeOperation).toBe('source-over');
            expect(mockContext.strokeStyle).toBe('#ff0000');
            expect(mockContext.lineWidth).toBe(10);
        });

        it('should set eraser properties when starting to draw with eraser tool', () => {
            drawingCanvas.setEraserTool(15);
            drawingCanvas.startDrawing(50, 75);
            
            expect(mockContext.globalCompositeOperation).toBe('destination-out');
            expect(mockContext.lineWidth).toBe(30); // Eraser is 2x size
        });

        it('should draw line to new coordinates when drawing', () => {
            drawingCanvas.startDrawing(100, 150);
            drawingCanvas.draw(120, 170);
            
            expect(mockContext.lineTo).toHaveBeenCalledWith(120, 170);
            expect(mockContext.stroke).toHaveBeenCalled();
            expect(drawingCanvas.lastX).toBe(120);
            expect(drawingCanvas.lastY).toBe(170);
        });

        it('should not draw when not in drawing state', () => {
            drawingCanvas.draw(120, 170);
            
            expect(mockContext.lineTo).not.toHaveBeenCalled();
            expect(mockContext.stroke).not.toHaveBeenCalled();
        });

        it('should stop drawing and reset path', () => {
            drawingCanvas.startDrawing(100, 150);
            drawingCanvas.stopDrawing();
            
            expect(drawingCanvas.isDrawing).toBe(false);
            expect(mockContext.beginPath).toHaveBeenCalledTimes(2); // Once for start, once for stop
        });

        it('should not stop drawing if not currently drawing', () => {
            const beginPathCalls = mockContext.beginPath.mock.calls.length;
            drawingCanvas.stopDrawing();
            
            expect(mockContext.beginPath).toHaveBeenCalledTimes(beginPathCalls); // No additional calls
        });
    });

    describe('Tool Management', () => {
        it('should set brush tool with custom size and color', () => {
            drawingCanvas.setBrushTool(8, '#00ff00');
            
            expect(drawingCanvas.currentTool).toBe('brush');
            expect(drawingCanvas.brushSize).toBe(8);
            expect(drawingCanvas.brushColor).toBe('#00ff00');
        });

        it('should set eraser tool with custom size', () => {
            drawingCanvas.setEraserTool(12);
            
            expect(drawingCanvas.currentTool).toBe('eraser');
            expect(drawingCanvas.brushSize).toBe(12);
        });

        it('should use default values for brush tool', () => {
            drawingCanvas.setBrushTool();
            
            expect(drawingCanvas.currentTool).toBe('brush');
            expect(drawingCanvas.brushSize).toBe(5);
            expect(drawingCanvas.brushColor).toBe('#000000');
        });

        it('should use default value for eraser tool', () => {
            drawingCanvas.setEraserTool();
            
            expect(drawingCanvas.currentTool).toBe('eraser');
            expect(drawingCanvas.brushSize).toBe(10);
        });
    });

    describe('Canvas Management', () => {
        it('should clear the canvas', () => {
            drawingCanvas.clear();
            
            expect(mockContext.clearRect).toHaveBeenCalledWith(0, 0, 400, 400);
        });

        it('should return the canvas element', () => {
            const canvas = drawingCanvas.getCanvas();
            expect(canvas).toBe(mockCanvas);
        });

        it('should append canvas to parent element', () => {
            const mockParent = {
                appendChild: vi.fn()
            };
            
            drawingCanvas.appendToElement(mockParent);
            expect(mockParent.appendChild).toHaveBeenCalledWith(mockCanvas);
        });

        it('should not append if no parent element provided', () => {
            expect(() => drawingCanvas.appendToElement(null)).not.toThrow();
        });

        it('should remove canvas from DOM', () => {
            const mockParent = {
                removeChild: vi.fn()
            };
            mockCanvas.parentNode = mockParent;
            
            drawingCanvas.removeFromDOM();
            expect(mockParent.removeChild).toHaveBeenCalledWith(mockCanvas);
        });

        it('should not remove if canvas has no parent', () => {
            mockCanvas.parentNode = null;
            expect(() => drawingCanvas.removeFromDOM()).not.toThrow();
        });
    });

    describe('PNG Export', () => {
        it('should export canvas as PNG data URL', () => {
            const pngData = drawingCanvas.exportToPNG();
            
            expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/png');
            expect(pngData).toBe('data:image/png;base64,mockPNGData');
        });

        it('should return null if canvas is not initialized', () => {
            drawingCanvas.canvas = null;
            const pngData = drawingCanvas.exportToPNG();
            
            expect(pngData).toBeNull();
        });

        it('should handle export errors gracefully', () => {
            mockCanvas.toDataURL.mockImplementation(() => {
                throw new Error('Export failed');
            });
            
            const pngData = drawingCanvas.exportToPNG();
            expect(pngData).toBeNull();
        });
    });

    describe('Drawing Bounds Detection', () => {
        it('should return null when no drawing exists', () => {
            // Mock empty image data (all transparent)
            const emptyData = new Uint8ClampedArray(400 * 400 * 4);
            mockContext.getImageData.mockReturnValue({ data: emptyData });
            
            const bounds = drawingCanvas.getDrawingBounds();
            expect(bounds).toBeNull();
        });

        it('should return correct bounds when drawing exists', () => {
            // Mock image data with some non-transparent pixels
            const imageData = new Uint8ClampedArray(400 * 400 * 4);
            // Set alpha channel for pixel at (50, 60) to non-zero
            imageData[(60 * 400 + 50) * 4 + 3] = 255;
            // Set alpha channel for pixel at (100, 120) to non-zero
            imageData[(120 * 400 + 100) * 4 + 3] = 255;
            
            mockContext.getImageData.mockReturnValue({ data: imageData });
            
            const bounds = drawingCanvas.getDrawingBounds();
            expect(bounds).toEqual({
                minX: 50,
                minY: 60,
                maxX: 100,
                maxY: 120
            });
        });
    });
});
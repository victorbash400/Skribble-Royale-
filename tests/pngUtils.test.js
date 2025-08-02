import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
    canvasToTransparentPNG, 
    validatePNGData, 
    createPhaserTexture, 
    optimizePNGSize,
    cropTransparentPNG 
} from '../src/utils/pngUtils.js';

// Mock DOM and Image
global.Image = class {
    constructor() {
        this.onload = null;
        this.onerror = null;
        this.src = '';
        this.width = 100;
        this.height = 100;
    }
    
    set src(value) {
        this._src = value;
        // Simulate successful image load
        setTimeout(() => {
            if (this.onload) {
                this.onload();
            }
        }, 0);
    }
    
    get src() {
        return this._src;
    }
};

global.document = {
    createElement: vi.fn(() => ({
        width: 0,
        height: 0,
        getContext: vi.fn(() => ({
            clearRect: vi.fn(),
            drawImage: vi.fn(),
            getImageData: vi.fn(() => ({
                data: new Uint8ClampedArray(100 * 100 * 4)
            }))
        })),
        toDataURL: vi.fn(() => 'data:image/png;base64,optimizedPNGData')
    }))
};

describe('PNG Utils', () => {
    let mockCanvas;
    let mockContext;

    beforeEach(() => {
        vi.clearAllMocks();
        
        mockCanvas = {
            toDataURL: vi.fn(() => 'data:image/png;base64,testPNGData')
        };
        
        mockContext = {
            clearRect: vi.fn(),
            drawImage: vi.fn(),
            getImageData: vi.fn(() => ({
                data: new Uint8ClampedArray(100 * 100 * 4)
            }))
        };
    });

    describe('canvasToTransparentPNG', () => {
        it('should convert canvas to PNG data URL', () => {
            const result = canvasToTransparentPNG(mockCanvas);
            
            expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/png');
            expect(result).toBe('data:image/png;base64,testPNGData');
        });

        it('should return null if no canvas provided', () => {
            const result = canvasToTransparentPNG(null);
            expect(result).toBeNull();
        });

        it('should handle conversion errors gracefully', () => {
            mockCanvas.toDataURL.mockImplementation(() => {
                throw new Error('Conversion failed');
            });
            
            const result = canvasToTransparentPNG(mockCanvas);
            expect(result).toBeNull();
        });
    });

    describe('validatePNGData', () => {
        it('should validate correct PNG data URL', () => {
            const validPNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
            expect(validatePNGData(validPNG)).toBe(true);
        });

        it('should reject invalid data URL format', () => {
            expect(validatePNGData('invalid-data')).toBe(false);
            expect(validatePNGData('data:image/jpeg;base64,somedata')).toBe(false);
            expect(validatePNGData('data:text/plain;base64,somedata')).toBe(false);
        });

        it('should reject null or undefined input', () => {
            expect(validatePNGData(null)).toBe(false);
            expect(validatePNGData(undefined)).toBe(false);
        });

        it('should reject non-string input', () => {
            expect(validatePNGData(123)).toBe(false);
            expect(validatePNGData({})).toBe(false);
            expect(validatePNGData([])).toBe(false);
        });
    });

    describe('createPhaserTexture', () => {
        let mockScene;

        beforeEach(() => {
            mockScene = {
                textures: {
                    addBase64: vi.fn(),
                    get: vi.fn(() => ({ key: 'test-texture' }))
                }
            };
        });

        it('should create Phaser texture from valid PNG data', () => {
            const validPNG = 'data:image/png;base64,testdata';
            const result = createPhaserTexture(mockScene, validPNG, 'test-key');
            
            expect(mockScene.textures.addBase64).toHaveBeenCalledWith('test-key', validPNG);
            expect(mockScene.textures.get).toHaveBeenCalledWith('test-key');
            expect(result).toEqual({ key: 'test-texture' });
        });

        it('should return null if scene is not provided', () => {
            const validPNG = 'data:image/png;base64,testdata';
            const result = createPhaserTexture(null, validPNG, 'test-key');
            expect(result).toBeNull();
        });

        it('should return null if PNG data is not provided', () => {
            const result = createPhaserTexture(mockScene, null, 'test-key');
            expect(result).toBeNull();
        });

        it('should return null if key is not provided', () => {
            const validPNG = 'data:image/png;base64,testdata';
            const result = createPhaserTexture(mockScene, validPNG, null);
            expect(result).toBeNull();
        });

        it('should return null if PNG data is invalid', () => {
            const invalidPNG = 'invalid-png-data';
            const result = createPhaserTexture(mockScene, invalidPNG, 'test-key');
            expect(result).toBeNull();
        });

        it('should handle texture creation errors gracefully', () => {
            mockScene.textures.addBase64.mockImplementation(() => {
                throw new Error('Texture creation failed');
            });
            
            const validPNG = 'data:image/png;base64,testdata';
            const result = createPhaserTexture(mockScene, validPNG, 'test-key');
            expect(result).toBeNull();
        });
    });

    describe('optimizePNGSize', () => {
        it('should optimize PNG size while maintaining aspect ratio', async () => {
            const validPNG = 'data:image/png;base64,testdata';
            const result = await optimizePNGSize(validPNG, 200, 200);
            
            expect(result).toBe('data:image/png;base64,optimizedPNGData');
        });

        it('should return original PNG if data is invalid', async () => {
            const invalidPNG = 'invalid-png-data';
            const result = await optimizePNGSize(invalidPNG, 200, 200);
            
            expect(result).toBe(invalidPNG);
        });

        it('should handle image loading errors gracefully', async () => {
            // Mock Image to trigger error
            const originalImage = global.Image;
            global.Image = class extends originalImage {
                set src(value) {
                    this._src = value;
                    setTimeout(() => {
                        if (this.onerror) {
                            this.onerror();
                        }
                    }, 0);
                }
            };

            const validPNG = 'data:image/png;base64,testdata';
            const result = await optimizePNGSize(validPNG, 200, 200);
            
            expect(result).toBe(validPNG); // Should return original
            
            // Restore original Image
            global.Image = originalImage;
        });
    });

    describe('cropTransparentPNG', () => {
        it('should crop PNG to content bounds', async () => {
            // Mock image data with content at specific location
            const imageData = new Uint8ClampedArray(100 * 100 * 4);
            // Set alpha channel for pixels to create a small drawing
            imageData[(25 * 100 + 25) * 4 + 3] = 255; // Pixel at (25, 25)
            imageData[(75 * 100 + 75) * 4 + 3] = 255; // Pixel at (75, 75)
            
            const mockCanvas = {
                width: 100,
                height: 100,
                getContext: vi.fn(() => ({
                    drawImage: vi.fn(),
                    getImageData: vi.fn(() => ({ data: imageData }))
                }))
            };
            
            const mockCroppedCanvas = {
                width: 0,
                height: 0,
                getContext: vi.fn(() => ({
                    drawImage: vi.fn()
                })),
                toDataURL: vi.fn(() => 'data:image/png;base64,croppedPNGData')
            };
            
            global.document.createElement
                .mockReturnValueOnce(mockCanvas)
                .mockReturnValueOnce(mockCroppedCanvas);
            
            const validPNG = 'data:image/png;base64,testdata';
            const result = await cropTransparentPNG(validPNG);
            
            expect(result).toBe('data:image/png;base64,croppedPNGData');
        });

        it('should return original PNG if no content found', async () => {
            // Mock empty image data (all transparent)
            const emptyImageData = new Uint8ClampedArray(100 * 100 * 4);
            
            const mockCanvas = {
                width: 100,
                height: 100,
                getContext: vi.fn(() => ({
                    drawImage: vi.fn(),
                    getImageData: vi.fn(() => ({ data: emptyImageData }))
                }))
            };
            
            global.document.createElement.mockReturnValue(mockCanvas);
            
            const validPNG = 'data:image/png;base64,testdata';
            const result = await cropTransparentPNG(validPNG);
            
            expect(result).toBe(validPNG);
        });

        it('should return original PNG if data is invalid', async () => {
            const invalidPNG = 'invalid-png-data';
            const result = await cropTransparentPNG(invalidPNG);
            
            expect(result).toBe(invalidPNG);
        });

        it('should handle image loading errors gracefully', async () => {
            // Mock Image to trigger error
            const originalImage = global.Image;
            global.Image = class extends originalImage {
                set src(value) {
                    this._src = value;
                    setTimeout(() => {
                        if (this.onerror) {
                            this.onerror();
                        }
                    }, 0);
                }
            };

            const validPNG = 'data:image/png;base64,testdata';
            const result = await cropTransparentPNG(validPNG);
            
            expect(result).toBe(validPNG); // Should return original
            
            // Restore original Image
            global.Image = originalImage;
        });
    });
});
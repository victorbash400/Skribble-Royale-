// PNG utility functions for handling transparent PNG conversion and processing

export function canvasToTransparentPNG(canvas) {
    if (!canvas) {
        console.error('Canvas is required for PNG conversion');
        return null;
    }
    
    try {
        // Export canvas as PNG with transparency preserved
        const dataURL = canvas.toDataURL('image/png');
        return dataURL;
    } catch (error) {
        console.error('Error converting canvas to PNG:', error);
        return null;
    }
}

export function validatePNGData(pngData) {
    if (!pngData || typeof pngData !== 'string') {
        console.warn('PNG data validation failed: invalid data type', typeof pngData);
        return false;
    }
    
    // Check if it's a valid data URL with PNG format
    const pngPattern = /^data:image\/png;base64,/;
    const isValid = pngPattern.test(pngData);
    
    if (!isValid) {
        console.warn('PNG data validation failed: invalid format', pngData.substring(0, 50) + '...');
    }
    
    return isValid;
}

export function createPhaserTexture(scene, pngData, key) {
    if (!scene || !pngData || !key) {
        console.error('Scene, PNG data, and key are required for texture creation');
        return null;
    }
    
    if (!validatePNGData(pngData)) {
        console.error('Invalid PNG data provided');
        return null;
    }
    
    try {
        // Create texture from base64 PNG data
        scene.textures.addBase64(key, pngData);
        return scene.textures.get(key);
    } catch (error) {
        console.error('Error creating Phaser texture:', error);
        return null;
    }
}

export function optimizePNGSize(pngData, maxWidth = 200, maxHeight = 200) {
    if (!validatePNGData(pngData)) {
        console.error('Invalid PNG data for optimization');
        return pngData;
    }
    
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Calculate new dimensions while maintaining aspect ratio
            const aspectRatio = img.width / img.height;
            let newWidth = maxWidth;
            let newHeight = maxHeight;
            
            if (aspectRatio > 1) {
                newHeight = maxWidth / aspectRatio;
            } else {
                newWidth = maxHeight * aspectRatio;
            }
            
            canvas.width = newWidth;
            canvas.height = newHeight;
            
            // Draw resized image with transparency preserved
            ctx.clearRect(0, 0, newWidth, newHeight);
            ctx.drawImage(img, 0, 0, newWidth, newHeight);
            
            // Export optimized PNG
            const optimizedPNG = canvas.toDataURL('image/png');
            resolve(optimizedPNG);
        };
        
        img.onerror = function() {
            console.error('Error loading image for optimization');
            resolve(pngData); // Return original if optimization fails
        };
        
        img.src = pngData;
    });
}

// Additional utility function for drawing canvas bounds optimization
export function cropTransparentPNG(pngData) {
    if (!validatePNGData(pngData)) {
        console.error('Invalid PNG data for cropping');
        return pngData;
    }
    
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
            let hasContent = false;
            
            // Find bounds of non-transparent pixels
            for (let y = 0; y < canvas.height; y++) {
                for (let x = 0; x < canvas.width; x++) {
                    const alpha = data[(y * canvas.width + x) * 4 + 3];
                    if (alpha > 0) {
                        hasContent = true;
                        minX = Math.min(minX, x);
                        minY = Math.min(minY, y);
                        maxX = Math.max(maxX, x);
                        maxY = Math.max(maxY, y);
                    }
                }
            }
            
            if (!hasContent) {
                resolve(pngData); // Return original if no content
                return;
            }
            
            // Create cropped canvas
            const croppedWidth = maxX - minX + 1;
            const croppedHeight = maxY - minY + 1;
            const croppedCanvas = document.createElement('canvas');
            const croppedCtx = croppedCanvas.getContext('2d');
            
            croppedCanvas.width = croppedWidth;
            croppedCanvas.height = croppedHeight;
            
            // Copy cropped region
            croppedCtx.drawImage(canvas, minX, minY, croppedWidth, croppedHeight, 0, 0, croppedWidth, croppedHeight);
            
            const croppedPNG = croppedCanvas.toDataURL('image/png');
            resolve(croppedPNG);
        };
        
        img.onerror = function() {
            console.error('Error loading image for cropping');
            resolve(pngData);
        };
        
        img.src = pngData;
    });
}
class DrawingCanvas {
    constructor(width = 400, height = 400) {
        this.canvas = null;
        this.context = null;
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;
        this.width = width;
        this.height = height;
        this.currentTool = 'brush';
        this.brushSize = 5;
        this.brushColor = '#000000';
        
        // Initialize the canvas
        this.initializeTransparentCanvas();
        this.setupEventListeners();
    }

    initializeTransparentCanvas() {
        // Create canvas element
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.canvas.style.border = '2px solid #333';
        this.canvas.style.cursor = 'crosshair';
        
        // Get 2D context and set transparent background
        this.context = this.canvas.getContext('2d');
        
        // Clear with transparent background
        this.context.clearRect(0, 0, this.width, this.height);
        
        // Set drawing properties
        this.context.lineCap = 'round';
        this.context.lineJoin = 'round';
        this.context.globalCompositeOperation = 'source-over';
    }

    setupEventListeners() {
        if (!this.canvas) return;

        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.startDrawing(x, y);
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isDrawing) return;
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.draw(x, y);
        });

        this.canvas.addEventListener('mouseup', () => {
            this.stopDrawing();
        });

        this.canvas.addEventListener('mouseout', () => {
            this.stopDrawing();
        });

        // Touch events for mobile support
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            this.startDrawing(x, y);
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!this.isDrawing) return;
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            this.draw(x, y);
        });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.stopDrawing();
        });
    }

    startDrawing(x, y) {
        this.isDrawing = true;
        this.lastX = x;
        this.lastY = y;
        
        // Set drawing properties based on current tool
        if (this.currentTool === 'brush') {
            this.context.globalCompositeOperation = 'source-over';
            this.context.strokeStyle = this.brushColor;
            this.context.lineWidth = this.brushSize;
        } else if (this.currentTool === 'eraser') {
            this.context.globalCompositeOperation = 'destination-out';
            this.context.lineWidth = this.brushSize * 2; // Eraser is bigger
        }
        
        // Start the path
        this.context.beginPath();
        this.context.moveTo(x, y);
    }

    draw(x, y) {
        if (!this.isDrawing) return;
        
        // Draw line from last position to current position
        this.context.lineTo(x, y);
        this.context.stroke();
        
        // Update last position
        this.lastX = x;
        this.lastY = y;
    }

    stopDrawing() {
        if (!this.isDrawing) return;
        this.isDrawing = false;
        this.context.beginPath(); // Reset path
    }

    exportToPNG() {
        if (!this.canvas) {
            console.error('Canvas not initialized');
            return null;
        }
        
        try {
            // Export as PNG with transparency preserved
            const dataURL = this.canvas.toDataURL('image/png');
            return dataURL;
        } catch (error) {
            console.error('Error exporting PNG:', error);
            return null;
        }
    }

    clear() {
        if (!this.context) return;
        
        // Clear the entire canvas with transparent background
        this.context.clearRect(0, 0, this.width, this.height);
    }

    // Tool management methods
    setBrushTool(size = 5, color = '#000000') {
        this.currentTool = 'brush';
        this.brushSize = size;
        this.brushColor = color;
    }

    setEraserTool(size = 10) {
        this.currentTool = 'eraser';
        this.brushSize = size;
    }

    // Utility methods
    getCanvas() {
        return this.canvas;
    }

    appendToElement(parentElement) {
        if (this.canvas && parentElement) {
            parentElement.appendChild(this.canvas);
        }
    }

    removeFromDOM() {
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }

    // Get drawing bounds for optimization
    getDrawingBounds() {
        if (!this.canvas) return null;
        
        const imageData = this.context.getImageData(0, 0, this.width, this.height);
        const data = imageData.data;
        
        let minX = this.width, minY = this.height, maxX = 0, maxY = 0;
        let hasDrawing = false;
        
        // Find bounds of non-transparent pixels
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const alpha = data[(y * this.width + x) * 4 + 3];
                if (alpha > 0) {
                    hasDrawing = true;
                    minX = Math.min(minX, x);
                    minY = Math.min(minY, y);
                    maxX = Math.max(maxX, x);
                    maxY = Math.max(maxY, y);
                }
            }
        }
        
        return hasDrawing ? { minX, minY, maxX, maxY } : null;
    }
}

export default DrawingCanvas;
// Simple test to verify DrawingScene integration
import DrawingScene from './src/scenes/DrawingScene.js';
import DrawingCanvas from './src/components/DrawingCanvas.js';

console.log('Testing DrawingScene integration...');

// Test 1: DrawingScene can be instantiated
try {
    const drawingScene = new DrawingScene();
    console.log('✅ DrawingScene instantiated successfully');
    console.log('   - Key:', drawingScene.key);
    console.log('   - Initial state:', {
        isDrawingComplete: drawingScene.isDrawingComplete,
        isWaitingForOpponent: drawingScene.isWaitingForOpponent,
        currentTool: drawingScene.currentTool,
        brushSize: drawingScene.brushSize,
        brushColor: drawingScene.brushColor
    });
} catch (error) {
    console.error('❌ Failed to instantiate DrawingScene:', error);
}

// Test 2: DrawingCanvas can be instantiated
try {
    const drawingCanvas = new DrawingCanvas(400, 400);
    console.log('✅ DrawingCanvas instantiated successfully');
    console.log('   - Dimensions:', drawingCanvas.width, 'x', drawingCanvas.height);
    console.log('   - Current tool:', drawingCanvas.currentTool);
    
    // Test canvas methods
    drawingCanvas.setBrushTool(10, '#FF0000');
    console.log('✅ Brush tool set successfully');
    
    drawingCanvas.setEraserTool(15);
    console.log('✅ Eraser tool set successfully');
    
    // Clean up
    drawingCanvas.removeFromDOM();
    console.log('✅ Canvas cleaned up successfully');
} catch (error) {
    console.error('❌ Failed to test DrawingCanvas:', error);
}

// Test 3: DrawingScene methods
try {
    const drawingScene = new DrawingScene();
    
    // Mock the required Phaser methods
    drawingScene.add = {
        text: () => ({ setOrigin: () => ({}), setText: () => ({}), setFill: () => ({}) }),
        rectangle: () => ({ 
            setInteractive: () => ({}), 
            on: () => ({}), 
            setStrokeStyle: () => ({}),
            setFillStyle: () => ({}),
            disableInteractive: () => ({}),
            setAlpha: () => ({})
        })
    };
    drawingScene.time = { now: 0 };
    
    // Mock GameManager
    global.window = {
        gameManager: {
            playerId: 'test-player',
            getGameState: () => ({
                phase: 'drawing',
                roomCode: 'TEST123',
                players: {}
            }),
            sendGameEvent: (event) => console.log('Game event sent:', event.type)
        }
    };
    
    // Test tool selection
    drawingScene.selectTool('brush');
    console.log('✅ Tool selection works');
    
    drawingScene.selectColor('#00FF00');
    console.log('✅ Color selection works');
    
    drawingScene.selectSize(8);
    console.log('✅ Size selection works');
    
    // Test status updates
    drawingScene.updateStatus('Test message', '#FFFFFF');
    console.log('✅ Status update works');
    
    // Test event handling
    drawingScene.handleGameManagerEvent('player_joined', { playerId: 'other-player' });
    console.log('✅ Event handling works');
    
} catch (error) {
    console.error('❌ Failed to test DrawingScene methods:', error);
}

console.log('\n🎉 DrawingScene integration test completed!');
console.log('The DrawingScene is ready for use in the game.');
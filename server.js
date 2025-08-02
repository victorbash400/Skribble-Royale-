import { createServer } from 'http';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import WebSocketServer from './src/server/WebSocketServer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3000;
const WS_PORT = process.env.WS_PORT || 8080;

// Create HTTP server for serving static files
const server = createServer((req, res) => {
    let filePath = req.url === '/' ? '/index.html' : req.url;
    
    // Security: prevent directory traversal
    if (filePath.includes('..')) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }
    
    const fullPath = join(__dirname, filePath);
    
    try {
        const content = readFileSync(fullPath);
        
        // Set content type based on file extension
        const ext = filePath.split('.').pop();
        const contentTypes = {
            'html': 'text/html',
            'js': 'application/javascript',
            'css': 'text/css',
            'json': 'application/json'
        };
        
        res.writeHead(200, {
            'Content-Type': contentTypes[ext] || 'text/plain',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(content);
    } catch (error) {
        res.writeHead(404);
        res.end('File not found');
    }
});

// Start HTTP server
server.listen(PORT, () => {
    console.log(`HTTP Server running on http://localhost:${PORT}`);
    console.log('Open your browser and navigate to the URL above to play Scribble Royale');
});

// Start WebSocket server
const wsServer = new WebSocketServer(WS_PORT);
wsServer.start();

console.log(`WebSocket server will be available on ws://localhost:${WS_PORT}`);
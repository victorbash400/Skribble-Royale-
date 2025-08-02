import MenuScene from './scenes/MenuScene.js';
import DrawingScene from './scenes/DrawingScene.js';
import CombatScene from './scenes/CombatScene.js';
import ResultsScene from './scenes/ResultsScene.js';
import GameManager from './components/GameManager.js';

// Phaser 3 game configuration
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#34495e',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 },
            debug: false
        }
    },
    scene: [MenuScene, DrawingScene, CombatScene, ResultsScene]
};

// Initialize game and game manager
const game = new Phaser.Game(config);
const gameManager = new GameManager();
gameManager.game = game;
gameManager.initializeGame();

// Make game manager globally accessible for scenes
window.gameManager = gameManager;

// Remove loading text once game is ready
game.events.once('ready', () => {
    const loadingElement = document.querySelector('.loading');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
    console.log('Scribble Royale initialized successfully');
});
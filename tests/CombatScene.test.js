import CombatScene from '../src/scenes/CombatScene.js';
import Fighter from '../src/components/Fighter.js';

// Mock Phaser Scene
class MockScene {
    constructor() {
        this.physics = {
            world: {
                setBounds: jest.fn(),
                setBoundsCollision: jest.fn(),
                gravity: { y: 0 }
            },
            add: {
                existing: jest.fn(),
                collider: jest.fn()
            }
        };
        this.add = {
            rectangle: jest.fn(() => ({ 
                setOrigin: jest.fn(() => ({})),
                setText: jest.fn()
            })),
            text: jest.fn(() => ({ 
                setOrigin: jest.fn(() => ({})),
                setText: jest.fn()
            })),
            line: jest.fn(),
            existing: jest.fn()
        };
        this.children = {
            list: []
        };
        this.time = {
            delayedCall: jest.fn()
        };
        this.textures = {
            addCanvas: jest.fn(),
            remove: jest.fn()
        };
    }
}

// Mock GameManager
const mockGameManager = {
    getGameState: jest.fn(() => ({
        roomCode: 'TEST123',
        players: {
            'player1': { id: 'player1', pngData: 'data:image/png;base64,test1' },
            'player2': { id: 'player2', pngData: 'data:image/png;base64,test2' }
        }
    }))
};

describe('CombatScene', () => {
    let combatScene;
    let mockScene;

    beforeEach(() => {
        mockScene = new MockScene();
        combatScene = new CombatScene();
        
        // Copy mock methods to combat scene
        Object.assign(combatScene, mockScene);
        
        // Mock window.gameManager
        global.window = { gameManager: mockGameManager };
        
        // Mock console methods
        console.log = jest.fn();
        console.warn = jest.fn();
        console.error = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        test('should initialize with correct default values', () => {
            const scene = new CombatScene();
            
            expect(scene.gameManager).toBeNull();
            expect(scene.fighters).toEqual({});
            expect(scene.arena).toEqual({
                width: 800,
                height: 600,
                groundY: 500,
                leftSpawnX: 150,
                rightSpawnX: 650
            });
            expect(scene.fightersLoaded).toBe(false);
        });
    });

    describe('setupPhysicsWorld', () => {
        test('should configure physics world correctly', () => {
            combatScene.setupPhysicsWorld();
            
            expect(combatScene.physics.world.setBounds).toHaveBeenCalledWith(0, 0, 800, 600);
            expect(combatScene.physics.world.setBoundsCollision).toHaveBeenCalledWith(true, true, true, false);
            expect(combatScene.physics.world.gravity.y).toBe(300);
        });
    });

    describe('createArena', () => {
        test('should create arena elements', () => {
            combatScene.createArena();
            
            // Should create background, ground, walls, and UI elements
            expect(combatScene.add.rectangle).toHaveBeenCalledTimes(4); // background + ground + 2 walls
            expect(combatScene.add.text).toHaveBeenCalledWith(400, 50, 'COMBAT ARENA', expect.any(Object));
            expect(combatScene.add.line).toHaveBeenCalled();
            expect(combatScene.physics.add.existing).toHaveBeenCalledTimes(3); // ground + 2 walls
        });

        test('should store ground and walls references', () => {
            combatScene.createArena();
            
            expect(combatScene.ground).toBeDefined();
            expect(combatScene.walls).toHaveLength(2);
        });
    });

    describe('setupUI', () => {
        test('should display room code when available', () => {
            combatScene.gameManager = mockGameManager;
            combatScene.setupUI();
            
            expect(combatScene.add.text).toHaveBeenCalledWith(400, 80, 'Room: TEST123', expect.any(Object));
        });

        test('should display loading status', () => {
            combatScene.setupUI();
            
            expect(combatScene.add.text).toHaveBeenCalledWith(400, 110, 'Fighters Loading...', expect.any(Object));
        });
    });

    describe('spawnDefaultFighter', () => {
        beforeEach(() => {
            combatScene.ground = { mock: 'ground' };
            combatScene.walls = [{ mock: 'wall1' }, { mock: 'wall2' }];
            combatScene.fighters = {};
        });

        test('should spawn fighter at correct position for index 0', () => {
            const player = { id: 'player1' };
            
            combatScene.spawnDefaultFighter(player, 0);
            
            expect(combatScene.add.rectangle).toHaveBeenCalledWith(150, 450, 40, 60, 0xff0000);
            expect(combatScene.fighters['player1']).toBeDefined();
        });

        test('should spawn fighter at correct position for index 1', () => {
            const player = { id: 'player2' };
            
            combatScene.spawnDefaultFighter(player, 1);
            
            expect(combatScene.add.rectangle).toHaveBeenCalledWith(650, 450, 40, 60, 0x0000ff);
            expect(combatScene.fighters['player2']).toBeDefined();
        });

        test('should setup physics for spawned fighter', () => {
            const player = { id: 'player1' };
            const mockSprite = {
                body: {
                    setCollideWorldBounds: jest.fn(),
                    setBounce: jest.fn(),
                    setGravityY: jest.fn()
                }
            };
            combatScene.add.rectangle.mockReturnValue(mockSprite);
            
            combatScene.spawnDefaultFighter(player, 0);
            
            expect(combatScene.physics.add.existing).toHaveBeenCalledWith(mockSprite);
            expect(mockSprite.body.setCollideWorldBounds).toHaveBeenCalledWith(true);
            expect(mockSprite.body.setBounce).toHaveBeenCalledWith(0.2);
            expect(mockSprite.body.setGravityY).toHaveBeenCalledWith(300);
        });
    });

    describe('setupFighterCollisions', () => {
        beforeEach(() => {
            combatScene.ground = { mock: 'ground' };
            combatScene.walls = [{ mock: 'wall1' }, { mock: 'wall2' }];
            combatScene.fighters = {};
        });

        test('should setup collisions with ground and walls', () => {
            const fighter = {
                sprite: { mock: 'sprite' }
            };
            
            combatScene.setupFighterCollisions(fighter);
            
            expect(combatScene.physics.add.collider).toHaveBeenCalledWith(fighter.sprite, combatScene.ground);
            expect(combatScene.physics.add.collider).toHaveBeenCalledWith(fighter.sprite, combatScene.walls[0]);
            expect(combatScene.physics.add.collider).toHaveBeenCalledWith(fighter.sprite, combatScene.walls[1]);
        });

        test('should not setup collisions if fighter has no sprite', () => {
            const fighter = {};
            
            combatScene.setupFighterCollisions(fighter);
            
            expect(combatScene.physics.add.collider).not.toHaveBeenCalled();
        });
    });

    describe('clearFighters', () => {
        test('should destroy all fighters with destroy method', () => {
            const mockFighter1 = { destroy: jest.fn() };
            const mockFighter2 = { destroy: jest.fn() };
            
            combatScene.fighters = {
                'player1': mockFighter1,
                'player2': mockFighter2
            };
            
            combatScene.clearFighters();
            
            expect(mockFighter1.destroy).toHaveBeenCalled();
            expect(mockFighter2.destroy).toHaveBeenCalled();
            expect(combatScene.fighters).toEqual({});
        });

        test('should destroy fighters with sprite property', () => {
            const mockSprite1 = { destroy: jest.fn() };
            const mockSprite2 = { destroy: jest.fn() };
            const mockFighter1 = { sprite: mockSprite1 };
            const mockFighter2 = { sprite: mockSprite2 };
            
            combatScene.fighters = {
                'player1': mockFighter1,
                'player2': mockFighter2
            };
            
            combatScene.clearFighters();
            
            expect(mockSprite1.destroy).toHaveBeenCalled();
            expect(mockSprite2.destroy).toHaveBeenCalled();
            expect(combatScene.fighters).toEqual({});
        });
    });

    describe('handleGameManagerEvent', () => {
        beforeEach(() => {
            combatScene.loadFighters = jest.fn();
            combatScene.updateCombatStatus = jest.fn();
        });

        test('should reload fighters on game_state_update', () => {
            combatScene.handleGameManagerEvent('game_state_update', {});
            
            expect(combatScene.loadFighters).toHaveBeenCalled();
        });

        test('should reload fighters on player_joined', () => {
            combatScene.handleGameManagerEvent('player_joined', {});
            
            expect(combatScene.loadFighters).toHaveBeenCalled();
        });

        test('should remove fighter on player_left', () => {
            const mockFighter = { destroy: jest.fn() };
            combatScene.fighters = { 'player1': mockFighter };
            
            combatScene.handleGameManagerEvent('player_left', { playerId: 'player1' });
            
            expect(mockFighter.destroy).toHaveBeenCalled();
            expect(combatScene.fighters['player1']).toBeUndefined();
            expect(combatScene.updateCombatStatus).toHaveBeenCalled();
        });
    });

    describe('getFighter', () => {
        test('should return fighter by player ID', () => {
            const mockFighter = { id: 'fighter1' };
            combatScene.fighters = { 'player1': mockFighter };
            
            const result = combatScene.getFighter('player1');
            
            expect(result).toBe(mockFighter);
        });

        test('should return null for non-existent fighter', () => {
            combatScene.fighters = {};
            
            const result = combatScene.getFighter('nonexistent');
            
            expect(result).toBeNull();
        });
    });

    describe('getAllFighters', () => {
        test('should return copy of all fighters', () => {
            const mockFighters = {
                'player1': { id: 'fighter1' },
                'player2': { id: 'fighter2' }
            };
            combatScene.fighters = mockFighters;
            
            const result = combatScene.getAllFighters();
            
            expect(result).toEqual(mockFighters);
            expect(result).not.toBe(mockFighters); // Should be a copy
        });
    });

    describe('testFighterPositioning', () => {
        test('should spawn test fighters', () => {
            combatScene.spawnDefaultFighter = jest.fn();
            
            combatScene.testFighterPositioning();
            
            expect(combatScene.spawnDefaultFighter).toHaveBeenCalledTimes(2);
            expect(combatScene.spawnDefaultFighter).toHaveBeenCalledWith({ id: 'test1', pngData: null }, 0);
            expect(combatScene.spawnDefaultFighter).toHaveBeenCalledWith({ id: 'test2', pngData: null }, 1);
        });
    });
});
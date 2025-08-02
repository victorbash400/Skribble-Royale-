import { describe, it, expect, beforeEach, vi } from 'vitest';
import Fighter from '../src/components/Fighter.js';

// Mock Phaser scene and components
const createMockScene = () => ({
    add: {
        sprite: vi.fn().mockReturnValue({
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            setPosition: vi.fn(),
            setTint: vi.fn(),
            clearTint: vi.fn(),
            destroy: vi.fn(),
            body: {
                setCollideWorldBounds: vi.fn(),
                setBounce: vi.fn(),
                setGravityY: vi.fn()
            }
        }),
        rectangle: vi.fn().mockReturnValue({
            x: 0,
            y: 0,
            width: 60,
            height: 8,
            setDepth: vi.fn(),
            setFillStyle: vi.fn(),
            destroy: vi.fn()
        })
    },
    physics: {
        add: {
            existing: vi.fn()
        }
    },
    textures: {
        addCanvas: vi.fn(),
        remove: vi.fn()
    },
    time: {
        delayedCall: vi.fn((delay, callback) => {
            // Execute callback immediately for testing
            callback();
        })
    }
});

// Mock DOM elements
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
    createElement: vi.fn((tag) => {
        if (tag === 'canvas') {
            return {
                width: 0,
                height: 0,
                getContext: vi.fn(() => ({
                    clearRect: vi.fn(),
                    drawImage: vi.fn()
                }))
            };
        }
        return {};
    })
};

describe('Fighter', () => {
    let mockScene;
    let fighter;

    beforeEach(() => {
        vi.clearAllMocks();
        mockScene = createMockScene();
    });

    describe('Constructor', () => {
        it('should initialize with default values', () => {
            fighter = new Fighter(mockScene);
            
            expect(fighter.scene).toBe(mockScene);
            expect(fighter.x).toBe(0);
            expect(fighter.y).toBe(0);
            expect(fighter.sprite).toBeNull();
            expect(fighter.health).toBe(100);
            expect(fighter.maxHealth).toBe(100);
            expect(fighter.velocity).toEqual({ x: 0, y: 0 });
            expect(fighter.isAttacking).toBe(false);
            expect(fighter.healthBar).toBeNull();
            expect(fighter.healthBarBackground).toBeNull();
            expect(fighter.textureKey).toBeNull();
        });

        it('should initialize with custom position', () => {
            fighter = new Fighter(mockScene, 100, 200);
            
            expect(fighter.x).toBe(100);
            expect(fighter.y).toBe(200);
        });

        it('should initialize with PNG data', async () => {
            const pngData = 'data:image/png;base64,mockPNGData';
            fighter = new Fighter(mockScene, 50, 75, pngData);
            
            // Wait for async PNG loading
            await new Promise(resolve => setTimeout(resolve, 10));
            
            expect(fighter.textureKey).toBeTruthy();
            expect(mockScene.textures.addCanvas).toHaveBeenCalled();
        });
    });

    describe('PNG Loading', () => {
        beforeEach(() => {
            fighter = new Fighter(mockScene, 100, 150);
        });

        it('should successfully load PNG data', async () => {
            const pngData = 'data:image/png;base64,mockPNGData';
            
            const result = await fighter.loadFromPNG(pngData);
            
            expect(result).toBe(true);
            expect(fighter.textureKey).toBeTruthy();
            expect(mockScene.textures.addCanvas).toHaveBeenCalled();
            expect(mockScene.add.sprite).toHaveBeenCalledWith(100, 150, fighter.textureKey);
        });

        it('should handle missing scene', async () => {
            fighter.scene = null;
            const pngData = 'data:image/png;base64,mockPNGData';
            
            const result = await fighter.loadFromPNG(pngData);
            
            expect(result).toBe(false);
        });

        it('should handle missing PNG data', async () => {
            const result = await fighter.loadFromPNG(null);
            
            expect(result).toBe(false);
        });

        it('should handle image load errors', async () => {
            // Mock Image to trigger error
            const OriginalImage = global.Image;
            global.Image = class {
                constructor() {
                    this.onload = null;
                    this.onerror = null;
                }
                
                set src(value) {
                    setTimeout(() => {
                        if (this.onerror) {
                            this.onerror();
                        }
                    }, 0);
                }
            };

            const pngData = 'data:image/png;base64,invalidData';
            
            try {
                const result = await fighter.loadFromPNG(pngData);
                expect(result).toBe(false);
            } catch (error) {
                expect(error.message).toBe('Failed to load PNG data');
            }
            
            // Restore original Image
            global.Image = OriginalImage;
        });

        it('should generate unique texture keys', async () => {
            const pngData = 'data:image/png;base64,mockPNGData';
            const fighter2 = new Fighter(mockScene, 200, 250);
            
            const result1 = await fighter.loadFromPNG(pngData);
            const result2 = await fighter2.loadFromPNG(pngData);
            
            expect(result1).toBe(true);
            expect(result2).toBe(true);
            expect(fighter.textureKey).toBeTruthy();
            expect(fighter2.textureKey).toBeTruthy();
            expect(fighter.textureKey).not.toBe(fighter2.textureKey);
        });
    });

    describe('Sprite Creation', () => {
        beforeEach(() => {
            fighter = new Fighter(mockScene, 100, 150);
            fighter.textureKey = 'test_texture';
        });

        it('should create sprite with physics', () => {
            fighter.createSprite();
            
            expect(mockScene.add.sprite).toHaveBeenCalledWith(100, 150, 'test_texture');
            expect(mockScene.physics.add.existing).toHaveBeenCalledWith(fighter.sprite);
            expect(fighter.sprite.body.setCollideWorldBounds).toHaveBeenCalledWith(true);
            expect(fighter.sprite.body.setBounce).toHaveBeenCalledWith(0.2);
            expect(fighter.sprite.body.setGravityY).toHaveBeenCalledWith(300);
        });

        it('should create health bar', () => {
            fighter.createSprite();
            
            expect(mockScene.add.rectangle).toHaveBeenCalledTimes(2); // Background and foreground
            expect(fighter.healthBar).toBeTruthy();
            expect(fighter.healthBarBackground).toBeTruthy();
        });

        it('should handle missing scene', () => {
            fighter.scene = null;
            
            expect(() => fighter.createSprite()).toThrow('Scene and texture key are required');
        });

        it('should handle missing texture key', () => {
            fighter.textureKey = null;
            
            expect(() => fighter.createSprite()).toThrow('Scene and texture key are required');
        });

        it('should work without physics system', () => {
            mockScene.physics = null;
            
            expect(() => fighter.createSprite()).not.toThrow();
            expect(mockScene.add.sprite).toHaveBeenCalled();
        });
    });

    describe('Health System', () => {
        beforeEach(async () => {
            fighter = new Fighter(mockScene, 100, 150);
            fighter.textureKey = 'test_texture';
            fighter.createSprite();
        });

        it('should take damage correctly', () => {
            fighter.takeDamage(30);
            
            expect(fighter.health).toBe(70);
            expect(fighter.sprite.setTint).toHaveBeenCalledWith(0xff0000);
            expect(mockScene.time.delayedCall).toHaveBeenCalled();
        });

        it('should not go below zero health', () => {
            fighter.takeDamage(150);
            
            expect(fighter.health).toBe(0);
        });

        it('should ignore negative damage', () => {
            const initialHealth = fighter.health;
            fighter.takeDamage(-10);
            
            expect(fighter.health).toBe(initialHealth);
        });

        it('should ignore non-numeric damage', () => {
            const initialHealth = fighter.health;
            fighter.takeDamage('invalid');
            
            expect(fighter.health).toBe(initialHealth);
        });

        it('should heal correctly', () => {
            fighter.health = 50;
            fighter.heal(20);
            
            expect(fighter.health).toBe(70);
        });

        it('should not exceed max health when healing', () => {
            fighter.health = 90;
            fighter.heal(20);
            
            expect(fighter.health).toBe(100);
        });

        it('should ignore negative healing', () => {
            const initialHealth = fighter.health;
            fighter.heal(-10);
            
            expect(fighter.health).toBe(initialHealth);
        });

        it('should check if fighter is alive', () => {
            expect(fighter.isAlive()).toBe(true);
            
            fighter.health = 0;
            expect(fighter.isAlive()).toBe(false);
        });
    });

    describe('Health Bar Updates', () => {
        beforeEach(() => {
            fighter = new Fighter(mockScene, 100, 150);
            fighter.textureKey = 'test_texture';
            fighter.createSprite();
        });

        it('should update health bar width based on health percentage', () => {
            fighter.health = 50; // 50% health
            fighter.updateHealthBar();
            
            expect(fighter.healthBar.width).toBe(30); // 50% of 60px
        });

        it('should change health bar color based on health level', () => {
            // High health (green)
            fighter.health = 80;
            fighter.updateHealthBar();
            expect(fighter.healthBar.setFillStyle).toHaveBeenCalledWith(0x00ff00);

            // Medium health (yellow)
            fighter.health = 50;
            fighter.updateHealthBar();
            expect(fighter.healthBar.setFillStyle).toHaveBeenCalledWith(0xffff00);

            // Low health (orange)
            fighter.health = 20;
            fighter.updateHealthBar();
            expect(fighter.healthBar.setFillStyle).toHaveBeenCalledWith(0xff6600);
        });

        it('should handle missing health bar elements gracefully', () => {
            fighter.healthBar = null;
            fighter.healthBarBackground = null;
            
            expect(() => fighter.updateHealthBar()).not.toThrow();
        });

        it('should update health bar positions to follow sprite', () => {
            fighter.sprite.x = 200;
            fighter.sprite.y = 300;
            fighter.updateHealthBar();
            
            expect(fighter.healthBar.x).toBe(200);
            expect(fighter.healthBarBackground.x).toBe(200);
        });
    });

    describe('Position Management', () => {
        beforeEach(() => {
            fighter = new Fighter(mockScene, 100, 150);
        });

        it('should get position when sprite exists', () => {
            fighter.textureKey = 'test_texture';
            fighter.createSprite();
            fighter.sprite.x = 200;
            fighter.sprite.y = 300;
            
            const position = fighter.getPosition();
            expect(position).toEqual({ x: 200, y: 300 });
        });

        it('should get position when sprite does not exist', () => {
            const position = fighter.getPosition();
            expect(position).toEqual({ x: 100, y: 150 });
        });

        it('should set position and update sprite', () => {
            fighter.textureKey = 'test_texture';
            fighter.createSprite();
            
            fighter.setPosition(250, 350);
            
            expect(fighter.x).toBe(250);
            expect(fighter.y).toBe(350);
            expect(fighter.sprite.setPosition).toHaveBeenCalledWith(250, 350);
        });

        it('should set position without sprite', () => {
            fighter.setPosition(250, 350);
            
            expect(fighter.x).toBe(250);
            expect(fighter.y).toBe(350);
        });
    });

    describe('Movement System', () => {
        beforeEach(() => {
            fighter = new Fighter(mockScene, 100, 150);
            fighter.textureKey = 'test_texture';
            fighter.createSprite();
            // Mock physics body methods
            fighter.sprite.body.setVelocityX = vi.fn();
            fighter.sprite.body.setVelocityY = vi.fn();
            fighter.sprite.body.blocked = { down: false };
            fighter.sprite.body.touching = { down: false };
            fighter.sprite.body.velocity = { x: 0, y: 0 };
            fighter.sprite.setFlipX = vi.fn();
        });

        it('should move fighter left', () => {
            fighter.move(-1);
            
            expect(fighter.sprite.body.setVelocityX).toHaveBeenCalledWith(-150);
            expect(fighter.velocity.x).toBe(-150);
            expect(fighter.sprite.setFlipX).toHaveBeenCalledWith(true);
        });

        it('should move fighter right', () => {
            fighter.move(1);
            
            expect(fighter.sprite.body.setVelocityX).toHaveBeenCalledWith(150);
            expect(fighter.velocity.x).toBe(150);
            expect(fighter.sprite.setFlipX).toHaveBeenCalledWith(false);
        });

        it('should stop fighter movement', () => {
            fighter.move(0);
            
            expect(fighter.sprite.body.setVelocityX).toHaveBeenCalledWith(0);
            expect(fighter.velocity.x).toBe(0);
        });

        it('should normalize movement direction', () => {
            // Test large positive value
            fighter.move(5);
            expect(fighter.sprite.body.setVelocityX).toHaveBeenCalledWith(150);
            
            // Test large negative value
            fighter.move(-3);
            expect(fighter.sprite.body.setVelocityX).toHaveBeenCalledWith(-150);
        });

        it('should handle missing sprite gracefully', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            fighter.sprite = null;
            
            expect(() => fighter.move(1)).not.toThrow();
            expect(consoleSpy).toHaveBeenCalledWith('Cannot move fighter: sprite or physics body not available');
            
            consoleSpy.mockRestore();
        });

        it('should handle missing physics body gracefully', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            fighter.sprite.body = null;
            
            expect(() => fighter.move(1)).not.toThrow();
            expect(consoleSpy).toHaveBeenCalledWith('Cannot move fighter: sprite or physics body not available');
            
            consoleSpy.mockRestore();
        });
    });

    describe('Jump System', () => {
        beforeEach(() => {
            fighter = new Fighter(mockScene, 100, 150);
            fighter.textureKey = 'test_texture';
            fighter.createSprite();
            fighter.sprite.body.setVelocityY = vi.fn();
            fighter.sprite.body.blocked = { down: false };
            fighter.sprite.body.touching = { down: false };
            fighter.sprite.body.velocity = { x: 0, y: 0 };
        });

        it('should make fighter jump when on ground (blocked.down)', () => {
            fighter.sprite.body.blocked.down = true;
            
            fighter.jump();
            
            expect(fighter.sprite.body.setVelocityY).toHaveBeenCalledWith(-400);
            expect(fighter.velocity.y).toBe(-400);
        });

        it('should make fighter jump when on ground (touching.down)', () => {
            fighter.sprite.body.touching.down = true;
            
            fighter.jump();
            
            expect(fighter.sprite.body.setVelocityY).toHaveBeenCalledWith(-400);
            expect(fighter.velocity.y).toBe(-400);
        });

        it('should make fighter jump when velocity is near zero', () => {
            fighter.sprite.body.velocity.y = 5; // Within jump threshold
            
            fighter.jump();
            
            expect(fighter.sprite.body.setVelocityY).toHaveBeenCalledWith(-400);
            expect(fighter.velocity.y).toBe(-400);
        });

        it('should not jump when in air', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
            fighter.sprite.body.velocity.y = -50; // Falling/jumping
            
            fighter.jump();
            
            expect(fighter.sprite.body.setVelocityY).not.toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith('Fighter cannot jump: not on ground');
            
            consoleSpy.mockRestore();
        });

        it('should handle missing sprite gracefully', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            fighter.sprite = null;
            
            expect(() => fighter.jump()).not.toThrow();
            expect(consoleSpy).toHaveBeenCalledWith('Cannot jump: sprite or physics body not available');
            
            consoleSpy.mockRestore();
        });

        it('should handle missing physics body gracefully', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            fighter.sprite.body = null;
            
            expect(() => fighter.jump()).not.toThrow();
            expect(consoleSpy).toHaveBeenCalledWith('Cannot jump: sprite or physics body not available');
            
            consoleSpy.mockRestore();
        });
    });

    describe('Attack System', () => {
        beforeEach(() => {
            fighter = new Fighter(mockScene, 100, 150);
            fighter.textureKey = 'test_texture';
            fighter.createSprite();
            fighter.sprite.flipX = false;
            fighter.sprite.setTint = vi.fn();
            fighter.sprite.clearTint = vi.fn();
            // Set sprite position to match fighter position
            fighter.sprite.x = 100;
            fighter.sprite.y = 150;
            
            // Mock scene methods for attack effects
            const mockHitbox = {
                setDepth: vi.fn(),
                destroy: vi.fn(),
                body: {
                    setImmovable: vi.fn()
                },
                attackerId: '',
                damage: 0
            };
            
            mockScene.add.rectangle = vi.fn().mockReturnValue(mockHitbox);
            mockScene.tweens = {
                add: vi.fn()
            };
            mockScene.physics.add = {
                existing: vi.fn()
            };
        });

        it('should perform attack when not already attacking', () => {
            expect(fighter.isAttacking).toBe(false);
            expect(fighter.canAttack()).toBe(true); // Verify fighter can attack
            expect(fighter.sprite).toBeTruthy(); // Verify sprite exists
            expect(fighter.isAlive()).toBe(true); // Verify fighter is alive
            
            fighter.attack();
            
            expect(fighter.isAttacking).toBe(true);
            expect(mockScene.add.rectangle).toHaveBeenCalled(); // Attack effect
            expect(fighter.sprite.setTint).toHaveBeenCalledWith(0xffaa00);
        });

        it('should not attack when already attacking', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
            fighter.isAttacking = true;
            
            fighter.attack();
            
            expect(consoleSpy).toHaveBeenCalledWith('Fighter already attacking');
            expect(mockScene.add.rectangle).not.toHaveBeenCalled();
            
            consoleSpy.mockRestore();
        });

        it('should create attack hitbox in correct direction (right)', () => {
            fighter.sprite.flipX = false; // Facing right
            
            fighter.attack();
            
            // Should create attack effect to the right (first call is the visual effect)
            expect(mockScene.add.rectangle).toHaveBeenNthCalledWith(1,
                180, // 100 + (1 * 80) = attack to the right
                150,
                60,
                40,
                0xffff00,
                0.5
            );
        });

        it('should create attack hitbox in correct direction (left)', () => {
            fighter.sprite.flipX = true; // Facing left
            
            fighter.attack();
            
            // Should create attack effect to the left (first call is the visual effect)
            expect(mockScene.add.rectangle).toHaveBeenNthCalledWith(1,
                20, // 100 + (-1 * 80) = attack to the left
                150,
                60,
                40,
                0xffff00,
                0.5
            );
        });

        it('should reset attack state after delay', () => {
            expect(fighter.canAttack()).toBe(true); // Verify fighter can attack
            
            fighter.attack();
            expect(fighter.isAttacking).toBe(true);
            
            // Simulate time delay callback
            const delayedCall = mockScene.time.delayedCall.mock.calls[0];
            expect(delayedCall[0]).toBe(300); // 300ms delay
            
            // Execute the callback
            delayedCall[1]();
            expect(fighter.isAttacking).toBe(false);
        });

        it('should handle missing sprite gracefully', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            fighter.sprite = null;
            
            expect(() => fighter.attack()).not.toThrow();
            expect(consoleSpy).toHaveBeenCalledWith('Cannot attack: sprite not available');
            
            consoleSpy.mockRestore();
        });

        it('should create attack effect with proper animation', () => {
            fighter.attack();
            
            expect(mockScene.tweens.add).toHaveBeenCalledWith({
                targets: expect.any(Object),
                scaleX: 1.2,
                scaleY: 1.2,
                alpha: 0,
                duration: 200,
                ease: 'Power2',
                onComplete: expect.any(Function)
            });
        });
    });

    describe('Fighter State Checks', () => {
        beforeEach(() => {
            fighter = new Fighter(mockScene, 100, 150);
            fighter.textureKey = 'test_texture';
            fighter.createSprite();
            fighter.sprite.body.blocked = { down: false };
            fighter.sprite.body.touching = { down: false };
            fighter.sprite.body.velocity = { x: 0, y: 0 };
        });

        it('should check if fighter can move', () => {
            expect(fighter.canMove()).toBe(true);
            
            fighter.isAttacking = true;
            expect(fighter.canMove()).toBe(false);
            
            fighter.isAttacking = false;
            fighter.health = 0;
            expect(fighter.canMove()).toBe(false);
        });

        it('should check if fighter can jump', () => {
            fighter.sprite.body.blocked.down = true;
            expect(fighter.canJump()).toBe(true);
            
            fighter.isAttacking = true;
            expect(fighter.canJump()).toBe(false);
            
            fighter.isAttacking = false;
            fighter.health = 0;
            expect(fighter.canJump()).toBe(false);
            
            fighter.health = 100;
            fighter.sprite.body.blocked.down = false;
            fighter.sprite.body.velocity.y = -50; // In air
            expect(fighter.canJump()).toBe(false);
        });

        it('should check if fighter can attack', () => {
            expect(fighter.canAttack()).toBe(true);
            
            fighter.isAttacking = true;
            expect(fighter.canAttack()).toBe(false);
            
            fighter.isAttacking = false;
            fighter.health = 0;
            expect(fighter.canAttack()).toBe(false);
        });

        it('should handle missing sprite in state checks', () => {
            fighter.sprite = null;
            
            expect(fighter.canMove()).toBe(false);
            expect(fighter.canJump()).toBe(false);
            expect(fighter.canAttack()).toBe(false);
        });
    });

    describe('Resource Cleanup', () => {
        beforeEach(() => {
            fighter = new Fighter(mockScene, 100, 150);
            fighter.textureKey = 'test_texture';
            fighter.createSprite();
        });

        it('should destroy all resources', () => {
            const spriteMock = fighter.sprite;
            const healthBarMock = fighter.healthBar;
            const healthBarBackgroundMock = fighter.healthBarBackground;
            
            fighter.destroy();
            
            expect(spriteMock.destroy).toHaveBeenCalled();
            expect(healthBarMock.destroy).toHaveBeenCalled();
            expect(healthBarBackgroundMock.destroy).toHaveBeenCalled();
            expect(mockScene.textures.remove).toHaveBeenCalledWith('test_texture');
            
            expect(fighter.sprite).toBeNull();
            expect(fighter.healthBar).toBeNull();
            expect(fighter.healthBarBackground).toBeNull();
            expect(fighter.textureKey).toBeNull();
        });

        it('should handle missing resources gracefully', () => {
            fighter.sprite = null;
            fighter.healthBar = null;
            fighter.healthBarBackground = null;
            fighter.textureKey = null;
            
            expect(() => fighter.destroy()).not.toThrow();
        });

        it('should handle missing scene textures', () => {
            fighter.scene.textures = null;
            
            expect(() => fighter.destroy()).not.toThrow();
        });
    });
});
import Fighter from '../components/Fighter.js';
import InputHandler from '../components/InputHandler.js';

class CombatScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CombatScene' });
        this.gameManager = null;
        this.fighters = {};
        this.inputHandler = null;
        this.playerFighterId = null; // ID of the fighter controlled by this player
        // Arena will be set up dynamically in create()
        this.ground = null;
        this.walls = [];
        this.fightersLoaded = false;
    }

    preload() {
        // Combat assets will be loaded here in future tasks
    }

    create() {
        console.log('CombatScene created');

        // Get reference to GameManager
        this.gameManager = window.gameManager;

        // Set up arena dimensions based on screen size
        this.arena = {
            width: this.cameras.main.width,
            height: this.cameras.main.height,
            groundY: this.cameras.main.height - 100,
            leftSpawnX: this.cameras.main.width * 0.2,
            rightSpawnX: this.cameras.main.width * 0.8
        };

        // Initialize input handler
        this.setupInputHandler();

        // Setup physics world
        this.setupPhysicsWorld();

        // Create arena
        this.createArena();

        // Setup UI
        this.setupUI();

        // Load fighters from game state (with small delay to ensure game state is synchronized)
        this.time.delayedCall(100, () => {
            this.loadFighters();
        });
    }

    /**
     * Setup input handler for fighter control
     */
    setupInputHandler() {
        this.inputHandler = new InputHandler();
        this.inputHandler.initialize();

        // Determine which fighter this player controls
        if (this.gameManager && this.gameManager.playerId) {
            this.playerFighterId = this.gameManager.playerId;
            console.log(`Player will control fighter: ${this.playerFighterId}`);
        }

        console.log('Input handler initialized');
    }

    /**
     * Configure physics world for combat
     */
    setupPhysicsWorld() {
        // Enable physics
        this.physics.world.setBounds(0, 0, this.arena.width, this.arena.height);
        this.physics.world.setBoundsCollision(true, true, true, true); // Enable bottom collision

        // Set gravity
        this.physics.world.gravity.y = 300;

        console.log('Physics world configured:', {
            bounds: { width: this.arena.width, height: this.arena.height },
            groundY: this.arena.groundY,
            gravity: this.physics.world.gravity.y
        });
    }

    /**
     * Create the combat arena with ground and boundaries
     */
    createArena() {
        // Paper-like background that fills the screen
        this.add.rectangle(this.cameras.main.centerX, this.cameras.main.centerY, this.arena.width, this.arena.height, 0xf8f8f8);

        // Hand-drawn style ground (visual only - no physics collision)
        this.ground = this.add.rectangle(this.cameras.main.centerX, this.arena.groundY, this.arena.width, 40, 0x8b4513);
        this.ground.setStrokeStyle(2, 0x654321);
        // Don't add physics to ground - let world bounds handle collision

        // Create side walls (invisible collision boundaries)
        const leftWall = this.add.rectangle(0, this.cameras.main.centerY, 20, this.arena.height, 0x000000, 0);
        const rightWall = this.add.rectangle(this.arena.width, this.cameras.main.centerY, 20, this.arena.height, 0x000000, 0);

        this.physics.add.existing(leftWall, true);
        this.physics.add.existing(rightWall, true);

        this.walls = [leftWall, rightWall];

        // Doodly title
        this.add.text(this.cameras.main.centerX, 50, 'Battle Arena!', {
            fontSize: '36px',
            fill: '#2c3e50',
            fontFamily: 'Comic Sans MS, cursive, sans-serif',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Add doodly underline
        this.add.line(this.cameras.main.centerX, 75, -120, 0, 120, 0, 0x2c3e50)
            .setLineWidth(3, 3);

        // Draw some paper-style decorations (clouds, sun, grass)
        // Simple cloud doodles positioned relative to screen width
        const cloudY = 120;
        this.drawDoodleCloud(this.arena.width * 0.2, cloudY);
        this.drawDoodleCloud(this.arena.width * 0.8, cloudY);
        
        // Simple sun
        this.drawDoodleSun(this.arena.width * 0.9, 150);

        // Grass tufts along the ground
        for (let i = 50; i < this.arena.width - 50; i += 60) {
            this.drawGrassTuft(i, this.arena.groundY - 8);
        }

        console.log('Doodle arena created');
    }

    drawDoodleCloud(x, y) {
        // Simple cloud with circles
        const cloud1 = this.add.circle(x - 15, y, 12, 0xecf0f1);
        const cloud2 = this.add.circle(x, y - 5, 15, 0xecf0f1);
        const cloud3 = this.add.circle(x + 15, y, 12, 0xecf0f1);
        
        cloud1.setStrokeStyle(2, 0x95a5a6);
        cloud2.setStrokeStyle(2, 0x95a5a6);
        cloud3.setStrokeStyle(2, 0x95a5a6);
    }

    drawDoodleSun(x, y) {
        // Simple sun with rays
        const sun = this.add.circle(x, y, 20, 0xf1c40f);
        sun.setStrokeStyle(2, 0xf39c12);
        
        // Sun rays
        for (let i = 0; i < 8; i++) {
            const angle = (i * 45) * Math.PI / 180;
            const rayX = x + Math.cos(angle) * 30;
            const rayY = y + Math.sin(angle) * 30;
            const ray = this.add.line(x, y, 0, 0, rayX - x, rayY - y, 0xf39c12);
            ray.setLineWidth(2, 2);
        }
    }

    drawGrassTuft(x, y) {
        // Simple grass tuft
        for (let i = 0; i < 3; i++) {
            const grassX = x + (i - 1) * 3;
            const grass = this.add.line(grassX, y, 0, 0, Math.random() * 4 - 2, -8 - Math.random() * 4, 0x27ae60);
            grass.setLineWidth(2, 2);
        }
    }

    /**
     * Setup combat UI elements
     */
    setupUI() {
        // Room info display
        const gameState = this.gameManager ? this.gameManager.getGameState() : null;
        if (gameState && gameState.roomCode) {
            this.add.text(400, 80, `Room: ${gameState.roomCode}`, {
                fontSize: '14px',
                fill: '#00ff00',
                fontFamily: 'Arial'
            }).setOrigin(0.5);
        }

        // Combat status
        this.add.text(400, 110, 'Fighters Loading...', {
            fontSize: '16px',
            fill: '#ffff00',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
    }

    /**
     * Load fighters from submitted PNG data
     */
    async loadFighters() {
        const gameState = this.gameManager ? this.gameManager.getGameState() : null;

        console.log('🎮 loadFighters called, gameState:', gameState);

        if (!gameState || !gameState.players) {
            console.warn('❌ No game state or players available:', {
                hasGameManager: !!this.gameManager,
                hasGameState: !!gameState,
                hasPlayers: gameState ? !!gameState.players : false
            });
            return;
        }

        const players = Object.values(gameState.players);
        console.log('Loading fighters for players:', players);
        
        // Debug: Check each player's data structure
        players.forEach((player, index) => {
            console.log(`Player ${index}:`, {
                id: player.id,
                ready: player.ready,
                hasFighterImage: !!player.fighterImage,
                fighterImagePreview: player.fighterImage ? player.fighterImage.substring(0, 50) + '...' : 'null',
                hasPngData: !!player.pngData
            });
        });

        // Clear existing fighters
        this.clearFighters();

        let fighterIndex = 0;
        const maxFighters = 2; // Support up to 2 fighters for now

        for (const player of players) {
            if (fighterIndex >= maxFighters) break;

            try {
                await this.spawnFighter(player, fighterIndex);
                fighterIndex++;
            } catch (error) {
                console.error(`Failed to spawn fighter for player ${player.id}:`, error);
            }
        }

        this.fightersLoaded = fighterIndex > 0; // Only mark as loaded if we actually loaded fighters
        this.updateCombatStatus();
        
        console.log(`✅ Successfully loaded ${fighterIndex} fighters`);
        
        // If no fighters were loaded, set up a retry mechanism
        if (fighterIndex === 0) {
            console.log('⚠️ No fighters loaded, setting up retry mechanism');
            this.setupFighterLoadRetry();
        }
    }

    /**
     * Spawn a fighter at the appropriate position
     * @param {Object} player - Player data containing PNG data
     * @param {number} index - Fighter index (0 = left, 1 = right)
     */
    async spawnFighter(player, index) {
        // Check for PNG data in either fighterImage or pngData property
        const pngData = player.fighterImage || player.pngData;
        
        console.log(`🎭 Spawning fighter for player ${player.id}:`, {
            hasFighterImage: !!player.fighterImage,
            hasPngData: !!player.pngData,
            finalPngData: !!pngData,
            pngDataPreview: pngData ? pngData.substring(0, 50) + '...' : 'null'
        });
        
        if (!player || !pngData) {
            console.warn('❌ Player missing PNG data:', player);
            // Create a default fighter for testing
            return this.spawnDefaultFighter(player, index);
        }

        // Determine spawn position
        const spawnX = index === 0 ? this.arena.leftSpawnX : this.arena.rightSpawnX;
        const spawnY = this.arena.groundY - 60; // Spawn closer to ground

        // Create fighter
        const fighter = new Fighter(this, spawnX, spawnY, pngData);

        try {
            // Load fighter from PNG data
            const success = await fighter.loadFromPNG(pngData);

            if (success) {
                // Store fighter reference
                this.fighters[player.id] = fighter;

                // Setup collision with ground and walls
                this.setupFighterCollisions(fighter);

                console.log(`Fighter spawned for player ${player.id} at position (${spawnX}, ${spawnY})`);
            } else {
                throw new Error('Failed to load fighter from PNG');
            }
        } catch (error) {
            console.error('Error spawning fighter:', error);
            // Fallback to default fighter
            fighter.destroy();
            return this.spawnDefaultFighter(player, index);
        }
    }

    /**
     * Spawn a default fighter for testing when PNG data is not available
     * @param {Object} player - Player data
     * @param {number} index - Fighter index
     */
    spawnDefaultFighter(player, index) {
        const spawnX = index === 0 ? this.arena.leftSpawnX : this.arena.rightSpawnX;
        const spawnY = this.arena.groundY - 50; // Spawn closer to ground

        // Create a simple colored rectangle as default fighter
        // Use consistent color based on player ID hash, not index
        const playerColor = this.getPlayerColor(player.id);
        const defaultSprite = this.add.rectangle(spawnX, spawnY, 40, 60, playerColor);
        this.physics.add.existing(defaultSprite);

        if (defaultSprite.body) {
            defaultSprite.body.setCollideWorldBounds(true);
            defaultSprite.body.setBounce(0.1);
            defaultSprite.body.setDragX(100); // Add drag to prevent sliding
            defaultSprite.body.setMaxVelocity(300, 800); // Limit velocities like Fighter class
        }

        // Create health bar
        const healthBarBg = this.add.rectangle(spawnX, spawnY - 40, 60, 8, 0x000000);
        const healthBar = this.add.rectangle(spawnX, spawnY - 40, 58, 6, 0x00ff00);
        
        // Create player name label
        const nameLabel = this.add.text(spawnX, spawnY - 55, player.id.substring(7, 13), {
            fontSize: '10px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Create a simple fighter object with methods
        const fighter = {
            sprite: defaultSprite,
            health: 100,
            maxHealth: 100,
            playerId: player.id,
            isDefault: true,
            healthBar: healthBar,
            healthBarBg: healthBarBg,
            nameLabel: nameLabel,
            originalColor: playerColor,
            move: (direction) => {
                if (defaultSprite.body) {
                    const moveSpeed = 150;
                    defaultSprite.body.setVelocityX(direction * moveSpeed);
                }
            },
            jump: () => {
                // Use same jump logic as Fighter class
                const isOnGround = defaultSprite.body && (defaultSprite.body.blocked.down || defaultSprite.body.touching.down);
                if (isOnGround) {
                    defaultSprite.body.setVelocityY(-400);
                    console.log(`Default fighter jumping from y=${defaultSprite.y}`);
                } else {
                    console.log(`Default fighter cannot jump - not on ground (y=${defaultSprite.y})`);
                }
            },
            attack: () => {
                // Flash attack effect
                defaultSprite.setFillStyle(0xff0000);
                this.time.delayedCall(200, () => {
                    defaultSprite.setFillStyle(playerColor);
                });
                
                // Show attack range indicator
                const attackRange = 80;
                const rangeCircle = this.add.circle(defaultSprite.x, defaultSprite.y, attackRange, 0xff0000, 0.2);
                rangeCircle.setStrokeStyle(2, 0xff0000);
                this.time.delayedCall(300, () => {
                    rangeCircle.destroy();
                });
                
                // Don't calculate damage locally - let server handle it
                // Just show attack animation
            },
            canMove: () => fighter.health > 0,
            canJump: () => {
                const isOnGround = fighter.health > 0 && defaultSprite.body && (defaultSprite.body.blocked.down || defaultSprite.body.touching.down);
                return isOnGround;
            },
            canAttack: () => fighter.health > 0,
            updateHealthBar: () => {
                if (healthBar && healthBarBg && nameLabel) {
                    // Update positions to follow fighter
                    healthBarBg.x = defaultSprite.x;
                    healthBarBg.y = defaultSprite.y - 40;
                    healthBar.x = defaultSprite.x;
                    healthBar.y = defaultSprite.y - 40;
                    nameLabel.x = defaultSprite.x;
                    nameLabel.y = defaultSprite.y - 55;
                    
                    // Update health bar width
                    const healthPercent = fighter.health / fighter.maxHealth;
                    healthBar.scaleX = healthPercent;
                    
                    // Change color based on health
                    if (healthPercent > 0.6) {
                        healthBar.setFillStyle(0x00ff00); // Green
                    } else if (healthPercent > 0.3) {
                        healthBar.setFillStyle(0xffff00); // Yellow
                    } else {
                        healthBar.setFillStyle(0xff0000); // Red
                    }
                }
            },
            takeDamage: (damage, fromNetwork = false) => {
                fighter.health = Math.max(0, fighter.health - damage);
                fighter.updateHealthBar();
                
                // Flash damage effect
                defaultSprite.setFillStyle(0xffffff);
                this.time.delayedCall(100, () => {
                    defaultSprite.setFillStyle(playerColor);
                });
                
                console.log(`💔 ${fighter.playerId.substring(7, 13)} took ${damage} damage, health: ${fighter.health}`);
                
                // Only send network update if this damage wasn't from network
                if (!fromNetwork && this.gameManager) {
                    this.gameManager.sendPlayerAction({
                        action: 'health_update',
                        health: fighter.health,
                        damage: damage,
                        position: { x: defaultSprite.x, y: defaultSprite.y },
                        timestamp: Date.now()
                    });
                }
                
                // Check if dead
                if (fighter.health <= 0) {
                    this.handleFighterDeath(fighter);
                }
            },
            isAlive: () => fighter.health > 0,
            destroy: () => {
                if (defaultSprite) defaultSprite.destroy();
                if (healthBar) healthBar.destroy();
                if (healthBarBg) healthBarBg.destroy();
                if (nameLabel) nameLabel.destroy();
            }
        };

        this.fighters[player.id] = fighter;
        this.setupFighterCollisions(fighter);

        console.log(`Default fighter spawned for player ${player.id}`);
    }

    /**
     * Setup collision detection for a fighter
     * @param {Fighter} fighter - Fighter instance
     */
    setupFighterCollisions(fighter) {
        if (!fighter.sprite) return;

        // No ground collision needed - world bounds handle the floor
        console.log('🔗 Setting up fighter collisions at:', fighter.sprite.x, fighter.sprite.y);

        // Collision with walls
        this.walls.forEach(wall => {
            this.physics.add.collider(fighter.sprite, wall);
        });

        // Collision with other fighters
        Object.values(this.fighters).forEach(otherFighter => {
            if (otherFighter !== fighter && otherFighter.sprite) {
                this.physics.add.collider(fighter.sprite, otherFighter.sprite);
            }
        });
    }

    /**
     * Clear all existing fighters
     */
    clearFighters() {
        Object.values(this.fighters).forEach(fighter => {
            if (fighter.destroy) {
                fighter.destroy();
            } else if (fighter.sprite) {
                fighter.sprite.destroy();
            }
        });
        this.fighters = {};
    }

    /**
     * Update combat status display
     */
    updateCombatStatus() {
        const fighterCount = Object.keys(this.fighters).length;
        let statusText = '';

        if (fighterCount === 0) {
            statusText = 'No fighters loaded';
        } else if (fighterCount === 1) {
            statusText = 'Waiting for opponent...';
        } else {
            statusText = 'Ready to fight!';
        }

        // Find and update status text (this is a simple approach)
        this.children.list.forEach(child => {
            if (child.type === 'Text' && child.text.includes('Loading')) {
                child.setText(statusText);
            }
        });
    }

    /**
     * Handle events from GameManager
     */
    handleGameManagerEvent(eventType, data) {
        // Only log important events
        if (eventType === 'game_over' || eventType === 'server_damage') {
            console.log(`CombatScene received event: ${eventType}`, data);
        }

        switch (eventType) {
            case 'game_state_update':
                // Update fighter states from network
                this.updateFighterStates(data);
                
                // If we don't have fighters loaded yet, try loading them now
                if (!this.fightersLoaded) {
                    console.log('🔄 Attempting to load fighters from game state update');
                    this.loadFighters();
                }
                break;
            case 'player_joined':
                // New player joined, reload fighters
                this.loadFighters();
                break;
            case 'player_left':
                // Player left, remove their fighter
                if (data.playerId && this.fighters[data.playerId]) {
                    const fighter = this.fighters[data.playerId];
                    if (fighter.destroy) {
                        fighter.destroy();
                    } else if (fighter.sprite) {
                        fighter.sprite.destroy();
                    }
                    delete this.fighters[data.playerId];
                    this.updateCombatStatus();
                }
                break;
            case 'fighter_submit':
                // When a fighter is submitted, try reloading fighters
                console.log('🎨 Fighter submitted, reloading fighters');
                this.loadFighters();
                break;
                
            case 'player_action':
                // Handle remote player actions
                this.handleRemotePlayerAction(data);
                break;
            case 'server_damage':
                // Handle server-authoritative damage
                this.handleServerDamage(data);
                break;
            case 'phase_change':
                // When phase changes to combat, ensure fighters are loaded
                if (data.phase === 'combat' || (data.data && data.data.phase === 'combat')) {
                    console.log('🎯 Combat phase started, ensuring fighters are loaded');
                    if (!this.fightersLoaded) {
                        this.loadFighters();
                    }
                }
                break;
                
            case 'game_over':
                console.log('🎯 CombatScene handleGameManagerEvent - game_over received:', data);
                // Handle server-validated game over
                this.handleServerGameOver(data);
                break;
        }
    }

    /**
     * Handle server-authoritative damage events
     * @param {Object} data - Server damage data
     */
    handleServerDamage(data) {
        console.log('🩹 CombatScene processing server damage:', data);
        
        const damageData = data.data || data;
        const { attackerId, targetId, damage, newHealth, attackerPosition } = damageData;
        
        const targetFighter = this.fighters[targetId];
        
        if (targetFighter) {
            const oldHealth = targetFighter.health;
            targetFighter.health = newHealth;
            
            if (targetFighter.updateHealthBar) {
                targetFighter.updateHealthBar();
            }
            
            // Show damage effect
            if (targetFighter.sprite) {
                targetFighter.sprite.setFillStyle(0xffffff);
                this.time.delayedCall(100, () => {
                    targetFighter.sprite.setFillStyle(targetFighter.originalColor);
                });
                
                // Add knockback
                if (targetFighter.sprite.body && attackerPosition) {
                    const knockbackForce = 200;
                    const direction = targetFighter.sprite.x > attackerPosition.x ? 1 : -1;
                    targetFighter.sprite.body.setVelocityX(direction * knockbackForce);
                }
            }
            
            // Check if fighter died
            if (newHealth <= 0 && oldHealth > 0) {
                this.handleFighterDeath(targetFighter);
            }
            
            console.log(`💥 Applied server damage: ${attackerId.substring(7, 13)} → ${targetId.substring(7, 13)} (${damage} dmg, ${oldHealth} → ${newHealth} hp)`);
        }
    }

    /**
     * Get fighter by player ID
     * @param {string} playerId - Player ID
     * @returns {Fighter|null} Fighter instance
     */
    getFighter(playerId) {
        return this.fighters[playerId] || null;
    }

    /**
     * Get all fighters
     * @returns {Object} All fighters keyed by player ID
     */
    getAllFighters() {
        return { ...this.fighters };
    }

    /**
     * Test fighter positioning (for debugging)
     */
    testFighterPositioning() {
        console.log('Testing fighter positioning...');

        // Create test fighters
        const testPlayers = [
            { id: 'test1', pngData: null },
            { id: 'test2', pngData: null }
        ];

        testPlayers.forEach((player, index) => {
            this.spawnDefaultFighter(player, index);
        });

        console.log('Test fighters spawned');
    }

    update(time, delta) {
        // Don't do anything if game has ended
        if (this.gameEnded) {
            return;
        }
        
        // Update input handler
        if (this.inputHandler) {
            this.inputHandler.update(delta);
        }

        // Handle player input for their fighter
        this.handlePlayerInput();

        // Update fighter health bars and positions
        Object.values(this.fighters).forEach(fighter => {
            if (fighter.updateHealthBar) {
                fighter.updateHealthBar();
            }
            
            // Smooth interpolation for remote fighters
            if (fighter.playerId !== this.playerFighterId && fighter.targetPosition && fighter.sprite) {
                const currentX = fighter.sprite.x;
                const currentY = fighter.sprite.y;
                const targetX = fighter.targetPosition.x;
                const targetY = fighter.targetPosition.y;
                
                // Interpolate towards target position (0.2 = 20% each frame)
                const lerpFactor = 0.2;
                fighter.sprite.x = currentX + (targetX - currentX) * lerpFactor;
                fighter.sprite.y = currentY + (targetY - currentY) * lerpFactor;
            }
            
            // Check if fighter has fallen off the map and respawn if needed
            if (fighter.sprite && fighter.sprite.y > this.arena.height + 100) {
                console.log('⚠️ Fighter fell off map, respawning...');
                this.respawnFighter(fighter);
            }
        });

        // Periodic game state synchronization (every 1000ms for backup sync)
        if (!this.lastSyncTime) {
            this.lastSyncTime = 0;
        }

        if (time - this.lastSyncTime > 1000) {
            this.syncGameState();
            this.lastSyncTime = time;
        }
    }

    /**
     * Handle player input and control their fighter
     */
    handlePlayerInput() {
        if (!this.inputHandler || !this.playerFighterId || this.gameEnded) {
            return;
        }

        const playerFighter = this.fighters[this.playerFighterId];
        if (!playerFighter || !playerFighter.canMove) {
            return;
        }

        // Handle movement input
        const movementDirection = this.inputHandler.getMovementDirection();
        if (movementDirection !== 0 && playerFighter.canMove()) {
            playerFighter.move(movementDirection);

            // Send movement updates at 30 FPS for smooth multiplayer
            if (!this.lastMovementSent || Date.now() - this.lastMovementSent > 33) {
                if (this.gameManager) {
                    this.gameManager.sendPlayerAction({
                        action: 'move',
                        direction: movementDirection,
                        position: playerFighter.sprite ? { x: playerFighter.sprite.x, y: playerFighter.sprite.y } : null
                    });
                }
                this.lastMovementSent = Date.now();
            }
        } else if (movementDirection === 0 && this.wasMoving) {
            // Stop movement when no keys are pressed
            playerFighter.move(0);

            // Send stop movement to other players (only once when stopping)
            if (this.gameManager) {
                this.gameManager.sendPlayerAction({
                    action: 'move',
                    direction: 0,
                    position: playerFighter.sprite ? { x: playerFighter.sprite.x, y: playerFighter.sprite.y } : null
                });
            }
        }
        
        // Track if we were moving for stop detection
        this.wasMoving = movementDirection !== 0;

        // Handle jump input
        if (this.inputHandler.isJumpPressed() && playerFighter.canJump()) {
            playerFighter.jump();

            // Send jump to other players
            if (this.gameManager) {
                this.gameManager.sendPlayerAction({
                    action: 'jump',
                    position: playerFighter.sprite ? { x: playerFighter.sprite.x, y: playerFighter.sprite.y } : null
                });
            }
        }

        // Handle attack input (with cooldown)
        if (this.inputHandler.isAttackPressed() && playerFighter.canAttack()) {
            // Check attack cooldown (500ms between attacks)
            const now = Date.now();
            if (!this.lastAttackTime || now - this.lastAttackTime > 500) {
                playerFighter.attack();
                this.lastAttackTime = now;

                // Send attack to server for processing
                if (this.gameManager) {
                    this.gameManager.sendPlayerAction({
                        action: 'attack',
                        position: playerFighter.sprite ? { x: playerFighter.sprite.x, y: playerFighter.sprite.y } : null
                    });
                }
            }
        }
    }

    /**
     * Handle remote player actions from network
     * @param {Object} data - Action data from remote player
     */
    handleRemotePlayerAction(data) {
        const playerId = data.playerId;
        const actionData = data.data || data;

        // Don't process our own actions
        if (playerId === this.playerFighterId) {
            return;
        }

        const remoteFighter = this.fighters[playerId];
        if (!remoteFighter) {
            return;
        }

        const { action, direction, position } = actionData;
        
        // Visual feedback - flash the remote fighter
        if (remoteFighter.sprite) {
            const originalColor = remoteFighter.sprite.fillColor;
            remoteFighter.sprite.setFillStyle(0x00ffff);
            this.time.delayedCall(100, () => {
                remoteFighter.sprite.setFillStyle(originalColor);
            });
        }

        switch (action) {
            case 'move':
                if (remoteFighter.move) {
                    remoteFighter.move(direction);
                }
                // Smooth interpolation to server position
                if (position && remoteFighter.sprite) {
                    // Store target position for interpolation
                    if (!remoteFighter.targetPosition) {
                        remoteFighter.targetPosition = { x: position.x, y: position.y };
                    } else {
                        remoteFighter.targetPosition.x = position.x;
                        remoteFighter.targetPosition.y = position.y;
                    }
                }
                break;

            case 'jump':
                if (remoteFighter.jump) {
                    remoteFighter.jump();
                }
                console.log(`💫 Remote player jumped!`);
                break;

            case 'attack':
                if (remoteFighter.attack) {
                    remoteFighter.attack();
                }
                console.log(`💥 Remote player attacked!`);
                break;
        }
    }

    /**
     * Set up retry mechanism for loading fighters
     */
    setupFighterLoadRetry() {
        // Retry loading fighters every 2 seconds up to 5 times
        let retryCount = 0;
        const maxRetries = 5;
        
        const retryInterval = setInterval(() => {
            retryCount++;
            console.log(`🔄 Retry ${retryCount}/${maxRetries}: Attempting to load fighters...`);
            
            this.loadFighters().then(() => {
                if (this.fightersLoaded || retryCount >= maxRetries) {
                    clearInterval(retryInterval);
                    if (!this.fightersLoaded) {
                        console.log('❌ Failed to load fighters after all retries');
                    }
                }
            });
        }, 2000);
    }

    /**
     * Respawn a fighter that has fallen off the map
     * @param {Object} fighter - Fighter to respawn
     */
    respawnFighter(fighter) {
        if (!fighter || !fighter.sprite) return;
        
        // Reset position to spawn location
        const playerId = fighter.playerId;
        const playerIndex = Object.keys(this.fighters).indexOf(playerId);
        const spawnX = playerIndex === 0 ? this.arena.leftSpawnX : this.arena.rightSpawnX;
        const spawnY = this.arena.groundY - 200;
        
        fighter.sprite.setPosition(spawnX, spawnY);
        
        // Reset velocity
        if (fighter.sprite.body) {
            fighter.sprite.body.setVelocity(0, 0);
        }
        
        console.log(`Fighter ${playerId} respawned at (${spawnX}, ${spawnY})`);
    }

    /**
     * Get input handler instance
     * @returns {InputHandler|null}
     */
    getInputHandler() {
        return this.inputHandler;
    }

    /**
     * Update fighter states from network synchronization
     * @param {Object} data - Game state data from network
     */
    updateFighterStates(data) {
        if (!data || !data.fighters) {
            return;
        }

        // Update remote fighter positions and states
        Object.keys(data.fighters).forEach(playerId => {
            // Don't update our own fighter from network (to avoid input lag)
            if (playerId === this.playerFighterId) {
                return;
            }

            const fighter = this.fighters[playerId];
            const networkState = data.fighters[playerId];

            if (fighter && fighter.sprite && networkState) {
                // Smoothly interpolate position to avoid jittery movement
                const currentX = fighter.sprite.x;
                const currentY = fighter.sprite.y;
                const targetX = networkState.position.x;
                const targetY = networkState.position.y;

                // Only update if the difference is significant (avoid micro-movements)
                const threshold = 5;
                if (Math.abs(currentX - targetX) > threshold || Math.abs(currentY - targetY) > threshold) {
                    fighter.sprite.x = targetX;
                    fighter.sprite.y = targetY;
                }

                // Update health
                if (networkState.health !== undefined) {
                    fighter.health = networkState.health;
                }
            }
        });
    }

    /**
     * Synchronize game state with other players
     */
    syncGameState() {
        if (!this.gameManager || !this.playerFighterId) {
            return;
        }

        // Collect current fighter states
        const fighterStates = {};
        Object.keys(this.fighters).forEach(playerId => {
            const fighter = this.fighters[playerId];
            if (fighter && fighter.sprite) {
                fighterStates[playerId] = {
                    position: { x: fighter.sprite.x, y: fighter.sprite.y },
                    health: fighter.health || 100,
                    velocity: fighter.sprite.body ? {
                        x: fighter.sprite.body.velocity.x,
                        y: fighter.sprite.body.velocity.y
                    } : { x: 0, y: 0 }
                };
            }
        });

        // Broadcast game state to keep positions synchronized
        this.gameManager.broadcastGameState({
            fighters: fighterStates,
            timestamp: Date.now()
        });
    }

    /**
     * Set which fighter the player controls
     * @param {string} playerId - Player ID
     */
    setPlayerFighter(playerId) {
        this.playerFighterId = playerId;
        console.log(`Player fighter set to: ${playerId}`);
    }

    /**
     * Check if an attack hits nearby enemies
     * @param {Object} attacker - Fighter that is attacking
     */
    checkAttackHit(attacker) {
        const attackRange = 80;
        
        // Only the attacker's client should calculate damage to avoid duplicates
        if (attacker.playerId !== this.playerFighterId) {
            return;
        }
        
        const attackDamage = 15 + Math.floor(Math.random() * 11); // 15-25 damage
        
        // Check all other fighters
        Object.values(this.fighters).forEach(target => {
            if (target !== attacker && target.isAlive()) {
                const distance = Phaser.Math.Distance.Between(
                    attacker.sprite.x, attacker.sprite.y,
                    target.sprite.x, target.sprite.y
                );
                
                if (distance <= attackRange) {
                    // Server will handle damage calculation and broadcasting
                    console.log(`🎯 Attack in range: ${attacker.playerId.substring(7, 13)} → ${target.playerId.substring(7, 13)}`);
                }
            }
        });
    }

    /**
     * Handle when a fighter dies
     * @param {Object} fighter - Fighter that died
     */
    handleFighterDeath(fighter) {
        console.log(`💀 ${fighter.playerId.substring(7, 13)} has been defeated!`);
        
        // Just handle visual effects - server will handle game over logic
        fighter.sprite.setAlpha(0.5);
        fighter.sprite.setTint(0x888888);
        
        // Don't call handleGameEnd - server handles game over detection
    }

    /**
     * Handle game end
     * @param {Object} winner - Winning fighter (or null for draw)
     */
    handleGameEnd(winner) {
        if (winner) {
            console.log(`🏆 ${winner.playerId.substring(7, 13)} wins!`);
            
            // Display winner message
            this.add.text(400, 200, `🏆 ${winner.playerId.substring(7, 13)} WINS!`, {
                fontSize: '32px',
                fill: '#ffff00',
                fontFamily: 'Arial',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5);
        } else {
            console.log('🤝 Draw!');
            
            // Display draw message
            this.add.text(400, 200, '🤝 DRAW!', {
                fontSize: '32px',
                fill: '#ffffff',
                fontFamily: 'Arial',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5);
        }
        
        // Add restart instruction
        this.add.text(400, 250, 'Press R to restart or M for menu', {
            fontSize: '16px',
            fill: '#cccccc',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
    }

    /**
     * Handle server-validated game over event
     * @param {Object} data - Game over data from server
     */
    handleServerGameOver(data) {
        try {
            console.log('🎯 Game over received, processing...');
            
            // Extract data from the correct location
            const gameOverData = data.data || data;
            const { winner, defeatedPlayer, finalHealth, gameStats } = gameOverData;
            
            // Update fighter health values (skip visual updates to avoid errors with default fighters)
            // NOTE: Default fighters use rectangle sprites, not full Fighter class with PNG data
            // The updateHealthBar() function can fail if health bar objects are destroyed/invalid
            if (finalHealth) {
                Object.keys(finalHealth).forEach(playerId => {
                    const fighter = this.fighters[playerId];
                    if (fighter) {
                        fighter.health = finalHealth[playerId];
                        
                        // TODO: Fix updateHealthBar() function for default fighters
                        // For now, skip visual updates to prevent errors during game over
                        // The health values are updated correctly, just not the visual health bars
                    }
                });
            }
        
        // Prepare game result data for ResultsScene
        const gameResult = {
            isDraw: !winner,
            isLocalPlayerWinner: winner === this.gameManager.playerId,
            winnerId: winner,
            winnerName: winner === this.gameManager.playerId ? 'You' : `Player ${winner?.slice(-3) || 'Unknown'}`,
            gameDuration: gameStats?.duration || 0,
            finalStats: {}
        };

        // Build final stats for each player
        if (finalHealth) {
            Object.keys(finalHealth).forEach(playerId => {
                const fighter = this.fighters[playerId];
                const health = finalHealth[playerId];
                gameResult.finalStats[playerId] = {
                    finalHealth: health,
                    maxHealth: fighter?.maxHealth || 100,
                    healthPercentage: fighter?.maxHealth ? (health / fighter.maxHealth) * 100 : 0,
                    survived: health > 0
                };
            });
        }

        // Store result in game manager
        if (this.gameManager) {
            this.gameManager.gameState.gameResult = gameResult;
            this.gameManager.gameState.phase = 'results';
        }
        // Disable the scene 
        this.gameEnded = true;
        this.physics.pause();
        
        // Disable all fighter movement and actions
        Object.values(this.fighters).forEach(fighter => {
            if (fighter.sprite && fighter.sprite.body) {
                fighter.sprite.body.setVelocity(0, 0);
                fighter.sprite.body.setImmovable(true);
            }
        });

        // Transition to ResultsScene after a brief delay
        this.time.delayedCall(1500, () => {
            console.log('🎯 Transitioning to ResultsScene...');
            if (this.gameManager) {
                this.gameManager.handlePhaseChange('results');
            }
        });
        
        } catch (error) {
            console.error('❌ Error in handleServerGameOver:', error);
            console.error('Error stack:', error.stack);
            console.error('Data that caused error:', data);
            // Try to create a simple overlay even if there's an error
            try {
                this.add.rectangle(400, 300, 800, 600, 0xff0000, 0.8);
                this.add.text(400, 300, 'GAME OVER - ERROR OCCURRED', {
                    fontSize: '32px',
                    fill: '#ffffff',
                    fontFamily: 'Arial'
                }).setOrigin(0.5);
            } catch (fallbackError) {
                console.error('Even fallback overlay failed:', fallbackError);
            }
        }
    }

    /**
     * Restart the game (return to drawing phase)
     */
    restartGame() {
        console.log('🔄 Restarting game...');
        
        if (this.gameManager) {
            // Send restart request to server
            this.gameManager.sendGameEvent({
                type: 'restart_game',
                data: {}
            });
        }
    }
    
    /**
     * Return to main menu
     */
    returnToMenu() {
        console.log('🏠 Returning to menu...');
        
        if (this.gameManager) {
            // Reset game state
            this.gameEnded = false;
            this.gameOverData = null;
            
            // Switch to menu scene
            this.gameManager.handlePhaseChange('menu');
        }
    }

    /**
     * Get consistent color for a player based on their ID
     * @param {string} playerId - Player ID
     * @returns {number} Color hex value
     */
    getPlayerColor(playerId) {
        // Simple hash of player ID to get consistent color
        let hash = 0;
        for (let i = 0; i < playerId.length; i++) {
            hash = playerId.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        // Map to predefined colors for better visibility
        const colors = [
            0xff0000, // Red
            0x0000ff, // Blue  
            0x00ff00, // Green
            0xff00ff, // Magenta
            0xffaa00, // Orange
            0x00ffff  // Cyan
        ];
        
        return colors[Math.abs(hash) % colors.length];
    }

    /**
     * Clean up when scene shuts down
     */
    shutdown() {
        if (this.inputHandler) {
            this.inputHandler.destroy();
            this.inputHandler = null;
        }
        
        // Clear all fighters
        Object.values(this.fighters).forEach(fighter => {
            if (fighter.sprite) {
                fighter.sprite.destroy();
            }
        });
        this.fighters = {};
        
        console.log('CombatScene shut down and cleaned up');
    }

    /**
     * Clean up input handler when scene is destroyed
     */
    destroy() {
        if (this.inputHandler) {
            this.inputHandler.destroy();
            this.inputHandler = null;
        }

        super.destroy();
    }
}

export default CombatScene;
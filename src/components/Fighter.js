class Fighter {
    constructor(scene, x = 0, y = 0, pngData = null) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.sprite = null;
        this.health = 100;
        this.maxHealth = 100;
        this.velocity = { x: 0, y: 0 };
        this.isAttacking = false;
        this.healthBar = null;
        this.healthBarBackground = null;
        this.textureKey = null;
        
        // Initialize fighter with PNG data if provided
        if (pngData) {
            this.loadFromPNG(pngData);
        }
    }

    /**
     * Load fighter sprite from PNG data
     * @param {string} pngData - Base64 encoded PNG data
     * @returns {Promise<boolean>} - Success status
     */
    async loadFromPNG(pngData) {
        try {
            if (!this.scene || !pngData) {
                throw new Error('Scene and PNG data are required');
            }

            // Generate unique texture key
            this.textureKey = `fighter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Create image element to load PNG data
            const img = new Image();
            
            return new Promise((resolve, reject) => {
                img.onload = () => {
                    try {
                        // Create canvas to process the image
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        
                        // Draw image to canvas to ensure transparency is preserved
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(img, 0, 0);
                        
                        // Add texture to Phaser
                        if (this.scene.textures) {
                            this.scene.textures.addCanvas(this.textureKey, canvas);
                            
                            // Create sprite
                            this.createSprite();
                            resolve(true);
                        } else {
                            reject(new Error('Scene textures not available'));
                        }
                    } catch (error) {
                        reject(error);
                    }
                };
                
                img.onerror = () => {
                    reject(new Error('Failed to load PNG data'));
                };
                
                img.src = pngData;
            });
        } catch (error) {
            console.error('Error loading PNG:', error);
            return false;
        }
    }

    /**
     * Create Phaser sprite from loaded texture
     */
    createSprite() {
        if (!this.scene || !this.textureKey) {
            throw new Error('Scene and texture key are required');
        }

        // Create sprite
        this.sprite = this.scene.add.sprite(this.x, this.y, this.textureKey);
        
        // Set sprite properties for physics
        if (this.scene.physics && this.scene.physics.add) {
            this.scene.physics.add.existing(this.sprite);
            
            // Configure physics body
            if (this.sprite.body) {
                this.sprite.body.setCollideWorldBounds(true);
                this.sprite.body.setBounce(0.2);
                this.sprite.body.setGravityY(300);
            }
        }
        
        // Create health bar
        this.createHealthBar();
    }

    /**
     * Create visual health bar above fighter
     */
    createHealthBar() {
        if (!this.scene || !this.sprite) {
            return;
        }

        const healthBarWidth = 60;
        const healthBarHeight = 8;
        const offsetY = -this.sprite.height / 2 - 15;

        // Health bar background (red)
        this.healthBarBackground = this.scene.add.rectangle(
            this.sprite.x,
            this.sprite.y + offsetY,
            healthBarWidth,
            healthBarHeight,
            0xff0000
        );

        // Health bar foreground (green)
        this.healthBar = this.scene.add.rectangle(
            this.sprite.x,
            this.sprite.y + offsetY,
            healthBarWidth,
            healthBarHeight,
            0x00ff00
        );

        // Set depth to render above fighter
        this.healthBarBackground.setDepth(100);
        this.healthBar.setDepth(101);
    }

    /**
     * Update health bar visual representation
     */
    updateHealthBar() {
        if (!this.healthBar || !this.healthBarBackground || !this.sprite) {
            return;
        }

        const healthPercentage = Math.max(0, this.health / this.maxHealth);
        const maxWidth = 60;
        const currentWidth = maxWidth * healthPercentage;
        
        // Update health bar width
        this.healthBar.width = currentWidth;
        
        // Update positions to follow sprite
        const offsetY = -this.sprite.height / 2 - 15;
        this.healthBarBackground.x = this.sprite.x;
        this.healthBarBackground.y = this.sprite.y + offsetY;
        this.healthBar.x = this.sprite.x;
        this.healthBar.y = this.sprite.y + offsetY;
        
        // Change color based on health level
        if (healthPercentage > 0.6) {
            this.healthBar.setFillStyle(0x00ff00); // Green
        } else if (healthPercentage > 0.3) {
            this.healthBar.setFillStyle(0xffff00); // Yellow
        } else {
            this.healthBar.setFillStyle(0xff6600); // Orange
        }
    }

    /**
     * Apply damage to fighter
     * @param {number} amount - Damage amount
     * @param {boolean} fromNetwork - Whether this damage came from network sync
     */
    takeDamage(amount, fromNetwork = false) {
        if (typeof amount !== 'number' || amount < 0) {
            return;
        }

        this.health = Math.max(0, this.health - amount);
        this.updateHealthBar();
        
        // Visual feedback for damage
        if (this.sprite) {
            // Flash red briefly
            this.sprite.setTint(0xff0000);
            this.scene.time.delayedCall(100, () => {
                if (this.sprite) {
                    this.sprite.clearTint();
                }
            });
        }
        
        console.log(`Fighter took ${amount} damage (network: ${fromNetwork}), health: ${this.health}`);
    }

    /**
     * Heal fighter
     * @param {number} amount - Heal amount
     */
    heal(amount) {
        if (typeof amount !== 'number' || amount < 0) {
            return;
        }

        this.health = Math.min(this.maxHealth, this.health + amount);
        this.updateHealthBar();
    }

    /**
     * Check if fighter is alive
     * @returns {boolean}
     */
    isAlive() {
        return this.health > 0;
    }

    /**
     * Get fighter position
     * @returns {object} Position {x, y}
     */
    getPosition() {
        if (this.sprite) {
            return { x: this.sprite.x, y: this.sprite.y };
        }
        return { x: this.x, y: this.y };
    }

    /**
     * Set fighter position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        
        if (this.sprite) {
            this.sprite.setPosition(x, y);
            this.updateHealthBar();
        }
    }

    /**
     * Move fighter left or right
     * @param {number} direction - Movement direction (-1 for left, 1 for right, 0 for stop)
     */
    move(direction) {
        if (!this.sprite || !this.sprite.body) {
            console.warn('Cannot move fighter: sprite or physics body not available');
            return;
        }
        
        const moveSpeed = 150; // Pixels per second
        
        // Normalize direction to -1, 0, or 1
        if (direction > 0) {
            direction = 1;
        } else if (direction < 0) {
            direction = -1;
        } else {
            direction = 0;
        }
        
        // Set horizontal velocity
        this.sprite.body.setVelocityX(direction * moveSpeed);
        this.velocity.x = direction * moveSpeed;
        
        // Flip sprite based on movement direction
        if (direction !== 0) {
            this.sprite.setFlipX(direction < 0);
        }
        
        console.log(`Fighter moving: direction=${direction}, velocity=${this.velocity.x}`);
    }

    /**
     * Make fighter jump
     */
    jump() {
        if (!this.sprite || !this.sprite.body) {
            console.warn('Cannot jump: sprite or physics body not available');
            return;
        }
        
        // Only allow jumping if fighter is on the ground (or close to it)
        const jumpThreshold = 10; // Allow small gap for jump detection
        const isOnGround = this.sprite.body.blocked.down || 
                          this.sprite.body.touching.down ||
                          (this.sprite.body.velocity.y >= -jumpThreshold && this.sprite.body.velocity.y <= jumpThreshold);
        
        if (isOnGround) {
            const jumpPower = -400; // Negative for upward movement
            this.sprite.body.setVelocityY(jumpPower);
            this.velocity.y = jumpPower;
            
            console.log(`Fighter jumping: velocity=${this.velocity.y}`);
        } else {
            console.log('Fighter cannot jump: not on ground');
        }
    }

    /**
     * Make fighter attack
     */
    attack() {
        if (!this.sprite) {
            console.warn('Cannot attack: sprite not available');
            return;
        }
        
        if (this.isAttacking) {
            console.log('Fighter already attacking');
            return;
        }
        
        console.log('Setting isAttacking to true');
        this.isAttacking = true;
        console.log('isAttacking is now:', this.isAttacking);
        
        // Create attack hitbox
        const attackRange = 80;
        const attackWidth = 60;
        const attackHeight = 40;
        
        // Determine attack direction based on sprite flip
        const attackDirection = this.sprite.flipX ? -1 : 1;
        const attackX = this.sprite.x + (attackDirection * attackRange);
        const attackY = this.sprite.y;
        
        try {
            // Visual attack effect
            this.showAttackEffect(attackX, attackY, attackWidth, attackHeight);
            
            // Create temporary hitbox for damage detection
            this.createAttackHitbox(attackX, attackY, attackWidth, attackHeight);
            
            // Reset attack state after animation
            this.scene.time.delayedCall(300, () => {
                this.isAttacking = false;
            });
        } catch (error) {
            console.error('Error during attack:', error);
            this.isAttacking = false;
        }
        
        console.log(`Fighter attacking: direction=${attackDirection}, hitbox at (${attackX}, ${attackY}), isAttacking=${this.isAttacking}`);
    }

    /**
     * Show visual attack effect
     * @param {number} x - Attack X position
     * @param {number} y - Attack Y position
     * @param {number} width - Attack width
     * @param {number} height - Attack height
     */
    showAttackEffect(x, y, width, height) {
        if (!this.scene) return;
        
        // Create main attack effect
        const attackEffect = this.scene.add.rectangle(x, y, width, height, 0xffff00, 0.6);
        attackEffect.setDepth(50);
        
        // Create secondary slash effect
        const slashEffect = this.scene.add.rectangle(x, y, width * 1.5, height * 0.3, 0xffffff, 0.8);
        slashEffect.setDepth(51);
        
        // Animate main attack effect
        this.scene.tweens.add({
            targets: attackEffect,
            scaleX: 1.3,
            scaleY: 1.3,
            alpha: 0,
            duration: 250,
            ease: 'Power2',
            onComplete: () => {
                attackEffect.destroy();
            }
        });
        
        // Animate slash effect
        this.scene.tweens.add({
            targets: slashEffect,
            scaleX: 2,
            scaleY: 0.1,
            alpha: 0,
            rotation: 0.3,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                slashEffect.destroy();
            }
        });
        
        // Enhanced fighter attack animation
        const originalScale = this.sprite.scaleX;
        this.sprite.setTint(0xffaa00);
        
        // Attack lunge animation
        this.scene.tweens.add({
            targets: this.sprite,
            scaleX: originalScale * 1.1,
            scaleY: originalScale * 0.9,
            duration: 100,
            yoyo: true,
            ease: 'Power2'
        });
        
        // Clear tint after animation
        this.scene.time.delayedCall(250, () => {
            if (this.sprite) {
                this.sprite.clearTint();
            }
        });

        console.log(`Enhanced attack effect created at (${x}, ${y})`);
    }

    /**
     * Create attack hitbox for damage detection
     * @param {number} x - Hitbox X position
     * @param {number} y - Hitbox Y position
     * @param {number} width - Hitbox width
     * @param {number} height - Hitbox height
     */
    createAttackHitbox(x, y, width, height) {
        if (!this.scene || !this.scene.physics) return;
        
        // Create temporary physics body for attack detection
        const hitbox = this.scene.add.rectangle(x, y, width, height, 0xff0000, 0);
        this.scene.physics.add.existing(hitbox);
        
        // Only set immovable if body exists
        if (hitbox.body) {
            hitbox.body.setImmovable(true);
        }
        
        // Store reference for collision detection
        hitbox.attackerId = this.textureKey || 'unknown';
        hitbox.damage = this.calculateAttackDamage();
        hitbox.knockback = this.calculateKnockbackForce();
        hitbox.attacker = this; // Store reference to attacking fighter
        
        // Trigger collision detection if combat scene is available
        if (this.combatScene && this.combatScene.handleAttackCollision) {
            this.combatScene.handleAttackCollision(this, hitbox);
        }
        
        // Remove hitbox after short duration
        this.scene.time.delayedCall(100, () => {
            if (hitbox) {
                hitbox.destroy();
            }
        });
        
        return hitbox;
    }

    /**
     * Calculate attack damage based on fighter properties
     * @returns {number} Damage amount
     */
    calculateAttackDamage() {
        let baseDamage = 20;
        
        // Add some randomness for variety (±5 damage)
        const randomBonus = Math.floor(Math.random() * 11) - 5;
        baseDamage += randomBonus;
        
        // Ensure minimum damage
        return Math.max(10, baseDamage);
    }

    /**
     * Calculate knockback force based on fighter properties
     * @returns {number} Knockback force
     */
    calculateKnockbackForce() {
        let baseKnockback = 200;
        
        // Add some randomness for variety
        const randomBonus = Math.floor(Math.random() * 101) - 50; // ±50
        baseKnockback += randomBonus;
        
        return Math.max(100, baseKnockback);
    }

    /**
     * Check if fighter can move (not attacking or stunned)
     * @returns {boolean}
     */
    canMove() {
        return !this.isAttacking && this.isAlive() && Boolean(this.sprite);
    }

    /**
     * Check if fighter can jump (not attacking and on ground)
     * @returns {boolean}
     */
    canJump() {
        if (!this.sprite || !this.sprite.body || this.isAttacking || !this.isAlive()) {
            return false;
        }
        
        const jumpThreshold = 10;
        const isOnGround = this.sprite.body.blocked.down || 
                          this.sprite.body.touching.down ||
                          (this.sprite.body.velocity.y >= -jumpThreshold && this.sprite.body.velocity.y <= jumpThreshold);
        
        return isOnGround;
    }

    /**
     * Check if fighter can attack (not already attacking)
     * @returns {boolean}
     */
    canAttack() {
        return !this.isAttacking && this.isAlive() && Boolean(this.sprite);
    }

    /**
     * Clean up fighter resources
     */
    destroy() {
        if (this.sprite) {
            this.sprite.destroy();
            this.sprite = null;
        }
        
        if (this.healthBar) {
            this.healthBar.destroy();
            this.healthBar = null;
        }
        
        if (this.healthBarBackground) {
            this.healthBarBackground.destroy();
            this.healthBarBackground = null;
        }
        
        if (this.textureKey && this.scene && this.scene.textures) {
            this.scene.textures.remove(this.textureKey);
            this.textureKey = null;
        }
    }
}

export default Fighter;
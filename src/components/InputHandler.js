class InputHandler {
    constructor() {
        this.keys = {};
        this.isInitialized = false;
        this.attackCooldown = 0;
        this.attackCooldownTime = 500; // 500ms cooldown between attacks
        this.lastAttackTime = 0;
        
        // Key mappings for controls
        this.keyMappings = {
            // Movement keys
            left: ['ArrowLeft', 'KeyA'],
            right: ['ArrowRight', 'KeyD'],
            jump: ['ArrowUp', 'KeyW', 'Space'],
            attack: ['Enter', 'KeyX', 'KeyZ']
        };
        
        // Bind methods to preserve 'this' context
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
    }

    /**
     * Initialize input handling by setting up event listeners
     */
    initialize() {
        if (this.isInitialized) {
            console.warn('InputHandler already initialized');
            return;
        }
        
        // Add keyboard event listeners
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
        
        this.isInitialized = true;
        console.log('InputHandler initialized with key mappings:', this.keyMappings);
    }

    /**
     * Handle keydown events
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeyDown(event) {
        if (!event || !event.code) return;
        
        // Prevent default behavior for game keys
        if (this.isGameKey(event.code)) {
            event.preventDefault();
        }
        
        // Set key as pressed
        this.keys[event.code] = true;
        
        console.log(`Key pressed: ${event.code} (${event.key})`);
    }

    /**
     * Handle keyup events
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeyUp(event) {
        if (!event || !event.code) return;
        
        // Prevent default behavior for game keys
        if (this.isGameKey(event.code)) {
            event.preventDefault();
        }
        
        // Set key as released
        this.keys[event.code] = false;
        
        console.log(`Key released: ${event.code} (${event.key})`);
    }

    /**
     * Check if a specific key is currently pressed
     * @param {string} key - Key code to check
     * @returns {boolean} True if key is pressed
     */
    isKeyPressed(key) {
        return Boolean(this.keys[key]);
    }

    /**
     * Check if any key mapped to an action is pressed
     * @param {string} action - Action name (left, right, jump, attack)
     * @returns {boolean} True if any mapped key is pressed
     */
    isActionPressed(action) {
        const mappedKeys = this.keyMappings[action];
        if (!mappedKeys) return false;
        
        return mappedKeys.some(key => this.isKeyPressed(key));
    }

    /**
     * Check if left movement is pressed
     * @returns {boolean}
     */
    isLeftPressed() {
        return this.isActionPressed('left');
    }

    /**
     * Check if right movement is pressed
     * @returns {boolean}
     */
    isRightPressed() {
        return this.isActionPressed('right');
    }

    /**
     * Check if jump is pressed
     * @returns {boolean}
     */
    isJumpPressed() {
        return this.isActionPressed('jump');
    }

    /**
     * Check if attack is pressed and not on cooldown
     * @returns {boolean}
     */
    isAttackPressed() {
        const attackPressed = this.isActionPressed('attack');
        const currentTime = Date.now();
        
        if (attackPressed && (currentTime - this.lastAttackTime) >= this.attackCooldownTime) {
            this.lastAttackTime = currentTime;
            return true;
        }
        
        return false;
    }

    /**
     * Get movement direction based on pressed keys
     * @returns {number} -1 for left, 1 for right, 0 for no movement
     */
    getMovementDirection() {
        let direction = 0;
        
        if (this.isLeftPressed()) {
            direction -= 1;
        }
        
        if (this.isRightPressed()) {
            direction += 1;
        }
        
        return direction;
    }

    /**
     * Update input state (should be called each frame)
     * @param {number} deltaTime - Time since last update in milliseconds
     */
    update(deltaTime) {
        // Update attack cooldown
        if (this.attackCooldown > 0) {
            this.attackCooldown = Math.max(0, this.attackCooldown - deltaTime);
        }
    }

    /**
     * Check if a key code is used for game controls
     * @param {string} keyCode - Key code to check
     * @returns {boolean} True if key is used for game controls
     */
    isGameKey(keyCode) {
        const allGameKeys = Object.values(this.keyMappings).flat();
        return allGameKeys.includes(keyCode);
    }

    /**
     * Get current attack cooldown remaining time
     * @returns {number} Remaining cooldown time in milliseconds
     */
    getAttackCooldownRemaining() {
        const currentTime = Date.now();
        const timeSinceLastAttack = currentTime - this.lastAttackTime;
        return Math.max(0, this.attackCooldownTime - timeSinceLastAttack);
    }

    /**
     * Check if attack is on cooldown
     * @returns {boolean} True if attack is on cooldown
     */
    isAttackOnCooldown() {
        return this.getAttackCooldownRemaining() > 0;
    }

    /**
     * Set custom key mappings
     * @param {Object} mappings - New key mappings
     */
    setKeyMappings(mappings) {
        this.keyMappings = { ...this.keyMappings, ...mappings };
        console.log('Key mappings updated:', this.keyMappings);
    }

    /**
     * Reset all key states
     */
    resetKeys() {
        this.keys = {};
        console.log('All key states reset');
    }

    /**
     * Clean up event listeners
     */
    destroy() {
        if (this.isInitialized) {
            document.removeEventListener('keydown', this.handleKeyDown);
            document.removeEventListener('keyup', this.handleKeyUp);
            this.isInitialized = false;
        }
        
        this.resetKeys();
        console.log('InputHandler destroyed');
    }
}

export default InputHandler;
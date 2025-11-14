/**
 * Dr. Mario Input Manager - Uses EXACT same system as Tetris menus
 */
class DrMarioInputManager {
    constructor(drMarioGame) {
        this.game = drMarioGame;
        this.input = drMarioGame.input;

        // Movement repeat timing (same as PillPanicGame.js)
        this.moveRepeatTimer = 0;
        this.moveRepeatDelay = 0.15; // 150ms between moves

        // Soft drop timing
        this.softDropTimer = 0;

        // Rotation debounce (like Tetris)
        this.rotateDelay = 150; // ms between rotations
        this.lastRotateTime = 0;

        // Create proper Tetris-style menu objects
        this.startMenu = {
            buttons: [
                { text: "PRESS START", action: "start" },
                { text: "BACK TO TETRIS", action: "back" }
            ],
            selectedIndex: 0
        };

        this.levelSelectMenu = {
            buttons: [
                { text: "VIRUS LEVEL", action: "virusLevel" },
                { text: "SPEED", action: "speed" },
                { text: "START GAME", action: "startGame" },
                { text: "BACK TO TETRIS", action: "back" }
            ],
            selectedIndex: 0
        };

        // Game settings
        this.selectedVirusLevel = 1;
        this.selectedSpeed = 1;

        // Register menu elements for mouse interaction
        this.registerMenuElements();
    }
    
    registerMenuElements() {
        // Store button positions for bounds functions
        this.buttonElements = {};

        // Register start menu buttons
        this.startMenu.buttons.forEach((button, i) => {
            const id = `dr_start_button_${i}`;
            this.buttonElements[id] = { x: 0, y: 0, width: 100, height: 50 };
            this.input.registerElement(id, { bounds: () => this.buttonElements[id] });
        });

        // Register level select menu buttons
        this.levelSelectMenu.buttons.forEach((button, i) => {
            const id = `dr_level_button_${i}`;
            this.buttonElements[id] = { x: 0, y: 0, width: 100, height: 50 };
            this.input.registerElement(id, { bounds: () => this.buttonElements[id] });
        });
    }
    
    updateMenuElementPositions(state, buttonPositions) {
        // Update stored button positions (bounds functions will return these)
        const prefix = state === "startScreen" ? "dr_start" : "dr_level";
        buttonPositions.forEach((pos, i) => {
            this.buttonElements[`${prefix}_button_${i}`] = { x: pos.x, y: pos.y, width: pos.width, height: pos.height };
        });
    }
    
    handleInput(deltaTime) {
        if (this.input.isKeyJustPressed("ActionDebugToggle")) {
            this.game.gameLogic.debugOverlayVisible = !this.game.gameLogic.debugOverlayVisible;
        }

        switch (this.game.gameState) {
            case DR_MARIO_CONSTANTS.STATES.START_SCREEN:
                this.handleStartScreenInput();
                break;
            case DR_MARIO_CONSTANTS.STATES.LEVEL_SELECT:
                this.handleLevelSelectInput();
                break;
            case DR_MARIO_CONSTANTS.STATES.PLAYING:
                this.handleGameplayInput(deltaTime);
                break;
            case DR_MARIO_CONSTANTS.STATES.VICTORY:
            case DR_MARIO_CONSTANTS.STATES.GAME_OVER:
                this.handleGameOverInput();
                break;
        }
    }
    
    handleStartScreenInput() {
        const menu = this.startMenu;

        // EXACT copy of Tetris menu input handling
        // Check for mouse clicks FIRST
        for (let i = 0; i < menu.buttons.length; i++) {
            if (this.input.isElementJustPressed(`dr_start_button_${i}`)) {
                this.executeStartMenuAction(menu.buttons[i].action);
                return;
            }
        }

        // Check for mouse hover - mouse overrides keyboard selection
        for (let i = 0; i < menu.buttons.length; i++) {
            if (this.input.isElementHovered(`dr_start_button_${i}`)) {
                if (menu.selectedIndex !== i) {
                    menu.selectedIndex = i;
                    this.game.playSound("menu_navigate");
                }
                break;
            }
        }

        // Keyboard/gamepad navigation (EXACT copy from Tetris)
        if (
            this.input.isKeyJustPressed("DirUp") ||
            this.input.isGamepadButtonJustPressed(12, 0) ||
            this.input.isGamepadButtonJustPressed(12, 1) ||
            this.input.isGamepadButtonJustPressed(12, 2) ||
            this.input.isGamepadButtonJustPressed(12, 3)
        ) {
            menu.selectedIndex = Math.max(0, menu.selectedIndex - 1);
            this.game.playSound("menu_navigate");
        }

        if (
            this.input.isKeyJustPressed("DirDown") ||
            this.input.isGamepadButtonJustPressed(13, 0) ||
            this.input.isGamepadButtonJustPressed(13, 1) ||
            this.input.isGamepadButtonJustPressed(13, 2) ||
            this.input.isGamepadButtonJustPressed(13, 3)
        ) {
            menu.selectedIndex = Math.min(menu.buttons.length - 1, menu.selectedIndex + 1);
            this.game.playSound("menu_navigate");
        }

        // Action buttons (EXACT copy from Tetris)
        if (
            this.input.isKeyJustPressed("Action1") ||
            this.input.isGamepadButtonJustPressed(0, 0) ||
            this.input.isGamepadButtonJustPressed(0, 1) ||
            this.input.isGamepadButtonJustPressed(0, 2) ||
            this.input.isGamepadButtonJustPressed(0, 3)
        ) {
            this.executeStartMenuAction(menu.buttons[menu.selectedIndex].action);
        }
    }
    
    executeStartMenuAction(action) {
        switch (action) {
            case "start":
                this.game.setState(DR_MARIO_CONSTANTS.STATES.LEVEL_SELECT);
                this.game.playSound("menu_confirm");
                break;
            case "back":
                this.game.returnToTetris();
                break;
        }
    }
    
    handleLevelSelectInput() {
        const menu = this.levelSelectMenu;

        // EXACT copy of Tetris menu input handling
        // Check for mouse clicks FIRST
        for (let i = 0; i < menu.buttons.length; i++) {
            if (this.input.isElementJustPressed(`dr_level_button_${i}`)) {
                this.executeLevelSelectAction(menu.buttons[i].action);
                return;
            }
        }

        // Check for mouse hover - mouse overrides keyboard selection
        for (let i = 0; i < menu.buttons.length; i++) {
            if (this.input.isElementHovered(`dr_level_button_${i}`)) {
                if (menu.selectedIndex !== i) {
                    menu.selectedIndex = i;
                    this.game.playSound("menu_navigate");
                }
                break;
            }
        }

        // Keyboard/gamepad navigation (EXACT copy from Tetris)
        if (
            this.input.isKeyJustPressed("DirUp") ||
            this.input.isGamepadButtonJustPressed(12, 0) ||
            this.input.isGamepadButtonJustPressed(12, 1) ||
            this.input.isGamepadButtonJustPressed(12, 2) ||
            this.input.isGamepadButtonJustPressed(12, 3)
        ) {
            menu.selectedIndex = Math.max(0, menu.selectedIndex - 1);
            this.game.playSound("menu_navigate");
        }

        if (
            this.input.isKeyJustPressed("DirDown") ||
            this.input.isGamepadButtonJustPressed(13, 0) ||
            this.input.isGamepadButtonJustPressed(13, 1) ||
            this.input.isGamepadButtonJustPressed(13, 2) ||
            this.input.isGamepadButtonJustPressed(13, 3)
        ) {
            menu.selectedIndex = Math.min(menu.buttons.length - 1, menu.selectedIndex + 1);
            this.game.playSound("menu_navigate");
        }

        // Left/Right for adjusting values
        if (
            this.input.isKeyJustPressed("DirLeft") ||
            this.input.isGamepadButtonJustPressed(14, 0) ||
            this.input.isGamepadButtonJustPressed(14, 1) ||
            this.input.isGamepadButtonJustPressed(14, 2) ||
            this.input.isGamepadButtonJustPressed(14, 3)
        ) {
            this.adjustSetting(-1);
        }

        if (
            this.input.isKeyJustPressed("DirRight") ||
            this.input.isGamepadButtonJustPressed(15, 0) ||
            this.input.isGamepadButtonJustPressed(15, 1) ||
            this.input.isGamepadButtonJustPressed(15, 2) ||
            this.input.isGamepadButtonJustPressed(15, 3)
        ) {
            this.adjustSetting(1);
        }

        // Action buttons (EXACT copy from Tetris)
        if (
            this.input.isKeyJustPressed("Action1") ||
            this.input.isGamepadButtonJustPressed(0, 0) ||
            this.input.isGamepadButtonJustPressed(0, 1) ||
            this.input.isGamepadButtonJustPressed(0, 2) ||
            this.input.isGamepadButtonJustPressed(0, 3)
        ) {
            this.executeLevelSelectAction(menu.buttons[menu.selectedIndex].action);
        }

        // Action2 for back
        if (
            this.input.isKeyJustPressed("Action2") ||
            this.input.isGamepadButtonJustPressed(1, 0) ||
            this.input.isGamepadButtonJustPressed(1, 1) ||
            this.input.isGamepadButtonJustPressed(1, 2) ||
            this.input.isGamepadButtonJustPressed(1, 3)
        ) {
            this.game.returnToTetris();
        }
    }
    
    adjustSetting(direction) {
        const menu = this.levelSelectMenu;
        
        if (menu.selectedIndex === 0) { // Virus level
            this.selectedVirusLevel = Math.max(1, Math.min(40, this.selectedVirusLevel + direction));
            this.game.playSound("menu_navigate");
        } else if (menu.selectedIndex === 1) { // Speed
            this.selectedSpeed = Math.max(0, Math.min(2, this.selectedSpeed + direction));
            this.game.playSound("menu_navigate");
        }
    }
    
    executeLevelSelectAction(action) {
        switch (action) {
            case "startGame":
                this.game.gameLogic.startGameWithSettings(this.selectedVirusLevel, this.selectedSpeed);
                break;
            case "back":
                this.game.returnToTetris();
                break;
        }
    }
    
    handleGameplayInput(deltaTime) {
        const currentCapsule = this.game.gameLogic.currentCapsule;
        if (!currentCapsule || currentCapsule.locked) return;

        // Get active gamepad for single-player (any connected gamepad, like Tetris)
        const activeGamepadIndex = this.getActiveGamepadIndex();

        // Rotation with debounce (like Tetris)
        const currentTime = performance.now();
        if (currentTime - this.lastRotateTime > this.rotateDelay) {
            // Clockwise rotation (keyboard + active gamepad A/Cross)
            if (
                this.input.isKeyJustPressed("Action1") ||
                (activeGamepadIndex !== -1 && this.input.isGamepadButtonJustPressed(0, activeGamepadIndex))
            ) {
                if (currentCapsule.tryRotate(this.game.gameLogic.grid, true)) {
                    this.game.playSound("rotate");
                    this.lastRotateTime = currentTime;
                }
            }

            // Counter-clockwise rotation (keyboard + active gamepad B/Circle)
            if (
                this.input.isKeyJustPressed("Action2") ||
                (activeGamepadIndex !== -1 && this.input.isGamepadButtonJustPressed(1, activeGamepadIndex))
            ) {
                if (currentCapsule.tryRotate(this.game.gameLogic.grid, false)) {
                    this.game.playSound("rotate");
                    this.lastRotateTime = currentTime;
                }
            }
        }

        // Hard drop (like Tetris: DirUp/D-pad up)
        if (
            this.input.isKeyJustPressed("DirUp") ||
            (activeGamepadIndex !== -1 && this.input.isGamepadButtonJustPressed(12, activeGamepadIndex))
        ) {
            this.doHardDrop();
            return; // Hard drop takes precedence, skip other input
        }

        // Soft drop (like Tetris: DirDown/D-pad down)
        const downPressed = this.input.isKeyPressed("DirDown") ||
                          (activeGamepadIndex !== -1 && this.input.isGamepadButtonPressed(13, activeGamepadIndex));

        // Movement with repeat delay (like PillPanicGame.js)
        this.moveRepeatTimer += deltaTime;
        const canMove = this.moveRepeatTimer >= this.moveRepeatDelay;

        const leftPressed = this.input.isKeyPressed("DirLeft") ||
                          (activeGamepadIndex !== -1 && this.input.isGamepadButtonPressed(14, activeGamepadIndex));
        const rightPressed = this.input.isKeyPressed("DirRight") ||
                           (activeGamepadIndex !== -1 && this.input.isGamepadButtonPressed(15, activeGamepadIndex));

        if (leftPressed && canMove) {
            if (this.game.gameLogic.moveCapsule(-1, 0)) {
                this.game.playSound("move");
                this.moveRepeatTimer = 0;
            }
        }

        if (rightPressed && canMove) {
            if (this.game.gameLogic.moveCapsule(1, 0)) {
                this.game.playSound("move");
                this.moveRepeatTimer = 0;
            }
        }

        // Soft drop down movement (faster than normal fall)
        if (downPressed) {
            this.doSoftDrop(deltaTime);
        }

        // Reset move timer if no horizontal movement key pressed
        if (!leftPressed && !rightPressed) {
            this.moveRepeatTimer = this.moveRepeatDelay;
        }
    }
    
    handleGameOverInput() {
        if (this.input.isKeyJustPressed("Action1")) {
            this.game.setState(DR_MARIO_CONSTANTS.STATES.START_SCREEN);
        }
    }
    
    cleanup() {
        // Unregister all menu elements
        this.startMenu.buttons.forEach((button, i) => {
            this.input.removeElement(`dr_start_button_${i}`);
        });

        this.levelSelectMenu.buttons.forEach((button, i) => {
            this.input.removeElement(`dr_level_button_${i}`);
        });
    }

    /**
     * Hard drop the capsule to the bottom (like Tetris)
     */
    doHardDrop() {
        let moved = false;
        while (this.game.gameLogic.moveCapsule(0, 1)) {
            moved = true;
        }
        if (moved) {
            this.game.playSound("hard_drop", { volume: 0.5 });
        }
    }

    /**
     * Soft drop - move down faster (like Tetris)
     */
    doSoftDrop(deltaTime) {
        // Move down at faster speed when down is held
        const speedMultipliers = [0.7, 1.0, 1.5];
        const speedMultiplier = speedMultipliers[this.game.gameLogic.selectedSpeed] || 1.0;
        const softDropFallSpeed = Math.max(
            DR_MARIO_CONSTANTS.PHYSICS.MIN_FALL_SPEED,
            DR_MARIO_CONSTANTS.PHYSICS.BASE_FALL_SPEED / speedMultiplier / DR_MARIO_CONSTANTS.PHYSICS.FAST_DROP_MULTIPLIER
        );

        this.softDropTimer += deltaTime;

        if (this.softDropTimer >= softDropFallSpeed) {
            this.softDropTimer = 0;
            if (this.game.gameLogic.moveCapsule(0, 1)) {
                // Soft drop sound could be added here if desired
            }
        }
    }

    /**
     * Get the index of the first connected gamepad that has active input
     * Returns -1 if no gamepad is active (same as Tetris GameplayInputManager)
     */
    getActiveGamepadIndex() {
        for (let i = 0; i < 4; i++) {
            // Check up to 4 gamepads
            if (this.input.isGamepadConnected(i)) {
                // Check if any button is pressed
                for (let button = 0; button < 16; button++) {
                    if (this.input.isGamepadButtonPressed(button, i)) {
                        return i;
                    }
                }
            }
        }
        return -1; // No active gamepad found
    }
}

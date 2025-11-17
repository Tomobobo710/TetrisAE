/**
 * Pill Panic Input Manager - Uses EXACT same system as Tetris menus
 */
class PillPanicInputManager {
    constructor(drMarioGame) {
        this.game = drMarioGame;
        this.input = drMarioGame.input;
        
        // Custom controls adapter (same as Tetris)
        this.customInput = this.input.getCustomControlsAdapter();

        // Movement repeat timing (same as PillPanicGame.js)
        this.moveRepeatTimer = 0;
        this.moveRepeatDelay = 0.15; // 150ms between moves

        // Soft drop timing
        this.softDropTimer = 0;

        // Rotation debounce (like Tetris)
        this.rotateDelay = 150; // ms between rotations
        this.lastRotateTime = 0;

        // Create proper Tetris-style menu objects
        this.levelSelectMenu = {
            buttons: [
                { text: "VIRUS LEVEL", action: "virusLevel" },
                { text: "SPEED", action: "speed" },
                { text: "START GAME", action: "startGame" },
                { text: "BACK TO TETRIS", action: "back" }
            ],
            selectedIndex: 0
        };

        // Track last hovered arrow elements to avoid repeated sounds
        this.lastHoveredArrow = null;

        this.victoryMenu = {
            buttons: [
                { text: "BACK TO MENU", action: "backToMenu" }
            ],
            selectedIndex: 0
        };

        this.gameOverMenu = {
            buttons: [
                { text: "BACK TO MENU", action: "backToMenu" }
            ],
            selectedIndex: 0
        };

        this.pauseMenu = {
            buttons: [
                { text: "RESUME", action: "resume" },
                { text: "BACK TO MENU", action: "backToMenu" }
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

        // Register level select menu buttons
        this.levelSelectMenu.buttons.forEach((button, i) => {
            const id = `dr_level_button_${i}`;
            this.buttonElements[id] = { x: 0, y: 0, width: 100, height: 50 };
            this.input.registerElement(id, { bounds: () => this.buttonElements[id] });
        });

        // Register arrow buttons for virus level and speed adjustment
        // Left arrow for virus level
        this.buttonElements["dr_level_left_arrow_0"] = { x: 0, y: 0, width: 30, height: 30 };
        this.input.registerElement("dr_level_left_arrow_0", { bounds: () => this.buttonElements["dr_level_left_arrow_0"] });

        // Right arrow for virus level
        this.buttonElements["dr_level_right_arrow_0"] = { x: 0, y: 0, width: 30, height: 30 };
        this.input.registerElement("dr_level_right_arrow_0", { bounds: () => this.buttonElements["dr_level_right_arrow_0"] });

        // Left arrow for speed
        this.buttonElements["dr_level_left_arrow_1"] = { x: 0, y: 0, width: 30, height: 30 };
        this.input.registerElement("dr_level_left_arrow_1", { bounds: () => this.buttonElements["dr_level_left_arrow_1"] });

        // Right arrow for speed
        this.buttonElements["dr_level_right_arrow_1"] = { x: 0, y: 0, width: 30, height: 30 };
        this.input.registerElement("dr_level_right_arrow_1", { bounds: () => this.buttonElements["dr_level_right_arrow_1"] });

        // Register victory menu buttons
        this.victoryMenu.buttons.forEach((button, i) => {
            const id = `dr_gameover_button_${i}`;
            this.buttonElements[id] = { x: 0, y: 0, width: 100, height: 50 };
            this.input.registerElement(id, { bounds: () => this.buttonElements[id] });
        });

        // Register game over menu buttons
        this.gameOverMenu.buttons.forEach((button, i) => {
            const id = `dr_gameover_button_${i}`;
            this.buttonElements[id] = { x: 0, y: 0, width: 100, height: 50 };
            this.input.registerElement(id, { bounds: () => this.buttonElements[id] });
        });

        // Register pause menu buttons
        this.pauseMenu.buttons.forEach((button, i) => {
            const id = `dr_pause_button_${i}`;
            this.buttonElements[id] = { x: 0, y: 0, width: 100, height: 50 };
            this.input.registerElement(id, { bounds: () => this.buttonElements[id] });
        });
    }
    
    updateMenuElementPositions(state, buttonPositions) {
        // Update stored button positions (bounds functions will return these)
        let prefix = "";
        if (state === "levelSelect") prefix = "dr_level";
        else if (state === "victory") prefix = "dr_gameover";
        else if (state === "gameOver") prefix = "dr_gameover";
        else if (state === "pause") prefix = "dr_pause";

        buttonPositions.forEach((pos, i) => {
            this.buttonElements[`${prefix}_button_${i}`] = { x: pos.x, y: pos.y, width: pos.width, height: pos.height };
        });

        // Update arrow button positions for level select menu
        if (state === "levelSelect") {
            const buttonWidth = 240;
            const buttonHeight = 50;
            const startY = 180;
            const spacing = 60;

            // Virus level arrows (button index 0)
            const virusLevelY = startY + 0 * spacing;
            const virusLevelX = PILL_PANIC_CONSTANTS.WIDTH / 2 - buttonWidth / 2;
            this.buttonElements["dr_level_left_arrow_0"] = {
                x: virusLevelX - 55,
                y: virusLevelY + buttonHeight / 2 - 15,
                width: 30,
                height: 30
            };
            this.buttonElements["dr_level_right_arrow_0"] = {
                x: virusLevelX + buttonWidth + 25,
                y: virusLevelY + buttonHeight / 2 - 15,
                width: 30,
                height: 30
            };

            // Speed arrows (button index 1)
            const speedY = startY + 1 * spacing;
            const speedX = PILL_PANIC_CONSTANTS.WIDTH / 2 - buttonWidth / 2;
            this.buttonElements["dr_level_left_arrow_1"] = {
                x: speedX - 55,
                y: speedY + buttonHeight / 2 - 15,
                width: 30,
                height: 30
            };
            this.buttonElements["dr_level_right_arrow_1"] = {
                x: speedX + buttonWidth + 25,
                y: speedY + buttonHeight / 2 - 15,
                width: 30,
                height: 30
            };
        }
    }
    
    handleInput(deltaTime) {
        if (this.input.isKeyJustPressed("ActionDebugToggle")) {
            this.game.gameLogic.debugOverlayVisible = !this.game.gameLogic.debugOverlayVisible;
        }

        switch (this.game.gameState) {
            case PILL_PANIC_CONSTANTS.STATES.LEVEL_SELECT:
                this.handleLevelSelectInput();
                break;
            case PILL_PANIC_CONSTANTS.STATES.PLAYING:
                this.handleGameplayInput(deltaTime);
                break;
            case PILL_PANIC_CONSTANTS.STATES.PAUSED:
                this.handlePauseInput();
                break;
            case PILL_PANIC_CONSTANTS.STATES.VICTORY:
                this.handleVictoryInput();
                break;
            case PILL_PANIC_CONSTANTS.STATES.GAME_OVER:
                this.handleGameOverInput();
                break;
        }
    }
    
    
    handleLevelSelectInput() {
        const menu = this.levelSelectMenu;

        // Check for arrow button clicks FIRST (only when corresponding menu item is selected)
        if (menu.selectedIndex === 0) { // Virus level selected
            if (this.input.isElementJustPressed("dr_level_left_arrow_0")) {
                this.adjustSetting(-1);
                this.game.playSound("menu_back");
                return;
            }
            if (this.input.isElementJustPressed("dr_level_right_arrow_0")) {
                this.adjustSetting(1);
                this.game.playSound("menu_confirm");
                return;
            }
            // Check for arrow hover and play sound (only once per hover)
            const currentArrow = this.input.isElementHovered("dr_level_left_arrow_0") ? "left_0" :
                                this.input.isElementHovered("dr_level_right_arrow_0") ? "right_0" : null;
            if (currentArrow && currentArrow !== this.lastHoveredArrow) {
                this.game.playSound("menu_navigate");
                this.lastHoveredArrow = currentArrow;
            }
        } else if (menu.selectedIndex === 1) { // Speed selected
            if (this.input.isElementJustPressed("dr_level_left_arrow_1")) {
                this.adjustSetting(-1);
                this.game.playSound("menu_back");
                return;
            }
            if (this.input.isElementJustPressed("dr_level_right_arrow_1")) {
                this.adjustSetting(1);
                this.game.playSound("menu_confirm");
                return;
            }
            // Check for arrow hover and play sound (only once per hover)
            const currentArrow = this.input.isElementHovered("dr_level_left_arrow_1") ? "left_1" :
                                this.input.isElementHovered("dr_level_right_arrow_1") ? "right_1" : null;
            if (currentArrow && currentArrow !== this.lastHoveredArrow) {
                this.game.playSound("menu_navigate");
                this.lastHoveredArrow = currentArrow;
            }
        }

        // Reset last hovered arrow if nothing is hovered
        if (menu.selectedIndex === 0) {
            if (!this.input.isElementHovered("dr_level_left_arrow_0") && !this.input.isElementHovered("dr_level_right_arrow_0")) {
                this.lastHoveredArrow = null;
            }
        } else if (menu.selectedIndex === 1) {
            if (!this.input.isElementHovered("dr_level_left_arrow_1") && !this.input.isElementHovered("dr_level_right_arrow_1")) {
                this.lastHoveredArrow = null;
            }
        }

        // EXACT copy of Tetris menu input handling
        // Check for mouse clicks on buttons SECOND
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

        // Left/Right for adjusting values (only when virus level or speed is selected)
        if (menu.selectedIndex === 0 || menu.selectedIndex === 1) {
            if (
                this.input.isKeyJustPressed("DirLeft") ||
                this.input.isGamepadButtonJustPressed(14, 0) ||
                this.input.isGamepadButtonJustPressed(14, 1) ||
                this.input.isGamepadButtonJustPressed(14, 2) ||
                this.input.isGamepadButtonJustPressed(14, 3)
            ) {
                this.adjustSetting(-1);
                this.game.playSound("menu_back");
            }

            if (
                this.input.isKeyJustPressed("DirRight") ||
                this.input.isGamepadButtonJustPressed(15, 0) ||
                this.input.isGamepadButtonJustPressed(15, 1) ||
                this.input.isGamepadButtonJustPressed(15, 2) ||
                this.input.isGamepadButtonJustPressed(15, 3)
            ) {
                this.adjustSetting(1);
                this.game.playSound("menu_confirm");
            }
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
        } else if (menu.selectedIndex === 1) { // Speed
            this.selectedSpeed = Math.max(0, Math.min(2, this.selectedSpeed + direction));
        }
        // Sound is now played in handleLevelSelectInput where the clicks are handled
    }
    
    executeLevelSelectAction(action) {
        switch (action) {
            case "startGame":
                this.game.gameLogic.startGameWithSettings(this.selectedVirusLevel, this.selectedSpeed);
                break;
            case "back":
                // Reset level select menu selection when going back to Tetris
                this.levelSelectMenu.selectedIndex = 0;
                this.game.returnToTetris();
                break;
        }
    }
    
    handleGameplayInput(deltaTime) {
        // Handle pause input - use custom controls only
        if (this.customInput && this.customInput.isActionJustPressed('pause')) {
            this.game.setState(PILL_PANIC_CONSTANTS.STATES.PAUSED);
            this.game.playSound("menu_pause");
            return;
        }

        const currentCapsule = this.game.gameLogic.currentCapsule;
        if (!currentCapsule || currentCapsule.locked) return;

        // Get active gamepad for single-player (any connected gamepad, like Tetris)
        const activeGamepadIndex = this.getActiveGamepadIndex();

        // Rotation with debounce (like Tetris)
        const currentTime = performance.now();
        if (currentTime - this.lastRotateTime > this.rotateDelay) {
            // Clockwise rotation - use custom controls if available
            let rotateCWPressed = false;
            if (this.customInput) {
                rotateCWPressed = this.customInput.isActionJustPressed('rotateCW');
            } else {
                rotateCWPressed = this.input.isKeyJustPressed("Action1") ||
                    (activeGamepadIndex !== -1 && this.input.isGamepadButtonJustPressed(0, activeGamepadIndex));
            }
            
            if (rotateCWPressed) {
                if (this.game.gameLogic.rotateCapsule(true)) {
                    this.game.playSound("rotate");
                    this.lastRotateTime = currentTime;
                }
            }

            // Counter-clockwise rotation - use custom controls if available
            let rotateCCWPressed = false;
            if (this.customInput) {
                rotateCCWPressed = this.customInput.isActionJustPressed('rotateCCW');
            } else {
                rotateCCWPressed = this.input.isKeyJustPressed("Action2") ||
                    (activeGamepadIndex !== -1 && this.input.isGamepadButtonJustPressed(1, activeGamepadIndex));
            }

            if (rotateCCWPressed) {
                if (this.game.gameLogic.rotateCapsule(false)) {
                    this.game.playSound("rotate");
                    this.lastRotateTime = currentTime;
                }
            }
        }

        // Hard drop - use custom controls if available
        let hardDropPressed = false;
        if (this.customInput) {
            hardDropPressed = this.customInput.isActionJustPressed('hardDrop');
        } else {
            hardDropPressed = this.input.isKeyJustPressed("DirUp") ||
                (activeGamepadIndex !== -1 && this.input.isGamepadButtonJustPressed(12, activeGamepadIndex));
        }
        
        if (hardDropPressed) {
            this.doHardDrop();
            return; // Hard drop takes precedence, skip other input
        }

        // Soft drop - use custom controls if available
        let downPressed = false;
        if (this.customInput) {
            downPressed = this.customInput.isActionPressed('softDrop');
        } else {
            downPressed = this.input.isKeyPressed("DirDown") ||
                (activeGamepadIndex !== -1 && this.input.isGamepadButtonPressed(13, activeGamepadIndex));
        }

        // Movement with repeat delay (like PillPanicGame.js)
        this.moveRepeatTimer += deltaTime;
        const canMove = this.moveRepeatTimer >= this.moveRepeatDelay;

        // Movement - use custom controls if available
        let leftPressed = false;
        let rightPressed = false;
        
        if (this.customInput) {
            leftPressed = this.customInput.isActionPressed('moveLeft');
            rightPressed = this.customInput.isActionPressed('moveRight');
        } else {
            leftPressed = this.input.isKeyPressed("DirLeft") ||
                (activeGamepadIndex !== -1 && this.input.isGamepadButtonPressed(14, activeGamepadIndex));
            rightPressed = this.input.isKeyPressed("DirRight") ||
                (activeGamepadIndex !== -1 && this.input.isGamepadButtonPressed(15, activeGamepadIndex));
        }

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
    
    handleVictoryInput() {
        const menu = this.victoryMenu;

        // Check for mouse clicks FIRST
        for (let i = 0; i < menu.buttons.length; i++) {
            if (this.input.isElementJustPressed(`dr_gameover_button_${i}`)) {
                this.executeVictoryAction(menu.buttons[i].action);
                return;
            }
        }

        // Check for mouse hover - mouse overrides keyboard selection
        for (let i = 0; i < menu.buttons.length; i++) {
            if (this.input.isElementHovered(`dr_gameover_button_${i}`)) {
                if (menu.selectedIndex !== i) {
                    menu.selectedIndex = i;
                    this.game.playSound("menu_navigate");
                }
                break;
            }
        }

        // Keyboard/gamepad navigation
        if (this.input.isKeyJustPressed("DirUp") || this.input.isKeyJustPressed("DirDown") ||
            this.input.isGamepadButtonJustPressed(12, this.getActiveGamepadIndex()) ||
            this.input.isGamepadButtonJustPressed(13, this.getActiveGamepadIndex())) {
            // Only one option, but keep cycling for consistency
            menu.selectedIndex = (menu.selectedIndex + 1) % menu.buttons.length;
            this.game.playSound("menu_navigate");
        }

        // Action buttons
        if (this.input.isKeyJustPressed("Action1") ||
            this.input.isGamepadButtonJustPressed(0, this.getActiveGamepadIndex())) {
            this.executeVictoryAction(menu.buttons[menu.selectedIndex].action);
        }

        // Action2 for back (same as Action1 for victory screen)
        if (this.input.isKeyJustPressed("Action2") ||
            this.input.isGamepadButtonJustPressed(1, this.getActiveGamepadIndex())) {
            this.executeVictoryAction(menu.buttons[menu.selectedIndex].action);
        }
    }

    executeVictoryAction(action) {
        switch (action) {
            case "backToMenu":
                this.game.setState(PILL_PANIC_CONSTANTS.STATES.LEVEL_SELECT);
                this.game.playSound("menu_confirm");
                break;
        }
    }

    handleGameOverInput() {
        const menu = this.gameOverMenu;

        // Check for mouse clicks FIRST
        for (let i = 0; i < menu.buttons.length; i++) {
            if (this.input.isElementJustPressed(`dr_gameover_button_${i}`)) {
                this.executeGameOverAction(menu.buttons[i].action);
                return;
            }
        }

        // Check for mouse hover - mouse overrides keyboard selection
        for (let i = 0; i < menu.buttons.length; i++) {
            if (this.input.isElementHovered(`dr_gameover_button_${i}`)) {
                if (menu.selectedIndex !== i) {
                    menu.selectedIndex = i;
                    this.game.playSound("menu_navigate");
                }
                break;
            }
        }

        // Keyboard/gamepad navigation
        if (this.input.isKeyJustPressed("DirUp") || this.input.isKeyJustPressed("DirDown") ||
            this.input.isGamepadButtonJustPressed(12, this.getActiveGamepadIndex()) ||
            this.input.isGamepadButtonJustPressed(13, this.getActiveGamepadIndex())) {
            // Only one option, but keep cycling for consistency
            menu.selectedIndex = (menu.selectedIndex + 1) % menu.buttons.length;
            this.game.playSound("menu_navigate");
        }

        // Action buttons
        if (this.input.isKeyJustPressed("Action1") ||
            this.input.isGamepadButtonJustPressed(0, this.getActiveGamepadIndex())) {
            this.executeGameOverAction(menu.buttons[menu.selectedIndex].action);
        }

        // Action2 for back (same as Action1 for game over screen)
        if (this.input.isKeyJustPressed("Action2") ||
            this.input.isGamepadButtonJustPressed(1, this.getActiveGamepadIndex())) {
            this.executeGameOverAction(menu.buttons[menu.selectedIndex].action);
        }
    }

    executeGameOverAction(action) {
        switch (action) {
            case "backToMenu":
                this.game.setState(PILL_PANIC_CONSTANTS.STATES.LEVEL_SELECT);
                this.game.playSound("menu_confirm");
                break;
        }
    }

    handlePauseInput() {
        const menu = this.pauseMenu;

        // Check for mouse clicks FIRST
        for (let i = 0; i < menu.buttons.length; i++) {
            if (this.input.isElementJustPressed(`dr_pause_button_${i}`)) {
                this.executePauseAction(menu.buttons[i].action);
                return;
            }
        }

        // Check for mouse hover - mouse overrides keyboard selection
        for (let i = 0; i < menu.buttons.length; i++) {
            if (this.input.isElementHovered(`dr_pause_button_${i}`)) {
                if (menu.selectedIndex !== i) {
                    menu.selectedIndex = i;
                    this.game.playSound("menu_navigate");
                }
                break;
            }
        }

        // Handle unpause with pause key - use custom controls only
        if (this.customInput && this.customInput.isActionJustPressed('pause')) {
            this.executePauseAction("resume");
            return;
        }

        // Keyboard/gamepad navigation
        if (this.input.isKeyJustPressed("DirUp") ||
            this.input.isGamepadButtonJustPressed(12, this.getActiveGamepadIndex())) {
            menu.selectedIndex = Math.max(0, menu.selectedIndex - 1);
            this.game.playSound("menu_navigate");
        }

        if (this.input.isKeyJustPressed("DirDown") ||
            this.input.isGamepadButtonJustPressed(13, this.getActiveGamepadIndex())) {
            menu.selectedIndex = Math.min(menu.buttons.length - 1, menu.selectedIndex + 1);
            this.game.playSound("menu_navigate");
        }

        // Action buttons
        if (this.input.isKeyJustPressed("Action1") ||
            this.input.isGamepadButtonJustPressed(0, this.getActiveGamepadIndex())) {
            this.executePauseAction(menu.buttons[menu.selectedIndex].action);
        }

        // Action2 for back (same as Action1 for pause screen)
        if (this.input.isKeyJustPressed("Action2") ||
            this.input.isGamepadButtonJustPressed(1, this.getActiveGamepadIndex())) {
            this.executePauseAction(menu.buttons[menu.selectedIndex].action);
        }
    }

    executePauseAction(action) {
        switch (action) {
            case "resume":
                this.game.setState(PILL_PANIC_CONSTANTS.STATES.PLAYING);
                this.game.playSound("menu_confirm");
                break;
            case "backToMenu":
                this.game.setState(PILL_PANIC_CONSTANTS.STATES.LEVEL_SELECT);
                this.game.playSound("menu_back");
                break;
        }
    }

    // Victory and game over actions now handled by their own execute methods
    
    cleanup() {
        // Unregister all menu elements
        this.levelSelectMenu.buttons.forEach((button, i) => {
            this.input.removeElement(`dr_level_button_${i}`);
        });

        // Unregister arrow buttons
        this.input.removeElement("dr_level_left_arrow_0");
        this.input.removeElement("dr_level_right_arrow_0");
        this.input.removeElement("dr_level_left_arrow_1");
        this.input.removeElement("dr_level_right_arrow_1");

        this.victoryMenu.buttons.forEach((button, i) => {
            this.input.removeElement(`dr_gameover_button_${i}`);
        });

        this.gameOverMenu.buttons.forEach((button, i) => {
            this.input.removeElement(`dr_gameover_button_${i}`);
        });

        this.pauseMenu.buttons.forEach((button, i) => {
            this.input.removeElement(`dr_pause_button_${i}`);
        });
    }

    /**
     * Hard drop the capsule to the bottom and immediately lock it (like Tetris)
     * Works even if capsule is already at bottom (doesn't need to move)
     */
    doHardDrop() {
        const currentCapsule = this.game.gameLogic.currentCapsule;
        if (!currentCapsule || currentCapsule.locked) return;

        let moved = false;
        while (this.game.gameLogic.moveCapsule(0, 1)) {
            moved = true;
        }

        // Always lock after hard drop attempt, even if no movement occurred
        // (capsule might already be at bottom)
        this.game.playSound("hard_drop");
        currentCapsule.locked = true;
        currentCapsule.lockTimer = 0; // Lock immediately
    }

    /**
     * Soft drop - move down faster (like Tetris)
     */
    doSoftDrop(deltaTime) {
        // Move down at faster speed when down is held
        const speedMultipliers = [0.7, 1.0, 1.5];
        const speedMultiplier = speedMultipliers[this.game.gameLogic.selectedSpeed] || 1.0;
        const softDropFallSpeed = Math.max(
            PILL_PANIC_CONSTANTS.PHYSICS.MIN_FALL_SPEED,
            PILL_PANIC_CONSTANTS.PHYSICS.BASE_FALL_SPEED / speedMultiplier / PILL_PANIC_CONSTANTS.PHYSICS.FAST_DROP_MULTIPLIER
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

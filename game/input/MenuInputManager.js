/**
 * MenuInputManager - Handles all menu navigation and selection logic
 * Extracted from InputHandler.js to reduce complexity
 */
class MenuInputManager {
    constructor(game, input, uiWindowsCoordinator) {
        this.game = game;
        this.input = input;
        this.uiWindowsCoordinator = uiWindowsCoordinator;
    }

    /**
     * Handle main menu input
     */
    handleMainMenuInput() {
        // Register main menu buttons when entering or returning from sub-menus
        if (!this.game.mainMenu.buttonsRegistered) {
            this.registerMainMenuButtons();

            // Snap selectedIndex to current pointer position for immediate hover feedback
            const pointer = this.input.getPointerPosition();
            const buttonWidth = 240;
            const buttonHeight = 60;
            const startY = 295; // Position below title
            const spacing = 75;
            for (let i = 0; i < this.game.mainMenu.buttons.length; i++) {
                const x = TETRIS.WIDTH / 2 - buttonWidth / 2;
                const y = startY + i * spacing;
                if (pointer.x >= x && pointer.x <= x + buttonWidth && pointer.y >= y && pointer.y <= y + buttonHeight) {
                    this.game.mainMenu.selectedIndex = i;
                    break;
                }
            }
        }

        const menu = this.game.mainMenu;
        const maxIndex = menu.buttons.length - 1;

        // Check for mouse clicks FIRST
        for (let i = 0; i < menu.buttons.length; i++) {
            if (this.input.isElementJustPressed(`main_button_${i}`)) {
                const selectedButton = menu.buttons[i];
                this.executeMainMenuAction(selectedButton.action);
                return; // Consume the click and exit
            }
        }

        // Check for mouse hover - mouse overrides keyboard selection (direct bounds check like pause menu)
        const buttonWidth = 240;
        const buttonHeight = 60;
        const startY = 295; // Position below title
        const spacing = 75;
        for (let i = 0; i < menu.buttons.length; i++) {
            const buttonX = TETRIS.WIDTH / 2 - buttonWidth / 2;
            const buttonY = startY + i * spacing;
            const pointer = this.input.getPointerPosition();

            // Check if mouse is hovering over this button
            if (pointer.x >= buttonX && pointer.x <= buttonX + buttonWidth &&
                pointer.y >= buttonY && pointer.y <= buttonY + buttonHeight) {
                if (menu.selectedIndex !== i) {
                    menu.selectedIndex = i;
                    if (!this.game.skipMenuNavigateSound) {
                        this.game.playSound("menu_navigate");
                    }
                }
                break;
            }
        }

        // Handle left mouse click by checking pointer bounds directly (fixes first-click issue after menu switch)
        if (this.input.isLeftMouseButtonJustPressed()) {
            const pointer = this.input.getPointerPosition();
            const buttonWidth = 240;
            const buttonHeight = 60;
            const startY = 295; // Position below title
            const spacing = 75;
            for (let i = 0; i < menu.buttons.length; i++) {
                const x = TETRIS.WIDTH / 2 - buttonWidth / 2;
                const y = startY + i * spacing;
                if (pointer.x >= x && pointer.x <= x + buttonWidth && pointer.y >= y && pointer.y <= y + buttonHeight) {
                    const selectedButton = menu.buttons[i];
                    this.executeMainMenuAction(selectedButton.action);
                    return;
                }
            }
        }

        // Multi-device navigation - use existing API directly
        if (
            this.input.isKeyJustPressed("DirUp") ||
            this.input.isGamepadButtonJustPressed(12, 0) || // D-pad up on gamepad 0
            this.input.isGamepadButtonJustPressed(12, 1) || // D-pad up on gamepad 1
            this.input.isGamepadButtonJustPressed(12, 2) || // D-pad up on gamepad 2
            this.input.isGamepadButtonJustPressed(12, 3)
        ) {
            // D-pad up on gamepad 3
            menu.selectedIndex = Math.max(0, menu.selectedIndex - 1);
            this.game.playSound("menu_navigate");
        }

        if (
            this.input.isKeyJustPressed("DirDown") ||
            this.input.isGamepadButtonJustPressed(13, 0) || // D-pad down on gamepad 0
            this.input.isGamepadButtonJustPressed(13, 1) || // D-pad down on gamepad 1
            this.input.isGamepadButtonJustPressed(13, 2) || // D-pad down on gamepad 2
            this.input.isGamepadButtonJustPressed(13, 3)
        ) {
            // D-pad down on gamepad 3
            menu.selectedIndex = Math.min(maxIndex, menu.selectedIndex + 1);
            this.game.playSound("menu_navigate");
        }

        // Confirm selection with Action1 (A/Cross button = primary face button)
        if (
            this.input.isKeyJustPressed("Action1") ||
            this.input.isGamepadButtonJustPressed(0, 0) || // A/Cross button on gamepad 0
            this.input.isGamepadButtonJustPressed(0, 1) || // A/Cross button on gamepad 1
            this.input.isGamepadButtonJustPressed(0, 2) || // A/Cross button on gamepad 2
            this.input.isGamepadButtonJustPressed(0, 3)
        ) {
            // A/Cross button on gamepad 3
            const selectedButton = menu.buttons[menu.selectedIndex];
            this.executeMainMenuAction(selectedButton.action);
        }
    }

    /**
     * Execute main menu actions
     */
    executeMainMenuAction(action) {
        switch (action) {
            case "startGame":
                this.game.startGame();
                this.unregisterMainMenuButtons();
                break;
            case "multiplayer":
                this.game.menuStack.current = "multiplayer";
                this.game.menuStack.previous = "main";
                this.unregisterMainMenuButtons();
                this.game.multiplayerMenu.selectedIndex = 0; // Reset to top option
                this.game.multiplayerMenu.buttonsRegistered = false; // Reset registration state
                this.game.playSound("menu_confirm");
                break;
            case "settings":
                this.game.menuStack.current = "settings";
                this.game.menuStack.previous = "main";
                this.unregisterMainMenuButtons();
                this.game.settingsMenu.selectedIndex = 0; // Reset to top option
                this.game.playSound("menu_confirm");
                break;
            case "pillPanic":
                this.game.startPillPanic();
                this.unregisterMainMenuButtons();
                break;
        }
    }

    /**
     * Handle pause menu input
     */
    handlePauseMenuInput(deltaTime) {
        const menu = this.game.pauseMenu;
        const maxIndex = menu.buttons.length - 1;

        // Register pause menu buttons when entering paused state
        if (!menu.buttonsRegistered) {
            this.registerPauseMenuButtons();

            // Snap selectedIndex to current pointer position for immediate hover feedback
            const pointer = this.input.getPointerPosition();
            const buttonWidth = 240;
            const buttonHeight = 60;
            const isSinglePlayer = this.game.gameManager && this.game.gameManager.players.length === 1;
            const startY = isSinglePlayer ? 220 - 75 : 220;
            const spacing = 75;
            for (let i = 0; i < menu.buttons.length; i++) {
                const x = TETRIS.WIDTH / 2 - buttonWidth / 2;
                const y = startY + i * spacing;
                if (pointer.x >= x && pointer.x <= x + buttonWidth && pointer.y >= y && pointer.y <= y + buttonHeight) {
                    menu.selectedIndex = i;
                    break;
                }
            }
        }

        // Check for mouse clicks FIRST
        for (let i = 0; i < menu.buttons.length; i++) {
            if (this.input.isElementJustPressed(`pause_button_${i}`)) {
                const selectedButton = menu.buttons[i];
                this.executePauseMenuAction(selectedButton.action);
                return; // Consume the click and exit
            }
        }

        // Check for mouse hover - mouse overrides keyboard selection
        const isSinglePlayer = this.game.gameManager && this.game.gameManager.players.length === 1;
        const buttonStartY = isSinglePlayer ? 220 - 75 : 220;
        const spacing = 75;
        for (let i = 0; i < menu.buttons.length; i++) {
            const buttonX = TETRIS.WIDTH / 2 - 120; // buttonWidth/2 = 240/2 = 120
            const buttonY = buttonStartY + i * spacing;
            const buttonWidth = 240;
            const buttonHeight = 60;

            // Check if mouse is hovering over this button
            const pointer = this.input.getPointerPosition();
            if (pointer.x >= buttonX && pointer.x <= buttonX + buttonWidth &&
                pointer.y >= buttonY && pointer.y <= buttonY + buttonHeight) {
                if (menu.selectedIndex !== i) {
                    menu.selectedIndex = i;
                    if (!this.game.skipMenuNavigateSound) {
                        this.game.playSound("menu_navigate");
                    }
                }
                break;
            }
        }

        // Handle left mouse click by checking pointer bounds directly (fixes first-click issue after menu switch)
        if (this.input.isLeftMouseButtonJustPressed()) {
            const pointer = this.input.getPointerPosition();
            const buttonWidth = 240;
            const buttonHeight = 60;
            const isSinglePlayer = this.game.gameManager && this.game.gameManager.players.length === 1;
            const startY = isSinglePlayer ? 220 - 75 : 220;
            const spacing = 75;
            for (let i = 0; i < menu.buttons.length; i++) {
                const x = TETRIS.WIDTH / 2 - buttonWidth / 2;
                const y = startY + i * spacing;
                if (pointer.x >= x && pointer.x <= x + buttonWidth && pointer.y >= y && pointer.y <= y + buttonHeight) {
                    const selectedButton = menu.buttons[i];
                    this.executePauseMenuAction(selectedButton.action);
                    return;
                }
            }
        }

        // Multi-device navigation - use existing API directly
        if (
            this.input.isKeyJustPressed("DirUp") ||
            this.input.isGamepadButtonJustPressed(12, 0) || // D-pad up on gamepad 0
            this.input.isGamepadButtonJustPressed(12, 1) || // D-pad up on gamepad 1
            this.input.isGamepadButtonJustPressed(12, 2) || // D-pad up on gamepad 2
            this.input.isGamepadButtonJustPressed(12, 3)
        ) {
            // D-pad up on gamepad 3
            menu.selectedIndex = Math.max(0, menu.selectedIndex - 1);
            this.game.playSound("menu_navigate");
        }

        if (
            this.input.isKeyJustPressed("DirDown") ||
            this.input.isGamepadButtonJustPressed(13, 0) || // D-pad down on gamepad 0
            this.input.isGamepadButtonJustPressed(13, 1) || // D-pad down on gamepad 1
            this.input.isGamepadButtonJustPressed(13, 2) || // D-pad down on gamepad 2
            this.input.isGamepadButtonJustPressed(13, 3)
        ) {
            // D-pad down on gamepad 3
            menu.selectedIndex = Math.min(maxIndex, menu.selectedIndex + 1);
            this.game.playSound("menu_navigate");
        }

        // Confirm selection with Action1 (A/Cross button = primary face button)
        if (
            this.input.isKeyJustPressed("Action1") ||
            this.input.isGamepadButtonJustPressed(0, 0) || // A/Cross button on gamepad 0
            this.input.isGamepadButtonJustPressed(0, 1) || // A/Cross button on gamepad 1
            this.input.isGamepadButtonJustPressed(0, 2) || // A/Cross button on gamepad 2
            this.input.isGamepadButtonJustPressed(0, 3)
        ) {
            // A/Cross button on gamepad 3
            const selectedButton = menu.buttons[menu.selectedIndex];
            this.executePauseMenuAction(selectedButton.action);
        }
    }

    /**
     * Execute pause menu actions
     */
    executePauseMenuAction(action) {
        switch (action) {
            case "newGame":
                // Start a new single-player game
                this.game.resetGame();
                this.game.playSound("menu_confirm");
                break;
            case "resume":
                this.game.gameState = this.game.menuStack.pausedGameState || "playing";
                this.game.menuStack.current = null;
                this.unregisterPauseMenuButtons();
                this.game.playSound("menu_confirm");
                break;
            case "settings":
                this.game.menuStack.current = "settings";
                this.game.menuStack.previous = "pause";
                this.unregisterPauseMenuButtons();
                this.game.settingsMenu.selectedIndex = 0; // Reset to top option
                this.game.playSound("menu_confirm");
                break;
            case "mainMenu":
                // Leave network session if in online multiplayer
                if (this.game.networkSession) {
                    console.log("[InputHandler] Leaving network session (pause menu → main menu)");
                    this.game.networkSession.leave();
                    this.game.networkSession = null;
                }
                // Disconnect from server if connected (leave room and disconnect)
                if (this.game.gui && this.game.gui.isConnected()) {
                    console.log("[InputHandler] Disconnecting from server (pause menu → main menu)");
                    this.game.gui.getNetManager().disconnect();
                    // Manually reset GUI state since disconnect() doesn't do it
                    this.game.gui.currentState = "LOGIN";
                    this.game.gui.selectedIndex = 0;
                    this.game.gui.serverStatus = "UNKNOWN";
                    this.game.gui.serverStatusColor = "#ffff00";
                }

                this.game.gameState = "title";
                this.game.menuStack.current = null;
                this.unregisterPauseMenuButtons();
                // Reset pause menu selection for next time
                this.game.pauseMenu.selectedIndex = 0;
                // Clear all game state when returning to main menu
                this.game.clearGameState();
                this.game.playSound("menu_confirm");
                break;
        }
    }

    /**
     * Handle game over menu input
     */
    handleGameOverMenuInput() {
        const menu = this.game.networkSession ? this.game.onlineGameOverMenu : this.game.gameOverMenu;
        const maxIndex = menu.buttons.length - 1;

        // Ensure mouse elements are registered for the active game over menu
        this.registerGameOverMenuButtons();

        // Check for mouse clicks FIRST
        for (let i = 0; i < menu.buttons.length; i++) {
            if (this.input.isElementJustPressed(`gameover_button_${i}`)) {
                const selectedButton = menu.buttons[i];
                this.executeGameOverMenuAction(selectedButton.action);
                return; // Consume the click and exit
            }
        }

        // Check for mouse hover - mouse overrides keyboard selection
        for (let i = 0; i < menu.buttons.length; i++) {
            if (this.input && this.input.isElementHovered(`gameover_button_${i}`)) {
                if (menu.selectedIndex !== i) {
                    menu.selectedIndex = i;
                    if (!this.game.skipMenuNavigateSound) {
                        this.game.playSound("menu_navigate");
                    }
                }
                break;
            }
        }

        // Multi-device navigation - use existing API directly
        if (
            this.input.isKeyJustPressed("DirUp") ||
            this.input.isGamepadButtonJustPressed(12, 0) || // D-pad up on gamepad 0
            this.input.isGamepadButtonJustPressed(12, 1) || // D-pad up on gamepad 1
            this.input.isGamepadButtonJustPressed(12, 2) || // D-pad up on gamepad 2
            this.input.isGamepadButtonJustPressed(12, 3)
        ) {
            // D-pad up on gamepad 3
            menu.selectedIndex = Math.max(0, menu.selectedIndex - 1);
            this.game.playSound("menu_navigate");
        }

        if (
            this.input.isKeyJustPressed("DirDown") ||
            this.input.isGamepadButtonJustPressed(13, 0) || // D-pad down on gamepad 0
            this.input.isGamepadButtonJustPressed(13, 1) || // D-pad down on gamepad 1
            this.input.isGamepadButtonJustPressed(13, 2) || // D-pad down on gamepad 2
            this.input.isGamepadButtonJustPressed(13, 3)
        ) {
            // D-pad down on gamepad 3
            menu.selectedIndex = Math.min(maxIndex, menu.selectedIndex + 1);
            this.game.playSound("menu_navigate");
        }

        // Confirm selection with Action1 (A/Cross button = primary face button)
        if (
            this.input.isKeyJustPressed("Action1") ||
            this.input.isGamepadButtonJustPressed(0, 0) || // A/Cross button on gamepad 0
            this.input.isGamepadButtonJustPressed(0, 1) || // A/Cross button on gamepad 1
            this.input.isGamepadButtonJustPressed(0, 2) || // A/Cross button on gamepad 2
            this.input.isGamepadButtonJustPressed(0, 3)
        ) {
            // A/Cross button on gamepad 3
            const selectedButton = menu.buttons[menu.selectedIndex];
            this.executeGameOverMenuAction(selectedButton.action);
        }
    }

    /**
     * Execute game over menu actions
     */
    executeGameOverMenuAction(action) {
        switch (action) {
            case "newGame":
                // Check if this is an online multiplayer game
                // Just check for networkSession existence - gameState will be 'gameOver' at this point
                if (this.game.networkSession) {
                    // Request rematch through network session
                    console.log("[InputHandler] Requesting multiplayer rematch...");
                    this.game.networkSession.requestRematch();
                    this.game.playSound("menu_confirm");
                    // Don't unregister buttons yet - wait for rematch flow
                    return;
                }

                // Local multiplayer or single-player - restart immediately
                // Check current player count and restart the appropriate game mode
                const playerCount = this.game.gameManager ? this.game.gameManager.players.length : 1;

                if (playerCount === 1) {
                    // Single-player: existing resetGame handles countdown correctly
                    this.game.resetGame();
                } else if (playerCount === 2) {
                    // Distinguish human vs CPU from pure local 2P
                    const humanPlayers = this.game.gameManager.players.filter((p) => p.thinkingTimer === undefined);
                    const cpuPlayers = this.game.gameManager.players.filter((p) => p.thinkingTimer !== undefined);

                    if (humanPlayers.length === 1 && cpuPlayers.length === 1) {
                        // Versus CPU: use startVersusCPU, do NOT override its gameState
                        this.game.startVersusCPU();
                    } else {
                        // Local 2P: use startTwoPlayerGame, do NOT override its gameState
                        this.game.startTwoPlayerGame();
                    }
                } else if (playerCount === 3) {
                    this.game.startThreePlayerGame(); // Local 3P
                } else if (playerCount === 4) {
                    this.game.startFourPlayerGame(); // Local 4P
                } else {
                    // Fallback to single-player
                    this.game.resetGame();
                }

                // Common cleanup after scheduling the new game
                this.unregisterGameOverMenuButtons();
                this.game.gameOverTransition.active = false;
                this.game.gameOverTransition.timer = 0;
                this.game.gameOverTransition.opacity = 1;
                break;
            case "mainMenu":
                // Leave network session if in online multiplayer
                if (this.game.networkSession) {
                    console.log("[InputHandler] Leaving network session (game over → main menu)");
                    this.game.networkSession.leave();
                    this.game.networkSession = null;
                }

                this.game.gameState = "title";
                this.unregisterGameOverMenuButtons();
                this.game.gameOverMenu.selectedIndex = 0;
                this.game.onlineGameOverMenu.selectedIndex = 0;
                this.game.gameOverTransition.active = false;
                this.game.gameOverTransition.timer = 0;
                this.game.gameOverTransition.opacity = 1;

                // Reset menu stack to ensure we return to main menu, not multiplayer menu
                this.game.menuStack.current = null;
                this.game.menuStack.previous = null;

                // Clear all game state when returning to main menu
                this.game.clearGameState();
                this.game.playSound("menu_back");
                this.game.suppressNextFrameMenuNavigate = true;
                break;
            case "backToLobby":
                // Leave network session and return to lobby
                if (this.game.networkSession) {
                    console.log("[InputHandler] Leaving network session (game over → lobby)");
                    this.game.networkSession.leave();
                    this.game.networkSession = null;
                }
                this.game.clearGameState();
                this.game.gameState = "multiplayerLogin";
                this.unregisterGameOverMenuButtons();
                this.game.gameOverMenu.selectedIndex = 0;
                this.game.onlineGameOverMenu.selectedIndex = 0;
                this.game.gameOverTransition.active = false;
                this.game.gameOverTransition.timer = 0;
                this.game.gameOverTransition.opacity = 1;
                this.game.playSound("menu_back");
                this.game.suppressNextFrameMenuNavigate = true;
                break;
        }
    }

    /**
     * Handle settings menu input
     */
    handleSettingsMenuInput() {
        if (!this.game.settingsMenu.buttonsRegistered) {
            this.registerSettingsMenuButtons();

            // Snap selectedIndex to current pointer position for immediate hover feedback
            const pointer = this.input.getPointerPosition();
            const buttonWidth = 240;
            const buttonHeight = 60;
            const startY = 220; // Match pause menu positioning
            const spacing = 75;
            for (let i = 0; i < this.game.settingsMenu.buttons.length; i++) {
                const x = TETRIS.WIDTH / 2 - buttonWidth / 2;
                const y = startY + i * spacing;
                if (pointer.x >= x && pointer.x <= x + buttonWidth && pointer.y >= y && pointer.y <= y + buttonHeight) {
                    this.game.settingsMenu.selectedIndex = i;
                    break;
                }
            }
        }

        const menu = this.game.settingsMenu;
        const maxIndex = menu.buttons.length - 1;

        // Check for mouse clicks FIRST
        for (let i = 0; i < menu.buttons.length; i++) {
            if (this.input.isElementJustPressed(`settings_button_${i}`)) {
                const selectedButton = menu.buttons[i];
                this.executeSettingsMenuAction(selectedButton.action);
                return; // Consume the click and exit
            }
        }

        // Mouse hover
        for (let i = 0; i < menu.buttons.length; i++) {
            if (this.input && this.input.isElementHovered(`settings_button_${i}`)) {
                if (menu.selectedIndex !== i) {
                    menu.selectedIndex = i;
                    if (!this.game.skipMenuNavigateSound) {
                        this.game.playSound("menu_navigate");
                    }
                }
                break;
            }
        }

        // Handle left mouse click by checking pointer bounds directly (fixes first-click issue after menu switch)
        if (this.input.isLeftMouseButtonJustPressed()) {
            const pointer = this.input.getPointerPosition();
            const buttonWidth = 240;
            const buttonHeight = 60;
            const startY = 220; // Match pause menu positioning
            const spacing = 75;
            for (let i = 0; i < menu.buttons.length; i++) {
                const x = TETRIS.WIDTH / 2 - buttonWidth / 2;
                const y = startY + i * spacing;
                if (pointer.x >= x && pointer.x <= x + buttonWidth && pointer.y >= y && pointer.y <= y + buttonHeight) {
                    const selectedButton = menu.buttons[i];
                    this.executeSettingsMenuAction(selectedButton.action);
                    return;
                }
            }
        }

        // Multi-device navigation - use existing API directly
        if (
            this.input.isKeyJustPressed("DirUp") ||
            this.input.isGamepadButtonJustPressed(12, 0) || // D-pad up on gamepad 0
            this.input.isGamepadButtonJustPressed(12, 1) || // D-pad up on gamepad 1
            this.input.isGamepadButtonJustPressed(12, 2) || // D-pad up on gamepad 2
            this.input.isGamepadButtonJustPressed(12, 3)
        ) {
            // D-pad up on gamepad 3
            menu.selectedIndex = Math.max(0, menu.selectedIndex - 1);
            this.game.playSound("menu_navigate");
        }

        if (
            this.input.isKeyJustPressed("DirDown") ||
            this.input.isGamepadButtonJustPressed(13, 0) || // D-pad down on gamepad 0
            this.input.isGamepadButtonJustPressed(13, 1) || // D-pad down on gamepad 1
            this.input.isGamepadButtonJustPressed(13, 2) || // D-pad down on gamepad 2
            this.input.isGamepadButtonJustPressed(13, 3)
        ) {
            // D-pad down on gamepad 3
            menu.selectedIndex = Math.min(maxIndex, menu.selectedIndex + 1);
            this.game.playSound("menu_navigate");
        }

        // Action2 for back (B/Circle button = secondary face button)
        if (
            this.input.isKeyJustPressed("Action2") ||
            this.input.isGamepadButtonJustPressed(1, 0) || // B/Circle button on gamepad 0
            this.input.isGamepadButtonJustPressed(1, 1) || // B/Circle button on gamepad 1
            this.input.isGamepadButtonJustPressed(1, 2) || // B/Circle button on gamepad 2
            this.input.isGamepadButtonJustPressed(1, 3)
        ) {
            // B/Circle button on gamepad 3
            this.executeSettingsMenuAction("back");
            return;
        }

        // Confirm with Action1 (A/Cross button = primary face button)
        if (
            this.input.isKeyJustPressed("Action1") ||
            this.input.isGamepadButtonJustPressed(0, 0) || // A/Cross button on gamepad 0
            this.input.isGamepadButtonJustPressed(0, 1) || // A/Cross button on gamepad 1
            this.input.isGamepadButtonJustPressed(0, 2) || // A/Cross button on gamepad 2
            this.input.isGamepadButtonJustPressed(0, 3)
        ) {
            // A/Cross button on gamepad 3
            const selectedButton = menu.buttons[menu.selectedIndex];
            this.executeSettingsMenuAction(selectedButton.action);
        }
    }

    /**
     * Execute settings menu actions
     */
    executeSettingsMenuAction(action) {
        switch (action) {
            case "options":
                this.game.optionsWindow.visible = true;
                this.game.optionsWindow.selectedIndex = 0;
                this.unregisterSettingsMenuButtons();
                this.uiWindowsCoordinator.registerElements();
                this.game.playSound("menu_confirm");
                break;
            case "themes":
                this.game.themesWindow.visible = true;
                this.game.themesWindow.selectedRow = 0;
                this.game.themesWindow.selectedCol = 0;
                this.unregisterSettingsMenuButtons();
                this.uiWindowsCoordinator.registerElements();
                this.game.playSound("menu_confirm");
                break;
            case "controls":
                // Detect which input device triggered the controls window
                const triggeringDevice = this.detectTriggeringDevice();
                this.game.controlsWindow.visible = true;
                this.game.controlsWindow.selectedActionIndex = 0;
                this.game.controlsWindow.selectedColumn = 0;
                this.game.controlsWindow.editingProfile = triggeringDevice.profile;
                this.game.controlsWindow.triggeringDeviceName = triggeringDevice.displayName;
                this.unregisterSettingsMenuButtons();
                this.uiWindowsCoordinator.registerElements();
                this.game.playSound("menu_confirm");
                break;
            case "back":
                const previousMenu = this.game.menuStack.previous;
                this.game.menuStack.current = previousMenu;

                // Reset previous menu selection to top BEFORE unregistering settings
                if (previousMenu === "pause") {
                    this.game.pauseMenu.buttonsRegistered = false;
                    this.game.pauseMenu.selectedIndex = 0;
                } else if (previousMenu === "main") {
                    this.game.mainMenu.buttonsRegistered = false;
                    this.game.mainMenu.selectedIndex = 0;
                }
                this.unregisterSettingsMenuButtons();
                this.game.playSound("menu_back");
                this.game.suppressNextFrameMenuNavigate = true;
                break;
        }
    }

    /**
     * Handle multiplayer menu input
     */
    handleMultiplayerMenuInput() {
        const menu = this.game.multiplayerMenu;
        const maxIndex = menu.buttons.length - 1;

        // Register multiplayer menu buttons when entering
        if (!menu.buttonsRegistered) {
            this.registerMultiplayerMenuButtons();

            // Snap selectedIndex to current pointer position for immediate hover feedback
            const pointer = this.input.getPointerPosition();
            const buttonWidth = 240;
            const buttonHeight = 60;
            const startY = 220; // Move up one button height for consistency
            const spacing = 75;
            for (let i = 0; i < menu.buttons.length; i++) {
                const x = TETRIS.WIDTH / 2 - buttonWidth / 2;
                const y = startY + i * spacing;
                if (pointer.x >= x && pointer.x <= x + buttonWidth && pointer.y >= y && pointer.y <= y + buttonHeight) {
                    menu.selectedIndex = i;
                    break;
                }
            }
        }

        // Check for mouse clicks FIRST
        for (let i = 0; i < menu.buttons.length; i++) {
            if (this.input.isElementJustPressed(`multiplayer_button_${i}`)) {
                const selectedButton = menu.buttons[i];
                this.executeMultiplayerMenuAction(selectedButton.action);
                return;
            }
        }

        // Mouse hover
        for (let i = 0; i < menu.buttons.length; i++) {
            if (this.input && this.input.isElementHovered(`multiplayer_button_${i}`)) {
                if (menu.selectedIndex !== i) {
                    menu.selectedIndex = i;
                    if (!this.game.skipMenuNavigateSound) {
                        this.game.playSound("menu_navigate");
                    }
                }
                break;
            }
        }

        // Handle left mouse click by checking pointer bounds directly (fixes first-click issue after menu switch)
        if (this.input.isLeftMouseButtonJustPressed()) {
            const pointer = this.input.getPointerPosition();
            const buttonWidth = 240;
            const buttonHeight = 60;
            const startY = 220; // Move up one button height for consistency
            const spacing = 75;
            for (let i = 0; i < menu.buttons.length; i++) {
                const x = TETRIS.WIDTH / 2 - buttonWidth / 2;
                const y = startY + i * spacing;
                if (pointer.x >= x && pointer.x <= x + buttonWidth && pointer.y >= y && pointer.y <= y + buttonHeight) {
                    const selectedButton = menu.buttons[i];
                    this.executeMultiplayerMenuAction(selectedButton.action);
                    return;
                }
            }
        }

        // Navigation input
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
            menu.selectedIndex = Math.min(maxIndex, menu.selectedIndex + 1);
            this.game.playSound("menu_navigate");
        }

        // Action2 for back (B/Circle button = secondary face button) - like settings menu
        if (
            this.input.isKeyJustPressed("Action2") ||
            this.input.isGamepadButtonJustPressed(1, 0) || // B/Circle button on gamepad 0
            this.input.isGamepadButtonJustPressed(1, 1) || // B/Circle button on gamepad 1
            this.input.isGamepadButtonJustPressed(1, 2) || // B/Circle button on gamepad 2
            this.input.isGamepadButtonJustPressed(1, 3)
        ) {
            // B/Circle button on gamepad 3
            this.executeMultiplayerMenuAction("back");
            return;
        }

        // Check for input bleed-through prevention flag
        if (this.game.skipAction1ThisFrame) {
            this.game.skipAction1ThisFrame = false;
            return;
        }

        // Confirm selection
        if (
            this.input.isKeyJustPressed("Action1") ||
            this.input.isGamepadButtonJustPressed(0, 0) ||
            this.input.isGamepadButtonJustPressed(0, 1) ||
            this.input.isGamepadButtonJustPressed(0, 2) ||
            this.input.isGamepadButtonJustPressed(0, 3)
        ) {
            const selectedButton = menu.buttons[menu.selectedIndex];
            this.executeMultiplayerMenuAction(selectedButton.action);
        }
    }

    /**
     * Execute multiplayer menu actions
     */
    executeMultiplayerMenuAction(action) {
        switch (action) {
            case "localMultiplayer":
                this.game.menuStack.current = "localMultiplayer";
                this.game.menuStack.previous = "multiplayer";
                this.unregisterMultiplayerMenuButtons();
                this.game.localMultiplayerMenu.selectedIndex = 0;
                this.game.localMultiplayerMenu.buttonsRegistered = false; // Reset registration state
                this.game.playSound("menu_confirm");
                break;
            case "onlineMultiplayer":
                // Switch to multiplayer login screen (ActionNetManagerGUI)
                this.game.gameState = "multiplayerLogin";
                this.game.menuStack.previous = "multiplayer"; // Remember we came from multiplayer menu
                this.game.menuStack.current = null;
                this.unregisterMultiplayerMenuButtons();
                this.game.playSound("menu_confirm");
                break;
            case "versusCPU":
                this.game.startVersusCPU();
                this.unregisterMultiplayerMenuButtons();
                this.game.playSound("menu_confirm");
                break;
            case "back":
                this.game.menuStack.current = "main"; // Go back to main menu
                this.game.menuStack.previous = null; // Clear previous state
                this.unregisterMultiplayerMenuButtons();
                this.game.multiplayerMenu.selectedIndex = 0;
                this.game.multiplayerMenu.buttonsRegistered = false; // Reset registration state
                this.game.playSound("menu_back");
                this.game.suppressNextFrameMenuNavigate = true;
                break;
        }
    }

    /**
     * Handle local multiplayer menu input
     */
    handleLocalMultiplayerMenuInput() {
        const menu = this.game.localMultiplayerMenu;
        const maxIndex = menu.buttons.length - 1;

        // Register local multiplayer menu buttons when entering
        if (!menu.buttonsRegistered) {
            this.registerLocalMultiplayerMenuButtons();

            // Snap selectedIndex to current pointer position for immediate hover feedback
            const pointer = this.input.getPointerPosition();
            const buttonWidth = 240;
            const buttonHeight = 60;
            const startY = 295 + this.game.localMultiplayerMenu.positionOffset; // Apply position offset
            const spacing = 75;
            for (let i = 0; i < menu.buttons.length; i++) {
                const x = TETRIS.WIDTH / 2 - buttonWidth / 2;
                const y = startY + i * spacing;
                if (pointer.x >= x && pointer.x <= x + buttonWidth && pointer.y >= y && pointer.y <= y + buttonHeight) {
                    menu.selectedIndex = i;
                    break;
                }
            }
        }

        // Check for mouse clicks FIRST
        for (let i = 0; i < menu.buttons.length; i++) {
            if (this.input.isElementJustPressed(`local_multiplayer_button_${i}`)) {
                const selectedButton = menu.buttons[i];
                this.executeLocalMultiplayerMenuAction(selectedButton.action);
                return;
            }
        }

        // Mouse hover
        for (let i = 0; i < menu.buttons.length; i++) {
            if (this.input && this.input.isElementHovered(`local_multiplayer_button_${i}`)) {
                if (menu.selectedIndex !== i) {
                    menu.selectedIndex = i;
                    if (!this.game.skipMenuNavigateSound) {
                        this.game.playSound("menu_navigate");
                    }
                }
                break;
            }
        }

        // Handle left mouse click by checking pointer bounds directly (fixes first-click issue after menu switch)
        if (this.input.isLeftMouseButtonJustPressed()) {
            const pointer = this.input.getPointerPosition();
            const buttonWidth = 240;
            const buttonHeight = 60;
            const startY = 295 + this.game.localMultiplayerMenu.positionOffset; // Apply position offset
            const spacing = 75;
            for (let i = 0; i < menu.buttons.length; i++) {
                const x = TETRIS.WIDTH / 2 - buttonWidth / 2;
                const y = startY + i * spacing;
                if (pointer.x >= x && pointer.x <= x + buttonWidth && pointer.y >= y && pointer.y <= y + buttonHeight) {
                    const selectedButton = menu.buttons[i];
                    this.executeLocalMultiplayerMenuAction(selectedButton.action);
                    return;
                }
            }
        }

        // Navigation input
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
            menu.selectedIndex = Math.min(maxIndex, menu.selectedIndex + 1);
            this.game.playSound("menu_navigate");
        }

        // Action2 for back (B/Circle button = secondary face button) - like settings menu
        if (
            this.input.isKeyJustPressed("Action2") ||
            this.input.isGamepadButtonJustPressed(1, 0) || // B/Circle button on gamepad 0
            this.input.isGamepadButtonJustPressed(1, 1) || // B/Circle button on gamepad 1
            this.input.isGamepadButtonJustPressed(1, 2) || // B/Circle button on gamepad 2
            this.input.isGamepadButtonJustPressed(1, 3)
        ) {
            // B/Circle button on gamepad 3
            this.executeLocalMultiplayerMenuAction("back");
            return;
        }

        // Confirm selection
        if (
            this.input.isKeyJustPressed("Action1") ||
            this.input.isGamepadButtonJustPressed(0, 0) ||
            this.input.isGamepadButtonJustPressed(0, 1) ||
            this.input.isGamepadButtonJustPressed(0, 2) ||
            this.input.isGamepadButtonJustPressed(0, 3)
        ) {
            const selectedButton = menu.buttons[menu.selectedIndex];
            this.executeLocalMultiplayerMenuAction(selectedButton.action);
        }
    }

    /**
     * Detect which input device triggered the controls button
     */
    detectTriggeringDevice() {
        // Check which device just pressed Action1 to open controls
        // Check keyboard first
        if (this.input.isKeyJustPressed("Action1")) {
            return { profile: 'PLAYER_1', displayName: 'PLAYER 1' };
        }
        
        // Check each gamepad
        for (let i = 0; i < 4; i++) {
            if (this.input.isGamepadConnected(i) && this.input.isGamepadButtonJustPressed(0, i)) {
                const playerNum = i + 1;
                return { profile: `PLAYER_${playerNum}`, displayName: `PLAYER ${playerNum}` };
            }
        }
        
        // Default to PLAYER_1 (keyboard/gamepad0)
        return { profile: 'PLAYER_1', displayName: 'PLAYER 1' };
    }

    /**
     * Execute local multiplayer menu actions
     */
    executeLocalMultiplayerMenuAction(action) {
        switch (action) {
            case "startTwoPlayer":
                this.game.startTwoPlayerGame();
                this.unregisterLocalMultiplayerMenuButtons();
                this.game.playSound("menu_confirm");
                break;
            case "startThreePlayer":
                this.game.startThreePlayerGame();
                this.unregisterLocalMultiplayerMenuButtons();
                this.game.playSound("menu_confirm");
                break;
            case "startFourPlayer":
                this.game.startFourPlayerGame();
                this.unregisterLocalMultiplayerMenuButtons();
                this.game.playSound("menu_confirm");
                break;
            case "back":
                this.game.menuStack.current = "multiplayer"; // Go back to multiplayer menu
                this.game.menuStack.previous = "main"; // Restore the multiplayer menu's previous state
                this.unregisterLocalMultiplayerMenuButtons();
                this.game.localMultiplayerMenu.selectedIndex = 0;
                this.game.localMultiplayerMenu.buttonsRegistered = false; // Reset registration state
                this.game.playSound("menu_back");
                this.game.suppressNextFrameMenuNavigate = true;
                break;
        }
    }

    // Button registration/unregistration methods
    registerPauseMenuButtons() {
        if (this.game.pauseMenu.buttonsRegistered) return;

        const buttonWidth = 240;
        const buttonHeight = 60;
        const isSinglePlayer = this.game.gameManager && this.game.gameManager.players.length === 1;
        const startY = isSinglePlayer ? this.game.constructor.PAUSE_MENU_START_Y - 75 : this.game.constructor.PAUSE_MENU_START_Y;
        const spacing = 75;

        // Get the current menu to ensure we have the right button count
        const menu = this.game.menuManager.getPauseMenu();

        menu.buttons.forEach((button, index) => {
            const x = TETRIS.WIDTH / 2 - buttonWidth / 2;
            const y = startY + index * spacing;

            this.input.registerElement(`pause_button_${index}`, {
                bounds: () => ({
                    x: x,
                    y: y,
                    width: buttonWidth,
                    height: buttonHeight
                })
            });
        });

        this.game.pauseMenu.buttonsRegistered = true;
    }

    registerMainMenuButtons() {
        if (this.game.mainMenu.buttonsRegistered) return;

        const buttonWidth = 240;
        const buttonHeight = 60;
        const startY = 295; // Position below title
        const spacing = 75; // Match the renderer's BUTTON_SPACING

        this.game.mainMenu.buttons.forEach((button, index) => {
            const x = TETRIS.WIDTH / 2 - buttonWidth / 2;
            const y = startY + index * spacing;

            this.input.registerElement(`main_button_${index}`, {
                bounds: () => ({
                    x: x,
                    y: y,
                    width: buttonWidth,
                    height: buttonHeight
                })
            });
        });

        this.game.mainMenu.buttonsRegistered = true;
    }

    registerGameOverMenuButtons() {
        const menu = this.game.networkSession ? this.game.onlineGameOverMenu : this.game.gameOverMenu;
        if (menu.buttonsRegistered) return;

        const buttonWidth = 240;
        const buttonHeight = 60;
        const startY = 295; // Position below game over stats (moved up 150px)
        const spacing = 75;

        menu.buttons.forEach((button, index) => {
            const x = TETRIS.WIDTH / 2 - buttonWidth / 2;
            const y = startY + index * spacing;

            this.input.registerElement(`gameover_button_${index}`, {
                bounds: () => ({
                    x: x,
                    y: y,
                    width: buttonWidth,
                    height: buttonHeight
                })
            });
        });

        menu.buttonsRegistered = true;
    }

    registerSettingsMenuButtons() {
        if (this.game.settingsMenu.buttonsRegistered) return;

        const buttonWidth = 240;
        const buttonHeight = 60;
        const startY = 220; // Match pause menu positioning
        const spacing = 75;

        this.game.settingsMenu.buttons.forEach((button, index) => {
            const x = TETRIS.WIDTH / 2 - buttonWidth / 2;
            const y = startY + index * spacing;

            this.input.registerElement(`settings_button_${index}`, {
                bounds: () => ({
                    x: x,
                    y: y,
                    width: buttonWidth,
                    height: buttonHeight
                })
            });
        });

        this.game.settingsMenu.buttonsRegistered = true;
    }

    registerMultiplayerMenuButtons() {
        if (this.game.multiplayerMenu.buttonsRegistered) return;

        const buttonWidth = 240;
        const buttonHeight = 60;
        const startY = 220; // Move up one button height for consistency
        const spacing = 75;

        this.game.multiplayerMenu.buttons.forEach((button, index) => {
            const x = TETRIS.WIDTH / 2 - buttonWidth / 2;
            const y = startY + index * spacing;

            this.input.registerElement(`multiplayer_button_${index}`, {
                bounds: () => ({
                    x: x,
                    y: y,
                    width: buttonWidth,
                    height: buttonHeight
                })
            });
        });

        this.game.multiplayerMenu.buttonsRegistered = true;
    }

    registerLocalMultiplayerMenuButtons() {
        if (this.game.localMultiplayerMenu.buttonsRegistered) return;

        const buttonWidth = 240;
        const buttonHeight = 60;
        const startY = 295 + this.game.localMultiplayerMenu.positionOffset; // Apply position offset
        const spacing = 75; // Match the renderer's BUTTON_SPACING

        this.game.localMultiplayerMenu.buttons.forEach((button, index) => {
            const x = TETRIS.WIDTH / 2 - buttonWidth / 2;
            const y = startY + index * spacing;

            this.input.registerElement(`local_multiplayer_button_${index}`, {
                bounds: () => ({
                    x: x,
                    y: y,
                    width: buttonWidth,
                    height: buttonHeight
                })
            });
        });

        this.game.localMultiplayerMenu.buttonsRegistered = true;
    }

    unregisterPauseMenuButtons() {
        if (!this.game.pauseMenu.buttonsRegistered) return;
        this.game.pauseMenu.buttonsRegistered = false;
    }

    unregisterMainMenuButtons() {
        if (!this.game.mainMenu.buttonsRegistered) return;
        this.game.mainMenu.buttonsRegistered = false;
    }

    unregisterGameOverMenuButtons() {
        // Unregister whichever menu is currently registered
        if (this.game.gameOverMenu.buttonsRegistered) {
            this.game.gameOverMenu.buttonsRegistered = false;
        }

        if (this.game.onlineGameOverMenu.buttonsRegistered) {
            this.game.onlineGameOverMenu.buttonsRegistered = false;
        }
    }

    unregisterSettingsMenuButtons() {
        if (!this.game.settingsMenu.buttonsRegistered) return;
        this.game.settingsMenu.buttonsRegistered = false;
    }

    unregisterMultiplayerMenuButtons() {
        if (!this.game.multiplayerMenu.buttonsRegistered) return;
        this.game.multiplayerMenu.buttonsRegistered = false;
    }

    unregisterLocalMultiplayerMenuButtons() {
        if (!this.game.localMultiplayerMenu.buttonsRegistered) return;
        this.game.localMultiplayerMenu.buttonsRegistered = false;
    }
}

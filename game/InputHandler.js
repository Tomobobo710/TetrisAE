/**
 * InputHandler - Main input coordinator for Tetris game
 * Delegates to specialized managers for different input types
 */
class InputHandler {
    constructor(game) {
        this.game = game;
        this.input = game.input; // Reference to ActionEngine input system
        
        // Disable gamepad mirroring globally for explicit input handling
        this.input.setGamepadKeyboardMirroring(false);

        // Theme button state (used by mouse input)
        this.themeButton = {
            x: 20,
            y: 530,
            width: 120,
            height: 30,
            hovered: false,
            enabled: true
        };

        // Initialize specialized input managers
        this.uiWindowsCoordinator = new UIWindowsCoordinator(game, this.input);
        this.menuManager = new MenuInputManager(game, this.input, this.uiWindowsCoordinator);
        this.gameplayManager = new GameplayInputManager(game, this.input);
        this.waitingMenusManager = new WaitingMenusInputManager(game, this.input);

        // Centralized ActionNet input/signaling manager
        // Owns multiplayer login/lobby/ready/rematch meta-input so Game + InputHandler don't poke NetworkSession/GUI directly.
        this.actionNetInputManager = new ActionNetInputManager(game, this.input);
    }

    /**
     * Main input handler - called every frame
     */
    handleInput(deltaTime) {
        // Global theme cycling (works in all states) - use custom controls if available
        const customInput = this.input.getCustomControlsAdapter();
        let themeChangePressed = false;
        
        if (customInput) {
            themeChangePressed = customInput.isActionJustPressed('themeChange');
        } else {
            // Fallback to original controls
            themeChangePressed = 
                this.input.isKeyJustPressed("Action4") ||
                (this.input.isGamepadConnected(0) && this.input.isGamepadButtonJustPressed(2, 0)) ||
                (this.input.isGamepadConnected(1) && this.input.isGamepadButtonJustPressed(2, 1)) ||
                (this.input.isGamepadConnected(2) && this.input.isGamepadButtonJustPressed(2, 2)) ||
                (this.input.isGamepadConnected(3) && this.input.isGamepadButtonJustPressed(2, 3));
        }
        
        if (themeChangePressed) {
            this.game.themeManager.cycleTheme();
            this.game.playSound("change_theme");
        }

        // Theme button enable rules:
        // - Disabled during active 4-player games (4 non-eliminated, non-spectator players).
        // - Disabled while controls modal is open.
        // - Enabled on title/main menus or when no such 4-player game is active (including after exiting via pause/game over).
        (function updateThemeButtonEnabled(self) {
            const g = self.game;
            const gm = g.gameManager;

            // Always disable if controls modal is open
            if (g.controlsWindow.visible) {
                self.themeButton.enabled = false;
                return;
            }

            if (g.gameState === "title" || !gm || !Array.isArray(gm.players)) {
                self.themeButton.enabled = true;
                return;
            }

            const alive = gm.players.filter((p) => !p.isEliminated && !p.isSpectator);
            self.themeButton.enabled = alive.length !== 4;
        })(this);

        // Only allow hover/click when enabled
        this.themeButton.hovered = this.themeButton.enabled && this.input.isElementHovered("theme_button");
        if (this.themeButton.enabled && this.input.isElementJustPressed("theme_button")) {
            this.game.themeManager.cycleTheme();
            this.game.playSound("change_theme");
        }

        // One-frame suppression: if a back/menu action ran LAST frame, this flag
        // is set by that code and we mute menu_navigate for THIS frame only.
        if (this.game.suppressNextFrameMenuNavigate) {
            this.game.suppressNextFrameMenuNavigate = false;
            this.game.skipMenuNavigateSound = true;
        } else {
            this.game.skipMenuNavigateSound = false;
        }

        // Global clickthrough guard: if something (e.g. GUI) set this flag this frame,
        // swallow primary action-style inputs by skipping the rest of the dispatch.
        if (this.game.skipAction1ThisFrame) {
            this.game.skipAction1ThisFrame = false;
            return;
        }

        // Delegate to appropriate manager based on game state
        switch (this.game.gameState) {
            case "title":
                this.handleTitleInput();
                break;
            case "playing":
            case "paused":
            case "onlineMultiplayer":
            case "onlineMultiplayerPaused":
            case "countdown":
                this.handleGameplayInput(deltaTime);
                break;
            case "gameOver":
                // Block game over input until fade-in completes
                if (this.game.gameOverTransition && this.game.gameOverTransition.opacity < 1) {
                    break;
                }
                this.menuManager.handleGameOverMenuInput();
                break;
            case "opponentDisconnected":
                this.waitingMenusManager.handleOpponentDisconnectedInput();
                break;
            case "roomShutDown":
                this.waitingMenusManager.handleRoomShutDownInput();
                break;
            case "waitingMenu":
                this.waitingMenusManager.handleWaitingMenuInput();
                break;
            case "waitingCanceledMenu":
                this.waitingMenusManager.handleWaitingCanceledMenuInput();
                break;
            case "waitingForHostMenu":
                this.waitingMenusManager.handleWaitingForHostMenuInput();
                break;
            case "rematchPending":
                this.waitingMenusManager.handleRematchPendingInput();
                break;
        }
    }

    /**
     * Handle gameplay input (menus + tetris gameplay)
     */
    handleGameplayInput(deltaTime) {
        // Block input during ONLINE countdown / waiting
        if (this.game.networkSession) {
            const sessionState = this.game.networkSession.getState();
            if (sessionState === "COUNTDOWN" || sessionState === "WAITING") {
                return;
            }
        }

        // Block input during OFFLINE countdown (shared 3-2-1)
        // Block all gameplay/menu input while the unified countdown overlay is active.
        if (
            this.game.gameState === "countdown" &&
            this.game.countdown &&
            this.game.countdown.active &&
            this.game.countdown.phase === "countdown"
        ) {
            return;
        }

        // Handle pause/unpause input - use custom controls if available
        const customInput = this.input.getCustomControlsAdapter();
        let pausePressed = false;
        
        if (customInput) {
            pausePressed = customInput.isActionJustPressed('pause');
        } else {
            // Fallback to original controls
            pausePressed = this.input.isKeyJustPressed("Action7") ||
                this.input.isGamepadButtonJustPressed(9, 0) ||
                this.input.isGamepadButtonJustPressed(9, 1) ||
                this.input.isGamepadButtonJustPressed(9, 2) ||
                this.input.isGamepadButtonJustPressed(9, 3);
        }
        
        if (pausePressed) {
            // Don't allow pausing during countdown in online multiplayer
            if (this.game.networkSession) {
                const sessionState = this.game.networkSession.getState();
                if (sessionState === "COUNTDOWN") return;
            }

            this.handlePauseUnpause();
            return;
        }

        // Handle menu navigation for paused states
        if (this.game.gameState === "paused" || this.game.gameState === "onlineMultiplayerPaused") {
            // Register pause menu buttons when entering paused state
            if (!this.game.pauseMenu.buttonsRegistered) {
                this.menuManager.registerPauseMenuButtons();
            }

            if (this.game.optionsWindow.visible) {
                this.uiWindowsCoordinator.handleInput();
                return;
            } else if (this.game.themesWindow.visible) {
                this.uiWindowsCoordinator.handleInput();
                return;
            } else if (this.game.controlsWindow.visible) {
                this.uiWindowsCoordinator.handleInput();
                return;
            } else if (this.game.menuStack.current === "settings") {
                this.menuManager.handleSettingsMenuInput();
                return;
            } else {
                this.menuManager.handlePauseMenuInput(deltaTime);
                return;
            }
        }

        // Handle Tetris gameplay input
        if (this.game.gameManager) {
            this.gameplayManager.handleMultiplayerGameplayInput(deltaTime);
        } else {
            this.gameplayManager.handleSinglePlayerGameplayInput(deltaTime);
        }
    }

    /**
     * Handle pause/unpause logic
     */
    handlePauseUnpause() {
        if (this.game.gameState === "paused" || this.game.gameState === "onlineMultiplayerPaused") {
            // Unpausing - close all open windows and menus first
            this.game.optionsWindow.visible = false;
            this.game.themesWindow.visible = false;
            this.game.controlsWindow.visible = false;
            this.game.menuStack.current = null;
            this.uiWindowsCoordinator.unregisterElements();
            this.menuManager.unregisterSettingsMenuButtons();
            this.menuManager.unregisterPauseMenuButtons();

            // Reset pause menu selection for next time
            this.game.pauseMenu.selectedIndex = 0;

            // Restore previous game state
            this.game.gameState = this.game.menuStack.pausedGameState || "playing";
            this.game.playSound("menu_confirm");
        } else {
            // Pausing - save current state and change to appropriate paused state
            this.game.menuStack.pausedGameState = this.game.gameState;

            // Set default selected index: RESUME (1) for single-player, RESUME (0) for multiplayer
            if (this.game.gameManager && this.game.gameManager.players.length === 1) {
                this.game.pauseMenu.selectedIndex = 1;
            } else {
                this.game.pauseMenu.selectedIndex = 0;
            }

            // Use different pause state for online multiplayer to keep game running
            if (this.game.gameState === "onlineMultiplayer") {
                this.game.gameState = "onlineMultiplayerPaused";
            } else {
                this.game.gameState = "paused";
            }

            this.game.playSound("menu_confirm");
        }
    }

    /**
     * Handle title screen input
     */
    handleTitleInput() {
        // Check windows FIRST - they have highest priority
        if (this.game.optionsWindow.visible) {
            this.uiWindowsCoordinator.handleInput();
        } else if (this.game.themesWindow.visible) {
            this.uiWindowsCoordinator.handleInput();
        } else if (this.game.controlsWindow.visible) {
            this.uiWindowsCoordinator.handleInput();
        } else if (this.game.menuStack.current === "settings") {
            this.menuManager.handleSettingsMenuInput();
        } else if (this.game.menuStack.current === "multiplayer") {
            this.menuManager.handleMultiplayerMenuInput();
        } else if (this.game.menuStack.current === "localMultiplayer") {
            this.menuManager.handleLocalMultiplayerMenuInput();
        } else {
            // Register main menu buttons when entering title state
            if (!this.game.mainMenu.buttonsRegistered) {
                this.menuManager.registerMainMenuButtons();
            }
            // Handle main menu navigation
            this.menuManager.handleMainMenuInput();
        }
    }
}
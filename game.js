/**
 * TETRIS - ActionEngine Edition
 *
 * A pristine implementation of classic Tetris with next-generation visual presentation.
 * Features dynamic visual themes, stunning background visualizations, and masterful
 * Canvas 2D rendering techniques that push the boundaries of web graphics.
 *
 * Core Tetris mechanics are rock-solid and faithful to the original, while the
 * visual layer creates a mesmerizing, fluid experience that evolves and morphs.
 */

/**
 * ActionEngine Game Class - TETRIS
 */
class Game {
    static WIDTH = TETRIS.WIDTH;
    static HEIGHT = TETRIS.HEIGHT;

    // Network configuration for online multiplayer
    static TETRIS_SERVER_PORT = 9053;

    constructor(canvases, input, audio) {
        /******* ActionEngine System References *******/
        this.input = input;

        // Wrap engine audio in simple game-level audio facade
        this.audio = audio;
        this.gameAudio = new GameAudioManager(audio);

        /******* ActionEngine Three-Layer Canvas System *******/
        this.gameCanvas = canvases.gameCanvas;
        this.gameCtx = this.gameCanvas.getContext("2d");
        this.guiCanvas = canvases.guiCanvas;
        this.guiCtx = canvases.guiCtx;
        this.debugCanvas = canvases.debugCanvas;
        this.debugCtx = canvases.debugCtx;

        /******* Core Game State *******/
        this.gameState = "title"; // 'title' | 'playing' | 'paused' | 'onlineMultiplayerPaused' | 'gameOver' | 'lineClearing' | 'multiplayerLogin' | 'onlineMultiplayer'
        this.gameMode = "single"; // 'single' | 'twoplayer' | 'online'

        /******* Timing State *******/
        this.lastTime = performance.now();
        this.frameCount = 0;
        this.dropTimer = 0;
        this.lockTimer = 0;
        this.lineClearTimer = 0;
        this.levelUpAnimationTimer = 0;

        /******* Visual Effects *******/
        this.screenShake = { intensity: 0, duration: 0 };
        this.flashEffect = { active: false, color: "#ffffff", alpha: 0 };
        this.lineClearEffect = {
            active: false,
            lines: [],
            progress: 0
        };
        this.lockFlash = 0;
        this.spawnFlash = 0;
        this.timeScale = 1.0; // Current time dilation
        this.targetTimeScale = 1.0; // Target time scale for smooth transitions
        this.timeScaleTransitionSpeed = 2.0; // How fast to transition between time scales

        /******* Menu Stack + Menus *******/
        // Centralized in GameMenuManager; Game exposes references for legacy callers.
        this.menuManager = new GameMenuManager(this);

        this.menuStack = this.menuManager.menuStack;
        this.pauseMenu = this.menuManager.pauseMenu;
        this.mainMenu = this.menuManager.mainMenu;
        this.settingsMenu = this.menuManager.settingsMenu;
        this.multiplayerMenu = this.menuManager.multiplayerMenu;
        this.localMultiplayerMenu = this.menuManager.localMultiplayerMenu;
        this.gameOverMenu = this.menuManager.gameOverMenu;
        this.onlineGameOverMenu = this.menuManager.onlineGameOverMenu;
        this.rematchPendingMenu = this.menuManager.rematchPendingMenu;
        this.waitingMenu = this.menuManager.waitingMenu;
        this.waitingCanceledMenu = this.menuManager.waitingCanceledMenu;
        this.waitingForHostMenu = this.menuManager.waitingForHostMenu;
        this.opponentDisconnectedMenu = this.menuManager.opponentDisconnectedMenu;
        this.roomShutDownMenu = this.menuManager.roomShutDownMenu;

        /******* Input State (prevents input bleed-through) *******/
        this.skipAction1ThisFrame = false;
        this.skipDrMarioInputFrame = false;

        /******* Game Over Transition State *******/
        this.gameOverTransition = {
            active: false,
            timer: 0,
            delayDuration: 0.5,
            fadeDuration: 0.4,
            totalDuration: 0.9,
            opacity: 1
        };

        /******* Multiplayer / Countdown State *******/
        // Generic 3-2-1 countdown overlay used by both offline and online modes.
        // NetworkSession drives it for online; Game drives it for offline.
        this.countdown = {
            active: false,
            timer: 0,
            phase: "waiting", // 'waiting' | 'countdown' | 'ready'
            countdownNumber: 3,
            waitingForOpponent: false
        };

        /******* Notification Overlay System (for polished multiplayer feedback) *******/
        this.notificationOverlay = {
            active: false,
            message: "",
            color: "#ffffff",
            duration: 3.0,
            timer: 0,
            callback: null // Function to call when notification expires
        };

        /******* Easter Egg State *******/
        this.easterEgg = {
            downHoldTimer: 0,
            unlocked: false,
            unlockDuration: 3.0, // 3 seconds to unlock
            isHoldingDown: false,
            isReversing: false,
            reverseDuration: 0.5 // 0.5 seconds to reverse
        };

        /******* Options Window *******/
        this.optionsWindow = {
            visible: false,
            selectedIndex: 0,
            settings: [
                { name: "Hard Drop", key: "hardDropEnabled", type: "toggle" },
                { name: "Ghost Piece", key: "ghostPieceEnabled", type: "toggle" },
                { name: "CPU Difficulty", key: "cpuDifficulty", type: "cycle", values: ["easy", "medium", "hard"] }
            ]
        };

        /******* Themes Window *******/
        this.themesWindow = {
            visible: false,
            selectedRow: 0,
            selectedCol: 0,
            themes: [], // Will be populated from theme manager
            // Grid layout: 8 themes left column, 8 themes right column
            leftColumnMax: 8,
            rightColumnMax: 8
        };

        /******* Controls Window *******/
        this.controlsWindow = {
            visible: false,
            selectedActionIndex: 0,
            selectedColumn: 0, // 0 = kb primary, 1 = kb alt, 2 = gp primary, 3 = gp alt
            navigatingButtons: false, // true when navigating DEFAULT/CLOSE buttons
            selectedButtonIndex: 0, // 0 = DEFAULT, 1 = CLOSE when navigatingButtons is true
            isWaitingForInput: false,
            waitingForAction: null,
            waitingForInputType: null, // 'keyboard' or 'gamepad'
            waitingForColumn: null, // which column (primary/alt for keyboard/gamepad)
            waitingTimeout: 0,
            waitingTimeoutDuration: 3000, // 3 seconds
            actions: [], // Will be populated from controls manager
            scrollOffset: 0,
            maxVisibleActions: 10, // How many actions visible at once
            width: 800,
            height: 500,
            x: (TETRIS.WIDTH - 800) / 2,
            y: (TETRIS.HEIGHT - 500) / 2
        };

        /******* Game Settings (persisted to localStorage) *******/
        this.gameSettings = this.loadSettings();

        /******* Network System (for online multiplayer) *******/
        this.gui = new ActionNetManagerGUI(canvases, input, audio, Game.TETRIS_SERVER_PORT);
        this.networkManager = this.gui.getNetManager();
        this.networkSession = null; // Will be created when joining a room

        /******* Modular Systems *******/
        this.themeManager = new ThemeManager();
        // Apply enabled themes from settings (always an array now)
        if (this.gameSettings.enabledThemes.length === 0) {
            // Empty array means all themes disabled, use DEFAULT fallback
            this.themeManager.setEnabledThemes(["DEFAULT"]);
        } else {
            this.themeManager.setEnabledThemes(this.gameSettings.enabledThemes);
        }
        // Ensure we're showing a valid enabled theme
        this.themeManager.ensureValidTheme();

        this.backgroundRenderer = new ThemeRenderer();

        this.uiRenderer = new UIRenderer(this.guiCtx);
        this.gameManager = new GameManager(this);

        // Input handling system
        this.inputHandler = new InputHandler(this);
        
        // Custom controls system
        this.customControls = new CustomControlsIntegration(this);

        // Initialize controls window actions from controls manager
        if (this.customControls) {
            this.controlsWindow.actions = this.customControls.getControlsManager().getActionList();
        }
        
        // Wire up custom controls to gameplay input manager
        this.inputHandler.gameplayManager.setCustomControlsAdapter(this.customControls.getInputAdapter());

        // Wire ActionNetInputManager to GUI events so all ActionNet glue lives outside Game.
        this.inputHandler.actionNetInputManager.wireGUIEvents();

        /******* Setup Systems *******/
        // Sounds are now defined centrally in setupGameSounds (see game/soundconstants.js),
        // invoked by GameAudioManager during construction.
        this.setupInputElements();
        this.initializeThemesWindow();
        this.initializeGame();

        console.log("TETRIS - ActionEngine Edition Ready!");
        console.log("Prepare for visual excellence and perfect gameplay.");
    }

    /******* NETWORK SETUP *******/
    /******* INITIALIZATION *******/
    initializeGame() {
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.combo = -1;

        // Clear hold piece when starting new game
        this.heldPiece = null; // Changed from holdPiece to match Player class naming
        this.canHold = true;

        // Reset other game state
        this.currentPiece = null;
        this.currentX = 0;
        this.currentY = 0;
        this.currentRotation = 0;
        this.ghostY = 0;

        // Clear visual effects
        this.screenShake = { intensity: 0, duration: 0 };
        this.flashEffect = { active: false, color: "#ffffff", alpha: 0 };
        this.lockFlash = 0;
        this.timeScale = 1.0;
    }

    /******* ACTIONENGINE FRAMEWORK HOOKS *******/
    action_update() {
        const currentTime = performance.now();
        const rawDeltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;
        this.lastDeltaTime = rawDeltaTime;
        this.frameCount++;

        // Apply time scale for slow motion effects (maintain compatibility)
        let deltaTime = rawDeltaTime * this.timeScale;

        // Handle network message processing for online multiplayer
        // Only update GUI when in login/lobby screens, not during gameplay
        if (this.gameState === "multiplayerLogin") {
            this.gui.action_update(deltaTime);
        }

        this.inputHandler.handleInput(rawDeltaTime); // Input should not be affected by time scale
        
        // Update custom controls system
        this.customControls.update(rawDeltaTime);

        // Handle easter egg detection (Dr. Mario unlock)
        this.updateEasterEgg(rawDeltaTime);

        // Handle Dr. Mario game mode
        if (this.gameState === "drMario" && this.drMarioGame) {
            // Skip Dr. Mario input processing for one frame to prevent click-through
            if (!this.skipDrMarioInputFrame) {
                this.drMarioGame.update(rawDeltaTime);
            } else {
                this.skipDrMarioInputFrame = false;
            }
            return; // Skip Tetris updates when in Dr. Mario mode
        }

        // Update network session for online multiplayer (handles WAITING, COUNTDOWN, PLAYING states)
        if (this.gameState === "onlineMultiplayer" && this.networkSession) {
            this.networkSession.update(deltaTime);
        }

        // Handle offline countdown (3-2-1 before starting play)
        if (
            this.gameState === "countdown" &&
            this.countdown &&
            this.countdown.active &&
            this.countdown.phase === "countdown"
        ) {
            this.countdown.timer += rawDeltaTime;

            // Show 3,2,1 over a 3 second window:
            // 0.0 - 0.999... -> 3
            // 1.0 - 1.999... -> 2
            // 2.0 - 2.999... -> 1
            const t = this.countdown.timer;
            if (t < 1) {
                this.countdown.countdownNumber = 3;
            } else if (t < 2) {
                this.countdown.countdownNumber = 2;
            } else if (t < 3) {
                this.countdown.countdownNumber = 1;
            }

            if (this.countdown.timer >= 3) {
                // Switch into GO phase for a short fade, then auto-clear.
                this.countdown.phase = "go";
                this.countdown.timer = 0;
            }
        } else if (
            this.gameState === "countdown" &&
            this.countdown &&
            this.countdown.active &&
            this.countdown.phase === "go"
        ) {
            // GO! fade-out lasts 0.7s, then we start actual play and hide overlay.
            this.countdown.timer += rawDeltaTime;
            const GO_DURATION = 0.7;
            if (this.countdown.timer >= GO_DURATION) {
                this.countdown.active = false;
                this.countdown.phase = "ready";
                this.countdown.timer = 0;
                this.gameState = this._pendingPostCountdownState || "playing";
                this._pendingPostCountdownState = null;
            }
        }

        // Update game normally - only when playing (not during countdown/waiting or paused)
        const isPlaying =
            this.gameState === "playing" ||
            (this.gameState === "onlineMultiplayer" && this.networkSession && this.networkSession.isPlaying()) ||
            (this.gameState === "onlineMultiplayerPaused" && this.networkSession && this.networkSession.isPlaying());

        if (isPlaying && this.gameManager && this.gameManager.players.length > 0) {
            // GameManager handles ALL game logic uniformly
            this.gameManager.update(deltaTime);
        }

        // Update game over transition
        if (this.gameOverTransition.active) {
            this.gameOverTransition.timer += rawDeltaTime;

            if (this.gameOverTransition.timer >= this.gameOverTransition.totalDuration) {
                this.gameOverTransition.active = false;
                this.gameOverTransition.opacity = 1;
            } else if (this.gameOverTransition.timer >= this.gameOverTransition.delayDuration) {
                const fadeProgress =
                    (this.gameOverTransition.timer - this.gameOverTransition.delayDuration) /
                    this.gameOverTransition.fadeDuration;
                this.gameOverTransition.opacity = Math.min(1, fadeProgress);
            } else {
                this.gameOverTransition.opacity = 0;
            }
        }

        // Update notification overlay
        if (this.notificationOverlay.active) {
            this.notificationOverlay.timer += rawDeltaTime;

            if (this.notificationOverlay.timer >= this.notificationOverlay.duration) {
                this.notificationOverlay.active = false;

                // Execute callback if provided
                if (this.notificationOverlay.callback) {
                    this.notificationOverlay.callback();
                    this.notificationOverlay.callback = null;
                }
            }
        }

        // Always update background (even when paused)
        this.themeManager.update(deltaTime);
        this.backgroundRenderer.update(deltaTime, this.themeManager.getCurrentTheme());
    }

    action_draw() {
        const theme = this.themeManager.getCurrentTheme();

        // Handle Dr. Mario game mode
        if (this.gameState === "drMario" && this.drMarioGame) {
            this.drMarioGame.draw();
            return; // Skip Tetris rendering when in Dr. Mario mode
        }

        // Handle multiplayer login / lobby screen
        if (this.gameState === "multiplayerLogin") {
            // Draw background for GUI
            this.gameCtx.fillStyle = "#000000";
            this.gameCtx.fillRect(0, 0, TETRIS.WIDTH, TETRIS.HEIGHT);
            this.backgroundRenderer.draw(this.gameCtx, theme);

            // Clear GUI layer and let ActionNetManagerGUI draw login/lobby UI
            this.guiCtx.clearRect(0, 0, TETRIS.WIDTH, TETRIS.HEIGHT);
            this.gui.action_draw();

            // IMPORTANT:
            // Keep the theme button visible and interactive even while the
            // ActionNetManagerGUI owns the rest of the multiplayer UI.
            // We do this entirely within the Tetris scope, without touching
            // ActionEngine / ActionNetManagerGUI, by rendering just the
            // theme button on top of their GUI.
            if (this.inputHandler && this.inputHandler.themeButton && this.inputHandler.themeButton.enabled) {
                // drawThemeButton only uses the provided rect + theme, so this is safe
                this.uiRenderer.utils.drawThemeButton(this.inputHandler.themeButton, theme);
            }

            // Short-circuit the rest of the Tetris UI; ActionNet GUI + theme button only.
            return;
        }

        // GameManager handles ALL rendering uniformly
        this.gameCtx.fillStyle = "#000000";
        this.gameCtx.fillRect(0, 0, TETRIS.WIDTH, TETRIS.HEIGHT);
        this.backgroundRenderer.draw(this.gameCtx, theme);

        // GameManager.draw() handles all player counts with appropriate layouts
        this.gameManager.draw();

        // UI Renderer handles all UI with appropriate layouts
        this.uiRenderer.drawGUILayer(this, theme);

        // Clear debug layer
        this.debugCtx.clearRect(0, 0, TETRIS.WIDTH, TETRIS.HEIGHT);
        
    }

    /******* CORE TETRIS MECHANICS *******/
    rotateMatrix(matrix) {
        const size = matrix.length;
        const rotated = [];
        for (let y = 0; y < size; y++) {
            rotated[y] = [];
            for (let x = 0; x < size; x++) {
                rotated[y][x] = matrix[size - 1 - x][y];
            }
        }
        return rotated;
    }

    getRotatedPiece(pieceType, rotation) {
        let matrix = TETROMINOES[pieceType].shape;
        for (let i = 0; i < rotation; i++) {
            matrix = this.rotateMatrix(matrix);
        }
        return matrix;
    }

    // Per-player collision detection
    checkPlayerCollision(pieceType, x, y, rotation, playerNumber = 1) {
        const player = this.gameManager.getPlayer(playerNumber);
        if (player) {
            return player.checkCollision(pieceType, x, y, rotation);
        }
    }

    handleLevelUp() {
        this.levelUpAnimationTimer = TETRIS.TIMING.LEVEL_UP_ANIMATION;
        this.playSound("level_up");
        this.flashEffect = {
            active: true,
            color: this.themeManager.getCurrentTheme().ui.accent,
            alpha: 0.3
        };
    }

    /******* SETTINGS PERSISTENCE *******/
    loadSettings() {
        // Default: all themes enabled except DEFAULT
        const allThemesExceptDefault = window.THEME_NAMES
            ? window.THEME_NAMES.filter((name) => name !== "DEFAULT")
            : [];

        const defaultSettings = {
            hardDropEnabled: true,
            ghostPieceEnabled: true,
            cpuDifficulty: "medium", // Default AI difficulty
            enabledThemes: allThemesExceptDefault
        };

        try {
            const saved = localStorage.getItem("tetris_settings");
            if (saved) {
                const parsed = JSON.parse(saved);
                // Handle legacy saves where enabledThemes was null (meaning "all")
                if (parsed.enabledThemes === null) {
                    parsed.enabledThemes = allThemesExceptDefault;
                }
                return { ...defaultSettings, ...parsed };
            }
        } catch (e) {
            console.warn("Failed to load settings:", e);
        }

        return defaultSettings;
    }

    saveSettings() {
        try {
            localStorage.setItem("tetris_settings", JSON.stringify(this.gameSettings));
        } catch (e) {
            console.warn("Failed to save settings:", e);
        }
    }

    toggleSetting(key) {
        const setting = this.optionsWindow.settings.find((s) => s.key === key);
        if (setting && setting.type === "cycle") {
            // Handle cycling through values (e.g. CPU Difficulty)
            const currentIndex = setting.values.indexOf(this.gameSettings[key]);
            const nextIndex = (currentIndex + 1) % setting.values.length;
            this.gameSettings[key] = setting.values[nextIndex];
            // Use change_theme for sideways CPU difficulty cycling
            this.playSound("change_theme");
        } else {
            // Handle boolean toggles (e.g. Hard Drop, Ghost Piece)
            this.gameSettings[key] = !this.gameSettings[key];
            // Use dedicated menu_toggle for on/off toggles
            this.playSound("menu_toggle");
        }
        this.saveSettings();
    }

    /******* THEMES WINDOW INITIALIZATION *******/
    initializeThemesWindow() {
        const themeNames = window.THEME_NAMES || [];
        // Filter out DEFAULT - it's an invisible fallback theme
        this.themesWindow.themes = themeNames
            .filter((name) => name !== "DEFAULT")
            .map((name) => ({
                name: name,
                displayName: this.formatThemeName(name),
                enabled: this.isThemeEnabled(name)
            }));
    }

    formatThemeName(name) {
        // Convert 'NEON_CITY' to 'Neon City'
        return name
            .split("_")
            .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
            .join(" ");
    }

    isThemeEnabled(themeName) {
        // If enabledThemes is null/undefined, all themes (except DEFAULT) are enabled
        if (!this.gameSettings.enabledThemes) {
            return themeName !== "DEFAULT";
        }
        // If enabledThemes is an empty array, user disabled everything (DEFAULT fallback active)
        if (this.gameSettings.enabledThemes.length === 0) {
            return false; // All themes show as disabled
        }
        // Otherwise, check if this theme is in the enabled list
        return this.gameSettings.enabledThemes.includes(themeName);
    }

    toggleTheme(themeName) {
        if (!this.gameSettings.enabledThemes) {
            // First time toggling - start with all themes except DEFAULT
            this.gameSettings.enabledThemes = window.THEME_NAMES.filter((name) => name !== "DEFAULT");
        }

        const index = this.gameSettings.enabledThemes.indexOf(themeName);

        if (index > -1) {
            // Disabling a theme
            this.gameSettings.enabledThemes.splice(index, 1);
        } else {
            // Enabling a theme
            this.gameSettings.enabledThemes.push(themeName);
        }

        // If all themes are disabled, fall back to DEFAULT
        const effectiveThemes =
            this.gameSettings.enabledThemes.length === 0 ? ["DEFAULT"] : this.gameSettings.enabledThemes;

        // Update theme manager
        this.themeManager.setEnabledThemes(effectiveThemes);

        // Check if current theme is valid, if not switch
        this.themeManager.ensureValidTheme();

        // Update themes window
        this.initializeThemesWindow();

        this.saveSettings();
        // Theme on/off is a visual style change: use change_theme, not generic confirm
        this.playSound("change_theme");
    }

    selectAllThemes() {
        // Enable all themes except DEFAULT
        this.gameSettings.enabledThemes = window.THEME_NAMES.filter((name) => name !== "DEFAULT");
        this.themeManager.setEnabledThemes(this.gameSettings.enabledThemes);

        // Ensure current theme is valid (switch if on DEFAULT)
        this.themeManager.ensureValidTheme();

        this.initializeThemesWindow();
        this.saveSettings();
        // Bulk select behaves like a big toggle action
        this.playSound("menu_toggle");
    }

    deselectAllThemes() {
        // Deselect all themes - this will trigger DEFAULT fallback
        this.gameSettings.enabledThemes = [];
        this.themeManager.setEnabledThemes(["DEFAULT"]); // Fallback to DEFAULT

        // Ensure current theme is valid (switch to DEFAULT)
        this.themeManager.ensureValidTheme();

        this.initializeThemesWindow();
        this.saveSettings();
        // Bulk deselect behaves like a big toggle action
        this.playSound("menu_toggle");
    }

    /******* AUDIO FACADE *******/
    playSound(soundName, options = {}) {
        // Delegate all sound playback through the game-level audio facade.
        // Keep call sites unchanged: this.playSound("menu_confirm"), etc.
        this.gameAudio.playSound(soundName, options);
    }

    /******* INPUT SYSTEM *******/
    setupInputElements() {
        this.input.registerElement("theme_button", {
            bounds: () => ({
                x: this.inputHandler.themeButton.x,
                y: this.inputHandler.themeButton.y,
                width: this.inputHandler.themeButton.width,
                height: this.inputHandler.themeButton.height
            })
        });
    }

    triggerOfflineCountdown(nextState) {
        // Shared 3-2-1 countdown for offline modes (single, local MP, vs CPU)
        this.gameState = "countdown";
        if (!this.countdown) {
            this.countdown = {
                active: false,
                timer: 0,
                phase: "waiting",
                countdownNumber: 3,
                waitingForOpponent: false
            };
        }
        this.countdown.active = true;
        this.countdown.phase = "countdown";
        this.countdown.countdownNumber = 3;
        this.countdown.timer = 0;
        this.countdown.waitingForOpponent = false;
        this._pendingPostCountdownState = nextState;
    }

    startGame() {
        this.gameMode = "single";

        // Initialize GameManager with 1 player for consistency with multiplayer modes
        this.gameManager.initialize(1);

        this.playSound("menu_confirm");

        // Start 3-2-1 countdown before gameplay begins
        this.triggerOfflineCountdown("playing");
    }

    startTwoPlayerGame() {
        this.gameMode = "twoPlayer";

        // Initialize the new multiplayer system for 2 players
        this.gameManager.initialize(2);

        this.playSound("menu_confirm");

        // Start 3-2-1 countdown before gameplay begins
        this.triggerOfflineCountdown("playing");
    }

    /**
     * Start a 3-player game
     */
    startThreePlayerGame() {
        this.gameMode = "threePlayer";

        // Initialize the new multiplayer system for 3 players
        this.gameManager.initialize(3);

        this.playSound("menu_confirm");

        // Start 3-2-1 countdown before gameplay begins
        this.triggerOfflineCountdown("playing");
    }

    /**
     * Start a 4-player game
     */
    startFourPlayerGame() {
        this.gameMode = "fourPlayer";

        // Initialize the new multiplayer system for 4 players
        this.gameManager.initialize(4);

        this.playSound("menu_confirm");

        // Start 3-2-1 countdown before gameplay begins
        this.triggerOfflineCountdown("playing");
    }

    /**
     * Start a game versus CPU
     */
    startVersusCPU() {
        this.gameMode = "versusCPU";

        // Initialize human vs CPU mode (1 human + 1 CPU)
        this.gameManager.initializeVersusCPU(1, 1);

        this.playSound("menu_confirm");

        // Start 3-2-1 countdown before gameplay begins
        this.triggerOfflineCountdown("playing");
    }

    clearGameState() {
        // Clear hold piece and related state
        this.heldPiece = null; // Changed from holdPiece to match Player class naming
        this.canHold = true;

        // Reset any other persistent game state
        this.currentPiece = null;
        this.currentX = 0;
        this.currentY = 0;
        this.currentRotation = 0;
        this.ghostY = 0;

        // Clear visual effects
        this.screenShake = { intensity: 0, duration: 0 };
        this.flashEffect = { active: false, color: "#ffffff", alpha: 0 };
        this.lockFlash = 0;
        this.spawnFlash = 0;
        this.timeScale = 1.0;
    }

    resetGame() {
        this.startGame();
    }

    /**
     * Get the current CPU difficulty setting
     */
    getCPUDifficulty() {
        return this.gameSettings.cpuDifficulty;
    }

    /******* EASTER EGG METHODS *******/
    updateEasterEgg(deltaTime) {
        // Only check for easter egg when actually on main menu (title state)
        if (this.gameState !== "title") {
            // Reset timer when not on main menu
            this.easterEgg.downHoldTimer = 0;
            this.easterEgg.isHoldingDown = false;
            return;
        }

        // Skip timer check if already unlocked (but don't return - we still need to preserve state)
        if (this.easterEgg.unlocked || this.menuManager.isDrMarioUnlocked()) {
            // Make sure the button stays unlocked
            if (!this.menuManager.isDrMarioUnlocked()) {
                this.menuManager.unlockDrMario();
            }
            return;
        }

        // Only allow holding when index 2 is selected (Settings)
        if (this.mainMenu.selectedIndex !== 2) {
            this.easterEgg.downHoldTimer = 0;
            this.easterEgg.isHoldingDown = false;
            return;
        }

        // Check if down key is being held
        const isDownPressed = this.input.isKeyPressed("DirDown") ||
                            this.input.isGamepadButtonPressed(13, 0) || // D-pad down on any gamepad
                            this.input.isGamepadButtonPressed(13, 1) ||
                            this.input.isGamepadButtonPressed(13, 2) ||
                            this.input.isGamepadButtonPressed(13, 3);

        if (isDownPressed) {
            if (!this.easterEgg.isHoldingDown) {
                // Just started holding down
                this.easterEgg.isHoldingDown = true;
                this.easterEgg.downHoldTimer = 0;
            }

            // Increment timer
            this.easterEgg.downHoldTimer += deltaTime;

            // Check if we've held long enough
            if (this.easterEgg.downHoldTimer >= this.easterEgg.unlockDuration) {
                this.unlockDrMario();
            }
        } else {
            // Reset when key is released - start reverse animation
            if (this.easterEgg.isHoldingDown && !this.easterEgg.isReversing && this.easterEgg.downHoldTimer > 0) {
                // Start reverse animation - just change direction, don't reset timer
                this.easterEgg.isReversing = true;
            }
            this.easterEgg.isHoldingDown = false;

            // Handle reverse animation - decrement timer instead of incrementing
            if (this.easterEgg.isReversing) {
                this.easterEgg.downHoldTimer -= deltaTime * (this.easterEgg.unlockDuration / this.easterEgg.reverseDuration);

                if (this.easterEgg.downHoldTimer <= 0) {
                    // Animation complete, reset everything
                    this.easterEgg.isReversing = false;
                    this.easterEgg.downHoldTimer = 0;
                }
            }
        }
    }

    unlockDrMario() {
        this.easterEgg.unlocked = true;
        this.menuManager.unlockDrMario();
        
        // Play a special unlock sound
        this.playSound("change_theme", { volume: 0.7 });
        
        // Add some visual flair
        this.flashEffect = {
            active: true,
            color: "#ffff00", // Golden flash
            alpha: 0.3
        };
    }

    // Method called by Dr. Mario to return to Tetris
    returnFromDrMario() {
        console.log("🎲 Returning to Tetris from Dr. Mario...");
        
        // Clean up Dr. Mario state
        if (this.drMarioGame) {
            this.drMarioGame.inputManager.cleanup();
        }
        
        // Return to Tetris main menu
        this.gameState = "title";
        this.menuStack.current = null;
        
        // Play transition sound
        this.playSound("menu_back");
    }

    // Method to start Dr. Mario game
    startDrMario() {
        console.log("🎮 Starting Dr. Mario game...");
        this.playSound("menu_confirm");

        // Initialize Dr. Mario game
        if (!this.drMarioGame) {
            this.drMarioGame = new DrMarioGame(this);
        }

        // Skip input for one frame to prevent click-through from menu transition
        this.skipDrMarioInputFrame = true;

        // Switch to Dr. Mario mode
        this.gameState = "drMario";
        this.menuStack.current = "drMario";

        console.log("🎉 Dr. Mario launched successfully!");
    }
}

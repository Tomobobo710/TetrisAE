// game/MenuManager.js
// Central owner of menuStack + menu definitions + simple transitions.
// Keeps shapes compatible with existing InputManager code.

class GameMenuManager {
    constructor(game) {
        this.game = game;

        // Menu stack: current/previous menu context + paused game state
        this.menuStack = {
            current: null, // 'main', 'pause', 'settings', 'multiplayer', etc.
            previous: null,
            pausedGameState: null
        };

        // Core stacked menus

        this.pauseMenu = {
            selectedIndex: 0,
            buttonsRegistered: false
        };

        this.mainMenu = {
            selectedIndex: 0,
            buttons: [
                { text: "START GAME", action: "startGame" },
                { text: "MULTIPLAYER", action: "multiplayer" },
                { text: "SETTINGS", action: "settings" }
            ],
            buttonsRegistered: false
        };

        // Hidden Dr. Mario option - added dynamically when unlocked
        this.drMarioButton = { text: "?????", action: "drMario" };

        this.multiplayerMenu = {
            selectedIndex: 0,
            buttons: [
                { text: "LOCAL", action: "localMultiplayer" },
                { text: "ONLINE", action: "onlineMultiplayer" },
                { text: "VERSUS CPU", action: "versusCPU" },
                { text: "BACK", action: "back" }
            ],
            buttonsRegistered: false
        };

        this.localMultiplayerMenu = {
            selectedIndex: 0,
            buttons: [
                { text: "2-PLAYER BATTLE", action: "startTwoPlayer" },
                { text: "3-PLAYER BATTLE", action: "startThreePlayer" },
                { text: "4-PLAYER BATTLE", action: "startFourPlayer" },
                { text: "BACK", action: "back" }
            ],
            buttonsRegistered: false,
            positionOffset: -80 // Move up one button height for better positioning
        };

        this.gameOverMenu = {
            selectedIndex: 0,
            buttons: [
                { text: "NEW GAME", action: "newGame" },
                { text: "MAIN MENU", action: "mainMenu" }
            ],
            buttonsRegistered: false
        };

        this.onlineGameOverMenu = {
            selectedIndex: 0,
            buttons: [
                { text: "REMATCH", action: "newGame" },
                { text: "BACK TO LOBBY", action: "backToLobby" }
            ],
            buttonsRegistered: false
        };

        this.rematchPendingMenu = {
            selectedIndex: 0,
            buttons: [{ text: "Cancel", action: "cancelRematch" }],
            buttonsRegistered: false
        };

        this.waitingMenu = {
            selectedIndex: 0,
            buttons: [{ text: "CANCEL", action: "cancelWaiting" }],
            buttonsRegistered: false
        };

        this.waitingCanceledMenu = {
            selectedIndex: 0,
            buttons: [
                { text: "KEEP WAITING", action: "keepWaiting" },
                { text: "RETURN TO LOBBY", action: "returnToLobby" }
            ],
            buttonsRegistered: false
        };

        this.waitingForHostMenu = {
            selectedIndex: 0,
            buttons: [{ text: "CANCEL", action: "cancelJoin" }],
            buttonsRegistered: false
        };

        this.opponentDisconnectedMenu = {
            selectedIndex: 0,
            buttons: [
                { text: "CONTINUE", action: "continue" },
                { text: "BACK TO LOBBY", action: "backToLobby" }
            ],
            buttonsRegistered: false
        };

        this.roomShutDownMenu = {
            selectedIndex: 0,
            buttons: [{ text: "BACK TO LOBBY", action: "backToLobby" }],
            buttonsRegistered: false
        };

        // SETTINGS MENU is also a top-level menu and participates in menuStack,
        // so it belongs here as well (not in Game).
        this.settingsMenu = {
            selectedIndex: 0,
            buttons: [
                { text: "OPTIONS", action: "options" },
                { text: "THEMES", action: "themes" },
                { text: "BACK", action: "back" }
            ],
            buttonsRegistered: false
        };
    }

    // Stack accessors

    getCurrentMenuId() {
        return this.menuStack.current;
    }

    setCurrentMenu(id) {
        this.menuStack.current = id;
    }

    getPreviousMenuId() {
        return this.menuStack.previous;
    }

    setPreviousMenu(id) {
        this.menuStack.previous = id;
    }

    setPausedGameState(state) {
        this.menuStack.pausedGameState = state;
    }

    getPausedGameState() {
        return this.menuStack.pausedGameState;
    }

    // Menu getters used by Game and InputManagers

    getMainMenu() {
        return this.mainMenu;
    }
    getPauseMenu() {
        // Dynamically build pause menu based on player count
        const isSinglePlayer = this.game && this.game.gameManager && this.game.gameManager.players.length === 1;

        if (isSinglePlayer) {
            this.pauseMenu.buttons = [
                { text: "NEW GAME", action: "newGame" },
                { text: "RESUME", action: "resume" },
                { text: "SETTINGS", action: "settings" },
                { text: "MAIN MENU", action: "mainMenu" }
            ];
        } else {
            this.pauseMenu.buttons = [
                { text: "RESUME", action: "resume" },
                { text: "SETTINGS", action: "settings" },
                { text: "MAIN MENU", action: "mainMenu" }
            ];
        }

        return this.pauseMenu;
    }
    getSettingsMenu() {
        return this.settingsMenu;
    }
    getMultiplayerMenu() {
        return this.multiplayerMenu;
    }
    getLocalMultiplayerMenu() {
        return this.localMultiplayerMenu;
    }

    getGameOverMenu(isOnline) {
        return isOnline ? this.onlineGameOverMenu : this.gameOverMenu;
    }

    getRematchPendingMenu() {
        return this.rematchPendingMenu;
    }

    /******* Easter Egg Methods *******/
    unlockDrMario() {
        // Add the Dr. Mario button if not already added
        const hasDrMarioButton = this.mainMenu.buttons.some(button => button.action === "drMario");
        if (!hasDrMarioButton) {
            this.mainMenu.buttons.push(this.drMarioButton);
            
            // Force re-registration of main menu buttons to include new button
            this.mainMenu.buttonsRegistered = false;
            
            console.log("🎉 Dr. Mario Easter Egg Unlocked! Hidden game discovered!");
        }
    }

    isDrMarioUnlocked() {
        return this.mainMenu.buttons.some(button => button.action === "drMario");
    }
    getWaitingMenu() {
        return this.waitingMenu;
    }
    getWaitingCanceledMenu() {
        return this.waitingCanceledMenu;
    }
    getWaitingForHostMenu() {
        return this.waitingForHostMenu;
    }
    getOpponentDisconnectedMenu() {
        return this.opponentDisconnectedMenu;
    }
    getRoomShutDownMenu() {
        return this.roomShutDownMenu;
    }

    // Transition helpers (optional, preserve shapes/semantics)

    goToMainMenu() {
        this.menuStack.current = "main";
        this.menuStack.previous = null;
        this.mainMenu.selectedIndex = 0;
    }

    goToMultiplayerMenu(from = "main") {
        this.menuStack.current = "multiplayer";
        this.menuStack.previous = from;
        this.multiplayerMenu.selectedIndex = 0;
        this.multiplayerMenu.buttonsRegistered = false;
    }

    goToLocalMultiplayerMenu() {
        this.menuStack.current = "localMultiplayer";
        this.menuStack.previous = "multiplayer";
        this.localMultiplayerMenu.selectedIndex = 0;
        this.localMultiplayerMenu.buttonsRegistered = false;
    }

    goToSettingsMenu(from) {
        this.menuStack.current = "settings";
        this.menuStack.previous = from || this.menuStack.current || "main";
        this.settingsMenu.selectedIndex = 0;
        this.settingsMenu.buttonsRegistered = false;
    }

    clearMenuStack() {
        this.menuStack.current = null;
        this.menuStack.previous = null;
        this.menuStack.pausedGameState = null;
    }
}

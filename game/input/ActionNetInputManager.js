/**
 * ActionNetInputManager - Centralized handler for ActionNet GUI + session glue.
 * - Wire ActionNetManagerGUI events to Game/NetworkSession.
 * - Handle a couple of high-level inputs (login back, host cancel wait, rematch cancel, hard leave).
 */
class ActionNetInputManager {
    constructor(game, input) {
        this.game = game;
        this.input = input;
        this.gui = game.gui; // ActionNetManagerGUI instance
        this.networkManager = game.networkManager || (this.gui ? this.gui.getNetManager() : null);
        this.session = null; // Will reference game.networkSession when active
    }

    /**
     * Wire ActionNetManagerGUI events into Game/NetworkSession.
     * Call once from Game.setupGUIEvents() after gui is created.
     */
    wireGUIEvents() {
        console.log("[ActionNetInputManager] wireGUIEvents() START");

        // Play sound for all GUI button presses (respect suppression flag)
        this.gui.on("buttonPressed", () => {
            console.log("[ActionNetInputManager] EVENT buttonPressed");
            if (!this.game.skipMenuNavigateSound) {
                this.game.playSound("menu_confirm");
            }
        });

        // Play sound for GUI selection changes (respect suppression flag)
        this.gui.on("selectionChanged", (info) => {
            console.log("[ActionNetInputManager] EVENT selectionChanged", info);

            // Treat suppressNextFrameMenuNavigate as "suppress this frame AND next-frame menu navigate".
            // This handler may fire multiple times in quick succession after a back/transition.
            // We skip ALL navigate sounds while the flag is set, and only clear it here once
            // we've allowed at least one full input cycle to pass.
            if (this.game.suppressNextFrameMenuNavigate) {
                // Do NOT clear the flag on first suppression; let other systems (per-frame) handle timing,
                // and keep this handler silent while it's true.
                return;
            }

            if (!this.game.skipMenuNavigateSound) {
                this.game.playSound("menu_navigate");
            }
        });

        // Joined room → create/start NetworkSession and enter online multiplayer flow.
        this.gui.on("joinedRoom", (roomName) => {
            console.log("[ActionNetInputManager] EVENT joinedRoom", roomName);
            this.onJoinedRoom(roomName);
        });

        // Left room → clean up session and reset to title.
        this.gui.on("leftRoom", (roomName) => {
            console.log("[ActionNetInputManager] EVENT leftRoom", roomName);
            this.onLeftRoom(roomName);
        });

        // Disconnected → drop to title.
        this.gui.on("disconnected", () => {
            console.log("[ActionNetInputManager] EVENT disconnected");

            // When disconnect comes as part of a back/leave flow, we do NOT want another
            // stray navigate/confirm sound as menus reshuffle. Use the same suppression flag.
            this.game.suppressNextFrameMenuNavigate = true;

            this.onDisconnected();
        });

        // Back from login/lobby → go back to appropriate menu.
        this.gui.on("back", () => {
            console.log("[ActionNetInputManager] EVENT back");
            this.onBackFromGUI();
        });

        this.gui.on("backToLogin", () => {
            console.log("[ActionNetInputManager] EVENT backToLogin");
            this.onBackToLoginFromGUI();
        });

        this._wired = true;
        console.log("[ActionNetInputManager] wireGUIEvents() COMPLETE");
    }

    // ===== GUI EVENT HANDLERS =====

    onJoinedRoom(roomName) {
        if (!this.networkManager) {
            this.networkManager = this.gui ? this.gui.getNetManager() : null;
        }
        console.log("[ActionNetInputManager] onJoinedRoom()", roomName);

        // Create NetworkSession and start in WAITING/online flow
        this.game.gameState = "onlineMultiplayer";
        this.game.gameMode = "online";

        this.game.networkSession = new NetworkSession(this.networkManager, this.game.gameManager, this.game);
        this.game.networkSession.start();
    }

    onLeftRoom(roomName) {
        console.log("[ActionNetInputManager] onLeftRoom()", roomName);
    }

    onDisconnected() {
        console.log("[ActionNetInputManager] onDisconnected()");
        if (this.game.networkSession) {
            this.game.networkSession.cleanup();
            this.game.networkSession = null;
        }
    }

    onBackFromGUI() {
        console.log("[ActionNetInputManager] GUI back");
        this.game.playSound("menu_back");

        // When returning from ActionNet GUI back into our menus,
        // suppress immediate hover/selection navigate sfx just like other menus.
        this.game.suppressNextFrameMenuNavigate = true;

        this.game.gameState = "title";
        this.game.menuStack.current = "multiplayer";
        this.game.multiplayerMenu.selectedIndex = 0;
        this.game.multiplayerMenu.buttonsRegistered = false;

        // Also keep the existing action suppression to avoid input bleed-through.
        this.game.skipAction1ThisFrame = true;
    }

    onBackToLoginFromGUI() {
        // Lobby → Login inside ActionNet GUI:
        // GUI already set its own state. We:
        // - play back sound
        // - suppress next-frame menu_navigate so hover/key move on LOGIN doesn't double SFX.
        console.log("[ActionNetInputManager] GUI backToLogin");
        this.game.playSound("menu_back");
        this.game.suppressNextFrameMenuNavigate = true;
    }
}

/**
 * NetworkSession - Orchestrates multiplayer game session lifecycle
 *
 * Manages:
 * - Game states (WAITING → COUNTDOWN → PLAYING → GAME_OVER)
 * - Local and remote players
 * - Message routing
 * - Room management
 */
class NetworkSession {
    constructor(networkManager, gameManager, game) {
        this.networkManager = networkManager;
        this.gameManager = gameManager;
        this.game = game;

        // State management
        this.state = "WAITING";
        this.countdownTimer = 3;
        this.countdownFinished = false; // Tracks completion of online 3-2-1 + GO! cycle
        this.ready = false; // Ready to start countdown
        this.hostWaiting = true; // Host is actively waiting for players (new)

        // Rematch state
        this.rematchState = {
            localRequested: false
        };

        // Players
        this.localPlayer = null; // NetworkedPlayer wrapping player 1
        this.remotePlayers = []; // NetworkedPlayer wrapping player 2+

        // Components
        this.messageHandler = null;
        this.syncSystem = null; // Will reference GUI's SyncSystem



        // Setup network message listener
        this.setupNetworkListener();
    }

    /**
     * Setup network message listener
     */
    setupNetworkListener() {
        // Register custom handler for garbageSent with GUI
        this.game.gui.registerMessageHandler("garbageSent", (message) => {
            this.handleGarbageSent(message);
        });

        // Listen for join requests (host side)
         this.networkManager.on("joinRequest", (req) => {
             // console.log("[NetworkSession] Join request from:", req.username);
             // Auto-accept joiners for now
             this.networkManager.acceptJoin(req.peerId);
         });

         // Listen for user list updates
         this.networkManager.on("userList", (users) => {
             // console.log("[NetworkSession] User list updated:", users.length, "users");
            
            // Update remote player username when list arrives
            if (this.remotePlayers.length > 0 && users && users.length > 1) {
                const myUsername = this.game.gui.getUsername();
                const remoteUser = users.find((u) => u.username !== myUsername);
                if (remoteUser) {
                    this.remotePlayers[0].username = remoteUser.username;
                }
            }
            
            this.checkStartConditions();
        });

        // Listen for disconnections
        this.networkManager.on("userLeft", (user) => {
            // console.log("[NetworkSession] User left:", user);
            this.handleOpponentLeft(user);
        });

        // Listen for host leaving (room closing)
        this.networkManager.on("hostLeft", (message) => {
            // console.log("[NetworkSession] Host left the room:", message.displayName);
            this.handleHostLeft(message);
        });
    }

    /**
     * Start the multiplayer session
     */
    start() {
         // console.log("[NetworkSession] Starting session...");

        // Clear existing players
        this.gameManager.players = [];

        // Create NetworkedPlayer instances directly (not wrapping)
        this.localPlayer = new NetworkedPlayer(1, this.game.gameSettings, this.game, this, true);
        this.localPlayer.username = this.game.gui.getUsername(); // Set local username

        const remotePlayer = new NetworkedPlayer(2, this.game.gameSettings, this.game, this, false);
        remotePlayer.username = "Opponent"; // Placeholder until userList arrives
        this.remotePlayers.push(remotePlayer);

        // Add NetworkedPlayers to GameManager
        this.gameManager.players.push(this.localPlayer);
        this.gameManager.players.push(remotePlayer);

        // Update remote player username from current user list (if host has already accepted the join)
        const connectedUsers = this.networkManager.getConnectedUsers();
        if (connectedUsers && connectedUsers.length > 1) {
            const myUsername = this.game.gui.getUsername();
            const remoteUser = connectedUsers.find((u) => u.username !== myUsername);
            if (remoteUser) {
                remotePlayer.username = remoteUser.username;
                // console.log("[NetworkSession] Set initial remote player username from user list:", remoteUser.username);
            }
            }

        // Update game mode and initialize state
        this.gameManager.updateGameMode();
        this.gameManager.gameState = "playing";
        this.gameManager.winner = null;
        this.gameManager.pendingGarbage.clear();
        this.gameManager.garbageAnimation.clear();
        this.gameManager.lastHolePositions.clear();
        this.gameManager.lineClearingPlayers.clear();

        // Initialize piece queues and spawn initial pieces
        this.localPlayer.initializeBagAndQueue();
        this.localPlayer.spawnPiece(this.localPlayer.nextQueue.shift());
        this.localPlayer.nextQueue.push(this.localPlayer.getNextPiece());
        this.localPlayer.canHold = true;

        remotePlayer.initializeBagAndQueue();
        remotePlayer.spawnPiece(remotePlayer.nextQueue.shift());
        remotePlayer.nextQueue.push(remotePlayer.getNextPiece());
        remotePlayer.canHold = true;

        // Use GUI's built-in SyncSystem
        this.syncSystem = this.game.gui.syncSystem;

        // For P2P mode: set up data channel message handler
        if (typeof this.networkManager.getDataChannel === 'function') {
            const dataChannel = this.networkManager.getDataChannel();
            if (dataChannel) {
                dataChannel.onmessage = (evt) => {
                    try {
                        const message = JSON.parse(evt.data);
                        if (message.type === 'syncUpdate') {
                            this.syncSystem.handleSyncUpdate(message);
                        } else {
                            // Emit all other messages to networkManager for GUI routing
                            this.networkManager.emit('message', message);
                        }
                    } catch (e) {
                        console.error("[NetworkSession] Failed to handle message:", e.message);
                    }
                };
                // Data channel already open, sync can start immediately
                this._syncReadyToStart = true;
            } else {
                // Data channel not ready yet - wait for it to be established
                this._syncReadyToStart = false;
            }
        } else {
            // WebSocket mode: messages come through GUI's message routing
            // Sync can start immediately since WebSocket is already connected
            this._syncReadyToStart = true;
        }

        // New joiners are ready immediately (set BEFORE registering)
        this.ready = true;

        // Register match state as a sync source
        this.syncSystem.register("match", {
            getFields: () => ({
                state: this.state,
                ready: this.ready,
                wantsRematch: this.rematchState.localRequested,
                hostWaiting: this.hostWaiting // Host is actively waiting for players
            })
        });

        // Register gameplay state as a sync source (local stats only)
        // Remote side will read this as "remote gameplay" and map into its remote player.
        this.syncSystem.register("gameplay", {
            getFields: () => ({
                alive: this.localPlayer ? !this.localPlayer.gameOver : true,
                score: this.localPlayer ? this.localPlayer.score : 0,
                level: this.localPlayer ? this.localPlayer.level : 1,
                lines: this.localPlayer ? this.localPlayer.lines : 0
            })
        });

        // Register piece state as a sync source
        this.syncSystem.register("piece", {
            getFields: () => ({
                type: this.localPlayer ? this.localPlayer.currentPiece : null,
                x: this.localPlayer ? this.localPlayer.currentX : 0,
                y: this.localPlayer ? this.localPlayer.currentY : 0,
                rotation: this.localPlayer ? this.localPlayer.currentRotation : 0
            })
        });

        // Register next queue as a sync source
        this.syncSystem.register("queue", {
            getFields: () => ({
                next: this.localPlayer ? this.localPlayer.nextQueue.slice(0, 5) : []
            })
        });

        // Register held piece as a sync source
        this.syncSystem.register("hold", {
            getFields: () => ({
                piece: this.localPlayer ? this.localPlayer.heldPiece : null,
                canHold: this.localPlayer ? this.localPlayer.canHold : true
            })
        });

        // Register grid state as a sync source
        this.syncSystem.register("grid", {
            getFields: () => ({
                state: this.localPlayer ? this.localPlayer.grid : []
            })
        });

        // REMOVED: Garbage is handled via explicit garbageSent messages (see lines 273-279)
        // Syncing garbage here would cause duplicate messages to be received

        // Listen for remote state updates
        this.syncSystem.on("remoteUpdated", () => {
            this.checkStartConditions();
            this.checkRematchConditions();
            this.checkRemoteGameOver();
            this.checkHostWaitingState(); // NEW: Handle host not ready state
            this.updateRemotePieceState();
            this.updateRemoteQueueState();
            this.updateRemoteHoldState();
            this.updateRemoteGridState();
            // REMOVED: updateRemoteGarbageState() - garbage handled via explicit messages instead
            this.updateRemoteStatsState(); // NEW: sync remote score/level/lines for game over UI
        });

        this.syncSystem.on("remoteStale", () => {
            // DEBUG: Remote client stopped responding (called every frame while stale)
            // console.warn("[NetworkSession] Remote client stopped responding");
        });

        this.syncSystem.on("remoteFresh", () => {
            // DEBUG: Remote client reconnected (called every frame while fresh)
            // console.log("[NetworkSession] Remote client reconnected");
        });

        // DEFER sync activation until data channel is ready
        // This prevents "Cannot send: data channel not open" errors
        // when host creates room before joiner connects
        if (this._syncReadyToStart) {
            // console.log("[NetworkSession] Data channel ready - starting sync immediately");
            this.syncSystem.start();
        } else {
            // console.log("[NetworkSession] Data channel not ready - will activate sync on connection");
            // The networkManager will call activateSyncForGame() when data channel opens
        }

        // Garbage messaging is now handled directly in NetworkedPlayer.sendGarbageToOpponent()

        // Start in WAITING state
        this.state = "WAITING";

        // Transition to waiting menu instead of overlay
        this.game.gameState = "waitingMenu";

        // Clear any waiting overlay flags since we use menus now
        if (this.game.countdown) {
            this.game.countdown.waitingForOpponent = false;
            this.game.countdown.phase = "waiting";
            this.game.countdown.active = false;
        }

        this.checkStartConditions();
    }

    /**
     * Check if we can start the game
     */
    checkStartConditions() {
        // Only auto-start if we're in WAITING state (not OPPONENT_DISCONNECTED)
        if (this.state === "WAITING") {
            const users = this.networkManager.getConnectedUsers();
            const remoteMatch = this.syncSystem ? this.syncSystem.getRemote("match") : null;
            const remoteReady = remoteMatch ? remoteMatch.ready : false;
            const remoteHostWaiting = remoteMatch ? remoteMatch.hostWaiting : true;

            // DEBUG: Frame-by-frame start condition logging
            // console.log("[NetworkSession] Checking start conditions:", {
            //     users: users.length,
            //     localReady: this.ready,
            //     remoteReady: remoteReady,
            //     remoteHostWaiting: remoteHostWaiting,
            //     remoteStale: this.syncSystem ? this.syncSystem.isRemoteStale() : true
            // });

            // Only start if:
            // - 2 players present
            // - Local client is ready
            // - Remote client is ready (synced via SyncSystem)
            // - Host is actively waiting (if we're not the host)
            // - Remote data is not stale
            const isHost = this.networkManager.isCurrentUserHost();
            const hostAllowsStart = isHost ? true : remoteHostWaiting;

            if (users.length >= 2 && this.ready && remoteReady && hostAllowsStart && !this.syncSystem.isRemoteStale()) {
                this.startCountdown();
            }
        } else if (this.state === "HOST_NOT_READY") {
            // If host canceled waiting, just wait for them to re-enable
        } else if (this.state === "OPPONENT_DISCONNECTED") {
            // Waiting for user to click CONTINUE on opponent disconnected screen
        }
    }

    /**
     * Update session each frame
     */
    update(deltaTime) {
        // Always let countdown code run to clean up any stale GO! overlay.
        this.updateCountdown(deltaTime);

        if (this.state === "PLAYING") {
            this.updatePlaying(deltaTime);
        }
    }

    /**
     * Start countdown
     */
    startCountdown() {
        this.state = "COUNTDOWN";
        {
            this.countdownTimer = 3;
            this.countdownFinished = false;
            // console.log("[NetworkSession] Starting countdown...");

            // Reset game state for both players before countdown
            this.resetGameForRematch();

            // Update game countdown state (shared countdown overlay)
            if (this.game.countdown) {
                this.game.countdown.active = true;
                this.game.countdown.phase = "countdown";
                this.game.countdown.countdownNumber = 3;
                this.game.countdown.timer = 0;
                this.game.countdown.waitingForOpponent = false;
            }
        }
    }

    /**
     * Update countdown (online 3-2-1 -> GO -> clear)
     *
     * Robust against:
     * - Desynced countdown state between peers
     * - Countdown object being left active across rematches
     * - GO! overlay persisting after game start
     */
    updateCountdown(deltaTime) {
        const cd = this.game && this.game.countdown ? this.game.countdown : null;
        if (!cd) {
            return;
        }

        // Once the full cycle completed, never touch countdown again until a new startCountdown().
        if (this.countdownFinished) {
            return;
        }

        // If countdown was somehow left active while we're not actually in COUNTDOWN or GO, keep it only for GO.
        if (cd.active) {
            const inCountdownState = this.state === "COUNTDOWN";
            const inPlayingState = this.state === "PLAYING";

            // Allow:
            // - "countdown" phase only while state === COUNTDOWN
            // - "go" phase only while state === PLAYING (so GO! overlays during early play)
            if (cd.phase === "countdown" && !inCountdownState) {
                // Invalid: countdown numbers outside COUNTDOWN -> clear.
                cd.active = false;
                cd.phase = "waiting";
                cd.countdownNumber = 3;
                cd.timer = 0;
                cd.waitingForOpponent = false;
                return;
            }

            if (cd.phase === "go" && !inPlayingState) {
                // Invalid: GO! outside PLAYING -> clear.
                cd.active = false;
                cd.phase = "waiting";
                cd.countdownNumber = 3;
                cd.timer = 0;
                cd.waitingForOpponent = false;
                return;
            }
        }

        // If not explicitly active for online countdown, do nothing.
        if (!cd.active) {
            return;
        }

        // Online flow drives both 3-2-1 and GO! using its own phases:
        // "countdown" -> "go" -> inactive.
        if (cd.phase === "countdown") {
            this.countdownTimer -= deltaTime;
            const remaining = Math.max(0, this.countdownTimer);

            if (remaining > 0) {
                cd.countdownNumber = Math.max(1, Math.ceil(remaining));
            }

            // Pulse anim driver
            cd.timer += deltaTime;

            if (remaining <= 0) {
                // Start gameplay on both peers
                this.startGame();

                // Switch to GO! phase and let it fade out
                cd.phase = "go";
                cd.timer = 0;
                cd.countdownNumber = null;
            }
        } else if (cd.phase === "go") {
            // Important: use a fixed duration and then CLEAR EVERYTHING.
            cd.timer += deltaTime;
            const GO_DURATION = 0.7;

            if (cd.timer >= GO_DURATION) {
                // console.log("[NetworkSession] Online GO! complete - clearing countdown overlay");
                cd.active = false;
                cd.phase = "waiting";       // reset to neutral so offline logic doesn't mis-read it
                cd.countdownNumber = 3;     // reset for next countdown
                cd.timer = 0;
                cd.waitingForOpponent = false;
                this.countdownFinished = true;
            }
        } else {
            // Any unknown/legacy phase while active -> fail-safe clear.
            console.warn("[NetworkSession] Unexpected countdown.phase during online countdown:", cd.phase);
            cd.active = false;
            cd.phase = "waiting";
            cd.countdownNumber = 3;
            cd.timer = 0;
            cd.waitingForOpponent = false;
        }
    }

    /**
     * Start the actual game
     */
    startGame() {
        this.state = "PLAYING";
        // console.log("[NetworkSession] Game started!");
        // Do not touch game.countdown here.
        // updateCountdown() already transitions to GO and clears it.
    }

    /**
     * Update playing state
     */
    updatePlaying(deltaTime) {
        // Check for game over
        if (this.checkGameOver()) {
            this.endGame();
        }
    }

    /**
     * Check if game is over
     */
    checkGameOver() {
        const activePlayers = this.gameManager.getActivePlayers();
        return this.gameManager.players.length > 1 && activePlayers.length <= 1;
    }

    /**
     * End the game
     */
    endGame() {
        // Reset rematch flag for clean state
        this.rematchState.localRequested = false;

        this.state = "GAME_OVER";
        {
            const winner = this.gameManager.getActivePlayers()[0];
            // console.log("[NetworkSession] Game over! Winner:", winner?.playerNumber);

            // Notify local player game over if they lost
            if (!winner || winner.playerNumber !== 1) {
                this.localPlayer.onGameOver();
            }

            // Trigger game over UI (handles gameOverTransition + game.gameState)
            this.gameManager.endGame(winner?.playerNumber || null);

            // Match local behavior: stop all player screen shake on game over
            if (this.gameManager && this.gameManager.players) {
                this.gameManager.players.forEach((player) => {
                    player.screenShake = { intensity: 0, duration: 0 };
                });
            }

            // Also ensure global time scale is back to normal at end of round
            if (this.game) {
                this.game.timeScale = 1.0;
            }
        }
    }

    /**
     * Request a rematch with the opponent
     */
    requestRematch() {
        console.log("[NetworkSession] Requesting rematch...");

        // Check if we're in the correct state
        if (this.state !== "GAME_OVER") {
            console.warn("[NetworkSession] Cannot request rematch - not in GAME_OVER state");
            return false;
        }

        // Mark local player as requesting rematch (synced via SyncSystem)
        this.rematchState.localRequested = true;

        // Transition to REMATCH_PENDING state
        this.state = "REMATCH_PENDING";

        // Update game state to show the rematch pending menu
        this.game.gameState = "rematchPending";

        // Check immediately if both want rematch
        this.checkRematchConditions();

        return true;
    }

    /**
     * Check if remote player died (via synced alive state)
     */
    checkRemoteGameOver() {
        if (this.state !== "PLAYING") {
            return;
        }

        const remoteGameplay = this.syncSystem ? this.syncSystem.getRemote("gameplay") : null;
        const remoteAlive = remoteGameplay ? remoteGameplay.alive : true;

        // Remote player died?
        if (!remoteAlive && this.remotePlayers.length > 0) {
            const remotePlayer = this.remotePlayers[0];
            if (!remotePlayer.gameOver) {
                console.log("[NetworkSession] Remote player died (detected via sync)");
                remotePlayer.gameOver = true;
            }
        }
    }

    /**
     * Update remote player's piece state from synced data
     */
    updateRemotePieceState() {
        if (this.state !== "PLAYING") {
            return;
        }

        const remotePiece = this.syncSystem ? this.syncSystem.getRemote("piece") : null;
        if (!remotePiece || this.remotePlayers.length === 0) {
            return;
        }

        // Apply piece update to remote player
        this.remotePlayers[0].applyPieceUpdate(remotePiece);
    }

    /**
     * Update remote player's next queue from synced data
     */
    updateRemoteQueueState() {
        if (this.state !== "PLAYING") {
            return;
        }

        const remoteQueue = this.syncSystem ? this.syncSystem.getRemote("queue") : null;
        if (!remoteQueue || this.remotePlayers.length === 0) {
            return;
        }

        // Apply queue update to remote player
        this.remotePlayers[0].applyQueueUpdate(remoteQueue);
    }

    /**
     * Update remote player's held piece from synced data
     */
    updateRemoteHoldState() {
        if (this.state !== "PLAYING") {
            return;
        }

        const remoteHold = this.syncSystem ? this.syncSystem.getRemote("hold") : null;
        if (!remoteHold || this.remotePlayers.length === 0) {
            return;
        }

        // Apply hold update to remote player
        this.remotePlayers[0].applyHoldUpdate(remoteHold);
    }

    /**
     * Update remote player's grid state from synced data
     */
    updateRemoteGridState() {
        if (this.state !== "PLAYING") {
            return;
        }

        const remoteGrid = this.syncSystem ? this.syncSystem.getRemote("grid") : null;
        if (!remoteGrid || this.remotePlayers.length === 0) {
            return;
        }

        // Apply grid update to remote player
        this.remotePlayers[0].applyGridUpdate(remoteGrid);
    }

    /**
     * Update remote player's pending garbage from synced data
     */
    updateRemoteGarbageState() {
        if (this.state !== "PLAYING") {
            return;
        }

        const remoteGarbage = this.syncSystem ? this.syncSystem.getRemote("garbage") : null;
        if (!remoteGarbage || this.remotePlayers.length === 0) {
            return;
        }

        // Update pending garbage display for remote player
        const remotePlayerNum = this.remotePlayers[0].playerNumber;
        if (this.gameManager && this.gameManager.pendingGarbage) {
            this.gameManager.pendingGarbage.set(remotePlayerNum, remoteGarbage.pending || 0);
        }
    }

    /**
     * Update remote player's core stats (score/level/lines) from synced gameplay data
     */
    updateRemoteStatsState() {
        if (!this.syncSystem || this.remotePlayers.length === 0) {
            return;
        }

        const remoteGameplay = this.syncSystem.getRemote("gameplay");
        if (!remoteGameplay) {
            return;
        }

        const remotePlayer = this.remotePlayers[0];

        // Map synced gameplay fields into the remote player shown locally
        if (typeof remoteGameplay.score === "number") {
            remotePlayer.score = remoteGameplay.score;
        }
        if (typeof remoteGameplay.level === "number") {
            remotePlayer.level = remoteGameplay.level;
        }
        if (typeof remoteGameplay.lines === "number") {
            remotePlayer.lines = remoteGameplay.lines;
        }
    }

    /**
     * Check if both players want rematch and start if so
     */
    checkRematchConditions() {
        if (this.state !== "REMATCH_PENDING" && this.state !== "GAME_OVER") {
            return;
        }

        const remoteMatch = this.syncSystem ? this.syncSystem.getRemote("match") : null;
        const remoteWantsRematch = remoteMatch ? remoteMatch.wantsRematch : false;

        // Both players want rematch?
        if (this.rematchState.localRequested && remoteWantsRematch) {
            console.log("[NetworkSession] Both players want rematch - starting!");
            this.startRematch();
        }
    }

    /**
     * Cancel rematch request
     */
    cancelRematch() {
        console.log("[NetworkSession] Canceling rematch request");

        // Reset rematch state (synced via SyncSystem)
        this.rematchState.localRequested = false;

        // Return to game over state
        this.state = "GAME_OVER";
        this.game.gameState = "gameOver";
    }

    /**
     * Handle rematch timeout (30 seconds expired)
     */
    handleRematchTimeout() {
        console.log("[NetworkSession] Rematch request timed out");

        // Clear timeout reference
        this.rematchState.timeout = null;

        // Send decline message
        this.sendMessage({
            type: "rematchDecline",
            username: this.game.gui.getUsername(),
            reason: "timeout"
        });

        // Reset state
        this.rematchState.localRequested = false;
        this.rematchState.remoteRequested = false;

        // Return to game over
        this.state = "GAME_OVER";
    }

    /**
     * Start the rematch - reset game and begin countdown
     */
    startRematch() {
        console.log("[NetworkSession] Starting rematch!");

        // Reset game state for both players
        this.resetGameForRematch();

        // Start countdown (just like initial game start)
        this.startCountdown();
    }

    /**
     * Reset game state for rematch
     */
    resetGameForRematch() {
        // console.log("[NetworkSession] Resetting game state for rematch...");

        // Reset game manager state
        this.gameManager.gameState = "playing";
        this.gameManager.winner = null;
        this.gameManager.pendingGarbage.clear();
        this.gameManager.garbageAnimation.clear();
        this.gameManager.lastHolePositions.clear();
        this.gameManager.lineClearingPlayers.clear();

        // Ensure global time scale is clean for new round
        if (this.game) {
            this.game.timeScale = 1.0;
        }

        // Reset both players
        this.gameManager.players.forEach((player) => {
            // Reset game over state
            player.gameOver = false;

            // Reset grid
            player.grid = Array(TETRIS.GRID.ROWS)
                .fill(null)
                .map(() => Array(TETRIS.GRID.COLS).fill(null));

            // Reset score, level, lines
            player.score = 0;
            player.level = 1;
            player.lines = 0;

            // Reset piece state
            player.currentPiece = null;
            player.heldPiece = null;
            player.canHold = true;

            // Reset bag and queue
            player.initializeBagAndQueue();

            // Reset next queue
            player.nextQueue = [];
            for (let i = 0; i < 5; i++) {
                player.nextQueue.push(player.getNextPiece());
            }

            // Spawn initial piece
            player.spawnPiece(player.nextQueue.shift());
            player.nextQueue.push(player.getNextPiece());

            // Reset timers
            player.dropTimer = 0;
            player.lockTimer = 0;
            player.levelUpAnimationTimer = 0;

            // Reset visual effects and line clear state
            player.screenShake = { intensity: 0, duration: 0 };
            player.lockFlash = 0;
            player.spawnFlash = 0;
            player.lineClearEffect = { active: false, lines: [], progress: 0 };

            // Reset back-to-back chain
            player.backToBack = false;
            });

        // Update game state
        this.game.gameState = "onlineMultiplayer";
        this.game.gameOverTransition.active = false;
        this.game.gameOverTransition.timer = 0;
        this.game.gameOverTransition.opacity = 1;
    }

    /**
     * Handle garbage sent from opponent
     */
    handleGarbageSent(message) {
        // Add garbage to local player
        // console.log("[NetworkSession] Received", message.lines, "garbage lines from opponent");

        if (this.gameManager) {
            this.gameManager.addGarbageToPlayer(1, message.lines);
        }
    }

    /**
     * Handle incoming network message (deprecated - messages now routed through GUI)
     */
    handleMessage(message) {
        // This method is now deprecated - messages are routed through
        // ActionNetManagerGUI's message routing system
        console.warn("[NetworkSession] handleMessage called directly - messages should route through GUI");
    }

    /**
     * Send network message
     */
    sendMessage(message) {
        if (this.networkManager && this.networkManager.isInRoom()) {
            this.networkManager.send(message);
        }
    }

    /**
     * Activate sync system (called when data channel becomes ready)
     * Safe to call multiple times
     */
    activateSyncSystem() {
        if (this.syncSystem && !this.syncSystem.isRunning) {
            console.log("[NetworkSession] Activating sync system after data channel open");
            this.syncSystem.start();
            this._syncReadyToStart = true;
        }
    }

    /**
     * Get current state
     */
    getState() {
        return this.state;
    }

    /**
     * Check if currently playing
     */
    isPlaying() {
        return this.state === "PLAYING";
    }

    /**
     * Handle opponent (joiner) leaving the game
     */
    handleOpponentLeft(user) {
        console.log("[NetworkSession] Opponent left - showing disconnect screen...");

        // Check if we're actually in a game state that matters
        const currentState = this.state;
        if (currentState === "WAITING" || currentState === "LOBBY" || currentState === "CANCELLED") {
            // Not in an active game, just update the client list
            console.log("[NetworkSession] Opponent left during non-game state, no action needed");
            return;
        }

        // Reset rematch state
        this.rematchState.localRequested = false;

        // Set ready to false (host is not ready until they click CONTINUE)
        this.ready = false;

        // Transition to OPPONENT_DISCONNECTED state
        this.state = "OPPONENT_DISCONNECTED";

        // Show opponent disconnected screen
        console.log("[NetworkSession] Showing opponent disconnected screen");
        this.game.gameState = "opponentDisconnected";
        this.game.opponentDisconnectedMenu.selectedIndex = 0;
        this.game.opponentDisconnectedMenu.buttonsRegistered = false;
    }

    /**
     * Continue after opponent disconnect - return to waiting state
     */
    continueAfterOpponentDisconnect() {
        console.log("[NetworkSession] Continuing after opponent disconnect - returning to waiting state...");

        // Clear the game state
        this.resetGameForRematch();

        // Set ready flag (host is now ready for a new game)
        this.ready = true;

        // Reset host waiting intention
        this.hostWaiting = true;

        // Transition back to WAITING state (this allows checkStartConditions to work)
        this.state = "WAITING";

        // Transition to waiting menu instead of overlay
        this.game.gameState = "waitingMenu";

        // Clear any waiting overlay flags since we use menus now
        if (this.game.countdown) {
            this.game.countdown.waitingForOpponent = false;
            this.game.countdown.phase = "waiting";
            this.game.countdown.active = false;
        }

        // Clean up remote player but keep local player
        if (this.remotePlayers.length > 0) {
            const remotePlayer = this.remotePlayers[0];

            // Reset remote player state
            remotePlayer.gameOver = false;
            remotePlayer.grid = Array(TETRIS.GRID.ROWS)
                .fill(null)
                .map(() => Array(TETRIS.GRID.COLS).fill(null));
            remotePlayer.score = 0;
            remotePlayer.level = 1;
            remotePlayer.lines = 0;
            remotePlayer.currentPiece = null;
            remotePlayer.heldPiece = null;
            remotePlayer.canHold = true;
            remotePlayer.nextQueue = [];

            console.log("[NetworkSession] Remote player state cleared");
        }

        // Keep the session active (host stays in room waiting for new opponent)
        console.log("[NetworkSession] Waiting for new opponent to join...");
    }

    /**
     * Handle host leaving the room
     */
    handleHostLeft(message) {
        console.log("[NetworkSession] Host left - showing room shutdown screen...");

        // Check if we're the host (we shouldn't receive this message if we are)
        if (this.networkManager.isCurrentUserHost()) {
            console.warn("[NetworkSession] Received hostLeft but we are the host?");
            return;
        }

        // Show room shut down screen
        console.log("[NetworkSession] Showing room shut down screen");
        this.game.gameState = "roomShutDown";
        this.game.roomShutDownMenu.selectedIndex = 0;
        this.game.roomShutDownMenu.buttonsRegistered = false;
    }

    /**
     * Return to lobby after room shutdown
     */
    returnToLobbyAfterShutdown() {
        console.log("[NetworkSession] Returning to lobby after room shutdown...");

        // Leave the room and clean up session
        this.leave();

        // Clear game state (stops game from rendering) and return to multiplayer lobby
        if (this.game) {
            this.game.clearGameState();
            this.game.gameState = "multiplayerLogin";
            // Keep the GUI connected so lobby shows
        }
    }

    /**
     * Leave the session
     */
    leave() {
        if (this.networkManager && this.networkManager.isInRoom()) {
            this.networkManager.leaveRoom();
        }
        this.cleanup();
    }

    /**
     * Cleanup
     */
    cleanup() {
        console.log("[NetworkSession] Cleaning up...");

        // Unregister custom message handler
        if (this.game && this.game.gui) {
            this.game.gui.unregisterMessageHandler("garbageSent");
        }

        // Unregister garbage sent event handler


        // Note: SyncSystem is managed by GUI - it will stop when room is left
        this.syncSystem = null;

        this.localPlayer = null;
        this.remotePlayers = [];
        this.messageHandler = null;
    }

    checkHostWaitingState() {
        if (this.state === "WAITING" || this.state === "HOST_NOT_READY") {
            const isHost = this.networkManager.isCurrentUserHost();

            if (!isHost) {
                // We're a joiner - check if host is waiting
                const remoteMatch = this.syncSystem ? this.syncSystem.getRemote("match") : null;
                const remoteHostWaiting = remoteMatch ? remoteMatch.hostWaiting : true;

                if (!remoteHostWaiting && this.state !== "HOST_NOT_READY") {
                    console.log("[NetworkSession] Host canceled waiting - showing host not ready screen");
                    this.state = "HOST_NOT_READY";
                    this.game.gameState = "waitingForHostMenu"; // New state for joiners
                    // Don't change ready state - joiner can still be ready
                } else if (remoteHostWaiting && this.state === "HOST_NOT_READY") {
                    console.log("[NetworkSession] Host resumed waiting - returning to waiting menu");
                    this.state = "WAITING";
                    this.game.gameState = "waitingMenu"; // Or appropriate joiner menu
                }
            }
        }
    }
}

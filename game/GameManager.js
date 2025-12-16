/**
 * GameManager - Coordinates multiple players and handles shared game logic
 */
class GameManager {
    constructor(game) {
        this.game = game; // Reference to main Game instance
        this.players = [];
        this.maxPlayers = 4;
        this.gameMode = "single"; // 'single', 'twoPlayer', 'threePlayer', 'fourPlayer'

        // Battle mechanics
        this.pendingGarbage = new Map(); // playerNumber -> garbage count waiting to be added

        // Targeting: for 3-4 player modes only.
        // Maps attackerPlayerNumber -> defenderPlayerNumber.
        // In 1P / 2P modes this is ignored; garbage routing uses legacy behavior.
        this.targetMap = new Map();

        // Game state
        this.gameState = "title"; // 'title', 'playing', 'paused', 'gameOver'
        this.winner = null;

        // Line clearing state (for animations)
        this.lineClearingPlayers = new Map(); // playerNumber -> { timer: number, lines: number[] }

        // Garbage animation state
        this.garbageAnimation = new Map(); // playerNumber -> { remaining: number, timer: number }

        // Track last hole positions for strategic garbage placement
        this.lastHolePositions = new Map(); // playerNumber -> lastHoleX

        // Layout manager for UI positioning
        this.layoutManager = new LayoutManager();

        // Event system for network integration
        this.eventHandlers = new Map();
    }

    /**
     * Register event handler
     */
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event).push(handler);
    }

    /**
     * Unregister event handler
     */
    off(event, handler) {
        if (!this.eventHandlers.has(event)) return;
        const handlers = this.eventHandlers.get(event);
        const index = handlers.indexOf(handler);
        if (index > -1) {
            handlers.splice(index, 1);
        }
    }

    /**
     * Emit event
     */
    emit(event, data) {
        if (!this.eventHandlers.has(event)) return;
        this.eventHandlers.get(event).forEach(handler => {
            try {
                handler(data);
            } catch (e) {
                console.error(`[GameManager] Error in ${event} handler:`, e);
            }
        });
    }

    /**
     * Add a human player to the game
     */
    addPlayer(playerNumber) {
        if (this.players.length >= this.maxPlayers) {
            console.warn(`Maximum players (${this.maxPlayers}) already reached`);
            return null;
        }

        const player = new Player(playerNumber, this.game.gameSettings, this.game);
        this.players.push(player);

        // Update game mode based on player count
        this.updateGameMode();

        return player;
    }

    /**
     * Add a CPU player to the game
     */
    addCPUPlayer(playerNumber, difficulty = null) {
        if (this.players.length >= this.maxPlayers) {
            console.warn(`Maximum players (${this.maxPlayers}) already reached`);
            return null;
        }

        // Use difficulty from game settings if not specified
        const cpuDifficulty = difficulty || this.game.gameSettings.cpuDifficulty;

        // Create CPU player instance (check if CPUPlayer class is available)
        let cpuPlayer;
        if (typeof window !== "undefined" && window.CPUPlayer) {
            cpuPlayer = new window.CPUPlayer(playerNumber, cpuDifficulty, this.game.gameSettings, this.game);
        } else {
            console.warn(`CPUPlayer class not available, creating regular player as fallback`);
            cpuPlayer = new Player(playerNumber, this.game.gameSettings, this.game);
        }

        this.players.push(cpuPlayer);

        // Update game mode based on player count
        this.updateGameMode();

        console.log(
            `Added ${cpuPlayer.thinkingTimer !== undefined ? "CPU" : "Human"} player ${playerNumber} with ${cpuDifficulty} difficulty`
        );
        return cpuPlayer;
    }

    /**
     * Remove a player from the game
     */
    removePlayer(playerNumber) {
        const index = this.players.findIndex((p) => p.playerNumber === playerNumber);
        if (index > -1) {
            this.players.splice(index, 1);
            this.updateGameMode();
        }
    }

    /**
     * Update game mode based on current player count
     */
    updateGameMode() {
        const playerCount = this.players.length;
        if (playerCount === 0) {
            this.gameMode = "single";
        } else if (playerCount === 1) {
            this.gameMode = "single";
        } else if (playerCount === 2) {
            this.gameMode = "twoPlayer";
        } else if (playerCount === 3) {
            this.gameMode = "threePlayer";
        } else if (playerCount === 4) {
            this.gameMode = "fourPlayer";
        }
    }

    /**
     * Get a specific player by number
     */
    getPlayer(playerNumber) {
        return this.players.find((p) => p.playerNumber === playerNumber) || null;
    }

    /**
     * Internal: get list of alive players (not game over)
     */
    getAlivePlayers() {
        return this.players.filter((p) => !p.gameOver);
    }

    /**
     * Targeting: initialize targetMap for all players (3-4P only).
     * Each player targets the next available player in numeric order, skipping themselves.
     */
    initializeTargets() {
        this.targetMap.clear();

        // Only relevant for 3-4 players; 1P/2P use direct/legacy routing.
        if (this.players.length < 3) {
            return;
        }

        const alive = this.getAlivePlayers()
            .map((p) => p.playerNumber)
            .sort((a, b) => a - b);

        alive.forEach((attacker) => {
            const target = this.getNextTargetPlayer(attacker, alive);
            if (target !== null) {
                this.targetMap.set(attacker, target);
            }
        });
    }

    /**
     * Targeting: given an attacker and an ordered list of alive playerNumbers,
     * find the next valid target (first other player after attacker, wrapping).
     * Returns null if no other players exist.
     */
    getNextTargetPlayer(attackerNumber, aliveList = null) {
        const alive = (aliveList || this.getAlivePlayers().map((p) => p.playerNumber)).filter(
            (n) => !this.getPlayer(n)?.gameOver
        );
        if (alive.length <= 1) {
            return null;
        }

        alive.sort((a, b) => a - b);

        const idx = alive.indexOf(attackerNumber);
        // If attacker not found (shouldn't happen), just use first alive as fallback target.
        if (idx === -1) {
            return alive[0];
        }

        // Scan forward for the next different player, wrapping around.
        for (let offset = 1; offset < alive.length + 1; offset++) {
            const candidate = alive[(idx + offset) % alive.length];
            if (candidate !== attackerNumber) {
                return candidate;
            }
        }

        return null;
    }

    /**
     * Targeting: cycle an attacker's target to the next alive opponent (3-4P only).
     * Safe to call even in 2P: it becomes a no-op.
     */
    cyclePlayerTarget(attackerNumber) {
        if (this.players.length < 3) {
            // No dedicated targeting logic for 1P/2P modes.
            return;
        }

        const attacker = this.getPlayer(attackerNumber);
        if (!attacker || attacker.gameOver) {
            return;
        }

        const alive = this.getAlivePlayers()
            .map((p) => p.playerNumber)
            .sort((a, b) => a - b);

        if (alive.length <= 1) {
            return;
        }

        const currentTarget = this.targetMap.get(attackerNumber);
        let nextTarget = null;

        if (!currentTarget || !alive.includes(currentTarget) || currentTarget === attackerNumber) {
            // Current target invalid; pick a fresh one.
            nextTarget = this.getNextTargetPlayer(attackerNumber, alive);
        } else {
            // Advance from current target forward.
            const idx = alive.indexOf(currentTarget);
            for (let offset = 1; offset < alive.length + 1; offset++) {
                const candidate = alive[(idx + offset) % alive.length];
                if (candidate !== attackerNumber) {
                    nextTarget = candidate;
                    break;
                }
            }
        }

        if (nextTarget !== null) {
            this.targetMap.set(attackerNumber, nextTarget);
        }
    }

    /**
     * Targeting: ensure all attackers pointing at a KO'd player retarget.
     */
    retargetAllFromKo(koPlayerNumber) {
        if (this.players.length < 3) {
            return;
        }

        const alive = this.getAlivePlayers()
            .map((p) => p.playerNumber)
            .sort((a, b) => a - b);

        this.targetMap.forEach((target, attacker) => {
            const attackerPlayer = this.getPlayer(attacker);
            if (!attackerPlayer || attackerPlayer.gameOver) {
                this.targetMap.delete(attacker);
                return;
            }

            if (target === koPlayerNumber || !alive.includes(target) || target === attacker) {
                const newTarget = this.getNextTargetPlayer(attacker, alive);
                if (newTarget !== null) {
                    this.targetMap.set(attacker, newTarget);
                } else {
                    this.targetMap.delete(attacker);
                }
            }
        });
    }

    /**
     * Get all active players
     */
    getActivePlayers() {
        return this.players.filter((p) => !p.gameOver);
    }

    /**
     * Get the primary player (for single player mode)
     */
    getPrimaryPlayer() {
        return this.players[0] || null;
    }

    /**
     * Initialize the game for multiplayer
     */
    initialize(numPlayers = 2) {
        // console.log(`Initializing ${numPlayers}-player game...`);

        // Clear existing players
        this.players = [];

        // Clear ALL garbage-related state from previous games
        this.pendingGarbage.clear();
        this.garbageAnimation.clear();
        this.lastHolePositions.clear();
        this.lineClearingPlayers.clear();
        this.targetMap.clear();

        // Add requested number of players
        for (let i = 1; i <= numPlayers; i++) {
            const player = this.addPlayer(i);
            // console.log(`Created player ${i}:`, player);
        }

        // Reset game state
        this.gameState = "playing";
        this.winner = null;

        // Reset time scale (clear any slow-motion effects from previous game)
        this.game.timeScale = 1.0;

        // Reset all players
        this.players.forEach((player) => {
            player.reset();
            // console.log(`Reset player ${player.playerNumber}`);
        });

        // Spawn initial pieces for all players
        this.spawnInitialPieces();

        // Initialize targets for 3-4 player games
        this.initializeTargets();

        // console.log(`${numPlayers}-Player mode initialized! Players:`, this.players.length);
    }

    /**
     * Initialize a game with human player(s) versus CPU player(s)
     */
    initializeVersusCPU(numHumans = 1, numCPUs = 1) {
        // console.log(`Initializing ${numHumans} human vs ${numCPUs} CPU game...`);

        // Clear existing players
        this.players = [];

        // Clear ALL garbage-related state from previous games
        this.pendingGarbage.clear();
        this.garbageAnimation.clear();
        this.lastHolePositions.clear();
        this.lineClearingPlayers.clear();
        this.targetMap.clear();

        // Add human players first
        for (let i = 1; i <= numHumans; i++) {
            this.addPlayer(i);
        }

        // Add CPU players
        for (let i = 1; i <= numCPUs; i++) {
            const cpuPlayerNumber = numHumans + i;
            this.addCPUPlayer(cpuPlayerNumber);
        }

        // Reset game state
        this.gameState = "playing";
        this.winner = null;

        // Reset time scale (clear any slow-motion effects from previous game)
        this.game.timeScale = 1.0;

        // Reset all players
        this.players.forEach((player) => {
            if (player.reset && typeof player.reset === "function") {
                player.reset();
            }
            // console.log(`Reset ${player.thinkingTimer !== undefined ? "CPU" : "Human"} player ${player.playerNumber}`);
        });

        // Spawn initial pieces for all players
        this.spawnInitialPieces();

        // Initialize targets for 3-4 player games (if versus CPU is ever 3-4P capable)
        this.initializeTargets();

        // console.log(`Versus CPU mode initialized! Total players: ${this.players.length}`);
    }

    /**
     * Spawn initial pieces for all players
     */
    spawnInitialPieces() {
        this.players.forEach((player) => {
            // Each player now manages their own piece queue
            player.spawnPiece(player.nextQueue.shift());
            player.nextQueue.push(player.getNextPiece());
            player.canHold = true;
        });
    }

    /**
     * Send garbage from one player to another (immediate)
     *
     * IMPORTANT: The third parameter is FINAL GARBAGE COUNT.
     *            Do NOT pass "lines cleared" here.
     *
     * All mapping from (lines cleared + spins + B2B + combo)
     * → garbage is done in handlePlayerLineClear().
     */
    sendGarbage(fromPlayer, toPlayer, garbageLines) {
        // Never send garbage to yourself
        if (fromPlayer === toPlayer) {
            console.error(`BUG PREVENTED: Player ${fromPlayer} tried to send garbage to themselves!`);
            return;
        }

        // Ignore non-positive input
        if (!Number.isFinite(garbageLines) || garbageLines <= 0) {
            return;
        }

        // Add final garbage amount directly
        const currentPending = this.pendingGarbage.get(toPlayer) || 0;
        this.pendingGarbage.set(toPlayer, currentPending + garbageLines);

        // Notify local player to send network message if they're the attacker
        const attacker = this.getPlayer(fromPlayer);
        if (attacker && attacker.sendGarbageToOpponent) {
            attacker.sendGarbageToOpponent(toPlayer, garbageLines);
        }
        }

        /**
        * Add garbage to a player (for network sync)
        */
    addGarbageToPlayer(playerNumber, lines) {
        const currentPending = this.pendingGarbage.get(playerNumber) || 0;
        this.pendingGarbage.set(playerNumber, currentPending + lines);
    }

    /**
     * Check if a player has pending garbage and start the animation
     */
    checkAndProcessPendingGarbage(playerNumber) {
        const player = this.getPlayer(playerNumber);
        if (!player || player.gameOver) return false;

        // CRITICAL: Don't process garbage if player is clearing lines
        if (this.lineClearingPlayers.has(playerNumber)) {
            return false; // Wait until line clear finishes
        }

        const pendingCount = this.pendingGarbage.get(playerNumber) || 0;
        if (pendingCount > 0) {
            this.garbageAnimation.set(playerNumber, {
                remaining: pendingCount,
                timer: 0
            });

            this.pendingGarbage.set(playerNumber, 0);
            return true;
        }
        return false;
    }

    /**
     * Add ONE garbage line to a player's grid
     * The entire playfield shifts up by 1 row, preserving all block colors and positions
     */
    addSingleGarbageLine(playerNumber) {
        const player = this.getPlayer(playerNumber);
        if (!player) return;

        // Shift the entire grid up by 1 row
        // The playfield moves up as-is, preserving all colors and structure
        const newGrid = [];

        // Copy rows 1 through ROWS-1 to rows 0 through ROWS-2
        for (let y = 1; y < TETRIS.GRID.ROWS; y++) {
            newGrid.push([...player.grid[y]]);
        }

        // Add one new garbage row at the bottom
        const garbageRow = [];

        // Strategic hole placement: 80% chance to use previous hole position, 20% random
        let holePosition;
        const lastHolePos = this.lastHolePositions.get(playerNumber);

        if (lastHolePos === undefined || Math.random() < 0.2) {
            // First garbage line or 20% chance: random position
            holePosition = Math.floor(Math.random() * TETRIS.GRID.COLS);
        } else {
            // 80% chance: use previous hole position
            holePosition = lastHolePos;
        }

        // Store this hole position for next time
        this.lastHolePositions.set(playerNumber, holePosition);

        for (let x = 0; x < TETRIS.GRID.COLS; x++) {
            if (x === holePosition) {
                garbageRow.push(null); // One hole per garbage line
            } else {
                garbageRow.push("garbage");
            }
        }
        newGrid.push(garbageRow);

        player.grid = newGrid;

        // Update justLockedPositions to account for grid shift
        // All y-coordinates shift up by 1 (decrement by 1)
        player.justLockedPositions = player.justLockedPositions
            .map((pos) => ({ x: pos.x, y: pos.y - 1 }))
            .filter((pos) => pos.y >= 0); // Remove any that shifted off the top

        this.game.playSound("line_clear");
    }

    /**
     * Update all players and game logic
     */
    update(deltaTime) {
        if (this.gameState !== "playing" && this.game.gameState !== "onlineMultiplayer") return;

        // Update line clearing timers (respects timeScale via deltaTime)
        this.updateLineClearing(deltaTime);

        // Update garbage animations
        this.updateGarbageAnimation(deltaTime);
        
        // Update T-SPIN text effects (completely separate from line clearing)
        this.players.forEach((player) => {
            if (player.tSpinTextEffect?.active) {
                player.tSpinTextEffect.progress += (deltaTime * 1000) / player.tSpinTextEffect.duration;
                
                // Clear when done
                if (player.tSpinTextEffect.progress >= 1.0) {
                    player.tSpinTextEffect.active = false;
                }
            }
        });

        // Update all players that are NOT line clearing or receiving garbage
        this.players.forEach((player) => {
            if (!this.lineClearingPlayers.has(player.playerNumber) && !this.garbageAnimation.has(player.playerNumber)) {
                // Check if this is a CPU player
                if (player.update && typeof player.thinkingTimer === "number") {
                    // This is a CPU player - call AI update
                    player.update(deltaTime);
                } else {
                    // Human or networked player - updateGameplay handles logic
                    // NetworkedPlayer overrides this to skip for remote players
                    player.updateGameplay(deltaTime);
                }
            }

            // Update visual effects for all players
            if (player.updateVisualEffects) {
                player.updateVisualEffects(deltaTime);
            }
        });

        // Check win conditions
        this.checkWinConditions();
    }

    /**
     * Update line clearing animations and timers
     */
    updateLineClearing(deltaTime) {
        this.lineClearingPlayers.forEach((clearData, playerNumber) => {
            const player = this.getPlayer(playerNumber);
            if (!player) {
                this.lineClearingPlayers.delete(playerNumber);
                return;
            }

            // Decrement timer (affected by timeScale since deltaTime is scaled)
            clearData.timer -= deltaTime * 1000;

            // Update visual progress for line clear animation
            player.lineClearEffect.progress = 1.0 - clearData.timer / TETRIS.TIMING.LINE_CLEAR_ANIMATION;

            // When timer expires, clear the lines
            if (clearData.timer <= 0) {
                player.clearLines(clearData.lines);
                this.lineClearingPlayers.delete(playerNumber);

                // Reset time scaling back to normal speed
                this.game.timeScale = 1.0;

                // Spawn new piece for this player
                if (!player.gameOver) {
                    player.spawnNewPiece();
                }
            }
        });
    }

    /**
     * Update garbage animations - adds garbage lines one at a time
     */
    updateGarbageAnimation(deltaTime) {
        this.garbageAnimation.forEach((animData, playerNumber) => {
            const player = this.getPlayer(playerNumber);
            if (!player) {
                this.garbageAnimation.delete(playerNumber);
                return;
            }

            // Decrement timer
            animData.timer -= deltaTime * 1000;

            // When timer reaches 0, add a garbage line
            if (animData.timer <= 0) {
                this.addSingleGarbageLine(playerNumber);
                animData.remaining--;

                // If more garbage lines remain, reset timer
                if (animData.remaining > 0) {
                    animData.timer = TETRIS.TIMING.GARBAGE_LINE_DELAY;
                } else {
                    // Animation complete, spawn new piece
                    this.garbageAnimation.delete(playerNumber);
                    if (!player.gameOver) {
                        player.canHold = true;
                        player.spawnNewPiece();
                    }
                }
            }
        });
    }

    /**
     * Check if any player has won or lost
     *
     * IMPORTANT: Remote players do NOT execute game logic - only local players run their own
     * game simulation. This means:
     * - Remote player knockouts are detected on THEIR machine (where they're local)
     * - They must send a network message to notify the opponent
     * - We cannot detect remote player game overs by checking their state locally
     */
    checkWinConditions() {
        const activePlayers = this.getActivePlayers();

        // Check if any player topped out
        // ONLY check collision for local players - remote players send gameOver via network
        const preKoAlive = this.getAlivePlayers().map((p) => p.playerNumber);

        this.players.forEach((player) => {
            // Skip collision check for remote players (they detect their own game over)
            if (player.isRemote) return;

            // Skip if already game over
            if (player.gameOver) return;

            // Check 1: Existing piece collision (normal top-out)
            if (player.currentPiece && player.currentY <= 3) {
                if (
                    this.game.checkPlayerCollision(
                        player.currentPiece,
                        player.currentX,
                        player.currentY,
                        player.currentRotation,
                        player.playerNumber
                    )
                ) {
                    player.gameOver = true;
                    player.screenShake = { intensity: 0, duration: 0 };

                    // Send gameOver message to opponent if networked
                    if (player.onGameOver) {
                        player.onGameOver();
                    }

                    // Update targeting for this KO
                    this.retargetAllFromKo(player.playerNumber);
                }
            }
        });

        // Handle single-player game over
        if (this.players.length === 1 && activePlayers.length === 0) {
            this.game.gameOverTransition.active = true;
            this.game.gameOverTransition.timer = 0;
            this.game.gameOverTransition.opacity = 0;
            this.game.gameState = "gameOver";
            this.game.playSound("game_over");

            // Clear screen shake for all players when game ends
            this.players.forEach((player) => {
                player.screenShake = { intensity: 0, duration: 0 };
            });
            return;
        }

        // Only check for wins in multiplayer modes (2+ players)
        if (this.players.length > 1 && activePlayers.length <= 1) {
            // CRITICAL: Before ending game, send gameOver message if local player lost
            this.players.forEach((player) => {
                if (player.gameOver && player.isLocal && player.onGameOver) {
                    // console.log("[GameManager] Local player lost, sending gameOver message to opponent");
                    player.onGameOver();
                }
            });

            this.endGame(activePlayers[0]?.playerNumber || null);

            // Clear screen shake for all players when game ends
            this.players.forEach((player) => {
                player.screenShake = { intensity: 0, duration: 0 };
            });
        }
    }

    /**
     * End the game and declare a winner
     */
    endGame(winnerPlayerNumber) {
        this.game.gameOverTransition.active = true;
        this.game.gameOverTransition.timer = 0;
        this.game.gameOverTransition.opacity = 0;
        this.gameState = "gameOver";
        this.winner = winnerPlayerNumber;
        this.game.gameState = "gameOver";
        // console.log(`Player ${winnerPlayerNumber} wins!`);
        this.game.playSound("victory");
    }

    /**
     * Handle when a player clears lines
     *
     * Uses Player's lastClearSpinType / lastClearLines and maintains
     * a proper Back-to-Back (B2B) chain flag on the player.
     *
     * Spin types from Player:
     *   lastClearSpinType:
     *     - 'none'
     *     - 'tspin'      (full T-Spin)
     *     - 'tspin_mini' (Mini T-Spin)
     */
    handlePlayerLineClear(player, lines) {
        const numLines = lines.length;
        const spinType = player.lastClearSpinType || "none"; // 'none' | 'tspin' | 'tspin_mini'

        // Classify clear
        const isTetris = spinType === "none" && numLines === 4;
        const isTSpin = spinType === "tspin";
        const isMiniTSpin = spinType === "tspin_mini";

        // Difficult clears are the ones that can maintain/benefit from B2B
        // (Guideline-style: Tetris, any T-Spin that clears 1+ lines, Mini T-Spin with lines.)
        const isDifficult = isTetris || (isTSpin && numLines >= 1) || (isMiniTSpin && numLines >= 1);

        let baseGarbage = 0;

        if (spinType === "none") {
            switch (numLines) {
                case 1:
                    baseGarbage = 0;
                    break;
                case 2:
                    baseGarbage = 1;
                    break;
                case 3:
                    baseGarbage = 2;
                    break;
                case 4:
                    baseGarbage = 4;
                    break; // Tetris
            }
        } else if (isMiniTSpin) {
            switch (numLines) {
                case 1:
                    baseGarbage = 1;
                    break; // Mini T-Spin Single
                case 2:
                    baseGarbage = 2;
                    break; // Mini T-Spin Double
                default:
                    baseGarbage = 0;
                    break; // 0-line or others: 0
            }
        } else if (isTSpin) {
            switch (numLines) {
                case 1:
                    baseGarbage = 2;
                    break; // T-Spin Single
                case 2:
                    baseGarbage = 4;
                    break; // T-Spin Double
                case 3:
                    baseGarbage = 6;
                    break; // T-Spin Triple
                default:
                    baseGarbage = 0;
                    break; // 0-line: 0
            }
        }

        // Compute garbage to send
        let garbageToSend = baseGarbage;

        // Snapshot previous B2B state BEFORE this clear
        const wasBackToBack = !!player.backToBack;

        // Update B2B chain based on this clear
        if (isDifficult) {
            // Start or keep chain alive
            player.backToBack = true;
        } else {
            // Break chain on any non-difficult clear
            player.backToBack = false;
        }

        // A true Back-to-Back clear requires:
        // - This clear is difficult
        // - We were already in B2B before this clear
        const isBackToBackClear = isDifficult && wasBackToBack;

        // Apply B2B garbage bonus: +1 ONLY for true B2B difficult clears
        if (isBackToBackClear && garbageToSend > 0) {
            garbageToSend = baseGarbage + 1;
        }

        // PERFECT CLEAR DETECTION
        // Simulate the grid after this clear to check if it will be completely empty.
        let isPerfectClear = false;
        if (numLines > 0) {
            const sortedLines = [...lines].sort((a, b) => a - b);
            const clearedCount = sortedLines.length;
            const newGrid = [];

            // For each row from top to bottom:
            for (let y = 0; y < TETRIS.GRID.ROWS; y++) {
                // If this row is cleared, we don't copy it; it will be replaced at the top.
                if (sortedLines.includes(y)) {
                    continue;
                }
                newGrid.push([...player.grid[y]]);
            }

            // Add empty rows at the top equal to the number of cleared lines
            for (let i = 0; i < clearedCount; i++) {
                const emptyRow = new Array(TETRIS.GRID.COLS).fill(null);
                newGrid.unshift(emptyRow);
            }

            // If every cell is null after this transformation, it's a Perfect Clear.
            let allEmpty = true;
            outer: for (let y = 0; y < newGrid.length; y++) {
                for (let x = 0; x < TETRIS.GRID.COLS; x++) {
                    if (newGrid[y][x] !== null) {
                        allEmpty = false;
                        break outer;
                    }
                }
            }

            isPerfectClear = allEmpty;
        }

        // Route garbage:
        // - For 1P/2P: legacy behavior (all-vs-one; effectively "other player" only).
        // - For 3-4P: use targeting; each player has exactly one current target.
        if (garbageToSend > 0) {
            if (this.players.length <= 2) {
                // Legacy: send to all other alive players (practically one opponent).
                this.players.forEach((otherPlayer) => {
                    if (otherPlayer.playerNumber !== player.playerNumber && !otherPlayer.gameOver) {
                        this.sendGarbage(player.playerNumber, otherPlayer.playerNumber, garbageToSend);
                    }
                });
            } else {
                // 3-4P targeting behavior
                const attackerNumber = player.playerNumber;
                let target = this.targetMap.get(attackerNumber);

                // If no valid target (or target KO'd), recompute once.
                if (
                    !target ||
                    target === attackerNumber ||
                    !this.getPlayer(target) ||
                    this.getPlayer(target).gameOver
                ) {
                    target = this.getNextTargetPlayer(attackerNumber);
                    if (target !== null) {
                        this.targetMap.set(attackerNumber, target);
                    }
                }

                if (target !== null) {
                    this.sendGarbage(attackerNumber, target, garbageToSend);
                }
            }
        }

        // SCORING (guideline-style using TETRIS.SCORING)
        const S = TETRIS.SCORING;
        let baseScore = 0;

        if (spinType === "none") {
            // Normal line clears
            switch (numLines) {
                case 1:
                    baseScore = S.SINGLE;
                    break;
                case 2:
                    baseScore = S.DOUBLE;
                    break;
                case 3:
                    baseScore = S.TRIPLE;
                    break;
                case 4:
                    baseScore = S.TETRIS;
                    break;
            }
        } else if (isMiniTSpin) {
            // Mini T-Spins
            switch (numLines) {
                case 0:
                    baseScore = S.TSPIN_MINI_0;
                    break;
                case 1:
                    baseScore = S.TSPIN_MINI_SINGLE;
                    break;
                case 2:
                    baseScore = S.TSPIN_MINI_DOUBLE;
                    break;
            }
        } else if (isTSpin) {
            // Full T-Spins
            switch (numLines) {
                case 0:
                    baseScore = S.TSPIN_0;
                    break;
                case 1:
                    baseScore = S.TSPIN_SINGLE;
                    break;
                case 2:
                    baseScore = S.TSPIN_DOUBLE;
                    break;
                case 3:
                    baseScore = S.TSPIN_TRIPLE;
                    break;
            }
        }

        // Back-to-back score multiplier for difficult clears:
        // Only apply when this clear is truly B2B (same condition as isBackToBackClear).
        // This multiplier is for score only; B2B garbage bonus is handled separately above.
        if (isBackToBackClear && baseScore > 0 && S.B2B_MULTIPLIER) {
            baseScore *= S.B2B_MULTIPLIER;
        }

        // Combo bonus (scaled by level)
        if (player.combo > 0 && S.COMBO_BASE) {
            baseScore += S.COMBO_BASE * player.combo * player.level;
        }

        // Perfect Clear bonus (flat 1800) - applied AFTER base + combo, BEFORE level multiplier.
        if (isPerfectClear) {
            baseScore += 1800;
        }

        // Apply level multiplier last (standard guideline behavior)
        baseScore *= player.level;

        player.score += Math.floor(baseScore);
        player.lines += numLines;
        player.combo++;

        // If Perfect Clear, apply bonus garbage:
        // - For 1P/2P: unchanged - send +10 to the opponent.
        // - For 3-4P: minimal design = respect current target (no global fanout).
        if (isPerfectClear) {
            if (this.players.length <= 2) {
                this.players.forEach((otherPlayer) => {
                    if (otherPlayer.playerNumber !== player.playerNumber && !otherPlayer.gameOver) {
                        this.sendGarbage(player.playerNumber, otherPlayer.playerNumber, 10);
                    }
                });
            } else {
                const attackerNumber = player.playerNumber;
                let target = this.targetMap.get(attackerNumber);

                if (
                    !target ||
                    target === attackerNumber ||
                    !this.getPlayer(target) ||
                    this.getPlayer(target).gameOver
                ) {
                    target = this.getNextTargetPlayer(attackerNumber);
                    if (target !== null) {
                        this.targetMap.set(attackerNumber, target);
                    }
                }

                if (target !== null) {
                    this.sendGarbage(attackerNumber, target, 10);
                }
            }
        }

        // Level up check
        const newLevel = Math.floor(player.lines / 10) + 1;
        if (newLevel > player.level) {
            player.level = newLevel;
            player.handleLevelUp();
        }

        // Audio/FX selection
        if (isPerfectClear) {
            // Stronger feedback for Perfect Clear
            this.game.playSound("line_clear");
            player.screenShake = { intensity: 10, duration: 0.4 };
        } else if (isTSpin && numLines > 0) {
            this.game.playSound("line_clear"); // You may want dedicated T-Spin sounds
            player.screenShake = { intensity: 8, duration: 0.3 };
        } else if (isTetris) {
            this.game.playSound("tetris");
            player.screenShake = { intensity: 8, duration: 0.3 };

            // Notify theme of tetris event
            const theme = this.game.themeManager.getCurrentTheme();
            if (theme && theme.handleGameEvent) {
                theme.handleGameEvent('tetris', { player: player, lines: numLines });
            }
        } else {
            this.game.playSound("line_clear");
            player.screenShake = { intensity: 4, duration: 0.2 };
        }

        // Time scaling: preserve original feel, but base it on lines cleared
        const fullSlowdown = 0.25;
        let slowdownPercent;
        switch (numLines) {
            case 1:
                slowdownPercent = 0.1;
                break;
            case 2:
                slowdownPercent = 0.2;
                break;
            case 3:
                slowdownPercent = 0.5;
                break;
            case 4:
                slowdownPercent = 1.0;
                break;
            default:
                slowdownPercent = 1.0;
                break;
        }
        this.game.timeScale = fullSlowdown + (1.0 - fullSlowdown) * (1.0 - slowdownPercent);

        // Visual line clear effect
        // Pass clearType so renderer can show "T-SPIN SINGLE/DOUBLE/TRIPLE" style labels.
        let clearType = "none";

        if (isPerfectClear) {
            clearType = "perfect_clear";
        } else if (isTSpin || isMiniTSpin) {
            if (numLines === 0) {
                clearType = "tspin_0";
            } else if (numLines === 1) {
                clearType = "tspin_single";
            } else if (numLines === 2) {
                clearType = "tspin_double";
            } else if (numLines === 3) {
                clearType = "tspin_triple";
            } else {
                clearType = "tspin";
            }
        } else if (isTetris) {
            clearType = "tetris";
        } else {
            // Standard non-spin clears by line count
            if (numLines === 1) clearType = "single";
            else if (numLines === 2) clearType = "double";
            else if (numLines === 3) clearType = "triple";
            else if (numLines === 4) clearType = "tetris";
        }

        
        // Set up line clear effect
        player.lineClearEffect = {
            active: true,
            lines: lines,
            progress: 0,
            clearType: clearType,
            isBackToBack: !!isBackToBackClear,
            isPerfectClear: !!isPerfectClear
        };
        
        // Set up SEPARATE T-SPIN text effect if this is a T-spin
        if (isTSpin || isMiniTSpin) {
            player.tSpinTextEffect = {
                active: true,
                progress: 0,
                duration: 800,
                clearType: clearType
            };
        }

        // Register player in line clearing map
        this.lineClearingPlayers.set(player.playerNumber, {
            timer: TETRIS.TIMING.LINE_CLEAR_ANIMATION,
            lines: lines
        });
    }

    /**
     * Handle 0-line T-spins - show visual and score without blocking gameplay
     */
    handleTSpinNoLines(player, spinType) {
        // Set up ONLY the T-SPIN text effect (no line clearing needed)
        player.tSpinTextEffect = {
            active: true,
            progress: 0,
            duration: 800,
            clearType: 'tspin_0'
        };
        
        // Score the 0-line T-spin
        const S = TETRIS.SCORING;
        let baseScore = spinType === 'tspin' ? S.TSPIN_0 : S.TSPIN_MINI_0;
        baseScore *= player.level;
        player.score += Math.floor(baseScore);
        
        // 0-line T-spins don't break combo or trigger B2B
        // Just spawn the next piece immediately
        player.canHold = true;
        player.spawnNewPiece();
    }

    /**
     * Draw all players with appropriate layouts
     */
    draw() {
        // Don't draw if we're at the main menu (but allow drawing during pause/game over)
        if (this.game.gameState === "title") {
            return;
        }

        const theme = this.game.themeManager.getCurrentTheme();
        const renderer = new GameRenderer(this.game);
        this.layoutManager.setPlayerCount(this.players.length);

        this.players.forEach((player) => {
            if (player.currentPiece || player.gameOver) {
                const layout = this.layoutManager.getPlayerLayout(player.playerNumber);

                // UNIFIED: Same rendering method for all players
                this.drawPlayerUnified(player, theme, renderer, layout);

                // Draw player label (using configurable layout settings)
                if (
                    layout.ui.playerLabel.enabled &&
                    (!layout.ui.playerLabel.showOnlyInMultiplayer || this.players.length > 1)
                ) {
                    const ctx = this.game.gameCtx;
                    const labelConfig = layout.ui.playerLabel;

                    // Generate appropriate label text based on player type
                    let labelText;

                    if (player.username) {
                        // NetworkedPlayer with username
                        labelText = player.username;
                    } else if (player.thinkingTimer !== undefined && player.difficulty) {
                        // CPU player - format as "CPU1 (Easy)", "CPU2 (Medium)", etc.
                        const difficultyCapitalized =
                            player.difficulty.charAt(0).toUpperCase() + player.difficulty.slice(1);
                        labelText = `CPU${player.playerNumber} (${difficultyCapitalized})`;
                    } else {
                        // Default player label
                        labelText = labelConfig.template.replace("{number}", player.playerNumber);
                    }

                    // Apply styling from configuration
                    ctx.fillStyle = labelConfig.color;
                    ctx.font = `${labelConfig.fontWeight} ${labelConfig.fontSize} ${labelConfig.fontFamily}`;
                    ctx.textAlign = labelConfig.alignment;

                    // Calculate position based on ACTUAL rendered dimensions + offset
                    const actualWidth = layout.gameArea.cellSize * TETRIS.GRID.COLS;
                    const centerX = layout.gameArea.x + actualWidth / 2;
                    const centerY = layout.gameArea.y;
                    const x = centerX + labelConfig.position.x;
                    const y = centerY + labelConfig.position.y;

                    ctx.fillText(labelText, x, y);
                }

                // Draw garbage toggle indicator for networked players - always show this
                if (player.garbageEnabled !== undefined) {
                    // Position above each player's game area
                    const actualWidth = layout.gameArea.cellSize * TETRIS.GRID.COLS;
                    const centerX = layout.gameArea.x + actualWidth / 2;
                    const indicatorY = layout.gameArea.y + 420;
                    const indicatorText = player.garbageEnabled ? 'SEND GARBAGE ON' : 'SEND GARBAGE OFF';
                    const indicatorColor = player.garbageEnabled ? '#00FF00' : '#FF0000';
                    
                    // Create utils for game canvas (drawTextBackdrop needs the right context)
                    const gameUtils = new UIRenderUtils(this.game.gameCtx);
                    gameUtils.drawTextBackdrop(
                        indicatorText,
                        centerX,
                        indicatorY,
                        'bold 14px Arial',
                        indicatorColor,
                        theme,
                        2
                    );
                }
            }
        });
    }

    /**
     * Draw player using unified rendering system (layout-driven)
     */
    drawPlayerUnified(player, theme, renderer, layout) {
        // Create a temporary game object for rendering
        const tempGame = {
            grid: player.grid,
            currentPiece: player.currentPiece,
            currentX: player.currentX,
            currentY: player.currentY,
            currentRotation: player.currentRotation,
            ghostY: player.ghostY,
            gameState: player.gameOver ? "gameOver" : "playing",
            gameSettings: this.game.gameSettings,
            lockFlash: player.lockFlash,
            spawnFlash: player.spawnFlash,
            justLockedPositions: player.justLockedPositions,
            lineClearEffect: player.lineClearEffect,
            tSpinTextEffect: player.tSpinTextEffect,
            levelUpAnimationTimer: player.levelUpAnimationTimer,
            level: player.level,
            // CRITICAL: Don't render current piece during garbage animation
            isReceivingGarbage: this.garbageAnimation.has(player.playerNumber)
        };

        // UNIFIED: Always use layout + cellSize for both single and multiplayer.
        const cellSize = layout.gameArea.cellSize;
 
        renderer.drawGameLayerAt(
            tempGame,
            theme,
            player.screenShake,
            { active: false },
            layout.gameArea.x,
            layout.gameArea.y,
            cellSize
        );
    }

    /**
     * Get the winner (for game over state)
     */
    getWinner() {
        return this.winner;
    }

    /**
     * Check if the game is over
     */
    isGameOver() {
        return this.gameState === "gameOver";
    }

    /**
     * Reset the entire game
     */
    reset() {
        this.players.forEach((player) => player.reset());
        this.gameState = "playing";
        this.winner = null;
        this.lineClearingPlayers.clear();
        this.pendingGarbage.clear();
        this.garbageAnimation.clear();
        this.lastHolePositions.clear();
        this.targetMap.clear();
        this.spawnInitialPieces();
        this.initializeTargets();
    }
}

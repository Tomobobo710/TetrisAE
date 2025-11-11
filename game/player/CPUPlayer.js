// Make CPUPlayer globally available
window.CPUPlayer = class CPUPlayer {
    constructor(playerNumber, difficulty, gameSettings, game) {
        console.log(`Creating CPU Player ${playerNumber} with ${difficulty} difficulty...`);

        this.playerNumber = playerNumber;
        this.difficulty = difficulty;
        this.game = game;

        // Create the core Player instance that handles all Tetris game mechanics
        this.playerInstance = new Player(playerNumber, gameSettings, game);

        // AI-specific state
        this.thinkingTimer = 0;
        this.currentStrategy = null;
        this.nextActionDelay = 0;

        // Battle AI state
        this.lastClearWasTetrisOrTspin = false; // For back-to-back tracking
        this.targetWellColumn = 9; // 0 = left, 9 = right for Tetris well

        // Difficulty-specific parameters
        this.setDifficultyParameters();

        console.log(`🎮 Battle AI initialized - ${difficulty} mode - Ready to destroy!`);
    }

    /**
     * Set AI parameters based on difficulty level
     */
    setDifficultyParameters() {
        switch (this.difficulty) {
            case "easy":
                this.thinkingInterval = 250;
                this.reactionDelay = 120;
                this.mistakeRate = 0.15;
                this.aggressionLevel = 0.5; // 50% aggressive, 50% safe
                this.tetrisBuilding = false; // Don't build Tetrises
                this.tSpinAwareness = false; // No T-spin setups
                this.lookaheadDepth = 3; // Look at next 3 pieces
                break;

            case "medium":
                this.thinkingInterval = 180;
                this.reactionDelay = 70;
                this.mistakeRate = 0.08;
                this.aggressionLevel = 0.7; // 70% aggressive
                this.tetrisBuilding = true; // Build Tetrises when safe
                this.tSpinAwareness = false; // Basic T-spin recognition
                this.lookaheadDepth = 4; // Look at next 4 pieces
                break;

            case "hard":
                this.thinkingInterval = 120;
                this.reactionDelay = 35;
                this.mistakeRate = 0.0;
                this.aggressionLevel = 0.85; // 85% aggressive
                this.tetrisBuilding = true; // Always build Tetrises
                this.tSpinAwareness = true; // Actively setup T-spins
                this.lookaheadDepth = 5; // Look at all 5 next pieces
                break;
        }
    }

    /**
     * Main AI update loop - called every frame
     */
    update(deltaTime) {
        if (!this.playerInstance.currentPiece || this.playerInstance.gameOver) {
            return;
        }

        // Update the core player instance (handles physics/timing)
        this.playerInstance.updateGameplay(deltaTime);
        this.playerInstance.updateVisualEffects(deltaTime);

        // AI decision making timer
        this.thinkingTimer += deltaTime * 1000;

        if (this.thinkingTimer >= this.thinkingInterval) {
            this.thinkingTimer = 0;
            this.makeDecision();
        }

        // Execute current strategy
        if (this.currentStrategy) {
            this.executeStrategy(deltaTime);
        }
    }

    /**
     * Make high-level AI decisions about piece placement
     * BATTLE-FOCUSED: Maximize garbage sent to opponent
     */
    makeDecision() {
        if (!this.playerInstance.currentPiece) return;

        // Analyze current situation
        const situation = this.analyzeSituation();

        // Determine strategy mode based on danger level
        const strategyMode = this.determineStrategyMode(situation);

        // Find best move using battle-optimized evaluation
        const bestMove = this.findBestBattleMove(strategyMode, situation);

        if (bestMove) {
            this.currentStrategy = {
                targetX: bestMove.x,
                targetRotation: bestMove.rotation,
                useHold: bestMove.useHold,
                urgency: situation.urgency,
                expectedGarbage: bestMove.garbageSent
            };
        }
    }

    /**
     * Analyze current board situation
     */
    analyzeSituation() {
        const heights = this.getColumnHeights(this.playerInstance.grid);
        const maxHeight = Math.max(...heights);
        const avgHeight = heights.reduce((a, b) => a + b, 0) / heights.length;
        const holes = this.countHoles(this.playerInstance.grid);

        // Check if we have Tetris well setup
        const hasCleanWell = this.hasCleanTetrisWell();
        const iPieceInQueue = this.scanQueueForPiece("I");

        return {
            maxHeight: maxHeight,
            avgHeight: avgHeight,
            holes: holes,
            urgency: maxHeight > 16 ? "critical" : maxHeight > 12 ? "high" : maxHeight > 8 ? "medium" : "low",
            hasCleanWell: hasCleanWell,
            iPieceInQueue: iPieceInQueue,
            nextQueue: this.playerInstance.nextQueue.slice(0, this.lookaheadDepth)
        };
    }

    /**
     * Determine what strategy mode to use
     */
    determineStrategyMode(situation) {
        // CRITICAL: Just survive, clear anything
        if (situation.urgency === "critical") {
            return "survival";
        }

        // HIGH danger: Be more careful but still aggressive
        if (situation.urgency === "high") {
            return Math.random() < 0.7 ? "aggressive" : "survival";
        }

        // Safe: Full aggression - build for big clears
        if (situation.urgency === "low" || situation.urgency === "medium") {
            // If we can build Tetris and I-piece is coming, do it
            if (this.tetrisBuilding && situation.iPieceInQueue !== -1 && situation.iPieceInQueue <= 3) {
                return "tetris";
            }

            // If T-piece and can setup T-spin, do it
            if (this.tSpinAwareness && this.playerInstance.currentPiece === "T") {
                return "tspin";
            }

            // Default: aggressive garbage maximization
            return Math.random() < this.aggressionLevel ? "aggressive" : "balanced";
        }

        return "balanced";
    }

    /**
     * Find the best move optimized for battle (maximize garbage)
     */
    findBestBattleMove(strategyMode, situation) {
        const currentPiece = this.playerInstance.currentPiece;
        const heldPiece = this.playerInstance.heldPiece;

        let bestScore = -Infinity;
        let bestMove = null;

        // Evaluate all placements of current piece
        const currentMoves = this.generateAllMoves(currentPiece);

        for (const move of currentMoves) {
            const score = this.evaluateBattleMove(move, strategyMode, situation);

            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        // Consider holding piece
        if (this.playerInstance.canHold) {
            // SPECIAL: If current piece is I and we're building Tetris, check if we should hold it
            if (currentPiece === "I" && this.tetrisBuilding && strategyMode === "tetris") {
                const wellReady = this.hasCleanTetrisWell();

                // If well NOT ready, strongly prefer holding the I-piece
                if (!wellReady && heldPiece !== "I" && situation.nextQueue.length > 0) {
                    const nextPiece = situation.nextQueue[0];
                    const nextMoves = this.generateAllMoves(nextPiece);

                    for (const move of nextMoves) {
                        const score = this.evaluateBattleMove(move, strategyMode, situation) * 1.2; // Bonus for holding I

                        if (score > bestScore) {
                            bestScore = score;
                            bestMove = { ...move, useHold: true };
                        }
                    }
                }
            }

            // If hold is empty, consider holding current piece to get next piece
            if (
                heldPiece === null &&
                situation.nextQueue.length > 0 &&
                !(currentPiece === "I" && strategyMode === "tetris")
            ) {
                const nextPiece = situation.nextQueue[0];
                const nextMoves = this.generateAllMoves(nextPiece);

                for (const move of nextMoves) {
                    const score = this.evaluateBattleMove(move, strategyMode, situation) * 0.95; // Slight penalty for holding

                    if (score > bestScore) {
                        bestScore = score;
                        bestMove = { ...move, useHold: true };
                    }
                }
            }
            // If hold has piece, consider swapping
            else if (heldPiece !== null) {
                // SPECIAL: If we have I-piece in hold and well is ready, SWAP TO IT!
                if (heldPiece === "I" && this.tetrisBuilding && strategyMode === "tetris") {
                    const wellReady = this.hasCleanTetrisWell();

                    if (wellReady) {
                        const holdMoves = this.generateAllMoves(heldPiece);

                        for (const move of holdMoves) {
                            const score = this.evaluateBattleMove(move, strategyMode, situation) * 1.5; // Big bonus for using held I

                            if (score > bestScore) {
                                bestScore = score;
                                bestMove = { ...move, useHold: true };
                            }
                        }
                    }
                }

                // General hold swapping
                const holdMoves = this.generateAllMoves(heldPiece);

                for (const move of holdMoves) {
                    const score = this.evaluateBattleMove(move, strategyMode, situation);

                    if (score > bestScore) {
                        bestScore = score;
                        bestMove = { ...move, useHold: true };
                    }
                }
            }
        }

        // Apply mistake rate
        if (Math.random() < this.mistakeRate && currentMoves.length > 1) {
            return currentMoves[Math.floor(Math.random() * Math.min(5, currentMoves.length))];
        }

        return bestMove;
    }

    /**
     * Evaluate a move for battle effectiveness (garbage sent)
     */
    evaluateBattleMove(move, strategyMode, situation) {
        const gridAfterMove = this.simulatePlacement(move);
        if (!gridAfterMove) return -100000;

        // Calculate garbage that would be sent
        const garbageSent = this.calculateGarbageSent(move, gridAfterMove);
        move.garbageSent = garbageSent;

        // Base evaluation depends on strategy mode
        let score = 0;

        switch (strategyMode) {
            case "survival":
                // In survival mode, any line clear is good, height matters most
                score = this.evaluateSurvival(gridAfterMove, garbageSent);
                break;

            case "tetris":
                // Building for Tetris - maintain well, wait for I-piece
                score = this.evaluateTetrisBuilding(gridAfterMove, move, situation);
                break;

            case "tspin":
                // T-spin setup opportunity
                score = this.evaluateTSpinSetup(gridAfterMove, move, situation);
                break;

            case "aggressive":
                // Maximize immediate garbage, prefer big clears
                score = this.evaluateAggressive(gridAfterMove, garbageSent, situation);
                break;

            case "balanced":
            default:
                // Balance between garbage and safety
                score = this.evaluateBalanced(gridAfterMove, garbageSent, situation);
                break;
        }

        // Look ahead at queue to see if this enables future opportunities
        if (situation.nextQueue.length > 0) {
            const futureScore = this.evaluateFuturePotential(gridAfterMove, situation.nextQueue);
            score += futureScore * 0.3; // 30% weight on future potential
        }

        return score;
    }

    /**
     * Calculate how much garbage this move would send
     */
    calculateGarbageSent(move, gridAfterMove) {
        const linesCleared = this.countLinesBeforeClearing(this.playerInstance.grid, move);

        if (linesCleared === 0) return 0;

        let garbage = 0;

        // Base garbage by lines cleared
        switch (linesCleared) {
            case 1:
                garbage = 0;
                break; // Singles send NO garbage
            case 2:
                garbage = 1;
                break; // Double
            case 3:
                garbage = 2;
                break; // Triple
            case 4:
                garbage = 4;
                break; // TETRIS!
        }

        // Check for T-spin
        if (move.pieceType === "T") {
            const isTSpin = this.detectTSpin(move, this.playerInstance.grid);
            if (isTSpin) {
                // T-spin garbage
                switch (linesCleared) {
                    case 1:
                        garbage = 2;
                        break; // T-spin single
                    case 2:
                        garbage = 4;
                        break; // T-spin double
                    case 3:
                        garbage = 6;
                        break; // T-spin triple
                }
            }
        }

        // Back-to-back bonus
        if (this.lastClearWasTetrisOrTspin && (linesCleared === 4 || move.pieceType === "T")) {
            garbage += 1; // +1 garbage for back-to-back
        }

        return garbage;
    }

    /**
     * Evaluate move in survival mode - just stay alive
     */
    evaluateSurvival(grid, garbageSent) {
        const heights = this.getColumnHeights(grid);
        const maxHeight = Math.max(...heights);
        const holes = this.countHoles(grid);
        const bumpiness = this.calculateBumpiness(grid);

        return (
            -maxHeight * 10 + // Minimize height aggressively
            garbageSent * 20 + // Still try to send garbage if possible
            -holes * 15 + // Avoid holes (increased penalty)
            -bumpiness * 2 // Keep it smooth
        );
    }

    /**
     * Evaluate move for Tetris building strategy
     */
    evaluateTetrisBuilding(grid, move, situation) {
        const heights = this.getColumnHeights(grid);
        const wellColumn = this.targetWellColumn;
        const wellHeight = heights[wellColumn];
        const otherHeights = heights.filter((_, i) => i !== wellColumn);
        const avgOtherHeight = otherHeights.reduce((a, b) => a + b, 0) / otherHeights.length;

        let score = 0;

        // If this is the I-piece and we have a clean well, TAKE IT!
        if (move.pieceType === "I" && wellHeight < avgOtherHeight - 3) {
            const wouldClearFour = this.countLinesBeforeClearing(this.playerInstance.grid, move) === 4;
            if (wouldClearFour) {
                return 500000; // MEGA JACKPOT - This is a Tetris!
            }
        }

        // If not I-piece, DON'T fill the well column
        if (move.pieceType !== "I") {
            const fillsWell = this.moveCoversColumn(move, wellColumn);
            if (fillsWell) {
                score -= 5000; // Heavy penalty for filling Tetris well
            }
        }

        // Reward maintaining clean well structure
        const wellDiff = avgOtherHeight - wellHeight;
        score += wellDiff * 100; // Big reward for good well depth

        // Reward flat stacking on non-well columns
        const nonWellBumpiness = this.calculateBumpinessExcludingColumn(grid, wellColumn);
        score -= nonWellBumpiness * 10;

        // Penalty for holes
        const holes = this.countHoles(grid);
        score -= holes * 150; // Heavy penalty - holes ruin Tetris setups

        // Still value clearing lines when possible
        score += move.garbageSent * 30;

        return score;
    }

    /**
     * Evaluate T-spin setup opportunity
     */
    evaluateTSpinSetup(grid, move, situation) {
        if (move.pieceType !== "T") return -100000;

        const isTSpin = this.detectTSpin(move, this.playerInstance.grid);
        const linesCleared = this.countLinesBeforeClearing(this.playerInstance.grid, move);

        if (isTSpin && linesCleared >= 1) {
            // This IS a T-spin! Jackpot!
            return 50000 + linesCleared * 10000;
        }

        // Check if this sets up a future T-spin
        const setsUpTSpin = this.checksTSpinSetup(grid, situation.nextQueue);
        if (setsUpTSpin) {
            return 20000; // Good setup for future T-spin
        }

        // Not a T-spin, evaluate normally
        return this.evaluateBalanced(grid, move.garbageSent, situation);
    }

    /**
     * Evaluate aggressive play - maximize immediate garbage
     */
    evaluateAggressive(grid, garbageSent, situation) {
        const heights = this.getColumnHeights(grid);
        const maxHeight = Math.max(...heights);
        const holes = this.countHoles(grid);

        return (
            garbageSent * 1000 + // HEAVILY prioritize garbage sent
            -maxHeight * 2 + // Keep height reasonable
            -holes * 60 // Avoid holes (increased penalty)
        );
    }

    /**
     * Evaluate balanced play
     */
    evaluateBalanced(grid, garbageSent, situation) {
        const heights = this.getColumnHeights(grid);
        const aggregateHeight = heights.reduce((a, b) => a + b, 0);
        const holes = this.countHoles(grid);
        const bumpiness = this.calculateBumpiness(grid);

        return (
            garbageSent * 500 + // Good weight on garbage
            -aggregateHeight * 2 + // Keep total height down
            -holes * 90 + // Penalize holes (increased penalty)
            -bumpiness * 5 // Keep smooth
        );
    }

    /**
     * Evaluate future potential based on upcoming pieces
     */
    evaluateFuturePotential(grid, nextQueue) {
        let potential = 0;

        // Check if board is setup for big clears with upcoming pieces
        const heights = this.getColumnHeights(grid);
        const avgHeight = heights.reduce((a, b) => a + b, 0) / heights.length;

        // If I-piece is coming and we have good height, bonus
        const iPieceIndex = nextQueue.indexOf("I");
        if (iPieceIndex !== -1 && avgHeight >= 8) {
            potential += (5 - iPieceIndex) * 100; // Earlier I-piece = more bonus
        }

        // If T-piece coming soon and we have potential T-spin setup
        const tPieceIndex = nextQueue.indexOf("T");
        if (tPieceIndex !== -1 && tPieceIndex <= 2) {
            // Simple check: do we have potential T-spin shapes?
            potential += 50;
        }

        return potential;
    }

    /**
     * Check if we have a clean Tetris well setup
     */
    hasCleanTetrisWell() {
        const heights = this.getColumnHeights(this.playerInstance.grid);
        const wellColumn = this.targetWellColumn;
        const wellHeight = heights[wellColumn];

        // Check if well is at least 4 rows lower than average
        const otherHeights = heights.filter((_, i) => i !== wellColumn);
        const avgOther = otherHeights.reduce((a, b) => a + b, 0) / otherHeights.length;

        return avgOther - wellHeight >= 4;
    }

    /**
     * Scan queue for specific piece, return index (-1 if not found)
     */
    scanQueueForPiece(pieceType) {
        const queue = this.playerInstance.nextQueue.slice(0, this.lookaheadDepth);
        return queue.indexOf(pieceType);
    }

    /**
     * Check if a move covers a specific column
     */
    moveCoversColumn(move, column) {
        const matrix = this.game.getRotatedPiece(move.pieceType, move.rotation);
        const size = matrix.length;

        for (let dy = 0; dy < size; dy++) {
            for (let dx = 0; dx < size; dx++) {
                if (matrix[dy][dx]) {
                    const gridX = move.x + dx;
                    if (gridX === column) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    /**
     * Calculate bumpiness excluding one column
     */
    calculateBumpinessExcludingColumn(grid, excludeCol) {
        const heights = this.getColumnHeights(grid);
        let bumpiness = 0;

        for (let x = 0; x < heights.length - 1; x++) {
            if (x === excludeCol || x + 1 === excludeCol) continue;
            bumpiness += Math.abs(heights[x] - heights[x + 1]);
        }

        return bumpiness;
    }

    /**
     * Detect if a T-piece placement is a T-spin
     */
    detectTSpin(move, grid) {
        if (move.pieceType !== "T") return false;

        // T-spin detection: Check if T is locked in place with 3+ corners filled
        const corners = [
            { dx: 0, dy: 0 },
            { dx: 2, dy: 0 },
            { dx: 0, dy: 2 },
            { dx: 2, dy: 2 }
        ];

        let filledCorners = 0;
        for (const corner of corners) {
            const checkX = move.x + corner.dx;
            const checkY = move.y + corner.dy;

            if (checkX < 0 || checkX >= TETRIS.GRID.COLS || checkY < 0 || checkY >= TETRIS.GRID.ROWS) {
                filledCorners++; // Walls count as filled
            } else if (grid[checkY] && grid[checkY][checkX] !== null) {
                filledCorners++;
            }
        }

        return filledCorners >= 3;
    }

    /**
     * Check if current board sets up a T-spin for future
     */
    checksTSpinSetup(grid, nextQueue) {
        // Simple check: are there T-spin shaped holes?
        // This is a placeholder - full T-spin detection is complex
        return false; // TODO: Implement advanced T-spin setup detection
    }

    /**
     * Count how many lines would be cleared by a move (before simulation)
     */
    countLinesBeforeClearing(grid, move) {
        const matrix = this.game.getRotatedPiece(move.pieceType, move.rotation);
        const size = matrix.length;
        const affectedRows = new Set();

        // Find which rows the piece touches
        for (let dy = 0; dy < size; dy++) {
            for (let dx = 0; dx < size; dx++) {
                if (matrix[dy][dx]) {
                    const gridY = move.y + dy;
                    if (gridY >= 0 && gridY < TETRIS.GRID.ROWS) {
                        affectedRows.add(gridY);
                    }
                }
            }
        }

        // Check which affected rows would become complete
        let linesCleared = 0;
        for (const row of affectedRows) {
            let complete = true;
            let filledCount = 0;

            for (let x = 0; x < TETRIS.GRID.COLS; x++) {
                // Count existing blocks
                if (grid[row][x] !== null) {
                    filledCount++;
                }
                // Check if piece would fill this spot
                else {
                    let pieceFillsHere = false;
                    for (let dy = 0; dy < size; dy++) {
                        for (let dx = 0; dx < size; dx++) {
                            if (matrix[dy][dx] && move.x + dx === x && move.y + dy === row) {
                                pieceFillsHere = true;
                                filledCount++;
                                break;
                            }
                        }
                        if (pieceFillsHere) break;
                    }
                }
            }

            if (filledCount === TETRIS.GRID.COLS) {
                linesCleared++;
            }
        }

        return linesCleared;
    }

    /**
     * Generate all possible moves (rotation + position) for a piece
     */
    generateAllMoves(pieceType) {
        const moves = [];

        // Try all 4 rotations
        for (let rotation = 0; rotation < 4; rotation++) {
            const matrix = this.game.getRotatedPiece(pieceType, rotation);
            const size = matrix.length;

            // Try all possible X positions
            for (let x = -size; x <= TETRIS.GRID.COLS; x++) {
                const landingY = this.findLandingY(pieceType, x, rotation);

                if (landingY !== null) {
                    moves.push({
                        pieceType: pieceType,
                        x: x,
                        y: landingY,
                        rotation: rotation,
                        useHold: false
                    });
                }
            }
        }

        return moves;
    }

    /**
     * Find where a piece would land if dropped
     */
    findLandingY(pieceType, x, rotation) {
        let y = 0;

        if (this.playerInstance.checkCollision(pieceType, x, y, rotation)) {
            return null;
        }

        while (!this.playerInstance.checkCollision(pieceType, x, y + 1, rotation)) {
            y++;
        }

        return y;
    }

    /**
     * Simulate placing a piece and return resulting grid
     */
    simulatePlacement(move) {
        const matrix = this.game.getRotatedPiece(move.pieceType, move.rotation);
        const size = matrix.length;
        const newGrid = this.playerInstance.grid.map((row) => [...row]);

        for (let dy = 0; dy < size; dy++) {
            for (let dx = 0; dx < size; dx++) {
                if (matrix[dy][dx]) {
                    const gridX = move.x + dx;
                    const gridY = move.y + dy;

                    if (gridX < 0 || gridX >= TETRIS.GRID.COLS || gridY < 0 || gridY >= TETRIS.GRID.ROWS) {
                        return null;
                    }

                    if (newGrid[gridY][gridX] !== null) {
                        return null;
                    }

                    newGrid[gridY][gridX] = move.pieceType;
                }
            }
        }

        this.clearLinesFromGrid(newGrid);
        return newGrid;
    }

    /**
     * Clear complete lines from a grid
     */
    clearLinesFromGrid(grid) {
        const linesToClear = [];

        for (let y = 0; y < TETRIS.GRID.ROWS; y++) {
            let complete = true;
            for (let x = 0; x < TETRIS.GRID.COLS; x++) {
                if (grid[y][x] === null) {
                    complete = false;
                    break;
                }
            }
            if (complete) linesToClear.push(y);
        }

        for (let i = linesToClear.length - 1; i >= 0; i--) {
            grid.splice(linesToClear[i], 1);
            grid.unshift(new Array(TETRIS.GRID.COLS).fill(null));
        }

        return linesToClear.length;
    }

    /**
     * Get column heights
     */
    getColumnHeights(grid) {
        const heights = new Array(TETRIS.GRID.COLS).fill(0);

        for (let x = 0; x < TETRIS.GRID.COLS; x++) {
            for (let y = 0; y < TETRIS.GRID.ROWS; y++) {
                if (grid[y][x] !== null) {
                    heights[x] = TETRIS.GRID.ROWS - y;
                    break;
                }
            }
        }

        return heights;
    }

    /**
     * Count holes in grid
     */
    countHoles(grid) {
        let holes = 0;
        const heights = this.getColumnHeights(grid);

        for (let x = 0; x < TETRIS.GRID.COLS; x++) {
            const colHeight = heights[x];
            if (colHeight > 0) {
                const topY = TETRIS.GRID.ROWS - colHeight;
                for (let y = topY; y < TETRIS.GRID.ROWS; y++) {
                    if (grid[y][x] === null) holes++;
                }
            }
        }

        return holes;
    }

    /**
     * Calculate bumpiness
     */
    calculateBumpiness(grid) {
        const heights = this.getColumnHeights(grid);
        let bumpiness = 0;

        for (let x = 0; x < heights.length - 1; x++) {
            bumpiness += Math.abs(heights[x] - heights[x + 1]);
        }

        return bumpiness;
    }

    /**
     * Calculate urgency level
     */
    calculateUrgency() {
        const heights = this.getColumnHeights(this.playerInstance.grid);
        const maxHeight = Math.max(...heights);

        if (maxHeight > 16) return "critical";
        if (maxHeight > 12) return "high";
        if (maxHeight > 8) return "medium";
        return "low";
    }

    /**
     * Execute the current strategy
     */
    executeStrategy(deltaTime) {
        if (!this.currentStrategy || !this.playerInstance.currentPiece) return;

        this.nextActionDelay -= deltaTime * 1000;
        if (this.nextActionDelay > 0) return;

        const target = this.currentStrategy;
        const current = {
            x: this.playerInstance.currentX,
            rotation: this.playerInstance.currentRotation
        };

        // Handle hold first
        if (target.useHold && this.playerInstance.canHold) {
            this.playerInstance.holdPiece();
            this.game.playSound("hold");
            this.currentStrategy = null;
            this.nextActionDelay = this.reactionDelay;
            return;
        }

        let actionTaken = false;

        // Rotate to target
        if (current.rotation !== target.targetRotation) {
            const rotDiff = (target.targetRotation - current.rotation + 4) % 4;
            const direction = rotDiff <= 2 ? 1 : -1;

            if (this.playerInstance.rotatePiece(direction)) {
                this.game.playSound("rotate");
                actionTaken = true;
            }
        }
        // Move horizontally
        else if (current.x !== target.targetX) {
            const direction = target.targetX > current.x ? 1 : -1;

            if (this.playerInstance.movePiece(direction)) {
                this.game.playSound("move");
                actionTaken = true;
            }
        }
        // Target reached - drop!
        else {
            this.playerInstance.hardDrop();
            this.game.playSound("hard_drop");

            // Update back-to-back tracker
            if (target.expectedGarbage >= 4) {
                this.lastClearWasTetrisOrTspin = true;
            } else if (target.expectedGarbage === 0) {
                this.lastClearWasTetrisOrTspin = false;
            }

            this.currentStrategy = null;
            this.nextActionDelay = this.reactionDelay * 1.5;
            return;
        }

        if (actionTaken) {
            this.nextActionDelay = target.urgency === "critical" ? 20 : this.reactionDelay;
        } else {
            this.currentStrategy = null;
            this.nextActionDelay = this.reactionDelay;
        }
    }

    // Delegate core Player methods to the underlying player instance
    get grid() {
        return this.playerInstance.grid;
    }
    set grid(value) {
        this.playerInstance.grid = value;
    }
    get score() {
        return this.playerInstance.score;
    }
    get level() {
        return this.playerInstance.level;
    }
    get lines() {
        return this.playerInstance.lines;
    }
    get currentPiece() {
        return this.playerInstance.currentPiece;
    }
    get currentX() {
        return this.playerInstance.currentX;
    }
    get currentY() {
        return this.playerInstance.currentY;
    }
    get currentRotation() {
        return this.playerInstance.currentRotation;
    }
    get gameOver() {
        return this.playerInstance.gameOver;
    }
    get nextQueue() {
        return this.playerInstance.nextQueue;
    }
    get heldPiece() {
        return this.playerInstance.heldPiece;
    }
    get ghostY() {
        return this.playerInstance.ghostY;
    }
    get justLockedPositions() {
        return this.playerInstance.justLockedPositions;
    }
    set justLockedPositions(value) {
        this.playerInstance.justLockedPositions = value;
    }

    reset() {
        this.playerInstance.reset();
        this.currentStrategy = null;
        this.thinkingTimer = 0;
        this.nextActionDelay = 0;
        this.lastClearWasTetrisOrTspin = false;
    }

    spawnPiece(pieceType) {
        return this.playerInstance.spawnPiece(pieceType);
    }
    checkCollision(pieceType, x, y, rotation) {
        return this.playerInstance.checkCollision(pieceType, x, y, rotation);
    }
    getNextPiece() {
        return this.playerInstance.getNextPiece();
    }
    initializeBagAndQueue() {
        return this.playerInstance.initializeBagAndQueue();
    }
    fillBag() {
        return this.playerInstance.fillBag();
    }

    get lockFlash() {
        return this.playerInstance.lockFlash;
    }
    set lockFlash(value) {
        this.playerInstance.lockFlash = value;
    }
    get spawnFlash() {
        return this.playerInstance.spawnFlash;
    }
    set spawnFlash(value) {
        this.playerInstance.spawnFlash = value;
    }
    get lineClearEffect() {
        return this.playerInstance.lineClearEffect;
    }
    set lineClearEffect(value) {
        this.playerInstance.lineClearEffect = value;
    }
    get screenShake() {
        return this.playerInstance.screenShake;
    }
    set screenShake(value) {
        this.playerInstance.screenShake = value;
    }
    get levelUpAnimationTimer() {
        return this.playerInstance.levelUpAnimationTimer;
    }
    set levelUpAnimationTimer(value) {
        this.playerInstance.levelUpAnimationTimer = value;
    }
    get lastRotateTime() {
        return this.playerInstance.lastRotateTime;
    }
    set lastRotateTime(value) {
        this.playerInstance.lastRotateTime = value;
    }
    get dasTimer() {
        return this.playerInstance.dasTimer;
    }
    set dasTimer(value) {
        this.playerInstance.dasTimer = value;
    }
    get dasActive() {
        return this.playerInstance.dasActive;
    }
    set dasActive(value) {
        this.playerInstance.dasActive = value;
    }
    get dasDirection() {
        return this.playerInstance.dasDirection;
    }
    set dasDirection(value) {
        this.playerInstance.dasDirection = value;
    }
    handleLevelUp() {
        return this.playerInstance.handleLevelUp();
    }
    clearLines(lines) {
        return this.playerInstance.clearLines(lines);
    }
    spawnNewPiece() {
        return this.playerInstance.spawnNewPiece();
    }
    get backToBack() {
        return this.playerInstance.backToBack;
    }
    set backToBack(value) {
        this.playerInstance.backToBack = value;
    }
    get combo() {
        return this.playerInstance.combo;
    }
    set combo(value) {
        this.playerInstance.combo = value;
    }
    get dropTimer() {
        return this.playerInstance.dropTimer;
    }
    set dropTimer(value) {
        this.playerInstance.dropTimer = value;
    }
    get lockTimer() {
        return this.playerInstance.lockTimer;
    }
    set lockTimer(value) {
        this.playerInstance.lockTimer = value;
    }
    get canHold() {
        return this.playerInstance.canHold;
    }
    set canHold(value) {
        this.playerInstance.canHold = value;
    }
    set gameOver(value) {
        this.playerInstance.gameOver = value;
    }
    set level(value) {
        this.playerInstance.level = value;
    }
    updateGameplay(deltaTime) {
        return this.playerInstance.updateGameplay(deltaTime);
    }
    handleLineClears(lines) {
        return this.playerInstance.handleLineClears(lines);
    }
};

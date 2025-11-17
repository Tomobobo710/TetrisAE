/**
 * TETRIS CPU PLAYER - KILLER ATTACK AI
 * 
 * This is a ruthless attack-focused Tetris AI designed to dominate opponents
 * through aggressive garbage sending, especially via Tetrises and T-spins.
 * 
 * DIFFICULTY MODES:
 * - Easy: Basic survival with some line clearing
 * - Medium: Balanced attack/defense with tetris focus
 * - Hard: MAXIMUM AGGRESSION - Perfect play, Tetris focused killer
 * 
 * ATTACK STRATEGY:
 * - Prioritizes 4-line Tetrises (4 garbage lines)
 * - Back-to-back bonuses for continuous pressure
 * - Opening strategies to build attack setups
 * - Perfect clear opportunities for massive damage
 */

window.CPUPlayer = class CPUPlayer {
    constructor(playerNumber, difficulty, gameSettings, game) {
        console.log(`Creating CPU Player ${playerNumber} with ${difficulty} difficulty...`);

        this.playerNumber = playerNumber;
        this.difficulty = difficulty; // "easy", "medium", "hard"
        this.game = game;

        // Core Player instance - handles all Tetris mechanics
        this.playerInstance = new Player(playerNumber, gameSettings, game);

        // AI state
        this.thinkingTimer = 0;
        this.currentStrategy = null;
        this.nextActionDelay = 0;
        this.stuckTimer = 0;  // Track how long we've been trying the same strategy

        // Difficulty settings - CUSTOMIZED FOR AGGRESSION
        this.setDifficultyParameters();
    }

    /**
     * SET AI PERSONALITY BASED ON DIFFICULTY
     */
    setDifficultyParameters() {
        switch (this.difficulty) {
            case "easy":
                this.thinkingInterval = 150; // ms between decisions - slower than hard
                this.reactionDelay = 120;    // ms between actions - slower than hard
                this.mistakeRate = 0.15;     // some mistakes for realism
                this.lookaheadDepth = 1;     // pieces to look ahead - same as others
                break;

            case "medium":
                this.thinkingInterval = 150; // faster decisions than easy
                this.reactionDelay = 90;    // quicker reactions than easy
                this.mistakeRate = 0.03;     // few mistakes
                this.lookaheadDepth = 1;     // pieces to look ahead - same as others
                break;

            case "hard":
                this.thinkingInterval = 100; // fast decisions
                this.reactionDelay = 60;     // quick reactions
                this.mistakeRate = 0.0;      // perfect execution
                this.lookaheadDepth = 1;     // pieces to look ahead - same as others
                break;
        }
    }

    /**
     * MAIN UPDATE LOOP - Called every frame
     */
    update(deltaTime) {
        if (!this.playerInstance.currentPiece || this.playerInstance.gameOver) {
            return;
        }

        // Update core player (handles physics, line clearing, etc.)
        this.playerInstance.updateGameplay(deltaTime);
        this.playerInstance.updateVisualEffects(deltaTime);

        // AI thinking timer
        this.thinkingTimer += deltaTime * 1000;

        if (this.thinkingTimer >= this.thinkingInterval) {
            this.thinkingTimer = 0;
            this.planMove();
        }

        // Execute planned move
        if (this.currentStrategy) {
            this.executeMove(deltaTime);
        }
    }

    /**
     * AI DECISION MAKING - ATTACK-FOCUSED PLANNING
     */
    planMove() {
        if (!this.playerInstance.currentPiece) return;

        // Hard mode uses same move finding as other modes for now
        // (removed expensive lookahead that was causing freezes)

        // Standard move finding for all difficulties
        const bestMove = this.findBestMove();

        if (bestMove) {
            this.currentStrategy = {
                targetX: bestMove.x,
                targetRotation: bestMove.rotation,
                useHold: bestMove.useHold || false
            };
            this.stuckTimer = 0;  // Reset stuck timer for new strategy
        }
    }
    
    /**
     * FIND THE BEST MOVE FOR CURRENT SITUATION
     */
    findBestMove() {
        const currentPiece = this.playerInstance.currentPiece;
        const heldPiece = this.playerInstance.heldPiece;
        const nextQueue = this.playerInstance.nextQueue.slice(0, this.lookaheadDepth);

        // Evaluate all current moves with scores
        const currentMoves = this.generateAllMoves(currentPiece);
        let allMoves = currentMoves.map(move => ({
            move,
            score: this.evaluateMove(move)
        }));

        // Try hold moves and add to evaluation
        if (this.playerInstance.canHold) {
            // Try swapping with held piece
            if (heldPiece !== null) {
                const holdMoves = this.generateAllMoves(heldPiece);
                for (const move of holdMoves) {
                    let holdPenalty = -50;  // Default hold penalty

                    // JACKPOT BONUS: Swapping held I-piece for a Tetris
                    if (heldPiece === 'I' && this.countLinesCleared(move) === 4) {
                        holdPenalty = +1500;  // MASSIVE BONUS for I-piece Tetris swap!
                    }
                    // Small penalty for swapping held I-piece for non-Tetris
                    else if (heldPiece === 'I') {
                        holdPenalty = -200;  // Don't waste the held I-piece
                    }

                    const score = this.evaluateMove(move) + holdPenalty;
                    allMoves.push({ move: { ...move, useHold: true }, score });
                }
            }
            // Try holding current piece for next piece
            else if (nextQueue.length > 0) {
                const nextPiece = nextQueue[0];
                const nextMoves = this.generateAllMoves(nextPiece);
                for (const move of nextMoves) {
                    let holdPenalty = -100;  // Default hold penalty

                    // BIG BONUS: Holding an I-piece for later Tetris
                    if (currentPiece.type === 'I') {
                        holdPenalty = +500;  // Encourage holding I-pieces!
                    }

                    const score = this.evaluateMove(move) + holdPenalty;
                    allMoves.push({ move: { ...move, useHold: true }, score });
                }
            }
        }

        // Sort all moves by score descending (best first)
        allMoves.sort((a, b) => b.score - a.score);

        let bestMove = allMoves[0].move;

        // Apply mistakes for easier difficulties - pick from suboptimal moves
        if (Math.random() < this.mistakeRate && allMoves.length > 1) {
            // Pick from bottom 50% of moves (suboptimal but not terrible)
            const numOptions = Math.ceil(allMoves.length * 0.5);
            const startIndex = allMoves.length - numOptions;
            const randomIndex = startIndex + Math.floor(Math.random() * numOptions);
            bestMove = allMoves[randomIndex].move;
        }

        return bestMove;
    }

    /**
     * ============================================================================
     * AI EVALUATION - Simple but effective heuristic scoring
     * ============================================================================
     */
    evaluateMove(move) {
        const resultGrid = this.simulateMove(move);
        if (!resultGrid) {
            return -100000; // Invalid move
        }

        let score = 0;
        
        // Get basic metrics
        const heights = this.getColumnHeights(resultGrid);
        const holes = this.countHoles(resultGrid);
        const linesCleared = this.countLinesCleared(move);
        const bumpiness = this.calculateBumpiness(resultGrid);
        const aggregateHeight = heights.reduce((sum, h) => sum + h, 0);
        const maxHeight = Math.max(...heights);
        
        // ALL DIFFICULTIES USE IDENTICAL EVALUATION - ONLY SPEED AND MISTAKES DIFFER
        // ATTACK-FOCUSED SCORING: Discourage singles, reward bigger clears
        
        // Line clear scoring - exponential rewards for bigger clears
        if (linesCleared === 1) {
            score -= 2000;  // EXTREME PENALTY for singles!
        } else if (linesCleared === 2) {
            score -= 500;   // Strong penalty for doubles
        } else if (linesCleared === 3) {
            score -= 200;   // Penalty for triples - only Tetrises matter!
        } else if (linesCleared === 4) {
            score += 3000;  // MASSIVE bonus for Tetrises - the ONLY good move
        }
        
        // STEPPED HEIGHT PENALTY - calm until panic threshold
        if (maxHeight <= 10) {
            score -= aggregateHeight * 0.01;  // Very light penalty when safe
        } else {
            // PANIC MODE! Height above 10 is scary
            const dangerHeight = maxHeight - 10;
            score -= dangerHeight * dangerHeight * 150;  // Exponential panic penalty!
            score -= aggregateHeight * 0.2;  // Plus normal height penalty
        }
        score -= holes * 1200;  // Still bad, but less extreme
        score -= bumpiness * 30;  // Lighter bumpiness penalty
        
        // Don't Fuck Yourself - simple overhang detection
        const overhangs = this.countOverhangs(resultGrid);
        score -= overhangs * 400;  // Lighter overhang penalty
        
        // PATIENCE BONUS - reward NOT clearing lines when building
        if (linesCleared === 0 && maxHeight < 15) {
            score += 200;  // Bonus for patient building when safe
        }
        
        // Big attack bonuses
        const attackValue = this.calculateAttackValue(linesCleared, this.playerInstance.backToBack);
        score += attackValue * 400;
        
        // Extra Tetris bonus (on top of line clear bonus above)
        if (linesCleared === 4) {
            score += 1500;
            if (this.playerInstance.backToBack) score += 800;
            
            // JACKPOT! I-piece Tetris bonus
            if (move.pieceType === 'I') {
                score += 2000;  // MASSIVE bonus for using I-piece for Tetris!
            }
        }
        
        // PENALTY for wasting I-pieces on non-Tetrises
        if (move.pieceType === 'I' && linesCleared !== 4 && linesCleared > 0) {
            score -= 3000;  // HUGE penalty for wasting precious I-pieces!
        }
        
        // T-piece bonus
        if (move.pieceType === 'T' && linesCleared > 0) {
            score += 600 + (linesCleared * 200);
        }
        
        // Simple well preference
        const minHeight = Math.min(...heights);
        if (maxHeight - minHeight >= 3) {
            score += 200;
        }
        
        // Height management
        if (maxHeight > 17) score -= (maxHeight - 17) * 300;
        if (maxHeight > 20) score -= 2000;
        
        // Game over prevention (critical for all difficulties)
        if (maxHeight >= 22) score -= 10000;
        
        // Add small random factor for non-deterministic play
        //score += (Math.random() - 0.5) * (this.mistakeRate * 50);
        
        return score;
    }

    /**
     * ============================================================================
     * ATTACK-FOCUSED UTILITY FUNCTIONS
     * ============================================================================
     */
    
    /**
     * Calculate garbage lines sent based on line clear type
     */
    calculateAttackValue(linesCleared, backToBack = false) {
        let baseGarbage = 0;
        
        switch (linesCleared) {
            case 1: baseGarbage = 0; break;
            case 2: baseGarbage = 1; break;
            case 3: baseGarbage = 2; break;
            case 4: baseGarbage = 4; break; // Tetris
        }
        
        // Back-to-back bonus
        if (backToBack && baseGarbage > 0) {
            baseGarbage += 1;
        }
        
        return baseGarbage;
    }
    
    // All complex functions removed for clean performance

    /**
     * Find a quick fallback move when stuck trying to reach unreachable target
     */
    findQuickFallback() {
        const currentPiece = this.playerInstance.currentPiece;
        const currentX = this.playerInstance.currentX;
        const currentRotation = this.playerInstance.currentRotation;
        
        // Try moves close to current position (reachable)
        const nearbyMoves = [];
        
        // Try current rotation, positions within 2 squares
        for (let x = currentX - 2; x <= currentX + 2; x++) {
            const landingY = this.findDropPosition(currentPiece.type, x, currentRotation);
            if (landingY !== null) {
                nearbyMoves.push({
                    pieceType: currentPiece.type,
                    x,
                    y: landingY,
                    rotation: currentRotation
                });
            }
        }
        
        // Pick the best nearby move
        let bestMove = null;
        let bestScore = -Infinity;
        
        for (const move of nearbyMoves) {
            const score = this.evaluateMove(move);
            if (score > bestScore) {
                bestScore = score;
                bestMove = {
                    targetX: move.x,
                    targetRotation: move.rotation,
                    useHold: false
                };
            }
        }
        
        return bestMove;
    }

    /**
     * ============================================================================
     * BASIC UTILITY FUNCTIONS - Fast and simple
     * ============================================================================
     */

    /**
     * Simulate placing a move and return the resulting grid
     */
    simulateMove(move) {
        const matrix = this.game.getRotatedPiece(move.pieceType, move.rotation);
        const newGrid = this.playerInstance.grid.map(row => [...row]);
        
        // Place piece on grid
        for (let dy = 0; dy < matrix.length; dy++) {
            for (let dx = 0; dx < matrix.length; dx++) {
                if (matrix[dy][dx]) {
                    const gridX = move.x + dx;
                    const gridY = move.y + dy;
                    
                    if (gridX < 0 || gridX >= TETRIS.GRID.COLS || 
                        gridY < 0 || gridY >= TETRIS.GRID.ROWS ||
                        newGrid[gridY][gridX] !== null) {
                        return null; // Invalid placement
                    }
                    
                    newGrid[gridY][gridX] = move.pieceType;
                }
            }
        }
        
        // Clear completed lines
        this.clearCompletedLines(newGrid);
        return newGrid;
    }

    /**
     * Get height of each column [0-20]
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
     * Count holes (empty spaces with blocks above them)
     */
    countHoles(grid) {
        let holes = 0;
        const heights = this.getColumnHeights(grid);
        
        for (let x = 0; x < TETRIS.GRID.COLS; x++) {
            const colHeight = heights[x];
            if (colHeight > 0) {
                const topY = TETRIS.GRID.ROWS - colHeight;
                for (let y = topY + 1; y < TETRIS.GRID.ROWS; y++) {
                    if (grid[y][x] === null) {
                        holes++;
                    }
                }
            }
        }
        
        return holes;
    }

    /**
     * Count how many lines this move would clear
     */
    countLinesCleared(move) {
        const matrix = this.game.getRotatedPiece(move.pieceType, move.rotation);
        const grid = this.playerInstance.grid;
        const affectedRows = new Set();
        
        // Find rows the piece affects
        for (let dy = 0; dy < matrix.length; dy++) {
            for (let dx = 0; dx < matrix.length; dx++) {
                if (matrix[dy][dx]) {
                    affectedRows.add(move.y + dy);
                }
            }
        }
        
        let cleared = 0;
        for (const row of affectedRows) {
            if (row >= 0 && row < TETRIS.GRID.ROWS) {
                let complete = true;
                for (let x = 0; x < TETRIS.GRID.COLS; x++) {
                    let filled = grid[row][x] !== null;
                    
                    // Check if piece fills this spot
                    if (!filled) {
                        for (let dy = 0; dy < matrix.length; dy++) {
                            for (let dx = 0; dx < matrix.length; dx++) {
                                if (matrix[dy][dx] && 
                                    move.x + dx === x && move.y + dy === row) {
                                    filled = true;
                                    break;
                                }
                            }
                            if (filled) break;
                        }
                    }
                    
                    if (!filled) {
                        complete = false;
                        break;
                    }
                }
                if (complete) cleared++;
            }
        }
        
        return cleared;
    }

    /**
     * Calculate "bumpiness" (sum of height differences between adjacent columns)
     */
    calculateBumpiness(grid) {
        const heights = this.getColumnHeights(grid);
        let bumpiness = 0;
        for (let i = 0; i < heights.length - 1; i++) {
            bumpiness += Math.abs(heights[i] - heights[i + 1]);
        }
        return bumpiness;
    }

    /**
     * Count overhangs - blocks that hang over empty spaces (DFS violation)
     */
    countOverhangs(grid) {
        let overhangs = 0;
        
        for (let y = 0; y < TETRIS.GRID.ROWS - 1; y++) {
            for (let x = 0; x < TETRIS.GRID.COLS; x++) {
                // If this spot has a block but the space below is empty
                if (grid[y][x] !== null && grid[y + 1][x] === null) {
                    // Check if there's a supported block somewhere below
                    let hasSupport = false;
                    for (let checkY = y + 2; checkY < TETRIS.GRID.ROWS; checkY++) {
                        if (grid[checkY][x] !== null) {
                            hasSupport = true;
                            break;
                        }
                    }
                    
                    // If no support below, it's an overhang
                    if (!hasSupport) {
                        overhangs++;
                    }
                }
            }
        }
        
        return overhangs;
    }

    /**
     * ============================================================================
     * INTERNAL INFRASTRUCTURE - Don't modify these
     * ============================================================================
     */

    generateAllMoves(pieceType) {
        const moves = [];
        
        for (let rotation = 0; rotation < 4; rotation++) {
            const matrix = this.game.getRotatedPiece(pieceType, rotation);
            
            for (let x = -matrix.length; x <= TETRIS.GRID.COLS; x++) {
                const landingY = this.findDropPosition(pieceType, x, rotation);
                if (landingY !== null) {
                    moves.push({
                        pieceType,
                        x,
                        y: landingY,
                        rotation
                    });
                }
            }
        }
        
        return moves;
    }

    findDropPosition(pieceType, x, rotation) {
        let y = 0;
        
        if (this.playerInstance.checkCollision(pieceType, x, y, rotation)) {
            return null;
        }
        
        while (!this.playerInstance.checkCollision(pieceType, x, y + 1, rotation)) {
            y++;
        }
        
        return y;
    }

    clearCompletedLines(grid) {
        for (let y = TETRIS.GRID.ROWS - 1; y >= 0; y--) {
            let complete = true;
            for (let x = 0; x < TETRIS.GRID.COLS; x++) {
                if (grid[y][x] === null) {
                    complete = false;
                    break;
                }
            }
            
            if (complete) {
                grid.splice(y, 1);
                grid.unshift(new Array(TETRIS.GRID.COLS).fill(null));
                y++; // Check the same line again
            }
        }
    }

    executeMove(deltaTime) {
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
        // Drop!
        else {
            this.playerInstance.hardDrop();
            this.game.playSound("hard_drop");
            this.currentStrategy = null;
            this.nextActionDelay = this.reactionDelay * 1.5;
            return;
        }

        if (actionTaken) {
            this.nextActionDelay = this.reactionDelay;
            this.stuckTimer = 0;  // Reset stuck timer on successful action
        } else {
            // We're stuck - increment stuck timer
            this.stuckTimer += deltaTime * 1000;
            
            // If stuck for too long, give up on unreachable placement
            if (this.stuckTimer > 400) {  // 400ms timeout - faster give-up
                console.log(`AI stuck for ${this.stuckTimer}ms, giving up on unreachable target`);
                
                // Try to find a more reachable alternative quickly
                const fallbackMove = this.findQuickFallback();
                if (fallbackMove) {
                    this.currentStrategy = fallbackMove;
                    this.stuckTimer = 0;
                } else {
                    // Last resort: hard drop
                    this.playerInstance.hardDrop();
                    this.game.playSound("hard_drop");
                    this.currentStrategy = null;
                    this.stuckTimer = 0;
                }
                this.nextActionDelay = this.reactionDelay;
                return;
            }
            
            // Otherwise just wait a bit longer and try again
            this.nextActionDelay = this.reactionDelay * 2;
        }
    }

    // Delegation to Player instance - handles all game mechanics
    get grid() { return this.playerInstance.grid; }
    set grid(value) { this.playerInstance.grid = value; }
    get score() { return this.playerInstance.score; }
    get level() { return this.playerInstance.level; }
    get lines() { return this.playerInstance.lines; }
    get currentPiece() { return this.playerInstance.currentPiece; }
    get currentX() { return this.playerInstance.currentX; }
    get currentY() { return this.playerInstance.currentY; }
    get currentRotation() { return this.playerInstance.currentRotation; }
    get gameOver() { return this.playerInstance.gameOver; }
    get nextQueue() { return this.playerInstance.nextQueue; }
    get heldPiece() { return this.playerInstance.heldPiece; }
    get ghostY() { return this.playerInstance.ghostY; }
    get justLockedPositions() { return this.playerInstance.justLockedPositions; }
    set justLockedPositions(value) { this.playerInstance.justLockedPositions = value; }

    reset() {
        this.playerInstance.reset();
        this.currentStrategy = null;
        this.thinkingTimer = 0;
        this.nextActionDelay = 0;
    }

    spawnPiece(pieceType) { return this.playerInstance.spawnPiece(pieceType); }
    checkCollision(pieceType, x, y, rotation) { return this.playerInstance.checkCollision(pieceType, x, y, rotation); }
    getNextPiece() { return this.playerInstance.getNextPiece(); }
    initializeBagAndQueue() { return this.playerInstance.initializeBagAndQueue(); }
    fillBag() { return this.playerInstance.fillBag(); }

    get lockFlash() { return this.playerInstance.lockFlash; }
    set lockFlash(value) { this.playerInstance.lockFlash = value; }
    get spawnFlash() { return this.playerInstance.spawnFlash; }
    set spawnFlash(value) { this.playerInstance.spawnFlash = value; }
    get lineClearEffect() { return this.playerInstance.lineClearEffect; }
    set lineClearEffect(value) { this.playerInstance.lineClearEffect = value; }
    get screenShake() { return this.playerInstance.screenShake; }
    set screenShake(value) { this.playerInstance.screenShake = value; }
    get levelUpAnimationTimer() { return this.playerInstance.levelUpAnimationTimer; }
    set levelUpAnimationTimer(value) { this.playerInstance.levelUpAnimationTimer = value; }
    get lastRotateTime() { return this.playerInstance.lastRotateTime; }
    set lastRotateTime(value) { this.playerInstance.lastRotateTime = value; }
    get dasTimer() { return this.playerInstance.dasTimer; }
    set dasTimer(value) { this.playerInstance.dasTimer = value; }
    get dasActive() { return this.playerInstance.dasActive; }
    set dasActive(value) { this.playerInstance.dasActive = value; }
    get dasDirection() { return this.playerInstance.dasDirection; }
    set dasDirection(value) { this.playerInstance.dasDirection = value; }
    handleLevelUp() { return this.playerInstance.handleLevelUp(); }
    clearLines(lines) { return this.playerInstance.clearLines(lines); }
    spawnNewPiece() { return this.playerInstance.spawnNewPiece(); }
    get backToBack() { return this.playerInstance.backToBack; }
    set backToBack(value) { this.playerInstance.backToBack = value; }
    get combo() { return this.playerInstance.combo; }
    set combo(value) { this.playerInstance.combo = value; }
    get dropTimer() { return this.playerInstance.dropTimer; }
    set dropTimer(value) { this.playerInstance.dropTimer = value; }
    get lockTimer() { return this.playerInstance.lockTimer; }
    set lockTimer(value) { this.playerInstance.lockTimer = value; }
    get canHold() { return this.playerInstance.canHold; }
    set canHold(value) { this.playerInstance.canHold = value; }
    set gameOver(value) { this.playerInstance.gameOver = value; }
    set level(value) { this.playerInstance.level = value; }
    updateGameplay(deltaTime) { return this.playerInstance.updateGameplay(deltaTime); }
    handleLineClears(lines) { return this.playerInstance.handleLineClears(lines); }
};

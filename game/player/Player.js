/**
 * Player - Encapsulates all player-specific state and behavior
 */
class Player {
    constructor(playerNumber, gameSettings, game) {
        console.log(`Creating Player ${playerNumber}...`);
        this.playerNumber = playerNumber;
        this.game = game; // Reference to parent game for shared systems
        this.gameSettings = gameSettings;

        // Debug: Check if holdPiece method exists after construction
        console.log(`Player ${playerNumber} constructed. holdPiece method type:`, typeof this.holdPiece);

        // Core game state
        this.grid = this.createEmptyGrid();
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.combo = -1;
        this.backToBack = false;

        // Spin / T-Spin tracking
        this.lastMoveWasRotation = false;
        this.lastRotationKick = { x: 0, y: 0 }; // Offset applied on last successful rotate
        this.lastClearSpinType = "none"; // 'none' | 'tspin' | 'tspin_mini'
        this.lastClearLines = [];

        // Current piece state
        this.currentPiece = null;
        this.currentX = 0;
        this.currentY = 0;
        this.currentRotation = 0;
        this.ghostY = 0;

        // Hold system
        this.heldPiece = null; // Changed from holdPiece to avoid naming conflict with method
        this.canHold = true;

        // Timing state
        this.dropTimer = 0;
        this.lockTimer = 0;
        this.lastRotateTime = 0;

        // DAS (Delayed Auto Shift) state
        this.dasTimer = 0;
        this.dasActive = false;
        this.dasDirection = 0;

        // Game over state
        this.gameOver = false;

        // Visual effects specific to this player
        this.lockFlash = 0;
        this.spawnFlash = 0;
        this.justLockedPositions = []; // Track positions of blocks that just locked
        this.lineClearEffect = { active: false, lines: [], progress: 0 };
        this.screenShake = { intensity: 0, duration: 0 };
        this.levelUpAnimationTimer = 0;

        // Independent piece generation system for this player
        this.bag = [];
        this.nextQueue = [];

        // Network sync timer for online multiplayer
        this.networkSyncTimer = 0;
        this.networkSyncInterval = 16; // Send updates every 16ms (~60fps)
    }

    /**
     * Create an empty grid for this player
     */
    createEmptyGrid() {
        const grid = [];
        for (let y = 0; y < TETRIS.GRID.ROWS; y++) {
            grid[y] = [];
            for (let x = 0; x < TETRIS.GRID.COLS; x++) {
                grid[y][x] = null;
            }
        }
        return grid;
    }

    /**
     * Check collision for this player's pieces
     */
    checkCollision(pieceType, x, y, rotation) {
        const matrix = this.game.getRotatedPiece(pieceType, rotation);
        const size = matrix.length;

        for (let dy = 0; dy < size; dy++) {
            for (let dx = 0; dx < size; dx++) {
                if (matrix[dy][dx]) {
                    const gridX = x + dx;
                    const gridY = y + dy;

                    if (gridX < 0 || gridX >= TETRIS.GRID.COLS || gridY >= TETRIS.GRID.ROWS) {
                        return true;
                    }

                    if (gridY >= 0 && this.grid[gridY][gridX] !== null) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    /**
     * Calculate ghost position for this player
     */
    calculateGhostPosition() {
        if (!this.currentPiece) return;

        let testY = this.currentY;
        while (!this.checkCollision(this.currentPiece, this.currentX, testY + 1, this.currentRotation)) {
            testY++;
        }
        this.ghostY = testY;
    }

    /**
     * Move piece for this player
     */
    movePiece(dx) {
        if (!this.currentPiece || this.gameOver) return false;

        // Any horizontal move invalidates spin-final condition
        this.lastMoveWasRotation = false;
        this.lastRotationKick = { x: 0, y: 0 };

        const newX = this.currentX + dx;
        if (!this.checkCollision(this.currentPiece, newX, this.currentY, this.currentRotation)) {
            this.currentX = newX;
            this.calculateGhostPosition();
            this.lockTimer = 0;
            return true;
        }
        return false;
    }

    /**
     * Rotate piece for this player
     */
    rotatePiece(direction) {
        if (!this.currentPiece || this.gameOver) return false;

        const currentRotation = this.currentRotation;
        const newRotation = (currentRotation + direction + 4) % 4;
        const kickTable = this.currentPiece === "I" ? SRS_WALL_KICKS.I : SRS_WALL_KICKS.JLSTZ;
        const kickKey = direction === 1 ? `${currentRotation}->${newRotation}` : `${newRotation}->${currentRotation}`;
        const kicks = kickTable[kickKey] || [[0, 0]];

        for (const [kickX, kickY] of kicks) {
            // For JLSTZ table, entries are already relative. For I, they are as defined by SRS.
            const appliedKickX = direction === 1 ? kickX : -kickX;
            const appliedKickY = direction === 1 ? -kickY : kickY;

            const testX = this.currentX + appliedKickX;
            const testY = this.currentY + appliedKickY;

            if (!this.checkCollision(this.currentPiece, testX, testY, newRotation)) {
                this.currentX = testX;
                this.currentY = testY;
                this.currentRotation = newRotation;
                this.calculateGhostPosition();
                this.lockTimer = 0;

                // Track spin info: last action was rotation and record kick offset
                this.lastMoveWasRotation = true;
                this.lastRotationKick = { x: appliedKickX, y: appliedKickY };

                return true;
            }
        }

        return false;
    }

    /**
     * Soft drop for this player
     */
    softDrop() {
        if (!this.currentPiece || this.gameOver) return false;

        // Movement invalidates last-rotation condition
        this.lastMoveWasRotation = false;
        this.lastRotationKick = { x: 0, y: 0 };

        if (!this.checkCollision(this.currentPiece, this.currentX, this.currentY + 1, this.currentRotation)) {
            this.currentY++;
            this.score += TETRIS.SCORING.SOFT_DROP;
            this.dropTimer = 0;
            return true;
        }
        return false;
    }

    /**
     * Hard drop for this player
     */
    hardDrop() {
        if (!this.currentPiece || this.gameOver || !this.gameSettings.hardDropEnabled) return null;

        // Prevent hard drop during line clearing animations to avoid infinite line clearing bug
        if (this.game.gameManager && this.game.gameManager.lineClearingPlayers.has(this.playerNumber)) {
            return null;
        }

        // Hard drop is a movement action; clear last-rotation flag
        this.lastMoveWasRotation = false;
        this.lastRotationKick = { x: 0, y: 0 };

        let dropDistance = 0;
        while (!this.checkCollision(this.currentPiece, this.currentX, this.currentY + 1, this.currentRotation)) {
            this.currentY++;
            dropDistance++;
        }

        const scoreGained = dropDistance * TETRIS.SCORING.HARD_DROP;
        this.score += scoreGained;

        // Immediately lock the piece (from hard drop)
        this.lockPiece(true);

        // Process any pending garbage after hard drop
        if (this.game.gameManager) {
            this.game.gameManager.checkAndProcessPendingGarbage(this.playerNumber);
        }

        return dropDistance;
    }

    /**
     * Hold piece for this player
     */
    holdPiece() {
        if (!this.canHold || !this.currentPiece || this.gameOver) return null;

        // Prevent hold piece during line clearing animations
        if (this.game.gameManager && this.game.gameManager.lineClearingPlayers.has(this.playerNumber)) {
            return null;
        }

        const pieceToHold = this.currentPiece;

        if (this.heldPiece === null) {
            this.heldPiece = pieceToHold;
            this.spawnNewPiece();
        } else {
            const temp = this.heldPiece;
            this.heldPiece = pieceToHold;
            this.spawnPiece(temp);
        }

        this.canHold = false;
        return pieceToHold;
    }

    /**
     * Spawn a new piece for this player
     */
    spawnNewPiece() {
        if (this.nextQueue.length === 0) {
            this.initializeBagAndQueue();
        }
        const pieceType = this.nextQueue.shift();
        this.nextQueue.push(this.getNextPiece());
        this.spawnPiece(pieceType);
        this.canHold = true;
    }

    /**
     * Spawn a specific piece for this player
     */
    spawnPiece(pieceType) {
        if (this.gameOver) return;

        this.currentPiece = pieceType;
        this.currentRotation = 0;

        // Reset spin state for new piece
        this.lastMoveWasRotation = false;
        this.lastRotationKick = { x: 0, y: 0 };
        this.lastClearSpinType = "none";
        this.lastClearLines = [];
        const pieceSize = TETROMINOES[pieceType].size;
        this.currentX = Math.floor((TETRIS.GRID.COLS - pieceSize) / 2);
        this.currentY = 3;

        if (this.checkCollision(pieceType, this.currentX, this.currentY, 0)) {
            // Don't set gameOver here - let checkWinConditions() handle it consistently
            // Just clear the piece and return failure
            this.currentPiece = null;
            return false;
        }

        this.calculateGhostPosition();
        this.lockTimer = 0;
        this.dropTimer = 0;
        this.spawnFlash = 1.0;

        // Network sync handled by NetworkSession hooks

        return true;
    }

    /**
     * Lock the current piece for this player
     */
    lockPiece(isFromHardDrop = false) {
        if (!this.currentPiece || this.gameOver) return [];

        const wasTPiece = this.currentPiece === "T";
        const lockX = this.currentX;
        const lockY = this.currentY;
        const lockRotation = this.currentRotation;

        const matrix = this.game.getRotatedPiece(this.currentPiece, this.currentRotation);
        const size = matrix.length;

        // Clear previous just locked positions
        this.justLockedPositions = [];

        for (let dy = 0; dy < size; dy++) {
            for (let dx = 0; dx < size; dx++) {
                if (matrix[dy][dx]) {
                    const gridY = this.currentY + dy;
                    const gridX = this.currentX + dx;

                    if (gridY >= 0 && gridY < TETRIS.GRID.ROWS) {
                        this.grid[gridY][gridX] = this.currentPiece;
                        // Track this position as just locked
                        this.justLockedPositions.push({ x: gridX, y: gridY });
                    }
                }
            }
        }

        this.lockFlash = 1.0;

        // Play lock sound only if not from hard drop (hard drop has its own sound)
        if (!isFromHardDrop) {
            this.game.playSound("lock");
        }

        const clearedLines = this.checkLines();

        // Determine T-Spin / Mini T-Spin using modern 3-corner rule + last-rotation requirement
        // - Requires:
        //     * T piece
        //     * lastMoveWasRotation true (no overriding movement after final rotate)
        let spinType = "none"; // 'none' | 'tspin' | 'tspin_mini'

        if (wasTPiece && this.lastMoveWasRotation) {
            spinType = this.detectTSpinPlacement(lockX, lockY, lockRotation, this.lastRotationKick);
        }

        // Expose for GameManager / scoring / visuals
        this.lastClearSpinType = spinType;
        this.lastClearLines = clearedLines.slice();

        // Once we've consumed this lock, clear last-move spin flags
        this.lastMoveWasRotation = false;
        this.lastRotationKick = { x: 0, y: 0 };

        if (clearedLines.length > 0) {
            // Let GameManager handle line clearing, scoring, B2B, etc.
            if (this.game.gameManager) {
                this.game.gameManager.handlePlayerLineClear(this, clearedLines);
            } else {
                // Fallback for single player
                this.handleLineClears(clearedLines);
            }
        } else {
            // No lines cleared: GameManager will treat T-Spin 0-line via lastClearSpinType,
            // but no garbage / B2B, etc., should be applied.
            this.combo = -1;

            // Check for pending garbage and process it before spawning new piece
            if (this.game.gameManager && this.game.gameManager.checkAndProcessPendingGarbage(this.playerNumber)) {
                // Garbage was processed, the garbage handler will spawn the next piece
                console.log(`Garbage processed for Player ${this.playerNumber}, garbage handler will spawn next piece`);
            } else {
                // No garbage, safe to spawn new piece
                this.canHold = true;
                this.spawnNewPiece();
            }
        }

        return clearedLines;
    }

    /**
     * Check for completed lines in this player's grid
     */
    checkLines() {
        const clearedLines = [];
        for (let y = 0; y < TETRIS.GRID.ROWS; y++) {
            let complete = true;
            for (let x = 0; x < TETRIS.GRID.COLS; x++) {
                if (this.grid[y][x] === null) {
                    complete = false;
                    break;
                }
            }
            if (complete) clearedLines.push(y);
        }
        return clearedLines;
    }

    /**
     * Detect T-Spin / Mini T-Spin based on guideline-style rules.
     *
     * Returns:
     *  - 'tspin'       for proper T-Spin (any lines cleared)
     *  - 'tspin_mini'  for Mini T-Spin (typically 0-1 line clears; classification by corner pattern)
     *  - 'none'
     */
    detectTSpinPlacement(lockX, lockY, rotation, lastKick) {
        // Center of T in its 3x3 is (1,1)
        const centerX = lockX + 1;
        const centerY = lockY + 1;

        // Corner positions relative to center (top-left, top-right, bottom-left, bottom-right)
        const corners = [
            { dx: -1, dy: -1 },
            { dx: 1, dy: -1 },
            { dx: -1, dy: 1 },
            { dx: 1, dy: 1 }
        ];

        let filled = [false, false, false, false];
        let filledCount = 0;

        for (let i = 0; i < 4; i++) {
            const x = centerX + corners[i].dx;
            const y = centerY + corners[i].dy;

            const isFilled =
                x < 0 ||
                x >= TETRIS.GRID.COLS ||
                y < 0 ||
                y >= TETRIS.GRID.ROWS ||
                (this.grid[y] && this.grid[y][x] !== null);

            if (isFilled) {
                filled[i] = true;
                filledCount++;
            }
        }

        // 3-corner rule: need at least 3 filled corners to be any T-Spin
        if (filledCount < 3) {
            return "none";
        }

        // Map rotation to "front" corner indices (adjacent to T's facing side)
        // Indices: 0=TL,1=TR,2=BL,3=BR
        let frontIndices;
        switch (rotation) {
            case 0: // Up
                frontIndices = [0, 1];
                break;
            case 1: // Right
                frontIndices = [1, 3];
                break;
            case 2: // Down
                frontIndices = [2, 3];
                break;
            case 3: // Left
                frontIndices = [0, 2];
                break;
            default:
                frontIndices = [0, 1];
        }

        const backIndices = [0, 1, 2, 3].filter((i) => !frontIndices.includes(i));

        const frontFilled = frontIndices.filter((i) => filled[i]).length;
        const backFilled = backIndices.filter((i) => filled[i]).length;

        // Check for big SRS kick (used for many proper T-Spin setups)
        const usedBigKick = Math.abs(lastKick.x) === 2 || Math.abs(lastKick.y) === 2;

        // Classification:
        // - Proper T-Spin:
        //   - 3-corner rule passed AND
        //   - Either:
        //       a) both front corners filled, or
        //       b) used a big SRS kick (upgrade from mini)
        // - Otherwise Mini T-Spin.
        const frontBoth = frontFilled === 2;
        let type;

        if (frontBoth || usedBigKick) {
            type = "tspin";
        } else {
            type = "tspin_mini";
        }

        return type;
    }

    /**
     * Handle line clears for this player
     */
    handleLineClears(lines) {
        const numLines = lines.length;

        // Update score
        let baseScore = 0;
        switch (numLines) {
            case 1:
                baseScore = TETRIS.SCORING.SINGLE;
                break;
            case 2:
                baseScore = TETRIS.SCORING.DOUBLE;
                break;
            case 3:
                baseScore = TETRIS.SCORING.TRIPLE;
                break;
            case 4:
                baseScore = TETRIS.SCORING.TETRIS;
                break;
        }

        baseScore *= this.level;
        if (this.combo > 0) baseScore += 50 * this.combo * this.level;

        this.score += baseScore;
        this.lines += numLines;
        this.combo++;

        // Update level
        const newLevel = Math.floor(this.lines / 10) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.handleLevelUp();
        }

        // Send garbage to other players (this will be handled by game manager)
        return numLines;
    }

    /**
     * Clear completed lines from this player's grid
     */
    clearLines(lines) {
        lines.sort((a, b) => a - b);
        const newGrid = [];

        for (let i = 0; i < lines.length; i++) {
            const newLine = [];
            for (let x = 0; x < TETRIS.GRID.COLS; x++) {
                newLine.push(null);
            }
            newGrid.push(newLine);
        }

        for (let y = 0; y < TETRIS.GRID.ROWS; y++) {
            if (!lines.includes(y)) {
                newGrid.push([...this.grid[y]]);
            }
        }

        this.grid = newGrid;

        // Update justLockedPositions to account for cleared lines
        // Remove positions on cleared lines, then shift remaining down
        const numCleared = lines.length;
        this.justLockedPositions = this.justLockedPositions
            .filter((pos) => !lines.includes(pos.y)) // Remove positions on cleared lines
            .map((pos) => ({ x: pos.x, y: pos.y + numCleared })); // Shift remaining down

        this.lineClearEffect.active = false;
        this.canHold = true; // Reset hold ability for new piece
    }

    /**
     * Update this player's gameplay state
     */
    updateGameplay(deltaTime) {
        if (!this.currentPiece || this.gameOver) return;

        const dropSpeed = Math.max(
            TETRIS.TIMING.MIN_DROP_SPEED,
            TETRIS.TIMING.INITIAL_DROP_SPEED - (this.level - 1) * TETRIS.TIMING.SPEED_DECREASE_PER_LEVEL
        );

        const isOnGround = this.checkCollision(
            this.currentPiece,
            this.currentX,
            this.currentY + 1,
            this.currentRotation
        );

        // Auto-drop timer
        this.dropTimer += deltaTime * 1000;
        if (this.dropTimer >= dropSpeed) {
            this.dropTimer = 0;
            if (!isOnGround) {
                this.currentY++;
            }
        }

        // Lock timer - only lock if piece is truly on the ground
        if (isOnGround) {
            this.lockTimer += deltaTime * 1000;
            if (this.lockTimer >= TETRIS.TIMING.LOCK_DELAY) {
                this.lockPiece();
            }
        } else {
            this.lockTimer = 0;
        }
    }

    /**
     * Handle level up effects for this player
     */
    handleLevelUp() {
        this.game.playSound("level_up");
        this.screenShake = { intensity: 6, duration: 0.4 };
        this.levelUpAnimationTimer = TETRIS.TIMING.LEVEL_UP_ANIMATION;
    }

    /**
     * Update visual effects for this player
     */
    updateVisualEffects(deltaTime) {
        if (this.screenShake.duration > 0) {
            this.screenShake.duration -= deltaTime;
            if (this.screenShake.duration <= 0) this.screenShake.intensity = 0;
        }

        if (this.lockFlash > 0) {
            this.lockFlash -= deltaTime * 4;
            // Clear just locked positions when flash effect ends
            if (this.lockFlash <= 0) {
                this.justLockedPositions = [];
            }
        }

        if (this.spawnFlash > 0) {
            this.spawnFlash -= deltaTime * 4;
        }

        if (this.levelUpAnimationTimer > 0) this.levelUpAnimationTimer -= deltaTime * 1000;

    }

    /**
     * Reset this player for a new game
     */
    reset() {
        this.grid = this.createEmptyGrid();
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.combo = -1;

        this.currentPiece = null;
        this.currentX = 0;
        this.currentY = 0;
        this.currentRotation = 0;
        this.ghostY = 0;

        this.heldPiece = null; // Changed from holdPiece to avoid naming conflict with method
        this.canHold = true;

        this.dropTimer = 0;
        this.lockTimer = 0;
        this.lastRotateTime = 0;

        this.dasTimer = 0;
        this.dasActive = false;
        this.dasDirection = 0;

        this.gameOver = false;

        this.lockFlash = 0;
        this.spawnFlash = 0;
        this.justLockedPositions = [];
        this.lineClearEffect = { active: false, lines: [], progress: 0 };
        this.screenShake = { intensity: 0, duration: 0 };

        // Reset independent piece generation system
        this.initializeBagAndQueue();
    }

    /**
     * Initialize the 7-bag system and next queue for this player
     */
    initializeBagAndQueue() {
        this.fillBag();
        this.nextQueue = [];
        for (let i = 0; i < 5; i++) {
            this.nextQueue.push(this.getNextPiece());
        }
    }

    /**
     * Fill the bag with all 7 tetromino types in random order
     */
    fillBag() {
        const pieces = ["I", "O", "T", "S", "Z", "J", "L"];
        for (let i = pieces.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
        }
        this.bag = pieces;
    }

    /**
     * Get the next piece from this player's bag
     */
    getNextPiece() {
        if (this.bag.length === 0) this.fillBag();
        return this.bag.pop();
    }
}

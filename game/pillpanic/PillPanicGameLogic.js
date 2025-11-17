/**
 * Pill Panic Game Logic Module
 * Handles all core game mechanics, grid management, and game state
 * Extracted from original implementation and modularized
 */
class PillPanicGameLogic {
    constructor(pillPanicGame) {
        this.game = pillPanicGame;
        
        /******* Game State *******/
        this.score = 0;
        this.level = 1;
        this.virusCount = 0;
        this.initialVirusCount = 0;
        this.chainCount = 0;
        
        /******* Game Grid *******/
        this.grid = this.createEmptyGrid();
        
        /******* Game Objects *******/
        this.currentCapsule = null;
        this.nextCapsule = null;
        this.fallTimer = 0;
        this.clearingTimer = 0;
        this.particles = [];

        /******* Ghost Piece *******/
        this.ghostCapsule = null;
        this.ghostX = 0;
        this.ghostY = 0;
        
        /******* Game Settings *******/
        this.selectedVirusLevel = 1;
        this.selectedSpeed = 1;
        
        /******* Visual Effects *******/
        this.bottleShake = { intensity: 0, duration: 0 };
        this.backgroundParticles = this.createBackgroundParticles();
        this.animationTime = 0;
        this.debugOverlayVisible = false;
    }
    
    /******* GRID MANAGEMENT *******/
    createEmptyGrid() {
        const grid = [];
        for (let row = 0; row < PILL_PANIC_CONSTANTS.GRID.ROWS; row++) {
            grid[row] = [];
            for (let col = 0; col < PILL_PANIC_CONSTANTS.GRID.COLS; col++) {
                grid[row][col] = new PillPanicCell();
            }
        }
        return grid;
    }
    
    placeViruses(count) {
        const colors = ["red", "blue", "yellow"];
        let placed = 0;
        
        this.grid = this.createEmptyGrid();
        const startRow = Math.floor(PILL_PANIC_CONSTANTS.GRID.ROWS / 3);
        
        while (placed < count) {
            const row = startRow + Math.floor(Math.random() * (PILL_PANIC_CONSTANTS.GRID.ROWS - startRow));
            const col = Math.floor(Math.random() * PILL_PANIC_CONSTANTS.GRID.COLS);
            
            if (this.grid[row][col].isEmpty()) {
                const color = colors[Math.floor(Math.random() * colors.length)];
                this.grid[row][col] = new PillPanicCell(color, "virus");
                placed++;
            }
        }
        
        this.virusCount = count;
        this.initialVirusCount = count;
    }
    
    /******* GAME FLOW *******/
    startGameWithSettings(virusLevel, speed) {
        this.selectedVirusLevel = virusLevel;
        this.selectedSpeed = speed;
        
        this.game.setState(PILL_PANIC_CONSTANTS.STATES.PLAYING);
        this.score = 0;
        this.level = 1;
        this.chainCount = 0;
        this.particles = [];
        
        this.placeViruses(virusLevel);
        this.spawnCapsule();
        this.nextCapsule = new PillPanicCapsule(3, -2);
        
        this.game.playSound("menuConfirm");
    }
    
    spawnCapsule() {
        this.currentCapsule = this.nextCapsule || new PillPanicCapsule(3, 0);
        this.currentCapsule.y = 0;
        this.currentCapsule.x = 3;
        this.nextCapsule = new PillPanicCapsule(3, -2);
        this.fallTimer = 0;

        this.calculateGhostPosition();

        const positions = this.currentCapsule.getPositions();
        if (!this.currentCapsule.isValidPosition(positions.left, this.grid) ||
            !this.currentCapsule.isValidPosition(positions.right, this.grid)) {
            this.handleGameOver();
        }
    }
    
    moveCapsule(deltaX, deltaY) {
        if (!this.currentCapsule || this.currentCapsule.locked) return false;

        const oldX = this.currentCapsule.x;
        const oldY = this.currentCapsule.y;

        this.currentCapsule.x += deltaX;
        this.currentCapsule.y += deltaY;

        const positions = this.currentCapsule.getPositions();
        if (!this.currentCapsule.isValidPosition(positions.left, this.grid) ||
            !this.currentCapsule.isValidPosition(positions.right, this.grid)) {
            this.currentCapsule.x = oldX;
            this.currentCapsule.y = oldY;
            return false;
        }

        this.calculateGhostPosition();
        return true;
    }

    rotateCapsule(clockwise = true) {
        if (!this.currentCapsule || this.currentCapsule.locked) return false;

        if (this.currentCapsule.tryRotate(this.grid, clockwise)) {
            this.calculateGhostPosition();
            return true;
        }
        return false;
    }
    
    /******* UPDATE LOGIC *******/
    update(deltaTime) {
        this.animationTime += deltaTime;
        
        if (this.game.gameState === PILL_PANIC_CONSTANTS.STATES.PLAYING) {
            this.updatePlayingState(deltaTime);
        } else if (this.game.gameState === PILL_PANIC_CONSTANTS.STATES.CLEARING) {
            this.updateClearingState(deltaTime);
        }
        
        this.updateVisualEffects(deltaTime);
    }
    
    updatePlayingState(deltaTime) {
        if (!this.currentCapsule) return;
        
        const speedMultipliers = [0.7, 1.0, 1.5];
        const speedMultiplier = speedMultipliers[this.selectedSpeed] || 1.0;
        const baseSpeed = Math.max(
            PILL_PANIC_CONSTANTS.PHYSICS.MIN_FALL_SPEED,
            PILL_PANIC_CONSTANTS.PHYSICS.BASE_FALL_SPEED / speedMultiplier
        );
        
        const fallSpeed = this.game.input.isKeyPressed("DirDown")
            ? baseSpeed / PILL_PANIC_CONSTANTS.PHYSICS.FAST_DROP_MULTIPLIER
            : baseSpeed;
        
        this.fallTimer += deltaTime;
        
        if (this.fallTimer >= fallSpeed) {
            this.fallTimer = 0;
            
            if (!this.moveCapsule(0, 1)) {
                if (!this.currentCapsule.locked) {
                    this.currentCapsule.locked = true;
                    this.currentCapsule.lockTimer = PILL_PANIC_CONSTANTS.PHYSICS.LOCK_DELAY;
                }
            } else {
                this.currentCapsule.locked = false;
            }
        }
        
        if (this.currentCapsule.locked) {
            this.currentCapsule.lockTimer -= deltaTime;
            
            if (this.currentCapsule.lockTimer <= 0) {
                this.lockCapsule();
            }
        }
    }
    
    lockCapsule() {
        const positions = this.currentCapsule.getPositions();
        const colors = this.currentCapsule.getColors();
        
        const leftCell = new PillPanicCell(colors.leftColor, "capsule");
        const rightCell = new PillPanicCell(colors.rightColor, "capsule");
        
        leftCell.connectedTo = { x: positions.right.x, y: positions.right.y };
        rightCell.connectedTo = { x: positions.left.x, y: positions.left.y };
        
        this.grid[positions.left.y][positions.left.x] = leftCell;
        this.grid[positions.right.y][positions.right.x] = rightCell;
        
        this.game.playSound("land");
        this.checkAndClearMatches();
    }
    
    checkAndClearMatches() {
        let foundMatches = false;
        const toRemove = new Set();
        
        // Check horizontal matches
        for (let row = 0; row < PILL_PANIC_CONSTANTS.GRID.ROWS; row++) {
            for (let col = 0; col <= PILL_PANIC_CONSTANTS.GRID.COLS - PILL_PANIC_CONSTANTS.GRID.MATCH_COUNT; col++) {
                const color = this.grid[row][col].color;
                if (!color || this.grid[row][col].isEmpty()) continue;
                
                let matchLength = 1;
                for (let i = 1; col + i < PILL_PANIC_CONSTANTS.GRID.COLS; i++) {
                    if (this.grid[row][col + i].color === color && !this.grid[row][col + i].isEmpty()) {
                        matchLength++;
                    } else {
                        break;
                    }
                }
                
                if (matchLength >= PILL_PANIC_CONSTANTS.GRID.MATCH_COUNT) {
                    foundMatches = true;
                    for (let i = 0; i < matchLength; i++) {
                        toRemove.add(`${row},${col + i}`);
                    }
                }
            }
        }
        
        // Check vertical matches
        for (let col = 0; col < PILL_PANIC_CONSTANTS.GRID.COLS; col++) {
            for (let row = 0; row <= PILL_PANIC_CONSTANTS.GRID.ROWS - PILL_PANIC_CONSTANTS.GRID.MATCH_COUNT; row++) {
                const color = this.grid[row][col].color;
                if (!color || this.grid[row][col].isEmpty()) continue;
                
                let matchLength = 1;
                for (let i = 1; row + i < PILL_PANIC_CONSTANTS.GRID.ROWS; i++) {
                    if (this.grid[row + i][col].color === color && !this.grid[row + i][col].isEmpty()) {
                        matchLength++;
                    } else {
                        break;
                    }
                }
                
                if (matchLength >= PILL_PANIC_CONSTANTS.GRID.MATCH_COUNT) {
                    foundMatches = true;
                    for (let i = 0; i < matchLength; i++) {
                        toRemove.add(`${row + i},${col}`);
                    }
                }
            }
        }
        
        if (foundMatches) {
            this.clearMatches(toRemove);
        } else {
            // Check for victory only after gravity has finished
            if (this.virusCount <= 0) {
                this.handleVictory();
            } else {
                this.game.setState(PILL_PANIC_CONSTANTS.STATES.PLAYING);
                this.spawnCapsule();
            }
        }
    }
    
    clearMatches(toRemove) {
        this.game.setState(PILL_PANIC_CONSTANTS.STATES.CLEARING);
        this.clearingTimer = PILL_PANIC_CONSTANTS.PHYSICS.CLEAR_ANIMATION_TIME;
        this.chainCount++;
        
        let virusesCleared = 0;
        let pillsCleared = 0;
        
        toRemove.forEach((key) => {
            const [row, col] = key.split(",").map(Number);
            const cell = this.grid[row][col];
            
            if (cell.isVirus()) virusesCleared++;
            else if (cell.isCapsule()) pillsCleared++;
            
            cell.matched = true;
            this.createClearParticles(col, row, cell.color);
            
            if (cell.connectedTo && !toRemove.has(`${cell.connectedTo.y},${cell.connectedTo.x}`)) {
                const otherCell = this.grid[cell.connectedTo.y][cell.connectedTo.x];
                otherCell.type = "half";
                otherCell.connectedTo = null;
            }
        });
        
        this.score += virusesCleared * PILL_PANIC_CONSTANTS.GAMEPLAY.POINTS_PER_VIRUS * this.chainCount;
        this.score += pillsCleared * PILL_PANIC_CONSTANTS.GAMEPLAY.POINTS_PER_PILL * this.chainCount;
        this.virusCount -= virusesCleared;
        
        if (virusesCleared > 0) this.game.playSound("virusClear");
        this.game.playSound("match");
        if (this.chainCount > 1) {
            setTimeout(() => this.game.playSound("chain"), 100);
        }
        
        // Victory will be checked after gravity finishes in checkAndClearMatches
    }
    
    updateClearingState(deltaTime) {
        this.clearingTimer -= deltaTime;
        
        if (this.clearingTimer <= 0) {
            for (let row = 0; row < PILL_PANIC_CONSTANTS.GRID.ROWS; row++) {
                for (let col = 0; col < PILL_PANIC_CONSTANTS.GRID.COLS; col++) {
                    if (this.grid[row][col].matched) {
                        this.grid[row][col] = new PillPanicCell();
                    }
                }
            }
            
            const fell = this.applyGravity();

            if (fell) {
                this.clearingTimer = PILL_PANIC_CONSTANTS.PHYSICS.CHAIN_DELAY;
            } else {
                this.checkAndClearMatches();
                if (this.game.gameState !== PILL_PANIC_CONSTANTS.STATES.CLEARING) {
                    this.chainCount = 0;
                }
            }
        }
    }

    /******* GHOST PIECE *******/
    calculateGhostPosition() {
        if (!this.currentCapsule) return;

        let testX = this.currentCapsule.x;
        let testY = this.currentCapsule.y;

        // Try to drop the capsule as far as possible
        while (!this.checkCapsuleCollision(testX, testY + 1)) {
            testY++;
        }

        this.ghostX = testX;
        this.ghostY = testY;
    }

    checkCapsuleCollision(x, y) {
        if (!this.currentCapsule) return false;

        // Simulate capsule at test position with same orientation
        const tempCapsule = {
            x: x,
            y: y,
            orientation: this.currentCapsule.orientation,
            getPositions: () => {
                const left = { x: x, y: y };
                const right = { x: x, y: y };

                if (this.currentCapsule.orientation === "horizontal") {
                    right.x = x + 1;
                } else {
                    right.y = y + 1;
                }

                return { left, right };
            }
        };

        const positions = tempCapsule.getPositions();
        return !this.currentCapsule.isValidPosition(positions.left, this.grid) ||
               !this.currentCapsule.isValidPosition(positions.right, this.grid);
    }
    
    applyGravity() {
        let somethingFell = false;
        const processed = new Set();
        const movedPieces = new Set(); // Track pieces that actually moved
        
        // First pass: move pieces that can fall
        for (let row = PILL_PANIC_CONSTANTS.GRID.ROWS - 2; row >= 0; row--) {
            for (let col = 0; col < PILL_PANIC_CONSTANTS.GRID.COLS; col++) {
                const key = `${row},${col}`;
                if (processed.has(key)) continue;
                
                const cell = this.grid[row][col];
                if (cell.isEmpty() || cell.isVirus()) continue;
                
                const canFall = this.grid[row + 1][col].isEmpty();
                if (!canFall) continue;
                
                if (cell.connectedTo) {
                    const otherRow = cell.connectedTo.y;
                    const otherCol = cell.connectedTo.x;
                    const otherCell = this.grid[otherRow][otherCol];
                    
                    const isVertical = (col === otherCol);
                    const isHorizontal = (row === otherRow);
                    
                    let pillCanFall = false;
                    
                    if (isVertical) {
                        const bottomRow = Math.max(row, otherRow);
                        pillCanFall = (bottomRow + 1 < PILL_PANIC_CONSTANTS.GRID.ROWS) && 
                                     this.grid[bottomRow + 1][col].isEmpty();
                    } else if (isHorizontal) {
                        const thisHasSpace = canFall;
                        const otherHasSpace = (otherRow + 1 < PILL_PANIC_CONSTANTS.GRID.ROWS) && 
                                            this.grid[otherRow + 1][otherCol].isEmpty();
                        pillCanFall = thisHasSpace && otherHasSpace;
                    }
                    
                    if (pillCanFall) {
                        this.grid[row][col] = new PillPanicCell();
                        this.grid[otherRow][otherCol] = new PillPanicCell();
                        
                        this.grid[row + 1][col] = cell;
                        this.grid[otherRow + 1][otherCol] = otherCell;
                        
                        cell.connectedTo = { x: otherCol, y: otherRow + 1 };
                        otherCell.connectedTo = { x: col, y: row + 1 };
                        
                        // Mark the NEW positions as moved pieces
                        movedPieces.add(`${row + 1},${col}`);
                        movedPieces.add(`${otherRow + 1},${otherCol}`);
                        
                        somethingFell = true;
                    }
                    
                    processed.add(key);
                    processed.add(`${otherRow},${otherCol}`);
                } else {
                    this.grid[row + 1][col] = cell;
                    this.grid[row][col] = new PillPanicCell();
                    
                    // Mark the NEW position as moved piece
                    movedPieces.add(`${row + 1},${col}`);
                    
                    processed.add(key);
                    somethingFell = true;
                }
            }
        }
        
        // Second pass: check if any moved pieces are now blocked (landed)
        let somethingLanded = false;
        const landedProcessed = new Set();
        
        for (const movedKey of movedPieces) {
            if (landedProcessed.has(movedKey)) continue;
            
            const [row, col] = movedKey.split(',').map(Number);
            const cell = this.grid[row][col];
            
            if (cell.isEmpty()) continue; // Shouldn't happen but safety check
            
            // Check if this piece can fall further
            const belowIsEmpty = (row + 1 < PILL_PANIC_CONSTANTS.GRID.ROWS) && 
                                this.grid[row + 1][col].isEmpty();
            
            let canFallFurther = belowIsEmpty;
            
            // If there's something below, check if it's also a moved piece (still falling)
            if (!belowIsEmpty && row + 1 < PILL_PANIC_CONSTANTS.GRID.ROWS) {
                const belowKey = `${row + 1},${col}`;
                if (movedPieces.has(belowKey)) {
                    // The piece below also moved this cycle, so it will move out of the way
                    canFallFurther = true;
                }
            }
            
            if (!canFallFurther) {
                // This piece just moved but now can't fall further - it landed!
                if (cell.connectedTo) {
                    const otherRow = cell.connectedTo.y;
                    const otherCol = cell.connectedTo.x;
                    
                    // Check if the connected piece also can't fall
                    const otherBelowIsEmpty = (otherRow + 1 < PILL_PANIC_CONSTANTS.GRID.ROWS) && 
                                             this.grid[otherRow + 1][otherCol].isEmpty();
                    
                    let otherCanFall = otherBelowIsEmpty;
                    
                    // If there's something below the other piece, check if it's also moving
                    if (!otherBelowIsEmpty && otherRow + 1 < PILL_PANIC_CONSTANTS.GRID.ROWS) {
                        const otherBelowKey = `${otherRow + 1},${otherCol}`;
                        if (movedPieces.has(otherBelowKey)) {
                            otherCanFall = true;
                        }
                    }
                    
                    if (!otherCanFall) {
                        somethingLanded = true;
                        landedProcessed.add(movedKey);
                        landedProcessed.add(`${otherRow},${otherCol}`);
                    }
                } else {
                    somethingLanded = true;
                    landedProcessed.add(movedKey);
                }
            }
        }
        
        // Play sounds immediately when things happen
        // Only play move sound if something fell but nothing landed
        // (pieces that land shouldn't also play move sound)
        if (somethingFell && !somethingLanded) {
            this.game.playSound("move");
        }
        if (somethingLanded) {
            this.game.playSound("land");
        }
        
        return somethingFell;
    }
    
    handleVictory() {
        this.game.setState(PILL_PANIC_CONSTANTS.STATES.VICTORY);
        this.game.playSound("victory");
        this.bottleShake = { intensity: 5, duration: 1.0 };
    }
    
    handleGameOver() {
        this.game.setState(PILL_PANIC_CONSTANTS.STATES.GAME_OVER);
        this.game.playSound("gameOver");
    }
    
    /******* PARTICLE EFFECTS *******/
    createClearParticles(gridX, gridY, color) {
        const x = PILL_PANIC_CONSTANTS.GRID.OFFSET_X + gridX * PILL_PANIC_CONSTANTS.GRID.CELL_SIZE + PILL_PANIC_CONSTANTS.GRID.CELL_SIZE / 2;
        const y = PILL_PANIC_CONSTANTS.GRID.OFFSET_Y + gridY * PILL_PANIC_CONSTANTS.GRID.CELL_SIZE + PILL_PANIC_CONSTANTS.GRID.CELL_SIZE / 2;
        
        const colorMap = {
            red: PILL_PANIC_CONSTANTS.COLORS.GAME.RED,
            blue: PILL_PANIC_CONSTANTS.COLORS.GAME.BLUE,
            yellow: PILL_PANIC_CONSTANTS.COLORS.GAME.YELLOW
        };
        
        for (let i = 0; i < PILL_PANIC_CONSTANTS.VISUAL.PARTICLE_COUNT; i++) {
            const angle = (Math.PI * 2 * i) / PILL_PANIC_CONSTANTS.VISUAL.PARTICLE_COUNT;
            const speed = 100 + Math.random() * 100;
            
            this.particles.push({
                x: x, y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.8 + Math.random() * 0.4,
                maxLife: 1.2,
                size: 3 + Math.random() * 3,
                color: colorMap[color],
                rotation: 0,
                rotationSpeed: (Math.random() - 0.5) * 10
            });
        }
    }
    
    createBackgroundParticles() {
        const particles = [];
        for (let i = 0; i < 30; i++) {
            particles.push({
                x: Math.random() * PILL_PANIC_CONSTANTS.WIDTH,
                y: Math.random() * PILL_PANIC_CONSTANTS.HEIGHT,
                size: Math.random() * 3 + 1,
                speed: Math.random() * 20 + 10,
                opacity: Math.random() * 0.3 + 0.1,
                color: ["#ff4757", "#3742fa", "#ffd32a"][Math.floor(Math.random() * 3)]
            });
        }
        return particles;
    }
    
    updateVisualEffects(deltaTime) {
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.vy += 300 * deltaTime;
            p.life -= deltaTime;
            p.rotation += p.rotationSpeed * deltaTime;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        // Update background particles
        this.backgroundParticles.forEach((p) => {
            p.y += p.speed * deltaTime;
            if (p.y > PILL_PANIC_CONSTANTS.HEIGHT) {
                p.y = -10;
                p.x = Math.random() * PILL_PANIC_CONSTANTS.WIDTH;
            }
        });
        
        // Update bottle shake
        if (this.bottleShake.duration > 0) {
            this.bottleShake.duration -= deltaTime;
            if (this.bottleShake.duration <= 0) {
                this.bottleShake.intensity = 0;
            }
        }
    }
}

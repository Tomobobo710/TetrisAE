/**
 * Dr. Mario Game Logic Module
 * Handles all core game mechanics, grid management, and game state
 * Extracted from original implementation and modularized
 */
class DrMarioGameLogic {
    constructor(drMarioGame) {
        this.game = drMarioGame;
        
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
        for (let row = 0; row < DR_MARIO_CONSTANTS.GRID.ROWS; row++) {
            grid[row] = [];
            for (let col = 0; col < DR_MARIO_CONSTANTS.GRID.COLS; col++) {
                grid[row][col] = new DrMarioCell();
            }
        }
        return grid;
    }
    
    placeViruses(count) {
        const colors = ["red", "blue", "yellow"];
        let placed = 0;
        
        this.grid = this.createEmptyGrid();
        const startRow = Math.floor(DR_MARIO_CONSTANTS.GRID.ROWS / 3);
        
        while (placed < count) {
            const row = startRow + Math.floor(Math.random() * (DR_MARIO_CONSTANTS.GRID.ROWS - startRow));
            const col = Math.floor(Math.random() * DR_MARIO_CONSTANTS.GRID.COLS);
            
            if (this.grid[row][col].isEmpty()) {
                const color = colors[Math.floor(Math.random() * colors.length)];
                this.grid[row][col] = new DrMarioCell(color, "virus");
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
        
        this.game.setState(DR_MARIO_CONSTANTS.STATES.PLAYING);
        this.score = 0;
        this.level = 1;
        this.chainCount = 0;
        this.particles = [];
        
        this.placeViruses(virusLevel);
        this.spawnCapsule();
        this.nextCapsule = new DrMarioCapsule(3, -2);
        
        this.game.playSound("menuConfirm");
    }
    
    spawnCapsule() {
        this.currentCapsule = this.nextCapsule || new DrMarioCapsule(3, 0);
        this.currentCapsule.y = 0;
        this.currentCapsule.x = 3;
        this.nextCapsule = new DrMarioCapsule(3, -2);
        this.fallTimer = 0;
        
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
        
        return true;
    }
    
    /******* UPDATE LOGIC *******/
    update(deltaTime) {
        this.animationTime += deltaTime;
        
        if (this.game.gameState === DR_MARIO_CONSTANTS.STATES.PLAYING) {
            this.updatePlayingState(deltaTime);
        } else if (this.game.gameState === DR_MARIO_CONSTANTS.STATES.CLEARING) {
            this.updateClearingState(deltaTime);
        }
        
        this.updateVisualEffects(deltaTime);
    }
    
    updatePlayingState(deltaTime) {
        if (!this.currentCapsule) return;
        
        const speedMultipliers = [0.7, 1.0, 1.5];
        const speedMultiplier = speedMultipliers[this.selectedSpeed] || 1.0;
        const baseSpeed = Math.max(
            DR_MARIO_CONSTANTS.PHYSICS.MIN_FALL_SPEED,
            DR_MARIO_CONSTANTS.PHYSICS.BASE_FALL_SPEED / speedMultiplier
        );
        
        const fallSpeed = this.game.input.isKeyPressed("DirDown")
            ? baseSpeed / DR_MARIO_CONSTANTS.PHYSICS.FAST_DROP_MULTIPLIER
            : baseSpeed;
        
        this.fallTimer += deltaTime;
        
        if (this.fallTimer >= fallSpeed) {
            this.fallTimer = 0;
            
            if (!this.moveCapsule(0, 1)) {
                if (!this.currentCapsule.locked) {
                    this.currentCapsule.locked = true;
                    this.currentCapsule.lockTimer = DR_MARIO_CONSTANTS.PHYSICS.LOCK_DELAY;
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
        
        const leftCell = new DrMarioCell(colors.leftColor, "capsule");
        const rightCell = new DrMarioCell(colors.rightColor, "capsule");
        
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
        for (let row = 0; row < DR_MARIO_CONSTANTS.GRID.ROWS; row++) {
            for (let col = 0; col <= DR_MARIO_CONSTANTS.GRID.COLS - DR_MARIO_CONSTANTS.GRID.MATCH_COUNT; col++) {
                const color = this.grid[row][col].color;
                if (!color || this.grid[row][col].isEmpty()) continue;
                
                let matchLength = 1;
                for (let i = 1; col + i < DR_MARIO_CONSTANTS.GRID.COLS; i++) {
                    if (this.grid[row][col + i].color === color && !this.grid[row][col + i].isEmpty()) {
                        matchLength++;
                    } else {
                        break;
                    }
                }
                
                if (matchLength >= DR_MARIO_CONSTANTS.GRID.MATCH_COUNT) {
                    foundMatches = true;
                    for (let i = 0; i < matchLength; i++) {
                        toRemove.add(`${row},${col + i}`);
                    }
                }
            }
        }
        
        // Check vertical matches
        for (let col = 0; col < DR_MARIO_CONSTANTS.GRID.COLS; col++) {
            for (let row = 0; row <= DR_MARIO_CONSTANTS.GRID.ROWS - DR_MARIO_CONSTANTS.GRID.MATCH_COUNT; row++) {
                const color = this.grid[row][col].color;
                if (!color || this.grid[row][col].isEmpty()) continue;
                
                let matchLength = 1;
                for (let i = 1; row + i < DR_MARIO_CONSTANTS.GRID.ROWS; i++) {
                    if (this.grid[row + i][col].color === color && !this.grid[row + i][col].isEmpty()) {
                        matchLength++;
                    } else {
                        break;
                    }
                }
                
                if (matchLength >= DR_MARIO_CONSTANTS.GRID.MATCH_COUNT) {
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
            this.game.setState(DR_MARIO_CONSTANTS.STATES.PLAYING);
            this.spawnCapsule();
        }
    }
    
    clearMatches(toRemove) {
        this.game.setState(DR_MARIO_CONSTANTS.STATES.CLEARING);
        this.clearingTimer = DR_MARIO_CONSTANTS.PHYSICS.CLEAR_ANIMATION_TIME;
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
        
        this.score += virusesCleared * DR_MARIO_CONSTANTS.GAMEPLAY.POINTS_PER_VIRUS * this.chainCount;
        this.score += pillsCleared * DR_MARIO_CONSTANTS.GAMEPLAY.POINTS_PER_PILL * this.chainCount;
        this.virusCount -= virusesCleared;
        
        if (virusesCleared > 0) this.game.playSound("virusClear");
        this.game.playSound("match");
        if (this.chainCount > 1) {
            setTimeout(() => this.game.playSound("chain"), 100);
        }
        
        if (this.virusCount <= 0) {
            setTimeout(() => this.handleVictory(), DR_MARIO_CONSTANTS.PHYSICS.CLEAR_ANIMATION_TIME * 1000);
        }
    }
    
    updateClearingState(deltaTime) {
        this.clearingTimer -= deltaTime;
        
        if (this.clearingTimer <= 0) {
            for (let row = 0; row < DR_MARIO_CONSTANTS.GRID.ROWS; row++) {
                for (let col = 0; col < DR_MARIO_CONSTANTS.GRID.COLS; col++) {
                    if (this.grid[row][col].matched) {
                        this.grid[row][col] = new DrMarioCell();
                    }
                }
            }
            
            const fell = this.applyGravity();
            
            if (fell) {
                this.clearingTimer = DR_MARIO_CONSTANTS.PHYSICS.CHAIN_DELAY;
            } else {
                this.checkAndClearMatches();
                if (this.game.gameState !== DR_MARIO_CONSTANTS.STATES.CLEARING) {
                    this.chainCount = 0;
                }
            }
        }
    }
    
    applyGravity() {
        let somethingFell = false;
        const processed = new Set();
        
        for (let row = DR_MARIO_CONSTANTS.GRID.ROWS - 2; row >= 0; row--) {
            for (let col = 0; col < DR_MARIO_CONSTANTS.GRID.COLS; col++) {
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
                        pillCanFall = (bottomRow + 1 < DR_MARIO_CONSTANTS.GRID.ROWS) && 
                                     this.grid[bottomRow + 1][col].isEmpty();
                    } else if (isHorizontal) {
                        const thisHasSpace = canFall;
                        const otherHasSpace = (otherRow + 1 < DR_MARIO_CONSTANTS.GRID.ROWS) && 
                                            this.grid[otherRow + 1][otherCol].isEmpty();
                        pillCanFall = thisHasSpace && otherHasSpace;
                    }
                    
                    if (pillCanFall) {
                        this.grid[row][col] = new DrMarioCell();
                        this.grid[otherRow][otherCol] = new DrMarioCell();
                        
                        this.grid[row + 1][col] = cell;
                        this.grid[otherRow + 1][otherCol] = otherCell;
                        
                        cell.connectedTo = { x: otherCol, y: otherRow + 1 };
                        otherCell.connectedTo = { x: col, y: row + 1 };
                        
                        processed.add(key);
                        processed.add(`${otherRow},${otherCol}`);
                        somethingFell = true;
                    }
                } else {
                    this.grid[row + 1][col] = cell;
                    this.grid[row][col] = new DrMarioCell();
                    processed.add(key);
                    somethingFell = true;
                }
            }
        }
        
        return somethingFell;
    }
    
    handleVictory() {
        this.game.setState(DR_MARIO_CONSTANTS.STATES.VICTORY);
        this.game.playSound("victory");
        this.bottleShake = { intensity: 5, duration: 1.0 };
    }
    
    handleGameOver() {
        this.game.setState(DR_MARIO_CONSTANTS.STATES.GAME_OVER);
        this.game.playSound("gameOver");
    }
    
    /******* PARTICLE EFFECTS *******/
    createClearParticles(gridX, gridY, color) {
        const x = DR_MARIO_CONSTANTS.GRID.OFFSET_X + gridX * DR_MARIO_CONSTANTS.GRID.CELL_SIZE + DR_MARIO_CONSTANTS.GRID.CELL_SIZE / 2;
        const y = DR_MARIO_CONSTANTS.GRID.OFFSET_Y + gridY * DR_MARIO_CONSTANTS.GRID.CELL_SIZE + DR_MARIO_CONSTANTS.GRID.CELL_SIZE / 2;
        
        const colorMap = {
            red: DR_MARIO_CONSTANTS.COLORS.GAME.RED,
            blue: DR_MARIO_CONSTANTS.COLORS.GAME.BLUE,
            yellow: DR_MARIO_CONSTANTS.COLORS.GAME.YELLOW
        };
        
        for (let i = 0; i < DR_MARIO_CONSTANTS.VISUAL.PARTICLE_COUNT; i++) {
            const angle = (Math.PI * 2 * i) / DR_MARIO_CONSTANTS.VISUAL.PARTICLE_COUNT;
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
                x: Math.random() * DR_MARIO_CONSTANTS.WIDTH,
                y: Math.random() * DR_MARIO_CONSTANTS.HEIGHT,
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
            if (p.y > DR_MARIO_CONSTANTS.HEIGHT) {
                p.y = -10;
                p.x = Math.random() * DR_MARIO_CONSTANTS.WIDTH;
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

/**
 * MatrixTheme - Authentic Matrix digital rain implementation
 */
class MatrixTheme extends BaseTheme {
    constructor() {
        super();
        this.name = 'Matrix';

        // Initialize visuals object for theme-specific effects
        this.visuals = {};

        // Theme colors and styling
        this.playfield = {
            background: 'rgba(0, 0, 0, 0.95)',
            border: '#00ff41',
            grid: 'rgba(0, 255, 65, 0.15)',
            shadow: 'rgba(0, 255, 65, 0.4)'
        };
        this.pieces = {
             I: { base: '#00ff41', glow: '#66ff77', shadow: '#008820' },
             O: { base: '#00cc88', glow: '#44ffaa', shadow: '#006644' },
             T: { base: '#ccff99', glow: '#eeffbb', shadow: '#668844' },
             S: { base: '#00aa44', glow: '#44cc66', shadow: '#005522' },
             Z: { base: '#44ff88', glow: '#77ffaa', shadow: '#228844' },
             J: { base: '#00ff88', glow: '#44ffaa', shadow: '#008844' },
             L: { base: '#aaff00', glow: '#ccff44', shadow: '#558800' },
             garbage: { base: '#666666', glow: '#666666', shadow: '#444444' }
         };
        this.ui = {
            background: 'rgba(0, 10, 0, 0.9)',
            text: '#00ff41',
            accent: '#00ff41',
            border: '#00ff41'
        };
        this.background = {
            type: 'digital_rain',
            colors: ['#003311', '#10ff51', '#ccffcc'], // Dark, whitish-green, light green
            intensity: 1.0
        };

        // Initialize authentic digital rain
        this.visuals.digitalRain = this.createDigitalRain();

        // Enable animated UI colors
        this.uiAnimation.enabled = true;
        this.uiAnimation.speed = 0.6; // Fast, digital feel
        this.uiAnimation.colors = [
            '#003311', // Dark green
            '#00ff41', // Bright matrix green
            '#00cc88', // Medium green
            '#ccffcc', // Light green
            '#00ff88', // Cyan green
            '#44ffaa', // Light cyan
            '#00ff41', // Matrix green (back)
        ];
    }
    
    /**
     * Setup - fast-forward animation to populate rain grid
     */
    setup() {
        // Run 30 seconds worth of updates at 60fps to populate the grid
        const frameTime = 1 / 60; // 60fps
        const numFrames = 30 * 60; // 30 seconds * 60fps = 1800 frames
        
        for (let i = 0; i < numFrames; i++) {
            this.update(frameTime);
        }
    }


    /**
     * Create authentic Matrix digital rain with column-based system
     */
    createDigitalRain() {
        const cellSize = 24; // Size of each character cell
        const numColumns = Math.ceil(TETRIS.WIDTH / cellSize) * 2; // Reduced from 4x to 2x screen width
        const numRows = Math.ceil(TETRIS.HEIGHT / cellSize) + 10; // Extra rows for off-screen buffer
        
        const columns = [];
        const tetrominoTypes = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

        // Create columns across the screen with random X positions (simplified)
        for (let i = 0; i < numColumns; i++) {
            const distance = 0.3 + Math.random() * 0.7; // 0.3 = far, 1.0 = close
            const effectiveCellSize = cellSize * (0.35 + distance * 0.85); // Scale spacing with distance
            const column = {
                x: Math.random() * TETRIS.WIDTH, // Simple random X position
                cellSize: cellSize,
                effectiveCellSize: effectiveCellSize, // Distance-scaled vertical spacing
                distance: distance,
                baseSpeed: 80 + Math.random() * 120, // Base speed before distance multiplier
                speed: (80 + Math.random() * 120) * (0.4 + distance * 0.6), // Far = slower, close = faster
                currentY: -Math.random() * 300, // Start at different positions
                restartDelay: 0, // Delay before starting new cascade after reaching bottom
                
                // Grid to store placed characters that fade over time
                grid: new Array(numRows).fill(null).map(() => ({
                    pieceType: null,
                    rotation: 0,
                    age: 0, // How long this character has been here (for fading)
                    brightness: 0,
                    changeTimer: Math.random() * 0.3 + 0.1 // Time until character morphs (0.1-0.4s)
                })),
                
                // Head character that's currently falling
                headChar: {
                    pieceType: tetrominoTypes[Math.floor(Math.random() * tetrominoTypes.length)],
                    rotation: Math.floor(Math.random() * 4) * 90
                }
            };
            
            columns.push(column);
        }

        return { columns, cellSize, numRows };
    }

    /**
     * Update Matrix theme animation - authentic cascading rain
     */
    update(deltaTime) {
        super.update(deltaTime);

        const rain = this.visuals.digitalRain;
        const tetrominoTypes = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
        const fadeSpeed = 1.5; // How fast characters fade (higher = faster fade)

        rain.columns.forEach(column => {
            if (column.restartDelay > 0) {
                // Column is waiting to restart
                column.restartDelay -= deltaTime;
                if (column.restartDelay <= 0) {
                    column.x = Math.random() * TETRIS.WIDTH; // Simple random X position
                    column.currentY = -rain.cellSize * (2 + Math.random() * 5);
                    column.headChar.pieceType = tetrominoTypes[Math.floor(Math.random() * tetrominoTypes.length)];
                    column.headChar.rotation = Math.floor(Math.random() * 4) * 90;
                }
            } else {
                // Move the cascade head down
                column.currentY += column.speed * deltaTime;
                
                const rowIndex = Math.floor(column.currentY / column.effectiveCellSize);
                
                // Place character in grid as head passes
                if (rowIndex >= 0 && rowIndex < rain.numRows) {
                    const cell = column.grid[rowIndex];
                    
                    // If this cell is empty or very old, place new character
                    if (cell.pieceType === null || cell.age > 3.0) {
                        cell.pieceType = column.headChar.pieceType;
                        cell.rotation = column.headChar.rotation;
                        cell.age = 0;
                        cell.brightness = 1.0;
                        cell.changeTimer = Math.random() * 0.3 + 0.1;
                        
                        // Occasionally change the head character
                        if (Math.random() < 0.15) {
                            column.headChar.pieceType = tetrominoTypes[Math.floor(Math.random() * tetrominoTypes.length)];
                            column.headChar.rotation = Math.floor(Math.random() * 4) * 90;
                        }
                    }
                }
                
                // Reset when reaching bottom
                if (column.currentY > TETRIS.HEIGHT + rain.cellSize * 3) {
                    column.restartDelay = Math.random() * 0.5 + 0.2; // 0.2-0.7s delay
                }
            }
            
            // Age and fade all placed characters
            column.grid.forEach(cell => {
                if (cell.pieceType !== null) {
                    cell.age += deltaTime * fadeSpeed;
                    
                    // Brightness fades over time
                    // Newest (age 0) = brightness 1.0
                    // After 3 seconds = brightness 0
                    cell.brightness = Math.max(0, 1.0 - (cell.age / 3.0));
                    
                    // Randomly change character as it fades
                    cell.changeTimer -= deltaTime;
                    if (cell.changeTimer <= 0) {
                        cell.pieceType = tetrominoTypes[Math.floor(Math.random() * tetrominoTypes.length)];
                        cell.rotation = Math.floor(Math.random() * 4) * 90;
                        cell.changeTimer = Math.random() * 0.3 + 0.1; // Next change in 0.1-0.4s
                    }
                    
                    // Clear very old, fully faded characters
                    if (cell.age > 3.5) {
                        cell.pieceType = null;
                        cell.brightness = 0;
                    }
                }
            });
        });
    }

    /**
     * Draw authentic Matrix digital rain
     */
    drawBackground(ctx, opacity) {
        const rain = this.visuals.digitalRain;
        const colors = this.background.colors;
        
        rain.columns.forEach(column => {
            // Draw the bright head character
            if (column.restartDelay <= 0) {
                const headY = column.currentY;
                if (headY >= 0 && headY < TETRIS.HEIGHT) {
                    const charSize = rain.cellSize * (0.35 + column.distance * 0.85); // Far = smaller (50%), close = bigger (120%)
                    const charOpacity = opacity * column.distance; // Far = more transparent
                    this.drawTetrominoCharacter(
                        ctx,
                        column.headChar.pieceType,
                        column.x,
                        headY,
                        charSize,
                        charOpacity * 1.0, // Full brightness for head
                        colors,
                        column.headChar.rotation,
                        true // isHead
                    );
                }
            }
            
            // Draw all placed characters in the column grid
            column.grid.forEach((cell, rowIndex) => {
                if (cell.pieceType !== null && cell.brightness > 0.05) {
                    const y = rowIndex * column.effectiveCellSize;
                    
                    if (y >= -rain.cellSize && y < TETRIS.HEIGHT + rain.cellSize) {
                        const charSize = rain.cellSize * (0.35 + column.distance * 0.85); // Far = smaller (50%), close = bigger (120%)
                        const charOpacity = opacity * cell.brightness * column.distance; // Far = more transparent
                        this.drawTetrominoCharacter(
                            ctx,
                            cell.pieceType,
                            column.x,
                            y,
                            charSize,
                            charOpacity,
                            colors,
                            cell.rotation,
                            false // not head
                        );
                    }
                }
            });
        });
    }

    /**
     * Draw a tetromino character with proper rotation bounds
     */
    drawTetrominoCharacter(ctx, pieceType, x, y, cellSize, opacity, colors, rotation = 0, isHead = false) {
        // Get the proper shape for this piece and rotation
        const shape = this.getTetrominoShape(pieceType, rotation);
        if (!shape) return;

        ctx.save();
        ctx.globalAlpha = opacity;

        const blockSize = cellSize / 4; // Each tetromino cell is 1/4 of the character cell
        
        // Calculate centering based on shape dimensions
        const shapeWidth = shape[0].length * blockSize;
        const shapeHeight = shape.length * blockSize;
        const offsetX = x + (cellSize - shapeWidth) / 2;
        const offsetY = y + (cellSize - shapeHeight) / 2;

        // Choose color based on whether this is the head (brightest) or a trail
        const colorIndex = isHead ? 1 : 1; // Both head and fresh trails use bright green
        const baseColor = colors[colorIndex];
        const highlightColor = colors[2];

        // Draw each block of the tetromino
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const blockX = offsetX + col * blockSize;
                    const blockY = offsetY + row * blockSize;

                    // Main block
                    ctx.fillStyle = baseColor;
                    ctx.fillRect(blockX, blockY, blockSize - 1, blockSize - 1);

                    if (isHead && blockSize > 3) {
                        // Add highlight for head character only
                        ctx.fillStyle = highlightColor;
                        ctx.fillRect(blockX + 1, blockY + 1, Math.max(1, blockSize - 4), Math.max(1, blockSize - 4));
                    }
                }
            }
        }

        ctx.restore();
    }

    /**
     * Get properly sized tetromino shape for given rotation
     * Returns a 2D array optimized for each rotation angle
     */
    getTetrominoShape(pieceType, rotation) {
        const shapes = {
            I: {
                0:   [[1, 1, 1, 1]],
                90:  [[1], [1], [1], [1]],
                180: [[1, 1, 1, 1]],
                270: [[1], [1], [1], [1]]
            },
            O: {
                0:   [[1, 1], [1, 1]],
                90:  [[1, 1], [1, 1]],
                180: [[1, 1], [1, 1]],
                270: [[1, 1], [1, 1]]
            },
            T: {
                0:   [[0, 1, 0], [1, 1, 1]],
                90:  [[1, 0], [1, 1], [1, 0]],
                180: [[1, 1, 1], [0, 1, 0]],
                270: [[0, 1], [1, 1], [0, 1]]
            },
            S: {
                0:   [[0, 1, 1], [1, 1, 0]],
                90:  [[1, 0], [1, 1], [0, 1]],
                180: [[0, 1, 1], [1, 1, 0]],
                270: [[1, 0], [1, 1], [0, 1]]
            },
            Z: {
                0:   [[1, 1, 0], [0, 1, 1]],
                90:  [[0, 1], [1, 1], [1, 0]],
                180: [[1, 1, 0], [0, 1, 1]],
                270: [[0, 1], [1, 1], [1, 0]]
            },
            J: {
                0:   [[1, 0, 0], [1, 1, 1]],
                90:  [[1, 1], [1, 0], [1, 0]],
                180: [[1, 1, 1], [0, 0, 1]],
                270: [[0, 1], [0, 1], [1, 1]]
            },
            L: {
                0:   [[0, 0, 1], [1, 1, 1]],
                90:  [[1, 0], [1, 0], [1, 1]],
                180: [[1, 1, 1], [1, 0, 0]],
                270: [[1, 1], [0, 1], [0, 1]]
            }
        };

        return shapes[pieceType]?.[rotation] || shapes[pieceType]?.[0];
    }
}
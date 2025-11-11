/**
 * GameBoyTheme - Complete Game Boy theme implementation
 */
class GameBoyTheme extends BaseTheme {
    constructor() {
        super();
        this.name = 'Game Boy';

        // Theme colors and styling
        this.playfield = {
            background: 'rgba(8, 24, 32, 0.98)',
            border: '#88c070',
            grid: 'rgba(136, 192, 112, 0.15)',
            shadow: 'rgba(136, 192, 112, 0.4)'
        };
        this.pieces = {
             I: { base: '#90EE90', glow: '#e0f8d0', shadow: '#346856' },
             O: { base: '#32CD32', glow: '#e0f8d0', shadow: '#346856' },
             T: { base: '#228B22', glow: '#e0f8d0', shadow: '#346856' },
             S: { base: '#006400', glow: '#e0f8d0', shadow: '#346856' },
             Z: { base: '#9ACD32', glow: '#e0f8d0', shadow: '#346856' },
             J: { base: '#6B8E23', glow: '#e0f8d0', shadow: '#346856' },
             L: { base: '#556B2F', glow: '#e0f8d0', shadow: '#346856' },
             garbage: { base: '#666666', glow: '#666666', shadow: '#444444' }
         };
        this.ui = {
            background: 'rgba(8, 24, 32, 0.95)',
            text: '#e0f8d0',
            accent: '#88c070',
            border: '#88c070'
        };
        this.background = {
            type: 'gameboy_blocks',
            colors: ['#346856', '#88c070', '#e0f8d0'],
            intensity: 0.5
        };

        // Initialize floating tetromino blocks for GameBoy theme
        this.floatingTetrominoes = this.createFloatingTetrominoes();

        // Enable animated UI colors
        this.uiAnimation.enabled = true;
        this.uiAnimation.speed = 0.2; // Slow, retro feel
        this.uiAnimation.colors = [
            '#346856', // Dark green
            '#88c070', // Medium green
            '#e0f8d0', // Light cream
            '#90EE90', // Light green
            '#32CD32', // Lime green
            '#228B22', // Forest green
            '#e0f8d0', // Light cream (back)
        ];
    }

    /**
     * Create floating tetromino blocks for GameBoy theme
     */
    createFloatingTetrominoes() {
        const tetrominoes = [];
        const tetrominoShapes = [
            [[1,1,1,1]], // I
            [[1,1],[1,1]], // O
            [[0,1,0],[1,1,1]], // T
            [[1,1,0],[0,1,1]], // S
            [[0,1,1],[1,1,0]], // Z
            [[1,0,0],[1,1,1]], // J
            [[0,0,1],[1,1,1]]  // L
        ];

        for (let i = 0; i < 30; i++) {
            tetrominoes.push({
                x: Math.random() * TETRIS.WIDTH,
                y: Math.random() * TETRIS.HEIGHT,
                vx: (Math.random() - 0.5) * 40,
                vy: (Math.random() - 0.5) * 40,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 1.5,
                opacity: Math.random() * 0.3 + 0.1,
                shapeIndex: i % tetrominoShapes.length,
                pulsePhase: Math.random() * Math.PI * 2
            });
        }
        return tetrominoes;
    }

    /**
      * Update Game Boy theme animation
      */
    update(deltaTime) {
        super.update(deltaTime);

        // Update floating tetromino blocks
        this.floatingTetrominoes.forEach(tetromino => {
            tetromino.x += tetromino.vx * deltaTime;
            tetromino.y += tetromino.vy * deltaTime;
            tetromino.rotation += tetromino.rotationSpeed * deltaTime;
            tetromino.pulsePhase += deltaTime * 2;

            if (tetromino.x < -100) tetromino.x = TETRIS.WIDTH + 100;
            if (tetromino.x > TETRIS.WIDTH + 100) tetromino.x = -100;
            if (tetromino.y < -100) tetromino.y = TETRIS.HEIGHT + 100;
            if (tetromino.y > TETRIS.HEIGHT + 100) tetromino.y = -100;
        });

    }

    /**
      * Draw Game Boy background effect with floating tetromino blocks
      */
    drawBackground(ctx, opacity) {
        const colors = this.background.colors;
        const blockSize = 20;

        // Draw classic tetromino shapes floating in background
        const tetrominoShapes = [
            [[1,1,1,1]], // I
            [[1,1],[1,1]], // O
            [[0,1,0],[1,1,1]], // T
            [[1,1,0],[0,1,1]], // S
            [[0,1,1],[1,1,0]], // Z
            [[1,0,0],[1,1,1]], // J
            [[0,0,1],[1,1,1]]  // L
        ];

        // Draw floating tetromino blocks
        this.floatingTetrominoes.forEach(tetromino => {
            const tetrominoShape = tetrominoShapes[tetromino.shapeIndex];

            ctx.save();
            ctx.translate(tetromino.x, tetromino.y);
            ctx.rotate(tetromino.rotation);

            const pulse = Math.sin(tetromino.pulsePhase) * 0.15 + 0.85;
            ctx.globalAlpha = tetromino.opacity * opacity * pulse;

            // Draw each block of the tetromino
            for (let row = 0; row < tetrominoShape.length; row++) {
                for (let col = 0; col < tetrominoShape[row].length; col++) {
                    if (tetrominoShape[row][col]) {
                        const x = (col - tetrominoShape[row].length / 2) * blockSize;
                        const y = (row - tetrominoShape.length / 2) * blockSize;

                        // Classic Game Boy block style - simple and clean
                        ctx.fillStyle = colors[1]; // Medium green
                        ctx.fillRect(x, y, blockSize - 2, blockSize - 2);

                        // Highlight
                        ctx.fillStyle = colors[2]; // Light cream
                        ctx.fillRect(x + 1, y + 1, blockSize - 4, 3);
                        ctx.fillRect(x + 1, y + 1, 3, blockSize - 4);

                        // Shadow
                        ctx.fillStyle = colors[0]; // Dark green
                        ctx.fillRect(x + blockSize - 4, y + 3, 2, blockSize - 5);
                        ctx.fillRect(x + 3, y + blockSize - 4, blockSize - 5, 2);

                        // Outer border
                        ctx.strokeStyle = colors[0];
                        ctx.lineWidth = 1;
                        ctx.strokeRect(x, y, blockSize - 2, blockSize - 2);
                    }
                }
            }

            ctx.restore();
        });

        // Draw retro scanline effect
        ctx.globalAlpha = 0.03 * opacity;
        ctx.fillStyle = colors[0];
        for (let y = 0; y < TETRIS.HEIGHT; y += 4) {
            ctx.fillRect(0, y, TETRIS.WIDTH, 2);
        }

        // Subtle vignette for that classic screen feel
        const vignette = ctx.createRadialGradient(
            TETRIS.WIDTH / 2, TETRIS.HEIGHT / 2, TETRIS.WIDTH * 0.3,
            TETRIS.WIDTH / 2, TETRIS.HEIGHT / 2, TETRIS.WIDTH * 0.8
        );
        vignette.addColorStop(0, 'transparent');
        vignette.addColorStop(1, 'rgba(8, 24, 32, 0.3)');
        ctx.globalAlpha = opacity;
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, TETRIS.WIDTH, TETRIS.HEIGHT);
    }
}
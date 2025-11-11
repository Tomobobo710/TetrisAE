/******* GAME CONFIGURATION CONSTANTS *******/
const TETRIS = {
    // ActionEngine required dimensions
    WIDTH: 800,
    HEIGHT: 600,

    // Playfield configuration
    GRID: {
        COLS: 10,
        ROWS: 24, // 20 visible + 4 buffer rows above
        VISIBLE_ROWS: 20,
        BUFFER_ROWS: 4, // Rows above the visible playfield
        CELL_SIZE: 24,
        // Calculated playfield dimensions
        get WIDTH() {
            return this.COLS * this.CELL_SIZE;
        },
        get HEIGHT() {
            return this.VISIBLE_ROWS * this.CELL_SIZE;
        },
        // Centered playfield position
        get X() {
            return (TETRIS.WIDTH - this.WIDTH) / 2;
        },
        get Y() {
            return 60;
        }
    },

    // Game timing and difficulty
    TIMING: {
        INITIAL_DROP_SPEED: 800, // milliseconds per row
        MIN_DROP_SPEED: 100,
        SPEED_DECREASE_PER_LEVEL: 50,
        LOCK_DELAY: 500,
        SOFT_DROP_MULTIPLIER: 20,
        DAS_DELAY: 170, // Delayed Auto Shift
        DAS_SPEED: 50,
        LINE_CLEAR_ANIMATION: 400,
        LEVEL_UP_ANIMATION: 1000,
        GARBAGE_LINE_DELAY: 40 // milliseconds between each garbage line animation
    },

    // Visual settings
    VISUAL: {
        GHOST_PIECE_OPACITY: 0.66 // Opacity of the ghost piece preview (0.0 to 1.0)
    },

    // Scoring system - guideline-style base values (before level, combo, B2B)
    SCORING: {
        // Normal line clears
        SINGLE: 100,
        DOUBLE: 300,
        TRIPLE: 500,
        TETRIS: 800,

        // T-Spin Minis
        // (0-line minis rarely rewarded heavily; included for completeness)
        TSPIN_MINI_0: 100,
        TSPIN_MINI_SINGLE: 200,
        TSPIN_MINI_DOUBLE: 400,

        // Full T-Spins
        TSPIN_0: 400,
        TSPIN_SINGLE: 800,
        TSPIN_DOUBLE: 1200,
        TSPIN_TRIPLE: 1600,

        // Drop scores
        SOFT_DROP: 1,
        HARD_DROP: 2,

        // Back-to-back difficult clear multiplier (Tetris / T-Spins that clear lines)
        B2B_MULTIPLIER: 1.5,

        // Base per-step combo bonus (scaled by level in GameManager)
        COMBO_BASE: 50
    },

    // Theme system - use new class-based themes
    THEMES: window.TETRIS_THEMES,

    // UI layout - absolutely positioned to prevent overlaps
    UI: {
        // Hold piece panel (left side)
        HOLD: {
            X: 70,
            Y: 80,
            WIDTH: 120,
            HEIGHT: 140,
            TITLE_Y: 75
        },
        // Next pieces panel (right side)
        NEXT: {
            X: 610,
            Y: 80,
            WIDTH: 120,
            HEIGHT: 450,
            TITLE_Y: 75,
            PIECE_SPACING: 80
        },
        // Score panel (left side, below hold)
        SCORE: {
            X: 70,
            Y: 345,
            WIDTH: 120,
            HEIGHT: 140
        },
        // Game controls info (bottom)
        CONTROLS: {
            Y: 570,
            HEIGHT: 25
        }
    }
};

/******* TETROMINO DEFINITIONS *******/
// Standard Tetris pieces with SRS (Super Rotation System) kick tables
const TETROMINOES = {
    I: {
        shape: [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        color: "I",
        size: 4
    },
    O: {
        shape: [
            [1, 1],
            [1, 1]
        ],
        color: "O",
        size: 2
    },
    T: {
        shape: [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        color: "T",
        size: 3
    },
    S: {
        shape: [
            [0, 1, 1],
            [1, 1, 0],
            [0, 0, 0]
        ],
        color: "S",
        size: 3
    },
    Z: {
        shape: [
            [1, 1, 0],
            [0, 1, 1],
            [0, 0, 0]
        ],
        color: "Z",
        size: 3
    },
    J: {
        shape: [
            [1, 0, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        color: "J",
        size: 3
    },
    L: {
        shape: [
            [0, 0, 1],
            [1, 1, 1],
            [0, 0, 0]
        ],
        color: "L",
        size: 3
    }
};

// SRS Wall Kick Data - standard for JLSTZ pieces
const SRS_WALL_KICKS = {
    JLSTZ: {
        "0->1": [
            [0, 0],
            [-1, 0],
            [-1, 1],
            [0, -2],
            [-1, -2]
        ],
        "1->0": [
            [0, 0],
            [1, 0],
            [1, -1],
            [0, 2],
            [1, 2]
        ],
        "1->2": [
            [0, 0],
            [1, 0],
            [1, -1],
            [0, 2],
            [1, 2]
        ],
        "2->1": [
            [0, 0],
            [-1, 0],
            [-1, 1],
            [0, -2],
            [-1, -2]
        ],
        "2->3": [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, -2],
            [1, -2]
        ],
        "3->2": [
            [0, 0],
            [-1, 0],
            [-1, -1],
            [0, 2],
            [-1, 2]
        ],
        "3->0": [
            [0, 0],
            [-1, 0],
            [-1, -1],
            [0, 2],
            [-1, 2]
        ],
        "0->3": [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, -2],
            [1, -2]
        ]
    },
    I: {
        "0->1": [
            [0, 0],
            [-2, 0],
            [1, 0],
            [-2, -1],
            [1, 2]
        ],
        "1->0": [
            [0, 0],
            [2, 0],
            [-1, 0],
            [2, 1],
            [-1, -2]
        ],
        "1->2": [
            [0, 0],
            [-1, 0],
            [2, 0],
            [-1, 2],
            [2, -1]
        ],
        "2->1": [
            [0, 0],
            [1, 0],
            [-2, 0],
            [1, -2],
            [-2, 1]
        ],
        "2->3": [
            [0, 0],
            [2, 0],
            [-1, 0],
            [2, 1],
            [-1, -2]
        ],
        "3->2": [
            [0, 0],
            [-2, 0],
            [1, 0],
            [-2, -1],
            [1, 2]
        ],
        "3->0": [
            [0, 0],
            [1, 0],
            [-2, 0],
            [1, -2],
            [-2, 1]
        ],
        "0->3": [
            [0, 0],
            [-1, 0],
            [2, 0],
            [-1, 2],
            [2, -1]
        ]
    }
};

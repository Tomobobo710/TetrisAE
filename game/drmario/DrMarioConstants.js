/**
 * Dr. Mario Game Constants
 * Extracted from original Pill Panic implementation
 */

/******* MENU POSITIONING CONSTANTS *******/
const DR_MARIO_MENU_POSITIONS = {
    // Main panel
    PANEL: {
        WIDTH: 520,
        HEIGHT: 380,
        X: 0, // Calculated: (PILL_PANIC.WIDTH - WIDTH) / 2
        Y: 90
    },

    // Section backgrounds and borders
    SECTIONS: {
        BACKGROUND_X: 150,
        BACKGROUND_WIDTH: 500,
        VIRUS_LEVEL_Y: 160,
        SPEED_Y: 250,
        BACKGROUND_HEIGHT: 60,
        HIGHLIGHT_HEIGHT: 70,
        HIGHLIGHT_OFFSET: 35
    },

    // Labels and text content
    LABELS: {
        X: 170,
        SHADOW_OFFSET: 2,
        VIRUS_LEVEL_TEXT: "VIRUS LEVEL",
        SPEED_TEXT: "SPEED",
        GAME_SETTINGS_TEXT: "GAME SETTINGS",
        START_GAME_TEXT: "START GAME",
        ONE_PLAYER_GAME_TEXT: "1 PLAYER GAME",
        INSTRUCTIONS_TEXT: "Use Arrow Keys to navigate, Action1 to select",
        BACK_TO_TETRIS_TEXT: "BACK TO TETRIS"
    },

    // Title positioning
    TITLES: {
        ONE_PLAYER_GAME_Y: 60,
        GAME_SETTINGS_Y: 50,
        INSTRUCTIONS_Y: 550,
        SHADOW_OFFSET_X: 3,
        SHADOW_OFFSET_Y: 3
    },

    // Virus Level Section
    VIRUS_LEVEL: {
        SECTION_Y: 200,
        LABEL_X: 170,
        DISPLAY_X: 460,
        DISPLAY_WIDTH: 80,
        DISPLAY_HEIGHT: 40,
        DISPLAY_Y_OFFSET: 15,
        LEFT_ARROW_X: 360,
        RIGHT_ARROW_X: 600,
        ARROW_Y: 185,
        ARROW_SIZE: 40,
        NUMBER_PAD_START: 2
    },

    // Speed Section
    SPEED: {
        SECTION_Y: 300,
        LABEL_X: 170,
        OPTIONS_START_X: 423,
        OPTION_WIDTH: 50,
        OPTION_HEIGHT: 40,
        OPTION_SPACING: 4,
        OPTION_Y_OFFSET: 18,
        OPTIONS_Y: 0, // Calculated: sectionY - 18
        LEFT_ARROW_X: 360,
        RIGHT_ARROW_X: 600,
        ARROW_Y: 282,
        ARROW_SIZE: 40,
        SPEED_OPTIONS: ["LO", "MED", "HI"]
    },

    // Start Game Button
    START_BUTTON: {
        WIDTH: 160,
        HEIGHT: 50,
        Y: 400,
        SELECTION_OFFSET: 15,
        HIGHLIGHT_TEXT_COLOR: "#000000",
        NORMAL_TEXT_COLOR: "#00ff00"
    },

    // Back to Tetris Button
    BACK_BUTTON: {
        WIDTH: 200,
        HEIGHT: 50,
        Y: 480,
        SELECTION_OFFSET: 15,
        HIGHLIGHT_TEXT_COLOR: "#000000",
        NORMAL_TEXT_COLOR: "#ff8800"
    },

    // Interactive area dimensions
    INTERACTIVE: {
        WIDTH: 40,
        HEIGHT: 40
    },

    // Visual styling
    VISUAL: {
        CORNER_RADIUS: 2,
        BORDER_WIDTH: 2,
        HIGHLIGHT_BORDER_WIDTH: 3,
        GLOW_WIDTH: 4,
        PANEL_GLOW_WIDTH: 10,
        TEXT_SIZE_NORMAL: "20px",
        TEXT_SIZE_LARGE: "28px",
        TEXT_SIZE_TITLE: "32px",
        TEXT_SIZE_BUTTON: "22px"
    },

    // WHITE/YELLOW BORDER LINES that form selection boxes
    SELECTION: {
        // Border line styling
        BORDER_COLOR: "#ffff00",    // Yellow lines when selected
        BORDER_WIDTH: 4,            // Thickness of border lines

        // WHITE/YELLOW border line positioning and size
        VIRUS_LEVEL: {
            X: 150,        // X position where border lines start
            Y: 200,        // Y position where border lines start
            WIDTH: 500,    // Width of border rectangle (right edge = X + WIDTH)
            HEIGHT: 70     // Height of border rectangle (bottom edge = Y + HEIGHT)
        },
        SPEED: {
            X: 150,        // X position where border lines start
            Y: 215,        // Y position where border lines start
            WIDTH: 500,    // Width of border rectangle
            HEIGHT: 70     // Height of border rectangle
        }
    }
};

/******* GAME CONFIGURATION CONSTANTS *******/
const DR_MARIO_CONSTANTS = {
    // ActionEngine requires these exact dimensions
    WIDTH: 800,
    HEIGHT: 600,

    // Game grid configuration
    GRID: {
        COLS: 8,
        ROWS: 16,
        CELL_SIZE: 24,
        OFFSET_X: 280, // Center the bottle
        OFFSET_Y: 80,
        MATCH_COUNT: 4 // Need 4 in a row to clear
    },

    // Game physics and timing
    PHYSICS: {
        BASE_FALL_SPEED: 0.8, // Seconds per row at level 1
        MIN_FALL_SPEED: 0.1, // Fastest possible
        SPEED_DECREASE: 0.05, // Faster per level
        FAST_DROP_MULTIPLIER: 15, // How much faster with DirDown
        LOCK_DELAY: 0.5, // Time before piece locks
        CLEAR_ANIMATION_TIME: 0.6, // Time for clear animation
        CHAIN_DELAY: 0.3 // Delay between chain reactions
    },

    // Visual configuration
    VISUAL: {
        PARTICLE_COUNT: 12,
        VIRUS_EYES_BLINK_CHANCE: 0.02,
        BOTTLE_BORDER: 4,
        PREVIEW_OFFSET_X: 540,
        PREVIEW_OFFSET_Y: 150
    },

    // Color scheme
    COLORS: {
        GAME: {
            BACKGROUND: "#1a1a2e",
            BOTTLE_BG: "#0f0f1e",
            BOTTLE_BORDER: "#4a4a6a",
            GRID_LINE: "rgba(255, 255, 255, 0.05)",

            // Three pill/virus colors
            RED: "#ff4757",
            RED_LIGHT: "#ff6b7a",
            RED_DARK: "#cc3a46",

            BLUE: "#3742fa",
            BLUE_LIGHT: "#5352ed",
            BLUE_DARK: "#2f3640",

            YELLOW: "#ffd32a",
            YELLOW_LIGHT: "#ffe76a",
            YELLOW_DARK: "#d4a819"
        },
        GUI: {
            TEXT: "#ffffff",
            TEXT_SHADOW: "rgba(0, 0, 0, 0.5)",
            PANEL_BG: "rgba(26, 26, 46, 0.9)",
            BUTTON_IDLE: "#3742fa",
            BUTTON_HOVER: "#5352ed",
            BUTTON_ACTIVE: "#00d4ff",
            LEVEL_SELECT_BG: "rgba(15, 15, 30, 0.95)"
        },
        DEBUG: {
            BACKGROUND: "rgba(0, 30, 0, 0.85)",
            TEXT: "#00ff41",
            HIGHLIGHT: "#ffff00"
        }
    },

    // Gameplay constants
    GAMEPLAY: {
        STARTING_VIRUSES_EASY: 4,
        STARTING_VIRUSES_MEDIUM: 8,
        STARTING_VIRUSES_HARD: 12,
        POINTS_PER_VIRUS: 100,
        POINTS_PER_PILL: 10,
        CHAIN_MULTIPLIER: 2
    },

    // Game states
    STATES: {
        START_SCREEN: "startScreen",
        LEVEL_SELECT: "levelSelect",
        PLAYING: "playing",
        CLEARING: "clearing",
        VICTORY: "victory",
        GAME_OVER: "gameOver"
    }
};

/**
 * ControlsLayoutConstants - Shared constants for controls window layout
 * Used by both ControlsWindowRenderer and ControlsWindowManager
 * Ensures visual rendering and interactive elements stay in sync
 */
class ControlsLayoutConstants {
    // ===== WINDOW LAYOUT CONSTANTS =====
    static TITLE_BAR_HEIGHT = 50;                   // Height of the colored title bar
    static TITLE_Y_OFFSET = 25;                     // Title text Y position from window top
    static COLUMN_HEADER_Y_OFFSET = 80;             // Column header Y position from window top
    static SUB_HEADER_Y_OFFSET = 75;                // Sub-header Y position from window top
    static PRIMARY_SUB_HEADER_X_OFFSET = 40;         // Primary sub-header X offset from column left edge
    static ALT_SUB_HEADER_X_OFFSET = 37;             // Alt sub-header X offset from column left edge
    static PRIMARY_SUB_HEADER_Y_OFFSET = 30;         // Primary sub-header Y offset from SUB_HEADER_Y_OFFSET
    static ALT_SUB_HEADER_Y_OFFSET = 30;             // Alt sub-header Y offset from SUB_HEADER_Y_OFFSET
    static KEYBOARD_HEADER_X_OFFSET = -34;            // "Keyboard" header X offset from KEYBOARD_COLUMN_X
    static GAMEPAD_HEADER_X_OFFSET = 10;             // "Gamepad" header X offset from GAMEPAD_COLUMN_X
    static KEYBOARD_HEADER_Y_OFFSET = 0;            // "Keyboard" header Y offset from COLUMN_HEADER_Y_OFFSET
    static GAMEPAD_HEADER_Y_OFFSET = 0;             // "Gamepad" header Y offset from COLUMN_HEADER_Y_OFFSET
    static HINT_TEXT_Y_OFFSET = 25;                 // Hint text Y position from window bottom

    // ===== FONTS & TEXT =====
    static TITLE_FONT_SIZE = 24;
    static TITLE_FONT_WEIGHT = "bold";
    static TITLE_FONT_FAMILY = "Arial";
    static COLUMN_HEADER_FONT_SIZE = 16;
    static COLUMN_HEADER_FONT_WEIGHT = "bold";
    static SUB_HEADER_FONT_SIZE = 12;
    static HINT_FONT_SIZE = 14;
    static HINT_OPACITY = 0.7;
    static TITLE_TEXT_COLOR = "#ffffff";

    // ===== WINDOW DIMENSIONS =====
    static WINDOW_WIDTH = 650;                      // Overall window width
    static WINDOW_HEIGHT = 540;                     // Overall window height
    static WINDOW_X = (TETRIS.WIDTH - this.WINDOW_WIDTH) / 2;     // Window X position (centered)
    static WINDOW_Y = (TETRIS.HEIGHT - this.WINDOW_HEIGHT) / 2;    // Window Y position (centered)

    // ===== COLUMN LAYOUT =====
    static KEYBOARD_COLUMN_X = 325;                // "Keyboard" header X position from window left
    static GAMEPAD_COLUMN_X = 530;                 // "Gamepad" header X position from window left
    static PRIMARY_KEYBOARD_X = 200;               // Primary keyboard column X from window left
    static ALT_KEYBOARD_X = 300;                   // Alt keyboard column X from window left
    static PRIMARY_GAMEPAD_X = 450;                // Primary gamepad column X from window left
    static ALT_GAMEPAD_X = 550;                    // Alt gamepad column X from window left
    static PRIMARY_KEYBOARD_Y = 40;                // Primary keyboard column Y offset from row Y
    static ALT_KEYBOARD_Y = 40;                    // Alt keyboard column Y offset from row Y
    static PRIMARY_GAMEPAD_Y = 40;                 // Primary gamepad column Y offset from row Y
    static ALT_GAMEPAD_Y = 40;                     // Alt gamepad column Y offset from row Y
    static ACTION_ROW_SPACING = 2;                 // Additional spacing between action rows (added to ROW_HEIGHT)
    static ACTION_NAME_ROW_SPACING = 2.5;          // Additional spacing between action name labels (independent of controls)

    // ===== CONTROLS LIST CONSTANTS =====
    static ROW_HEIGHT = 32;                        // Height of each action row
    static HEADER_HEIGHT = 80;                     // Height of header area (titles + subheaders)
    static ACTION_NAME_FONT_SIZE = 14;             // Font size for action names
    static ACTION_NAME_X_OFFSET = 20;              // Action name X position from window left
    static ACTION_NAME_Y_OFFSET = 53;              // Action name Y position from row top (within row bounds)
    static ACTION_NAME_WIDTH = 150;                // Width allocated for action name column

    // ===== COLUMN SIZES =====
    static PRIMARY_KEYBOARD_WIDTH = 80;            // Width of primary keyboard column
    static ALT_KEYBOARD_WIDTH = 80;                // Width of alt keyboard column
    static PRIMARY_GAMEPAD_WIDTH = 80;             // Width of primary gamepad column
    static ALT_GAMEPAD_WIDTH = 80;                 // Width of alt gamepad column
    static COLUMN_HEIGHT_REDUCTION = 2;            // Amount to reduce column height (for borders)

    // ===== SCROLL INDICATORS =====
    static SCROLL_INDICATOR_FONT_SIZE = 16;        // Font size for ▲▼ scroll indicators
    static SCROLL_UP_Y_OFFSET = 10;                // ▲ indicator Y offset from list top
    static SCROLL_DOWN_Y_OFFSET = 15;              // ▼ indicator Y offset from list bottom
    static SCROLL_INDICATOR_X_OFFSET = 10;         // Scroll indicator X position from window left

    // ===== CONTROL COLUMN STYLING =====
    static SELECTED_BORDER_COLOR = "#ffffff";    // Border color when selected
    static NORMAL_BORDER_WIDTH = 1;                // Normal border width
    static SELECTED_BORDER_WIDTH = 2;              // Selected border width
    static SELECTED_BACKGROUND_OPACITY = 0.1;      // Background opacity when selected
    static SELECTED_TEXT_COLOR = "#ffffff";      // Text color when selected
    static NORMAL_FONT_SIZE = 12;                  // Normal font size
    static SELECTED_FONT_WEIGHT = "bold";          // Selected font weight

    // ===== FACE BUTTON CONSTANTS =====
    static FACE_BUTTON_RADIUS = 8;                 // Radius for gamepad face button diamonds
    static BUTTON_LABELS = ['A', 'B', 'X', 'Y'];   // Button labels
    static BUTTON_COLORS = ['#00ff00', '#ff0000', '#0000ff', '#ffff00']; // A, B, X, Y colors
    static SELECTED_FILL_COLOR = "#ffffff";         // Fill color when selected
    static SELECTED_BORDER_COLOR_BUTTON = "#ffffff"; // Border color when selected
    static NORMAL_BORDER_COLOR_BUTTON = "#000000";  // Border color when normal
    static NORMAL_BORDER_WIDTH_BUTTON = 1;          // Normal border width
    static SELECTED_BORDER_WIDTH_BUTTON = 2;        // Selected border width
    static LABEL_FONT_SIZE_NORMAL = 10;             // Normal label font size
    static LABEL_FONT_SIZE_SELECTED = 10;           // Selected label font size (same as normal)
    static LABEL_FONT_WEIGHT_SELECTED = "bold";     // Selected label font weight
    static SELECTED_LABEL_COLOR = "#000000";      // Label color when selected
    static NORMAL_LABEL_COLOR = "#ffffff";        // Label color when normal

    // ===== CONTROL BUTTONS CONSTANTS =====
    static BUTTON_Y_OFFSET = 60;                   // Button Y position from window bottom
    static DEFAULT_BUTTON_WIDTH = 190;             // Width of DEFAULT button
    static DEFAULT_BUTTON_HEIGHT = 35;             // Height of DEFAULT button
    static CLOSE_BUTTON_WIDTH = 100;               // Width of CLOSE button
    static CLOSE_BUTTON_HEIGHT = 35;               // Height of CLOSE button
    static DEFAULT_BUTTON_X_OFFSET = 50;           // DEFAULT button X position from window left
    static CLOSE_BUTTON_X_OFFSET = 150;            // CLOSE button X position from window right
    static BUTTON_DEPTH = 3;                        // Button shadow depth

    // ===== BACKDROP =====
    static BACKGROUND_OVERLAY_OPACITY = 0.8;       // Background overlay transparency
}
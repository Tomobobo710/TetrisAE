/**
 * UIWindowsInputManager - Handles input for popup windows (options, themes)
 * Extracted from InputHandler.js to reduce complexity
 */
class UIWindowsInputManager {
    constructor(game, input) {
        this.game = game;
        this.input = input;
    }

    /**
     * Handle options window input
     */
    handleOptionsWindowInput() {
        const win = this.game.optionsWindow;
        const maxIndex = win.settings.length; // +1 for back button

        // Check for mouse clicks on toggles/cycles
        for (let i = 0; i < win.settings.length; i++) {
            if (this.input.isElementJustPressed(`options_toggle_${i}`)) {
                this.game.toggleSetting(win.settings[i].key);
                win.selectedIndex = i; // Update selection to clicked item
                return; // Actually exits the function
            }
        }

        // Check for mouse click on back button
        if (this.input.isElementJustPressed("options_back_button")) {
            this.closeOptionsWindow();
            return;
        }

        // Update selected index based on hover
        if (this.input.isElementHovered("options_back_button")) {
            if (win.selectedIndex !== win.settings.length) {
                win.selectedIndex = win.settings.length;
                this.game.playSound("menu_navigate");
            }
        } else {
            for (let i = 0; i < win.settings.length; i++) {
                if (this.input.isElementHovered(`options_toggle_${i}`)) {
                    if (win.selectedIndex !== i) {
                        win.selectedIndex = i;
                        this.game.playSound("menu_navigate");
                    }
                    return; // Found hover, exit early
                }
            }
        }

        // Multi-device navigation - use existing API directly
        if (
            this.input.isKeyJustPressed("DirUp") ||
            this.input.isGamepadButtonJustPressed(12, 0) || // D-pad up on gamepad 0
            this.input.isGamepadButtonJustPressed(12, 1) || // D-pad up on gamepad 1
            this.input.isGamepadButtonJustPressed(12, 2) || // D-pad up on gamepad 2
            this.input.isGamepadButtonJustPressed(12, 3)
        ) {
            // D-pad up on gamepad 3
            win.selectedIndex = Math.max(0, win.selectedIndex - 1);
            this.game.playSound("menu_navigate");
        }

        if (
            this.input.isKeyJustPressed("DirDown") ||
            this.input.isGamepadButtonJustPressed(13, 0) || // D-pad down on gamepad 0
            this.input.isGamepadButtonJustPressed(13, 1) || // D-pad down on gamepad 1
            this.input.isGamepadButtonJustPressed(13, 2) || // D-pad down on gamepad 2
            this.input.isGamepadButtonJustPressed(13, 3)
        ) {
            // D-pad down on gamepad 3
            win.selectedIndex = Math.min(maxIndex, win.selectedIndex + 1);
            this.game.playSound("menu_navigate");
        }

        // Action2 for back (B/Circle button = secondary face button)
        if (
            this.input.isKeyJustPressed("Action2") ||
            this.input.isGamepadButtonJustPressed(1, 0) || // B/Circle button on gamepad 0
            this.input.isGamepadButtonJustPressed(1, 1) || // B/Circle button on gamepad 1
            this.input.isGamepadButtonJustPressed(1, 2) || // B/Circle button on gamepad 2
            this.input.isGamepadButtonJustPressed(1, 3)
        ) {
            // B/Circle button on gamepad 3
            this.closeOptionsWindow();
            return;
        }

        // Action1 to toggle or go back (A/Cross button = primary face button)
        if (
            this.input.isKeyJustPressed("Action1") ||
            this.input.isGamepadButtonJustPressed(0, 0) || // A/Cross button on gamepad 0
            this.input.isGamepadButtonJustPressed(0, 1) || // A/Cross button on gamepad 1
            this.input.isGamepadButtonJustPressed(0, 2) || // A/Cross button on gamepad 2
            this.input.isGamepadButtonJustPressed(0, 3)
        ) {
            // A/Cross button on gamepad 3
            if (win.selectedIndex < win.settings.length) {
                // Toggle or cycle setting
                const setting = win.settings[win.selectedIndex];
                this.game.toggleSetting(setting.key);
            } else {
                // Back button
                this.closeOptionsWindow();
            }
        }
    }

    /**
     * Close options window and cleanup
     */
    closeOptionsWindow() {
        this.unregisterOptionsWindowElements();
        this.game.optionsWindow.visible = false;
        this.game.optionsWindow.selectedIndex = 0; // Reset to top option
        this.game.menuStack.current = "settings";
        // Re-register settings menu buttons
        this.game.settingsMenu.buttonsRegistered = false;
        this.game.settingsMenu.selectedIndex = 0; // Reset to top option
        this.game.playSound("menu_back");
    }

    /**
     * Handle themes window input
     */
    handleThemesWindowInput() {
        const win = this.game.themesWindow;

        // Calculate grid dimensions
        const totalRows = Math.max(Math.ceil(win.themes.length / 2), win.leftColumnMax) + 2; // +1 for top buttons, +1 for back

        // Check for mouse clicks on select all/deselect all buttons
        if (this.input.isElementJustPressed("themes_select_all")) {
            this.game.selectAllThemes();
            win.selectedRow = 0;
            win.selectedCol = 0;
            return;
        }
        if (this.input.isElementJustPressed("themes_deselect_all")) {
            this.game.deselectAllThemes();
            win.selectedRow = 0;
            win.selectedCol = 1;
            return;
        }

        // Check for mouse clicks on theme checkboxes
        for (let i = 0; i < win.themes.length; i++) {
            if (this.input.isElementJustPressed(`themes_checkbox_${i}`)) {
                this.game.toggleTheme(win.themes[i].name);
                // Update grid position based on theme index
                const col = i < win.leftColumnMax ? 0 : 1;
                const row = i < win.leftColumnMax ? i + 1 : i - win.leftColumnMax + 1;
                win.selectedRow = row;
                win.selectedCol = col;
                return;
            }
        }

        // Check for mouse click on back button
        if (this.input.isElementJustPressed("themes_back_button")) {
            this.closeThemesWindow();
            return;
        }

        // Update grid position based on hover
        const newRow = win.selectedRow;
        const newCol = win.selectedCol;

        if (this.input.isElementHovered("themes_select_all")) {
            win.selectedRow = 0;
            win.selectedCol = 0;
        } else if (this.input.isElementHovered("themes_deselect_all")) {
            win.selectedRow = 0;
            win.selectedCol = 1;
        } else if (this.input.isElementHovered("themes_back_button")) {
            win.selectedRow = totalRows - 1;
            win.selectedCol = 0;
        } else {
            for (let i = 0; i < win.themes.length; i++) {
                if (this.input.isElementHovered(`themes_checkbox_${i}`)) {
                    const col = i < win.leftColumnMax ? 0 : 1;
                    const row = i < win.leftColumnMax ? i + 1 : i - win.leftColumnMax + 1;
                    win.selectedRow = row;
                    win.selectedCol = col;
                    break;
                }
            }
        }

        if (win.selectedRow !== newRow || win.selectedCol !== newCol) {
            this.game.playSound("menu_navigate");
        }

        // 2D Multi-device navigation - use existing API directly
        if (
            this.input.isKeyJustPressed("DirUp") ||
            this.input.isGamepadButtonJustPressed(12, 0) || // D-pad up on gamepad 0
            this.input.isGamepadButtonJustPressed(12, 1) || // D-pad up on gamepad 1
            this.input.isGamepadButtonJustPressed(12, 2) || // D-pad up on gamepad 2
            this.input.isGamepadButtonJustPressed(12, 3)
        ) {
            // D-pad up on gamepad 3
            this.moveThemesSelectionUp();
            this.game.playSound("menu_navigate");
        }

        if (
            this.input.isKeyJustPressed("DirDown") ||
            this.input.isGamepadButtonJustPressed(13, 0) || // D-pad down on gamepad 0
            this.input.isGamepadButtonJustPressed(13, 1) || // D-pad down on gamepad 1
            this.input.isGamepadButtonJustPressed(13, 2) || // D-pad down on gamepad 2
            this.input.isGamepadButtonJustPressed(13, 3)
        ) {
            // D-pad down on gamepad 3
            this.moveThemesSelectionDown();
            this.game.playSound("menu_navigate");
        }

        if (
            this.input.isKeyJustPressed("DirLeft") ||
            this.input.isGamepadButtonJustPressed(14, 0) || // D-pad left on gamepad 0
            this.input.isGamepadButtonJustPressed(14, 1) || // D-pad left on gamepad 1
            this.input.isGamepadButtonJustPressed(14, 2) || // D-pad left on gamepad 2
            this.input.isGamepadButtonJustPressed(14, 3)
        ) {
            // D-pad left on gamepad 3
            this.moveThemesSelectionLeft();
            this.game.playSound("menu_navigate");
        }

        if (
            this.input.isKeyJustPressed("DirRight") ||
            this.input.isGamepadButtonJustPressed(15, 0) || // D-pad right on gamepad 0
            this.input.isGamepadButtonJustPressed(15, 1) || // D-pad right on gamepad 1
            this.input.isGamepadButtonJustPressed(15, 2) || // D-pad right on gamepad 2
            this.input.isGamepadButtonJustPressed(15, 3)
        ) {
            // D-pad right on gamepad 3
            this.moveThemesSelectionRight();
            this.game.playSound("menu_navigate");
        }

        // Action2 for back (B/Circle button = secondary face button)
        if (
            this.input.isKeyJustPressed("Action2") ||
            this.input.isGamepadButtonJustPressed(1, 0) || // B/Circle button on gamepad 0
            this.input.isGamepadButtonJustPressed(1, 1) || // B/Circle button on gamepad 1
            this.input.isGamepadButtonJustPressed(1, 2) || // B/Circle button on gamepad 2
            this.input.isGamepadButtonJustPressed(1, 3)
        ) {
            // B/Circle button on gamepad 3
            this.closeThemesWindow();
            return;
        }

        // Action1 to toggle or action (A/Cross button = primary face button)
        if (
            this.input.isKeyJustPressed("Action1") ||
            this.input.isGamepadButtonJustPressed(0, 0) || // A/Cross button on gamepad 0
            this.input.isGamepadButtonJustPressed(0, 1) || // A/Cross button on gamepad 1
            this.input.isGamepadButtonJustPressed(0, 2) || // A/Cross button on gamepad 2
            this.input.isGamepadButtonJustPressed(0, 3)
        ) {
            // A/Cross button on gamepad 3
            this.executeThemesWindowAction();
        }
    }

    /**
     * Theme selection movement methods
     */
    moveThemesSelectionUp() {
        const win = this.game.themesWindow;
        const newRow = win.selectedRow - 1;

        if (newRow < 0) return; // Can't go above top row

        // Check if target position is valid
        if (this.isThemesGridPositionValid(newRow, win.selectedCol)) {
            win.selectedRow = newRow;
        }
    }

    moveThemesSelectionDown() {
        const win = this.game.themesWindow;
        const totalRows = Math.max(Math.ceil(win.themes.length / 2), win.leftColumnMax) + 2;
        const newRow = win.selectedRow + 1;

        if (newRow >= totalRows) return; // Can't go below bottom row

        // Try target position first
        if (this.isThemesGridPositionValid(newRow, win.selectedCol)) {
            win.selectedRow = newRow;
            return;
        }

        // Special case: If we're in right column and can't go down, try BACK button (left column, last row)
        if (win.selectedCol === 1 && this.isThemesGridPositionValid(totalRows - 1, 0)) {
            win.selectedRow = totalRows - 1;
            win.selectedCol = 0;
        }
    }

    moveThemesSelectionLeft() {
        const win = this.game.themesWindow;
        const newCol = win.selectedCol - 1;

        if (newCol < 0) return; // Can't go left of leftmost column

        // Try to stay on same row
        if (this.isThemesGridPositionValid(win.selectedRow, newCol)) {
            win.selectedCol = newCol;
            return;
        }

        // If same row doesn't exist in left column, find the last valid row in left column
        const lastValidRow = this.findLastValidRowInColumn(newCol);
        if (lastValidRow !== -1) {
            win.selectedRow = lastValidRow;
            win.selectedCol = newCol;
        }
    }

    moveThemesSelectionRight() {
        const win = this.game.themesWindow;
        const newCol = win.selectedCol + 1;

        if (newCol > 1) return; // Only 2 columns

        // Try to stay on same row
        if (this.isThemesGridPositionValid(win.selectedRow, newCol)) {
            win.selectedCol = newCol;
            return;
        }

        // If same row doesn't exist in right column, find the last valid row in right column
        const lastValidRow = this.findLastValidRowInColumn(newCol);
        if (lastValidRow !== -1) {
            win.selectedRow = lastValidRow;
            win.selectedCol = newCol;
        }
    }

    findLastValidRowInColumn(col) {
        const win = this.game.themesWindow;
        const totalRows = Math.max(Math.ceil(win.themes.length / 2), win.leftColumnMax) + 2;

        // Search from bottom up to find last valid position in this column
        for (let row = totalRows - 1; row >= 0; row--) {
            if (this.isThemesGridPositionValid(row, col)) {
                return row;
            }
        }

        return -1; // No valid position found
    }

    isThemesGridPositionValid(row, col) {
        const win = this.game.themesWindow;
        const totalRows = Math.max(Math.ceil(win.themes.length / 2), win.leftColumnMax) + 2;

        // Row 0: SELECT ALL (col 0) and DESELECT ALL (col 1)
        if (row === 0) {
            return col === 0 || col === 1;
        }

        // Last row: BACK button (only col 0)
        if (row === totalRows - 1) {
            return col === 0;
        }

        // Theme rows (1 to totalRows - 2)
        if (col === 0) {
            // Left column: check if theme exists
            const themeIndex = row - 1;
            return themeIndex < Math.min(win.themes.length, win.leftColumnMax);
        } else if (col === 1) {
            // Right column: check if theme exists
            const themeIndex = win.leftColumnMax + (row - 1);
            return themeIndex < win.themes.length;
        }

        return false;
    }

    executeThemesWindowAction() {
        const win = this.game.themesWindow;
        const totalRows = Math.max(Math.ceil(win.themes.length / 2), win.leftColumnMax) + 2;

        // Row 0: SELECT ALL / DESELECT ALL
        if (win.selectedRow === 0) {
            if (win.selectedCol === 0) {
                this.game.selectAllThemes();
            } else if (win.selectedCol === 1) {
                this.game.deselectAllThemes();
            }
            return;
        }

        // Last row: BACK button
        if (win.selectedRow === totalRows - 1) {
            this.closeThemesWindow();
            return;
        }

        // Theme rows: toggle theme
        let themeIndex;
        if (win.selectedCol === 0) {
            themeIndex = win.selectedRow - 1;
        } else {
            themeIndex = win.leftColumnMax + (win.selectedRow - 1);
        }

        if (themeIndex < win.themes.length) {
            const theme = win.themes[themeIndex];
            this.game.toggleTheme(theme.name);
        }
    }

    /**
     * Handle controls window input
     */
    handleControlsWindowInput() {
        const win = this.game.controlsWindow;

        // If showing confirm modal, handle that first
        // This completely blocks all main modal interactions while confirm modal is visible
        if (win.showingConfirmModal) {
            this.handleConfirmModalInput();
            return; // Don't process any other controls window input
        }

        // If waiting for input, capture any key/button press
        if (win.isWaitingForInput) {
            this.handleControlsWaitingForInput();
            return;
        }

        // Handle mouse clicks on action rows
        for (let i = 0; i < Math.min(win.maxVisibleActions, win.actions.length - win.scrollOffset); i++) {
            const actionIndex = i + win.scrollOffset;

            // Check all 4 column clicks
            if (this.input.isElementJustPressed(`controls_action_${actionIndex}_kb_primary`)) {
                this.startControlsWaitingForInput(actionIndex, 'keyboard', 'primary');
                return;
            }
            if (this.input.isElementJustPressed(`controls_action_${actionIndex}_kb_alt`)) {
                this.startControlsWaitingForInput(actionIndex, 'keyboard', 'alt');
                return;
            }
            if (this.input.isElementJustPressed(`controls_action_${actionIndex}_gp_primary`)) {
                this.startControlsWaitingForInput(actionIndex, 'gamepad', 'primary');
                return;
            }
            if (this.input.isElementJustPressed(`controls_action_${actionIndex}_gp_alt`)) {
                this.startControlsWaitingForInput(actionIndex, 'gamepad', 'alt');
                return;
            }

            // Update selection on hover for all 4 columns - switch to action navigation mode
            if (this.input.isElementHovered(`controls_action_${actionIndex}_kb_primary`)) {
                if (win.selectedActionIndex !== actionIndex || win.selectedColumn !== 0 || win.navigatingButtons) {
                    win.selectedActionIndex = actionIndex;
                    win.selectedColumn = 0;
                    win.navigatingButtons = false; // Switch to action navigation
                    this.game.playSound('menu_navigate');
                }
            } else if (this.input.isElementHovered(`controls_action_${actionIndex}_kb_alt`)) {
                if (win.selectedActionIndex !== actionIndex || win.selectedColumn !== 1 || win.navigatingButtons) {
                    win.selectedActionIndex = actionIndex;
                    win.selectedColumn = 1;
                    win.navigatingButtons = false; // Switch to action navigation
                    this.game.playSound('menu_navigate');
                }
            } else if (this.input.isElementHovered(`controls_action_${actionIndex}_gp_primary`)) {
                if (win.selectedActionIndex !== actionIndex || win.selectedColumn !== 2 || win.navigatingButtons) {
                    win.selectedActionIndex = actionIndex;
                    win.selectedColumn = 2;
                    win.navigatingButtons = false; // Switch to action navigation
                    this.game.playSound('menu_navigate');
                }
            } else if (this.input.isElementHovered(`controls_action_${actionIndex}_gp_alt`)) {
                if (win.selectedActionIndex !== actionIndex || win.selectedColumn !== 3 || win.navigatingButtons) {
                    win.selectedActionIndex = actionIndex;
                    win.selectedColumn = 3;
                    win.navigatingButtons = false; // Switch to action navigation
                    this.game.playSound('menu_navigate');
                }
            }
        }

        // Handle DEFAULT button click
        if (this.input.isElementJustPressed('controls_default_button')) {
            win.navigatingButtons = true; // Ensure we're in button navigation mode
            win.selectedButtonIndex = 0; // Select DEFAULT
            this.game.playSound('menu_confirm'); // Play confirmation sound when clicking DEFAULT
            // Handle reset confirmation through the window system
            win.showingConfirmModal = true;
            this.registerConfirmModalElements();
            return;
        }

        // Handle CLOSE button click
        if (this.input.isElementJustPressed('controls_close_button')) {
            win.navigatingButtons = true; // Ensure we're in button navigation mode
            win.selectedButtonIndex = 1; // Select CLOSE
            this.closeControlsWindow();
            return;
        }

        // Handle DEFAULT button hover - switch to button navigation mode
        if (this.input.isElementHovered('controls_default_button')) {
            if (!win.navigatingButtons || win.selectedButtonIndex !== 0) {
                win.navigatingButtons = true;
                win.selectedButtonIndex = 0;
                win.selectedActionIndex = -1; // Clear action selection
                win.selectedColumn = -1;
                this.game.playSound('menu_navigate');
            }
        }

        // Handle CLOSE button hover - switch to button navigation mode
        if (this.input.isElementHovered('controls_close_button')) {
            if (!win.navigatingButtons || win.selectedButtonIndex !== 1) {
                win.navigatingButtons = true;
                win.selectedButtonIndex = 1;
                win.selectedActionIndex = -1; // Clear action selection
                win.selectedColumn = -1;
                this.game.playSound('menu_navigate');
            }
        }

        // Keyboard navigation
        this.handleControlsKeyboardNavigation();
    }

    handleControlsKeyboardNavigation() {
        const win = this.game.controlsWindow;

        // Multi-device navigation - use existing API directly (same as options/themes)
        if (
            this.input.isKeyJustPressed("DirUp") ||
            this.input.isGamepadButtonJustPressed(12, 0) || // D-pad up on gamepad 0
            this.input.isGamepadButtonJustPressed(12, 1) || // D-pad up on gamepad 1
            this.input.isGamepadButtonJustPressed(12, 2) || // D-pad up on gamepad 2
            this.input.isGamepadButtonJustPressed(12, 3)
        ) {
            // D-pad up on gamepad 3
            if (win.navigatingButtons) {
                // If navigating buttons, go back to last action
                win.navigatingButtons = false;
                win.selectedActionIndex = win.actions.length - 1;
                win.selectedColumn = 0; // Reset to first column
                this.updateControlsScrollOffset();
            } else {
                win.selectedActionIndex = Math.max(0, win.selectedActionIndex - 1);
                this.updateControlsScrollOffset();
            }
            this.game.playSound("menu_navigate");
        }

        if (
            this.input.isKeyJustPressed("DirDown") ||
            this.input.isGamepadButtonJustPressed(13, 0) || // D-pad down on gamepad 0
            this.input.isGamepadButtonJustPressed(13, 1) || // D-pad down on gamepad 1
            this.input.isGamepadButtonJustPressed(13, 2) || // D-pad down on gamepad 2
            this.input.isGamepadButtonJustPressed(13, 3)
        ) {
            // D-pad down on gamepad 3
            if (win.navigatingButtons) {
                // Already on buttons, do nothing
                return;
            } else if (win.selectedActionIndex >= win.actions.length - 1) {
                // At last action, switch to button navigation
                win.navigatingButtons = true;
                win.selectedButtonIndex = 0; // Start with DEFAULT button
                // Clear action selection when navigating to buttons
                win.selectedActionIndex = -1;
                win.selectedColumn = -1;
            } else {
                win.selectedActionIndex = Math.min(win.actions.length - 1, win.selectedActionIndex + 1);
                this.updateControlsScrollOffset();
            }
            this.game.playSound("menu_navigate");
        }

        if (
            this.input.isKeyJustPressed("DirLeft") ||
            this.input.isGamepadButtonJustPressed(14, 0) || // D-pad left on gamepad 0
            this.input.isGamepadButtonJustPressed(14, 1) || // D-pad left on gamepad 1
            this.input.isGamepadButtonJustPressed(14, 2) || // D-pad left on gamepad 2
            this.input.isGamepadButtonJustPressed(14, 3)
        ) {
            // D-pad left on gamepad 3
            if (win.navigatingButtons) {
                win.selectedButtonIndex = Math.max(0, win.selectedButtonIndex - 1);
            } else {
                win.selectedColumn = Math.max(0, win.selectedColumn - 1);
            }
            this.game.playSound("menu_navigate");
        }

        if (
            this.input.isKeyJustPressed("DirRight") ||
            this.input.isGamepadButtonJustPressed(15, 0) || // D-pad right on gamepad 0
            this.input.isGamepadButtonJustPressed(15, 1) || // D-pad right on gamepad 1
            this.input.isGamepadButtonJustPressed(15, 2) || // D-pad right on gamepad 2
            this.input.isGamepadButtonJustPressed(15, 3)
        ) {
            // D-pad right on gamepad 3
            if (win.navigatingButtons) {
                win.selectedButtonIndex = Math.min(1, win.selectedButtonIndex + 1);
            } else {
                win.selectedColumn = Math.min(3, win.selectedColumn + 1);
            }
            this.game.playSound("menu_navigate");
        }

        // Action2 for back (B/Circle button = secondary face button) - consistent with other modals
        if (
            this.input.isKeyJustPressed("Action2") ||
            this.input.isGamepadButtonJustPressed(1, 0) || // B/Circle button on gamepad 0
            this.input.isGamepadButtonJustPressed(1, 1) || // B/Circle button on gamepad 1
            this.input.isGamepadButtonJustPressed(1, 2) || // B/Circle button on gamepad 2
            this.input.isGamepadButtonJustPressed(1, 3)
        ) {
            // B/Circle button on gamepad 3
            this.closeControlsWindow();
            return;
        }

        // Action1 to activate selection (A/Cross button = primary face button) - consistent with other modals
        if (
            this.input.isKeyJustPressed("Action1") ||
            this.input.isGamepadButtonJustPressed(0, 0) || // A/Cross button on gamepad 0
            this.input.isGamepadButtonJustPressed(0, 1) || // A/Cross button on gamepad 1
            this.input.isGamepadButtonJustPressed(0, 2) || // A/Cross button on gamepad 2
            this.input.isGamepadButtonJustPressed(0, 3)
        ) {
            // A/Cross button on gamepad 3
            if (win.navigatingButtons) {
                // Activate button
                if (win.selectedButtonIndex === 0) {
                    // Handle reset confirmation through the window system
                    win.showingConfirmModal = true;
                    this.registerConfirmModalElements();
                } else {
                    this.closeControlsWindow();
                }
            } else {
                // Start remapping control
                const inputType = win.selectedColumn < 2 ? 'keyboard' : 'gamepad';
                const column = win.selectedColumn % 2 === 0 ? 'primary' : 'alt';
                this.startControlsWaitingForInput(win.selectedActionIndex, inputType, column);
            }
        }
    }

    updateControlsScrollOffset() {
        const win = this.game.controlsWindow;
        if (win.selectedActionIndex < win.scrollOffset) {
            win.scrollOffset = win.selectedActionIndex;
        } else if (win.selectedActionIndex >= win.scrollOffset + win.maxVisibleActions) {
            win.scrollOffset = win.selectedActionIndex - win.maxVisibleActions + 1;
        }
    }

    startControlsWaitingForInput(actionIndex, inputType, column) {
        const win = this.game.controlsWindow;
        win.isWaitingForInput = true;
        win.waitingForAction = win.actions[actionIndex].id;
        win.waitingForInputType = inputType;
        win.waitingForColumn = column;
        win.waitingTimeout = win.waitingTimeoutDuration;
        console.log(`[ControlsWindow] Waiting for ${inputType} ${column} input for action: ${win.waitingForAction}`);

        // Populate the actions list with current control data from the manager
        this.refreshControlsWindowData();
    }

    refreshControlsWindowData() {
        const win = this.game.controlsWindow;
        const controlsManager = this.game.customControls.getControlsManager();

        // Update each action with current control data
        win.actions.forEach(action => {
            const controls = controlsManager.getControls(action.id);
            action.keyboard = {
                primary: controls.keyboard[0] || null,
                alt: controls.keyboard[1] || null
            };
            action.gamepad = {
                primary: controls.gamepad[0] !== undefined ? controls.gamepad[0] : null,
                alt: controls.gamepad[1] !== undefined ? controls.gamepad[1] : null
            };
        });
    }

    handleControlsWaitingForInput() {
        const win = this.game.controlsWindow;

        // Update timeout
        win.waitingTimeout -= this.game.lastDeltaTime * 1000;
        if (win.waitingTimeout <= 0) {
            this.cancelControlsWaitingForInput();
            return;
        }

        if (win.waitingForInputType === 'keyboard') {
            // Check for any keyboard input
            const currentKeys = this.input.currentSnapshot.keys;
            const previousKeys = this.input.previousSnapshot.keys;

            // Find newly pressed keys
            for (const [keyCode, isPressed] of currentKeys) {
                if (isPressed && !previousKeys.has(keyCode)) {
                    // Accept any key
                    this.assignControlsKeyboardControl(keyCode);
                    return;
                }
            }
        } else if (win.waitingForInputType === 'gamepad') {
            // Check for any gamepad button input
            for (let gamepadIndex = 0; gamepadIndex < 4; gamepadIndex++) {
                if (this.input.isGamepadConnected(gamepadIndex)) {
                    for (let buttonIndex = 0; buttonIndex < 16; buttonIndex++) {
                        if (this.input.isGamepadButtonJustPressed(buttonIndex, gamepadIndex)) {
                            this.assignControlsGamepadControl(buttonIndex);
                            return;
                        }
                    }
                }
            }
        }
    }

    assignControlsKeyboardControl(keyCode) {
        const win = this.game.controlsWindow;
        this.game.customControls.getControlsManager().setKeyboardControl(win.waitingForAction, keyCode, win.waitingForColumn);
        this.refreshControlsWindowData(); // Refresh display immediately
        this.game.playSound('menu_confirm');
        win.isWaitingForInput = false;
        win.waitingForAction = null;
        win.waitingForInputType = null;
        win.waitingForColumn = null;
    }

    assignControlsGamepadControl(buttonIndex) {
        const win = this.game.controlsWindow;
        this.game.customControls.getControlsManager().setGamepadControl(win.waitingForAction, buttonIndex, win.waitingForColumn);
        this.refreshControlsWindowData(); // Refresh display immediately
        this.game.playSound('menu_confirm');
        win.isWaitingForInput = false;
        win.waitingForAction = null;
        win.waitingForInputType = null;
        win.waitingForColumn = null;
    }

    cancelControlsWaitingForInput() {
        const win = this.game.controlsWindow;
        win.isWaitingForInput = false;
        win.waitingForAction = null;
        win.waitingForInputType = null;
        win.waitingForColumn = null;
        win.waitingTimeout = 0;
        this.game.playSound('menu_back');
    }

    showControlsResetConfirmation() {
        // This is now handled by the custom controls modal
        // Kept for backward compatibility if needed
        if (confirm('Reset all controls to defaults? This cannot be undone.')) {
            this.game.customControls.resetToDefaults();
            this.refreshControlsWindowData(); // Refresh display immediately
            this.game.playSound('menu_confirm');
        }
    }

    /**
     * Close controls window and cleanup
     */
    closeControlsWindow() {
        this.unregisterControlsWindowElements();
        this.game.controlsWindow.visible = false;
        // Reset all navigation state to default position (top-left action selection)
        this.game.controlsWindow.selectedActionIndex = 0; // First action
        this.game.controlsWindow.selectedColumn = 0; // Keyboard primary column
        this.game.controlsWindow.navigatingButtons = false; // Not in button mode
        this.game.controlsWindow.selectedButtonIndex = 0; // DEFAULT button if in button mode
        this.game.controlsWindow.scrollOffset = 0; // Reset scroll to top
        this.game.menuStack.current = "settings";
        // Re-register settings menu buttons
        this.game.settingsMenu.buttonsRegistered = false;
        this.game.settingsMenu.selectedIndex = 0; // Reset to top option
        this.game.playSound("menu_back");
    }

    /**
     * Close themes window and cleanup
     */
    closeThemesWindow() {
        this.unregisterThemesWindowElements();
        this.game.themesWindow.visible = false;
        this.game.themesWindow.selectedRow = 0; // Reset to top
        this.game.themesWindow.selectedCol = 0; // Reset to top-left
        this.game.menuStack.current = "settings";
        // Re-register settings menu buttons
        this.game.settingsMenu.buttonsRegistered = false;
        this.game.settingsMenu.selectedIndex = 0; // Reset to top option
        this.game.playSound("menu_back");
    }

    /**
     * Register options window elements
     */
    registerOptionsWindowElements() {
        const win = this.game.optionsWindow;
        const windowWidth = 500;
        const windowHeight = 350;
        const windowX = (TETRIS.WIDTH - windowWidth) / 2;
        const windowY = (TETRIS.HEIGHT - windowHeight) / 2;

        const settingY = windowY + 80;
        const settingSpacing = 60;

        // Register toggle buttons
        win.settings.forEach((setting, index) => {
            const y = settingY + index * settingSpacing;
            const toggleX = windowX + windowWidth - 120;
            const toggleWidth = 80;
            const toggleHeight = 35;
            const toggleY = y - 18;

            this.input.registerElement(`options_toggle_${index}`, {
                bounds: () => ({
                    x: toggleX,
                    y: toggleY,
                    width: toggleWidth,
                    height: toggleHeight
                })
            });
        });

        // Register back button
        const backButtonY = windowY + windowHeight - 70;
        const backButtonWidth = 120;
        const backButtonHeight = 40;
        const backButtonX = windowX + (windowWidth - backButtonWidth) / 2;

        this.input.registerElement("options_back_button", {
            bounds: () => ({
                x: backButtonX,
                y: backButtonY,
                width: backButtonWidth,
                height: backButtonHeight
            })
        });
    }

    /**
     * Register themes window elements
     */
    registerThemesWindowElements() {
        const win = this.game.themesWindow;
        const windowWidth = 600;
        const windowHeight = 500;
        const windowX = (TETRIS.WIDTH - windowWidth) / 2;
        const windowY = (TETRIS.HEIGHT - windowHeight) / 2;

        // Register select all/deselect all buttons - bigger and spread out
        const selectAllY = windowY + 65;
        const selectButtonWidth = 230;
        const selectButtonHeight = 50;

        const selectAllX = windowX + 40;
        this.input.registerElement("themes_select_all", {
            bounds: () => ({
                x: selectAllX,
                y: selectAllY,
                width: selectButtonWidth,
                height: selectButtonHeight
            })
        });

        const deselectAllX = windowX + windowWidth - 40 - selectButtonWidth;
        this.input.registerElement("themes_deselect_all", {
            bounds: () => ({
                x: deselectAllX,
                y: selectAllY,
                width: selectButtonWidth,
                height: selectButtonHeight
            })
        });

        // Register theme checkboxes in 2-column layout
        const themeListY = windowY + 145;
        const themeSpacing = 38;
        const leftColumnX = windowX + 40;
        const rightColumnX = windowX + windowWidth / 2 + 10;
        const checkboxSize = 22;
        const columnWidth = windowWidth / 2 - 60;

        win.themes.forEach((theme, index) => {
            const isLeftColumn = index < win.leftColumnMax;
            const x = isLeftColumn ? leftColumnX : rightColumnX;
            const row = isLeftColumn ? index : index - win.leftColumnMax;
            const y = themeListY + row * themeSpacing;

            this.input.registerElement(`themes_checkbox_${index}`, {
                bounds: () => ({
                    x: x,
                    y: y - 11,
                    width: columnWidth,
                    height: checkboxSize
                })
            });
        });

        // Register back button
        const backButtonY = windowY + windowHeight - 70;
        const backButtonWidth = 120;
        const backButtonHeight = 40;
        const backButtonX = windowX + (windowWidth - backButtonWidth) / 2;

        this.input.registerElement("themes_back_button", {
            bounds: () => ({
                x: backButtonX,
                y: backButtonY,
                width: backButtonWidth,
                height: backButtonHeight
            })
        });
    }

    /**
     * Unregister options window elements
     */
    unregisterOptionsWindowElements() {
        const win = this.game.optionsWindow;

        // Unregister toggle buttons
        win.settings.forEach((setting, index) => {
            this.input.removeElement(`options_toggle_${index}`);
        });

        // Unregister back button
        this.input.removeElement("options_back_button");
    }

    /**
     * Register controls window elements
     */
    registerControlsWindowElements() {
        const win = this.game.controlsWindow;
        const rowHeight = 32;
        const headerHeight = 80;
        const listY = win.y + headerHeight;

        // Refresh the data to ensure we have current controls
        this.refreshControlsWindowData();

        // Register action rows - 4 columns
        for (let i = 0; i < Math.min(win.maxVisibleActions, win.actions.length); i++) {
            const actionIndex = i + win.scrollOffset;
            const rowY = listY + i * rowHeight;

            // Keyboard primary
            this.input.registerElement(`controls_action_${actionIndex}_kb_primary`, {
                bounds: () => ({
                    x: win.x + 175,
                    y: rowY,
                    width: 90,
                    height: rowHeight - 2
                })
            });

            // Keyboard alt
            this.input.registerElement(`controls_action_${actionIndex}_kb_alt`, {
                bounds: () => ({
                    x: win.x + 285,
                    y: rowY,
                    width: 80,
                    height: rowHeight - 2
                })
            });

            // Gamepad primary
            this.input.registerElement(`controls_action_${actionIndex}_gp_primary`, {
                bounds: () => ({
                    x: win.x + 375,
                    y: rowY,
                    width: 90,
                    height: rowHeight - 2
                })
            });

            // Gamepad alt
            this.input.registerElement(`controls_action_${actionIndex}_gp_alt`, {
                bounds: () => ({
                    x: win.x + 485,
                    y: rowY,
                    width: 80,
                    height: rowHeight - 2
                })
            });
        }

        // Register buttons
        const buttonY = win.y + win.height - 60;
        this.input.registerElement('controls_default_button', {
            bounds: () => ({
                x: win.x + 50,
                y: buttonY,
                width: 100,
                height: 35
            })
        });

        this.input.registerElement('controls_close_button', {
            bounds: () => ({
                x: win.x + win.width - 150,
                y: buttonY,
                width: 100,
                height: 35
            })
        });

        // Register confirm modal buttons if showing
        if (win.showingConfirmModal) {
            this.registerConfirmModalElements();
        }
    }

    /**
     * Unregister controls window elements
     */
    unregisterControlsWindowElements() {
        const win = this.game.controlsWindow;

        // Unregister action rows - 4 columns
        for (let i = 0; i < win.actions.length; i++) {
            this.input.removeElement(`controls_action_${i}_kb_primary`);
            this.input.removeElement(`controls_action_${i}_kb_alt`);
            this.input.removeElement(`controls_action_${i}_gp_primary`);
            this.input.removeElement(`controls_action_${i}_gp_alt`);
        }

        // Unregister buttons
        this.input.removeElement('controls_default_button');
        this.input.removeElement('controls_close_button');

        // Unregister confirm modal elements if they exist
        if (typeof this.unregisterConfirmModalElements === 'function') {
            this.unregisterConfirmModalElements();
        }
    }

    /**
     * Unregister themes window elements
     */
    unregisterThemesWindowElements() {
        const win = this.game.themesWindow;

        // Unregister select all/deselect all buttons
        this.input.removeElement("themes_select_all");
        this.input.removeElement("themes_deselect_all");

        // Unregister theme checkboxes
        win.themes.forEach((theme, index) => {
            this.input.removeElement(`themes_checkbox_${index}`);
        });

        // Unregister back button
        this.input.removeElement("themes_back_button");
    }
    handleConfirmModalInput() {
        const win = this.game.controlsWindow;

        // Handle mouse clicks first
        if (this.input.isElementJustPressed('confirm_yes_button')) {
            this.game.customControls.resetToDefaults();
            this.refreshControlsWindowData(); // Refresh display immediately
            this.game.playSound('menu_confirm');
            win.showingConfirmModal = false;
            if (typeof this.unregisterConfirmModalElements === 'function') {
                this.unregisterConfirmModalElements();
            }
            return;
        } else if (this.input.isElementJustPressed('confirm_no_button')) {
            this.game.playSound('menu_back');
            win.showingConfirmModal = false;
            if (typeof this.unregisterConfirmModalElements === 'function') {
                this.unregisterConfirmModalElements();
            }
            return;
        }

        // Handle hover selection for visual feedback (like other menus)
        if (this.input.isElementHovered('confirm_yes_button')) {
            if (win.confirmModalSelectedButton !== 0) {
                win.confirmModalSelectedButton = 0;
                this.game.playSound("menu_navigate");
            }
        } else if (this.input.isElementHovered('confirm_no_button')) {
            if (win.confirmModalSelectedButton !== 1) {
                win.confirmModalSelectedButton = 1;
                this.game.playSound("menu_navigate");
            }
        }

        // Handle keyboard/gamepad navigation and input with selection state
        // Initialize confirm modal selection state if needed
        if (win.confirmModalSelectedButton === undefined) {
            win.confirmModalSelectedButton = 1; // Default to NO button (safer)
        }

        // Left/Right navigation between YES and NO buttons
        if (
            this.input.isKeyJustPressed("DirLeft") ||
            this.input.isGamepadButtonJustPressed(14, 0) || // D-pad left on gamepad 0
            this.input.isGamepadButtonJustPressed(14, 1) || // D-pad left on gamepad 1
            this.input.isGamepadButtonJustPressed(14, 2) || // D-pad left on gamepad 2
            this.input.isGamepadButtonJustPressed(14, 3)
        ) {
            // Move to YES button (left)
            if (win.confirmModalSelectedButton !== 0) {
                win.confirmModalSelectedButton = 0;
                this.game.playSound("menu_navigate");
            }
        } else if (
            this.input.isKeyJustPressed("DirRight") ||
            this.input.isGamepadButtonJustPressed(15, 0) || // D-pad right on gamepad 0
            this.input.isGamepadButtonJustPressed(15, 1) || // D-pad right on gamepad 1
            this.input.isGamepadButtonJustPressed(15, 2) || // D-pad right on gamepad 2
            this.input.isGamepadButtonJustPressed(15, 3)
        ) {
            // Move to NO button (right)
            if (win.confirmModalSelectedButton !== 1) {
                win.confirmModalSelectedButton = 1;
                this.game.playSound("menu_navigate");
            }
        }

        // Action1 to confirm selection (A/Cross button = primary face button)
        if (
            this.input.isKeyJustPressed("Action1") ||
            this.input.isGamepadButtonJustPressed(0, 0) || // A/Cross button on gamepad 0
            this.input.isGamepadButtonJustPressed(0, 1) || // A/Cross button on gamepad 1
            this.input.isGamepadButtonJustPressed(0, 2) || // A/Cross button on gamepad 2
            this.input.isGamepadButtonJustPressed(0, 3)
        ) {
            if (win.confirmModalSelectedButton === 0) {
                // YES selected - reset controls
                this.game.customControls.resetToDefaults();
                this.refreshControlsWindowData(); // Refresh display immediately
                this.game.playSound('menu_confirm');
            } else {
                // NO selected - cancel
                this.game.playSound('menu_back');
            }
            win.showingConfirmModal = false;
            win.confirmModalSelectedButton = undefined; // Clear selection state
            if (typeof this.unregisterConfirmModalElements === 'function') {
                this.unregisterConfirmModalElements();
            }
            return;
        }

        // Action2 or ESC to cancel (B/Circle button = secondary face button)
        if (
            this.input.isKeyJustPressed('Escape') ||
            this.input.isKeyJustPressed("Action2") ||
            this.input.isGamepadButtonJustPressed(1, 0) || // B/Circle button on gamepad 0
            this.input.isGamepadButtonJustPressed(1, 1) || // B/Circle button on gamepad 1
            this.input.isGamepadButtonJustPressed(1, 2) || // B/Circle button on gamepad 2
            this.input.isGamepadButtonJustPressed(1, 3)
        ) {
            // Allow ESC or B to cancel the confirm modal
            this.game.playSound('menu_back');
            win.showingConfirmModal = false;
            win.confirmModalSelectedButton = undefined; // Clear selection state
            if (typeof this.unregisterConfirmModalElements === 'function') {
                this.unregisterConfirmModalElements();
            }
            return;
        }
    }

    registerConfirmModalElements() {
        const win = this.game.controlsWindow;
        const modalWidth = 400;
        const modalHeight = 150;
        const modalX = win.x + (win.width - modalWidth) / 2;
        const modalY = win.y + (win.height - modalHeight) / 2;

        const buttonWidth = 80;
        const buttonHeight = 35;
        const buttonY = modalY + modalHeight - 50;

        // Yes button (left)
        this.input.registerElement('confirm_yes_button', {
            bounds: () => ({
                x: modalX + modalWidth / 2 - buttonWidth - 20,
                y: buttonY,
                width: buttonWidth,
                height: buttonHeight
            })
        });

        // No button (right)
        this.input.registerElement('confirm_no_button', {
            bounds: () => ({
                x: modalX + modalWidth / 2 + 20,
                y: buttonY,
                width: buttonWidth,
                height: buttonHeight
            })
        });
    }

    unregisterConfirmModalElements() {
        this.input.removeElement('confirm_yes_button');
        this.input.removeElement('confirm_no_button');
    }
}

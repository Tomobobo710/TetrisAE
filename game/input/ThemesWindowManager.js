/**
 * ThemesWindowManager - Self-contained themes window manager
 * Handles all input and element management for the themes selection window
 */
class ThemesWindowManager {
    constructor(game, input) {
        this.game = game;
        this.input = input;
    }

    /**
     * Handle themes window input
     */
    handleInput() {
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
            this.close();
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
            this.moveSelectionUp();
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
            this.moveSelectionDown();
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
            this.moveSelectionLeft();
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
            this.moveSelectionRight();
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
            this.close();
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
            this.executeAction();
        }
    }

    /**
     * Theme selection movement methods
     */
    moveSelectionUp() {
        const win = this.game.themesWindow;
        const newRow = win.selectedRow - 1;

        if (newRow < 0) return; // Can't go above top row

        // Check if target position is valid
        if (this.isGridPositionValid(newRow, win.selectedCol)) {
            win.selectedRow = newRow;
        }
    }

    moveSelectionDown() {
        const win = this.game.themesWindow;
        const totalRows = Math.max(Math.ceil(win.themes.length / 2), win.leftColumnMax) + 2;
        const newRow = win.selectedRow + 1;

        if (newRow >= totalRows) return; // Can't go below bottom row

        // Try target position first
        if (this.isGridPositionValid(newRow, win.selectedCol)) {
            win.selectedRow = newRow;
            return;
        }

        // Special case: If we're in right column and can't go down, try BACK button (left column, last row)
        if (win.selectedCol === 1 && this.isGridPositionValid(totalRows - 1, 0)) {
            win.selectedRow = totalRows - 1;
            win.selectedCol = 0;
        }
    }

    moveSelectionLeft() {
        const win = this.game.themesWindow;
        const newCol = win.selectedCol - 1;

        if (newCol < 0) return; // Can't go left of leftmost column

        // Try to stay on same row
        if (this.isGridPositionValid(win.selectedRow, newCol)) {
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

    moveSelectionRight() {
        const win = this.game.themesWindow;
        const newCol = win.selectedCol + 1;

        if (newCol > 1) return; // Only 2 columns

        // Try to stay on same row
        if (this.isGridPositionValid(win.selectedRow, newCol)) {
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
            if (this.isGridPositionValid(row, col)) {
                return row;
            }
        }

        return -1; // No valid position found
    }

    isGridPositionValid(row, col) {
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

    executeAction() {
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
            this.close();
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
     * Close themes window and cleanup
     */
    close() {
        this.unregisterElements();
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
     * Register themes window elements
     */
    registerElements() {
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
     * Unregister themes window elements
     */
    unregisterElements() {
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
}
/**
 * ThemesWindowRenderer - Handles themes selection window rendering
 * Self-contained renderer for the themes window
 */
class ThemesWindowRenderer {
    constructor(ctx, utils) {
        this.ctx = ctx;
        this.utils = new WindowRendererUtils(ctx, utils);
    }

    /**
     * Draw themes window
     */
    drawThemesWindow(game, theme) {
        const ctx = this.ctx;
        const win = game.themesWindow;

        const windowWidth = 600;
        const windowHeight = 500;
        const windowX = (TETRIS.WIDTH - windowWidth) / 2;
        const windowY = (TETRIS.HEIGHT - windowHeight) / 2;

        // Dark background overlay
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(0, 0, TETRIS.WIDTH, TETRIS.HEIGHT);

        // Window background with gradient
        ctx.fillStyle = this.utils.createWindowBackgroundGradient(windowX, windowY, windowWidth, windowHeight, theme);
        ctx.fillRect(windowX, windowY, windowWidth, windowHeight);

        // Window border with glow
        this.utils.drawWindowBorder(windowX, windowY, windowWidth, windowHeight, theme);

        // Inner border
        this.utils.drawWindowInnerBorder(windowX, windowY, windowWidth, windowHeight, theme);

        // Title bar (drawn fully inside the outer border)
        const titleBarHeight = 50;
        const titleGradient = this.utils.createTitleBarGradient(
            windowX + 3,
            windowY + 3,
            windowWidth - 6,
            titleBarHeight,
            theme
        );
        ctx.fillStyle = titleGradient;
        ctx.fillRect(windowX + 3, windowY + 3, windowWidth - 6, titleBarHeight);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 24px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("THEMES", windowX + windowWidth / 2, windowY + 25);

        // Select All / Deselect All buttons
        const selectAllY = windowY + 65;
        const selectButtonWidth = 230;
        const selectButtonHeight = 50;

        this.drawSelectAllButtons(windowX, selectAllY, windowWidth, selectButtonWidth, selectButtonHeight, win, theme);

        // Themes list in 2-column layout
        this.drawThemesList(windowX, windowY, windowWidth, win, theme);

        // Back button
        this.drawWindowBackButton(
            windowX,
            windowY,
            windowWidth,
            windowHeight,
            win.selectedRow === Math.max(Math.ceil(win.themes.length / 2), win.leftColumnMax) + 2 - 1 &&
                win.selectedCol === 0,
            theme
        );

        // Hint text
        ctx.fillStyle = theme.ui.text;
        ctx.font = "14px Arial";
        ctx.globalAlpha = 0.7;
        ctx.textAlign = "center";
        ctx.fillText(
            "Arrow Keys to navigate • Action1 to toggle • Action2 to go back",
            TETRIS.WIDTH / 2,
            windowY + windowHeight + 25
        );
        ctx.globalAlpha = 1.0;
    }

    drawSelectAllButtons(windowX, selectAllY, windowWidth, buttonWidth, buttonHeight, win, theme) {
        const ctx = this.ctx;
        const depth = 3;

        // Select All button
        const selectAllX = windowX + 40;
        const isSelectAllSelected = win.selectedRow === 0 && win.selectedCol === 0;

        this.utils.drawWindowButton(
            selectAllX,
            selectAllY,
            buttonWidth,
            buttonHeight,
            "SELECT ALL",
            isSelectAllSelected,
            depth,
            theme
        );

        // Deselect All button
        const deselectAllX = windowX + windowWidth - 40 - buttonWidth;
        const isDeselectAllSelected = win.selectedRow === 0 && win.selectedCol === 1;

        this.utils.drawWindowButton(
            deselectAllX,
            selectAllY,
            buttonWidth,
            buttonHeight,
            "DESELECT ALL",
            isDeselectAllSelected,
            depth,
            theme
        );
    }

    /**
     * Draw themes list in 2-column layout
     */
    drawThemesList(windowX, windowY, windowWidth, win, theme) {
        const ctx = this.ctx;
        const themeListY = windowY + 145;
        const themeSpacing = 38;
        const leftColumnX = windowX + 40;
        const rightColumnX = windowX + windowWidth / 2 + 10;
        const checkboxSize = 22;

        win.themes.forEach((themeItem, index) => {
            const isLeftColumn = index < win.leftColumnMax;
            const x = isLeftColumn ? leftColumnX : rightColumnX;
            const row = isLeftColumn ? index : index - win.leftColumnMax;
            const y = themeListY + row * themeSpacing;

            const gridRow = row + 1;
            const gridCol = isLeftColumn ? 0 : 1;
            const isSelected = win.selectedRow === gridRow && win.selectedCol === gridCol;

            // Checkbox
            ctx.strokeStyle = isSelected ? "#ffffff" : theme.ui.border;
            ctx.lineWidth = isSelected ? 2 : 1;
            ctx.strokeRect(x, y - 10, checkboxSize, checkboxSize);

            if (themeItem.enabled) {
                ctx.fillStyle = theme.ui.accent;
                ctx.fillRect(x + 3, y - 7, checkboxSize - 6, checkboxSize - 6);
            }

            // Theme name
            ctx.fillStyle = isSelected ? theme.ui.accent : theme.ui.text;
            ctx.font = isSelected ? "bold 19px Arial" : "17px Arial";
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            ctx.fillText(themeItem.displayName, x + 35, y);
        });
    }

    /**
     * Draw back button for windows
     */
    drawWindowBackButton(windowX, windowY, windowWidth, windowHeight, isSelected, theme) {
        const backButtonY = windowY + windowHeight - 70;
        const backButtonWidth = 120;
        const backButtonHeight = 40;
        const backButtonX = windowX + (windowWidth - backButtonWidth) / 2;

        this.utils.drawWindowButton(
            backButtonX,
            backButtonY,
            backButtonWidth,
            backButtonHeight,
            "BACK",
            isSelected,
            4,
            theme
        );
    }
}
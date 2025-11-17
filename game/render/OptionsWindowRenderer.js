/**
 * OptionsWindowRenderer - Handles options/settings window rendering
 * Self-contained renderer for the options window
 */
class OptionsWindowRenderer {
    constructor(ctx, utils) {
        this.ctx = ctx;
        this.utils = new WindowRendererUtils(ctx, utils);
    }

    /**
     * Draw options window
     */
    drawOptionsWindow(game, theme) {
        const ctx = this.ctx;
        const win = game.optionsWindow;

        const windowWidth = 500;
        const windowHeight = 350;
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

        // Inner border (kept inside the outer border so content doesn't bleed)
        this.utils.drawWindowInnerBorder(windowX, windowY, windowWidth, windowHeight, theme);

        // Title bar with gradient (drawn fully inside the outer border)
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

        // Title text
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 24px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("OPTIONS", windowX + windowWidth / 2, windowY + 25);

        // Draw settings toggles
        const settingY = windowY + 100;
        const settingSpacing = 60;

        win.settings.forEach((setting, index) => {
            const y = settingY + index * settingSpacing;
            const isSelected = index === win.selectedIndex;

            // Toggle button
            const toggleX = windowX + windowWidth - 120;
            const toggleWidth = 80;
            const toggleHeight = 35;
            const toggleY = y - 18;

            // Setting name - align center with toggle button
            ctx.fillStyle = isSelected ? theme.ui.accent : theme.ui.text;
            ctx.font = isSelected ? "bold 20px Arial" : "18px Arial";
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            const toggleCenterY = toggleY + toggleHeight / 2;
            ctx.fillText(setting.name, windowX + 40, toggleCenterY);

            this.utils.drawToggleButton(
                toggleX,
                toggleY,
                toggleWidth,
                toggleHeight,
                isSelected,
                game.gameSettings[setting.key],
                setting.type,
                theme
            );
        });

        // Back button
        this.drawWindowBackButton(
            windowX,
            windowY,
            windowWidth,
            windowHeight,
            win.selectedIndex === win.settings.length,
            theme
        );

        // Hint text
        ctx.fillStyle = theme.ui.text;
        ctx.font = "14px Arial";
        ctx.globalAlpha = 0.7;
        ctx.fillText("Press Action1 to toggle • Action2 to go back", TETRIS.WIDTH / 2, windowY + windowHeight + 30);
        ctx.globalAlpha = 1.0;
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
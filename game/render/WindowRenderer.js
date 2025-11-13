/**
 * WindowRenderer - Handles modal window rendering (options, themes, settings)
 */
class WindowRenderer {
    constructor(ctx, utils) {
        this.ctx = ctx;
        this.utils = utils;
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
        const gradient = ctx.createLinearGradient(windowX, windowY, windowX, windowY + windowHeight);
        gradient.addColorStop(0, theme.ui.background);
        gradient.addColorStop(1, this.utils.darkenColor(theme.ui.background, 0.4));
        ctx.fillStyle = gradient;
        ctx.fillRect(windowX, windowY, windowWidth, windowHeight);

        // Window border with glow
        ctx.strokeStyle = theme.ui.border;
        ctx.lineWidth = 3;
        ctx.shadowColor = theme.ui.border;
        ctx.shadowBlur = 15;
        ctx.strokeRect(windowX, windowY, windowWidth, windowHeight);
        ctx.shadowBlur = 0;

        // Inner border (kept inside the outer border so content doesn't bleed)
        ctx.strokeStyle = this.utils.lightenColor(theme.ui.border, 0.3);
        ctx.lineWidth = 1;
        ctx.strokeRect(windowX + 3, windowY + 3, windowWidth - 6, windowHeight - 6);

        // Title bar with gradient (drawn fully inside the outer border)
        const titleBarHeight = 50;
        const titleGradient = ctx.createLinearGradient(
            windowX + 3,
            windowY + 3,
            windowX + 3,
            windowY + 3 + titleBarHeight
        );
        titleGradient.addColorStop(0, theme.ui.accent);
        titleGradient.addColorStop(1, this.utils.darkenColor(theme.ui.accent, 0.3));
        ctx.fillStyle = titleGradient;
        ctx.fillRect(windowX + 3, windowY + 3, windowWidth - 6, titleBarHeight);

        // Title text
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 24px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("OPTIONS", windowX + windowWidth / 2, windowY + 25);

        // Draw settings toggles
        const settingY = windowY + 80;
        const settingSpacing = 60;

        win.settings.forEach((setting, index) => {
            const y = settingY + index * settingSpacing;
            const isSelected = index === win.selectedIndex;

            // Setting name
            ctx.fillStyle = isSelected ? theme.ui.accent : theme.ui.text;
            ctx.font = isSelected ? "bold 20px Arial" : "18px Arial";
            ctx.textAlign = "left";
            ctx.fillText(setting.name, windowX + 40, y);

            // Toggle button
            const toggleX = windowX + windowWidth - 120;
            const toggleWidth = 80;
            const toggleHeight = 35;
            const toggleY = y - 18;

            this.drawToggleButton(
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
        const gradient = ctx.createLinearGradient(windowX, windowY, windowX, windowY + windowHeight);
        gradient.addColorStop(0, theme.ui.background);
        gradient.addColorStop(1, this.utils.darkenColor(theme.ui.background, 0.4));
        ctx.fillStyle = gradient;
        ctx.fillRect(windowX, windowY, windowWidth, windowHeight);

        // Window border with glow
        ctx.strokeStyle = theme.ui.border;
        ctx.lineWidth = 3;
        ctx.shadowColor = theme.ui.border;
        ctx.shadowBlur = 15;
        ctx.strokeRect(windowX, windowY, windowWidth, windowHeight);
        ctx.shadowBlur = 0;

        // Inner border
        ctx.strokeStyle = this.utils.lightenColor(theme.ui.border, 0.3);
        ctx.lineWidth = 1;
        ctx.strokeRect(windowX + 3, windowY + 3, windowWidth - 6, windowHeight - 6);

        // Title bar (drawn fully inside the outer border)
        const titleBarHeight = 50;
        const titleGradient = ctx.createLinearGradient(
            windowX + 3,
            windowY + 3,
            windowX + 3,
            windowY + 3 + titleBarHeight
        );
        titleGradient.addColorStop(0, theme.ui.accent);
        titleGradient.addColorStop(1, this.utils.darkenColor(theme.ui.accent, 0.3));
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

    /**
     * Draw toggle button for options window
     */
    drawToggleButton(x, y, width, height, isSelected, settingValue, settingType, theme) {
        const ctx = this.ctx;
        const depth = 3;
        const isEnabled = settingType === "cycle" ? true : settingValue;

        // Shadow
        if (isSelected) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
            ctx.fillRect(x + depth + 2, y + depth + 2, width, height);
        } else {
            ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
            ctx.fillRect(x + depth, y + depth, width, height);
        }

        // Gradient background
        const gradient = ctx.createLinearGradient(x, y, x, y + height);
        if (isSelected) {
            gradient.addColorStop(0, this.utils.lightenColor(theme.ui.accent, 0.6));
            gradient.addColorStop(1, theme.ui.accent);
        } else if (isEnabled) {
            gradient.addColorStop(0, theme.ui.accent);
            gradient.addColorStop(1, this.utils.darkenColor(theme.ui.accent, 0.3));
        } else {
            gradient.addColorStop(0, this.utils.darkenColor(theme.ui.background, 0.3));
            gradient.addColorStop(1, this.utils.darkenColor(theme.ui.background, 0.5));
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, width, height);

        // Highlight
        if (isSelected) {
            const highlightGradient = ctx.createLinearGradient(x, y, x, y + height * 0.6);
            highlightGradient.addColorStop(0, "rgba(255, 255, 255, 0.7)");
            highlightGradient.addColorStop(1, "rgba(255, 255, 255, 0.1)");
            ctx.fillStyle = highlightGradient;
            ctx.fillRect(x, y, width, height * 0.6);
        }

        // Border
        if (isSelected) {
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, width, height);
            ctx.strokeStyle = this.utils.darkenColor(theme.ui.accent, 0.5);
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);
        } else {
            ctx.strokeStyle = this.utils.darkenColor(theme.ui.accent, 0.4);
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);
        }

        // Text
        ctx.fillStyle = isSelected ? "#000000" : "#ffffff";
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";
        if (isSelected) {
            ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
            ctx.shadowBlur = 8;
        }

        // Handle different setting types
        if (settingType === "cycle") {
            const displayValue = settingValue.charAt(0).toUpperCase() + settingValue.slice(1);
            ctx.fillText(displayValue, x + width / 2, y + height / 2 + 5);
        } else {
            ctx.fillText(isEnabled ? "ON" : "OFF", x + width / 2, y + height / 2 + 5);
        }

        if (isSelected) {
            ctx.shadowBlur = 0;
        }
    }

    /**
     * Draw Select All / Deselect All buttons for themes window
     */
    drawSelectAllButtons(windowX, selectAllY, windowWidth, buttonWidth, buttonHeight, win, theme) {
        const ctx = this.ctx;
        const depth = 3;

        // Select All button
        const selectAllX = windowX + 40;
        const isSelectAllSelected = win.selectedRow === 0 && win.selectedCol === 0;

        this.drawWindowButton(
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

        this.drawWindowButton(
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
     * Draw a styled button for windows
     */
    drawWindowButton(x, y, width, height, text, isSelected, depth, theme) {
        const ctx = this.ctx;

        // Shadow
        if (isSelected) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
            ctx.fillRect(x + depth + 2, y + depth + 2, width, height);
        } else {
            ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
            ctx.fillRect(x + depth, y + depth, width, height);
        }

        // Gradient background
        const gradient = ctx.createLinearGradient(x, y, x, y + height);
        if (isSelected) {
            gradient.addColorStop(0, this.utils.lightenColor(theme.ui.accent, 0.6));
            gradient.addColorStop(1, theme.ui.accent);
        } else {
            gradient.addColorStop(0, theme.ui.accent);
            gradient.addColorStop(1, this.utils.darkenColor(theme.ui.accent, 0.3));
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, width, height);

        // Highlight
        if (isSelected) {
            const highlightGradient = ctx.createLinearGradient(x, y, x, y + height * 0.6);
            highlightGradient.addColorStop(0, "rgba(255, 255, 255, 0.7)");
            highlightGradient.addColorStop(1, "rgba(255, 255, 255, 0.1)");
            ctx.fillStyle = highlightGradient;
            ctx.fillRect(x, y, width, height * 0.6);
        }

        // Border
        if (isSelected) {
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, width, height);
            ctx.strokeStyle = this.utils.darkenColor(theme.ui.accent, 0.5);
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);
        } else {
            ctx.strokeStyle = this.utils.darkenColor(theme.ui.accent, 0.4);
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);
        }

        // Text
        ctx.fillStyle = isSelected ? "#000000" : "#ffffff";
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        if (isSelected) {
            ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
            ctx.shadowBlur = 8;
        }
        ctx.fillText(text, x + width / 2, y + height / 2);
        if (isSelected) {
            ctx.shadowBlur = 0;
        }
    }

    /**
     * Draw back button for windows
     */
    drawWindowBackButton(windowX, windowY, windowWidth, windowHeight, isSelected, theme) {
        const backButtonY = windowY + windowHeight - 70;
        const backButtonWidth = 120;
        const backButtonHeight = 40;
        const backButtonX = windowX + (windowWidth - backButtonWidth) / 2;

        this.drawWindowButton(
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

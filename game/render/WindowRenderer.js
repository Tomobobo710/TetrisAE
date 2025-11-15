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
     * Draw controls window
     */
    drawControlsWindow(game, theme) {
        const ctx = this.ctx;
        const win = game.controlsWindow;

        // Dark background overlay
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(0, 0, TETRIS.WIDTH, TETRIS.HEIGHT);

        // Window background with gradient
        const gradient = ctx.createLinearGradient(win.x, win.y, win.x, win.y + win.height);
        gradient.addColorStop(0, theme.ui.background);
        gradient.addColorStop(1, this.utils.darkenColor(theme.ui.background, 0.4));
        ctx.fillStyle = gradient;
        ctx.fillRect(win.x, win.y, win.width, win.height);

        // Window border with glow
        ctx.strokeStyle = theme.ui.border;
        ctx.lineWidth = 3;
        ctx.shadowColor = theme.ui.border;
        ctx.shadowBlur = 15;
        ctx.strokeRect(win.x, win.y, win.width, win.height);
        ctx.shadowBlur = 0;

        // Inner border
        ctx.strokeStyle = this.utils.lightenColor(theme.ui.border, 0.3);
        ctx.lineWidth = 1;
        ctx.strokeRect(win.x + 3, win.y + 3, win.width - 6, win.height - 6);

        // Title bar (drawn fully inside the outer border)
        const titleBarHeight = 50;
        const titleGradient = ctx.createLinearGradient(
            win.x + 3,
            win.y + 3,
            win.x + 3,
            win.y + 3 + titleBarHeight
        );
        titleGradient.addColorStop(0, theme.ui.accent);
        titleGradient.addColorStop(1, this.utils.darkenColor(theme.ui.accent, 0.3));
        ctx.fillStyle = titleGradient;
        ctx.fillRect(win.x + 3, win.y + 3, win.width - 6, titleBarHeight);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 24px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("CONTROLS", win.x + win.width / 2, win.y + 25);

        // Column headers
        ctx.fillStyle = theme.ui.accent;
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Keyboard", win.x + 225, win.y + 60);
        ctx.fillText("Gamepad", win.x + 430, win.y + 60);

        // Sub-headers for Primary/Alt
        ctx.fillStyle = theme.ui.text;
        ctx.font = "12px Arial";
        ctx.fillText("Primary", win.x + 175, win.y + 75);
        ctx.fillText("Alt", win.x + 285, win.y + 75);
        ctx.fillText("Primary", win.x + 375, win.y + 75);
        ctx.fillText("Alt", win.x + 485, win.y + 75);

        // Draw action list in 4-column layout
        this.drawControlsList(win, theme);

        // Draw DEFAULT and CLOSE buttons
        this.drawControlsButtons(win, theme);

        // Draw confirm modal if showing
        if (game.confirmModal && game.confirmModal.isVisible) {
            this.drawConfirmModal(game.confirmModal, win, theme);
        }

        // Waiting for input modal
        if (game.inputWaitingModal && game.inputWaitingModal.isActive) {
            this.drawInputWaitingModal(game.inputWaitingModal, win, theme);
        }

        // Hint text
        ctx.fillStyle = theme.ui.text;
        ctx.font = "14px Arial";
        ctx.globalAlpha = 0.7;
        ctx.textAlign = "center";
        ctx.fillText(
            "Arrow Keys to navigate • Enter/Space/A to remap/select • B to go back",
            TETRIS.WIDTH / 2,
            win.y + win.height + 25
        );
        ctx.globalAlpha = 1.0;
    }

    drawControlsList(win, theme) {
        const ctx = this.ctx;
        const rowHeight = 32;
        const headerHeight = 80;
        const listY = win.y + headerHeight;

        for (let i = 0; i < Math.min(win.maxVisibleActions, win.actions.length - win.scrollOffset); i++) {
            const actionIndex = i + win.scrollOffset;
            const action = win.actions[actionIndex];
            const rowY = listY + i * rowHeight;

            // Action name
            ctx.fillStyle = theme.ui.text;
            ctx.font = "14px Arial";
            ctx.textAlign = "left";
            ctx.fillText(action.name, win.x + 20, rowY + 20);

            // 4 columns of controls
            this.drawControlColumn(win.x + 175, rowY, 90, rowHeight - 2, action.keyboard?.primary, actionIndex === win.selectedActionIndex && win.selectedColumn === 0, theme);
            this.drawControlColumn(win.x + 285, rowY, 80, rowHeight - 2, action.keyboard?.alt, actionIndex === win.selectedActionIndex && win.selectedColumn === 1, theme);
            this.drawControlColumn(win.x + 375, rowY, 90, rowHeight - 2, action.gamepad?.primary, actionIndex === win.selectedActionIndex && win.selectedColumn === 2, theme);
            this.drawControlColumn(win.x + 485, rowY, 80, rowHeight - 2, action.gamepad?.alt || action.axis, actionIndex === win.selectedActionIndex && win.selectedColumn === 3, theme);
        }

        // Scroll indicators
        if (win.scrollOffset > 0) {
            ctx.fillStyle = theme.ui.accent;
            ctx.font = "16px Arial";
            ctx.textAlign = "center";
            ctx.fillText("▲", win.x + 10, listY - 10);
        }
        if (win.scrollOffset + win.maxVisibleActions < win.actions.length) {
            ctx.fillStyle = theme.ui.accent;
            ctx.font = "16px Arial";
            ctx.textAlign = "center";
            ctx.fillText("▼", win.x + 10, listY + win.maxVisibleActions * rowHeight + 15);
        }
    }

    drawControlColumn(x, y, width, height, control, isSelected, theme) {
        const ctx = this.ctx;

        // Border
        ctx.strokeStyle = isSelected ? "#ffffff" : theme.ui.border;
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.strokeRect(x, y, width, height);

        // Background for selected
        if (isSelected) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
            ctx.fillRect(x + 1, y + 1, width - 2, height - 2);
        }

        // Control text or visual
        ctx.fillStyle = isSelected ? "#ffffff" : theme.ui.text;
        ctx.font = isSelected ? "bold 12px Arial" : "12px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Check if this is a gamepad face button for visual display
        if (control && typeof control === 'object' && control.type === 'button' && control.value >= 0 && control.value <= 3) {
            this.drawGamepadFaceButton(x + width / 2, y + height / 2, control.value, isSelected, theme);
        } else {
            // All other controls - keyboard keys, buttons, axis bindings
            const controlText = this.getControlDisplayText(control);
            ctx.fillText(controlText, x + width / 2, y + height / 2);
        }
    }

    drawGamepadFaceButton(centerX, centerY, buttonIndex, isSelected, theme) {
        const ctx = this.ctx;
        const radius = 8;
        const labels = ['A', 'B', 'X', 'Y'];
        const colors = ['#00ff00', '#ff0000', '#0000ff', '#ffff00']; // A, B, X, Y colors

        // Draw diamond shape for face buttons
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(Math.PI / 4); // 45 degree rotation for diamond

        // Fill diamond
        ctx.fillStyle = isSelected ? "#ffffff" : colors[buttonIndex];
        ctx.beginPath();
        ctx.moveTo(0, -radius);
        ctx.lineTo(radius, 0);
        ctx.lineTo(0, radius);
        ctx.lineTo(-radius, 0);
        ctx.closePath();
        ctx.fill();

        // Border
        ctx.strokeStyle = isSelected ? "#ffffff" : "#000000";
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.stroke();

        ctx.restore();

        // Draw label on top
        ctx.fillStyle = isSelected ? "#000000" : "#ffffff";
        ctx.font = isSelected ? "bold 10px Arial" : "10px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(labels[buttonIndex], centerX, centerY);
    }

    getControlDisplayText(control) {
        if (!control) return "---";

        if (typeof control === 'string') {
            // Keyboard key - use the manager's display names
            return this.getKeyboardKeyDisplayName(control);
        } else if (typeof control === 'number') {
            // Gamepad button - use the manager's visual display
            return this.getGamepadButtonDisplayLabel(control);
        } else if (typeof control === 'object' && control.type === 'button') {
            // Button object - extract value
            return this.getGamepadButtonDisplayLabel(control.value);
        } else if (typeof control === 'object' && control.type === 'axis') {
            // Axis object - extract value for display
            return this.getAxisDisplayLabel(control.value);
        }

        return "---";
    }

    getAxisDisplayLabel(axis) {
        if (!axis) return "---";

        // Standard gamepad axis mapping
        const axisLabels = {
            0: { // Left stick X
                'positive': '(LS) →',
                'negative': '(LS) ←'
            },
            1: { // Left stick Y
                'positive': '(LS) ↓',
                'negative': '(LS) ↑'
            },
            2: { // Right stick X
                'positive': '(RS) →',
                'negative': '(RS) ←'
            },
            3: { // Right stick Y
                'positive': '(RS) ↓',
                'negative': '(RS) ↑'
            }
        };

        const axisInfo = axisLabels[axis.index];
        if (axisInfo) {
            return axisInfo[axis.direction] || `A${axis.index}?`;
        }

        return `A${axis.index}${axis.direction === 'positive' ? '+' : axis.direction === 'negative' ? '-' : '?'}`;
    }

    getKeyboardKeyDisplayName(keyCode) {
        const keyNames = {
            'Space': 'Space',
            'Enter': 'Enter',
            'Escape': 'Esc',
            'Backspace': 'Backspace',
            'Tab': 'Tab',
            'ShiftLeft': 'Shift',
            'ShiftRight': 'R-Shift',
            'ControlLeft': 'Ctrl',
            'ControlRight': 'R-Ctrl',
            'AltLeft': 'Alt',
            'AltRight': 'R-Alt',
            'ArrowUp': '↑',
            'ArrowDown': '↓',
            'ArrowLeft': '←',
            'ArrowRight': '→',
            'KeyA': 'A', 'KeyB': 'B', 'KeyC': 'C', 'KeyD': 'D', 'KeyE': 'E',
            'KeyF': 'F', 'KeyG': 'G', 'KeyH': 'H', 'KeyI': 'I', 'KeyJ': 'J',
            'KeyK': 'K', 'KeyL': 'L', 'KeyM': 'M', 'KeyN': 'N', 'KeyO': 'O',
            'KeyP': 'P', 'KeyQ': 'Q', 'KeyR': 'R', 'KeyS': 'S', 'KeyT': 'T',
            'KeyU': 'U', 'KeyV': 'V', 'KeyW': 'W', 'KeyX': 'X', 'KeyY': 'Y',
            'KeyZ': 'Z',
            'Digit0': '0', 'Digit1': '1', 'Digit2': '2', 'Digit3': '3', 'Digit4': '4',
            'Digit5': '5', 'Digit6': '6', 'Digit7': '7', 'Digit8': '8', 'Digit9': '9',
            'F1': 'F1', 'F2': 'F2', 'F3': 'F3', 'F4': 'F4', 'F5': 'F5',
            'F6': 'F6', 'F7': 'F7', 'F8': 'F8', 'F9': 'F9', 'F10': 'F10',
            'F11': 'F11', 'F12': 'F12'
        };

        return keyNames[keyCode] || keyCode.replace('Key', '').replace('Digit', '');
    }

    getGamepadButtonDisplayLabel(buttonIndex) {
        // Face buttons use diamond layout visual - return labels
        if (buttonIndex >= 0 && buttonIndex <= 3) {
            return ['A', 'B', 'X', 'Y'][buttonIndex];
        }

        // Other buttons use simple labels
        const buttonLabels = {
            4: 'L1', 5: 'R1', 6: 'L2', 7: 'R2',
            8: 'Select', 9: 'Start',
            10: 'L3', 11: 'R3',
            12: '↑', 13: '↓', 14: '←', 15: '→'
        };

        return buttonLabels[buttonIndex] || `B${buttonIndex}`;
    }

    drawControlsButtons(win, theme) {
        const ctx = this.ctx;
        const buttonY = win.y + win.height - 60;

        // DEFAULT button
        const isDefaultSelected = win.navigatingButtons && win.selectedButtonIndex === 0;
        this.drawWindowButton(win.x + 50, buttonY, 100, 35, "DEFAULT", isDefaultSelected, 3, theme);

        // CLOSE button
        const isCloseSelected = win.navigatingButtons && win.selectedButtonIndex === 1;
        this.drawWindowButton(win.x + win.width - 150, buttonY, 100, 35, "CLOSE", isCloseSelected, 3, theme);
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
     * Draw confirm modal for controls reset
     */
    drawConfirmModal(modal, win, theme) {
        const ctx = this.ctx;
        const modalWidth = 400;
        const modalHeight = 150;
        const modalX = win.x + (win.width - modalWidth) / 2;
        const modalY = win.y + (win.height - modalHeight) / 2;

        // Semi-transparent dark overlay for the entire window
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(win.x, win.y, win.width, win.height);

        // Modal background with gradient
        const modalGradient = ctx.createLinearGradient(modalX, modalY, modalX, modalY + modalHeight);
        modalGradient.addColorStop(0, theme.ui.background);
        modalGradient.addColorStop(1, this.utils.darkenColor(theme.ui.background, 0.4));
        ctx.fillStyle = modalGradient;
        ctx.fillRect(modalX, modalY, modalWidth, modalHeight);

        // Modal border with glow
        ctx.strokeStyle = theme.ui.border;
        ctx.lineWidth = 3;
        ctx.shadowColor = theme.ui.border;
        ctx.shadowBlur = 15;
        ctx.strokeRect(modalX, modalY, modalWidth, modalHeight);
        ctx.shadowBlur = 0;

        // Inner border
        ctx.strokeStyle = this.utils.lightenColor(theme.ui.border, 0.3);
        ctx.lineWidth = 1;
        ctx.strokeRect(modalX + 3, modalY + 3, modalWidth - 6, modalHeight - 6);

        // Title bar
        const titleBarHeight = 40;
        const titleGradient = ctx.createLinearGradient(
            modalX + 3,
            modalY + 3,
            modalX + 3,
            modalY + 3 + titleBarHeight
        );
        titleGradient.addColorStop(0, theme.ui.accent);
        titleGradient.addColorStop(1, this.utils.darkenColor(theme.ui.accent, 0.3));
        ctx.fillStyle = titleGradient;
        ctx.fillRect(modalX + 3, modalY + 3, modalWidth - 6, titleBarHeight);

        // Title text
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 18px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(modal.title, modalX + modalWidth / 2, modalY + 20);

        // Message text
        ctx.fillStyle = theme.ui.text;
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        const messageY = modalY + 70;
        ctx.fillText(modal.message, modalX + modalWidth / 2, messageY);

        // YES and NO buttons
        const buttonWidth = 80;
        const buttonHeight = 35;
        const buttonY = modalY + modalHeight - 50;

        // Get current selection state for visual feedback
        const isYesSelected = modal.selectedButton === 0;
        const isNoSelected = modal.selectedButton === 1;

        // YES button (left)
        this.drawWindowButton(
            modalX + modalWidth / 2 - buttonWidth - 20,
            buttonY,
            buttonWidth,
            buttonHeight,
            "YES",
            isYesSelected,
            3,
            theme
        );

        // NO button (right)
        this.drawWindowButton(
            modalX + modalWidth / 2 + 20,
            buttonY,
            buttonWidth,
            buttonHeight,
            "NO",
            isNoSelected,
            3,
            theme
        );

    }

    /**
     * Draw input waiting modal with proper window styling
     * Customize appearance using the constants below
     */
    drawInputWaitingModal(modal, win, theme) {
        // ===== CUSTOMIZE MODAL APPEARANCE =====
        const MODAL_WIDTH = 450;      // Overall modal width
        const MODAL_HEIGHT = 180;     // Overall modal height
        const TITLE_BAR_HEIGHT = 45;  // Height of the colored title bar

        // Positioning relative to parent window
        const MODAL_OFFSET_X = 0;     // Horizontal offset from center (0 = centered)
        const MODAL_OFFSET_Y = 0;     // Vertical offset from center (0 = centered)

        // Content spacing and positioning
        const TITLE_Y_OFFSET = 22;    // Title text Y position from top
        const PROMPT_Y_START = 70;    // Starting Y position for prompt text
        const PROMPT_LINE_SPACING = 20; // Spacing between prompt text lines
        const TIMER_Y_OFFSET = 65;    // Timer position from bottom (negative = from bottom)

        // Progress bar positioning and size
        const PROGRESS_BAR_Y_OFFSET = 30;       // Progress bar Y position from bottom
        const PROGRESS_BAR_HEIGHT = 12;         // Height of progress bar
        const PROGRESS_BAR_WIDTH_REDUCTION = 60; // Amount to reduce width from modal edges
        const PROGRESS_BAR_X_OFFSET = 30;       // Left margin for progress bar
        const PROGRESS_BAR_CORNER_RADIUS = 3;   // Corner radius for rounded progress bar
        const PROGRESS_BAR_BACKGROUND_OPACITY = 0.2; // Background opacity (0.0-1.0)

        // Typography
        const TITLE_FONT_SIZE = 20;
        const PROMPT_FONT_SIZE = 16;
        const TIMER_FONT_SIZE = 32;

        // Colors and effects
        const OVERLAY_OPACITY = 0.7; // Background overlay transparency
        const TITLE_TEXT_COLOR = "#ffffff";

        // ===== END CUSTOMIZATION =====

        const ctx = this.ctx;
        const modalWidth = MODAL_WIDTH;
        const modalHeight = MODAL_HEIGHT;
        const modalX = win.x + (win.width - modalWidth) / 2 + MODAL_OFFSET_X;
        const modalY = win.y + (win.height - modalHeight) / 2 + MODAL_OFFSET_Y;

        // Semi-transparent dark overlay for the entire window
        ctx.fillStyle = `rgba(0, 0, 0, ${OVERLAY_OPACITY})`;
        ctx.fillRect(win.x, win.y, win.width, win.height);

        // Modal background with gradient
        const modalGradient = ctx.createLinearGradient(modalX, modalY, modalX, modalY + modalHeight);
        modalGradient.addColorStop(0, theme.ui.background);
        modalGradient.addColorStop(1, this.utils.darkenColor(theme.ui.background, 0.4));
        ctx.fillStyle = modalGradient;
        ctx.fillRect(modalX, modalY, modalWidth, modalHeight);

        // Modal border with glow
        ctx.strokeStyle = theme.ui.border;
        ctx.lineWidth = 3;
        ctx.shadowColor = theme.ui.border;
        ctx.shadowBlur = 15;
        ctx.strokeRect(modalX, modalY, modalWidth, modalHeight);
        ctx.shadowBlur = 0;

        // Inner border
        ctx.strokeStyle = this.utils.lightenColor(theme.ui.border, 0.3);
        ctx.lineWidth = 1;
        ctx.strokeRect(modalX + 3, modalY + 3, modalWidth - 6, modalHeight - 6);

        // Title bar
        const titleBarHeight = TITLE_BAR_HEIGHT;
        const titleGradient = ctx.createLinearGradient(
            modalX + 3,
            modalY + 3,
            modalX + 3,
            modalY + 3 + titleBarHeight
        );
        titleGradient.addColorStop(0, theme.ui.accent);
        titleGradient.addColorStop(1, this.utils.darkenColor(theme.ui.accent, 0.3));
        ctx.fillStyle = titleGradient;
        ctx.fillRect(modalX + 3, modalY + 3, modalWidth - 6, titleBarHeight);

        // Title text
        ctx.fillStyle = TITLE_TEXT_COLOR;
        ctx.font = `bold ${TITLE_FONT_SIZE}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("WAITING FOR INPUT", modalX + modalWidth / 2, modalY + TITLE_Y_OFFSET);

        // Prompt text
        ctx.fillStyle = theme.ui.text;
        ctx.font = `${PROMPT_FONT_SIZE}px Arial`;
        ctx.textAlign = "center";
        let promptText = `Press any ${modal.waitingForInputType} key`;
        if (modal.waitingForInputType === 'gamepad' && modal.waitingForColumn === 'alt') {
            promptText += " or move an axis.";
        } else {
            promptText += "."
        }
        const promptLines = promptText.split('\n');
        promptLines.forEach((line, index) => {
            ctx.fillText(line, modalX + modalWidth / 2, modalY + PROMPT_Y_START + index * PROMPT_LINE_SPACING);
        });

        // Visual countdown timer
        const remainingSeconds = Math.ceil(modal.getRemainingTime());
        const timerY = modalY + modalHeight - TIMER_Y_OFFSET;

        // Countdown number
        ctx.font = `bold ${TIMER_FONT_SIZE}px Arial`;
        ctx.fillStyle = remainingSeconds <= 1 ? "#ff0000" : remainingSeconds <= 2 ? "#ffff00" : "#00ff00";
        ctx.fillText(remainingSeconds.toString(), modalX + modalWidth / 2, timerY);

        // Progress bar background
        const barWidth = modalWidth - PROGRESS_BAR_WIDTH_REDUCTION;
        const barHeight = PROGRESS_BAR_HEIGHT;
        const barX = modalX + PROGRESS_BAR_X_OFFSET;
        const barY = modalY + modalHeight - PROGRESS_BAR_Y_OFFSET;

        ctx.fillStyle = `rgba(255, 255, 255, ${PROGRESS_BAR_BACKGROUND_OPACITY})`;
        this.roundRect(ctx, barX, barY, barWidth, barHeight, PROGRESS_BAR_CORNER_RADIUS);
        ctx.fill();

        // Progress bar fill
        const progress = modal.getProgress();
        ctx.fillStyle = progress > 0.3 ? "#00ff00" : "#ff0000";
        const fillWidth = barWidth * progress;
        if (fillWidth > PROGRESS_BAR_CORNER_RADIUS * 2) {
            this.roundRect(ctx, barX, barY, fillWidth, barHeight, PROGRESS_BAR_CORNER_RADIUS);
            ctx.fill();
        }

        // Progress bar border
        ctx.strokeStyle = theme.ui.border;
        ctx.lineWidth = 1;
        this.roundRect(ctx, barX, barY, barWidth, barHeight, PROGRESS_BAR_CORNER_RADIUS);
        ctx.stroke();
    }

    /**
     * Draw a rounded rectangle
     */
    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
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

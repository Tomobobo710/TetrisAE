/**
 * ControlsWindowRenderer - Handles controls remapping window rendering
 * Self-contained renderer for the controls window
 */
class ControlsWindowRenderer {
    constructor(ctx, utils) {
        this.ctx = ctx;
        this.utils = new WindowRendererUtils(ctx, utils);
    }

    /**
     * Draw controls window
     * Uses shared constants from ControlsLayoutConstants for consistency
     */
    drawControlsWindow(game, theme) {
        const ctx = this.ctx;
        const win = game.controlsWindow;

        // Update window dimensions and position from constants
        win.width = ControlsLayoutConstants.WINDOW_WIDTH;
        win.height = ControlsLayoutConstants.WINDOW_HEIGHT;
        win.x = ControlsLayoutConstants.WINDOW_X;
        win.y = ControlsLayoutConstants.WINDOW_Y;

        // Dark background overlay
        ctx.fillStyle = `rgba(0, 0, 0, ${ControlsLayoutConstants.BACKGROUND_OVERLAY_OPACITY})`;
        ctx.fillRect(0, 0, TETRIS.WIDTH, TETRIS.HEIGHT);

        // Window background with gradient
        const gradient = ctx.createLinearGradient(win.x, win.y, win.x, win.y + win.height);
        gradient.addColorStop(0, theme.ui.background);
        gradient.addColorStop(1, this.utils.utils.darkenColor(theme.ui.background, 0.4));
        ctx.fillStyle = gradient;
        ctx.fillRect(win.x, win.y, win.width, win.height);

        // Window border with glow
        this.utils.drawWindowBorder(win.x, win.y, win.width, win.height, theme);

        // Inner border
        this.utils.drawWindowInnerBorder(win.x, win.y, win.width, win.height, theme);

        // Title bar (drawn fully inside the outer border)
        const titleBarHeight = ControlsLayoutConstants.TITLE_BAR_HEIGHT;
        const titleGradient = this.utils.createTitleBarGradient(
            win.x + 3,
            win.y + 3,
            win.width - 6,
            titleBarHeight,
            theme
        );
        ctx.fillStyle = titleGradient;
        ctx.fillRect(win.x + 3, win.y + 3, win.width - 6, titleBarHeight);

        ctx.fillStyle = ControlsLayoutConstants.TITLE_TEXT_COLOR;
        ctx.font = `${ControlsLayoutConstants.TITLE_FONT_WEIGHT} ${ControlsLayoutConstants.TITLE_FONT_SIZE}px ${ControlsLayoutConstants.TITLE_FONT_FAMILY}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("CONTROLS", win.x + win.width / 2, win.y + ControlsLayoutConstants.TITLE_Y_OFFSET);

        // Column headers
        ctx.fillStyle = theme.ui.accent;
        ctx.font = `${ControlsLayoutConstants.COLUMN_HEADER_FONT_WEIGHT} ${ControlsLayoutConstants.COLUMN_HEADER_FONT_SIZE}px Arial`;
        ctx.textAlign = "center";
        ctx.fillText("Keyboard", win.x + ControlsLayoutConstants.KEYBOARD_COLUMN_X + ControlsLayoutConstants.KEYBOARD_HEADER_X_OFFSET, win.y + ControlsLayoutConstants.COLUMN_HEADER_Y_OFFSET + ControlsLayoutConstants.KEYBOARD_HEADER_Y_OFFSET);
        ctx.fillText("Gamepad", win.x + ControlsLayoutConstants.GAMEPAD_COLUMN_X + ControlsLayoutConstants.GAMEPAD_HEADER_X_OFFSET, win.y + ControlsLayoutConstants.COLUMN_HEADER_Y_OFFSET + ControlsLayoutConstants.GAMEPAD_HEADER_Y_OFFSET);

        // Sub-headers for Primary/Alt
        ctx.fillStyle = theme.ui.text;
        ctx.font = `${ControlsLayoutConstants.SUB_HEADER_FONT_SIZE}px Arial`;
        ctx.fillText("Primary", win.x + ControlsLayoutConstants.PRIMARY_KEYBOARD_X + ControlsLayoutConstants.PRIMARY_SUB_HEADER_X_OFFSET, win.y + ControlsLayoutConstants.SUB_HEADER_Y_OFFSET + ControlsLayoutConstants.PRIMARY_SUB_HEADER_Y_OFFSET);
        ctx.fillText("Alt", win.x + ControlsLayoutConstants.ALT_KEYBOARD_X + ControlsLayoutConstants.ALT_SUB_HEADER_X_OFFSET, win.y + ControlsLayoutConstants.SUB_HEADER_Y_OFFSET + ControlsLayoutConstants.ALT_SUB_HEADER_Y_OFFSET);
        ctx.fillText("Primary", win.x + ControlsLayoutConstants.PRIMARY_GAMEPAD_X + ControlsLayoutConstants.PRIMARY_SUB_HEADER_X_OFFSET, win.y + ControlsLayoutConstants.SUB_HEADER_Y_OFFSET + ControlsLayoutConstants.PRIMARY_SUB_HEADER_Y_OFFSET);
        ctx.fillText("Alt", win.x + ControlsLayoutConstants.ALT_GAMEPAD_X + ControlsLayoutConstants.ALT_SUB_HEADER_X_OFFSET, win.y + ControlsLayoutConstants.SUB_HEADER_Y_OFFSET + ControlsLayoutConstants.ALT_SUB_HEADER_Y_OFFSET);

        // Draw action list in 4-column layout
        this.drawControlsList(win, theme);

        // Draw DEFAULT and CLOSE buttons
        this.drawControlsButtons(win, theme);
    }

    drawControlsList(win, theme) {
        const ctx = this.ctx;
        const rowHeight = ControlsLayoutConstants.ROW_HEIGHT + ControlsLayoutConstants.ACTION_ROW_SPACING;
        const headerHeight = ControlsLayoutConstants.HEADER_HEIGHT;
        const listY = win.y + headerHeight;

        for (let i = 0; i < Math.min(win.maxVisibleActions, win.actions.length - win.scrollOffset); i++) {
            const actionIndex = i + win.scrollOffset;
            const action = win.actions[actionIndex];
            const rowY = listY + i * rowHeight;
            const nameRowY = listY + i * (ControlsLayoutConstants.ROW_HEIGHT + ControlsLayoutConstants.ACTION_NAME_ROW_SPACING);

            // Action name
            ctx.fillStyle = theme.ui.text;
            ctx.font = `${ControlsLayoutConstants.ACTION_NAME_FONT_SIZE}px Arial`;
            ctx.textAlign = "left";
            ctx.fillText(action.name, win.x + ControlsLayoutConstants.ACTION_NAME_X_OFFSET, nameRowY + ControlsLayoutConstants.ACTION_NAME_Y_OFFSET);

            // 4 columns of controls
            this.drawControlColumn(win.x + ControlsLayoutConstants.PRIMARY_KEYBOARD_X, rowY + ControlsLayoutConstants.PRIMARY_KEYBOARD_Y, ControlsLayoutConstants.PRIMARY_KEYBOARD_WIDTH, ControlsLayoutConstants.ROW_HEIGHT - ControlsLayoutConstants.COLUMN_HEIGHT_REDUCTION, action.keyboard?.primary, actionIndex === win.selectedActionIndex && win.selectedColumn === 0, theme);
            this.drawControlColumn(win.x + ControlsLayoutConstants.ALT_KEYBOARD_X, rowY + ControlsLayoutConstants.ALT_KEYBOARD_Y, ControlsLayoutConstants.ALT_KEYBOARD_WIDTH, ControlsLayoutConstants.ROW_HEIGHT - ControlsLayoutConstants.COLUMN_HEIGHT_REDUCTION, action.keyboard?.alt, actionIndex === win.selectedActionIndex && win.selectedColumn === 1, theme);
            this.drawControlColumn(win.x + ControlsLayoutConstants.PRIMARY_GAMEPAD_X, rowY + ControlsLayoutConstants.PRIMARY_GAMEPAD_Y, ControlsLayoutConstants.PRIMARY_GAMEPAD_WIDTH, ControlsLayoutConstants.ROW_HEIGHT - ControlsLayoutConstants.COLUMN_HEIGHT_REDUCTION, action.gamepad?.primary, actionIndex === win.selectedActionIndex && win.selectedColumn === 2, theme);
            this.drawControlColumn(win.x + ControlsLayoutConstants.ALT_GAMEPAD_X, rowY + ControlsLayoutConstants.ALT_GAMEPAD_Y, ControlsLayoutConstants.ALT_GAMEPAD_WIDTH, ControlsLayoutConstants.ROW_HEIGHT - ControlsLayoutConstants.COLUMN_HEIGHT_REDUCTION, action.gamepad?.alt || action.axis, actionIndex === win.selectedActionIndex && win.selectedColumn === 3, theme);
        }

        // Scroll indicators
        if (win.scrollOffset > 0) {
            ctx.fillStyle = theme.ui.accent;
            ctx.font = `${ControlsLayoutConstants.SCROLL_INDICATOR_FONT_SIZE}px Arial`;
            ctx.textAlign = "center";
            ctx.fillText("▲", win.x + ControlsLayoutConstants.SCROLL_INDICATOR_X_OFFSET, listY - ControlsLayoutConstants.SCROLL_UP_Y_OFFSET);
        }
        if (win.scrollOffset + win.maxVisibleActions < win.actions.length) {
            ctx.fillStyle = theme.ui.accent;
            ctx.font = `${ControlsLayoutConstants.SCROLL_INDICATOR_FONT_SIZE}px Arial`;
            ctx.textAlign = "center";
            ctx.fillText("▼", win.x + ControlsLayoutConstants.SCROLL_INDICATOR_X_OFFSET, listY + win.maxVisibleActions * rowHeight + ControlsLayoutConstants.SCROLL_DOWN_Y_OFFSET);
        }
    }

    drawControlColumn(x, y, width, height, control, isSelected, theme) {
        const ctx = this.ctx;

        // Border
        ctx.strokeStyle = isSelected ? ControlsLayoutConstants.SELECTED_BORDER_COLOR : theme.ui.border;
        ctx.lineWidth = isSelected ? ControlsLayoutConstants.SELECTED_BORDER_WIDTH : ControlsLayoutConstants.NORMAL_BORDER_WIDTH;
        ctx.strokeRect(x, y, width, height);

        // Background for selected
        if (isSelected) {
            ctx.fillStyle = `rgba(255, 255, 255, ${ControlsLayoutConstants.SELECTED_BACKGROUND_OPACITY})`;
            ctx.fillRect(x + 1, y + 1, width - 2, height - 2);
        }

        // Control text or visual
        ctx.fillStyle = isSelected ? ControlsLayoutConstants.SELECTED_TEXT_COLOR : theme.ui.text;
        ctx.font = isSelected ? `${ControlsLayoutConstants.SELECTED_FONT_WEIGHT} ${ControlsLayoutConstants.NORMAL_FONT_SIZE}px Arial` : `${ControlsLayoutConstants.NORMAL_FONT_SIZE}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Check if this is a gamepad face button for visual display
        if (control && typeof control === 'object' && control.type === 'button' && control.value >= 0 && control.value <= 3) {
            this.drawGamepadFaceButton(x + width / 2, y + height / 2, control.value, isSelected, theme, ControlsLayoutConstants.FACE_BUTTON_RADIUS);
        } else {
            // All other controls - keyboard keys, buttons, axis bindings
            const controlText = this.utils.getControlDisplayText(control);
            ctx.fillText(controlText, x + width / 2, y + height / 2);
        }
    }

    drawGamepadFaceButton(centerX, centerY, buttonIndex, isSelected, theme, radius) {
        const ctx = this.ctx;

        // Draw diamond shape for face buttons
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(Math.PI / 4); // 45 degree rotation for diamond

        // Fill diamond
        ctx.fillStyle = isSelected ? ControlsLayoutConstants.SELECTED_FILL_COLOR : ControlsLayoutConstants.BUTTON_COLORS[buttonIndex];
        ctx.beginPath();
        ctx.moveTo(0, -radius);
        ctx.lineTo(radius, 0);
        ctx.lineTo(0, radius);
        ctx.lineTo(-radius, 0);
        ctx.closePath();
        ctx.fill();

        // Border
        ctx.strokeStyle = isSelected ? ControlsLayoutConstants.SELECTED_BORDER_COLOR_BUTTON : ControlsLayoutConstants.NORMAL_BORDER_COLOR_BUTTON;
        ctx.lineWidth = isSelected ? ControlsLayoutConstants.SELECTED_BORDER_WIDTH_BUTTON : ControlsLayoutConstants.NORMAL_BORDER_WIDTH_BUTTON;
        ctx.stroke();

        ctx.restore();

        // Draw label on top
        ctx.fillStyle = isSelected ? ControlsLayoutConstants.SELECTED_LABEL_COLOR : ControlsLayoutConstants.NORMAL_LABEL_COLOR;
        ctx.font = isSelected ? `${ControlsLayoutConstants.LABEL_FONT_WEIGHT_SELECTED} ${ControlsLayoutConstants.LABEL_FONT_SIZE_SELECTED}px Arial` : `${ControlsLayoutConstants.LABEL_FONT_SIZE_NORMAL}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(ControlsLayoutConstants.BUTTON_LABELS[buttonIndex], centerX, centerY);
    }

    drawControlsButtons(win, theme) {
        const ctx = this.ctx;
        const buttonY = win.y + win.height - ControlsLayoutConstants.BUTTON_Y_OFFSET;

        // DEFAULT button
        const isDefaultSelected = win.navigatingButtons && win.selectedButtonIndex === 0;
        this.utils.drawWindowButton(win.x + ControlsLayoutConstants.DEFAULT_BUTTON_X_OFFSET, buttonY, ControlsLayoutConstants.DEFAULT_BUTTON_WIDTH, ControlsLayoutConstants.DEFAULT_BUTTON_HEIGHT, "RESET TO DEFAULTS", isDefaultSelected, ControlsLayoutConstants.BUTTON_DEPTH, theme);

        // CLOSE button
        const isCloseSelected = win.navigatingButtons && win.selectedButtonIndex === 1;
        this.utils.drawWindowButton(win.x + win.width - ControlsLayoutConstants.CLOSE_BUTTON_X_OFFSET, buttonY, ControlsLayoutConstants.CLOSE_BUTTON_WIDTH, ControlsLayoutConstants.CLOSE_BUTTON_HEIGHT, "CLOSE", isCloseSelected, ControlsLayoutConstants.BUTTON_DEPTH, theme);
    }
}
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

        // Check if this is a gamepad button for visual display (face buttons, shoulder buttons, or D-pad)
        if (control && typeof control === 'object' && control.type === 'button' &&
            ((control.value >= 0 && control.value <= 11) || (control.value >= 12 && control.value <= 15))) {
            this.drawGamepadFaceButton(x + width / 2, y + height / 2, control.value, isSelected, theme, ControlsLayoutConstants.FACE_BUTTON_SIZE);
        }
        // Handle axis controls (analog sticks)
        else if (control && typeof control === 'object' && control.type === 'axis') {
            const axisIndex = control.value.index + 16; // Convert axis index to our button index system
            this.drawStickAxis(x + width / 2, y + height / 2, axisIndex, isSelected, ControlsLayoutConstants.FACE_BUTTON_SIZE, control.value.direction);
        } else {
            // All other controls - keyboard keys, buttons, axis bindings
            const controlText = this.utils.getControlDisplayText(control);
            ctx.fillText(controlText, x + width / 2, y + height / 2);
        }
    }

    drawGamepadFaceButton(centerX, centerY, buttonIndex, isSelected, theme, size) {
        const ctx = this.ctx;

        if (buttonIndex >= 12 && buttonIndex <= 15) {
            // D-pad buttons (indices 12-15 for up, down, left, right)
            const dpadDirections = [12, 13, 14, 15]; // up, down, left, right
            const dpadIndex = dpadDirections.indexOf(buttonIndex);
            this.drawDPadButton(centerX, centerY, dpadIndex, isSelected, size);
        } else if (buttonIndex >= 4 && buttonIndex <= 7) {
            // Shoulder buttons L1, R1, L2, R2 (indices 4-7)
            this.drawShoulderButton(centerX, centerY, buttonIndex, isSelected, size);
        } else if (buttonIndex === 8 || buttonIndex === 9) {
            // Select (8) and Start (9) buttons
            this.drawSystemButton(centerX, centerY, buttonIndex, isSelected, size);
        } else if (buttonIndex === 10 || buttonIndex === 11) {
            // L3 (10) and R3 (11) buttons
            this.drawStickButton(centerX, centerY, buttonIndex, isSelected, size);
        } else if (buttonIndex >= 16) {
            // Axis controls (analog sticks LS/RS)
            this.drawStickAxis(centerX, centerY, buttonIndex, isSelected, size, 'positive'); // Default to positive for now
        } else {
            // Face buttons A, B, X, Y (indices 0-3)
            this.drawFaceButton(centerX, centerY, buttonIndex, isSelected, size);
        }
    }

    drawFaceButton(centerX, centerY, buttonIndex, isSelected, size) {
        const ctx = this.ctx;
        const radius = size / 5;
        const centerOffset = size / 3;

        ctx.save();

        // Draw 4 circles in diamond pattern - each button highlights a different circle
        const positions = [
            [0, -centerOffset],     // Top (north) - for Y button
            [-centerOffset, 0],     // Left (west) - for X button
            [centerOffset, 0],      // Right (east) - for B button
            [0, centerOffset]       // Bottom (south) - for A button
        ];

        // Determine which circle should be filled based on button index
        // Xbox layout: Y=top, X=left, B=right, A=bottom
        const filledIndex = [3, 2, 1, 0][buttonIndex]; // 0=A→bottom(3), 1=B→right(2), 2=X→left(1), 3=Y→top(0)

        positions.forEach((pos, index) => {
            const x = centerX + pos[0];
            const y = centerY + pos[1];

            if (index === filledIndex) {
                // This button's representative circle - filled white
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, 2 * Math.PI);
                ctx.fill();
            } else {
                // Other circles - just outlines, white
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, 2 * Math.PI);
                ctx.stroke();
            }
        });

        ctx.restore();
    }

    drawDPadButton(centerX, centerY, dpadIndex, isSelected, size) {
        const ctx = this.ctx;
        const crossSize = size / 2; // 50% bigger (was /3)
        const arrowSize = size / 6 * 0.7; // Size of directional arrows (30% smaller)

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 5.6; // 30% thinner (8 * 0.7 = 5.6)
        ctx.lineCap = 'butt'; // Square ends

        // Draw the full cross (plus sign) - same for all D-pad buttons
        // Horizontal line
        ctx.beginPath();
        ctx.moveTo(-crossSize, 0);
        ctx.lineTo(crossSize, 0);
        ctx.stroke();

        // Vertical line
        ctx.beginPath();
        ctx.moveTo(0, -crossSize);
        ctx.lineTo(0, crossSize);
        ctx.stroke();

        // Draw directional arrow at the tip based on dpadIndex (moved inward to overlay cross)
        ctx.fillStyle = 'black';
        const arrowOffset = crossSize - arrowSize/2 - 1; // Position arrow slightly closer to center (1px inward)

        // Arrow positions: 0=up, 1=down, 2=left, 3=right
        const arrowPositions = [
            [0, -arrowOffset],     // Up
            [0, arrowOffset],      // Down
            [-arrowOffset, 0],     // Left
            [arrowOffset, 0]       // Right
        ];

        const arrowRotations = [0, Math.PI, -Math.PI/2, Math.PI/2];
        const [arrowX, arrowY] = arrowPositions[dpadIndex];

        ctx.save();
        ctx.translate(arrowX, arrowY);
        ctx.rotate(arrowRotations[dpadIndex]);

        // Draw filled triangle arrow pointing in the correct direction
        ctx.beginPath();
        ctx.moveTo(0, -arrowSize);          // Top point (for up arrow)
        ctx.lineTo(-arrowSize, arrowSize);  // Bottom left
        ctx.lineTo(arrowSize, arrowSize);   // Bottom right
        ctx.closePath();
        ctx.fill();

        ctx.restore();
        ctx.restore();
    }

    drawShoulderButton(centerX, centerY, buttonIndex, isSelected, size) {
        const ctx = this.ctx;
        const humpWidth = size * 0.6 * 3 * 0.8; // 20% smaller than 3x
        const humpHeight = size * 0.4 * 3 * 0.8; // 20% smaller than 3x
        const textSize = size * 0.3 * 3 * 0.8; // 20% smaller than 3x

        ctx.save();
        ctx.translate(centerX, centerY);

        // Draw white rounded hump shape
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.roundRect(-humpWidth/2, -humpHeight/2, humpWidth, humpHeight, humpHeight/2);
        ctx.fill();

        // Draw black text label
        ctx.fillStyle = 'black';
        ctx.font = `bold ${textSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Button labels: L1=4, R1=5, L2=6, R2=7
        const labels = ['L1', 'R1', 'L2', 'R2'];
        ctx.fillText(labels[buttonIndex - 4], 0, 0);

        ctx.restore();
    }

    drawSystemButton(centerX, centerY, buttonIndex, isSelected, size) {
        const ctx = this.ctx;
        const rectWidth = size * 0.8 * 1.4 * 2; // 2x bigger overall
        const rectHeight = size * 0.5 * 2; // 2x bigger overall
        const cornerRadius = size * 0.2 * 2; // 2x bigger overall

        ctx.save();
        ctx.translate(centerX, centerY);

        // Draw white rounded rectangle background
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.roundRect(-rectWidth/2, -rectHeight/2, rectWidth, rectHeight, cornerRadius);
        ctx.fill();

        // Draw black text label
        ctx.fillStyle = 'black';
        ctx.font = `bold ${size * 0.25 * 2}px Arial`; // 2x bigger text
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Button labels: Select=8, Start=9
        const labels = ['SELECT', 'START'];
        ctx.fillText(labels[buttonIndex - 8], 0, 1);

        ctx.restore();
    }

    drawStickButton(centerX, centerY, buttonIndex, isSelected, size) {
        const ctx = this.ctx;
        const radius = size * 0.4 * 1.33; // 33% bigger

        ctx.save();
        ctx.translate(centerX, centerY);

        // Draw white circle
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, 2 * Math.PI);
        ctx.fill();

        // Draw black ring 2px in from edge
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, radius - 2, 0, 2 * Math.PI);
        ctx.stroke();

        // Draw black text label
        ctx.fillStyle = 'black';
        ctx.font = `bold ${size * 0.2 * 2.5}px Arial`; // 2.5x bigger
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Button labels: L3=10, R3=11
        const labels = ['L3', 'R3'];
        ctx.fillText(labels[buttonIndex - 10], 0, 0);

        ctx.restore();
    }

    drawStickAxis(centerX, centerY, axisIndex, isSelected, size, direction = 'positive') {
        const ctx = this.ctx;

        ctx.save();
        ctx.translate(centerX, centerY);

        // Draw white circle background
        const radius = size * 0.4 * 1.33; // Same size increase as L3/R3 (33%)
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, 2 * Math.PI);
        ctx.fill();

        // Draw black ring
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, radius - 2, 0, 2 * Math.PI);
        ctx.stroke();

        // No center dot for LS/RS - just the ring like L3/R3

        // Draw text label (larger like L3/R3: 2.5x)
        ctx.fillStyle = 'black';
        ctx.font = `bold ${size * 0.2 * 2.5}px Arial`; // Same as L3/R3
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Axis labels: LS (left stick), RS (right stick)
        // Axis 0 = LS Y-axis (up/down), Axis 1 = LS X-axis (left/right), Axis 2 = RS X-axis, Axis 3 = RS Y-axis
        const labels = ['LS', 'LS', 'RS', 'RS'];
        const axisNum = axisIndex - 16; // Convert to 0-based
        ctx.fillText(labels[axisNum] || 'LS', 0, 0);

        // Draw directional Unicode arrow to the right of the circle
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        let arrowSymbol = '';
        let fontSize = size * 0.8; // Default font size

        // Axis 0: LS-X (horizontal movement)
        if (axisNum === 0) {
            if (direction === 'negative') {
                arrowSymbol = '◀'; // Left arrow
            } else {
                arrowSymbol = '▶'; // Right arrow
            }
        }
        // Axis 1: LS-Y (vertical movement)
        else if (axisNum === 1) {
            fontSize = size * 1.0; // 2px larger for up/down arrows
            if (direction === 'negative') {
                arrowSymbol = '▲'; // Up arrow
            } else {
                arrowSymbol = '▼'; // Down arrow
            }
        }
        // Axis 2: RS-X (horizontal movement)
        else if (axisNum === 2) {
            if (direction === 'negative') {
                arrowSymbol = '◀'; // Left arrow
            } else {
                arrowSymbol = '▶'; // Right arrow
            }

        }
        // Axis 3: RS-Y (vertical movement)
        else if (axisNum === 3) {
            fontSize = size * 1.0; // 2px larger for up/down arrows
            if (direction === 'negative') {
                arrowSymbol = '▲'; // Up arrow
            } else {
                arrowSymbol = '▼'; // Down arrow
            }
        }

        ctx.font = `bold ${fontSize}px Arial`;
        ctx.fillText(arrowSymbol, radius + 8, 1); // Move down by 1px
        ctx.restore();
    }

    drawFallbackButton(centerX, centerY, buttonIndex, isSelected, size) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(Math.PI / 4); // 45 degree rotation for diamond

        const radius = ControlsLayoutConstants.FACE_BUTTON_RADIUS;
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
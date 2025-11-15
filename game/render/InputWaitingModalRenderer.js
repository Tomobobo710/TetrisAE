/**
 * InputWaitingModalRenderer - Handles input waiting modal rendering
 * Self-contained renderer for input waiting with countdown
 */
class InputWaitingModalRenderer {
    constructor(ctx, utils) {
        this.ctx = ctx;
        this.utils = new WindowRendererUtils(ctx, utils);
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
        ctx.fillStyle = this.utils.createModalBackgroundGradient(modalX, modalY, modalWidth, modalHeight, theme);
        ctx.fillRect(modalX, modalY, modalWidth, modalHeight);

        // Modal border with glow
        this.utils.drawModalBorder(modalX, modalY, modalWidth, modalHeight, theme);

        // Inner border
        this.utils.drawModalInnerBorder(modalX, modalY, modalWidth, modalHeight, theme);

        // Title bar
        const titleBarHeight = TITLE_BAR_HEIGHT;
        const titleGradient = this.utils.createModalTitleBarGradient(
            modalX + 3,
            modalY + 3,
            modalWidth - 6,
            titleBarHeight,
            theme
        );
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
        let promptText = `Press any ${modal.waitingForInputType}`;
        if (modal.waitingForInputType === 'gamepad') {
            promptText += " button or move an axis.";
        } else {
            promptText += " key."
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
        this.utils.roundRect(barX, barY, barWidth, barHeight, PROGRESS_BAR_CORNER_RADIUS);
        ctx.fill();

        // Progress bar fill
        const progress = modal.getProgress();
        ctx.fillStyle = progress > 0.3 ? "#00ff00" : "#ff0000";
        const fillWidth = barWidth * progress;
        if (fillWidth > PROGRESS_BAR_CORNER_RADIUS * 2) {
            this.utils.roundRect(barX, barY, fillWidth, barHeight, PROGRESS_BAR_CORNER_RADIUS);
            ctx.fill();
        }

        // Progress bar border
        ctx.strokeStyle = theme.ui.border;
        ctx.lineWidth = 1;
        this.utils.roundRect(barX, barY, barWidth, barHeight, PROGRESS_BAR_CORNER_RADIUS);
        ctx.stroke();
    }
}
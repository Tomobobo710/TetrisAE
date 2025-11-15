/**
 * ConfirmModalRenderer - Handles confirmation modal rendering
 * Self-contained renderer for confirmation dialogs
 */
class ConfirmModalRenderer {
    constructor(ctx, utils) {
        this.ctx = ctx;
        this.utils = new WindowRendererUtils(ctx, utils);
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
        ctx.fillStyle = this.utils.createModalBackgroundGradient(modalX, modalY, modalWidth, modalHeight, theme);
        ctx.fillRect(modalX, modalY, modalWidth, modalHeight);

        // Modal border with glow
        this.utils.drawModalBorder(modalX, modalY, modalWidth, modalHeight, theme);

        // Inner border
        this.utils.drawModalInnerBorder(modalX, modalY, modalWidth, modalHeight, theme);

        // Title bar
        const titleBarHeight = 40;
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
        this.utils.drawWindowButton(
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
        this.utils.drawWindowButton(
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
}
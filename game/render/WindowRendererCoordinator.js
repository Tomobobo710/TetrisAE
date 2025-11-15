/**
 * WindowRendererCoordinator - Coordinates window rendering
 * Lightweight coordinator that delegates to appropriate renderers
 */
class WindowRendererCoordinator {
    constructor(ctx, utils) {
        this.ctx = ctx;
        this.utils = utils;

        // Initialize renderers
        this.optionsRenderer = new OptionsWindowRenderer(ctx, utils);
        this.themesRenderer = new ThemesWindowRenderer(ctx, utils);
        this.controlsRenderer = new ControlsWindowRenderer(ctx, utils);
        this.confirmModalRenderer = new ConfirmModalRenderer(ctx, utils);
        this.inputWaitingModalRenderer = new InputWaitingModalRenderer(ctx, utils);
    }

    /**
     * Draw options window
     */
    drawOptionsWindow(game, theme) {
        this.optionsRenderer.drawOptionsWindow(game, theme);
    }

    /**
     * Draw themes window
     */
    drawThemesWindow(game, theme) {
        this.themesRenderer.drawThemesWindow(game, theme);
    }

    /**
     * Draw controls window
     */
    drawControlsWindow(game, theme) {
        this.controlsRenderer.drawControlsWindow(game, theme);

        // Draw modals on top if active
        if (game.confirmModal && game.confirmModal.isVisible) {
            this.confirmModalRenderer.drawConfirmModal(game.confirmModal, game.controlsWindow, theme);
        }

        if (game.inputWaitingModal && game.inputWaitingModal.isActive) {
            this.inputWaitingModalRenderer.drawInputWaitingModal(game.inputWaitingModal, game.controlsWindow, theme);
        }
    }
}
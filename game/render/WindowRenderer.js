/**
 * WindowRenderer - Main renderer that delegates to coordinator
 * Backwards compatible interface for existing code
 */
class WindowRenderer {
    constructor(ctx, utils) {
        this.ctx = ctx;
        this.utils = utils;
        this.coordinator = new WindowRendererCoordinator(ctx, utils);
    }

    /**
     * Draw options window
     */
    drawOptionsWindow(game, theme) {
        this.coordinator.drawOptionsWindow(game, theme);
    }

    /**
     * Draw themes window
     */
    drawThemesWindow(game, theme) {
        this.coordinator.drawThemesWindow(game, theme);
    }

    /**
     * Draw controls window
     */
    drawControlsWindow(game, theme) {
        this.coordinator.drawControlsWindow(game, theme);
    }
}

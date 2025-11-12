/**
 * UIRenderer - Main coordinator for all UI rendering
 */
class UIRenderer {
    constructor(ctx) {
        this.ctx = ctx;

        // Initialize utilities and specialized renderers
        this.utils = new UIRenderUtils(ctx);
        this.menuRenderer = new MenuRenderer(ctx, this.utils);
        this.gameUIRenderer = new GameUIRenderer(ctx, this.utils);
        this.overlayRenderer = new OverlayRenderer(ctx, this.utils);
        this.windowRenderer = new WindowRenderer(ctx, this.utils);
    }

    /**
     * Draw complete GUI layer - main entry point
     */
    drawGUILayer(game, theme) {
        this.ctx.clearRect(0, 0, TETRIS.WIDTH, TETRIS.HEIGHT);

        if (game.gameState === "title") {
            this.menuRenderer.drawTitleScreen(game, theme);

            // Keep settings menu available on title when selected (original behavior)
            if (game.menuStack.current === "settings" && !game.optionsWindow.visible && !game.themesWindow.visible) {
                this.menuRenderer.drawSettingsMenu(game, theme);
            }
        } else {
            // In-game HUD (hold/next/score etc.)
            this.gameUIRenderer.drawGameUI(game, theme);

            // Player overlays (LEVEL UP / KNOCKED OUT) above HUD but below modal menus
            this.overlayRenderer.drawPlayerOverlayTexts(game, theme);

            // Modal/flow-control overlays on top of everything else
            if (game.gameState === "paused" || game.gameState === "onlineMultiplayerPaused") {
                this.menuRenderer.drawPauseMenu(game, theme);
            }

            if (game.gameState === "gameOver") {
                this.menuRenderer.drawGameOverOverlay(game, theme);
            }

            if (game.gameState === "opponentDisconnected") {
                this.menuRenderer.drawOpponentDisconnectedMenu(game, theme);
            }

            if (game.gameState === "roomShutDown") {
                this.menuRenderer.drawRoomShutDownMenu(game, theme);
            }

            if (game.gameState === "rematchPending") {
                this.menuRenderer.drawRematchPendingMenu(game, theme);
            }

            if (game.gameState === "waitingMenu") {
                this.menuRenderer.drawWaitingMenu(game, theme);
            }

            if (game.gameState === "waitingCanceledMenu") {
                this.menuRenderer.drawWaitingCanceledMenu(game, theme);
            }

            if (game.gameState === "waitingForHostMenu") {
                this.menuRenderer.drawWaitingForHostMenu(game, theme);
            }

            // Draw countdown overlay if active (shared for offline/online)
            if (game.countdown && game.countdown.active) {
                this.overlayRenderer.drawCountdownOverlay(game, theme);
            }

            // Settings menu as its own modal when in-game and current === settings
            if (game.menuStack.current === "settings" && !game.optionsWindow.visible && !game.themesWindow.visible) {
                this.menuRenderer.drawSettingsMenu(game, theme);
            }
        }

        // Draw windows on top of everything (both title and in-game)
        if (game.optionsWindow.visible) {
            this.windowRenderer.drawOptionsWindow(game, theme);
        }

        if (game.themesWindow.visible) {
            this.windowRenderer.drawThemesWindow(game, theme);
        }

        // Theme button always on top of GUI
        this.utils.drawThemeButton(game.inputHandler.themeButton, theme);
    }
}

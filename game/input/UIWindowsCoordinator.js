/**
 * UIWindowsCoordinator - Lightweight coordinator for window managers
 * Delegates input handling to the appropriate self-contained window manager
 */
class UIWindowsCoordinator {
    constructor(game, input) {
        this.game = game;
        this.input = input;

        // Create window managers - each handles one window type completely
        this.optionsManager = new OptionsWindowManager(game, input);
        this.themesManager = new ThemesWindowManager(game, input);
        this.controlsManager = new ControlsWindowManager(game, input);
    }

    /**
     * Handle input by delegating to the appropriate window manager
     */
    handleInput() {
        if (this.game.optionsWindow.visible) {
            this.optionsManager.handleInput();
        } else if (this.game.themesWindow.visible) {
            this.themesManager.handleInput();
        } else if (this.game.controlsWindow.visible) {
            this.controlsManager.handleInput();
        }
    }

    /**
     * Register elements for the currently visible window
     */
    registerElements() {
        if (this.game.optionsWindow.visible) {
            this.optionsManager.registerElements();
        } else if (this.game.themesWindow.visible) {
            this.themesManager.registerElements();
        } else if (this.game.controlsWindow.visible) {
            this.controlsManager.registerElements();
        }
    }

    /**
     * Unregister elements for the currently visible window
     */
    unregisterElements() {
        if (this.game.optionsWindow.visible) {
            this.optionsManager.unregisterElements();
        } else if (this.game.themesWindow.visible) {
            this.themesManager.unregisterElements();
        } else if (this.game.controlsWindow.visible) {
            this.controlsManager.unregisterElements();
        }
    }
}
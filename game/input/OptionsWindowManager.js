/**
 * OptionsWindowManager - Self-contained options window manager
 * Handles all input and element management for the options/settings window
 */
class OptionsWindowManager {
    constructor(game, input) {
        this.game = game;
        this.input = input;
    }

    /**
     * Handle options window input
     */
    handleInput() {
        const win = this.game.optionsWindow;
        const maxIndex = win.settings.length; // +1 for back button

        // Check for mouse clicks on toggles/cycles
        for (let i = 0; i < win.settings.length; i++) {
            if (this.input.isElementJustPressed(`options_toggle_${i}`)) {
                this.game.toggleSetting(win.settings[i].key);
                win.selectedIndex = i; // Update selection to clicked item
                return; // Actually exits the function
            }
        }

        // Check for mouse click on back button
        if (this.input.isElementJustPressed("options_back_button")) {
            this.close();
            return;
        }

        // Update selected index based on hover
        if (this.input.isElementHovered("options_back_button")) {
            if (win.selectedIndex !== win.settings.length) {
                win.selectedIndex = win.settings.length;
                this.game.playSound("menu_navigate");
            }
        } else {
            for (let i = 0; i < win.settings.length; i++) {
                if (this.input.isElementHovered(`options_toggle_${i}`)) {
                    if (win.selectedIndex !== i) {
                        win.selectedIndex = i;
                        this.game.playSound("menu_navigate");
                    }
                    return; // Found hover, exit early
                }
            }
        }

        // Multi-device navigation - use existing API directly
        if (
            this.input.isKeyJustPressed("DirUp") ||
            this.input.isGamepadButtonJustPressed(12, 0) || // D-pad up on gamepad 0
            this.input.isGamepadButtonJustPressed(12, 1) || // D-pad up on gamepad 1
            this.input.isGamepadButtonJustPressed(12, 2) || // D-pad up on gamepad 2
            this.input.isGamepadButtonJustPressed(12, 3)
        ) {
            // D-pad up on gamepad 3
            win.selectedIndex = Math.max(0, win.selectedIndex - 1);
            this.game.playSound("menu_navigate");
        }

        if (
            this.input.isKeyJustPressed("DirDown") ||
            this.input.isGamepadButtonJustPressed(13, 0) || // D-pad down on gamepad 0
            this.input.isGamepadButtonJustPressed(13, 1) || // D-pad down on gamepad 1
            this.input.isGamepadButtonJustPressed(13, 2) || // D-pad down on gamepad 2
            this.input.isGamepadButtonJustPressed(13, 3)
        ) {
            // D-pad down on gamepad 3
            win.selectedIndex = Math.min(maxIndex, win.selectedIndex + 1);
            this.game.playSound("menu_navigate");
        }

        // Action2 for back (B/Circle button = secondary face button)
        if (
            this.input.isKeyJustPressed("Action2") ||
            this.input.isGamepadButtonJustPressed(1, 0) || // B/Circle button on gamepad 0
            this.input.isGamepadButtonJustPressed(1, 1) || // B/Circle button on gamepad 1
            this.input.isGamepadButtonJustPressed(1, 2) || // B/Circle button on gamepad 2
            this.input.isGamepadButtonJustPressed(1, 3)
        ) {
            // B/Circle button on gamepad 3
            this.close();
            return;
        }

        // Action1 to toggle or go back (A/Cross button = primary face button)
        if (
            this.input.isKeyJustPressed("Action1") ||
            this.input.isGamepadButtonJustPressed(0, 0) || // A/Cross button on gamepad 0
            this.input.isGamepadButtonJustPressed(0, 1) || // A/Cross button on gamepad 1
            this.input.isGamepadButtonJustPressed(0, 2) || // A/Cross button on gamepad 2
            this.input.isGamepadButtonJustPressed(0, 3)
        ) {
            // A/Cross button on gamepad 3
            if (win.selectedIndex < win.settings.length) {
                // Toggle or cycle setting
                const setting = win.settings[win.selectedIndex];
                this.game.toggleSetting(setting.key);
            } else {
                // Back button
                this.close();
            }
        }
    }

    /**
     * Close options window and cleanup
     */
    close() {
        this.unregisterElements();
        this.game.optionsWindow.visible = false;
        this.game.optionsWindow.selectedIndex = 0; // Reset to top option
        this.game.menuStack.current = "settings";
        // Re-register settings menu buttons
        this.game.settingsMenu.buttonsRegistered = false;
        this.game.settingsMenu.selectedIndex = 0; // Reset to top option
        this.game.playSound("menu_back");
    }

    /**
     * Register options window elements
     */
    registerElements() {
        const win = this.game.optionsWindow;
        const windowWidth = 500;
        const windowHeight = 350;
        const windowX = (TETRIS.WIDTH - windowWidth) / 2;
        const windowY = (TETRIS.HEIGHT - windowHeight) / 2;

        const settingY = windowY + 80;
        const settingSpacing = 60;

        // Register toggle buttons
        win.settings.forEach((setting, index) => {
            const y = settingY + index * settingSpacing;
            const toggleX = windowX + windowWidth - 120;
            const toggleWidth = 80;
            const toggleHeight = 35;
            const toggleY = y - 18;

            this.input.registerElement(`options_toggle_${index}`, {
                bounds: () => ({
                    x: toggleX,
                    y: toggleY,
                    width: toggleWidth,
                    height: toggleHeight
                })
            });
        });

        // Register back button
        const backButtonY = windowY + windowHeight - 70;
        const backButtonWidth = 120;
        const backButtonHeight = 40;
        const backButtonX = windowX + (windowWidth - backButtonWidth) / 2;

        this.input.registerElement("options_back_button", {
            bounds: () => ({
                x: backButtonX,
                y: backButtonY,
                width: backButtonWidth,
                height: backButtonHeight
            })
        });
    }

    /**
     * Unregister options window elements
     */
    unregisterElements() {
        const win = this.game.optionsWindow;

        // Unregister toggle buttons
        win.settings.forEach((setting, index) => {
            this.input.removeElement(`options_toggle_${index}`);
        });

        // Unregister back button
        this.input.removeElement("options_back_button");
    }
}
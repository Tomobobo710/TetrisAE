/**
 * ControlsWindowManager - Self-contained controls window manager
 * Handles all input and element management for the controls remapping window
 */
class ControlsWindowManager {
    constructor(game, input) {
        this.game = game;
        this.input = input;

        // Modal components are self-managing and attach themselves to game
        new InputWaitingModal(game, input);
        new ConfirmModal(game, input);
    }

    /**
     * Handle controls window input
     */
    handleInput() {
        const win = this.game.controlsWindow;

        // Handle modal inputs first - they manage their own priority
        if (this.game.confirmModal?.handleInput()) {
            return; // Modal handled input
        }

        if (this.game.inputWaitingModal?.isActive) {
            this.game.inputWaitingModal.update();
            return; // Modal is active
        }

        // Handle mouse clicks on action rows
        for (let i = 0; i < Math.min(win.maxVisibleActions, win.actions.length - win.scrollOffset); i++) {
            const actionIndex = i + win.scrollOffset;

            // Check all 4 column clicks
            if (this.input.isElementJustPressed(`controls_action_${actionIndex}_kb_primary`)) {
                this.startWaitingForInput(actionIndex, 'keyboard', 'primary');
                return;
            }
            if (this.input.isElementJustPressed(`controls_action_${actionIndex}_kb_alt`)) {
                this.startWaitingForInput(actionIndex, 'keyboard', 'alt');
                return;
            }
            if (this.input.isElementJustPressed(`controls_action_${actionIndex}_gp_primary`)) {
                this.startWaitingForInput(actionIndex, 'gamepad', 'primary');
                return;
            }
            if (this.input.isElementJustPressed(`controls_action_${actionIndex}_gp_alt`)) {
                this.startWaitingForInput(actionIndex, 'gamepad', 'alt');
                return;
            }

            // Update selection on hover for all 4 columns - switch to action navigation mode
            if (this.input.isElementHovered(`controls_action_${actionIndex}_kb_primary`)) {
                if (win.selectedActionIndex !== actionIndex || win.selectedColumn !== 0 || win.navigatingButtons) {
                    win.selectedActionIndex = actionIndex;
                    win.selectedColumn = 0;
                    win.navigatingButtons = false; // Switch to action navigation
                    this.game.playSound('menu_navigate');
                }
            } else if (this.input.isElementHovered(`controls_action_${actionIndex}_kb_alt`)) {
                if (win.selectedActionIndex !== actionIndex || win.selectedColumn !== 1 || win.navigatingButtons) {
                    win.selectedActionIndex = actionIndex;
                    win.selectedColumn = 1;
                    win.navigatingButtons = false; // Switch to action navigation
                    this.game.playSound('menu_navigate');
                }
            } else if (this.input.isElementHovered(`controls_action_${actionIndex}_gp_primary`)) {
                if (win.selectedActionIndex !== actionIndex || win.selectedColumn !== 2 || win.navigatingButtons) {
                    win.selectedActionIndex = actionIndex;
                    win.selectedColumn = 2;
                    win.navigatingButtons = false; // Switch to action navigation
                    this.game.playSound('menu_navigate');
                }
            } else if (this.input.isElementHovered(`controls_action_${actionIndex}_gp_alt`)) {
                if (win.selectedActionIndex !== actionIndex || win.selectedColumn !== 3 || win.navigatingButtons) {
                    win.selectedActionIndex = actionIndex;
                    win.selectedColumn = 3;
                    win.navigatingButtons = false; // Switch to action navigation
                    this.game.playSound('menu_navigate');
                }
            }
        }

        // Handle DEFAULT button click
        if (this.input.isElementJustPressed('controls_default_button')) {
            win.navigatingButtons = true; // Ensure we're in button navigation mode
            win.selectedButtonIndex = 0; // Select DEFAULT
            this.game.playSound('menu_confirm'); // Play confirmation sound when clicking DEFAULT
            // Handle reset confirmation through the modal component
            this.game.confirmModal.show(
                "Reset Controls",
                "Reset all controls to defaults? This cannot be undone.",
                () => {
                    // YES callback
                    this.game.customControls.resetToDefaults();
                    this.refreshWindowData();
                    this.game.playSound('menu_confirm');
                },
                () => {
                    // NO callback - do nothing
                }
            );
            return;
        }

        // Handle CLOSE button click
        if (this.input.isElementJustPressed('controls_close_button')) {
            win.navigatingButtons = true; // Ensure we're in button navigation mode
            win.selectedButtonIndex = 1; // Select CLOSE
            this.close();
            return;
        }

        // Handle DEFAULT button hover - switch to button navigation mode
        if (this.input.isElementHovered('controls_default_button')) {
            if (!win.navigatingButtons || win.selectedButtonIndex !== 0) {
                win.navigatingButtons = true;
                win.selectedButtonIndex = 0;
                win.selectedActionIndex = -1; // Clear action selection
                win.selectedColumn = -1;
                this.game.playSound('menu_navigate');
            }
        }

        // Handle CLOSE button hover - switch to button navigation mode
        if (this.input.isElementHovered('controls_close_button')) {
            if (!win.navigatingButtons || win.selectedButtonIndex !== 1) {
                win.navigatingButtons = true;
                win.selectedButtonIndex = 1;
                win.selectedActionIndex = -1; // Clear action selection
                win.selectedColumn = -1;
                this.game.playSound('menu_navigate');
            }
        }

        // Keyboard navigation
        this.handleKeyboardNavigation();
    }

    handleKeyboardNavigation() {
        const win = this.game.controlsWindow;

        // Multi-device navigation - use existing API directly (same as options/themes)
        if (
            this.input.isKeyJustPressed("DirUp") ||
            this.input.isGamepadButtonJustPressed(12, 0) || // D-pad up on gamepad 0
            this.input.isGamepadButtonJustPressed(12, 1) || // D-pad up on gamepad 1
            this.input.isGamepadButtonJustPressed(12, 2) || // D-pad up on gamepad 2
            this.input.isGamepadButtonJustPressed(12, 3)
        ) {
            // D-pad up on gamepad 3
            if (win.navigatingButtons) {
                // If navigating buttons, go back to last action in column-aware position
                win.navigatingButtons = false;
                win.selectedActionIndex = win.actions.length - 1;
                // DEFAULT button (0) -> keyboard primary (0), CLOSE button (1) -> gamepad alt (3)
                win.selectedColumn = win.selectedButtonIndex === 0 ? 0 : 3;
                this.updateScrollOffset();
            } else if (win.selectedActionIndex <= 0) {
                // At first action, switch to button navigation based on column
                win.navigatingButtons = true;
                // Keyboard columns (0,1) -> DEFAULT button (0), Gamepad columns (2,3) -> CLOSE button (1)
                win.selectedButtonIndex = win.selectedColumn < 2 ? 0 : 1;
                // Clear action selection when navigating to buttons
                win.selectedActionIndex = -1;
                win.selectedColumn = -1;
            } else {
                win.selectedActionIndex = Math.max(0, win.selectedActionIndex - 1);
                this.updateScrollOffset();
            }
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
            if (win.navigatingButtons) {
                // Already on buttons, do nothing
                return;
            } else if (win.selectedActionIndex >= win.actions.length - 1) {
                // At last action, switch to button navigation based on current column
                win.navigatingButtons = true;
                // Keyboard columns (0,1) -> DEFAULT button (0), Gamepad columns (2,3) -> CLOSE button (1)
                win.selectedButtonIndex = win.selectedColumn < 2 ? 0 : 1;
                // Clear action selection when navigating to buttons
                win.selectedActionIndex = -1;
                win.selectedColumn = -1;
            } else {
                win.selectedActionIndex = Math.min(win.actions.length - 1, win.selectedActionIndex + 1);
                this.updateScrollOffset();
            }
            this.game.playSound("menu_navigate");
        }

        if (
            this.input.isKeyJustPressed("DirLeft") ||
            this.input.isGamepadButtonJustPressed(14, 0) || // D-pad left on gamepad 0
            this.input.isGamepadButtonJustPressed(14, 1) || // D-pad left on gamepad 1
            this.input.isGamepadButtonJustPressed(14, 2) || // D-pad left on gamepad 2
            this.input.isGamepadButtonJustPressed(14, 3)
        ) {
            // D-pad left on gamepad 3
            if (win.navigatingButtons) {
                win.selectedButtonIndex = Math.max(0, win.selectedButtonIndex - 1);
            } else {
                win.selectedColumn = Math.max(0, win.selectedColumn - 1);
            }
            this.game.playSound("menu_navigate");
        }

        if (
            this.input.isKeyJustPressed("DirRight") ||
            this.input.isGamepadButtonJustPressed(15, 0) || // D-pad right on gamepad 0
            this.input.isGamepadButtonJustPressed(15, 1) || // D-pad right on gamepad 1
            this.input.isGamepadButtonJustPressed(15, 2) || // D-pad right on gamepad 2
            this.input.isGamepadButtonJustPressed(15, 3)
        ) {
            // D-pad right on gamepad 3
            if (win.navigatingButtons) {
                win.selectedButtonIndex = Math.min(1, win.selectedButtonIndex + 1);
            } else {
                win.selectedColumn = Math.min(3, win.selectedColumn + 1);
            }
            this.game.playSound("menu_navigate");
        }

        // Action2 for back (B/Circle button = secondary face button) - consistent with other modals
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

        // Action1 to activate selection (A/Cross button = primary face button) - consistent with other modals
        if (
            this.input.isKeyJustPressed("Action1") ||
            this.input.isGamepadButtonJustPressed(0, 0) || // A/Cross button on gamepad 0
            this.input.isGamepadButtonJustPressed(0, 1) || // A/Cross button on gamepad 1
            this.input.isGamepadButtonJustPressed(0, 2) || // A/Cross button on gamepad 2
            this.input.isGamepadButtonJustPressed(0, 3)
        ) {
            // A/Cross button on gamepad 3
            if (win.navigatingButtons) {
                // Activate button
                if (win.selectedButtonIndex === 0) {
                    // Handle reset confirmation through the modal component
                    this.game.confirmModal.show(
                        "Reset Controls",
                        "Reset all controls to defaults? This cannot be undone.",
                        () => {
                            // YES callback
                            this.game.customControls.resetToDefaults();
                            this.refreshWindowData();
                            this.game.playSound('menu_confirm');
                        },
                        () => {
                            // NO callback - do nothing
                        }
                    );
                } else {
                    this.close();
                }
            } else {
                // Start remapping control
                const inputType = win.selectedColumn < 2 ? 'keyboard' : 'gamepad';
                const column = win.selectedColumn % 2 === 0 ? 'primary' : 'alt';
                this.startWaitingForInput(win.selectedActionIndex, inputType, column);
            }
        }
    }

    updateScrollOffset() {
        const win = this.game.controlsWindow;
        if (win.selectedActionIndex < win.scrollOffset) {
            win.scrollOffset = win.selectedActionIndex;
        } else if (win.selectedActionIndex >= win.scrollOffset + win.maxVisibleActions) {
            win.scrollOffset = win.selectedActionIndex - win.maxVisibleActions + 1;
        }
    }

    startWaitingForInput(actionIndex, inputType, column) {
        const win = this.game.controlsWindow;
        const actionId = win.actions[actionIndex].id;

        this.game.inputWaitingModal.startWaiting(
            actionId,
            inputType,
            column,
            (inputData) => {
                // Input received callback
                if (inputData.type === 'keyboard') {
                    this.game.customControls.getControlsManager().setKeyboardControl(actionId, inputData.value, column);
                } else if (inputData.type === 'gamepad') {
                    this.game.customControls.getControlsManager().setGamepadControl(actionId, inputData.value, column);
                } else if (inputData.type === 'axis') {
                    this.game.customControls.getControlsManager().setAxisControl(actionId, inputData.axis, inputData.direction, column);
                }
                this.refreshWindowData();
                this.game.playSound('menu_confirm');
            },
            () => {
                // Timeout callback - do nothing, just cancel
            }
        );

        // Populate the actions list with current control data from the manager
        this.refreshWindowData();
    }

    refreshWindowData() {
        const win = this.game.controlsWindow;
        const controlsManager = this.game.customControls.getControlsManager();

        // Update each action with current control data
        win.actions.forEach(action => {
            const controls = controlsManager.getControls(action.id);

            action.keyboard = {
                primary: controls.keyboard.primary || null,
                alt: controls.keyboard.alt || null
            };

            // For gamepad controls, show the binding in each slot
            action.gamepad = {
                primary: controls.gamepad.primary || null,
                alt: controls.gamepad.alt || null
            };
        });
    }

    /**
     * Close controls window and cleanup
     */
    close() {
        this.unregisterElements();
        this.game.controlsWindow.visible = false;
        // Reset all navigation state to default position (top-left action selection)
        this.game.controlsWindow.selectedActionIndex = 0; // First action
        this.game.controlsWindow.selectedColumn = 0; // Keyboard primary column
        this.game.controlsWindow.navigatingButtons = false; // Not in button mode
        this.game.controlsWindow.selectedButtonIndex = 0; // DEFAULT button if in button mode
        this.game.controlsWindow.scrollOffset = 0; // Reset scroll to top
        this.game.menuStack.current = "settings";
        // Re-register settings menu buttons
        this.game.settingsMenu.buttonsRegistered = false;
        this.game.settingsMenu.selectedIndex = 0; // Reset to top option
        this.game.playSound("menu_back");
    }

    /**
     * Register controls window elements
     */
    registerElements() {
        const win = this.game.controlsWindow;

        // Update window dimensions and position from constants
        win.width = ControlsLayoutConstants.WINDOW_WIDTH;
        win.height = ControlsLayoutConstants.WINDOW_HEIGHT;
        win.x = ControlsLayoutConstants.WINDOW_X;
        win.y = ControlsLayoutConstants.WINDOW_Y;

        const rowHeight = ControlsLayoutConstants.ROW_HEIGHT + ControlsLayoutConstants.ACTION_ROW_SPACING;
        const headerHeight = ControlsLayoutConstants.HEADER_HEIGHT;
        const listY = win.y + headerHeight;

        // Refresh the data to ensure we have current controls
        this.refreshWindowData();

        // Register action rows - 4 columns
        for (let i = 0; i < Math.min(win.maxVisibleActions, win.actions.length); i++) {
            const actionIndex = i + win.scrollOffset;
            const rowY = listY + i * rowHeight;

            // Keyboard primary
            this.input.registerElement(`controls_action_${actionIndex}_kb_primary`, {
                bounds: () => ({
                    x: win.x + ControlsLayoutConstants.PRIMARY_KEYBOARD_X,
                    y: rowY + ControlsLayoutConstants.PRIMARY_KEYBOARD_Y,
                    width: ControlsLayoutConstants.PRIMARY_KEYBOARD_WIDTH,
                    height: ControlsLayoutConstants.ROW_HEIGHT - ControlsLayoutConstants.COLUMN_HEIGHT_REDUCTION
                })
            });

            // Keyboard alt
            this.input.registerElement(`controls_action_${actionIndex}_kb_alt`, {
                bounds: () => ({
                    x: win.x + ControlsLayoutConstants.ALT_KEYBOARD_X,
                    y: rowY + ControlsLayoutConstants.ALT_KEYBOARD_Y,
                    width: ControlsLayoutConstants.ALT_KEYBOARD_WIDTH,
                    height: ControlsLayoutConstants.ROW_HEIGHT - ControlsLayoutConstants.COLUMN_HEIGHT_REDUCTION
                })
            });

            // Gamepad primary
            this.input.registerElement(`controls_action_${actionIndex}_gp_primary`, {
                bounds: () => ({
                    x: win.x + ControlsLayoutConstants.PRIMARY_GAMEPAD_X,
                    y: rowY + ControlsLayoutConstants.PRIMARY_GAMEPAD_Y,
                    width: ControlsLayoutConstants.PRIMARY_GAMEPAD_WIDTH,
                    height: ControlsLayoutConstants.ROW_HEIGHT - ControlsLayoutConstants.COLUMN_HEIGHT_REDUCTION
                })
            });

            // Gamepad alt
            this.input.registerElement(`controls_action_${actionIndex}_gp_alt`, {
                bounds: () => ({
                    x: win.x + ControlsLayoutConstants.ALT_GAMEPAD_X,
                    y: rowY + ControlsLayoutConstants.ALT_GAMEPAD_Y,
                    width: ControlsLayoutConstants.ALT_GAMEPAD_WIDTH,
                    height: ControlsLayoutConstants.ROW_HEIGHT - ControlsLayoutConstants.COLUMN_HEIGHT_REDUCTION
                })
            });
        }

        // Register buttons
        const buttonY = win.y + win.height - ControlsLayoutConstants.BUTTON_Y_OFFSET;
        this.input.registerElement('controls_default_button', {
            bounds: () => ({
                x: win.x + ControlsLayoutConstants.DEFAULT_BUTTON_X_OFFSET,
                y: buttonY,
                width: ControlsLayoutConstants.DEFAULT_BUTTON_WIDTH,
                height: ControlsLayoutConstants.DEFAULT_BUTTON_HEIGHT
            })
        });

        this.input.registerElement('controls_close_button', {
            bounds: () => ({
                x: win.x + win.width - ControlsLayoutConstants.CLOSE_BUTTON_X_OFFSET,
                y: buttonY,
                width: ControlsLayoutConstants.CLOSE_BUTTON_WIDTH,
                height: ControlsLayoutConstants.CLOSE_BUTTON_HEIGHT
            })
        });

        // Confirm modal elements are handled by the ConfirmModal component itself
    }

    /**
     * Unregister controls window elements
     */
    unregisterElements() {
        const win = this.game.controlsWindow;

        // Unregister action rows - 4 columns
        for (let i = 0; i < win.actions.length; i++) {
            this.input.removeElement(`controls_action_${i}_kb_primary`);
            this.input.removeElement(`controls_action_${i}_kb_alt`);
            this.input.removeElement(`controls_action_${i}_gp_primary`);
            this.input.removeElement(`controls_action_${i}_gp_alt`);
        }

        // Unregister buttons
        this.input.removeElement('controls_default_button');
        this.input.removeElement('controls_close_button');

        // Confirm modal elements are handled by the ConfirmModal component itself
    }
}
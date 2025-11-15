/**
 * ConfirmModal - Handles confirmation dialogs with yes/no buttons
 * Self-contained component that manages its own input and rendering
 */
class ConfirmModal {
    constructor(game, input) {
        this.game = game;
        this.input = input;
        this.isVisible = false;
        this.title = "";
        this.message = "";
        this.selectedButton = 1; // Default to NO (safer)
        this.onConfirm = null; // Callback for YES
        this.onCancel = null; // Callback for NO

        // Attach to game for rendering access
        game.confirmModal = this;
    }

    /**
     * Show the confirm modal
     */
    show(title, message, onConfirm, onCancel) {
        this.isVisible = true;
        this.title = title;
        this.message = message;
        this.onConfirm = onConfirm;
        this.onCancel = onCancel;
        this.selectedButton = 1; // Default to NO button
        this.registerElements();
    }

    /**
     * Hide the confirm modal
     */
    hide() {
        this.isVisible = false;
        this.title = "";
        this.message = "";
        this.onConfirm = null;
        this.onCancel = null;
        this.selectedButton = 1;
        this.unregisterElements();
    }

    /**
     * Handle input for the modal
     */
    handleInput() {
        if (!this.isVisible) return false; // Return false if input not handled

        // Handle mouse clicks first
        if (this.input.isElementJustPressed('confirm_yes_button')) {
            if (this.onConfirm) this.onConfirm();
            this.game.playSound('menu_confirm');
            this.hide();
            return true;
        } else if (this.input.isElementJustPressed('confirm_no_button')) {
            if (this.onCancel) this.onCancel();
            this.game.playSound('menu_back');
            this.hide();
            return true;
        }

        // Handle hover selection for visual feedback
        if (this.input.isElementHovered('confirm_yes_button')) {
            if (this.selectedButton !== 0) {
                this.selectedButton = 0;
                this.game.playSound("menu_navigate");
            }
        } else if (this.input.isElementHovered('confirm_no_button')) {
            if (this.selectedButton !== 1) {
                this.selectedButton = 1;
                this.game.playSound("menu_navigate");
            }
        }

        // Left/Right navigation between YES and NO buttons
        if (
            this.input.isKeyJustPressed("DirLeft") ||
            this.input.isGamepadButtonJustPressed(14, 0) || // D-pad left on gamepad 0
            this.input.isGamepadButtonJustPressed(14, 1) || // D-pad left on gamepad 1
            this.input.isGamepadButtonJustPressed(14, 2) || // D-pad left on gamepad 2
            this.input.isGamepadButtonJustPressed(14, 3)
        ) {
            // Move to YES button (left)
            if (this.selectedButton !== 0) {
                this.selectedButton = 0;
                this.game.playSound("menu_navigate");
            }
        } else if (
            this.input.isKeyJustPressed("DirRight") ||
            this.input.isGamepadButtonJustPressed(15, 0) || // D-pad right on gamepad 0
            this.input.isGamepadButtonJustPressed(15, 1) || // D-pad right on gamepad 1
            this.input.isGamepadButtonJustPressed(15, 2) || // D-pad right on gamepad 2
            this.input.isGamepadButtonJustPressed(15, 3)
        ) {
            // Move to NO button (right)
            if (this.selectedButton !== 1) {
                this.selectedButton = 1;
                this.game.playSound("menu_navigate");
            }
        }

        // Action1 to confirm selection (A/Cross button = primary face button)
        if (
            this.input.isKeyJustPressed("Action1") ||
            this.input.isGamepadButtonJustPressed(0, 0) || // A/Cross button on gamepad 0
            this.input.isGamepadButtonJustPressed(0, 1) || // A/Cross button on gamepad 1
            this.input.isGamepadButtonJustPressed(0, 2) || // A/Cross button on gamepad 2
            this.input.isGamepadButtonJustPressed(0, 3)
        ) {
            if (this.selectedButton === 0) {
                // YES selected
                if (this.onConfirm) this.onConfirm();
                this.game.playSound('menu_confirm');
            } else {
                // NO selected
                if (this.onCancel) this.onCancel();
                this.game.playSound('menu_back');
            }
            this.hide();
            return true;
        }

        // Action2 or ESC to cancel (B/Circle button = secondary face button)
        if (
            this.input.isKeyJustPressed('Escape') ||
            this.input.isKeyJustPressed("Action2") ||
            this.input.isGamepadButtonJustPressed(1, 0) || // B/Circle button on gamepad 0
            this.input.isGamepadButtonJustPressed(1, 1) || // B/Circle button on gamepad 1
            this.input.isGamepadButtonJustPressed(1, 2) || // B/Circle button on gamepad 2
            this.input.isGamepadButtonJustPressed(1, 3)
        ) {
            // Allow ESC or B to cancel and treat as NO
            if (this.onCancel) this.onCancel();
            this.game.playSound('menu_back');
            this.hide();
            return true;
        }

        return true; // Modal is handling input
    }

    /**
     * Register input elements for the modal
     */
    registerElements() {
        const win = this.game.controlsWindow; // Assuming it's in the controls window context
        const modalWidth = 400;
        const modalHeight = 150;
        const modalX = win.x + (win.width - modalWidth) / 2;
        const modalY = win.y + (win.height - modalHeight) / 2;

        const buttonWidth = 80;
        const buttonHeight = 35;
        const buttonY = modalY + modalHeight - 50;

        // Yes button (left)
        this.input.registerElement('confirm_yes_button', {
            bounds: () => ({
                x: modalX + modalWidth / 2 - buttonWidth - 20,
                y: buttonY,
                width: buttonWidth,
                height: buttonHeight
            })
        });

        // No button (right)
        this.input.registerElement('confirm_no_button', {
            bounds: () => ({
                x: modalX + modalWidth / 2 + 20,
                y: buttonY,
                width: buttonWidth,
                height: buttonHeight
            })
        });
    }

    /**
     * Unregister input elements for the modal
     */
    unregisterElements() {
        this.input.removeElement('confirm_yes_button');
        this.input.removeElement('confirm_no_button');
    }
}
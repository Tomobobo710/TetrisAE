/**
 * InputWaitingModal - Handles the waiting for input state with visual countdown
 * Self-contained component that manages its own input and rendering
 */
class InputWaitingModal {
    constructor(game, input) {
        this.game = game;
        this.input = input;
        this.isActive = false;
        this.timeout = 0;
        this.waitingForAction = null;
        this.waitingForInputType = null;
        this.waitingForColumn = null;
        this.onInputReceived = null; // Callback for when input is received
        this.onTimeout = null; // Callback for when timeout expires

        // Attach to game for rendering access
        game.inputWaitingModal = this;
    }

    /**
     * Start waiting for input
     */
    startWaiting(actionId, inputType, column, onInputReceived, onTimeout) {
        this.isActive = true;
        this.waitingForAction = actionId;
        this.waitingForInputType = inputType;
        this.waitingForColumn = column;
        this.timeout = 3000; // 3 seconds
        this.onInputReceived = onInputReceived;
        this.onTimeout = onTimeout;
        console.log(`[InputWaitingModal] Waiting for ${inputType} ${column} input for action: ${actionId}`);
    }

    /**
     * Update the waiting state - called every frame
     */
    update() {
        if (!this.isActive) return;

        // Update timeout
        this.timeout -= this.game.lastDeltaTime * 1000;
        if (this.timeout <= 0) {
            this.cancel();
            if (this.onTimeout) this.onTimeout();
            return;
        }

        // Check for input based on type
        if (this.waitingForInputType === 'keyboard') {
            this.checkKeyboardInput();
        } else if (this.waitingForInputType === 'gamepad') {
            this.checkGamepadInput();
        }
    }

    /**
     * Check for keyboard input
     */
    checkKeyboardInput() {
        const currentKeys = this.input.currentSnapshot.keys;
        const previousKeys = this.input.previousSnapshot.keys;

        // Find newly pressed keys
        for (const [keyCode, isPressed] of currentKeys) {
            if (isPressed && !previousKeys.has(keyCode)) {
                this.onInputReceived({ type: 'keyboard', value: keyCode });
                this.isActive = false;
                return;
            }
        }
    }

    /**
     * Check for gamepad input (buttons and axes)
     */
    checkGamepadInput() {
        // Check for any gamepad button input
        for (let gamepadIndex = 0; gamepadIndex < 4; gamepadIndex++) {
            if (this.input.isGamepadConnected(gamepadIndex)) {
                for (let buttonIndex = 0; buttonIndex < 16; buttonIndex++) {
                    if (this.input.isGamepadButtonJustPressed(buttonIndex, gamepadIndex)) {
                        this.onInputReceived({ type: 'gamepad', value: buttonIndex });
                        this.isActive = false;
                        return;
                    }
                }

                // Check for significant axis movement
                for (let axisIndex = 0; axisIndex < 4; axisIndex++) {
                    const axisValue = this.input.getGamepadAxis(axisIndex, gamepadIndex);
                    // Require significant movement (0.6 threshold for binding)
                    if (Math.abs(axisValue) > 0.6) {
                        // Determine direction - for Y axes (1, 3), handle inversion
                        let direction = axisValue > 0 ? 'positive' : 'negative';
                        // For Y axes, we want intuitive controls (down = positive)
                        if (axisIndex === 1 || axisIndex === 3) {
                            direction = axisValue > 0 ? 'positive' : 'negative';
                        }

                        this.onInputReceived({ type: 'axis', axis: axisIndex, direction: direction });
                        this.isActive = false;
                        return;
                    }
                }
            }
        }
    }

    /**
     * Cancel the waiting state
     */
    cancel() {
        this.isActive = false;
        this.waitingForAction = null;
        this.waitingForInputType = null;
        this.waitingForColumn = null;
        this.timeout = 0;
        this.onInputReceived = null;
        this.onTimeout = null;
        this.game.playSound('menu_back');
    }

    /**
     * Get current progress (0-1) for visual feedback
     */
    getProgress() {
        if (!this.isActive) return 0;
        return Math.max(0, this.timeout / 3000);
    }

    /**
     * Get remaining time in seconds
     */
    getRemainingTime() {
        if (!this.isActive) return 0;
        return Math.max(0, this.timeout / 1000);
    }
}
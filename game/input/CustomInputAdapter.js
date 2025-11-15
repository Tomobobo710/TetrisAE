/**
 * CustomInputAdapter - Bridges custom controls with ActionEngine's input system
 * Translates custom control bindings to ActionEngine's action system
 */
class CustomInputAdapter {
    constructor(actionInput, controlsManager) {
        this.actionInput = actionInput; // ActionEngine's input handler
        this.controlsManager = controlsManager;

        // Cache for performance
        this.cachedActionBindings = null;
        this.lastControlsUpdate = null;

        // Axis state tracking for just-pressed detection
        this.previousAxisStates = new Map();
    }
    
    /**
     * Update action bindings cache when controls change
     */
    updateActionBindings() {
        this.cachedActionBindings = new Map();
        
        // Build reverse lookup: keyCode/buttonIndex -> actions
        const actions = this.controlsManager.getActionList();
        
        for (const actionInfo of actions) {
            const controls = this.controlsManager.getControls(actionInfo.id);
            
            // Map keyboard keys to actions
            const keyboardKeys = [controls.keyboard.primary, controls.keyboard.alt].filter(k => k !== null);
            for (const keyCode of keyboardKeys) {
                if (!this.cachedActionBindings.has(keyCode)) {
                    this.cachedActionBindings.set(keyCode, []);
                }
                this.cachedActionBindings.get(keyCode).push(actionInfo.id);
            }
            
            // Map gamepad buttons to actions (with gamepad index prefix)
            const gamepadButtons = [];
            if (controls.gamepad.primary?.type === 'button') gamepadButtons.push(controls.gamepad.primary.value);
            if (controls.gamepad.alt?.type === 'button') gamepadButtons.push(controls.gamepad.alt.value);

            for (const buttonIndex of gamepadButtons) {
                for (let gamepadIndex = 0; gamepadIndex < 4; gamepadIndex++) {
                    const gamepadKey = `gamepad_${gamepadIndex}_${buttonIndex}`;
                    if (!this.cachedActionBindings.has(gamepadKey)) {
                        this.cachedActionBindings.set(gamepadKey, []);
                    }
                    this.cachedActionBindings.get(gamepadKey).push(actionInfo.id);
                }
            }
        }
        
        this.lastControlsUpdate = Date.now();
    }
    
    /**
     * Check if custom action is currently pressed
     */
    isActionPressed(action) {
        this.ensureBindingsUpToDate();
        
        const controls = this.controlsManager.getControls(action);
        
        // Check keyboard bindings
        if (controls.keyboard.primary && this.actionInput.isRawKeyPressed(controls.keyboard.primary)) {
            return true;
        }
        if (controls.keyboard.alt && this.actionInput.isRawKeyPressed(controls.keyboard.alt)) {
            return true;
        }
        
        // Check gamepad button bindings
        if (controls.gamepad.primary?.type === 'button') {
            for (let gamepadIndex = 0; gamepadIndex < 4; gamepadIndex++) {
                if (this.actionInput.isGamepadConnected(gamepadIndex) &&
                    this.actionInput.isGamepadButtonPressed(controls.gamepad.primary.value, gamepadIndex)) {
                    return true;
                }
            }
        }
        if (controls.gamepad.alt?.type === 'button') {
            for (let gamepadIndex = 0; gamepadIndex < 4; gamepadIndex++) {
                if (this.actionInput.isGamepadConnected(gamepadIndex) &&
                    this.actionInput.isGamepadButtonPressed(controls.gamepad.alt.value, gamepadIndex)) {
                    return true;
                }
            }
        }

        // Check axis bindings (both primary and alt slots)
        if (controls.gamepad.primary?.type === 'axis') {
            for (let gamepadIndex = 0; gamepadIndex < 4; gamepadIndex++) {
                if (this.actionInput.isGamepadConnected(gamepadIndex)) {
                    const axisValue = this.actionInput.getGamepadAxis(controls.gamepad.primary.value.index, gamepadIndex);

                    let isActive = false;
                    if (controls.gamepad.primary.value.direction === 'both' && Math.abs(axisValue) > 0.5) {
                        isActive = true;
                    } else if (controls.gamepad.primary.value.direction === 'positive' && axisValue > 0.5) {
                        isActive = true;
                    } else if (controls.gamepad.primary.value.direction === 'negative' && axisValue < -0.5) {
                        isActive = true;
                    }

                    if (isActive) return true;
                }
            }
        }
        if (controls.gamepad.alt?.type === 'axis') {
            for (let gamepadIndex = 0; gamepadIndex < 4; gamepadIndex++) {
                if (this.actionInput.isGamepadConnected(gamepadIndex)) {
                    const axisValue = this.actionInput.getGamepadAxis(controls.gamepad.alt.value.index, gamepadIndex);

                    let isActive = false;
                    if (controls.gamepad.alt.value.direction === 'both' && Math.abs(axisValue) > 0.5) {
                        isActive = true;
                    } else if (controls.gamepad.alt.value.direction === 'positive' && axisValue > 0.5) {
                        isActive = true;
                    } else if (controls.gamepad.alt.value.direction === 'negative' && axisValue < -0.5) {
                        isActive = true;
                    }

                    if (isActive) return true;
                }
            }
        }

        return false;
    }
    
    /**
     * Check if custom action was just pressed this frame
     */
    isActionJustPressed(action) {
        this.ensureBindingsUpToDate();
        
        const controls = this.controlsManager.getControls(action);
        
        // Check keyboard bindings
        if (controls.keyboard.primary && this.actionInput.isRawKeyJustPressed(controls.keyboard.primary)) {
            return true;
        }
        if (controls.keyboard.alt && this.actionInput.isRawKeyJustPressed(controls.keyboard.alt)) {
            return true;
        }
        
        // Check gamepad button bindings
        if (controls.gamepad.primary?.type === 'button') {
            for (let gamepadIndex = 0; gamepadIndex < 4; gamepadIndex++) {
                if (this.actionInput.isGamepadConnected(gamepadIndex) &&
                    this.actionInput.isGamepadButtonJustPressed(controls.gamepad.primary.value, gamepadIndex)) {
                    return true;
                }
            }
        }
        if (controls.gamepad.alt?.type === 'button') {
            for (let gamepadIndex = 0; gamepadIndex < 4; gamepadIndex++) {
                if (this.actionInput.isGamepadConnected(gamepadIndex) &&
                    this.actionInput.isGamepadButtonJustPressed(controls.gamepad.alt.value, gamepadIndex)) {
                    return true;
                }
            }
        }

        // Check axis bindings for just pressed (both primary and alt slots)
        if (controls.gamepad.primary?.type === 'axis') {
            for (let gamepadIndex = 0; gamepadIndex < 4; gamepadIndex++) {
                if (this.actionInput.isGamepadConnected(gamepadIndex)) {
                    const axisValue = this.actionInput.getGamepadAxis(controls.gamepad.primary.value.index, gamepadIndex);
                    const prevAxisValue = this.getPreviousAxisValue(gamepadIndex, controls.gamepad.primary.value.index);

                    let isCurrentlyActive = false;
                    let wasPreviouslyActive = false;

                    if (controls.gamepad.primary.value.direction === 'both') {
                        isCurrentlyActive = Math.abs(axisValue) > 0.5;
                        wasPreviouslyActive = Math.abs(prevAxisValue) > 0.5;
                    } else if (controls.gamepad.primary.value.direction === 'positive') {
                        isCurrentlyActive = axisValue > 0.5;
                        wasPreviouslyActive = prevAxisValue > 0.5;
                    } else if (controls.gamepad.primary.value.direction === 'negative') {
                        isCurrentlyActive = axisValue < -0.5;
                        wasPreviouslyActive = prevAxisValue < -0.5;
                    }

                    if (isCurrentlyActive && !wasPreviouslyActive) {
                        return true;
                    }
                }
            }
        }
        if (controls.gamepad.alt?.type === 'axis') {
            for (let gamepadIndex = 0; gamepadIndex < 4; gamepadIndex++) {
                if (this.actionInput.isGamepadConnected(gamepadIndex)) {
                    const axisValue = this.actionInput.getGamepadAxis(controls.gamepad.alt.value.index, gamepadIndex);
                    const prevAxisValue = this.getPreviousAxisValue(gamepadIndex, controls.gamepad.alt.value.index);

                    let isCurrentlyActive = false;
                    let wasPreviouslyActive = false;

                    if (controls.gamepad.alt.value.direction === 'both') {
                        isCurrentlyActive = Math.abs(axisValue) > 0.5;
                        wasPreviouslyActive = Math.abs(prevAxisValue) > 0.5;
                    } else if (controls.gamepad.alt.value.direction === 'positive') {
                        isCurrentlyActive = axisValue > 0.5;
                        wasPreviouslyActive = prevAxisValue > 0.5;
                    } else if (controls.gamepad.alt.value.direction === 'negative') {
                        isCurrentlyActive = axisValue < -0.5;
                        wasPreviouslyActive = prevAxisValue < -0.5;
                    }

                    if (isCurrentlyActive && !wasPreviouslyActive) {
                        return true;
                    }
                }
            }
        }

        return false;
    }
    
    /**
     * Check if action is pressed for a specific player (gamepad only)
     */
    isPlayerActionPressed(action, playerNumber) {
        this.ensureBindingsUpToDate();

        const gamepadIndex = playerNumber - 1; // Player 1 = gamepad 0, etc.
        if (!this.actionInput.isGamepadConnected(gamepadIndex)) {
            return false;
        }

        const controls = this.controlsManager.getControls(action);

        // Check gamepad button bindings for this specific player
        if (controls.gamepad.primary?.type === 'button' && this.actionInput.isGamepadButtonPressed(controls.gamepad.primary.value, gamepadIndex)) {
            return true;
        }
        if (controls.gamepad.alt?.type === 'button' && this.actionInput.isGamepadButtonPressed(controls.gamepad.alt.value, gamepadIndex)) {
            return true;
        }

        // Check axis bindings for this specific player (both primary and alt slots)
        if (controls.gamepad.primary?.type === 'axis') {
            const axisValue = this.actionInput.getGamepadAxis(controls.gamepad.primary.value.index, gamepadIndex);

            let isActive = false;
            if (controls.gamepad.primary.value.direction === 'both' && Math.abs(axisValue) > 0.5) {
                isActive = true;
            } else if (controls.gamepad.primary.value.direction === 'positive' && axisValue > 0.5) {
                isActive = true;
            } else if (controls.gamepad.primary.value.direction === 'negative' && axisValue < -0.5) {
                isActive = true;
            }

            if (isActive) return true;
        }
        if (controls.gamepad.alt?.type === 'axis') {
            const axisValue = this.actionInput.getGamepadAxis(controls.gamepad.alt.value.index, gamepadIndex);

            let isActive = false;
            if (controls.gamepad.alt.value.direction === 'both' && Math.abs(axisValue) > 0.5) {
                isActive = true;
            } else if (controls.gamepad.alt.value.direction === 'positive' && axisValue > 0.5) {
                isActive = true;
            } else if (controls.gamepad.alt.value.direction === 'negative' && axisValue < -0.5) {
                isActive = true;
            }

            if (isActive) return true;
        }

        return false;
    }
    
    /**
     * Check if action was just pressed for a specific player (gamepad only)
     */
    isPlayerActionJustPressed(action, playerNumber) {
        this.ensureBindingsUpToDate();

        const gamepadIndex = playerNumber - 1; // Player 1 = gamepad 0, etc.
        if (!this.actionInput.isGamepadConnected(gamepadIndex)) {
            return false;
        }

        const controls = this.controlsManager.getControls(action);

        // Check gamepad button bindings for this specific player
        if (controls.gamepad.primary?.type === 'button' && this.actionInput.isGamepadButtonJustPressed(controls.gamepad.primary.value, gamepadIndex)) {
            return true;
        }
        if (controls.gamepad.alt?.type === 'button' && this.actionInput.isGamepadButtonJustPressed(controls.gamepad.alt.value, gamepadIndex)) {
            return true;
        }

        // Check axis bindings for just pressed on this specific player (both primary and alt slots)
        if (controls.gamepad.primary?.type === 'axis') {
            const axisValue = this.actionInput.getGamepadAxis(controls.gamepad.primary.value.index, gamepadIndex);
            const prevAxisValue = this.getPreviousAxisValue(gamepadIndex, controls.gamepad.primary.value.index);

            let isCurrentlyActive = false;
            let wasPreviouslyActive = false;

            if (controls.gamepad.primary.value.direction === 'both') {
                isCurrentlyActive = Math.abs(axisValue) > 0.5;
                wasPreviouslyActive = Math.abs(prevAxisValue) > 0.5;
            } else if (controls.gamepad.primary.value.direction === 'positive') {
                isCurrentlyActive = axisValue > 0.5;
                wasPreviouslyActive = prevAxisValue > 0.5;
            } else if (controls.gamepad.primary.value.direction === 'negative') {
                isCurrentlyActive = axisValue < -0.5;
                wasPreviouslyActive = prevAxisValue < -0.5;
            }

            if (isCurrentlyActive && !wasPreviouslyActive) {
                return true;
            }
        }
        if (controls.gamepad.alt?.type === 'axis') {
            const axisValue = this.actionInput.getGamepadAxis(controls.gamepad.alt.value.index, gamepadIndex);
            const prevAxisValue = this.getPreviousAxisValue(gamepadIndex, controls.gamepad.alt.value.index);

            let isCurrentlyActive = false;
            let wasPreviouslyActive = false;

            if (controls.gamepad.alt.value.direction === 'both') {
                isCurrentlyActive = Math.abs(axisValue) > 0.5;
                wasPreviouslyActive = Math.abs(prevAxisValue) > 0.5;
            } else if (controls.gamepad.alt.value.direction === 'positive') {
                isCurrentlyActive = axisValue > 0.5;
                wasPreviouslyActive = prevAxisValue > 0.5;
            } else if (controls.gamepad.alt.value.direction === 'negative') {
                isCurrentlyActive = axisValue < -0.5;
                wasPreviouslyActive = prevAxisValue < -0.5;
            }

            if (isCurrentlyActive && !wasPreviouslyActive) {
                return true;
            }
        }

        return false;
    }
    
    /**
     * Check menu controls (keyboard + any gamepad)
     */
    isMenuActionPressed(action) {
        this.ensureBindingsUpToDate();
        
        const controls = this.controlsManager.getControls(action);
        
        // Check keyboard bindings
        if (controls.keyboard.primary && this.actionInput.isRawKeyPressed(controls.keyboard.primary)) {
            return true;
        }
        if (controls.keyboard.alt && this.actionInput.isRawKeyPressed(controls.keyboard.alt)) {
            return true;
        }
        
        // Check any connected gamepad
        if (controls.gamepad.primary?.type === 'button') {
            for (let gamepadIndex = 0; gamepadIndex < 4; gamepadIndex++) {
                if (this.actionInput.isGamepadConnected(gamepadIndex) &&
                    this.actionInput.isGamepadButtonPressed(controls.gamepad.primary.value, gamepadIndex)) {
                    return true;
                }
            }
        }
        if (controls.gamepad.alt?.type === 'button') {
            for (let gamepadIndex = 0; gamepadIndex < 4; gamepadIndex++) {
                if (this.actionInput.isGamepadConnected(gamepadIndex) &&
                    this.actionInput.isGamepadButtonPressed(controls.gamepad.alt.value, gamepadIndex)) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    /**
     * Check menu controls (just pressed)
     */
    isMenuActionJustPressed(action) {
        this.ensureBindingsUpToDate();
        
        const controls = this.controlsManager.getControls(action);
        
        // Check keyboard bindings
        if (controls.keyboard.primary && this.actionInput.isRawKeyJustPressed(controls.keyboard.primary)) {
            return true;
        }
        if (controls.keyboard.alt && this.actionInput.isRawKeyJustPressed(controls.keyboard.alt)) {
            return true;
        }
        
        // Check any connected gamepad
        if (controls.gamepad.primary?.type === 'button') {
            for (let gamepadIndex = 0; gamepadIndex < 4; gamepadIndex++) {
                if (this.actionInput.isGamepadConnected(gamepadIndex) &&
                    this.actionInput.isGamepadButtonJustPressed(controls.gamepad.primary.value, gamepadIndex)) {
                    return true;
                }
            }
        }
        if (controls.gamepad.alt?.type === 'button') {
            for (let gamepadIndex = 0; gamepadIndex < 4; gamepadIndex++) {
                if (this.actionInput.isGamepadConnected(gamepadIndex) &&
                    this.actionInput.isGamepadButtonJustPressed(controls.gamepad.alt.value, gamepadIndex)) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    /**
     * Legacy compatibility methods - map to custom controls
     */
    
    // Gameplay mappings
    isKeyPressed(legacyAction) {
        const customAction = this.mapLegacyAction(legacyAction);
        return customAction ? this.isActionPressed(customAction) : false;
    }
    
    isKeyJustPressed(legacyAction) {
        const customAction = this.mapLegacyAction(legacyAction);
        return customAction ? this.isActionJustPressed(customAction) : false;
    }
    
    /**
     * Map legacy ActionEngine actions to custom controls
     */
    mapLegacyAction(legacyAction) {
        const actionMap = {
            'DirLeft': 'moveLeft',
            'DirRight': 'moveRight', 
            'DirDown': 'softDrop',
            'DirUp': 'hardDrop',
            'Action1': 'rotateCW',
            'Action2': 'rotateCCW',
            'Action3': 'hold',
            'Action5': 'hold',
            'Action4': 'themeChange'
        };
        
        return actionMap[legacyAction] || null;
    }
    
    /**
     * Ensure bindings cache is up to date
     */
    ensureBindingsUpToDate() {
        // Simple check - in a real implementation you might want to listen for control changes
        if (!this.cachedActionBindings) {
            this.updateActionBindings();
        }
    }

    /**
     * Update axis states for just-pressed detection
     */
    updateAxisStates() {
        for (let gamepadIndex = 0; gamepadIndex < 4; gamepadIndex++) {
            if (this.actionInput.isGamepadConnected(gamepadIndex)) {
                for (let axisIndex = 0; axisIndex < 4; axisIndex++) {
                    const key = `${gamepadIndex}_${axisIndex}`;
                    const currentValue = this.actionInput.getGamepadAxis(axisIndex, gamepadIndex);
                    this.previousAxisStates.set(key, currentValue);
                }
            }
        }
    }

    /**
     * Get previous axis value for just-pressed detection
     */
    getPreviousAxisValue(gamepadIndex, axisIndex) {
        const key = `${gamepadIndex}_${axisIndex}`;
        return this.previousAxisStates.get(key) || 0;
    }
    
    /**
     * Force refresh of bindings (call when controls are modified)
     */
    refreshBindings() {
        this.cachedActionBindings = null;
        this.updateActionBindings();
    }
}
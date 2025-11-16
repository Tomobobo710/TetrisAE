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
     * Check if any device has input for an action (single player mode)
     * Each device checks its own profile (keyboard=PLAYER_1, gamepad0=PLAYER_1, gamepad1=PLAYER_2, etc.)
     */
    isAnyDeviceActive(action) {
        // Check keyboard (PLAYER_1 profile)
        const p1Controls = this.controlsManager.getControls(action, 'PLAYER_1');
        if ((p1Controls.keyboard.primary && this.actionInput.isRawKeyPressed(p1Controls.keyboard.primary)) ||
            (p1Controls.keyboard.alt && this.actionInput.isRawKeyPressed(p1Controls.keyboard.alt))) {
            return true;
        }
        
        // Check each gamepad (PLAYER_N profiles where N = gamepadIndex + 1)
        for (let gamepadIndex = 0; gamepadIndex < 4; gamepadIndex++) {
            if (!this.actionInput.isGamepadConnected(gamepadIndex)) continue;
            
            const profileName = `PLAYER_${gamepadIndex + 1}`;
            const controls = this.controlsManager.getControls(action, profileName);
            
            // Check buttons
            if (controls.gamepad.primary?.type === 'button' && 
                this.actionInput.isGamepadButtonPressed(controls.gamepad.primary.value, gamepadIndex)) {
                return true;
            }
            if (controls.gamepad.alt?.type === 'button' && 
                this.actionInput.isGamepadButtonPressed(controls.gamepad.alt.value, gamepadIndex)) {
                return true;
            }
            
            // Check axes
            if (controls.gamepad.primary?.type === 'axis') {
                const axisValue = this.actionInput.getGamepadAxis(controls.gamepad.primary.value.index, gamepadIndex);
                const dir = controls.gamepad.primary.value.direction;
                if ((dir === 'both' && Math.abs(axisValue) > 0.5) ||
                    (dir === 'positive' && axisValue > 0.5) ||
                    (dir === 'negative' && axisValue < -0.5)) {
                    return true;
                }
            }
            if (controls.gamepad.alt?.type === 'axis') {
                const axisValue = this.actionInput.getGamepadAxis(controls.gamepad.alt.value.index, gamepadIndex);
                const dir = controls.gamepad.alt.value.direction;
                if ((dir === 'both' && Math.abs(axisValue) > 0.5) ||
                    (dir === 'positive' && axisValue > 0.5) ||
                    (dir === 'negative' && axisValue < -0.5)) {
                    return true;
                }
            }
        }
        
        // No input detected
        return false;
    }
    
    /**
     * Reset the sticky device (call when starting a new game) - NO LONGER NEEDED but kept for compatibility
     */
    resetStickyDevice() {
        // Not needed anymore since we don't track sticky devices
    }

    /**
     * Check if custom action is currently pressed (for single player, Dr. Mario, and online modes)
     * Each device checks its own profile
     */
    isActionPressed(action) {
        this.ensureBindingsUpToDate();
        
        // Use the helper that checks all devices with their respective profiles
        return this.isAnyDeviceActive(action);
    }
    
    /**
     * Check if any device has just pressed input for an action (single player mode)
     * Each device checks its own profile (keyboard=PLAYER_1, gamepad0=PLAYER_1, gamepad1=PLAYER_2, etc.)
     */
    isAnyDeviceJustPressed(action) {
        // Check keyboard (PLAYER_1 profile)
        const p1Controls = this.controlsManager.getControls(action, 'PLAYER_1');
        if ((p1Controls.keyboard.primary && this.actionInput.isRawKeyJustPressed(p1Controls.keyboard.primary)) ||
            (p1Controls.keyboard.alt && this.actionInput.isRawKeyJustPressed(p1Controls.keyboard.alt))) {
            return true;
        }
        
        // Check each gamepad (PLAYER_N profiles where N = gamepadIndex + 1)
        for (let gamepadIndex = 0; gamepadIndex < 4; gamepadIndex++) {
            if (!this.actionInput.isGamepadConnected(gamepadIndex)) continue;
            
            const profileName = `PLAYER_${gamepadIndex + 1}`;
            const controls = this.controlsManager.getControls(action, profileName);
            
            // Check buttons
            if (controls.gamepad.primary?.type === 'button' && 
                this.actionInput.isGamepadButtonJustPressed(controls.gamepad.primary.value, gamepadIndex)) {
                return true;
            }
            if (controls.gamepad.alt?.type === 'button' && 
                this.actionInput.isGamepadButtonJustPressed(controls.gamepad.alt.value, gamepadIndex)) {
                return true;
            }

            // Check axes for just pressed
            if (controls.gamepad.primary?.type === 'axis') {
                const axisValue = this.actionInput.getGamepadAxis(controls.gamepad.primary.value.index, gamepadIndex);
                const prevAxisValue = this.getPreviousAxisValue(gamepadIndex, controls.gamepad.primary.value.index);
                const dir = controls.gamepad.primary.value.direction;
                
                let isCurrentlyActive = false;
                let wasPreviouslyActive = false;
                
                if (dir === 'both') {
                    isCurrentlyActive = Math.abs(axisValue) > 0.5;
                    wasPreviouslyActive = Math.abs(prevAxisValue) > 0.5;
                } else if (dir === 'positive') {
                    isCurrentlyActive = axisValue > 0.5;
                    wasPreviouslyActive = prevAxisValue > 0.5;
                } else if (dir === 'negative') {
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
                const dir = controls.gamepad.alt.value.direction;
                
                let isCurrentlyActive = false;
                let wasPreviouslyActive = false;
                
                if (dir === 'both') {
                    isCurrentlyActive = Math.abs(axisValue) > 0.5;
                    wasPreviouslyActive = Math.abs(prevAxisValue) > 0.5;
                } else if (dir === 'positive') {
                    isCurrentlyActive = axisValue > 0.5;
                    wasPreviouslyActive = prevAxisValue > 0.5;
                } else if (dir === 'negative') {
                    isCurrentlyActive = axisValue < -0.5;
                    wasPreviouslyActive = prevAxisValue < -0.5;
                }
                
                if (isCurrentlyActive && !wasPreviouslyActive) {
                    return true;
                }
            }
        }
        
        // No input detected
        return false;
    }
    
    /**
     * Check if custom action was just pressed this frame (for single player, Dr. Mario, and online modes)
     * Each device checks its own profile
     */
    isActionJustPressed(action) {
        this.ensureBindingsUpToDate();
        
        // Use the helper that checks all devices with their respective profiles
        return this.isAnyDeviceJustPressed(action);
    }
    
    /**
     * Check if action is pressed for a specific player (uses player-specific profile)
     * For local multiplayer modes
     */
    isPlayerActionPressed(action, playerNumber) {
        this.ensureBindingsUpToDate();

        // Determine which profile to use based on player number
        const profileName = `PLAYER_${playerNumber}`;
        const gamepadIndex = playerNumber - 1; // Player 1 = gamepad 0, etc.
        
        const controls = this.controlsManager.getControls(action, profileName);

        // Player 1 can use keyboard OR gamepad 0
        if (playerNumber === 1) {
            // Check keyboard bindings
            if (controls.keyboard.primary && this.actionInput.isRawKeyPressed(controls.keyboard.primary)) {
                return true;
            }
            if (controls.keyboard.alt && this.actionInput.isRawKeyPressed(controls.keyboard.alt)) {
                return true;
            }
            
            // ALSO check gamepad 0 for player 1
            if (this.actionInput.isGamepadConnected(0)) {
                // Check gamepad button bindings
                if (controls.gamepad.primary?.type === 'button' && this.actionInput.isGamepadButtonPressed(controls.gamepad.primary.value, 0)) {
                    return true;
                }
                if (controls.gamepad.alt?.type === 'button' && this.actionInput.isGamepadButtonPressed(controls.gamepad.alt.value, 0)) {
                    return true;
                }

                // Check axis bindings
                if (controls.gamepad.primary?.type === 'axis') {
                    const axisValue = this.actionInput.getGamepadAxis(controls.gamepad.primary.value.index, 0);
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
                    const axisValue = this.actionInput.getGamepadAxis(controls.gamepad.alt.value.index, 0);
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
            
            // Player 1 done - return false if nothing was pressed
            return false;
        }

        // Players 2-4: Check their specific gamepad only
        if (!this.actionInput.isGamepadConnected(gamepadIndex)) {
            return false;
        }

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
     * Check if action was just pressed for a specific player (uses player-specific profile)
     * For local multiplayer modes
     */
    isPlayerActionJustPressed(action, playerNumber) {
        this.ensureBindingsUpToDate();

        // Determine which profile to use based on player number
        const profileName = `PLAYER_${playerNumber}`;
        const gamepadIndex = playerNumber - 1; // Player 1 = gamepad 0, etc.
        
        const controls = this.controlsManager.getControls(action, profileName);

        // Player 1 can use keyboard OR gamepad 0
        if (playerNumber === 1) {
            // Check keyboard bindings
            if (controls.keyboard.primary && this.actionInput.isRawKeyJustPressed(controls.keyboard.primary)) {
                return true;
            }
            if (controls.keyboard.alt && this.actionInput.isRawKeyJustPressed(controls.keyboard.alt)) {
                return true;
            }
            
            // ALSO check gamepad 0 for player 1
            if (this.actionInput.isGamepadConnected(0)) {
                // Check gamepad button bindings
                if (controls.gamepad.primary?.type === 'button' && this.actionInput.isGamepadButtonJustPressed(controls.gamepad.primary.value, 0)) {
                    return true;
                }
                if (controls.gamepad.alt?.type === 'button' && this.actionInput.isGamepadButtonJustPressed(controls.gamepad.alt.value, 0)) {
                    return true;
                }

                // Check axes for just pressed
                if (controls.gamepad.primary?.type === 'axis') {
                    const axisValue = this.actionInput.getGamepadAxis(controls.gamepad.primary.value.index, 0);
                    const prevAxisValue = this.getPreviousAxisValue(0, controls.gamepad.primary.value.index);
                    const dir = controls.gamepad.primary.value.direction;
                    
                    let isCurrentlyActive = false;
                    let wasPreviouslyActive = false;
                    
                    if (dir === 'both') {
                        isCurrentlyActive = Math.abs(axisValue) > 0.5;
                        wasPreviouslyActive = Math.abs(prevAxisValue) > 0.5;
                    } else if (dir === 'positive') {
                        isCurrentlyActive = axisValue > 0.5;
                        wasPreviouslyActive = prevAxisValue > 0.5;
                    } else if (dir === 'negative') {
                        isCurrentlyActive = axisValue < -0.5;
                        wasPreviouslyActive = prevAxisValue < -0.5;
                    }
                    
                    if (isCurrentlyActive && !wasPreviouslyActive) {
                        return true;
                    }
                }
                
                if (controls.gamepad.alt?.type === 'axis') {
                    const axisValue = this.actionInput.getGamepadAxis(controls.gamepad.alt.value.index, 0);
                    const prevAxisValue = this.getPreviousAxisValue(0, controls.gamepad.alt.value.index);
                    const dir = controls.gamepad.alt.value.direction;
                    
                    let isCurrentlyActive = false;
                    let wasPreviouslyActive = false;
                    
                    if (dir === 'both') {
                        isCurrentlyActive = Math.abs(axisValue) > 0.5;
                        wasPreviouslyActive = Math.abs(prevAxisValue) > 0.5;
                    } else if (dir === 'positive') {
                        isCurrentlyActive = axisValue > 0.5;
                        wasPreviouslyActive = prevAxisValue > 0.5;
                    } else if (dir === 'negative') {
                        isCurrentlyActive = axisValue < -0.5;
                        wasPreviouslyActive = prevAxisValue < -0.5;
                    }
                    
                    if (isCurrentlyActive && !wasPreviouslyActive) {
                        return true;
                    }
                }
            }
            
            // Player 1 done - return false if nothing was pressed
            return false;
        }

        // Players 2-4: Check their specific gamepad only
        if (!this.actionInput.isGamepadConnected(gamepadIndex)) {
            return false;
        }

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
     * Check menu controls (keyboard + any gamepad) - uses PLAYER_1 profile
     */
    isMenuActionPressed(action) {
        this.ensureBindingsUpToDate();
        
        const controls = this.controlsManager.getControls(action, 'PLAYER_1');
        
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
     * Check menu controls (just pressed) - uses PLAYER_1 profile
     */
    isMenuActionJustPressed(action) {
        this.ensureBindingsUpToDate();
        
        const controls = this.controlsManager.getControls(action, 'PLAYER_1');
        
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
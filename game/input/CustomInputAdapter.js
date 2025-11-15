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
            for (const keyCode of controls.keyboard) {
                if (!this.cachedActionBindings.has(keyCode)) {
                    this.cachedActionBindings.set(keyCode, []);
                }
                this.cachedActionBindings.get(keyCode).push(actionInfo.id);
            }
            
            // Map gamepad buttons to actions (with gamepad index prefix)
            for (const buttonIndex of controls.gamepad) {
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
        for (const keyCode of controls.keyboard) {
            if (this.actionInput.isRawKeyPressed(keyCode)) {
                return true;
            }
        }
        
        // Check gamepad bindings
        for (const buttonIndex of controls.gamepad) {
            for (let gamepadIndex = 0; gamepadIndex < 4; gamepadIndex++) {
                if (this.actionInput.isGamepadConnected(gamepadIndex) &&
                    this.actionInput.isGamepadButtonPressed(buttonIndex, gamepadIndex)) {
                    return true;
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
        for (const keyCode of controls.keyboard) {
            if (this.actionInput.isRawKeyJustPressed(keyCode)) {
                return true;
            }
        }
        
        // Check gamepad bindings
        for (const buttonIndex of controls.gamepad) {
            for (let gamepadIndex = 0; gamepadIndex < 4; gamepadIndex++) {
                if (this.actionInput.isGamepadConnected(gamepadIndex) &&
                    this.actionInput.isGamepadButtonJustPressed(buttonIndex, gamepadIndex)) {
                    return true;
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
        
        // Check gamepad bindings for this specific player
        for (const buttonIndex of controls.gamepad) {
            if (this.actionInput.isGamepadButtonPressed(buttonIndex, gamepadIndex)) {
                return true;
            }
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
        
        // Check gamepad bindings for this specific player
        for (const buttonIndex of controls.gamepad) {
            if (this.actionInput.isGamepadButtonJustPressed(buttonIndex, gamepadIndex)) {
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
        for (const keyCode of controls.keyboard) {
            if (this.actionInput.isRawKeyPressed(keyCode)) {
                return true;
            }
        }
        
        // Check any connected gamepad
        for (const buttonIndex of controls.gamepad) {
            for (let gamepadIndex = 0; gamepadIndex < 4; gamepadIndex++) {
                if (this.actionInput.isGamepadConnected(gamepadIndex) &&
                    this.actionInput.isGamepadButtonPressed(buttonIndex, gamepadIndex)) {
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
        for (const keyCode of controls.keyboard) {
            if (this.actionInput.isRawKeyJustPressed(keyCode)) {
                return true;
            }
        }
        
        // Check any connected gamepad
        for (const buttonIndex of controls.gamepad) {
            for (let gamepadIndex = 0; gamepadIndex < 4; gamepadIndex++) {
                if (this.actionInput.isGamepadConnected(gamepadIndex) &&
                    this.actionInput.isGamepadButtonJustPressed(buttonIndex, gamepadIndex)) {
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
     * Force refresh of bindings (call when controls are modified)
     */
    refreshBindings() {
        this.cachedActionBindings = null;
        this.updateActionBindings();
    }
}
/**
 * CustomControlsManager - Manages custom key bindings for Tetris
 * Handles saving/loading from localStorage and provides APIs for rebinding
 */
class CustomControlsManager {
    constructor() {
        this.defaultControls = {
            // Gameplay controls - 2 keys each for alternates
            moveLeft: { keyboard: ["KeyA", "ArrowLeft"], gamepad: [14] }, // D-pad left
            moveRight: { keyboard: ["KeyD", "ArrowRight"], gamepad: [15] }, // D-pad right
            softDrop: { keyboard: ["KeyS", "ArrowDown"], gamepad: [13] }, // D-pad down
            hardDrop: { keyboard: ["KeyW", "ArrowUp"], gamepad: [12] }, // D-pad up
            rotateCW: { keyboard: ["Space", "KeyJ"], gamepad: [0] }, // A/Cross
            rotateCCW: { keyboard: ["ShiftLeft", "KeyK"], gamepad: [1] }, // B/Circle
            hold: { keyboard: ["KeyE", "KeyZ"], gamepad: [4, 5] }, // L1/R1 bumpers
            
            // Global controls
            themeChange: { keyboard: ["KeyQ", "KeyF"], gamepad: [2] }, // X/Square
            targetSelect: { keyboard: ["KeyQ", "KeyG"], gamepad: [3] }, // Y/Triangle (Tetris multiplayer only)
            pause: { keyboard: ["KeyC", "KeyP"], gamepad: [9] } // Start button
        };
        
        this.currentControls = null;
        this.loadControls();
    }
    
    /**
     * Load controls from localStorage, falling back to defaults
     */
    loadControls() {
        try {
            const saved = localStorage.getItem('tetris_custom_controls');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Validate the structure and merge with defaults
                this.currentControls = this.mergeWithDefaults(parsed);
            } else {
                this.currentControls = JSON.parse(JSON.stringify(this.defaultControls));
            }
        } catch (error) {
            console.warn('[CustomControlsManager] Failed to load controls from localStorage:', error);
            this.currentControls = JSON.parse(JSON.stringify(this.defaultControls));
        }
    }
    
    /**
     * Save current controls to localStorage
     */
    saveControls() {
        try {
            localStorage.setItem('tetris_custom_controls', JSON.stringify(this.currentControls));
            console.log('[CustomControlsManager] Controls saved to localStorage');
        } catch (error) {
            console.error('[CustomControlsManager] Failed to save controls to localStorage:', error);
        }
    }
    
    /**
     * Reset all controls to defaults
     */
    resetToDefaults() {
        this.currentControls = JSON.parse(JSON.stringify(this.defaultControls));
        this.saveControls();
        console.log('[CustomControlsManager] Controls reset to defaults');
    }
    
    /**
     * Merge saved controls with defaults to handle new actions or missing keys
     */
    mergeWithDefaults(saved) {
        const merged = JSON.parse(JSON.stringify(this.defaultControls));
        
        for (const action in saved) {
            if (merged[action]) {
                // Merge keyboard and gamepad arrays if they exist
                if (saved[action].keyboard && Array.isArray(saved[action].keyboard)) {
                    merged[action].keyboard = saved[action].keyboard;
                }
                if (saved[action].gamepad && Array.isArray(saved[action].gamepad)) {
                    merged[action].gamepad = saved[action].gamepad;
                }
            }
        }
        
        return merged;
    }
    
    /**
     * Get all key bindings for an action
     */
    getControls(action) {
        return this.currentControls[action] || { keyboard: [], gamepad: [] };
    }
    
    /**
     * Get keyboard bindings for an action
     */
    getKeyboardControls(action) {
        return this.currentControls[action]?.keyboard || [];
    }
    
    /**
     * Get gamepad bindings for an action
     */
    getGamepadControls(action) {
        return this.currentControls[action]?.gamepad || [];
    }
    
    /**
     * Set keyboard binding for an action
     */
    setKeyboardControl(action, keyCode, slot = 'primary') {
        if (!this.currentControls[action]) {
            this.currentControls[action] = { keyboard: [], gamepad: [] };
        }
        
        // Remove this key from any other actions first to prevent conflicts
        this.removeKeyboardControl(keyCode, action);
        
        // Set binding in the specified slot
        if (slot === 'primary') {
            if (this.currentControls[action].keyboard.length === 0) {
                this.currentControls[action].keyboard = [keyCode];
            } else {
                this.currentControls[action].keyboard[0] = keyCode;
            }
        } else { // alt
            if (this.currentControls[action].keyboard.length < 2) {
                this.currentControls[action].keyboard.push(keyCode);
            } else {
                this.currentControls[action].keyboard[1] = keyCode;
            }
        }
        
        this.saveControls();
        console.log(`[CustomControlsManager] Set ${slot} keyboard control for ${action}: ${keyCode}`);
    }
    
    /**
     * Set gamepad binding for an action
     */
    setGamepadControl(action, buttonIndex, slot = 'primary') {
        if (!this.currentControls[action]) {
            this.currentControls[action] = { keyboard: [], gamepad: [] };
        }
        
        // Remove this button from any other actions first to prevent conflicts
        this.removeGamepadControl(buttonIndex, action);
        
        // Set binding in the specified slot
        if (slot === 'primary') {
            if (this.currentControls[action].gamepad.length === 0) {
                this.currentControls[action].gamepad = [buttonIndex];
            } else {
                this.currentControls[action].gamepad[0] = buttonIndex;
            }
        } else { // alt
            if (this.currentControls[action].gamepad.length < 2) {
                this.currentControls[action].gamepad.push(buttonIndex);
            } else {
                this.currentControls[action].gamepad[1] = buttonIndex;
            }
        }
        
        this.saveControls();
        console.log(`[CustomControlsManager] Set ${slot} gamepad control for ${action}: Button ${buttonIndex}`);
    }
    
    /**
     * Remove a keyboard control from all actions except the specified one
     */
    removeKeyboardControl(keyCode, exceptAction = null) {
        for (const action in this.currentControls) {
            if (action !== exceptAction && this.currentControls[action].keyboard) {
                const index = this.currentControls[action].keyboard.indexOf(keyCode);
                if (index > -1) {
                    this.currentControls[action].keyboard.splice(index, 1);
                }
            }
        }
    }
    
    /**
     * Remove a gamepad control from all actions except the specified one
     */
    removeGamepadControl(buttonIndex, exceptAction = null) {
        for (const action in this.currentControls) {
            if (action !== exceptAction && this.currentControls[action].gamepad) {
                const index = this.currentControls[action].gamepad.indexOf(buttonIndex);
                if (index > -1) {
                    this.currentControls[action].gamepad.splice(index, 1);
                }
            }
        }
    }
    
    /**
     * Check if a keyboard key is currently bound to any action
     */
    isKeyboardKeyBound(keyCode) {
        for (const action in this.currentControls) {
            if (this.currentControls[action].keyboard?.includes(keyCode)) {
                return action;
            }
        }
        return null;
    }
    
    /**
     * Check if a gamepad button is currently bound to any action
     */
    isGamepadButtonBound(buttonIndex) {
        for (const action in this.currentControls) {
            if (this.currentControls[action].gamepad?.includes(buttonIndex)) {
                return action;
            }
        }
        return null;
    }
    
    /**
     * Get a human-readable name for a keyboard key
     */
    getKeyDisplayName(keyCode) {
        const keyNames = {
            'Space': 'Space',
            'Enter': 'Enter',
            'Escape': 'Esc',
            'Backspace': 'Backspace',
            'Tab': 'Tab',
            'ShiftLeft': 'Shift',
            'ShiftRight': 'R-Shift',
            'ControlLeft': 'Ctrl',
            'ControlRight': 'R-Ctrl',
            'AltLeft': 'Alt',
            'AltRight': 'R-Alt',
            'ArrowUp': '↑',
            'ArrowDown': '↓',
            'ArrowLeft': '←',
            'ArrowRight': '→',
            'KeyA': 'A', 'KeyB': 'B', 'KeyC': 'C', 'KeyD': 'D', 'KeyE': 'E',
            'KeyF': 'F', 'KeyG': 'G', 'KeyH': 'H', 'KeyI': 'I', 'KeyJ': 'J',
            'KeyK': 'K', 'KeyL': 'L', 'KeyM': 'M', 'KeyN': 'N', 'KeyO': 'O',
            'KeyP': 'P', 'KeyQ': 'Q', 'KeyR': 'R', 'KeyS': 'S', 'KeyT': 'T',
            'KeyU': 'U', 'KeyV': 'V', 'KeyW': 'W', 'KeyX': 'X', 'KeyY': 'Y',
            'KeyZ': 'Z',
            'Digit0': '0', 'Digit1': '1', 'Digit2': '2', 'Digit3': '3', 'Digit4': '4',
            'Digit5': '5', 'Digit6': '6', 'Digit7': '7', 'Digit8': '8', 'Digit9': '9',
            'F1': 'F1', 'F2': 'F2', 'F3': 'F3', 'F4': 'F4', 'F5': 'F5',
            'F6': 'F6', 'F7': 'F7', 'F8': 'F8', 'F9': 'F9', 'F10': 'F10',
            'F11': 'F11', 'F12': 'F12'
        };
        
        return keyNames[keyCode] || keyCode.replace('Key', '').replace('Digit', '');
    }
    
    /**
     * Get gamepad button info for visual display (diamond layout + others)
     */
    getGamepadButtonInfo(buttonIndex) {
        // Face buttons use diamond layout visual
        if (buttonIndex >= 0 && buttonIndex <= 3) {
            return {
                type: 'diamond',
                position: buttonIndex, // 0=bottom, 1=right, 2=left, 3=top
                label: ['A', 'B', 'X', 'Y'][buttonIndex]
            };
        }
        
        // Other buttons use simple labels
        const buttonLabels = {
            4: 'L1', 5: 'R1', 6: 'L2', 7: 'R2',
            8: 'Select', 9: 'Start',
            10: 'L3', 11: 'R3',
            12: 'D↑', 13: 'D↓', 14: 'D←', 15: 'D→'
        };
        
        return {
            type: 'label',
            label: buttonLabels[buttonIndex] || `B${buttonIndex}`
        };
    }
    
    /**
     * Get all available actions with their display names
     */
    getActionList() {
        return [
            { id: 'moveLeft', name: 'Move Left', category: 'Gameplay' },
            { id: 'moveRight', name: 'Move Right', category: 'Gameplay' },
            { id: 'softDrop', name: 'Soft Drop', category: 'Gameplay' },
            { id: 'hardDrop', name: 'Hard Drop', category: 'Gameplay' },
            { id: 'rotateCW', name: 'Rotate Clockwise', category: 'Gameplay' },
            { id: 'rotateCCW', name: 'Rotate Counter-Clockwise', category: 'Gameplay' },
            { id: 'hold', name: 'Hold Piece', category: 'Gameplay' },
            { id: 'themeChange', name: 'Change Theme', category: 'Global' },
            { id: 'targetSelect', name: 'Target Select', category: 'Global' },
            { id: 'pause', name: 'Pause Game', category: 'Global' }
        ];
    }
}
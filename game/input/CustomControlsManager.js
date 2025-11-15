/**
 * CustomControlsManager - Manages custom key bindings for Tetris
 * Handles saving/loading from localStorage and provides APIs for rebinding
 */
class CustomControlsManager {
    constructor() {
        this.defaultControls = {
            // Gameplay controls - each slot can have button or axis
            moveLeft: {
                keyboard: { primary: "KeyA", alt: "ArrowLeft" },
                gamepad: {
                    primary: { type: 'button', value: 14 }, // D-pad left
                    alt: { type: 'axis', value: { index: 0, direction: 'negative' } } // Left stick left
                }
            },
            moveRight: {
                keyboard: { primary: "KeyD", alt: "ArrowRight" },
                gamepad: {
                    primary: { type: 'button', value: 15 }, // D-pad right
                    alt: { type: 'axis', value: { index: 0, direction: 'positive' } } // Left stick right
                }
            },
            softDrop: {
                keyboard: { primary: "KeyS", alt: "ArrowDown" },
                gamepad: {
                    primary: { type: 'button', value: 13 }, // D-pad down
                    alt: { type: 'axis', value: { index: 1, direction: 'positive' } } // Left stick down
                }
            },
            hardDrop: {
                keyboard: { primary: "KeyW", alt: "ArrowUp" },
                gamepad: {
                    primary: { type: 'button', value: 12 }, // D-pad up
                    alt: { type: 'axis', value: { index: 1, direction: 'negative' } } // Left stick up
                }
            },
            rotateCW: {
                keyboard: { primary: "Space", alt: "KeyJ" },
                gamepad: {
                    primary: { type: 'button', value: 0 }, // A/Cross
                    alt: null
                }
            },
            rotateCCW: {
                keyboard: { primary: "ShiftLeft", alt: "KeyK" },
                gamepad: {
                    primary: { type: 'button', value: 1 }, // B/Circle
                    alt: null
                }
            },
            hold: {
                keyboard: { primary: "KeyE", alt: "KeyZ" },
                gamepad: {
                    primary: { type: 'button', value: 4 }, // L1
                    alt: { type: 'button', value: 5 } // R1
                }
            },
            themeChange: {
                keyboard: { primary: "KeyZ", alt: "KeyF" },
                gamepad: {
                    primary: { type: 'button', value: 2 }, // X/Square
                    alt: null
                }
            },
            targetSelect: {
                keyboard: { primary: "KeyQ", alt: "KeyG" },
                gamepad: {
                    primary: { type: 'button', value: 3 }, // Y/Triangle
                    alt: null
                }
            },
            pause: {
                keyboard: { primary: "KeyC", alt: "KeyP" },
                gamepad: {
                    primary: { type: 'button', value: 9 }, // Start button
                    alt: null
                }
            }
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
                // Merge keyboard objects
                if (saved[action].keyboard && typeof saved[action].keyboard === 'object') {
                    merged[action].keyboard = { ...merged[action].keyboard, ...saved[action].keyboard };
                }
                // Merge gamepad objects
                if (saved[action].gamepad && typeof saved[action].gamepad === 'object') {
                    merged[action].gamepad = { ...merged[action].gamepad, ...saved[action].gamepad };
                }
            }
        }

        return merged;
    }
    
    /**
     * Get all key bindings for an action
     */
    getControls(action) {
        return this.currentControls[action] || { keyboard: { primary: null, alt: null }, gamepad: { primary: null, alt: null } };
    }

    /**
     * Get keyboard bindings for an action
     */
    getKeyboardControls(action) {
        const controls = this.currentControls[action];
        if (!controls?.keyboard) return [];
        return [controls.keyboard.primary, controls.keyboard.alt].filter(k => k !== null);
    }

    /**
      * Get gamepad bindings for an action
      */
     getGamepadControls(action) {
         const controls = this.currentControls[action];
         if (!controls?.gamepad) return [];
         const result = [];
         if (controls.gamepad.primary?.type === 'button') result.push(controls.gamepad.primary.value);
         if (controls.gamepad.alt?.type === 'button') result.push(controls.gamepad.alt.value);
         return result;
     }

     /**
      * Get axis bindings for an action
      */
     getAxisControls(action) {
         const controls = this.currentControls[action];
         if (!controls?.gamepad) return null;
         if (controls.gamepad.primary?.type === 'axis') return controls.gamepad.primary.value;
         if (controls.gamepad.alt?.type === 'axis') return controls.gamepad.alt.value;
         return null;
     }
    
    /**
     * Set keyboard binding for an action
     */
    setKeyboardControl(action, keyCode, slot = 'primary') {
        if (!this.currentControls[action]) {
            this.currentControls[action] = {
                keyboard: { primary: null, alt: null },
                gamepad: { primary: null, alt: null }
            };
        }

        // Remove this key from any other actions first to prevent conflicts
        this.removeKeyboardControl(keyCode, action);

        // Also remove from the same action's other slot to prevent duplicates within the same action
        const actionKeyboard = this.currentControls[action].keyboard;
        if (slot === 'primary' && actionKeyboard.alt === keyCode) {
            actionKeyboard.alt = null;
        } else if (slot === 'alt' && actionKeyboard.primary === keyCode) {
            actionKeyboard.primary = null;
        }

        // Set binding in the specified slot
        this.currentControls[action].keyboard[slot] = keyCode;

        this.saveControls();
        console.log(`[CustomControlsManager] Set ${slot} keyboard control for ${action}: ${keyCode}`);
    }

    /**
     * Set gamepad binding for an action
     */
    setGamepadControl(action, buttonIndex, slot = 'primary') {
        if (!this.currentControls[action]) {
            this.currentControls[action] = {
                keyboard: { primary: null, alt: null },
                gamepad: { primary: null, alt: null }
            };
        }

        // Remove this button from any other actions and slots first to prevent conflicts
        this.removeGamepadControl(buttonIndex, action);

        // Also remove from the same action's other slot to prevent duplicates within the same action
        const actionGamepad = this.currentControls[action].gamepad;
        if (slot === 'primary' && actionGamepad.alt?.type === 'button' && actionGamepad.alt.value === buttonIndex) {
            actionGamepad.alt = null;
        } else if (slot === 'alt' && actionGamepad.primary?.type === 'button' && actionGamepad.primary.value === buttonIndex) {
            actionGamepad.primary = null;
        }

        // Set binding in the specified slot
        this.currentControls[action].gamepad[slot] = { type: 'button', value: buttonIndex };

        this.saveControls();
        console.log(`[CustomControlsManager] Set ${slot} gamepad control for ${action}: Button ${buttonIndex}`);
    }

    /**
     * Set axis binding for an action
     */
    setAxisControl(action, axisIndex, direction = 'positive', slot = 'primary') {
        if (!this.currentControls[action]) {
            this.currentControls[action] = {
                keyboard: { primary: null, alt: null },
                gamepad: { primary: null, alt: null }
            };
        }

        // Remove this axis from any other actions first to prevent conflicts
        this.removeAxisControl(axisIndex, direction, action);

        // Set axis binding - ONLY allow one axis per action (replace any existing axis binding)
        const actionGamepad = this.currentControls[action].gamepad;

        // Clear any existing axis bindings in this action
        if (actionGamepad.primary?.type === 'axis') {
            actionGamepad.primary = null;
        }
        if (actionGamepad.alt?.type === 'axis') {
            actionGamepad.alt = null;
        }

        // Set the new axis binding in the specified slot
        actionGamepad[slot] = {
            type: 'axis',
            value: { index: axisIndex, direction: direction }
        };

        this.saveControls();
        console.log(`[CustomControlsManager] Set ${slot} axis control for ${action}: Axis ${axisIndex} (${direction})`);
    }

    /**
     * Remove a keyboard control from all actions except the specified one
     */
    removeKeyboardControl(keyCode, exceptAction = null) {
        for (const action in this.currentControls) {
            if (action !== exceptAction && this.currentControls[action].keyboard) {
                const keyboard = this.currentControls[action].keyboard;
                if (keyboard.primary === keyCode) {
                    keyboard.primary = null;
                }
                if (keyboard.alt === keyCode) {
                    keyboard.alt = null;
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
                const gamepad = this.currentControls[action].gamepad;
                if (gamepad.primary?.type === 'button' && gamepad.primary.value === buttonIndex) {
                    gamepad.primary = null;
                }
                if (gamepad.alt?.type === 'button' && gamepad.alt.value === buttonIndex) {
                    gamepad.alt = null;
                }
            }
        }
    }

    /**
     * Remove an axis control from all actions except the specified one
     */
    removeAxisControl(axisIndex, direction, exceptAction = null) {
        for (const action in this.currentControls) {
            if (action !== exceptAction && this.currentControls[action].gamepad) {
                const gamepad = this.currentControls[action].gamepad;
                if (gamepad.primary?.type === 'axis' &&
                    gamepad.primary.value.index === axisIndex &&
                    gamepad.primary.value.direction === direction) {
                    gamepad.primary = null;
                }
                if (gamepad.alt?.type === 'axis' &&
                    gamepad.alt.value.index === axisIndex &&
                    gamepad.alt.value.direction === direction) {
                    gamepad.alt = null;
                }
            }
        }
    }
    
    /**
     * Check if a keyboard key is currently bound to any action
     */
    isKeyboardKeyBound(keyCode) {
        for (const action in this.currentControls) {
            const keyboard = this.currentControls[action].keyboard;
            if (keyboard?.primary === keyCode || keyboard?.alt === keyCode) {
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
            const gamepad = this.currentControls[action].gamepad;
            if (gamepad?.primary?.type === 'button' && gamepad.primary.value === buttonIndex) {
                return action;
            }
            if (gamepad?.alt?.type === 'button' && gamepad.alt.value === buttonIndex) {
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
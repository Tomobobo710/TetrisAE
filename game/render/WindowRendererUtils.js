/**
 * WindowRendererUtils - Shared utilities for window rendering
 * Contains common drawing methods used across all window renderers
 */
class WindowRendererUtils {
    constructor(ctx, utils) {
        this.ctx = ctx;
        this.utils = utils;
    }

    /**
     * Draw a rounded rectangle
     */
    roundRect(x, y, width, height, radius) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    /**
     * Create a gradient for window backgrounds
     */
    createWindowBackgroundGradient(x, y, width, height, theme) {
        const gradient = this.ctx.createLinearGradient(x, y, x, y + height);
        gradient.addColorStop(0, theme.ui.background);
        gradient.addColorStop(1, this.utils.darkenColor(theme.ui.background, 0.4));
        return gradient;
    }

    /**
     * Create a gradient for title bars
     */
    createTitleBarGradient(x, y, width, height, theme) {
        const gradient = this.ctx.createLinearGradient(x, y, x, y + height);
        gradient.addColorStop(0, theme.ui.accent);
        gradient.addColorStop(1, this.utils.darkenColor(theme.ui.accent, 0.3));
        return gradient;
    }

    /**
     * Create a gradient for modal backgrounds
     */
    createModalBackgroundGradient(x, y, width, height, theme) {
        const gradient = this.ctx.createLinearGradient(x, y, x, y + height);
        gradient.addColorStop(0, theme.ui.background);
        gradient.addColorStop(1, this.utils.darkenColor(theme.ui.background, 0.4));
        return gradient;
    }

    /**
     * Create a gradient for modal title bars
     */
    createModalTitleBarGradient(x, y, width, height, theme) {
        const gradient = this.ctx.createLinearGradient(x, y, x, y + height);
        gradient.addColorStop(0, theme.ui.accent);
        gradient.addColorStop(1, this.utils.darkenColor(theme.ui.accent, 0.3));
        return gradient;
    }

    /**
     * Draw window border with glow effect
     */
    drawWindowBorder(x, y, width, height, theme) {
        const ctx = this.ctx;
        ctx.strokeStyle = theme.ui.border;
        ctx.lineWidth = 3;
        ctx.shadowColor = theme.ui.border;
        ctx.shadowBlur = 15;
        ctx.strokeRect(x, y, width, height);
        ctx.shadowBlur = 0;
    }

    /**
     * Draw window inner border
     */
    drawWindowInnerBorder(x, y, width, height, theme) {
        const ctx = this.ctx;
        ctx.strokeStyle = this.utils.lightenColor(theme.ui.border, 0.3);
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 3, y + 3, width - 6, height - 6);
    }

    /**
     * Draw modal border with glow effect
     */
    drawModalBorder(x, y, width, height, theme) {
        const ctx = this.ctx;
        ctx.strokeStyle = theme.ui.border;
        ctx.lineWidth = 3;
        ctx.shadowColor = theme.ui.border;
        ctx.shadowBlur = 15;
        ctx.strokeRect(x, y, width, height);
        ctx.shadowBlur = 0;
    }

    /**
     * Draw modal inner border
     */
    drawModalInnerBorder(x, y, width, height, theme) {
        const ctx = this.ctx;
        ctx.strokeStyle = this.utils.lightenColor(theme.ui.border, 0.3);
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 3, y + 3, width - 6, height - 6);
    }

    /**
     * Draw a styled window button
     */
    drawWindowButton(x, y, width, height, text, isSelected, depth, theme) {
        const ctx = this.ctx;

        // Shadow
        if (isSelected) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
            ctx.fillRect(x + depth + 2, y + depth + 2, width, height);
        } else {
            ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
            ctx.fillRect(x + depth, y + depth, width, height);
        }

        // Gradient background
        const gradient = this.ctx.createLinearGradient(x, y, x, y + height);
        if (isSelected) {
            gradient.addColorStop(0, this.utils.lightenColor(theme.ui.accent, 0.6));
            gradient.addColorStop(1, theme.ui.accent);
        } else {
            gradient.addColorStop(0, theme.ui.accent);
            gradient.addColorStop(1, this.utils.darkenColor(theme.ui.accent, 0.3));
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, width, height);

        // Highlight
        if (isSelected) {
            const highlightGradient = this.ctx.createLinearGradient(x, y, x, y + height * 0.6);
            highlightGradient.addColorStop(0, "rgba(255, 255, 255, 0.7)");
            highlightGradient.addColorStop(1, "rgba(255, 255, 255, 0.1)");
            ctx.fillStyle = highlightGradient;
            ctx.fillRect(x, y, width, height * 0.6);
        }

        // Border
        if (isSelected) {
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, width, height);
            ctx.strokeStyle = this.utils.darkenColor(theme.ui.accent, 0.5);
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);
        } else {
            ctx.strokeStyle = this.utils.darkenColor(theme.ui.accent, 0.4);
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);
        }

        // Text
        ctx.fillStyle = isSelected ? "#000000" : "#ffffff";
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        if (isSelected) {
            ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
            ctx.shadowBlur = 8;
        }
        ctx.fillText(text, x + width / 2, y + height / 2);
        if (isSelected) {
            ctx.shadowBlur = 0;
        }
    }

    /**
     * Draw a toggle button for options
     */
    drawToggleButton(x, y, width, height, isSelected, settingValue, settingType, theme) {
        const ctx = this.ctx;
        const depth = 3;
        const isEnabled = settingType === "cycle" ? true : settingValue;

        // Shadow
        if (isSelected) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
            ctx.fillRect(x + depth + 2, y + depth + 2, width, height);
        } else {
            ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
            ctx.fillRect(x + depth, y + depth, width, height);
        }

        // Gradient background
        const gradient = this.ctx.createLinearGradient(x, y, x, y + height);
        if (isSelected) {
            gradient.addColorStop(0, this.utils.lightenColor(theme.ui.accent, 0.6));
            gradient.addColorStop(1, theme.ui.accent);
        } else if (isEnabled) {
            gradient.addColorStop(0, theme.ui.accent);
            gradient.addColorStop(1, this.utils.darkenColor(theme.ui.accent, 0.3));
        } else {
            gradient.addColorStop(0, this.utils.darkenColor(theme.ui.background, 0.3));
            gradient.addColorStop(1, this.utils.darkenColor(theme.ui.background, 0.5));
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, width, height);

        // Highlight
        if (isSelected) {
            const highlightGradient = this.ctx.createLinearGradient(x, y, x, y + height * 0.6);
            highlightGradient.addColorStop(0, "rgba(255, 255, 255, 0.7)");
            highlightGradient.addColorStop(1, "rgba(255, 255, 255, 0.1)");
            ctx.fillStyle = highlightGradient;
            ctx.fillRect(x, y, width, height * 0.6);
        }

        // Border
        if (isSelected) {
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, width, height);
            ctx.strokeStyle = this.utils.darkenColor(theme.ui.accent, 0.5);
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);
        } else {
            ctx.strokeStyle = this.utils.darkenColor(theme.ui.accent, 0.4);
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);
        }

        // Text
        ctx.fillStyle = isSelected ? "#000000" : "#ffffff";
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";
        if (isSelected) {
            ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
            ctx.shadowBlur = 8;
        }

        // Handle different setting types
        if (settingType === "cycle") {
            const displayValue = settingValue.charAt(0).toUpperCase() + settingValue.slice(1);
            ctx.fillText(displayValue, x + width / 2, y + height / 2 + 5);
        } else {
            ctx.fillText(isEnabled ? "ON" : "OFF", x + width / 2, y + height / 2 + 5);
        }

        if (isSelected) {
            ctx.shadowBlur = 0;
        }
    }

    /**
     * Get keyboard key display name
     */
    getKeyboardKeyDisplayName(keyCode) {
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
     * Get gamepad button display label
     */
    getGamepadButtonDisplayLabel(buttonIndex) {
        // Face buttons use diamond layout visual - return labels
        if (buttonIndex >= 0 && buttonIndex <= 3) {
            return ['A', 'B', 'X', 'Y'][buttonIndex];
        }

        // Other buttons use simple labels
        const buttonLabels = {
            4: 'L1', 5: 'R1', 6: 'L2', 7: 'R2',
            8: 'Select', 9: 'Start',
            10: 'L3', 11: 'R3',
            12: '↑', 13: '↓', 14: '←', 15: '→'
        };

        return buttonLabels[buttonIndex] || `B${buttonIndex}`;
    }

    /**
     * Get axis display label
     */
    getAxisDisplayLabel(axis) {
        if (!axis) return "---";

        // Standard gamepad axis mapping
        const axisLabels = {
            0: { // Left stick X
                'positive': '(LS) →',
                'negative': '(LS) ←'
            },
            1: { // Left stick Y
                'positive': '(LS) ↓',
                'negative': '(LS) ↑'
            },
            2: { // Right stick X
                'positive': '(RS) →',
                'negative': '(RS) ←'
            },
            3: { // Right stick Y
                'positive': '(RS) ↓',
                'negative': '(RS) ↑'
            }
        };

        const axisInfo = axisLabels[axis.index];
        if (axisInfo) {
            return axisInfo[axis.direction] || `A${axis.index}?`;
        }

        return `A${axis.index}${axis.direction === 'positive' ? '+' : axis.direction === 'negative' ? '-' : '?'}`;
    }

    /**
     * Get control display text
     */
    getControlDisplayText(control) {
        if (!control) return "---";

        if (typeof control === 'string') {
            // Keyboard key - use the manager's display names
            return this.getKeyboardKeyDisplayName(control);
        } else if (typeof control === 'number') {
            // Gamepad button - use the manager's visual display
            return this.getGamepadButtonDisplayLabel(control);
        } else if (typeof control === 'object' && control.type === 'button') {
            // Button object - extract value
            return this.getGamepadButtonDisplayLabel(control.value);
        } else if (typeof control === 'object' && control.type === 'axis') {
            // Axis object - extract value for display
            return this.getAxisDisplayLabel(control.value);
        }

        return "---";
    }
}
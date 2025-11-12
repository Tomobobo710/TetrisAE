/**
 * BaseTheme - Foundation class for all visual themes
 */
class BaseTheme {
    /**
     * Extract hue from hex color
     */
    extractHue(color) {
        if (color.includes('#')) {
            const hex = color.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16) / 255;
            const g = parseInt(hex.substr(2, 2), 16) / 255;
            const b = parseInt(hex.substr(4, 2), 16) / 255;
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const delta = max - min;
            if (delta === 0) return 180;
            let h = 0;
            if (max === r) h = ((g - b) / delta) % 6;
            else if (max === g) h = (b - r) / delta + 2;
            else h = (r - g) / delta + 4;
            return Math.round(h * 60);
        }
        return 180;
    }

    constructor() {
        this.name = 'Base Theme';
        this.playfield = {
            background: 'rgba(0, 0, 0, 0.95)',
            border: '#ffffff',
            grid: 'rgba(255, 255, 255, 0.1)',
            shadow: 'rgba(255, 255, 255, 0.3)'
        };
        this.pieces = {
             I: { base: '#00ffff', glow: '#00ffff', shadow: '#008888' },
             O: { base: '#ffff00', glow: '#ffff00', shadow: '#888800' },
             T: { base: '#ff00ff', glow: '#ff00ff', shadow: '#880088' },
             S: { base: '#00ff00', glow: '#00ff00', shadow: '#008800' },
             Z: { base: '#ff0000', glow: '#ff0000', shadow: '#880000' },
             J: { base: '#0000ff', glow: '#0000ff', shadow: '#000088' },
             L: { base: '#ff8800', glow: '#ff8800', shadow: '#884400' },
             garbage: { base: '#666666', glow: '#666666', shadow: '#444444' }
         };
        this.ui = {
            background: 'rgba(0, 0, 0, 0.9)',
            text: '#ffffff',
            accent: '#ffffff',
            border: '#ffffff'
        };
        this.background = {
            type: 'none',
            colors: ['#ffffff'],
            intensity: 0.5
        };
        this.animationTime = 0;

        // Animated UI colors system
        this.uiAnimation = {
            phase: 0,
            speed: 0.5, // Base animation speed
            colors: ['#ffffff'], // Default fallback
            enabled: false // Themes can enable this
        };

        // Shared visual elements (waves moved to Ocean theme)
    }

    /**
     * Setup/warm-start the theme - run initial updates to populate visual state
     * Override this in child themes to fast-forward animations
     */
    setup() {
        // Base implementation does nothing
        // Child themes can override to run multiple update cycles
    }

    /**
     * Optional hook: allow themes to provide dynamic per-piece colors.
     *
     * Any theme can override this to derive tetromino colors from its own
     * internal state (e.g. tunnel palette, matrix rain, etc).
     *
     * Return:
     * - null/undefined to fall back to this.pieces[pieceType]
     * - or an object: { base, glow, shadow }
     *
     * @param {string} pieceType - "I","O","T","S","Z","J","L","garbage"
     * @param {Object} context   - {
     *      source: "playfield" | "hold" | "next" | "ghost" | "locked",
     *      alpha?: number,
     *      index?: number
     *   }
     */
    getDynamicPieceColors(pieceType, context) {
        return null;
    }

    /**
     * Optional hook: allow themes to provide dynamic UI accent colors.
     *
     * Used for labels, frames, score text, etc., so a theme can keep HUD
     * elements visually in sync with its background/effects.
     *
     * Return:
     * - null/undefined to fall back to this.ui.accent
     * - or a CSS color string.
     *
     * @param {Object} context - {
     *      role: "label" | "frame" | "score" | "lines" | "level" | "misc",
     *      source: "hold" | "next" | "score" | "system"
     *   }
     */
    getDynamicUIAccent(context) {
        return null;
    }





    update(deltaTime) {
        this.animationTime += deltaTime;

        // Update animated UI colors if enabled
        if (this.uiAnimation.enabled) {
            this.updateAnimatedUI(deltaTime);
        }

        // Update shared visual elements
        this.updateSharedVisuals(deltaTime);
    }

    /**
      * Update shared visual elements (waves, etc.)
      */
    updateSharedVisuals(deltaTime) {
        // Update shared visual elements (no particles - Crystal theme only)

    }

    drawBackground(ctx, opacity) {
        // Base implementation - no background
    }



    lightenColor(color, factor) {
        if (color.startsWith('rgba')) return color;
        const hex = color.replace('#', '');
        const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + (255 - parseInt(hex.substr(0, 2), 16)) * factor);
        const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + (255 - parseInt(hex.substr(2, 2), 16)) * factor);
        const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + (255 - parseInt(hex.substr(4, 2), 16)) * factor);
        return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
    }

    darkenColor(color, factor) {
        if (color.startsWith('rgba')) return color;
        const hex = color.replace('#', '');
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) * (1 - factor));
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) * (1 - factor));
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) * (1 - factor));
        return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
    }

    /**
     * Update animated UI colors (can be overridden by themes)
     */
    updateAnimatedUI(deltaTime) {
        const anim = this.uiAnimation;

        if (!anim.enabled || anim.colors.length < 2) return;

        // Update animation phase
        anim.phase += anim.speed * deltaTime;

        // Get current color index
        const colorIndex = Math.floor(anim.phase) % anim.colors.length;

        // Get current color and next color for smooth interpolation
        const currentColor = anim.colors[colorIndex];
        const nextColor = anim.colors[(colorIndex + 1) % anim.colors.length];

        // Calculate interpolation factor (0-1)
        const lerpFactor = anim.phase - Math.floor(anim.phase);

        // Interpolate between colors
        const animatedColor = this.interpolateColor(currentColor, nextColor, lerpFactor);

        // Apply animated color to UI elements
        this.ui.accent = animatedColor;
        this.ui.border = animatedColor;
        this.playfield.border = animatedColor;
        this.playfield.shadow = animatedColor.replace('rgb', 'rgba').replace(')', ', 0.4)');
    }

    /**
     * Interpolate between two hex colors
     */
    interpolateColor(color1, color2, factor) {
        // Convert hex to RGB
        const r1 = parseInt(color1.slice(1, 3), 16);
        const g1 = parseInt(color1.slice(3, 5), 16);
        const b1 = parseInt(color1.slice(5, 7), 16);

        const r2 = parseInt(color2.slice(1, 3), 16);
        const g2 = parseInt(color2.slice(3, 5), 16);
        const b2 = parseInt(color2.slice(5, 7), 16);

        // Linear interpolation
        const r = Math.round(r1 + (r2 - r1) * factor);
        const g = Math.round(g1 + (g2 - g1) * factor);
        const b = Math.round(b1 + (b2 - b1) * factor);

        // Convert back to hex
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
}
/**
 * DefaultTheme - Simple, clean theme with static colors and no animations
 */
class DefaultTheme extends BaseTheme {
    constructor() {
        super();
        this.name = 'Default';

        // Blue gradient background colors
        this.playfield = {
            background: 'rgba(0, 0, 0, 0.95)',
            border: '#4a9eff',
            grid: 'rgba(74, 158, 255, 0.15)',
            shadow: 'rgba(74, 158, 255, 0.3)'
        };

        // Classic Tetris piece colors - adjusted for blue theme
        this.pieces = {
             I: { base: '#00f5ff', glow: '#4a9eff', shadow: '#008888' }, // Cyan with blue glow
             O: { base: '#f6ff00', glow: '#4a9eff', shadow: '#888800' }, // Yellow with blue glow
             T: { base: '#a000ff', glow: '#4a9eff', shadow: '#550088' }, // Purple with blue glow
             S: { base: '#00f900', glow: '#4a9eff', shadow: '#008800' }, // Green with blue glow
             Z: { base: '#ff0000', glow: '#4a9eff', shadow: '#880000' }, // Red with blue glow
             J: { base: '#0000ff', glow: '#4a9eff', shadow: '#000088' }, // Blue with blue glow
             L: { base: '#ff9500', glow: '#4a9eff', shadow: '#884400' }, // Orange with blue glow
             garbage: { base: '#666666', glow: '#666666', shadow: '#444444' } // Gray for garbage blocks
         };

        // Grey-blue UI theme
        this.ui = {
            background: 'rgba(0, 0, 0, 0.9)',
            text: '#ffffff',
            accent: '#4a9eff',  // Blue accent for buttons
            border: '#4a9eff'
        };

        // Blue gradient background
        this.background = {
            type: 'gradient',
            colors: ['#000000', '#1e3a5f', '#4a9eff'], // Black to dark blue to light blue
            intensity: 1.0
        };

        // Disable animated UI colors
        this.uiAnimation.enabled = false;
    }

    /**
     * Setup - no animation to fast-forward
     */
    setup() {
        // No setup needed for static theme
    }

    /**
     * Update - minimal updates since nothing animates
     */
    update(deltaTime) {
        // Don't call super.update() to avoid animation updates
        // No animations to update in this simple theme
    }

    /**
     * Draw blue gradient background
     */
    drawBackground(ctx, opacity) {
        ctx.save();
        ctx.globalAlpha = opacity;

        // Create gradient from black to blue
        const gradient = ctx.createLinearGradient(0, 0, 0, TETRIS.HEIGHT);
        gradient.addColorStop(0, '#000000');      // Black at top
        gradient.addColorStop(0.6, '#1e3a5f');   // Dark blue in middle
        gradient.addColorStop(1, '#4a9eff');     // Light blue at bottom

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, TETRIS.WIDTH, TETRIS.HEIGHT);
        ctx.restore();
    }
}
/**
 * ThemeRenderer - Handles dynamic theme-based background visualizations
 */
class ThemeRenderer {
    constructor() {
        this.animationTime = 0;
        this.opacity = 0.8;
    }

    /**
     * Update background visuals
     */
    update(deltaTime, theme) {
        this.animationTime += deltaTime;

        // Update theme-specific animations
        if (theme && theme.update) {
            theme.update(deltaTime);
        }
    }

    /**
     * Draw all background effects
     */
    draw(ctx, theme) {
        ctx.save();
        ctx.globalAlpha = this.opacity;

        // Delegate background drawing to theme classes
        if (theme && theme.drawBackground) {
            theme.drawBackground(ctx, this.opacity);
        }

        // Draw shared elements from BaseTheme
        if (theme && theme.drawCrystalParticles) {
            theme.drawCrystalParticles(ctx, this.opacity);
        }

        ctx.restore();
    }
}

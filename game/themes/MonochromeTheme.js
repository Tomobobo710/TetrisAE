/**
 * MonochromeTheme - Clean greyscale theme with pure black background
 */
class MonochromeTheme extends BaseTheme {
    constructor() {
        super();
        this.name = "Monochrome";

        // Pure black background
        this.playfield = {
            background: "rgba(0, 0, 0, 0.7)",
            border: "#ffffff",
            grid: "rgba(255, 255, 255, 0.1)",
            shadow: "rgba(255, 255, 255, 0.3)"
        };

        // Greyscale piece colors - using different shades for distinction
        this.pieces = {
            I: { base: "#ffffff", glow: "#ffffff", shadow: "#cccccc" }, // White
            O: { base: "#eeeeee", glow: "#eeeeee", shadow: "#aaaaaa" }, // Light grey
            T: { base: "#dddddd", glow: "#dddddd", shadow: "#999999" }, // Medium light grey
            S: { base: "#cccccc", glow: "#cccccc", shadow: "#888888" }, // Medium grey
            Z: { base: "#aaaaaa", glow: "#aaaaaa", shadow: "#666666" }, // Medium dark grey
            J: { base: "#999999", glow: "#999999", shadow: "#555555" }, // Dark grey
            L: { base: "#666666", glow: "#666666", shadow: "#333333" }, // Darker grey
            garbage: { base: "#555555", glow: "#555555", shadow: "#333333" } // Even darker grey for garbage blocks
        };

        this.ui = {
            background: "rgba(0, 0, 0, 0.99)",
            text: "#ffffff",
            accent: "#ffffff",
            border: "#ffffff"
        };

        this.background = {
            type: "hypnotic_hole",
            colors: ["#ffffff"], // White particles
            intensity: 1.0
        };

        // Initialize hypnotic hole effect with both inward and outward rings
        this.visuals = {
            outwardRings: [], // Existing outward-moving rings
            inwardRings: [], // Inward-moving rings
            holeCenterX: TETRIS.WIDTH / 2,
            holeCenterY: TETRIS.HEIGHT / 2,
            animationTime: 0,
            ringRadius: 80, // Base ring radius
            maxRings: 12, // More rings per direction for denser effect
            centerHoleRadius: 30 // Size of center black hole
        };

        // Create initial rings
        this.createInitialRings();

        // Enable animated UI colors
        this.uiAnimation.enabled = true;
        this.uiAnimation.speed = 0.2; // Slow, elegant feel
        this.uiAnimation.colors = [
            "#ffffff", // White
            "#eeeeee", // Light grey
            "#dddddd", // Medium light grey
            "#cccccc", // Medium grey
            "#aaaaaa", // Medium dark grey
            "#999999", // Dark grey
            "#666666", // Darker grey
            "#ffffff" // White (back)
        ];
    }

    /**
     * Create initial rings for both inward and outward effects
     */
    createInitialRings() {
        // Create outward-moving rings (existing behavior)
        const outwardRings = [];
        for (let i = 0; i < this.visuals.maxRings; i++) {
            outwardRings.push({
                id: i,
                radius: this.visuals.ringRadius,
                opacity: 0,
                width: 20,
                animationProgress: i * (1 / this.visuals.maxRings),
                shadowOpacity: 0,
                direction: "outward"
            });
        }

        // Create inward-moving rings (reverted to better version)
        const inwardRings = [];
        for (let i = 0; i < this.visuals.maxRings; i++) {
            inwardRings.push({
                id: i,
                radius: this.visuals.ringRadius, // Back to starting at ringRadius
                opacity: 0,
                width: 20,
                animationProgress: i * (1 / this.visuals.maxRings),
                shadowOpacity: 0,
                direction: "inward",
                greyValue: 255 // Back to bright white start
            });
        }

        this.visuals.outwardRings = outwardRings;
        this.visuals.inwardRings = inwardRings;
    }

    /**
     * Setup - initialize the hole effect
     */
    setup() {
        // Particles are already created in constructor
        // Run a few animation cycles to warm up the effect
        for (let i = 0; i < 180; i++) {
            // 3 seconds at 60fps
            this.update(1 / 60);
        }
    }

    /**
     * Smooth easing function for better animation
     */
    easeInOut(progress) {
        return progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    }

    /**
     * Update - animate both outward and inward rings
     */
    update(deltaTime) {
        super.update(deltaTime);

        this.visuals.animationTime += deltaTime;

        // Update outward-moving rings (existing behavior)
        this.visuals.outwardRings.forEach((ring) => {
            ring.animationProgress += deltaTime / 3.0;

            if (ring.animationProgress <= 1.0) {
                const easedProgress = this.easeInOut(ring.animationProgress);

                if (ring.animationProgress <= 0.5) {
                    const progress = ring.animationProgress * 2;
                    const eased = this.easeInOut(progress);

                    const expansion = eased * 60;
                    ring.radius = this.visuals.ringRadius + expansion;
                    ring.opacity = eased * 0.9;
                    ring.width = 20 - eased * 10;
                    ring.shadowOpacity = eased * 0.4;
                } else {
                    const progress = (ring.animationProgress - 0.5) * 2;
                    const eased = this.easeInOut(progress);

                    const expansion = 60 + eased * 40;
                    ring.radius = this.visuals.ringRadius + expansion;
                    ring.opacity = 0.9 * (1.0 - eased);
                    ring.width = 10 - eased * 8;
                    ring.shadowOpacity = 0.4 * (1.0 - eased);
                }
            } else {
                ring.animationProgress = 0;
                ring.radius = this.visuals.ringRadius;
                ring.opacity = 0;
                ring.width = 20;
                ring.shadowOpacity = 0;
            }
        });

        // Update inward-moving rings (new behavior)
        this.visuals.inwardRings.forEach((ring) => {
            ring.animationProgress += deltaTime / 3.0; // Back to 3 second cycle

            if (ring.animationProgress <= 1.0) {
                const easedProgress = this.easeInOut(ring.animationProgress);

                if (ring.animationProgress <= 0.5) {
                    // First half: Ring fades in bright and starts contracting
                    const progress = ring.animationProgress * 2;
                    const eased = this.easeInOut(progress);

                    ring.opacity = eased * 0.8;
                    ring.greyValue = 255; // Stay bright white
                    ring.shadowOpacity = eased * 0.3;
                } else {
                    // Second half: Contract inward and fade to grey/black
                    const progress = (ring.animationProgress - 0.5) * 2;
                    const eased = this.easeInOut(progress);

                    // Contract from outer radius all the way to center
                    const startRadius = this.visuals.ringRadius;
                    const endRadius = 0; // Shrink all the way to center
                    const contraction = eased * startRadius;
                    ring.radius = startRadius - contraction;

                    // Fade from bright to dark and get skinnier
                    const remaining = 1.0 - eased;
                    ring.opacity = 0.8 * remaining;
                    ring.greyValue = 255 * remaining; // Fade to black
                    ring.shadowOpacity = 0.3 * remaining;

                    // Get skinnier as approaching center
                    const maxWidth = 20;
                    const minWidth = 3;
                    ring.width = minWidth + remaining * (maxWidth - minWidth);
                }
            } else {
                // Reset for next cycle
                ring.animationProgress = 0;
                ring.radius = this.visuals.ringRadius; // Back to ringRadius
                ring.opacity = 0;
                ring.greyValue = 255; // Back to bright white
                ring.shadowOpacity = 0;
            }
        });
    }

    /**
     * Draw hypnotic hole effect with dark overlay
     */
    drawBackground(ctx, opacity) {
        ctx.save();

        // Base black background
        ctx.globalAlpha = opacity;
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, TETRIS.WIDTH, TETRIS.HEIGHT);

        // Add dark overlay for atmosphere (drawn after rings)

        // Draw center black hole
        ctx.globalAlpha = opacity;
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.arc(this.visuals.holeCenterX, this.visuals.holeCenterY, this.visuals.centerHoleRadius, 0, Math.PI * 2);
        ctx.fill();

        // Draw outward-moving rings (bright white)
        this.visuals.outwardRings.forEach((ring) => {
            if (ring.opacity > 0) {
                ctx.save();

                ctx.globalAlpha = ring.opacity * opacity;
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = ring.width;

                if (ring.shadowOpacity > 0) {
                    ctx.shadowColor = "#ffffff";
                    ctx.shadowBlur = 8;
                }

                ctx.beginPath();
                ctx.arc(this.visuals.holeCenterX, this.visuals.holeCenterY, ring.radius, 0, Math.PI * 2);
                ctx.stroke();

                ctx.restore();
            }
        });

        // Draw inward-moving rings (fade from white to grey to black)
        this.visuals.inwardRings.forEach((ring) => {
            if (ring.opacity > 0) {
                ctx.save();

                // Create grey color based on animation progress
                const greyHex = Math.floor(ring.greyValue).toString(16).padStart(2, "0");
                const ringColor = `#${greyHex}${greyHex}${greyHex}`;

                ctx.globalAlpha = ring.opacity * opacity;
                ctx.strokeStyle = ringColor;
                ctx.lineWidth = ring.width;

                if (ring.shadowOpacity > 0) {
                    ctx.shadowColor = ringColor;
                    ctx.shadowBlur = 6;
                }

                ctx.beginPath();
                ctx.arc(this.visuals.holeCenterX, this.visuals.holeCenterY, ring.radius, 0, Math.PI * 2);
                ctx.stroke();

                ctx.restore();
            }
        });

        // Add dark overlay for atmosphere (on top of rings)
        ctx.globalAlpha = opacity * 0.6; // More visible overlay
        ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
        ctx.fillRect(0, 0, TETRIS.WIDTH, TETRIS.HEIGHT);

        ctx.restore();
    }
}

/**
 * TunnelTheme
 *
 * Procedural tunnel background inspired by:
 * - tunnelDemo-style radial tunnel techniques
 * - "x-mode" by Justin Greisiger Frost (https://jdfio.com/pages-output/demos/x-mode/ / https://github.com/gneissguise)
 * Uses:
 * - Multiple 128x128 textures (checkerboard, fire/noise, sparks)
 * - Radial tunnel mapping with distance and angle
 * - Section-based texture blending for smooth transitions
 *
 * Integrated as a BaseTheme:
 * - Uses TETRIS.WIDTH / TETRIS.HEIGHT canvas
 * - Updates internal state via update(deltaTime)
 * - Renders via drawBackground(ctx, opacity) without allocations per frame
 *
 */
class TunnelTheme extends BaseTheme {
    constructor() {
        super();
        this.name = "Tunnel";

        // Playfield colors: deep indigo/midnight blue to match a cobalt/x-ray tunnel
        this.playfield = {
            background: "rgba(2, 4, 16, 0.6)",
            border: "#3fa9ff",
            grid: "rgba(63, 169, 255, 0.12)",
            shadow: "rgba(63, 169, 255, 0.35)"
        };

                // Piece colors table is kept only as a fallback. Actual colors for TunnelTheme
                // are driven by getDynamicPieceColors so they track the tunnel palette.
                this.pieces = {
                    I: { base: "#1f8bff", glow: "#7fc4ff", shadow: "#0b3970" },
                    O: { base: "#145dff", glow: "#6da8ff", shadow: "#0a2b66" },
                    T: { base: "#3f9dff", glow: "#99d2ff", shadow: "#17446e" },
                    S: { base: "#1cb5ff", glow: "#7fd8ff", shadow: "#0b4560" },
                    Z: { base: "#5a7bff", glow: "#b3c3ff", shadow: "#28307a" },
                    J: { base: "#1f3dff", glow: "#808dff", shadow: "#0c165e" },
                    L: { base: "#2f6dff", glow: "#88b4ff", shadow: "#16356c" },
                    garbage: { base: "#1a2233", glow: "#3a4c66", shadow: "#0b0f16" }
                };

        // UI: base values; we will drive accent/border dynamically each frame from tunnel color
        this.ui = {
            background: "rgba(1, 3, 10, 0.96)",
            text: "#e5f1ff",
            accent: "#3fa9ff",
            border: "#3fa9ff"
        };

        this.background = {
            type: "tunnel",
            // Order MUST match initTunnelTextures() schemes so section index maps 1:1.
            // 0: cyan/magenta, 1: gold/orange, 2: toxic green, 3: electric blue,
            // 4: pink/purple, 5: steel/teal
            colors: ["#8040ff", "#ffc850", "#80ff80", "#60c0ff", "#ff60ff", "#a0e0e0"],
            intensity: 1.0
        };

        // Animated UI accent: orbit within cobalt / electric blue band
        // NOTE: For Tunnel we now fully drive accents via getDynamicUIAccent/tunnel palette.
        // Keep this enabled but subtle so it doesn't fight the tunnel-driven accent.
        this.uiAnimation.enabled = false;
        this.uiAnimation.speed = 0.2;
        this.uiAnimation.colors = [
            "#3fa9ff",
            "#68bfff",
            "#9cd5ff"
        ];

        // Tunnel state
        this.tunnel = {
            textures: [],
            textureSize: 128,
            distanceOffset: 1024, // Start further into the tunnel for different initial color
            angleOffset: 0,
            sectionLength: 512,
            fadeLength: 256,
            imageData: null,
            lastWidth: 0,
            lastHeight: 0,
            renderScale: 0.5, // Render at half resolution for performance

            // Derived palette state (kept in sync with current tunnel section/blend)
            currentSectionIndex: 0,
            nextSectionIndex: 0,
            sectionBlend: 0
        };

        this.initTunnelTextures();
    }

    /**
     * Initialize tunnel textures: checkerboard, fire-ish noise, spark stripes.
     */
    initTunnelTextures() {
        const texSize = this.tunnel.textureSize;
        const total = texSize * texSize * 4;

        // Pure checkerboard set: multiple color schemes, all 128x128 for bold pixels.
        const schemes = [
            // Classic cyan/magenta-ish
            { a: [64, 32, 128], b: [128, 64, 255] },
            // Warm gold/orange
            { a: [80, 40, 0],   b: [255, 200, 80] },
            // Toxic green
            { a: [16, 64, 16],  b: [128, 255, 128] },
            // Electric blue
            { a: [16, 32, 64],  b: [96, 192, 255] },
            // Pink/purple
            { a: [64, 16, 64],  b: [255, 96, 255] },
            // Steel/teal
            { a: [32, 64, 64],  b: [160, 224, 224] }
        ];

        schemes.forEach(({ a, b }) => {
            const t = new Uint8ClampedArray(total);
            for (let y = 0; y < texSize; y++) {
                for (let x = 0; x < texSize; x++) {
                    const i = (y * texSize + x) * 4;
                    const useB = ((x & 16) ^ (y & 16)) !== 0;
                    const src = useB ? b : a;
                    t[i]     = src[0];
                    t[i + 1] = src[1];
                    t[i + 2] = src[2];
                    t[i + 3] = 255;
                }
            }
            this.tunnel.textures.push(t);
        });
    }

    /**
     * Warm start: advance tunnel so initial frame is interesting.
     */
    setup() {
        const dt = 1 / 60;
        for (let i = 0; i < 120; i++) {
            this.update(dt);
        }
    }

    /**
     * Update tunnel offsets.
     * dt: seconds since last frame.
     */
    update(deltaTime) {
        super.update(deltaTime);

        const t = this.tunnel;

        // Smooth, continuous tunnel motion tuned for gradual palette evolution.
        const depthSpeed = 18;
        const angleSpeed = 0.045;

        t.distanceOffset += deltaTime * depthSpeed;
        t.angleOffset += deltaTime * angleSpeed;

        // Wrap distanceOffset to avoid numerical blowup, but preserve continuity.
        const loopLength = t.sectionLength * t.textures.length;
        if (loopLength > 0 && t.distanceOffset > loopLength * 4) {
            t.distanceOffset = t.distanceOffset % loopLength;
        }

        // After tunnel motion, derive current accent directly from tunnel and
        // push it into ui/playfield so existing renderers pick it up automatically.
        const accent = this.getTunnelAccentColor();
        this.ui.accent = accent;
        this.ui.border = accent;
        this.playfield.border = accent;
        this.playfield.shadow = this.darkenColor(accent, 0.4).replace("rgb(", "rgba(").replace(")", ",0.4)");
    }

    /**
     * Ensure we have an ImageData buffer matching scaled canvas size.
     */
    ensureImageData(ctx, width, height) {
        const t = this.tunnel;
        const scaledWidth = Math.floor(width * t.renderScale);
        const scaledHeight = Math.floor(height * t.renderScale);
        if (!t.imageData || t.lastWidth !== scaledWidth || t.lastHeight !== scaledHeight) {
            t.imageData = ctx.createImageData(scaledWidth, scaledHeight);
            t.lastWidth = scaledWidth;
            t.lastHeight = scaledHeight;
        }
        return t.imageData;
    }

    /**
     * Draw procedural tunnel as background.
     * Uses a CPU imageData write similar to the provided tunnelDemo.
     * Renders at half resolution for performance and upscales.
     */
    drawBackground(ctx, opacity) {
        if (opacity <= 0) return;

        const width = TETRIS.WIDTH;
        const height = TETRIS.HEIGHT;
        const halfW = width / 2;
        const halfH = height / 2;

        const t = this.tunnel;
        const scale = t.renderScale;
        const scaledWidth = Math.floor(width * scale);
        const scaledHeight = Math.floor(height * scale);
        const scaledHalfW = scaledWidth / 2;
        const scaledHalfH = scaledHeight / 2;

        // If textures didn't init, fail safe with solid black instead of breaking theme.
        if (!t || !t.textures || t.textures.length === 0) {
            ctx.save();
            ctx.globalAlpha = opacity;
            ctx.fillStyle = "#000000";
            ctx.fillRect(0, 0, width, height);
            ctx.restore();
            return;
        }

        const imageData = this.ensureImageData(ctx, width, height);
        if (!imageData) {
            ctx.save();
            ctx.globalAlpha = opacity;
            ctx.fillStyle = "#000000";
            ctx.fillRect(0, 0, width, height);
            ctx.restore();
            return;
        }

        const screenData = imageData.data;

        const distOffset = t.distanceOffset;
        const angleOffset = t.angleOffset;

        const sectionLength = t.sectionLength;
        const fadeLength = t.fadeLength;

        const textures = t.textures;
        const texCount = textures.length;
        if (texCount === 0) return;

        const textureSize = t.textureSize;
        const texMask = textureSize - 1;
        const texRowStride = textureSize * 4;

        // Section-based blending between textures:
        // We want a continuous, gradual color morph instead of a hard jump.
        const loopDistance = sectionLength * texCount;
        const wrappedDist = ((distOffset % loopDistance) + loopDistance) % loopDistance;

        const sectionPos = wrappedDist / sectionLength;              // 0 .. texCount
        const baseIndex = Math.floor(sectionPos) % texCount;         // current section
        const localT = sectionPos - Math.floor(sectionPos);          // 0..1 inside this section
        const nextIndex = (baseIndex + 1) % texCount;                // next section

        const textureData1 = textures[baseIndex];
        const textureData2 = textures[nextIndex];

        // Use a smoothstep on localT so the blend eases in/out instead of linear snap.
        const smoothT = localT * localT * (3 - 2 * localT);

        // Cache derived palette state so piece/UI color hooks can follow tunnel colors.
        t.currentSectionIndex = baseIndex;
        t.nextSectionIndex = nextIndex;
        t.sectionBlend = smoothT;

        // Render tunnel pixels at scaled resolution
        // Note: Reduced to ~25% of original pixel count for performance.
        let i = 0;
        for (let y = 0; y < scaledHeight; y++) {
            const dy = (y - scaledHalfH) / scale; // Scale back to original coordinate space
            for (let x = 0; x < scaledWidth; x++, i += 4) {
                const dx = (x - scaledHalfW) / scale;

                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                const angle = Math.atan2(dy, dx) + angleOffset;

                // Map to texture coordinates
                const texU = (angle / (2 * Math.PI)) * textureSize;
                const texV = (width * 8) / dist + distOffset;

                const u = (texU & texMask) | 0;
                const v = (Math.floor(texV) & texMask);
                const texIndex = v * texRowStride + u * 4;

                // Fog: darken toward center so playfield stays readable.
                const fog = Math.min(1.0, dist / (width / 2));

                // Spatial fade: only blend textures strongly away from center to keep
                // playfield readable, but ALWAYS use smoothT so color changes are gradual.
                const radialBlendMask = Math.max(0, 1.0 - dist / (width / 3));
                const finalFade = smoothT * radialBlendMask + smoothT * (1.0 - radialBlendMask);

                const r1 = textureData1[texIndex];
                const g1 = textureData1[texIndex + 1];
                const b1 = textureData1[texIndex + 2];

                const r2 = textureData2[texIndex];
                const g2 = textureData2[texIndex + 1];
                const b2 = textureData2[texIndex + 2];

                const r = (r1 * (1 - finalFade) + r2 * finalFade) * fog;
                const g = (g1 * (1 - finalFade) + g2 * finalFade) * fog;
                const b = (b1 * (1 - finalFade) + b2 * finalFade) * fog;

                // Apply global opacity; alpha fixed to 255 so ThemeRenderer can blend via ctx.globalAlpha.
                screenData[i] = r;
                screenData[i + 1] = g;
                screenData[i + 2] = b;
                screenData[i + 3] = 255;
            }
        }

        // Create a temporary canvas to upscale the ImageData
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = scaledWidth;
        tempCanvas.height = scaledHeight;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.putImageData(imageData, 0, 0);

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.imageSmoothingEnabled = false; // Pixelated upscale for retro look
        ctx.drawImage(tempCanvas, 0, 0, scaledWidth, scaledHeight, 0, 0, width, height);
        ctx.restore();
    }

    /**
     * Derive a smooth "accent" color from current tunnel palette state.
     * This is used as the seed for tetromino/UI colors so they stay in sync with the tunnel.
     */
    getTunnelAccentColor() {
        const t = this.tunnel;
        const bg = this.background;

        // Fallback: static accent if tunnel state not ready
        if (
            !t ||
            !t.textures ||
            t.textures.length === 0 ||
            typeof t.currentSectionIndex !== "number"
        ) {
            return "#3fa9ff";
        }

        // Map tunnel section index directly to background.colors so:
        // - section 1 (warm) => gold/orange accent
        // - section 2 (toxic) => green accent
        // etc.
        const colors = Array.isArray(bg.colors) && bg.colors.length > 0
            ? bg.colors
            : ["#3fa9ff"];

        const texCount = t.textures.length;
        const cIdx = ((t.currentSectionIndex % texCount) + texCount) % texCount;
        const nIdx = ((t.nextSectionIndex % texCount) + texCount) % texCount;
        const blend = Math.max(0, Math.min(1, t.sectionBlend || 0));

        const c = colors[cIdx] || colors[0];
        const n = colors[nIdx] || colors[cIdx] || colors[0];

        // This is the ONE accent everything keys off. When tunnel goes yellow/green,
        // this value actually becomes yellow/green.
        return this.interpolateColor(c, n, blend);
    }

    /**
     * Map piece types to offsets around the tunnel accent hue so each tetromino is distinct
     * but still feels like it's part of the same palette band.
     */
    getPieceHueOffset(pieceType) {
        // Keep distinct shapes but relatively tight so they clearly track accent hue.
        switch (pieceType) {
            case "I": return 0;
            case "O": return 18;
            case "T": return -18;
            case "S": return 36;
            case "Z": return -36;
            case "J": return 64;
            case "L": return -64;
            case "garbage": return 150;
            default: return 0;
        }
    }

    /**
     * Convert hex color to HSL.
     */
    hexToHsl(hex) {
        const c = hex.replace("#", "");
        if (c.length !== 6) return { h: 200, s: 0.4, l: 0.5 };

        const r = parseInt(c.slice(0, 2), 16) / 255;
        const g = parseInt(c.slice(2, 4), 16) / 255;
        const b = parseInt(c.slice(4, 6), 16) / 255;

        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0;
        const l = (max + min) / 2;

        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return { h: h * 360, s, l };
    }

    /**
     * Convert HSL to hex.
     */
    hslToHex(h, s, l) {
        h = ((h % 360) + 360) % 360;
        s = Math.max(0, Math.min(1, s));
        l = Math.max(0, Math.min(1, l));

        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
        const m = l - c / 2;

        let r = 0, g = 0, b = 0;
        if (h < 60) { r = c; g = x; b = 0; }
        else if (h < 120) { r = x; g = c; b = 0; }
        else if (h < 180) { r = 0; g = c; b = x; }
        else if (h < 240) { r = 0; g = x; b = c; }
        else if (h < 300) { r = x; g = 0; b = c; }
        else { r = c; g = 0; b = x; }

        const toHex = (v) => {
            const n = Math.round((v + m) * 255);
            return n.toString(16).padStart(2, "0");
        };

        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    /**
     * TunnelTheme dynamic tetromino color hook.
     * Drives:
     * - playfield pieces
     * - ghost outline (via shadow)
     * - HOLD / NEXT previews (UIRenderUtils)
     */
    getDynamicPieceColors(pieceType, context = {}) {
        // Single source of truth: tunnel accent derived from section index mapping.
        const accent = this.getTunnelAccentColor();
        const { h, s, l } = this.hexToHsl(accent);

        const src = context.source || "playfield";

        // Garbage: dark neutral in same hue space so it doesn't pop.
        if (pieceType === "garbage") {
            const baseHue = h + 150;
            const base = this.hslToHex(baseHue, 0.18, 0.14);
            const glow = this.hslToHex(baseHue, 0.14, 0.22);
            const shadow = this.hslToHex(baseHue, 0.20, 0.06);
            return { base, glow, shadow };
        }

        const offset = this.getPieceHueOffset(pieceType);
        const pieceHue = h + offset;

        let sat;
        let light;

        if (src === "ghost") {
            // Soft, bright, clearly in same hue band.
            sat = 0.25;
            light = 0.86;
        } else if (src === "hold" || src === "next") {
            // Clean HUD colors that still react strongly.
            sat = 0.9;
            light = 0.62;
        } else {
            // Main playfield: strong but not neon.
            sat = 0.95;
            light = 0.55;
        }

        const base = this.hslToHex(pieceHue, sat, light);
        const glow = this.hslToHex(pieceHue, sat, Math.min(1, light + 0.20));
        const shadow = this.hslToHex(pieceHue, sat * 0.9, Math.max(0, light - 0.22));

        return { base, glow, shadow };
    }

    /**
     * TunnelTheme dynamic UI accent hook.
     * Keeps HUD accents in phase with the tunnel palette.
     */
    getDynamicUIAccent(context = {}) {
        const accent = this.getTunnelAccentColor();
        const { h, s, l } = this.hexToHsl(accent);

        const role = context.role || "misc";

        if (role === "label") {
            // Slightly brighter for labels like HOLD/NEXT.
            return this.hslToHex(h, Math.min(1, s + 0.1), Math.min(1, l + 0.15));
        }
        if (role === "score" || role === "level" || role === "lines") {
            // Strong accent for score-related values.
            return this.hslToHex(h, Math.min(1, s + 0.15), Math.min(1, l + 0.1));
        }

        // Default accent close to tunnel accent.
        return accent;
    }
}
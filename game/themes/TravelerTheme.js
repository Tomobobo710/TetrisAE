/**
 * TravelerTheme
 *
 * Based on "Star Traveler" / "demo-traveler" by del / @depp and contributors:
 * https://github.com/depp/demo-traveler
 *
 * Faithful structural port of demo-traveler-trunk/src.js into the theme system.
 *
 * Intent:
 * - Use the SAME mechanics as the Star Traveler code, not a reinterpretation:
 *   - iter()
 *   - fractal()
 *   - color()
 *   - smooth()
 *   - functions[] with:
 *       - foreground star/diamond field with pseudo-3D depth z
 *       - mountain bands built from fractal() heightfields
 *       - cloud overlays
 *       - late singularity at center for time > 7
 * - Run entirely inside drawBackground(ctx, opacity) using the same transform stack:
 *   - Clear
 *   - Translate to center
 *   - Scale to virtual 99x99 space
 *   - Call each function lambda with save/restore around it (as in functions.map)
 * - Integrate minimally with BaseTheme:
 *   - No extra "fx", no UI animation; just expose colors and drawBackground.
 *
 * This is verbose-but-direct, mirroring the golfed demo in readable form.
 */

class TravelerTheme extends BaseTheme {
    constructor() {
        super();
        this.name = "Traveler";

        // Keep theme colors neutral; the demo visuals do the talking.
        this.playfield = {
            background: "rgba(0, 0, 0, 0.98)",
            border: "#ffffff",
            grid: "rgba(255, 255, 255, 0.12)",
            shadow: "rgba(255, 255, 255, 0.3)"
        };

        // High-pastel tetromino colors tuned for the Traveler Trunk palette.
        // Light, airy, and keyed to the warm portal/magenta spectrum.
        this.pieces = {
            I: { base: "#bdf7ff", glow: "#e6fbff", shadow: "#5bb8c9" }, // pastel cyan
            O: { base: "#fff4b3", glow: "#fffbe0", shadow: "#cfae4a" }, // pastel amber/yellow
            T: { base: "#f3c6ff", glow: "#fde7ff", shadow: "#bf80d6" }, // pastel violet
            S: { base: "#c9ffd9", glow: "#ebfff3", shadow: "#7ac596" }, // pastel mint
            Z: { base: "#ffc6cf", glow: "#ffe6eb", shadow: "#d47a88" }, // pastel rose
            J: { base: "#c6d9ff", glow: "#e6f0ff", shadow: "#7f96d6" }, // pastel blue
            L: { base: "#ffe0b8", glow: "#fff0dc", shadow: "#d49a63" }, // pastel orange
            garbage: { base: "#7a7a85", glow: "#a8a8b3", shadow: "#42424a" } // slightly lifted greys
        };

        // Traveler Trunk UI palette:
        // Pull colors directly from the demo's gradient logic so this theme is unmistakable.
        // We bias toward warm amber/magenta portal tones instead of generic cyan.
        this.ui = {
            background: "rgba(4, 2, 10, 0.96)",   // deep cosmic violet
            text: "#fdf7e3",                     // warm pale portal-light
            accent: "#ffbf3b",                   // amber/gold from singularity / mountains
            border: "#ff5ea8"                    // magenta/pink rim from color() blends
        };

        // Background meta palette tied to Star Traveler-style colors:
        this.background = {
            type: "traveler_trunk_star_traveler",
            colors: [
                "#000000", // space
                "#160821", // deep violet
                "#4b1436", // magenta dusk
                "#ffbf3b"  // portal amber
            ],
            intensity: 1.0
        };

        // Animated UI accent: orbit through the same unique warm spectrum used in the background.
        this.uiAnimation.enabled = true;
        this.uiAnimation.speed = 0.42;
        this.uiAnimation.colors = [
            "#ffbf3b", // amber portal
            "#ff8a3b", // orange ridge
            "#ff5ea8", // magenta band
            "#f0a8ff", // pale violet
            "#fdf7e3", // soft highlight
            "#ffbf3b"
        ];

        // Internal time (0..10 loop). We emulate original behavior:
        // time = ((t - zeroTime) / 3000) % 10
        this.time = 0;
        this.loopDuration = 10; // seconds

        // Star glyph approximating the original Path2D star.
        this.starPath = this.createStarPath();

        // Pre-baked lambdas equivalent to functions[] in the demo.
        // We sample randomness once in constructor like original build step.
        this.starFunctions = [];
        this.bandFunctions = [];

        this.buildStarFunctions();
        this.buildBandFunctions();
    }

    /**
     * iter(i, fn) from src.js:
     * Return an array 'a' with size 'i', where a[j] = fn(j).
     */
    iter(count, fn) {
        const out = [];
        for (let j = 0; j < count; j++) {
            out.push(fn(j));
        }
        return out;
    }

    /**
     * fractal(x, y, i):
     * Direct shape: recursive midpoint displacement with depth-scaled noise for i < 5.
     * This is used to generate the terrain silhouette.
     */
    fractal(x0, x1, i) {
        i--;
        if (i >= 0) {
            const mid =
                (x0 + x1) / 2 +
                ((Math.random() - 0.5) * (i < 5) * Math.pow(2, i)) / 2;
            return [
                ...this.fractal(x0, mid, i),
                ...this.fractal(mid, x1, i)
            ];
        }
        return [x0];
    }

    /**
     * color(a, ...b) - literal behavior modeled from src.js:
     *
     * In the golfed code, it:
     * - forces a >= 0 (via a *= a > 0)
     * - picks color stops from 'b', where each stop is:
     *     - a 3-digit "rgb" number (digits 1-9) mapped via 32*d-32
     *     - or an [r,g,b] array
     * - interpolates between two stops based on the fractional part of 'a'
     * - assigns ctx.fillStyle = rgb(...)
     * - returns that RGB triple.
     */
    color(ctx, a, ...stops) {
        // Clamp negative to 0 (same as a *= a > 0)
        if (!(a > 0)) a = 0;

        // Normalize stops into [r,g,b]
        const toRGB = (val) => {
            if (Array.isArray(val)) {
                const [r = 0, g = 0, b = 0] = val;
                return [r, g, b];
            }
            if (typeof val === "number") {
                const s = String(val);
                const out = [];
                for (let i = 0; i < s.length && i < 3; i++) {
                    const d = parseInt(s[i], 10) || 1;
                    out.push(32 * d - 32);
                }
                while (out.length < 3) out.push(out[out.length - 1] || 0);
                return out;
            }
            return [0, 0, 0];
        };

        if (stops.length === 0) {
            ctx.fillStyle = "rgb(0,0,0)";
            return [0, 0, 0];
        }

        // Emulate b.slice(a), last fallback, etc., in straightforward form:
        const N = stops.length;
        // a in [0, N-1]
        const maxIndex = N - 1;
        const idx = Math.max(0, Math.min(maxIndex, a));
        const i0 = Math.floor(idx);
        const i1 = Math.min(maxIndex, i0 + 1);
        const t = idx - i0;

        const c0 = toRGB(stops[i0]);
        const c1 = toRGB(stops[i1]);

        const r = (1 - t) * c0[0] + t * c1[0];
        const g = (1 - t) * c0[1] + t * c1[1];
        const b = (1 - t) * c0[2] + t * c1[2];

        const rgb = [r, g, b];
        ctx.fillStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
        return rgb;
    }

    /**
     * smooth(x, y): from src.js
     * 1 / (1 + 3 ** (y * (x - time)))
     */
    smooth(x, y) {
        return 1 / (1 + Math.pow(3, y * (x - this.time)));
    }

    /**
     * Create star glyph approximating the original Path2D star.
     */
    createStarPath() {
        const p = new Path2D();
        p.moveTo(-1, 0);
        p.lineTo(0, -1);
        p.lineTo(1, 0);
        p.lineTo(0, 1);
        p.closePath();
        return p;
    }

    /**
     * Star functions: structural port of first iter(5e3, ...) block.
     *
     * In src.js:
     * - For each i, pick random u,v,w and y[]
     * - Return a closure that:
     *   - computes z = 5 - i/1e3 - log1p(9**(time-8))
     *   - if 1e-3 < z < 1:
     *       translate by (u*99)/z, (v*99)/z - 20*smooth(6,-9)
     *       scale by expression of w, z, random
     *       color(z*z, y, 111), draw star
     *       scale 0.5, color(z*z,999,111), draw star
     */
    buildStarFunctions() {
        // Use parameters as close as possible to the original demo so behavior is predictable.
        const COUNT = 5000;

        this.starFunctions = this.iter(COUNT, (i) => {
            const u = Math.random() - 0.5;
            const v = Math.random() - 0.5;
            const w = Math.random() - 0.5;
            const yStops = this.iter(3, () => 99 + 150 * Math.random());

            return (ctx) => {
                // Direct port of the original z formula:
                //   z = 5 - i/1e3 - log1p(9 ** (time - 8))
                // Our this.time is already 0..10; keep the same curve.
                const time = this.time;
                const z =
                    5 -
                    i / 1000 -
                    Math.log1p(Math.pow(9, time - 8));

                // Keep the canonical visibility condition; if this yields nothing,
                // the bug is elsewhere (e.g. draw not called / opacity).
                if (!(z > 1e-3 && z < 1)) return;

                ctx.translate(
                    (u * 99) / z,
                    (v * 99) / z - 20 * this.smooth(6, -9)
                );

                const s =
                    (w / 4 + 0.5) * (1.2 - z) +
                    0.2 * Math.random();

                ctx.scale(s, s);

                // Dim star
                this.color(ctx, z * z, yStops, 111);
                ctx.fill(this.starPath);

                // Brighter inner star
                ctx.scale(0.5, 0.5);
                this.color(ctx, z * z, 999, 111);
                ctx.fill(this.starPath);
            };
        });
    }

    /**
     * Mountain / cloud band functions: structural port of second block.
     *
     * For each i:
     * - Build p = Path2D from fractal(0,0,10)
     * - Closure:
     *   - z = 2 - i/25 - time/5
     *   - if z > 0.02:
     *       translate by camera (smooth-based)
     *       scale 0.2/z
     *       translate with planetary curvature
     *       color(...) and fill mountains
     *       color(...) and draw mirrored clouds with alpha = smooth(...)
     */
    buildBandFunctions() {
        const COUNT = 60;

        this.bandFunctions = this.iter(COUNT, (i) => {
            // Create path from fractal sequence
            const seq = this.fractal(0, 0, 10);
            const p = new Path2D();
            p.moveTo(0, 99);

            const stepX = 1000 / Math.max(1, seq.length - 1);
            for (let idx = 0; idx < seq.length; idx++) {
                const x = idx * stepX;
                const y = seq[idx];
                p.lineTo(x, y);
            }
            p.lineTo(1000, 99);
            p.closePath();

            return (ctx) => {
                const z = 2 - i / 25 - this.time / 5;
                if (!(z > 0.02)) return;

                // Camera movement
                ctx.translate(
                    0,
                    40 * this.smooth(6, 9) -
                        20 -
                        200 * this.smooth(0, -9)
                );
                ctx.scale(0.2 / z, 0.2 / z);

                // Planetary curvature / vertical placement
                ctx.translate(-700, 20 + z * z * 80);

                // Mountains color:
                // color(time*3, 145, color(z*2,121,color(time-2,346,534,223,111)))
                this.color(
                    ctx,
                    this.time * 3,
                    145,
                    this.color(
                        ctx,
                        z * 2,
                        121,
                        this.color(
                            ctx,
                            this.time - 2,
                            346,
                            534,
                            223,
                            111
                        )
                    )
                );
                ctx.fill(p);

                // Clouds:
                // color(time*0.7-1,
                //   color(z,889,346),
                //   color(z*2,222,815,933),
                //   color(z,112,334))
                this.color(
                    ctx,
                    this.time * 0.7 - 1,
                    this.color(ctx, z, 889, 346),
                    this.color(ctx, z * 2, 222, 815, 933),
                    this.color(ctx, z, 112, 334)
                );

                ctx.globalAlpha = this.smooth(3.5 + z, -2);

                ctx.translate(this.time * 80, -25);
                ctx.scale(2, -1);
                ctx.fill(p);
            };
        });
    }

    /**
     * setup():
     * - Run through one loop so initial state isn't completely empty (like warm start).
     */
    setup() {
        const dt = 1 / 60;
        const total = this.loopDuration;
        for (let t = 0; t < total; t += dt) {
            this.update(dt);
        }
    }

    /**
     * update(deltaTime):
     * - Original demo: time = ((t - zeroTime) / 3000) % 10  (0..10 over ~3s)
     * - For the theme, we slow this down so the full background loop breathes longer.
     *
     * backgroundSpeedFactor:
     * - 1.0  ~= original fast speed
     * - 0.25 = 4x slower (what we use here)
     */
    update(deltaTime) {
        super.update(deltaTime);

        const baseSpeed = 10 / 3;
        const backgroundSpeedFactor = 0.125; // 50% slower than the previous 0.25

        const speed = baseSpeed * backgroundSpeedFactor;
        this.time = (this.time + deltaTime * speed) % this.loopDuration;
    }

    /**
     * drawBackground(ctx, opacity):
     * - Perform the same transform stack as Star Traveler:
     *   - fillRect
     *   - translate(width/2, height/2)
     *   - scale(width/99, width/99)
     *   - functions.map(x => (save, x(), restore))
     * - Then draw the central singularity for time > 7.
     */
    drawBackground(ctx, opacity) {
        if (opacity <= 0) return;

        const width = TETRIS.WIDTH;
        const height = TETRIS.HEIGHT;

        ctx.save();
        ctx.globalAlpha = opacity;

        // Clear background
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, width, height);

        // Center and scale to 99x99 virtual coordinate system
        ctx.translate(width / 2, height / 2);
        const scale = width / 99;
        ctx.scale(scale, scale);

        // Star functions
        for (let i = 0; i < this.starFunctions.length; i++) {
            ctx.save();
            this.starFunctions[i](ctx);
            ctx.restore();
        }

        // Mountain / cloud bands
        for (let i = 0; i < this.bandFunctions.length; i++) {
            ctx.save();
            this.bandFunctions[i](ctx);
            ctx.restore();
        }

        // Central singularity (time > 7)
        if (this.time > 7) {
            // color(time - 7, 111, 145)
            this.color(ctx, this.time - 7, 111, 145);
            const r = 0.2 / (10 - this.time);
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

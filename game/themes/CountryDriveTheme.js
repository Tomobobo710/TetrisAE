/**
 * CountryDriveTheme - Parallax scrolling countryside inspired by js1k demo
 * Original inspiration: https://js1k.com/2015-hypetrain/details/2311
 * By Reinder Nijhoff - https://reindernijhoff.net
 */
class CountryDriveTheme extends BaseTheme {
    constructor() {
        super();
        this.name = 'Country Drive';

        // Theme colors and styling
        this.playfield = {
            background: 'rgba(20, 30, 50, 0.85)',
            border: '#88aacc',
            grid: 'rgba(136, 170, 204, 0.1)',
            shadow: 'rgba(136, 170, 204, 0.3)'
        };
        this.pieces = {
             I: { base: '#88aacc', glow: '#aaccee', shadow: '#446688' },
             O: { base: '#aa88cc', glow: '#ccaaee', shadow: '#554488' },
             T: { base: '#cc88aa', glow: '#eeaacc', shadow: '#664455' },
             S: { base: '#88ccaa', glow: '#aaeedd', shadow: '#446655' },
             Z: { base: '#ccaa88', glow: '#eeddaa', shadow: '#665544' },
             J: { base: '#8899cc', glow: '#aabbee', shadow: '#445588' },
             L: { base: '#cc9988', glow: '#eebbaa', shadow: '#665544' },
             garbage: { base: '#666666', glow: '#666666', shadow: '#444444' }
         };
        this.ui = {
            background: 'rgba(20, 30, 50, 0.9)',
            text: '#ffffff',
            accent: '#88aacc',
            border: '#88aacc'
        };
        this.background = {
            type: 'parallax_landscape',
            colors: ['#88aacc', '#6688aa', '#445566'],
            intensity: 1.0
        };

        // Initialize landscape system
        this.visuals = {
            scrollOffset: 0,
            scrollSpeed: 30, // pixels per second
            layers: [],
            heightmap: new Array(10000), // Global heightmap for terrain
            sceneTimer: 0,
            sceneDuration: 5, // seconds per scene (was 45)
            currentScene: 0,
            transitionProgress: 1.0 // 1.0 = scene fully loaded
        };

        // Scene configurations (different times of day/weather)
        this.scenes = [
            {
                name: 'Sunny Day',
                skyHue: 200,
                skyLight: 25,
                terrainHue: 100,
                terrainLight: 35,
                accentHue: 280,
                snow: 0,
                stars: 0,
                reflection: 0.3,
                treeColor: 'hsl(110, 40%, 25%)' // Lush green
            },
            {
                name: 'Sunset',
                skyHue: 20,
                skyLight: 35,
                terrainHue: 30,
                terrainLight: 25,
                accentHue: 350,
                snow: 0,
                stars: 0.3,
                reflection: 0.6,
                treeColor: 'hsl(30, 55%, 28%)' // Warm autumn orange/brown
            },
            {
                name: 'Night',
                skyHue: 240,
                skyLight: 8,
                terrainHue: 200,
                terrainLight: 12,
                accentHue: 200,
                snow: 0,
                stars: 1.0,
                reflection: 0.8,
                treeColor: 'hsl(160, 25%, 18%)' // Deep evergreen/teal
            },
            {
                name: 'Snowy Day',
                skyHue: 200,
                skyLight: 45,
                terrainHue: 200,
                terrainLight: 55,
                accentHue: 180,
                snow: 1.0,
                stars: 0,
                reflection: 0.2,
                treeColor: 'hsl(150, 15%, 80%)' // Pale frosted trees
            },
            {
                name: 'Rainy Evening',
                skyHue: 220,
                skyLight: 18,
                terrainHue: 180,
                terrainLight: 20,
                accentHue: 240,
                snow: 0,
                stars: 0.2,
                reflection: 1.0,
                treeColor: 'hsl(150, 25%, 20%)' // Dark wet green
            }
        ];

        // Generate initial heightmap
        this.generateHeightmap();

        // Generate initial scene
        this.generateScene();

        // Enable animated UI colors
        this.uiAnimation.enabled = true;
        this.uiAnimation.speed = 0.3;
        this.uiAnimation.colors = [
            '#88aacc',
            '#6688aa',
            '#aa88cc',
            '#88ccaa',
            '#ccaa88',
            '#88aacc'
        ];
    }

    /**
     * Setup - fast-forward to populate initial state
     */
    setup() {
        const frameTime = 1 / 60;
        const numFrames = 5 * 60; // 5 seconds to populate
        
        for (let i = 0; i < numFrames; i++) {
            this.update(frameTime);
        }
    }

    /**
     * Generate random heightmap for terrain
     */
    generateHeightmap() {
        for (let i = 0; i < this.visuals.heightmap.length; i++) {
            this.visuals.heightmap[i] = Math.random();
        }
    }

    /**
     * Linear interpolation of heightmap
     */
    sampleHeightmap(position) {
        const index = Math.floor(position);
        const fraction = position - index;
        const h1 = this.visuals.heightmap[index % this.visuals.heightmap.length];
        const h2 = this.visuals.heightmap[(index + 1) % this.visuals.heightmap.length];
        return h1 * (1 - fraction) + h2 * fraction;
    }

    /**
     * Generate a new scene with layers
     */
    generateScene() {
        const scene = this.scenes[this.visuals.currentScene];
        const layers = [];

        // Cache per-scene tree color so drawTerrainLayer can use it
        this.visuals.currentTreeColor = scene.treeColor || null;
        
        // Random color variations within scene palette
        const skyHue = scene.skyHue + (Math.random() - 0.5) * 80;
        const skyLight = scene.skyLight + (Math.random() - 0.5) * 20;
        const terrainHue = scene.terrainHue + (Math.random() - 0.5) * 80;
        const terrainLight = scene.terrainLight + (Math.random() - 0.5) * 20;
        const accentHue = scene.accentHue + (Math.random() - 0.5) * 180;
        const accentLight = skyLight * 4;
        
        const skyColor = `hsl(${skyHue}, 100%, ${skyLight}%)`;
        const terrainColor = `hsl(${terrainHue}, 50%, ${terrainLight}%)`;
        const accentColor = `hsl(${accentHue}, 100%, ${accentLight}%)`;
        const cloudOpacity = 0.6 * Math.random();
        const terrainOverlayAlpha = 0.6 * Math.random(); // Like 'n' in original - controls terrain color blend
        
        // Create cloud/tree sprite
        const sprite = this.createSprite(accentColor, skyColor);
        
        // Generate 6 layers (0 = sky, 1-5 = terrain)
        for (let i = 0; i < 6; i++) {
            const isSky = i === 0;
            const layerCanvas = document.createElement('canvas');
            const scrollSpeed = isSky ? 0 : i * i / (i === 5 ? 2 : 8);

            // IMPORTANT: use the raw logical width; seam handling is done in drawBackground.
            // If you've tweaked this before, this resets it.
            const width = Math.floor(TETRIS.WIDTH + 400 * scrollSpeed);
            const height = TETRIS.HEIGHT;
            
            layerCanvas.width = width;
            layerCanvas.height = height;
            const ctx = layerCanvas.getContext('2d');
            
            if (isSky) {
                // Layer 0: Sky with gradient, stars, and clouds
                this.drawSkyLayer(ctx, width, height, skyColor, accentColor, sprite, cloudOpacity, scene.stars, i);
            } else {
                // Layers 1-5: Terrain with heightmap
                this.drawTerrainLayer(ctx, width, height, skyColor, accentColor, terrainColor, sprite, cloudOpacity, scene.snow, terrainOverlayAlpha, i);
            }
            
            layers.push({
                canvas: layerCanvas,
                scrollSpeed: scrollSpeed,
                heightmapValue: Math.random(),
                reflection: scene.reflection
            });
        }
        
        this.visuals.layers = layers;
        this.visuals.scene = scene;
        this.visuals.transitionProgress = 1.0;
    }

    /**
     * Create a sprite used like in Train Window:
     * a generic noisy blob built from tiny rects, used for clouds & trees.
     */
    createSprite(accentColor, skyColor) {
        const canvas = document.createElement('canvas');
        canvas.width = 60;
        canvas.height = 120;
        const ctx = canvas.getContext('2d');
    
        // Vertical gradient like the original sprite
        const gradient = ctx.createLinearGradient(0, 0, 0, 120);
        gradient.addColorStop(0, accentColor);
        gradient.addColorStop(1, skyColor);
        ctx.fillStyle = gradient;
    
        // Port of the js1k parametric blob:
        // for(f=300;f--;) for(x=30; f/9 < x--;)
        //   s.fillRect(30 + x * cos(f)*cos(f*sin(f)), 30 + x*sin(f), .9, .9);
        for (let f = 300; f--;) {
            for (let x = 30; f / 9 < x--; ) {
                const px = 30 + x * Math.cos(f) * Math.cos(f * Math.sin(f));
                const py = 30 + x * Math.sin(f);
                ctx.fillRect(px, py, 0.9, 0.9);
            }
        }
    
        return canvas;
    }

    /**
     * Draw sky layer with stars
     */
    drawSkyLayer(ctx, width, height, skyColor, accentColor, sprite, cloudOpacity, starIntensity, layerIndex) {
        // Gradient background
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, skyColor);
        gradient.addColorStop(1, accentColor);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Stars (more visible at night) - NO TRANSPARENCY
        if (starIntensity > 0) {
            ctx.fillStyle = '#ffffff';
            const starCount = Math.floor(starIntensity * 500);
            for (let i = 0; i < starCount; i++) {
                const x = Math.random() * width;
                const y = Math.random() * height;
                const size = Math.random() * 2;
                ctx.fillRect(x, y, size, size);
            }
        }
    }

    /**
     * Draw terrain layer with heightmap, trees, and effects
     */
    drawTerrainLayer(ctx, width, height, skyColor, accentColor, terrainColor, sprite, cloudOpacity, snowIntensity, terrainOverlayAlpha, layerIndex) {
        // NOTE: This is now a direct structural port of Train Window's terrain:
        // - Per-layer random heightmap b[]
        // - W(x) = N(x/50) + 5N(x/200) + 10N(x/400)
        // - BaseY shifts with layerIndex to create vertical parallax
        const o = height;
        const baseY = o / 2 + layerIndex * o / 20 * (layerIndex === 5 ? 1.5 : 1.0);

        // Build per-layer heightmap like original (size 1e4)
        const b = new Array(10001);
        for (let i = 0; i < 10000; i++) {
            b[i] = Math.random();
        }
        b[10000] = b[0]; // wrap

        // 1D linear interpolation N(x) over b
        const N = (x) => {
            const i = Math.floor(x);
            const f = x - i;
            const i0 = i % 10000;
            const i1 = (i0 + 1) % 10000;
            return b[i0] * (1 - f) + b[i1] * f;
        };

        // Clear
        ctx.clearRect(0, 0, width, height);

        // Color / depth: keep your styling but applied to this geometry
        const depthFactor = (layerIndex - 1) / 4;
        const terrainLightness = 70 - depthFactor * 40;

        const terrainHueMatch = terrainColor.match(/hsl\((\d+)/);
        const terrainHue = terrainHueMatch ? parseInt(terrainHueMatch[1]) : 100;

        // 1. Terrain polygon using the js1k W(x) formula
        // Keep trees perfectly aligned with hills:
        // - Use a shared, dense height sample array for both terrain and trees.
        // - Apply the same endpoint correction to that array so start/end Y match.
        ctx.fillStyle = `hsl(${terrainHue}, 40%, ${terrainLightness}%)`;

        // High-detail sampling (4x original: 5px -> 1.25px approx).
        const step = 1.25;
        const sampleCount = Math.max(2, Math.floor(width / step)); // ensure at least 2 samples

        // Build shared raw height samples and track endpoints
        const heights = new Array(sampleCount + 1);
        let firstY = null;
        let lastY = null;

        for (let i = 0; i <= sampleCount; i++) {
            // Clamp last sample exactly to width so indices stay valid
            const x = (i === sampleCount) ? width : i * step;
            const W =
                N(x / 50) +
                5 * N(x / 200) +
                10 * N(x / 400);
            const y = baseY - (o / 80) * W;
            heights[i] = { x, y };
            if (firstY === null) firstY = y;
            lastY = y;
        }

        // Linear endpoint correction so y(0) == y(width)
        const diff = lastY - firstY;
        for (let i = 0; i <= sampleCount; i++) {
            const t = heights[i].x / width;            // 0..1
            heights[i].y -= diff * t;                  // smoothly remove mismatch
        }

        // Helper: sample corrected terrain Y at arbitrary X for trees, etc.
        const terrainYAt = (x) => {
            if (x <= 0) return heights[0].y;
            if (x >= width) return heights[sampleCount].y;
            const idx = x / step;
            const i0 = Math.min(sampleCount - 1, Math.max(0, Math.floor(idx)));
            const f = idx - i0;
            const h0 = heights[i0];
            const h1 = heights[i0 + 1];
            return h0.y + (h1.y - h0.y) * f;
        };

        // Draw terrain polygon using corrected heights
        ctx.beginPath();
        ctx.moveTo(0, height);
        for (let i = 0; i <= sampleCount; i++) {
            const h = heights[i];
            ctx.lineTo(h.x, h.y);
        }
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fill();

        // 2. Trees: direct analogue of Train Window's simple skinny rects,
        // using the shared corrected terrain so they line up with the hills.
        if (layerIndex && (6 ^ layerIndex)) {
            // Use explicit per-season tree color when provided; otherwise fall back to terrain-based hue.
            if (this.visuals && this.visuals.currentTreeColor) {
                ctx.fillStyle = this.visuals.currentTreeColor;
            } else {
                const baseHue = terrainHue + 10;
                ctx.fillStyle = `hsl(${baseHue}, 35%, ${Math.max(5, terrainLightness - 30)}%)`;
            }

            const stepTree = 0.08; // original dense spacing

            for (let x = width; x > 0; x -= stepTree) {
                // Same W combo for distribution gating (keeps original feel)
                const W =
                    N(x / 50) +
                    5 * N(x / 200) +
                    10 * N(x / 400);

                const gate = N(x / 300);
                const bias = 0.25 + layerIndex * 0.08;
                if (gate + bias > Math.random()) continue;

                // Trees sit on the corrected terrain
                const terrainY = terrainYAt(x);

                const treeHeight = 2 + Math.random() * 4; // small, varied
                const treeWidth = 0.5; // skinny (about 1px)

                ctx.fillRect(
                    x - treeWidth / 2,
                    terrainY - treeHeight,
                    treeWidth,
                    treeHeight
                );
            }
        }

        // 3. Snow: leave as your stylistic choice
        if (snowIntensity > 0.5) {
            ctx.fillStyle = '#ffffff';
            for (let i = 0; i < 200; i++) {
                const x = Math.random() * width;
                const y = Math.random() * height;
                const size = 1 + Math.random() * 2;
                ctx.fillRect(x, y, size, size);
            }
        }
    }

    /**
     * Update landscape animation
     */
    update(deltaTime) {
        super.update(deltaTime);
        
        // Update scroll offset
        this.visuals.scrollOffset += this.visuals.scrollSpeed * deltaTime;
        
        // Update scene timer
        this.visuals.sceneTimer += deltaTime;
        
        // Check for scene transition
        if (this.visuals.sceneTimer >= this.visuals.sceneDuration) {
            this.visuals.sceneTimer = 0;
            this.visuals.currentScene = (this.visuals.currentScene + 1) % this.scenes.length;
            this.generateScene();
        }
    }

    /**
     * Draw parallax landscape
     */
    drawBackground(ctx, opacity) {
        // Draw all layers
        this.visuals.layers.forEach((layer, index) => {
            // core scroll in pixels
            const rawOffset = -this.visuals.scrollOffset * layer.scrollSpeed;

            ctx.save();
            // Force fully opaque when drawing layer textures to avoid alpha blend seams.
            ctx.globalAlpha = 1.0;

            const w = layer.canvas.width - 1;

            // EXACT WRAP MATH (this is the part that must make sense):
            //
            // We want:
            //   screen_x = wrappedOffset        to show source_x in [0, w)
            //   screen_x = wrappedOffset + w    to show the next copy immediately after
            // So the seam is at:
            //   screen_x = wrappedOffset + w
            // and the following must hold:
            //   (wrappedOffset + w) - wrappedOffset = w   (no gap, no overlap)
            //
            // Implementation:
            // 1. Reduce rawOffset into a single-period offset t in [0, w).
            // 2. Shift into [-w, 0) so the first drawn tile always starts at/before x=0.
            //
            // This guarantees tiles are spaced by EXACTLY w.
            let t = rawOffset % w;
            if (t < 0) t += w;        // t in [0, w)
            let wrappedOffset = t - w; // in [-w, 0)

            // 3 COPIES, EXACT BUTT-JOINED:
            // - Second starts exactly w px after first.
            // - Third exactly w px before first.
            ctx.drawImage(layer.canvas, wrappedOffset, 0);
            ctx.drawImage(layer.canvas, wrappedOffset + w, 0);
            ctx.drawImage(layer.canvas, wrappedOffset - w, 0);


            ctx.restore();
        });
    }
}

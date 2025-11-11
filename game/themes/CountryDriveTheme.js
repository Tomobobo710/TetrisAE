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
            sceneDuration: 45, // seconds per scene
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
                reflection: 0.3
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
                reflection: 0.6
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
                reflection: 0.8
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
                reflection: 0.2
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
                reflection: 1.0
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
            const width = TETRIS.WIDTH + 400 * scrollSpeed;
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
     * Create sprite for clouds and trees
     */
    createSprite(accentColor, skyColor) {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 60;
        const ctx = canvas.getContext('2d');
        
        // Create gradient for sprite
        const gradient = ctx.createLinearGradient(0, 0, 0, 120);
        gradient.addColorStop(0, accentColor);
        gradient.addColorStop(1, skyColor);
        ctx.fillStyle = gradient;
        
        // Draw circular pattern (parameterized circle)
        for (let angle = 0; angle < 300; angle++) {
            for (let radius = 30; radius > 0 && angle / 9 < radius; radius--) {
                const x = 30 + radius * Math.cos(angle) * Math.cos(angle * Math.sin(angle));
                const y = 30 + radius * Math.sin(angle);
                ctx.fillRect(x, y, 0.9, 0.9);
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
        const scaleFactor = 80 * (7 - layerIndex) / height;
        const baseY = height / 2 + layerIndex * height / 20;
        const isFrontLayer = layerIndex === 5;
        
        // Generate heightmap for this layer - make it wrap seamlessly
        const layerHeightmap = new Array(10000);
        for (let i = 0; i < layerHeightmap.length - 1; i++) {
            layerHeightmap[i] = Math.random();
        }
        // Make last value equal to first for seamless wrapping
        layerHeightmap[layerHeightmap.length - 1] = layerHeightmap[0];
        
        const sampleLayerHeight = (pos) => {
            const index = Math.floor(pos) % 10000;
            const fraction = pos - Math.floor(pos);
            const h1 = layerHeightmap[index];
            const h2 = layerHeightmap[(index + 1) % 10000];
            return h1 * (1 - fraction) + h2 * fraction;
        };
        
        // Clear background
        ctx.clearRect(0, 0, width, height);
        
        // Atmospheric perspective: far layers are lighter/hazier, close layers are darker
        // Layer 1 = furthest (lightest), Layer 5 = closest (darkest)
        const depthFactor = (layerIndex - 1) / 4; // 0 (far) to 1 (close)
        
        // Terrain base color with depth - NO TRANSPARENCY
        const terrainLightness = 70 - (depthFactor * 40); // Far=70%, Close=30%
        
        // Extract hue from terrainColor (it's in format hsl(hue, sat%, light%))
        const terrainHueMatch = terrainColor.match(/hsl\((\d+)/);
        const terrainHue = terrainHueMatch ? parseInt(terrainHueMatch[1]) : 100;
        
        // Calculate a single height that will be used at BOTH ends for seamless wrapping
        const edgeHeightValue = height / 80 * (
            sampleLayerHeight(0) +
            5 * sampleLayerHeight(0) +
            10 * sampleLayerHeight(0)
        );
        const edgeY = baseY - edgeHeightValue;
        
        // Draw terrain with clear silhouette - NO TRANSPARENCY
        ctx.fillStyle = `hsl(${terrainHue}, 40%, ${terrainLightness}%)`;
        ctx.beginPath();
        
        // Start from bottom right corner
        ctx.moveTo(width, height);
        
        // Start terrain at right edge with the SAME height as left edge
        ctx.lineTo(width, edgeY);
        
        // Draw terrain contour from right to left
        for (let x = width - 5; x > 5; x -= 5) {
            const heightValue = height / 80 * (
                sampleLayerHeight(x / 50) +
                5 * sampleLayerHeight(x / 200) +
                10 * sampleLayerHeight(x / 400)
            );
            const y = baseY - heightValue;
            ctx.lineTo(x, y);
        }
        
        // End terrain at left edge with the SAME height as right edge
        ctx.lineTo(0, edgeY);
        
        // Close path to bottom
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fill();
        
        // Draw trees on terrain (skip front layer) - NO TRANSPARENCY
        if (layerIndex < 5) {
            ctx.fillStyle = `hsl(${terrainHue + 20}, 50%, ${Math.max(0, terrainLightness - 15)}%)`;
            
            for (let x = width; x > 0; x -= 20 / scaleFactor) {
                if (Math.random() > 0.7) {
                    const heightValue = height / 80 * (
                        sampleLayerHeight(x / 50) +
                        5 * sampleLayerHeight(x / 200) +
                        10 * sampleLayerHeight(x / 400)
                    );
                    const treeY = baseY - heightValue;
                    const treeHeight = 20 / scaleFactor;
                    const treeWidth = 4 / scaleFactor;
                    
                    ctx.fillRect(x - treeWidth/2, treeY - treeHeight, treeWidth, treeHeight);
                }
            }
        }
        
        // Snow particles - NO TRANSPARENCY
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
            const offset = -this.visuals.scrollOffset * layer.scrollSpeed;
            
            ctx.save();
            ctx.globalAlpha = opacity;
            
            // Draw layer with wrapping
            const wrappedOffset = offset % layer.canvas.width;
            ctx.drawImage(layer.canvas, wrappedOffset, 0);
            
            // Draw second copy for seamless wrapping
            if (wrappedOffset > 0) {
                ctx.drawImage(layer.canvas, wrappedOffset - layer.canvas.width, 0);
            } else {
                ctx.drawImage(layer.canvas, wrappedOffset + layer.canvas.width, 0);
            }
            
            // Draw water reflections for terrain layers
            if (index > 0 && layer.reflection > 0.5 && layer.heightmapValue > 0.8 && index % 2 === 1) {
                const reflectionY = TETRIS.HEIGHT / 2 - index * TETRIS.HEIGHT / 20;
                const reflectionHeight = TETRIS.HEIGHT - reflectionY;
                
                ctx.save();
                ctx.globalAlpha = opacity * 0.5;
                ctx.translate(0, TETRIS.HEIGHT + reflectionY);
                ctx.scale(1, -1);
                
                // Draw reflected layer
                ctx.drawImage(
                    layer.canvas,
                    0,
                    2 * index * TETRIS.HEIGHT / 20,
                    layer.canvas.width,
                    reflectionY,
                    wrappedOffset,
                    reflectionY,
                    layer.canvas.width,
                    reflectionHeight
                );
                
                // Draw second copy for wrapping
                if (wrappedOffset > 0) {
                    ctx.drawImage(
                        layer.canvas,
                        0,
                        2 * index * TETRIS.HEIGHT / 20,
                        layer.canvas.width,
                        reflectionY,
                        wrappedOffset - layer.canvas.width,
                        reflectionY,
                        layer.canvas.width,
                        reflectionHeight
                    );
                } else {
                    ctx.drawImage(
                        layer.canvas,
                        0,
                        2 * index * TETRIS.HEIGHT / 20,
                        layer.canvas.width,
                        reflectionY,
                        wrappedOffset + layer.canvas.width,
                        reflectionY,
                        layer.canvas.width,
                        reflectionHeight
                    );
                }
                
                ctx.restore();
            }
            
            ctx.restore();
        });
    }
}
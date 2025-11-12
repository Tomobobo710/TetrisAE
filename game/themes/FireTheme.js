/**
 * FireTheme
 *
 * CPU-based fire background + blur/embers, inspired by classic fire pixel demos
 * and the same visual sources as TunnelTheme:
 * - "x-mode" by Justin Greisiger Frost (https://jdfio.com / https://github.com/gneissguise)
 * - fireDemo-style 2D buffer fire techniques
 *
 * Integrated as a BaseTheme:
 * - Uses TETRIS.WIDTH / TETRIS.HEIGHT for the fire buffer
 * - Updates internal fire state via update(deltaTime) with a fixed-step accumulator
 * - Renders via drawBackground(ctx, opacity) using:
 *      - pulsing radial glow
 *      - fire buffer drawn into an offscreen canvas + blur
 *      - sharp embers/particles on top
 */
class FireTheme extends BaseTheme {
    constructor() {
        super();
        this.name = 'Fire';

        // Theme colors and styling
        this.playfield = {
            background: 'rgba(40, 10, 0, 0.95)',
            border: '#ff6600',
            grid: 'rgba(255, 102, 0, 0.1)',
            shadow: 'rgba(255, 102, 0, 0.4)'
        };
        this.pieces = {
             I: { base: '#ff0000', glow: '#ffff00', shadow: '#880000' },
             O: { base: '#ff6600', glow: '#ffff00', shadow: '#883300' },
             T: { base: '#ff3300', glow: '#ffff00', shadow: '#881800' },
             S: { base: '#ff9900', glow: '#ffff00', shadow: '#884400' },
             Z: { base: '#ff0066', glow: '#ffff00', shadow: '#880033' },
             J: { base: '#ff0033', glow: '#ffff00', shadow: '#880018' },
             L: { base: '#ffcc00', glow: '#ffff00', shadow: '#886600' },
             garbage: { base: '#666666', glow: '#666666', shadow: '#444444' }
         };
        this.ui = {
            background: 'rgba(40, 10, 0, 0.9)',
            text: '#ffffff',
            accent: '#ff6600',
            border: '#ff6600'
        };
        this.background = {
            type: 'volumetric_fire',
            colors: ['#ff0000', '#ff6600', '#ffff00'],
            intensity: 0.9
        };

        // Initialize visuals
        this.visuals = {};
        this.visuals.fireParticles = this.createFireParticleSystem();
        this.visuals.radialGlow = { phase: 0, speed: 0.5 };

        // Turbulence field for organic movement
        this.turbulenceTime = 0;

        // CPU fire buffer (fireDemo-style core) at even lower resolution.
        // Halve again: 0.125x width and 0.25x height (≈1/32 pixels), then scale up.
        const width = Math.max(32, Math.floor(TETRIS.WIDTH * 0.125));
        const height = Math.max(32, Math.floor(TETRIS.HEIGHT * 0.25));
        this.fire = {
            width,
            height,
            fireBuffer: new Uint8Array(width * height),
            palette: this.createFirePalette(),
            imageData: null,
            lastWidth: 0,
            lastHeight: 0,
            updateAccumulator: 0
        };

        // Enable BaseTheme animated UI colors
        this.uiAnimation.enabled = true;
        this.uiAnimation.speed = 0.8; // Speed of color cycling
        this.uiAnimation.colors = [
            '#ff0000', // Red
            '#ff3300', // Red-orange
            '#ff6600', // Orange
            '#ff9900', // Orange-yellow
            '#ffcc00', // Yellow-orange
            '#ffff00', // Yellow
            '#ffffff', // White
            '#ffff00', // Yellow (back)
            '#ffcc00', // Yellow-orange
            '#ff9900', // Orange-yellow
            '#ff6600', // Orange
            '#ff3300'  // Red-orange
        ];
    }
    
    /**
     * Setup - fast-forward to populate particle systems and fire buffer.
     * Uses ~30 seconds of simulated time so the fire field is fully "mature" on first frame.
     */
    setup() {
        const frameTime = 1 / 60;
        const numFrames = 30 * 60;
        for (let i = 0; i < numFrames; i++) {
            this.update(frameTime);
        }
    }

    /**
     * Create advanced fire particle system with physics
     */
    createFireParticleSystem() {
        const particles = [];
        const numParticles = 150;
        
        for (let i = 0; i < numParticles; i++) {
            particles.push(this.createFireParticle());
        }
        
        return {
            particles: particles,
            emitTimer: 0,
            emitRate: 0.02 // Emit particles every 0.02s
        };
    }
    
    createFireParticle() {
        const types = ['fire', 'ember', 'smoke'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        // Fire/Ember-specific settings for longer travel distance
        const isFireOrEmber = type === 'fire' || type === 'ember';
        const upwardSpeed = isFireOrEmber ? (-150 - Math.random() * 150) : (-50 - Math.random() * 100);
        const lifeDecay = isFireOrEmber ? (0.08 + Math.random() * 0.07) : 0.3;
        
        return {
            x: Math.random() * TETRIS.WIDTH,
            y: TETRIS.HEIGHT + Math.random() * 50,
            vx: (Math.random() - 0.5) * 30,
            vy: upwardSpeed,
            ax: 0,
            ay: isFireOrEmber ? -30 : -20,
            size: type === 'smoke' ? 15 + Math.random() * 25 : (1 + Math.random() * 2),
            maxSize: type === 'smoke' ? 40 : 4,
            opacity: type === 'smoke' ? 0.4 : 0.9,
            life: 1.0,
            lifeDecay: lifeDecay,
            type: type,
            hue: type === 'smoke' ? 30 : 0,
            saturation: type === 'smoke' ? 10 : 100,
            lightness: type === 'smoke' ? 20 : 50,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 2
        };
    }
    
    /**
     * Initialize fire palette (0..255) for buffer-based fire rendering.
     */
    createFirePalette() {
        const palette = [];
        for (let i = 0; i < 256; i++) {
            const normVal = i / 255;
            const r = 255 * Math.min(1.5 * normVal, 1);
            const g = 255 * Math.max(0, Math.min(2 * (normVal - 0.25), 1));
            const b = 255 * Math.max(0, Math.min(5 * (normVal - 0.8), 1));
            palette.push({
                r: r | 0,
                g: g | 0,
                b: b | 0
            });
        }
        return palette;
    }

    
    /**
     * Get turbulence offset for organic movement
     */
    getTurbulence(x, y, time) {
        // Simple perlin-like noise using sine waves
        const tx = Math.sin(x * 0.01 + time) * Math.cos(y * 0.015 + time * 0.7);
        const ty = Math.cos(x * 0.012 + time * 0.8) * Math.sin(y * 0.01 + time * 1.2);
        return { x: tx * 20, y: ty * 20 };
    }

    /**
     * Update fire theme animation
     */
    update(deltaTime) {
        super.update(deltaTime);
        
        this.turbulenceTime += deltaTime;
        
        // Update fire particle system
        const particleSystem = this.visuals.fireParticles;
        particleSystem.emitTimer += deltaTime;
        
        // Emit new particles
        if (particleSystem.emitTimer >= particleSystem.emitRate) {
            particleSystem.emitTimer = 0;
            const deadIndex = particleSystem.particles.findIndex(p => p.life <= 0);
            if (deadIndex !== -1) {
                particleSystem.particles[deadIndex] = this.createFireParticle();
            }
        }
        
        // Update particles with physics
        particleSystem.particles.forEach(particle => {
            // Apply turbulence
            const turbulence = this.getTurbulence(particle.x, particle.y, this.turbulenceTime);
            particle.ax = turbulence.x * 2;
            
            // Update velocity
            particle.vx += particle.ax * deltaTime;
            particle.vy += particle.ay * deltaTime;
            
            // Apply drag
            particle.vx *= 0.98;
            if (particle.type === 'smoke') {
                particle.vy *= 0.99;
            } else {
                particle.vy *= 0.995;
            }
            
            // Update position
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            
            // Update size (grow for smoke)
            if (particle.type === 'smoke') {
                particle.size = Math.min(particle.maxSize, particle.size + 15 * deltaTime);
            }
            
            // Update rotation
            particle.rotation += particle.rotationSpeed * deltaTime;
            
            // Height-based color tweak for fire/embers
            if (particle.type === 'fire' || particle.type === 'ember') {
                const heightProgress = Math.max(0, Math.min(1, 1 - (particle.y / TETRIS.HEIGHT)));
                particle.hue = 60 - heightProgress * 60;
                particle.lightness = 90 - heightProgress * 60;
                particle.saturation = 20 + heightProgress * 80;
            }
            
            // Life
            particle.life -= particle.lifeDecay * deltaTime;
            
            // Reset if dead or off-screen
            if (particle.life <= 0 || particle.y < -200) {
                Object.assign(particle, this.createFireParticle());
            }
        });
        
        // Update radial glow
        this.visuals.radialGlow.phase += this.visuals.radialGlow.speed * deltaTime;

        // Advance fire buffer (fireDemo-style)
        this.updateFireBuffer(deltaTime);
    }

    /**
     * Ensure fire ImageData matches current buffer dimensions.
     */
    ensureFireImageData(ctx) {
        const f = this.fire;
        const width = f.width;
        const height = f.height;
        if (!f.imageData || f.lastWidth !== width || f.lastHeight !== height) {
            f.imageData = ctx.createImageData(width, height);
            f.lastWidth = width;
            f.lastHeight = height;
        }
        return f.imageData;
    }

    /**
     * Advance the fire buffer using a fireDemo-style cellular update.
     */
    updateFireBuffer(deltaTime) {
        const f = this.fire;
        if (!f || !f.fireBuffer) return;

        const w = f.width;
        const h = f.height;
        const buf = f.fireBuffer;

        // Fixed update step for stable behavior
        const updateInterval = 1 / 50;
        f.updateAccumulator += deltaTime;
        if (f.updateAccumulator < updateInterval) {
            return;
        }
        f.updateAccumulator -= updateInterval;

        // Seed bottom row with new "heat"
        const baseRow = (h - 1) * w;
        for (let x = 0; x < w; x++) {
            const rand = Math.random();
            let value;
            if (rand > 0.98) {
                value = 255 + Math.random() * 1300;
            } else if (rand > 0.6) {
                value = 128 + Math.random() * 200;
            } else {
                value = 80;
            }
            buf[baseRow + x] = value;
        }

        // Propagate upwards
        for (let y = 0; y < h - 1; y++) {
            const rowIndex = y * w;
            const belowY = y + 1;
            const belowRow = belowY * w;
            const below2Y = y + 2 < h ? y + 2 : y + 1;
            const below2Row = below2Y * w;

            for (let x = 0; x < w; x++) {
                const i = rowIndex + x;

                const p1 = buf[belowRow + ((x - 1 + w) % w)];
                const p2 = buf[belowRow + x];
                const p3 = buf[belowRow + ((x + 1) % w)];
                const p4 = buf[below2Row + x];

                const average = (p1 + p2 + p2 + p3 + p4) / 5.04;
                buf[i] = average > 0 ? average : 0;
            }
        }
    }

    /**
     * Draw the fire buffer into the given context (no blur).
     * The caller controls overall opacity via ctx.globalAlpha.
     */
    drawFireBuffer(ctx) {
        const f = this.fire;
        if (!f || !f.fireBuffer || !f.palette) return;

        const imageData = this.ensureFireImageData(ctx);
        const data = imageData.data;
        const buf = f.fireBuffer;
        const palette = f.palette;
        const w = f.width;
        const h = f.height;

        const len = buf.length;
        for (let i = 0; i < len; i++) {
            const fireValue = buf[i] | 0;
            const idx = fireValue < 256 ? fireValue : 255;
            const color = palette[idx];

            const p = i * 4;
            data[p] = color.r;
            data[p + 1] = color.g;
            data[p + 2] = color.b;
            data[p + 3] = 255;
        }

        // Draw the low-res fire buffer stretched to full canvas; blur pass will hide pixels.
        const scaleX = TETRIS.WIDTH / w;
        const scaleY = TETRIS.HEIGHT / h;

        const tmpCanvas = document.createElement("canvas");
        tmpCanvas.width = w;
        tmpCanvas.height = h;
        const tmpCtx = tmpCanvas.getContext("2d");
        tmpCtx.putImageData(imageData, 0, 0);

        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(tmpCanvas, 0, 0, w, h, 0, 0, TETRIS.WIDTH, TETRIS.HEIGHT);
        ctx.restore();
    }

    /**
     * Draw advanced fire background:
     * - pulsing radial glow
     * - blurred fire buffer (fireDemo-style)
     * - subtle sharp overlay
     * - embers/particles on top
     * - optional heat distortion bands
     */
    drawBackground(ctx, opacity) {
        if (opacity <= 0) return;

        // 1) Pulsing radial glow
        this.drawRadialGlow(ctx, opacity);

        // 2) Off-screen canvas for fire buffer + blur
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = TETRIS.WIDTH;
        tempCanvas.height = TETRIS.HEIGHT;
        const tempCtx = tempCanvas.getContext("2d");

        // Render scaled-up low-res fire buffer into temp canvas, with a slight vertical offset
        // so the flame base sits a bit below the playfield (e.g. push from ~Y800 to ~Y820).
        tempCtx.save();
        const baseOffsetY = Math.floor(TETRIS.HEIGHT * 0.025); // ~2.5% of height; tweak if needed
        tempCtx.translate(0, baseOffsetY);
        this.drawFireBuffer(tempCtx);
        tempCtx.restore();

        // 3) Blur the flames onto main canvas
        ctx.save();
        ctx.filter = "blur(8px)";
        ctx.globalAlpha = opacity;
        ctx.drawImage(tempCanvas, 0, 0);
        ctx.restore();

        // 4) Very soft sharp overlay for additional detail
        ctx.save();
        ctx.globalAlpha = 0.05 * opacity;
        ctx.drawImage(tempCanvas, 0, 0);
        ctx.restore();

        // 5) Heat distortion removed for cleaner fire; no extra wave bands.

        // 6) Fire particles / embers on top (no blur)
        this.drawFireParticles(ctx, opacity);
    }
    
    /**
     * Draw fire particle system
     */
    drawFireParticles(ctx, opacity) {
        const particles = this.visuals.fireParticles.particles;
        
        // Sort by y (draw back to front)
        const sorted = [...particles].sort((a, b) => b.y - a.y);
        
        sorted.forEach(particle => {
            if (particle.life <= 0) return;
            
            ctx.save();
            
            const lifeOpacity = Math.min(1, particle.life * 2);
            const currentOpacity = particle.opacity * lifeOpacity * opacity;
            
            if (particle.type === 'smoke') {
                const gradient = ctx.createRadialGradient(
                    particle.x, particle.y, 0,
                    particle.x, particle.y, particle.size
                );
                gradient.addColorStop(0, `hsla(${particle.hue}, ${particle.saturation}%, ${particle.lightness}%, ${currentOpacity * 0.4})`);
                gradient.addColorStop(0.5, `hsla(${particle.hue}, ${particle.saturation}%, ${particle.lightness}%, ${currentOpacity * 0.2})`);
                gradient.addColorStop(1, 'transparent');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
            } else {
                const gradient = ctx.createRadialGradient(
                    particle.x, particle.y, 0,
                    particle.x, particle.y, particle.size * 2
                );
                gradient.addColorStop(0, `hsla(${particle.hue + 20}, 100%, 70%, ${currentOpacity})`);
                gradient.addColorStop(0.3, `hsla(${particle.hue}, ${particle.saturation}%, ${particle.lightness}%, ${currentOpacity * 0.8})`);
                gradient.addColorStop(0.7, `hsla(${particle.hue - 10}, ${particle.saturation - 20}%, ${particle.lightness - 20}%, ${currentOpacity * 0.3})`);
                gradient.addColorStop(1, 'transparent');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
                ctx.fill();
                
                if (particle.type === 'fire') {
                    ctx.globalAlpha = currentOpacity * 0.8;
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.arc(particle.x, particle.y, particle.size * 0.4, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            
            ctx.restore();
        });
    }
    
    
    /**
     * Draw pulsing radial glow background
     */
    drawRadialGlow(ctx, opacity) {
        const glow = this.visuals.radialGlow;
        const pulse = Math.sin(glow.phase) * 0.3 + 0.7;
        
        const maxRadius = Math.sqrt(TETRIS.WIDTH * TETRIS.WIDTH + TETRIS.HEIGHT * TETRIS.HEIGHT);
        const currentRadius = maxRadius;
        
        const centerX = TETRIS.WIDTH / 2;
        const centerY = TETRIS.HEIGHT;
        
        const gradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, currentRadius
        );
        
        const baseOpacity = opacity * pulse;
        const numStops = 30;
        for (let i = 0; i < numStops; i++) {
            const t = i / (numStops - 1);
            const r = 255 - t * 205;
            const g = Math.max(0, 120 - t * 120);
            const b = 0;
            const a = (0.4 - t * 0.4) * baseOpacity;
            gradient.addColorStop(t, `rgba(${r}, ${g}, ${b}, ${a})`);
        }
        
        ctx.save();
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, TETRIS.WIDTH, TETRIS.HEIGHT);
        ctx.restore();
    }
}
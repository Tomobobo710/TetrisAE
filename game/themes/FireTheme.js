/**
 * FireTheme - Advanced Fire theme with volumetric flames and particle physics
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

        // Initialize advanced fire systems
        this.visuals = {};
        this.visuals.fireParticles = this.createFireParticleSystem();
        this.visuals.volumetricFlames = this.createVolumetricFlames();
        this.visuals.radialGlow = { phase: 0, speed: 0.5 };
        
        // Turbulence field for organic movement
        this.turbulenceTime = 0;

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
     * Setup - fast-forward to populate particle systems
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
        const upwardSpeed = isFireOrEmber ? (-150 - Math.random() * 150) : (-50 - Math.random() * 100); // Much faster upward
        const lifeDecay = isFireOrEmber ? (0.08 + Math.random() * 0.07) : 0.3; // Much slower decay = lives longer
        
        return {
            x: Math.random() * TETRIS.WIDTH,
            y: TETRIS.HEIGHT + Math.random() * 50,
            vx: (Math.random() - 0.5) * 30,
            vy: upwardSpeed,
            ax: 0,
            ay: isFireOrEmber ? -30 : -20, // Strong upward buoyancy to counteract drag
            size: type === 'smoke' ? 15 + Math.random() * 25 : (1 + Math.random() * 2), // 3x smaller (was 3-8, now 1-3)
            maxSize: type === 'smoke' ? 40 : 4,
            opacity: type === 'smoke' ? 0.4 : 0.9,
            life: 1.0,
            lifeDecay: lifeDecay,
            type: type,
            hue: type === 'smoke' ? 30 : 0, // All fire/ember start red, will change based on height
            saturation: type === 'smoke' ? 10 : 100,
            lightness: type === 'smoke' ? 20 : 50,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 2
        };
    }
    
    /**
     * Create individual flame tongues
     */
    createVolumetricFlames() {
        const flames = [];
        const numFlames = 60;
        const spacing = TETRIS.WIDTH / numFlames; // Evenly space across width
        
        for (let i = 0; i < numFlames; i++) {
            flames.push({
                x: spacing * i + spacing / 2, // Center each flame in its slot
                baseY: TETRIS.HEIGHT,
                height: 80 + Math.random() * 120,
                width: 20 + Math.random() * 35,
                swayPhase: Math.random() * Math.PI * 2,
                swaySpeed: 2 + Math.random() * 3,
                swayAmount: 8 + Math.random() * 15,
                flickerPhase: Math.random() * Math.PI * 2,
                flickerSpeed: 3 + Math.random() * 4,
                scalePhase: Math.random() * Math.PI * 2,
                scaleSpeed: 2 + Math.random() * 2
            });
        }
        
        return flames;
    }
    

    
    /**
     * Create heat distortion field
     */
    createHeatDistortion() {
        const waves = [];
        const numWaves = 8;
        
        for (let i = 0; i < numWaves; i++) {
            waves.push({
                y: (TETRIS.HEIGHT / numWaves) * i,
                amplitude: 2 + Math.random() * 4,
                frequency: 0.015 + Math.random() * 0.01,
                phase: Math.random() * Math.PI * 2,
                speed: 3 + Math.random() * 2
            });
        }
        
        return { waves };
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
            // Replace dead particles
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
            
            // Apply drag (much less for fire/ember so they can reach the top)
            particle.vx *= 0.98;
            if (particle.type === 'smoke') {
                particle.vy *= 0.99; // Smoke slows down
            } else {
                particle.vy *= 0.995; // Fire/ember maintains momentum better
            }
            
            // Update position
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            
            // Update size (grow for smoke, stay for fire)
            if (particle.type === 'smoke') {
                particle.size = Math.min(particle.maxSize, particle.size + 15 * deltaTime);
            }
            
            // Update rotation
            particle.rotation += particle.rotationSpeed * deltaTime;
            
            // Update color based on height for all fire/ember particles (color transition effect)
            if (particle.type === 'fire' || particle.type === 'ember') {
                // Calculate height progress: 0 at bottom, 1 at top
                const heightProgress = Math.max(0, Math.min(1, 1 - (particle.y / TETRIS.HEIGHT)));
                
                // Transition: white (bottom) -> yellow -> orange -> red -> dark (top)
                particle.hue = 60 - heightProgress * 60; // 60 (yellow) to 0 (red) degrees
                particle.lightness = 90 - heightProgress * 60; // 90% (white/bright) to 30% (dark)
                particle.saturation = 20 + heightProgress * 80; // 20% (desaturated/white) to 100% (saturated red)
            }
            
            // Update life
            particle.life -= particle.lifeDecay * deltaTime;
            
            // Reset if dead or way off-screen (allow particles to go to top)
            if (particle.life <= 0 || particle.y < -200) {
                Object.assign(particle, this.createFireParticle());
            }
        });
        
        // Update volumetric flames
        this.visuals.volumetricFlames.forEach(flame => {
            flame.swayPhase += flame.swaySpeed * deltaTime;
            flame.flickerPhase += flame.flickerSpeed * deltaTime;
            flame.scalePhase += flame.scaleSpeed * deltaTime;
        });
        

        
        // Update radial glow
        this.visuals.radialGlow.phase += this.visuals.radialGlow.speed * deltaTime;

        // Animated UI colors handled by BaseTheme
    }

    /**
     * Draw advanced fire background
     */
    drawBackground(ctx, opacity) {
        // Draw pulsing radial glow first (background layer)
        this.drawRadialGlow(ctx, opacity);
        
        // Create off-screen canvas for blur effect
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = TETRIS.WIDTH;
        tempCanvas.height = TETRIS.HEIGHT;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Draw volumetric flames to temp canvas (will be blurred)
        this.drawVolumetricFlames(tempCtx, opacity);
        
        // Apply blur to flames and draw back to main canvas
        ctx.save();
        ctx.filter = 'blur(8px)';
        ctx.drawImage(tempCanvas, 0, 0);
        ctx.restore();
        
        // Draw a sharper version of flames on top at lower opacity for detail
        ctx.save();
        ctx.globalAlpha = 0.05;
        ctx.drawImage(tempCanvas, 0, 0);
        ctx.restore();
        
        // Draw fire particles directly to main canvas (no blur - keeps embers sharp)
        this.drawFireParticles(ctx, opacity);
    }
    
    /**
     * Draw individual layered flame tongues
     */
    drawVolumetricFlames(ctx, opacity) {
        const flames = this.visuals.volumetricFlames;
        
        // Draw in 3 passes: yellow base, orange middle, red tips
        const passes = [
            { color: '#ffff00', heightPercent: 1.0, opacity: 0.6 },    // Yellow - full height
            { color: '#ff8800', heightPercent: 0.7, opacity: 0.7 },    // Orange - 70% height
            { color: '#ff3300', heightPercent: 0.4, opacity: 0.8 }     // Red - 40% height (tips)
        ];
        
        passes.forEach(pass => {
            flames.forEach(flame => {
                this.drawFlameTongue(ctx, flame, pass.color, pass.heightPercent, pass.opacity * opacity);
            });
        });
    }
    
    /**
     * Draw a single flame tongue with bezier curves
     */
    drawFlameTongue(ctx, flame, color, heightPercent, opacity) {
        const flicker = Math.sin(flame.flickerPhase) * 0.3 + 0.7; // 0.4 to 1.0
        const scale = Math.sin(flame.scalePhase) * 0.15 + 0.85; // 0.7 to 1.0
        const sway = Math.sin(flame.swayPhase) * flame.swayAmount;
        
        const currentHeight = flame.height * heightPercent * flicker * scale;
        const currentWidth = flame.width * scale;
        
        ctx.save();
        ctx.globalAlpha = opacity;
        
        // Draw flame tongue shape
        ctx.fillStyle = color;
        ctx.beginPath();
        
        // Start at base left
        ctx.moveTo(flame.x - currentWidth / 2, flame.baseY);
        
        // Left curve up
        const leftControlX = flame.x - currentWidth / 3 + sway * 0.3;
        const leftControlY = flame.baseY - currentHeight * 0.5;
        const tipX = flame.x + sway;
        const tipY = flame.baseY - currentHeight;
        ctx.quadraticCurveTo(leftControlX, leftControlY, tipX, tipY);
        
        // Right curve down
        const rightControlX = flame.x + currentWidth / 3 + sway * 0.3;
        const rightControlY = flame.baseY - currentHeight * 0.5;
        ctx.quadraticCurveTo(rightControlX, rightControlY, flame.x + currentWidth / 2, flame.baseY);
        
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
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
            
            const lifeOpacity = Math.min(1, particle.life * 2); // Fade out in last 50% of life
            const currentOpacity = particle.opacity * lifeOpacity * opacity;
            
            if (particle.type === 'smoke') {
                // Draw smoke
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
                // Draw fire/ember with glow
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
                
                // Bright core
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
     * Draw heat distortion effect
     */
    drawHeatDistortion(ctx, opacity) {
        const waves = this.visuals.heatDistortion.waves;
        
        ctx.save();
        ctx.globalAlpha = opacity * 0.15;
        
        waves.forEach((wave, index) => {
            // Create wavy distortion bands
            const gradient = ctx.createLinearGradient(0, wave.y - 20, 0, wave.y + 20);
            gradient.addColorStop(0, 'transparent');
            gradient.addColorStop(0.5, `rgba(255, 100, 0, ${0.2 * opacity})`);
            gradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(0, wave.y - 20);
            
            for (let x = 0; x <= TETRIS.WIDTH; x += 5) {
                const distortion = Math.sin(x * wave.frequency + wave.phase) * wave.amplitude;
                const y = wave.y + distortion;
                ctx.lineTo(x, y);
            }
            
            ctx.lineTo(TETRIS.WIDTH, wave.y + 20);
            
            for (let x = TETRIS.WIDTH; x >= 0; x -= 5) {
                const distortion = Math.sin(x * wave.frequency + wave.phase) * wave.amplitude;
                const y = wave.y + distortion + 20;
                ctx.lineTo(x, y);
            }
            
            ctx.closePath();
            ctx.fill();
        });
        
        ctx.restore();
    }
    
    /**
     * Draw pulsing radial glow background
     */
    drawRadialGlow(ctx, opacity) {
        const glow = this.visuals.radialGlow;
        const pulse = Math.sin(glow.phase) * 0.3 + 0.7; // 0.4 to 1.0 - noticeable pulse
        
        // Full size glow, pulsing opacity only
        const maxRadius = Math.sqrt(TETRIS.WIDTH * TETRIS.WIDTH + TETRIS.HEIGHT * TETRIS.HEIGHT);
        const currentRadius = maxRadius; // Full size, no expansion
        
        const centerX = TETRIS.WIDTH / 2;
        const centerY = TETRIS.HEIGHT;
        
        // Create radial gradient from center bottom
        const gradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, currentRadius
        );
        
        // Add tons of color stops to eliminate banding
        const baseOpacity = opacity * pulse;
        const numStops = 30;
        for (let i = 0; i < numStops; i++) {
            const t = i / (numStops - 1); // 0 to 1
            const r = 255 - t * 205; // 255 to 50
            const g = Math.max(0, 120 - t * 120); // 120 to 0
            const b = 0;
            const a = (0.4 - t * 0.4) * baseOpacity; // Fade opacity
            gradient.addColorStop(t, `rgba(${r}, ${g}, ${b}, ${a})`);
        }
        
        ctx.save();
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, TETRIS.WIDTH, TETRIS.HEIGHT);
        ctx.restore();
    }

}
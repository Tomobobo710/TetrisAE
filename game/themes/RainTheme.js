/**
 * RainTheme
 *
 * Dynamic rain background with clouds, lightning, thunder, and faux 3D depth effects
 */
class RainTheme extends BaseTheme {
    constructor() {
        super();
        this.name = 'Rain';

        // Theme colors and styling - blues and grays for rain
        this.playfield = {
            background: 'rgba(10, 20, 30, 0.95)',
            border: '#4a90e2',
            grid: 'rgba(74, 144, 226, 0.1)',
            shadow: 'rgba(74, 144, 226, 0.4)'
        };
        this.pieces = {
             I: { base: '#0088ff', glow: '#00ffff', shadow: '#004466' },
             O: { base: '#4a90e2', glow: '#00ffff', shadow: '#225580' },
             T: { base: '#0066cc', glow: '#00ffff', shadow: '#003366' },
             S: { base: '#00aaff', glow: '#00ffff', shadow: '#005577' },
             Z: { base: '#0099dd', glow: '#00ffff', shadow: '#004c6e' },
             J: { base: '#0077bb', glow: '#00ffff', shadow: '#003d5d' },
             L: { base: '#33bbff', glow: '#00ffff', shadow: '#1a5d80' },
             garbage: { base: '#666666', glow: '#666666', shadow: '#444444' }
         };
        this.ui = {
            background: 'rgba(10, 20, 30, 0.9)',
            text: '#ffffff',
            accent: '#4a90e2',
            border: '#4a90e2'
        };
        this.background = {
            type: 'rain_storm',
            colors: ['#001122', '#223344', '#4a90e2', '#ffffff'],
            intensity: 0.8
        };

        // Z-depth for painter's algorithm
        this.depthLayers = {
            background: 0,
            rain: 1,
            lightning: 2,
            clouds: 3,
            flash: 4
        };

        // Initialize visuals
        this.visuals = {};
        this.visuals.rainParticles = this.createRainParticleSystem();
        this.visuals.cloudParticles = this.createCloudParticleSystem();
        this.visuals.lightning = { active: false, timer: 0, duration: 0, intensity: 0, bolts: [], flashIntensity: 0 };
        this.visuals.thunder = { active: false, timer: 0, shake: 0 };

        // Wind and turbulence
        this.windSpeed = 50; // Base wind speed
        this.windVariance = 0.3; // Wind variation
        this.turbulenceTime = 0;

        // Parallax speed for faux 3D
        this.parallaxSpeed = 0.5;

        // Enable BaseTheme animated UI colors
        this.uiAnimation.enabled = true;
        this.uiAnimation.speed = 0.3; // Slower for rain
        this.uiAnimation.colors = [
            '#4a90e2', // Blue
            '#0066cc', // Darker blue
            '#0088ff', // Bright blue
            '#00aaff', // Light blue
            '#87ceeb', // Sky blue
            '#ffffff', // White
            '#87ceeb', // Sky blue
            '#00aaff', // Light blue
            '#0088ff', // Bright blue
            '#0066cc'  // Darker blue
        ];

        // Rain theme color palette that changes over time
        this.rainPalette = {
            currentHue: 220, // Start with blue
            time: 0
        };
    }

    /**
     * Setup - fast-forward to populate particle systems
     */
    setup() {
        const frameTime = 1 / 60;
        const numFrames = 10 * 60; // 10 seconds
        for (let i = 0; i < numFrames; i++) {
            this.update(frameTime);
        }
    }

    /**
     * Handle special game events (like tetris clears)
     * Called by the game when special events happen
     */
    handleGameEvent(eventType, eventData) {
        if (eventType === 'tetris') {
            // Trigger lightning flash when player gets a tetris
            this.triggerLightningFromTetris();
        }
    }

    /**
     * Trigger lightning specifically for tetris events
     */
    triggerLightningFromTetris() {
        // Force lightning to trigger immediately
        this.visuals.lightning.active = true;
        this.visuals.lightning.timer = 0;
        this.visuals.lightning.duration = 0.2 + Math.random() * 0.3; // Slightly longer flash
        this.visuals.lightning.intensity = 1.0; // Max intensity
        this.visuals.lightning.flashIntensity = 1.0; // Start flash at full intensity
        this.visuals.lightning.growthProgress = 0; // Start with no bolt visible

        // Generate lightning bolt geometry - make it more dramatic
        this.visuals.lightning.bolts = this.generateLightningBolts();

        // Override with a more spectacular bolt for tetris
        if (this.visuals.lightning.bolts.length > 0) {
            this.visuals.lightning.bolts[0] = this.generateSpectacularBolt();
        }

        // Trigger thunder as well
        this.triggerThunder();
    }

    /**
     * Generate a more spectacular lightning bolt for special events
     */
    generateSpectacularBolt() {
        const bolt = {
            segments: [],
            branches: []
        };

        // Start from top with dramatic placement
        let startX = TETRIS.WIDTH * (0.3 + Math.random() * 0.4); // Center-biased
        let startY = Math.random() * TETRIS.HEIGHT * 0.3; // Higher up

        // End dramatically low
        let endX = startX + (Math.random() - 0.5) * TETRIS.WIDTH * 0.5;
        let endY = TETRIS.HEIGHT * (0.8 + Math.random() * 0.15); // Very low

        // Generate main bolt segments with more detail
        bolt.segments = this.generateBoltPath(startX, startY, endX, endY, 12);

        // Add more branches for spectacle
        const branchCount = 2 + Math.floor(Math.random() * 4); // 2-5 branches
        for (let i = 0; i < branchCount; i++) {
            const branchStartIndex = Math.floor(Math.random() * (bolt.segments.length - 3)) + 1;
            const branchStart = bolt.segments[branchStartIndex];

            const branchLength = 40 + Math.random() * 80;
            const branchAngle = (Math.random() - 0.5) * Math.PI * 0.7;
            const branchEndX = branchStart.x + Math.cos(branchAngle) * branchLength;
            const branchEndY = branchStart.y + Math.sin(branchAngle) * branchLength;

            const branch = this.generateBoltPath(branchStart.x, branchStart.y, branchEndX, branchEndY, 6);
            bolt.branches.push(branch);
        }

        return bolt;
    }

    /**
     * Create rain particle system
     */
    createRainParticleSystem() {
        const particles = [];
        const numParticles = 200;

        for (let i = 0; i < numParticles; i++) {
            particles.push(this.createRainDrop());
        }

        return {
            particles: particles,
            emitTimer: 0,
            emitRate: 0.01 // Emit particles every 0.01s
        };
    }

    createRainDrop() {
        const depth = Math.random(); // 0-1 for faux 3D
        const size = 1 + depth * 3; // Larger drops in foreground
        const speed = 200 + depth * 300; // Faster drops in foreground

        return {
            x: TETRIS.WIDTH / 2 + (Math.random() - 0.5) * TETRIS.WIDTH * 1.25, // Centered on screen, past both edges
            y: -Math.random() * 100,
            vx: this.windSpeed * (0.8 + Math.random() * 0.4),
            vy: speed,
            ax: 0,
            ay: 0,
            size: size,
            opacity: 0.6 + depth * 0.4,
            life: 1.0,
            lifeDecay: 0.01,
            depth: depth,
            zDepth: this.depthLayers.rain, // Z-depth for painter's algorithm
            trailLength: 15 + depth * 25, // Fixed trail length in pixels, not frames
            trail: [] // For streak effect
        };
    }

    /**
     * Create cloud particle system
     */
    createCloudParticleSystem() {
        const particles = [];
        const numParticles = 50;

        for (let i = 0; i < numParticles; i++) {
            particles.push(this.createCloudParticle());
        }

        return {
            particles: particles,
            emitTimer: 0,
            emitRate: 0.1 // Emit clouds more slowly
        };
    }

    createCloudParticle() {
        const depth = Math.random();
        return {
            x: TETRIS.WIDTH / 2 + (Math.random() - 0.5) * TETRIS.WIDTH * 1.25, // Centered on screen, past both edges like rain
            y: Math.random() * TETRIS.HEIGHT * 0.4, // Upper portion
            vx: (Math.random() - 0.5) * 10 * depth, // Slower for background
            vy: (Math.random() - 0.5) * 5 * depth,
            ax: 0,
            ay: 0,
            size: 50 + Math.random() * 100,
            opacity: 0.1 + depth * 0.3,
            life: 1.0,
            lifeDecay: 0.0005,
            depth: depth,
            zDepth: this.depthLayers.clouds, // Z-depth for painter's algorithm
            hue: 200 + Math.random() * 40, // Blue-gray hues
            saturation: 10 + Math.random() * 20,
            lightness: 30 + Math.random() * 30
        };
    }

    /**
     * Get wind turbulence for organic movement
     */
    getWindTurbulence(time) {
        const baseWind = this.windSpeed;
        const turbulence = Math.sin(time * 2) * 0.3 + Math.cos(time * 0.7) * 0.2;
        return baseWind + baseWind * turbulence * this.windVariance;
    }

    /**
     * Update rain theme animation
     */
    update(deltaTime) {
        super.update(deltaTime);

        this.turbulenceTime += deltaTime;

        // Update rain palette over time
        this.rainPalette.time += deltaTime;
        this.rainPalette.currentHue = 220 + Math.sin(this.rainPalette.time * 0.1) * 20; // Slowly cycle blue hues

        // Update wind
        const currentWind = this.getWindTurbulence(this.turbulenceTime);

        // Update rain particle system
        const rainSystem = this.visuals.rainParticles;
        rainSystem.emitTimer += deltaTime;

        // Emit new rain drops
        if (rainSystem.emitTimer >= rainSystem.emitRate) {
            rainSystem.emitTimer = 0;
            const deadIndex = rainSystem.particles.findIndex(p => p.life <= 0);
            if (deadIndex !== -1) {
                rainSystem.particles[deadIndex] = this.createRainDrop();
            }
        }

        // Update rain particles
        rainSystem.particles.forEach(particle => {
            // Apply wind
            particle.vx = currentWind * (0.8 + particle.depth * 0.4);

            // Update position
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;

            // Update trail - maintain fixed pixel length regardless of time slowdown
            particle.trail.push({ x: particle.x, y: particle.y, opacity: particle.opacity });

            // Remove trail points that are too far from current position (fixed pixel distance)
            const maxTrailDistance = particle.trailLength;
            while (particle.trail.length > 1) {
                const firstPoint = particle.trail[0];
                const dx = particle.x - firstPoint.x;
                const dy = particle.y - firstPoint.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance <= maxTrailDistance) break;
                particle.trail.shift();
            }

            // Life decay
            particle.life -= particle.lifeDecay * deltaTime;

            // Reset if off-screen or dead
            if (particle.life <= 0 || particle.y > TETRIS.HEIGHT + 50 ||
                particle.x < -50 || particle.x > TETRIS.WIDTH + 50) {
                Object.assign(particle, this.createRainDrop());
            }
        });

        // Update cloud particle system
        const cloudSystem = this.visuals.cloudParticles;
        cloudSystem.emitTimer += deltaTime;

        // Emit new clouds occasionally
        if (cloudSystem.emitTimer >= cloudSystem.emitRate && Math.random() < 0.3) {
            cloudSystem.emitTimer = 0;
            const deadIndex = cloudSystem.particles.findIndex(p => p.life <= 0);
            if (deadIndex !== -1) {
                cloudSystem.particles[deadIndex] = this.createCloudParticle();
            }
        }

        // Update cloud particles
        cloudSystem.particles.forEach(particle => {
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;

            // Parallax effect based on depth
            const parallaxOffset = this.parallaxSpeed * particle.depth * deltaTime * 10;
            particle.x += parallaxOffset;

            // Life decay
            particle.life -= particle.lifeDecay * deltaTime;

            // Reset if off-screen
            if (particle.x < -particle.size || particle.x > TETRIS.WIDTH + particle.size ||
                particle.y < -particle.size || particle.y > TETRIS.HEIGHT * 0.5 + particle.size) {
                Object.assign(particle, this.createCloudParticle());
            }
        });

        // Update lightning
        this.updateLightning(deltaTime);

        // Update thunder effects
        this.updateThunder(deltaTime);
    }

    /**
     * Update lightning effects with animated bolt growth
     */
    updateLightning(deltaTime) {
        const lightning = this.visuals.lightning;

        if (!lightning.active) {
            // Random chance to trigger lightning
            if (Math.random() < 0.005 * deltaTime * 60) { // ~0.3 per second
                lightning.active = true;
                lightning.timer = 0;
                lightning.duration = 0.15 + Math.random() * 0.25;
                lightning.intensity = 0.8 + Math.random() * 0.2;
                lightning.growthProgress = 0; // Start with no bolt visible
                lightning.flashIntensity = 1.0; // Start flash at full intensity

                // Generate lightning bolt geometry
                lightning.bolts = this.generateLightningBolts();

                // Calculate growth timing for animated effect
                lightning.growthDuration = 0.08 + Math.random() * 0.12; // 80-200ms to grow
                lightning.branchDelay = lightning.growthDuration * (0.3 + Math.random() * 0.4); // Branches appear later
            }
        } else {
            lightning.timer += deltaTime;

            // Animate bolt growth
            const growthTime = Math.min(lightning.timer, lightning.growthDuration);
            lightning.growthProgress = growthTime / lightning.growthDuration;

            // Flash decay over time
            lightning.flashIntensity *= 0.85; // Quick decay

            if (lightning.timer >= lightning.duration) {
                lightning.active = false;
                lightning.timer = 0;
                lightning.bolts = [];
                lightning.growthProgress = 0;
                lightning.flashIntensity = 0;

                // Trigger thunder after lightning
                this.triggerThunder();
            }
        }
    }

    /**
     * Generate lightning bolt geometry with branching
     */
    generateLightningBolts() {
        const bolts = [];
        const numBolts = 1 + Math.floor(Math.random() * 3); // 1-3 main bolts

        for (let i = 0; i < numBolts; i++) {
            const bolt = this.generateSingleBolt();
            bolts.push(bolt);
        }

        return bolts;
    }

    /**
     * Generate a single lightning bolt with branching
     */
    generateSingleBolt() {
        const bolt = {
            segments: [],
            branches: []
        };

        // Start from top 25% of screen with some horizontal variation
        let startX = (Math.random() * 0.8 + 0.1) * TETRIS.WIDTH; // 10% to 90% across
        let startY = Math.random() * TETRIS.HEIGHT * 0.25; // Top 25%

        // End at 60-90% of screen height with some horizontal drift
        let endX = startX + (Math.random() - 0.5) * TETRIS.WIDTH * 0.3;
        let endY = TETRIS.HEIGHT * (0.6 + Math.random() * 0.3); // 60-90% down

        // Generate main bolt segments
        bolt.segments = this.generateBoltPath(startX, startY, endX, endY, 8);

        // Add some branches
        if (Math.random() < 0.7) {
            const branchCount = 1 + Math.floor(Math.random() * 3);
            for (let i = 0; i < branchCount; i++) {
                const branchStartIndex = Math.floor(Math.random() * (bolt.segments.length - 2)) + 1;
                const branchStart = bolt.segments[branchStartIndex];

                const branchLength = 30 + Math.random() * 70;
                const branchAngle = (Math.random() - 0.5) * Math.PI * 0.6;
                const branchEndX = branchStart.x + Math.cos(branchAngle) * branchLength;
                const branchEndY = branchStart.y + Math.sin(branchAngle) * branchLength;

                const branch = this.generateBoltPath(branchStart.x, branchStart.y, branchEndX, branchEndY, 4);
                bolt.branches.push(branch);
            }
        }

        return bolt;
    }

    /**
     * Generate jagged bolt path between two points
     */
    generateBoltPath(startX, startY, endX, endY, numSegments) {
        const segments = [];
        const totalDistance = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
        const segmentLength = totalDistance / numSegments;

        let currentX = startX;
        let currentY = startY;

        segments.push({ x: currentX, y: currentY });

        for (let i = 1; i < numSegments; i++) {
            const t = i / numSegments;
            const idealX = startX + (endX - startX) * t;
            const idealY = startY + (endY - startY) * t;

            // Add zigzag displacement
            const displacement = 15 + Math.random() * 25;
            const angle = Math.atan2(endY - startY, endX - startX);
            const perpAngle = angle + Math.PI / 2;
            const offset = (Math.random() - 0.5) * displacement * 2;

            currentX = idealX + Math.cos(perpAngle) * offset;
            currentY = idealY + Math.sin(perpAngle) * offset;

            segments.push({ x: currentX, y: currentY });
        }

        segments.push({ x: endX, y: endY });
        return segments;
    }

    /**
     * Get dynamic piece colors based on rain palette with distinct hues per piece
     */
    getDynamicPieceColors(pieceType, context) {
        const baseHue = this.rainPalette.currentHue;

        // Each piece gets a distinct hue within blue-to-grey-to-light-green range
        // Sticking to the rain theme's color palette for cohesion
        let hueOffset;
        switch(pieceType) {
            case 'I': hueOffset = 0; break;      // Pure base hue (bright blue)
            case 'O': hueOffset = -15; break;    // Deeper blue
            case 'T': hueOffset = 15; break;     // Cyan tint
            case 'S': hueOffset = 30; break;     // Light cyan/green
            case 'Z': hueOffset = -30; break;    // Darker blue
            case 'J': hueOffset = 45; break;     // Light green
            case 'L': hueOffset = -45; break;    // Steel blue
            case 'garbage': hueOffset = 0; break; // Neutral grey (slight offset for distinction)
            default: hueOffset = 0;
        }

        const pieceHue = (baseHue + hueOffset) % 360;

        // Carefully tuned saturation/lightness within blue-grey-green range
        let saturation, lightness;
        switch(pieceType) {
            case 'I': saturation = 0.85; lightness = 0.65; break;  // Bright blue
            case 'O': saturation = 0.75; lightness = 0.55; break;  // Deep blue
            case 'T': saturation = 0.8; lightness = 0.6; break;    // Cyan
            case 'S': saturation = 0.7; lightness = 0.6; break;   // Light blue-green
            case 'Z': saturation = 0.8; lightness = 0.5; break;   // Steel blue
            case 'J': saturation = 0.65; lightness = 0.55; break; // Grey-blue
            case 'L': saturation = 0.6; lightness = 0.65; break;  // Light grey-green
            case 'garbage': saturation = 0.3; lightness = 0.4; break; // Neutral grey
            default: saturation = 0.75; lightness = 0.6;
        }

        // Adjust for different contexts (ghost, hold, next)
        if (context.source === 'ghost') {
            saturation *= 0.3;  // More desaturated for ghost
            lightness += 0.25; // Brighter for visibility
        } else if (context.source === 'hold' || context.source === 'next') {
            saturation *= 1.1;  // Slightly more saturated for UI
            lightness *= 0.9;   // Slightly darker for UI
        }

        // Apply lightning flash effect
        if (this.visuals.lightning.flashIntensity > 0.1) {
            saturation = Math.min(1, saturation + this.visuals.lightning.flashIntensity * 0.3);
            lightness = Math.min(1, lightness + this.visuals.lightning.flashIntensity * 0.5);
        }

        const base = this.hslToHex(pieceHue, saturation, lightness);
        const glow = this.hslToHex(pieceHue, Math.min(1, saturation * 1.1), Math.min(1, lightness + 0.1));
        const shadow = this.hslToHex(pieceHue, saturation * 0.7, Math.max(0, lightness - 0.3));

        return { base, glow, shadow };
    }

    /**
     * Get dynamic UI accent color based on rain palette
     */
    getDynamicUIAccent(context) {
        const hue = this.rainPalette.currentHue;
        const role = context.role || 'misc';

        if (role === 'score' || role === 'level' || role === 'lines') {
            return this.hslToHex(hue, 0.9, 0.7);
        } else if (role === 'label') {
            return this.hslToHex(hue, 0.8, 0.8);
        }

        return this.hslToHex(hue, 0.85, 0.65);
    }

    /**
     * Trigger thunder effects
     */
    triggerThunder() {
        this.visuals.thunder.active = true;
        this.visuals.thunder.timer = 0;
        this.visuals.thunder.shake = 0.5 + Math.random() * 0.5;
    }

    /**
     * Update thunder effects
     */
    updateThunder(deltaTime) {
        const thunder = this.visuals.thunder;

        if (thunder.active) {
            thunder.timer += deltaTime;

            // Screen shake decays over time
            thunder.shake *= 0.9;

            if (thunder.shake < 0.01) {
                thunder.active = false;
                thunder.timer = 0;
                thunder.shake = 0;
            }
        }
    }

    /**
     * Draw rain background with proper Z-depth layering (Painter's algorithm)
     */
    drawBackground(ctx, opacity) {
        if (opacity <= 0) return;

        ctx.save();

        // Create render list with all drawable objects
        const renderList = [];

        // Add clouds to render list
        this.visuals.cloudParticles.particles.forEach(cloud => {
            if (cloud.life > 0) {
                renderList.push({
                    type: 'cloud',
                    zDepth: cloud.zDepth,
                    data: cloud
                });
            }
        });

        // Add rain particles to render list
        this.visuals.rainParticles.particles.forEach(rain => {
            if (rain.life > 0) {
                renderList.push({
                    type: 'rain',
                    zDepth: rain.zDepth,
                    data: rain
                });
            }
        });

        // Add lightning bolts to render list
        if (this.visuals.lightning.active) {
            this.visuals.lightning.bolts.forEach(bolt => {
                renderList.push({
                    type: 'lightning',
                    zDepth: this.depthLayers.lightning,
                    data: bolt
                });
            });
        }

        // Sort by Z-depth (painters algorithm - back to front)
        renderList.sort((a, b) => a.zDepth - b.zDepth);

        // Render all objects in depth order
        renderList.forEach(item => {
            switch (item.type) {
                case 'cloud':
                    this.drawSingleCloud(ctx, item.data, opacity);
                    break;
                case 'rain':
                    this.drawSingleRainDrop(ctx, item.data, opacity);
                    break;
                case 'lightning':
                    this.drawSingleLightningBolt(ctx, item.data, opacity);
                    break;
            }
        });

        // Draw lightning flash on top of everything
        if (this.visuals.lightning.active) {
            this.drawLightningFlash(ctx, opacity);
        }

        ctx.restore();
    }

    /**
     * Simple seeded random function for consistent cloud rendering
     */
    seededRandom(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }

    /**
     * Draw single cloud (for painter's algorithm)
     */
    drawSingleCloud(ctx, particle, opacity) {
        ctx.save();
        const currentOpacity = particle.opacity * opacity;

        // Gentle sway motion
        const sway = Math.sin(this.turbulenceTime * 0.5 + particle.x * 0.01) * 5;
        const x = particle.x + sway;

        // Simple cloud shape using few circles (4x bigger)
        const baseSize = particle.size * 0.3 * 4;
        const positions = [
            { x: x, y: particle.y, size: baseSize * 1.2 },
            { x: x - baseSize * 0.8, y: particle.y + baseSize * 0.2, size: baseSize },
            { x: x + baseSize * 0.8, y: particle.y + baseSize * 0.2, size: baseSize },
            { x: x - baseSize * 0.4, y: particle.y - baseSize * 0.3, size: baseSize * 0.8 },
            { x: x + baseSize * 0.4, y: particle.y - baseSize * 0.3, size: baseSize * 0.8 }
        ];

        positions.forEach(pos => {
            const gradient = ctx.createRadialGradient(
                pos.x, pos.y, 0,
                pos.x, pos.y, pos.size
            );
            gradient.addColorStop(0, `hsla(${particle.hue}, ${particle.saturation}%, ${particle.lightness}%, ${currentOpacity * 0.8})`);
            gradient.addColorStop(0.7, `hsla(${particle.hue}, ${particle.saturation}%, ${particle.lightness - 10}%, ${currentOpacity * 0.3})`);
            gradient.addColorStop(1, 'transparent');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, pos.size, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();
    }

    /**
     * Convert hex to HSL
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
     * Convert HSL to hex
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
     * Draw lightning flash (one per bolt, centered on each bolt's top)
     */
    drawLightningFlash(ctx, opacity) {
        const lightning = this.visuals.lightning;
        const intensity = lightning.intensity;

        // Draw individual flash for each bolt
        lightning.bolts.forEach(bolt => {
            if (bolt.segments.length > 0) {
                // Find the top of this specific bolt
                let minY = TETRIS.HEIGHT;
                let avgX = 0;
                let count = 0;

                bolt.segments.forEach(segment => {
                    minY = Math.min(minY, segment.y);
                    avgX += segment.x;
                    count++;
                });
                avgX /= count;

                // Draw flash centered on this bolt's top
                ctx.save();
                ctx.globalCompositeOperation = 'screen';
                ctx.globalAlpha = intensity * opacity;

                const gradient = ctx.createRadialGradient(
                    avgX, minY, 0,
                    avgX, minY, Math.max(TETRIS.WIDTH, TETRIS.HEIGHT) / 3
                );

                gradient.addColorStop(0, `rgba(255, 255, 255, ${intensity * 0.8})`);
                gradient.addColorStop(0.4, `rgba(173, 216, 230, ${intensity * 0.4})`);
                gradient.addColorStop(1, 'transparent');

                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, TETRIS.WIDTH, TETRIS.HEIGHT);

                ctx.restore();
            }
        });
    }

    /**
     * Draw single lightning bolt (for painter's algorithm)
     */
    drawSingleLightningBolt(ctx, bolt, opacity) {
        const lightning = this.visuals.lightning;

        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.shadowColor = 'white';
        ctx.shadowBlur = 10;

        // Draw main bolt with growth animation
        const mainBoltSegments = Math.ceil(bolt.segments.length * lightning.growthProgress);
        if (mainBoltSegments > 1) {
            const partialSegments = bolt.segments.slice(0, mainBoltSegments);
            this.drawBoltPath(ctx, partialSegments, opacity * lightning.intensity);
        }

        // Draw branches with delay
        if (lightning.timer >= lightning.branchDelay) {
            const branchProgress = Math.min(1, (lightning.timer - lightning.branchDelay) / lightning.growthDuration);
            bolt.branches.forEach(branch => {
                const branchSegments = Math.ceil(branch.length * branchProgress);
                if (branchSegments > 1) {
                    const partialBranch = branch.slice(0, branchSegments);
                    this.drawBoltPath(ctx, partialBranch, opacity * lightning.intensity * 0.7);
                }
            });
        }

        ctx.restore();
    }

    /**
     * Draw a bolt path with enhanced glow effects
     */
    drawBoltPath(ctx, segments, opacity) {
        if (segments.length < 2) return;

        ctx.save();
        ctx.globalAlpha = opacity;

        // Multiple layered glow effects for more dramatic lightning
        const glowLayers = [
            { width: 8, blur: 20, alpha: opacity * 0.3, color: 'rgba(255, 255, 255, 0.8)' },
            { width: 5, blur: 15, alpha: opacity * 0.5, color: 'rgba(173, 216, 230, 0.9)' },
            { width: 3, blur: 8, alpha: opacity * 0.7, color: 'rgba(255, 255, 255, 0.95)' },
            { width: 1.5, blur: 3, alpha: opacity * 0.9, color: 'white' }
        ];

        // Draw glow layers (back to front)
        for (const layer of glowLayers) {
            ctx.shadowColor = layer.color;
            ctx.shadowBlur = layer.blur;
            ctx.strokeStyle = layer.color;
            ctx.lineWidth = layer.width;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.globalAlpha = layer.alpha;

            ctx.beginPath();
            ctx.moveTo(segments[0].x, segments[0].y);

            for (let i = 1; i < segments.length; i++) {
                ctx.lineTo(segments[i].x, segments[i].y);
            }

            ctx.stroke();
        }

        // Final crisp white core
        ctx.shadowBlur = 0;
        ctx.globalAlpha = opacity;
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(segments[0].x, segments[0].y);

        for (let i = 1; i < segments.length; i++) {
            ctx.lineTo(segments[i].x, segments[i].y);
        }

        ctx.stroke();

        ctx.restore();
    }

    /**
     * Draw single rain drop (for painter's algorithm)
     */
    drawSingleRainDrop(ctx, particle, opacity) {
        ctx.save();
        const currentOpacity = particle.opacity * opacity * particle.life;

        // Draw trail only (no droplet heads)
        if (particle.trail.length > 1) {
            ctx.strokeStyle = `rgba(173, 216, 230, ${currentOpacity * 0.8})`;
            ctx.lineWidth = particle.size * 0.5;
            ctx.lineCap = 'round';
            ctx.beginPath();

            // Create fading gradient along the trail
            for (let i = 0; i < particle.trail.length - 1; i++) {
                const point = particle.trail[i];
                const nextPoint = particle.trail[i + 1];

                if (i === 0) {
                    ctx.moveTo(point.x, point.y);
                } else {
                    ctx.lineTo(point.x, point.y);
                }
            }
            ctx.stroke();

            // Add subtle glow effect to the trail
            ctx.shadowColor = `rgba(173, 216, 230, ${currentOpacity * 0.3})`;
            ctx.shadowBlur = particle.size * 2;
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        ctx.restore();
    }
}
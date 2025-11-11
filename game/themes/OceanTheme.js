/**
 * OceanTheme - IMPRESSIVE underwater ocean theme with advanced water effects
 */
class OceanTheme extends BaseTheme {
    constructor() {
        super();
        this.name = 'Ocean';

        // Theme colors and styling
        this.playfield = {
            background: 'rgba(0, 20, 40, 0.93)',
            border: '#00aaff',
            grid: 'rgba(0, 170, 255, 0.12)',
            shadow: 'rgba(0, 170, 255, 0.35)'
        };
        this.pieces = {
             I: { base: '#00aaff', glow: '#88ddff', shadow: '#005588' },
             O: { base: '#0088ff', glow: '#88ddff', shadow: '#004488' },
             T: { base: '#00ccff', glow: '#88ddff', shadow: '#006688' },
             S: { base: '#00ffcc', glow: '#88ffee', shadow: '#008866' },
             Z: { base: '#0066ff', glow: '#8899ff', shadow: '#003388' },
             J: { base: '#0044ff', glow: '#8888ff', shadow: '#002288' },
             L: { base: '#00ddff', glow: '#88eeff', shadow: '#006688' },
             garbage: { base: '#666666', glow: '#666666', shadow: '#444444' }
         };
        this.ui = {
            background: 'rgba(0, 15, 30, 0.9)',
            text: '#ffffff',
            accent: '#00aaff',
            border: '#00aaff'
        };
        this.background = {
            type: 'underwater',
            colors: ['#00aaff', '#0066ff', '#00ffcc'],
            intensity: 0.65
        };

        // Initialize impressive water effects
        this.visuals = {};
        this.visuals.caustics = this.createCaustics();
        this.visuals.godRays = this.createGodRays();
        this.visuals.bubbles = this.createBubbles();
        this.visuals.particles = this.createFloatingParticles();
        this.visuals.kelp = this.createKelp();
        this.visuals.fish = this.createFish();
        this.visuals.jellyfish = this.createJellyfish();
        this.visuals.current = { phase: 0, strength: 0.3 };

        // Enable animated UI colors
        this.uiAnimation.enabled = true;
        this.uiAnimation.speed = 0.4; // Medium, watery feel
        this.uiAnimation.colors = [
            '#00aaff', // Light blue
            '#0066ff', // Blue
            '#00ffcc', // Cyan
            '#0044ff', // Dark blue
            '#00ddff', // Light cyan
            '#0088ff', // Medium blue
            '#00ccff', // Sky blue
            '#00aaff', // Light blue (back)
        ];
    }
    
    /**
     * Setup - fast-forward animation
     */
    setup() {
        const frameTime = 1 / 60;
        const numFrames = 30 * 60;
        
        for (let i = 0; i < numFrames; i++) {
            this.update(frameTime);
        }
    }

    /**
     * Create underwater caustics (dancing light patterns)
     */
    createCaustics() {
        const layers = [];
        
        // Multiple layers create more complex caustic patterns
        for (let i = 0; i < 3; i++) {
            const cells = [];
            const numCells = 8 + i * 4;
            
            for (let j = 0; j < numCells; j++) {
                cells.push({
                    x: Math.random() * TETRIS.WIDTH * 1.2 - TETRIS.WIDTH * 0.1,
                    y: Math.random() * TETRIS.HEIGHT * 1.2 - TETRIS.HEIGHT * 0.1,
                    vx: (Math.random() - 0.5) * 15,
                    vy: (Math.random() - 0.5) * 15,
                    radius: 40 + Math.random() * 80,
                    phase: Math.random() * Math.PI * 2,
                    speed: 1 + Math.random() * 2
                });
            }
            
            layers.push({
                cells: cells,
                opacity: 0.15 + i * 0.1,
                speed: 0.8 + i * 0.3
            });
        }
        
        return { layers };
    }

    /**
     * Create volumetric god rays (light shafts)
     */
    createGodRays() {
        const rays = [];
        const numRays = 6;
        
        for (let i = 0; i < numRays; i++) {
            rays.push({
                x: (TETRIS.WIDTH / (numRays + 1)) * (i + 1) + (Math.random() - 0.5) * 40,
                topWidth: 20 + Math.random() * 30,
                bottomWidth: 60 + Math.random() * 80,
                opacity: 0.15 + Math.random() * 0.15,
                sway: Math.random() * Math.PI * 2,
                swaySpeed: 0.5 + Math.random() * 0.5,
                swayAmount: 10 + Math.random() * 20
            });
        }
        
        return { rays };
    }

    /**
     * Create rising bubbles with physics
     */
    createBubbles() {
        const bubbles = [];
        
        for (let i = 0; i < 30; i++) {
            bubbles.push(this.createBubble());
        }
        
        return {
            bubbles: bubbles,
            spawnTimer: 0,
            spawnRate: 0.3
        };
    }
    
    createBubble() {
        const size = 2 + Math.random() * 6;
        return {
            x: Math.random() * TETRIS.WIDTH,
            y: TETRIS.HEIGHT + Math.random() * 100,
            size: size,
            vx: (Math.random() - 0.5) * 10,
            vy: -(20 + size * 3), // Smaller bubbles rise faster
            wobblePhase: Math.random() * Math.PI * 2,
            wobbleSpeed: 3 + Math.random() * 2,
            wobbleAmount: 5 + Math.random() * 10,
            opacity: 0.4 + Math.random() * 0.3,
            shimmerPhase: Math.random() * Math.PI * 2
        };
    }

    /**
     * Create floating particles/plankton
     */
    createFloatingParticles() {
        const particles = [];
        
        for (let i = 0; i < 50; i++) {
            particles.push({
                x: Math.random() * TETRIS.WIDTH,
                y: Math.random() * TETRIS.HEIGHT,
                size: 0.5 + Math.random() * 2,
                baseVx: (Math.random() - 0.5) * 10,
                baseVy: (Math.random() - 0.5) * 5,
                phase: Math.random() * Math.PI * 2,
                opacity: 0.2 + Math.random() * 0.3,
                twinklePhase: Math.random() * Math.PI * 2,
                twinkleSpeed: 2 + Math.random() * 3
            });
        }
        
        return particles;
    }

    /**
     * Create swaying kelp/seaweed
     */
    createKelp() {
        const kelp = [];
        const numKelp = 12;
        
        for (let i = 0; i < numKelp; i++) {
            const segments = 6 + Math.floor(Math.random() * 4);
            const baseX = (TETRIS.WIDTH / numKelp) * i + (Math.random() - 0.5) * 40;
            
            kelp.push({
                baseX: baseX,
                baseY: TETRIS.HEIGHT,
                segments: segments,
                segmentLength: 15 + Math.random() * 10,
                width: 3 + Math.random() * 4,
                swayPhase: Math.random() * Math.PI * 2,
                swaySpeed: 0.8 + Math.random() * 0.6,
                swayAmount: 15 + Math.random() * 20,
                color: Math.random() > 0.5 ? '#2d5a3d' : '#1a4d2e'
            });
        }
        
        return kelp;
    }

    /**
     * Create swimming fish with schooling behavior
     */
    createFish() {
        const fish = [];
        const numFish = 20;
        
        for (let i = 0; i < numFish; i++) {
            fish.push({
                x: Math.random() * TETRIS.WIDTH,
                y: Math.random() * TETRIS.HEIGHT * 0.8,
                vx: 30 + Math.random() * 40,
                vy: 0,
                size: 6 + Math.random() * 8,
                tailPhase: Math.random() * Math.PI * 2,
                tailSpeed: 8 + Math.random() * 4,
                schoolId: Math.floor(i / 5), // Groups of 5
                avoidanceRadius: 30,
                alignmentRadius: 60
            });
        }
        
        return fish;
    }

    /**
     * Create pulsing jellyfish
     */
    createJellyfish() {
        const jellyfish = [];
        
        for (let i = 0; i < 4; i++) {
            const numTentacles = 6 + Math.floor(Math.random() * 4);
            const tentacles = [];
            
            for (let j = 0; j < numTentacles; j++) {
                tentacles.push({
                    angle: (Math.PI * 2 / numTentacles) * j,
                    length: 30 + Math.random() * 40,
                    segments: 8,
                    wavePhase: Math.random() * Math.PI * 2,
                    waveSpeed: 3 + Math.random() * 2
                });
            }
            
            jellyfish.push({
                x: Math.random() * TETRIS.WIDTH,
                y: 50 + Math.random() * (TETRIS.HEIGHT * 0.6),
                vx: (Math.random() - 0.5) * 10,
                vy: 5 + Math.random() * 10,
                bellSize: 15 + Math.random() * 15,
                pulsePhase: Math.random() * Math.PI * 2,
                pulseSpeed: 2 + Math.random(),
                tentacles: tentacles,
                opacity: 0.6 + Math.random() * 0.2
            });
        }
        
        return jellyfish;
    }

    /**
     * Update ocean theme animation
     */
    update(deltaTime) {
        super.update(deltaTime);
        
        // Update current flow
        this.visuals.current.phase += deltaTime * 0.5;
        const currentX = Math.sin(this.visuals.current.phase) * this.visuals.current.strength;
        const currentY = Math.cos(this.visuals.current.phase * 0.7) * this.visuals.current.strength * 0.5;
        
        // Update caustics
        this.visuals.caustics.layers.forEach(layer => {
            layer.cells.forEach(cell => {
                cell.x += (cell.vx + currentX * 10) * deltaTime;
                cell.y += (cell.vy + currentY * 10) * deltaTime;
                cell.phase += cell.speed * deltaTime;
                
                // Wrap around
                if (cell.x < -TETRIS.WIDTH * 0.2) cell.x = TETRIS.WIDTH * 1.1;
                if (cell.x > TETRIS.WIDTH * 1.2) cell.x = -TETRIS.WIDTH * 0.1;
                if (cell.y < -TETRIS.HEIGHT * 0.2) cell.y = TETRIS.HEIGHT * 1.1;
                if (cell.y > TETRIS.HEIGHT * 1.2) cell.y = -TETRIS.HEIGHT * 0.1;
                
                // Oscillate radius for more dynamic caustics
                cell.radius = 60 + Math.sin(cell.phase) * 20;
            });
        });
        
        // Update god rays
        this.visuals.godRays.rays.forEach(ray => {
            ray.sway += ray.swaySpeed * deltaTime;
        });
        
        // Update bubbles
        const bubbleSystem = this.visuals.bubbles;
        bubbleSystem.spawnTimer += deltaTime;
        
        if (bubbleSystem.spawnTimer >= bubbleSystem.spawnRate) {
            bubbleSystem.spawnTimer = 0;
            const deadIndex = bubbleSystem.bubbles.findIndex(b => b.y < -50);
            if (deadIndex !== -1) {
                bubbleSystem.bubbles[deadIndex] = this.createBubble();
            }
        }
        
        bubbleSystem.bubbles.forEach(bubble => {
            bubble.wobblePhase += bubble.wobbleSpeed * deltaTime;
            bubble.shimmerPhase += deltaTime * 8;
            
            const wobbleX = Math.sin(bubble.wobblePhase) * bubble.wobbleAmount;
            bubble.x += (bubble.vx + wobbleX + currentX * 20) * deltaTime;
            bubble.y += (bubble.vy + currentY * 10) * deltaTime;
            
            // Wrap horizontally
            if (bubble.x < -20) bubble.x = TETRIS.WIDTH + 20;
            if (bubble.x > TETRIS.WIDTH + 20) bubble.x = -20;
        });
        
        // Update floating particles
        this.visuals.particles.forEach(particle => {
            particle.phase += deltaTime;
            particle.twinklePhase += particle.twinkleSpeed * deltaTime;
            
            const flowX = Math.sin(particle.phase) * 20;
            const flowY = Math.cos(particle.phase * 0.8) * 10;
            
            particle.x += (particle.baseVx + flowX + currentX * 15) * deltaTime;
            particle.y += (particle.baseVy + flowY + currentY * 15) * deltaTime;
            
            // Wrap around
            if (particle.x < 0) particle.x = TETRIS.WIDTH;
            if (particle.x > TETRIS.WIDTH) particle.x = 0;
            if (particle.y < 0) particle.y = TETRIS.HEIGHT;
            if (particle.y > TETRIS.HEIGHT) particle.y = 0;
        });
        
        // Update kelp sway
        this.visuals.kelp.forEach(kelp => {
            kelp.swayPhase += kelp.swaySpeed * deltaTime;
        });
        
        // Update fish with simple schooling
        this.visuals.fish.forEach((fish, index) => {
            fish.tailPhase += fish.tailSpeed * deltaTime;
            
            // Simple schooling: align with nearby fish
            let avgVx = fish.vx;
            let avgVy = fish.vy;
            let nearbyCount = 0;
            
            this.visuals.fish.forEach((other, otherIndex) => {
                if (index === otherIndex) return;
                
                const dx = other.x - fish.x;
                const dy = other.y - fish.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < fish.alignmentRadius) {
                    avgVx += other.vx;
                    avgVy += other.vy;
                    nearbyCount++;
                }
            });
            
            if (nearbyCount > 0) {
                avgVx /= (nearbyCount + 1);
                avgVy /= (nearbyCount + 1);
                fish.vx += (avgVx - fish.vx) * 0.5 * deltaTime;
                fish.vy += (avgVy - fish.vy) * 0.5 * deltaTime;
            }
            
            // Add some randomness
            fish.vy += (Math.random() - 0.5) * 10 * deltaTime;
            
            // Apply current
            fish.x += (fish.vx + currentX * 30) * deltaTime;
            fish.y += (fish.vy + currentY * 30) * deltaTime;
            
            // Keep in bounds with wraparound
            if (fish.x < -20) fish.x = TETRIS.WIDTH + 20;
            if (fish.x > TETRIS.WIDTH + 20) fish.x = -20;
            if (fish.y < 0) fish.y = TETRIS.HEIGHT * 0.8;
            if (fish.y > TETRIS.HEIGHT * 0.8) fish.y = 0;
            
            // Maintain speed
            const speed = Math.sqrt(fish.vx * fish.vx + fish.vy * fish.vy);
            if (speed < 20) {
                fish.vx *= 1.5;
                fish.vy *= 1.5;
            }
            if (speed > 80) {
                fish.vx *= 0.9;
                fish.vy *= 0.9;
            }
        });
        
        // Update jellyfish
        this.visuals.jellyfish.forEach(jelly => {
            jelly.pulsePhase += jelly.pulseSpeed * deltaTime;
            
            jelly.x += (jelly.vx + currentX * 20) * deltaTime;
            jelly.y += (jelly.vy + currentY * 20) * deltaTime;
            
            // Wrap around
            if (jelly.x < -50) jelly.x = TETRIS.WIDTH + 50;
            if (jelly.x > TETRIS.WIDTH + 50) jelly.x = -50;
            if (jelly.y < -50) jelly.y = TETRIS.HEIGHT + 50;
            if (jelly.y > TETRIS.HEIGHT + 50) jelly.y = -50;
            
            // Update tentacles
            jelly.tentacles.forEach(tentacle => {
                tentacle.wavePhase += tentacle.waveSpeed * deltaTime;
            });
        });
    }

    /**
     * Draw impressive ocean background
     */
    drawBackground(ctx, opacity) {
        // Draw depth gradient
        this.drawDepthGradient(ctx, opacity);
        
        // Draw caustics (most impressive effect)
        this.drawCaustics(ctx, opacity);
        
        // Draw god rays
        this.drawGodRays(ctx, opacity);
        
        // Draw kelp at bottom
        this.drawKelp(ctx, opacity);
        
        // Draw jellyfish
        this.drawJellyfish(ctx, opacity);
        
        // Draw fish
        this.drawFish(ctx, opacity);
        
        // Draw floating particles
        this.drawFloatingParticles(ctx, opacity);
        
        // Draw bubbles
        this.drawBubbles(ctx, opacity);
    }
    
    /**
     * Draw depth gradient for underwater atmosphere
     */
    drawDepthGradient(ctx, opacity) {
        const gradient = ctx.createLinearGradient(0, 0, 0, TETRIS.HEIGHT);
        gradient.addColorStop(0, `rgba(30, 80, 120, ${0.3 * opacity})`);
        gradient.addColorStop(0.5, `rgba(10, 50, 80, ${0.2 * opacity})`);
        gradient.addColorStop(1, `rgba(5, 30, 50, ${0.4 * opacity})`);
        
        ctx.save();
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, TETRIS.WIDTH, TETRIS.HEIGHT);
        ctx.restore();
    }
    
    /**
     * Draw underwater caustics (dancing light patterns)
     */
    drawCaustics(ctx, opacity) {
        const caustics = this.visuals.caustics;
        
        // Create off-screen canvas for caustics composition
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = TETRIS.WIDTH;
        tempCanvas.height = TETRIS.HEIGHT;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Draw each layer with lighten blend mode
        caustics.layers.forEach(layer => {
            tempCtx.save();
            
            layer.cells.forEach(cell => {
                const gradient = tempCtx.createRadialGradient(
                    cell.x, cell.y, 0,
                    cell.x, cell.y, cell.radius
                );
                gradient.addColorStop(0, `rgba(100, 200, 255, ${layer.opacity})`);
                gradient.addColorStop(0.4, `rgba(50, 150, 255, ${layer.opacity * 0.6})`);
                gradient.addColorStop(1, 'transparent');
                
                tempCtx.globalCompositeOperation = 'lighter';
                tempCtx.fillStyle = gradient;
                tempCtx.beginPath();
                tempCtx.arc(cell.x, cell.y, cell.radius, 0, Math.PI * 2);
                tempCtx.fill();
            });
            
            tempCtx.restore();
        });
        
        // Draw composed caustics to main canvas
        ctx.save();
        ctx.globalAlpha = opacity * 0.6;
        ctx.drawImage(tempCanvas, 0, 0);
        ctx.restore();
    }
    
    /**
     * Draw volumetric god rays
     */
    drawGodRays(ctx, opacity) {
        const rays = this.visuals.godRays;
        
        ctx.save();
        
        rays.rays.forEach(ray => {
            const swayOffset = Math.sin(ray.sway) * ray.swayAmount;
            const topX = ray.x + swayOffset;
            const bottomX = ray.x + swayOffset * 0.3;
            
            const gradient = ctx.createLinearGradient(
                topX, 0,
                bottomX, TETRIS.HEIGHT
            );
            gradient.addColorStop(0, `rgba(100, 200, 255, ${ray.opacity * opacity})`);
            gradient.addColorStop(0.7, `rgba(50, 150, 200, ${ray.opacity * 0.3 * opacity})`);
            gradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(topX - ray.topWidth / 2, 0);
            ctx.lineTo(topX + ray.topWidth / 2, 0);
            ctx.lineTo(bottomX + ray.bottomWidth / 2, TETRIS.HEIGHT);
            ctx.lineTo(bottomX - ray.bottomWidth / 2, TETRIS.HEIGHT);
            ctx.closePath();
            ctx.fill();
        });
        
        ctx.restore();
    }
    
    /**
     * Draw rising bubbles
     */
    drawBubbles(ctx, opacity) {
        const bubbles = this.visuals.bubbles.bubbles;
        
        bubbles.forEach(bubble => {
            if (bubble.y > TETRIS.HEIGHT || bubble.y < -50) return;
            
            ctx.save();
            ctx.globalAlpha = bubble.opacity * opacity;
            
            // Draw bubble with gradient
            const gradient = ctx.createRadialGradient(
                bubble.x - bubble.size * 0.3,
                bubble.y - bubble.size * 0.3,
                0,
                bubble.x,
                bubble.y,
                bubble.size
            );
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            gradient.addColorStop(0.3, 'rgba(200, 230, 255, 0.4)');
            gradient.addColorStop(0.7, 'rgba(100, 180, 255, 0.2)');
            gradient.addColorStop(1, 'rgba(50, 150, 255, 0.1)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Add shimmer highlight
            const shimmer = (Math.sin(bubble.shimmerPhase) + 1) * 0.5;
            ctx.globalAlpha = shimmer * bubble.opacity * opacity * 0.8;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.beginPath();
            ctx.arc(
                bubble.x - bubble.size * 0.3,
                bubble.y - bubble.size * 0.3,
                bubble.size * 0.3,
                0, Math.PI * 2
            );
            ctx.fill();
            
            // Outer ring
            ctx.globalAlpha = bubble.opacity * opacity * 0.6;
            ctx.strokeStyle = 'rgba(150, 220, 255, 0.8)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.restore();
        });
    }
    
    /**
     * Draw floating particles
     */
    drawFloatingParticles(ctx, opacity) {
        const particles = this.visuals.particles;
        
        particles.forEach(particle => {
            const twinkle = (Math.sin(particle.twinklePhase) + 1) * 0.5;
            const currentOpacity = particle.opacity * twinkle * opacity;
            
            ctx.save();
            ctx.globalAlpha = currentOpacity;
            
            // Draw particle with glow
            const gradient = ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, particle.size * 2
            );
            gradient.addColorStop(0, 'rgba(200, 230, 255, 0.8)');
            gradient.addColorStop(0.5, 'rgba(100, 180, 255, 0.4)');
            gradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
    }
    
    /**
     * Draw swaying kelp
     */
    drawKelp(ctx, opacity) {
        const kelp = this.visuals.kelp;
        
        kelp.forEach(plant => {
            const sway = Math.sin(plant.swayPhase) * plant.swayAmount;
            
            ctx.save();
            ctx.globalAlpha = opacity * 0.7;
            ctx.strokeStyle = plant.color;
            ctx.lineWidth = plant.width;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            ctx.beginPath();
            ctx.moveTo(plant.baseX, plant.baseY);
            
            for (let i = 1; i <= plant.segments; i++) {
                const t = i / plant.segments;
                const swayMultiplier = t * t; // More sway at top
                const x = plant.baseX + sway * swayMultiplier;
                const y = plant.baseY - (plant.segmentLength * i);
                
                if (i === 1) {
                    ctx.lineTo(x, y);
                } else {
                    const prevT = (i - 1) / plant.segments;
                    const prevSway = sway * (prevT * prevT);
                    const prevX = plant.baseX + prevSway;
                    const prevY = plant.baseY - (plant.segmentLength * (i - 1));
                    
                    const cpX = (prevX + x) / 2 + (Math.random() - 0.5) * 5;
                    const cpY = (prevY + y) / 2;
                    
                    ctx.quadraticCurveTo(cpX, cpY, x, y);
                }
            }
            
            ctx.stroke();
            
            // Add highlight
            ctx.globalAlpha = opacity * 0.3;
            ctx.strokeStyle = this.lightenColor(plant.color, 0.3);
            ctx.lineWidth = plant.width * 0.4;
            ctx.stroke();
            
            ctx.restore();
        });
    }
    
    /**
     * Draw swimming fish
     */
    drawFish(ctx, opacity) {
        const fish = this.visuals.fish;
        
        fish.forEach(f => {
            ctx.save();
            ctx.globalAlpha = opacity * 0.6;
            
            // Calculate angle based on velocity
            const angle = Math.atan2(f.vy, f.vx);
            
            ctx.translate(f.x, f.y);
            ctx.rotate(angle);
            
            // Draw simple fish silhouette
            ctx.fillStyle = 'rgba(50, 100, 150, 0.7)';
            
            // Body (ellipse)
            ctx.beginPath();
            ctx.ellipse(0, 0, f.size, f.size * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Tail
            const tailSwing = Math.sin(f.tailPhase) * 0.3;
            ctx.beginPath();
            ctx.moveTo(-f.size * 0.8, 0);
            ctx.lineTo(-f.size * 1.3, -f.size * 0.4 + tailSwing * f.size * 0.5);
            ctx.lineTo(-f.size * 1.5, 0);
            ctx.lineTo(-f.size * 1.3, f.size * 0.4 + tailSwing * f.size * 0.5);
            ctx.closePath();
            ctx.fill();
            
            // Eye
            ctx.fillStyle = 'rgba(200, 220, 255, 0.5)';
            ctx.beginPath();
            ctx.arc(f.size * 0.5, 0, f.size * 0.15, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
    }
    
    /**
     * Draw pulsing jellyfish
     */
    drawJellyfish(ctx, opacity) {
        const jellyfish = this.visuals.jellyfish;
        
        jellyfish.forEach(jelly => {
            ctx.save();
            ctx.globalAlpha = jelly.opacity * opacity;
            
            const pulse = Math.sin(jelly.pulsePhase) * 0.3 + 0.7;
            const currentBellSize = jelly.bellSize * pulse;
            
            // Draw tentacles first (behind bell)
            jelly.tentacles.forEach(tentacle => {
                ctx.strokeStyle = 'rgba(150, 100, 200, 0.4)';
                ctx.lineWidth = 1.5;
                ctx.lineCap = 'round';
                
                ctx.beginPath();
                ctx.moveTo(jelly.x, jelly.y + currentBellSize * 0.5);
                
                for (let i = 1; i <= tentacle.segments; i++) {
                    const t = i / tentacle.segments;
                    const waveOffset = Math.sin(tentacle.wavePhase + t * Math.PI * 2) * 8;
                    const angle = tentacle.angle + waveOffset * 0.01;
                    const distance = (tentacle.length / tentacle.segments) * i;
                    
                    const x = jelly.x + Math.cos(angle) * distance * 0.3;
                    const y = jelly.y + currentBellSize * 0.5 + distance;
                    
                    ctx.lineTo(x, y);
                }
                
                ctx.stroke();
            });
            
            // Draw bell
            const bellGradient = ctx.createRadialGradient(
                jelly.x, jelly.y - currentBellSize * 0.2,
                0,
                jelly.x, jelly.y,
                currentBellSize
            );
            bellGradient.addColorStop(0, 'rgba(200, 150, 255, 0.6)');
            bellGradient.addColorStop(0.5, 'rgba(150, 100, 200, 0.4)');
            bellGradient.addColorStop(1, 'rgba(100, 50, 150, 0.2)');
            
            ctx.fillStyle = bellGradient;
            ctx.beginPath();
            ctx.ellipse(
                jelly.x,
                jelly.y,
                currentBellSize,
                currentBellSize * 0.6,
                0, 0, Math.PI * 2
            );
            ctx.fill();
            
            // Bell rim
            ctx.strokeStyle = 'rgba(200, 150, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(
                jelly.x,
                jelly.y + currentBellSize * 0.3,
                currentBellSize * 0.9,
                currentBellSize * 0.3,
                0, 0, Math.PI
            );
            ctx.stroke();
            
            ctx.restore();
        });
    }
}
/**
 * CrystalTheme - Enhanced Crystal theme with pulsing ring and impressive effects
 */
class CrystalTheme extends BaseTheme {
    constructor() {
        super();
        this.name = 'Crystal';

        // Theme colors and styling
        this.playfield = {
            background: 'rgba(20, 20, 40, 0.92)',
            border: '#88ccff',
            grid: 'rgba(136, 204, 255, 0.12)',
            shadow: 'rgba(136, 204, 255, 0.35)'
        };
        this.pieces = {
             I: { base: '#88ccff', glow: '#ffffff', shadow: '#446688' },
             O: { base: '#ffcc88', glow: '#ffffff', shadow: '#886644' },
             T: { base: '#cc88ff', glow: '#ffffff', shadow: '#664488' },
             S: { base: '#88ffcc', glow: '#ffffff', shadow: '#448866' },
             Z: { base: '#ff88cc', glow: '#ffffff', shadow: '#884466' },
             J: { base: '#8888ff', glow: '#ffffff', shadow: '#444488' },
             L: { base: '#ffaa88', glow: '#ffffff', shadow: '#885544' },
             garbage: { base: '#666666', glow: '#666666', shadow: '#444444' }
         };
        this.ui = {
            background: 'rgba(30, 30, 50, 0.9)',
            text: '#ffffff',
            accent: '#88ccff',
            border: '#88ccff'
        };
        this.background = {
            type: 'crystal_shards',
            colors: ['#88ccff', '#cc88ff', '#88ffcc'],
            intensity: 0.7
        };

        // Initialize visual effects
        this.visuals = {};
        this.visuals.crystalParticles = this.createCrystalParticles();
        this.visuals.trailParticles = []; // Trailing particles behind crystals
        this.visuals.pulseRings = this.createPulseRings();
        this.visuals.ringPulse = {
            phase: 0,
            speed: 0.4, // Slower pulse for dramatic effect
            minRadius: 100, // Current size as minimum
            maxRadius: 450 // Expands way off-screen
        };

        // Enable animated UI colors
        this.uiAnimation.enabled = true;
        this.uiAnimation.speed = 0.3; // Gentle, crystalline feel
        this.uiAnimation.colors = [
            '#88ccff', // Light blue
            '#cc88ff', // Light purple
            '#88ffcc', // Light green
            '#ffcc88', // Light orange
            '#ff88cc', // Light pink
            '#8888ff', // Light blue-purple
            '#ccff88', // Light yellow-green
            '#88ccff', // Light blue (back)
        ];
    }

    /**
     * Create crystal particles for ambient sparkles
     */
    createCrystalParticles() {
        const particles = [];
        for (let i = 0; i < 80; i++) {
            particles.push({
                x: Math.random() * TETRIS.WIDTH,
                y: Math.random() * TETRIS.HEIGHT,
                vx: (Math.random() - 0.5) * 30,
                vy: (Math.random() - 0.5) * 30,
                size: Math.random() * 2 + 1,
                opacity: Math.random() * 0.4 + 0.2,
                hue: Math.random() * 360,
                twinklePhase: Math.random() * Math.PI * 2,
                twinkleSpeed: Math.random() * 3 + 2
            });
        }
        return particles;
    }
    
    /**
     * Create pulse rings that expand from center
     */
    createPulseRings() {
        const rings = [];
        for (let i = 0; i < 3; i++) {
            rings.push({
                radius: 0,
                opacity: 0.6,
                speed: 40 + i * 20,
                maxRadius: 600,
                colorIndex: i % 3
            });
        }
        return rings;
    }

    /**
     * Update crystal theme animation
     */
    update(deltaTime) {
        super.update(deltaTime);
        
        // Update ring pulse
        this.visuals.ringPulse.phase += this.visuals.ringPulse.speed * deltaTime;

        // Update crystal particles
        this.visuals.crystalParticles.forEach(p => {
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.twinklePhase += deltaTime * p.twinkleSpeed;

            if (p.x < 0) p.x = TETRIS.WIDTH;
            if (p.x > TETRIS.WIDTH) p.x = 0;
            if (p.y < 0) p.y = TETRIS.HEIGHT;
            if (p.y > TETRIS.HEIGHT) p.y = 0;

            p.hue += deltaTime * 20;
            if (p.hue >= 360) p.hue -= 360;
        });
        
        // Update trail particles (fade out and shrink)
        this.visuals.trailParticles = this.visuals.trailParticles.filter(p => {
            p.life -= deltaTime * 1.5;
            p.size *= 0.95;
            return p.life > 0;
        });
        
        // Update pulse rings
        this.visuals.pulseRings.forEach(ring => {
            ring.radius += ring.speed * deltaTime;
            ring.opacity = Math.max(0, 0.6 * (1 - ring.radius / ring.maxRadius));
            
            if (ring.radius > ring.maxRadius) {
                ring.radius = 0;
                ring.opacity = 0.6;
            }
        });
        
        // Spawn trail particles behind moving crystals
        if (Math.random() < 0.3) {
            for (let i = 0; i < 8; i++) {
                const angle = this.animationTime * 0.3 + i * Math.PI / 4;
                const pulse = Math.sin(this.visuals.ringPulse.phase);
                const radius = this.visuals.ringPulse.minRadius + 
                              (this.visuals.ringPulse.maxRadius - this.visuals.ringPulse.minRadius) * 
                              ((pulse + 1) / 2);
                const x = TETRIS.WIDTH / 2 + Math.cos(angle) * radius;
                const y = TETRIS.HEIGHT / 2 + Math.sin(angle) * radius;
                
                this.visuals.trailParticles.push({
                    x: x,
                    y: y,
                    size: 3 + Math.random() * 4,
                    life: 1.0,
                    color: this.background.colors[i % 3],
                    hue: this.extractHue(this.background.colors[i % 3])
                });
            }
        }
    }

    /**
     * Draw crystal shards background effect with enhanced visuals
     */
    drawBackground(ctx, opacity) {
        const colors = this.background.colors;
        
        // Draw pulse rings first (background layer)
        this.drawPulseRings(ctx, opacity);
        
        // Draw energy connections between crystals
        this.drawEnergyConnections(ctx, opacity);
        
        // Draw light beams from crystals
        this.drawLightBeams(ctx, opacity);
        
        // Draw crystal shards with pulsing ring
        this.drawCrystalRing(ctx, opacity, colors);
        
        // Draw trail particles
        this.drawTrailParticles(ctx, opacity);
        
        // Draw ambient crystal particles
        this.drawAmbientParticles(ctx, opacity);
    }
    
    /**
     * Draw expanding pulse rings
     */
    drawPulseRings(ctx, opacity) {
        const colors = this.background.colors;
        
        this.visuals.pulseRings.forEach(ring => {
            if (ring.opacity <= 0) return;
            
            ctx.save();
            ctx.globalAlpha = ring.opacity * opacity * 0.3;
            ctx.strokeStyle = colors[ring.colorIndex];
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = colors[ring.colorIndex];
            
            ctx.beginPath();
            ctx.arc(TETRIS.WIDTH / 2, TETRIS.HEIGHT / 2, ring.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        });
    }
    
    /**
     * Draw energy connections between crystals
     */
    drawEnergyConnections(ctx, opacity) {
        const colors = this.background.colors;
        const pulse = Math.sin(this.visuals.ringPulse.phase);
        const radius = this.visuals.ringPulse.minRadius + 
                      (this.visuals.ringPulse.maxRadius - this.visuals.ringPulse.minRadius) * 
                      ((pulse + 1) / 2);
        
        ctx.save();
        
        // Draw connections between adjacent crystals
        for (let i = 0; i < 8; i++) {
            const angle1 = this.animationTime * 0.3 + i * Math.PI / 4;
            const angle2 = this.animationTime * 0.3 + ((i + 1) % 8) * Math.PI / 4;
            
            const x1 = TETRIS.WIDTH / 2 + Math.cos(angle1) * radius;
            const y1 = TETRIS.HEIGHT / 2 + Math.sin(angle1) * radius;
            const x2 = TETRIS.WIDTH / 2 + Math.cos(angle2) * radius;
            const y2 = TETRIS.HEIGHT / 2 + Math.sin(angle2) * radius;
            
            // Skip if both crystals are off-screen
            if ((x1 < -50 || x1 > TETRIS.WIDTH + 50 || y1 < -50 || y1 > TETRIS.HEIGHT + 50) &&
                (x2 < -50 || x2 > TETRIS.WIDTH + 50 || y2 < -50 || y2 > TETRIS.HEIGHT + 50)) {
                continue;
            }
            
            const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
            gradient.addColorStop(0, colors[i % 3]);
            gradient.addColorStop(0.5, colors[(i + 1) % 3]);
            gradient.addColorStop(1, colors[(i + 2) % 3]);
            
            ctx.globalAlpha = 0.15 * opacity * (1 - Math.abs(pulse) * 0.3);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1;
            ctx.shadowBlur = 5;
            ctx.shadowColor = colors[i % 3];
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    /**
     * Draw light beams emanating from crystals
     */
    drawLightBeams(ctx, opacity) {
        const colors = this.background.colors;
        const pulse = Math.sin(this.visuals.ringPulse.phase);
        const radius = this.visuals.ringPulse.minRadius + 
                      (this.visuals.ringPulse.maxRadius - this.visuals.ringPulse.minRadius) * 
                      ((pulse + 1) / 2);
        
        ctx.save();
        
        for (let i = 0; i < 8; i++) {
            const angle = this.animationTime * 0.3 + i * Math.PI / 4;
            const x = TETRIS.WIDTH / 2 + Math.cos(angle) * radius;
            const y = TETRIS.HEIGHT / 2 + Math.sin(angle) * radius;
            
            // Skip if crystal is way off-screen
            if (x < -100 || x > TETRIS.WIDTH + 100 || y < -100 || y > TETRIS.HEIGHT + 100) {
                continue;
            }
            
            // Draw beam from center to crystal
            const gradient = ctx.createLinearGradient(
                TETRIS.WIDTH / 2, TETRIS.HEIGHT / 2,
                x, y
            );
            gradient.addColorStop(0, `${colors[i % 3]}44`);
            gradient.addColorStop(0.5, `${colors[i % 3]}22`);
            gradient.addColorStop(1, 'transparent');
            
            ctx.globalAlpha = 0.3 * opacity * (1 - Math.abs(pulse) * 0.5);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 3;
            ctx.shadowBlur = 15;
            ctx.shadowColor = colors[i % 3];
            
            ctx.beginPath();
            ctx.moveTo(TETRIS.WIDTH / 2, TETRIS.HEIGHT / 2);
            ctx.lineTo(x, y);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    /**
     * Draw the main crystal ring with pulsing radius
     */
    drawCrystalRing(ctx, opacity, colors) {
        const pulse = Math.sin(this.visuals.ringPulse.phase);
        const radius = this.visuals.ringPulse.minRadius + 
                      (this.visuals.ringPulse.maxRadius - this.visuals.ringPulse.minRadius) * 
                      ((pulse + 1) / 2);
        
        for (let i = 0; i < 8; i++) {
            const angle = this.animationTime * 0.3 + i * Math.PI / 4;
            const x = TETRIS.WIDTH / 2 + Math.cos(angle) * radius;
            const y = TETRIS.HEIGHT / 2 + Math.sin(angle) * radius;
            
            // Calculate opacity based on distance from screen center
            const distanceFromCenter = Math.sqrt(
                Math.pow(x - TETRIS.WIDTH / 2, 2) + 
                Math.pow(y - TETRIS.HEIGHT / 2, 2)
            );
            const fadeStart = 200;
            const fadeEnd = 450;
            let crystalOpacity = 1.0;
            if (distanceFromCenter > fadeStart) {
                crystalOpacity = Math.max(0, 1 - (distanceFromCenter - fadeStart) / (fadeEnd - fadeStart));
            }

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle + this.animationTime);

            const gradient = ctx.createLinearGradient(-30, -30, 30, 30);
            gradient.addColorStop(0, colors[i % 3]);
            gradient.addColorStop(0.5, colors[(i + 1) % 3]);
            gradient.addColorStop(1, colors[(i + 2) % 3]);

            // Draw crystal shard
            ctx.globalAlpha = 0.2 * opacity * crystalOpacity;
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(0, -45);
            ctx.lineTo(20, 0);
            ctx.lineTo(0, 45);
            ctx.lineTo(-20, 0);
            ctx.closePath();
            ctx.fill();

            // Crystal outline with glow
            ctx.globalAlpha = 0.5 * opacity * crystalOpacity;
            ctx.strokeStyle = colors[i % 3];
            ctx.lineWidth = 2;
            ctx.shadowBlur = 15;
            ctx.shadowColor = colors[i % 3];
            ctx.stroke();
            
            // Bright inner glow
            ctx.globalAlpha = 0.6 * opacity * crystalOpacity;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(0, -22.5);
            ctx.lineTo(10, 0);
            ctx.lineTo(0, 22.5);
            ctx.lineTo(-10, 0);
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
        }
    }
    
    /**
     * Draw trailing particles behind crystals
     */
    drawTrailParticles(ctx, opacity) {
        this.visuals.trailParticles.forEach(p => {
            if (p.life <= 0) return;
            
            const currentOpacity = p.life * opacity * 0.6;
            
            ctx.save();
            ctx.globalAlpha = currentOpacity;
            
            // Draw particle with glow
            const gradient = ctx.createRadialGradient(
                p.x, p.y, 0,
                p.x, p.y, p.size * 2
            );
            gradient.addColorStop(0, `hsl(${p.hue}, 80%, 70%)`);
            gradient.addColorStop(0.5, `hsl(${p.hue}, 70%, 50%)`);
            gradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Core
            ctx.globalAlpha = currentOpacity * 1.5;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
    }
    
    /**
     * Draw ambient floating particles
     */
    drawAmbientParticles(ctx, opacity) {
        this.visuals.crystalParticles.forEach(p => {
            const twinkle = (Math.sin(p.twinklePhase) + 1) * 0.5; // 0 to 1
            const currentOpacity = p.opacity * twinkle * opacity;
            const currentSize = p.size * (0.8 + twinkle * 0.4);

            // Draw crystal particle with radial glow
            const hue = this.background.colors[0].includes('hsl') ? p.hue : this.extractHue(this.background.colors[0]);
            const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentSize * 2);
            gradient.addColorStop(0, `hsla(${hue}, 80%, 70%, ${currentOpacity})`);
            gradient.addColorStop(1, 'transparent');

            ctx.globalAlpha = 1;
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(p.x, p.y, currentSize * 2, 0, Math.PI * 2);
            ctx.fill();

            // Draw crystal core
            ctx.globalAlpha = currentOpacity;
            ctx.fillStyle = `hsl(${hue}, 70%, 80%)`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
            ctx.fill();
        });
    }
}
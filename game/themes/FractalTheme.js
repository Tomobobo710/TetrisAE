/**
 * FractalTheme - Real mathematical fractals with psychedelic colors
 */
class FractalTheme extends BaseTheme {
    constructor() {
        super();
        this.name = 'Fractal';

        // Theme colors and styling
        this.playfield = {
            background: 'rgba(10, 0, 20, 0.95)',
            border: '#ff00ff',
            grid: 'rgba(255, 0, 255, 0.15)',
            shadow: 'rgba(255, 0, 255, 0.4)'
        };
        this.pieces = {
             I: { base: '#ff00ff', glow: '#ffff00', shadow: '#880088' },
             O: { base: '#00ffff', glow: '#ffffff', shadow: '#008888' },
             T: { base: '#ffff00', glow: '#ffffff', shadow: '#888800' },
             S: { base: '#00ff00', glow: '#ffffff', shadow: '#008800' },
             Z: { base: '#ff0088', glow: '#ffff00', shadow: '#880044' },
             J: { base: '#0088ff', glow: '#ffffff', shadow: '#004488' },
             L: { base: '#ff8800', glow: '#ffffff', shadow: '#884400' },
             garbage: { base: '#666666', glow: '#666666', shadow: '#444444' }
         };
        this.ui = {
            background: 'rgba(20, 0, 30, 0.9)',
            text: '#ffffff',
            accent: '#ff00ff',
            border: '#ff00ff'
        };
        this.background = {
            type: 'fractals',
            colors: ['#ff00ff', '#00ffff', '#ffff00', '#ff0088', '#0088ff'],
            intensity: 1.0
        };

        // Initialize fractal systems
        this.visuals = {};
        this.visuals.juliaSet = this.createJuliaSet();
        this.visuals.fractalTrees = this.createFractalTrees();
        this.visuals.sierpinskiTriangles = this.createSierpinskiTriangles();
        this.visuals.barnsleyFerns = this.createBarnsleyFerns();
        this.visuals.kochSnowflakes = this.createKochSnowflakes();
        this.visuals.colorCycle = { phase: 0, speed: 0.5 };

        // Enable animated UI colors
        this.uiAnimation.enabled = true;
        this.uiAnimation.speed = 0.3; // Slower, more psychedelic
        this.uiAnimation.colors = [
            '#ff00ff', // Magenta
            '#ff0088', // Pink
            '#8800ff', // Purple
            '#0088ff', // Blue
            '#00ffff', // Cyan
            '#00ff88', // Green
            '#88ff00', // Yellow-green
            '#ffff00', // Yellow
            '#ff8800', // Orange
            '#ff0000', // Red
            '#ff0088', // Pink (back to magenta)
        ];
    }
    
    /**
     * Setup - fast-forward animation
     */
    setup() {
        const frameTime = 1 / 60;
        const numFrames = 10 * 60; // Just 10 seconds for fractals
        
        for (let i = 0; i < numFrames; i++) {
            this.update(frameTime);
        }
    }

    /**
     * Create Julia Set fractal background
     */
    createJuliaSet() {
        // Render at lower resolution for performance
        const scale = 0.66;
        const width = Math.floor(TETRIS.WIDTH * scale);
        const height = Math.floor(TETRIS.HEIGHT * scale);
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        const imageData = ctx.createImageData(width, height);
        
        return {
            canvas: canvas,
            ctx: ctx,
            imageData: imageData,
            width: width,
            height: height,
            scale: scale,
            cReal: -0.7,
            cImag: 0.27015,
            zoom: 1.5,
            maxIterations: 50,
            needsUpdate: true,
            updateTimer: 0,
            updateInterval: 0.01666666667 // Update every 0.1s
        };
    }

    /**
     * Create fractal trees
     */
    createFractalTrees() {
        const trees = [];
        const numTrees = 5;
        
        for (let i = 0; i < numTrees; i++) {
            trees.push({
                x: (TETRIS.WIDTH / (numTrees + 1)) * (i + 1),
                y: TETRIS.HEIGHT,
                angle: -Math.PI / 2,
                length: 40 + Math.random() * 30,
                depth: 6 + Math.floor(Math.random() * 2),
                angleOffset: 0.4 + Math.random() * 0.3,
                lengthScale: 0.65 + Math.random() * 0.1,
                swayPhase: Math.random() * Math.PI * 2,
                swaySpeed: 0.5 + Math.random() * 0.5,
                colorIndex: i % 5
            });
        }
        
        return trees;
    }

    /**
     * Create Sierpinski triangles
     */
    createSierpinskiTriangles() {
        const triangles = [];
        
        for (let i = 0; i < 4; i++) {
            triangles.push({
                x: Math.random() * TETRIS.WIDTH,
                y: Math.random() * TETRIS.HEIGHT,
                size: 40 + Math.random() * 60,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.5,
                depth: 3 + Math.floor(Math.random() * 2),
                vx: (Math.random() - 0.5) * 20,
                vy: (Math.random() - 0.5) * 20,
                colorIndex: i % 5
            });
        }
        
        return triangles;
    }

    /**
     * Create Barnsley ferns
     */
    createBarnsleyFerns() {
        const ferns = [];
        
        for (let i = 0; i < 3; i++) {
            const points = [];
            let x = 0, y = 0;
            
            // Generate fern points using IFS (Iterated Function System)
            for (let j = 0; j < 5000; j++) {
                const r = Math.random();
                let newX, newY;
                
                if (r < 0.01) {
                    newX = 0;
                    newY = 0.16 * y;
                } else if (r < 0.86) {
                    newX = 0.85 * x + 0.04 * y;
                    newY = -0.04 * x + 0.85 * y + 1.6;
                } else if (r < 0.93) {
                    newX = 0.2 * x - 0.26 * y;
                    newY = 0.23 * x + 0.22 * y + 1.6;
                } else {
                    newX = -0.15 * x + 0.28 * y;
                    newY = 0.26 * x + 0.24 * y + 0.44;
                }
                
                x = newX;
                y = newY;
                
                // Skip first few iterations
                if (j > 20) {
                    points.push({ x: x, y: y });
                }
            }
            
            ferns.push({
                points: points,
                x: 50 + i * (TETRIS.WIDTH - 100) / 2,
                y: TETRIS.HEIGHT - 50,
                scale: 8 + Math.random() * 4,
                opacity: 0.3 + Math.random() * 0.3,
                colorIndex: i % 5,
                swayPhase: Math.random() * Math.PI * 2,
                swaySpeed: 0.3 + Math.random() * 0.3
            });
        }
        
        return ferns;
    }

    /**
     * Create Koch snowflakes
     */
    createKochSnowflakes() {
        const snowflakes = [];
        
        for (let i = 0; i < 6; i++) {
            snowflakes.push({
                x: Math.random() * TETRIS.WIDTH,
                y: Math.random() * TETRIS.HEIGHT,
                size: 20 + Math.random() * 40,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 1,
                depth: 2 + Math.floor(Math.random() * 2),
                vx: (Math.random() - 0.5) * 15,
                vy: (Math.random() - 0.5) * 15,
                colorIndex: i % 5,
                pulsePhase: Math.random() * Math.PI * 2,
                pulseSpeed: 1 + Math.random()
            });
        }
        
        return snowflakes;
    }

    /**
     * Update fractal theme
     */
    update(deltaTime) {
        super.update(deltaTime);
        
        // Update color cycle
        this.visuals.colorCycle.phase += this.visuals.colorCycle.speed * deltaTime;
        
        // Update Julia set parameters for animation
        const julia = this.visuals.juliaSet;
        julia.updateTimer += deltaTime;
        if (julia.updateTimer >= julia.updateInterval) {
            julia.updateTimer = 0;
            julia.needsUpdate = true;
            
            // Animate c parameter for morphing effect
            const t = this.animationTime * 0.3;
            julia.cReal = -0.7 + Math.sin(t) * 0.3;
            julia.cImag = 0.27015 + Math.cos(t * 1.3) * 0.1;
        }
        
        // Update fractal trees
        this.visuals.fractalTrees.forEach(tree => {
            tree.swayPhase += tree.swaySpeed * deltaTime;
        });
        
        // Update Sierpinski triangles
        this.visuals.sierpinskiTriangles.forEach(tri => {
            tri.x += tri.vx * deltaTime;
            tri.y += tri.vy * deltaTime;
            tri.rotation += tri.rotationSpeed * deltaTime;
            
            // Wrap around
            if (tri.x < -tri.size) tri.x = TETRIS.WIDTH + tri.size;
            if (tri.x > TETRIS.WIDTH + tri.size) tri.x = -tri.size;
            if (tri.y < -tri.size) tri.y = TETRIS.HEIGHT + tri.size;
            if (tri.y > TETRIS.HEIGHT + tri.size) tri.y = -tri.size;
        });
        
        // Update Barnsley ferns
        this.visuals.barnsleyFerns.forEach(fern => {
            fern.swayPhase += fern.swaySpeed * deltaTime;
        });
        
        // Update Koch snowflakes
        this.visuals.kochSnowflakes.forEach(flake => {
            flake.x += flake.vx * deltaTime;
            flake.y += flake.vy * deltaTime;
            flake.rotation += flake.rotationSpeed * deltaTime;
            flake.pulsePhase += flake.pulseSpeed * deltaTime;
            
            // Wrap around
            if (flake.x < -flake.size) flake.x = TETRIS.WIDTH + flake.size;
            if (flake.x > TETRIS.WIDTH + flake.size) flake.x = -flake.size;
            if (flake.y < -flake.size) flake.y = TETRIS.HEIGHT + flake.size;
            if (flake.y > TETRIS.HEIGHT + flake.size) flake.y = -flake.size;
        });
    }

    /**
     * Draw fractal background
     */
    drawBackground(ctx, opacity) {
        // Draw Julia set background
        this.drawJuliaSet(ctx, opacity);
        
        // Draw Barnsley ferns
        //this.drawBarnsleyFerns(ctx, opacity);
        
        // Draw fractal trees
        //this.drawFractalTrees(ctx, opacity);
        
        // Draw Sierpinski triangles
        this.drawSierpinskiTriangles(ctx, opacity);
        
        // Draw Koch snowflakes
        //this.drawKochSnowflakes(ctx, opacity);
    }

    /**
     * Render and draw Julia Set
     */
    drawJuliaSet(ctx, opacity) {
        const julia = this.visuals.juliaSet;
        
        if (julia.needsUpdate) {
            julia.needsUpdate = false;
            
            const data = julia.imageData.data;
            const width = julia.width;
            const height = julia.height;
            
            for (let py = 0; py < height; py++) {
                for (let px = 0; px < width; px++) {
                    // Map pixel to complex plane
                    const x0 = (px / width - 0.5) * 4 / julia.zoom;
                    const y0 = (py / height - 0.5) * 4 / julia.zoom;
                    
                    let x = x0;
                    let y = y0;
                    let iteration = 0;
                    
                    // Julia set iteration
                    while (x * x + y * y <= 4 && iteration < julia.maxIterations) {
                        const xTemp = x * x - y * y + julia.cReal;
                        y = 2 * x * y + julia.cImag;
                        x = xTemp;
                        iteration++;
                    }
                    
                    // Color based on iteration count with color cycling
                    const idx = (py * width + px) * 4;
                    if (iteration === julia.maxIterations) {
                        data[idx] = 0;
                        data[idx + 1] = 0;
                        data[idx + 2] = 0;
                        data[idx + 3] = 255;
                    } else {
                        const colorPhase = this.visuals.colorCycle.phase;
                        const t = iteration / julia.maxIterations;
                        const hue = (t * 360 + colorPhase * 60) % 360;
                        const saturation = 80;
                        const lightness = 30 + t * 40;
                        
                        const rgb = this.hslToRgb(hue, saturation, lightness);
                        data[idx] = rgb[0];
                        data[idx + 1] = rgb[1];
                        data[idx + 2] = rgb[2];
                        data[idx + 3] = 255 * 0.7; // Semi-transparent
                    }
                }
            }
            
            julia.ctx.putImageData(julia.imageData, 0, 0);
        }
        
        // Draw the Julia set canvas scaled up
        ctx.save();
        ctx.globalAlpha = opacity * 0.6;
        ctx.drawImage(julia.canvas, 0, 0, TETRIS.WIDTH, TETRIS.HEIGHT);
        ctx.restore();
    }

    /**
     * Draw fractal trees
     */
    drawFractalTrees(ctx, opacity) {
        this.visuals.fractalTrees.forEach(tree => {
            const sway = Math.sin(tree.swayPhase) * 0.1;
            const color = this.getColorCycled(tree.colorIndex);
            
            ctx.save();
            ctx.globalAlpha = opacity * 0.5;
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = color;
            
            this.drawTreeBranch(
                ctx,
                tree.x,
                tree.y,
                tree.angle + sway,
                tree.length,
                tree.depth,
                tree.angleOffset,
                tree.lengthScale
            );
            
            ctx.restore();
        });
    }

    /**
     * Recursively draw tree branch
     */
    drawTreeBranch(ctx, x, y, angle, length, depth, angleOffset, lengthScale) {
        if (depth <= 0 || length < 2) return;
        
        const endX = x + Math.cos(angle) * length;
        const endY = y + Math.sin(angle) * length;
        
        ctx.lineWidth = depth * 0.5;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        // Draw two branches
        this.drawTreeBranch(ctx, endX, endY, angle - angleOffset, length * lengthScale, depth - 1, angleOffset, lengthScale);
        this.drawTreeBranch(ctx, endX, endY, angle + angleOffset, length * lengthScale, depth - 1, angleOffset, lengthScale);
    }

    /**
     * Draw Sierpinski triangles
     */
    drawSierpinskiTriangles(ctx, opacity) {
        this.visuals.sierpinskiTriangles.forEach(tri => {
            const color = this.getColorCycled(tri.colorIndex);
            
            ctx.save();
            ctx.translate(tri.x, tri.y);
            ctx.rotate(tri.rotation);
            ctx.globalAlpha = opacity * 0.4;
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.shadowBlur = 8;
            ctx.shadowColor = color;
            
            this.drawSierpinski(ctx, 0, 0, tri.size, tri.depth);
            
            ctx.restore();
        });
    }

    /**
     * Recursively draw Sierpinski triangle
     */
    drawSierpinski(ctx, x, y, size, depth) {
        if (depth <= 0) {
            // Draw filled triangle
            ctx.beginPath();
            ctx.moveTo(x, y - size / 2);
            ctx.lineTo(x - size / 2, y + size / 2);
            ctx.lineTo(x + size / 2, y + size / 2);
            ctx.closePath();
            ctx.stroke();
            return;
        }
        
        const newSize = size / 2;
        
        // Draw three smaller triangles
        this.drawSierpinski(ctx, x, y - size / 4, newSize, depth - 1);
        this.drawSierpinski(ctx, x - size / 4, y + size / 4, newSize, depth - 1);
        this.drawSierpinski(ctx, x + size / 4, y + size / 4, newSize, depth - 1);
    }

    /**
     * Draw Barnsley ferns
     */
    drawBarnsleyFerns(ctx, opacity) {
        this.visuals.barnsleyFerns.forEach(fern => {
            const sway = Math.sin(fern.swayPhase) * 5;
            const color = this.getColorCycled(fern.colorIndex);
            
            ctx.save();
            ctx.globalAlpha = opacity * fern.opacity;
            ctx.fillStyle = color;
            ctx.shadowBlur = 5;
            ctx.shadowColor = color;
            
            fern.points.forEach(point => {
                const screenX = fern.x + (point.x + sway * 0.1) * fern.scale;
                const screenY = fern.y - point.y * fern.scale;
                
                ctx.fillRect(screenX, screenY, 1.5, 1.5);
            });
            
            ctx.restore();
        });
    }

    /**
     * Draw Koch snowflakes
     */
    drawKochSnowflakes(ctx, opacity) {
        this.visuals.kochSnowflakes.forEach(flake => {
            const pulse = Math.sin(flake.pulsePhase) * 0.3 + 0.7;
            const currentSize = flake.size * pulse;
            const color = this.getColorCycled(flake.colorIndex);
            
            ctx.save();
            ctx.translate(flake.x, flake.y);
            ctx.rotate(flake.rotation);
            ctx.globalAlpha = opacity * 0.5;
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.shadowBlur = 10;
            ctx.shadowColor = color;
            
            // Draw three Koch curves to form snowflake
            for (let i = 0; i < 3; i++) {
                ctx.save();
                ctx.rotate((Math.PI * 2 / 3) * i);
                
                const startX = -currentSize / 2;
                const startY = currentSize * 0.289; // sqrt(3)/6 * size
                const endX = currentSize / 2;
                const endY = currentSize * 0.289;
                
                this.drawKochCurve(ctx, startX, startY, endX, endY, flake.depth);
                
                ctx.restore();
            }
            
            ctx.restore();
        });
    }

    /**
     * Recursively draw Koch curve
     */
    drawKochCurve(ctx, x1, y1, x2, y2, depth) {
        if (depth <= 0) {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            return;
        }
        
        const dx = x2 - x1;
        const dy = y2 - y1;
        
        const x3 = x1 + dx / 3;
        const y3 = y1 + dy / 3;
        
        const x5 = x1 + 2 * dx / 3;
        const y5 = y1 + 2 * dy / 3;
        
        const x4 = (x1 + x2) / 2 + (y1 - y2) * Math.sqrt(3) / 6;
        const y4 = (y1 + y2) / 2 + (x2 - x1) * Math.sqrt(3) / 6;
        
        this.drawKochCurve(ctx, x1, y1, x3, y3, depth - 1);
        this.drawKochCurve(ctx, x3, y3, x4, y4, depth - 1);
        this.drawKochCurve(ctx, x4, y4, x5, y5, depth - 1);
        this.drawKochCurve(ctx, x5, y5, x2, y2, depth - 1);
    }

    /**
     * Get color with cycling effect
     */
    getColorCycled(index) {
        const colors = this.background.colors;
        const phase = this.visuals.colorCycle.phase;
        const colorIndex = (index + Math.floor(phase)) % colors.length;
        return colors[colorIndex];
    }

    /**
     * Convert HSL to RGB
     */
    hslToRgb(h, s, l) {
        h = h / 360;
        s = s / 100;
        l = l / 100;
        
        let r, g, b;
        
        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }
}
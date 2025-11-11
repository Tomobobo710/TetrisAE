/**
 * CyberpunkCityTheme - 3D cyberpunk city using ActionEngine's Renderer2D
 * Proper geometry with Vector3 and Triangle like the terrain demo
 */
class CyberpunkCityTheme extends BaseTheme {
    constructor() {
        super();
        this.name = 'Cyberpunk City';

        // Theme colors - Orange/Red Blade Runner palette
        this.playfield = {
            background: 'rgba(20, 10, 5, 0.95)',
            border: '#ff6600',
            grid: 'rgba(255, 102, 0, 0.15)',
            shadow: 'rgba(255, 102, 0, 0.4)'
        };
        this.pieces = {
             I: { base: '#ff6600', glow: '#ffffff', shadow: '#883300' },
             O: { base: '#ff3300', glow: '#ffffff', shadow: '#881800' },
             T: { base: '#ffaa00', glow: '#ffffff', shadow: '#885500' },
             S: { base: '#00ffaa', glow: '#ffffff', shadow: '#008855' },
             Z: { base: '#ff0044', glow: '#ffffff', shadow: '#880022' },
             J: { base: '#0088ff', glow: '#ffffff', shadow: '#004488' },
             L: { base: '#ff9900', glow: '#ffffff', shadow: '#884400' },
             garbage: { base: '#666666', glow: '#666666', shadow: '#444444' }
         };
        this.ui = {
            background: 'rgba(20, 10, 5, 0.9)',
            text: '#ff6600',
            accent: '#ff3300',
            border: '#ff6600'
        };
        this.background = {
            type: 'cyberpunk_city',
            colors: ['#ff6600', '#ff3300', '#0088ff'],
            intensity: 0.8
        };

        // Camera setup (like the terrain demo)
        this.camera = {
            position: new Vector3(0, 200, 450),
            target: new Vector3(0, 0, 0),
            up: new Vector3(0, 1, 0),
            yaw: 0,
            pitch: Math.PI / 6,
            angleY: 0,
            angleSpeed: 0.12,
            radius: 450,
            height: 200,
            bobPhase: 0
        };

        // Projection settings
        this.fov = Math.PI * 0.35;
        this.aspect = TETRIS.WIDTH / TETRIS.HEIGHT;
        this.near = 0.1;
        this.far = 2000;

        // City geometry
        this.visuals = {};
        this.visuals.buildings = [];
        this.visuals.triangles = [];
        this.visuals.windows = [];
        this.visuals.flyingCars = [];
        
        // Generate city
        this.generateCity();

        // Enable animated UI colors
        this.uiAnimation.enabled = true;
        this.uiAnimation.speed = 0.5; // Medium-fast, cyberpunk feel
        this.uiAnimation.colors = [
            '#ff6600', // Orange
            '#ff3300', // Red-orange
            '#ffaa00', // Yellow-orange
            '#0088ff', // Blue
            '#00ffaa', // Cyan-green
            '#ff0044', // Red
            '#ff9900', // Orange-yellow
            '#ff6600', // Orange (back)
        ];
    }
    
    /**
     * Setup
     */
    setup() {
        const frameTime = 1 / 60;
        const numFrames = 30 * 60;
        
        for (let i = 0; i < numFrames; i++) {
            this.update(frameTime);
        }
    }

    /**
     * Generate entire city with proper geometry
     */
    generateCity() {
        const gridSize = 5;
        const spacing = 200;
        const offset = (gridSize * spacing) / 2;

        for (let x = 0; x < gridSize; x++) {
            for (let z = 0; z < gridSize; z++) {
                // Skip center
                if (Math.abs(x - gridSize/2) < 1 && Math.abs(z - gridSize/2) < 1) {
                    continue;
                }

                const worldX = x * spacing - offset;
                const worldZ = z * spacing - offset;
                const height = 120 + Math.random() * 250;
                const width = 50 + Math.random() * 30;
                const depth = 50 + Math.random() * 30;

                // Color schemes
                const colorSchemes = [
                    { base: 'rgb(60, 30, 20)', accent: 'rgb(255, 102, 0)', light: 'rgb(255, 153, 51)' },
                    { base: 'rgb(70, 20, 20)', accent: 'rgb(255, 51, 0)', light: 'rgb(255, 102, 51)' },
                    { base: 'rgb(50, 40, 30)', accent: 'rgb(255, 153, 0)', light: 'rgb(255, 204, 102)' },
                    { base: 'rgb(30, 30, 40)', accent: 'rgb(0, 136, 255)', light: 'rgb(102, 178, 255)' }
                ];
                const scheme = colorSchemes[Math.floor(Math.random() * colorSchemes.length)];

                const building = {
                    x: worldX,
                    y: 0,
                    z: worldZ,
                    width: width,
                    height: height,
                    depth: depth,
                    colorScheme: scheme,
                    topLight: Math.random() > 0.6,
                    lightPhase: Math.random() * Math.PI * 2,
                    lightSpeed: 1.5 + Math.random() * 2,
                    windows: []
                };

                // Generate building geometry
                this.createBuildingGeometry(building);
                
                // Generate windows for this building
                this.generateWindows(building);
                
                this.visuals.buildings.push(building);
            }
        }

        // Create flying cars
        this.createFlyingCars();
    }

    /**
     * Create building geometry as triangles (like terrain)
     */
    createBuildingGeometry(building) {
        const x = building.x;
        const y = building.y;
        const z = building.z;
        const w = building.width;
        const h = building.height;
        const d = building.depth;

        // 8 vertices of the box
        const v = [
            new Vector3(x - w/2, y, z + d/2),      // 0: bottom-back-left
            new Vector3(x + w/2, y, z + d/2),      // 1: bottom-back-right
            new Vector3(x + w/2, y, z - d/2),      // 2: bottom-front-right
            new Vector3(x - w/2, y, z - d/2),      // 3: bottom-front-left
            new Vector3(x - w/2, y + h, z + d/2),  // 4: top-back-left
            new Vector3(x + w/2, y + h, z + d/2),  // 5: top-back-right
            new Vector3(x + w/2, y + h, z - d/2),  // 6: top-front-right
            new Vector3(x - w/2, y + h, z - d/2)   // 7: top-front-left
        ];

        // Create triangles for each face with lighting
        const scheme = building.colorScheme;
        
        // Helper to create lit color
        const getLitColor = (brightness) => {
            // Parse base color
            const match = scheme.base.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (!match) return scheme.base;
            
            const r = Math.min(255, parseInt(match[1]) * brightness * 1.8);
            const g = Math.min(255, parseInt(match[2]) * brightness * 1.8);
            const b = Math.min(255, parseInt(match[3]) * brightness * 1.8);
            return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
        };

        // Front face (bright) - FLIPPED
        this.visuals.triangles.push(new Triangle(v[6], v[7], v[3], getLitColor(0.9)));
        this.visuals.triangles.push(new Triangle(v[2], v[6], v[3], getLitColor(0.9)));
        
        // Back face (dark) - FLIPPED
        this.visuals.triangles.push(new Triangle(v[4], v[5], v[1], getLitColor(0.4)));
        this.visuals.triangles.push(new Triangle(v[0], v[4], v[1], getLitColor(0.4)));
        
        // Left face (medium) - FLIPPED
        this.visuals.triangles.push(new Triangle(v[7], v[4], v[0], getLitColor(0.6)));
        this.visuals.triangles.push(new Triangle(v[3], v[7], v[0], getLitColor(0.6)));
        
        // Right face (bright) - FLIPPED
        this.visuals.triangles.push(new Triangle(v[5], v[6], v[2], getLitColor(1.0)));
        this.visuals.triangles.push(new Triangle(v[1], v[5], v[2], getLitColor(1.0)));
        
        // Top face (brightest) - FLIPPED
        this.visuals.triangles.push(new Triangle(v[5], v[4], v[7], getLitColor(1.2)));
        this.visuals.triangles.push(new Triangle(v[6], v[5], v[7], getLitColor(1.2)));
    }

    /**
     * Generate window positions for a building
     */
    generateWindows(building) {
        const numWindows = Math.floor(building.height / 20);
        
        for (let i = 0; i < numWindows; i++) {
            if (Math.random() > 0.3) continue; // Only 30% of floors get windows

            const windowY = building.y + 20 + (i / numWindows) * (building.height - 40);
            const windowX = building.x + (Math.random() - 0.5) * building.width * 0.7;
            const windowZ = building.z + (Math.random() - 0.5) * building.depth * 0.7;

            building.windows.push({
                position: new Vector3(windowX, windowY, windowZ),
                phaseOffset: Math.random() * Math.PI * 2,
                color: building.colorScheme.accent
            });
        }
    }

    /**
     * Create flying cars
     */
    createFlyingCars() {
        const numCars = 12;

        for (let i = 0; i < numCars; i++) {
            const pathType = Math.random() > 0.5 ? 'circular' : 'straight';
            const color = Math.random() > 0.7 ? 'rgb(0, 136, 255)' : 'rgb(255, 102, 0)';
            
            this.visuals.flyingCars.push({
                position: new Vector3(
                    (Math.random() - 0.5) * 600,
                    80 + Math.random() * 120,
                    (Math.random() - 0.5) * 600
                ),
                velocity: new Vector3(
                    (Math.random() - 0.5) * 100,
                    0,
                    (Math.random() - 0.5) * 100
                ),
                size: 10 + Math.random() * 6,
                color: color,
                trailPoints: [],
                pathType: pathType,
                pathPhase: Math.random() * Math.PI * 2,
                pathRadius: 180 + Math.random() * 150,
                pathSpeed: 0.4 + Math.random() * 0.4
            });
        }
    }

    /**
     * Get camera view matrix (like terrain demo)
     */
    getViewMatrix() {
        const forward = this.camera.target.sub(this.camera.position).normalize();
        const right = forward.cross(this.camera.up).normalize();
        const up = right.cross(forward);

        return {
            forward,
            right,
            up,
            position: this.camera.position
        };
    }

    /**
     * Project 3D point to 2D (like terrain demo)
     */
    project(point, viewMatrix) {
        // Transform to camera space
        const dx = point.x - viewMatrix.position.x;
        const dy = point.y - viewMatrix.position.y;
        const dz = point.z - viewMatrix.position.z;

        // Camera coordinates
        const cx = dx * viewMatrix.right.x + dy * viewMatrix.right.y + dz * viewMatrix.right.z;
        const cy = dx * viewMatrix.up.x + dy * viewMatrix.up.y + dz * viewMatrix.up.z;
        const cz = dx * viewMatrix.forward.x + dy * viewMatrix.forward.y + dz * viewMatrix.forward.z;

        // Perspective divide
        if (cz <= this.near) return null;

        const scale = (TETRIS.HEIGHT / 2) / Math.tan(this.fov / 2);
        const x = (cx / cz) * scale + TETRIS.WIDTH / 2;
        const y = -(cy / cz) * scale + TETRIS.HEIGHT / 2;

        return { x, y, z: cz };
    }

    /**
     * Update animation
     */
    update(deltaTime) {
        super.update(deltaTime);

        // Update camera orbit
        this.camera.angleY += this.camera.angleSpeed * deltaTime;
        this.camera.bobPhase += deltaTime * 1.2;
        
        this.camera.position.x = Math.cos(this.camera.angleY) * this.camera.radius;
        this.camera.position.z = Math.sin(this.camera.angleY) * this.camera.radius;
        this.camera.position.y = this.camera.height + Math.sin(this.camera.bobPhase) * 15;

        // Update building lights
        this.visuals.buildings.forEach(building => {
            building.lightPhase += building.lightSpeed * deltaTime;
        });

        // Update flying cars
        this.visuals.flyingCars.forEach(car => {
            if (car.pathType === 'circular') {
                car.pathPhase += car.pathSpeed * deltaTime;
                car.position.x = Math.cos(car.pathPhase) * car.pathRadius;
                car.position.z = Math.sin(car.pathPhase) * car.pathRadius;
            } else {
                car.position.x += car.velocity.x * deltaTime;
                car.position.z += car.velocity.z * deltaTime;

                if (car.position.x < -600) car.position.x = 600;
                if (car.position.x > 600) car.position.x = -600;
                if (car.position.z < -600) car.position.z = 600;
                if (car.position.z > 600) car.position.z = -600;
            }

            car.trailPoints.push({
                position: car.position.clone(),
                age: 0
            });
            
            car.trailPoints = car.trailPoints.filter(point => {
                point.age += deltaTime;
                return point.age < 0.4;
            });
        });
    }

    /**
     * Draw background using proper rendering
     */
    drawBackground(ctx, opacity) {
        // Clear and draw sky
        const skyGradient = ctx.createLinearGradient(0, 0, 0, TETRIS.HEIGHT);
        skyGradient.addColorStop(0, `rgba(30, 15, 10, ${opacity})`);
        skyGradient.addColorStop(0.6, `rgba(20, 10, 5, ${opacity})`);
        skyGradient.addColorStop(1, `rgba(40, 20, 10, ${opacity * 0.8})`);
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, TETRIS.WIDTH, TETRIS.HEIGHT);

        // Get view matrix
        const viewMatrix = this.getViewMatrix();

        // Project and sort triangles by depth
        const projectedTriangles = [];

        this.visuals.triangles.forEach(triangle => {
            const p1 = this.project(triangle.vertices[0], viewMatrix);
            const p2 = this.project(triangle.vertices[1], viewMatrix);
            const p3 = this.project(triangle.vertices[2], viewMatrix);

            if (!p1 || !p2 || !p3) return;

            // Backface culling
            const ax = p2.x - p1.x;
            const ay = p2.y - p1.y;
            const bx = p3.x - p1.x;
            const by = p3.y - p1.y;
            const cross = ax * by - ay * bx;
            
            if (cross <= 0) return; // Back-facing

            const avgZ = (p1.z + p2.z + p3.z) / 3;

            projectedTriangles.push({
                p1, p2, p3,
                color: triangle.color,
                depth: avgZ
            });
        });

        // Add flying cars to the depth sorting
        this.visuals.flyingCars.forEach(car => {
            const projected = this.project(car.position, viewMatrix);
            if (!projected) return;

            projectedTriangles.push({
                type: 'car',
                projected: projected,
                depth: projected.z,
                car: car
            });
            
            // Add car trail points
            if (car.trailPoints.length >= 2) {
                for (let i = 1; i < car.trailPoints.length; i++) {
                    const point1 = car.trailPoints[i - 1];
                    const point2 = car.trailPoints[i];

                    const proj1 = this.project(point1.position, viewMatrix);
                    const proj2 = this.project(point2.position, viewMatrix);

                    if (!proj1 || !proj2) continue;

                    projectedTriangles.push({
                        type: 'trail',
                        p1: proj1,
                        p2: proj2,
                        depth: (proj1.z + proj2.z) / 2,
                        age: point2.age,
                        color: car.color
                    });
                }
            }
        });
        
        // Add windows to depth sorting
        this.visuals.buildings.forEach(building => {
            building.windows.forEach(window => {
                const projected = this.project(window.position, viewMatrix);
                if (!projected) return;

                projectedTriangles.push({
                    type: 'window',
                    projected: projected,
                    depth: projected.z,
                    window: window,
                    building: building
                });
            });
            
            // Add rooftop lights
            if (building.topLight) {
                const lightPos = new Vector3(
                    building.x,
                    building.y + building.height + 15,
                    building.z
                );
                const projected = this.project(lightPos, viewMatrix);
                
                if (projected) {
                    projectedTriangles.push({
                        type: 'rooftopLight',
                        projected: projected,
                        depth: projected.z,
                        building: building
                    });
                }
            }
        });

        // Sort by depth (painter's algorithm)
        projectedTriangles.sort((a, b) => b.depth - a.depth);

        // Draw everything depth-sorted
        ctx.save();
        ctx.globalAlpha = 1.0; // Buildings are fully opaque
        
        projectedTriangles.forEach(item => {
            if (item.type === 'car') {
                // Draw car
                const proj = item.projected;
                const car = item.car;
                const size = Math.max(3, car.size * (400 / proj.z));

                ctx.globalAlpha = 0.9;
                const gradient = ctx.createRadialGradient(
                    proj.x, proj.y, 0,
                    proj.x, proj.y, size * 1.8
                );
                gradient.addColorStop(0, car.color);
                gradient.addColorStop(0.5, car.color);
                gradient.addColorStop(1, 'transparent');

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(proj.x, proj.y, size * 1.8, 0, Math.PI * 2);
                ctx.fill();

                // Bright center
                ctx.globalAlpha = 1.0;
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(proj.x, proj.y, size * 0.4, 0, Math.PI * 2);
                ctx.fill();
            } else if (item.type === 'trail') {
                // Draw car trail
                const alpha = (1 - item.age / 0.4) * 0.6;
                ctx.globalAlpha = alpha * opacity;
                ctx.strokeStyle = item.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(item.p1.x, item.p1.y);
                ctx.lineTo(item.p2.x, item.p2.y);
                ctx.stroke();
            } else if (item.type === 'window') {
                // Draw window
                const pulse = Math.sin(item.building.lightPhase + item.window.phaseOffset) * 0.3 + 0.7;
                const size = Math.max(1, 2.5 * (400 / item.projected.z));

                ctx.globalAlpha = pulse * 0.8 * opacity;
                const gradient = ctx.createRadialGradient(
                    item.projected.x, item.projected.y, 0,
                    item.projected.x, item.projected.y, size * 2
                );
                gradient.addColorStop(0, item.window.color);
                gradient.addColorStop(1, 'transparent');

                ctx.fillStyle = gradient;
                ctx.fillRect(
                    item.projected.x - size * 2,
                    item.projected.y - size * 2,
                    size * 4,
                    size * 4
                );
            } else if (item.type === 'rooftopLight') {
                // Draw rooftop light
                const pulse = Math.sin(item.building.lightPhase) * 0.5 + 0.5;
                const size = Math.max(5, 15 * (400 / item.projected.z));

                ctx.globalAlpha = pulse * 0.8 * opacity;
                const gradient = ctx.createRadialGradient(
                    item.projected.x, item.projected.y, 0,
                    item.projected.x, item.projected.y, size
                );
                gradient.addColorStop(0, '#FF3300');
                gradient.addColorStop(1, 'transparent');

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(item.projected.x, item.projected.y, size, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Draw triangle
                ctx.globalAlpha = 1.0;
                ctx.fillStyle = item.color;
                ctx.strokeStyle = item.color;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(item.p1.x, item.p1.y);
                ctx.lineTo(item.p2.x, item.p2.y);
                ctx.lineTo(item.p3.x, item.p3.y);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }
        });
        
        ctx.restore();
    }
}
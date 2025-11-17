/**
 * VirtualBoyTheme - Nintendo Virtual Boy inspired wireframe 3D world
 * Red and black wireframe triangles with procedural terrain generation
 */

// Global biome type definitions (height ranges only - colors not used in Virtual Boy wireframe rendering)
const BIOME_TYPES = {
    OCEAN_DEEP: {
        heightRange: [0, 0]
    },
    OCEAN: {
        heightRange: [0, 0]
    },
    BEACH: {
        heightRange: [0, 0.1]
    },
    DUNES: {
        heightRange: [0.1, 2]
    },
    LOWLAND: {
        heightRange: [2, 15]
    },
    HIGHLAND: {
        heightRange: [15, 40]
    },
    TREELINE: {
        heightRange: [40, 50]
    },
    MOUNTAIN: {
        heightRange: [50, 90]
    },
    SNOW: {
        heightRange: [90, 100]
    }
};

class NoiseGenerator {
    constructor(seed = Math.random() * 10000) {
        this.seed = seed;
        this.permutationTable = new Uint8Array(512);
        this.initPermutation();
    }

    initPermutation() {
        const permutation = new Uint8Array(256);
        for(let i = 0; i < 256; i++) permutation[i] = i;

        for(let i = 255; i > 0; i--) {
            const seedIndex = (this.seed * i) % 256;
            const j = Math.floor(seedIndex);
            [permutation[i], permutation[j]] = [permutation[j], permutation[i]];
        }

        for(let i = 0; i < 512; i++) {
            this.permutationTable[i] = permutation[i & 255];
        }
    }

    noise2D(x, z) {
        const gridX = Math.floor(x) & 255;
        const gridZ = Math.floor(z) & 255;
        x -= Math.floor(x);
        z -= Math.floor(z);

        const smoothX = this.fade(x);
        const smoothZ = this.fade(z);

        const pointA = this.permutationTable[gridX] + gridZ;
        const pointB = this.permutationTable[gridX + 1] + gridZ;

        return this.lerp(
            this.lerp(this.grad(this.permutationTable[pointA], x, z),
                      this.grad(this.permutationTable[pointB], x-1, z), smoothX),
            this.lerp(this.grad(this.permutationTable[pointA+1], x, z-1),
                      this.grad(this.permutationTable[pointB+1], x-1, z-1), smoothX),
            smoothZ);
    }

    fractalNoise(x, z, octaves = 6, persistence = 0.5) {
        let value = 0;
        let amplitude = 1.0;
        let frequency = 1.0;
        let maxValue = 0;

        // Add a slight bias to increase heights
        const heightBias = 0.1;

        for(let i = 0; i < octaves; i++) {
            const noiseValue = this.noise2D(x * frequency, z * frequency);
            // Add non-linear transformation to create more peaks
            value += amplitude * (noiseValue * noiseValue) * (1 + heightBias);
            maxValue += amplitude;
            amplitude *= persistence;
            frequency *= 2.1; // Slightly higher frequency multiplier
        }

        return value / maxValue;
    }

    // Helper functions
    fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    lerp(a, b, t) { return a + t * (b - a); }
    grad(hash, x, z) {
        const hashValue = hash & 15;
        const gradientX = hashValue < 8 ? x : z;
        const gradientZ = hashValue < 4 ? z : hashValue == 12 || hashValue == 14 ? x : z;
        return ((hashValue & 1) === 0 ? gradientX : -gradientX) +
                ((hashValue & 2) === 0 ? gradientZ : -gradientZ);
    }
}

class WorldGenerator {
    constructor(config = {}) {
        // Store original config for regeneration
        this.config = {
            seed: config.seed || Math.floor(Math.random() * 10000),
            gridResolution: config.gridResolution || 128,
            baseWorldHeight: config.baseWorldHeight || 400,
            baseWorldScale: config.baseWorldScale || 128,
            landmassSize: config.landmassSize || 0.6 + Math.random() * 0.4,
            transitionSharpness: config.transitionSharpness || 0.5 + Math.random() * 1.0,
            terrainBreakupScale: config.terrainBreakupScale || 0.5 + Math.random() * 5.0, // Reduced range for smoother terrain
            terrainBreakupIntensity: config.terrainBreakupIntensity || 0.05 + Math.random() * 0.5, // Much lower intensity for smoothness
            generator: config.generator || "island"
        };

        // Create terrain with stored config
        this.terrain = new Terrain(this.config);
    }

    // Main interface for getting terrain data
    getTerrain() {
        return this.terrain;
    }

    // Get triangle at specific world coordinates
    getTriangleAt(x, z) {
        // Convert world coordinates to grid coordinates
        const gridX = Math.floor(x / this.config.baseWorldScale + this.config.gridResolution / 2);
        const gridZ = Math.floor(z / this.config.baseWorldScale + this.config.gridResolution / 2);

        if (gridX < 0 || gridX >= this.config.gridResolution || gridZ < 0 || gridZ >= this.config.gridResolution) {
            return null;
        }

        // Find triangle containing point
        for (let i = 0; i < this.terrain.triangles.length; i++) {
            const triangle = this.terrain.triangles[i];
            const vertices = triangle.vertices;

            // Point in triangle test using barycentric coordinates
            if (this.pointInTriangle(x, z, vertices)) {
                return {
                    indices: [0, 1, 2], // Simplified indices
                    vertices: vertices,
                    normal: triangle.normal,
                    minY: Math.min(...vertices.map((v) => v.y)),
                    maxY: Math.max(...vertices.map((v) => v.y)),
                    avgY: vertices.reduce((sum, v) => sum + v.y, 0) / 3,
                    biome: this.getBiomeForHeight(vertices[0].y)
                };
            }
        }
        return null;
    }

    // Helper for triangle intersection
    pointInTriangle(x, z, vertices) {
        const [v1, v2, v3] = vertices;

        const d1 = this.sign(x, z, v1.x, v1.z, v2.x, v2.z);
        const d2 = this.sign(x, z, v2.x, v2.z, v3.x, v3.z);
        const d3 = this.sign(x, z, v3.x, v3.z, v1.x, v1.z);

        const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
        const hasPos = d1 > 0 || d2 > 0 || d3 > 0;

        return !(hasNeg && hasPos);
    }

    sign(x1, y1, x2, y2, x3, y3) {
        return (x1 - x3) * (y2 - y3) - (x2 - x3) * (y1 - y3);
    }

    getBiomeForHeight(height) {
        const heightPercent = (height / this.config.baseWorldHeight) * 100;
        for (const [biome, data] of Object.entries(BIOME_TYPES)) {
            if (heightPercent >= data.heightRange[0] && heightPercent <= data.heightRange[1]) {
                return biome;
            }
        }
        return "OCEAN";
    }

    // Regenerate world with new random seed
    regenerate() {
        this.config.seed = Math.floor(Math.random() * 10000);
        this.terrain = new Terrain(this.config);
        return this.terrain;
    }
}

// Base class with core functionality
class BaseTerrainGenerator {
    constructor(config = {}) {
        // Core settings
        this.gridResolution = config.gridResolution || 128;
        this.seed = config.seed || Math.random() * 10000;

        // Height settings
        this.baseWorldHeight = config.baseWorldHeight || 400;
        this.waterLevel = 0; // Always 0 for water
    }

    getBaseWorldHeight() {
        return this.baseWorldHeight;
    }

    generate() {
        const heightMap = [];

        for (let z = 0; z < this.gridResolution; z++) {
            heightMap[z] = [];
            for (let x = 0; x < this.gridResolution; x++) {
                const nx = x / this.gridResolution;
                const nz = z / this.gridResolution;

                const height = this.generateHeight(nx, nz);
                heightMap[z][x] = height <= this.waterLevel ? this.waterLevel : height;
            }
        }

        return heightMap;
    }

    generateHeight(x, z) {
        throw new Error("generateHeight must be implemented by derived class");
    }
}

class NoiseBasedGenerator extends BaseTerrainGenerator {
    constructor(config = {}) {
        super(config);

        // Core terrain modification parameters
        this.terrainBreakupScale = config.terrainBreakupScale || 3.0;
        this.terrainBreakupIntensity = config.terrainBreakupIntensity || 0.5;
        this.transitionSharpness = config.transitionSharpness || 0.9;

        // Shared noise generators
        this.baseNoise = new NoiseGenerator(this.seed);
        this.detailNoise = new NoiseGenerator(this.seed + 1);

        // Truly shared constants for detail generation
        this.DETAIL_FREQUENCY = 2;
        this.DETAIL_OCTAVES = 5;
        this.DETAIL_PERSISTENCE = 0.7;
        this.DETAIL_SCALE = 0.075;
        this.BASE_OCTAVES = 6;
        this.BASE_PERSISTENCE = 0.5;
        this.EDGE_OCTAVES = 3;
        this.EDGE_PERSISTENCE = 0.5;
        this.MASK_POWER = 0.8;
    }

    // Shared utility methods
    smoothstep(x, min, max) {
        x = Math.max(0, Math.min(1, (x - min) / (max - min)));
        return x * x * (3 - 2 * x);
    }

    lerp(a, b, t) {
        return a + (b - a) * t;
    }

    // Helper for shared detail noise calculation
    calculateDetailNoise(x, z) {
        return (
            this.detailNoise.fractalNoise(
                x * this.DETAIL_FREQUENCY,
                z * this.DETAIL_FREQUENCY,
                this.DETAIL_OCTAVES,
                this.DETAIL_PERSISTENCE
            ) *
            (this.baseWorldHeight * this.DETAIL_SCALE * 5)
        );
    }

    calculateFinalHeight(nx, nz, mask) {
        // Edge noise
        const edgeNoise =
            this.detailNoise.fractalNoise(
                nx * this.terrainBreakupScale,
                nz * this.terrainBreakupScale,
                this.EDGE_OCTAVES,
                this.EDGE_PERSISTENCE
            ) * this.terrainBreakupIntensity;

        mask += edgeNoise;
        mask = this.smoothstep(mask, 0, this.transitionSharpness);

        if (mask <= 0) return 0;

        // Generate base height
        let heightPercent =
            this.baseNoise.fractalNoise(nx, nz, this.BASE_OCTAVES, this.BASE_PERSISTENCE) * this.baseWorldHeight;

        // Add valley reduction - make it gentler
        const valleyNoise = this.detailNoise.fractalNoise(nx * 2, nz * 2, 4, 0.5);
        heightPercent *= 1 - valleyNoise * 0.3; // Reduced from 0.5 to 0.3 for gentler valleys

        heightPercent += this.calculateDetailNoise(nx, nz);
        heightPercent *= Math.pow(mask, this.MASK_POWER);

        // Add detail variation
        heightPercent += this.calculateDetailNoise(nx, nz);

        // Apply mask
        heightPercent *= Math.pow(mask, this.MASK_POWER);

        return (heightPercent / 100) * this.getBaseWorldHeight();
    }
}

class IslandGenerator extends NoiseBasedGenerator {
    constructor(config = {}) {
        super(config);

        // Island-specific parameters - spread out much more across the grid
        this.landmassSize = config.landmassSize || 2.5;
    }

    generateHeight(x, z) {
        // Convert back to original coordinate space for island shape
        const nx = x * 2 - 1;
        const nz = z * 2 - 1;

        // Base island shape using radial distance
        const dist = Math.sqrt(nx * nx + nz * nz);
        let mask = 1 - dist / this.landmassSize;

        return this.calculateFinalHeight(nx, nz, mask);
    }
}


class Terrain {
    constructor(config = {}) {
        // Store config for debug panel
        this.config = config;

        // Core parameters
        this.gridResolution = config.gridResolution || 128;
        this.baseWorldScale = config.baseWorldScale || 128;

        // Generate terrain data - only island generation supported
        this.generator = new IslandGenerator(config);
        this.heightMap = this.generator.generate();

        // Generate geometry
        this.generateGeometry();
    }

    generateGeometry() {
        this.vertices = [];
        this.triangles = [];
        this.normals = [];
        this.colors = [];

        const gridSize = 32; // Reduced to 32x32 squares (half the previous size)
        const vertexCount = gridSize + 1; // 33x33 vertices

        // Generate vertices in a 33x33 grid
        for (let z = 0; z < vertexCount; z++) {
            for (let x = 0; x < vertexCount; x++) {
                // Scale the world coordinates to match our desired size
                const worldX = (x - gridSize / 2) * this.baseWorldScale;
                const worldZ = (z - gridSize / 2) * this.baseWorldScale;

                // Map our 0-32 coordinates to 0-127 for heightmap sampling
                const heightX = Math.min(
                    this.gridResolution - 1,
                    Math.floor((x * (this.gridResolution - 1)) / gridSize)
                );
                const heightZ = Math.min(
                    this.gridResolution - 1,
                    Math.floor((z * (this.gridResolution - 1)) / gridSize)
                );
                const height = this.heightMap[heightZ][heightX];

                // Store vertex - Create a new Vector3 instance and store it
                const vertexIndex = z * vertexCount + x;
                // Create a proper Vector3 instance
                this.vertices[vertexIndex] = new Vector3(worldX, height, worldZ);
                this.colors[vertexIndex] = this.getColorForHeight(height);
            }
        }

        // Generate faces (triangles) for each square in the 32x32 grid
        for (let z = 0; z < gridSize; z++) {
            for (let x = 0; x < gridSize; x++) {
                const topLeft = z * vertexCount + x;
                const topRight = topLeft + 1;
                const bottomLeft = (z + 1) * vertexCount + x;
                const bottomRight = bottomLeft + 1;

                this.triangles.push(
                    new TerrainTriangle(this.vertices[topLeft], this.vertices[bottomLeft], this.vertices[topRight])
                );
                this.triangles.push(
                    new TerrainTriangle(this.vertices[topRight], this.vertices[bottomLeft], this.vertices[bottomRight])
                );
            }
        }
    }

    getColorForHeight(height) {
        // Virtual Boy wireframe - all triangles are red, biome colors not used
        return '#ff0000';
    }

    // Debug info for the panel
    getDebugInfo() {
        return {
            size: this.gridResolution,
            baseWorldScale: this.baseWorldScale,
            vertexCount: this.vertices.length,
            faceCount: this.triangles.length,
            maxHeight: Math.max(...this.vertices.map((v) => v.y)),
            minHeight: Math.min(...this.vertices.map((v) => v.y)),
            ...this.config // Include all generation parameters
        };
    }

    // Helper method for height sampling (used by debug panel)
    getHeightAt(x, z) {
        const mapX = Math.floor(x / this.baseWorldScale + this.gridResolution / 2);
        const mapZ = Math.floor(z / this.baseWorldScale + this.gridResolution / 2);

        if (mapX < 0 || mapX >= this.gridResolution || mapZ < 0 || mapZ >= this.gridResolution) {
            return 0; // Return water level for out of bounds
        }

        return this.heightMap[mapZ][mapX];
    }
}

// Use TerrainTriangle to avoid conflict with existing Triangle class
class TerrainTriangle {
    constructor(v1, v2, v3, color = null) {
        this.vertices = [v1, v2, v3];
        this.normal = this.calculateNormal();
        // If color isn't provided, calculate it based on average height
        this.color = color || this.calculateColor();
    }

    calculateNormal() {
        const edge1 = this.vertices[1].sub(this.vertices[0]);
        const edge2 = this.vertices[2].sub(this.vertices[0]);
        return edge1.cross(edge2).normalize();
    }

    calculateColor() {
        // Virtual Boy wireframe - all triangles are red
        return '#ff0000';
    }

    getVertexArray() {
        return this.vertices.flatMap(v => [v.x, v.y, v.z]);
    }

    getNormalArray() {
        return [
            ...this.normal.toArray(),
            ...this.normal.toArray(),
            ...this.normal.toArray()
        ];
    }

    getColorArray() {
        // Convert hex color to RGB array
        const r = parseInt(this.color.substr(1, 2), 16) / 255;
        const g = parseInt(this.color.substr(3, 2), 16) / 255;
        const b = parseInt(this.color.substr(5, 2), 16) / 255;
        // Return color for all three vertices
        return [r, g, b, r, g, b, r, g, b];
    }
}

class VirtualBoyTheme extends BaseTheme {
    constructor() {
        super();
        this.name = 'Virtual Boy';

        // Virtual Boy color palette - classic red/black
        this.playfield = {
            background: 'rgba(0, 0, 0, 0.98)',
            border: '#ff0000',
            grid: 'rgba(255, 0, 0, 0.15)',
            shadow: 'rgba(255, 0, 0, 0.3)'
        };
        this.pieces = {
            I: { base: '#ff0000', glow: '#ff4444', shadow: '#880000' },      // Pure bright red
            O: { base: '#851c25ff', glow: '#f00e15ff', shadow: '#880055' },      // Hot pink red
            T: { base: '#800000', glow: '#aa4444', shadow: '#330000' },      // Blood red
            S: { base: '#ff4040', glow: '#ff8484', shadow: '#992020' },      // Coral red
            Z: { base: '#400000', glow: '#844444', shadow: '#110000' },      // Burgundy red
            J: { base: '#ff8080', glow: '#ffaaaa', shadow: '#995555' },      // Salmon red
            L: { base: '#c00000', glow: '#ee4444', shadow: '#550000' },      // Candy apple red
            garbage: { base: '#600000', glow: '#a44444', shadow: '#200000' } // Maroon red for garbage
        };
        this.ui = {
            background: 'rgba(0, 0, 0, 0.95)',
            text: '#ff0000',
            accent: '#ff0000',
            border: '#ff0000'
        };
        this.background = {
            type: 'virtual_boy_wireframe',
            colors: ['#000000', '#ff0000', '#ffffff'],
            intensity: 0.8
        };

        // World generation using your exact system - force island generation
        this.worldGenerator = new WorldGenerator({
            gridResolution: 128, // Your exact grid resolution
            baseWorldHeight: 400, // Your exact height
            baseWorldScale: 128, // Your exact scale
            seed: Math.floor(Math.random() * 10000),
            landmassSize: 4.0, // Increased for larger island spread
            transitionSharpness: 1.0, // Sharper edges for better uniformity
            terrainBreakupScale: 0.5, // Lower scale for smoother terrain
            terrainBreakupIntensity: 0.05, // Minimal breakup for less chaos
            generator: "island" // Force island generation only
        });
        this.terrainData = this.worldGenerator.getTerrain();


        // Camera system
        this.camera = {
            position: new Vector3(0, 500, -150), // Raised camera height to 500 (300 + 200)
            target: new Vector3(0, -1500, 0),
            up: new Vector3(0, 1, 0),
            yaw: 0,
            pitch: Math.PI / 6 + (40 * Math.PI / 180), // Add 40 degrees down
            radius: 1600
        };

        // Enable animated UI colors with red spectrum variations
        this.uiAnimation.enabled = true;
        this.uiAnimation.speed = 0.4;
        this.uiAnimation.colors = [
            '#ff0000', // Virtual Boy red
            '#cc0000', // Darker red
            '#ff4444', // Bright red
            '#ff0000', // Back to red
        ];

    }


    /**
     * Setup - fast-forward animation and generate new world
     */
    setup() {
        // Generate a new world when theme is invoked
        this.worldGenerator = new WorldGenerator({
            gridResolution: 128,
            baseWorldHeight: 400,
            baseWorldScale: 128,
            seed: Math.floor(Math.random() * 10000),
            landmassSize: 4.0, // Increased for larger island spread
            transitionSharpness: 1.0, // Sharper edges for better uniformity
            terrainBreakupScale: 0.5, // Lower scale for smoother terrain
            terrainBreakupIntensity: 0.05, // Minimal breakup for less chaos
            generator: "island" // Force island generation only
        });
        this.terrainData = this.worldGenerator.getTerrain();

    }

    /**
     * Update camera and terrain animation
     */
    update(deltaTime) {
        super.update(deltaTime);

        // Orbit camera around the world
        this.camera.yaw += deltaTime * 0.075;
        // this.camera.pitch = Math.PI / 6 + (40 * Math.PI / 180); // Removed pitch calculation

        // Update camera position
        const distance = this.camera.radius;
        this.camera.position.x = Math.sin(this.camera.yaw) * distance;
        this.camera.position.z = Math.cos(this.camera.yaw) * distance;
        this.camera.position.y = 800 + Math.sin(this.camera.pitch) * 50; // Keep raised height at 500

    }

    /**
     * Get view matrix
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
     * Project 3D point to 2D screen space
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
        if (cz <= 1) return null;

        const scale = (TETRIS.HEIGHT / 2) / Math.tan(Math.PI / 3);
        const x = (cx / cz) * scale + TETRIS.WIDTH / 2;
        const y = -(cy / cz) * scale + TETRIS.HEIGHT / 2;

        return { x, y, z: cz };
    }

    /**
     * Draw Virtual Boy wireframe terrain
     */
    drawBackground(ctx, opacity) {
        ctx.save();
        ctx.globalAlpha = opacity;

        // Clear with black background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, TETRIS.WIDTH, TETRIS.HEIGHT);

        // Get view matrix
        const viewMatrix = this.getViewMatrix();

        // Project and sort triangles by depth
        const projectedTriangles = [];

        this.terrainData.triangles.forEach(triangle => {
            const p1 = this.project(triangle.vertices[0], viewMatrix);
            const p2 = this.project(triangle.vertices[1], viewMatrix);
            const p3 = this.project(triangle.vertices[2], viewMatrix);

            // Only skip triangle if ALL vertices are too far behind camera
            // Allow triangles with some vertices behind camera for proper wireframe clipping
            if (!p1 && !p2 && !p3) return;

            // Remove backface culling to show all triangles for full wireframe effect
            // if (p1 && p2 && p3) {
            //     const ax = p2.x - p1.x;
            //     const ay = p2.y - p1.y;
            //     const bx = p3.x - p1.x;
            //     const by = p3.y - p1.y;
            //     const cross = ax * by - ay * bx;

            //     if (cross >= 0) return; // Back-facing
            // }

            // For partial triangles (some vertices behind camera), still render the visible parts
            const avgZ = ((p1?.z || 0) + (p2?.z || 0) + (p3?.z || 0)) / 3;

            projectedTriangles.push({
                p1, p2, p3,
                color: triangle.color,
                depth: avgZ
            });
        });

        // Sort by depth (far to near)
        projectedTriangles.sort((a, b) => b.depth - a.depth);

        // Draw wireframe triangles
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 1.5;

        projectedTriangles.forEach(triangle => {
            ctx.beginPath();
            // Handle potential null projected points (vertices behind camera)
            if (triangle.p1) ctx.moveTo(triangle.p1.x, triangle.p1.y);
            if (triangle.p2) {
                if (triangle.p1) ctx.lineTo(triangle.p2.x, triangle.p2.y);
                else ctx.moveTo(triangle.p2.x, triangle.p2.y);
            }
            if (triangle.p3) {
                if (triangle.p1 || triangle.p2) ctx.lineTo(triangle.p3.x, triangle.p3.y);
                else ctx.moveTo(triangle.p3.x, triangle.p3.y);
            }
            // Close path only if we have all three points
            if (triangle.p1 && triangle.p2 && triangle.p3) ctx.closePath();
            ctx.stroke();
        });

        // Draw Virtual Boy HUD
        this.drawVirtualBoyHUD(ctx, opacity);

        ctx.restore();
    }

    /**
     * Draw Virtual Boy-style HUD elements
     */
    drawVirtualBoyHUD(ctx, opacity) {
        ctx.save();
        ctx.globalAlpha = opacity * 0.6;

        // Center crosshair
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        const centerX = TETRIS.WIDTH / 2;
        const centerY = TETRIS.HEIGHT / 2;
        const crossSize = 8;

        ctx.beginPath();
        ctx.moveTo(centerX - crossSize, centerY);
        ctx.lineTo(centerX + crossSize, centerY);
        ctx.moveTo(centerX, centerY - crossSize);
        ctx.lineTo(centerX, centerY + crossSize);
        ctx.stroke();

        ctx.restore();
    }


    /**
     * Get piece hue offset for individual tetromino colors within red spectrum
     */
    getPieceHueOffset(pieceType) {
        // Map each piece to a slightly different hue within red spectrum (-20 to +20 degrees)
        switch (pieceType) {
            case "I": return 0;      // Pure red
            case "O": return 8;      // Slightly more orange-red
            case "T": return -8;     // Slightly more blue-red
            case "S": return 15;     // More orange
            case "Z": return -15;    // More crimson
            case "J": return 20;     // Bright red-orange
            case "L": return -20;    // Deep crimson
            case "garbage": return 30; // Distinct for garbage
            default: return 0;
        }
    }

    /**
     * Convert hex color to HSL components
     */
    hexToHsl(hex) {
        const c = hex.replace("#", "");
        if (c.length !== 6) return { h: 0, s: 0, l: 0.5 };

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
     * Convert HSL back to hex
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
            // Ensure value is between 0 and 255
            const clamped = Math.max(0, Math.min(255, n));
            return clamped.toString(16).padStart(2, "0");
        };

        const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
        // Ensure valid hex format
        return hex.length === 7 ? hex : "#ff0000"; // fallback to red
    }
    

}
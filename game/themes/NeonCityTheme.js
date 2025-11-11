/**
 * NeonCityTheme - Neon city with perspective grid
 */
class NeonCityTheme extends BaseTheme {
    constructor() {
        super();
        this.name = "Neon City";

        // Initialize visuals object for theme-specific effects
        this.visuals = {};

        // Mountain configuration constants
        this.MOUNTAIN_GRID_WIDTH = 48; // Horizontal resolution of mountain grid
        this.MOUNTAIN_GRID_DEPTH = 16; // Depth resolution of mountain grid
        this.MOUNTAIN_WORLD_WIDTH = 2.8; // Width multiplier (relative to screen width)
        this.MOUNTAIN_WORLD_DEPTH = 300; // Depth in perspective space
        this.MOUNTAIN_PEAK_HEIGHT = 250; // Maximum height at peak
        this.MOUNTAIN_PEAK_POSITION = 0.85; // Where peak occurs (0-1, closer to 1 = further back)
        this.MOUNTAIN_PEAK_DROPOFF = 0.3; // How much to drop after peak (0-1)
        this.MOUNTAIN_NOISE_SCALE_1 = 4; // First noise frequency (lower = broader features)
        this.MOUNTAIN_NOISE_SCALE_2 = 8; // Second noise frequency (higher = finer detail)
        this.MOUNTAIN_NOISE_AMOUNT = 70; // Height variation from noise
        this.MOUNTAIN_SWAY_SPEED = 0.3; // Animation sway speed
        this.MOUNTAIN_SWAY_AMOUNT = 2; // Animation sway distance

        // Theme colors and styling
        this.playfield = {
            background: "rgba(10, 10, 30, 0.95)",
            border: "#00ffff",
            grid: "rgba(0, 255, 255, 0.1)",
            shadow: "rgba(0, 255, 255, 0.3)"
        };
        this.pieces = {
            I: { base: "#00ffff", glow: "#ffffff", shadow: "#008888" }, // Cyan - classic I piece but neon-bright
            O: { base: "#ff0066", glow: "#ffffff", shadow: "#880033" }, // Hot pink - synthwave vibe for square
            T: { base: "#ff00ff", glow: "#ffffff", shadow: "#880088" }, // Bright magenta - cyberpunk purple
            S: { base: "#00ff80", glow: "#ffffff", shadow: "#008844" }, // Electric green - retro terminal green
            Z: { base: "#ff3300", glow: "#ffffff", shadow: "#881800" }, // Synthwave orange - classic Z but neon
            J: { base: "#0088ff", glow: "#ffffff", shadow: "#004488" }, // Electric blue - neon blue glow
            L: { base: "#ffff00", glow: "#ffffff", shadow: "#888800" }, // Laser yellow - bright neon yellow
            garbage: { base: "#666666", glow: "#666666", shadow: "#444444" } // Gray for garbage blocks
        };
        this.ui = {
            background: "rgba(0, 20, 40, 0.9)",
            text: "#ffffff",
            accent: "#00ffff",
            border: "#00ffff"
        };
        this.background = {
            type: "perspective_grid",
            colors: ["#00ffff", "#ff00ff", "#ffff00"], // Cyan, magenta, yellow
            intensity: 0.8
        };

        // Initialize perspective grid
        this.visuals.perspectiveGrid = this.createPerspectiveGrid();

        // Initialize geometric shapes
        this.visuals.geometricShapes = this.createGeometricShapes();

        // Initialize wireframe 3D objects
        this.visuals.wireframe3D = this.createWireframe3DObjects();

        // Initialize grid-based mountains
        this.visuals.mountains = this.createGridBasedMountains();

        // Initialize retro sun
        this.visuals.sun = this.createRetroSun();

        // Enable animated UI colors
        this.uiAnimation.enabled = true;
        this.uiAnimation.speed = 0.4; // Medium speed
        this.uiAnimation.colors = [
            "#00ffff", // Cyan
            "#ff00ff", // Magenta
            "#ffff00", // Yellow
            "#00ff88", // Green
            "#ff8800", // Orange
            "#ff0088", // Pink
            "#8800ff", // Purple
            "#00ffff" // Cyan (back)
        ];
    }

    /**
     * Setup - fast-forward animation to populate grid lines
     */
    setup() {
        // Flag to prevent celestial bodies from moving during setup
        this.setupMode = true;

        // Run 30 seconds worth of updates at 60fps to populate the grid
        const frameTime = 1 / 60; // 60fps
        const numFrames = 30 * 60; // 30 seconds * 60fps = 1800 frames

        for (let i = 0; i < numFrames; i++) {
            this.update(frameTime);
        }

        // Setup complete, allow normal updates
        this.setupMode = false;
    }

    /**
     * Create grid-based procedural mountains
     */
    createGridBasedMountains() {
        const gridWidth = this.MOUNTAIN_GRID_WIDTH;
        const gridDepth = this.MOUNTAIN_GRID_DEPTH;
        const worldWidth = TETRIS.WIDTH * this.MOUNTAIN_WORLD_WIDTH;
        const worldDepth = this.MOUNTAIN_WORLD_DEPTH;
        const horizonY = TETRIS.HEIGHT * 0.5; // Horizon line

        const vertices = [];
        const triangles = [];

        // Simple noise function for height variation
        const simpleNoise = (x, z, seed = 0) => {
            const n = Math.sin(x * 12.9898 + z * 78.233 + seed) * 43758.5453;
            return n - Math.floor(n);
        };

        // Generate vertices with procedural heights
        for (let z = 0; z <= gridDepth; z++) {
            for (let x = 0; x <= gridWidth; x++) {
                const nx = x / gridWidth;
                const nz = z / gridDepth;

                // World position
                const worldX = (nx - 0.5) * worldWidth;
                const worldZ = nz * worldDepth;

                // Height calculation - starts low, peaks at back, drops slightly after
                let heightFactor;
                if (nz < this.MOUNTAIN_PEAK_POSITION) {
                    // Rise to peak
                    heightFactor = Math.pow(nz / this.MOUNTAIN_PEAK_POSITION, 1.8);
                } else {
                    // Drop down after peak for depth
                    const dropFactor = (nz - this.MOUNTAIN_PEAK_POSITION) / (1.0 - this.MOUNTAIN_PEAK_POSITION);
                    heightFactor = 1.0 - dropFactor * this.MOUNTAIN_PEAK_DROPOFF;
                }

                // Add noise variation for natural peaks/valleys
                const noise1 = simpleNoise(nx * this.MOUNTAIN_NOISE_SCALE_1, nz * 2, 123) * 2 - 1;
                const noise2 = simpleNoise(nx * this.MOUNTAIN_NOISE_SCALE_2, nz * 4, 456) * 2 - 1;
                const noiseValue = noise1 * 0.7 + noise2 * 0.3;

                // Final height
                const baseHeight = heightFactor * this.MOUNTAIN_PEAK_HEIGHT;
                const noiseHeight = noiseValue * this.MOUNTAIN_NOISE_AMOUNT * heightFactor;
                const totalHeight = baseHeight + noiseHeight;

                vertices.push({
                    x: worldX,
                    y: totalHeight,
                    z: worldZ,
                    baseX: worldX,
                    baseY: totalHeight,
                    baseZ: worldZ
                });
            }
        }

        // Generate triangles from grid
        for (let z = 0; z < gridDepth; z++) {
            for (let x = 0; x < gridWidth; x++) {
                const i0 = z * (gridWidth + 1) + x;
                const i1 = i0 + 1;
                const i2 = (z + 1) * (gridWidth + 1) + x;
                const i3 = i2 + 1;

                // First triangle
                triangles.push({
                    indices: [i0, i2, i1],
                    avgZ: (vertices[i0].z + vertices[i2].z + vertices[i1].z) / 3
                });

                // Second triangle
                triangles.push({
                    indices: [i1, i2, i3],
                    avgZ: (vertices[i1].z + vertices[i2].z + vertices[i3].z) / 3
                });
            }
        }

        return {
            vertices: vertices,
            triangles: triangles,
            gridWidth: gridWidth,
            gridDepth: gridDepth,
            horizonY: horizonY,
            swayPhase: 0,
            swaySpeed: this.MOUNTAIN_SWAY_SPEED,
            swayAmount: this.MOUNTAIN_SWAY_AMOUNT
        };
    }

    /**
     * Create retro synthwave sun and moon for day/night cycle
     */
    createRetroSun() {
        const sunRadius = 72; // Original sun size
        const moonRadius = 36; // Half moon size
        const baseY = TETRIS.HEIGHT * 0.25 - 50; // Higher in the sky (moved up 50px)
        const sunX = TETRIS.WIDTH * 0.35;
        const moonX = sunX + 800; // Moon starts 800px to the right of sun

        return {
            // Sun
            sun: {
                x: sunX, // Start center-left
                y: baseY,
                baseY: baseY, // Store base Y for wave motion
                radius: sunRadius,
                numBands: 12,
                speed: 15, // Pixels per second
                wavePhase: 0,
                waveAmplitude: 8
            },
            // Moon
            moon: {
                x: moonX, // Start off-screen right
                y: baseY,
                baseY: baseY,
                radius: moonRadius,
                speed: 15,
                wavePhase: Math.PI, // Offset wave phase from sun
                waveAmplitude: 8
            },
            pulsePhase: 0
        };
    }

    /**
     * Create 8 individually different wireframe 3D objects (2 of each type)
     */
    createWireframe3DObjects() {
        const objects = [];
        const allTypes = ["cube", "sphere", "cone", "cylinder", "tetrahedron", "longCuboid", "octahedron", "torus"];
        const typeColors = {
            cube: "#ffffff",
            sphere: "#00ffff",
            cone: "#ff00ff",
            cylinder: "#ffff00",
            tetrahedron: "#8800ffff",
            longCuboid: "#00ff88",
            octahedron: "#ff0088",
            torus: "#ff7700ff"
        };

        // Create 1 of each type (8 total objects)
        allTypes.forEach((type, typeIndex) => {
            const size = 30 + Math.random() * 40;
            objects.push({
                type: type,
                x: Math.random() * TETRIS.WIDTH,
                y: Math.random() * TETRIS.HEIGHT,
                z: 0,
                size: size,
                vx: (Math.random() - 0.5) * 20,
                vy: (Math.random() - 0.5) * 20,
                vz: (Math.random() - 0.5) * 10,
                rotationX: Math.random() * Math.PI * 2,
                rotationY: Math.random() * Math.PI * 2,
                rotationZ: Math.random() * Math.PI * 2,
                rotationSpeedX: (Math.random() - 0.5) * 1,
                rotationSpeedY: (Math.random() - 0.5) * 1,
                rotationSpeedZ: (Math.random() - 0.5) * 1,
                opacity: Math.random() * 0.3 + 0.1,
                color: typeColors[type] || "#ffffff"
            });
        });

        return objects;
    }

    /**
     * Generate vertices, edges, and faces for 3D shapes
     */
    generate3DShape(type, size) {
        switch (type) {
            case "cube":
                return this.generateCube(size);
            case "sphere":
                return this.generateSphere(size);
            case "cone":
                return this.generateCone(size);
            case "cylinder":
                return this.generateCylinder(size);
            case "tetrahedron":
                return this.generateTetrahedron(size);
            case "longCuboid":
                return this.generateLongCuboid(size);
            case "octahedron":
                return this.generateOctahedron(size);
            case "torus":
                return this.generateTorus(size);
            default:
                return this.generateCube(size);
        }
    }

    generateCube(size) {
        const s = size / 2;
        const vertices = [
            [-s, -s, -s],
            [s, -s, -s],
            [s, s, -s],
            [-s, s, -s], // Back face
            [-s, -s, s],
            [s, -s, s],
            [s, s, s],
            [-s, s, s] // Front face
        ];
        const edges = [
            [0, 1],
            [1, 2],
            [2, 3],
            [3, 0], // Back face
            [4, 5],
            [5, 6],
            [6, 7],
            [7, 4], // Front face
            [0, 4],
            [1, 5],
            [2, 6],
            [3, 7] // Connecting edges
        ];
        const faces = [
            [0, 1, 2, 3], // Back
            [4, 7, 6, 5], // Front
            [0, 4, 5, 1], // Bottom
            [2, 6, 7, 3], // Top
            [0, 3, 7, 4], // Left
            [1, 5, 6, 2] // Right
        ];
        return { vertices, edges, faces };
    }

    generateSphere(size) {
        const vertices = [];
        const edges = [];
        const faces = [];
        const segments = 8;
        const rings = 6;

        // Generate vertices
        for (let i = 0; i <= rings; i++) {
            const theta = (i / rings) * Math.PI;
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);

            for (let j = 0; j <= segments; j++) {
                const phi = (j / segments) * Math.PI * 2;
                const x = size * sinTheta * Math.cos(phi);
                const y = size * cosTheta;
                const z = size * sinTheta * Math.sin(phi);
                vertices.push([x, y, z]);
            }
        }

        // Generate edges (latitude and longitude lines)
        for (let i = 0; i < rings; i++) {
            for (let j = 0; j < segments; j++) {
                const current = i * (segments + 1) + j;
                const next = current + segments + 1;

                // Longitude lines
                edges.push([current, next]);
                // Latitude lines
                edges.push([current, current + 1]);
            }
        }

        // Generate triangular faces
        for (let i = 0; i < rings; i++) {
            for (let j = 0; j < segments; j++) {
                const current = i * (segments + 1) + j;
                const next = current + 1;
                const below = current + segments + 1;
                const belowNext = below + 1;

                // First triangle
                faces.push([current, next, below]);
                // Second triangle
                faces.push([next, belowNext, below]);
            }
        }

        return { vertices, edges, faces };
    }

    generateCone(size) {
        const vertices = [];
        const edges = [];
        const faces = [];
        const segments = 12;
        const height = size * 1.5;

        // Apex
        vertices.push([0, -height / 2, 0]);

        // Base circle
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const x = size * Math.cos(angle);
            const z = size * Math.sin(angle);
            vertices.push([x, height / 2, z]);
        }

        // Edges from apex to base
        for (let i = 1; i <= segments; i++) {
            edges.push([0, i]);
        }

        // Base circle edges
        for (let i = 1; i < segments; i++) {
            edges.push([i, i + 1]);
        }
        edges.push([segments, 1]); // Close the circle

        // Generate triangular faces from apex to base segments
        for (let i = 1; i <= segments - 1; i++) {
            faces.push([0, i, i + 1]);
        }
        // Close the cone surface
        faces.push([0, segments, 1]);

        return { vertices, edges, faces };
    }

    generateCylinder(size) {
        const vertices = [];
        const edges = [];
        const faces = [];
        const segments = 12;
        const height = size * 1.5;

        // Top circle
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const x = size * Math.cos(angle);
            const z = size * Math.sin(angle);
            vertices.push([x, -height / 2, z]);
        }

        // Bottom circle
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const x = size * Math.cos(angle);
            const z = size * Math.sin(angle);
            vertices.push([x, height / 2, z]);
        }

        // Top circle edges
        for (let i = 0; i < segments - 1; i++) {
            edges.push([i, i + 1]);
        }
        edges.push([segments - 1, 0]);

        // Bottom circle edges
        for (let i = segments; i < segments * 2 - 1; i++) {
            edges.push([i, i + 1]);
        }
        edges.push([segments * 2 - 1, segments]);

        // Connecting edges
        for (let i = 0; i < segments; i++) {
            edges.push([i, i + segments]);
        }

        // Generate side faces (quadrilaterals)
        for (let i = 0; i < segments; i++) {
            const next = (i + 1) % segments;
            const topCurrent = i;
            const topNext = next;
            const bottomCurrent = i + segments;
            const bottomNext = next + segments;

            faces.push([topCurrent, topNext, bottomNext, bottomCurrent]);
        }

        return { vertices, edges, faces };
    }

    generateTetrahedron(size) {
        const s = size / 2;
        // Regular tetrahedron vertices
        const vertices = [
            [s, s, s], // Front top
            [-s, -s, s], // Front bottom
            [s, -s, -s], // Back bottom
            [-s, s, -s] // Back top
        ];
        // Connect every vertex to every other vertex (4 vertices = 6 edges)
        const edges = [
            [0, 1],
            [0, 2],
            [0, 3], // From first vertex
            [1, 2],
            [1, 3], // From second vertex
            [2, 3] // From third vertex
        ];
        const faces = [
            [0, 1, 2],
            [0, 2, 3],
            [0, 3, 1],
            [1, 3, 2]
        ];
        return { vertices, edges, faces };
    }

    generateLongCuboid(size) {
        // Elongated cuboid (stretched along Z axis)
        const s = size / 2;
        const length = size * 1.5; // 50% longer in Z direction
        const vertices = [
            [-s, -s, -length],
            [s, -s, -length],
            [s, s, -length],
            [-s, s, -length], // Back face
            [-s, -s, length],
            [s, -s, length],
            [s, s, length],
            [-s, s, length] // Front face
        ];
        const edges = [
            [0, 1],
            [1, 2],
            [2, 3],
            [3, 0], // Back face
            [4, 5],
            [5, 6],
            [6, 7],
            [7, 4], // Front face
            [0, 4],
            [1, 5],
            [2, 6],
            [3, 7] // Connecting edges
        ];
        const faces = [
            [0, 1, 2, 3], // Back
            [4, 7, 6, 5], // Front
            [0, 4, 5, 1], // Bottom
            [2, 6, 7, 3], // Top
            [0, 3, 7, 4], // Left
            [1, 5, 6, 2] // Right
        ];
        return { vertices, edges, faces };
    }

    generateOctahedron(size) {
        const s = size / 2;
        // Regular octahedron vertices (8 faces, 6 vertices, 12 edges)
        const vertices = [
            [s, 0, 0], // Right
            [-s, 0, 0], // Left
            [0, s, 0], // Top
            [0, -s, 0], // Bottom
            [0, 0, s], // Front
            [0, 0, -s] // Back
        ];
        // Connect each vertex to every other except itself and its opposite
        const edges = [
            [0, 2],
            [0, 3],
            [0, 4],
            [0, 5], // From right point
            [1, 2],
            [1, 3],
            [1, 4],
            [1, 5], // From left point
            [2, 4],
            [2, 5],
            [3, 4],
            [3, 5] // Top and bottom to front/back
        ];
        const faces = [
            [0, 2, 4], // Right top front
            [0, 4, 3], // Right bottom front
            [0, 3, 5], // Right bottom back
            [0, 5, 2], // Right top back
            [1, 4, 2], // Left top front
            [1, 3, 4], // Left bottom front
            [1, 5, 3], // Left bottom back
            [1, 2, 5] // Left top back
        ];
        return { vertices, edges, faces };
    }

    generateTorus(size) {
        const vertices = [];
        const edges = [];
        const faces = [];
        const majorSegments = 12; // Around the tube
        const minorSegments = 8; // Around the torus

        // Generate vertices for torus
        for (let i = 0; i < majorSegments; i++) {
            const majorAngle = (i / majorSegments) * Math.PI * 2;
            const centerX = Math.cos(majorAngle) * (size * 0.7); // Major radius
            const centerZ = Math.sin(majorAngle) * (size * 0.7);

            for (let j = 0; j < minorSegments; j++) {
                const minorAngle = (j / minorSegments) * Math.PI * 2;
                const x = centerX + Math.cos(minorAngle) * (size * 0.3); // Minor radius
                const y = Math.sin(minorAngle) * (size * 0.3);
                const z = centerZ;
                vertices.push([x, y, z]);
            }
        }

        // Generate edges - connect within each major ring
        for (let i = 0; i < majorSegments; i++) {
            for (let j = 0; j < minorSegments; j++) {
                const current = i * minorSegments + j;
                const next = current + 1;
                const nextRing = ((i + 1) % majorSegments) * minorSegments + j;

                // Connect within ring
                if (j < minorSegments - 1) {
                    edges.push([current, next]);
                } else {
                    edges.push([current, i * minorSegments]); // Close ring
                }

                // Connect between rings
                edges.push([current, nextRing]);
            }
        }

        // Generate faces - create two triangles per grid position
        for (let i = 0; i < majorSegments; i++) {
            for (let j = 0; j < minorSegments; j++) {
                const current = i * minorSegments + j;
                const next = current + 1;
                const nextRing = ((i + 1) % majorSegments) * minorSegments + j;
                const nextRingNext = nextRing + 1;

                // First triangle
                if (j < minorSegments - 1) {
                    faces.push([current, next, nextRing]);
                } else {
                    // Handle wrap-around for last segment in ring
                    faces.push([current, i * minorSegments, nextRing]);
                }

                // Second triangle
                if (j < minorSegments - 1) {
                    faces.push([next, nextRingNext, nextRing]);
                } else {
                    // Handle wrap-around for last segment in ring
                    const nextRingFirst = ((i + 1) % majorSegments) * minorSegments;
                    faces.push([i * minorSegments, nextRingFirst, nextRing]);
                }
            }
        }

        return { vertices, edges, faces };
    }

    /**
     * Rotate a 3D point
     */
    rotate3D(point, rotX, rotY, rotZ) {
        let [x, y, z] = point;

        // Rotate around X axis
        let cosX = Math.cos(rotX);
        let sinX = Math.sin(rotX);
        let y1 = y * cosX - z * sinX;
        let z1 = y * sinX + z * cosX;
        y = y1;
        z = z1;

        // Rotate around Y axis
        let cosY = Math.cos(rotY);
        let sinY = Math.sin(rotY);
        let x1 = x * cosY + z * sinY;
        let z2 = -x * sinY + z * cosY;
        x = x1;
        z = z2;

        // Rotate around Z axis
        let cosZ = Math.cos(rotZ);
        let sinZ = Math.sin(rotZ);
        let x2 = x * cosZ - y * sinZ;
        let y2 = x * sinZ + y * cosZ;

        return [x2, y2, z];
    }

    /**
     * Project 3D point to 2D screen space
     */
    project3D(point, centerX, centerY, perspective = 400) {
        const [x, y, z] = point;
        const scale = perspective / (perspective + z);
        return {
            x: centerX + x * scale,
            y: centerY + y * scale
        };
    }

    /**
     * Create geometric shapes for neon city theme
     */
    createGeometricShapes() {
        const shapes = [];
        for (let i = 0; i < 15; i++) {
            shapes.push({
                x: Math.random() * TETRIS.WIDTH,
                y: Math.random() * TETRIS.HEIGHT,
                size: Math.random() * 40 + 10,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 2,
                vx: (Math.random() - 0.5) * 30,
                vy: (Math.random() - 0.5) * 30,
                type: Math.random() > 0.5 ? "square" : "triangle",
                opacity: Math.random() * 0.2 + 0.05
            });
        }
        return shapes;
    }

    /**
     * Create perspective grid for driving-forward effect
     */
    createPerspectiveGrid() {
        const horizonY = TETRIS.HEIGHT * 0.5; // Horizon at 40% down the screen
        const vanishingPointX = TETRIS.WIDTH / 2; // Center of screen

        return {
            horizonY: horizonY,
            vanishingPointX: vanishingPointX,
            horizonPulse: 0, // For pulsing effect

            // Horizontal lines that move toward us
            horizontalLines: [],
            lineSpawnTimer: 0,
            lineSpawnInterval: 0.15, // Spawn new line every 0.15s

            // Vertical lines are static (we'll calculate them on draw)
            numVerticalLines: 12, // Number of vertical lines from bottom
            numSideLines: 12 // Number of lines from left/right edges
        };
    }

    /**
     * Update neon city theme animation
     */
    update(deltaTime) {
        super.update(deltaTime);

        const grid = this.visuals.perspectiveGrid;

        // Update horizon pulse
        grid.horizonPulse += deltaTime * 3; // Pulse frequency

        // Update geometric shapes
        this.visuals.geometricShapes.forEach((shape) => {
            shape.x += shape.vx * deltaTime;
            shape.y += shape.vy * deltaTime;
            shape.rotation += shape.rotationSpeed * deltaTime;

            if (shape.x < -shape.size) shape.x = TETRIS.WIDTH + shape.size;
            if (shape.x > TETRIS.WIDTH + shape.size) shape.x = -shape.size;
            if (shape.y < -shape.size) shape.y = TETRIS.HEIGHT + shape.size;
            if (shape.y > TETRIS.HEIGHT + shape.size) shape.y = -shape.size;
        });

        // Update wireframe 3D objects
        this.visuals.wireframe3D.forEach((obj) => {
            obj.x += obj.vx * deltaTime;
            obj.y += obj.vy * deltaTime;
            obj.z += obj.vz * deltaTime;

            obj.rotationX += obj.rotationSpeedX * deltaTime;
            obj.rotationY += obj.rotationSpeedY * deltaTime;
            obj.rotationZ += obj.rotationSpeedZ * deltaTime;

            // Wrap around screen
            if (obj.x < -obj.size * 2) obj.x = TETRIS.WIDTH + obj.size * 2;
            if (obj.x > TETRIS.WIDTH + obj.size * 2) obj.x = -obj.size * 2;
            if (obj.y < -obj.size * 2) obj.y = TETRIS.HEIGHT + obj.size * 2;
            if (obj.y > TETRIS.HEIGHT + obj.size * 2) obj.y = -obj.size * 2;

            // Keep z in reasonable range
            if (obj.z > 200) obj.z = -200;
            if (obj.z < -200) obj.z = 200;
        });

        // Update mountain sway animation
        const mountains = this.visuals.mountains;
        mountains.swayPhase += mountains.swaySpeed * deltaTime;

        // Apply sway to all vertices based on height
        mountains.vertices.forEach((vertex) => {
            const heightFactor = vertex.y / 120; // Normalized height
            const swayOffset =
                Math.sin(mountains.swayPhase + vertex.baseZ * 0.01) * mountains.swayAmount * heightFactor;
            vertex.x = vertex.baseX + swayOffset;
        });

        // Update sun and moon movement (skip during setup mode)
        if (!this.setupMode) {
            const celestialBodies = this.visuals.sun;

            // Update sun position
            celestialBodies.sun.x -= celestialBodies.sun.speed * deltaTime;
            celestialBodies.sun.wavePhase += deltaTime * 1.5;
            celestialBodies.sun.y =
                celestialBodies.sun.baseY + Math.sin(celestialBodies.sun.wavePhase) * celestialBodies.sun.waveAmplitude;

            // Update moon position
            celestialBodies.moon.x -= celestialBodies.moon.speed * deltaTime;
            celestialBodies.moon.wavePhase += deltaTime * 1.5;
            celestialBodies.moon.y =
                celestialBodies.moon.baseY +
                Math.sin(celestialBodies.moon.wavePhase) * celestialBodies.moon.waveAmplitude;

            // Smooth teleport logic: fade out before teleporting to avoid jarring transitions
            const leftEdge = -400;
            const respawnX = 1200;

            // Fade sun if approaching edge
            if (celestialBodies.sun.x < -200) {
                const fadeDistance = -200 - celestialBodies.sun.x;
                const fadeProgress = Math.min(1, fadeDistance / 200);
                // Could add opacity fade here if needed
            }

            // Fade moon if approaching edge
            if (celestialBodies.moon.x < -200) {
                const fadeDistance = -200 - celestialBodies.moon.x;
                const fadeProgress = Math.min(1, fadeDistance / 200);
                // Could add opacity fade here if needed
            }

            // Smooth teleport when fully off-screen
            if (celestialBodies.sun.x < leftEdge) {
                celestialBodies.sun.x = respawnX;
            }

            if (celestialBodies.moon.x < leftEdge) {
                celestialBodies.moon.x = respawnX;
            }

            // Update pulse for glow effects
            celestialBodies.pulsePhase += deltaTime * 2;
        }

        // Spawn new horizontal lines at the horizon
        grid.lineSpawnTimer += deltaTime;
        if (grid.lineSpawnTimer >= grid.lineSpawnInterval) {
            grid.lineSpawnTimer = 0;
            grid.horizontalLines.push({
                y: grid.horizonY,
                alpha: 0.8
            });
        }

        // Update horizontal lines - they accelerate as they get closer
        grid.horizontalLines = grid.horizontalLines.filter((line) => {
            // Calculate speed based on distance from horizon (perspective acceleration)
            // Lines far from us (near horizon) move slow
            // Lines close to us (near bottom) move fast
            const distanceFromHorizon = line.y - grid.horizonY;
            const maxDistance = TETRIS.HEIGHT - grid.horizonY;
            const progress = distanceFromHorizon / maxDistance; // 0 at horizon, 1 at bottom

            // Speed increases exponentially as we get closer
            const baseSpeed = 50;
            const speed = baseSpeed * (1 + progress * progress * 8); // Exponential acceleration

            line.y += speed * deltaTime;

            // Fade out as lines get closer to bottom
            line.alpha = 0.8 * (1 - progress * 0.7);

            // Remove lines that go off screen
            return line.y < TETRIS.HEIGHT + 10;
        });
    }

    /**
     * Draw perspective grid background
     */
    drawBackground(ctx, opacity) {
        const grid = this.visuals.perspectiveGrid;
        const colors = this.background.colors;

        // Draw vertical perspective lines (converging to vanishing point)
        this.drawVerticalPerspectiveLines(ctx, grid, colors, opacity);

        // Draw horizontal lines moving toward us
        this.drawHorizontalGridLines(ctx, grid, colors, opacity);

        // Draw retro sun and moon (behind mountains)
        this.drawRetroSun(ctx, opacity);
        this.drawMoon(ctx, opacity);

        // Draw grid-based mountains (behind horizon line)
        this.drawGridBasedMountains(ctx, opacity);

        // Draw pulsing horizon line (draws over mountains)
        this.drawHorizonLine(ctx, grid, colors, opacity);

        // Draw wireframe 3D objects
        this.drawWireframe3D(ctx, opacity);

        // Draw floating geometric shapes
        //this.drawFloatingGeometry(ctx, opacity);
    }

    /**
     * Draw vertical perspective grid lines - proper rectangular grid in perspective
     */
    drawVerticalPerspectiveLines(ctx, grid, colors, opacity) {
        ctx.save();

        const totalLines = 41;
        const horizonY = grid.horizonY;
        const baseY = TETRIS.HEIGHT + 100;
        const horizonSpan = TETRIS.WIDTH * 3.6;
        const baseSpan = TETRIS.WIDTH * 100;
        const spreadPower = 2.0;
        const minSpread = 0.005; // Skip lines too close to center

        ctx.strokeStyle = colors[0];
        ctx.globalAlpha = opacity * 0.3;
        ctx.lineWidth = 1.5;

        for (let i = 0; i < totalLines; i++) {
            const t = i / (totalLines - 1);
            const rawSpread = t - 0.5;
            const spread = Math.sign(rawSpread) * Math.pow(Math.abs(rawSpread), spreadPower);

            if (Math.abs(spread) < minSpread) continue; // Skip tight center lines

            const vx = grid.vanishingPointX + spread * (horizonSpan / 2);
            const bx = grid.vanishingPointX + spread * (baseSpan / 2);

            ctx.beginPath();
            ctx.moveTo(vx, horizonY);
            ctx.lineTo(bx, baseY);
            ctx.stroke();
        }

        // Optional: draw center line manually
        ctx.beginPath();
        ctx.moveTo(grid.vanishingPointX, horizonY);
        ctx.lineTo(grid.vanishingPointX, baseY);
        ctx.stroke();

        ctx.restore();
    }

    /**
     * Draw horizontal grid lines moving toward the viewer
     */
    drawHorizontalGridLines(ctx, grid, colors, opacity) {
        ctx.save();

        grid.horizontalLines.forEach((line, index) => {
            // Calculate line width based on perspective (closer = wider)
            const distanceFromHorizon = line.y - grid.horizonY;
            const maxDistance = TETRIS.HEIGHT - grid.horizonY;
            const progress = distanceFromHorizon / maxDistance;

            // Lines span full width of screen
            const leftX = 0;
            const rightX = TETRIS.WIDTH;

            // All horizontal lines are cyan
            ctx.strokeStyle = colors[0]; // Cyan
            ctx.globalAlpha = (opacity * (line.y - grid.horizonY)) / (TETRIS.HEIGHT - grid.horizonY); // sick

            ctx.lineWidth = 1.5 + progress * 1.5; // Lines get thicker as they approach

            ctx.beginPath();
            ctx.moveTo(leftX, line.y);
            ctx.lineTo(rightX, line.y);
            ctx.stroke();
        });

        ctx.restore();
    }

    /**
     * Draw pulsing horizon line
     */
    drawHorizonLine(ctx, grid, colors, opacity) {
        ctx.save();

        // Calculate dynamic color based on celestial body positions
        const horizonColor = this.getDynamicHorizonColor(colors);

        // Pulsing glow effect
        const pulseIntensity = Math.sin(grid.horizonPulse) * 0.3 + 0.7; // Oscillates between 0.4 and 1.0

        // Draw thick horizon line with glow
        ctx.strokeStyle = horizonColor;
        ctx.globalAlpha = opacity * pulseIntensity;
        ctx.lineWidth = 4;
        ctx.shadowBlur = 15;
        ctx.shadowColor = horizonColor;

        const leftX = 0;
        const rightX = TETRIS.WIDTH;

        ctx.beginPath();
        ctx.moveTo(leftX, grid.horizonY);
        ctx.lineTo(rightX, grid.horizonY);
        ctx.stroke();

        // Draw second pass for extra glow
        ctx.lineWidth = 2;
        ctx.shadowBlur = 25;
        ctx.globalAlpha = opacity * pulseIntensity * 0.5;
        ctx.stroke();

        ctx.restore();
    }

    /**
     * Calculate dynamic horizon color based on sun/moon positions
     */
    getDynamicHorizonColor(colors) {
        const celestialBodies = this.visuals.sun;

        // Get screen positions of sun and moon (handle wrapping smoothly)
        const sunScreenX = this.getSmoothScreenPosition(celestialBodies.sun.x);
        const moonScreenX = this.getSmoothScreenPosition(celestialBodies.moon.x);

        // Calculate which celestial body has more influence
        // Bodies closer to center of screen have more influence
        const sunInfluence = Math.max(0, 1 - Math.abs(sunScreenX - 0.5) * 3); // Center = 1.0, edges = 0
        const moonInfluence = Math.max(0, 1 - Math.abs(moonScreenX - 0.5) * 3);

        // Normalize influences
        const totalInfluence = sunInfluence + moonInfluence;
        const sunWeight = totalInfluence > 0 ? sunInfluence / totalInfluence : 0.5;
        const moonWeight = totalInfluence > 0 ? moonInfluence / totalInfluence : 0.5;

        // Define color targets
        const sunColor = "#ff00ff"; // Pink/magenta for sun
        const moonColor = "#0088ff"; // Blue for moon

        // Interpolate between colors
        return this.interpolateColor(sunColor, moonColor, moonWeight);
    }

    /**
     * Get smooth screen position handling wrapping at edges
     */
    getSmoothScreenPosition(worldX) {
        // Handle the wraparound more smoothly by considering both possible positions
        const screenX1 = (worldX / TETRIS.WIDTH + 1) / 2; // Current position

        // If near left edge, also consider the "wrapped" position on right
        if (worldX < -200) {
            const screenX2 = ((worldX + 1200) / TETRIS.WIDTH + 1) / 2; // Wrapped position
            // Use smoother transition - closer to edge = more weight on wrapped position
            const edgeDistance = -200 - worldX;
            const transitionProgress = Math.min(1, edgeDistance / 200);
            return screenX1 * (1 - transitionProgress) + screenX2 * transitionProgress;
        }

        return screenX1;
    }

    /**
     * Draw retro synthwave sun with horizontal bands
     */
    drawRetroSun(ctx, opacity) {
        const celestialBodies = this.visuals.sun;
        if (!celestialBodies || !celestialBodies.sun) {
            return;
        }
        const sun = celestialBodies.sun;
        ctx.save();

        // Create radial gradient for glow
        const glowRadius = celestialBodies.sun.radius * 1.5;
        const glowGradient = ctx.createRadialGradient(sun.x, sun.y, sun.radius * 0.5, sun.x, sun.y, glowRadius);
        glowGradient.addColorStop(0, "rgba(255, 255, 100, 0.3)");
        glowGradient.addColorStop(0.5, "rgba(255, 100, 150, 0.2)");
        glowGradient.addColorStop(1, "rgba(255, 0, 150, 0)");

        // Draw glow
        ctx.globalAlpha = opacity * 0.6;
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(sun.x, sun.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Set up circular clipping path for the sun
        ctx.save();
        ctx.beginPath();
        ctx.arc(celestialBodies.sun.x, celestialBodies.sun.y, celestialBodies.sun.radius, 0, Math.PI * 2);
        ctx.clip();

        // Define gradient colors for bands (yellow -> orange -> red -> pink)
        const bandColors = [
            { r: 255, g: 255, b: 0 }, // Yellow
            { r: 255, g: 220, b: 0 }, // Light orange
            { r: 255, g: 180, b: 0 }, // Orange
            { r: 255, g: 140, b: 0 }, // Deep orange
            { r: 255, g: 100, b: 0 }, // Orange-red
            { r: 255, g: 60, b: 0 }, // Red-orange
            { r: 255, g: 30, b: 30 }, // Red
            { r: 255, g: 0, b: 80 }, // Red-pink
            { r: 255, g: 0, b: 120 }, // Pink
            { r: 255, g: 0, b: 160 } // Deep pink
        ];

        // Draw simple horizontal rectangles - clipping handles the circle shape!
        const numBands = 20;
        const bandHeight = (sun.radius * 2) / numBands;
        const startY = sun.y - sun.radius;

        ctx.globalAlpha = opacity * 0.9;

        for (let i = 0; i < numBands; i++) {
            const bandTopY = startY + i * bandHeight;

            // Calculate color for this band
            const progress = i / (numBands - 1);
            const colorIndex = progress * (bandColors.length - 1);
            const colorIndexFloor = Math.floor(colorIndex);
            const colorIndexCeil = Math.min(Math.ceil(colorIndex), bandColors.length - 1);
            const colorBlend = colorIndex - colorIndexFloor;

            const color1 = bandColors[colorIndexFloor];
            const color2 = bandColors[colorIndexCeil];

            const r = Math.round(color1.r + (color2.r - color1.r) * colorBlend);
            const g = Math.round(color1.g + (color2.g - color1.g) * colorBlend);
            const b = Math.round(color1.b + (color2.b - color1.b) * colorBlend);

            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;

            // Just draw a full-width rectangle - clipping does the rest!
            ctx.fillRect(
                celestialBodies.sun.x - celestialBodies.sun.radius,
                bandTopY,
                celestialBodies.sun.radius * 2,
                bandHeight
            );
        }

        // Draw dark separator lines between bands
        ctx.globalAlpha = opacity * 0.3;
        ctx.strokeStyle = "#220022";
        ctx.lineWidth = 1.5;

        for (let i = 1; i < numBands; i++) {
            const lineY = startY + i * bandHeight;
            ctx.beginPath();
            ctx.moveTo(celestialBodies.sun.x - celestialBodies.sun.radius, lineY);
            ctx.lineTo(celestialBodies.sun.x + celestialBodies.sun.radius, lineY);
            ctx.stroke();
        }

        // Restore to remove clipping
        ctx.restore();

        // Add pulsing rim glow
        const pulseIntensity = Math.sin(celestialBodies.pulsePhase) * 0.3 + 0.7;
        ctx.globalAlpha = opacity * pulseIntensity * 0.5;
        ctx.strokeStyle = "#ff00ff";
        ctx.lineWidth = 2;
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#ff00ff";
        ctx.beginPath();
        ctx.arc(celestialBodies.sun.x, celestialBodies.sun.y, celestialBodies.sun.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }

    /**
     * Draw moon for night cycle
     */
    drawMoon(ctx, opacity) {
        const celestialBodies = this.visuals.sun;
        if (!celestialBodies || !celestialBodies.moon) {
            return;
        }
        const moon = celestialBodies.moon;
        ctx.save();

        // Create radial gradient for glow
        const glowRadius = celestialBodies.moon.radius * 1.5;
        const glowGradient = ctx.createRadialGradient(moon.x, moon.y, moon.radius * 0.5, moon.x, moon.y, glowRadius);
        glowGradient.addColorStop(0, "rgba(200, 200, 255, 0.3)");
        glowGradient.addColorStop(0.5, "rgba(150, 150, 255, 0.2)");
        glowGradient.addColorStop(1, "rgba(100, 100, 255, 0)");

        // Draw glow
        ctx.globalAlpha = opacity * 0.5;
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(moon.x, moon.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Draw main moon circle with subtle gradient
        const moonGradient = ctx.createRadialGradient(
            celestialBodies.moon.x - celestialBodies.moon.radius * 0.3,
            celestialBodies.moon.y - celestialBodies.moon.radius * 0.3,
            celestialBodies.moon.radius * 0.2,
            celestialBodies.moon.x,
            celestialBodies.moon.y,
            celestialBodies.moon.radius
        );
        moonGradient.addColorStop(0, "#ffffff"); // Bright center
        moonGradient.addColorStop(0.5, "#ddddff"); // Slight blue tint
        moonGradient.addColorStop(1, "#aaaacc"); // Darker edge

        ctx.globalAlpha = opacity * 0.85;
        ctx.fillStyle = moonGradient;
        ctx.beginPath();
        ctx.arc(moon.x, moon.y, moon.radius, 0, Math.PI * 2);
        ctx.fill();

        // Add some crater details
        ctx.globalAlpha = opacity * 0.15;
        ctx.fillStyle = "#8888aa";

        // Draw a few simple craters
        const craters = [
            { x: 0.3, y: -0.2, r: 0.25 },
            { x: -0.4, y: 0.1, r: 0.2 },
            { x: 0.1, y: 0.4, r: 0.18 },
            { x: -0.2, y: -0.4, r: 0.15 }
        ];

        craters.forEach((crater) => {
            ctx.beginPath();
            ctx.arc(
                celestialBodies.moon.x + crater.x * celestialBodies.moon.radius,
                celestialBodies.moon.y + crater.y * celestialBodies.moon.radius,
                crater.r * celestialBodies.moon.radius,
                0,
                Math.PI * 2
            );
            ctx.fill();
        });

        // Add pulsing cyan rim glow for neon effect
        const pulseIntensity = Math.sin(celestialBodies.pulsePhase) * 0.3 + 0.7;
        ctx.globalAlpha = opacity * pulseIntensity * 0.4;
        ctx.strokeStyle = "#00ffff";
        ctx.lineWidth = 2;
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#00ffff";
        ctx.beginPath();
        ctx.arc(celestialBodies.moon.x, celestialBodies.moon.y, celestialBodies.moon.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }

    /**
     * Project 3D mountain vertex to 2D screen space
     */
    projectMountainVertex(vertex, grid) {
        const vanishingX = grid.vanishingPointX;
        const horizonY = grid.horizonY;

        // Perspective scale based on Z depth
        const perspectiveScale = 300 / (300 + vertex.z);

        // Project X with perspective convergence to vanishing point
        const projectedX = vanishingX + (vertex.x - vanishingX) * perspectiveScale;

        // Project Y - heights rise above horizon, scale with perspective
        const projectedY = horizonY - vertex.y * perspectiveScale;

        return {
            x: projectedX,
            y: projectedY,
            z: vertex.z // Keep Z for sorting
        };
    }

    /**
     * Draw grid-based mountains with proper depth and filled triangles
     */
    drawGridBasedMountains(ctx, opacity) {
        const mountains = this.visuals.mountains;
        const grid = this.visuals.perspectiveGrid;
        const colors = this.background.colors;
        const mountainColor = this.getDynamicMountainColor(colors);

        ctx.save();

        // Project all vertices to 2D
        const projectedVerts = mountains.vertices.map((v) => this.projectMountainVertex(v, grid));

        // Sort triangles back to front (painter's algorithm)
        const sortedTriangles = [...mountains.triangles].sort((a, b) => b.avgZ - a.avgZ);

        // Draw each triangle
        sortedTriangles.forEach((triangle) => {
            const v0 = projectedVerts[triangle.indices[0]];
            const v1 = projectedVerts[triangle.indices[1]];
            const v2 = projectedVerts[triangle.indices[2]];

            // Fill triangle with solid dark color - ALWAYS fully opaque
            ctx.globalAlpha = 1.0; // Force full opacity for fills
            ctx.fillStyle = "rgb(0, 0, 20)";
            ctx.beginPath();
            ctx.moveTo(v0.x, v0.y);
            ctx.lineTo(v1.x, v1.y);
            ctx.lineTo(v2.x, v2.y);
            ctx.closePath();
            ctx.fill();

            // Draw triangle outline with theme opacity
            ctx.globalAlpha = opacity * 0.6;
            ctx.strokeStyle = mountainColor;
            ctx.lineWidth = 1;
            ctx.stroke();
        });

        ctx.restore();
    }

    /**
     * Calculate dynamic mountain color based on celestial body positions
     */
    getDynamicMountainColor(colors) {
        const celestialBodies = this.visuals.sun;

        // Get screen positions of sun and moon (handle wrapping smoothly)
        const sunScreenX = this.getSmoothScreenPosition(celestialBodies.sun.x);
        const moonScreenX = this.getSmoothScreenPosition(celestialBodies.moon.x);

        // Calculate influence (same as horizon but with different weights for mountains)
        const sunInfluence = Math.max(0, 1 - Math.abs(sunScreenX - 0.5) * 2.5); // Mountains respond more to sun
        const moonInfluence = Math.max(0, 1 - Math.abs(moonScreenX - 0.5) * 2.5);

        // Normalize influences
        const totalInfluence = sunInfluence + moonInfluence;
        const sunWeight = totalInfluence > 0 ? sunInfluence / totalInfluence : 0.5;
        const moonWeight = totalInfluence > 0 ? moonInfluence / totalInfluence : 0.5;

        // Define color targets for mountains
        const dayColor = colors[0]; // Cyan (day)
        const nightColor = "#8800ff"; // Purple (night)

        // Interpolate between day and night colors
        return this.interpolateColor(dayColor, nightColor, moonWeight);
    }

    /**
     * Draw filled 3D objects with wireframe outlines
     */
    drawWireframe3D(ctx, opacity) {
        this.visuals.wireframe3D.forEach((obj) => {
            const shape = this.generate3DShape(obj.type, obj.size);

            ctx.save();

            // Rotate and project vertices
            const projectedVertices = shape.vertices.map((vertex) => {
                const rotated = this.rotate3D(vertex, obj.rotationX, obj.rotationY, obj.rotationZ);
                const projected = this.project3D(rotated, obj.x, obj.y, 400);
                return { ...projected, z3d: rotated[2] }; // Keep 3D z for depth sorting
            });

            // Draw filled faces if they exist
            if (shape.faces) {
                // Calculate average Z depth for each face and sort back-to-front
                const facesWithDepth = shape.faces
                    .map((face) => {
                        const avgZ = face.reduce((sum, idx) => sum + projectedVertices[idx].z3d, 0) / face.length;
                        return { face, avgZ };
                    })
                    .sort((a, b) => a.avgZ - b.avgZ); // Sort back to front (lower Z = further)

                // Draw each face
                facesWithDepth.forEach(({ face }) => {
                    // Convert hex color to RGB if needed
                    let fillColor = obj.color;
                    if (fillColor.startsWith("#")) {
                        // Convert hex to RGB format to ensure proper alpha handling
                        const hex = fillColor.replace("#", "");
                        if (hex.length === 6) {
                            const r = parseInt(hex.substr(0, 2), 16);
                            const g = parseInt(hex.substr(2, 2), 16);
                            const b = parseInt(hex.substr(4, 2), 16);
                            fillColor = `rgb(${r}, ${g}, ${b})`;
                        }
                    }

                    ctx.globalAlpha = obj.opacity * opacity * 0.6;
                    ctx.fillStyle = fillColor;

                    ctx.beginPath();
                    ctx.moveTo(projectedVertices[face[0]].x, projectedVertices[face[0]].y);
                    for (let i = 1; i < face.length; i++) {
                        ctx.lineTo(projectedVertices[face[i]].x, projectedVertices[face[i]].y);
                    }
                    ctx.closePath();
                    ctx.fill();
                });
            }

            // Draw edges on top for wireframe effect
            ctx.globalAlpha = obj.opacity * opacity;
            ctx.strokeStyle = obj.color;
            ctx.lineWidth = 1.5;

            shape.edges.forEach((edge) => {
                const v1 = projectedVertices[edge[0]];
                const v2 = projectedVertices[edge[1]];

                if (v1 && v2) {
                    ctx.beginPath();
                    ctx.moveTo(v1.x, v1.y);
                    ctx.lineTo(v2.x, v2.y);
                    ctx.stroke();
                }
            });

            ctx.restore();
        });
    }

    /**
     * Draw floating geometry for neon city theme
     */
    drawFloatingGeometry(ctx, opacity) {
        this.visuals.geometricShapes.forEach((shape) => {
            ctx.save();
            ctx.translate(shape.x, shape.y);
            ctx.rotate(shape.rotation);
            ctx.globalAlpha = shape.opacity * opacity;

            const gradient = ctx.createLinearGradient(-shape.size, -shape.size, shape.size, shape.size);
            gradient.addColorStop(0, this.background.colors[0]);
            gradient.addColorStop(1, this.background.colors[1] || this.background.colors[0]);

            ctx.strokeStyle = gradient;
            ctx.lineWidth = 2;
            ctx.beginPath();

            if (shape.type === "square") {
                ctx.rect(-shape.size / 2, -shape.size / 2, shape.size, shape.size);
            } else {
                ctx.moveTo(0, -shape.size / 2);
                ctx.lineTo(shape.size / 2, shape.size / 2);
                ctx.lineTo(-shape.size / 2, shape.size / 2);
                ctx.closePath();
            }
            ctx.stroke();
            ctx.restore();
        });
    }
}

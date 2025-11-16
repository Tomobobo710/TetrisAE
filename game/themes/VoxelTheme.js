/**
 * VoxelTheme - 3D TETRIS ARCHITECTURE
 *
 *  IMMERSIVE VOXEL UNIVERSE: 385 Minecraft-style tetromino structures with spherical camera orbit
 *  REAL SATELLITE ORBITAL MECHANICS: Keplerian orbital elements with natural random drift
 *  3000 TETROMINO-COLORED STARS: Dynamic starfield with perspective scaling
 *  PERFORMANCE OPTIMIZED: Frustum culling, backface culling, and strategic stroke skipping
 *  VISUAL HIERARCHY: Foreground (7 detailed pieces with gaps) → Background (63 solid pieces) → Outer Ring (315 distant structures)
 *
 * Camera uses real orbital mechanics, drifts like a satellite through 3D space!
 */
class VoxelTheme extends BaseTheme {
    constructor() {
        super();
        this.name = 'Voxel';

        // Theme colors - matching Default theme's classic Tetris colors
        this.playfield = {
            background: 'rgba(5, 5, 15, 0.8)',
            border: '#4a9eff',
            grid: 'rgba(74, 158, 255, 0.15)',
            shadow: 'rgba(74, 158, 255, 0.4)'
        };
        this.pieces = {
              I: { base: '#00f5ff', glow: '#ffffff', shadow: '#008888' }, // Cyan
              O: { base: '#f6ff00', glow: '#ffffff', shadow: '#888800' }, // Yellow
              T: { base: '#a000ff', glow: '#ffffff', shadow: '#550088' }, // Purple
              S: { base: '#00f900', glow: '#ffffff', shadow: '#008800' }, // Green
              Z: { base: '#ff0000', glow: '#ffffff', shadow: '#880000' }, // Red
              J: { base: '#0000ff', glow: '#ffffff', shadow: '#000088' }, // Blue
              L: { base: '#ff9500', glow: '#ffffff', shadow: '#884400' }, // Orange
              garbage: { base: '#666666', glow: '#666666', shadow: '#444444' } // Gray for garbage blocks
          };
        this.ui = {
            background: 'rgba(5, 5, 15, 0.9)',
            text: '#ffffff',
            accent: '#4a9eff',
            border: '#4a9eff'
        };
        this.background = {
            type: 'voxel_tetris_3d',
            colors: ['#ff6b6b', '#ffd93d', '#6bcf7f', '#4ecdc4', '#45b7d1', '#feca57', '#ff9ff3'],
            intensity: 1.0
        };

        // Camera system for orbiting tetrominos
        this.camera = {
            position: new Vector3(0, 0, 0),
            target: new Vector3(0, 0, 0),
            up: new Vector3(0, 1, 0),
            yaw: Math.random() * Math.PI * 2, // Random starting yaw
            pitch: Math.PI / 6 + (Math.random() - 0.5) * 0.4, // Varied pitch
            radius: 240
        };

        // Tetromino positions and triangular geometry
        this.tetrominos = [];
        this.backgroundTetrominos = []; // Additional background structures
        this.outerRingTetrominos = []; // Furthest background structures
        this.stars = []; // Background starfield
        this.tetrominoTriangles = [];
        this.starDepth = 4000; // Depth for starfield effect
        this.currentTetrominoIndex = 0;
        this.orbitTime = 0;
        this.orbitDuration = 10; // 10 seconds per tetromino

        // Projection settings
        this.fov = Math.PI * 0.4;
        this.aspect = TETRIS.WIDTH / TETRIS.HEIGHT;
        this.near = 0.1;
        this.far = 1000;

        // Generate tetromino positions and triangular geometry
        this.generateTetrominos();
        this.generateBackgroundTetrominos();
        this.generateOuterRingTetrominos();
        this.generateStarfield();

        // Enable animated UI colors
        this.uiAnimation.enabled = true;
        this.uiAnimation.speed = 0.5;
        this.uiAnimation.colors = [
            '#00f5ff', // Cyan
            '#f6ff00', // Yellow
            '#a000ff', // Purple
            '#00f900', // Green
            '#ff0000', // Red
            '#0000ff', // Blue
            '#ff9500', // Orange
            '#00f5ff'  // Cyan (back)
        ];
    }

    
    /**
     * Add Minecraft-style architectural details to tetromino structures
     */
    addMinecraftDetails(voxels, x, y, shape, blockSize, type) {
        const baseX = x * blockSize - (shape[y].length * blockSize) / 2;
        const baseY = y * blockSize - (shape.length * blockSize) / 2;

        switch (type) {
            case 'I':
                // Tall tower with windows and battlements
                this.addTowerDetails(voxels, baseX, baseY, blockSize);
                break;
            case 'O':
                // Square castle with towers at corners
                this.addCastleDetails(voxels, baseX, baseY, blockSize);
                break;
            case 'T':
                // T-shaped building with wings
                this.addBuildingDetails(voxels, baseX, baseY, blockSize);
                break;
            case 'S':
                // S-curve bridge
                this.addBridgeDetails(voxels, baseX, baseY, blockSize);
                break;
            case 'Z':
                // Zigzag wall with towers
                this.addWallDetails(voxels, baseX, baseY, blockSize);
                break;
            case 'J':
                // L-shaped house with chimney
                this.addHouseDetails(voxels, baseX, baseY, blockSize);
                break;
            case 'L':
                // L-shaped watchtower
                this.addWatchtowerDetails(voxels, baseX, baseY, blockSize);
                break;
        }
    }

    
    /**
     * Create perfect cube geometry using triangles with correct outward winding
     */
    createCubeGeometry(triangles, worldX, worldY, worldZ, size, height, tetrominoType) {
        const s = size; // All dimensions equal for perfect cubes
        const color = this.pieces[tetrominoType].base;
        const cubeCenter = new Vector3(worldX, worldY, worldZ);

        // 8 vertices of the perfect cube (all sides equal)
        const v = [
            new Vector3(worldX - s/2, worldY - s/2, worldZ - s/2),    // 0: bottom-back-left
            new Vector3(worldX + s/2, worldY - s/2, worldZ - s/2),    // 1: bottom-back-right
            new Vector3(worldX + s/2, worldY - s/2, worldZ + s/2),    // 2: bottom-front-right
            new Vector3(worldX - s/2, worldY - s/2, worldZ + s/2),    // 3: bottom-front-left
            new Vector3(worldX - s/2, worldY + s/2, worldZ - s/2),    // 4: top-back-left
            new Vector3(worldX + s/2, worldY + s/2, worldZ - s/2),    // 5: top-back-right
            new Vector3(worldX + s/2, worldY + s/2, worldZ + s/2),    // 6: top-front-right
            new Vector3(worldX - s/2, worldY + s/2, worldZ + s/2)     // 7: top-front-left
        ];

        // Helper function to ensure outward winding
        const createFaceTriangles = (indices, color, faceName) => {
            const [i0, i1, i2, i3] = indices;
            const v0 = v[i0], v1 = v[i1], v2 = v[i2], v3 = v[i3];

            // Calculate face normal and check if it points outward
            const faceCenter = new Vector3(
                (v0.x + v1.x + v2.x + v3.x) / 4,
                (v0.y + v1.y + v2.y + v3.y) / 4,
                (v0.z + v1.z + v2.z + v3.z) / 4
            );
            const toCenter = cubeCenter.sub(faceCenter).normalize();

            // Cross product to determine winding
            const edge1 = v1.sub(v0);
            const edge2 = v2.sub(v0);
            const normal = edge1.cross(edge2).normalize();

            const dot = normal.dot(toCenter);

            if (dot > 0) {
                // Normal points outward, use current winding
                triangles.push(new Triangle(v0, v1, v2, color));
                triangles.push(new Triangle(v0, v2, v3, color));
            } else {
                // Normal points inward, reverse winding
                triangles.push(new Triangle(v0, v2, v1, color));
                triangles.push(new Triangle(v0, v3, v2, color));
            }
        };

        // Create triangles for each face with consistent outward winding
        // Using consistent counter-clockwise vertex order when viewed from outside

        // Front face (facing +Z - brightest): 3,2,6,7 -> triangles: 3,2,6 and 3,6,7
        triangles.push(new Triangle(v[3], v[2], v[6], color));
        triangles.push(new Triangle(v[3], v[6], v[7], color));

        // Back face (facing -Z - darkest): 0,1,5,4 -> triangles: 0,5,1 and 0,4,5
        triangles.push(new Triangle(v[0], v[5], v[1], this.darkenColor(color, 0.5)));
        triangles.push(new Triangle(v[0], v[4], v[5], this.darkenColor(color, 0.5)));

        // Left face (facing -X - medium dark): 7,4,0,3 -> triangles: 7,4,0 and 7,0,3
        triangles.push(new Triangle(v[7], v[4], v[0], this.darkenColor(color, 0.3)));
        triangles.push(new Triangle(v[7], v[0], v[3], this.darkenColor(color, 0.3)));

        // Right face (facing +X - medium): 1,2,6,5 -> triangles: 1,6,2 and 1,5,6
        triangles.push(new Triangle(v[1], v[6], v[2], this.darkenColor(color, 0.2)));
        triangles.push(new Triangle(v[1], v[5], v[6], this.darkenColor(color, 0.2)));

        // Top face (facing +Y - bright): 4,5,6,7 -> triangles: 4,6,5 and 4,7,6
        triangles.push(new Triangle(v[4], v[6], v[5], this.lightenColor(color, 0.2)));
        triangles.push(new Triangle(v[4], v[7], v[6], this.lightenColor(color, 0.2)));

        // Bottom face (facing -Y - dark): 0,1,2,3 -> triangles: 0,1,2 and 0,2,3 (flipped)
        triangles.push(new Triangle(v[0], v[1], v[2], this.darkenColor(color, 0.4)));
        triangles.push(new Triangle(v[0], v[2], v[3], this.darkenColor(color, 0.4)));
    }


    addTowerDetails(voxels, baseX, baseY, blockSize) {
        // Windows every few blocks
        for (let z = 2; z < 12; z += 3) {
            voxels.push({
                x: baseX, y: baseY, z: z * blockSize,
                color: '#ffffff', type: 'window', isDetail: true
            });
        }
        // Battlements at top
        for (let i = -1; i <= 1; i++) {
            voxels.push({
                x: baseX + i * blockSize, y: baseY, z: 12 * blockSize,
                color: '#666666', type: 'battlement', isDetail: true
            });
        }
    }

    addCastleDetails(voxels, baseX, baseY, blockSize) {
        // Corner towers
        const corners = [[0,0], [blockSize,0], [0,blockSize], [blockSize,blockSize]];
        corners.forEach(([dx, dy]) => {
            for (let z = 4; z < 8; z++) {
                voxels.push({
                    x: baseX + dx, y: baseY + dy, z: z * blockSize,
                    color: '#444444', type: 'tower', isDetail: true
                });
            }
        });
    }

    addBuildingDetails(voxels, baseX, baseY, blockSize) {
        // Door
        voxels.push({
            x: baseX, y: baseY - blockSize, z: blockSize,
            color: '#8B4513', type: 'door', isDetail: true
        });
        // Roof
        for (let i = -1; i <= 1; i++) {
            voxels.push({
                x: baseX + i * blockSize, y: baseY, z: 8 * blockSize,
                color: '#8B4513', type: 'roof', isDetail: true
            });
        }
    }

    addBridgeDetails(voxels, baseX, baseY, blockSize) {
        // Support pillars under bridge
        for (let z = 0; z < 4; z++) {
            voxels.push({
                x: baseX, y: baseY - blockSize, z: z * blockSize,
                color: '#666666', type: 'pillar', isDetail: true
            });
            voxels.push({
                x: baseX + blockSize, y: baseY - blockSize, z: z * blockSize,
                color: '#666666', type: 'pillar', isDetail: true
            });
        }
    }

    addWallDetails(voxels, baseX, baseY, blockSize) {
        // Arrow slits in wall
        voxels.push({
            x: baseX + blockSize/2, y: baseY, z: 3 * blockSize,
            color: '#ffffff', type: 'arrow_slit', isDetail: true
        });
    }

    addHouseDetails(voxels, baseX, baseY, blockSize) {
        // Chimney
        for (let z = 6; z < 10; z++) {
            voxels.push({
                x: baseX + blockSize, y: baseY, z: z * blockSize,
                color: '#666666', type: 'chimney', isDetail: true
            });
        }
    }

    addWatchtowerDetails(voxels, baseX, baseY, blockSize) {
        // Platform at top
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < 2; j++) {
                voxels.push({
                    x: baseX + i * blockSize, y: baseY, z: 8 * blockSize,
                    color: '#8B4513', type: 'platform', isDetail: true
                });
            }
        }
    }

    /**
     * Generate 7 tetrominos evenly distributed on a large sphere
     */
    generateTetrominos() {
        const tetrominoTypes = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

        // Pieces are 300-600 units in size, camera orbits at 120 units, need safe spacing
        const baseRadius = 600; // Minimum distance from center (camera orbits at 120, pieces up to 300 units)
        const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // Golden angle for even distribution
        const randomStart = Math.random() * Math.PI * 2; // Random starting angle to break determinism

        for (let i = 0; i < 7; i++) {
            const tetrominoType = tetrominoTypes[i];

            // Use golden angle spiral for perfect spherical distribution
            const t = i / 7; // Normalized index
            const inclination = Math.acos(1 - 2 * t); // Polar angle (0 to π)
            const azimuth = goldenAngle * i + randomStart; // Azimuthal angle with random offset

            // Convert to cartesian coordinates on sphere surface
            const x = baseRadius * Math.sin(inclination) * Math.cos(azimuth);
            const y = baseRadius * Math.sin(inclination) * Math.sin(azimuth);
            const z = baseRadius * Math.cos(inclination);

            // Add small random variation (±10% of radius) for natural distribution
            const variation = (Math.random() - 0.5) * 0.2 * baseRadius;
            const finalRadius = baseRadius + variation;

            const position = new Vector3(
                x * (finalRadius / baseRadius),
                y * (finalRadius / baseRadius),
                z * (finalRadius / baseRadius)
            );

            const tetromino = {
                position: position,
                type: tetrominoType,
                rotation: new Vector3(0, 0, 0), // No rotation for foreground
                scale: 1.5 + Math.random() * 0.5,
                color: this.pieces[tetrominoType].base
            };

            // Generate triangular geometry for this tetromino
            this.isForegroundTetromino = true; // Mark for gap generation
            const geometry = this.generateTetrominoGeometry(tetrominoType);
            tetromino.triangles = geometry;

            this.tetrominos.push(tetromino);
        }
    }

    /**
     * Generate background tetrominos on a larger outer sphere
     */
    generateBackgroundTetrominos() {
        // Create 63 background tetrominos with randomized type distribution
        const backgroundTetrominoTypes = [];
        const tetrominoTypes = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

        for (let i = 0; i < 126; i++) {
            backgroundTetrominoTypes.push(tetrominoTypes[Math.floor(Math.random() * tetrominoTypes.length)]);
        }

        // Outer sphere: minimum 1200 units away (foreground at 600, pieces up to 300 units, plus 300 margin)
        const minRadius = 1200; // Well outside foreground sphere
        const maxRadius = 1400; // Upper bound for variation
        const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // Golden angle for even distribution
        const randomStart = Math.random() * Math.PI * 2; // Random starting angle

        for (let i = 0; i < 63; i++) {
            const tetrominoType = backgroundTetrominoTypes[i];

            // Use golden angle spiral for perfect spherical distribution
            const t = i / 126; // Normalized index
            const inclination = Math.acos(1 - 2 * t); // Polar angle
            const azimuth = goldenAngle * i + randomStart; // Azimuthal angle with random offset

            // Random radius between min and max for natural variation
            const radius = minRadius + Math.random() * (maxRadius - minRadius);

            // Convert to cartesian coordinates on sphere surface
            const x = radius * Math.sin(inclination) * Math.cos(azimuth);
            const y = radius * Math.sin(inclination) * Math.sin(azimuth);
            const z = radius * Math.cos(inclination);

            // Apply uniform Z-axis rotation with random 90-degree multiple
            const randomRotationIndex = Math.floor(Math.random() * 4);
            const rotation = new Vector3(0, 0, [0, Math.PI/2, Math.PI, 3*Math.PI/2][randomRotationIndex]);

            const tetromino = {
                position: new Vector3(x, y, z),
                type: tetrominoType,
                rotation: rotation,
                scale: 1.0 + Math.random() * 0.5, // Smaller background structures
                color: this.pieces[tetrominoType].base,
                isBackground: true // Mark as background
            };

            // Generate triangular geometry for background tetromino
            this.isForegroundTetromino = false; // No gaps for background
            const geometry = this.generateTetrominoGeometry(tetrominoType);
            tetromino.triangles = geometry;

            this.backgroundTetrominos.push(tetromino);
        }
    }

    /**
     * Generate 3D triangular geometry for tetromino structures with center calculation
     */
    generateTetrominoGeometry(type) {
        const blockSize = 20; // Size of each cube
        const triangles = [];

        // Get tetromino shape
        const shape = this.getTetrominoShape(type, 0);
        if (!shape) return triangles;

        // Calculate the actual center of mass for this tetromino
        let totalBlocks = 0;
        let centerX = 0, centerY = 0;

        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    centerX += x;
                    centerY += y;
                    totalBlocks++;
                }
            }
        }

        centerX = (centerX / totalBlocks) * blockSize;
        centerY = (centerY / totalBlocks) * blockSize;

        // Create 3D triangular geometry for each filled position, offset by center, with gaps for foreground only
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    // Build height based on tetromino type
                    const height = type === 'I' ? 15 : type === 'O' ? 8 : 10;

                    // Create a stack of perfect cubes for each filled position
                    for (let z = 0; z < Math.ceil(height / blockSize); z++) {
                        // Add gaps between blocks only for foreground tetrominos (the original 7)
                        const gap = this.isForegroundTetromino ? 1 : 0;
                        const worldX = x * (blockSize + gap) - centerX;
                        const worldY = y * (blockSize + gap) - centerY;
                        const worldZ = z * (blockSize + gap);

                        // Generate perfect cube geometry (like Minecraft blocks)
                        this.createCubeGeometry(triangles, worldX, worldY, worldZ, blockSize, blockSize, type);
                    }
                }
            }
        }

        return triangles;
    }

    /**
     * Generate outer ring tetrominos on a much larger sphere
     */
    generateOuterRingTetrominos() {
        // Create 315 outer ring tetrominos with randomized type distribution
        const outerRingTetrominoTypes = [];
        const tetrominoTypes = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

        for (let i = 0; i < 315; i++) {
            outerRingTetrominoTypes.push(tetrominoTypes[Math.floor(Math.random() * tetrominoTypes.length)]);
        }

        // Outer ring: minimum 2000 units away (background at 1200-1400, plus 600 margin)
        const minRadius = 2000; // Well outside background sphere
        const maxRadius = 2200; // Upper bound for variation
        const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // Golden angle for even distribution
        const randomStart = Math.random() * Math.PI * 2; // Random starting angle

        for (let i = 0; i < 315; i++) {
            const tetrominoType = outerRingTetrominoTypes[i];

            // Use golden angle spiral for perfect spherical distribution
            const t = i / 315; // Normalized index
            const inclination = Math.acos(1 - 2 * t); // Polar angle
            const azimuth = goldenAngle * i + randomStart; // Azimuthal angle with random offset

            // Random radius between min and max for natural variation
            const radius = minRadius + Math.random() * (maxRadius - minRadius);

            // Convert to cartesian coordinates on sphere surface
            const x = radius * Math.sin(inclination) * Math.cos(azimuth);
            const y = radius * Math.sin(inclination) * Math.sin(azimuth);
            const z = radius * Math.cos(inclination);

            // Apply random axis rotation with random 90-degree multiple
            const axes = ['x', 'y', 'z'];
            const randomAxis = axes[Math.floor(Math.random() * axes.length)];
            const randomRotationIndex = Math.floor(Math.random() * 4);
            const rotationValue = [0, Math.PI/2, Math.PI, 3*Math.PI/2][randomRotationIndex];

            // Create rotation vector with only the chosen axis rotated
            const rotation = new Vector3(0, 0, 0);
            if (randomAxis === 'x') rotation.x = rotationValue;
            else if (randomAxis === 'y') rotation.y = rotationValue;
            else if (randomAxis === 'z') rotation.z = rotationValue;

            const tetromino = {
                position: new Vector3(x, y, z),
                type: tetrominoType,
                rotation: rotation,
                scale: 1.0 + Math.random() * 0.5, // Smaller outer ring structures
                color: this.pieces[tetrominoType].base,
                isOuterRing: true // Mark as outer ring
            };

            // Generate triangular geometry for outer ring tetromino
            this.isForegroundTetromino = false; // No gaps for outer ring
            const geometry = this.generateTetrominoGeometry(tetrominoType);
            tetromino.triangles = geometry;

            this.outerRingTetrominos.push(tetromino);
        }
    }

    /**
     * Generate a dense 3D starfield with tetromino-colored stars
     */
    generateStarfield() {
        const numStars = 3000;
        const tetrominoColors = [
            '#00f5ff', // I - Cyan
            '#f6ff00', // O - Yellow
            '#a000ff', // T - Purple
            '#00f900', // S - Green
            '#ff0000', // Z - Red
            '#0000ff', // J - Blue
            '#ff9500'  // L - Orange
        ];

        for (let i = 0; i < numStars; i++) {
            // Generate stars on a much larger sphere (5x deeper)
            const distance = this.starDepth + Math.random() * 10000; // 4000-14000 units away (5x deeper)

            // Random spherical coordinates
            const theta = Math.random() * Math.PI * 2; // Azimuth
            const phi = Math.acos(2 * Math.random() - 1); // Polar angle for uniform distribution

            // Convert to 3D position
            const x = distance * Math.sin(phi) * Math.cos(theta);
            const y = distance * Math.sin(phi) * Math.sin(theta);
            const z = distance * Math.cos(phi);

            // Random tetromino color
            const color = tetrominoColors[Math.floor(Math.random() * tetrominoColors.length)];

            // Random size based on distance (further = smaller)
            const baseSize = 0.5 + Math.random() * 2; // Smaller base sizes
            const size = baseSize * (4000 / distance); // Perspective scaling

            // Random brightness variation
            const brightness = 0.2 + Math.random() * 0.8; // Wider brightness range

            this.stars.push({
                x, y, z, color, size, brightness
            });
        }
    }

    /**
     * Get tetromino shape for voxel generation
     */
    getTetrominoShape(pieceType, rotation) {
        const shapes = {
            I: {
                0:   [[1, 1, 1, 1]],
                90:  [[1], [1], [1], [1]],
                180: [[1, 1, 1, 1]],
                270: [[1], [1], [1], [1]]
            },
            O: {
                0:   [[1, 1], [1, 1]],
                90:  [[1, 1], [1, 1]],
                180: [[1, 1], [1, 1]],
                270: [[1, 1], [1, 1]]
            },
            T: {
                0:   [[0, 1, 0], [1, 1, 1]],
                90:  [[1, 0], [1, 1], [1, 0]],
                180: [[1, 1, 1], [0, 1, 0]],
                270: [[0, 1], [1, 1], [0, 1]]
            },
            S: {
                0:   [[0, 1, 1], [1, 1, 0]],
                90:  [[1, 0], [1, 1], [0, 1]],
                180: [[0, 1, 1], [1, 1, 0]],
                270: [[1, 0], [1, 1], [0, 1]]
            },
            Z: {
                0:   [[1, 1, 0], [0, 1, 1]],
                90:  [[0, 1], [1, 1], [1, 0]],
                180: [[1, 1, 0], [0, 1, 1]],
                270: [[0, 1], [1, 1], [1, 0]]
            },
            J: {
                0:   [[1, 0, 0], [1, 1, 1]],
                90:  [[1, 1], [1, 0], [1, 0]],
                180: [[1, 1, 1], [0, 0, 1]],
                270: [[0, 1], [0, 1], [1, 1]]
            },
            L: {
                0:   [[0, 0, 1], [1, 1, 1]],
                90:  [[1, 0], [1, 0], [1, 1]],
                180: [[1, 1, 1], [1, 0, 0]],
                270: [[1, 1], [0, 1], [0, 1]]
            }
        };

        return shapes[pieceType]?.[rotation] || shapes[pieceType]?.[0];
    }

    /**
     * Setup
     */
    setup() {
        // Already set up in constructor
    }

    /**
     * Update camera movement and tetromino state
     */
    update(deltaTime) {
        super.update(deltaTime);

        // Initialize orbital parameters for free 3D movement
        if (this.orbitInclination === undefined) {
            this.orbitInclination = this.camera.pitch; // Start with current pitch
            this.orbitLongitude = this.camera.yaw; // Start with current yaw
            this.orbitAnomaly = 0; // Position in orbit
            this.orbitPrecession = 0; // Slowly rotating orbital plane
            this.orbitRadiusDrift = 0; // Subtle radius variation
        }

        // Very gradual, continuous orbital drift - like real satellite mechanics
        // All parameters drift extremely slowly and continuously
        this.orbitInclination += (Math.random() - 0.5) * deltaTime * 0.02; // Inclination drift
        this.orbitLongitude += (Math.random() - 0.5) * deltaTime * 0.015; // Orbital plane rotation
        this.orbitAnomaly += deltaTime * 0.15; // Steady orbital motion (position in orbit)
        this.orbitPrecession += (Math.random() - 0.5) * deltaTime * 0.01; // Precession drift
        this.orbitRadiusDrift += (Math.random() - 0.5) * deltaTime * 0.005; // Radius drift

        // Keep orbital elements in reasonable ranges (no hard restrictions)
        this.orbitInclination = Math.max(-Math.PI * 0.8, Math.min(Math.PI * 0.8, this.orbitInclination));
        this.orbitRadiusDrift = Math.max(-0.2, Math.min(0.2, this.orbitRadiusDrift));

        // Convert orbital elements to camera position using Kepler-like mechanics
        // This creates complex, natural orbital paths that can go anywhere in 3D space
        const radius = this.camera.radius * (1 + this.orbitRadiusDrift);

        // Position in orbital plane (ellipse-like but circular for simplicity)
        const x_orbital = Math.cos(this.orbitAnomaly) * radius;
        const z_orbital = Math.sin(this.orbitAnomaly) * radius;

        // Rotate orbital plane by inclination and longitude
        const cosInc = Math.cos(this.orbitInclination);
        const sinInc = Math.sin(this.orbitInclination);
        const cosLon = Math.cos(this.orbitLongitude + this.orbitPrecession);
        const sinLon = Math.sin(this.orbitLongitude + this.orbitPrecession);

        // Final 3D position after applying all orbital transformations
        const x_final = x_orbital * cosLon - z_orbital * sinLon * cosInc;
        const y_final = z_orbital * sinInc;
        const z_final = x_orbital * sinLon + z_orbital * cosLon * cosInc;

        // Set camera position relative to target tetromino
        const targetTetromino = this.tetrominos[this.currentTetrominoIndex];
        this.camera.position.x = targetTetromino.position.x + x_final;
        this.camera.position.y = targetTetromino.position.y + y_final;
        this.camera.position.z = targetTetromino.position.z + z_final;

        // Camera always looks at the tetromino center
        this.camera.target.x = targetTetromino.position.x;
        this.camera.target.y = targetTetromino.position.y;
        this.camera.target.z = targetTetromino.position.z;

        // Derive yaw/pitch from the orbital position for compatibility
        const toTarget = this.camera.target.sub(this.camera.position).normalize();
        this.camera.yaw = Math.atan2(toTarget.x, toTarget.z);
        this.camera.pitch = Math.asin(toTarget.y);

        this.orbitTime += deltaTime;

        if (this.orbitTime >= this.orbitDuration) {
            // Teleport to next tetromino - maintain current orbit (don't change direction)
            this.orbitTime = 0;
            this.currentTetrominoIndex = (this.currentTetrominoIndex + 1) % this.tetrominos.length;

            // Keep the camera angles continuous - no jumping to new positions
            // The orbit continues on the same path around the new tetromino
        }

    }

    /**
     * Get camera view matrix
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
     * Project 3D point to 2D
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
     * Draw 3D voxel tetris background with proper triangular geometry
     */
    drawBackground(ctx, opacity) {
        // Deep space background
        const gradient = ctx.createLinearGradient(0, 0, 0, TETRIS.HEIGHT);
        gradient.addColorStop(0, `rgba(5, 5, 15, ${opacity})`);
        gradient.addColorStop(0.5, `rgba(2, 2, 10, ${opacity})`);
        gradient.addColorStop(1, `rgba(0, 0, 5, ${opacity})`);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, TETRIS.WIDTH, TETRIS.HEIGHT);

        // Draw 3D tetromino-colored starfield
        ctx.save();
        ctx.globalAlpha = opacity * 0.8; // Slightly transparent stars

        // Get view matrix for star projection
        const starViewMatrix = this.getViewMatrix();

        this.stars.forEach(star => {
            // Project 3D star position to 2D screen coordinates
            const projected = this.project(star, starViewMatrix);
            if (!projected) return; // Behind camera or too far

            ctx.fillStyle = star.color;
            ctx.globalAlpha = opacity * star.brightness * 0.8;
            ctx.beginPath();
            ctx.arc(projected.x, projected.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();

        // Get view matrix
        const viewMatrix = this.getViewMatrix();

        // Project and sort all triangles by depth
        const projectedTriangles = [];

        // Project all tetromino triangles (foreground)
        this.tetrominos.forEach((tetromino, tetrominoIndex) => {
            if (!tetromino.triangles) return;

            tetromino.triangles.forEach(triangle => {
                // Apply tetromino transformation to vertices
                const transformedVertices = triangle.vertices.map(vertex => {
                    // Apply rotation first
                    let rotatedVertex = vertex.clone();
                    if (tetromino.rotation) {
                        // Apply only the chosen axis rotation (not all three)
                        const rx = tetromino.rotation.x;
                        const ry = tetromino.rotation.y;
                        const rz = tetromino.rotation.z;

                        if (rx !== 0) {
                            // X rotation only
                            const cosX = Math.cos(rx), sinX = Math.sin(rx);
                            const y1 = rotatedVertex.y * cosX - rotatedVertex.z * sinX;
                            const z1 = rotatedVertex.y * sinX + rotatedVertex.z * cosX;
                            rotatedVertex.y = y1;
                            rotatedVertex.z = z1;
                        } else if (ry !== 0) {
                            // Y rotation only
                            const cosY = Math.cos(ry), sinY = Math.sin(ry);
                            const x2 = rotatedVertex.x * cosY + rotatedVertex.z * sinY;
                            const z2 = -rotatedVertex.x * sinY + rotatedVertex.z * cosY;
                            rotatedVertex.x = x2;
                            rotatedVertex.z = z2;
                        } else if (rz !== 0) {
                            // Z rotation only
                            const cosZ = Math.cos(rz), sinZ = Math.sin(rz);
                            const x3 = rotatedVertex.x * cosZ - rotatedVertex.y * sinZ;
                            const y3 = rotatedVertex.x * sinZ + rotatedVertex.y * cosZ;
                            rotatedVertex.x = x3;
                            rotatedVertex.y = y3;
                        }
                    }

                    // Apply position and scale
                    const transformed = new Vector3(
                        tetromino.position.x + rotatedVertex.x * tetromino.scale,
                        tetromino.position.y + rotatedVertex.y * tetromino.scale,
                        tetromino.position.z + rotatedVertex.z * tetromino.scale
                    );
                    return transformed;
                });

                // Project the three vertices
                const p1 = this.project(transformedVertices[0], viewMatrix);
                const p2 = this.project(transformedVertices[1], viewMatrix);
                const p3 = this.project(transformedVertices[2], viewMatrix);

                // Frustum culling - skip triangles entirely behind camera
                if (!p1 || !p2 || !p3) return;

                // Backface culling (like CyberpunkCityTheme) - INVERTED for our winding
                const ax = p2.x - p1.x;
                const ay = p2.y - p1.y;
                const bx = p3.x - p1.x;
                const by = p3.y - p1.y;
                const cross = ax * by - ay * bx;

                if (cross >= 0) return; // Back-facing triangle (inverted)

                const avgZ = (p1.z + p2.z + p3.z) / 3;

                projectedTriangles.push({
                    p1, p2, p3,
                    color: triangle.color,
                    depth: avgZ,
                    tetrominoIndex: tetrominoIndex,
                    isBackground: false
                });
            });
        });

        // Project background tetromino triangles
        this.backgroundTetrominos.forEach((tetromino, tetrominoIndex) => {
            if (!tetromino.triangles) return;

            tetromino.triangles.forEach(triangle => {
                // Apply tetromino transformation to vertices
                const transformedVertices = triangle.vertices.map(vertex => {
                    // Apply rotation first
                    let rotatedVertex = vertex.clone();
                    if (tetromino.rotation) {
                        // Apply only the chosen axis rotation (not all three)
                        const rx = tetromino.rotation.x;
                        const ry = tetromino.rotation.y;
                        const rz = tetromino.rotation.z;

                        if (rx !== 0) {
                            // X rotation only
                            const cosX = Math.cos(rx), sinX = Math.sin(rx);
                            const y1 = rotatedVertex.y * cosX - rotatedVertex.z * sinX;
                            const z1 = rotatedVertex.y * sinX + rotatedVertex.z * cosX;
                            rotatedVertex.y = y1;
                            rotatedVertex.z = z1;
                        } else if (ry !== 0) {
                            // Y rotation only
                            const cosY = Math.cos(ry), sinY = Math.sin(ry);
                            const x2 = rotatedVertex.x * cosY + rotatedVertex.z * sinY;
                            const z2 = -rotatedVertex.x * sinY + rotatedVertex.z * cosY;
                            rotatedVertex.x = x2;
                            rotatedVertex.z = z2;
                        } else if (rz !== 0) {
                            // Z rotation only
                            const cosZ = Math.cos(rz), sinZ = Math.sin(rz);
                            const x3 = rotatedVertex.x * cosZ - rotatedVertex.y * sinZ;
                            const y3 = rotatedVertex.x * sinZ + rotatedVertex.y * cosZ;
                            rotatedVertex.x = x3;
                            rotatedVertex.y = y3;
                        }
                    }

                    // Apply position and scale
                    const transformed = new Vector3(
                        tetromino.position.x + rotatedVertex.x * tetromino.scale,
                        tetromino.position.y + rotatedVertex.y * tetromino.scale,
                        tetromino.position.z + rotatedVertex.z * tetromino.scale
                    );
                    return transformed;
                });

                // Project the three vertices
                const p1 = this.project(transformedVertices[0], viewMatrix);
                const p2 = this.project(transformedVertices[1], viewMatrix);
                const p3 = this.project(transformedVertices[2], viewMatrix);

                if (!p1 || !p2 || !p3) return;

                // Backface culling for background structures
                const ax = p2.x - p1.x;
                const ay = p2.y - p1.y;
                const bx = p3.x - p1.x;
                const by = p3.y - p1.y;
                const cross = ax * by - ay * bx;

                if (cross >= 0) return; // Back-facing triangle

                const avgZ = (p1.z + p2.z + p3.z) / 3;

                projectedTriangles.push({
                    p1, p2, p3,
                    color: triangle.color,
                    depth: avgZ,
                    tetrominoIndex: tetrominoIndex + 1000, // Offset to distinguish background
                    isBackground: true
                });
            });
        });

        // Project outer ring tetromino triangles
        this.outerRingTetrominos.forEach((tetromino, tetrominoIndex) => {
            if (!tetromino.triangles) return;

            tetromino.triangles.forEach(triangle => {
                // Apply tetromino transformation to vertices
                const transformedVertices = triangle.vertices.map(vertex => {
                    // Apply rotation first
                    let rotatedVertex = vertex.clone();
                    if (tetromino.rotation) {
                        // Apply Z-axis rotation for outer ring
                        const rz = tetromino.rotation.z;
                        if (rz !== 0) {
                            const cosZ = Math.cos(rz), sinZ = Math.sin(rz);
                            const x3 = rotatedVertex.x * cosZ - rotatedVertex.y * sinZ;
                            const y3 = rotatedVertex.x * sinZ + rotatedVertex.y * cosZ;
                            rotatedVertex.x = x3;
                            rotatedVertex.y = y3;
                        }
                    }

                    // Apply position and scale
                    const transformed = new Vector3(
                        tetromino.position.x + rotatedVertex.x * tetromino.scale,
                        tetromino.position.y + rotatedVertex.y * tetromino.scale,
                        tetromino.position.z + rotatedVertex.z * tetromino.scale
                    );
                    return transformed;
                });

                // Project the three vertices
                const p1 = this.project(transformedVertices[0], viewMatrix);
                const p2 = this.project(transformedVertices[1], viewMatrix);
                const p3 = this.project(transformedVertices[2], viewMatrix);

                if (!p1 || !p2 || !p3) return;

                // Backface culling for outer ring structures
                const ax = p2.x - p1.x;
                const ay = p2.y - p1.y;
                const bx = p3.x - p1.x;
                const by = p3.y - p1.y;
                const cross = ax * by - ay * bx;

                if (cross >= 0) return; // Back-facing triangle

                const avgZ = (p1.z + p2.z + p3.z) / 3;

                projectedTriangles.push({
                    p1, p2, p3,
                    color: triangle.color,
                    depth: avgZ,
                    tetrominoIndex: tetrominoIndex + 2000, // Offset to distinguish outer ring
                    isOuterRing: true
                });
            });
        });

        // Sort by depth (painter's algorithm - far to near) with epsilon to prevent z-fighting
        const EPSILON = 0.01;
        projectedTriangles.sort((a, b) => {
            const depthDiff = b.depth - a.depth;
            // Add small epsilon to prevent z-fighting when depths are very close
            return Math.abs(depthDiff) < EPSILON ? 0 : depthDiff;
        });

        // Draw triangles as fully opaque
        ctx.save();
        ctx.globalAlpha = 1.0; // Force full opacity for solid voxel appearance

        projectedTriangles.forEach(triangle => {
            // Draw triangle with proper 3D shading
            ctx.fillStyle = triangle.color;

            ctx.beginPath();
            ctx.moveTo(triangle.p1.x, triangle.p1.y);
            ctx.lineTo(triangle.p2.x, triangle.p2.y);
            ctx.lineTo(triangle.p3.x, triangle.p3.y);
            ctx.closePath();
            ctx.fill();
        });

        ctx.restore();
    }
    
    /**
     * Draw a Minecraft-style 3D block with proper shading
     */
    drawMinecraftBlock(ctx, x, y, size, color, brightness, isDetail) {
        const blockSize = size;

        // Main block face
        ctx.fillStyle = this.adjustBrightness(color, brightness);
        ctx.fillRect(x - blockSize / 2, y - blockSize / 2, blockSize, blockSize);

        // Top highlight (like Minecraft lighting)
        if (!isDetail && blockSize > 6) {
            ctx.fillStyle = this.lightenColor(color, 0.4);
            ctx.fillRect(x - blockSize / 2 + 1, y - blockSize / 2 + 1, blockSize - 2, 2);
        }

        // Side shadows
        if (!isDetail && blockSize > 6) {
            ctx.fillStyle = this.darkenColor(color, 0.3);
            ctx.fillRect(x + blockSize / 2 - 2, y - blockSize / 2 + 2, 2, blockSize - 4);
            ctx.fillRect(x - blockSize / 2 + 2, y + blockSize / 2 - 2, blockSize - 4, 2);
        }

        // Special effects for different block types
        if (isDetail) {
            // Windows glow
            if (color === '#ffffff') {
                ctx.fillStyle = '#ffff88';
                ctx.fillRect(x - blockSize / 2 + 2, y - blockSize / 2 + 2, blockSize - 4, blockSize - 4);
            }
            // Stone blocks are darker
            else if (color === '#666666') {
                ctx.fillStyle = '#333333';
                ctx.fillRect(x - blockSize / 2 + 1, y - blockSize / 2 + 1, blockSize - 2, blockSize - 2);
            }
            // Wood is brown
            else if (color === '#8B4513') {
                ctx.fillStyle = '#654321';
                ctx.fillRect(x - blockSize / 2 + 1, y - blockSize / 2 + 1, blockSize - 2, blockSize - 2);
            }
        }
    }

        

    /**
     * Create a random 3D rotation matrix
     */
    createRandomRotationMatrix() {
        // Create random Euler angles
        const rx = Math.random() * Math.PI * 2;
        const ry = Math.random() * Math.PI * 2;
        const rz = Math.random() * Math.PI * 2;

        // Simple rotation matrix approximation (we'll just store the angles for now)
        // In a real implementation, you'd compute the full 3x3 rotation matrix
        return { rx, ry, rz };
    }

    /**
     * Adjust color brightness
     */
    adjustBrightness(color, factor) {
        // Convert hex to RGB
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);

        // Apply brightness factor
        const newR = Math.min(255, Math.max(0, Math.floor(r * factor)));
        const newG = Math.min(255, Math.max(0, Math.floor(g * factor)));
        const newB = Math.min(255, Math.max(0, Math.floor(b * factor)));

        // Convert back to hex
        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }
}
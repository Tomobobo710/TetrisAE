/**
 * BoidsTheme - Sophisticated flocking simulation with Tetris pieces!
 * Implements Craig Reynolds' boids algorithm with multiple species
 */
class BoidsTheme extends BaseTheme {
    constructor() {
        super();
        this.name = 'Boids';

        // Theme colors - deep blues/greens for underwater feel
        this.playfield = {
            background: 'rgba(5, 15, 25, 0.95)',
            border: '#00aaff',
            grid: 'rgba(0, 170, 255, 0.12)',
            shadow: 'rgba(0, 170, 255, 0.35)'
        };
        this.pieces = {
             I: { base: '#00ffff', glow: '#88ffff', shadow: '#008888' },
             O: { base: '#00ff88', glow: '#88ffaa', shadow: '#008844' },
             T: { base: '#ff00ff', glow: '#ff88ff', shadow: '#880088' },
             S: { base: '#ffff00', glow: '#ffff88', shadow: '#888800' },
             Z: { base: '#ff8800', glow: '#ffaa88', shadow: '#884400' },
             J: { base: '#0088ff', glow: '#88aaff', shadow: '#004488' },
             L: { base: '#ff0088', glow: '#ff88aa', shadow: '#880044' },
             garbage: { base: '#666666', glow: '#666666', shadow: '#444444' }
         };
        this.ui = {
            background: 'rgba(0, 10, 20, 0.9)',
            text: '#ffffff',
            accent: '#00aaff',
            border: '#00aaff'
        };
        this.background = {
            type: 'boids_simulation',
            colors: ['#00aaff', '#0088ff', '#00ff88', '#ff00ff'],
            intensity: 0.8
        };

        // Boids simulation system
        this.boids = {
            entities: [],
            trails: [],
            environmentalForces: [],
            species: ['I', 'O', 'T', 'S', 'Z', 'J', 'L'],
            foodWeb: {
                'J': { preysOn: ['I'], fleesFrom: [] },      // J hunts I-pieces
                'L': { preysOn: ['S'], fleesFrom: [] },      // L hunts S-pieces
                'Z': { preysOn: ['O'], fleesFrom: [] },      // Z hunts O-pieces
                'I': { preysOn: [], fleesFrom: ['J'] },      // I flees from J
                'S': { preysOn: [], fleesFrom: ['L'] },      // S flees from L
                'O': { preysOn: [], fleesFrom: ['Z'] },      // O flees from Z
                'T': { preysOn: [], fleesFrom: [] }          // T is neutral
            }
        };

        // Spatial partitioning for performance
        this.spatialGrid = {
            cellSize: 50,
            cells: new Map(),
            width: Math.ceil(TETRIS.WIDTH / 50),
            height: Math.ceil(TETRIS.HEIGHT / 50)
        };

        // Initialize boids population
        this.createBoidsPopulation();

        // Enable animated UI colors with watery theme
        this.uiAnimation.enabled = true;
        this.uiAnimation.speed = 0.3;
        this.uiAnimation.colors = [
            '#00aaff', '#0088ff', '#00ff88', '#ff00ff',
            '#ffff00', '#ff8800', '#0088ff', '#00aaff'
        ];
    }

    /**
     * Create initial population of boids with different species
     */
    createBoidsPopulation() {
        const totalBoids = 150; // Good balance of performance vs visual impact

        for (let i = 0; i < totalBoids; i++) {
            const species = this.boids.species[i % this.boids.species.length];
            this.boids.entities.push(this.createBoid(species, i));
        }
    }

    /**
     * Create a single boid with species-specific properties
     */
    createBoid(species, index) {
        const speciesTraits = {
            'I': { speed: 90, size: 12, aggression: 0.3, cohesion: 0.8, separation: 0.6 }, // Fastest prey
            'O': { speed: 45, size: 15, aggression: 0.1, cohesion: 1.0, separation: 0.4 }, // Slow, stable
            'T': { speed: 65, size: 13, aggression: 0.5, cohesion: 0.7, separation: 0.7 }, // Neutral, versatile
            'S': { speed: 85, size: 11, aggression: 0.4, cohesion: 0.6, separation: 0.8 }, // Fast, agile prey
            'Z': { speed: 70, size: 11, aggression: 0.9, cohesion: 0.5, separation: 0.9 }, // Fast predator
            'J': { speed: 75, size: 14, aggression: 0.8, cohesion: 0.7, separation: 0.6 }, // Strong predator
            'L': { speed: 80, size: 14, aggression: 0.7, cohesion: 0.8, separation: 0.5 }  // Fast predator
        };

        const traits = speciesTraits[species];

        return {
            id: index,
            species: species,
            x: Math.random() * TETRIS.WIDTH,
            y: Math.random() * TETRIS.HEIGHT,
            vx: (Math.random() - 0.5) * traits.speed,
            vy: (Math.random() - 0.5) * traits.speed,
            ax: 0,
            ay: 0,
            maxSpeed: traits.speed,
            maxForce: 3.0,
            size: traits.size,
            speciesTraits: traits,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 2,
            energy: 1.0,
            stamina: 1.0, // For predator fatigue system (all start with full stamina)
            huntTime: 0, // Track how long they've been hunting
            panicLevel: 0, // For dramatic fleeing behavior
            aggressionLevel: Math.random(), // For more dynamic hunting
            neighbors: [],
            predators: [],
            prey: [],
            otherFlocks: [],
            leaderInfluence: Math.random() > 0.8 ? 2.0 : 1.0, // Some boids are natural leaders
            color: this.getSpeciesColor(species),
            isPredator: this.boids.foodWeb[species].preysOn.length > 0,
            isPrey: this.boids.foodWeb[species].fleesFrom.length > 0
        };
    }

    /**
     * Get color for boid species
     */
    getSpeciesColor(species) {
        const colors = {
            'I': '#00ffff',
            'O': '#00ff88',
            'T': '#ff00ff',
            'S': '#ffff00',
            'Z': '#ff8800',
            'J': '#0088ff',
            'L': '#ff0088'
        };
        return colors[species] || '#ffffff';
    }

    /**
     * Setup - minimal setup for boids (no need to fast-forward)
     */
    setup() {
        // Boids theme doesn't need setup - boids start with random positions/velocities
        // No fast-forward needed since they start scattered and will group up naturally
    }

    /**
     * Update boids simulation - DEBUG VERSION
     */
    update(deltaTime) {
        super.update(deltaTime);

        // Update each boid (simplified, no spatial partitioning)
        this.boids.entities.forEach(boid => {
            this.updateBoid(boid, deltaTime);
        });

        // Apply environmental forces
        this.applyEnvironmentalForces(deltaTime);

        // Spawn new boids occasionally
        this.maybeSpawnBoid(deltaTime);
    }

    /**
     * Update spatial grid for efficient neighbor finding
     */
    updateSpatialGrid() {
        // Clear grid
        this.spatialGrid.cells.clear();

        // Add each boid to appropriate cell
        this.boids.entities.forEach(boid => {
            const cellX = Math.floor(boid.x / this.spatialGrid.cellSize);
            const cellY = Math.floor(boid.y / this.spatialGrid.cellSize);
            const cellKey = `${cellX},${cellY}`;

            if (!this.spatialGrid.cells.has(cellKey)) {
                this.spatialGrid.cells.set(cellKey, []);
            }
            this.spatialGrid.cells.get(cellKey).push(boid);
        });
    }

    /**
     * Get nearby boids of the same species for flocking
     */
    getNearbyBoidsOfSameSpecies(boid, radius) {
        const nearby = [];
        const cellSize = this.spatialGrid.cellSize;
        const searchRadius = Math.ceil(radius / cellSize);

        const centerCellX = Math.floor(boid.x / cellSize);
        const centerCellY = Math.floor(boid.y / cellSize);

        // Check surrounding cells
        for (let dx = -searchRadius; dx <= searchRadius; dx++) {
            for (let dy = -searchRadius; dy <= searchRadius; dy++) {
                const cellX = centerCellX + dx;
                const cellY = centerCellY + dy;
                const cellKey = `${cellX},${cellY}`;

                const cellBoids = this.spatialGrid.cells.get(cellKey);
                if (cellBoids) {
                    cellBoids.forEach(otherBoid => {
                        const distance = Math.sqrt((otherBoid.x - boid.x) ** 2 + (otherBoid.y - boid.y) ** 2);
                        if (distance <= radius && distance > 0 && otherBoid.species === boid.species) {
                            nearby.push(otherBoid);
                        }
                    });
                }
            }
        }

        return nearby;
    }

    /**
     * Get nearby boids for a given position (any species)
     */
    getNearbyBoids(x, y, radius) {
        const nearby = [];
        const cellSize = this.spatialGrid.cellSize;
        const searchRadius = Math.ceil(radius / cellSize);

        const centerCellX = Math.floor(x / cellSize);
        const centerCellY = Math.floor(y / cellSize);

        // Check surrounding cells
        for (let dx = -searchRadius; dx <= searchRadius; dx++) {
            for (let dy = -searchRadius; dy <= searchRadius; dy++) {
                const cellX = centerCellX + dx;
                const cellY = centerCellY + dy;
                const cellKey = `${cellX},${cellY}`;

                const cellBoids = this.spatialGrid.cells.get(cellKey);
                if (cellBoids) {
                    cellBoids.forEach(boid => {
                        const distance = Math.sqrt((boid.x - x) ** 2 + (boid.y - y) ** 2);
                        if (distance <= radius && distance > 0) {
                            nearby.push(boid);
                        }
                    });
                }
            }
        }

        return nearby;
    }

    /**
     * Check if species A preys on species B
     */
    isPredatorOf(predatorSpecies, preySpecies) {
        const foodWeb = this.boids.foodWeb[predatorSpecies];
        return foodWeb && foodWeb.preysOn.includes(preySpecies);
    }

    /**
     * Update individual boid behavior - ULTRA SIMPLE AND RELIABLE
     */
    updateBoid(boid, deltaTime) {
        // Find same-species boids for flocking
        boid.neighbors = [];
        const groupingRadius = 150;

        // Find same species for flocking
        boid.neighbors = [];

        // Find predators (species that hunt this boid)
        boid.predators = [];

        // Find prey (species this boid hunts)
        boid.prey = [];

        // Find other flocks for avoidance
        boid.otherFlocks = [];

        // Ensure boids don't wander too far off screen during calculations
        boid.x = Math.max(-10, Math.min(TETRIS.WIDTH + 10, boid.x));
        boid.y = Math.max(-10, Math.min(TETRIS.HEIGHT + 10, boid.y));

        this.boids.entities.forEach(otherBoid => {
            if (otherBoid.id !== boid.id) {
                const distance = Math.sqrt((otherBoid.x - boid.x) ** 2 + (otherBoid.y - boid.y) ** 2);

                if (otherBoid.species === boid.species && distance < groupingRadius) {
                    // Same species - flock together
                    boid.neighbors.push(otherBoid);
                } else if (this.isPredatorOf(otherBoid.species, boid.species)) {
                    // Other boid hunts this boid - PREDATOR
                    if (distance < 120) {
                        boid.predators.push(otherBoid);
                    }
                } else if (this.isPredatorOf(boid.species, otherBoid.species)) {
                    // This boid hunts other boid - PREY
                    if (distance < 100) {
                        boid.prey.push(otherBoid);
                    }
                } else if (otherBoid.species !== boid.species && distance < 80) {
                    // Different species but no predator/prey relationship - just avoid
                    boid.otherFlocks.push(otherBoid);
                }
            }
        });

        // Calculate simple forces
        const traits = boid.speciesTraits;
        let avgVelX = 0, avgVelY = 0;
        let avgPosX = 0, avgPosY = 0;
        let separationX = 0, separationY = 0;
        let avoidanceX = 0, avoidanceY = 0;
        let fleeX = 0, fleeY = 0;
        let huntX = 0, huntY = 0;

        boid.neighbors.forEach(neighbor => {
            const dx = boid.x - neighbor.x;
            const dy = boid.y - neighbor.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 0) {
                // Separation (push away if too close)
                if (distance < 40) {
                    const strength = (40 - distance) / 40;
                    separationX += (dx / distance) * strength * 3;
                    separationY += (dy / distance) * strength * 3;
                }

                // Alignment (face same direction)
                avgVelX += neighbor.vx;
                avgVelY += neighbor.vy;

                // Cohesion (move toward center)
                avgPosX += neighbor.x;
                avgPosY += neighbor.y;
            }
        });

        // Calculate avoidance from OTHER species flocks
        boid.otherFlocks.forEach(otherFlockBoid => {
            const dx = boid.x - otherFlockBoid.x;
            const dy = boid.y - otherFlockBoid.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 0 && distance < 80) { // Avoid other flocks within this radius
                const avoidanceStrength = (80 - distance) / 80; // Closer = stronger avoidance
                avoidanceX += (dx / distance) * avoidanceStrength * 4; // Strong avoidance
                avoidanceY += (dy / distance) * avoidanceStrength * 4;
            }
        });

        // Calculate FLEEING from predators (DRAMATIC scatter behavior)
        boid.predators.forEach(predator => {
            const dx = boid.x - predator.x;
            const dy = boid.y - predator.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 0 && distance < 120) { // Larger flee radius for more drama
                const fleeStrength = Math.min(1, (120 - distance) / 120); // Closer = stronger flee
                const chaoticFactor = 1.2; // More chaotic fleeing

                // MUCH STRONGER base flee force
                fleeX += (dx / distance) * fleeStrength * 8;
                fleeY += (dy / distance) * fleeStrength * 8;

                // MORE chaotic element for dramatic scattering
                fleeX += (Math.random() - 0.5) * fleeStrength * chaoticFactor * 3;
                fleeY += (Math.random() - 0.5) * fleeStrength * chaoticFactor * 3;

                // Build up panic level for more dramatic escapes
                boid.panicLevel = Math.min(1.0, boid.panicLevel + fleeStrength * deltaTime * 2);

                // DRAMATIC SPEED BOOST FOR PREY: Bigger boost when panicking
                if (boid.isPrey && fleeStrength > 0.2) {
                    const panicBoost = 1.0 + (boid.panicLevel * 0.8); // Up to 80% speed boost
                    boid.vx *= panicBoost;
                    boid.vy *= panicBoost;

                    // Super chaotic fleeing when really scared
                    if (boid.panicLevel > 0.7) {
                        fleeX += (Math.random() - 0.5) * 10;
                        fleeY += (Math.random() - 0.5) * 10;
                    }
                }
            }
        });

        // Panic decays over time when not threatened
        boid.panicLevel = Math.max(0, boid.panicLevel - deltaTime * 0.5);

        // Calculate HUNTING prey (AGGRESSIVE pursuit) - with FATIGUE system
        if (boid.isPredator && boid.stamina > 0.1) { // Only hunt if not too tired
            boid.prey.forEach(preyBoid => {
                const dx = preyBoid.x - boid.x; // Notice: reversed (chase toward prey)
                const dy = preyBoid.y - boid.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance > 0 && distance < 120) { // Larger hunting range for more action
                    // More aggressive hunting with dynamic strength
                    const baseHuntStrength = Math.min(1, distance / 120);
                    const aggressionBoost = boid.aggressionLevel * 0.5; // Personal aggression factor
                    const huntStrength = (baseHuntStrength + aggressionBoost) * boid.stamina;

                    // MUCH STRONGER hunting force
                    huntX += (dx / distance) * huntStrength * 6;
                    huntY += (dy / distance) * huntStrength * 6;

                    // Track hunting time (increases fatigue)
                    boid.huntTime += deltaTime * 0.8; // Faster fatigue buildup for more drama

                    // Super aggressive predators get even more boost
                    if (boid.aggressionLevel > 0.7) {
                        huntX *= 1.4;
                        huntY *= 1.4;
                    }
                }
            });
        }

        // Update predator stamina (fatigue system)
        if (boid.isPredator) {
            if (boid.huntTime > 0) {
                // Lose stamina while hunting
                boid.stamina = Math.max(0.1, boid.stamina - deltaTime * 0.3);
                boid.huntTime -= deltaTime; // Slowly recover from hunting fatigue
            } else {
                // Recover stamina when not hunting
                boid.stamina = Math.min(1.0, boid.stamina + deltaTime * 0.2);
            }

            // Clamp hunt time
            boid.huntTime = Math.max(0, boid.huntTime);
        }

        // Apply forces
        const neighborCount = boid.neighbors.length;

        if (neighborCount > 0) {
            // Normalize averages
            avgVelX /= neighborCount;
            avgVelY /= neighborCount;
            avgPosX /= neighborCount;
            avgPosY /= neighborCount;

            // STRONG alignment toward group direction
            boid.vx += (avgVelX - boid.vx) * 0.3;
            boid.vy += (avgVelY - boid.vy) * 0.3;

            // STRONG cohesion toward group center
            const toCenterX = (avgPosX - boid.x) * 0.1;
            const toCenterY = (avgPosY - boid.y) * 0.1;
            boid.vx += toCenterX;
            boid.vy += toCenterY;
        }

        // Apply separation (within same species)
        boid.vx += separationX * traits.separation * 2.0;
        boid.vy += separationY * traits.separation * 2.0;

        // Apply avoidance (from other species)
        boid.vx += avoidanceX;
        boid.vy += avoidanceY;

        // Apply fleeing (chaotic escape from predators) - MORE DRAMATIC
        boid.vx += fleeX * 2.0;  // Even stronger flee force
        boid.vy += fleeY * 2.0;

        // Apply hunting (focused chase of prey) - MORE AGGRESSIVE
        boid.vx += huntX * 1.5;  // Stronger hunting
        boid.vy += huntY * 1.5;

        // PACK HUNTING: Predators get stronger when multiple hunt same prey
        if (boid.isPredator && boid.prey.length > 0) {
            // Check if other predators are also hunting this prey
            let packSize = 1;
            this.boids.entities.forEach(otherBoid => {
                if (otherBoid.isPredator && otherBoid.id !== boid.id && otherBoid.prey.length > 0) {
                    // Check if we're hunting the same prey
                    const sharedPrey = boid.prey.some(prey => otherBoid.prey.includes(prey));
                    if (sharedPrey) {
                        packSize++;
                    }
                }
            });

            // Pack hunting bonus
            if (packSize > 1) {
                const packBonus = Math.min(2.0, 1.0 + (packSize * 0.3)); // Up to 2x strength in packs
                boid.vx *= packBonus;
                boid.vy *= packBonus;
            }
        }

        // PREY DISTRESS CALLS: Prey attract other prey when panicking
        if (boid.isPrey && boid.panicLevel > 0.6) {
            // Find other prey of same species and make them more cohesive
            const sameSpecies = this.boids.entities.filter(other =>
                other.species === boid.species &&
                other.id !== boid.id &&
                Math.sqrt((other.x - boid.x) ** 2 + (other.y - boid.y) ** 2) < 150
            );

            sameSpecies.forEach(otherPrey => {
                const dx = boid.x - otherPrey.x;
                const dy = boid.y - otherPrey.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance > 0) {
                    // Other prey move toward the distressed one for group defense
                    const helpStrength = boid.panicLevel * 0.5;
                    otherPrey.vx += (dx / distance) * helpStrength;
                    otherPrey.vy += (dy / distance) * helpStrength;
                }
            });
        }

        // Limit speed
        const speed = Math.sqrt(boid.vx * boid.vx + boid.vy * boid.vy);
        if (speed > boid.maxSpeed) {
            boid.vx = (boid.vx / speed) * boid.maxSpeed;
            boid.vy = (boid.vy / speed) * boid.maxSpeed;
        }

        // Update position
        boid.x += boid.vx * deltaTime;
        boid.y += boid.vy * deltaTime;

        // Update rotation
        if (speed > 1) {
            boid.rotation = Math.atan2(boid.vy, boid.vx);
        }

        // Wrap exactly at screen edges
        if (boid.x < 0) boid.x = TETRIS.WIDTH;
        if (boid.x > TETRIS.WIDTH) boid.x = 0;
        if (boid.y < 0) boid.y = TETRIS.HEIGHT;
        if (boid.y > TETRIS.HEIGHT) boid.y = 0;
    }

    /**
     * Calculate separation force (avoid crowding)
     */
    calculateSeparation(boid) {
        const force = { x: 0, y: 0 };
        const separationRadius = 25;

        boid.neighbors.forEach(neighbor => {
            const distance = Math.sqrt((neighbor.x - boid.x) ** 2 + (neighbor.y - boid.y) ** 2);
            if (distance > 0 && distance < separationRadius) {
                // Closer neighbors = stronger repulsion
                const strength = (separationRadius - distance) / separationRadius;
                const pushX = (boid.x - neighbor.x) / distance * strength * 2;
                const pushY = (boid.y - neighbor.y) / distance * strength * 2;

                force.x += pushX;
                force.y += pushY;
            }
        });

        return force;
    }

    /**
     * Calculate alignment force (face same direction as neighbors)
     */
    calculateAlignment(boid) {
        const force = { x: 0, y: 0 };
        if (boid.neighbors.length === 0) return force;

        // Average velocity of neighbors
        let avgVx = 0, avgVy = 0;
        boid.neighbors.forEach(neighbor => {
            avgVx += neighbor.vx;
            avgVy += neighbor.vy;
        });

        avgVx /= boid.neighbors.length;
        avgVy /= boid.neighbors.length;

        // Steer toward average direction (normal boids alignment)
        force.x = (avgVx - boid.vx) * 0.1;
        force.y = (avgVy - boid.vy) * 0.1;

        return force;
    }

    /**
     * Calculate cohesion force (move toward center of neighbors)
     */
    calculateCohesion(boid) {
        const force = { x: 0, y: 0 };
        if (boid.neighbors.length === 0) return force;

        // Average position of neighbors
        let avgX = 0, avgY = 0;
        boid.neighbors.forEach(neighbor => {
            avgX += neighbor.x;
            avgY += neighbor.y;
        });

        avgX /= boid.neighbors.length;
        avgY /= boid.neighbors.length;

        // Steer toward center (normal boids cohesion)
        const distance = Math.sqrt((avgX - boid.x) ** 2 + (avgY - boid.y) ** 2);
        if (distance > 0) {
            force.x = (avgX - boid.x) / distance * 0.05;  // Normal cohesion force
            force.y = (avgY - boid.y) / distance * 0.05;
        }

        return force;
    }

    /**
     * Apply leader influence to nearby boids
     */
    applyLeaderInfluence(leader) {
        const leaderRadius = 100;
        const nearbyBoids = this.getNearbyBoids(leader.x, leader.y, leaderRadius);

        nearbyBoids.forEach(boid => {
            if (boid.id === leader.id) return;

            const distance = Math.sqrt((boid.x - leader.x) ** 2 + (boid.y - leader.y) ** 2);
            if (distance > 0) {
                const influence = leader.leaderInfluence * (1 - distance / leaderRadius);
                boid.vx += (leader.vx - boid.vx) * influence * 0.15;  // 7.5x stronger
                boid.vy += (leader.vy - boid.vy) * influence * 0.15;
            }
        });
    }


    /**
     * Apply environmental forces (WEAKER currents to not interfere with flocking)
     */
    applyEnvironmentalForces(deltaTime) {
        // Much weaker current so flocking behavior is more visible
        const time = this.animationTime;
        const currentX = Math.sin(time * 0.3) * 3;  // Much weaker
        const currentY = Math.cos(time * 0.2) * 2;  // Much weaker

        this.boids.entities.forEach(boid => {
            // Apply very weak current force (even weaker for faster grouping)
            const currentForce = 1 / (boid.size / 10);  // Even weaker
            boid.ax += currentX * currentForce * deltaTime;
            boid.ay += currentY * currentForce * deltaTime;
    
            // Almost no randomness so flocking dominates completely
            boid.ax += (Math.random() - 0.5) * 0.1 * deltaTime;  // Minimal randomness
            boid.ay += (Math.random() - 0.5) * 0.1 * deltaTime;
        });
    }

    /**
     * Maybe spawn a new boid
     */
    maybeSpawnBoid(deltaTime) {
        if (Math.random() < 0.02 * deltaTime) { // 2% chance per second
            const species = this.boids.species[Math.floor(Math.random() * this.boids.species.length)];
            this.boids.entities.push(this.createBoid(species, Date.now()));
        }
    }

    /**
     * Draw boids simulation
     */
    drawBackground(ctx, opacity) {
        // Draw depth gradient background
        this.drawBackgroundGradient(ctx, opacity);

        // Draw boids
        this.drawBoids(ctx, opacity);

        // Draw environmental effects
        this.drawEnvironmentalEffects(ctx, opacity);
    }

    /**
     * Draw background depth gradient
     */
    drawBackgroundGradient(ctx, opacity) {
        const gradient = ctx.createLinearGradient(0, 0, 0, TETRIS.HEIGHT);
        gradient.addColorStop(0, `rgba(10, 30, 50, ${0.3 * opacity})`);
        gradient.addColorStop(0.5, `rgba(5, 20, 35, ${0.2 * opacity})`);
        gradient.addColorStop(1, `rgba(2, 10, 25, ${0.4 * opacity})`);

        ctx.save();
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, TETRIS.WIDTH, TETRIS.HEIGHT);
        ctx.restore();
    }

    /**
     * Draw all boids with their tetromino shapes
     */
    drawBoids(ctx, opacity) {
        this.boids.entities.forEach(boid => {
            this.drawBoid(ctx, boid, opacity);
        });
    }

    /**
     * Draw individual boid as tetromino shape
     */
    drawBoid(ctx, boid, opacity) {
        ctx.save();
        ctx.translate(boid.x, boid.y);
        ctx.rotate(boid.rotation);
        ctx.globalAlpha = opacity * 0.9;

        // Draw tetromino shape based on species
        const shape = this.getTetrominoShape(boid.species, Math.floor(boid.rotation / (Math.PI / 2)) * 90);
        const blockSize = boid.size / 4;

        if (shape) {
            // Draw each block of the tetromino
            for (let row = 0; row < shape.length; row++) {
                for (let col = 0; col < shape[row].length; col++) {
                    if (shape[row][col]) {
                        const x = (col - shape[row].length / 2) * blockSize;
                        const y = (row - shape.length / 2) * blockSize;

                        // Main block
                        ctx.fillStyle = boid.color;
                        ctx.fillRect(x, y, blockSize - 1, blockSize - 1);

                        // Highlight
                        ctx.fillStyle = this.lightenColor(boid.color, 0.4);
                        ctx.fillRect(x + 1, y + 1, blockSize - 3, blockSize - 3);

                        // Shadow
                        ctx.fillStyle = this.darkenColor(boid.color, 0.6);
                        ctx.fillRect(x + blockSize - 3, y + 2, 1, blockSize - 3);
                        ctx.fillRect(x + 2, y + blockSize - 3, blockSize - 3, 1);
                    }
                }
            }
        }

        ctx.restore();
    }


    /**
     * Draw environmental effects
     */
    drawEnvironmentalEffects(ctx, opacity) {
        // Draw current flow indicators (subtle swirling patterns)
        this.drawCurrentIndicators(ctx, opacity);

        // Draw some floating particles for atmosphere
        this.drawAtmosphericParticles(ctx, opacity);
    }

    /**
     * Draw current flow visualization
     */
    drawCurrentIndicators(ctx, opacity) {
        const time = this.animationTime;
        const numCurrents = 8;

        for (let i = 0; i < numCurrents; i++) {
            const angle = time * 0.5 + i * (Math.PI * 2 / numCurrents);
            const centerX = TETRIS.WIDTH / 2 + Math.cos(angle) * 100;
            const centerY = TETRIS.HEIGHT / 2 + Math.sin(angle) * 100;

            ctx.save();
            ctx.globalAlpha = opacity * 0.1;
            ctx.strokeStyle = '#00aaff';
            ctx.lineWidth = 1;

            for (let ring = 0; ring < 3; ring++) {
                const radius = 20 + ring * 15;
                const phase = time * 2 + ring * 0.5;

                ctx.beginPath();
                for (let point = 0; point <= 20; point++) {
                    const pointAngle = (point / 20) * Math.PI * 2;
                    const waveRadius = radius + Math.sin(pointAngle * 3 + phase) * 5;
                    const x = centerX + Math.cos(pointAngle) * waveRadius;
                    const y = centerY + Math.sin(pointAngle) * waveRadius;
                    ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.stroke();
            }

            ctx.restore();
        }
    }

    /**
     * Draw floating atmospheric particles
     */
    drawAtmosphericParticles(ctx, opacity) {
        const numParticles = 30;

        for (let i = 0; i < numParticles; i++) {
            const x = (Math.sin(this.animationTime * 0.3 + i) * 0.5 + 0.5) * TETRIS.WIDTH;
            const y = (Math.cos(this.animationTime * 0.4 + i * 0.7) * 0.5 + 0.5) * TETRIS.HEIGHT;
            const twinkle = (Math.sin(this.animationTime * 2 + i) + 1) * 0.5;

            ctx.save();
            ctx.globalAlpha = opacity * twinkle * 0.4;
            ctx.fillStyle = '#88ddff';
            ctx.beginPath();
            ctx.arc(x, y, 1 + twinkle * 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    /**
     * Get tetromino shape for given rotation
     */
    getTetrominoShape(species, rotation = 0) {
        const shapes = {
            'I': {
                0: [[1, 1, 1, 1]],
                90: [[1], [1], [1], [1]],
                180: [[1, 1, 1, 1]],
                270: [[1], [1], [1], [1]]
            },
            'O': {
                0: [[1, 1], [1, 1]],
                90: [[1, 1], [1, 1]],
                180: [[1, 1], [1, 1]],
                270: [[1, 1], [1, 1]]
            },
            'T': {
                0: [[0, 1, 0], [1, 1, 1]],
                90: [[1, 0], [1, 1], [1, 0]],
                180: [[1, 1, 1], [0, 1, 0]],
                270: [[0, 1], [1, 1], [0, 1]]
            },
            'S': {
                0: [[0, 1, 1], [1, 1, 0]],
                90: [[1, 0], [1, 1], [0, 1]],
                180: [[0, 1, 1], [1, 1, 0]],
                270: [[1, 0], [1, 1], [0, 1]]
            },
            'Z': {
                0: [[1, 1, 0], [0, 1, 1]],
                90: [[0, 1], [1, 1], [1, 0]],
                180: [[1, 1, 0], [0, 1, 1]],
                270: [[0, 1], [1, 1], [1, 0]]
            },
            'J': {
                0: [[1, 0, 0], [1, 1, 1]],
                90: [[1, 1], [1, 0], [1, 0]],
                180: [[1, 1, 1], [0, 0, 1]],
                270: [[0, 1], [0, 1], [1, 1]]
            },
            'L': {
                0: [[0, 0, 1], [1, 1, 1]],
                90: [[1, 0], [1, 0], [1, 1]],
                180: [[1, 1, 1], [1, 0, 0]],
                270: [[1, 1], [0, 1], [0, 1]]
            }
        };

        return shapes[species]?.[rotation] || shapes[species]?.[0];
    }
}
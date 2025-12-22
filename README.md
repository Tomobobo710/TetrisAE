# Tetris - ActionEngine Edition

A fully-featured Tetris implementation built on **ActionEngineJS**

<img width="2371" height="1784" alt="image" src="https://github.com/user-attachments/assets/8fe68389-4c1d-4a1e-bc62-a72be908c635" />

<img width="2375" height="1778" alt="image" src="https://github.com/user-attachments/assets/6525be02-3b6b-4323-a3c5-8101b07cc76a" />

<img width="2370" height="1782" alt="image" src="https://github.com/user-attachments/assets/65390434-880a-4ac8-88e6-1d8b808e71a3" />

## What's Here
TetrisAE is a complete game built as an example and showcases the ActionEngine framework's capabilities for end-to-end game development. Particularly, the focus is on demonstrating ActionEngineJS's networking, input, and audio systems.

### Core Game
Fully-featured Tetris with competitive mechanics and gorgeous presentation:
- **Advanced Rotation System**: Super Rotation System (SRS) with proper wall kick tables for all piece types
- **T-Spin Detection**: Full 3-corner T-spin detection (standard T-spins + mini T-spins) with dedicated bonus scoring
- **Strategic Mechanics**: Piece holding with visual hold display, ghost piece preview with adjustable opacity, hard drop scoring bonus
- **Combo & Attack System**: Back-to-back bonus multiplier (1.5x) for continuous difficult clears, progressive combo scoring for multi-line clears
- **Responsive Controls**: DAS (Delayed Auto Shift) and ARR (Auto Repeat Rate) for fluid, arcade-style piece movement
- **Line Clear Scoring**: Single/Double/Triple/Tetris with proper T-spin variants (T-Spin Single/Double/Triple), guideline-accurate bonus points

### Game Modes
- **Single Player**: Perfect for practice and score attacks with progressive difficulty scaling
- **Local Multiplayer**: 2-4 player split-screen with dynamic UI layouts (2P side-by-side, 3P triangle, 4P quadrant)
- **Vs CPU**: Faces off against an aggressive AI opponent with selectable difficulty (Easy/Medium/Hard)
  - **Hard Mode CPU**: Ruthless attack-focused AI that prioritizes Tetrises, punishes wasted pieces, and exploits back-to-back chains
  - **Perfect Execution**: 0% mistake rate on hard difficulty with lightning-fast reaction times (60ms)
  - **Garbage Attack**: Sends garbage lines based on clears and back-to-back bonuses
- **Online Multiplayer**: Battle players from all over the world

### Online Multiplayer
- **Built on ActionEngine's networking layer** ActionNetManagerGUI provides a "one line" networking GUI which handles game room managment and peer connection
- **Event-driven API**: Peer/user discovery, room list/user list updates, join/leave notifications, connection lifecycle events
- **Dual-mode networking**: Pure P2P via tracker discovery OR centralized WebSocket server (configurable at runtime)
- **Decentralized P2P** (ActionNetManagerP2P): WebSocket tracker announces (using public bittorrent infrastructure), peer discovery, offer/answer/ICE candidate relay, direct peer-to-peer gameplay
- **Centralized server mode** (ActionNetManager): Node.js WebSocket server for room/lobby management, client registration, message routing (state-agnostic relay)
- **Two-phase WebRTC** (P2P only): Signaling channel via tracker for metadata, separate RTCDataChannel for low-latency game state (ActionNetTrackerClient, DataConnection, ActionNetPeer)
- **SyncSystem**: Generic, transport-agnostic state synchronization engine. Registers game state sources (match state, player stats, piece positions, next queue), periodically broadcasts with staleness detection and remote liveness tracking
- **Tracker-based discovery** (P2P): SHA-1 game ID → infohash, announces to websocket tracker pool (hardcoded + dynamically fetched), handles offer/answer/ICE flows
- **Automatic STUN selection** (P2P): Geolocation-aware closest server selection from 40+ hardcoded servers + dynamic discovery

### Visual Themes (16 Dynamic Themes)
Each theme is a fully rendered procedural background system with its own animation loop, heavily inspired by classic demoscene effects and retro computing aesthetics. Themes dynamically respond to game state, with many featuring interactive effects that react to gameplay, grid state, and special events like Tetris clears.

- **Neon City**: Perspective grid with orbiting 3D wireframe objects (cubes, spheres, cones, cylinders, tetrahedrons, octahedrons, tori), animated sun/moon traversal with dynamic day/night color shifts, grid-based procedural mountains with height-based sway animation, floating geometric shapes, and cycling UI colors through cyan/magenta/yellow spectrum
- **Matrix**: Authentic digital rain simulation with cascading tetromino-shaped characters that morph and fade over time, column-based depth system with distance-based scaling, CPU-based fireDemo-style effects, and characters that change based on game progression
- **Crystal**: Pulsing ring of orbiting crystals with expanding energy beams and particle trails, ambient sparkles with twinkling effects, god rays emanating from crystal positions, dynamic color shifts based on celestial body positions, and trail particles that follow crystal movement
- **Fire**: CPU-based fire buffer using classic fireDemo cellular automata techniques, particle emitters with physics-based movement, height-based color gradients from yellow to red, volumetric glow effects, and turbulence fields for organic flame movement (inspired by "x-mode" by Justin Greisiger Frost)
- **Ocean**: Underwater caustics with dancing light patterns, volumetric god rays, swimming fish with realistic schooling AI and predator/prey relationships, pulsing jellyfish with animated tentacles, swaying kelp with procedural motion, rising bubbles with physics and wobble effects, and dynamic current flows
- **GameBoy**: Floating tetromino blocks with continuous rotations, retro scanlines and vignette effects, classic Game Boy green color palette with proper shading (highlights, shadows, and outlines), and authentic 8-bit aesthetic
- **Monochrome**: Hypnotic hole effect with inward and outward expanding rings, smooth easing animations, greyscale color cycling through different shades, and black background with white geometric patterns
- **Cyberpunk City**: 3D skyscraper cityscape with proper Vector3/Triangle geometry, animated neon signs, flying cars with motion trails, orbital camera system, depth-sorted rendering, and Blade Runner-inspired orange/red color palette
- **Fractal**: Mathematical fractals including animated Julia sets, recursive fractal trees with wind sway, Sierpinski triangles, Barnsley ferns, Koch snowflakes, and psychedelic color cycling with smooth transitions
- **Boids**: Sophisticated flocking simulation with tetromino-shaped boids, complex predator/prey food web (J hunts I, L hunts S, Z hunts O), pack hunting mechanics, panic fleeing with chaotic scatter, and emergent swarm behaviors
- **Country Drive**: Parallax scrolling countryside inspired by js1k Train Window demo (https://js1k.com/2015-hypetrain/details/2311 by Reinder Nijhoff), multiple depth layers (sky, clouds, trees), procedural heightmap terrain, scene transitions (sunny/sunset/night/snowy/rainy), and seasonal color palettes
- **Traveler**: Faithful port of Star Traveler demo (https://github.com/depp/demo-traveler by del / @depp and contributors) with 3D star field using pseudo-3D depth, fractal mountain bands with cloud overlays, central singularity that appears after time > 7, smooth color transitions, and time-based world evolution
- **Tunnel**: Procedural tunnel with radial mapping and perspective distortion, multiple texture schemes (checkerboard patterns with unique variations), smooth section transitions, and demoscene-inspired tunnel effects (inspired by tunnelDemo-style techniques and "x-mode" by Justin Greisiger Frost)
- **Voxel**: 3D voxel Tetris architecture with 385 Minecraft-style structures, real satellite orbital mechanics using Keplerian elements, depth-sorted painter's algorithm rendering, and complex 3D camera orbits
- **Rain**: Dynamic rain system with wind turbulence and faux 3D depth, cloud particles with atmospheric effects, dramatic lightning with branching bolts and thunder, special tetris-triggered lightning events, and physics-based water droplets
- **Virtual Boy**: Virtual Boy-inspired wireframe 3D world with red/black wireframe triangles, procedural island terrain generation using fractal noise, orbital camera, and authentic Virtual Boy HUD with center crosshair

(DEFAULT theme is a fallback plain style when all others are disabled)

Toggle themes on/off individually or select all at once. Themes persist across sessions.

### Dynamic Audio
Procedurally generated sound design with zero audio files:
- **Gameplay SFX**: Move (sweep), rotate (triangle sweep), lock (complex harmonic blend), hard drop (descending sweep), line clear (sawtooth polyphony), tetris bonus (6-frequency chord), hold (FM synthesis), failed hold (pitch bend)
- **Menu Sounds**: Navigate (harmonic echo), confirm (chord progression), back (downstep), toggle (FM pulse), theme change (3-tone chord)
- **Level Up & Game Over**: Complex FM-based state signals with attack/decay envelopes
- **Synthesis Techniques**: Sweep sounds, FM modulation, complex multi-frequency mixing, ADSR envelopes, echo/reverb effects

### Input & Controls
- Full 4-gamepad support with automatic device assignment
- Customizable key/button remapping (keyboard + gamepad) with a dedicated controls window
- Cross-device input handling with priority fallback
- Input waiting modal with 3-second timeout for binding new controls

### Settings
- Persistent game settings (localStorage): enabled themes, control remaps, gameplay toggles
- Options: hard drop toggle, ghost piece toggle, CPU difficulty (easy/medium/hard)

### Easter Egg
A hidden minigame awaits the curious explorer...

## How to Run

Open `index.html` in a modern browser.

## What This Demonstrates

This game exists as an example to prove that ActionEngineJS provides production-ready tools for:
- **Networking**: A "one line" multiplayer with proper state sync and connection management
- **Input**: Multi-gamepad support, custom remapping, UI navigation across keyboard/gamepad
- **Audio**: Dynamic sound effects with custom audio management
- **Rendering**: Multi-layer canvas system with theme-based visuals
- **UI**: Menu systems, modal dialogs, persistent settings

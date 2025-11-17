/**
 * Pill Panic Game Class
 * Main coordinator that delegates to specialized modules
 * Clean integration with Tetris architecture
 */
class PillPanicGame {
    constructor(parentGame) {
        this.parentGame = parentGame; // Reference to main Tetris game
        
        // Use parent's ActionEngine references
        this.input = parentGame.input;
        this.gameCanvas = parentGame.gameCanvas;
        this.gameCtx = parentGame.gameCtx;
        this.guiCanvas = parentGame.guiCanvas;
        this.guiCtx = parentGame.guiCtx;
        this.debugCanvas = parentGame.debugCanvas;
        this.debugCtx = parentGame.debugCtx;
        
        /******* Core Game State *******/
        this.gameState = PILL_PANIC_CONSTANTS.STATES.LEVEL_SELECT;
        this.frameCount = 0;
        this.lastTime = performance.now();
        
        /******* Initialize Specialized Modules *******/
        this.audioManager = new PillPanicAudioManager(parentGame.audio);
        this.inputManager = new PillPanicInputManager(this);
        this.renderer = new PillPanicRenderer(this);
        this.gameLogic = new PillPanicGameLogic(this);

        // Pass through game settings reference for ghost piece toggle
        this.gameSettings = parentGame.gameSettings;
        
    }
    
    /******* ActionEngine Framework Hooks *******/
    update(deltaTime) {
        this.frameCount++;

        // Handle input
        this.inputManager.handleInput(deltaTime);

        // Update game logic only if not paused
        if (this.gameState !== PILL_PANIC_CONSTANTS.STATES.PAUSED) {
            this.gameLogic.update(deltaTime);
        }
    }
    
    draw() {
        // Delegate all rendering to renderer
        this.renderer.draw();
    }
    
    /******* State Management *******/
    setState(newState) {
        this.gameState = newState;
    }
    
    /******* Navigation Methods *******/
    returnToTetris() {        
        // Delegate to parent game for clean transition
        this.parentGame.returnFromPillPanic();
    }
    
    /******* Utility Methods *******/
    playSound(soundName, options = {}) {
        // Delegate to audio manager
        if (this.audioManager[`play${soundName.charAt(0).toUpperCase() + soundName.slice(1)}`]) {
            this.audioManager[`play${soundName.charAt(0).toUpperCase() + soundName.slice(1)}`](options);
        } else {
            // Fallback to parent game sounds
            this.parentGame.playSound(soundName, options);
        }
    }
}

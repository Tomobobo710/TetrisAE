/**
 * Dr. Mario Game Class
 * Main coordinator that delegates to specialized modules
 * Clean integration with Tetris architecture
 */
class DrMarioGame {
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
        this.gameState = DR_MARIO_CONSTANTS.STATES.START_SCREEN;
        this.frameCount = 0;
        this.lastTime = performance.now();
        
        /******* Initialize Specialized Modules *******/
        this.audioManager = new DrMarioAudioManager(parentGame.audio);
        this.inputManager = new DrMarioInputManager(this);
        this.renderer = new DrMarioRenderer(this);
        this.gameLogic = new DrMarioGameLogic(this);
        
        console.log("🎮 Dr. Mario initialized! Modules loaded.");
    }
    
    /******* ActionEngine Framework Hooks *******/
    update(deltaTime) {
        this.frameCount++;
        
        // Handle input
        this.inputManager.handleInput(deltaTime);
        
        // Update game logic
        this.gameLogic.update(deltaTime);
    }
    
    draw() {
        // Delegate all rendering to renderer
        this.renderer.draw();
    }
    
    /******* State Management *******/
    setState(newState) {
        console.log(`Dr. Mario state: ${this.gameState} -> ${newState}`);
        this.gameState = newState;
    }
    
    /******* Navigation Methods *******/
    returnToTetris() {
        console.log("🎮 Returning to Tetris main menu...");
        
        // Delegate to parent game for clean transition
        this.parentGame.returnFromDrMario();
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

/**
 * CustomControlsIntegration - Wires custom controls into the Tetris game
 * Manages input adaptation and integration with existing systems
 */
class CustomControlsIntegration {
    constructor(game) {
        this.game = game;
        this.input = game.input;

        // Initialize custom controls system
        this.controlsManager = new CustomControlsManager();
        this.inputAdapter = new CustomInputAdapter(this.input, this.controlsManager);

        // Set default left stick axis bindings for directional movement
        this.setupDefaultAxisBindings();

        // Set up the adapter in ActionEngine for access
        this.input.setCustomControlsAdapter(this.inputAdapter);

        console.log('[CustomControlsIntegration] Custom controls system initialized');
    }
    
    /**
     * Update custom controls system - call every frame
     */
    update(deltaTime) {
        // Refresh input adapter bindings if needed
        this.inputAdapter.ensureBindingsUpToDate();

        // Update axis states for just-pressed detection
        this.inputAdapter.updateAxisStates();
    }

    /**
     * Set up default left stick axis bindings for directional movement
     */
    setupDefaultAxisBindings() {
        // Default axis bindings are now set in the defaultControls structure
        // This method is kept for backward compatibility and future enhancements
        console.log('[CustomControlsIntegration] Default left stick axis bindings set via defaultControls');
    }
    
    /**
     * Get the input adapter for gameplay use
     */
    getInputAdapter() {
        return this.inputAdapter;
    }

    /**
     * Get the controls manager
     */
    getControlsManager() {
        return this.controlsManager;
    }

    /**
     * Check if the controls modal is currently visible
     */
    isModalVisible() {
        // Always return false since we removed the modal
        return false;
    }
    
    /**
     * Reset all controls to defaults
     */
    resetToDefaults() {
        this.controlsManager.resetToDefaults();
        this.inputAdapter.refreshBindings();
        console.log('[CustomControlsIntegration] Controls reset to defaults');
    }
    
    /**
     * Export current controls configuration
     */
    exportControls() {
        const controls = JSON.stringify(this.controlsManager.currentControls, null, 2);
        console.log('[CustomControlsIntegration] Current controls:', controls);
        return controls;
    }
    
    /**
     * Import controls configuration
     */
    importControls(controlsJson) {
        try {
            const controls = JSON.parse(controlsJson);
            this.controlsManager.currentControls = this.controlsManager.mergeWithDefaults(controls);
            this.controlsManager.saveControls();
            this.inputAdapter.refreshBindings();
            console.log('[CustomControlsIntegration] Controls imported successfully');
            return true;
        } catch (error) {
            console.error('[CustomControlsIntegration] Failed to import controls:', error);
            return false;
        }
    }
}
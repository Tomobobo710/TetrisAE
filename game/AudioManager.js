// game/AudioManager.js
// Thin game-level audio facade around the shared ActionAudioManager.
// - setupGameSounds(audio) defined in soundconstants.js registers all sounds.
// - GameAudioManager exposes simple playSound(name, options) used by Game and others.

class GameAudioManager {
    constructor(actionAudioManager) {
        // Use the engine-level audio manager that App already constructs.
        this.audio = actionAudioManager;

        // Register all game sounds in one place.
        // setupGameSounds is defined globally in game/soundconstants.js.
        setupGameSounds(this.audio);
    }

    /**
     * Play a logical game sound by id.
     * Callers just pass the sound name; this delegates to ActionAudioManager.
     *
     * @param {string} soundName
     * @param {object} options
     */
    playSound(soundName, options) {
        if (!this.audio) {
            console.warn("[GameAudioManager] Missing audio instance for playSound:", soundName);
            return;
        }
        this.audio.play(soundName, options || {});
    }
}

/**
 * Pill Panic Audio Manager
 * Handles all sound setup and playback for Pill Panic game
 * Extracted from original implementation
 */
class PillPanicAudioManager {
    constructor(actionEngineAudio) {
        this.audio = actionEngineAudio;
        this.setupSounds();
    }

    setupSounds() {
        // Capsule rotation - quick chirp
        this.audio.createSweepSound("pill_panic_rotate", {
            startFreq: 600,
            endFreq: 900,
            type: "sine",
            duration: 0.08,
            envelope: { attack: 0.01, decay: 0.07, sustain: 0, release: 0 }
        });

        // Capsule movement - subtle tick
        this.audio.createSweepSound("pill_panic_move", {
            startFreq: 400,
            endFreq: 450,
            type: "triangle",
            duration: 0.05,
            envelope: { attack: 0.01, decay: 0.04, sustain: 0, release: 0 }
        });

        // Capsule lock/land - satisfying FM impact
        this.audio.createFMSound("pill_panic_land", {
            carrierFreq: 150,
            modulatorFreq: 75,
            modulationIndex: 20,
            type: "sine",
            duration: 0.2,
            envelope: { attack: 0.005, decay: 0.15, sustain: 0, release: 0.05 }
        });

        // Match found - ascending tone
        this.audio.createComplexSound("pill_panic_match", {
            frequencies: [440, 554, 659],
            types: ["sine", "sine", "triangle"],
            mix: [0.4, 0.3, 0.3],
            duration: 0.4,
            envelope: { attack: 0.02, decay: 0.15, sustain: 0.2, release: 0.23 }
        });

        // Virus eliminated - special sparkle
        this.audio.createFMSound("pill_panic_virus_clear", {
            carrierFreq: 880,
            modulatorFreq: 440,
            modulationIndex: 60,
            type: "sine",
            duration: 0.5,
            envelope: { attack: 0.02, decay: 0.2, sustain: 0.2, release: 0.28 }
        });

        // Chain reaction - excitement builds
        this.audio.createSweepSound("pill_panic_chain", {
            startFreq: 440,
            endFreq: 880,
            type: "square",
            duration: 0.3,
            envelope: { attack: 0.01, decay: 0.1, sustain: 0.15, release: 0.14 }
        });

        // Victory fanfare
        this.audio.createComplexSound("pill_panic_victory", {
            frequencies: [523, 659, 784, 1047],
            types: ["sine", "sine", "sine", "triangle"],
            mix: [0.3, 0.3, 0.2, 0.2],
            duration: 1.5,
            envelope: { attack: 0.1, decay: 0.4, sustain: 0.6, release: 0.9 }
        });

        // Game over - descending sweep
        this.audio.createSweepSound("pill_panic_game_over", {
            startFreq: 440,
            endFreq: 110,
            type: "sawtooth",
            duration: 1.0,
            envelope: { attack: 0.05, decay: 0.3, sustain: 0.4, release: 0.65 }
        });

        // Menu sounds reuse Tetris sounds for consistency
    }

    // Convenience methods for playing Pill Panic sounds
    playRotate(options = {}) {
        this.audio.play("pill_panic_rotate");
    }

    playMove(options = {}) {
        this.audio.play("pill_panic_move");
    }

    playLand(options = {}) {
        this.audio.play("pill_panic_land");
    }

    playMatch(options = {}) {
        this.audio.play("pill_panic_match");
    }

    playVirusClear(options = {}) {
        this.audio.play("pill_panic_virus_clear");
    }

    playChain(options = {}) {
        this.audio.play("pill_panic_chain");
    }

    playVictory(options = {}) {
        this.audio.play("pill_panic_victory");
    }

    playGameOver(options = {}) {
        this.audio.play("pill_panic_game_over");
    }

    // For menu sounds, delegate to Tetris sounds for consistency
    playMenuNavigate() {
        this.audio.play("menu_navigate");
    }

    playMenuConfirm() {
        this.audio.play("menu_confirm");
    }

    playMenuBack() {
        this.audio.play("menu_back");
    }
}

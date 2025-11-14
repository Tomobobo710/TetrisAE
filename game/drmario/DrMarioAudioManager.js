/**
 * Dr. Mario Audio Manager
 * Handles all sound setup and playback for Dr. Mario game
 * Extracted from original implementation
 */
class DrMarioAudioManager {
    constructor(actionEngineAudio) {
        this.audio = actionEngineAudio;
        this.setupSounds();
    }

    setupSounds() {
        // Capsule rotation - quick chirp
        this.audio.createSweepSound("dr_mario_rotate", {
            startFreq: 600,
            endFreq: 900,
            type: "sine",
            duration: 0.08,
            envelope: { attack: 0.01, decay: 0.07, sustain: 0, release: 0 }
        });

        // Capsule movement - subtle tick
        this.audio.createSweepSound("dr_mario_move", {
            startFreq: 400,
            endFreq: 450,
            type: "triangle",
            duration: 0.05,
            envelope: { attack: 0.01, decay: 0.04, sustain: 0, release: 0 }
        });

        // Capsule lock/land - soft thud
        this.audio.createNoiseSound("dr_mario_land", {
            noiseType: "brown",
            duration: 0.15,
            envelope: { attack: 0.01, decay: 0.14, sustain: 0, release: 0 },
            filterOptions: { frequency: 200, Q: 2, type: "lowpass" }
        });

        // Match found - ascending tone
        this.audio.createComplexSound("dr_mario_match", {
            frequencies: [440, 554, 659],
            types: ["sine", "sine", "triangle"],
            mix: [0.4, 0.3, 0.3],
            duration: 0.4,
            envelope: { attack: 0.02, decay: 0.15, sustain: 0.2, release: 0.23 }
        });

        // Virus eliminated - special sparkle
        this.audio.createFMSound("dr_mario_virus_clear", {
            carrierFreq: 880,
            modulatorFreq: 440,
            modulationIndex: 60,
            type: "sine",
            duration: 0.5,
            envelope: { attack: 0.02, decay: 0.2, sustain: 0.2, release: 0.28 }
        });

        // Chain reaction - excitement builds
        this.audio.createSweepSound("dr_mario_chain", {
            startFreq: 440,
            endFreq: 880,
            type: "square",
            duration: 0.3,
            envelope: { attack: 0.01, decay: 0.1, sustain: 0.15, release: 0.14 }
        });

        // Victory fanfare
        this.audio.createComplexSound("dr_mario_victory", {
            frequencies: [523, 659, 784, 1047],
            types: ["sine", "sine", "sine", "triangle"],
            mix: [0.3, 0.3, 0.2, 0.2],
            duration: 1.5,
            envelope: { attack: 0.1, decay: 0.4, sustain: 0.6, release: 0.9 }
        });

        // Game over - descending sweep
        this.audio.createSweepSound("dr_mario_game_over", {
            startFreq: 440,
            endFreq: 110,
            type: "sawtooth",
            duration: 1.0,
            envelope: { attack: 0.05, decay: 0.3, sustain: 0.4, release: 0.65 }
        });

        // Menu sounds reuse Tetris sounds for consistency
    }

    // Convenience methods for playing Dr. Mario sounds
    playRotate(options = {}) {
        this.audio.play("dr_mario_rotate", { volume: 0.3, ...options });
    }

    playMove(options = {}) {
        this.audio.play("dr_mario_move", { volume: 0.2, ...options });
    }

    playLand(options = {}) {
        this.audio.play("dr_mario_land", { volume: 0.3, ...options });
    }

    playMatch(options = {}) {
        this.audio.play("dr_mario_match", { volume: 0.4, ...options });
    }

    playVirusClear(options = {}) {
        this.audio.play("dr_mario_virus_clear", { volume: 0.5, ...options });
    }

    playChain(options = {}) {
        this.audio.play("dr_mario_chain", { volume: 0.3, ...options });
    }

    playVictory(options = {}) {
        this.audio.play("dr_mario_victory", { volume: 0.6, ...options });
    }

    playGameOver(options = {}) {
        this.audio.play("dr_mario_game_over", { volume: 0.5, ...options });
    }

    // For menu sounds, delegate to Tetris sounds for consistency
    playMenuNavigate() {
        this.audio.play("menu_navigate", { volume: 0.4 });
    }

    playMenuConfirm() {
        this.audio.play("menu_confirm", { volume: 0.5 });
    }

    playMenuBack() {
        this.audio.play("menu_back", { volume: 0.4 });
    }
}

// game/soundconstants.js
// Define all game sounds in one place in the same simple/global style as the rest of the codebase.
// This file both declares the IDs and registers them on a shared ActionAudioManager instance.

/**
 * Initialize all Tetris game sounds on the provided audio manager.
 * @param {ActionAudioManager} audio
 */
function setupGameSounds(audio) {
    if (!audio) {
        console.error("[soundconstants] setupGameSounds called without audio");
        return;
    }

    /***** Core gameplay SFX *****/
    audio.createSweepSound("move", {
        startFreq: 400,
        endFreq: 500,
        type: "square",
        duration: 0.05,
        envelope: { attack: 0.01, decay: 0.04, sustain: 0, release: 0 }
    });

    audio.createSweepSound("rotate", {
        startFreq: 600,
        endFreq: 800,
        type: "triangle",
        duration: 0.08,
        envelope: { attack: 0.01, decay: 0.07, sustain: 0, release: 0 }
    });

    audio.createComplexSound("lock", {
        frequencies: [300, 400, 500],
        types: ["square", "triangle", "sine"],
        mix: [0.4, 0.3, 0.3],
        duration: 0.15,
        envelope: { attack: 0.01, decay: 0.14, sustain: 0, release: 0 }
    });

    audio.createSweepSound("hard_drop", {
        startFreq: 150,
        endFreq: 50,
        type: "square",
        duration: 0.4,
        envelope: { attack: 0.01, decay: 0.39, sustain: 0, release: 0 }
    });

    audio.createComplexSound("line_clear", {
        frequencies: [440, 660, 880],
        types: ["sawtooth", "square", "sine"],
        mix: [0.35, 0.25, 0.4],
        duration: 0.35,
        envelope: {
            attack: 0.005,
            decay: 0.18,
            sustain: 0.15,
            release: 0.12
        }
    });

    audio.createComplexSound("tetris", {
        frequencies: [
            220, // A3
            440,
            554.37, // A4, C#5
            659.25,
            880, // E5, A5
            1318.51 // E6
        ],
        types: ["square", "sawtooth", "square", "triangle", "sine", "sine"],
        mix: [0.32, 0.18, 0.16, 0.14, 0.12, 0.08],
        duration: 1.1,
        envelope: {
            attack: 0.004,
            decay: 0.28,
            sustain: 0.22,
            release: 0.24
        }
    });

    audio.createFMSound("hold", {
        carrierFreq: 440,
        modulatorFreq: 220,
        modulationIndex: 50,
        type: "sine",
        duration: 0.15,
        envelope: { attack: 0.02, decay: 0.13, sustain: 0, release: 0 }
    });

    audio.createSweepSound("hold_failed", {
        startFreq: 300,
        endFreq: 200,
        type: "triangle",
        duration: 0.12,
        envelope: { attack: 0.01, decay: 0.11, sustain: 0, release: 0 }
    });

    // Level up (Sonic Pi style sequence)
    audio.createSound(
        "level_up",
        {
            type: "sonicpi",
            script: `
        use_bpm 100
        
        # Hit 1: C5
        sample :lvl_up_piano, note: 72, amp: 0.10
        sample :lvl_up_pad,   note: 72, amp: 0.06
        sleep 0.10
        
        # Hit 2: E5
        sample :lvl_up_piano, note: 76, amp: 0.10
        sample :lvl_up_pad,   note: 76, amp: 0.06
        sleep 0.10
        
        # Hit 3: G5
        sample :lvl_up_piano, note: 79, amp: 0.11
        sample :lvl_up_pad,   note: 79, amp: 0.07
        `,
            samples: {
                lvl_up_piano: {
                    soundType: "midi",
                    instrument: "kalimba",
                    amp: 0.1
                },
                lvl_up_pad: {
                    soundType: "midi",
                    instrument: "pad_1_new_age",
                    amp: 0.06
                }
            }
        },
        "sonicpi"
    );

    audio.createFMSound("game_over", {
        carrierFreq: 220,
        modulatorFreq: 110,
        modulationIndex: 100,
        type: "triangle",
        duration: 1.5,
        envelope: { attack: 0.1, decay: 0.4, sustain: 0.6, release: 0.9 }
    });

    /***** Menu / UI SFX *****/
    audio.createSound(
        "menu_navigate",
        {
            type: "sonicpi",
            script: `
            use_bpm 260

            with_fx :echo, phase: 0.04, decay: 0.12 do
            play 55, amp: 0.26, attack: 0.003, release: 0.06   # G3
            play 67, amp: 0.18, attack: 0.003, release: 0.06   # G4 soft harmonic
            end
        `,
            samples: {}
        },
        "sonicpi"
    );

    audio.createSound(
        "menu_confirm",
        {
            type: "sonicpi",
            script: `
            use_bpm 220

            with_fx :wobble, phase: 6 do
            with_fx :echo, phase: 0.06, decay: 0.15 do
                play 60, amp: 0.32, attack: 0.005, release: 0.10   # C4
                sleep 0.06
                play 64, amp: 0.30, attack: 0.005, release: 0.10   # E4
                sleep 0.06
                play 67, amp: 0.38, attack: 0.005, release: 0.12   # G4 accent
            end
            end
        `,
            samples: {}
        },
        "sonicpi"
    );

    audio.createSound(
        "menu_back",
        {
            type: "sonicpi",
            script: `
            use_bpm 220

            with_fx :echo, phase: 0.05, decay: 0.12 do
            play 67, amp: 0.26, attack: 0.003, release: 0.07   # G4
            sleep 0.05
            play 62, amp: 0.22, attack: 0.003, release: 0.09   # D4 downstep
            end
        `,
            samples: {}
        },
        "sonicpi"
    );

    audio.createFMSound("menu_toggle", {
        carrierFreq: 180,
        modulatorFreq: 360,
        modulationIndex: 65,
        type: "square",
        duration: 0.09,
        envelope: {
            attack: 0.001,
            decay: 0.06,
            sustain: 0.0,
            release: 0.02
        }
    });

    audio.createComplexSound("change_theme", {
        frequencies: [330, 660, 990],
        types: ["sine", "triangle", "sine"],
        mix: [0.35, 0.45, 0.2],
        duration: 0.16,
        envelope: {
            attack: 0.005,
            decay: 0.1,
            sustain: 0.0,
            release: 0.05
        }
    });

    // Global output level (matches previous behavior)
    audio.setVolume(0.7);
}

/******* Logical sound IDs *******/
const GAME_SOUNDS = {
    MOVE: "move",
    ROTATE: "rotate",
    LOCK: "lock",
    HARD_DROP: "hard_drop",
    LINE_CLEAR: "line_clear",
    TETRIS: "tetris",
    HOLD: "hold",
    HOLD_FAILED: "hold_failed",
    LEVEL_UP: "level_up",
    GAME_OVER: "game_over",
    VICTORY: "victory",

    MENU_NAVIGATE: "menu_navigate",
    MENU_CONFIRM: "menu_confirm",
    MENU_BACK: "menu_back",
    MENU_TOGGLE: "menu_toggle",
    CHANGE_THEME: "change_theme"
};

/**
 * GameplayInputManager - Handles Tetris gameplay input and DAS logic
 * Extracted from InputHandler.js to reduce complexity
 */
class GameplayInputManager {
    constructor(game, input) {
        this.game = game;
        this.input = input;
        this.rotateDelay = 150; // ms between rotations
        
        // Custom controls adapter (will be set during initialization)
        this.customInput = null;
    }
    
    /**
     * Set the custom controls adapter
     */
    setCustomControlsAdapter(adapter) {
        this.customInput = adapter;
        console.log('[GameplayInputManager] Custom controls adapter set');
    }

    /**
     * Handle multiplayer gameplay input using the new player-based architecture
     */
    handleMultiplayerGameplayInput(deltaTime) {
        const gm = this.game.gameManager;
        const playerCount = gm.players.length;

        // Handle input for each player based on their assigned input device
        gm.players.forEach((player) => {
            this.handlePlayerInput(player, deltaTime, playerCount);
        });
    }

    /**
     * Handle input for a specific player
     */
    handlePlayerInput(player, deltaTime, playerCount) {
        // Skip input handling for CPU players
        if (player.thinkingTimer !== undefined) {
            return; // This is a CPU player, skip input handling
        }

        // Skip input handling for remote player in online multiplayer
        if (
            (this.game.gameState === "onlineMultiplayer" || this.game.gameState === "onlineMultiplayerPaused") &&
            player.playerNumber === 2
        ) {
            return; // This is a remote player, controlled by network
        }

        // Skip input handling for local player when paused in online multiplayer
        if (this.game.gameState === "onlineMultiplayerPaused" && player.playerNumber === 1) {
            return; // Local player can't control their pieces when paused (menu blocks input)
        }

        if (!player.currentPiece || player.gameOver) return;

        // Get the input device assigned to this player
        const inputDevice = this.getPlayerInputDevice(player.playerNumber);

        // Handle hold input
        if (this.isHoldInputPressed(inputDevice, player.playerNumber)) {
            const heldPiece = player.holdPiece();
            if (heldPiece !== null) {
                this.game.playSound("hold");
            } else {
                this.game.playSound("hold_failed");
            }
        }

        // Handle target cycle input (3-4 player modes only, minimal: one button per player)
        // This does NOT apply to 1P vs CPU, 2P, or any non-3/4P modes.
        if (playerCount >= 3 && playerCount <= 4) {
            if (this.isTargetCycleInputPressed(inputDevice, player.playerNumber)) {
                if (this.game.gameManager && typeof this.game.gameManager.cyclePlayerTarget === "function") {
                    this.game.gameManager.cyclePlayerTarget(player.playerNumber);
                }
            }
        }

        // Handle hard drop input
        if (this.isHardDropInputPressed(inputDevice, player.playerNumber)) {
            const hardDropResult = player.hardDrop();
            if (hardDropResult !== null) {
                this.game.playSound("hard_drop", { volume: 0.5 });
            }
            return;
        }

        // Handle rotation input
        const currentTime = performance.now();
        if (currentTime - player.lastRotateTime > this.rotateDelay) {
            const rotateDirection = this.getRotateInput(inputDevice, player.playerNumber);
            if (rotateDirection !== 0) {
                if (player.rotatePiece(rotateDirection)) {
                    player.lastRotateTime = currentTime;
                    this.game.playSound("rotate");
                }
            }
        }

        // Handle soft drop input
        if (this.isSoftDropInputPressed(inputDevice, player.playerNumber)) {
            if (player.softDrop()) {
                // Soft drop sound could be added here if desired
            }
        }

        // Handle movement input (DAS)
        const moveDirection = this.getMoveInput(inputDevice, player.playerNumber);
        if (moveDirection !== 0) {
            this.handlePlayerMovement(player, moveDirection, deltaTime);
        } else {
            // Reset DAS when no movement input
            player.dasActive = false;
            player.dasTimer = 0;
        }
    }

    /**
     * Handle movement with DAS for a specific player
     */
    handlePlayerMovement(player, direction, deltaTime) {
        if (!player.dasActive || player.dasDirection !== direction) {
            if (player.movePiece(direction)) {
                this.game.playSound("move");
            }
            player.dasTimer = 0;
            player.dasActive = true;
            player.dasDirection = direction;
        } else {
            player.dasTimer += deltaTime * 1000;
            if (player.dasTimer >= TETRIS.TIMING.DAS_DELAY) {
                const dasProgress = player.dasTimer - TETRIS.TIMING.DAS_DELAY;
                const moves = Math.floor(dasProgress / TETRIS.TIMING.DAS_SPEED);
                if (moves > 0) {
                    if (player.movePiece(direction)) {
                        this.game.playSound("move");
                    }
                    player.dasTimer = TETRIS.TIMING.DAS_DELAY + (dasProgress % TETRIS.TIMING.DAS_SPEED);
                }
            }
        }
    }

    /**
     * Get the input device configuration for a player
     */
    getPlayerInputDevice(playerNumber) {
        // Fixed mapping: Controller0 -> Player 1, Controller1 -> Player 2, etc.
        const inputDevices = [
            { type: "gamepad", gamepadIndex: 0 }, // Player 1: Gamepad 0 (Controller0)
            { type: "gamepad", gamepadIndex: 1 }, // Player 2: Gamepad 1 (Controller1)
            { type: "gamepad", gamepadIndex: 2 }, // Player 3: Gamepad 2 (Controller2)
            { type: "gamepad", gamepadIndex: 3 } // Player 4: Gamepad 3 (Controller3)
        ];

        return inputDevices[playerNumber - 1] || inputDevices[0];
    }

    /**
     * Check if hold input is pressed for the given input device
     */
    isHoldInputPressed(inputDevice, playerNumber) {
        // For Player 1, use custom controls if available
        if (playerNumber === 1 && this.customInput) {
            return this.customInput.isActionJustPressed('hold');
        }
        
        // Fallback to original logic for other players or when custom controls not available
        const keyboardPressed =
            playerNumber === 1 && (this.input.isKeyJustPressed("Action3") || this.input.isKeyJustPressed("Action5"));

        // Also check assigned gamepad if available
        let gamepadPressed = false;
        if (inputDevice.type === "gamepad" && this.input.isGamepadConnected(inputDevice.gamepadIndex)) {
            gamepadPressed =
                this.input.isGamepadButtonJustPressed(4, inputDevice.gamepadIndex) || // L1/Left bumper
                this.input.isGamepadButtonJustPressed(5, inputDevice.gamepadIndex); // R1/Right bumper
        }

        return keyboardPressed || gamepadPressed;
    }

    /**
     * Check if hard drop input is pressed for the given input device
     */
    isHardDropInputPressed(inputDevice, playerNumber) {
        // For Player 1, use custom controls if available
        if (playerNumber === 1 && this.customInput) {
            return this.customInput.isActionJustPressed('hardDrop');
        }
        
        // Fallback to original logic for other players or when custom controls not available
        const keyboardPressed = playerNumber === 1 && this.input.isKeyJustPressed("DirUp");

        // Also check assigned gamepad if available
        let gamepadPressed = false;
        if (inputDevice.type === "gamepad" && this.input.isGamepadConnected(inputDevice.gamepadIndex)) {
            gamepadPressed = this.input.isGamepadButtonJustPressed(12, inputDevice.gamepadIndex); // D-pad up
        }

        return keyboardPressed || gamepadPressed;
    }

    /**
     * Get rotation input for the given input device (1 for clockwise, -1 for counter-clockwise, 0 for none)
     */
    getRotateInput(inputDevice, playerNumber) {
        // For Player 1, use custom controls if available
        if (playerNumber === 1 && this.customInput) {
            if (this.customInput.isActionJustPressed('rotateCW')) return 1;
            if (this.customInput.isActionJustPressed('rotateCCW')) return -1;
            return 0;
        }
        
        // Fallback to original logic for other players or when custom controls not available
        if (playerNumber === 1) {
            if (this.input.isKeyJustPressed("Action1")) return 1; // A/Cross - clockwise
            if (this.input.isKeyJustPressed("Action2")) return -1; // B/Circle - counter-clockwise
        }

        // Also check assigned gamepad if available
        if (inputDevice.type === "gamepad" && this.input.isGamepadConnected(inputDevice.gamepadIndex)) {
            if (this.input.isGamepadButtonJustPressed(0, inputDevice.gamepadIndex)) return 1; // A/Cross - clockwise
            if (this.input.isGamepadButtonJustPressed(1, inputDevice.gamepadIndex)) return -1; // B/Circle - counter-clockwise
        }

        return 0;
    }

    /**
     * Check if soft drop input is pressed for the given input device
     */
    isSoftDropInputPressed(inputDevice, playerNumber) {
        // For Player 1, use custom controls if available
        if (playerNumber === 1 && this.customInput) {
            return this.customInput.isActionPressed('softDrop');
        }
        
        // Fallback to original logic for other players or when custom controls not available
        const keyboardPressed = playerNumber === 1 && this.input.isKeyPressed("DirDown");

        // Also check assigned gamepad if available
        let gamepadPressed = false;
        if (inputDevice.type === "gamepad" && this.input.isGamepadConnected(inputDevice.gamepadIndex)) {
            gamepadPressed = this.input.isGamepadButtonPressed(13, inputDevice.gamepadIndex); // D-pad down
        }

        return keyboardPressed || gamepadPressed;
    }

    /**
     * Get movement input for the given input device (-1 for left, 1 for right, 0 for none)
     */
    getMoveInput(inputDevice, playerNumber) {
        // For Player 1, use custom controls if available
        if (playerNumber === 1 && this.customInput) {
            const leftPressed = this.customInput.isActionPressed('moveLeft');
            const rightPressed = this.customInput.isActionPressed('moveRight');
            if (leftPressed && !rightPressed) return -1;
            if (rightPressed && !leftPressed) return 1;
            return 0;
        }
        
        // Fallback to original logic for other players or when custom controls not available
        if (playerNumber === 1) {
            const keyboardLeftPressed = this.input.isKeyPressed("DirLeft");
            const keyboardRightPressed = this.input.isKeyPressed("DirRight");
            if (keyboardLeftPressed && !keyboardRightPressed) return -1;
            if (keyboardRightPressed && !keyboardLeftPressed) return 1;
        }

        // Also check assigned gamepad if available
        if (inputDevice.type === "gamepad" && this.input.isGamepadConnected(inputDevice.gamepadIndex)) {
            const gamepadLeftPressed = this.input.isGamepadButtonPressed(14, inputDevice.gamepadIndex); // D-pad left
            const gamepadRightPressed = this.input.isGamepadButtonPressed(15, inputDevice.gamepadIndex); // D-pad right
            if (gamepadLeftPressed && !gamepadRightPressed) return -1;
            if (gamepadRightPressed && !gamepadLeftPressed) return 1;
        }

        return 0;
    }

    /**
     * Handle single-player gameplay input (fallback for old architecture)
     */
    handleSinglePlayerGameplayInput(deltaTime) {
        // Fallback to the original player 1 input logic for backward compatibility
        if (this.game.currentPiece) {
            // Get active gamepad for single-player (any connected gamepad)
            const activeGamepadIndex = this.getActiveGamepadIndex();

            // Hold piece (keyboard + active gamepad L1 and R1 bumpers)
            if (
                this.input.isKeyJustPressed("Action3") ||
                this.input.isKeyJustPressed("Action5") ||
                (activeGamepadIndex !== -1 && this.input.isGamepadButtonJustPressed(4, activeGamepadIndex)) || // L1/Left bumper
                (activeGamepadIndex !== -1 && this.input.isGamepadButtonJustPressed(5, activeGamepadIndex))
            ) {
                // R1/Right bumper
                this.game.holdCurrentPiece();
            }

            // Hard drop (keyboard + active gamepad)
            if (
                this.input.isKeyJustPressed("DirUp") ||
                (activeGamepadIndex !== -1 && this.input.isGamepadButtonJustPressed(12, activeGamepadIndex))
            ) {
                this.game.hardDrop();
                return;
            }

            const currentTime = performance.now();
            if (currentTime - this.lastRotateTime > this.rotateDelay) {
                // Rotate clockwise (keyboard + active gamepad A/Cross button)
                if (
                    this.input.isKeyJustPressed("Action1") ||
                    (activeGamepadIndex !== -1 && this.input.isGamepadButtonJustPressed(0, activeGamepadIndex))
                ) {
                    this.game.rotatePiece(1);
                    this.lastRotateTime = currentTime;
                    // Rotate counter-clockwise (keyboard + active gamepad B/Circle button)
                } else if (
                    this.input.isKeyJustPressed("Action2") ||
                    (activeGamepadIndex !== -1 && this.input.isGamepadButtonJustPressed(1, activeGamepadIndex))
                ) {
                    this.game.rotatePiece(-1);
                    this.lastRotateTime = currentTime;
                }
            }

            // Soft drop (keyboard + active gamepad)
            if (
                this.input.isKeyPressed("DirDown") ||
                (activeGamepadIndex !== -1 && this.input.isGamepadButtonPressed(13, activeGamepadIndex))
            ) {
                this.game.softDrop();
            }

            // Movement (keyboard + active gamepad)
            const leftPressed =
                this.input.isKeyPressed("DirLeft") ||
                (activeGamepadIndex !== -1 && this.input.isGamepadButtonPressed(14, activeGamepadIndex));
            const rightPressed =
                this.input.isKeyPressed("DirRight") ||
                (activeGamepadIndex !== -1 && this.input.isGamepadButtonPressed(15, activeGamepadIndex));

            if (leftPressed || rightPressed) {
                const direction = leftPressed ? -1 : 1;

                if (!this.dasActive || this.dasDirection !== direction) {
                    this.game.movePiece(direction);
                    this.dasTimer = 0;
                    this.dasActive = true;
                    this.dasDirection = direction;
                } else {
                    this.dasTimer += deltaTime * 1000;
                    if (this.dasTimer >= TETRIS.TIMING.DAS_DELAY) {
                        const dasProgress = this.dasTimer - TETRIS.TIMING.DAS_DELAY;
                        const moves = Math.floor(dasProgress / TETRIS.TIMING.DAS_SPEED);
                        if (moves > 0) {
                            this.game.movePiece(direction);
                            this.dasTimer = TETRIS.TIMING.DAS_DELAY + (dasProgress % TETRIS.TIMING.DAS_SPEED);
                        }
                    }
                }
            } else {
                this.dasActive = false;
                this.dasTimer = 0;
            }
        }
    }

    /**
     * Get the index of the first connected gamepad that has active input
     * Returns -1 if no gamepad is active
     */
    getActiveGamepadIndex() {
        for (let i = 0; i < 4; i++) {
            // Check up to 4 gamepads
            if (this.input.isGamepadConnected(i)) {
                // Check if any button is pressed
                for (let button = 0; button < 16; button++) {
                    if (this.input.isGamepadButtonPressed(button, i)) {
                        return i;
                    }
                }
            }
        }
        return -1; // No active gamepad found
    }

    /**
     * Check if target-cycle input is pressed for this player.
     *
     * Mapping:
     *  - Keyboard: Player 1 uses Action3 (separate from global theme Action4).
     *  - Gamepad: Assigned gamepad uses button index 2 (X / Square style).
     * Only active meaningfully in 3-4P modes (call sites already guard by player count).
     */
    isTargetCycleInputPressed(inputDevice, playerNumber) {
        // For Player 1, use custom controls if available
        if (playerNumber === 1 && this.customInput) {
            return this.customInput.isActionJustPressed('targetSelect');
        }
        
        // Fallback to original logic
        let keyboardPressed = false;

        // Only allow keyboard-based target cycling for Player 1 to avoid conflicts.
        if (playerNumber === 1) {
            if (this.input.isKeyJustPressed("Action3")) {
                keyboardPressed = true;
            }
        }

        let gamepadPressed = false;
        if (inputDevice.type === "gamepad" && this.input.isGamepadConnected(inputDevice.gamepadIndex)) {
            // Use a distinct button from theme-cycling (which uses button 2).
            // Here we choose button 3 (commonly Y / Triangle) for target swap.
            gamepadPressed = this.input.isGamepadButtonJustPressed(3, inputDevice.gamepadIndex);
        }

        return keyboardPressed || gamepadPressed;
    }
}

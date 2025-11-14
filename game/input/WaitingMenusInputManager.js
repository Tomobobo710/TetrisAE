/**
 * WaitingMenusInputManager - Handles input for waiting/lobby menus in multiplayer
 * Extracted from InputHandler.js to reduce complexity
 */
class WaitingMenusInputManager {
    constructor(game, input) {
        this.game = game;
        this.input = input;
    }

    /**
     * Handle opponent disconnected menu input
     */
    handleOpponentDisconnectedInput() {
        if (!this.game.opponentDisconnectedMenu.buttonsRegistered) {
            this.registerOpponentDisconnectedMenuButtons();
        }

        const menu = this.game.opponentDisconnectedMenu;
        const maxIndex = menu.buttons.length - 1;

        // Check for mouse clicks
        for (let i = 0; i < menu.buttons.length; i++) {
            if (this.input.isElementJustPressed(`opponent_disconnected_button_${i}`)) {
                const selectedButton = menu.buttons[i];
                this.executeOpponentDisconnectedMenuAction(selectedButton.action);
                return;
            }
        }

        // Check for mouse hover
        for (let i = 0; i < menu.buttons.length; i++) {
            if (this.input && this.input.isElementHovered(`opponent_disconnected_button_${i}`)) {
                if (menu.selectedIndex !== i) {
                    menu.selectedIndex = i;
                    this.game.playSound("menu_navigate");
                }
                break;
            }
        }

        // Navigation
        if (
            this.input.isKeyJustPressed("DirUp") ||
            this.input.isGamepadButtonJustPressed(12, 0) ||
            this.input.isGamepadButtonJustPressed(12, 1) ||
            this.input.isGamepadButtonJustPressed(12, 2) ||
            this.input.isGamepadButtonJustPressed(12, 3)
        ) {
            menu.selectedIndex = Math.max(0, menu.selectedIndex - 1);
            this.game.playSound("menu_navigate");
        }

        if (
            this.input.isKeyJustPressed("DirDown") ||
            this.input.isGamepadButtonJustPressed(13, 0) ||
            this.input.isGamepadButtonJustPressed(13, 1) ||
            this.input.isGamepadButtonJustPressed(13, 2) ||
            this.input.isGamepadButtonJustPressed(13, 3)
        ) {
            menu.selectedIndex = Math.min(maxIndex, menu.selectedIndex + 1);
            this.game.playSound("menu_navigate");
        }

        // Confirm selection
        if (
            this.input.isKeyJustPressed("Action1") ||
            this.input.isGamepadButtonJustPressed(0, 0) ||
            this.input.isGamepadButtonJustPressed(0, 1) ||
            this.input.isGamepadButtonJustPressed(0, 2) ||
            this.input.isGamepadButtonJustPressed(0, 3)
        ) {
            const selectedButton = menu.buttons[menu.selectedIndex];
            this.executeOpponentDisconnectedMenuAction(selectedButton.action);
        }
    }

    /**
     * Execute opponent disconnected menu actions
     */
    executeOpponentDisconnectedMenuAction(action) {
        switch (action) {
            case "continue":
                // Continue - return to waiting state
                if (this.game.networkSession) {
                    this.game.networkSession.continueAfterOpponentDisconnect();
                }
                this.unregisterOpponentDisconnectedMenuButtons();
                this.game.playSound("menu_confirm");
                break;
            case "backToLobby":
                // Leave room and return to lobby
                if (this.game.networkSession) {
                    this.game.networkSession.leave();
                    this.game.networkSession = null;
                }
                this.game.clearGameState();
                this.game.gameState = "multiplayerLogin";
                this.unregisterOpponentDisconnectedMenuButtons();
                this.game.playSound("menu_back");
                break;
        }
    }

    /**
     * Handle room shut down menu input
     */
    handleRoomShutDownInput() {
        if (!this.game.roomShutDownMenu.buttonsRegistered) {
            this.registerRoomShutDownMenuButtons();
        }

        const menu = this.game.roomShutDownMenu;

        // Check for mouse click
        if (this.input.isElementJustPressed("room_shutdown_button_0")) {
            this.executeRoomShutDownMenuAction("backToLobby");
            return;
        }

        // Check for mouse hover
        if (this.input && this.input.isElementHovered("room_shutdown_button_0")) {
            menu.selectedIndex = 0;
        }

        // Confirm selection (only one button, so any confirm works)
        if (
            this.input.isKeyJustPressed("Action1") ||
            this.input.isGamepadButtonJustPressed(0, 0) ||
            this.input.isGamepadButtonJustPressed(0, 1) ||
            this.input.isGamepadButtonJustPressed(0, 2) ||
            this.input.isGamepadButtonJustPressed(0, 3)
        ) {
            this.executeRoomShutDownMenuAction("backToLobby");
        }
    }

    /**
     * Execute room shut down menu actions
     */
    executeRoomShutDownMenuAction(action) {
        switch (action) {
            case "backToLobby":
                // Return to lobby after room shutdown
                if (this.game.networkSession) {
                    this.game.networkSession.returnToLobbyAfterShutdown();
                }
                this.unregisterRoomShutDownMenuButtons();
                this.game.playSound("menu_confirm");
                break;
        }
    }

    /**
     * Handle rematch pending menu input
     */
    handleRematchPendingInput() {
        if (!this.game.rematchPendingMenu.buttonsRegistered) {
            this.registerRematchPendingMenuButtons();

            // Snap selectedIndex to current pointer position for immediate hover feedback
            const pointer = this.input.getPointerPosition();
            const buttonWidth = 240;
            const buttonHeight = 60;
            const startY = 380; // Align with BACK TO LOBBY button
            const spacing = 75;
            for (let i = 0; i < this.game.rematchPendingMenu.buttons.length; i++) {
                const x = TETRIS.WIDTH / 2 - buttonWidth / 2;
                const y = startY + i * spacing;
                if (pointer.x >= x && pointer.x <= x + buttonWidth && pointer.y >= y && pointer.y <= y + buttonHeight) {
                    this.game.rematchPendingMenu.selectedIndex = i;
                    break;
                }
            }
        }

        const menu = this.game.rematchPendingMenu;
        const maxIndex = menu.buttons.length - 1;

        // Check for mouse clicks FIRST
        for (let i = 0; i < menu.buttons.length; i++) {
            if (this.input.isElementJustPressed(`rematch_pending_button_${i}`)) {
                const selectedButton = menu.buttons[i];
                this.executeRematchPendingMenuAction(selectedButton.action);
                return; // Consume the click and exit
            }
        }

        // Check for mouse hover - mouse overrides keyboard selection
        for (let i = 0; i < menu.buttons.length; i++) {
            if (this.input && this.input.isElementHovered(`rematch_pending_button_${i}`)) {
                if (menu.selectedIndex !== i) {
                    menu.selectedIndex = i;
                    this.game.playSound("menu_navigate");
                }
                break;
            }
        }

        // Handle left mouse click by checking pointer bounds directly (fixes first-click issue after menu switch)
        if (this.input.isLeftMouseButtonJustPressed()) {
            const pointer = this.input.getPointerPosition();
            const buttonWidth = 240;
            const buttonHeight = 60;
            const startY = 380; // Align with BACK TO LOBBY button
            const spacing = 75;
            for (let i = 0; i < menu.buttons.length; i++) {
                const x = TETRIS.WIDTH / 2 - buttonWidth / 2;
                const y = startY + i * spacing;
                if (pointer.x >= x && pointer.x <= x + buttonWidth && pointer.y >= y && pointer.y <= y + buttonHeight) {
                    const selectedButton = menu.buttons[i];
                    this.executeRematchPendingMenuAction(selectedButton.action);
                    return;
                }
            }
        }

        // Multi-device navigation - use existing API directly
        if (
            this.input.isKeyJustPressed("DirUp") ||
            this.input.isGamepadButtonJustPressed(12, 0) || // D-pad up on gamepad 0
            this.input.isGamepadButtonJustPressed(12, 1) || // D-pad up on gamepad 1
            this.input.isGamepadButtonJustPressed(12, 2) || // D-pad up on gamepad 2
            this.input.isGamepadButtonJustPressed(12, 3)
        ) {
            // D-pad up on gamepad 3
            menu.selectedIndex = Math.max(0, menu.selectedIndex - 1);
            this.game.playSound("menu_navigate");
        }

        if (
            this.input.isKeyJustPressed("DirDown") ||
            this.input.isGamepadButtonJustPressed(13, 0) || // D-pad down on gamepad 0
            this.input.isGamepadButtonJustPressed(13, 1) || // D-pad down on gamepad 1
            this.input.isGamepadButtonJustPressed(13, 2) || // D-pad down on gamepad 2
            this.input.isGamepadButtonJustPressed(13, 3)
        ) {
            // D-pad down on gamepad 3
            menu.selectedIndex = Math.min(maxIndex, menu.selectedIndex + 1);
            this.game.playSound("menu_navigate");
        }

        // Confirm selection with Action1 (A/Cross button = primary face button)
        if (
            this.input.isKeyJustPressed("Action1") ||
            this.input.isGamepadButtonJustPressed(0, 0) || // A/Cross button on gamepad 0
            this.input.isGamepadButtonJustPressed(0, 1) || // A/Cross button on gamepad 1
            this.input.isGamepadButtonJustPressed(0, 2) || // A/Cross button on gamepad 2
            this.input.isGamepadButtonJustPressed(0, 3)
        ) {
            // A/Cross button on gamepad 3
            const selectedButton = menu.buttons[menu.selectedIndex];
            this.executeRematchPendingMenuAction(selectedButton.action);
        }

        // Also allow Action2 (B/Circle button = secondary face button) to cancel
        if (
            this.input.isKeyJustPressed("Action2") ||
            this.input.isGamepadButtonJustPressed(1, 0) || // B/Circle button on gamepad 0
            this.input.isGamepadButtonJustPressed(1, 1) || // B/Circle button on gamepad 1
            this.input.isGamepadButtonJustPressed(1, 2) || // B/Circle button on gamepad 2
            this.input.isGamepadButtonJustPressed(1, 3)
        ) {
            // B/Circle button on gamepad 3
            const selectedButton = menu.buttons[menu.selectedIndex];
            this.executeRematchPendingMenuAction(selectedButton.action);
        }
    }

    /**
     * Execute rematch pending menu actions
     */
    executeRematchPendingMenuAction(action) {
        switch (action) {
            case "cancelRematch":
                // Cancel rematch through network session
                console.log("[InputHandler] Canceling rematch request...");
                this.game.networkSession.cancelRematch();
                this.game.playSound("menu_back");
                // No need to unregister buttons here, as cancelRematch will change game state
                break;
        }
    }

    /**
     * Handle waiting menu input
     */
    handleWaitingMenuInput() {
        if (!this.game.waitingMenu.buttonsRegistered) {
            this.registerWaitingMenuButtons();
        }

        const menu = this.game.waitingMenu;
        const maxIndex = menu.buttons.length - 1;

        // Check for mouse clicks FIRST
        for (let i = 0; i < menu.buttons.length; i++) {
            if (this.input.isElementJustPressed(`waiting_menu_button_${i}`)) {
                const selectedButton = menu.buttons[i];
                this.executeWaitingMenuAction(selectedButton.action);
                return; // Consume the click and exit
            }
        }

        // Check for mouse hover - mouse overrides keyboard selection
        for (let i = 0; i < menu.buttons.length; i++) {
            if (this.input && this.input.isElementHovered(`waiting_menu_button_${i}`)) {
                if (menu.selectedIndex !== i) {
                    menu.selectedIndex = i;
                    this.game.playSound("menu_navigate");
                }
                break;
            }
        }

        // Multi-device navigation - use existing API directly
        if (
            this.input.isKeyJustPressed("DirUp") ||
            this.input.isGamepadButtonJustPressed(12, 0) || // D-pad up on gamepad 0
            this.input.isGamepadButtonJustPressed(12, 1) || // D-pad up on gamepad 1
            this.input.isGamepadButtonJustPressed(12, 2) || // D-pad up on gamepad 2
            this.input.isGamepadButtonJustPressed(12, 3)
        ) {
            // D-pad up on gamepad 3
            menu.selectedIndex = Math.max(0, menu.selectedIndex - 1);
            this.game.playSound("menu_navigate");
        }

        if (
            this.input.isKeyJustPressed("DirDown") ||
            this.input.isGamepadButtonJustPressed(13, 0) || // D-pad down on gamepad 0
            this.input.isGamepadButtonJustPressed(13, 1) || // D-pad down on gamepad 1
            this.input.isGamepadButtonJustPressed(13, 2) || // D-pad down on gamepad 2
            this.input.isGamepadButtonJustPressed(13, 3)
        ) {
            // D-pad down on gamepad 3
            menu.selectedIndex = Math.min(maxIndex, menu.selectedIndex + 1);
            this.game.playSound("menu_navigate");
        }

        // Confirm selection with Action1 (A/Cross button = primary face button)
        if (
            this.input.isKeyJustPressed("Action1") ||
            this.input.isGamepadButtonJustPressed(0, 0) || // A/Cross button on gamepad 0
            this.input.isGamepadButtonJustPressed(0, 1) || // A/Cross button on gamepad 1
            this.input.isGamepadButtonJustPressed(0, 2) || // A/Cross button on gamepad 2
            this.input.isGamepadButtonJustPressed(0, 3)
        ) {
            // A/Cross button on gamepad 3
            const selectedButton = menu.buttons[menu.selectedIndex];
            this.executeWaitingMenuAction(selectedButton.action);
        }
    }

    /**
     * Execute waiting menu actions
     */
    executeWaitingMenuAction(action) {
        switch (action) {
            case "cancelWaiting":
                // Transition to canceled waiting menu and disable host waiting
                this.unregisterWaitingMenuButtons();
                this.game.gameState = "waitingCanceledMenu";
                this.game.waitingCanceledMenu.selectedIndex = 0;
                this.game.waitingCanceledMenu.buttonsRegistered = false;
                // Disable host waiting (synced to other players)
                if (this.game.networkSession) {
                    this.game.networkSession.hostWaiting = false;
                    this.game.networkSession.state = "HOST_NOT_READY";
                }
                this.game.playSound("menu_back");
                break;
        }
    }

    /**
     * Handle waiting canceled menu input
     */
    handleWaitingCanceledMenuInput() {
        if (!this.game.waitingCanceledMenu.buttonsRegistered) {
            this.registerWaitingCanceledMenuButtons();

            // Snap selectedIndex to current pointer position for immediate hover feedback
            const pointer = this.input.getPointerPosition();
            const buttonWidth = 240;
            const buttonHeight = 60;
            const startY = 300;
            const spacing = 75;
            for (let i = 0; i < this.game.waitingCanceledMenu.buttons.length; i++) {
                const x = TETRIS.WIDTH / 2 - buttonWidth / 2;
                const y = startY + i * spacing;
                if (pointer.x >= x && pointer.x <= x + buttonWidth && pointer.y >= y && pointer.y <= y + buttonHeight) {
                    this.game.waitingCanceledMenu.selectedIndex = i;
                    break;
                }
            }
        }

        const menu = this.game.waitingCanceledMenu;
        const maxIndex = menu.buttons.length - 1;

        // Check for mouse clicks FIRST
        for (let i = 0; i < menu.buttons.length; i++) {
            if (this.input.isElementJustPressed(`waiting_canceled_button_${i}`)) {
                const selectedButton = menu.buttons[i];
                this.executeWaitingCanceledMenuAction(selectedButton.action);
                return; // Consume the click and exit
            }
        }

        // Check for mouse hover - mouse overrides keyboard selection
        for (let i = 0; i < menu.buttons.length; i++) {
            if (this.input && this.input.isElementHovered(`waiting_canceled_button_${i}`)) {
                if (menu.selectedIndex !== i) {
                    menu.selectedIndex = i;
                    this.game.playSound("menu_navigate");
                }
                break;
            }
        }

        // Handle left mouse click by checking pointer bounds directly (fixes first-click issue after menu switch)
        if (this.input.isLeftMouseButtonJustPressed()) {
            const pointer = this.input.getPointerPosition();
            const buttonWidth = 240;
            const buttonHeight = 60;
            const startY = 300;
            const spacing = 75;
            for (let i = 0; i < menu.buttons.length; i++) {
                const x = TETRIS.WIDTH / 2 - buttonWidth / 2;
                const y = startY + i * spacing;
                if (pointer.x >= x && pointer.x <= x + buttonWidth && pointer.y >= y && pointer.y <= y + buttonHeight) {
                    const selectedButton = menu.buttons[i];
                    this.executeWaitingCanceledMenuAction(selectedButton.action);
                    return;
                }
            }
        }

        // Multi-device navigation - use existing API directly
        if (
            this.input.isKeyJustPressed("DirUp") ||
            this.input.isGamepadButtonJustPressed(12, 0) || // D-pad up on gamepad 0
            this.input.isGamepadButtonJustPressed(12, 1) || // D-pad up on gamepad 1
            this.input.isGamepadButtonJustPressed(12, 2) || // D-pad up on gamepad 2
            this.input.isGamepadButtonJustPressed(12, 3)
        ) {
            // D-pad up on gamepad 3
            menu.selectedIndex = Math.max(0, menu.selectedIndex - 1);
            this.game.playSound("menu_navigate");
        }

        if (
            this.input.isKeyJustPressed("DirDown") ||
            this.input.isGamepadButtonJustPressed(13, 0) || // D-pad down on gamepad 0
            this.input.isGamepadButtonJustPressed(13, 1) || // D-pad down on gamepad 1
            this.input.isGamepadButtonJustPressed(13, 2) || // D-pad down on gamepad 2
            this.input.isGamepadButtonJustPressed(13, 3)
        ) {
            // D-pad down on gamepad 3
            menu.selectedIndex = Math.min(maxIndex, menu.selectedIndex + 1);
            this.game.playSound("menu_navigate");
        }

        // Confirm selection with Action1 (A/Cross button = primary face button)
        if (
            this.input.isKeyJustPressed("Action1") ||
            this.input.isGamepadButtonJustPressed(0, 0) || // A/Cross button on gamepad 0
            this.input.isGamepadButtonJustPressed(0, 1) || // A/Cross button on gamepad 1
            this.input.isGamepadButtonJustPressed(0, 2) || // A/Cross button on gamepad 2
            this.input.isGamepadButtonJustPressed(0, 3)
        ) {
            // A/Cross button on gamepad 3
            const selectedButton = menu.buttons[menu.selectedIndex];
            this.executeWaitingCanceledMenuAction(selectedButton.action);
        }
    }

    /**
     * Execute waiting canceled menu actions
     */
    executeWaitingCanceledMenuAction(action) {
        switch (action) {
            case "keepWaiting":
                // Return to waiting menu and re-enable host waiting
                this.unregisterWaitingCanceledMenuButtons();
                this.game.gameState = "waitingMenu";
                this.game.waitingMenu.selectedIndex = 0;
                this.game.waitingMenu.buttonsRegistered = false;
                // Re-enable host waiting (synced)
                if (this.game.networkSession) {
                    this.game.networkSession.hostWaiting = true;
                    this.game.networkSession.state = "WAITING";
                }
                this.game.playSound("menu_back");
                break;
            case "returnToLobby":
                // Leave network session and return to lobby
                if (this.game.networkSession) {
                    this.game.networkSession.leave();
                    this.game.networkSession = null;
                }
                this.game.clearGameState();
                this.unregisterWaitingCanceledMenuButtons();
                this.game.gameState = "multiplayerLogin";
                this.game.playSound("menu_back");
                break;
        }
    }

    /**
     * Handle waiting for host menu input
     */
    handleWaitingForHostMenuInput() {
        if (!this.game.waitingForHostMenu.buttonsRegistered) {
            this.registerWaitingForHostMenuButtons();
        }

        const menu = this.game.waitingForHostMenu;
        const maxIndex = menu.buttons.length - 1;

        // Check for mouse clicks FIRST
        for (let i = 0; i < menu.buttons.length; i++) {
            if (this.input.isElementJustPressed(`waiting_for_host_button_${i}`)) {
                const selectedButton = menu.buttons[i];
                this.executeWaitingForHostMenuAction(selectedButton.action);
                return; // Consume the click and exit
            }
        }

        // Check for mouse hover - mouse overrides keyboard selection
        for (let i = 0; i < menu.buttons.length; i++) {
            if (this.input && this.input.isElementHovered(`waiting_for_host_button_${i}`)) {
                if (menu.selectedIndex !== i) {
                    menu.selectedIndex = i;
                    this.game.playSound("menu_navigate");
                }
                break;
            }
        }

        // Multi-device navigation - use existing API directly
        if (
            this.input.isKeyJustPressed("DirUp") ||
            this.input.isGamepadButtonJustPressed(12, 0) || // D-pad up on gamepad 0
            this.input.isGamepadButtonJustPressed(12, 1) || // D-pad up on gamepad 1
            this.input.isGamepadButtonJustPressed(12, 2) || // D-pad up on gamepad 2
            this.input.isGamepadButtonJustPressed(12, 3)
        ) {
            // D-pad up on gamepad 3
            menu.selectedIndex = Math.max(0, menu.selectedIndex - 1);
            this.game.playSound("menu_navigate");
        }

        if (
            this.input.isKeyJustPressed("DirDown") ||
            this.input.isGamepadButtonJustPressed(13, 0) || // D-pad down on gamepad 0
            this.input.isGamepadButtonJustPressed(13, 1) || // D-pad down on gamepad 1
            this.input.isGamepadButtonJustPressed(13, 2) || // D-pad down on gamepad 2
            this.input.isGamepadButtonJustPressed(13, 3)
        ) {
            // D-pad down on gamepad 3
            menu.selectedIndex = Math.min(maxIndex, menu.selectedIndex + 1);
            this.game.playSound("menu_navigate");
        }

        // Confirm selection with Action1 (A/Cross button = primary face button)
        if (
            this.input.isKeyJustPressed("Action1") ||
            this.input.isGamepadButtonJustPressed(0, 0) || // A/Cross button on gamepad 0
            this.input.isGamepadButtonJustPressed(0, 1) || // A/Cross button on gamepad 1
            this.input.isGamepadButtonJustPressed(0, 2) || // A/Cross button on gamepad 2
            this.input.isGamepadButtonJustPressed(0, 3)
        ) {
            // A/Cross button on gamepad 3
            const selectedButton = menu.buttons[menu.selectedIndex];
            this.executeWaitingForHostMenuAction(selectedButton.action);
        }
    }

    /**
     * Execute waiting for host menu actions
     */
    executeWaitingForHostMenuAction(action) {
        switch (action) {
            case "cancelJoin":
                // Leave the room since host is not ready
                if (this.game.networkSession) {
                    this.game.networkSession.leave();
                    this.game.networkSession = null;
                }
                this.game.clearGameState();
                this.unregisterWaitingForHostMenuButtons();
                this.game.gameState = "multiplayerLogin";
                this.game.playSound("menu_back");
                break;
        }
    }

    // Button registration/unregistration methods
    registerOpponentDisconnectedMenuButtons() {
        if (this.game.opponentDisconnectedMenu.buttonsRegistered) return;

        const buttonWidth = 240;
        const buttonHeight = 60;
        const startY = 300;
        const spacing = 75;

        this.game.opponentDisconnectedMenu.buttons.forEach((button, index) => {
            const x = TETRIS.WIDTH / 2 - buttonWidth / 2;
            const y = startY + index * spacing;

            this.input.registerElement(`opponent_disconnected_button_${index}`, {
                bounds: () => ({
                    x: x,
                    y: y,
                    width: buttonWidth,
                    height: buttonHeight
                })
            });
        });

        this.game.opponentDisconnectedMenu.buttonsRegistered = true;
    }

    registerRoomShutDownMenuButtons() {
        if (this.game.roomShutDownMenu.buttonsRegistered) return;

        const buttonWidth = 240;
        const buttonHeight = 60;
        const startY = 340;

        const x = TETRIS.WIDTH / 2 - buttonWidth / 2;
        const y = startY;

        this.input.registerElement("room_shutdown_button_0", {
            bounds: () => ({
                x: x,
                y: y,
                width: buttonWidth,
                height: buttonHeight
            })
        });

        this.game.roomShutDownMenu.buttonsRegistered = true;
    }

    registerRematchPendingMenuButtons() {
        if (this.game.rematchPendingMenu.buttonsRegistered) return;

        const buttonWidth = 240;
        const buttonHeight = 60;
        const startY = 380; // Align with BACK TO LOBBY button
        const spacing = 75;

        this.game.rematchPendingMenu.buttons.forEach((button, index) => {
            const x = TETRIS.WIDTH / 2 - buttonWidth / 2;
            const y = startY + index * spacing;

            this.input.registerElement(`rematch_pending_button_${index}`, {
                bounds: () => ({
                    x: x,
                    y: y,
                    width: buttonWidth,
                    height: buttonHeight
                })
            });
        });

        this.game.rematchPendingMenu.buttonsRegistered = true;
    }

    registerWaitingMenuButtons() {
        if (this.game.waitingMenu.buttonsRegistered) return;

        const buttonWidth = 240;
        const buttonHeight = 60;
        const startY = 380; // Align with rematch pending menu
        const spacing = 75;

        this.game.waitingMenu.buttons.forEach((button, index) => {
            const x = TETRIS.WIDTH / 2 - buttonWidth / 2;
            const y = startY + index * spacing;

            this.input.registerElement(`waiting_menu_button_${index}`, {
                bounds: () => ({
                    x: x,
                    y: y,
                    width: buttonWidth,
                    height: buttonHeight
                })
            });
        });

        this.game.waitingMenu.buttonsRegistered = true;
    }

    registerWaitingCanceledMenuButtons() {
        if (this.game.waitingCanceledMenu.buttonsRegistered) return;

        const buttonWidth = 240;
        const buttonHeight = 60;
        const startY = 300;
        const spacing = 75;

        this.game.waitingCanceledMenu.buttons.forEach((button, index) => {
            const x = TETRIS.WIDTH / 2 - buttonWidth / 2;
            const y = startY + index * spacing;

            this.input.registerElement(`waiting_canceled_button_${index}`, {
                bounds: () => ({
                    x: x,
                    y: y,
                    width: buttonWidth,
                    height: buttonHeight
                })
            });
        });

        this.game.waitingCanceledMenu.buttonsRegistered = true;
    }

    registerWaitingForHostMenuButtons() {
        if (this.game.waitingForHostMenu.buttonsRegistered) return;

        const buttonWidth = 240;
        const buttonHeight = 60;
        const startY = 380; // Align with other menus
        const spacing = 75;

        this.game.waitingForHostMenu.buttons.forEach((button, index) => {
            const x = TETRIS.WIDTH / 2 - buttonWidth / 2;
            const y = startY + index * spacing;

            this.input.registerElement(`waiting_for_host_button_${index}`, {
                bounds: () => ({
                    x: x,
                    y: y,
                    width: buttonWidth,
                    height: buttonHeight
                })
            });
        });

        this.game.waitingForHostMenu.buttonsRegistered = true;
    }

    unregisterOpponentDisconnectedMenuButtons() {
        if (!this.game.opponentDisconnectedMenu.buttonsRegistered) return;

        this.game.opponentDisconnectedMenu.buttons.forEach((button, index) => {
            this.input.removeElement(`opponent_disconnected_button_${index}`);
        });

        this.game.opponentDisconnectedMenu.buttonsRegistered = false;
    }

    unregisterRoomShutDownMenuButtons() {
        if (!this.game.roomShutDownMenu.buttonsRegistered) return;

        this.input.removeElement("room_shutdown_button_0");

        this.game.roomShutDownMenu.buttonsRegistered = false;
    }

    unregisterRematchPendingMenuButtons() {
        if (!this.game.rematchPendingMenu.buttonsRegistered) return;

        this.game.rematchPendingMenu.buttons.forEach((button, index) => {
            this.input.removeElement(`rematch_pending_button_${index}`);
        });

        this.game.rematchPendingMenu.buttonsRegistered = false;
    }

    unregisterWaitingMenuButtons() {
        if (!this.game.waitingMenu.buttonsRegistered) return;

        this.game.waitingMenu.buttons.forEach((button, index) => {
            this.input.removeElement(`waiting_menu_button_${index}`);
        });

        this.game.waitingMenu.buttonsRegistered = false;
    }

    unregisterWaitingCanceledMenuButtons() {
        if (!this.game.waitingCanceledMenu.buttonsRegistered) return;

        this.game.waitingCanceledMenu.buttons.forEach((button, index) => {
            this.input.removeElement(`waiting_canceled_button_${index}`);
        });

        this.game.waitingCanceledMenu.buttonsRegistered = false;
    }

    unregisterWaitingForHostMenuButtons() {
        if (!this.game.waitingForHostMenu.buttonsRegistered) return;

        this.game.waitingForHostMenu.buttons.forEach((button, index) => {
            this.input.removeElement(`waiting_for_host_button_${index}`);
        });

        this.game.waitingForHostMenu.buttonsRegistered = false;
    }
}

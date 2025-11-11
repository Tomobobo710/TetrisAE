/**
 * MenuRenderer - Handles all menu screen rendering (main, multiplayer, pause, game over)
 */
class MenuRenderer {
    constructor(ctx, utils) {
        this.ctx = ctx;
        this.utils = utils;

        // Title screen positioning constants
        this.TITLE_TEXT_Y = 200;
        this.SUBTITLE_TEXT_Y = 240;
        this.TITLE_OUTLINE_THICKNESS = 3;
        this.SUBTITLE_OUTLINE_THICKNESS = 2;
    }

    /**
     * Draw title screen
     */
    drawTitleScreen(game, theme) {
        const ctx = this.ctx;

        // Only draw title and subtitle if not in settings/multiplayer/localMultiplayer menus and not in windows
        if (
            game.menuStack.current !== "settings" &&
            game.menuStack.current !== "multiplayer" &&
            game.menuStack.current !== "localMultiplayer" &&
            !game.optionsWindow.visible &&
            !game.themesWindow.visible
        ) {
            this.utils.drawTextBackdrop(
                "TETRIS",
                TETRIS.WIDTH / 2,
                this.TITLE_TEXT_Y,
                "bold 72px Arial",
                theme.ui.text,
                theme,
                this.TITLE_OUTLINE_THICKNESS
            );
            this.utils.drawTextBackdrop(
                "ActionEngine Edition",
                TETRIS.WIDTH / 2,
                this.SUBTITLE_TEXT_Y,
                "24px Arial",
                theme.ui.accent,
                theme,
                this.SUBTITLE_OUTLINE_THICKNESS
            );
        }

        // Handle multiplayer menu rendering
        if (game.menuStack.current === "multiplayer") {
            this.drawMultiplayerMenuButtons(game, theme);
        } else if (game.menuStack.current === "localMultiplayer") {
            this.drawLocalMultiplayerMenuButtons(game, theme);
        } else if (game.menuStack.current !== "settings" && !game.optionsWindow.visible && !game.themesWindow.visible) {
            // Default to main menu
            this.drawMainMenuButtons(game, theme);

            // Draw instructions
            ctx.fillStyle = theme.ui.text;
            ctx.font = "14px Arial";
            ctx.textAlign = "center";
            ctx.globalAlpha = 0.8;

            const instructions = [
                "← / → : Move •  ↑ : Hard Drop •  ↓ : Soft Drop",
                "SpaceBar / Ⓐ / ✕ : Rotate ↻ • Shift / Ⓑ / ◯ : Rotate ↺",
                "E / Z / Ⓧ / LB / ◻ / L1: Hold Piece • Q / Ⓨ / △ : Change Theme"
            ];

            instructions.forEach((text, i) => {
                const y = TETRIS.HEIGHT - 60 + i * 20;
                this.utils.drawTextBackdrop(text, TETRIS.WIDTH / 2, y, "14px Arial", theme.ui.text, theme, 1);
            });

            ctx.globalAlpha = 1.0;
        }
    }

    /**
     * Draw main menu buttons
     */
    drawMainMenuButtons(game, theme) {
        const menu = game.mainMenu;
        const buttonWidth = 240;
        const buttonHeight = 60;
        const startY = 300;
        const spacing = 80;

        menu.buttons.forEach((button, index) => {
            const x = TETRIS.WIDTH / 2 - buttonWidth / 2;
            const y = startY + index * spacing;

            const isSelected = index === menu.selectedIndex;
            const isHovered = game.input && game.input.isElementHovered(`main_button_${index}`);
            const shouldHighlight = isHovered || isSelected;

            this.drawMenuButton(x, y, buttonWidth, buttonHeight, button.text, shouldHighlight, theme);
        });
    }

    /**
     * Draw multiplayer menu buttons
     */
    drawMultiplayerMenuButtons(game, theme) {
        const menu = game.multiplayerMenu;
        const buttonWidth = 240;
        const buttonHeight = 60;
        const startY = 220;
        const spacing = 80;

        this.utils.drawTextBackdrop("MULTIPLAYER", TETRIS.WIDTH / 2, 150, "bold 48px Arial", theme.ui.accent, theme);

        menu.buttons.forEach((button, index) => {
            const x = TETRIS.WIDTH / 2 - buttonWidth / 2;
            const y = startY + index * spacing;

            const isSelected = index === menu.selectedIndex;
            const isHovered = game.input && game.input.isElementHovered(`multiplayer_button_${index}`);
            const shouldHighlight = isHovered || isSelected;

            this.drawMenuButton(x, y, buttonWidth, buttonHeight, button.text, shouldHighlight, theme);
        });
    }

    /**
     * Draw local multiplayer menu buttons
     */
    drawLocalMultiplayerMenuButtons(game, theme) {
        const menu = game.localMultiplayerMenu;
        const buttonWidth = 240;
        const buttonHeight = 60;
        const startY = 300 + menu.positionOffset;
        const spacing = 80;

        this.utils.drawTextBackdrop("MULTIPLAYER", TETRIS.WIDTH / 2, 150, "bold 48px Arial", theme.ui.accent, theme);

        menu.buttons.forEach((button, index) => {
            const x = TETRIS.WIDTH / 2 - buttonWidth / 2;
            const y = startY + index * spacing;

            const isSelected = index === menu.selectedIndex;
            const isHovered = game.input && game.input.isElementHovered(`local_multiplayer_button_${index}`);
            const shouldHighlight = isHovered || isSelected;

            this.drawMenuButton(x, y, buttonWidth, buttonHeight, button.text, shouldHighlight, theme);
        });
    }

    /**
     * Draw pause menu
     */
    drawPauseMenu(game, theme) {
        const ctx = this.ctx;

        // Create semi-transparent overlay
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.fillRect(0, 0, TETRIS.WIDTH, TETRIS.HEIGHT);

        // Only draw pause menu if not in settings
        if (game.menuStack.current !== "settings") {
            this.utils.drawTextBackdrop("PAUSED", TETRIS.WIDTH / 2, 150, "bold 48px Arial", theme.ui.accent, theme);
            this.drawPauseMenuButtons(game, theme);
        }
    }

    /**
     * Draw pause menu buttons
     */
    drawPauseMenuButtons(game, theme) {
        const menu = game.pauseMenu;
        const buttonWidth = 240;
        const buttonHeight = 60;
        const startY = 220;
        const spacing = 80;

        menu.buttons.forEach((button, index) => {
            const x = TETRIS.WIDTH / 2 - buttonWidth / 2;
            const y = startY + index * spacing;

            const isSelected = index === menu.selectedIndex;
            const isHovered = game.input && game.input.isElementHovered(`pause_button_${index}`);
            const shouldHighlight = isHovered || isSelected;

            this.drawMenuButton(x, y, buttonWidth, buttonHeight, button.text, shouldHighlight, theme);
        });
    }

    /**
     * Draw game over overlay
     */
    drawGameOverOverlay(game, theme) {
        const ctx = this.ctx;

        ctx.save();
        ctx.globalAlpha = game.gameOverTransition.opacity;

        // Create overlay
        ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
        ctx.fillRect(0, 0, TETRIS.WIDTH, TETRIS.HEIGHT);

        const isMultiplayer = game.gameManager && game.gameManager.players.length > 1;

        if (isMultiplayer) {
            const winner = game.gameManager.winner;
            const players = game.gameManager.players || [];
            const playerCount = players.length;

            // Detect online mode via presence of an active NetworkSession
            const isOnline = !!game.networkSession;

            // Resolve winner display name (for non-online header / listings)
            let winnerName = null;
            if (winner) {
                const winnerPlayer = players.find((p) => p.playerNumber === winner);
                if (winnerPlayer) {
                    if (winnerPlayer.username) {
                        winnerName = winnerPlayer.username;
                    } else if (winnerPlayer.thinkingTimer !== undefined && winnerPlayer.difficulty) {
                        const diff = winnerPlayer.difficulty.charAt(0).toUpperCase() + winnerPlayer.difficulty.slice(1);
                        winnerName = `CPU (${diff})`;
                    } else {
                        winnerName = `Player ${winnerPlayer.playerNumber}`;
                    }
                }
            }

            // Header
            if (isOnline && winner) {
                // Online-specific messaging for local player outcome
                const localWon = winner === 1;
                const headerText = localWon ? "YOU WIN!" : "YOU LOSE!";
                const headerColor = localWon ? theme.ui.accent : theme.ui.text;
                this.utils.drawTextBackdrop(
                    headerText,
                    TETRIS.WIDTH / 2,
                    TETRIS.HEIGHT / 2 - 210,
                    "bold 60px Arial",
                    headerColor,
                    theme
                );
            } else if (winner && winnerName) {
                // Original behavior for local / CPU / non-online multiplayer
                this.utils.drawTextBackdrop(
                    `${winnerName} Wins!`,
                    TETRIS.WIDTH / 2,
                    TETRIS.HEIGHT / 2 - 210,
                    "bold 60px Arial",
                    theme.ui.accent,
                    theme
                );
            } else {
                this.utils.drawTextBackdrop(
                    "GAME OVER",
                    TETRIS.WIDTH / 2,
                    TETRIS.HEIGHT / 2 - 210,
                    "bold 60px Arial",
                    theme.ui.accent,
                    theme
                );
            }

            if (playerCount <= 2) {
                // 1-2 players: vertical stack (unchanged behavior)
                let yOffset = TETRIS.HEIGHT / 2 - 140;
                players.forEach((player) => {
                    const isWinner = winner && player.playerNumber === winner;

                    let baseName;
                    if (player.username) {
                        baseName = player.username;
                    } else if (player.thinkingTimer !== undefined && player.difficulty) {
                        const diff = player.difficulty.charAt(0).toUpperCase() + player.difficulty.slice(1);
                        baseName = `CPU (${diff})`;
                    } else {
                        baseName = `Player ${player.playerNumber}`;
                    }

                    const color = isWinner ? theme.ui.accent : theme.ui.text;
                    const label = isWinner ? `${baseName} 👑` : baseName;

                    this.utils.drawTextBackdrop(label, TETRIS.WIDTH / 2, yOffset, "bold 24px Arial", color, theme);
                    this.utils.drawTextBackdrop(
                        `Score: ${player.score} | Lines: ${player.lines}`,
                        TETRIS.WIDTH / 2,
                        yOffset + 30,
                        "20px Arial",
                        theme.ui.text,
                        theme
                    );
                    yOffset += 80;
                });
            } else {
                // 3-4 players: 2x2 grid so all players 1-4 are visible with crowns
                const columns = 2;
                const cellWidth = 260;
                const cellHeight = 90;
                const startX = TETRIS.WIDTH / 2 - cellWidth; // center two columns
                const startY = TETRIS.HEIGHT / 2 - 155; // shifted up by 15px

                players.forEach((player, index) => {
                    const col = index % columns;
                    const row = Math.floor(index / columns);

                    const xCenter = startX + col * cellWidth + cellWidth / 2;
                    const yTop = startY + row * cellHeight;

                    const isWinner = winner && player.playerNumber === winner;

                    let baseName;
                    if (player.username) {
                        baseName = player.username;
                    } else if (player.thinkingTimer !== undefined && player.difficulty) {
                        const diff = player.difficulty.charAt(0).toUpperCase() + player.difficulty.slice(1);
                        baseName = `CPU (${diff})`;
                    } else {
                        baseName = `Player ${player.playerNumber}`;
                    }

                    const color = isWinner ? theme.ui.accent : theme.ui.text;
                    const label = isWinner ? `${baseName} 👑` : baseName;

                    this.utils.drawTextBackdrop(label, xCenter, yTop, "bold 20px Arial", color, theme);
                    this.utils.drawTextBackdrop(
                        `Score: ${player.score}`,
                        xCenter,
                        yTop + 24,
                        "16px Arial",
                        theme.ui.text,
                        theme
                    );
                    this.utils.drawTextBackdrop(
                        `Lines: ${player.lines}`,
                        xCenter,
                        yTop + 46,
                        "16px Arial",
                        theme.ui.text,
                        theme
                    );
                });
            }
        } else {
            // Single-player game over screen
            this.utils.drawTextBackdrop(
                "GAME OVER",
                TETRIS.WIDTH / 2,
                TETRIS.HEIGHT / 2 - 210,
                "bold 60px Arial",
                theme.ui.accent,
                theme
            );
            this.utils.drawTextBackdrop(
                `Score: ${game.score}`,
                TETRIS.WIDTH / 2,
                TETRIS.HEIGHT / 2 - 150,
                "bold 24px Arial",
                theme.ui.text,
                theme
            );
            this.utils.drawTextBackdrop(
                `Level: ${game.level}`,
                TETRIS.WIDTH / 2,
                TETRIS.HEIGHT / 2 - 115,
                "bold 24px Arial",
                theme.ui.text,
                theme
            );
            this.utils.drawTextBackdrop(
                `Lines: ${game.lines}`,
                TETRIS.WIDTH / 2,
                TETRIS.HEIGHT / 2 - 80,
                "bold 24px Arial",
                theme.ui.text,
                theme
            );
        }

        this.drawGameOverMenuButtons(game, theme);

        ctx.restore();
    }

    /**
     * Draw game over menu buttons
     */
    drawGameOverMenuButtons(game, theme) {
        const menu = game.networkSession ? game.onlineGameOverMenu : game.gameOverMenu;
        const buttonWidth = 240;
        const buttonHeight = 60;
        const startY = 300;
        const spacing = 80;

        menu.buttons.forEach((button, index) => {
            const x = TETRIS.WIDTH / 2 - buttonWidth / 2;
            const y = startY + index * spacing;

            const isSelected = index === menu.selectedIndex;
            const isHovered = game.input && game.input.isElementHovered(`gameover_button_${index}`);
            const shouldHighlight = isHovered || isSelected;

            this.drawMenuButton(x, y, buttonWidth, buttonHeight, button.text, shouldHighlight, theme);
        });
    }

    /**
     * Draw settings menu
     */
    drawSettingsMenu(game, theme) {
        this.utils.drawTextBackdrop("SETTINGS", TETRIS.WIDTH / 2, 150, "bold 48px Arial", theme.ui.accent, theme);
        this.drawSettingsMenuButtons(game, theme);
    }

    /**
     * Draw settings menu buttons
     */
    drawSettingsMenuButtons(game, theme) {
        const menu = game.settingsMenu;
        const buttonWidth = 240;
        const buttonHeight = 60;
        const startY = 220;
        const spacing = 80;

        menu.buttons.forEach((button, index) => {
            const x = TETRIS.WIDTH / 2 - buttonWidth / 2;
            const y = startY + index * spacing;

            const isSelected = index === menu.selectedIndex;
            const isHovered = game.input && game.input.isElementHovered(`settings_button_${index}`);
            const shouldHighlight = isHovered || isSelected;

            this.drawMenuButton(x, y, buttonWidth, buttonHeight, button.text, shouldHighlight, theme);
        });
    }

    /**
     * Draw a styled menu button (used for all menu types)
     */
    drawMenuButton(x, y, width, height, text, isHighlighted, theme) {
        const ctx = this.ctx;
        const depth = 4;

        // Enhanced shadow for highlighted buttons
        if (isHighlighted) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
            ctx.fillRect(x + depth + 2, y + depth + 2, width, height);
        } else {
            ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
            ctx.fillRect(x + depth, y + depth, width, height);
        }

        // Main button background with enhanced colors
        const gradient = ctx.createLinearGradient(x, y, x, y + height);

        if (isHighlighted) {
            gradient.addColorStop(0, this.utils.lightenColor(theme.ui.accent, 0.6));
            gradient.addColorStop(1, theme.ui.accent);
        } else {
            gradient.addColorStop(0, theme.ui.accent);
            gradient.addColorStop(1, this.utils.darkenColor(theme.ui.accent, 0.3));
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, width, height);

        // Enhanced highlight for selected/hovered buttons
        if (isHighlighted) {
            const highlightGradient = ctx.createLinearGradient(x, y, x, y + height * 0.6);
            highlightGradient.addColorStop(0, "rgba(255, 255, 255, 0.7)");
            highlightGradient.addColorStop(1, "rgba(255, 255, 255, 0.1)");

            ctx.fillStyle = highlightGradient;
            ctx.fillRect(x, y, width, height * 0.6);

            // Add extra border glow
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, width, height);

            ctx.strokeStyle = this.utils.darkenColor(theme.ui.accent, 0.5);
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);
        } else {
            // Normal border
            ctx.strokeStyle = this.utils.darkenColor(theme.ui.accent, 0.4);
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);
        }

        // Text with enhanced visibility
        ctx.fillStyle = isHighlighted ? "#000000" : "#ffffff";
        ctx.font = "bold 24px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        if (isHighlighted) {
            ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
            ctx.shadowBlur = 8;
        }

        ctx.fillText(text, x + width / 2, y + height / 2);

        if (isHighlighted) {
            ctx.shadowBlur = 0;
        }
    }

    /**
     * Draw opponent disconnected menu
     */
    drawOpponentDisconnectedMenu(game, theme) {
        const ctx = this.ctx;

        // Full screen dark overlay
        ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
        ctx.fillRect(0, 0, TETRIS.WIDTH, TETRIS.HEIGHT);

        // Main message
        this.utils.drawTextBackdrop(
            "OPPONENT DISCONNECTED",
            TETRIS.WIDTH / 2,
            200,
            "bold 48px Arial",
            "#ff6b6b",
            theme
        );

        // Sub message
        this.utils.drawTextBackdrop(
            "The opponent has left the game",
            TETRIS.WIDTH / 2,
            250,
            "20px Arial",
            theme.ui.text,
            theme
        );

        // Draw menu buttons
        this.drawOpponentDisconnectedMenuButtons(game, theme);
    }

    /**
     * Draw opponent disconnected menu buttons
     */
    drawOpponentDisconnectedMenuButtons(game, theme) {
        const menu = game.opponentDisconnectedMenu;
        const buttonWidth = 240;
        const buttonHeight = 60;
        const startY = 300;
        const spacing = 80;

        menu.buttons.forEach((button, index) => {
            const x = TETRIS.WIDTH / 2 - buttonWidth / 2;
            const y = startY + index * spacing;

            const isSelected = index === menu.selectedIndex;
            const isHovered = game.input && game.input.isElementHovered(`opponent_disconnected_button_${index}`);
            const shouldHighlight = isHovered || isSelected;

            this.drawMenuButton(x, y, buttonWidth, buttonHeight, button.text, shouldHighlight, theme);
        });
    }

    /**
     * Draw room shut down menu
     */
    drawRoomShutDownMenu(game, theme) {
        const ctx = this.ctx;

        // Full screen dark overlay
        ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
        ctx.fillRect(0, 0, TETRIS.WIDTH, TETRIS.HEIGHT);

        // Main message
        this.utils.drawTextBackdrop("ROOM SHUT DOWN", TETRIS.WIDTH / 2, 200, "bold 48px Arial", "#ff6b6b", theme);

        // Sub message
        this.utils.drawTextBackdrop(
            "The host has closed the room",
            TETRIS.WIDTH / 2,
            250,
            "20px Arial",
            theme.ui.text,
            theme
        );

        // Draw menu button
        this.drawRoomShutDownMenuButtons(game, theme);
    }

    /**
     * Draw room shut down menu buttons
     */
    drawRoomShutDownMenuButtons(game, theme) {
        const menu = game.roomShutDownMenu;
        const buttonWidth = 240;
        const buttonHeight = 60;
        const startY = 340;

        const x = TETRIS.WIDTH / 2 - buttonWidth / 2;
        const y = startY;

        const isSelected = menu.selectedIndex === 0;
        const isHovered = game.input && game.input.isElementHovered("room_shutdown_button_0");
        const shouldHighlight = isHovered || isSelected;

        this.drawMenuButton(x, y, buttonWidth, buttonHeight, menu.buttons[0].text, shouldHighlight, theme);
    }

    /**
     * Draw rematch pending menu
     */
    drawRematchPendingMenu(game, theme) {
        const ctx = this.ctx;

        // Full screen dark overlay
        ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
        ctx.fillRect(0, 0, TETRIS.WIDTH, TETRIS.HEIGHT);

        // Main message
        this.utils.drawTextBackdrop(
            "WAITING FOR OPPONENT",
            TETRIS.WIDTH / 2,
            TETRIS.HEIGHT / 2 - 40,
            "bold 32px Arial",
            theme.ui.accent,
            theme
        );

        this.utils.drawTextBackdrop(
            "TO ACCEPT REMATCH",
            TETRIS.WIDTH / 2,
            TETRIS.HEIGHT / 2,
            "bold 32px Arial",
            theme.ui.accent,
            theme
        );

        // Draw animated dots
        const dotCount = Math.floor((Date.now() / 500) % 4);
        const dots = ".".repeat(dotCount);
        this.utils.drawTextBackdrop(
            dots,
            TETRIS.WIDTH / 2,
            TETRIS.HEIGHT / 2 + 50,
            "bold 24px Arial",
            theme.ui.text,
            theme
        );

        // Draw cancel button
        this.drawRematchPendingMenuButtons(game, theme);
    }

    /**
     * Draw rematch pending menu buttons
     */
    drawRematchPendingMenuButtons(game, theme) {
        const menu = game.rematchPendingMenu;
        const buttonWidth = 240;
        const buttonHeight = 60;
        const startY = 380;

        menu.buttons.forEach((button, index) => {
            const x = TETRIS.WIDTH / 2 - buttonWidth / 2;
            const y = startY + index * 80;

            const isSelected = index === menu.selectedIndex;
            const isHovered = game.input && game.input.isElementHovered(`rematch_pending_button_${index}`);
            const shouldHighlight = isHovered || isSelected;

            this.drawMenuButton(x, y, buttonWidth, buttonHeight, button.text, shouldHighlight, theme);
        });
    }
    /**
     * Draw waiting menu
     */
    drawWaitingMenu(game, theme) {
        const ctx = this.ctx;

        // Full screen dark overlay
        ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
        ctx.fillRect(0, 0, TETRIS.WIDTH, TETRIS.HEIGHT);

        // Main message
        this.utils.drawTextBackdrop(
            "WAITING FOR OPPONENT",
            TETRIS.WIDTH / 2,
            TETRIS.HEIGHT / 2 - 40,
            "bold 32px Arial",
            theme.ui.accent,
            theme
        );

        // Draw animated dots
        const dotCount = Math.floor((Date.now() / 500) % 4);
        const dots = ".".repeat(dotCount);
        this.utils.drawTextBackdrop(dots, TETRIS.WIDTH / 2, TETRIS.HEIGHT / 2, "bold 24px Arial", theme.ui.text, theme);

        // Draw cancel button
        this.drawWaitingMenuButtons(game, theme);
    }

    /**
     * Draw waiting menu buttons
     */
    drawWaitingMenuButtons(game, theme) {
        const menu = game.waitingMenu;
        const buttonWidth = 240;
        const buttonHeight = 60;
        const startY = 380;

        menu.buttons.forEach((button, index) => {
            const x = TETRIS.WIDTH / 2 - buttonWidth / 2;
            const y = startY + index * 80;

            const isSelected = index === menu.selectedIndex;
            const isHovered = game.input && game.input.isElementHovered(`waiting_menu_button_${index}`);
            const shouldHighlight = isHovered || isSelected;

            this.drawMenuButton(x, y, buttonWidth, buttonHeight, button.text, shouldHighlight, theme);
        });
    }

    /**
     * Draw waiting canceled menu
     */
    drawWaitingCanceledMenu(game, theme) {
        const ctx = this.ctx;

        // Full screen dark overlay
        ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
        ctx.fillRect(0, 0, TETRIS.WIDTH, TETRIS.HEIGHT);

        // Main message
        this.utils.drawTextBackdrop("MATCH CANCELED", TETRIS.WIDTH / 2, 200, "bold 48px Arial", "#ff6b6b", theme);

        // Sub message
        this.utils.drawTextBackdrop(
            "The room is still open. What would you like to do?",
            TETRIS.WIDTH / 2,
            250,
            "20px Arial",
            theme.ui.text,
            theme
        );

        // Draw menu buttons
        this.drawWaitingCanceledMenuButtons(game, theme);
    }

    /**
     * Draw waiting canceled menu buttons
     */
    drawWaitingCanceledMenuButtons(game, theme) {
        const menu = game.waitingCanceledMenu;
        const buttonWidth = 240;
        const buttonHeight = 60;
        const startY = 300;
        const spacing = 80;

        menu.buttons.forEach((button, index) => {
            const x = TETRIS.WIDTH / 2 - buttonWidth / 2;
            const y = startY + index * spacing;

            const isSelected = index === menu.selectedIndex;
            const isHovered = game.input && game.input.isElementHovered(`waiting_canceled_button_${index}`);
            const shouldHighlight = isHovered || isSelected;

            this.drawMenuButton(x, y, buttonWidth, buttonHeight, button.text, shouldHighlight, theme);
        });
    }

    /**
     * Draw waiting for host menu
     */
    drawWaitingForHostMenu(game, theme) {
        const ctx = this.ctx;

        // Full screen dark overlay
        ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
        ctx.fillRect(0, 0, TETRIS.WIDTH, TETRIS.HEIGHT);

        // Main message
        this.utils.drawTextBackdrop(
            "WAITING FOR HOST",
            TETRIS.WIDTH / 2,
            TETRIS.HEIGHT / 2 - 40,
            "bold 32px Arial",
            theme.ui.accent,
            theme
        );

        // Sub message
        this.utils.drawTextBackdrop(
            "TO START THE MATCH",
            TETRIS.WIDTH / 2,
            TETRIS.HEIGHT / 2,
            "bold 24px Arial",
            theme.ui.text,
            theme
        );

        // Draw animated dots
        const dotCount = Math.floor((Date.now() / 500) % 4);
        const dots = ".".repeat(dotCount);
        this.utils.drawTextBackdrop(
            dots,
            TETRIS.WIDTH / 2,
            TETRIS.HEIGHT / 2 + 50,
            "bold 24px Arial",
            theme.ui.text,
            theme
        );

        // Draw cancel button
        this.drawWaitingForHostMenuButtons(game, theme);
    }

    /**
     * Draw waiting for host menu buttons
     */
    drawWaitingForHostMenuButtons(game, theme) {
        const menu = game.waitingForHostMenu;
        const buttonWidth = 240;
        const buttonHeight = 60;
        const startY = 380;

        menu.buttons.forEach((button, index) => {
            const x = TETRIS.WIDTH / 2 - buttonWidth / 2;
            const y = startY + index * 80;

            const isSelected = index === menu.selectedIndex;
            const isHovered = game.input && game.input.isElementHovered(`waiting_for_host_button_${index}`);
            const shouldHighlight = isHovered || isSelected;

            this.drawMenuButton(x, y, buttonWidth, buttonHeight, button.text, shouldHighlight, theme);
        });
    }
}

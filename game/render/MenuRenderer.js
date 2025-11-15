/**
 * MenuRenderer - Handles all menu screen rendering (main, multiplayer, pause, game over)
 */
class MenuRenderer {
    constructor(ctx, utils) {
        this.ctx = ctx;
        this.utils = utils;

        // Shared canvas dimensions
        this.SCREEN_WIDTH = TETRIS.WIDTH;
        this.SCREEN_HEIGHT = TETRIS.HEIGHT;

        // Title screen
        this.TITLE_TEXT_Y = 200;
        this.SUBTITLE_TEXT_Y = 240;
        this.TITLE_OUTLINE_THICKNESS = 3;
        this.SUBTITLE_OUTLINE_THICKNESS = 2;

        // Generic button layout
        this.BUTTON_WIDTH = 240;
        this.BUTTON_HEIGHT = 60;
        this.BUTTON_SPACING = 75;

        // Specific menu vertical offsets (absolute positions)
        this.MAIN_MENU_START_Y = 295;
        this.MULTIPLAYER_MENU_START_Y = 220;
        this.PAUSE_MENU_START_Y = 220;
        this.GAME_OVER_MENU_START_Y = 300;
        this.OPPONENT_DISCONNECTED_MENU_START_Y = 300;
        this.WAITING_MENU_START_Y = 380;
        this.WAITING_CANCELED_MENU_START_Y = 300;
        this.WAITING_FOR_HOST_MENU_START_Y = 380;
        this.ROOM_SHUT_DOWN_MENU_START_Y = 340;

        // Overlay colors
        this.OVERLAY_DARK = "rgba(0, 0, 0, 0.9)";
        this.OVERLAY_MEDIUM = "rgba(0, 0, 0, 0.85)";
        this.OVERLAY_LIGHT = "rgba(0, 0, 0, 0.6)";

        // Typography (all game-over/player fonts explicit)
        this.FONT_FAMILY = "Arial";
        this.TITLE_FONT = `bold 72px ${this.FONT_FAMILY}`;
        this.SUBTITLE_FONT = `24px ${this.FONT_FAMILY}`;
        this.HEADER_FONT_LG = `bold 60px ${this.FONT_FAMILY}`;
        this.HEADER_FONT_MD = `bold 48px ${this.FONT_FAMILY}`;

        this.LABEL_FONT_MD = `bold 32px ${this.FONT_FAMILY}`;
        this.LABEL_FONT_SM = `bold 24px ${this.FONT_FAMILY}`;
        this.LABEL_FONT_XS = `20px ${this.FONT_FAMILY}`;
        this.INSTRUCTIONS_FONT = `14px ${this.FONT_FAMILY}`;

        // Single-player game over fonts
        this.SP_STATS_FONT = `bold 30px ${this.FONT_FAMILY}`;
        this.SP_SCORE_FONT = this.SP_STATS_FONT;
        this.SP_LEVEL_FONT = this.SP_STATS_FONT;
        this.SP_LINES_FONT = this.SP_STATS_FONT;

        // Multiplayer scoreboard fonts
        this.MP_NAME_FONT = this.LABEL_FONT_SM;
        this.MP_STATS_FONT = this.LABEL_FONT_XS;

        // 3-4 player game over name font (player labels in grid)
        this.GO4P_NAME_FONT= `18px ${this.FONT_FAMILY}`
        this.GO4_NAME_FONT = this.GO4P_NAME_FONT;

        // 3-4 player game over stats font (single knob for grid Score/Lines)
        this.GO4P_STATS_FONT = `16px ${this.FONT_FAMILY}`
        this.GO4_STATS_FONT = this.GO4P_STATS_FONT;

        // Game over shared box
        this.GAME_OVER_BOX_WIDTH = 420;
        this.GAME_OVER_BOX_HEIGHT = 145;
        this.GAME_OVER_BOX_OFFSET_Y = 170;
        this.GAME_OVER_HEADER_OFFSET_Y = 210;


        // Misc absolute positions
        this.MAIN_MESSAGE_Y = 200;
        this.SUB_MESSAGE_Y = 250;

        // Single-player stats Y positions (fully explicit)
        this.SP_SCORE_Y = this.SCREEN_HEIGHT / 2 - 145;
        this.SP_LEVEL_Y = this.SCREEN_HEIGHT / 2 - 95;
        this.SP_LINES_Y = this.SCREEN_HEIGHT / 2 - 45;

        // 2-player game over layout (vertical stack)
        this.GO2_P1_LABEL_X = this.SCREEN_WIDTH / 2;
        this.GO2_P1_LABEL_Y = this.SCREEN_HEIGHT / 2 - 146;
        this.GO2_P1_STATS_X = this.GO2_P1_LABEL_X;
        this.GO2_P1_STATS_Y = this.GO2_P1_LABEL_Y + 30;

        this.GO2_P2_LABEL_X = this.SCREEN_WIDTH / 2;
        this.GO2_P2_LABEL_Y = this.GO2_P1_LABEL_Y + 70;
        this.GO2_P2_STATS_X = this.GO2_P2_LABEL_X;
        this.GO2_P2_STATS_Y = this.GO2_P2_LABEL_Y + 30;

        // 3–4 player game over layout (grid slots for P1–P4)
        this.GO4_P1_LABEL_X = this.SCREEN_WIDTH / 2 - 200 / 2;
        this.GO4_P1_LABEL_Y = this.SCREEN_HEIGHT / 2 - 154;
        this.GO4_P1_SCORE_X = this.GO4_P1_LABEL_X;
        this.GO4_P1_SCORE_Y = this.GO4_P1_LABEL_Y + 24;
        this.GO4_P1_LINES_X = this.GO4_P1_LABEL_X;
        this.GO4_P1_LINES_Y = this.GO4_P1_LABEL_Y + 46;

        this.GO4_P2_LABEL_X = this.GO4_P1_LABEL_X + 200;
        this.GO4_P2_LABEL_Y = this.GO4_P1_LABEL_Y;
        this.GO4_P2_SCORE_X = this.GO4_P2_LABEL_X;
        this.GO4_P2_SCORE_Y = this.GO4_P2_LABEL_Y + 24;
        this.GO4_P2_LINES_X = this.GO4_P2_LABEL_X;
        this.GO4_P2_LINES_Y = this.GO4_P2_LABEL_Y + 46;

        this.GO4_P3_LABEL_X = this.GO4_P1_LABEL_X;
        this.GO4_P3_LABEL_Y = this.GO4_P1_LABEL_Y + 70;
        this.GO4_P3_SCORE_X = this.GO4_P3_LABEL_X;
        this.GO4_P3_SCORE_Y = this.GO4_P3_LABEL_Y + 24;
        this.GO4_P3_LINES_X = this.GO4_P3_LABEL_X;
        this.GO4_P3_LINES_Y = this.GO4_P3_LABEL_Y + 46;

        this.GO4_P4_LABEL_X = this.GO4_P2_LABEL_X;
        this.GO4_P4_LABEL_Y = this.GO4_P2_LABEL_Y + 70;
        this.GO4_P4_SCORE_X = this.GO4_P4_LABEL_X;
        this.GO4_P4_SCORE_Y = this.GO4_P4_LABEL_Y + 24;
        this.GO4_P4_LINES_X = this.GO4_P4_LABEL_X;
        this.GO4_P4_LINES_Y = this.GO4_P4_LABEL_Y + 46;

        // Dots animation timing
        this.DOTS_INTERVAL_MS = 500;
        this.DOTS_MAX = 3;
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
                this.SCREEN_WIDTH / 2,
                this.TITLE_TEXT_Y,
                this.TITLE_FONT,
                theme.ui.text,
                theme,
                this.TITLE_OUTLINE_THICKNESS
            );
            this.utils.drawTextBackdrop(
                "ActionEngine Edition",
                this.SCREEN_WIDTH / 2,
                this.SUBTITLE_TEXT_Y,
                this.SUBTITLE_FONT,
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
            // Default to main menu (drawn on top)
            this.drawMainMenuButtons(game, theme);
        }
    }

    /**
     * Draw main menu buttons
     */
    drawMainMenuButtons(game, theme) {
        const menu = game.mainMenu;
        const buttonWidth = this.BUTTON_WIDTH;
        const buttonHeight = this.BUTTON_HEIGHT;
        const startY = this.MAIN_MENU_START_Y;
        const spacing = this.BUTTON_SPACING;

        menu.buttons.forEach((button, index) => {
            const x = this.SCREEN_WIDTH / 2 - buttonWidth / 2;
            const y = startY + index * spacing;

            const isSelected = index === menu.selectedIndex;
            const isHovered = game.input && game.input.isElementHovered(`main_button_${index}`);
            const shouldHighlight = isHovered || isSelected;

            // Special "poop" animation for Dr. Mario button - draw UNDERNEATH first
            if (index === 2 && (game.easterEgg.isHoldingDown || game.easterEgg.isReversing) && game.easterEgg.downHoldTimer > 0 && !game.easterEgg.unlocked && !game.menuManager.isDrMarioUnlocked()) {
                // Add 0.5s delay before starting animation: button only emerges after delay passes
                const effectiveTimer = Math.max(0, game.easterEgg.downHoldTimer - 0.5);
                const progress = effectiveTimer / (game.easterEgg.unlockDuration - 0.5);
                const clampedProgress = Math.min(1, Math.max(0, progress));

                if (clampedProgress > 0) {
                    // Calculate position: starts at same Y as settings button, moves up
                    const settingsButtonY = startY + 2 * spacing; // Y position of settings button
                    const targetY = startY + 3 * spacing; // Where Dr. Mario button will be
                    const currentY = settingsButtonY - (settingsButtonY - targetY) * clampedProgress;

                    // Draw the "emerging" Dr. Mario button during animation (drawn first, underneath)
                    this.drawMenuButton(x, currentY, buttonWidth, buttonHeight, "?????", false, theme);
                }
            }

            // Add shaking effect to SETTINGS button (index 2) when holding down or reversing, but only if not already unlocked
            let shakeOffsetX = 0;
            let shakeOffsetY = 0;
            if (index === 2 && (game.easterEgg.isHoldingDown || game.easterEgg.isReversing) && game.easterEgg.downHoldTimer > 0 && !game.easterEgg.unlocked && !game.menuManager.isDrMarioUnlocked()) {
                const progress = game.easterEgg.downHoldTimer / game.easterEgg.unlockDuration; // 0 to 1 over 3 seconds
                const shakeIntensity = progress * 3; // Max 3px shake at full time (half as intense)
                const shakeSpeed = 4; // Even slower shake
                shakeOffsetX = (Math.sin(game.frameCount * shakeSpeed * 0.1) * shakeIntensity);
                // shakeOffsetY = 0; // No vertical shake, only horizontal
            }
            this.drawMenuButton(x + shakeOffsetX, y + shakeOffsetY, buttonWidth, buttonHeight, button.text, shouldHighlight, theme);
        });

        // Draw the actual Dr. Mario button (only when unlocked)
        if (game.easterEgg.unlocked || game.menuManager.isDrMarioUnlocked()) {
            const drmarioIndex = menu.buttons.findIndex(btn => btn.action === "drMario");
            if (drmarioIndex !== -1) {
                const button = menu.buttons[drmarioIndex];
                const x = this.SCREEN_WIDTH / 2 - buttonWidth / 2;
                const y = startY + drmarioIndex * spacing;

                const isSelected = drmarioIndex === menu.selectedIndex;
                const isHovered = game.input && game.input.isElementHovered(`main_button_${drmarioIndex}`);
                const shouldHighlight = isHovered || isSelected;

                this.drawMenuButton(x, y, buttonWidth, buttonHeight, button.text, shouldHighlight, theme);
            }
        }
    }

    /**
     * Draw multiplayer menu buttons
     */
    drawMultiplayerMenuButtons(game, theme) {
        const menu = game.multiplayerMenu;
        const buttonWidth = this.BUTTON_WIDTH;
        const buttonHeight = this.BUTTON_HEIGHT;
        const startY = this.MULTIPLAYER_MENU_START_Y;
        const spacing = this.BUTTON_SPACING;

        this.utils.drawTextBackdrop("MULTIPLAYER", this.SCREEN_WIDTH / 2, 150, this.HEADER_FONT_MD, theme.ui.accent, theme);

        menu.buttons.forEach((button, index) => {
            const x = this.SCREEN_WIDTH / 2 - buttonWidth / 2;
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
        const buttonWidth = this.BUTTON_WIDTH;
        const buttonHeight = this.BUTTON_HEIGHT;
        const startY = this.MAIN_MENU_START_Y + menu.positionOffset;
        const spacing = this.BUTTON_SPACING;

        this.utils.drawTextBackdrop("MULTIPLAYER", this.SCREEN_WIDTH / 2, 150, this.HEADER_FONT_MD, theme.ui.accent, theme);

        menu.buttons.forEach((button, index) => {
            const x = this.SCREEN_WIDTH / 2 - buttonWidth / 2;
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
        ctx.fillStyle = this.OVERLAY_LIGHT;
        ctx.fillRect(0, 0, this.SCREEN_WIDTH, this.SCREEN_HEIGHT);

        // Only draw pause menu if not in settings
        if (game.menuStack.current !== "settings") {
            const isSinglePlayer = game.gameManager && game.gameManager.players.length === 1;
            // For single-player: move "PAUSED" text up by one full button height (80px) to match multiplayer spacing
            const pausedTextY = isSinglePlayer ? 70 : 150;
            const startY = isSinglePlayer ? this.PAUSE_MENU_START_Y - 75 : this.PAUSE_MENU_START_Y;
            this.utils.drawTextBackdrop("PAUSED", this.SCREEN_WIDTH / 2, pausedTextY, this.HEADER_FONT_MD, theme.ui.accent, theme);
            // Get the menu through getter to ensure dynamic button generation
            const menu = game.menuManager.getPauseMenu();
            const buttonWidth = this.BUTTON_WIDTH;
            const buttonHeight = this.BUTTON_HEIGHT;
            const spacing = this.BUTTON_SPACING;

            menu.buttons.forEach((button, index) => {
                const x = this.SCREEN_WIDTH / 2 - buttonWidth / 2;
                const y = startY + index * spacing;

                const isSelected = index === menu.selectedIndex;
                const isHovered = game.input && game.input.isElementHovered(`pause_button_${index}`);
                const shouldHighlight = isHovered || isSelected;

                this.drawMenuButton(x, y, buttonWidth, buttonHeight, button.text, shouldHighlight, theme);
            });
        }
    }


    /**
     * Draw game over overlay
     */
    drawGameOverOverlay(game, theme) {
        const ctx = this.ctx;

        ctx.save();
        ctx.globalAlpha = game.gameOverTransition.opacity;

        // Create overlay
        ctx.fillStyle = this.OVERLAY_DARK;
        ctx.fillRect(0, 0, this.SCREEN_WIDTH, this.SCREEN_HEIGHT);

        const isMultiplayer = game.gameManager && game.gameManager.players.length > 1;

        // One simple shared box for all modes (same size, same position)
        const boxWidth = this.GAME_OVER_BOX_WIDTH;
        const boxHeight = this.GAME_OVER_BOX_HEIGHT;
        const boxX = this.SCREEN_WIDTH / 2 - boxWidth / 2;
        const boxY = this.SCREEN_HEIGHT / 2 - this.GAME_OVER_BOX_OFFSET_Y;

        const gradient = ctx.createLinearGradient(boxX, boxY, boxX, boxY + boxHeight);
        gradient.addColorStop(0, theme.ui.background);
        gradient.addColorStop(1, this.utils.darkenColor(theme.ui.background, 0.4));
        ctx.fillStyle = gradient;
        ctx.globalAlpha = 0.92 * game.gameOverTransition.opacity;
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

        ctx.globalAlpha = 1.0 * game.gameOverTransition.opacity;
        ctx.strokeStyle = theme.ui.border;
        ctx.lineWidth = 3;
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

        ctx.strokeStyle = this.utils.lightenColor(theme.ui.border, 0.3);
        ctx.lineWidth = 1;
        ctx.strokeRect(boxX + 3, boxY + 3, boxWidth - 6, boxHeight - 6);

        if (isMultiplayer) {
            const winner = game.gameManager.winner;
            const players = game.gameManager.players || [];

            const isOnline = !!game.networkSession;

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

            // Header (unchanged)
            if (isOnline && winner) {
                const localWon = winner === 1;
                const headerText = localWon ? "YOU WIN!" : "YOU LOSE!";
                const headerColor = localWon ? theme.ui.accent : theme.ui.text;
                this.utils.drawTextBackdrop(
                    headerText,
                    this.SCREEN_WIDTH / 2,
                    this.SCREEN_HEIGHT / 2 - this.GAME_OVER_HEADER_OFFSET_Y,
                    this.HEADER_FONT_LG,
                    headerColor,
                    theme
                );
            } else if (winner && winnerName) {
                this.utils.drawTextBackdrop(
                    `${winnerName} Wins!`,
                    this.SCREEN_WIDTH / 2,
                    this.SCREEN_HEIGHT / 2 - this.GAME_OVER_HEADER_OFFSET_Y,
                    this.HEADER_FONT_LG,
                    theme.ui.accent,
                    theme
                );
            } else {
                this.utils.drawTextBackdrop(
                    "GAME OVER",
                    this.SCREEN_WIDTH / 2,
                    this.SCREEN_HEIGHT / 2 - this.GAME_OVER_HEADER_OFFSET_Y,
                    this.HEADER_FONT_LG,
                    theme.ui.accent,
                    theme
                );
            }

            const playerCount = players.length;
            if (playerCount <= 2) {
                players.forEach((player, index) => {
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

                    const color = theme.ui.accent;
                    const label = isWinner ? `${baseName} 👑` : baseName;

                    if (index === 0) {
                        this.utils.drawTextBackdrop(label, this.GO2_P1_LABEL_X, this.GO2_P1_LABEL_Y, this.MP_NAME_FONT, color, theme);
                        this.utils.drawTextBackdrop(`Score: ${player.score} | Lines: ${player.lines}`, this.GO2_P1_STATS_X, this.GO2_P1_STATS_Y, this.MP_STATS_FONT, theme.ui.text, theme);
                    } else if (index === 1) {
                        this.utils.drawTextBackdrop(label, this.GO2_P2_LABEL_X, this.GO2_P2_LABEL_Y, this.MP_NAME_FONT, color, theme);
                        this.utils.drawTextBackdrop(`Score: ${player.score} | Lines: ${player.lines}`, this.GO2_P2_STATS_X, this.GO2_P2_STATS_Y, this.MP_STATS_FONT, theme.ui.text, theme);
                    }
                });
            } else {
                // Multi-player (3-4 players): use GO4_* slots and GO4_STATS_FONT for scores/lines
                players.forEach((player, index) => {
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

                    const color = theme.ui.accent;
                    const label = isWinner ? `${baseName} 👑` : baseName;

                    if (index === 0) {
                        this.utils.drawTextBackdrop(label, this.GO4_P1_LABEL_X, this.GO4_P1_LABEL_Y, this.GO4_NAME_FONT, color, theme);
                        this.utils.drawTextBackdrop(`Score: ${player.score}`, this.GO4_P1_SCORE_X, this.GO4_P1_SCORE_Y, this.GO4_STATS_FONT, theme.ui.text, theme);
                        this.utils.drawTextBackdrop(`Lines: ${player.lines}`, this.GO4_P1_LINES_X, this.GO4_P1_LINES_Y, this.GO4_STATS_FONT, theme.ui.text, theme);
                    } else if (index === 1) {
                        this.utils.drawTextBackdrop(label, this.GO4_P2_LABEL_X, this.GO4_P2_LABEL_Y, this.GO4_NAME_FONT, color, theme);
                        this.utils.drawTextBackdrop(`Score: ${player.score}`, this.GO4_P2_SCORE_X, this.GO4_P2_SCORE_Y, this.GO4_STATS_FONT, theme.ui.text, theme);
                        this.utils.drawTextBackdrop(`Lines: ${player.lines}`, this.GO4_P2_LINES_X, this.GO4_P2_LINES_Y, this.GO4_STATS_FONT, theme.ui.text, theme);
                    } else if (index === 2) {
                        this.utils.drawTextBackdrop(label, this.GO4_P3_LABEL_X, this.GO4_P3_LABEL_Y, this.GO4_NAME_FONT, color, theme);
                        this.utils.drawTextBackdrop(`Score: ${player.score}`, this.GO4_P3_SCORE_X, this.GO4_P3_SCORE_Y, this.GO4_STATS_FONT, theme.ui.text, theme);
                        this.utils.drawTextBackdrop(`Lines: ${player.lines}`, this.GO4_P3_LINES_X, this.GO4_P3_LINES_Y, this.GO4_STATS_FONT, theme.ui.text, theme);
                    } else if (index === 3) {
                        this.utils.drawTextBackdrop(label, this.GO4_P4_LABEL_X, this.GO4_P4_LABEL_Y, this.GO4_NAME_FONT, color, theme);
                        this.utils.drawTextBackdrop(`Score: ${player.score}`, this.GO4_P4_SCORE_X, this.GO4_P4_SCORE_Y, this.GO4_STATS_FONT, theme.ui.text, theme);
                        this.utils.drawTextBackdrop(`Lines: ${player.lines}`, this.GO4_P4_LINES_X, this.GO4_P4_LINES_Y, this.GO4_STATS_FONT, theme.ui.text, theme);
                    }
                });
            }
        } else {
            // Single-player: explicit positions for each stat label
            this.utils.drawTextBackdrop(
                "GAME OVER",
                this.SCREEN_WIDTH / 2,
                this.SCREEN_HEIGHT / 2 - this.GAME_OVER_HEADER_OFFSET_Y,
                this.HEADER_FONT_LG,
                theme.ui.accent,
                theme
            );
            this.utils.drawTextBackdrop(
                `Score: ${game.score}`,
                this.SCREEN_WIDTH / 2,
                this.SP_SCORE_Y,
                this.SP_SCORE_FONT,
                theme.ui.text,
                theme
            );
            this.utils.drawTextBackdrop(
                `Level: ${game.level}`,
                this.SCREEN_WIDTH / 2,
                this.SP_LEVEL_Y,
                this.SP_LEVEL_FONT,
                theme.ui.text,
                theme
            );
            this.utils.drawTextBackdrop(
                `Lines: ${game.lines}`,
                this.SCREEN_WIDTH / 2,
                this.SP_LINES_Y,
                this.SP_LINES_FONT,
                theme.ui.text,
                theme
            );
        }

        // Buttons unchanged, drawn below
        this.drawGameOverMenuButtons(game, theme);

        ctx.restore();
    }

    /**
     * Draw game over menu buttons
     */
    drawGameOverMenuButtons(game, theme) {
        const menu = game.networkSession ? game.onlineGameOverMenu : game.gameOverMenu;
        const buttonWidth = this.BUTTON_WIDTH;
        const buttonHeight = this.BUTTON_HEIGHT;
        const startY = this.GAME_OVER_MENU_START_Y;
        const spacing = this.BUTTON_SPACING;

        menu.buttons.forEach((button, index) => {
            const x = this.SCREEN_WIDTH / 2 - buttonWidth / 2;
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
        this.utils.drawTextBackdrop("SETTINGS", this.SCREEN_WIDTH / 2, 150, this.HEADER_FONT_MD, theme.ui.accent, theme);
        this.drawSettingsMenuButtons(game, theme);
    }

    /**
     * Draw settings menu buttons
     */
    drawSettingsMenuButtons(game, theme) {
        const menu = game.settingsMenu;
        const buttonWidth = this.BUTTON_WIDTH;
        const buttonHeight = this.BUTTON_HEIGHT;
        const startY = this.PAUSE_MENU_START_Y;
        const spacing = this.BUTTON_SPACING;

        menu.buttons.forEach((button, index) => {
            const x = this.SCREEN_WIDTH / 2 - buttonWidth / 2;
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
        ctx.font = this.LABEL_FONT_SM;
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
        ctx.fillStyle = this.OVERLAY_DARK;
        ctx.fillRect(0, 0, this.SCREEN_WIDTH, this.SCREEN_HEIGHT);

        // Main message
        this.utils.drawTextBackdrop(
            "OPPONENT DISCONNECTED",
            this.SCREEN_WIDTH / 2,
            this.MAIN_MESSAGE_Y,
            this.HEADER_FONT_MD,
            "#ff6b6b",
            theme
        );

        // Sub message
        this.utils.drawTextBackdrop(
            "The opponent has left the game",
            this.SCREEN_WIDTH / 2,
            this.SUB_MESSAGE_Y,
            this.LABEL_FONT_XS,
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
        const buttonWidth = this.BUTTON_WIDTH;
        const buttonHeight = this.BUTTON_HEIGHT;
        const startY = this.OPPONENT_DISCONNECTED_MENU_START_Y;
        const spacing = this.BUTTON_SPACING;

        menu.buttons.forEach((button, index) => {
            const x = this.SCREEN_WIDTH / 2 - buttonWidth / 2;
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
        ctx.fillStyle = this.OVERLAY_DARK;
        ctx.fillRect(0, 0, this.SCREEN_WIDTH, this.SCREEN_HEIGHT);

        // Main message
        this.utils.drawTextBackdrop("ROOM SHUT DOWN", this.SCREEN_WIDTH / 2, this.MAIN_MESSAGE_Y, this.HEADER_FONT_MD, "#ff6b6b", theme);

        // Sub message
        this.utils.drawTextBackdrop(
            "The host has closed the room",
            this.SCREEN_WIDTH / 2,
            this.SUB_MESSAGE_Y,
            this.LABEL_FONT_XS,
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
        const buttonWidth = this.BUTTON_WIDTH;
        const buttonHeight = this.BUTTON_HEIGHT;
        const startY = this.ROOM_SHUT_DOWN_MENU_START_Y;

        const x = this.SCREEN_WIDTH / 2 - buttonWidth / 2;
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
        ctx.fillStyle = this.OVERLAY_MEDIUM;
        ctx.fillRect(0, 0, this.SCREEN_WIDTH, this.SCREEN_HEIGHT);

        // Main message
        this.utils.drawTextBackdrop(
            "WAITING FOR OPPONENT",
            this.SCREEN_WIDTH / 2,
            this.SCREEN_HEIGHT / 2 - 40,
            this.LABEL_FONT_MD,
            theme.ui.accent,
            theme
        );

        this.utils.drawTextBackdrop(
            "TO ACCEPT REMATCH",
            this.SCREEN_WIDTH / 2,
            this.SCREEN_HEIGHT / 2,
            this.LABEL_FONT_MD,
            theme.ui.accent,
            theme
        );

        // Draw animated dots
        const dotCount = Math.floor((Date.now() / this.DOTS_INTERVAL_MS) % (this.DOTS_MAX + 1));
        const dots = ".".repeat(dotCount);
        this.utils.drawTextBackdrop(
            dots,
            this.SCREEN_WIDTH / 2,
            this.SCREEN_HEIGHT / 2 + 50,
            this.LABEL_FONT_SM,
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
        const buttonWidth = this.BUTTON_WIDTH;
        const buttonHeight = this.BUTTON_HEIGHT;
        const startY = this.WAITING_MENU_START_Y;

        menu.buttons.forEach((button, index) => {
            const x = this.SCREEN_WIDTH / 2 - buttonWidth / 2;
            const y = startY + index * this.BUTTON_SPACING;

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
        ctx.fillStyle = this.OVERLAY_MEDIUM;
        ctx.fillRect(0, 0, this.SCREEN_WIDTH, this.SCREEN_HEIGHT);

        // Main message
        this.utils.drawTextBackdrop(
            "WAITING FOR OPPONENT",
            this.SCREEN_WIDTH / 2,
            this.SCREEN_HEIGHT / 2 - 40,
            this.LABEL_FONT_MD,
            theme.ui.accent,
            theme
        );

        // Draw animated dots
        const dotCount = Math.floor((Date.now() / this.DOTS_INTERVAL_MS) % (this.DOTS_MAX + 1));
        const dots = ".".repeat(dotCount);
        this.utils.drawTextBackdrop(dots, this.SCREEN_WIDTH / 2, this.SCREEN_HEIGHT / 2, this.LABEL_FONT_SM, theme.ui.text, theme);

        // Draw cancel button
        this.drawWaitingMenuButtons(game, theme);
    }

    /**
     * Draw waiting menu buttons
     */
    drawWaitingMenuButtons(game, theme) {
        const menu = game.waitingMenu;
        const buttonWidth = this.BUTTON_WIDTH;
        const buttonHeight = this.BUTTON_HEIGHT;
        const startY = this.WAITING_MENU_START_Y;

        menu.buttons.forEach((button, index) => {
            const x = this.SCREEN_WIDTH / 2 - buttonWidth / 2;
            const y = startY + index * this.BUTTON_SPACING;

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
        ctx.fillStyle = this.OVERLAY_DARK;
        ctx.fillRect(0, 0, this.SCREEN_WIDTH, this.SCREEN_HEIGHT);

        // Main message
        this.utils.drawTextBackdrop("MATCH CANCELED", this.SCREEN_WIDTH / 2, this.MAIN_MESSAGE_Y, this.HEADER_FONT_MD, "#ff6b6b", theme);

        // Sub message
        this.utils.drawTextBackdrop(
            "The room is still open. What would you like to do?",
            this.SCREEN_WIDTH / 2,
            this.SUB_MESSAGE_Y,
            this.LABEL_FONT_XS,
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
        const buttonWidth = this.BUTTON_WIDTH;
        const buttonHeight = this.BUTTON_HEIGHT;
        const startY = this.WAITING_CANCELED_MENU_START_Y;
        const spacing = this.BUTTON_SPACING;

        menu.buttons.forEach((button, index) => {
            const x = this.SCREEN_WIDTH / 2 - buttonWidth / 2;
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
        ctx.fillStyle = this.OVERLAY_MEDIUM;
        ctx.fillRect(0, 0, this.SCREEN_WIDTH, this.SCREEN_HEIGHT);

        // Main message
        this.utils.drawTextBackdrop(
            "WAITING FOR HOST",
            this.SCREEN_WIDTH / 2,
            this.SCREEN_HEIGHT / 2 - 40,
            this.LABEL_FONT_MD,
            theme.ui.accent,
            theme
        );

        // Sub message
        this.utils.drawTextBackdrop(
            "TO START THE MATCH",
            this.SCREEN_WIDTH / 2,
            this.SCREEN_HEIGHT / 2,
            this.LABEL_FONT_SM,
            theme.ui.text,
            theme
        );

        // Draw animated dots
        const dotCount = Math.floor((Date.now() / this.DOTS_INTERVAL_MS) % (this.DOTS_MAX + 1));
        const dots = ".".repeat(dotCount);
        this.utils.drawTextBackdrop(
            dots,
            this.SCREEN_WIDTH / 2,
            this.SCREEN_HEIGHT / 2 + 50,
            this.LABEL_FONT_SM,
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
        const buttonWidth = this.BUTTON_WIDTH;
        const buttonHeight = this.BUTTON_HEIGHT;
        const startY = this.WAITING_FOR_HOST_MENU_START_Y;

        menu.buttons.forEach((button, index) => {
            const x = this.SCREEN_WIDTH / 2 - buttonWidth / 2;
            const y = startY + index * this.BUTTON_SPACING;

            const isSelected = index === menu.selectedIndex;
            const isHovered = game.input && game.input.isElementHovered(`waiting_for_host_button_${index}`);
            const shouldHighlight = isHovered || isSelected;

            this.drawMenuButton(x, y, buttonWidth, buttonHeight, button.text, shouldHighlight, theme);
        });
    }
}

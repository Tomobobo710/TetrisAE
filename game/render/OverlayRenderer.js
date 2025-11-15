/**
 * OverlayRenderer - Handles temporary overlay rendering (level up, countdown, knockouts)
 */
class OverlayRenderer {
    constructor(ctx, utils) {
        this.ctx = ctx;
        this.utils = utils;
    }

    /**
     * Draw player-specific overlay texts (level up, knockout)
     */
    drawPlayerOverlayTexts(game, theme) {
        if (!game.gameManager || game.gameState === "title") return;

        const playerCount = game.gameManager.players.length;
        game.gameManager.layoutManager.setPlayerCount(playerCount);

        game.gameManager.players.forEach((player) => {
            const layout = game.gameManager.layoutManager.getPlayerLayout(player.playerNumber);

            // Draw level up animation for this player if active
            if (player.levelUpAnimationTimer > 0) {
                this.drawPlayerLevelUpAnimation(player, layout, theme);
            }

            // Draw knockout label for eliminated players (multiplayer only)
            if (player.gameOver && playerCount > 1) {
                this.drawPlayerKnockoutLabel(player, layout, theme);
            }
        });
    }

    /**
     * Draw level up animation for a specific player
     */
    drawPlayerLevelUpAnimation(player, layout, theme) {
        const ctx = this.ctx;
        const progress = 1.0 - player.levelUpAnimationTimer / TETRIS.TIMING.LEVEL_UP_ANIMATION;

        if (progress < 0.3) {
            ctx.globalAlpha = progress / 0.3;
        } else if (progress > 0.7) {
            ctx.globalAlpha = (1.0 - progress) / 0.3;
        }

        const actualWidth = layout.gameArea.cellSize * TETRIS.GRID.COLS;
        const actualHeight = layout.gameArea.cellSize * TETRIS.GRID.VISIBLE_ROWS;
        const centerX = layout.gameArea.x + actualWidth / 2;
        const centerY = layout.gameArea.y + actualHeight / 2;

        this.utils.drawTextBackdrop(
            `LEVEL ${player.level}`,
            centerX,
            centerY,
            "bold 32px Arial",
            theme.ui.accent,
            theme
        );
        ctx.globalAlpha = 1.0;
    }

    /**
     * Draw knockout label for eliminated players
     */
    drawPlayerKnockoutLabel(player, layout, theme) {
        const actualWidth = layout.gameArea.cellSize * TETRIS.GRID.COLS;
        const actualHeight = layout.gameArea.cellSize * TETRIS.GRID.VISIBLE_ROWS;
        const centerX = layout.gameArea.x + actualWidth / 2;
        const centerY = layout.gameArea.y + actualHeight / 2;

        this.utils.drawTextBackdrop("KNOCKED OUT", centerX, centerY, "bold 20px Arial", "#ff0000", theme);
    }

    /**
     * Draw per-player countdown overlays (3-2-1, GO) centered on each grid.
     * Uses LayoutManager so it automatically respects 1P/2P/3P/4P layouts.
     */
    drawCountdownOverlay(game, theme) {
        const ctx = this.ctx;
        const countdown = game.countdown;

        if (!countdown || !countdown.active || !game.gameManager) {
            return;
        }

        const gm = game.gameManager;
        const players = gm.players;
        if (!players || players.length === 0) {
            return;
        }

        // Ensure layout manager is configured for current player count
        gm.layoutManager.setPlayerCount(players.length);

        ctx.save();

        const phase = countdown.phase;

        // Semi-transparent global dim only during 3-2-1; remove it for GO!
        if (phase === "countdown") {
            ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
            ctx.fillRect(0, 0, TETRIS.WIDTH, TETRIS.HEIGHT);
        }

        players.forEach((player) => {
            const layout = gm.layoutManager.getPlayerLayout(player.playerNumber);
            if (!layout || !layout.gameArea) return;

            const cellSize = layout.gameArea.cellSize;
            const gridWidth = cellSize * TETRIS.GRID.COLS;
            const gridHeight = cellSize * TETRIS.GRID.VISIBLE_ROWS;
            const centerX = Math.round(layout.gameArea.x + gridWidth / 2);
            const centerY = Math.round(layout.gameArea.y + gridHeight / 2);

            // Scale fonts based on grid size so 1P > 2P > 3/4P naturally.
            // Round to integer to prevent subpixel rendering jitter
            const baseNumberSize = Math.round(Math.max(28, Math.min(72, cellSize * 3.2)));
            const baseLabelSize = Math.round(Math.max(12, Math.min(28, cellSize * 1.4)));

            let mainText = "";
            let mainFont = `bold ${baseNumberSize}px Arial`;
            let labelText = "";
            let labelFont = `bold ${baseLabelSize}px Arial`;
            let alpha = 1.0;
            let pulsing = false;

            // Smooth countdown rendering: numbers fade, "GET READY!" stays solid
            if (phase === "countdown") {
                // 3, 2, 1 phase - numbers fade in/out, label stays solid
                mainText = countdown.countdownNumber != null
                    ? countdown.countdownNumber.toString()
                    : "";
                labelText = "GET READY!";

                // Numbers fade in/out within each second, "GET READY!" stays at full alpha
                const timerWithinSecond = countdown.timer % 1.0;
                if (timerWithinSecond < 0.1) {
                    alpha = timerWithinSecond * 10; // fade in first 0.1s
                } else if (timerWithinSecond > 0.9) {
                    alpha = (1.0 - timerWithinSecond) * 10; // fade out last 0.1s
                }
            } else if (phase === "go") {
                // GO phase with smooth fade out
                mainText = "GO!";
                labelText = "";
                const t = Math.max(0, Math.min(1, countdown.timer || 0));
                alpha = 1.0 - t; // fade out over configured timer window
            } else {
                return;
            }

            if (!mainText && !labelText) {
                return;
            }

            // Use integer coordinates for all rendering to prevent subpixel issues
            const renderX = Math.round(centerX);
            const renderY = Math.round(centerY);

            // "GET READY!" label above number - always full alpha, no fade
            if (labelText) {
                ctx.save();
                ctx.globalAlpha = 1.0; // Override any global alpha for label
                ctx.fillStyle = theme.ui.text || "#FFFFFF";
                ctx.font = labelFont;
                ctx.textAlign = "center";
                ctx.textBaseline = "bottom";
                const labelY = Math.round(centerY - baseNumberSize * 1.2);
                this.utils.drawTextBackdrop(
                    labelText,
                    renderX,
                    labelY,
                    ctx.font,
                    theme.ui.text || "#FFFFFF",
                    theme
                );
                ctx.restore();
            }

            // Main countdown / GO text - apply fade alpha to numbers only
            if (mainText) {
                ctx.save();
                ctx.globalAlpha *= alpha; // Apply fade only to numbers
                ctx.fillStyle = theme.ui.accent || "#FFFFFF";
                ctx.font = mainFont;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                this.utils.drawTextBackdrop(
                    mainText,
                    renderX,
                    renderY,
                    ctx.font,
                    theme.ui.accent || "#FFFFFF",
                    theme
                );
                ctx.restore();
            }

            ctx.restore();
        });

        ctx.restore();
    }
}

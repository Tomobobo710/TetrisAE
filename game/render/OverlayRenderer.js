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

        // Semi-transparent global dim so countdowns pop without fully nuking background
        ctx.save();
        ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
        ctx.fillRect(0, 0, TETRIS.WIDTH, TETRIS.HEIGHT);

        const phase = countdown.phase;

        players.forEach((player) => {
            const layout = gm.layoutManager.getPlayerLayout(player.playerNumber);
            if (!layout || !layout.gameArea) return;

            const cellSize = layout.gameArea.cellSize;
            const gridWidth = cellSize * TETRIS.GRID.COLS;
            const gridHeight = cellSize * TETRIS.GRID.VISIBLE_ROWS;
            const centerX = layout.gameArea.x + gridWidth / 2;
            const centerY = layout.gameArea.y + gridHeight / 2;

            // Scale fonts based on grid size so 1P > 2P > 3/4P naturally.
            const baseNumberSize = Math.max(28, Math.min(72, cellSize * 3.2));
            const baseLabelSize = Math.max(12, Math.min(28, cellSize * 1.4));

            let mainText = "";
            let mainFont = `bold ${baseNumberSize}px Arial`;
            let labelText = "";
            let labelFont = `bold ${baseLabelSize}px Arial`;
            let alpha = 1.0;
            let pulsing = false;

            if (phase === "countdown") {
                // 3, 2, 1 phase
                mainText = countdown.countdownNumber != null
                    ? countdown.countdownNumber.toString()
                    : "";
                labelText = "GET READY!";
                pulsing = true;
            } else if (phase === "go") {
                // GO phase with fade out based on timer (0..1s typical)
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

            ctx.save();
            ctx.globalAlpha *= alpha;

            // "GET READY!" label above number
            if (labelText) {
                ctx.fillStyle = theme.ui.text || "#FFFFFF";
                ctx.font = labelFont;
                ctx.textAlign = "center";
                ctx.textBaseline = "bottom";
                this.utils.drawTextBackdrop(
                    labelText,
                    centerX,
                    centerY - baseNumberSize * 0.9,
                    ctx.font,
                    theme.ui.text || "#FFFFFF",
                    theme
                );
            }

            // Main countdown / GO text
            if (mainText) {
                ctx.fillStyle = theme.ui.accent || "#FFFFFF";
                ctx.font = mainFont;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";

                if (pulsing) {
                    const pulse = 1.0 + Math.sin((countdown.timer || 0) * Math.PI * 2) * 0.12;
                    ctx.save();
                    ctx.translate(centerX, centerY);
                    ctx.scale(pulse, pulse);
                    ctx.translate(-centerX, -centerY);
                    this.utils.drawTextBackdrop(
                        mainText,
                        centerX,
                        centerY,
                        ctx.font,
                        theme.ui.accent || "#FFFFFF",
                        theme
                    );
                    ctx.restore();
                } else {
                    this.utils.drawTextBackdrop(
                        mainText,
                        centerX,
                        centerY,
                        ctx.font,
                        theme.ui.accent || "#FFFFFF",
                        theme
                    );
                }
            }

            ctx.restore();
        });

        ctx.restore();
    }
}

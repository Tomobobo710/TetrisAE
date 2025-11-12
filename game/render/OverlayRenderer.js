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
     * Draw the unified countdown overlay (3-2-1, GO) for both offline and online modes.
     */
    drawCountdownOverlay(game, theme) {
        const ctx = this.ctx;

        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, TETRIS.WIDTH, TETRIS.HEIGHT);

        let displayText = "";
        let fontSize = "bold 48px Arial";

        if (game.countdown && game.countdown.phase === "countdown") {
            displayText = game.countdown.countdownNumber.toString();
            fontSize = "bold 72px Arial";

            // Add pulsing effect for countdown numbers
            const pulse = 1.0 + Math.sin(game.countdown.timer * Math.PI * 2) * 0.2;
            ctx.save();
            ctx.translate(TETRIS.WIDTH / 2, TETRIS.HEIGHT / 2);
            ctx.scale(pulse, pulse);
            ctx.translate(-TETRIS.WIDTH / 2, -TETRIS.HEIGHT / 2);
        }

        this.utils.drawTextBackdrop(displayText, TETRIS.WIDTH / 2, TETRIS.HEIGHT / 2, fontSize, theme.ui.accent, theme);

        if (game.countdown && game.countdown.phase === "countdown") {
            ctx.restore();
        }
    }
}

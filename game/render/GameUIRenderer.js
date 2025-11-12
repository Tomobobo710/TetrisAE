/**
 * GameUIRenderer - Handles in-game UI rendering (hold, next, score panels)
 */
class GameUIRenderer {
    constructor(ctx, utils) {
        this.ctx = ctx;
        this.utils = utils;
    }

    /**
     * Draw all game UI elements
     */
    drawGameUI(game, theme) {
        if (!game.gameManager) return;

        game.gameManager.layoutManager.setPlayerCount(game.gameManager.players.length);

        // Render UI for all players
        game.gameManager.players.forEach((player) => {
            const layout = game.gameManager.layoutManager.getPlayerLayout(player.playerNumber);
            this.drawPlayerUI(game, player, theme, layout);
        });
    }

    /**
     * Draw UI elements for a specific player
     */
    drawPlayerUI(game, player, theme, layout) {
        // Always draw UI panels, even if player is knocked out,
        // so opponents can still see their hold/next/score state.
        this.drawPlayerHoldPanel(player, layout.gameArea, layout.ui, theme);
        this.drawPlayerNextPanel(player, layout.gameArea, layout.ui, theme);
        this.drawPlayerScorePanel(player, layout.gameArea, layout.ui, theme);

        // When SyncSystem reports the remote side as stale, show a strong visual indicator
        // above that opponent's name/panel so it's obvious they stopped responding.
        if (
            game.networkSession &&
            game.networkSession.remotePlayers &&
            game.networkSession.remotePlayers.length > 0 &&
            typeof game.networkSession.syncSystem?.isRemoteStale === "function"
        ) {
            const remoteIsStale = game.networkSession.syncSystem.isRemoteStale();

            if (remoteIsStale) {
                const remotePlayer = game.networkSession.remotePlayers[0];

                // Only decorate the remote opponent, not local player
                if (player === remotePlayer) {
                    this.drawRemoteStaleIcon(layout, theme);
                }
            }
        }
    }

    /**
     * Draw hold panel for a specific player
     */
    drawPlayerHoldPanel(player, gameArea, uiLayout, theme) {
        const ctx = this.ctx;
        const holdPanel = uiLayout.hold;

        this.utils.drawPanel(holdPanel.x, holdPanel.y, holdPanel.width, holdPanel.height, theme);

        // Draw HOLD label
        const textConfig = holdPanel.text || {
            label: "HOLD",
            fontSize: "16px",
            fontFamily: "Arial",
            fontWeight: "bold",
            position: { x: 0, y: 15 }
        };
        // Allow themes to provide dynamic UI accents for HOLD label
        let holdAccent = (theme && typeof theme.getDynamicUIAccent === "function")
            ? (theme.getDynamicUIAccent({ role: "label", source: "hold" }) || theme.ui.accent)
            : theme.ui.accent;
        ctx.fillStyle = holdAccent;
        ctx.font = `${textConfig.fontWeight} ${textConfig.fontSize} ${textConfig.fontFamily}`;
        ctx.textAlign = "center";
        ctx.fillText(
            textConfig.label,
            holdPanel.x + holdPanel.width / 2 + (textConfig.position?.x || 0),
            holdPanel.y + (textConfig.position?.y || 15)
        );

        if (player.heldPiece) {
            const pieceSize = TETROMINOES[player.heldPiece].size;
            const cellSize = holdPanel.pieceCellSize || 16;
            const alignment = holdPanel.pieceAlignment || "center";
            const disabledAlpha = holdPanel.pieceDisabledAlpha || 0.4;
            const customOffset = holdPanel.pieceOffset || { x: 0, y: 0 };

            const matrix = TETROMINOES[player.heldPiece].shape;

            // Calculate position based on alignment
            let centerX, centerY;
            if (alignment === "center" || alignment === "custom") {
                centerX = holdPanel.x + holdPanel.width / 2;
                centerY = holdPanel.y + holdPanel.height / 2;

                if (customOffset) {
                    centerX += customOffset.x;
                    centerY += customOffset.y;
                }
            } else {
                centerX = holdPanel.x + holdPanel.width / 2;
                centerY = holdPanel.y + holdPanel.height / 2;
            }

            // Calculate visual center for proper piece centering
            const visualCenter = this.utils.calculatePieceVisualCenter(matrix);
            const matrixCenterOffsetX = visualCenter.offsetX * cellSize;
            const matrixCenterOffsetY = visualCenter.offsetY * cellSize;

            const offsetX = centerX - (pieceSize * cellSize) / 2 + matrixCenterOffsetX;
            const offsetY = centerY - (pieceSize * cellSize) / 2 + matrixCenterOffsetY;
            const alpha = player.canHold ? 1.0 : disabledAlpha;

            for (let dy = 0; dy < pieceSize; dy++) {
                for (let dx = 0; dx < pieceSize; dx++) {
                    if (matrix[dy][dx]) {
                        const x = offsetX + dx * cellSize;
                        const y = offsetY + dy * cellSize;
                        this.utils.drawBlockPreview(
                            x,
                            y,
                            cellSize,
                            player.heldPiece,
                            alpha,
                            theme,
                            { source: "hold" }
                        );
                    }
                }
            }
        }
    }

    /**
     * Draw next panel for a specific player
     */
    drawPlayerNextPanel(player, gameArea, uiLayout, theme) {
        const ctx = this.ctx;
        const nextPanel = uiLayout.next;

        this.utils.drawPanel(nextPanel.x, nextPanel.y, nextPanel.width, nextPanel.height, theme);

        // Draw NEXT label
        const textConfig = nextPanel.text || {
            label: "NEXT",
            fontSize: "16px",
            fontFamily: "Arial",
            fontWeight: "bold",
            position: { x: 0, y: 15 }
        };
        // Allow themes to provide dynamic UI accents for NEXT label
        let nextAccent = (theme && typeof theme.getDynamicUIAccent === "function")
            ? (theme.getDynamicUIAccent({ role: "label", source: "next" }) || theme.ui.accent)
            : theme.ui.accent;
        ctx.fillStyle = nextAccent;
        ctx.font = `${textConfig.fontWeight} ${textConfig.fontSize} ${textConfig.fontFamily}`;
        ctx.textAlign = "center";
        ctx.fillText(
            textConfig.label,
            nextPanel.x + nextPanel.width / 2 + (textConfig.position?.x || 0),
            nextPanel.y + (textConfig.position?.y || 15)
        );

        // Show next pieces from player's individual queue
        if (player.nextQueue && player.nextQueue.length > 0) {
            const numPieces = Math.min(5, player.nextQueue.length);
            const slotHeight = nextPanel.height / numPieces;

            for (let i = 0; i < numPieces; i++) {
                const pieceType = player.nextQueue[i];
                const pieceSize = TETROMINOES[pieceType].size;
                const cellSize = nextPanel.cellSizes
                    ? nextPanel.cellSizes[i] || (i === 0 ? 16 : 12)
                    : i === 0
                      ? 16
                      : 12;

                const centerX = nextPanel.x + nextPanel.width / 2;
                const centerY = nextPanel.y + (i + 0.5) * slotHeight;

                const matrix = TETROMINOES[pieceType].shape;

                // Calculate visual center offset
                const visualCenter = this.utils.calculatePieceVisualCenter(matrix);
                const matrixCenterOffsetX = visualCenter.offsetX * cellSize;
                const matrixCenterOffsetY = visualCenter.offsetY * cellSize;

                const offsetX = centerX - (pieceSize * cellSize) / 2 + matrixCenterOffsetX;
                const offsetY = centerY - (pieceSize * cellSize) / 2 + matrixCenterOffsetY;
                const alpha = 1.0 - i * 0.15;

                // Draw the piece
                for (let dy = 0; dy < pieceSize; dy++) {
                    for (let dx = 0; dx < pieceSize; dx++) {
                        if (matrix[dy][dx]) {
                            const x = offsetX + dx * cellSize;
                            const y = offsetY + dy * cellSize;
                            this.utils.drawBlockPreview(
                                x,
                                y,
                                cellSize,
                                pieceType,
                                alpha,
                                theme,
                                { source: "next", index: i }
                            );
                        }
                    }
                }
            }
        }
    }

    /**
     * Draw score panel for a specific player
     */
    drawPlayerScorePanel(player, gameArea, uiLayout, theme) {
        const ctx = this.ctx;
        const scorePanel = uiLayout.score;

        this.utils.drawPanel(scorePanel.x, scorePanel.y, scorePanel.width, scorePanel.height, theme);

        // Score panel text configuration
        const textConfig = scorePanel.text || {
            labels: { score: "SCORE", level: "LEVEL", lines: "LINES" },
            labelStyle: { fontSize: "14px", fontFamily: "Arial", fontWeight: "bold" },
            valueStyle: { fontSize: "18px", fontFamily: "Arial", fontWeight: "normal" },
            positions: {
                scoreLabel: { x: 10, y: 20 },
                scoreValue: { x: 10, y: 40 },
                levelLabel: { x: 10, y: 60 },
                levelValue: { x: 10, y: 80 },
                linesLabel: { x: 10, y: 100 },
                linesValue: { x: 10, y: 120 }
            }
        };

        // SCORE label and value
        // Text uses ui.text; keep as-is for readability
        ctx.fillStyle = theme.ui.text;
        ctx.font = `${textConfig.labelStyle.fontWeight} ${textConfig.labelStyle.fontSize} ${textConfig.labelStyle.fontFamily}`;
        ctx.textAlign = "left";
        const scoreLabelPos = textConfig.positions.scoreLabel;
        ctx.fillText(textConfig.labels.score, scorePanel.x + scoreLabelPos.x, scorePanel.y + scoreLabelPos.y);

        ctx.font = `${textConfig.valueStyle.fontWeight} ${textConfig.valueStyle.fontSize} ${textConfig.valueStyle.fontFamily}`;

        // Dynamic accent for SCORE value
        let scoreAccent = (theme && typeof theme.getDynamicUIAccent === "function")
            ? (theme.getDynamicUIAccent({ role: "score", source: "score" }) || theme.ui.accent)
            : theme.ui.accent;
        ctx.fillStyle = scoreAccent;
        const scoreValuePos = textConfig.positions.scoreValue;
        ctx.fillText(player.score.toString(), scorePanel.x + scoreValuePos.x, scorePanel.y + scoreValuePos.y);

        // LEVEL label and value
        ctx.fillStyle = theme.ui.text;
        ctx.font = `${textConfig.labelStyle.fontWeight} ${textConfig.labelStyle.fontSize} ${textConfig.labelStyle.fontFamily}`;
        const levelLabelPos = textConfig.positions.levelLabel;
        ctx.fillText(textConfig.labels.level, scorePanel.x + levelLabelPos.x, scorePanel.y + levelLabelPos.y);

        ctx.font = `${textConfig.valueStyle.fontWeight} ${textConfig.valueStyle.fontSize} ${textConfig.valueStyle.fontFamily}`;

        // Dynamic accent for LEVEL value (fall back to score accent/ui.accent)
        let levelAccent = (theme && typeof theme.getDynamicUIAccent === "function")
            ? (theme.getDynamicUIAccent({ role: "level", source: "score" }) || scoreAccent || theme.ui.accent)
            : scoreAccent || theme.ui.accent;
        ctx.fillStyle = levelAccent;
        const levelValuePos = textConfig.positions.levelValue;
        ctx.fillText(player.level.toString(), scorePanel.x + levelValuePos.x, scorePanel.y + levelValuePos.y);

        // LINES label and value
        ctx.fillStyle = theme.ui.text;
        ctx.font = `${textConfig.labelStyle.fontWeight} ${textConfig.labelStyle.fontSize} ${textConfig.labelStyle.fontFamily}`;
        const linesLabelPos = textConfig.positions.linesLabel;
        ctx.fillText(textConfig.labels.lines, scorePanel.x + linesLabelPos.x, scorePanel.y + linesLabelPos.y);

        ctx.font = `${textConfig.valueStyle.fontWeight} ${textConfig.valueStyle.fontSize} ${textConfig.valueStyle.fontFamily}`;

        // Dynamic accent for LINES value (fall back similarly)
        let linesAccent = (theme && typeof theme.getDynamicUIAccent === "function")
            ? (theme.getDynamicUIAccent({ role: "lines", source: "score" }) || levelAccent || theme.ui.accent)
            : levelAccent || theme.ui.accent;
        ctx.fillStyle = linesAccent;
        const linesValuePos = textConfig.positions.linesValue;
        ctx.fillText(player.lines.toString(), scorePanel.x + linesValuePos.x, scorePanel.y + linesValuePos.y);
    }
    /**
     * Draw a pulsing red wifi icon above the opponent name when remote client is stale.
     * Uses SyncSystem.isRemoteStale so it directly matches the console log.
     */
    drawRemoteStaleIcon(layout, theme) {
        const ctx = this.ctx;
        const ui = layout.ui || {};
        const scorePanel = ui.score;

        if (!layout.gameArea || !scorePanel) {
            return;
        }

        // Derive anchor above the player name.
        // Player label is centered above the playfield (see LayoutManager), so we reconstruct that.
        const gameArea = layout.gameArea;
        const playerLabelCfg = ui.playerLabel || {};
        const gx = gameArea.x;
        const gw = TETRIS.GRID.COLS * gameArea.cellSize;

        const labelOffsetX =
            playerLabelCfg.position && typeof playerLabelCfg.position.x === "number" ? playerLabelCfg.position.x : 0;
        const labelOffsetY =
            playerLabelCfg.position && typeof playerLabelCfg.position.y === "number" ? playerLabelCfg.position.y : -15;

        const centerX = gx + gw / 2 + labelOffsetX;
        const nameY = gameArea.y + labelOffsetY;

        const iconWidth = 24;
        const iconHeight = 14;
        const x = centerX - iconWidth / 2;
        const y = nameY - iconHeight - 4; // just above the name

        // Time base for pulsing; fall back if game time not available.
        const nowSeconds =
            typeof performance !== "undefined" && performance.now ? performance.now() / 1000 : Date.now() / 1000;
        const pulse = (Math.sin(nowSeconds * 4) + 1) / 2; // 0..1
        const alpha = 0.5 + 0.5 * pulse; // 0.5..1.0

        ctx.save();
        ctx.globalAlpha = alpha;

        // High-contrast red; ignore theme so it's always readable.
        const color = "#ff3355";
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineCap = "round";

        // Move the whole icon further above the name for clarity
        const baseY = y + iconHeight - 40;

        // Wifi arcs (upright):
        // - Innermost: thinnest and closest to dot
        // - Outermost: thickest and highest
        const radii = [3.5, 8, 14];
        const widths = [1.75, 2.5, 3.5];

        for (let i = 0; i < radii.length; i++) {
            ctx.lineWidth = widths[i];
            ctx.beginPath();
            // Upright wifi: symmetric around vertical so it stays centered over centerX
            // -135deg to -45deg
            ctx.arc(centerX, baseY, radii[i], -Math.PI * 0.75, -Math.PI * 0.25, false);
            ctx.stroke();
        }

        // Signal dot at bottom center
        ctx.beginPath();
        ctx.arc(centerX, baseY + 3, 3, 0, Math.PI * 2, false);
        ctx.fill();

        ctx.restore();
    }
}

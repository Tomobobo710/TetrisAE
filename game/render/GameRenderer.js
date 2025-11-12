/**
 * GameRenderer - Handles game layer rendering (playfield, blocks, pieces)
 */
class GameRenderer {
    constructor(game) {
        this.game = game;
        this.ctx = game.gameCtx;
    }

    get utils() {
        return (this.game && this.game.uiRenderer && this.game.uiRenderer.utils)
            ? this.game.uiRenderer.utils
            : null;
    }

    /**
     * Draw complete game layer
     */
    drawGameLayer(game, theme, screenShake, flashEffect) {
        this.drawGameLayerAt(
            game,
            theme,
            screenShake,
            flashEffect,
            TETRIS.GRID.X,
            TETRIS.GRID.Y,
            TETRIS.GRID.CELL_SIZE
        );
    }

    /**
     * Draw complete game layer at specific position (for 2-player mode)
     */
    drawGameLayerAt(game, theme, screenShake, flashEffect, gridX, gridY, cellSize = TETRIS.GRID.CELL_SIZE) {
        const ctx = this.ctx;

        // Calculate dimensions from cell size (consistent API)
        const gridWidth = TETRIS.GRID.COLS * cellSize;
        const gridHeight = TETRIS.GRID.VISIBLE_ROWS * cellSize;

        // Calculate screen shake offset
        let shakeX = 0;
        let shakeY = 0;
        if (screenShake.intensity > 0) {
            shakeX = (Math.random() - 0.5) * screenShake.intensity;
            shakeY = (Math.random() - 0.5) * screenShake.intensity;
        }

        // Apply screen shake if active
        ctx.save();
        if (screenShake.intensity > 0) {
            ctx.translate(shakeX, shakeY);
        }

        // Draw playfield elements
        if (game.gameState !== "title") {
            this.drawPlayfieldAt(theme, gridX, gridY, gridWidth, gridHeight, cellSize);
            this.drawGridLinesAt(theme, gridX, gridY, gridWidth, gridHeight, cellSize);

            // Compute per-row fade for clearing lines (purely from effect; no cross-frame state)
            let fadeLookup = null;
            if (game.lineClearEffect && game.lineClearEffect.active && Array.isArray(game.lineClearEffect.lines)) {
                const p = game.lineClearEffect.progress || 0;
                // Ease near the end so most fade happens in the last part of the animation
                const eased = p < 0.7 ? 0 : (p - 0.7) / 0.3; // 0 until 70%, then 0->1 over last 30%
                const fade = 1 - Math.max(0, Math.min(1, eased)); // 1 -> 0
                fadeLookup = {};
                game.lineClearEffect.lines.forEach((row) => {
                    fadeLookup[row] = fade;
                });
            }

            // 1) Draw locked blocks with fade on clearing rows
            this.drawLockedBlocksAt(
                game.grid,
                theme,
                gridX,
                gridY,
                cellSize,
                game.justLockedPositions || [],
                fadeLookup
            );

            // 2) Draw current piece only if it's NOT on a clearing line.
            // Once handlePlayerLineClear is triggered, the completed rows are in the grid
            // and this current piece should no longer visually contribute to those rows.
            const isRowClearing = (y) => fadeLookup && Object.prototype.hasOwnProperty.call(fadeLookup, y);

            if (game.currentPiece && game.gameState === "playing") {
                // Check if any cell of currentPiece lies on a clearing line; if so, skip drawing it.
                const matrix = this.getRotatedPiece(game.currentPiece, game.currentRotation);
                const size = matrix.length;
                let overlapsClearingLine = false;

                for (let dy = 0; dy < size && !overlapsClearingLine; dy++) {
                    for (let dx = 0; dx < size && !overlapsClearingLine; dx++) {
                        if (!matrix[dy][dx]) continue;
                        const gridY_pos = game.currentY + dy;
                        if (isRowClearing(gridY_pos)) {
                            overlapsClearingLine = true;
                        }
                    }
                }

                if (!overlapsClearingLine) {
                    if (game.gameSettings.ghostPieceEnabled) {
                        this.drawGhostPieceAt(game, theme, gridX, gridY, cellSize);
                    }
                    this.drawCurrentPieceAt(game, theme, gridX, gridY, cellSize);
                }
            }

            // Draw current piece on game over so player sees what caused the loss
            if (game.currentPiece && game.gameState === "gameOver") {
                this.drawCurrentPieceAt(game, theme, gridX, gridY, cellSize);
            }

            // Draw line clear effect
            if (game.lineClearEffect.active) {
                this.drawLineClearEffectAt(game.lineClearEffect, theme, gridX, gridY, cellSize, gridWidth);
            }
            
            // Draw T-SPIN text effect (completely separate)
            if (game.tSpinTextEffect?.active) {
                this.drawTSpinOnlyText(game.tSpinTextEffect, theme, gridX, gridY, cellSize, gridWidth);
            }
        }

        ctx.restore();

        // Draw flash effect
        if (flashEffect.active && flashEffect.alpha > 0) {
            ctx.fillStyle = flashEffect.color;
            ctx.globalAlpha = flashEffect.alpha;
            ctx.fillRect(0, 0, TETRIS.WIDTH, TETRIS.HEIGHT);
            ctx.globalAlpha = 1.0;
        }
    }

    drawPlayfield(theme) {
        this.drawPlayfieldAt(theme, TETRIS.GRID.X, TETRIS.GRID.Y);
    }

    drawPlayfieldAt(theme, x, y, w = TETRIS.GRID.WIDTH, h = TETRIS.GRID.HEIGHT, cellSize = TETRIS.GRID.CELL_SIZE) {
        const ctx = this.ctx;
        const spawnZoneHeight = cellSize * 2; // 2 rows above for spawn zone

        // Draw spawn zone (semi-transparent area above playfield)
        const spawnGradient = ctx.createLinearGradient(x, y - spawnZoneHeight, x, y);
        spawnGradient.addColorStop(0, "rgba(0, 0, 0, 0.3)");
        spawnGradient.addColorStop(1, theme.playfield.background);

        ctx.fillStyle = spawnGradient;
        ctx.fillRect(x, y - spawnZoneHeight, w, spawnZoneHeight);

        // Draw main playfield
        const bgGradient = ctx.createLinearGradient(x, y, x, y + h);
        bgGradient.addColorStop(0, theme.playfield.background);
        bgGradient.addColorStop(
            1,
            this.utils
                ? this.utils.darkenColor(theme.playfield.background, 0.2)
                : theme.playfield.background
        );

        ctx.fillStyle = bgGradient;
        ctx.fillRect(x, y, w, h);

        // Draw border OUTSET from the grid bounds (extends outward, not inward)
        const outset = 2; // Outset amount to push border outside grid area

        ctx.strokeStyle = theme.playfield.border;
        ctx.lineWidth = 3;
        ctx.shadowColor = theme.playfield.border;
        ctx.shadowBlur = 15;
        ctx.strokeRect(x - outset, y - outset, w + outset * 2, h + outset * 2);
        ctx.shadowBlur = 0;

        ctx.strokeStyle = this.utils
            ? this.utils.lightenColor(theme.playfield.border, 0.3)
            : theme.playfield.border;
        ctx.lineWidth = 1;
        ctx.strokeRect(x - outset + 2, y - outset + 2, w + outset * 2 - 4, h + outset * 2 - 4);
    }

    drawGridLines(theme) {
        this.drawGridLinesAt(theme, TETRIS.GRID.X, TETRIS.GRID.Y);
    }

    drawGridLinesAt(theme, x, y, w = TETRIS.GRID.WIDTH, h = TETRIS.GRID.HEIGHT, cellSize = TETRIS.GRID.CELL_SIZE) {
        const ctx = this.ctx;

        ctx.strokeStyle = theme.playfield.grid;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.5;

        for (let col = 1; col < TETRIS.GRID.COLS; col++) {
            ctx.beginPath();
            ctx.moveTo(x + col * cellSize, y);
            ctx.lineTo(x + col * cellSize, y + h);
            ctx.stroke();
        }

        for (let row = 1; row < TETRIS.GRID.VISIBLE_ROWS; row++) {
            ctx.beginPath();
            ctx.moveTo(x, y + row * cellSize);
            ctx.lineTo(x + w, y + row * cellSize);
            ctx.stroke();
        }

        ctx.globalAlpha = 1.0;
    }

    drawLockedBlocks(grid, theme) {
        this.drawLockedBlocksAt(grid, theme, TETRIS.GRID.X, TETRIS.GRID.Y);
    }

    drawLockedBlocksAt(
        grid,
        theme,
        gridX,
        gridY,
        cellSize = TETRIS.GRID.CELL_SIZE,
        justLockedPositions = [],
        lineClearFadeByRow = null
    ) {
        // Render all rows including buffer zone (use actual grid length to handle dynamic sizes)
        for (let row = 0; row < grid.length; row++) {
            for (let col = 0; col < TETRIS.GRID.COLS; col++) {
                const blockType = grid[row][col];
                if (blockType !== null) {
                    const x = gridX + col * cellSize;
                    // Map grid row to screen Y (row 4 = top of visible playfield)
                    const visualRow = row - TETRIS.GRID.BUFFER_ROWS;
                    const y = gridY + visualRow * cellSize;

                    // Check if this position was just locked for flash effect
                    const isJustLocked = justLockedPositions.some((pos) => pos.x === col && pos.y === row);
                    let finalAlpha = isJustLocked ? 1.5 : 1.0; // Flash effect for just-locked blocks

                    // If we have a fade map from the active line clear effect, fade those rows
                    if (lineClearFadeByRow && lineClearFadeByRow[row] !== undefined) {
                        finalAlpha *= lineClearFadeByRow[row];
                    }

                    this.drawBlock(x, y, cellSize, blockType, finalAlpha, false, theme, gridY);
                }
            }
        }
    }

    drawGhostPiece(game, theme) {
        this.drawGhostPieceAt(game, theme, TETRIS.GRID.X, TETRIS.GRID.Y);
    }

    drawGhostPieceAt(game, theme, gridX, gridY, cellSize = TETRIS.GRID.CELL_SIZE) {
        const matrix = this.getRotatedPiece(game.currentPiece, game.currentRotation);
        const size = matrix.length;
        const baseGhostOpacity = TETRIS.VISUAL.GHOST_PIECE_OPACITY;

        for (let dy = 0; dy < size; dy++) {
            for (let dx = 0; dx < size; dx++) {
                if (matrix[dy][dx]) {
                    const gridY_pos = game.ghostY + dy;
                    const visualRow = gridY_pos - TETRIS.GRID.BUFFER_ROWS;
                    const x = gridX + (game.currentX + dx) * cellSize;
                    const y = gridY + visualRow * cellSize;

                    // Ghost piece uses base ghost opacity - spawn zone gradient will handle fading
                    this.drawBlock(x, y, cellSize, game.currentPiece, baseGhostOpacity, true, theme, gridY);
                }
            }
        }
    }

    drawCurrentPiece(game, theme) {
        this.drawCurrentPieceAt(game, theme, TETRIS.GRID.X, TETRIS.GRID.Y);
    }

    drawCurrentPieceAt(game, theme, gridX, gridY, cellSize = TETRIS.GRID.CELL_SIZE) {
        const matrix = this.getRotatedPiece(game.currentPiece, game.currentRotation);
        const size = matrix.length;
        const baseAlpha = game.spawnFlash > 0 ? 1.0 + game.spawnFlash * 0.5 : 1.0;

        for (let dy = 0; dy < size; dy++) {
            for (let dx = 0; dx < size; dx++) {
                if (matrix[dy][dx]) {
                    const gridY_pos = game.currentY + dy;
                    const visualRow = gridY_pos - TETRIS.GRID.BUFFER_ROWS;
                    const x = gridX + (game.currentX + dx) * cellSize;
                    const y = gridY + visualRow * cellSize;

                    // Current piece uses base alpha (with spawn flash) - spawn zone gradient will handle fading
                    this.drawBlock(x, y, cellSize, game.currentPiece, baseAlpha, false, theme, gridY);
                }
            }
        }
    }

    drawBlock(x, y, size, blockType, alpha = 1.0, isGhost = false, theme, gridY = 0) {
        const ctx = this.ctx;
        const cellSize = size;
        const spawnZoneHeight = cellSize * 2; // 2 rows
        const spawnZoneTop = gridY - spawnZoneHeight;
        const spawnZoneBottom = gridY;

        const blockTop = y;
        const blockBottom = y + size;

        // Don't render blocks completely above spawn zone (0% opacity)
        if (blockBottom <= spawnZoneTop) {
            return; // Block is entirely above spawn zone - invisible
        }

        // Check if block overlaps with spawn zone at all
        const inSpawnZone = blockTop < spawnZoneBottom;

        if (inSpawnZone) {
            // Block is in spawn zone - apply per-pixel gradient
            ctx.save();

            // Step 1: Draw the block normally
            this.drawBlockNormal(x, y, size, blockType, alpha, isGhost, theme);

            // Step 2: Apply gradient mask for per-pixel fade
            // Clip to just this block's area
            ctx.beginPath();
            ctx.rect(x, y, size, size);
            ctx.clip();

            // Create gradient that spans the entire spawn zone with exponential curve
            // Most of the area stays near 0% opacity, then ramps up aggressively near bottom
            const gradient = ctx.createLinearGradient(0, spawnZoneTop, 0, spawnZoneBottom);
            gradient.addColorStop(0, "rgba(255, 255, 255, 0)"); // Top: 0% opacity
            gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.1)"); // Halfway: still only 10%
            gradient.addColorStop(0.7, "rgba(255, 255, 255, 0.3)"); // 70%: 30% opacity
            gradient.addColorStop(0.85, "rgba(255, 255, 255, 0.6)"); // 85%: 60% opacity
            gradient.addColorStop(1, "rgba(255, 255, 255, 1)"); // Bottom: 100% opacity

            // Use destination-in to apply gradient as alpha mask
            ctx.globalCompositeOperation = "destination-in";
            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, size, size);

            ctx.restore();
        } else {
            // Block is not in spawn zone - draw normally
            this.drawBlockNormal(x, y, size, blockType, alpha, isGhost, theme);
        }
    }

    /**
     * Normal block rendering for blocks not in gradient zone
     */
    drawBlockNormal(x, y, size, blockType, alpha, isGhost, theme) {
        const ctx = this.ctx;

        // Allow themes to override tetromino colors dynamically (Tunnel, etc.)
        let colors = theme.pieces[blockType];
        if (theme && typeof theme.getDynamicPieceColors === "function") {
            const dynamic = theme.getDynamicPieceColors(blockType, {
                source: isGhost ? "ghost" : "playfield",
                alpha: alpha,
                // Treat >1 alpha used for just-locked flash as "locked"/impact state if needed
                state: !isGhost && alpha > 1.0 ? "locked_flash" : "normal"
            });
            if (dynamic && dynamic.base && dynamic.shadow) {
                colors = dynamic;
            }
        }

        const padding = 1;

        ctx.save();
        ctx.globalAlpha = alpha;

        if (isGhost) {
            // Ghost piece outline color may also be themed dynamically
            let ghostColor = theme.playfield.shadow;
            if (theme && typeof theme.getDynamicPieceColors === "function") {
                const dynamicGhost = theme.getDynamicPieceColors(blockType, {
                    source: "ghost",
                    alpha: alpha
                });
                if (dynamicGhost && dynamicGhost.shadow) {
                    ghostColor = dynamicGhost.shadow;
                }
            }
            ctx.strokeStyle = ghostColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(x + padding, y + padding, size - padding * 2, size - padding * 2);
        } else {
            const gradient = ctx.createLinearGradient(x, y, x, y + size);
            gradient.addColorStop(
                0,
                this.utils
                    ? this.utils.lightenColor(colors.base, 0.3)
                    : colors.base
            );
            gradient.addColorStop(0.5, colors.base);
            gradient.addColorStop(1, colors.shadow);

            ctx.fillStyle = gradient;
            ctx.fillRect(x + padding, y + padding, size - padding * 2, size - padding * 2);

            const highlightGradient = ctx.createLinearGradient(x, y, x, y + size * 0.3);
            highlightGradient.addColorStop(0, "rgba(255, 255, 255, 0.4)");
            highlightGradient.addColorStop(1, "rgba(255, 255, 255, 0)");

            ctx.fillStyle = highlightGradient;
            ctx.fillRect(x + padding, y + padding, size - padding * 2, size * 0.3);

            if (alpha > 1.0) {
                ctx.shadowColor = colors.glow;
                ctx.shadowBlur = 20;
                ctx.strokeStyle = colors.glow;
                ctx.lineWidth = 2;
                ctx.strokeRect(x + padding, y + padding, size - padding * 2, size - padding * 2);
                ctx.shadowBlur = 0;
            }

            ctx.strokeStyle = colors.shadow;
            ctx.lineWidth = 1;
            ctx.strokeRect(x + padding, y + padding, size - padding * 2, size - padding * 2);

            ctx.strokeStyle = this.utils
                ? this.utils.lightenColor(colors.base, 0.5)
                : colors.base;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x + padding, y + size - padding);
            ctx.lineTo(x + padding, y + padding);
            ctx.lineTo(x + size - padding, y + padding);
            ctx.stroke();
        }

        ctx.restore();
    }

    drawLineClearEffect(effect, theme) {
        this.drawLineClearEffectAt(effect, theme, TETRIS.GRID.X, TETRIS.GRID.Y);
    }

    drawLineClearEffectAt(
        effect,
        theme,
        gridX,
        gridY,
        cellSize = TETRIS.GRID.CELL_SIZE,
        gridWidth = TETRIS.GRID.WIDTH
    ) {
        const ctx = this.ctx;
        const progress = effect.progress || 0;

        // PERFECT CLEAR: standalone "PERFECT CLEAR!" effect overrides normal per-line visuals.
        if (effect.clearType === "perfect_clear") {
            this.drawPerfectClearText(effect, theme, gridX, gridY, cellSize, gridWidth);
            ctx.globalAlpha = 1.0;
            return;
        }

        // Determine base text from number of lines cleared
        const numLines = effect.lines.length;
        let baseText = "";
        switch (numLines) {
            case 1:
                baseText = "SINGLE";
                break;
            case 2:
                baseText = "DOUBLE";
                break;
            case 3:
                baseText = "TRIPLE";
                break;
            case 4:
                baseText = "TETRIS";
                break;
            default:
                baseText = "CLEAR";
                break;
        }

        // Support T-SPIN labeling via effect.clearType (if provided by GameManager):
        // If any T-Spin that clears lines, prefix with "T-SPIN"
        let clearText = baseText;
        if (effect.clearType && typeof effect.clearType === "string") {
            const type = effect.clearType.toLowerCase();
            if (type.includes("tspin") || type.includes("t-spin")) {
                clearText = `T-SPIN ${baseText}`;
            }
        }

        // Draw T-SPIN text from separate tSpinTextEffect (not coupled to line clearing)
        // This is passed separately by the caller
        
        // For 0-line T-spins, we're done (no line clear animation needed)
        if (effect.lines.length === 0) {
            ctx.globalAlpha = 1.0;
            return;
        }
        
        // For T-spins with lines, continue to draw the line clear animation below

        // Determine if this clear is marked as Back-to-Back for visual purposes
        const hasBackToBack = !!effect.isBackToBack;

        // Precompute the highest cleared row for a single B2B label anchor
        let highestYForB2B = null;
        if (hasBackToBack && effect.lines.length > 0) {
            const highestRow = Math.min(...effect.lines);
            const highestVisualRow = highestRow - TETRIS.GRID.BUFFER_ROWS;
            highestYForB2B = gridY + highestVisualRow * cellSize;
        }

        effect.lines.forEach((row) => {
            const visualRow = row - TETRIS.GRID.BUFFER_ROWS;
            const y = gridY + visualRow * cellSize;
            const flashWidth = gridWidth * progress;
            const flashX = gridX + (gridWidth - flashWidth) / 2;

            // 1) Base line flash behind everything
            ctx.fillStyle = theme.ui.accent;
            ctx.globalAlpha = (1 - progress) * 0.8;
            ctx.fillRect(flashX, y, flashWidth, cellSize);

            // 2) Particles (middle layer)
            // Symmetric outside-in particle motion along the cleared line.
            // Starts at the edges and converges toward the center as the animation progresses.
            const particleCount = 16;
            const centerX = gridX + gridWidth / 2;
            const centerY = y + cellSize / 2;

            for (let i = 0; i < particleCount; i++) {
                // 0..1 across the half-width
                const t = particleCount === 1 ? 0 : i / (particleCount - 1);
                // Bias so more particles appear near the edges initially
                const radial = t * t;

                // Max distance from center (edges) for this particle slot
                const maxOffset = radial * (gridWidth / 2);

                // Outside-in: at progress=0 use full maxOffset (near edges),
                // then contract toward center linearly over the full animation.
                const travel = maxOffset * (1 - progress);

                // Strong, clear visuals
                const baseAlpha = 0.9 * (1 - progress * 0.3); // Fade a bit over time

                // Size shrinks to 0 by end of lifespan:
                // - Larger early, smoothly tapering off so final frames are effectively invisible.
                const life = Math.min(1, progress * 2); // 0..1 over first half (aligned with contraction)
                const baseSize = 6 * (1 - life); // 6 -> 0

                if (baseAlpha <= 0 || baseSize <= 0.05) {
                    continue;
                }

                ctx.fillStyle = theme.ui.accent;

                // Draw a crisp 5-point star (not just a diamond) for each particle
                const drawStar = (cx, cy, radius, alpha) => {
                    if (radius <= 0) return;

                    const spikes = 5;
                    const innerRadius = radius * 0.45;
                    const step = Math.PI / spikes;

                    ctx.save();
                    ctx.globalAlpha = alpha;
                    ctx.translate(cx, cy);

                    ctx.beginPath();
                    // Start at top point
                    ctx.moveTo(0, -radius);

                    // Alternate outer and inner points around the circle
                    for (let i = 0; i < spikes; i++) {
                        const outerAngle = i * 2 * step;
                        const innerAngle = outerAngle + step;

                        // Outer point
                        ctx.lineTo(Math.sin(outerAngle) * radius, -Math.cos(outerAngle) * radius);

                        // Inner point
                        ctx.lineTo(Math.sin(innerAngle) * innerRadius, -Math.cos(innerAngle) * innerRadius);
                    }

                    ctx.closePath();

                    ctx.fillStyle = theme.ui.accent;
                    ctx.shadowColor = theme.ui.accent;
                    ctx.shadowBlur = radius * 1.5;
                    ctx.fill();

                    ctx.restore();
                };

                // Left star (moves from left edge region toward center)
                drawStar(centerX - travel, centerY, baseSize, baseAlpha);

                // Right star (moves from right edge region toward center)
                drawStar(centerX + travel, centerY, baseSize, baseAlpha);
            }

            // 3) Text label with CRT power-off collapse effect (TOP layer above particles)
            ctx.save();

            const textX = centerX;
            const textY = centerY;

            let scaleX = 1;
            let scaleY = 1;
            let textAlpha = 1;

            if (progress < 0.5) {
                // First half: collapse vertically into a thin horizontal line
                const collapseProgress = progress / 0.5;
                scaleY = 1 - collapseProgress * 0.95;
                textAlpha = 1.0;
            } else {
                // Second half: collapse horizontally and fade out
                const collapseProgress = (progress - 0.5) / 0.5;
                scaleY = 0.05;
                scaleX = 1 - collapseProgress;
                textAlpha = 1 - collapseProgress;
            }

            // Final bright flash (last 10% of animation)
            if (progress > 0.9) {
                const flashProgress = (progress - 0.9) / 0.1;
                textAlpha = 1 - flashProgress;

                ctx.globalAlpha = (1 - flashProgress) * 2;
                ctx.fillStyle = theme.ui.accent;
                ctx.shadowColor = theme.ui.accent;
                ctx.shadowBlur = 30 * (1 - flashProgress);
                ctx.beginPath();
                ctx.arc(textX, textY, 3 * (1 - flashProgress), 0, Math.PI * 2);
                ctx.fill();
            }

            // Apply transforms for text after flash point
            ctx.translate(textX, textY);
            ctx.scale(scaleX, scaleY);
            ctx.translate(-textX, -textY);

            ctx.globalAlpha = textAlpha;
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 18px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            // Strong dark shadow so text reads clearly over particles
            ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
            ctx.shadowBlur = 8;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            ctx.fillText(clearText, textX, textY);

            // Accent glow pass
            ctx.shadowColor = theme.ui.accent;
            ctx.shadowBlur = 15;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.fillText(clearText, textX, textY);

            ctx.restore();
        });

        // 4) Optional Back-to-Back label:
        // DRAW ONCE per clear, at the highest cleared line, one cell above.
        if (hasBackToBack && highestYForB2B !== null) {
            const b2bTextX = gridX + gridWidth / 2;
            const b2bTextY = highestYForB2B - cellSize; // one line above highest clear
            this.drawBackToBackOnlyText(effect, theme, b2bTextX, b2bTextY);
        }

        // Restore alpha after all rows
        ctx.globalAlpha = 1.0;
    }

    /**
     * Draw a standalone "T-SPIN" CRT-style text effect (no line flash/particles).
     * Used for 0-line T-Spins to distinguish from regular line clear animations.
     */
    drawTSpinOnlyText(effect, theme, gridX, gridY, cellSize = TETRIS.GRID.CELL_SIZE, gridWidth = TETRIS.GRID.WIDTH) {
        const ctx = this.ctx;
        const progress = effect.progress || 0;

        const clearText = "T-SPIN";

        // Center horizontally over playfield; vertically at upper third of visible area
        const textX = gridX + gridWidth / 2;
        const textY = gridY + TETRIS.GRID.VISIBLE_ROWS * cellSize * 0.3;

        ctx.save();

        let scaleX = 1;
        let scaleY = 1;
        let alpha = 1;

        if (progress < 0.2) {
            // Quick appear: stretch from a thin line
            const t = progress / 0.2;
            scaleY = 0.2 + 0.8 * t;
            alpha = t;
        } else if (progress < 0.7) {
            // Hold phase
            scaleY = 1;
            alpha = 1;
        } else if (progress < 0.9) {
            // Vertical collapse
            const t = (progress - 0.7) / 0.2;
            scaleY = 1 - 0.95 * t; // 1 -> 0.05
            alpha = 1 - 0.3 * t;
        } else {
            // Final CRT dot fade
            const t = (progress - 0.9) / 0.1;
            scaleX = 1 - t;
            scaleY = 0.05;
            alpha = 1 - t;
        }

        ctx.translate(textX, textY);
        ctx.scale(scaleX, scaleY);
        ctx.translate(-textX, -textY);

        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 22px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Strong black shadow for contrast
        ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        ctx.fillText(clearText, textX, textY);

        // Accent glow overlay
        ctx.shadowColor = theme.ui.accent;
        ctx.shadowBlur = 18;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.fillText(clearText, textX, textY);

        ctx.restore();
    }

    /**
     * Draw a standalone "BACK-TO-BACK" CRT-style text effect above a clear.
     * Invoked only when effect.isBackToBack is true for that line clear.
     */
    drawBackToBackOnlyText(effect, theme, textX, textY) {
        const ctx = this.ctx;
        const progress = effect.progress || 0;

        const label = "BACK-TO-BACK";

        ctx.save();

        // Timing aligned with main line clear animation; subtle but clear.
        let scaleX = 1;
        let scaleY = 1;
        let alpha = 1;

        if (progress < 0.2) {
            // Pop in quickly from a horizontal line
            const t = progress / 0.2;
            scaleY = 0.2 + 0.8 * t;
            alpha = t;
        } else if (progress < 0.8) {
            // Hold visible
            scaleY = 1.0;
            alpha = 1.0;
        } else {
            // Fade and slight shrink
            const t = (progress - 0.8) / 0.2;
            scaleY = 1.0 - 0.3 * t;
            scaleX = 1.0 - 0.2 * t;
            alpha = 1.0 - t;
        }

        ctx.translate(textX, textY);
        ctx.scale(scaleX, scaleY);
        ctx.translate(-textX, -textY);

        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Dark shadow for legibility
        ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.fillText(label, textX, textY);

        // Accent glow, subtle
        ctx.shadowColor = theme.ui.accent;
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.fillText(label, textX, textY);

        ctx.restore();
    }

    /**
     * Draw a standalone "T-SPIN" CRT-style text effect (no line flash/particles).
     * Used for 0-line T-Spins to distinguish from regular line clear animations.
     */
    drawTSpinOnlyText(effect, theme, gridX, gridY, cellSize = TETRIS.GRID.CELL_SIZE, gridWidth = TETRIS.GRID.WIDTH) {
        const ctx = this.ctx;
        const progress = effect.progress || 0;

        const clearText = "T-SPIN";

        // Center horizontally over playfield; vertically at upper third of visible area
        const textX = gridX + gridWidth / 2;
        const textY = gridY + TETRIS.GRID.VISIBLE_ROWS * cellSize * 0.3;

        ctx.save();

        let scaleX = 1;
        let scaleY = 1;
        let alpha = 1;

        if (progress < 0.2) {
            // Quick appear: stretch from a thin line
            const t = progress / 0.2;
            scaleY = 0.2 + 0.8 * t;
            alpha = t;
        } else if (progress < 0.7) {
            // Hold phase
            scaleY = 1;
            alpha = 1;
        } else if (progress < 0.9) {
            // Vertical collapse
            const t = (progress - 0.7) / 0.2;
            scaleY = 1 - 0.95 * t; // 1 -> 0.05
            alpha = 1 - 0.3 * t;
        } else {
            // Final CRT dot fade
            const t = (progress - 0.9) / 0.1;
            scaleX = 1 - t;
            scaleY = 0.05;
            alpha = 1 - t;
        }

        ctx.translate(textX, textY);
        ctx.scale(scaleX, scaleY);
        ctx.translate(-textX, -textY);

        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 22px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Strong black shadow for contrast
        ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        ctx.fillText(clearText, textX, textY);

        // Accent glow overlay
        ctx.shadowColor = theme.ui.accent;
        ctx.shadowBlur = 18;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.fillText(clearText, textX, textY);

        ctx.restore();
    }

    /**
     * Draw a "PERFECT CLEAR!" effect, constrained to the playfield with no background band.
     * Smaller text so it never spills outside the grid area.
     */
    drawPerfectClearText(effect, theme, gridX, gridY, cellSize = TETRIS.GRID.CELL_SIZE, gridWidth = TETRIS.GRID.WIDTH) {
        const ctx = this.ctx;
        const progress = effect.progress || 0;

        const text = "PERFECT CLEAR!";

        // Center within the visible playfield area
        const textX = gridX + gridWidth / 2;
        const textY = gridY + (TETRIS.GRID.VISIBLE_ROWS * cellSize) * 0.5;

        ctx.save();

        // Simple timing: quick appear, short hold, smooth fade
        const appear = Math.min(1, progress / 0.1);
        let fade = 0;
        if (progress > 0.5) {
            fade = (progress - 0.5) / 0.5;
        }

        // Fixed, smaller scale and font to avoid clipping
        const scale = 1.0;
        const alpha = Math.max(0, Math.min(1, appear * (1 - fade)));

        ctx.translate(textX, textY);
        ctx.scale(scale, scale);
        ctx.translate(-textX, -textY);

        ctx.globalAlpha = alpha;

        // Smaller, clean text
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 22px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Light outline / glow for readability, no giant band/flash
        ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.fillText(text, textX, textY);

        ctx.shadowColor = theme.ui.accent;
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.fillText(text, textX, textY);

        ctx.restore();
    }

    getRotatedPiece(pieceType, rotation) {
        let matrix = TETROMINOES[pieceType].shape;
        for (let i = 0; i < rotation; i++) {
            matrix = this.rotateMatrix(matrix);
        }
        return matrix;
    }

    rotateMatrix(matrix) {
        const size = matrix.length;
        const rotated = [];
        for (let y = 0; y < size; y++) {
            rotated[y] = [];
            for (let x = 0; x < size; x++) {
                rotated[y][x] = matrix[size - 1 - x][y];
            }
        }
        return rotated;
    }
    
}

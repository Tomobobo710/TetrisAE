/**
 * UIRenderUtils - Shared rendering utilities for all UI renderers
 */
class UIRenderUtils {
    constructor(ctx) {
        this.ctx = ctx;
    }

    /**
     * Draw a panel with gradient background and borders
     */
    drawPanel(x, y, width, height, theme) {
        const ctx = this.ctx;
        const gradient = ctx.createLinearGradient(x, y, x, y + height);
        gradient.addColorStop(0, theme.ui.background);
        gradient.addColorStop(1, this.darkenColor(theme.ui.background, 0.3));

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, width, height);

        ctx.strokeStyle = theme.ui.border;
        ctx.lineWidth = 2;
        ctx.shadowColor = theme.ui.border;
        ctx.shadowBlur = 10;
        ctx.strokeRect(x, y, width, height);
        ctx.shadowBlur = 0;

        ctx.strokeStyle = this.lightenColor(theme.ui.border, 0.3);
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 2, y + 2, width - 4, height - 4);
    }

    /**
     * Draw text with black outline for readability
     */
    drawTextBackdrop(text, textX, textY, font, textColor, theme, outlineThickness = 2) {
        const ctx = this.ctx;

        // Set font for text measurements
        ctx.font = font;

        // Scale outline points based on thickness parameter
        const baseThickness = outlineThickness;
        const outlinePoints = [
            { x: -baseThickness, y: -baseThickness },
            { x: baseThickness, y: -baseThickness },
            { x: -baseThickness, y: baseThickness },
            { x: baseThickness, y: baseThickness }, // Corners
            { x: 0, y: -baseThickness - 1 },
            { x: 0, y: baseThickness + 1 },
            { x: -baseThickness - 1, y: 0 },
            { x: baseThickness + 1, y: 0 }, // Cardinal directions
            { x: -Math.floor(baseThickness / 2), y: -baseThickness },
            { x: Math.floor(baseThickness / 2), y: -baseThickness },
            { x: -baseThickness, y: -Math.floor(baseThickness / 2) },
            { x: baseThickness, y: -Math.floor(baseThickness / 2) }, // Inner corners
            { x: -Math.floor(baseThickness / 2), y: baseThickness },
            { x: Math.floor(baseThickness / 2), y: baseThickness },
            { x: -baseThickness, y: Math.floor(baseThickness / 2) },
            { x: baseThickness, y: Math.floor(baseThickness / 2) }
        ];

        // Draw black outline
        ctx.fillStyle = "black";
        ctx.textAlign = "center";
        outlinePoints.forEach((point) => {
            ctx.fillText(text, textX + point.x, textY + point.y);
        });

        // Draw main text with subtle shadow
        ctx.shadowColor = theme.ui.accent;
        ctx.shadowBlur = 6;
        ctx.fillStyle = textColor;
        ctx.textAlign = "center";
        ctx.fillText(text, textX, textY);

        ctx.shadowBlur = 0; // Reset shadow
    }

    /**
     * Calculate the visual center offset for a tetromino piece
     */
    calculatePieceVisualCenter(matrix) {
        if (!matrix || matrix.length === 0) {
            return { offsetX: 0, offsetY: 0 };
        }

        // Find the actual bounds of the piece shape
        let minX = matrix.length;
        let maxX = 0;
        let minY = matrix.length;
        let maxY = 0;

        for (let y = 0; y < matrix.length; y++) {
            for (let x = 0; x < matrix[y].length; x++) {
                if (matrix[y][x]) {
                    minX = Math.min(minX, x);
                    maxX = Math.max(maxX, x);
                    minY = Math.min(minY, y);
                    maxY = Math.max(maxY, y);
                }
            }
        }

        // Calculate visual center of the actual shape
        const visualWidth = maxX - minX + 1;
        const visualHeight = maxY - minY + 1;
        const visualCenterX = minX + visualWidth / 2;
        const visualCenterY = minY + visualHeight / 2;

        // Calculate offset from matrix center to visual center
        const matrixCenter = matrix.length / 2;
        const offsetX = matrixCenter - visualCenterX;
        const offsetY = matrixCenter - visualCenterY;

        return { offsetX, offsetY };
    }

    /**
     * Draw a preview block with gradient and styling
     */
    drawBlockPreview(x, y, size, blockType, alpha, theme) {
        const ctx = this.ctx;
        const colors = theme.pieces[blockType];
        const padding = 1;

        ctx.save();
        ctx.globalAlpha = alpha;

        const gradient = ctx.createLinearGradient(x, y, x, y + size);
        gradient.addColorStop(0, this.lightenColor(colors.base, 0.3));
        gradient.addColorStop(0.5, colors.base);
        gradient.addColorStop(1, colors.shadow);

        ctx.fillStyle = gradient;
        ctx.fillRect(x + padding, y + padding, size - padding * 2, size - padding * 2);

        const highlightGradient = ctx.createLinearGradient(x, y, x, y + size * 0.3);
        highlightGradient.addColorStop(0, "rgba(255, 255, 255, 0.4)");
        highlightGradient.addColorStop(1, "rgba(255, 255, 255, 0)");

        ctx.fillStyle = highlightGradient;
        ctx.fillRect(x + padding, y + padding, size - padding * 2, size * 0.3);

        ctx.strokeStyle = colors.shadow;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + padding, y + padding, size - padding * 2, size - padding * 2);

        ctx.restore();
    }

    /**
     * Draw a rounded rectangle
     */
    drawRoundedRect(x, y, width, height, radius, strokeOnly = false) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();

        if (strokeOnly) {
            ctx.stroke();
        } else {
            ctx.fill();
        }
    }

    /**
     * Lighten a color by a factor
     */
    lightenColor(color, factor) {
        if (color.startsWith("rgba")) return color;
        const hex = color.replace("#", "");
        const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + (255 - parseInt(hex.substr(0, 2), 16)) * factor);
        const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + (255 - parseInt(hex.substr(2, 2), 16)) * factor);
        const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + (255 - parseInt(hex.substr(4, 2), 16)) * factor);
        return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
    }

    /**
     * Darken a color by a factor
     */
    darkenColor(color, factor) {
        if (color.startsWith("rgba")) return color;
        const hex = color.replace("#", "");
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) * (1 - factor));
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) * (1 - factor));
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) * (1 - factor));
        return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
    }

    /**
     * Draw a theme button
     */
    drawThemeButton(button, theme) {
        const ctx = this.ctx;
        const gradient = ctx.createLinearGradient(button.x, button.y, button.x, button.y + button.height);
        gradient.addColorStop(0, button.hovered ? this.lightenColor(theme.ui.background, 0.3) : theme.ui.background);
        gradient.addColorStop(1, this.darkenColor(theme.ui.background, 0.2));

        ctx.fillStyle = gradient;
        ctx.fillRect(button.x, button.y, button.width, button.height);

        ctx.strokeStyle = theme.ui.border;
        ctx.lineWidth = button.hovered ? 2 : 1;
        ctx.strokeRect(button.x, button.y, button.width, button.height);

        ctx.fillStyle = theme.ui.accent;
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        ctx.fillText(theme.name, button.x + button.width / 2, button.y + button.height / 2);
    }
}

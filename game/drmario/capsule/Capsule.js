/**
 * Capsule class - the falling piece in Dr. Mario
 * Extracted from original Dr. Mario implementation
 */
class DrMarioCapsule {
    constructor(x, y) {
        this.x = x; // Grid X position
        this.y = y; // Grid Y position (can be fractional)
        this.orientation = "horizontal"; // 'horizontal' or 'vertical'
        this.rotation = 0; // 0, 1, 2, 3 for 0°, 90°, 180°, 270°

        // Two halves with random colors
        const colors = ["red", "blue", "yellow"];
        this.leftColor = colors[Math.floor(Math.random() * colors.length)];
        this.rightColor = colors[Math.floor(Math.random() * colors.length)];

        this.locked = false;
        this.lockTimer = 0;
    }

    // Get positions of both halves
    getPositions() {
        const baseX = Math.floor(this.x);
        const baseY = Math.floor(this.y);
        let left, right;

        if (this.orientation === "horizontal") {
            left = { x: baseX, y: baseY };
            right = { x: baseX + 1, y: baseY };
        } else {
            left = { x: baseX, y: baseY };
            right = { x: baseX, y: baseY + 1 };
        }

        return { left, right };
    }

    // Get colors considering rotation (flip for 180° and 270°)
    getColors() {
        if (this.rotation === 2 || this.rotation === 3) {
            // 180° and 270° rotations flip the colors
            return { leftColor: this.rightColor, rightColor: this.leftColor };
        }
        return { leftColor: this.leftColor, rightColor: this.rightColor };
    }

    // Try to rotate (returns true if successful)
    tryRotate(grid, clockwise = true) {
        const oldRotation = this.rotation;
        const newRotation = (oldRotation + (clockwise ? 1 : 3)) % 4; // 3 = -1 mod 4

        // Update orientation based on rotation
        if (newRotation % 2 === 0) {
            this.orientation = "horizontal";
        } else {
            this.orientation = "vertical";
        }

        this.rotation = newRotation;

        // Check if new position is valid
        const positions = this.getPositions();
        if (this.isValidPosition(positions.left, grid) && this.isValidPosition(positions.right, grid)) {
            return true; // Success!
        }

        // Try wall kicks for better positioning
        const kicks = [
            [-1, 0], [1, 0], [0, 1], [0, -1],  // Basic kicks
            [-1, 1], [1, 1], [-1, -1], [1, -1]  // Diagonal kicks for T-spin like behavior
        ];

        for (let i = 0; i < kicks.length; i++) {
            const kick = kicks[i];
            const testX = this.x + kick[0];
            const testY = this.y + kick[1];

            if (testX < 0 || testX >= DR_MARIO_CONSTANTS.GRID.COLS) continue;

            const oldX = this.x;
            const oldY = this.y;
            this.x = testX;
            this.y = testY;

            const positions = this.getPositions();
            if (this.isValidPosition(positions.left, grid) && this.isValidPosition(positions.right, grid)) {
                return true; // Wall kick successful
            }

            this.x = oldX;
            this.y = oldY;
        }

        // Rotation failed, restore
        this.rotation = oldRotation;
        if (oldRotation % 2 === 0) {
            this.orientation = "horizontal";
        } else {
            this.orientation = "vertical";
        }
        return false;
    }

    isValidPosition(pos, grid) {
        if (pos.x < 0 || pos.x >= DR_MARIO_CONSTANTS.GRID.COLS) return false;
        if (pos.y < 0 || pos.y >= DR_MARIO_CONSTANTS.GRID.ROWS) return false;
        if (!grid[pos.y][pos.x].isEmpty()) return false;
        return true;
    }
}

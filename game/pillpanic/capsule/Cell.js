/**
 * Cell class - represents one grid cell (half a capsule, virus, or empty)
 */
class PillPanicCell {
    constructor(color = null, type = "empty") {
        this.color = color; // 'red', 'blue', 'yellow', or null
        this.type = type; // 'empty', 'virus', 'capsule', 'half'
        this.matched = false; // Flagged for clearing
        this.connectedTo = null; // For capsule halves, points to other half
    }

    isEmpty() {
        return this.type === "empty";
    }

    isVirus() {
        return this.type === "virus";
    }

    isCapsule() {
        return this.type === "capsule" || this.type === "half";
    }
}

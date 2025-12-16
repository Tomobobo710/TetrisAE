/**
 * NetworkedPlayer - Extends Player with network synchronization
 *
 * Local players: Runs game logic and sends updates to network
 * Remote players: Receives updates from network, does not run game logic
 */
class NetworkedPlayer extends Player {
    constructor(playerNumber, gameSettings, game, session, isLocal) {
        super(playerNumber, gameSettings, game); // Initialize as Player

        this.session = session; // Reference to NetworkSession
        this.isLocal = isLocal; // true = send, false = receive
        this.isRemote = !isLocal; // Remote players don't run game logic

        // console.log(`[NetworkedPlayer] Created ${isLocal ? "LOCAL" : "REMOTE"} player ${playerNumber}`);
    }

    /**
     * Override updateGameplay - remote players don't run game logic
     */
    updateGameplay(deltaTime) {
        if (this.isRemote) return; // Remote players don't run game logic
        super.updateGameplay(deltaTime);
    }

    /**
     * Override lockPiece - send network update after locking
     */
    lockPiece(isFromHardDrop = false) {
        const result = super.lockPiece(isFromHardDrop);
        return result;
    }

    /**
     * Override clearLines - send network update after clearing
     */
    clearLines(lines) {
        super.clearLines(lines);
    }

    /**
     * Override clearLines in GameManager to intercept garbage sends
     */
    sendGarbageToOpponent(toPlayerNumber, garbageLines) {
        // Local player is sending garbage to opponent
        if (this.isLocal && garbageLines > 0) {
            this.session.sendMessage({
                type: "garbageSent",
                playerNumber: this.playerNumber,
                lines: garbageLines
            });
        }
    }

    /**
     * Override holdPiece - send network update after holding
     */
    holdPiece() {
        const result = super.holdPiece();

        return result;
    }



    /**
     * Apply piece update from synced data (remote)
     * Called by NetworkSession when remote piece state changes
     */
    applyPieceUpdate(pieceData) {
        if (this.isLocal) return;

        this.currentPiece = pieceData.type;
        this.currentX = pieceData.x;
        this.currentY = pieceData.y;
        this.currentRotation = pieceData.rotation;
        this.calculateGhostPosition();
    }

    /**
     * Apply queue update from synced data (remote)
     * Called by NetworkSession when remote queue state changes
     */
    applyQueueUpdate(queueData) {
        if (this.isLocal) return;

        this.nextQueue = queueData.next || [];
    }

    /**
     * Apply hold update from synced data (remote)
     * Called by NetworkSession when remote hold state changes
     */
    applyHoldUpdate(holdData) {
        if (this.isLocal) return;

        this.heldPiece = holdData.piece;
        this.canHold = holdData.canHold;
    }

    /**
     * Apply grid update from synced data (remote)
     * Called by NetworkSession when remote grid state changes
     */
    applyGridUpdate(gridData) {
        if (this.isLocal) return;

        this.grid = gridData.state || [];
    }

    /**
     * Handle game over for local player
     */
    onGameOver() {
        if (!this.isLocal) return;

        // console.log("[NetworkedPlayer] Local player game over");

        this.gameOver = true;
    }
}

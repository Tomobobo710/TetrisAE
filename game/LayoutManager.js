/**
 * LayoutManager - Handles all UI layout configurations for different player counts
 */
class LayoutManager {
    constructor() {
        this.playerCount = 1;
    }

    /**
     * Update player count for layout calculations
     */
    setPlayerCount(count) {
        this.playerCount = count;
    }

    /**
     * Get complete layout configuration for different player counts
     */
    getLayoutConfig(playerCount) {
        const configs = {
            1: {
                // Single player: Complete layout definition
                players: [
                    {
                        gameArea: {
                            x: 270,
                            y: 60,
                            cellSize: 26
                        },
                        ui: {
                            playerLabel: {
                                enabled: false, // Show/hide player label (false for single player)
                                template: "Player {number}", // Text template with {number} placeholder
                                fontSize: "16px", // Font size for label text
                                fontFamily: "Arial", // Font family for label text
                                fontWeight: "bold", // Font weight for label text
                                color: "#ffffff", // Text color (white for visibility)
                                position: { x: 0, y: -15 }, // Offset from game area center
                                alignment: "center", // Text alignment: 'left', 'center', 'right'
                                showOnlyInMultiplayer: true // Hide in single player mode
                            },
                            hold: {
                                x: 70,
                                y: 80,
                                width: 120,
                                height: 140, // Panel position and size
                                pieceCellSize: 20, // Size of each tetromino block in pixels
                                pieceAlignment: "center", // How to align piece: 'center', 'top-left', 'custom'
                                pieceDisabledAlpha: 0.4, // Transparency when hold is disabled (0.0-1.0)
                                pieceOffset: { x: 0, y: 0 }, // Manual offset from center position (works with any alignment)
                                text: {
                                    label: "HOLD", // Text content displayed on panel
                                    fontSize: "16px", // Font size for label text
                                    fontFamily: "Arial", // Font family for label text
                                    fontWeight: "bold", // Font weight for label text
                                    position: { x: 0, y: -5 } // Text offset from panel top-left corner
                                }
                            },
                            next: {
                                x: 610,
                                y: 80,
                                width: 120,
                                height: 450,
                                cellSizes: [24, 20, 16, 12, 10], // Sizing of each next piece
                                text: {
                                    label: "NEXT",
                                    fontSize: "16px",
                                    fontFamily: "Arial",
                                    fontWeight: "bold",
                                    position: { x: 0, y: -5 }
                                }
                            },
                            score: {
                                x: 70,
                                y: 345,
                                width: 120,
                                height: 140,
                                text: {
                                    labels: {
                                        score: "SCORE",
                                        level: "LEVEL",
                                        lines: "LINES"
                                    },
                                    labelStyle: {
                                        fontSize: "14px",
                                        fontFamily: "Arial",
                                        fontWeight: "bold"
                                    },
                                    valueStyle: {
                                        fontSize: "18px",
                                        fontFamily: "Arial",
                                        fontWeight: "normal"
                                    },
                                    positions: {
                                        scoreLabel: { x: 10, y: 20 },
                                        scoreValue: { x: 10, y: 40 },
                                        levelLabel: { x: 10, y: 60 },
                                        levelValue: { x: 10, y: 80 },
                                        linesLabel: { x: 10, y: 100 },
                                        linesValue: { x: 10, y: 120 }
                                    }
                                }
                            }
                        }
                    }
                ]
            },
            2: {
                // Two player: Complete layout definitions for 800x600 canvas
                players: [
                    {
                        gameArea: {
                            x: 90,
                            y: 100,
                            cellSize: 20
                        },
                        ui: {
                            playerLabel: {
                                enabled: true,
                                template: "Player {number}",
                                fontSize: "14px",
                                fontFamily: "Arial",
                                fontWeight: "bold",
                                color: "#ffffff",
                                position: { x: 0, y: -15 },
                                alignment: "center",
                                showOnlyInMultiplayer: true
                            },
                            hold: {
                                x: 8,
                                y: 120,
                                width: 80,
                                height: 80,
                                pieceCellSize: 12,
                                pieceAlignment: "center",
                                pieceDisabledAlpha: 0.4,
                                pieceOffset: { x: 0, y: 0 },
                                text: {
                                    label: "HOLD",
                                    fontSize: "12px",
                                    fontFamily: "Arial",
                                    fontWeight: "bold",
                                    position: { x: 0, y: -5 }
                                }
                            },
                            next: {
                                x: 292,
                                y: 170,
                                width: 100,
                                height: 260,
                                cellSizes: [16, 12, 10, 8, 6],
                                text: {
                                    label: "NEXT",
                                    fontSize: "12px",
                                    fontFamily: "Arial",
                                    fontWeight: "bold",
                                    position: { x: 0, y: -5 }
                                }
                            },
                            score: {
                                x: 8,
                                y: 381,
                                width: 80,
                                height: 100,
                                text: {
                                    labels: { score: "SCORE", level: "LEVEL", lines: "LINES" },
                                    labelStyle: { fontSize: "9px", fontFamily: "Arial", fontWeight: "bold" },
                                    valueStyle: { fontSize: "12px", fontFamily: "Arial", fontWeight: "normal" },
                                    positions: {
                                        scoreLabel: { x: 5, y: 15 },
                                        scoreValue: { x: 5, y: 30 },
                                        levelLabel: { x: 5, y: 45 },
                                        levelValue: { x: 5, y: 60 },
                                        linesLabel: { x: 5, y: 75 },
                                        linesValue: { x: 5, y: 90 }
                                    }
                                }
                            }
                        }
                    },
                    {
                        gameArea: {
                            x: 490,
                            y: 100,
                            cellSize: 20
                        },
                        ui: {
                            playerLabel: {
                                enabled: true,
                                template: "Player {number}",
                                fontSize: "14px",
                                fontFamily: "Arial",
                                fontWeight: "bold",
                                color: "#ffffff",
                                position: { x: 0, y: -15 },
                                alignment: "center",
                                showOnlyInMultiplayer: true
                            },
                            hold: {
                                x: 408,
                                y: 120,
                                width: 80,
                                height: 80,
                                pieceCellSize: 12,
                                pieceAlignment: "center",
                                pieceDisabledAlpha: 0.4,
                                pieceOffset: { x: 0, y: 0 },
                                text: {
                                    label: "HOLD",
                                    fontSize: "12px",
                                    fontFamily: "Arial",
                                    fontWeight: "bold",
                                    position: { x: 0, y: -5 }
                                }
                            },
                            next: {
                                x: 692,
                                y: 170,
                                width: 100,
                                height: 260,
                                cellSizes: [16, 12, 10, 8, 6],
                                text: {
                                    label: "NEXT",
                                    fontSize: "12px",
                                    fontFamily: "Arial",
                                    fontWeight: "bold",
                                    position: { x: 0, y: -5 }
                                }
                            },
                            score: {
                                x: 408,
                                y: 381,
                                width: 80,
                                height: 100,
                                text: {
                                    labels: { score: "SCORE", level: "LEVEL", lines: "LINES" },
                                    labelStyle: { fontSize: "9px", fontFamily: "Arial", fontWeight: "bold" },
                                    valueStyle: { fontSize: "12px", fontFamily: "Arial", fontWeight: "normal" },
                                    positions: {
                                        scoreLabel: { x: 5, y: 15 },
                                        scoreValue: { x: 5, y: 30 },
                                        levelLabel: { x: 5, y: 45 },
                                        levelValue: { x: 5, y: 60 },
                                        linesLabel: { x: 5, y: 75 },
                                        linesValue: { x: 5, y: 90 }
                                    }
                                }
                            }
                        }
                    }
                ]
            },
            3: {
                // Three player: Triangle layout - players positioned in corners of the screen
                players: [
                    {
                        gameArea: {
                            x: 150,
                            y: 27,
                            cellSize: 13.5
                        },
                        ui: {
                            playerLabel: {
                                enabled: true,
                                template: "Player {number}",
                                fontSize: "10px",
                                fontFamily: "Arial",
                                fontWeight: "bold",
                                color: "#ffffff",
                                position: { x: 0, y: -15 },
                                alignment: "center",
                                showOnlyInMultiplayer: true
                            },
                            hold: {
                                x: 68,
                                y: 37,
                                width: 80,
                                height: 80,
                                pieceCellSize: 10,
                                pieceAlignment: "center",
                                pieceDisabledAlpha: 0.4,
                                pieceOffset: { x: 0, y: 0 },
                                text: {
                                    label: "HOLD",
                                    fontSize: "10px",
                                    fontFamily: "Arial",
                                    fontWeight: "bold",
                                    position: { x: 0, y: -5 }
                                }
                            },
                            next: {
                                x: 287,
                                y: 52,
                                width: 80,
                                height: 220,
                                cellSizes: [12, 10, 8, 6, 4],
                                text: {
                                    label: "NEXT",
                                    fontSize: "10px",
                                    fontFamily: "Arial",
                                    fontWeight: "bold",
                                    position: { x: 0, y: -5 }
                                }
                            },
                            score: {
                                x: 68,
                                y: 207,
                                width: 80,
                                height: 80,
                                text: {
                                    labels: { score: "SCORE", level: "LEVEL", lines: "LINES" },
                                    labelStyle: { fontSize: "7px", fontFamily: "Arial", fontWeight: "bold" },
                                    valueStyle: { fontSize: "9px", fontFamily: "Arial", fontWeight: "normal" },
                                    positions: {
                                        scoreLabel: { x: 4, y: 10 },
                                        scoreValue: { x: 4, y: 20 },
                                        levelLabel: { x: 4, y: 30 },
                                        levelValue: { x: 4, y: 40 },
                                        linesLabel: { x: 4, y: 50 },
                                        linesValue: { x: 4, y: 60 }
                                    }
                                }
                            }
                        }
                    },
                    {
                        gameArea: {
                            x: 510,
                            y: 27,
                            cellSize: 13.5
                        },
                        ui: {
                            playerLabel: {
                                enabled: true,
                                template: "Player {number}",
                                fontSize: "10px",
                                fontFamily: "Arial",
                                fontWeight: "bold",
                                color: "#ffffff",
                                position: { x: 0, y: -15 },
                                alignment: "center",
                                showOnlyInMultiplayer: true
                            },
                            hold: {
                                x: 428,
                                y: 37,
                                width: 80,
                                height: 80,
                                pieceCellSize: 10,
                                pieceAlignment: "center",
                                pieceDisabledAlpha: 0.4,
                                pieceOffset: { x: 0, y: 0 },
                                text: {
                                    label: "HOLD",
                                    fontSize: "10px",
                                    fontFamily: "Arial",
                                    fontWeight: "bold",
                                    position: { x: 0, y: -5 }
                                }
                            },
                            next: {
                                x: 647,
                                y: 52,
                                width: 80,
                                height: 220,
                                cellSizes: [12, 10, 8, 6, 4],
                                text: {
                                    label: "NEXT",
                                    fontSize: "10px",
                                    fontFamily: "Arial",
                                    fontWeight: "bold",
                                    position: { x: 0, y: -5 }
                                }
                            },
                            score: {
                                x: 428,
                                y: 207,
                                width: 80,
                                height: 80,
                                text: {
                                    labels: { score: "SCORE", level: "LEVEL", lines: "LINES" },
                                    labelStyle: { fontSize: "7px", fontFamily: "Arial", fontWeight: "bold" },
                                    valueStyle: { fontSize: "9px", fontFamily: "Arial", fontWeight: "normal" },
                                    positions: {
                                        scoreLabel: { x: 4, y: 10 },
                                        scoreValue: { x: 4, y: 20 },
                                        levelLabel: { x: 4, y: 30 },
                                        levelValue: { x: 4, y: 40 },
                                        linesLabel: { x: 4, y: 50 },
                                        linesValue: { x: 4, y: 60 }
                                    }
                                }
                            }
                        }
                    },
                    {
                        gameArea: {
                            x: 340,
                            y: 327,
                            cellSize: 13.5
                        },
                        ui: {
                            playerLabel: {
                                enabled: true,
                                template: "Player {number}",
                                fontSize: "10px",
                                fontFamily: "Arial",
                                fontWeight: "bold",
                                color: "#ffffff",
                                position: { x: 0, y: -15 },
                                alignment: "center",
                                showOnlyInMultiplayer: true
                            },
                            hold: {
                                x: 258,
                                y: 337,
                                width: 80,
                                height: 80,
                                pieceCellSize: 10,
                                pieceAlignment: "center",
                                pieceDisabledAlpha: 0.4,
                                pieceOffset: { x: 0, y: 0 },
                                text: {
                                    label: "HOLD",
                                    fontSize: "10px",
                                    fontFamily: "Arial",
                                    fontWeight: "bold",
                                    position: { x: 0, y: -5 }
                                }
                            },
                            next: {
                                x: 477,
                                y: 362,
                                width: 80,
                                height: 220,
                                cellSizes: [12, 10, 8, 6, 4],
                                text: {
                                    label: "NEXT",
                                    fontSize: "10px",
                                    fontFamily: "Arial",
                                    fontWeight: "bold",
                                    position: { x: 0, y: -5 }
                                }
                            },
                            score: {
                                x: 258,
                                y: 507,
                                width: 80,
                                height: 80,
                                text: {
                                    labels: { score: "SCORE", level: "LEVEL", lines: "LINES" },
                                    labelStyle: { fontSize: "7px", fontFamily: "Arial", fontWeight: "bold" },
                                    valueStyle: { fontSize: "9px", fontFamily: "Arial", fontWeight: "normal" },
                                    positions: {
                                        scoreLabel: { x: 4, y: 10 },
                                        scoreValue: { x: 4, y: 20 },
                                        levelLabel: { x: 4, y: 30 },
                                        levelValue: { x: 4, y: 40 },
                                        linesLabel: { x: 4, y: 50 },
                                        linesValue: { x: 4, y: 60 }
                                    }
                                }
                            }
                        }
                    }
                ]
            },
            4: {
                // Four player: Quadrant split-screen layout - each player in one corner
                players: [
                    {
                        gameArea: {
                            x: 150,
                            y: 27,
                            cellSize: 13.5
                        },
                        ui: {
                            playerLabel: {
                                enabled: true,
                                template: "Player {number}",
                                fontSize: "10px",
                                fontFamily: "Arial",
                                fontWeight: "bold",
                                color: "#ffffff",
                                position: { x: 0, y: -15 },
                                alignment: "center",
                                showOnlyInMultiplayer: true
                            },
                            hold: {
                                x: 68,
                                y: 37,
                                width: 80,
                                height: 80,
                                pieceCellSize: 10,
                                pieceAlignment: "center",
                                pieceDisabledAlpha: 0.4,
                                pieceOffset: { x: 0, y: 0 },
                                text: {
                                    label: "HOLD",
                                    fontSize: "10px",
                                    fontFamily: "Arial",
                                    fontWeight: "bold",
                                    position: { x: 0, y: -5 }
                                }
                            },
                            next: {
                                x: 287,
                                y: 52,
                                width: 80,
                                height: 220,
                                cellSizes: [12, 10, 8, 6, 4],
                                text: {
                                    label: "NEXT",
                                    fontSize: "10px",
                                    fontFamily: "Arial",
                                    fontWeight: "bold",
                                    position: { x: 0, y: -5 }
                                }
                            },
                            score: {
                                x: 68,
                                y: 207,
                                width: 80,
                                height: 80,
                                text: {
                                    labels: { score: "SCORE", level: "LEVEL", lines: "LINES" },
                                    labelStyle: { fontSize: "7px", fontFamily: "Arial", fontWeight: "bold" },
                                    valueStyle: { fontSize: "9px", fontFamily: "Arial", fontWeight: "normal" },
                                    positions: {
                                        scoreLabel: { x: 4, y: 10 },
                                        scoreValue: { x: 4, y: 20 },
                                        levelLabel: { x: 4, y: 30 },
                                        levelValue: { x: 4, y: 40 },
                                        linesLabel: { x: 4, y: 50 },
                                        linesValue: { x: 4, y: 60 }
                                    }
                                }
                            }
                        }
                    },
                    {
                        gameArea: {
                            x: 510,
                            y: 27,
                            cellSize: 13.5
                        },
                        ui: {
                            playerLabel: {
                                enabled: true,
                                template: "Player {number}",
                                fontSize: "10px",
                                fontFamily: "Arial",
                                fontWeight: "bold",
                                color: "#ffffff",
                                position: { x: 0, y: -15 },
                                alignment: "center",
                                showOnlyInMultiplayer: true
                            },
                            hold: {
                                x: 428,
                                y: 37,
                                width: 80,
                                height: 80,
                                pieceCellSize: 10,
                                pieceAlignment: "center",
                                pieceDisabledAlpha: 0.4,
                                pieceOffset: { x: 0, y: 0 },
                                text: {
                                    label: "HOLD",
                                    fontSize: "10px",
                                    fontFamily: "Arial",
                                    fontWeight: "bold",
                                    position: { x: 0, y: -5 }
                                }
                            },
                            next: {
                                x: 647,
                                y: 52,
                                width: 80,
                                height: 220,
                                cellSizes: [12, 10, 8, 6, 4],
                                text: {
                                    label: "NEXT",
                                    fontSize: "10px",
                                    fontFamily: "Arial",
                                    fontWeight: "bold",
                                    position: { x: 0, y: -5 }
                                }
                            },
                            score: {
                                x: 428,
                                y: 207,
                                width: 80,
                                height: 80,
                                text: {
                                    labels: { score: "SCORE", level: "LEVEL", lines: "LINES" },
                                    labelStyle: { fontSize: "7px", fontFamily: "Arial", fontWeight: "bold" },
                                    valueStyle: { fontSize: "9px", fontFamily: "Arial", fontWeight: "normal" },
                                    positions: {
                                        scoreLabel: { x: 4, y: 10 },
                                        scoreValue: { x: 4, y: 20 },
                                        levelLabel: { x: 4, y: 30 },
                                        levelValue: { x: 4, y: 40 },
                                        linesLabel: { x: 4, y: 50 },
                                        linesValue: { x: 4, y: 60 }
                                    }
                                }
                            }
                        }
                    },
                    {
                        gameArea: {
                            x: 150,
                            y: 327,
                            cellSize: 13.5
                        },
                        ui: {
                            playerLabel: {
                                enabled: true,
                                template: "Player {number}",
                                fontSize: "10px",
                                fontFamily: "Arial",
                                fontWeight: "bold",
                                color: "#ffffff",
                                position: { x: 0, y: -15 },
                                alignment: "center",
                                showOnlyInMultiplayer: true
                            },
                            hold: {
                                x: 68,
                                y: 337,
                                width: 80,
                                height: 80,
                                pieceCellSize: 10,
                                pieceAlignment: "center",
                                pieceDisabledAlpha: 0.4,
                                pieceOffset: { x: 0, y: 0 },
                                text: {
                                    label: "HOLD",
                                    fontSize: "10px",
                                    fontFamily: "Arial",
                                    fontWeight: "bold",
                                    position: { x: 0, y: -5 }
                                }
                            },
                            next: {
                                x: 287,
                                y: 362,
                                width: 80,
                                height: 220,
                                cellSizes: [12, 10, 8, 6, 4],
                                text: {
                                    label: "NEXT",
                                    fontSize: "10px",
                                    fontFamily: "Arial",
                                    fontWeight: "bold",
                                    position: { x: 0, y: -5 }
                                }
                            },
                            score: {
                                x: 68,
                                y: 507,
                                width: 80,
                                height: 80,
                                text: {
                                    labels: { score: "SCORE", level: "LEVEL", lines: "LINES" },
                                    labelStyle: { fontSize: "7px", fontFamily: "Arial", fontWeight: "bold" },
                                    valueStyle: { fontSize: "9px", fontFamily: "Arial", fontWeight: "normal" },
                                    positions: {
                                        scoreLabel: { x: 4, y: 10 },
                                        scoreValue: { x: 4, y: 20 },
                                        levelLabel: { x: 4, y: 30 },
                                        levelValue: { x: 4, y: 40 },
                                        linesLabel: { x: 4, y: 50 },
                                        linesValue: { x: 4, y: 60 }
                                    }
                                }
                            }
                        }
                    },
                    {
                        gameArea: {
                            x: 510,
                            y: 327,
                            cellSize: 13.5
                        },
                        ui: {
                            playerLabel: {
                                enabled: true,
                                template: "Player {number}",
                                fontSize: "10px",
                                fontFamily: "Arial",
                                fontWeight: "bold",
                                color: "#ffffff",
                                position: { x: 0, y: -15 },
                                alignment: "center",
                                showOnlyInMultiplayer: true
                            },
                            hold: {
                                x: 428,
                                y: 337,
                                width: 80,
                                height: 80,
                                pieceCellSize: 10,
                                pieceAlignment: "center",
                                pieceDisabledAlpha: 0.4,
                                pieceOffset: { x: 0, y: 0 },
                                text: {
                                    label: "HOLD",
                                    fontSize: "10px",
                                    fontFamily: "Arial",
                                    fontWeight: "bold",
                                    position: { x: 0, y: -5 }
                                }
                            },
                            next: {
                                x: 647,
                                y: 362,
                                width: 80,
                                height: 220,
                                cellSizes: [12, 10, 8, 6, 4],
                                text: {
                                    label: "NEXT",
                                    fontSize: "10px",
                                    fontFamily: "Arial",
                                    fontWeight: "bold",
                                    position: { x: 0, y: -5 }
                                }
                            },
                            score: {
                                x: 428,
                                y: 507,
                                width: 80,
                                height: 80,
                                text: {
                                    labels: { score: "SCORE", level: "LEVEL", lines: "LINES" },
                                    labelStyle: { fontSize: "7px", fontFamily: "Arial", fontWeight: "bold" },
                                    valueStyle: { fontSize: "9px", fontFamily: "Arial", fontWeight: "normal" },
                                    positions: {
                                        scoreLabel: { x: 4, y: 10 },
                                        scoreValue: { x: 4, y: 20 },
                                        levelLabel: { x: 4, y: 30 },
                                        levelValue: { x: 4, y: 40 },
                                        linesLabel: { x: 4, y: 50 },
                                        linesValue: { x: 4, y: 60 }
                                    }
                                }
                            }
                        }
                    }
                ]
            }
        };

        return configs[playerCount];
    }

    /**
     * Get complete layout information for a specific player
     */
    getPlayerLayout(playerNumber) {
        const config = this.getLayoutConfig(this.playerCount);
        const playerIndex = playerNumber - 1;

        if (config && config.players && config.players[playerIndex]) {
            return config.players[playerIndex];
        }

        return null;
    }
}

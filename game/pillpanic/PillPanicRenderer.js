/**
 * Pill Panic Renderer Module
 * Handles all rendering for Pill Panic game
 */
class PillPanicRenderer {
    constructor(pillPanicGame) {
        this.game = pillPanicGame;
        this.gameCtx = pillPanicGame.gameCtx;
        this.guiCtx = pillPanicGame.guiCtx;
        this.debugCtx = pillPanicGame.debugCtx;
    }
    
    draw() {
        this.drawGameLayer();
        this.drawGUILayer();
        if (this.game.gameLogic.debugOverlayVisible) {
            this.drawDebugLayer();
        }
    }
    
    drawGameLayer() {
        // Background gradient
        const gradient = this.gameCtx.createLinearGradient(0, 0, 0, PILL_PANIC_CONSTANTS.HEIGHT);
        gradient.addColorStop(0, "#1a1a2e");
        gradient.addColorStop(1, "#16213e");
        this.gameCtx.fillStyle = gradient;
        this.gameCtx.fillRect(0, 0, PILL_PANIC_CONSTANTS.WIDTH, PILL_PANIC_CONSTANTS.HEIGHT);
        
        // Animated background particles - EXACT copy from original
        this.drawBackgroundParticles();
        
        // Draw bottle and game area
        if (this.game.gameState === PILL_PANIC_CONSTANTS.STATES.PLAYING || 
            this.game.gameState === PILL_PANIC_CONSTANTS.STATES.CLEARING) {
            this.drawBottle();
        }
        
        // Draw effect particles - EXACT copy from original  
        this.drawParticles();
    }
    
    drawBackgroundParticles() {
        this.gameCtx.save();
        this.game.gameLogic.backgroundParticles.forEach((p) => {
            this.gameCtx.globalAlpha = p.opacity;
            this.gameCtx.fillStyle = p.color;
            this.gameCtx.beginPath();
            this.gameCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.gameCtx.fill();
        });
        this.gameCtx.restore();
    }
    
    drawParticles() {
        this.gameCtx.save();
        
        this.game.gameLogic.particles.forEach((p) => {
            const alpha = p.life / p.maxLife;
            this.gameCtx.globalAlpha = alpha;
            
            this.gameCtx.save();
            this.gameCtx.translate(p.x, p.y);
            this.gameCtx.rotate(p.rotation);
            
            const gradient = this.gameCtx.createRadialGradient(0, 0, 0, 0, 0, p.size);
            gradient.addColorStop(0, p.color);
            gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
            
            this.gameCtx.fillStyle = gradient;
            this.gameCtx.fillRect(-p.size, -p.size, p.size * 2, p.size * 2);
            
            this.gameCtx.restore();
        });
        
        this.gameCtx.restore();
    }
    
    drawGUILayer() {
        this.guiCtx.clearRect(0, 0, PILL_PANIC_CONSTANTS.WIDTH, PILL_PANIC_CONSTANTS.HEIGHT);

        if (this.game.gameState === PILL_PANIC_CONSTANTS.STATES.LEVEL_SELECT) {
            this.drawLevelSelectMenu();
        } else {
            this.drawHUD();
            this.drawNextCapsule();

            if (this.game.gameState === PILL_PANIC_CONSTANTS.STATES.VICTORY) {
                this.drawVictoryScreen();
            } else if (this.game.gameState === PILL_PANIC_CONSTANTS.STATES.GAME_OVER) {
                this.drawGameOverScreen();
            }
        }
    }
    
    
    drawLevelSelectMenu() {
        // Simple level select for now
        this.guiCtx.fillStyle = "#ffffff";
        this.guiCtx.font = "32px Arial";
        this.guiCtx.textAlign = "center";
        this.guiCtx.fillText("LEVEL SELECT", PILL_PANIC_CONSTANTS.WIDTH / 2, 100);
        
        // Virus level display
        this.guiCtx.font = "24px Arial";
        this.guiCtx.fillText(`Virus Level: ${this.game.inputManager.selectedVirusLevel}`, PILL_PANIC_CONSTANTS.WIDTH / 2, 200);
        
        // Speed display
        const speeds = ["LO", "MED", "HI"];
        this.guiCtx.fillText(`Speed: ${speeds[this.game.inputManager.selectedSpeed]}`, PILL_PANIC_CONSTANTS.WIDTH / 2, 250);
        
        // Start button
        const startBtn = this.game.inputManager.buttons.start;
        this.guiCtx.fillStyle = "#00ff00";
        this.guiCtx.fillRect(startBtn.x, startBtn.y, startBtn.width, startBtn.height);
        this.guiCtx.fillStyle = "#000000";
        this.guiCtx.font = "20px Arial";
        this.guiCtx.fillText("START GAME", startBtn.x + startBtn.width/2, startBtn.y + startBtn.height/2 + 8);
        
        // Back button
        const backBtn = this.game.inputManager.buttons.back;
        this.guiCtx.fillStyle = "#ff8800";
        this.guiCtx.fillRect(backBtn.x, backBtn.y, backBtn.width, backBtn.height);
        this.guiCtx.fillStyle = "#000000";
        this.guiCtx.fillText("BACK TO TETRIS", backBtn.x + backBtn.width/2, backBtn.y + backBtn.height/2 + 8);
    }
    
    drawGameplayElements() {
        this.drawBottle();
        this.drawNextCapsule();
    }
    
    drawBottle() {
        this.gameCtx.save();

        // Apply shake if active
        if (this.game.gameLogic.bottleShake.intensity > 0) {
            const offsetX = (Math.random() - 0.5) * this.game.gameLogic.bottleShake.intensity;
            const offsetY = (Math.random() - 0.5) * this.game.gameLogic.bottleShake.intensity;
            this.gameCtx.translate(offsetX, offsetY);
        }

        const bottleX = PILL_PANIC_CONSTANTS.GRID.OFFSET_X - PILL_PANIC_CONSTANTS.VISUAL.BOTTLE_BORDER;
        const bottleY = PILL_PANIC_CONSTANTS.GRID.OFFSET_Y - PILL_PANIC_CONSTANTS.VISUAL.BOTTLE_BORDER;
        const bottleWidth = PILL_PANIC_CONSTANTS.GRID.COLS * PILL_PANIC_CONSTANTS.GRID.CELL_SIZE + PILL_PANIC_CONSTANTS.VISUAL.BOTTLE_BORDER * 2;
        const bottleHeight = PILL_PANIC_CONSTANTS.GRID.ROWS * PILL_PANIC_CONSTANTS.GRID.CELL_SIZE + PILL_PANIC_CONSTANTS.VISUAL.BOTTLE_BORDER * 2;

        // Bottle background
        this.gameCtx.fillStyle = PILL_PANIC_CONSTANTS.COLORS.GAME.BOTTLE_BG;
        this.gameCtx.fillRect(bottleX, bottleY, bottleWidth, bottleHeight);

        // Grid lines
        this.gameCtx.strokeStyle = PILL_PANIC_CONSTANTS.COLORS.GAME.GRID_LINE;
        this.gameCtx.lineWidth = 1;

        for (let row = 1; row < PILL_PANIC_CONSTANTS.GRID.ROWS; row++) {
            const y = PILL_PANIC_CONSTANTS.GRID.OFFSET_Y + row * PILL_PANIC_CONSTANTS.GRID.CELL_SIZE;
            this.gameCtx.beginPath();
            this.gameCtx.moveTo(PILL_PANIC_CONSTANTS.GRID.OFFSET_X, y);
            this.gameCtx.lineTo(PILL_PANIC_CONSTANTS.GRID.OFFSET_X + PILL_PANIC_CONSTANTS.GRID.COLS * PILL_PANIC_CONSTANTS.GRID.CELL_SIZE, y);
            this.gameCtx.stroke();
        }

        for (let col = 1; col < PILL_PANIC_CONSTANTS.GRID.COLS; col++) {
            const x = PILL_PANIC_CONSTANTS.GRID.OFFSET_X + col * PILL_PANIC_CONSTANTS.GRID.CELL_SIZE;
            this.gameCtx.beginPath();
            this.gameCtx.moveTo(x, PILL_PANIC_CONSTANTS.GRID.OFFSET_Y);
            this.gameCtx.lineTo(x, PILL_PANIC_CONSTANTS.GRID.OFFSET_Y + PILL_PANIC_CONSTANTS.GRID.ROWS * PILL_PANIC_CONSTANTS.GRID.CELL_SIZE);
            this.gameCtx.stroke();
        }

        // Draw grid contents
        this.drawGridContents();

        // Draw current capsule
        if (this.game.gameLogic.currentCapsule && this.game.gameState === PILL_PANIC_CONSTANTS.STATES.PLAYING) {
            this.drawCapsule(this.game.gameLogic.currentCapsule);
        }

        // Bottle border
        this.gameCtx.strokeStyle = PILL_PANIC_CONSTANTS.COLORS.GAME.BOTTLE_BORDER;
        this.gameCtx.lineWidth = PILL_PANIC_CONSTANTS.VISUAL.BOTTLE_BORDER;
        this.gameCtx.strokeRect(bottleX, bottleY, bottleWidth, bottleHeight);

        this.gameCtx.restore();
    }
    
    drawGridContents() {
        for (let row = 0; row < PILL_PANIC_CONSTANTS.GRID.ROWS; row++) {
            for (let col = 0; col < PILL_PANIC_CONSTANTS.GRID.COLS; col++) {
                const cell = this.game.gameLogic.grid[row][col];

                if (cell.isEmpty()) continue;

                const x = PILL_PANIC_CONSTANTS.GRID.OFFSET_X + col * PILL_PANIC_CONSTANTS.GRID.CELL_SIZE;
                const y = PILL_PANIC_CONSTANTS.GRID.OFFSET_Y + row * PILL_PANIC_CONSTANTS.GRID.CELL_SIZE;

                if (cell.matched) {
                    // Draw fading matched cell
                    const alpha = this.game.gameLogic.clearingTimer / PILL_PANIC_CONSTANTS.PHYSICS.CLEAR_ANIMATION_TIME;
                    this.gameCtx.save();
                    this.gameCtx.globalAlpha = alpha;
                    this.drawCell(x, y, cell.color, cell.type);
                    this.gameCtx.restore();
                } else if (cell.isVirus()) {
                    this.drawVirus(x, y, cell.color);
                } else if (cell.isCapsule()) {
                    // For placed capsules, need to check if connected
                    if (cell.connectedTo) {
                        const otherX = cell.connectedTo.x;
                        const otherY = cell.connectedTo.y;
                        const otherCell = this.game.gameLogic.grid[otherY][otherX];

                        // Only draw if this is the "left" or "top" cell to avoid double drawing
                        if ((row === otherY && col < otherX) || (col === otherX && row < otherY)) {
                            if (row === otherY) {
                                // Horizontal
                                this.drawHorizontalPill(x, y, cell.color, otherCell.color);
                            } else {
                                // Vertical
                                this.drawVerticalPill(x, y, cell.color, otherCell.color);
                            }
                        }
                    } else {
                        // Single half piece
                        this.drawCell(x, y, cell.color, "capsule");
                    }
                }
            }
        }
    }
    
    drawNextCapsule() {
        if (!this.game.gameLogic.nextCapsule) return;

        const panelX = PILL_PANIC_CONSTANTS.VISUAL.PREVIEW_OFFSET_X;
        const panelY = PILL_PANIC_CONSTANTS.VISUAL.PREVIEW_OFFSET_Y;
        const panelWidth = 160;
        const panelHeight = 140;

        // Panel background
        this.guiCtx.fillStyle = PILL_PANIC_CONSTANTS.COLORS.GUI.PANEL_BG;
        this.guiCtx.fillRect(panelX, panelY, panelWidth, panelHeight);

        this.guiCtx.strokeStyle = PILL_PANIC_CONSTANTS.COLORS.GAME.BOTTLE_BORDER;
        this.guiCtx.lineWidth = 2;
        this.guiCtx.strokeRect(panelX, panelY, panelWidth, panelHeight);

        // Label
        this.guiCtx.fillStyle = PILL_PANIC_CONSTANTS.COLORS.GUI.TEXT;
        this.guiCtx.font = "bold 16px Arial";
        this.guiCtx.textAlign = "center";
        this.guiCtx.fillText("NEXT", panelX + panelWidth / 2, panelY + 25);

        // Draw preview capsule
        const previewX = panelX + panelWidth / 2 - PILL_PANIC_CONSTANTS.GRID.CELL_SIZE;
        const previewY = panelY + 70;

        this.guiCtx.save();

        // Temporarily modify context for preview drawing
        const oldGameCtx = this.gameCtx;
        this.gameCtx = this.guiCtx;

        // Get colors considering rotation
        const colors = this.game.gameLogic.nextCapsule.getColors();

        // Draw preview capsule in correct orientation
        if (this.game.gameLogic.nextCapsule.orientation === "horizontal") {
            this.drawHorizontalPill(previewX, previewY, colors.leftColor, colors.rightColor);
        } else {
            this.drawVerticalPill(previewX, previewY, colors.leftColor, colors.rightColor);
        }

        this.gameCtx = oldGameCtx;
        this.guiCtx.restore();
    }
    
    drawCheckerboardBackground() {
        const checkSize = 40;
        for (let x = 0; x < PILL_PANIC_CONSTANTS.WIDTH; x += checkSize) {
            for (let y = 0; y < PILL_PANIC_CONSTANTS.HEIGHT; y += checkSize) {
                const isPink = (x / checkSize + y / checkSize) % 2 === 0;
                this.guiCtx.fillStyle = isPink ? "#ff69b4" : "#ffa500";
                this.guiCtx.fillRect(x, y, checkSize, checkSize);
            }
        }
    }
    

    
    drawLevelSelectMenu() {
        this.drawCheckerboardBackground();
        
        // Title
        this.guiCtx.fillStyle = "#000000";
        this.guiCtx.font = "bold 36px Arial";
        this.guiCtx.textAlign = "center";
        this.guiCtx.fillText("PILL PANIC", PILL_PANIC_CONSTANTS.WIDTH / 2 + 3, 103);
        
        this.guiCtx.fillStyle = "#ffffff";
        this.guiCtx.fillText("PILL PANIC", PILL_PANIC_CONSTANTS.WIDTH / 2, 100);
        
        // Use EXACT Tetris menu system
        const menu = this.game.inputManager.levelSelectMenu;
        const buttonPositions = [];
        const buttonWidth = 240;
        const buttonHeight = 50;
        const startY = 180;
        const spacing = 60;
        
        // Draw all menu items as proper Tetris buttons
        for (let i = 0; i < menu.buttons.length; i++) {
            const button = menu.buttons[i];
            const x = PILL_PANIC_CONSTANTS.WIDTH / 2 - buttonWidth / 2;
            const y = startY + i * spacing;
            const isHighlighted = menu.selectedIndex === i;
            
            let buttonText = button.text;
            let accentColor = "#666666";
            
            // Customize button text and color based on type
            if (i === 0) { // Virus Level
                const level = this.game.inputManager.selectedVirusLevel.toString().padStart(2, '0');
                buttonText = `VIRUS LEVEL: ${level}`;
                accentColor = "#aa44aa";
                
                // Draw adjustment arrows if selected
                if (isHighlighted) {
                    // Left arrow
                    const leftArrowHovered = this.game.inputManager.input.isElementHovered("dr_level_left_arrow_0");
                    this.guiCtx.fillStyle = leftArrowHovered ? "#ffff00" : "#ffffff";
                    this.guiCtx.font = "20px Arial";
                    this.guiCtx.textAlign = "center";
                    // Properly center arrows vertically
                    const textMetrics = this.guiCtx.measureText("◀");
                    const textHeight = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;
                    const arrowY = y + buttonHeight / 2 - textMetrics.actualBoundingBoxDescent + 9;
                    this.guiCtx.fillText("◀", x - 40, arrowY);

                    // Right arrow
                    const rightArrowHovered = this.game.inputManager.input.isElementHovered("dr_level_right_arrow_0");
                    this.guiCtx.fillStyle = rightArrowHovered ? "#ffff00" : "#ffffff";
                    this.guiCtx.fillText("▶", x + buttonWidth + 40, arrowY);
                }
            } else if (i === 1) { // Speed
                const speeds = ["LO", "MED", "HI"];
                buttonText = `SPEED: ${speeds[this.game.inputManager.selectedSpeed]}`;
                accentColor = "#4444aa";
                
                // Draw adjustment arrows if selected
                if (isHighlighted) {
                    // Left arrow
                    const leftArrowHovered = this.game.inputManager.input.isElementHovered("dr_level_left_arrow_" + i);
                    this.guiCtx.fillStyle = leftArrowHovered ? "#ffff00" : "#ffffff";
                    this.guiCtx.font = "20px Arial";
                    this.guiCtx.textAlign = "center";
                    // Properly center arrows vertically
                    const textMetrics = this.guiCtx.measureText("◀");
                    const textHeight = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;
                    const arrowY = y + buttonHeight / 2 - textMetrics.actualBoundingBoxDescent + 9;
                    this.guiCtx.fillText("◀", x - 40, arrowY);

                    // Right arrow
                    const rightArrowHovered = this.game.inputManager.input.isElementHovered("dr_level_right_arrow_" + i);
                    this.guiCtx.fillStyle = rightArrowHovered ? "#ffff00" : "#ffffff";
                    this.guiCtx.fillText("▶", x + buttonWidth + 40, arrowY);
                }
            } else if (i === 2) { // Start Game
                accentColor = "#44aa44";
            } else { // Back
                accentColor = "#aa4444";
            }
            
            const theme = {
                ui: {
                    accent: accentColor,
                    text: "#ffffff"
                }
            };
            
            this.drawTetrisMenuButton(x, y, buttonWidth, buttonHeight, buttonText, isHighlighted, theme);
            
            // Store position for mouse interaction
            buttonPositions.push({ x, y, width: buttonWidth, height: buttonHeight });
        }
        
        // Update mouse hit areas
        this.game.inputManager.updateMenuElementPositions("levelSelect", buttonPositions);
    }
    
    drawMenuSetting(label, value, y, isSelected) {
        // Background highlight like Tetris menus
        if (isSelected) {
            this.guiCtx.fillStyle = "rgba(255, 255, 0, 0.3)";
            this.guiCtx.fillRect(100, y - 30, PILL_PANIC_CONSTANTS.WIDTH - 200, 60);
            
            this.guiCtx.strokeStyle = "#ffff00";
            this.guiCtx.lineWidth = 3;
            this.guiCtx.strokeRect(100, y - 30, PILL_PANIC_CONSTANTS.WIDTH - 200, 60);
        }
        
        // Label
        this.guiCtx.fillStyle = isSelected ? "#ffff00" : "#ffffff";
        this.guiCtx.font = "bold 24px Arial";
        this.guiCtx.textAlign = "left";
        this.guiCtx.fillText(label, 130, y);
        
        // Value
        this.guiCtx.textAlign = "right";
        this.guiCtx.fillText(value, PILL_PANIC_CONSTANTS.WIDTH - 130, y);
        
        // Arrow indicators
        if (isSelected) {
            this.guiCtx.textAlign = "center";
            this.guiCtx.font = "20px Arial";
            this.guiCtx.fillText("◀", PILL_PANIC_CONSTANTS.WIDTH / 2 - 80, y);
            this.guiCtx.fillText("▶", PILL_PANIC_CONSTANTS.WIDTH / 2 + 80, y);
        }
    }
    
    drawTetrisStyleButton(text, centerX, centerY, width, height, isSelected, color) {
        const x = centerX - width / 2;
        const y = centerY - height / 2;
        
        // Enhanced shadow for selected buttons (like Tetris)
        if (isSelected) {
            this.guiCtx.fillStyle = "rgba(0, 0, 0, 0.8)";
            this.guiCtx.fillRect(x + 6, y + 6, width, height);
        } else {
            this.guiCtx.fillStyle = "rgba(0, 0, 0, 0.6)";
            this.guiCtx.fillRect(x + 4, y + 4, width, height);
        }
        
        // Main button background (like Tetris gradient style)
        const gradient = this.guiCtx.createLinearGradient(x, y, x, y + height);
        if (isSelected) {
            gradient.addColorStop(0, this.lightenColor(color, 0.6));
            gradient.addColorStop(1, color);
        } else {
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, this.darkenColor(color, 0.3));
        }
        
        this.guiCtx.fillStyle = gradient;
        this.guiCtx.fillRect(x, y, width, height);
        
        // Border (like Tetris)
        this.guiCtx.strokeStyle = isSelected ? "#ffffff" : this.darkenColor(color, 0.4);
        this.guiCtx.lineWidth = isSelected ? 3 : 2;
        this.guiCtx.strokeRect(x, y, width, height);
        
        // Text
        this.guiCtx.fillStyle = isSelected ? "#000000" : "#ffffff";
        this.guiCtx.font = "bold 20px Arial";
        this.guiCtx.textAlign = "center";
        // Properly center text vertically by using textMetrics
        const textMetrics = this.guiCtx.measureText(text);
        const textHeight = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;
        const textY = centerY + textHeight / 2 - textMetrics.actualBoundingBoxDescent;
        this.guiCtx.fillText(text, centerX, textY);
    }
    
    // EXACT copy of Tetris drawMenuButton method
    drawTetrisMenuButton(x, y, width, height, text, isHighlighted, theme) {
        const ctx = this.guiCtx;
        const depth = 4;
        
        // Enhanced shadow for highlighted buttons
        if (isHighlighted) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
            ctx.fillRect(x + depth + 2, y + depth + 2, width, height);
        } else {
            ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
            ctx.fillRect(x + depth, y + depth, width, height);
        }
        
        // Main button background with enhanced colors
        const gradient = ctx.createLinearGradient(x, y, x, y + height);
        
        if (isHighlighted) {
            gradient.addColorStop(0, this.lightenColor(theme.ui.accent, 0.6));
            gradient.addColorStop(1, theme.ui.accent);
        } else {
            gradient.addColorStop(0, theme.ui.accent);
            gradient.addColorStop(1, this.darkenColor(theme.ui.accent, 0.3));
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, width, height);
        
        // Enhanced border for highlighted buttons
        ctx.strokeStyle = isHighlighted ? "#ffffff" : this.darkenColor(theme.ui.accent, 0.4);
        ctx.lineWidth = isHighlighted ? 3 : 2;
        ctx.strokeRect(x, y, width, height);
        
        // Text
        ctx.fillStyle = isHighlighted ? "#000000" : theme.ui.text;
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "center";
        // Properly center text vertically by using textMetrics
        const textMetrics = ctx.measureText(text);
        const textHeight = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;
        const textY = y + height / 2 + textHeight / 2 - textMetrics.actualBoundingBoxDescent;
        ctx.fillText(text, x + width / 2, textY);
    }
    
    lightenColor(color, factor) {
        return color.replace(/#([0-9a-f]{6})/i, (match, hex) => {
            let r = parseInt(hex.substr(0, 2), 16);
            let g = parseInt(hex.substr(2, 2), 16);
            let b = parseInt(hex.substr(4, 2), 16);
            
            r = Math.min(255, Math.floor(r + (255 - r) * factor));
            g = Math.min(255, Math.floor(g + (255 - g) * factor));
            b = Math.min(255, Math.floor(b + (255 - b) * factor));
            
            return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        });
    }
    
    darkenColor(color, factor) {
        return color.replace(/#([0-9a-f]{6})/i, (match, hex) => {
            let r = parseInt(hex.substr(0, 2), 16);
            let g = parseInt(hex.substr(2, 2), 16);
            let b = parseInt(hex.substr(4, 2), 16);
            
            r = Math.floor(r * (1 - factor));
            g = Math.floor(g * (1 - factor));
            b = Math.floor(b * (1 - factor));
            
            return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        });
    }
    
    drawVictoryScreen() {
        this.guiCtx.fillStyle = "rgba(0, 100, 0, 0.8)";
        this.guiCtx.fillRect(0, 0, PILL_PANIC_CONSTANTS.WIDTH, PILL_PANIC_CONSTANTS.HEIGHT);
        
        this.guiCtx.fillStyle = "#00ff00";
        this.guiCtx.font = "48px Arial";
        this.guiCtx.textAlign = "center";
        this.guiCtx.fillText("STAGE CLEAR!", PILL_PANIC_CONSTANTS.WIDTH / 2, PILL_PANIC_CONSTANTS.HEIGHT / 2);
    }
    
    drawGameOverScreen() {
        // Draw background (same as before)
        this.guiCtx.fillStyle = "rgba(100, 0, 0, 0.8)";
        this.guiCtx.fillRect(0, 0, PILL_PANIC_CONSTANTS.WIDTH, PILL_PANIC_CONSTANTS.HEIGHT);

        // Draw title (moved up to make room for menu)
        this.guiCtx.fillStyle = "#ff0000";
        this.guiCtx.font = "48px Arial";
        this.guiCtx.textAlign = "center";
        this.guiCtx.fillText("GAME OVER", PILL_PANIC_CONSTANTS.WIDTH / 2, PILL_PANIC_CONSTANTS.HEIGHT / 2 - 60);

        // Draw single button for game over screen
        if (this.game.gameState === PILL_PANIC_CONSTANTS.STATES.GAME_OVER) {
            const buttonPositions = [];
            const buttonWidth = 200;
            const buttonHeight = 50;
            const buttonY = PILL_PANIC_CONSTANTS.HEIGHT / 2 + 40;

            // Single "BACK TO MENU" button
            const x = PILL_PANIC_CONSTANTS.WIDTH / 2 - buttonWidth / 2;
            const y = buttonY;
            const isHighlighted = true; // Always highlighted since it's the only button

            const theme = {
                ui: {
                    accent: "#aa4444",
                    text: "#ffffff"
                }
            };

            this.drawTetrisMenuButton(x, y, buttonWidth, buttonHeight, "BACK TO MENU", isHighlighted, theme);

            // Store position for mouse interaction
            buttonPositions.push({ x, y, width: buttonWidth, height: buttonHeight });

            // Update mouse hit areas - use "victory" prefix since input handler uses victoryMenu
            this.game.inputManager.updateMenuElementPositions("victory", buttonPositions);
        }
    }
    
    drawDebugLayer() {
        this.debugCtx.clearRect(0, 0, PILL_PANIC_CONSTANTS.WIDTH, PILL_PANIC_CONSTANTS.HEIGHT);
        
        this.debugCtx.fillStyle = "rgba(0, 0, 0, 0.8)";
        this.debugCtx.fillRect(10, 10, 300, 200);
        
        this.debugCtx.fillStyle = "#00ff00";
        this.debugCtx.font = "14px monospace";
        this.debugCtx.textAlign = "left";
        
        const info = [
            "Pill Panic DEBUG",
            `State: ${this.game.gameState}`,
            `Score: ${this.game.gameLogic.score}`,
            `Viruses: ${this.game.gameLogic.virusCount}`,
            `Chain: ${this.game.gameLogic.chainCount}`
        ];
        
        info.forEach((line, i) => {
            this.debugCtx.fillText(line, 20, 35 + i * 18);
        });
    }

    

    
    drawCapsule(capsule) {
        const positions = capsule.getPositions();
        const colors = capsule.getColors();

        const leftX = PILL_PANIC_CONSTANTS.GRID.OFFSET_X + positions.left.x * PILL_PANIC_CONSTANTS.GRID.CELL_SIZE;
        const leftY = PILL_PANIC_CONSTANTS.GRID.OFFSET_Y + capsule.y * PILL_PANIC_CONSTANTS.GRID.CELL_SIZE;

        const rightX = PILL_PANIC_CONSTANTS.GRID.OFFSET_X + positions.right.x * PILL_PANIC_CONSTANTS.GRID.CELL_SIZE;
        const rightY = PILL_PANIC_CONSTANTS.GRID.OFFSET_Y + positions.right.y * PILL_PANIC_CONSTANTS.GRID.CELL_SIZE;

        // Draw as proper connected pill
        if (capsule.orientation === "horizontal") {
            this.drawHorizontalPill(leftX, leftY, colors.leftColor, colors.rightColor);
        } else {
            this.drawVerticalPill(leftX, leftY, colors.leftColor, colors.rightColor);
        }
    }
    
    drawCell(x, y, color, type) {
        if (type === "virus") {
            this.drawVirus(x, y, color);
        } else {
            // For capsule pieces, we need more info - this is just a fallback
            const colorMap = this.getColorMap();
            const size = PILL_PANIC_CONSTANTS.GRID.CELL_SIZE;
            
            this.gameCtx.save();
            const gradient = this.gameCtx.createLinearGradient(x, y, x, y + size);
            gradient.addColorStop(0, colorMap[color].light);
            gradient.addColorStop(0.5, colorMap[color].base);
            gradient.addColorStop(1, colorMap[color].dark);
            
            this.gameCtx.fillStyle = gradient;
            this.gameCtx.beginPath();
            this.gameCtx.arc(x + size/2, y + size/2, size/2 - 2, 0, Math.PI * 2);
            this.gameCtx.fill();
            this.gameCtx.restore();
        }
    }
    
    // Original beautiful pill rendering methods
    drawHorizontalPill(x, y, leftColor, rightColor) {
        const size = PILL_PANIC_CONSTANTS.GRID.CELL_SIZE;
        const radius = size / 2;
        
        this.gameCtx.save();
        
        const colorMap = this.getColorMap();
        
        // Left half
        const leftGradient = this.gameCtx.createLinearGradient(x, y, x, y + size);
        leftGradient.addColorStop(0, colorMap[leftColor].light);
        leftGradient.addColorStop(0.5, colorMap[leftColor].base);
        leftGradient.addColorStop(1, colorMap[leftColor].dark);
        
        this.gameCtx.fillStyle = leftGradient;
        this.gameCtx.beginPath();
        this.gameCtx.arc(x + radius, y + radius, radius - 2, Math.PI / 2, Math.PI * 1.5);
        this.gameCtx.lineTo(x + size, y + 2);
        this.gameCtx.lineTo(x + size, y + size - 2);
        this.gameCtx.closePath();
        this.gameCtx.fill();
        
        // Right half
        const rightGradient = this.gameCtx.createLinearGradient(x + size, y, x + size, y + size);
        rightGradient.addColorStop(0, colorMap[rightColor].light);
        rightGradient.addColorStop(0.5, colorMap[rightColor].base);
        rightGradient.addColorStop(1, colorMap[rightColor].dark);
        
        this.gameCtx.fillStyle = rightGradient;
        this.gameCtx.beginPath();
        this.gameCtx.moveTo(x + size, y + 2);
        this.gameCtx.arc(x + size + radius, y + radius, radius - 2, Math.PI * 1.5, Math.PI / 2);
        this.gameCtx.lineTo(x + size, y + size - 2);
        this.gameCtx.closePath();
        this.gameCtx.fill();
        
        // Highlight
        this.gameCtx.fillStyle = "rgba(255, 255, 255, 0.4)";
        this.gameCtx.beginPath();
        this.gameCtx.ellipse(x + size, y + radius * 0.6, size * 0.8, radius * 0.4, 0, 0, Math.PI * 2);
        this.gameCtx.fill();
        
        this.gameCtx.restore();
    }
    
    drawVerticalPill(x, y, topColor, bottomColor) {
        const size = PILL_PANIC_CONSTANTS.GRID.CELL_SIZE;
        const radius = size / 2;
        
        this.gameCtx.save();
        
        const colorMap = this.getColorMap();
        
        // Top half
        const topGradient = this.gameCtx.createLinearGradient(x, y, x, y + size);
        topGradient.addColorStop(0, colorMap[topColor].light);
        topGradient.addColorStop(0.5, colorMap[topColor].base);
        topGradient.addColorStop(1, colorMap[topColor].dark);
        
        this.gameCtx.fillStyle = topGradient;
        this.gameCtx.beginPath();
        this.gameCtx.arc(x + radius, y + radius, radius - 2, Math.PI, 0);
        this.gameCtx.lineTo(x + size - 2, y + size);
        this.gameCtx.lineTo(x + 2, y + size);
        this.gameCtx.closePath();
        this.gameCtx.fill();
        
        // Bottom half
        const bottomGradient = this.gameCtx.createLinearGradient(x, y + size, x, y + size * 2);
        bottomGradient.addColorStop(0, colorMap[bottomColor].light);
        bottomGradient.addColorStop(0.5, colorMap[bottomColor].base);
        bottomGradient.addColorStop(1, colorMap[bottomColor].dark);
        
        this.gameCtx.fillStyle = bottomGradient;
        this.gameCtx.beginPath();
        this.gameCtx.moveTo(x + 2, y + size);
        this.gameCtx.lineTo(x + size - 2, y + size);
        this.gameCtx.arc(x + radius, y + size + radius, radius - 2, 0, Math.PI);
        this.gameCtx.closePath();
        this.gameCtx.fill();
        
        // Highlight - circle at top, 0.7 of pill width
        this.gameCtx.fillStyle = "rgba(255, 255, 255, 0.4)";
        this.gameCtx.beginPath();
        this.gameCtx.arc(x + radius, y + radius * 0.7, radius * 0.5, 0, Math.PI * 2);
        this.gameCtx.fill();
        
        this.gameCtx.restore();
    }
    
    drawVirus(x, y, color) {
        const size = PILL_PANIC_CONSTANTS.GRID.CELL_SIZE;
        const radius = size / 2 - 2;
        
        this.gameCtx.save();
        
        const colorMap = this.getColorMap();
        
        // Virus body
        const gradient = this.gameCtx.createRadialGradient(
            x + radius + 2, y + radius + 2, radius * 0.2,
            x + radius + 2, y + radius + 2, radius
        );
        gradient.addColorStop(0, colorMap[color].light);
        gradient.addColorStop(0.6, colorMap[color].base);
        gradient.addColorStop(1, colorMap[color].dark);
        
        this.gameCtx.fillStyle = gradient;
        this.gameCtx.beginPath();
        
        // Irregular virus shape
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const r = radius * (0.8 + Math.sin(i * 1.5 + this.game.gameLogic.animationTime * 2) * 0.2);
            const px = x + radius + 2 + Math.cos(angle) * r;
            const py = y + radius + 2 + Math.sin(angle) * r;
            
            if (i === 0) {
                this.gameCtx.moveTo(px, py);
            } else {
                this.gameCtx.lineTo(px, py);
            }
        }
        
        this.gameCtx.closePath();
        this.gameCtx.fill();
        
        // Eyes
        this.gameCtx.fillStyle = "rgba(0, 0, 0, 0.8)";
        const eyeY = y + radius - 2;
        
        this.gameCtx.beginPath();
        this.gameCtx.arc(x + radius - 4, eyeY, 2, 0, Math.PI * 2);
        this.gameCtx.fill();
        
        this.gameCtx.beginPath();
        this.gameCtx.arc(x + radius + 8, eyeY, 2, 0, Math.PI * 2);
        this.gameCtx.fill();
        
        // Mouth
        this.gameCtx.strokeStyle = "rgba(0, 0, 0, 0.6)";
        this.gameCtx.lineWidth = 1;
        this.gameCtx.beginPath();
        this.gameCtx.arc(x + radius + 2, y + radius + 4, 4, 0, Math.PI);
        this.gameCtx.stroke();
        
        this.gameCtx.restore();
    }
    
    getColorMap() {
        return {
            red: {
                base: PILL_PANIC_CONSTANTS.COLORS.GAME.RED,
                light: PILL_PANIC_CONSTANTS.COLORS.GAME.RED_LIGHT,
                dark: PILL_PANIC_CONSTANTS.COLORS.GAME.RED_DARK
            },
            blue: {
                base: PILL_PANIC_CONSTANTS.COLORS.GAME.BLUE,
                light: PILL_PANIC_CONSTANTS.COLORS.GAME.BLUE_LIGHT,
                dark: PILL_PANIC_CONSTANTS.COLORS.GAME.BLUE_DARK
            },
            yellow: {
                base: PILL_PANIC_CONSTANTS.COLORS.GAME.YELLOW,
                light: PILL_PANIC_CONSTANTS.COLORS.GAME.YELLOW_LIGHT,
                dark: PILL_PANIC_CONSTANTS.COLORS.GAME.YELLOW_DARK
            }
        };
    }
    
    drawHUD() {
        // HUD panel
        const panelX = 30;
        const panelY = 100;
        const panelWidth = 220;
        const panelHeight = 380;
        
        this.guiCtx.fillStyle = PILL_PANIC_CONSTANTS.COLORS.GUI.PANEL_BG;
        this.guiCtx.fillRect(panelX, panelY, panelWidth, panelHeight);
        
        this.guiCtx.strokeStyle = PILL_PANIC_CONSTANTS.COLORS.GAME.BOTTLE_BORDER;
        this.guiCtx.lineWidth = 2;
        this.guiCtx.strokeRect(panelX, panelY, panelWidth, panelHeight);
        
        // Stats
        this.guiCtx.fillStyle = PILL_PANIC_CONSTANTS.COLORS.GUI.TEXT;
        this.guiCtx.font = "bold 20px Arial";
        this.guiCtx.textAlign = "left";
        
        let yPos = panelY + 35;
        
        this.guiCtx.fillText("SCORE", panelX + 20, yPos);
        this.guiCtx.font = "24px Arial";
        this.guiCtx.fillText(this.game.gameLogic.score.toString(), panelX + 20, yPos + 30);
        
        yPos += 80;
        this.guiCtx.font = "bold 20px Arial";
        this.guiCtx.fillText("LEVEL", panelX + 20, yPos);
        this.guiCtx.font = "24px Arial";
        this.guiCtx.fillText(this.game.gameLogic.level.toString(), panelX + 20, yPos + 30);
        
        yPos += 80;
        this.guiCtx.font = "bold 20px Arial";
        this.guiCtx.fillText("VIRUSES", panelX + 20, yPos);
        this.guiCtx.font = "24px Arial";
        
        // Color code virus count
        if (this.game.gameLogic.virusCount === 0) {
            this.guiCtx.fillStyle = "#44ff44";
        } else if (this.game.gameLogic.virusCount <= 3) {
            this.guiCtx.fillStyle = "#ffff44";
        } else {
            this.guiCtx.fillStyle = PILL_PANIC_CONSTANTS.COLORS.GUI.TEXT;
        }
        this.guiCtx.fillText(this.game.gameLogic.virusCount.toString(), panelX + 20, yPos + 30);
        
        // Chain indicator
        if (this.game.gameLogic.chainCount > 1) {
            yPos += 80;
            this.guiCtx.fillStyle = PILL_PANIC_CONSTANTS.COLORS.GAME.YELLOW;
            this.guiCtx.font = "bold 18px Arial";
            this.guiCtx.fillText(`CHAIN x${this.game.gameLogic.chainCount}!`, panelX + 20, yPos);
        }
        
        // Instructions
        yPos = panelY + panelHeight - 60;
        this.guiCtx.fillStyle = "#aaaaaa";
        this.guiCtx.font = "12px Arial";
        this.guiCtx.fillText("Arrows: Move", panelX + 20, yPos);
        this.guiCtx.fillText("Action1/2: Rotate", panelX + 20, yPos + 18);
        this.guiCtx.fillText("Down: Fast Drop", panelX + 20, yPos + 36);
    }
    
    drawVictoryScreen() {
        // Draw background (same as before)
        this.guiCtx.fillStyle = "rgba(0, 100, 0, 0.8)";
        this.guiCtx.fillRect(0, 0, PILL_PANIC_CONSTANTS.WIDTH, PILL_PANIC_CONSTANTS.HEIGHT);

        // Draw title and score (moved up to make room for menu)
        this.guiCtx.fillStyle = "#00ff00";
        this.guiCtx.font = "48px Arial";
        this.guiCtx.textAlign = "center";
        this.guiCtx.fillText("STAGE CLEAR!", PILL_PANIC_CONSTANTS.WIDTH / 2, PILL_PANIC_CONSTANTS.HEIGHT / 2 - 80);

        this.guiCtx.fillStyle = "#ffffff";
        this.guiCtx.font = "24px Arial";
        this.guiCtx.fillText(`Score: ${this.game.gameLogic.score}`, PILL_PANIC_CONSTANTS.WIDTH / 2, PILL_PANIC_CONSTANTS.HEIGHT / 2 - 40);

        // Draw single button for victory screen
        if (this.game.gameState === PILL_PANIC_CONSTANTS.STATES.VICTORY) {
            const buttonPositions = [];
            const buttonWidth = 200;
            const buttonHeight = 50;
            const buttonY = PILL_PANIC_CONSTANTS.HEIGHT / 2 + 40;

            // Single "BACK TO MENU" button
            const x = PILL_PANIC_CONSTANTS.WIDTH / 2 - buttonWidth / 2;
            const y = buttonY;
            const isHighlighted = true; // Always highlighted since it's the only button

            const theme = {
                ui: {
                    accent: "#44aa44",
                    text: "#ffffff"
                }
            };

            this.drawTetrisMenuButton(x, y, buttonWidth, buttonHeight, "BACK TO MENU", isHighlighted, theme);

            // Store position for mouse interaction
            buttonPositions.push({ x, y, width: buttonWidth, height: buttonHeight });

            // Update mouse hit areas for victory screen
            this.game.inputManager.updateMenuElementPositions("gameOver", buttonPositions);
        }
    }
    
    drawGameOverScreen() {
        // Draw background (same as before)
        this.guiCtx.fillStyle = "rgba(100, 0, 0, 0.8)";
        this.guiCtx.fillRect(0, 0, PILL_PANIC_CONSTANTS.WIDTH, PILL_PANIC_CONSTANTS.HEIGHT);

        // Draw title (moved up to make room for menu)
        this.guiCtx.fillStyle = "#ff0000";
        this.guiCtx.font = "48px Arial";
        this.guiCtx.textAlign = "center";
        this.guiCtx.fillText("GAME OVER", PILL_PANIC_CONSTANTS.WIDTH / 2, PILL_PANIC_CONSTANTS.HEIGHT / 2 - 20);

        // Use EXACT Tetris menu system for game over screen (single button)
        const menu = this.game.inputManager.gameOverMenu;
        const buttonPositions = [];
        const buttonWidth = 200;
        const buttonHeight = 50;
        const buttonY = PILL_PANIC_CONSTANTS.HEIGHT / 2 + 40;

        // Draw single button
        const button = menu.buttons[0];
        const x = PILL_PANIC_CONSTANTS.WIDTH / 2 - buttonWidth / 2;
        const y = buttonY;
        const isHighlighted = menu.selectedIndex === 0;

        const theme = {
            ui: {
                accent: "#aa4444",
                text: "#ffffff"
            }
        };

        this.drawTetrisMenuButton(x, y, buttonWidth, buttonHeight, button.text, isHighlighted, theme);

        // Store position for mouse interaction
        buttonPositions.push({ x, y, width: buttonWidth, height: buttonHeight });

        // Update mouse hit areas
        this.game.inputManager.updateMenuElementPositions("gameOver", buttonPositions);
    }
    
    drawDebugLayer() {
        this.debugCtx.clearRect(0, 0, PILL_PANIC_CONSTANTS.WIDTH, PILL_PANIC_CONSTANTS.HEIGHT);
        
        this.debugCtx.fillStyle = "rgba(0, 0, 0, 0.8)";
        this.debugCtx.fillRect(10, 10, 300, 200);
        
        this.debugCtx.fillStyle = "#00ff00";
        this.debugCtx.font = "14px monospace";
        this.debugCtx.textAlign = "left";
        
        const info = [
            "Pill Panic DEBUG",
            `State: ${this.game.gameState}`,
            `Score: ${this.game.gameLogic.score}`,
            `Viruses: ${this.game.gameLogic.virusCount}`,
            `Chain: ${this.game.gameLogic.chainCount}`
        ];
        
        info.forEach((line, i) => {
            this.debugCtx.fillText(line, 20, 35 + i * 18);
        });
    }
}

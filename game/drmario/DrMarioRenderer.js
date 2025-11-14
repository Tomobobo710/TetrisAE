/**
 * Dr. Mario Renderer Module
 * Handles all rendering for Dr. Mario game
 */
class DrMarioRenderer {
    constructor(drMarioGame) {
        this.game = drMarioGame;
        this.gameCtx = drMarioGame.gameCtx;
        this.guiCtx = drMarioGame.guiCtx;
        this.debugCtx = drMarioGame.debugCtx;
    }
    
    draw() {
        this.drawGameLayer();
        this.drawGUILayer();
        if (this.game.gameLogic.debugOverlayVisible) {
            this.drawDebugLayer();
        }
    }
    
    drawGameLayer() {
        // Background gradient - EXACT copy from original Dr Mario
        const gradient = this.gameCtx.createLinearGradient(0, 0, 0, DR_MARIO_CONSTANTS.HEIGHT);
        gradient.addColorStop(0, "#1a1a2e");
        gradient.addColorStop(1, "#16213e");
        this.gameCtx.fillStyle = gradient;
        this.gameCtx.fillRect(0, 0, DR_MARIO_CONSTANTS.WIDTH, DR_MARIO_CONSTANTS.HEIGHT);
        
        // Animated background particles - EXACT copy from original
        this.drawBackgroundParticles();
        
        // Draw bottle and game area
        if (this.game.gameState === DR_MARIO_CONSTANTS.STATES.PLAYING || 
            this.game.gameState === DR_MARIO_CONSTANTS.STATES.CLEARING) {
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
        this.guiCtx.clearRect(0, 0, DR_MARIO_CONSTANTS.WIDTH, DR_MARIO_CONSTANTS.HEIGHT);
        
        if (this.game.gameState === DR_MARIO_CONSTANTS.STATES.START_SCREEN) {
            this.drawStartScreen();
        } else if (this.game.gameState === DR_MARIO_CONSTANTS.STATES.LEVEL_SELECT) {
            this.drawLevelSelectMenu();
        } else {
            this.drawHUD();
            this.drawNextCapsule();
            
            if (this.game.gameState === DR_MARIO_CONSTANTS.STATES.VICTORY) {
                this.drawVictoryScreen();
            } else if (this.game.gameState === DR_MARIO_CONSTANTS.STATES.GAME_OVER) {
                this.drawGameOverScreen();
            }
        }
    }
    
    drawStartScreen() {
        // Title
        this.guiCtx.fillStyle = "#ff4444";
        this.guiCtx.font = "bold 48px Arial";
        this.guiCtx.textAlign = "center";
        this.guiCtx.fillText("DR. MARIO", DR_MARIO_CONSTANTS.WIDTH / 2, 200);
        
        // Simple start button
        const startBtn = this.game.inputManager.buttons.start;
        this.guiCtx.fillStyle = "#ffffff";
        this.guiCtx.fillRect(startBtn.x, startBtn.y, startBtn.width, startBtn.height);
        this.guiCtx.fillStyle = "#000000";
        this.guiCtx.font = "24px Arial";
        this.guiCtx.fillText("START GAME", startBtn.x + startBtn.width/2, startBtn.y + startBtn.height/2 + 8);
        
        // Back button
        const backBtn = this.game.inputManager.buttons.back;
        this.guiCtx.fillStyle = "#ffaa00";
        this.guiCtx.fillRect(backBtn.x, backBtn.y, backBtn.width, backBtn.height);
        this.guiCtx.fillStyle = "#000000";
        this.guiCtx.fillText("BACK TO TETRIS", backBtn.x + backBtn.width/2, backBtn.y + backBtn.height/2 + 8);
    }
    
    drawLevelSelectMenu() {
        // Simple level select for now
        this.guiCtx.fillStyle = "#ffffff";
        this.guiCtx.font = "32px Arial";
        this.guiCtx.textAlign = "center";
        this.guiCtx.fillText("LEVEL SELECT", DR_MARIO_CONSTANTS.WIDTH / 2, 100);
        
        // Virus level display
        this.guiCtx.font = "24px Arial";
        this.guiCtx.fillText(`Virus Level: ${this.game.inputManager.selectedVirusLevel}`, DR_MARIO_CONSTANTS.WIDTH / 2, 200);
        
        // Speed display
        const speeds = ["LO", "MED", "HI"];
        this.guiCtx.fillText(`Speed: ${speeds[this.game.inputManager.selectedSpeed]}`, DR_MARIO_CONSTANTS.WIDTH / 2, 250);
        
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
        
        const bottleX = DR_MARIO_CONSTANTS.GRID.OFFSET_X - DR_MARIO_CONSTANTS.VISUAL.BOTTLE_BORDER;
        const bottleY = DR_MARIO_CONSTANTS.GRID.OFFSET_Y - DR_MARIO_CONSTANTS.VISUAL.BOTTLE_BORDER;
        const bottleWidth = DR_MARIO_CONSTANTS.GRID.COLS * DR_MARIO_CONSTANTS.GRID.CELL_SIZE + DR_MARIO_CONSTANTS.VISUAL.BOTTLE_BORDER * 2;
        const bottleHeight = DR_MARIO_CONSTANTS.GRID.ROWS * DR_MARIO_CONSTANTS.GRID.CELL_SIZE + DR_MARIO_CONSTANTS.VISUAL.BOTTLE_BORDER * 2;
        
        // Bottle background
        this.gameCtx.fillStyle = DR_MARIO_CONSTANTS.COLORS.GAME.BOTTLE_BG;
        this.gameCtx.fillRect(bottleX, bottleY, bottleWidth, bottleHeight);
        
        // Grid lines
        this.gameCtx.strokeStyle = DR_MARIO_CONSTANTS.COLORS.GAME.GRID_LINE;
        this.gameCtx.lineWidth = 1;
        
        for (let row = 1; row < DR_MARIO_CONSTANTS.GRID.ROWS; row++) {
            const y = DR_MARIO_CONSTANTS.GRID.OFFSET_Y + row * DR_MARIO_CONSTANTS.GRID.CELL_SIZE;
            this.gameCtx.beginPath();
            this.gameCtx.moveTo(DR_MARIO_CONSTANTS.GRID.OFFSET_X, y);
            this.gameCtx.lineTo(DR_MARIO_CONSTANTS.GRID.OFFSET_X + DR_MARIO_CONSTANTS.GRID.COLS * DR_MARIO_CONSTANTS.GRID.CELL_SIZE, y);
            this.gameCtx.stroke();
        }
        
        for (let col = 1; col < DR_MARIO_CONSTANTS.GRID.COLS; col++) {
            const x = DR_MARIO_CONSTANTS.GRID.OFFSET_X + col * DR_MARIO_CONSTANTS.GRID.CELL_SIZE;
            this.gameCtx.beginPath();
            this.gameCtx.moveTo(x, DR_MARIO_CONSTANTS.GRID.OFFSET_Y);
            this.gameCtx.lineTo(x, DR_MARIO_CONSTANTS.GRID.OFFSET_Y + DR_MARIO_CONSTANTS.GRID.ROWS * DR_MARIO_CONSTANTS.GRID.CELL_SIZE);
            this.gameCtx.stroke();
        }
        
        // Draw grid contents
        this.drawGridContents();
        
        // Draw current capsule
        if (this.game.gameLogic.currentCapsule && this.game.gameState === DR_MARIO_CONSTANTS.STATES.PLAYING) {
            this.drawCapsule(this.game.gameLogic.currentCapsule);
        }
        
        // Bottle border
        this.gameCtx.strokeStyle = DR_MARIO_CONSTANTS.COLORS.GAME.BOTTLE_BORDER;
        this.gameCtx.lineWidth = DR_MARIO_CONSTANTS.VISUAL.BOTTLE_BORDER;
        this.gameCtx.strokeRect(bottleX, bottleY, bottleWidth, bottleHeight);
        
        this.gameCtx.restore();
    }
    
    drawGridContents() {
        for (let row = 0; row < DR_MARIO_CONSTANTS.GRID.ROWS; row++) {
            for (let col = 0; col < DR_MARIO_CONSTANTS.GRID.COLS; col++) {
                const cell = this.game.gameLogic.grid[row][col];
                
                if (cell.isEmpty()) continue;
                
                const x = DR_MARIO_CONSTANTS.GRID.OFFSET_X + col * DR_MARIO_CONSTANTS.GRID.CELL_SIZE;
                const y = DR_MARIO_CONSTANTS.GRID.OFFSET_Y + row * DR_MARIO_CONSTANTS.GRID.CELL_SIZE;
                
                if (cell.matched) {
                    // Draw fading matched cell
                    const alpha = this.game.gameLogic.clearingTimer / DR_MARIO_CONSTANTS.PHYSICS.CLEAR_ANIMATION_TIME;
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
        
        // EXACT copy from working Dr Mario
        const panelX = DR_MARIO_CONSTANTS.VISUAL.PREVIEW_OFFSET_X;
        const panelY = DR_MARIO_CONSTANTS.VISUAL.PREVIEW_OFFSET_Y;
        const panelWidth = 160;
        const panelHeight = 140;
        
        // Panel background
        this.guiCtx.fillStyle = DR_MARIO_CONSTANTS.COLORS.GUI.PANEL_BG;
        this.guiCtx.fillRect(panelX, panelY, panelWidth, panelHeight);
        
        this.guiCtx.strokeStyle = DR_MARIO_CONSTANTS.COLORS.GAME.BOTTLE_BORDER;
        this.guiCtx.lineWidth = 2;
        this.guiCtx.strokeRect(panelX, panelY, panelWidth, panelHeight);
        
        // Label
        this.guiCtx.fillStyle = DR_MARIO_CONSTANTS.COLORS.GUI.TEXT;
        this.guiCtx.font = "bold 16px Arial";
        this.guiCtx.textAlign = "center";
        this.guiCtx.fillText("NEXT", panelX + panelWidth / 2, panelY + 25);
        
        // Draw preview capsule
        const previewX = panelX + panelWidth / 2 - DR_MARIO_CONSTANTS.GRID.CELL_SIZE;
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
        for (let x = 0; x < DR_MARIO_CONSTANTS.WIDTH; x += checkSize) {
            for (let y = 0; y < DR_MARIO_CONSTANTS.HEIGHT; y += checkSize) {
                const isPink = (x / checkSize + y / checkSize) % 2 === 0;
                this.guiCtx.fillStyle = isPink ? "#ff69b4" : "#ffa500";
                this.guiCtx.fillRect(x, y, checkSize, checkSize);
            }
        }
    }
    
    drawGameTitle() {
        this.guiCtx.fillStyle = "#ffffff";
        this.guiCtx.font = "bold 48px Arial";
        this.guiCtx.textAlign = "center";
        this.guiCtx.fillText("DR. MARIO", DR_MARIO_CONSTANTS.WIDTH / 2, 200);
    }
    
    drawStartScreen() {
        this.drawCheckerboardBackground();
        this.drawGameTitle();
        
        // Use EXACT Tetris menu system
        const menu = this.game.inputManager.startMenu;
        const buttonPositions = [];
        const buttonWidth = 240;
        const buttonHeight = 50;
        const startY = 300;
        const spacing = 70;
        
        // Draw buttons using EXACT Tetris method
        for (let i = 0; i < menu.buttons.length; i++) {
            const button = menu.buttons[i];
            const x = DR_MARIO_CONSTANTS.WIDTH / 2 - buttonWidth / 2;
            const y = startY + i * spacing;
            const isHighlighted = menu.selectedIndex === i;
            
            // Use actual Tetris theme
            const theme = {
                ui: {
                    accent: i === 0 ? "#ff4444" : "#aa4400",
                    text: "#ffffff"
                }
            };
            
            this.drawTetrisMenuButton(x, y, buttonWidth, buttonHeight, button.text, isHighlighted, theme);
            
            // Store position for mouse interaction
            buttonPositions.push({ x, y, width: buttonWidth, height: buttonHeight });
        }
        
        // Update mouse hit areas
        this.game.inputManager.updateMenuElementPositions("startScreen", buttonPositions);
    }
    
    drawLevelSelectMenu() {
        this.drawCheckerboardBackground();
        
        // Title
        this.guiCtx.fillStyle = "#000000";
        this.guiCtx.font = "bold 36px Arial";
        this.guiCtx.textAlign = "center";
        this.guiCtx.fillText("1 PLAYER GAME", DR_MARIO_CONSTANTS.WIDTH / 2 + 3, 103);
        
        this.guiCtx.fillStyle = "#ffffff";
        this.guiCtx.fillText("1 PLAYER GAME", DR_MARIO_CONSTANTS.WIDTH / 2, 100);
        
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
            const x = DR_MARIO_CONSTANTS.WIDTH / 2 - buttonWidth / 2;
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
                    this.guiCtx.fillStyle = "#ffffff";
                    this.guiCtx.font = "20px Arial";
                    this.guiCtx.textAlign = "center";
                    this.guiCtx.fillText("◀", x - 40, y + buttonHeight/2 + 7);
                    this.guiCtx.fillText("▶", x + buttonWidth + 40, y + buttonHeight/2 + 7);
                }
            } else if (i === 1) { // Speed
                const speeds = ["LO", "MED", "HI"];
                buttonText = `SPEED: ${speeds[this.game.inputManager.selectedSpeed]}`;
                accentColor = "#4444aa";
                
                // Draw adjustment arrows if selected
                if (isHighlighted) {
                    this.guiCtx.fillStyle = "#ffffff";
                    this.guiCtx.font = "20px Arial";
                    this.guiCtx.textAlign = "center";
                    this.guiCtx.fillText("◀", x - 40, y + buttonHeight/2 + 7);
                    this.guiCtx.fillText("▶", x + buttonWidth + 40, y + buttonHeight/2 + 7);
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
            this.guiCtx.fillRect(100, y - 30, DR_MARIO_CONSTANTS.WIDTH - 200, 60);
            
            this.guiCtx.strokeStyle = "#ffff00";
            this.guiCtx.lineWidth = 3;
            this.guiCtx.strokeRect(100, y - 30, DR_MARIO_CONSTANTS.WIDTH - 200, 60);
        }
        
        // Label
        this.guiCtx.fillStyle = isSelected ? "#ffff00" : "#ffffff";
        this.guiCtx.font = "bold 24px Arial";
        this.guiCtx.textAlign = "left";
        this.guiCtx.fillText(label, 130, y);
        
        // Value
        this.guiCtx.textAlign = "right";
        this.guiCtx.fillText(value, DR_MARIO_CONSTANTS.WIDTH - 130, y);
        
        // Arrow indicators
        if (isSelected) {
            this.guiCtx.textAlign = "center";
            this.guiCtx.font = "20px Arial";
            this.guiCtx.fillText("◀", DR_MARIO_CONSTANTS.WIDTH / 2 - 80, y);
            this.guiCtx.fillText("▶", DR_MARIO_CONSTANTS.WIDTH / 2 + 80, y);
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
        this.guiCtx.fillText(text, centerX, centerY + 7);
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
        ctx.fillText(text, x + width / 2, y + height / 2 + 7);
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
        this.guiCtx.fillRect(0, 0, DR_MARIO_CONSTANTS.WIDTH, DR_MARIO_CONSTANTS.HEIGHT);
        
        this.guiCtx.fillStyle = "#00ff00";
        this.guiCtx.font = "48px Arial";
        this.guiCtx.textAlign = "center";
        this.guiCtx.fillText("STAGE CLEAR!", DR_MARIO_CONSTANTS.WIDTH / 2, DR_MARIO_CONSTANTS.HEIGHT / 2);
    }
    
    drawGameOverScreen() {
        this.guiCtx.fillStyle = "rgba(100, 0, 0, 0.8)";
        this.guiCtx.fillRect(0, 0, DR_MARIO_CONSTANTS.WIDTH, DR_MARIO_CONSTANTS.HEIGHT);
        
        this.guiCtx.fillStyle = "#ff0000";
        this.guiCtx.font = "48px Arial";
        this.guiCtx.textAlign = "center";
        this.guiCtx.fillText("GAME OVER", DR_MARIO_CONSTANTS.WIDTH / 2, DR_MARIO_CONSTANTS.HEIGHT / 2);
    }
    
    drawDebugLayer() {
        this.debugCtx.clearRect(0, 0, DR_MARIO_CONSTANTS.WIDTH, DR_MARIO_CONSTANTS.HEIGHT);
        
        this.debugCtx.fillStyle = "rgba(0, 0, 0, 0.8)";
        this.debugCtx.fillRect(10, 10, 300, 200);
        
        this.debugCtx.fillStyle = "#00ff00";
        this.debugCtx.font = "14px monospace";
        this.debugCtx.textAlign = "left";
        
        const info = [
            "DR. MARIO DEBUG",
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
        
        const leftX = DR_MARIO_CONSTANTS.GRID.OFFSET_X + positions.left.x * DR_MARIO_CONSTANTS.GRID.CELL_SIZE;
        const leftY = DR_MARIO_CONSTANTS.GRID.OFFSET_Y + capsule.y * DR_MARIO_CONSTANTS.GRID.CELL_SIZE;
        
        const rightX = DR_MARIO_CONSTANTS.GRID.OFFSET_X + positions.right.x * DR_MARIO_CONSTANTS.GRID.CELL_SIZE;
        const rightY = DR_MARIO_CONSTANTS.GRID.OFFSET_Y + positions.right.y * DR_MARIO_CONSTANTS.GRID.CELL_SIZE;
        
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
            const size = DR_MARIO_CONSTANTS.GRID.CELL_SIZE;
            
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
        const size = DR_MARIO_CONSTANTS.GRID.CELL_SIZE;
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
        const size = DR_MARIO_CONSTANTS.GRID.CELL_SIZE;
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
        
        // Highlight
        this.gameCtx.fillStyle = "rgba(255, 255, 255, 0.4)";
        this.gameCtx.beginPath();
        this.gameCtx.ellipse(x + radius, y + size * 0.7, radius * 0.4, size * 0.8, 0, 0, Math.PI * 2);
        this.gameCtx.fill();
        
        this.gameCtx.restore();
    }
    
    drawVirus(x, y, color) {
        const size = DR_MARIO_CONSTANTS.GRID.CELL_SIZE;
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
                base: DR_MARIO_CONSTANTS.COLORS.GAME.RED,
                light: DR_MARIO_CONSTANTS.COLORS.GAME.RED_LIGHT,
                dark: DR_MARIO_CONSTANTS.COLORS.GAME.RED_DARK
            },
            blue: {
                base: DR_MARIO_CONSTANTS.COLORS.GAME.BLUE,
                light: DR_MARIO_CONSTANTS.COLORS.GAME.BLUE_LIGHT,
                dark: DR_MARIO_CONSTANTS.COLORS.GAME.BLUE_DARK
            },
            yellow: {
                base: DR_MARIO_CONSTANTS.COLORS.GAME.YELLOW,
                light: DR_MARIO_CONSTANTS.COLORS.GAME.YELLOW_LIGHT,
                dark: DR_MARIO_CONSTANTS.COLORS.GAME.YELLOW_DARK
            }
        };
    }
    
    drawHUD() {
        // HUD panel - EXACT copy from working Dr Mario
        const panelX = 30;
        const panelY = 100;
        const panelWidth = 220;
        const panelHeight = 380;
        
        this.guiCtx.fillStyle = DR_MARIO_CONSTANTS.COLORS.GUI.PANEL_BG;
        this.guiCtx.fillRect(panelX, panelY, panelWidth, panelHeight);
        
        this.guiCtx.strokeStyle = DR_MARIO_CONSTANTS.COLORS.GAME.BOTTLE_BORDER;
        this.guiCtx.lineWidth = 2;
        this.guiCtx.strokeRect(panelX, panelY, panelWidth, panelHeight);
        
        // Stats
        this.guiCtx.fillStyle = DR_MARIO_CONSTANTS.COLORS.GUI.TEXT;
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
            this.guiCtx.fillStyle = DR_MARIO_CONSTANTS.COLORS.GUI.TEXT;
        }
        this.guiCtx.fillText(this.game.gameLogic.virusCount.toString(), panelX + 20, yPos + 30);
        
        // Chain indicator
        if (this.game.gameLogic.chainCount > 1) {
            yPos += 80;
            this.guiCtx.fillStyle = DR_MARIO_CONSTANTS.COLORS.GAME.YELLOW;
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
        this.guiCtx.fillStyle = "rgba(0, 100, 0, 0.8)";
        this.guiCtx.fillRect(0, 0, DR_MARIO_CONSTANTS.WIDTH, DR_MARIO_CONSTANTS.HEIGHT);
        
        this.guiCtx.fillStyle = "#00ff00";
        this.guiCtx.font = "48px Arial";
        this.guiCtx.textAlign = "center";
        this.guiCtx.fillText("STAGE CLEAR!", DR_MARIO_CONSTANTS.WIDTH / 2, DR_MARIO_CONSTANTS.HEIGHT / 2);
        
        this.guiCtx.fillStyle = "#ffffff";
        this.guiCtx.font = "24px Arial";
        this.guiCtx.fillText(`Score: ${this.game.gameLogic.score}`, DR_MARIO_CONSTANTS.WIDTH / 2, DR_MARIO_CONSTANTS.HEIGHT / 2 + 50);
    }
    
    drawGameOverScreen() {
        this.guiCtx.fillStyle = "rgba(100, 0, 0, 0.8)";
        this.guiCtx.fillRect(0, 0, DR_MARIO_CONSTANTS.WIDTH, DR_MARIO_CONSTANTS.HEIGHT);
        
        this.guiCtx.fillStyle = "#ff0000";
        this.guiCtx.font = "48px Arial";
        this.guiCtx.textAlign = "center";
        this.guiCtx.fillText("GAME OVER", DR_MARIO_CONSTANTS.WIDTH / 2, DR_MARIO_CONSTANTS.HEIGHT / 2);
    }
    
    drawDebugLayer() {
        this.debugCtx.clearRect(0, 0, DR_MARIO_CONSTANTS.WIDTH, DR_MARIO_CONSTANTS.HEIGHT);
        
        this.debugCtx.fillStyle = "rgba(0, 0, 0, 0.8)";
        this.debugCtx.fillRect(10, 10, 300, 200);
        
        this.debugCtx.fillStyle = "#00ff00";
        this.debugCtx.font = "14px monospace";
        this.debugCtx.textAlign = "left";
        
        const info = [
            "DR. MARIO DEBUG",
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

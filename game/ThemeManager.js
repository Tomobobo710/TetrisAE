/**
 * ThemeManager - Handles visual theme system and smooth transitions
 */
class ThemeManager {
    constructor() {
        this.themeNames = window.THEME_NAMES;
        this.enabledThemes = null; // null = all themes enabled

        // Initialize bag randomization system
        this.currentBag = [];
        this.bagIndex = 0;
        this.generateNewBag(); // Creates first shuffled bag

        // Start with theme from first bag
        this.currentThemeIndex = 0;
        this.currentTheme = window.getTheme(this.currentBag[this.bagIndex]);

        this.transition = {
            active: false,
            progress: 0,
            duration: 2.0,
            fromTheme: null,
            toTheme: null
        };

        this.autoChange = true;
        this.changeTimer = 0;
        this.changeDuration = 45; // seconds
    }

    /**
     * Shuffle array using Fisher-Yates algorithm
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Set which themes are enabled
     */
    setEnabledThemes(enabledThemes) {
        this.enabledThemes = enabledThemes;
        // Regenerate bag with new theme set
        this.generateNewBag();
    }

    /**
     * Refresh current theme to ensure it's from the enabled themes list
     * Call this after changing enabled themes to immediately show a valid theme
     */
    refreshCurrentTheme() {
        // Get the first theme from the current bag (which was just regenerated with enabled themes)
        if (this.currentBag && this.currentBag.length > 0) {
            this.currentTheme = window.getTheme(this.currentBag[0]);
            this.bagIndex = 0;
        }
    }

    /**
     * Ensure current theme is in the enabled themes list
     * If not, switch to a valid theme immediately
     */
    ensureValidTheme() {
        const enabledThemes = this.getEnabledThemeNames();
        const currentThemeName = this.getCurrentThemeName();

        // Check if current theme is in the enabled list
        if (!enabledThemes.includes(currentThemeName)) {
            // Current theme is not enabled, switch to first enabled theme
            this.refreshCurrentTheme();
        }
    }

    /**
     * Get the name of the current theme
     */
    getCurrentThemeName() {
        const currentTheme = this.getCurrentTheme();
        // Find which theme name matches this theme object
        for (const [name, theme] of Object.entries(window.TETRIS_THEMES)) {
            if (theme === currentTheme) {
                return name;
            }
        }
        return "DEFAULT"; // Fallback
    }

    /**
     * Get list of currently enabled themes
     */
    getEnabledThemeNames() {
        // If no enabled themes set (null/undefined), use all themes except DEFAULT
        if (!this.enabledThemes) {
            return this.themeNames.filter((name) => name !== "DEFAULT");
        }
        // If empty array, that means user disabled everything - return what we have (might be just DEFAULT)
        return this.enabledThemes;
    }

    /**
     * Generate a new randomized bag of themes
     */
    generateNewBag(avoidTheme = null) {
        // Use enabled themes or all themes (excluding DEFAULT unless it's the only option)
        let availableThemes = this.getEnabledThemeNames();

        // Safety fallback: if somehow no themes are available, use DEFAULT
        if (availableThemes.length === 0) {
            availableThemes = ["DEFAULT"];
        }

        let newBag = this.shuffleArray(availableThemes);

        // If we need to avoid a theme (last theme from previous bag), reroll if it matches
        if (avoidTheme && newBag[0] === avoidTheme && availableThemes.length > 1) {
            // Keep shuffling until first theme doesn't match
            let attempts = 0;
            while (newBag[0] === avoidTheme && attempts < 100) {
                newBag = this.shuffleArray(availableThemes);
                attempts++;
            }

            // Fallback: if still matching after many attempts, just swap first with random other
            if (newBag[0] === avoidTheme && newBag.length > 1) {
                const swapIndex = 1 + Math.floor(Math.random() * (newBag.length - 1));
                [newBag[0], newBag[swapIndex]] = [newBag[swapIndex], newBag[0]];
            }
        }

        this.currentBag = newBag;
        this.bagIndex = 0;
    }

    /**
     * Update theme transitions
     */
    update(deltaTime) {
        // Update transition
        if (this.transition.active) {
            this.transition.progress += deltaTime / this.transition.duration;
            if (this.transition.progress >= 1.0) {
                this.currentTheme = this.transition.toTheme;
                this.transition.active = false;
            }
        }

        // Auto theme change timer
        if (this.autoChange) {
            this.changeTimer += deltaTime;
            if (this.changeTimer >= this.changeDuration) {
                this.cycleTheme();
            }
        }
    }

    /**
     * Cycle to next theme using bag system
     */
    cycleTheme() {
        // Check if current bag contains any disabled themes - if so, regenerate it
        const enabledThemes = this.getEnabledThemeNames();
        const hasDisabledThemes = this.currentBag.some(theme => !enabledThemes.includes(theme));

        if (hasDisabledThemes) {
            // Regenerate bag with current valid themes
            this.generateNewBag();
            this.bagIndex = 0;
        } else {
            // Move to next theme in current bag
            this.bagIndex++;

            // Check if we've exhausted the current bag
            if (this.bagIndex >= this.currentBag.length) {
                // Get the last theme from the old bag before generating new one
                const lastTheme = this.currentBag[this.currentBag.length - 1];
                this.generateNewBag(lastTheme); // Generate new bag, avoiding repeat
                this.bagIndex = 0;
            }
        }

        // Transition to next theme from bag
        const nextTheme = this.currentBag[this.bagIndex];
        this.transitionToTheme(nextTheme);
    }

    /**
     * Transition to specific theme
     */
    transitionToTheme(themeName) {
        this.transition = {
            active: true,
            progress: 0,
            duration: 2.0,
            fromTheme: this.currentTheme,
            toTheme: window.getTheme(themeName)
        };
        this.changeTimer = 0;
    }

    /**
     * Get current theme
     */
    getCurrentTheme() {
        // If transitioning, return the target theme so changes are immediately visible
        if (this.transition.active && this.transition.toTheme) {
            return this.transition.toTheme;
        }
        return this.currentTheme;
    }
}

/**
 * ThemeRegistry - Global registry for all theme instances
 * Works with HTML script loading (no modules)
 */

 // Create global theme instances
 const defaultTheme = new DefaultTheme();
 const neonCityTheme = new NeonCityTheme();
 const matrixTheme = new MatrixTheme();
 const crystalTheme = new CrystalTheme();
 const fireTheme = new FireTheme();
 const oceanTheme = new OceanTheme();
 const gameBoyTheme = new GameBoyTheme();
 const virtualBoyTheme = new VirtualBoyTheme();
 const monochromeTheme = new MonochromeTheme();
 const cyberpunkCityTheme = new CyberpunkCityTheme();
 const fractalTheme = new FractalTheme();
 const boidsTheme = new BoidsTheme();
 const countryDriveTheme = new CountryDriveTheme();
 const travelerTheme = new TravelerTheme();
 const tunnelTheme = new TunnelTheme();
 const voxelTheme = new VoxelTheme();
 const rainTheme = new RainTheme();

// Warm-start all themes (fast-forward animations to populate initial state)
virtualBoyTheme.setup();
defaultTheme.setup();
neonCityTheme.setup();
matrixTheme.setup();
crystalTheme.setup();
fireTheme.setup();
oceanTheme.setup();
gameBoyTheme.setup();
monochromeTheme.setup();
cyberpunkCityTheme.setup();
fractalTheme.setup();
boidsTheme.setup();
countryDriveTheme.setup();
travelerTheme.setup();
voxelTheme.setup();
rainTheme.setup();

// Global theme registry (replaces TETRIS.THEMES)
window.TETRIS_THEMES = {
    'DEFAULT': defaultTheme,
    'NEON_CITY': neonCityTheme,
    'MATRIX': matrixTheme,
    'CRYSTAL': crystalTheme,
    'FIRE': fireTheme,
    'OCEAN': oceanTheme,
    'GAMEBOY': gameBoyTheme,
    'MONOCHROME': monochromeTheme,
    'CYBERPUNK_CITY': cyberpunkCityTheme,
    'FRACTAL': fractalTheme,
    'BOIDS': boidsTheme,
    'COUNTRY_DRIVE': countryDriveTheme,
    'TRAVELER': travelerTheme,
    'TUNNEL': tunnelTheme,
    'VOXEL': voxelTheme,
    'RAIN': rainTheme,
    'VIRTUAL_BOY': virtualBoyTheme
};

// Theme names array for cycling
window.THEME_NAMES = Object.keys(window.TETRIS_THEMES);

// Helper functions
window.getTheme = function(themeName) {
    return window.TETRIS_THEMES[themeName];
};

window.getAllThemes = function() {
    return window.TETRIS_THEMES;
};

window.getThemeNames = function() {
    return window.THEME_NAMES;
};

window.getThemeByIndex = function(index) {
    const name = window.THEME_NAMES[index % window.THEME_NAMES.length];
    return window.TETRIS_THEMES[name];
};

const gulp = require('gulp');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');

gulp.task('bundle', function() {
  return gulp.src([
    // ActionNetP2P Library Modules
    'actionengine/network/p2p/ActionNetPeer.js',
    'actionengine/network/p2p/ActionNetTrackerClient.js',
    'actionengine/network/p2p/DataConnection.js',
    
    // Action Engine Math
    'actionengine/math/geometry/triangle.js',
    'actionengine/math/vector3.js',
    
    // Action Engine 3-Layer Canvas System
    'actionengine/display/canvasmanager.js',
    
    // Action Engine Sound
    'actionengine/sound/soundfont/actionreverb.js',
    'actionengine/sound/soundfont/actionparser.js',
    'actionengine/sound/soundfont/actionsoundfont.js',
    'actionengine/sound/audiomanager.js',
    
    // Action Engine Input
    'actionengine/input/inputhandler.js',
    'actionengine/input/actionscrollablearea.js',
    
    // ActionNet
    'actionengine/network/client/ActionNetManager.js',
    'actionengine/network/client/SyncSystem.js',
    'actionengine/network/client/ActionNetManagerGUI.js',
	'actionengine/network/client/ActionNetManagerP2P.js',
    
    // Action Engine Bootstrap
    'actionengine/core/app.js',
    
    // Game Specific Modules
    'game/constants.js',
    'game/LayoutManager.js',
    'game/player/Player.js',
    'game/player/CPUPlayer.js',
    'game/GameManager.js',
    
    // Input System Managers
    'game/input/OptionsWindowManager.js',
    'game/input/ThemesWindowManager.js',
    'game/input/ControlsWindowManager.js',
    'game/input/UIWindowsCoordinator.js',
    'game/input/MenuInputManager.js',
    'game/input/GameplayInputManager.js',
    'game/input/WaitingMenusInputManager.js',
    'game/input/ActionNetInputManager.js',
    
    // Custom Controls System
    'game/input/CustomControlsManager.js',
    'game/input/CustomInputAdapter.js',
    'game/input/CustomControlsIntegration.js',

    // Modal Components
    'game/input/InputWaitingModal.js',
    'game/input/ConfirmModal.js',

    // Shared Layout Constants
    'game/render/ControlsLayoutConstants.js',
    
    'game/InputHandler.js',
    
    'game/ThemeManager.js',
    'game/render/ThemeRenderer.js',
    'game/render/GameRenderer.js',
    
    // Renderer Modules
    'game/render/UIRenderUtils.js',
    'game/render/MenuRenderer.js',
    'game/render/GameUIRenderer.js',
    'game/render/OverlayRenderer.js',

    // Window Rendering System
    'game/render/WindowRendererUtils.js',
    'game/render/OptionsWindowRenderer.js',
    'game/render/ThemesWindowRenderer.js',
    'game/render/ControlsWindowRenderer.js',
    'game/render/ConfirmModalRenderer.js',
    'game/render/InputWaitingModalRenderer.js',
    'game/render/WindowRendererCoordinator.js',
    'game/render/WindowRenderer.js',

    'game/render/UIRenderer.js',
    
    // Theme System
    'game/themes/BaseTheme.js',
    'game/themes/DefaultTheme.js',
    'game/themes/NeonCityTheme.js',
    'game/themes/MatrixTheme.js',
    'game/themes/CrystalTheme.js',
    'game/themes/FireTheme.js',
    'game/themes/OceanTheme.js',
    'game/themes/GameBoyTheme.js',
    'game/themes/MonochromeTheme.js',
    'game/themes/CyberpunkCityTheme.js',
    'game/themes/FractalTheme.js',
    'game/themes/BoidsTheme.js',
    'game/themes/CountryDriveTheme.js',
    'game/themes/TravelerTheme.js',
    'game/themes/TunnelTheme.js',
    'game/themes/VirtualBoyTheme.js',
    'game/themes/VoxelTheme.js',
    'game/themes/RainTheme.js',
    'game/themes/ThemeRegistry.js',
    
    // Networking
    'game/player/NetworkedPlayer.js',
    'game/network/NetworkSession.js',

    // Pill Panic Easter Egg Modules
    'game/pillpanic/PillPanicConstants.js',
    'game/pillpanic/capsule/Cell.js',
    'game/pillpanic/capsule/Capsule.js',
    'game/pillpanic/PillPanicAudioManager.js',
    'game/pillpanic/PillPanicGameLogic.js',
    'game/pillpanic/PillPanicInputManager.js',
    'game/pillpanic/PillPanicRenderer.js',
    'game/pillpanic/PillPanicGame.js',

    // Audio + sound constants
    'game/soundconstants.js',
    'game/AudioManager.js',

    // Menus and layout
    'game/MenuManager.js',

    // Game Bootstrap
    'game.js'
  ])
    .pipe(concat('bundle.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('dist/'));
});

gulp.task('default', gulp.series('bundle'));
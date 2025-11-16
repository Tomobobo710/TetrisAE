const gulp = require('gulp');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');

gulp.task('bundle', function() {
  return gulp.src([
    // 3rd party libs
    'actionengine/3rdparty/goblin/goblin.js',
    
    // Action Engine Math
    'actionengine/math/geometry/triangle.js',
    'actionengine/math/geometry/triangleutils.js',
    'actionengine/math/geometry/geometrybuilder.js',
    'actionengine/math/geometry/glbloader.js',
    'actionengine/math/geometry/glbexporter.js',
    'actionengine/math/geometry/modelcodegenerator.js',
    'actionengine/math/vector2.js',
    'actionengine/math/vector3.js',
    'actionengine/math/matrix4.js',
    'actionengine/math/quaternion.js',
    'actionengine/math/mathutils.js',
    'actionengine/math/viewfrustum.js',
    
    // Action Engine Rendering
    'actionengine/display/graphics/renderableobject.js',
    'actionengine/display/graphics/actionmodel3D.js',
    'actionengine/display/graphics/actionsprite3D.js',
    'actionengine/display/graphics/renderers/actionrenderer2D.js',
    'actionengine/display/graphics/renderers/actionrenderer3D/actionrenderer3D.js',
    'actionengine/display/graphics/renderers/actionrenderer3D/objectrenderer3D.js',
    'actionengine/display/graphics/renderers/actionrenderer3D/weatherrenderer3D.js',
    'actionengine/display/graphics/renderers/actionrenderer3D/waterrenderer3D.js',
    'actionengine/display/graphics/renderers/actionrenderer3D/sunrenderer3D.js',
    'actionengine/display/graphics/renderers/actionrenderer3D/spriterenderer3D.js',
    'actionengine/display/graphics/renderers/actionrenderer3D/debugrenderer3D.js',
    'actionengine/display/graphics/renderers/actionrenderer3D/canvasmanager3D.js',
    
    // Action Engine Lighting
    'actionengine/display/graphics/lighting/lightingconstants.js',
    'actionengine/display/graphics/lighting/actionlight.js',
    'actionengine/display/graphics/lighting/actiondirectionalshadowlight.js',
    'actionengine/display/graphics/lighting/actionomnidirectionalshadowlight.js',
    'actionengine/display/graphics/lighting/lightmanager.js',
    
    // Action Engine Debug
    'actionengine/debug/basedebugpanel.js',
    
    // Image Texture System
    'actionengine/display/graphics/texture/proceduraltexture.js',
    'actionengine/display/graphics/texture/texturemanager.js',
    'actionengine/display/graphics/texture/textureregistry.js',
    
    // GL Shader Management
    'actionengine/display/gl/programmanager.js',
    'actionengine/display/gl/shaders/objectshader.js',
    'actionengine/display/gl/shaders/lineshader.js',
    'actionengine/display/gl/shaders/spriteshader.js',
    'actionengine/display/gl/shaders/shadowshader.js',
    'actionengine/display/gl/shaders/watershader.js',
    'actionengine/display/gl/shaders/particleshader.js',
    
    // Action Engine Physics
    'actionengine/math/physics/actionphysicsworld3D.js',
    'actionengine/math/physics/actionphysicsobject3D.js',
    'actionengine/math/physics/shapes/actionphysicsplane3D.js',
    'actionengine/math/physics/shapes/actionphysicsbox3D.js',
    'actionengine/math/physics/shapes/actionphysicssphere3D.js',
    'actionengine/math/physics/shapes/actionphysicscapsule3D.js',
    'actionengine/math/physics/shapes/actionphysicscone3D.js',
    'actionengine/math/physics/shapes/actionphysicscylinder3D.js',
    'actionengine/math/physics/shapes/actionphysicscompoundshape3D.js',
    'actionengine/math/physics/shapes/actionphysicsconvexshape3D.js',
    'actionengine/math/physics/shapes/actionphysicsmesh3D.js',
    'actionengine/math/physics/actionraycast.js',
    'actionengine/math/physics/actionphysics.js',
    
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
    
    // Action Engine Camera
    'actionengine/camera/actioncamera.js',
    'actionengine/camera/cameracollisionhandler.js',
    
    // Action Engine 3-Layer Canvas System
    'actionengine/display/canvasmanager.js',
    
    // Action Engine Character Controller
    'actionengine/character/actioncharacter.js',
    'actionengine/character/actioncharacter3D.js',
    
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
// ============================================
// AE AI ASSISTANT - MODULAR ENTRY POINT
// Loads all modules in correct dependency order
// ============================================

// Get the directory where this script lives
// When loaded via $.evalFile(), $.fileName contains the path to this file
var scriptFolder = (function() {
    var scriptFile = new File($.fileName);
    
    // $.fileName should be the path to loader.jsx when loaded via $.evalFile
    if (scriptFile.exists && scriptFile.parent && scriptFile.parent.exists) {
        return scriptFile.parent;
    }
    
    // Fallback for CEP context where $.fileName may be invalid
    var userData = Folder.userData.fsName;
    var extPath = '/Adobe/CEP/extensions/com.aeai.assistant/jsx';
    var folder = new Folder(userData + extPath);
    if (folder.exists) {
        return folder;
    }
    
    $.writeln('ERROR: Could not determine script folder. $.fileName=' + $.fileName);
    return null;
})();

// Build base path for module loading
// Note: $.evalFile inside a function does NOT export vars to global scope
// So we must call $.evalFile at the top level
var _basePath = scriptFolder ? scriptFolder.fsName + '/' : '';

// ============================================
// LOAD ORDER - Dependencies must load first
// All $.evalFile calls must be at top level to export globals
// ============================================

// 1. Core utilities (no dependencies)
$.evalFile(_basePath + 'core/polyfills.jsx');
$.evalFile(_basePath + 'core/utils.jsx');

// 2. Data layer (depends on Utils)
$.evalFile(_basePath + 'data/composition-data.jsx');
$.evalFile(_basePath + 'data/layer-data.jsx');
$.evalFile(_basePath + 'data/effect-data.jsx');
$.evalFile(_basePath + 'data/property-data.jsx');
$.evalFile(_basePath + 'data/project-data.jsx');

// 3. Domain layer (depends on Utils)
$.evalFile(_basePath + 'domain/camera.jsx');
$.evalFile(_basePath + 'domain/light.jsx');
$.evalFile(_basePath + 'domain/material.jsx');
$.evalFile(_basePath + 'domain/animation.jsx');

// 4. Service layer (depends on Data + Domain)
$.evalFile(_basePath + 'services/camera-service.jsx');
$.evalFile(_basePath + 'services/light-service.jsx');
$.evalFile(_basePath + 'services/layer-service.jsx');
$.evalFile(_basePath + 'services/effect-service.jsx');
$.evalFile(_basePath + 'services/import-service.jsx');
$.evalFile(_basePath + 'services/composition-service.jsx');
$.evalFile(_basePath + 'services/text-service.jsx');
$.evalFile(_basePath + 'services/shape-service.jsx');
$.evalFile(_basePath + 'services/keying-service.jsx');
$.evalFile(_basePath + 'services/time-service.jsx');
$.evalFile(_basePath + 'services/distortion-service.jsx');
$.evalFile(_basePath + 'services/noise-service.jsx');
$.evalFile(_basePath + 'services/generate-service.jsx');
$.evalFile(_basePath + 'services/property-service.jsx');
$.evalFile(_basePath + 'services/mask-service.jsx');
$.evalFile(_basePath + 'services/expression-service.jsx');
$.evalFile(_basePath + 'services/render-service.jsx');
$.evalFile(_basePath + 'services/workflow-service.jsx');
$.evalFile(_basePath + 'services/tracking-service.jsx');
$.evalFile(_basePath + 'services/mogrt-service.jsx');
$.evalFile(_basePath + 'services/precomp-service.jsx');
$.evalFile(_basePath + 'services/footage-service.jsx');
$.evalFile(_basePath + 'services/layer-utils-service.jsx');
$.evalFile(_basePath + 'services/marker-service.jsx');
$.evalFile(_basePath + 'services/color-service.jsx');
$.evalFile(_basePath + 'services/audio-service.jsx');
$.evalFile(_basePath + 'services/project-service.jsx');
$.evalFile(_basePath + 'services/workflow-templates.jsx');

// 5. Action Registry (must be last - depends on all services)
$.evalFile(_basePath + 'services/action-registry.jsx');

// ============================================
// MODULE LOADER STATUS
// ============================================

var ModuleLoader = {
    loaded: true,
    modules: [
        // Core
        'Utils',
        // Data
        'CompositionData',
        'LayerData', 
        'EffectData',
        'PropertyData',
        'ProjectData',
        // Domain
        'CameraDomain',
        'LightDomain',
        'MaterialDomain',
        'AnimationDomain',
        // Services
        'CameraService',
        'LightService',
        'LayerService',
        'EffectService',
        'ImportService',
        'CompositionService',
        'TextService',
        'ShapeService',
        'KeyingService',
        'TimeService',
        'DistortionService',
        'NoiseService',
        'GenerateService',
        'PropertyService',
        'MaskService',
        'ExpressionService',
        'RenderService',
        'WorkflowService',
        'TrackingService',
        'MogrtService',
        'PrecompService',
        'FootageService',
        'LayerUtilsService',
        'MarkerService',
        'ColorService',
        'AudioService',
        'ProjectService',
        'WorkflowTemplates',
        'ActionRegistry'
    ],
    
    /**
     * Verify all modules are loaded
     * @returns {Object} Status report
     */
    verify: function() {
        var missing = [];
        var loaded = [];
        
        for (var i = 0; i < this.modules.length; i++) {
            var moduleName = this.modules[i];
            try {
                if (eval('typeof ' + moduleName) !== 'undefined') {
                    loaded.push(moduleName);
                } else {
                    missing.push(moduleName);
                }
            } catch (e) {
                missing.push(moduleName);
            }
        }
        
        return {
            success: missing.length === 0,
            loaded: loaded,
            missing: missing
        };
    }
};

// ============================================
// UNIFIED runAction FUNCTION
// Routes to ActionRegistry or legacy handlers
// ============================================

/**
 * Run an action by name
 * @param {string} actionName - Action name
 * @param {string|Object} params - JSON string or object
 * @returns {string} JSON result
 */
function runActionModular(actionName, params) {
    var paramsObj = (typeof params === 'string') ? JSON.parse(params) : params;
    
    app.beginUndoGroup('AI Assistant: ' + actionName);
    try {
        var result;
        
        // Try modular action registry first
        if (ActionRegistry.exists(actionName)) {
            result = ActionRegistry.executeWithValidation(actionName, paramsObj);
        } else {
            // Fall back to legacy switch (for backward compatibility)
            result = { error: 'Action not found in registry: ' + actionName };
        }
        
        app.endUndoGroup();
        return JSON.stringify(result);
    } catch (e) {
        app.endUndoGroup();
        return JSON.stringify({ error: e.toString(), line: e.line });
    }
}

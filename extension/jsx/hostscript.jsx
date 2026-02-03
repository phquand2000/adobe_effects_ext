// ============================================
// AE AI ASSISTANT - HOSTSCRIPT WRAPPER
// Legacy entry point - loads modular system
// ============================================
// 
// This file is kept for backward compatibility.
// The actual implementation is in the modular system:
// - loader.jsx loads all modules in dependency order
// - services/*.jsx contain the action implementations
// - action-registry.jsx maps action names to handlers
//
// For new development, use loader.jsx directly.
// ============================================

// Get the directory where this script lives
var scriptFile = new File($.fileName);
var scriptFolder = scriptFile.parent;

// Load the modular system
var loaderPath = scriptFolder.fsName + '/loader.jsx';
var loaderFile = new File(loaderPath);

if (loaderFile.exists) {
    $.evalFile(loaderFile);
} else {
    // Fallback error if loader not found
    $.writeln('ERROR: loader.jsx not found at: ' + loaderPath);
}

// Legacy function alias for backward compatibility
// New code should use runActionModular directly
function runAction(actionName, params) {
    if (typeof runActionModular === 'function') {
        return runActionModular(actionName, params);
    }
    return JSON.stringify({ error: 'Modular system not loaded' });
}

// Legacy helper aliases (if any external scripts use these)
function getActiveComp() {
    var result = CompositionData.getActiveComp();
    if (result.error) throw new Error(result.error);
    return result.comp;
}

function safeGetActiveComp() {
    return CompositionData.getActiveComp();
}

function safeGetLayer(comp, params) {
    return LayerData.getLayer(comp, params);
}

function setProp(group, matchName, value) {
    return Utils.setProp(group, matchName, value);
}

function validateParams(params, schema) {
    return Utils.validateParams(params, schema);
}

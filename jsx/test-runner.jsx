// Test Runner for AE AI Assistant - New Features
// Run this directly in After Effects via File > Scripts > Run Script File

// First, load the main hostscript
var scriptPath = new File($.fileName).parent.fsName + '/hostscript.jsx';
$.evalFile(scriptPath);

// Test Results collector
var testResults = {
    passed: [],
    failed: [],
    skipped: []
};

function logTest(name, success, details) {
    if (success) {
        testResults.passed.push(name);
        $.writeln('✓ PASS: ' + name + (details ? ' - ' + details : ''));
    } else {
        testResults.failed.push(name + ': ' + details);
        $.writeln('✗ FAIL: ' + name + ' - ' + details);
    }
}

function skipTest(name, reason) {
    testResults.skipped.push(name + ': ' + reason);
    $.writeln('○ SKIP: ' + name + ' - ' + reason);
}

// ============================================
// PREREQUISITE: Create test composition
// ============================================

$.writeln('\n========================================');
$.writeln('AE AI Assistant - Feature Test Suite');
$.writeln('========================================\n');

// Create test comp
var testCompName = 'AI_Test_Comp_' + new Date().getTime();
var testComp = app.project.items.addComp(testCompName, 1920, 1080, 1, 5, 30);
testComp.openInViewer();

$.writeln('Created test comp: ' + testCompName + '\n');

// Add a solid layer to test effects on
var solidLayer = testComp.layers.addSolid([0.5, 0.5, 0.5], 'Test Solid', 1920, 1080, 1, 5);

// ============================================
// TEST 1: Function Existence Check
// ============================================

$.writeln('--- Test 1: Function Existence ---');

var functionsToCheck = [
    'setCameraIris',
    'animateFocusRack',
    'focusOnLayer',
    'setLightFalloff',
    'addNullController',
    'parentLayers',
    'unparentLayer',
    'applyExpression',
    'removeExpression',
    'applyExpressionPreset',
    'applyGlow',
    'applyBlur',
    'addToRenderQueue',
    'listRenderTemplates',
    'startRender',
    'applyLumetri',
    'applyCurves',
    'applyVibrance'
];

for (var i = 0; i < functionsToCheck.length; i++) {
    var fnName = functionsToCheck[i];
    try {
        var exists = eval('typeof ' + fnName + ' === "function"');
        logTest('Function exists: ' + fnName, exists, exists ? 'OK' : 'not found');
    } catch (e) {
        logTest('Function exists: ' + fnName, false, e.toString());
    }
}

// ============================================
// TEST 2: Add Camera with DOF
// ============================================

$.writeln('\n--- Test 2: Camera with DOF ---');

try {
    var cameraResult = JSON.parse(runAction('addCamera', JSON.stringify({
        name: 'Test Camera',
        focalLength: 50,
        enableDOF: true,
        focusDistance: 500,
        aperture: 2.8
    })));
    logTest('addCamera', cameraResult.success, cameraResult.camera || cameraResult.error);
} catch (e) {
    logTest('addCamera', false, e.toString());
}

// ============================================
// TEST 3: Set Camera Iris
// ============================================

$.writeln('\n--- Test 3: Camera Iris ---');

try {
    var irisResult = JSON.parse(runAction('setCameraIris', JSON.stringify({
        aperture: 4,
        irisShape: 8,
        irisRotation: 45,
        irisRoundness: 50
    })));
    logTest('setCameraIris', irisResult.success, irisResult.camera || irisResult.error);
} catch (e) {
    logTest('setCameraIris', false, e.toString());
}

// ============================================
// TEST 4: Animate Focus Rack
// ============================================

$.writeln('\n--- Test 4: Focus Rack Animation ---');

try {
    var focusResult = JSON.parse(runAction('animateFocusRack', JSON.stringify({
        startFocus: 200,
        endFocus: 800,
        startTime: 0,
        duration: 2,
        easing: 'easeInOut'
    })));
    logTest('animateFocusRack', focusResult.success, 'Keyframes: ' + (focusResult.keyframes || focusResult.error));
} catch (e) {
    logTest('animateFocusRack', false, e.toString());
}

// ============================================
// TEST 5: Add Light Rig
// ============================================

$.writeln('\n--- Test 5: Light Rig ---');

try {
    var lightResult = JSON.parse(runAction('addLightRig', JSON.stringify({
        includeRim: true,
        ambient: { intensity: 20 }
    })));
    logTest('addLightRig', lightResult.success, 'Lights: ' + (lightResult.lights ? lightResult.lights.join(', ') : lightResult.error));
} catch (e) {
    logTest('addLightRig', false, e.toString());
}

// ============================================
// TEST 6: Set Light Falloff
// ============================================

$.writeln('\n--- Test 6: Light Falloff ---');

try {
    var falloffResult = JSON.parse(runAction('setLightFalloff', JSON.stringify({
        lightName: 'Key Light',
        falloffType: 'inverseSquareClamped',
        falloffDistance: 1000
    })));
    logTest('setLightFalloff', falloffResult.success, falloffResult.light || falloffResult.error);
} catch (e) {
    logTest('setLightFalloff', false, e.toString());
}

// ============================================
// TEST 7: Add Null Controller
// ============================================

$.writeln('\n--- Test 7: Null Controller ---');

try {
    var nullResult = JSON.parse(runAction('addNullController', JSON.stringify({
        name: 'CoinController',
        addSliders: ['Scale', 'Rotation', 'Offset']
    })));
    logTest('addNullController', nullResult.success, nullResult.nullName || nullResult.error);
} catch (e) {
    logTest('addNullController', false, e.toString());
}

// ============================================
// TEST 8: Apply Expression
// ============================================

$.writeln('\n--- Test 8: Apply Expression ---');

try {
    var exprResult = JSON.parse(runAction('applyExpression', JSON.stringify({
        layerName: 'Test Solid',
        property: 'opacity',
        expression: 'wiggle(2, 10)'
    })));
    logTest('applyExpression', exprResult.success, exprResult.property || exprResult.error);
} catch (e) {
    logTest('applyExpression', false, e.toString());
}

// ============================================
// TEST 9: Apply Expression Preset
// ============================================

$.writeln('\n--- Test 9: Expression Preset ---');

try {
    var presetResult = JSON.parse(runAction('applyExpressionPreset', JSON.stringify({
        layerName: 'Test Solid',
        property: 'rotation',
        preset: 'wiggle',
        params: { freq: 3, amp: 15 }
    })));
    logTest('applyExpressionPreset', presetResult.success, presetResult.expression || presetResult.error);
} catch (e) {
    logTest('applyExpressionPreset', false, e.toString());
}

// ============================================
// TEST 10: Apply Glow
// ============================================

$.writeln('\n--- Test 10: Glow Effect ---');

try {
    var glowResult = JSON.parse(runAction('applyGlow', JSON.stringify({
        layerName: 'Test Solid',
        intensity: 1.5,
        radius: 50,
        threshold: 60
    })));
    logTest('applyGlow', glowResult.success, glowResult.effect || glowResult.error);
} catch (e) {
    logTest('applyGlow', false, e.toString());
}

// ============================================
// TEST 11: Apply Blur
// ============================================

$.writeln('\n--- Test 11: Blur Effect ---');

try {
    var blurResult = JSON.parse(runAction('applyBlur', JSON.stringify({
        layerName: 'Test Solid',
        type: 'gaussian',
        blurriness: 25
    })));
    logTest('applyBlur (Gaussian)', blurResult.success, blurResult.effect || blurResult.error);
} catch (e) {
    logTest('applyBlur (Gaussian)', false, e.toString());
}

// ============================================
// TEST 12: Apply Lumetri
// ============================================

$.writeln('\n--- Test 12: Lumetri Color ---');

try {
    var lumetriResult = JSON.parse(runAction('applyLumetri', JSON.stringify({
        layerName: 'Test Solid',
        temperature: 10,
        tint: 5,
        exposure: 0.3,
        contrast: 15,
        saturation: 110
    })));
    logTest('applyLumetri', lumetriResult.success, lumetriResult.effect || lumetriResult.error);
} catch (e) {
    logTest('applyLumetri', false, e.toString());
}

// ============================================
// TEST 13: Apply Vibrance
// ============================================

$.writeln('\n--- Test 13: Vibrance ---');

try {
    var vibranceResult = JSON.parse(runAction('applyVibrance', JSON.stringify({
        layerName: 'Test Solid',
        vibrance: 50,
        saturation: 10
    })));
    logTest('applyVibrance', vibranceResult.success, vibranceResult.effect || vibranceResult.error);
} catch (e) {
    logTest('applyVibrance', false, e.toString());
}

// ============================================
// TEST 14: List Render Templates
// ============================================

$.writeln('\n--- Test 14: Render Templates ---');

try {
    var templatesResult = JSON.parse(runAction('listRenderTemplates', '{}'));
    logTest('listRenderTemplates', templatesResult.success, 
        'Output: ' + (templatesResult.outputTemplates ? templatesResult.outputTemplates.length : 0) + 
        ', Render: ' + (templatesResult.renderTemplates ? templatesResult.renderTemplates.length : 0));
} catch (e) {
    logTest('listRenderTemplates', false, e.toString());
}

// ============================================
// TEST 15: Add to Render Queue
// ============================================

$.writeln('\n--- Test 15: Add to Render Queue ---');

try {
    var renderResult = JSON.parse(runAction('addToRenderQueue', JSON.stringify({
        outputPath: '~/Desktop/test_render.mov'
    })));
    logTest('addToRenderQueue', renderResult.success, renderResult.queueItem || renderResult.error);
} catch (e) {
    logTest('addToRenderQueue', false, e.toString());
}

// ============================================
// TEST 16: setProperty (with expression clearing)
// ============================================

$.writeln('\n--- Test 16: setProperty with Expression ---');

try {
    // First apply an expression to opacity
    var exprResult = JSON.parse(runAction('applyExpression', JSON.stringify({
        layerName: 'Test Solid',
        propertyPath: 'ADBE Transform Group/ADBE Opacity',
        expression: 'wiggle(1, 10)'
    })));
    $.writeln('  Applied expression first: ' + (exprResult.success ? 'OK' : exprResult.error));
    
    // Now try to set the property value (should clear expression and set value)
    var propResult = JSON.parse(runAction('setProperty', JSON.stringify({
        layerName: 'Test Solid',
        propertyPath: 'ADBE Transform Group/ADBE Opacity',
        value: 75
    })));
    logTest('setProperty (clear expr)', propResult.success, propResult.success ? 'Set to ' + propResult.value : propResult.error);
} catch (e) {
    logTest('setProperty (clear expr)', false, e.toString());
}

// ============================================
// TEST 17: addMask
// ============================================

$.writeln('\n--- Test 17: addMask ---');

try {
    var maskResult = JSON.parse(runAction('addMask', JSON.stringify({
        layerName: 'Test Solid',
        name: 'Test Mask',
        rect: [100, 100, 800, 600],
        feather: 20
    })));
    logTest('addMask', maskResult.success, maskResult.success ? maskResult.mask : maskResult.error);
} catch (e) {
    logTest('addMask', false, e.toString());
}

// ============================================
// TEST 18: addMask on Camera (expect fail) ---
$.writeln('\n--- Test 18: addMask on Camera (expect fail) ---');

try {
    var maskCamResult = JSON.parse(runAction('addMask', JSON.stringify({
        layerName: 'Test Camera',
        name: 'Invalid Mask'
    })));
    // This should fail with a proper error message
    logTest('addMask on Camera', !maskCamResult.success && maskCamResult.error.indexOf('do not support masks') >= 0, 
        maskCamResult.error || 'unexpectedly succeeded');
} catch (e) {
    logTest('addMask on Camera', false, e.toString());
}

// ============================================
// TEST 19: Add Shape Layer for Shape Operations
// ============================================

$.writeln('\n--- Test 19: Shape Layer for Path Ops ---');

var testShapeLayer = null;
try {
    var shapeResult = JSON.parse(runAction('addShapeLayer', JSON.stringify({
        name: 'Test Shape Layer',
        shapeType: 'rectangle',
        size: [200, 200],
        fillColor: [1, 0, 0],
        position: [960, 540]
    })));
    logTest('addShapeLayer', shapeResult.success, shapeResult.layer || shapeResult.error);
} catch (e) {
    logTest('addShapeLayer', false, e.toString());
}

// ============================================
// TEST 20: Trim Paths
// ============================================

$.writeln('\n--- Test 20: Trim Paths ---');

try {
    var trimResult = JSON.parse(runAction('addTrimPaths', JSON.stringify({
        layerName: 'Test Shape Layer',
        start: 0,
        end: 50,
        offset: 0
    })));
    logTest('addTrimPaths', trimResult.success, trimResult.effect || trimResult.error);
} catch (e) {
    logTest('addTrimPaths', false, e.toString());
}

// ============================================
// TEST 21: Repeater
// ============================================

$.writeln('\n--- Test 21: Repeater ---');

try {
    var repeaterResult = JSON.parse(runAction('addRepeater', JSON.stringify({
        layerName: 'Test Shape Layer',
        copies: 5,
        position: [50, 0],
        rotation: 15
    })));
    logTest('addRepeater', repeaterResult.success, 'Copies: ' + (repeaterResult.copies || repeaterResult.error));
} catch (e) {
    logTest('addRepeater', false, e.toString());
}

// ============================================
// TEST 22: Gradient Fill
// ============================================

$.writeln('\n--- Test 22: Gradient Fill ---');

// Create a fresh shape layer for gradient test
var gradShapeResult = JSON.parse(runAction('addShapeLayer', JSON.stringify({
    name: 'Gradient Test Shape',
    shapeType: 'ellipse',
    size: [300, 300],
    fill: false // No solid fill, we'll add gradient
})));

try {
    var gradFillResult = JSON.parse(runAction('addGradientFill', JSON.stringify({
        layerName: 'Gradient Test Shape',
        type: 'radial',
        startPoint: [0, 0],
        endPoint: [150, 150],
        opacity: 100
    })));
    logTest('addGradientFill', gradFillResult.success, gradFillResult.gradientType || gradFillResult.error);
} catch (e) {
    logTest('addGradientFill', false, e.toString());
}

// ============================================
// TEST 23: Bilateral Blur
// ============================================

$.writeln('\n--- Test 23: Bilateral Blur ---');

try {
    var bilateralResult = JSON.parse(runAction('applyBilateralBlur', JSON.stringify({
        layerName: 'Test Solid',
        radius: 5,
        threshold: 15
    })));
    logTest('applyBilateralBlur', bilateralResult.success, bilateralResult.effect || bilateralResult.error);
} catch (e) {
    logTest('applyBilateralBlur', false, e.toString());
}

// ============================================
// TEST 24: Vector Blur
// ============================================

$.writeln('\n--- Test 24: CC Vector Blur ---');

try {
    var vectorBlurResult = JSON.parse(runAction('applyVectorBlur', JSON.stringify({
        layerName: 'Test Solid',
        amount: 10,
        angle: 45
    })));
    logTest('applyVectorBlur', vectorBlurResult.success, vectorBlurResult.effect || vectorBlurResult.error);
} catch (e) {
    logTest('applyVectorBlur', false, e.toString());
}

// ============================================
// TEST 25: Keylight
// ============================================

$.writeln('\n--- Test 25: Keylight ---');

try {
    var keylightResult = JSON.parse(runAction('applyKeylight', JSON.stringify({
        layerName: 'Test Solid',
        screenColor: [0, 1, 0],
        clipBlack: 10,
        clipWhite: 90
    })));
    logTest('applyKeylight', keylightResult.success, keylightResult.effect || keylightResult.error);
} catch (e) {
    logTest('applyKeylight', false, e.toString());
}

// ============================================
// TEST 26: Spill Suppressor
// ============================================

$.writeln('\n--- Test 26: Spill Suppressor ---');

try {
    var spillResult = JSON.parse(runAction('applySpillSuppressor', JSON.stringify({
        layerName: 'Test Solid',
        keyColor: [0, 1, 0],
        suppression: 100
    })));
    logTest('applySpillSuppressor', spillResult.success, spillResult.effect || spillResult.error);
} catch (e) {
    logTest('applySpillSuppressor', false, e.toString());
}

// ============================================
// TEST 27: Key Cleaner
// ============================================

$.writeln('\n--- Test 27: Key Cleaner ---');

try {
    var keyCleanerResult = JSON.parse(runAction('applyKeyCleaner', JSON.stringify({
        layerName: 'Test Solid',
        radius: 10,
        reduceChatter: true
    })));
    logTest('applyKeyCleaner', keyCleanerResult.success, keyCleanerResult.effect || keyCleanerResult.error);
} catch (e) {
    logTest('applyKeyCleaner', false, e.toString());
}

// ============================================
// TEST 28: Keying Preset (Green Screen)
// ============================================

$.writeln('\n--- Test 28: Keying Preset ---');

// Create a new solid for keying preset test (to avoid effect stack issues)
var keyingSolid = testComp.layers.addSolid([0.5, 0.5, 0.5], 'Keying Test Solid', 1920, 1080, 1, 5);

try {
    var keyingPresetResult = JSON.parse(runAction('applyKeyingPreset', JSON.stringify({
        layerName: 'Keying Test Solid',
        preset: 'greenScreen'
    })));
    logTest('applyKeyingPreset', keyingPresetResult.success, 
        'Preset: ' + (keyingPresetResult.preset || keyingPresetResult.error) + 
        ', Effects: ' + (keyingPresetResult.effects ? keyingPresetResult.effects.length : 0));
} catch (e) {
    logTest('applyKeyingPreset', false, e.toString());
}

// ============================================
// TEST 29: Warp Stabilizer
// ============================================

$.writeln('\n--- Test 29: Warp Stabilizer ---');

try {
    var warpResult = JSON.parse(runAction('applyWarpStabilizer', JSON.stringify({
        layerName: 'Test Solid',
        smoothness: 50,
        method: 4, // Subspace Warp
        framing: 3  // Stabilize, Crop, Auto-scale
    })));
    logTest('applyWarpStabilizer', warpResult.success, warpResult.effect || warpResult.error);
} catch (e) {
    logTest('applyWarpStabilizer', false, e.toString());
}

// ============================================
// TEST 30: Corner Pin
// ============================================

$.writeln('\n--- Test 30: Corner Pin ---');

try {
    var cornerPinResult = JSON.parse(runAction('applyCornerPin', JSON.stringify({
        layerName: 'Test Solid',
        upperLeft: [100, 100],
        upperRight: [1820, 150],
        lowerLeft: [50, 980],
        lowerRight: [1870, 930]
    })));
    logTest('applyCornerPin', cornerPinResult.success, cornerPinResult.effect || cornerPinResult.error);
} catch (e) {
    logTest('applyCornerPin', false, e.toString());
}

// ============================================
// TEST 31: Fractal Noise
// ============================================

$.writeln('\n--- Test 31: Fractal Noise ---');

try {
    var fractalResult = JSON.parse(runAction('applyFractalNoise', JSON.stringify({
        layerName: 'Test Solid',
        contrast: 150,
        brightness: 0,
        complexity: 6,
        scale: 100
    })));
    logTest('applyFractalNoise', fractalResult.success, fractalResult.effect || fractalResult.error);
} catch (e) {
    logTest('applyFractalNoise', false, e.toString());
}

// ============================================
// TEST 32: Add Grain
// ============================================

$.writeln('\n--- Test 32: Add Grain ---');

try {
    var addGrainResult = JSON.parse(runAction('applyAddGrain', JSON.stringify({
        layerName: 'Test Solid',
        intensity: 0.5,
        size: 1,
        softness: 0.5
    })));
    logTest('applyAddGrain', addGrainResult.success, addGrainResult.effect || addGrainResult.error);
} catch (e) {
    logTest('applyAddGrain', false, e.toString());
}

// ============================================
// TEST 33: Timewarp
// ============================================

$.writeln('\n--- Test 33: Timewarp ---');

try {
    var timewarpResult = JSON.parse(runAction('applyTimewarp', JSON.stringify({
        layerName: 'Test Solid',
        method: 3, // Pixel Motion
        speed: 50
    })));
    logTest('applyTimewarp', timewarpResult.success, timewarpResult.effect || timewarpResult.error);
} catch (e) {
    logTest('applyTimewarp', false, e.toString());
}

// ============================================
// TEST 34: Pixel Motion Blur
// ============================================

$.writeln('\n--- Test 34: Pixel Motion Blur ---');

try {
    var pixelBlurResult = JSON.parse(runAction('applyPixelMotionBlur', JSON.stringify({
        layerName: 'Test Solid',
        shutterAngle: 180,
        shutterSamples: 16
    })));
    logTest('applyPixelMotionBlur', pixelBlurResult.success, pixelBlurResult.effect || pixelBlurResult.error);
} catch (e) {
    logTest('applyPixelMotionBlur', false, e.toString());
}

// ============================================
// TEST 35: Gradient Ramp
// ============================================

$.writeln('\n--- Test 35: Gradient Ramp ---');

try {
    var rampResult = JSON.parse(runAction('applyGradientRamp', JSON.stringify({
        layerName: 'Test Solid',
        startPoint: [960, 0],
        startColor: [0, 0, 0],
        endPoint: [960, 1080],
        endColor: [1, 1, 1],
        rampShape: 1 // Linear
    })));
    logTest('applyGradientRamp', rampResult.success, rampResult.effect || rampResult.error);
} catch (e) {
    logTest('applyGradientRamp', false, e.toString());
}

// ============================================
// TEST 36: Fill Effect
// ============================================

$.writeln('\n--- Test 36: Fill Effect ---');

try {
    var fillResult = JSON.parse(runAction('applyFill', JSON.stringify({
        layerName: 'Test Solid',
        color: [1, 0, 0],
        opacity: 50
    })));
    logTest('applyFill', fillResult.success, fillResult.effect || fillResult.error);
} catch (e) {
    logTest('applyFill', false, e.toString());
}

// ============================================
// TEST 37: Displacement Map
// ============================================

$.writeln('\n--- Test 37: Displacement Map ---');

try {
    var dispResult = JSON.parse(runAction('applyDisplacementMap', JSON.stringify({
        layerName: 'Test Solid',
        maxHorizontal: 50,
        maxVertical: 50
    })));
    logTest('applyDisplacementMap', dispResult.success, dispResult.effect || dispResult.error);
} catch (e) {
    logTest('applyDisplacementMap', false, e.toString());
}

// ============================================
// TEST 38: Mesh Warp
// ============================================

$.writeln('\n--- Test 38: Mesh Warp ---');

try {
    var meshResult = JSON.parse(runAction('applyMeshWarp', JSON.stringify({
        layerName: 'Test Solid',
        rows: 4,
        columns: 4,
        quality: 2
    })));
    logTest('applyMeshWarp', meshResult.success, meshResult.effect || meshResult.error);
} catch (e) {
    logTest('applyMeshWarp', false, e.toString());
}

// ============================================
// SUMMARY
// ============================================

$.writeln('\n========================================');
$.writeln('TEST SUMMARY');
$.writeln('========================================');
$.writeln('Passed: ' + testResults.passed.length);
$.writeln('Failed: ' + testResults.failed.length);
$.writeln('Skipped: ' + testResults.skipped.length);

if (testResults.failed.length > 0) {
    $.writeln('\nFailed Tests:');
    for (var i = 0; i < testResults.failed.length; i++) {
        $.writeln('  - ' + testResults.failed[i]);
    }
}

$.writeln('\n========================================');
$.writeln('Test completed at: ' + new Date().toString());
$.writeln('========================================');

// Write results to file for external access
var resultJson = JSON.stringify({
    passed: testResults.passed.length,
    failed: testResults.failed.length,
    skipped: testResults.skipped.length,
    passedTests: testResults.passed,
    failures: testResults.failed,
    skips: testResults.skipped,
    timestamp: new Date().toString()
}, null, 2);

var resultFile = new File('~/Desktop/ae_test_results.json');
resultFile.open('w');
resultFile.write(resultJson);
resultFile.close();
$.writeln('Results written to: ' + resultFile.fsName);

// Return summary as JSON for programmatic access
resultJson;

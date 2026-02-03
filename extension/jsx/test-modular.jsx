// ============================================
// TEST SUITE FOR MODULAR REFACTORING
// Tests loader.jsx, ActionRegistry, and new features
// Run in After Effects: File > Scripts > Run Script File
// ============================================

// Load the modular system
var scriptFile = new File($.fileName);
var scriptFolder = scriptFile.parent;
var loaderPath = scriptFolder.fsName + '/loader.jsx';
$.evalFile(loaderPath);

// Test results collector
var testResults = {
    passed: 0,
    failed: 0,
    tests: []
};

function test(name, condition, details) {
    var passed = !!condition;
    testResults.tests.push({
        name: name,
        passed: passed,
        details: details || ''
    });
    if (passed) {
        testResults.passed++;
        $.writeln('✓ PASS: ' + name);
    } else {
        testResults.failed++;
        $.writeln('✗ FAIL: ' + name + (details ? ' - ' + details : ''));
    }
    return passed;
}

function testGroup(name) {
    $.writeln('\n--- ' + name + ' ---');
}

// ============================================
// TEST 1: LOADER VERIFICATION
// ============================================

testGroup('1. Loader Verification');

test('runActionModular function exists',
    typeof runActionModular === 'function');

test('ModuleLoader object exists',
    typeof ModuleLoader === 'object');

test('ModuleLoader.loaded is true',
    ModuleLoader.loaded === true);

var verifyResult = ModuleLoader.verify();
test('All modules loaded (no missing)',
    verifyResult.success,
    verifyResult.missing.length > 0 ? 'Missing: ' + verifyResult.missing.join(', ') : 'OK');

// ============================================
// TEST 2: CORE MODULES
// ============================================

testGroup('2. Core Modules');

test('Utils module exists',
    typeof Utils === 'object');

test('Utils.success function exists',
    typeof Utils.success === 'function');

test('Utils.error function exists',
    typeof Utils.error === 'function');

test('Utils.setProp function exists',
    typeof Utils.setProp === 'function');

test('JSON.stringify works',
    JSON.stringify({a: 1}) === '{"a":1}');

test('JSON.parse works',
    JSON.parse('{"a":1}').a === 1);

// ============================================
// TEST 3: JSON SECURITY
// ============================================

testGroup('3. JSON Security');

// Test valid JSON
var validJsonTests = [
    '{"key": "value"}',
    '[1, 2, 3]',
    '{"nested": {"a": 1}}',
    '"string"',
    '123',
    'true',
    'false',
    'null',
    '{"arr": [1, "two", null]}',
    '{"escape": "line\\nbreak"}',
    '{"message": "call foo() here"}',  // String containing function-like text should be OK
    '{"code": "alert(1)"}',             // Dangerous code INSIDE string should be OK
    '{"expr": "app.project.close()"}',  // AE code INSIDE string should be OK
    '{"parens": "(test)"}',             // Parentheses in string should be OK
    '{"empty": ""}'
];

for (var i = 0; i < validJsonTests.length; i++) {
    try {
        var parsed = JSON.parse(validJsonTests[i]);
        test('Valid JSON accepted: ' + validJsonTests[i].substring(0, 30),
            true);
    } catch (e) {
        test('Valid JSON accepted: ' + validJsonTests[i].substring(0, 30),
            false, e.toString());
    }
}

// Test invalid/dangerous JSON
var dangerousInputs = [
    'alert("xss")',
    'app.project.close()',
    '(function(){alert(1)})()',
    'new Function("alert(1)")()',
    '{a: 1}',  // unquoted key - invalid JSON
    "{'a': 1}"  // single quotes - invalid JSON
];

for (var j = 0; j < dangerousInputs.length; j++) {
    try {
        JSON.parse(dangerousInputs[j]);
        test('Dangerous input rejected: ' + dangerousInputs[j].substring(0, 30),
            false, 'Should have thrown error');
    } catch (e) {
        test('Dangerous input rejected: ' + dangerousInputs[j].substring(0, 30),
            true);
    }
}

// ============================================
// TEST 4: DATA LAYER
// ============================================

testGroup('4. Data Layer');

test('CompositionData module exists',
    typeof CompositionData === 'object');

test('LayerData module exists',
    typeof LayerData === 'object');

test('EffectData module exists',
    typeof EffectData === 'object');

test('PropertyData module exists',
    typeof PropertyData === 'object');

test('ProjectData module exists',
    typeof ProjectData === 'object');

test('ProjectData.findItemByName exists',
    typeof ProjectData.findItemByName === 'function');

test('ProjectData.findFootageItem exists',
    typeof ProjectData.findFootageItem === 'function');

// ============================================
// TEST 5: ACTION REGISTRY
// ============================================

testGroup('5. Action Registry');

test('ActionRegistry module exists',
    typeof ActionRegistry === 'object');

test('ActionRegistry.register exists',
    typeof ActionRegistry.register === 'function');

test('ActionRegistry.execute exists',
    typeof ActionRegistry.execute === 'function');

test('ActionRegistry.exists exists',
    typeof ActionRegistry.exists === 'function');

test('ActionRegistry.list exists',
    typeof ActionRegistry.list === 'function');

var actionCount = ActionRegistry.list().length;
test('ActionRegistry has 152 actions registered',
    actionCount === 152,
    'Found: ' + actionCount);

// Verify key actions exist
var keyActions = [
    'addCamera', 'applyGlow', 'addTextLayer', 'createComp',
    'testScript', 'replaceFootage', 'findMissingFootage'
];
for (var k = 0; k < keyActions.length; k++) {
    test('Action exists: ' + keyActions[k],
        ActionRegistry.exists(keyActions[k]));
}

// ============================================
// TEST 6: testScript ACTION
// ============================================

testGroup('6. testScript Action');

var testScriptResult = JSON.parse(runActionModular('testScript', '{}'));
test('testScript returns success',
    testScriptResult.success === true);

test('testScript returns message',
    testScriptResult.message === 'Modular script is working');

test('testScript returns registeredActions count',
    testScriptResult.registeredActions === 152,
    'Got: ' + testScriptResult.registeredActions);

// ============================================
// TEST 7: SERVICE MODULES
// ============================================

testGroup('7. Service Modules');

var services = [
    'CameraService', 'LightService', 'LayerService', 'EffectService',
    'ImportService', 'CompositionService', 'TextService', 'ShapeService',
    'KeyingService', 'TimeService', 'DistortionService', 'NoiseService',
    'GenerateService', 'PropertyService', 'MaskService', 'ExpressionService',
    'RenderService', 'WorkflowService', 'TrackingService', 'MogrtService',
    'PrecompService', 'FootageService', 'LayerUtilsService', 'MarkerService',
    'ColorService', 'AudioService', 'ProjectService'
];

for (var s = 0; s < services.length; s++) {
    try {
        var exists = eval('typeof ' + services[s] + ' === "object"');
        test('Service exists: ' + services[s], exists);
    } catch (e) {
        test('Service exists: ' + services[s], false, e.toString());
    }
}

// ============================================
// TEST 8: FOOTAGE SERVICE WITH PROJECT DATA
// ============================================

testGroup('8. FootageService + ProjectData Integration');

// Test that FootageService uses ProjectData internally
test('FootageService.replaceFootage exists',
    typeof FootageService.replaceFootage === 'function');

test('FootageService.findMissingFootage exists',
    typeof FootageService.findMissingFootage === 'function');

// Test findMissingFootage returns correct structure
var missingResult = FootageService.findMissingFootage({});
test('findMissingFootage returns success structure',
    missingResult.success === true || missingResult.success === false);

test('findMissingFootage returns missing array',
    missingResult.missing instanceof Array || missingResult.error !== undefined);

// ============================================
// TEST 9: ERROR HANDLING IN EFFECTS
// ============================================

testGroup('9. Effect Service Null Guards');

// Test that effect services properly handle missing comps
var effectResult = EffectService.applyGlow({layerName: 'NonExistent'});
test('applyGlow returns error for missing layer',
    effectResult.success === false);

// Test applyBlur
var blurResult = EffectService.applyBlur({layerName: 'NonExistent'});
test('applyBlur returns error for missing layer',
    blurResult.success === false);

// ============================================
// TEST 10: DOMAIN MODULES
// ============================================

testGroup('10. Domain Modules');

var domains = ['CameraDomain', 'LightDomain', 'MaterialDomain', 'AnimationDomain'];
for (var d = 0; d < domains.length; d++) {
    try {
        var domainExists = eval('typeof ' + domains[d] + ' === "object"');
        test('Domain exists: ' + domains[d], domainExists);
    } catch (e) {
        test('Domain exists: ' + domains[d], false, e.toString());
    }
}

// ============================================
// TEST 11: LEGACY COMPATIBILITY
// ============================================

testGroup('11. Legacy Compatibility');

// Test that legacy functions still work (from hostscript.jsx wrapper)
// These should be available if hostscript.jsx is loaded

// Load hostscript.jsx
var hostscriptPath = scriptFolder.fsName + '/hostscript.jsx';
$.evalFile(hostscriptPath);

test('Legacy runAction function exists',
    typeof runAction === 'function');

test('Legacy getActiveComp function exists',
    typeof getActiveComp === 'function');

test('Legacy safeGetActiveComp function exists',
    typeof safeGetActiveComp === 'function');

test('Legacy setProp function exists',
    typeof setProp === 'function');

// ============================================
// SUMMARY
// ============================================

$.writeln('\n========================================');
$.writeln('TEST SUMMARY');
$.writeln('========================================');
$.writeln('Total: ' + (testResults.passed + testResults.failed));
$.writeln('Passed: ' + testResults.passed);
$.writeln('Failed: ' + testResults.failed);
$.writeln('Success Rate: ' + Math.round(testResults.passed / (testResults.passed + testResults.failed) * 100) + '%');

if (testResults.failed > 0) {
    $.writeln('\nFailed Tests:');
    for (var f = 0; f < testResults.tests.length; f++) {
        if (!testResults.tests[f].passed) {
            $.writeln('  - ' + testResults.tests[f].name + 
                (testResults.tests[f].details ? ': ' + testResults.tests[f].details : ''));
        }
    }
}

$.writeln('\n========================================');
$.writeln('Test completed at: ' + new Date().toString());
$.writeln('========================================');

// Write results to file
var resultFile = new File('~/Desktop/ae_modular_test_results.json');
resultFile.open('w');
resultFile.write(JSON.stringify({
    passed: testResults.passed,
    failed: testResults.failed,
    successRate: Math.round(testResults.passed / (testResults.passed + testResults.failed) * 100),
    tests: testResults.tests,
    timestamp: new Date().toString()
}, null, 2));
resultFile.close();
$.writeln('Results written to: ' + resultFile.fsName);

// Return summary for programmatic access
JSON.stringify({
    passed: testResults.passed,
    failed: testResults.failed,
    successRate: Math.round(testResults.passed / (testResults.passed + testResults.failed) * 100)
});

#!/usr/bin/env node
/**
 * Automated Test Suite for AE AI Assistant Refactoring
 * Run with: node test-automated.js
 */

const fs = require('fs');
const path = require('path');

// Test results
let passed = 0;
let failed = 0;
const failures = [];

function test(name, condition, details = '') {
    if (condition) {
        passed++;
        console.log(`✓ ${name}`);
    } else {
        failed++;
        failures.push({ name, details });
        console.log(`✗ ${name}${details ? ' - ' + details : ''}`);
    }
}

function testGroup(name) {
    console.log(`\n--- ${name} ---`);
}

// Helper to read file
function readFile(relativePath) {
    return fs.readFileSync(path.join(__dirname, relativePath), 'utf8');
}

// Helper to check if file exists
function fileExists(relativePath) {
    return fs.existsSync(path.join(__dirname, relativePath));
}

console.log('========================================');
console.log('AE AI Assistant - Automated Test Suite');
console.log('========================================');

// ============================================
// TEST 1: FILE STRUCTURE
// ============================================

testGroup('1. File Structure');

const requiredFiles = [
    'jsx/loader.jsx',
    'jsx/hostscript.jsx',
    'jsx/core/polyfills.jsx',
    'jsx/core/utils.jsx',
    'jsx/data/composition-data.jsx',
    'jsx/data/layer-data.jsx',
    'jsx/data/effect-data.jsx',
    'jsx/data/property-data.jsx',
    'jsx/data/project-data.jsx',
    'jsx/services/action-registry.jsx',
    'jsx/services/effect-service.jsx',
    'jsx/services/footage-service.jsx',
    'jsx/services/camera-service.jsx',
    'jsx/services/light-service.jsx',
    'js/main.js'
];

requiredFiles.forEach(file => {
    test(`File exists: ${file}`, fileExists(file));
});

// ============================================
// TEST 2: LOADER.JSX CONFIGURATION
// ============================================

testGroup('2. Loader Configuration');

const loaderContent = readFile('jsx/loader.jsx');

test('loader.jsx defines runActionModular function',
    loaderContent.includes('function runActionModular('));

test('loader.jsx defines ModuleLoader object',
    loaderContent.includes('var ModuleLoader ='));

test('loader.jsx loads polyfills first',
    loaderContent.indexOf("'core/polyfills.jsx'") < 
    loaderContent.indexOf("'core/utils.jsx'"));

test('loader.jsx loads action-registry last',
    loaderContent.indexOf("'services/action-registry.jsx'") >
    loaderContent.indexOf("'services/effect-service.jsx'"));

test('loader.jsx loads project-data.jsx',
    loaderContent.includes("'data/project-data.jsx'"));

test('loader.jsx uses top-level $.evalFile (not loadModule function)',
    loaderContent.includes("$.evalFile(_basePath +"));

// ============================================
// TEST 3: MAIN.JS CONFIGURATION
// ============================================

testGroup('3. Main.js Configuration');

const mainJsContent = readFile('js/main.js');

test('main.js loads loader.jsx (not hostscript.jsx)',
    mainJsContent.includes("/jsx/loader.jsx'") || 
    mainJsContent.includes('/jsx/loader.jsx"'));

test('main.js calls runActionModular',
    mainJsContent.includes('runActionModular'));

test('main.js has ALLOWED_ACTIONS Set',
    mainJsContent.includes('const ALLOWED_ACTIONS = new Set'));

test('main.js includes testScript action',
    mainJsContent.includes("'testScript'"));

// Count actions in ALLOWED_ACTIONS
const allowedActionsMatch = mainJsContent.match(/ALLOWED_ACTIONS = new Set\(\[([\s\S]*?)\]\)/);
if (allowedActionsMatch) {
    const actionsStr = allowedActionsMatch[1];
    const actionCount = (actionsStr.match(/'[a-zA-Z0-9]+'/g) || []).length;
    test('ALLOWED_ACTIONS has 158 actions', actionCount === 158, `Found: ${actionCount}`);
} else {
    test('ALLOWED_ACTIONS has 158 actions', false, 'Could not parse');
}

// ============================================
// TEST 4: ACTION REGISTRY
// ============================================

testGroup('4. Action Registry');

const registryContent = readFile('jsx/services/action-registry.jsx');

test('ActionRegistry is IIFE module',
    registryContent.includes('var ActionRegistry = (function()'));

test('ActionRegistry has register function',
    registryContent.includes('function register('));

test('ActionRegistry has execute function',
    registryContent.includes('function execute('));

test('ActionRegistry has exists function',
    registryContent.includes('function exists('));

test('ActionRegistry has list function',
    registryContent.includes('function list('));

test('testScript action is registered',
    registryContent.includes("ActionRegistry.register('testScript'"));

// Count registered actions
const registerCalls = (registryContent.match(/ActionRegistry\.register\(/g) || []).length;
test('ActionRegistry has 158 registered actions', registerCalls === 158, `Found: ${registerCalls}`);

// ============================================
// TEST 5: JSON.PARSE SECURITY
// ============================================

testGroup('5. JSON.parse Security');

const polyfillsContent = readFile('jsx/core/polyfills.jsx');

test('JSON polyfill exists',
    polyfillsContent.includes("if (typeof JSON === 'undefined')"));

test('JSON.parse has string type check',
    polyfillsContent.includes("typeof str !== 'string'"));

test('JSON.parse strips string content for validation',
    polyfillsContent.includes('safeStr = str.replace'));

test('JSON.parse checks for function calls in safeStr (not str)',
    polyfillsContent.includes('.test(safeStr)') &&
    !polyfillsContent.includes('.test(str)'));

test('JSON.parse has structure validation regex',
    polyfillsContent.includes('/^[\\[\\]\\{\\}\\,\\:\\s]*$/'));

// Simulate JSON.parse validation logic
function simulateJsonParse(str) {
    str = str.replace(/^\s+|\s+$/g, '');
    var safeStr = str.replace(/"(?:[^"\\]|\\.)*"/g, '""');
    var structureOnly = safeStr.replace(/""/g, '').replace(/-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/g, '').replace(/true|false|null/g, '');
    
    if (!/^[\[\]\{\}\,\:\s]*$/.test(structureOnly)) {
        throw new Error('invalid JSON - contains unsafe tokens');
    }
    if (/[a-zA-Z_$][a-zA-Z0-9_$]*\s*\(/.test(safeStr)) {
        throw new Error('invalid JSON - function call detected');
    }
    return JSON.parse(str);
}

// Test valid JSON
const validJsonTests = [
    '{"key": "value"}',
    '[1, 2, 3]',
    '{"nested": {"a": 1}}',
    '"string"',
    '123',
    'true',
    'false',
    'null',
    '{"message": "call foo() here"}',  // Function-like text in string should be OK
    '{"code": "alert(1)"}',             // Dangerous code in string should be OK
    '{"expr": "app.project.close()"}',  // AE code in string should be OK
];

validJsonTests.forEach(json => {
    try {
        simulateJsonParse(json);
        test(`Valid JSON accepted: ${json.substring(0, 35)}...`, true);
    } catch (e) {
        test(`Valid JSON accepted: ${json.substring(0, 35)}...`, false, e.message);
    }
});

// Test dangerous inputs
const dangerousInputs = [
    ['alert("xss")', 'function call'],
    ['app.project.close()', 'function call'],
    ['(function(){alert(1)})()', 'function call'],
    ['{a: 1}', 'unquoted key'],
];

dangerousInputs.forEach(([json, reason]) => {
    try {
        simulateJsonParse(json);
        test(`Dangerous input rejected (${reason}): ${json}`, false, 'Should have thrown');
    } catch (e) {
        test(`Dangerous input rejected (${reason}): ${json}`, true);
    }
});

// ============================================
// TEST 6: PROJECT DATA MODULE
// ============================================

testGroup('6. ProjectData Module');

const projectDataContent = readFile('jsx/data/project-data.jsx');

test('ProjectData is IIFE module',
    projectDataContent.includes('var ProjectData = (function()'));

test('ProjectData has findItemByName',
    projectDataContent.includes('function findItemByName('));

test('ProjectData has findItemById',
    projectDataContent.includes('function findItemById('));

test('ProjectData has findFootageItem',
    projectDataContent.includes('function findFootageItem('));

test('ProjectData has findComp',
    projectDataContent.includes('function findComp('));

// ============================================
// TEST 7: FOOTAGE SERVICE USES PROJECT DATA
// ============================================

testGroup('7. FootageService Integration');

const footageServiceContent = readFile('jsx/services/footage-service.jsx');

test('FootageService uses ProjectData.findFootageItem',
    footageServiceContent.includes('ProjectData.findFootageItem('));

test('FootageService does not have local findFootageItem helper',
    !footageServiceContent.includes('function findFootageItem('));

// ============================================
// TEST 8: EFFECT SERVICE NULL GUARDS
// ============================================

testGroup('8. Effect Service Null Guards');

const effectServiceContent = readFile('jsx/services/effect-service.jsx');

test('applyGlow has null guard',
    effectServiceContent.includes("return Utils.error('Failed to add Glow effect')"));

test('applyBlur checks for null blur',
    effectServiceContent.includes("return Utils.error('Failed to add ' + blurType + ' blur effect')"));

test('applyLumetri has null guard',
    effectServiceContent.includes("return Utils.error('Failed to add Lumetri Color effect')"));

// ============================================
// TEST 9: TIME SERVICE NULL GUARDS
// ============================================

testGroup('9. Time Service Null Guards');

const timeServiceContent = readFile('jsx/services/time-service.jsx');

test('applyTimewarp has null guard',
    timeServiceContent.includes("return Utils.error('Failed to add Timewarp effect')"));

test('applyPixelMotionBlur has null guard',
    timeServiceContent.includes("return Utils.error('Failed to add Pixel Motion Blur effect')"));

test('applyPosterizeTime has null guard',
    timeServiceContent.includes("return Utils.error('Failed to add Posterize Time effect')"));

// ============================================
// TEST 10: KEYING SERVICE NULL GUARDS
// ============================================

testGroup('10. Keying Service Null Guards');

const keyingServiceContent = readFile('jsx/services/keying-service.jsx');

test('applyKeylight has try-catch',
    keyingServiceContent.includes("return Utils.error('Failed to add Keylight effect'"));

test('applySpillSuppressor has try-catch',
    keyingServiceContent.includes("return Utils.error('Failed to add Spill Suppressor effect'"));

test('applyKeyCleaner has try-catch',
    keyingServiceContent.includes("return Utils.error('Failed to add Key Cleaner effect'"));

test('applyKeyingPreset has null guards for each effect',
    (keyingServiceContent.match(/if \(!keylight\)/g) || []).length >= 1 &&
    (keyingServiceContent.match(/if \(!spill\)/g) || []).length >= 1 &&
    (keyingServiceContent.match(/if \(!cleaner\)/g) || []).length >= 1);

// ============================================
// TEST 11: HOSTSCRIPT.JSX LEGACY WRAPPER
// ============================================

testGroup('11. Hostscript Legacy Wrapper');

const hostscriptContent = readFile('jsx/hostscript.jsx');

test('hostscript.jsx is thin wrapper (< 100 lines)',
    hostscriptContent.split('\n').length < 100,
    `Found: ${hostscriptContent.split('\n').length} lines`);

test('hostscript.jsx loads loader.jsx',
    hostscriptContent.includes('loader.jsx'));

test('hostscript.jsx has legacy runAction alias',
    hostscriptContent.includes('function runAction('));

test('runAction calls runActionModular',
    hostscriptContent.includes('runActionModular(actionName'));

// ============================================
// TEST 12: ES3 SYNTAX COMPLIANCE
// ============================================

testGroup('12. ES3 Syntax Compliance (JSX files)');

const jsxFiles = [
    'jsx/loader.jsx',
    'jsx/core/polyfills.jsx',
    'jsx/core/utils.jsx',
    'jsx/data/project-data.jsx',
    'jsx/services/action-registry.jsx',
    'jsx/services/effect-service.jsx',
    'jsx/services/footage-service.jsx',
];

jsxFiles.forEach(file => {
    const content = readFile(file);
    const hasConst = /\bconst\s+\w/.test(content);
    const hasLet = /\blet\s+\w/.test(content);
    const hasArrow = /=>\s*[{(]/.test(content);
    const hasTemplate = /`[^`]*`/.test(content);
    const hasClass = /\bclass\s+\w/.test(content);
    
    const es3Compliant = !hasConst && !hasLet && !hasArrow && !hasTemplate && !hasClass;
    test(`ES3 compliant: ${file}`, es3Compliant,
        [hasConst && 'const', hasLet && 'let', hasArrow && 'arrow', 
         hasTemplate && 'template', hasClass && 'class'].filter(Boolean).join(', '));
});

// ============================================
// SUMMARY
// ============================================

console.log('\n========================================');
console.log('TEST SUMMARY');
console.log('========================================');
console.log(`Total:  ${passed + failed}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Success Rate: ${Math.round(passed / (passed + failed) * 100)}%`);

if (failures.length > 0) {
    console.log('\nFailed Tests:');
    failures.forEach(f => {
        console.log(`  - ${f.name}${f.details ? ': ' + f.details : ''}`);
    });
}

console.log('\n========================================');
process.exit(failed > 0 ? 1 : 0);

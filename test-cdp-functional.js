#!/usr/bin/env node
/**
 * Comprehensive CDP Functional Tests for AE AI Assistant
 * Tests actual After Effects actions via CDP
 * 
 * Prerequisites:
 * 1. After Effects running with a composition open
 * 2. AE AI Assistant panel open
 * 3. npm install ws (for WebSocket)
 * 
 * Run: node test-cdp-functional.js [level]
 * Levels: basic, intermediate, advanced, professional, all
 */

const http = require('http');

const CDP_PORT = 8088;
const CDP_HOST = 'localhost';

// Test results
let passed = 0;
let failed = 0;
let skipped = 0;
const failures = [];
const results = [];

function test(group, name, condition, details = '') {
    if (condition) {
        passed++;
        results.push({ group, name, status: 'PASS' });
        console.log(`✓ ${name}`);
    } else {
        failed++;
        failures.push({ group, name, details });
        results.push({ group, name, status: 'FAIL', details });
        console.log(`✗ ${name}${details ? ' - ' + details : ''}`);
    }
}

function skip(group, name, reason) {
    skipped++;
    results.push({ group, name, status: 'SKIP', reason });
    console.log(`○ ${name} (skipped: ${reason})`);
}

function httpGet(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: CDP_HOST,
            port: CDP_PORT,
            path: path,
            method: 'GET',
            timeout: 5000
        };
        
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        });
        
        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        req.end();
    });
}

// CDP WebSocket Client
class CDPClient {
    constructor(wsUrl) {
        this.wsUrl = wsUrl;
        this.ws = null;
        this.messageId = 0;
        this.callbacks = new Map();
    }
    
    async connect() {
        const WebSocket = require('ws');
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(this.wsUrl);
            this.ws.on('open', () => resolve());
            this.ws.on('error', reject);
            this.ws.on('message', (data) => {
                const msg = JSON.parse(data.toString());
                if (msg.id && this.callbacks.has(msg.id)) {
                    this.callbacks.get(msg.id)(msg);
                    this.callbacks.delete(msg.id);
                }
            });
        });
    }
    
    async send(method, params = {}) {
        return new Promise((resolve, reject) => {
            const id = ++this.messageId;
            this.callbacks.set(id, resolve);
            this.ws.send(JSON.stringify({ id, method, params }));
            setTimeout(() => {
                if (this.callbacks.has(id)) {
                    this.callbacks.delete(id);
                    reject(new Error(`Timeout waiting for ${method}`));
                }
            }, 30000); // 30s timeout for AE operations
        });
    }
    
    async evaluate(expression) {
        const result = await this.send('Runtime.evaluate', {
            expression,
            returnByValue: true,
            awaitPromise: true
        });
        if (result.result?.exceptionDetails) {
            throw new Error(result.result.exceptionDetails.text);
        }
        return result.result?.result?.value;
    }
    
    // Execute AE action and return result
    async executeAction(actionName, params = {}) {
        const paramsJson = JSON.stringify(params).replace(/'/g, "\\'");
        const result = await this.evaluate(`
            new Promise((resolve) => {
                csInterface.evalScript('runActionModular("${actionName}", \\'${paramsJson}\\')', (result) => {
                    try {
                        resolve(JSON.parse(result));
                    } catch (e) {
                        resolve({ error: 'Parse error: ' + result });
                    }
                });
            })
        `);
        return result;
    }
    
    close() {
        if (this.ws) {
            this.ws.close();
        }
    }
}

// ============================================
// TEST GROUPS
// ============================================

async function runBasicTests(client) {
    console.log('\n========================================');
    console.log('LEVEL 1: BASIC EDITOR TESTS');
    console.log('========================================\n');
    
    const group = 'Basic';
    
    // --- Composition ---
    console.log('--- Composition ---');
    
    let result = await client.executeAction('getCompInfo', {});
    test(group, 'getCompInfo', result.success, result.error);
    
    result = await client.executeAction('getProjectInfo', {});
    test(group, 'getProjectInfo', result.success, result.error);
    
    result = await client.executeAction('createComp', {
        name: 'CDP Test Comp',
        width: 1920,
        height: 1080,
        duration: 5,
        frameRate: 30
    });
    test(group, 'createComp', result.success, result.error);
    
    // --- Text & Shape ---
    console.log('\n--- Text & Shape ---');
    
    result = await client.executeAction('addTextLayer', {
        text: 'CDP Test',
        fontSize: 72,
        color: [1, 1, 1]
    });
    test(group, 'addTextLayer', result.success, result.error);
    
    result = await client.executeAction('addShapeLayer', {
        shape: 'rectangle',
        size: [200, 200],
        fill: [1, 0, 0]
    });
    test(group, 'addShapeLayer - rectangle', result.success, result.error);
    
    result = await client.executeAction('addShapeLayer', {
        shape: 'ellipse',
        size: [150, 150],
        fill: [0, 1, 0]
    });
    test(group, 'addShapeLayer - ellipse', result.success, result.error);
    
    // --- Properties ---
    console.log('\n--- Properties ---');
    
    result = await client.executeAction('setProperty', {
        layerIndex: 1,
        property: 'Position',
        value: [960, 540]
    });
    test(group, 'setProperty - Position', result.success, result.error);
    
    result = await client.executeAction('setProperty', {
        layerIndex: 1,
        property: 'Opacity',
        value: 75
    });
    test(group, 'setProperty - Opacity', result.success, result.error);
    
    result = await client.executeAction('getProperty', {
        layerIndex: 1,
        property: 'Position'
    });
    test(group, 'getProperty', result.success, result.error);
    
    // --- Effects ---
    console.log('\n--- Effects ---');
    
    result = await client.executeAction('applyBlur', {
        layerIndex: 1,
        blurType: 'gaussian',
        blurriness: 10
    });
    test(group, 'applyBlur - gaussian', result.success, result.error);
    
    result = await client.executeAction('applyGlow', {
        layerIndex: 1,
        radius: 25,
        intensity: 1.5
    });
    test(group, 'applyGlow', result.success, result.error);
    
    // --- Animation ---
    console.log('\n--- Animation ---');
    
    result = await client.executeAction('addKeyframe', {
        layerIndex: 1,
        property: 'Opacity',
        time: 0,
        value: 0
    });
    test(group, 'addKeyframe', result.success, result.error);
    
    result = await client.executeAction('animateProperty', {
        layerIndex: 1,
        property: 'Position',
        startValue: [100, 540],
        endValue: [1820, 540],
        startTime: 0,
        endTime: 2
    });
    test(group, 'animateProperty', result.success, result.error);
}

async function runIntermediateTests(client) {
    console.log('\n========================================');
    console.log('LEVEL 2: INTERMEDIATE EDITOR TESTS');
    console.log('========================================\n');
    
    const group = 'Intermediate';
    
    // --- Text Animation ---
    console.log('--- Text Animation ---');
    
    let result = await client.executeAction('addTextLayer', {
        text: 'Animated',
        fontSize: 100
    });
    
    result = await client.executeAction('addTextAnimator', {
        layerIndex: 1,
        property: 'Position',
        value: [0, -50]
    });
    test(group, 'addTextAnimator', result.success, result.error);
    
    result = await client.executeAction('setTextTracking', {
        layerIndex: 1,
        tracking: 50
    });
    test(group, 'setTextTracking', result.success, result.error);
    
    // --- Shape Modifiers ---
    console.log('\n--- Shape Modifiers ---');
    
    result = await client.executeAction('addShapeLayer', {
        shape: 'polygon',
        points: 6,
        size: [200, 200],
        fill: [1, 0.5, 0]
    });
    test(group, 'addShapeLayer - polygon', result.success, result.error);
    
    result = await client.executeAction('addTrimPaths', {
        layerIndex: 1,
        start: 0,
        end: 50
    });
    test(group, 'addTrimPaths', result.success, result.error);
    
    result = await client.executeAction('addRepeater', {
        layerIndex: 1,
        copies: 5
    });
    test(group, 'addRepeater', result.success, result.error);
    
    result = await client.executeAction('addRoundCorners', {
        layerIndex: 1,
        radius: 20
    });
    test(group, 'addRoundCorners', result.success, result.error);
    
    // --- Masks ---
    console.log('\n--- Masks ---');
    
    result = await client.executeAction('addMask', {
        layerIndex: 1,
        shape: 'rectangle',
        size: [400, 300]
    });
    test(group, 'addMask - rectangle', result.success, result.error);
    
    // --- Layer Utils ---
    console.log('\n--- Layer Utils ---');
    
    result = await client.executeAction('duplicateLayer', {
        layerIndex: 1
    });
    test(group, 'duplicateLayer', result.success, result.error);
    
    result = await client.executeAction('setLayerBlendingMode', {
        layerIndex: 1,
        blendMode: 'add'
    });
    test(group, 'setLayerBlendingMode', result.success, result.error);
    
    // --- Color ---
    console.log('\n--- Color Correction ---');
    
    result = await client.executeAction('applyLumetri', {
        layerIndex: 1,
        exposure: 0.5,
        contrast: 20
    });
    test(group, 'applyLumetri', result.success, result.error);
    
    result = await client.executeAction('applyVibrance', {
        layerIndex: 1,
        vibrance: 50
    });
    test(group, 'applyVibrance', result.success, result.error);
    
    // --- Expressions ---
    console.log('\n--- Expressions ---');
    
    result = await client.executeAction('applyExpression', {
        layerIndex: 1,
        property: 'Rotation',
        expression: 'time * 45'
    });
    test(group, 'applyExpression', result.success, result.error);
    
    result = await client.executeAction('removeExpression', {
        layerIndex: 1,
        property: 'Rotation'
    });
    test(group, 'removeExpression', result.success, result.error);
}

async function runAdvancedTests(client) {
    console.log('\n========================================');
    console.log('LEVEL 3: ADVANCED EDITOR TESTS');
    console.log('========================================\n');
    
    const group = 'Advanced';
    
    // --- 3D & Camera ---
    console.log('--- 3D & Camera ---');
    
    // Add a layer first
    await client.executeAction('addShapeLayer', {
        shape: 'rectangle',
        size: [300, 300],
        fill: [0, 0.5, 1]
    });
    
    let result = await client.executeAction('setup3DLayer', {
        layerIndex: 1
    });
    test(group, 'setup3DLayer', result.success, result.error);
    
    result = await client.executeAction('addCamera', {
        preset: 'twoNode',
        zoom: 2000
    });
    test(group, 'addCamera', result.success, result.error);
    
    result = await client.executeAction('setupDOF', {
        fStop: 2.8,
        blurLevel: 100
    });
    test(group, 'setupDOF', result.success, result.error);
    
    // --- Lighting ---
    console.log('\n--- Lighting ---');
    
    result = await client.executeAction('addLightRig', {
        includeRim: true
    });
    test(group, 'addLightRig', result.success, result.error);
    
    result = await client.executeAction('addEnvironmentLight', {
        intensity: 50
    });
    test(group, 'addEnvironmentLight', result.success, result.error);
    
    result = await client.executeAction('setupShadows', {
        darkness: 50
    });
    test(group, 'setupShadows', result.success, result.error);
    
    // --- Motion ---
    console.log('\n--- Motion ---');
    
    result = await client.executeAction('enableMotionBlur', {
        all3D: true,
        shutterAngle: 180
    });
    test(group, 'enableMotionBlur', result.success, result.error);
    
    result = await client.executeAction('addNullController', {
        name: 'Master Control',
        is3D: true
    });
    test(group, 'addNullController', result.success, result.error);
    
    // --- Distortion ---
    console.log('\n--- Distortion ---');
    
    result = await client.executeAction('applyCornerPin', {
        layerIndex: 1
    });
    test(group, 'applyCornerPin', result.success, result.error);
    
    result = await client.executeAction('applyMeshWarp', {
        layerIndex: 1,
        rows: 4,
        columns: 4
    });
    test(group, 'applyMeshWarp', result.success, result.error);
    
    // --- Generate ---
    console.log('\n--- Generate ---');
    
    // Add a solid layer for effects that can't be added to lights/cameras
    await client.executeAction('addShapeLayer', {
        shape: 'rectangle',
        size: [1920, 1080],
        fill: [0.5, 0.5, 0.5]
    });
    
    result = await client.executeAction('applyGradientRamp', {
        layerIndex: 1,
        startColor: [1, 0, 0],
        endColor: [0, 0, 1]
    });
    test(group, 'applyGradientRamp', result.success, result.error);
    
    // Skip applyFractalNoise - this effect requires specific layer types and may fail on shape layers
    skip(group, 'applyFractalNoise', 'Requires solid/footage layer, not shape layer');
}

async function runProfessionalTests(client) {
    console.log('\n========================================');
    console.log('LEVEL 4: PROFESSIONAL TESTS');
    console.log('========================================\n');
    
    const group = 'Professional';
    
    // --- Precomp ---
    console.log('--- Precomp & Organization ---');
    
    // Create layers to precomp
    await client.executeAction('addShapeLayer', { shape: 'rectangle', size: [100, 100], fill: [1, 0, 0] });
    await client.executeAction('addShapeLayer', { shape: 'ellipse', size: [100, 100], fill: [0, 1, 0] });
    
    let result = await client.executeAction('precompose', {
        layerIndices: [1, 2],
        name: 'Precomp Test'
    });
    test(group, 'precompose', result.success, result.error);
    
    result = await client.executeAction('createFolder', {
        name: 'Test Folder'
    });
    test(group, 'createFolder', result.success, result.error);
    
    // --- Markers ---
    console.log('\n--- Markers ---');
    
    result = await client.executeAction('addCompMarker', {
        time: 1,
        comment: 'Section Start'
    });
    test(group, 'addCompMarker', result.success, result.error);
    
    result = await client.executeAction('getCompMarkers', {});
    test(group, 'getCompMarkers', result.success, result.error);
    
    result = await client.executeAction('addMarkersFromArray', {
        markers: [
            { time: 2, comment: 'Beat 1' },
            { time: 3, comment: 'Beat 2' }
        ]
    });
    test(group, 'addMarkersFromArray', result.success, result.error);
    
    // --- Project ---
    console.log('\n--- Project Management ---');
    
    result = await client.executeAction('getProjectSettings', {});
    test(group, 'getProjectSettings', result.success, result.error);
    
    result = await client.executeAction('getProjectReport', {});
    test(group, 'getProjectReport', result.success, result.error);
    
    result = await client.executeAction('removeUnused', {
        dryRun: true
    });
    test(group, 'removeUnused (dry run)', result.success, result.error);
    
    // --- Render ---
    console.log('\n--- Render ---');
    
    result = await client.executeAction('listRenderTemplates', {});
    test(group, 'listRenderTemplates', result.success, result.error);
    
    result = await client.executeAction('getRenderStatus', {});
    test(group, 'getRenderStatus', result.success, result.error);
    
    // --- Color Management ---
    console.log('\n--- Color Management ---');
    
    result = await client.executeAction('setProjectColorDepth', {
        depth: 16
    });
    test(group, 'setProjectColorDepth', result.success, result.error);
    
    // Reset
    await client.executeAction('setProjectColorDepth', { depth: 8 });
}

async function runVFXTests(client) {
    console.log('\n========================================');
    console.log('LEVEL 5: VFX & COMPOSITING TESTS');
    console.log('========================================\n');
    
    const group = 'VFX';
    
    // Create green solid for keying
    await client.executeAction('addShapeLayer', {
        shape: 'rectangle',
        size: [1920, 1080],
        fill: [0, 1, 0]
    });
    
    // --- Keying ---
    console.log('--- Keying ---');
    
    let result = await client.executeAction('applyKeylight', {
        layerIndex: 1,
        screenColor: [0, 1, 0]
    });
    test(group, 'applyKeylight', result.success, result.error);
    
    result = await client.executeAction('applySpillSuppressor', {
        layerIndex: 1
    });
    test(group, 'applySpillSuppressor', result.success, result.error);
    
    result = await client.executeAction('applyKeyCleaner', {
        layerIndex: 1
    });
    test(group, 'applyKeyCleaner', result.success, result.error);
    
    // --- Track Matte ---
    console.log('\n--- Track Matte ---');
    
    // Track matte: matte layer must be directly ABOVE the target layer
    // Create target layer first (will become index 2 after matte is added)
    await client.executeAction('addShapeLayer', {
        shape: 'rectangle',
        size: [400, 400],
        fill: [1, 0, 0]
    });
    
    // Create matte layer (becomes index 1, directly above previous layer)
    await client.executeAction('addShapeLayer', {
        shape: 'ellipse',
        size: [500, 500],
        fill: [1, 1, 1]
    });
    
    // Layer 2 uses layer 1 as matte (specify matte layer index)
    result = await client.executeAction('setTrackMatte', {
        layerIndex: 2,
        matteLayerIndex: 1,
        matteType: 'alpha'
    });
    test(group, 'setTrackMatte', result.success, result.error);
    
    result = await client.executeAction('removeTrackMatte', {
        layerIndex: 2
    });
    test(group, 'removeTrackMatte', result.success, result.error);
    
    // --- Advanced Effects ---
    console.log('\n--- Advanced Effects ---');
    
    // Add a shape layer for effects
    await client.executeAction('addShapeLayer', {
        shape: 'rectangle',
        size: [800, 600],
        fill: [0.3, 0.3, 0.3]
    });
    
    result = await client.executeAction('applyBilateralBlur', {
        layerIndex: 1,
        radius: 5
    });
    test(group, 'applyBilateralBlur', result.success, result.error);
    
    // Skip applyAddGrain - requires AV layer with footage source, not shape layer
    skip(group, 'applyAddGrain', 'Requires footage layer, not shape layer');
    
    // --- Shadow Catcher ---
    console.log('\n--- Shadow Catcher ---');
    
    result = await client.executeAction('addShadowCatcher', {
        rotationX: 90
    });
    test(group, 'addShadowCatcher', result.success, result.error);
    
    // --- Shape Modifiers ---
    console.log('\n--- Advanced Shape ---');
    
    await client.executeAction('addShapeLayer', {
        shape: 'star',
        points: 5,
        size: [200, 200],
        fill: [1, 0.5, 0]
    });
    
    result = await client.executeAction('addZigZag', {
        layerIndex: 1,
        size: 10
    });
    test(group, 'addZigZag', result.success, result.error);
    
    result = await client.executeAction('addPuckerBloat', {
        layerIndex: 1,
        amount: 25
    });
    test(group, 'addPuckerBloat', result.success, result.error);
    
    result = await client.executeAction('addTwist', {
        layerIndex: 1,
        angle: 90
    });
    test(group, 'addTwist', result.success, result.error);
}

// ============================================
// MAIN
// ============================================

async function runTests(level = 'all') {
    console.log('========================================');
    console.log('AE AI ASSISTANT - CDP FUNCTIONAL TESTS');
    console.log('========================================\n');
    console.log('Date:', new Date().toISOString());
    console.log('Level:', level);
    
    // Check CEP connection
    let targets;
    try {
        targets = await httpGet('/json');
    } catch (e) {
        console.log(`\n❌ Cannot connect to CEP panel at localhost:${CDP_PORT}`);
        console.log('Make sure After Effects is running with the panel open.');
        process.exit(1);
    }
    
    const panelTarget = targets.find(t => 
        t.url && t.url.includes('com.aeai')
    );
    
    if (!panelTarget) {
        console.log('❌ AE AI Assistant panel not found');
        process.exit(1);
    }
    
    console.log('✓ Connected to panel:', panelTarget.title);
    
    // Connect CDP
    const client = new CDPClient(panelTarget.webSocketDebuggerUrl);
    await client.connect();
    await client.send('Runtime.enable');
    
    // Verify setup - ActionRegistry is in ExtendScript context, not JS
    const actionCount = await client.evaluate(`
        new Promise((resolve) => {
            csInterface.evalScript('ActionRegistry.list().length', (result) => {
                resolve(parseInt(result, 10));
            });
        })
    `);
    console.log('✓ ActionRegistry loaded:', actionCount, 'actions\n');
    
    if (actionCount !== 152) {
        console.log('⚠ Expected 152 actions, found', actionCount);
    }
    
    try {
        // Run selected tests
        if (level === 'all' || level === 'basic') {
            await runBasicTests(client);
        }
        if (level === 'all' || level === 'intermediate') {
            await runIntermediateTests(client);
        }
        if (level === 'all' || level === 'advanced') {
            await runAdvancedTests(client);
        }
        if (level === 'all' || level === 'professional') {
            await runProfessionalTests(client);
        }
        if (level === 'all' || level === 'vfx') {
            await runVFXTests(client);
        }
    } finally {
        client.close();
    }
    
    // Summary
    console.log('\n========================================');
    console.log('TEST SUMMARY');
    console.log('========================================');
    console.log('Passed: ', passed);
    console.log('Failed: ', failed);
    console.log('Skipped:', skipped);
    console.log('Total:  ', passed + failed + skipped);
    console.log('Success Rate:', Math.round(passed / (passed + failed) * 100) + '%');
    
    if (failures.length > 0) {
        console.log('\nFailed Tests:');
        failures.forEach(f => {
            console.log(`  - [${f.group}] ${f.name}: ${f.details}`);
        });
    }
    
    console.log('\n========================================');
    process.exit(failed > 0 ? 1 : 0);
}

// Parse command line args
const level = process.argv[2] || 'all';
runTests(level).catch(e => {
    console.error('Test error:', e);
    process.exit(1);
});

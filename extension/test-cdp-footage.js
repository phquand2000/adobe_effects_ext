#!/usr/bin/env node
/**
 * Footage-specific CDP Tests
 * Tests effects that require actual footage layers
 */

const http = require('http');
const WebSocket = require('ws');

async function httpGet(path) {
    return new Promise((resolve, reject) => {
        http.get('http://localhost:8088' + path, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
}

class CDPClient {
    constructor(wsUrl) {
        this.wsUrl = wsUrl;
        this.ws = null;
        this.msgId = 0;
        this.callbacks = new Map();
    }
    
    async connect() {
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
            const id = ++this.msgId;
            this.callbacks.set(id, resolve);
            this.ws.send(JSON.stringify({ id, method, params }));
            setTimeout(() => {
                if (this.callbacks.has(id)) {
                    this.callbacks.delete(id);
                    reject(new Error('Timeout'));
                }
            }, 30000);
        });
    }
    
    async evaluate(expression) {
        const result = await this.send('Runtime.evaluate', {
            expression,
            returnByValue: true,
            awaitPromise: true
        });
        return result.result?.result?.value;
    }
    
    async executeAction(action, params = {}) {
        const paramsJson = JSON.stringify(params).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        const result = await this.evaluate(`
            new Promise((resolve) => {
                csInterface.evalScript('runActionModular("${action}", \\'${paramsJson}\\')', (result) => {
                    resolve(result || '{"error":"No result"}');
                });
            })
        `);
        try {
            return JSON.parse(result);
        } catch (e) {
            return { error: 'Parse error: ' + result };
        }
    }
    
    async evalScript(code) {
        const escaped = code.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, ' ');
        const result = await this.evaluate(`
            new Promise((resolve) => {
                csInterface.evalScript('${escaped}', (result) => {
                    resolve(result || 'undefined');
                });
            })
        `);
        return result;
    }
    
    close() {
        this.ws && this.ws.close();
    }
}

let passed = 0, failed = 0;

function test(name, success, error = '') {
    if (success) {
        passed++;
        console.log(`✓ ${name}`);
    } else {
        failed++;
        console.log(`✗ ${name} - ${error}`);
    }
}

async function runFootageTests() {
    console.log('========================================');
    console.log('FOOTAGE-SPECIFIC TESTS');
    console.log('========================================\n');
    
    const targets = await httpGet('/json');
    const target = targets.find(t => t.url && t.url.includes('com.aeai'));
    
    if (!target) {
        console.log('Panel not found');
        process.exit(1);
    }
    
    const client = new CDPClient(target.webSocketDebuggerUrl);
    await client.connect();
    await client.send('Runtime.enable');
    
    console.log('✓ Connected to panel\n');
    
    // Step 1: Create test comp
    console.log('--- Setup ---');
    let result = await client.executeAction('createComp', {
        name: 'Footage Effect Test',
        width: 576,
        height: 1024,
        duration: 5,
        frameRate: 30
    });
    test('Create test comp', result.success, result.error);
    
    // Step 2: Add footage layer using raw evalScript
    const addFootageCode = `
        (function() {
            var comp = app.project.activeItem;
            if (!comp) return JSON.stringify({error: 'No active comp'});
            
            var footage = null;
            for (var i = 1; i <= app.project.numItems; i++) {
                var item = app.project.item(i);
                if (item.name === 'Download.mp4' && item instanceof FootageItem) {
                    footage = item;
                    break;
                }
            }
            if (!footage) return JSON.stringify({error: 'Download.mp4 not found'});
            
            var layer = comp.layers.add(footage);
            return JSON.stringify({success: true, layer: layer.name});
        })()
    `;
    
    const footageResult = await client.evalScript(addFootageCode);
    let footageData;
    try {
        footageData = JSON.parse(footageResult);
    } catch (e) {
        footageData = { error: footageResult };
    }
    test('Add footage layer (Download.mp4)', footageData.success, footageData.error);
    
    if (!footageData.success) {
        console.log('\nCannot continue without footage layer');
        client.close();
        process.exit(1);
    }
    
    // Step 3: Test footage-specific effects
    console.log('\n--- Footage Effects ---');
    
    result = await client.executeAction('applyFractalNoise', {
        layerIndex: 1,
        complexity: 5,
        contrast: 150
    });
    test('applyFractalNoise', result.success, result.error);
    
    result = await client.executeAction('applyAddGrain', {
        layerIndex: 1,
        intensity: 0.5
    });
    test('applyAddGrain', result.success, result.error);
    
    result = await client.executeAction('applyMatchGrain', {
        layerIndex: 1
    });
    test('applyMatchGrain', result.success, result.error);
    
    console.log('\n--- Time Effects ---');
    
    result = await client.executeAction('applyTimewarp', {
        layerIndex: 1,
        speed: 50
    });
    test('applyTimewarp', result.success, result.error);
    
    result = await client.executeAction('applyPixelMotionBlur', {
        layerIndex: 1,
        shutterAngle: 180
    });
    test('applyPixelMotionBlur', result.success, result.error);
    
    result = await client.executeAction('applyPosterizeTime', {
        layerIndex: 1,
        frameRate: 12
    });
    test('applyPosterizeTime', result.success, result.error);
    
    console.log('\n--- Distortion Effects ---');
    
    result = await client.executeAction('applyWarpStabilizer', {
        layerIndex: 1
    });
    test('applyWarpStabilizer', result.success, result.error);
    
    result = await client.executeAction('applyDisplacementMap', {
        layerIndex: 1
    });
    test('applyDisplacementMap', result.success, result.error);
    
    result = await client.executeAction('applyBezierWarp', {
        layerIndex: 1
    });
    test('applyBezierWarp', result.success, result.error);
    
    console.log('\n--- Advanced Blur ---');
    
    result = await client.executeAction('applyCompoundBlur', {
        layerIndex: 1
    });
    test('applyCompoundBlur', result.success, result.error);
    
    result = await client.executeAction('applyVectorBlur', {
        layerIndex: 1
    });
    test('applyVectorBlur', result.success, result.error);
    
    // Cleanup - remove test comp
    await client.evalScript(`
        (function() {
            for (var i = app.project.numItems; i >= 1; i--) {
                if (app.project.item(i).name === 'Footage Effect Test') {
                    app.project.item(i).remove();
                    break;
                }
            }
        })()
    `);
    
    client.close();
    
    // Summary
    console.log('\n========================================');
    console.log('SUMMARY');
    console.log('========================================');
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${Math.round(passed / (passed + failed) * 100)}%`);
    console.log('========================================');
    
    process.exit(failed > 0 ? 1 : 0);
}

runFootageTests().catch(e => {
    console.error('Error:', e);
    process.exit(1);
});

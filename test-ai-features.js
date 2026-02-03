#!/usr/bin/env node
/**
 * Test AI Helper Features
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
            }, 10000);
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

async function runTests() {
    console.log('========================================');
    console.log('AI HELPER FEATURES TEST');
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
    
    // Test 1: getCategories
    console.log('--- 1. getCategories ---');
    let result = await client.executeAction('getCategories', {});
    test('getCategories returns success', result.success, result.error);
    if (result.success && result.categories) {
        const catCount = Object.keys(result.categories).length;
        test('Has multiple categories', catCount > 10, `Found: ${catCount}`);
        test('Has camera category', result.categories.camera !== undefined);
        test('Has effect category', result.categories.effect !== undefined);
        console.log(`   Categories: ${Object.keys(result.categories).join(', ')}`);
    }
    
    // Test 2: getActionInfo
    console.log('\n--- 2. getActionInfo ---');
    result = await client.executeAction('getActionInfo', { action: 'applyFractalNoise' });
    test('getActionInfo returns success', result.success, result.error);
    if (result.success) {
        test('layerType is av', result.layerType === 'av', `Got: ${result.layerType}`);
        test('category is noise', result.category === 'noise', `Got: ${result.category}`);
        test('needsLayer is true', result.needsLayer === true);
    }
    
    result = await client.executeAction('getActionInfo', { action: 'applyWarpStabilizer' });
    test('getActionInfo for applyWarpStabilizer', result.success, result.error);
    if (result.success) {
        test('Has manualStep', result.manualStep !== null, `Got: ${result.manualStep}`);
    }
    
    // Test 3: listTemplates
    console.log('\n--- 3. listTemplates ---');
    result = await client.executeAction('listTemplates', {});
    test('listTemplates returns success', result.success, result.error);
    if (result.success && result.templates) {
        test('Has templates', result.templates.length > 0, `Found: ${result.templates.length}`);
        console.log(`   Templates: ${result.templates.map(t => t.id).join(', ')}`);
        
        // Check for different levels
        const levels = [...new Set(result.templates.map(t => t.level))];
        test('Has multiple skill levels', levels.length >= 3, `Levels: ${levels.join(', ')}`);
    }
    
    result = await client.executeAction('listTemplates', { level: 'professional' });
    test('listTemplates by level', result.success, result.error);
    if (result.success && result.templates) {
        const allPro = result.templates.every(t => t.level === 'professional');
        test('All templates are professional level', allPro);
    }
    
    // Test 4: getSuggestions
    console.log('\n--- 4. getSuggestions ---');
    result = await client.executeAction('getSuggestions', { lastAction: 'addCamera' });
    test('getSuggestions returns success', result.success, result.error);
    if (result.success && result.suggestions) {
        test('Has suggestions', result.suggestions.length > 0, `Found: ${result.suggestions.length}`);
        test('Suggests setupDOF after addCamera', result.suggestions.includes('setupDOF'));
        console.log(`   Suggestions: ${result.suggestions.slice(0, 5).join(', ')}`);
    }
    
    result = await client.executeAction('getSuggestions', { layerType: 'text' });
    test('getSuggestions for text layer', result.success, result.error);
    if (result.success && result.suggestions) {
        test('Suggests addTextAnimator for text', result.suggestions.includes('addTextAnimator'));
    }
    
    // Test 5: Create comp and test getLayerInfo
    console.log('\n--- 5. getLayerInfo ---');
    result = await client.executeAction('createComp', {
        name: 'AI Feature Test',
        width: 1920,
        height: 1080,
        duration: 5,
        frameRate: 30
    });
    test('Create test comp', result.success, result.error);
    
    result = await client.executeAction('addTextLayer', {
        text: 'Test',
        fontSize: 100
    });
    test('Add text layer', result.success, result.error);
    
    result = await client.executeAction('getLayerInfo', { layerIndex: 1 });
    test('getLayerInfo returns success', result.success, result.error);
    if (result.success) {
        test('Layer type is text', result.capabilities.type === 'text', `Got: ${result.capabilities.type}`);
        test('allowsTextAnimators is true', result.capabilities.allowsTextAnimators === true);
        test('allowsNoiseGrain is false', result.capabilities.allowsNoiseGrain === false);
        test('Has compatibleActions', result.compatibleActions && result.compatibleActions.length > 0);
        test('Has suggestedActions', result.suggestedActions && result.suggestedActions.length > 0);
    }
    
    // Test 6: ActionRegistry.getCompatibleActions
    console.log('\n--- 6. getCompatibleActions ---');
    const compatResult = await client.evaluate(`
        new Promise((resolve) => {
            csInterface.evalScript('JSON.stringify(ActionRegistry.getCompatibleActions("text"))', (result) => {
                resolve(result);
            });
        })
    `);
    const compatActions = JSON.parse(compatResult);
    test('getCompatibleActions returns array', Array.isArray(compatActions));
    test('Includes addTextAnimator', compatActions.includes('addTextAnimator'));
    test('Does NOT include applyFractalNoise', !compatActions.includes('applyFractalNoise'));
    
    // Cleanup
    await client.evaluate(`
        new Promise((resolve) => {
            csInterface.evalScript('(function() { for (var i = app.project.numItems; i >= 1; i--) { if (app.project.item(i).name === "AI Feature Test") { app.project.item(i).remove(); break; } } })()', resolve);
        })
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

runTests().catch(e => {
    console.error('Error:', e);
    process.exit(1);
});

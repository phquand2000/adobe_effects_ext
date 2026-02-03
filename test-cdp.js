#!/usr/bin/env node
/**
 * CDP Test for AE AI Assistant CEP Panel
 * 
 * Prerequisites:
 * 1. After Effects must be running
 * 2. AE AI Assistant panel must be open (Window > Extensions > AE AI Assistant)
 * 3. Debug port 3001 must be accessible
 * 
 * Run: node test-cdp.js
 */

const http = require('http');

const CDP_PORT = 8088;
const CDP_HOST = 'localhost';

// Helper to make HTTP requests
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

// WebSocket client for CDP
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
            }, 10000);
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
    
    close() {
        if (this.ws) {
            this.ws.close();
        }
    }
}

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

async function runTests() {
    console.log('========================================');
    console.log('AE AI Assistant - CDP Test Suite');
    console.log('========================================\n');
    
    // Check if CEP panel is accessible
    console.log('--- 1. CEP Panel Connection ---');
    
    let targets;
    try {
        targets = await httpGet('/json');
        test('CEP debug port accessible', Array.isArray(targets));
    } catch (e) {
        console.log(`\n❌ Cannot connect to CEP panel at localhost:${CDP_PORT}`);
        console.log('\nPlease ensure:');
        console.log('1. After Effects is running');
        console.log('2. AE AI Assistant panel is open (Window > Extensions > AE AI Assistant)');
        console.log('3. .debug file has Port="3001" for AEFT host');
        console.log('\nTo enable debug mode, you may also need:');
        console.log('  defaults write com.adobe.CSXS.11 PlayerDebugMode 1');
        console.log('  (Then restart After Effects)\n');
        process.exit(1);
    }
    
    // Find the panel target
    const panelTarget = targets.find(t => 
        t.url && (t.url.includes('index.html') || t.url.includes('com.aeai'))
    );
    
    if (!panelTarget) {
        console.log('Available targets:', targets.map(t => t.url || t.title));
        test('Found AE AI Assistant panel target', false, 'Panel not found in targets');
        process.exit(1);
    }
    
    test('Found AE AI Assistant panel target', true);
    console.log(`   Target: ${panelTarget.url}`);
    
    // Connect via WebSocket
    console.log('\n--- 2. WebSocket Connection ---');
    
    const client = new CDPClient(panelTarget.webSocketDebuggerUrl);
    try {
        await client.connect();
        test('WebSocket connected to panel', true);
    } catch (e) {
        test('WebSocket connected to panel', false, e.message);
        process.exit(1);
    }
    
    // Enable Runtime domain
    await client.send('Runtime.enable');
    
    // Test CSInterface
    console.log('\n--- 3. CSInterface Tests ---');
    
    const csInterfaceExists = await client.evaluate('typeof CSInterface !== "undefined"');
    test('CSInterface is defined', csInterfaceExists === true);
    
    const csInterfaceInstance = await client.evaluate('typeof csInterface !== "undefined" && csInterface !== null');
    test('csInterface instance exists', csInterfaceInstance === true);
    
    // Test ALLOWED_ACTIONS
    console.log('\n--- 4. ALLOWED_ACTIONS Tests ---');
    
    const allowedActionsExists = await client.evaluate('typeof ALLOWED_ACTIONS !== "undefined"');
    test('ALLOWED_ACTIONS is defined', allowedActionsExists === true);
    
    const allowedActionsSize = await client.evaluate('ALLOWED_ACTIONS.size');
    test('ALLOWED_ACTIONS has 158 actions', allowedActionsSize === 158, `Found: ${allowedActionsSize}`);
    
    const hasTestScript = await client.evaluate("ALLOWED_ACTIONS.has('testScript')");
    test('ALLOWED_ACTIONS includes testScript', hasTestScript === true);
    
    const hasAddCamera = await client.evaluate("ALLOWED_ACTIONS.has('addCamera')");
    test('ALLOWED_ACTIONS includes addCamera', hasAddCamera === true);
    
    // Test executeAction function
    console.log('\n--- 5. executeAction Tests ---');
    
    const executeActionExists = await client.evaluate('typeof executeAction === "function"');
    test('executeAction function exists', executeActionExists === true);
    
    // Test that invalid action is blocked
    const blockedResult = await client.evaluate(`
        (async () => {
            const result = await executeAction('maliciousAction', {});
            return result;
        })()
    `);
    test('Invalid action is blocked', 
        blockedResult && blockedResult.success === false && blockedResult.error.includes('Invalid action'),
        blockedResult ? blockedResult.error : 'No result');
    
    // Test ExtendScript bridge
    console.log('\n--- 6. ExtendScript Bridge Tests ---');
    
    // Check if runActionModular exists in ExtendScript
    const checkScriptLoaded = await client.evaluate(`
        new Promise((resolve) => {
            csInterface.evalScript('typeof runActionModular === "function"', (result) => {
                resolve(result === 'true');
            });
        })
    `);
    test('runActionModular is loaded in ExtendScript', checkScriptLoaded === true);
    
    // Test ActionRegistry
    const actionCount = await client.evaluate(`
        new Promise((resolve) => {
            csInterface.evalScript('ActionRegistry.list().length', (result) => {
                resolve(parseInt(result, 10));
            });
        })
    `);
    test('ActionRegistry has 158 actions', actionCount === 158, `Found: ${actionCount}`);
    
    // Test testScript action
    console.log('\n--- 7. testScript Action Test ---');
    
    const testScriptResult = await client.evaluate(`
        new Promise((resolve) => {
            csInterface.evalScript('runActionModular("testScript", "{}")', (result) => {
                try {
                    resolve(JSON.parse(result));
                } catch (e) {
                    resolve({ error: 'Parse error: ' + result });
                }
            });
        })
    `);
    
    test('testScript returns success', 
        testScriptResult && testScriptResult.success === true,
        testScriptResult ? JSON.stringify(testScriptResult) : 'No result');
    
    test('testScript returns correct message',
        testScriptResult && testScriptResult.message === 'Modular script is working');
    
    test('testScript reports 158 registered actions',
        testScriptResult && testScriptResult.registeredActions === 158,
        `Found: ${testScriptResult?.registeredActions}`);
    
    // Test JSON.parse security in ExtendScript
    console.log('\n--- 8. JSON.parse Security Tests ---');
    
    const jsonSecurityTest = await client.evaluate(`
        new Promise((resolve) => {
            const testCode = \`
                (function() {
                    var results = { valid: [], invalid: [] };
                    
                    // Test valid JSON
                    var validTests = [
                        '{"key": "value"}',
                        '{"message": "call foo() here"}',
                        '{"code": "alert(1)"}'
                    ];
                    
                    for (var i = 0; i < validTests.length; i++) {
                        try {
                            JSON.parse(validTests[i]);
                            results.valid.push(validTests[i]);
                        } catch (e) {
                            results.invalid.push({ input: validTests[i], error: e.toString() });
                        }
                    }
                    
                    // Test dangerous inputs
                    var dangerousTests = ['alert("xss")', 'app.project.close()'];
                    
                    for (var j = 0; j < dangerousTests.length; j++) {
                        try {
                            JSON.parse(dangerousTests[j]);
                            results.invalid.push({ input: dangerousTests[j], error: 'Should have thrown' });
                        } catch (e) {
                            results.valid.push('BLOCKED: ' + dangerousTests[j]);
                        }
                    }
                    
                    return JSON.stringify(results);
                })()
            \`;
            csInterface.evalScript(testCode, (result) => {
                try {
                    resolve(JSON.parse(result));
                } catch (e) {
                    resolve({ error: result });
                }
            });
        })
    `);
    
    if (jsonSecurityTest && !jsonSecurityTest.error) {
        test('Valid JSON with function-like strings accepted', 
            jsonSecurityTest.valid.includes('{"message": "call foo() here"}'));
        test('Dangerous code blocked', 
            jsonSecurityTest.valid.some(v => v.includes('BLOCKED: alert')));
    } else {
        test('JSON security tests', false, jsonSecurityTest?.error || 'No result');
    }
    
    // Test effect service
    console.log('\n--- 9. Effect Service Tests ---');
    
    const effectServiceTest = await client.evaluate(`
        new Promise((resolve) => {
            csInterface.evalScript('typeof EffectService === "object" && typeof EffectService.applyGlow === "function"', (result) => {
                resolve(result === 'true');
            });
        })
    `);
    test('EffectService.applyGlow exists', effectServiceTest === true);
    
    // Test ProjectData
    console.log('\n--- 10. ProjectData Integration Tests ---');
    
    const projectDataTest = await client.evaluate(`
        new Promise((resolve) => {
            csInterface.evalScript('typeof ProjectData === "object" && typeof ProjectData.findFootageItem === "function"', (result) => {
                resolve(result === 'true');
            });
        })
    `);
    test('ProjectData.findFootageItem exists', projectDataTest === true);
    
    // Cleanup
    client.close();
    
    // Summary
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
}

runTests().catch(e => {
    console.error('Test error:', e);
    process.exit(1);
});

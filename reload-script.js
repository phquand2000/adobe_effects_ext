#!/usr/bin/env node
/**
 * Reload ExtendScript in AE via CDP
 */

const http = require('http');
const WebSocket = require('ws');

async function reloadScript() {
    // Get target
    const res = await new Promise((resolve, reject) => {
        http.get('http://localhost:8088/json', res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
    
    const target = res.find(t => t.url && t.url.includes('com.aeai'));
    if (!target) {
        console.log('Panel not found');
        process.exit(1);
    }
    
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    
    ws.on('open', () => {
        ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
    });
    
    ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        
        if (msg.id === 1) {
            // Reload the script - use the extension path from panel
            const reloadCode = `
                new Promise((resolve) => {
                    const extensionPath = csInterface.getSystemPath(SystemPath.EXTENSION);
                    const scriptPath = extensionPath + '/jsx/loader.jsx';
                    csInterface.evalScript('$.evalFile("' + scriptPath.replace(/\\\\/g, '/') + '")', (result) => {
                        csInterface.evalScript('ActionRegistry.list().length', (count) => {
                            resolve('Reloaded. Actions: ' + count);
                        });
                    });
                })
            `;
            ws.send(JSON.stringify({
                id: 2,
                method: 'Runtime.evaluate',
                params: {
                    expression: reloadCode,
                    returnByValue: true,
                    awaitPromise: true
                }
            }));
        }
        
        if (msg.id === 2) {
            console.log('Result:', msg.result?.result?.value || msg.result?.exceptionDetails);
            ws.close();
            process.exit(0);
        }
    });
    
    ws.on('error', e => {
        console.error('Error:', e.message);
        process.exit(1);
    });
}

reloadScript();

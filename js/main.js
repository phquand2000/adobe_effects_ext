let csInterface;
let compInfo = null;

document.addEventListener('DOMContentLoaded', () => {
    try {
        csInterface = new CSInterface();
        
        // Load the ExtendScript file explicitly
        const extensionPath = csInterface.getSystemPath(SystemPath.EXTENSION);
        const scriptPath = extensionPath + '/jsx/loader.jsx';
        
        csInterface.evalScript('$.evalFile("' + scriptPath.replace(/\\/g, '/') + '")', (result) => {
            console.log('Script loaded:', result);
            refreshCompInfo();
        });
    } catch (e) {
        console.log('Running outside CEP environment');
        csInterface = null;
    }

    initUI();
    testConnection();
});

function initUI() {
    const sendBtn = document.getElementById('sendBtn');
    const testBtn = document.getElementById('testBtn');
    const userInput = document.getElementById('userInput');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    
    sendBtn.addEventListener('click', sendMessage);
    testBtn.addEventListener('click', testConnection);
    
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    document.querySelectorAll('.action-card').forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            handleQuickAction(action);
        });
    });

    document.querySelectorAll('.workflow-card').forEach(btn => {
        btn.addEventListener('click', () => {
            const workflow = btn.dataset.workflow;
            handleWorkflow(workflow);
        });
    });

    // Settings handlers
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', saveSettings);
    }
    
    // Load saved settings into inputs
    loadSettingsUI();
}

function loadSettingsUI() {
    const apiUrlInput = document.getElementById('apiUrl');
    const apiKeyInput = document.getElementById('apiKey');
    
    if (apiUrlInput && CONFIG.API_URL) {
        apiUrlInput.value = CONFIG.API_URL;
    }
    if (apiKeyInput && CONFIG.API_KEY) {
        apiKeyInput.value = CONFIG.API_KEY;
    }
}

function saveSettings() {
    const apiUrl = document.getElementById('apiUrl').value.trim();
    const apiKey = document.getElementById('apiKey').value.trim();
    const saveBtn = document.getElementById('saveSettingsBtn');
    
    if (apiUrl) {
        saveConfig('apiUrl', apiUrl);
    }
    if (apiKey) {
        saveConfig('apiKey', apiKey);
    }
    
    // Update AI client with new config
    aiClient.apiUrl = CONFIG.API_URL;
    aiClient.apiKey = CONFIG.API_KEY;
    
    // Visual feedback
    saveBtn.classList.add('saved');
    saveBtn.innerHTML = '<span class="btn-icon">✓</span> Saved';
    
    setTimeout(() => {
        saveBtn.classList.remove('saved');
        saveBtn.innerHTML = '<span class="btn-icon">💾</span> Save Settings';
    }, 2000);
    
    addMessage('system', '✓ Settings saved');
}

async function testConnection() {
    const statusEl = document.getElementById('status');
    const dotEl = statusEl.querySelector('.status-dot');
    const textEl = statusEl.querySelector('.status-text');
    
    textEl.textContent = 'Testing...';
    statusEl.className = 'status-indicator';

    const result = await aiClient.testConnection();
    
    if (result.success) {
        statusEl.className = 'status-indicator online';
        textEl.textContent = 'Connected';
        addMessage('system', '✓ Connected to AI Server');
    } else {
        statusEl.className = 'status-indicator offline';
        textEl.textContent = 'Offline';
        addMessage('error', `Connection failed: ${result.error}`);
    }
}

async function sendMessage() {
    const input = document.getElementById('userInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    input.value = '';
    addMessage('user', message);
    setLoading(true);

    await refreshCompInfo();

    const result = await aiClient.chat(message);
    setLoading(false);

    if (result.success) {
        addMessage('assistant', result.content);
        await tryParseAndExecute(result.content);
    } else {
        addMessage('error', `Error: ${result.error}`);
    }
}

function addMessage(type, content) {
    const container = document.getElementById('chatContainer');
    
    const group = document.createElement('div');
    group.className = `message-group ${type}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = type === 'user' 
        ? '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>';
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.innerHTML = formatMessage(content);
    
    group.appendChild(avatar);
    group.appendChild(messageContent);
    container.appendChild(group);
    container.scrollTop = container.scrollHeight;
}

function formatMessage(content) {
    let formatted = content
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>')
        .replace(/`([^`]+)`/g, '<code>$1</code>');
    
    formatted = formatted.replace(/```(\w*)\s*([\s\S]*?)```/g, (match, lang, code) => {
        return `<pre>${code.trim()}</pre>`;
    });
    
    return formatted;
}

async function tryParseAndExecute(content) {
    try {
        // Look for JSON in fenced code block first (preferred, safer)
        let jsonStr = null;
        const fencedMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?"action"[\s\S]*?\})\s*```/);
        
        if (fencedMatch) {
            jsonStr = fencedMatch[1];
        } else {
            // Fallback: find balanced JSON object with "action" key
            const jsonMatch = content.match(/\{[^{}]*"action"\s*:\s*"[^"]+"/);
            if (jsonMatch) {
                // Extract the full balanced JSON object starting from this match
                const startIdx = content.indexOf(jsonMatch[0]);
                let depth = 0;
                let endIdx = startIdx;
                for (let i = startIdx; i < content.length; i++) {
                    if (content[i] === '{') depth++;
                    if (content[i] === '}') depth--;
                    if (depth === 0) {
                        endIdx = i + 1;
                        break;
                    }
                }
                jsonStr = content.slice(startIdx, endIdx);
            }
        }
        
        if (!jsonStr) return;
        
        const command = JSON.parse(jsonStr);
        if (!command.action || typeof command.action !== 'string') return;
        
        if (command.explanation) {
            addMessage('system', `⚡ ${command.explanation}`);
        }
        
        const result = await executeAction(command.action, command.params || {});
        
        if (result && result.success) {
            addMessage('system', `✓ Action completed`);
            
            if (command.manualSteps && command.manualSteps.length > 0) {
                const steps = command.manualSteps.map((s, i) => `${i + 1}. ${s}`).join('<br>');
                addMessage('system', `📋 Manual steps:<br>${steps}`);
            }
            
            if (command.followUp && command.followUp.length > 0) {
                addMessage('system', `💡 Next: ${command.followUp[0]}`);
            }
        } else if (result && result.error) {
            addMessage('error', `Action failed: ${result.error}`);
        }
        
        await refreshCompInfo();
    } catch (e) {
        console.log('Parse error:', e);
    }
}

// Whitelist of allowed actions to prevent injection
// Synced with ActionRegistry (158 total actions)
const ALLOWED_ACTIONS = new Set([
    // ---- Camera actions (5) ----
    'addCamera', 'setupDOF', 'setCameraIris', 'animateFocusRack', 'focusOnLayer',
    
    // ---- Light actions (4) ----
    'addLightRig', 'setLightFalloff', 'addEnvironmentLight', 'setupShadows',
    
    // ---- Layer actions (6) ----
    'setup3DLayer', 'enableMotionBlur', 'addShadowCatcher', 'addNullController', 'parentLayers', 'unparentLayer',
    
    // ---- Layer Utils actions (9) ----
    'duplicateLayer', 'splitLayer', 'timeRemapLayer', 'timeStretchLayer', 'setCollapseTransformations',
    'setLayerBlendingMode', 'setLayerQuality', 'freezeFrame', 'reverseLayer',
    
    // ---- Effect actions (10) ----
    'applyGlow', 'applyBlur', 'applyLumetri', 'applyVibrance', 'applyCurves',
    'addEffect', 'setEffectProperty', 'applyBilateralBlur', 'applyCompoundBlur', 'applyVectorBlur',
    
    // ---- Import actions (4) ----
    'importAssets', 'importWithDialog', 'import3DModel', 'listProjectItems',
    
    // ---- Composition actions (5) ----
    'createComp', 'getCompInfo', 'getProjectInfo', 'getRenderers', 'setupAdvanced3D',
    
    // ---- Text actions (7) ----
    'addTextLayer', 'updateText', 'addTextAnimator', 'addRangeSelector', 'addWigglySelector',
    'setPerCharacter3D', 'setTextTracking',
    
    // ---- Shape actions (12) ----
    'addShapeLayer', 'addTrimPaths', 'addRepeater', 'addGradientFill', 'addGradientStroke',
    'addMergePaths', 'addOffsetPaths', 'addRoundCorners', 'addZigZag', 'addPuckerBloat', 'addTwist', 'addWigglePath',
    
    // ---- Keying actions (4) ----
    'applyKeylight', 'applySpillSuppressor', 'applyKeyCleaner', 'applyKeyingPreset',
    
    // ---- Time actions (3) ----
    'applyTimewarp', 'applyPixelMotionBlur', 'applyPosterizeTime',
    
    // ---- Distortion actions (5) ----
    'applyWarpStabilizer', 'applyCornerPin', 'applyDisplacementMap', 'applyMeshWarp', 'applyBezierWarp',
    
    // ---- Noise/Grain actions (3) ----
    'applyFractalNoise', 'applyMatchGrain', 'applyAddGrain',
    
    // ---- Generate actions (3) ----
    'applyGradientRamp', 'applyFill', 'apply4ColorGradient',
    
    // ---- Property actions (4) ----
    'setProperty', 'getProperty', 'addKeyframe', 'animateProperty',
    
    // ---- Mask actions (3) ----
    'addMask', 'setTrackMatte', 'removeTrackMatte',
    
    // ---- Expression actions (3) ----
    'applyExpression', 'removeExpression', 'applyExpressionPreset',
    
    // ---- Render actions (11) ----
    'addToRenderQueue', 'listRenderTemplates', 'startRender', 'captureFrame', 'captureFrameOptimized',
    'setOutputModule', 'batchRenderComps', 'setRenderRegion', 'setRenderSettings', 'getRenderStatus', 'clearRenderQueue',
    
    // ---- Workflow actions (4) ----
    'animateCoin', 'createCoinTransition', 'positionFromAnalysis', 'applyColorMatch',
    
    // ---- Tracking actions (2) ----
    'setup3DCameraTracker', 'linkToTrackPoint',
    
    // ---- MOGRT/Essential Graphics actions (2) ----
    'exportMOGRT', 'addToEssentialGraphics',
    
    // ---- Precomp actions (5) ----
    'precompose', 'duplicateComp', 'openCompViewer', 'replaceCompSource', 'nestComp',
    
    // ---- Footage actions (7) ----
    'replaceFootage', 'relinkFootage', 'interpretFootage', 'setProxy', 'collectFiles', 'removeUnused', 'findMissingFootage',
    
    // ---- Marker actions (7) ----
    'addCompMarker', 'addLayerMarker', 'getCompMarkers', 'getLayerMarkers', 'removeMarker', 'updateMarker', 'addMarkersFromArray',
    
    // ---- Color actions (8) ----
    'setProjectColorDepth', 'setProjectWorkingSpace', 'applyLUT', 'applyColorProfileConverter',
    'setLinearizeWorkingSpace', 'setCompensateForSceneReferredProfiles', 'applyColorBalance', 'applyPhotoFilter',
    
    // ---- Audio actions (7) ----
    'setAudioLevel', 'fadeAudioIn', 'fadeAudioOut', 'muteLayer', 'soloAudio', 'setAudioKeyframe', 'getAudioInfo',
    
    // ---- Project actions (8) ----
    'getProjectSettings', 'setProjectSettings', 'saveProject', 'closeProject', 'createFolder',
    'organizeProjectItems', 'getProjectReport', 'reduceProject',
    
    // ---- AI Helper actions (6) ----
    'getLayerInfo', 'getActionInfo', 'listTemplates', 'executeTemplate', 'getSuggestions', 'getCategories',
    
    // ---- Diagnostic actions (1) ----
    'testScript'
]);

function executeAction(action, params) {
    return new Promise((resolve) => {
        // Security: validate action is in whitelist
        if (!ALLOWED_ACTIONS.has(action)) {
            console.warn('Blocked invalid action:', action);
            resolve({ success: false, error: 'Invalid action: ' + action });
            return;
        }
        
        if (csInterface) {
            // First check if runActionModular exists
            const checkScript = 'typeof runActionModular === "function"';
            csInterface.evalScript(checkScript, (exists) => {
                if (exists !== 'true') {
                    console.error('runActionModular not found - loader.jsx may not be loaded');
                    resolve({ success: false, error: 'Script not loaded. Restart AE.' });
                    return;
                }
                
                // Use proper JSON.stringify for safe escaping
                const script = `runActionModular(${JSON.stringify(action)}, ${JSON.stringify(JSON.stringify(params))})`;
                
                csInterface.evalScript(script, (resultStr) => {
                    console.log('Raw result:', resultStr);
                    try {
                        if (!resultStr || resultStr === 'undefined' || resultStr === 'null') {
                            resolve({ success: false, error: 'No response from script' });
                            return;
                        }
                        const result = JSON.parse(resultStr);
                        resolve(result);
                    } catch (e) {
                        console.error('Parse error:', e, 'Result:', resultStr);
                        resolve({ success: false, error: 'Invalid response: ' + resultStr });
                    }
                });
            });
        } else {
            addMessage('system', `[Simulation] ${action}`);
            resolve({ success: true, simulated: true });
        }
    });
}

function refreshCompInfo() {
    return new Promise((resolve) => {
        if (csInterface) {
            csInterface.evalScript('getCompInfo()', (result) => {
                try {
                    compInfo = JSON.parse(result);
                    updateCompDisplay();
                } catch (e) {
                    compInfo = null;
                }
                resolve();
            });
        } else {
            resolve();
        }
    });
}

function updateCompDisplay() {
    const compBadge = document.getElementById('compInfo');
    const compName = compBadge.querySelector('.comp-name');
    
    if (compInfo && compInfo.name) {
        compName.textContent = `${compInfo.name} · ${compInfo.width}×${compInfo.height}`;
    } else {
        compName.textContent = 'No Comp';
    }
}

function setLoading(loading) {
    const sendBtn = document.getElementById('sendBtn');
    sendBtn.disabled = loading;
    sendBtn.innerHTML = loading 
        ? '<div class="loading-spinner"></div>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg>';
}

// ============================================
// QUICK ACTIONS
// ============================================

async function handleQuickAction(action) {
    const actions = {
        importAssets: async () => {
            addMessage('user', 'Import assets (file picker)');
            const result = await executeAction('importAssets', {});
            if (result.success) {
                const imported = result.imported;
                const summary = [];
                if (imported.videos && imported.videos.length > 0) summary.push(`Videos: ${imported.videos.join(', ')}`);
                if (imported.models && imported.models.length > 0) summary.push(`Models: ${imported.models.join(', ')}`);
                if (imported.images && imported.images.length > 0) summary.push(`Images: ${imported.images.join(', ')}`);
                addMessage('system', summary.length > 0 ? `✓ Imported:\n${summary.join('\n')}` : 'No files imported');
            } else {
                addMessage('error', result.message || result.error || 'Import cancelled');
            }
        },
        
        createComp: async () => {
            addMessage('user', 'Create new composition from footage');
            const result = await executeAction('createComp', {
                name: 'Coin Transition',
                fromFootage: CONFIG.ASSETS.referenceVideo
            });
            addMessage('system', result.success 
                ? `Created: ${result.name} (${result.renderer})` 
                : `Error: ${result.error}`);
        },
        
        setup3D: async () => {
            addMessage('user', 'Setup 3D layer with PBR materials');
            const result = await executeAction('setup3DLayer', {
                layerIndex: 1,
                material: {
                    castsShadows: true,
                    acceptsLights: true,
                    specular: 80,
                    shininess: 50,
                    metal: 100
                }
            });
            addMessage('system', result.success 
                ? `3D setup: ${result.layer}` 
                : `Error: ${result.error}`);
        },
        
        addCamera: async () => {
            addMessage('user', 'Add camera with depth of field');
            const result = await executeAction('addCamera', {
                name: 'Main Camera',
                focalLength: 35,
                enableDOF: true,
                focusDistance: 1500,
                blurLevel: 100
            });
            addMessage('system', result.success 
                ? `Camera: ${result.camera}` 
                : `Error: ${result.error}`);
        },
        
        addLights: async () => {
            addMessage('user', 'Add 3-point lighting rig');
            const result = await executeAction('addLightRig', {
                includeRim: true
            });
            addMessage('system', result.success 
                ? `Lights: ${result.lights.join(', ')}` 
                : `Error: ${result.error}`);
        },
        
        motionBlur: async () => {
            addMessage('user', 'Enable motion blur on all 3D layers');
            const result = await executeAction('enableMotionBlur', {
                all3D: true,
                shutterAngle: 180
            });
            addMessage('system', result.success 
                ? `Motion blur: ${result.shutterAngle}°` 
                : `Error: ${result.error}`);
        },
        
        analyzeFrame: async () => {
            addMessage('user', 'Capture and analyze current frame');
            await analyzeCurrentFrame();
        },
        
        cameraTracker: async () => {
            addMessage('user', 'Setup 3D Camera Tracker');
            const result = await executeAction('setup3DCameraTracker', {
                layerIndex: 2
            });
            if (result.success) {
                addMessage('system', result.message);
                addMessage('system', '⚠️ Click "Analyze" in Effect Controls');
            } else {
                addMessage('error', result.error);
            }
        },
        
        shadowCatcher: async () => {
            addMessage('user', 'Add shadow catcher plane');
            const result = await executeAction('addShadowCatcher', {
                position: null, // Use default centered position
                rotationX: 90,
                scale: [200, 200, 100]
            });
            addMessage('system', result.success 
                ? `Shadow catcher: ${result.layer}` 
                : `Error: ${result.error}`);
        }
    };
    
    if (actions[action]) {
        setLoading(true);
        await actions[action]();
        setLoading(false);
        await refreshCompInfo();
    }
}

// ============================================
// WORKFLOWS
// ============================================

async function handleWorkflow(workflow) {
    if (workflow === 'fullTransition') {
        await runFullTransitionWorkflow();
    }
}

async function runFullTransitionWorkflow() {
    addMessage('system', '🎬 Starting Coin Transition Workflow...');
    setLoading(true);
    
    // Step 1: Check what's in the project
    const projectItems = await executeAction('listProjectItems', { type: 'all' });
    
    let videoName = null;
    let modelName = null;
    
    if (projectItems.success && projectItems.items) {
        // Find video and model in project
        for (const item of projectItems.items) {
            if (item.category === 'video' && !videoName) {
                videoName = item.name;
            }
            if (item.category === 'model' && !modelName) {
                modelName = item.name;
            }
        }
    }
    
    // If no assets found, prompt to import
    if (!videoName || !modelName) {
        addMessage('system', '⚠️ Missing assets in project. Please import:');
        if (!videoName) addMessage('system', '  • Video file (.mp4, .mov)');
        if (!modelName) addMessage('system', '  • 3D model file (.glb, .gltf)');
        addMessage('system', '💡 Click "Import" to add files, then run workflow again.');
        setLoading(false);
        return;
    }
    
    addMessage('system', `📁 Found: ${videoName} + ${modelName}`);
    
    const result = await executeAction('createCoinTransition', {
        footageName: videoName,
        modelName: modelName,
        compName: 'AI Coin Transition',
        startScale: [10, 10, 10],
        endScale: [100, 100, 100],
        rotations: 2,
        enableDOF: false
    });
    
    setLoading(false);
    
    if (result.success) {
        addMessage('system', '✓ ' + result.message);
        
        if (result.steps) {
            const completed = result.steps.filter(s => s.result && s.result.success);
            addMessage('system', `Completed ${completed.length}/${result.steps.length} steps`);
        }
        
        addMessage('system', `📋 Next: Apply 3D Camera Tracker to footage`);
    } else {
        addMessage('error', `Workflow failed: ${result.errors ? result.errors.join(', ') : 'Unknown error'}`);
    }
    
    await refreshCompInfo();
}

// ============================================
// AI FRAME ANALYSIS
// ============================================

async function analyzeCurrentFrame() {
    addMessage('system', '📸 Capturing frame (optimized)...');
    
    // Use optimized capture with downscaling for faster AI processing
    const captureResult = await executeAction('captureFrameOptimized', {
        maxWidth: 1280,
        maxHeight: 720,
        format: 'jpg'
    });
    
    if (!captureResult.success) {
        addMessage('error', `Capture failed: ${captureResult.error}`);
        return;
    }
    
    const sizeInfo = captureResult.downscaled 
        ? `${captureResult.width}×${captureResult.height} (from ${captureResult.originalSize[0]}×${captureResult.originalSize[1]})`
        : `${captureResult.width}×${captureResult.height}`;
    addMessage('system', `Frame: ${sizeInfo}`);
    
    if (typeof require !== 'undefined') {
        try {
            const fs = require('fs');
            const imageBuffer = fs.readFileSync(captureResult.framePath);
            const base64Image = imageBuffer.toString('base64');
            
            addMessage('system', '🔍 Analyzing with AI...');
            const analysis = await aiClient.analyzeFrame(base64Image, 'full');
            
            if (analysis.success) {
                addMessage('assistant', analysis.content);
                
                if (analysis.analysis) {
                    await applyAnalysisResults(analysis.analysis);
                }
            } else {
                addMessage('error', `Analysis failed: ${analysis.error}`);
            }
            
            // Clean up temp file
            try { fs.unlinkSync(captureResult.framePath); } catch (e) {}
        } catch (e) {
            addMessage('error', `File read error: ${e.message}`);
        }
    } else {
        addMessage('system', '⚠️ Frame analysis requires Node.js. File: ' + captureResult.framePath);
    }
}

async function applyAnalysisResults(analysis) {
    if (!analysis) return;
    
    addMessage('system', '⚡ Applying AI recommendations...');
    
    // Auto-position coin based on AI detection
    if (analysis.coinPosition) {
        const posResult = await executeAction('positionFromAnalysis', {
            layerIndex: 1,
            analysis: analysis,
            baseScale: 100,
            adjustLighting: true
        });
        if (posResult.success) {
            addMessage('system', `📍 Coin positioned at [${Math.round(posResult.position[0])}, ${Math.round(posResult.position[1])}]`);
        }
    } else {
        // Fallback: apply lighting separately if no coin position
        if (analysis.lighting) {
            const lightConfig = convertLightingAnalysis(analysis.lighting);
            await executeAction('addLightRig', lightConfig);
        }
    }
    
    if (analysis.colorGrade) {
        const colorConfig = convertColorAnalysis(analysis.colorGrade);
        await executeAction('applyColorMatch', {
            layerIndex: 1,
            ...colorConfig
        });
    }
    
    addMessage('system', '✓ AI recommendations applied');
}

function convertLightingAnalysis(lighting) {
    const directionMap = {
        'left': [-500, 0, -800],
        'right': [500, 0, -800],
        'top': [0, -500, -800],
        'bottom': [0, 500, -800],
        'front': [0, 0, -1000],
        'back': [0, 0, 500]
    };
    
    const position = directionMap[lighting.direction] || directionMap.right;
    const intensity = lighting.intensity === 'high' ? 120 : lighting.intensity === 'low' ? 60 : 100;
    
    return {
        keyLight: {
            position: position,
            intensity: intensity,
            color: lighting.color ? [lighting.color.r/255, lighting.color.g/255, lighting.color.b/255] : [1, 0.98, 0.95],
            shadowDarkness: 50
        }
    };
}

function convertColorAnalysis(colorGrade) {
    return {
        exposure: colorGrade.exposure || 0,
        gamma: colorGrade.contrast === 'high' ? 0.9 : colorGrade.contrast === 'low' ? 1.1 : 1.0
    };
}

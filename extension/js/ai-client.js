class AIClient {
    constructor(config) {
        this.apiUrl = config.API_URL;
        this.apiKey = config.API_KEY;
        this.models = config.MODELS;
        this.conversationHistory = [];
    }

    async testConnection() {
        try {
            const response = await fetch(`${this.apiUrl}/models`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            return { success: true, models: data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async chat(message, model = 'text') {
        const modelId = this.models[model] || this.models.text;
        
        // Add user message to history
        this.conversationHistory.push({
            role: 'user',
            content: message
        });
        
        // Keep last 10 messages for context
        if (this.conversationHistory.length > 10) {
            this.conversationHistory = this.conversationHistory.slice(-10);
        }
        
        try {
            const response = await fetch(`${this.apiUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: modelId,
                    messages: [
                        {
                            role: 'system',
                            content: this.getSystemPrompt()
                        },
                        ...this.conversationHistory
                    ],
                    temperature: 0.7,
                    max_tokens: 2048
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            const assistantMessage = data.choices[0].message.content;
            
            // Add assistant response to history
            this.conversationHistory.push({
                role: 'assistant',
                content: assistantMessage
            });
            
            return {
                success: true,
                content: assistantMessage,
                usage: data.usage
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async analyzeFrame(base64Image, analysisType = 'full') {
        const prompts = {
            full: `Analyze this video frame for VFX integration. Return a JSON object with:
{
    "coinPosition": { "x": 0-100, "y": 0-100, "size": "small|medium|large" },
    "lighting": {
        "direction": "left|right|top|bottom|front|back",
        "intensity": "low|medium|high",
        "color": { "r": 0-255, "g": 0-255, "b": 0-255 },
        "temperature": "warm|neutral|cool"
    },
    "colorGrade": {
        "exposure": -2 to 2,
        "contrast": "low|medium|high",
        "saturation": "desaturated|normal|saturated",
        "dominantColors": ["#hex1", "#hex2"]
    },
    "camera": {
        "focalLength": "wide|normal|telephoto",
        "depthOfField": "shallow|medium|deep",
        "angle": "low|eye-level|high"
    },
    "recommendations": ["suggestion1", "suggestion2"]
}`,
            coin: `Detect the coin in this frame. Return JSON:
{
    "detected": true/false,
    "position": { "x": pixel, "y": pixel },
    "size": { "width": pixel, "height": pixel },
    "confidence": 0-1
}`,
            lighting: `Analyze the lighting in this frame for 3D matching. Return JSON:
{
    "keyLight": { "direction": [x,y,z], "intensity": 0-100, "color": [r,g,b] },
    "fillLight": { "direction": [x,y,z], "intensity": 0-100, "color": [r,g,b] },
    "ambientLevel": 0-100,
    "shadowHardness": "soft|medium|hard"
}`,
            color: `Analyze colors for grading a 3D element to match. Return JSON:
{
    "levels": { "inputBlack": 0-255, "inputWhite": 0-255, "gamma": 0.1-3 },
    "temperature": -100 to 100,
    "tint": -100 to 100,
    "exposure": -2 to 2
}`
        };
        
        try {
            const response = await fetch(`${this.apiUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.models.vision,
                    messages: [
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'image_url',
                                    image_url: {
                                        url: `data:image/png;base64,${base64Image}`
                                    }
                                },
                                {
                                    type: 'text',
                                    text: prompts[analysisType] || prompts.full
                                }
                            ]
                        }
                    ],
                    max_tokens: 1024
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            const content = data.choices[0].message.content;
            
            // Try to parse JSON from response
            const analysis = this.extractJSON(content);
            
            return {
                success: true,
                content: content,
                analysis: analysis
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    extractJSON(text) {
        try {
            // Try to find JSON in the response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            // Parsing failed
        }
        return null;
    }

    async generateAECommand(task, context = {}) {
        const prompt = `Based on this task and context, generate the appropriate After Effects command.

Task: ${task}

Context:
- Composition: ${context.compName || 'unknown'}
- Size: ${context.width || 1920}x${context.height || 1080}
- Current layers: ${JSON.stringify(context.layers || [])}
- AI Analysis: ${JSON.stringify(context.analysis || {})}

Return a JSON object with:
{
    "action": "actionName",
    "params": { ... },
    "explanation": "Brief description",
    "followUp": ["next step 1", "next step 2"]
}

Available actions: importAssets, createComp, setupAdvanced3D, import3DModel, setup3DLayer, addCamera, addLightRig, setupShadows, enableMotionBlur, setupDOF, animateCoin, applyColorMatch, captureFrame, setup3DCameraTracker, linkToTrackPoint, createCoinTransition`;

        return this.chat(prompt);
    }

    clearHistory() {
        this.conversationHistory = [];
    }

    getSystemPrompt() {
        return `You are an AI assistant for Adobe After Effects 2026, specializing in VFX automation.

Your role is to help users automate coin replacement VFX workflows. AE 2026 features you can use:
- Advanced 3D Renderer for native .glb/.gltf support
- 3D Camera Tracker for scene integration
- Native 3D lights with shadows
- Depth of Field on cameras
- Motion blur

When responding to tasks, return a JSON command when appropriate:
{
    "action": "actionName",
    "params": { ... parameters for the action ... },
    "explanation": "What this will do",
    "manualSteps": ["Steps user must do manually"],
    "followUp": ["Suggested next actions"]
}

Available actions and their params:

1. createComp: { name, width, height, duration, fps, fromFootage }
2. setupAdvanced3D: {} - Enable Advanced 3D renderer
3. import3DModel: { path, addToComp }
4. setup3DLayer: { layerIndex, position, scale, rotation, material: { castsShadows, acceptsLights, specular, metal } }
5. addCamera: { name, focalLength, position, enableDOF, focusDistance, aperture }
6. addLightRig: { keyLight, fillLight, rimLight, ambient } - Each light: { position, intensity, color, shadowDarkness }
7. animateCoin: { layerIndex, startTime, duration, startScale, endScale, rotations, wobble, easing }
8. enableMotionBlur: { all3D, shutterAngle }
9. setupDOF: { focusDistance, aperture, blurLevel }
10. applyColorMatch: { layerIndex, inputBlack, inputWhite, gamma, temperature, exposure }
11. captureFrame: { time, outputFolder } - Capture frame for AI analysis
12. captureFrameOptimized: { time, maxWidth, maxHeight, format } - Capture downscaled frame (default 1280x720 JPEG)
13. setup3DCameraTracker: { layerIndex } - Apply tracker (user must click Analyze)
14. linkToTrackPoint: { coinLayerIndex } - Link coin to tracked null
15. createCoinTransition: { footageName, modelPath, compName, coinPosition, startScale, endScale, rotations, enableDOF }
16. addShadowCatcher: { name, position, rotationX, scale } - Add floor plane to catch shadows
17. positionFromAnalysis: { layerIndex, analysis, baseScale, zDepth } - Position coin from AI vision analysis

If the task doesn't map to an action, respond conversationally with guidance.

For complex workflows, break them into steps and explain what requires manual intervention (like 3D Camera Tracker analysis).`;
    }
}

const aiClient = new AIClient(CONFIG);

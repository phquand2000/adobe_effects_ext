// ============================================
// SERVICE: Workflow Templates
// Pre-built action sequences for common tasks
// ============================================

var WorkflowTemplates = (function() {
    
    /**
     * Template definitions
     * Each template has: name, description, level, actions[]
     * Actions can have conditional logic based on params
     */
    var templates = {
        
        // ============================================
        // BASIC LEVEL WORKFLOWS
        // ============================================
        
        basicTextIntro: {
            name: 'Basic Text Intro',
            description: 'Simple fade-in text animation',
            level: 'basic',
            actions: [
                { action: 'createComp', params: { name: '{{compName}}', width: 1920, height: 1080, duration: 5, frameRate: 30 } },
                { action: 'addTextLayer', params: { text: '{{text}}', fontSize: 120, position: [960, 540] } },
                { action: 'animateProperty', params: { layerIndex: 1, property: 'Opacity', startValue: 0, endValue: 100, startTime: 0, endTime: 1 } }
            ]
        },
        
        basicSlideshow: {
            name: 'Basic Slideshow',
            description: 'Simple image slideshow with crossfade',
            level: 'basic',
            requiresFootage: true,
            actions: [
                { action: 'createComp', params: { name: '{{compName}}', width: 1920, height: 1080, duration: '{{duration}}', frameRate: 30 } },
                // Images added manually, then:
                { action: 'animateProperty', params: { layerIndex: 1, property: 'Opacity', startValue: 0, endValue: 100, startTime: 0, endTime: 0.5 } }
            ]
        },
        
        // ============================================
        // INTERMEDIATE LEVEL WORKFLOWS
        // ============================================
        
        lowerThird: {
            name: 'Lower Third',
            description: 'Animated lower third with name and title',
            level: 'intermediate',
            actions: [
                { action: 'createComp', params: { name: '{{compName}}', width: 1920, height: 1080, duration: 5, frameRate: 30 } },
                { action: 'addShapeLayer', params: { name: 'Background', shape: 'rectangle', size: [600, 80], position: [350, 900], color: [0.1, 0.1, 0.1] } },
                { action: 'addTextLayer', params: { text: '{{name}}', fontSize: 36, position: [350, 880], color: [1, 1, 1] } },
                { action: 'addTextLayer', params: { text: '{{title}}', fontSize: 24, position: [350, 920], color: [0.7, 0.7, 0.7] } },
                { action: 'addTrimPaths', params: { layerName: 'Background' } },
                { action: 'animateProperty', params: { layerName: 'Background', property: 'Contents.Rectangle 1.Trim Paths 1.End', startValue: 0, endValue: 100, startTime: 0, endTime: 0.5 } }
            ]
        },
        
        logoReveal: {
            name: 'Logo Reveal',
            description: 'Logo with glow and scale animation',
            level: 'intermediate',
            requiresFootage: true,
            actions: [
                { action: 'createComp', params: { name: '{{compName}}', width: 1920, height: 1080, duration: 4, frameRate: 30 } },
                // Logo added as layer 1
                { action: 'animateProperty', params: { layerIndex: 1, property: 'Scale', startValue: [50, 50], endValue: [100, 100], startTime: 0, endTime: 1.5 } },
                { action: 'animateProperty', params: { layerIndex: 1, property: 'Opacity', startValue: 0, endValue: 100, startTime: 0, endTime: 0.5 } },
                { action: 'applyGlow', params: { layerIndex: 1, radius: 50, intensity: 1.5 } }
            ]
        },
        
        greenScreenBasic: {
            name: 'Green Screen Removal',
            description: 'Basic chroma key with cleanup',
            level: 'intermediate',
            requiresFootage: true,
            actions: [
                { action: 'getCompInfo', params: {} },
                { action: 'applyKeyingPreset', params: { layerIndex: 1, preset: 'greenScreen' } },
                { action: 'applySpillSuppressor', params: { layerIndex: 1 } }
            ]
        },
        
        // ============================================
        // ADVANCED LEVEL WORKFLOWS
        // ============================================
        
        scene3DSetup: {
            name: '3D Scene Setup',
            description: 'Full 3D scene with camera and lighting',
            level: 'advanced',
            actions: [
                { action: 'createComp', params: { name: '{{compName}}', width: 1920, height: 1080, duration: 10, frameRate: 30 } },
                { action: 'setupAdvanced3D', params: {} },
                { action: 'addCamera', params: { preset: '35mm' } },
                { action: 'setupDOF', params: { aperture: 50, blurLevel: 100 } },
                { action: 'addLightRig', params: { includeRim: true } },
                { action: 'setupShadows', params: {} },
                { action: 'addShadowCatcher', params: { rotationX: 90 } }
            ]
        },
        
        parallaxSlideshow: {
            name: 'Parallax Slideshow',
            description: '3D parallax effect for photos',
            level: 'advanced',
            requiresFootage: true,
            actions: [
                { action: 'createComp', params: { name: '{{compName}}', width: 1920, height: 1080, duration: 15, frameRate: 30 } },
                { action: 'setupAdvanced3D', params: {} },
                // Images at different Z positions
                { action: 'setup3DLayer', params: { layerIndex: 1 } },
                { action: 'setProperty', params: { layerIndex: 1, property: 'Position', value: [960, 540, 0] } },
                { action: 'addCamera', params: { preset: '50mm' } },
                { action: 'animateProperty', params: { layerName: 'Camera 1', property: 'Position', startValue: [960, 540, -1500], endValue: [960, 540, -800], startTime: 0, endTime: 10 } }
            ]
        },
        
        textAnimatorReveal: {
            name: 'Text Animator Reveal',
            description: 'Character-by-character text animation',
            level: 'advanced',
            actions: [
                { action: 'createComp', params: { name: '{{compName}}', width: 1920, height: 1080, duration: 5, frameRate: 30 } },
                { action: 'addTextLayer', params: { text: '{{text}}', fontSize: 100, position: [960, 540] } },
                { action: 'addTextAnimator', params: { layerIndex: 1, property: 'opacity' } },
                { action: 'addRangeSelector', params: { layerIndex: 1, animatorIndex: 1, start: 0, end: 0 } },
                { action: 'animateProperty', params: { layerIndex: 1, property: 'Text.Animator 1.Range Selector 1.End', startValue: 0, endValue: 100, startTime: 0, endTime: 2 } },
                { action: 'addTextAnimator', params: { layerIndex: 1, property: 'position' } },
                { action: 'setProperty', params: { layerIndex: 1, property: 'Text.Animator 2.Position', value: [0, 50] } }
            ]
        },
        
        // ============================================
        // PROFESSIONAL LEVEL WORKFLOWS
        // ============================================
        
        colorGradePro: {
            name: 'Professional Color Grade',
            description: 'Full color grading pipeline',
            level: 'professional',
            requiresFootage: true,
            actions: [
                { action: 'getCompInfo', params: {} },
                { action: 'applyLumetri', params: { layerIndex: 1, exposure: '{{exposure}}', contrast: '{{contrast}}' } },
                { action: 'applyCurves', params: { layerIndex: 1 } },
                { action: 'applyVibrance', params: { layerIndex: 1, vibrance: '{{vibrance}}' } },
                { action: 'applyAddGrain', params: { layerIndex: 1, intensity: 0.3, size: 1.2 } }
            ]
        },
        
        motionGraphicsIntro: {
            name: 'Motion Graphics Intro',
            description: 'Complex shape-based intro animation',
            level: 'professional',
            actions: [
                { action: 'createComp', params: { name: '{{compName}}', width: 1920, height: 1080, duration: 6, frameRate: 30 } },
                // Background
                { action: 'addShapeLayer', params: { name: 'BG', shape: 'rectangle', size: [1920, 1080], position: [960, 540], color: [0.05, 0.05, 0.1] } },
                // Animated shapes
                { action: 'addShapeLayer', params: { name: 'Circle 1', shape: 'ellipse', size: [200, 200], position: [960, 540], color: [0.2, 0.4, 1] } },
                { action: 'addTrimPaths', params: { layerName: 'Circle 1' } },
                { action: 'animateProperty', params: { layerName: 'Circle 1', property: 'Contents.Ellipse 1.Trim Paths 1.End', startValue: 0, endValue: 100, startTime: 0.5, endTime: 1.5 } },
                { action: 'addRepeater', params: { layerName: 'Circle 1', copies: 5 } },
                // Main text
                { action: 'addTextLayer', params: { text: '{{text}}', fontSize: 150, position: [960, 540], color: [1, 1, 1] } },
                { action: 'animateProperty', params: { layerIndex: 1, property: 'Scale', startValue: [0, 0], endValue: [100, 100], startTime: 1, endTime: 2 } },
                { action: 'applyGlow', params: { layerIndex: 1, radius: 30, intensity: 1 } }
            ]
        },
        
        productShowcase: {
            name: 'Product Showcase',
            description: '3D product rotation with lighting',
            level: 'professional',
            requiresFootage: true,
            actions: [
                { action: 'createComp', params: { name: '{{compName}}', width: 1920, height: 1080, duration: 10, frameRate: 30 } },
                { action: 'setupAdvanced3D', params: {} },
                // Product layer
                { action: 'setup3DLayer', params: { layerIndex: 1 } },
                { action: 'addNullController', params: { name: 'Product Control' } },
                { action: 'setup3DLayer', params: { layerName: 'Product Control' } },
                { action: 'parentLayers', params: { childIndex: 1, parentName: 'Product Control' } },
                // Rotation animation
                { action: 'animateProperty', params: { layerName: 'Product Control', property: 'Y Rotation', startValue: 0, endValue: 360, startTime: 0, endTime: 10 } },
                // Lighting
                { action: 'addLightRig', params: { includeRim: true } },
                { action: 'addCamera', params: { preset: '50mm' } },
                { action: 'setupDOF', params: { aperture: 30 } }
            ]
        },
        
        // ============================================
        // VFX LEVEL WORKFLOWS
        // ============================================
        
        screenReplacement: {
            name: 'Screen Replacement',
            description: 'Replace screen content with corner pin',
            level: 'vfx',
            requiresFootage: true,
            actions: [
                { action: 'getCompInfo', params: {} },
                // Background footage layer 2, replacement layer 1
                { action: 'applyCornerPin', params: { layerIndex: 1 } },
                { action: 'applyGlow', params: { layerIndex: 1, radius: 10, intensity: 0.5 } },
                { action: 'setLayerBlendingMode', params: { layerIndex: 1, mode: 'screen' } }
            ]
        },
        
        compositeWithTracking: {
            name: 'Composite with 3D Tracking',
            description: 'Track footage and composite 3D element',
            level: 'vfx',
            requiresFootage: true,
            manualSteps: ['Click "Analyze" on 3D Camera Tracker', 'Create Track Null from tracked points', 'Parent 3D element to Track Null'],
            actions: [
                { action: 'getCompInfo', params: {} },
                { action: 'setup3DCameraTracker', params: { layerIndex: 1 } }
                // Manual: Analyze, create null, parent element
            ]
        },
        
        cleanPlate: {
            name: 'Clean Plate Removal',
            description: 'Remove object using clean plate',
            level: 'vfx',
            requiresFootage: true,
            actions: [
                { action: 'getCompInfo', params: {} },
                // Clean plate on layer 1, main footage layer 2
                { action: 'addMask', params: { layerIndex: 1, shape: 'rectangle' } },
                { action: 'applyExpression', params: { layerIndex: 1, property: 'Mask 1.Mask Feather', expression: '[20, 20]' } }
            ]
        },
        
        stabilizeAndGrade: {
            name: 'Stabilize and Grade',
            description: 'Full VFX cleanup pipeline',
            level: 'vfx',
            requiresFootage: true,
            manualSteps: ['Click "Analyze" on Warp Stabilizer'],
            actions: [
                { action: 'getCompInfo', params: {} },
                { action: 'applyWarpStabilizer', params: { layerIndex: 1 } },
                // After stabilization:
                { action: 'applyLumetri', params: { layerIndex: 1 } },
                { action: 'applyMatchGrain', params: { layerIndex: 1 } }
            ]
        }
    };
    
    /**
     * Get all available templates
     * @returns {Array} Template info objects
     */
    function listTemplates() {
        var result = [];
        for (var key in templates) {
            if (templates.hasOwnProperty(key)) {
                var t = templates[key];
                result.push({
                    id: key,
                    name: t.name,
                    description: t.description,
                    level: t.level,
                    requiresFootage: t.requiresFootage || false,
                    manualSteps: t.manualSteps || []
                });
            }
        }
        return result;
    }
    
    /**
     * Get templates by level
     * @param {string} level - basic, intermediate, advanced, professional, vfx
     * @returns {Array} Template info objects
     */
    function getByLevel(level) {
        var all = listTemplates();
        var result = [];
        for (var i = 0; i < all.length; i++) {
            if (all[i].level === level) {
                result.push(all[i]);
            }
        }
        return result;
    }
    
    /**
     * Get template details
     * @param {string} templateId - Template ID
     * @returns {Object|null} Template or null
     */
    function getTemplate(templateId) {
        return templates[templateId] || null;
    }
    
    /**
     * Execute a template with parameter substitution
     * @param {string} templateId - Template ID
     * @param {Object} params - Parameters to substitute
     * @returns {Object} Execution result
     */
    function executeTemplate(templateId, params) {
        var template = templates[templateId];
        if (!template) {
            return Utils.error('Template not found: ' + templateId);
        }
        
        params = params || {};
        var results = [];
        var errors = [];
        
        for (var i = 0; i < template.actions.length; i++) {
            var actionDef = template.actions[i];
            var actionParams = substituteParams(actionDef.params, params);
            
            try {
                var result = ActionRegistry.execute(actionDef.action, actionParams);
                results.push({
                    action: actionDef.action,
                    result: result
                });
                
                if (result.error) {
                    errors.push(actionDef.action + ': ' + result.error);
                }
            } catch (e) {
                errors.push(actionDef.action + ': ' + e.toString());
            }
        }
        
        return Utils.success({
            template: templateId,
            name: template.name,
            stepsExecuted: results.length,
            results: results,
            errors: errors.length > 0 ? errors : undefined,
            manualSteps: template.manualSteps || undefined
        });
    }
    
    /**
     * Substitute {{param}} placeholders in params object
     * @param {Object} templateParams - Template params with placeholders
     * @param {Object} userParams - User-provided values
     * @returns {Object} Substituted params
     */
    function substituteParams(templateParams, userParams) {
        var result = {};
        for (var key in templateParams) {
            if (templateParams.hasOwnProperty(key)) {
                var value = templateParams[key];
                if (typeof value === 'string' && value.indexOf('{{') !== -1) {
                    // Extract placeholder name
                    var match = value.match(/\{\{(\w+)\}\}/);
                    if (match && userParams[match[1]] !== undefined) {
                        result[key] = userParams[match[1]];
                    } else {
                        result[key] = value; // Keep placeholder if not provided
                    }
                } else if (typeof value === 'object' && value !== null) {
                    // Recursively substitute arrays/objects
                    if (value.length !== undefined) {
                        // Array
                        result[key] = [];
                        for (var j = 0; j < value.length; j++) {
                            if (typeof value[j] === 'string' && value[j].indexOf('{{') !== -1) {
                                var arrMatch = value[j].match(/\{\{(\w+)\}\}/);
                                if (arrMatch && userParams[arrMatch[1]] !== undefined) {
                                    result[key][j] = userParams[arrMatch[1]];
                                } else {
                                    result[key][j] = value[j];
                                }
                            } else {
                                result[key][j] = value[j];
                            }
                        }
                    } else {
                        result[key] = substituteParams(value, userParams);
                    }
                } else {
                    result[key] = value;
                }
            }
        }
        return result;
    }
    
    /**
     * Get suggested next actions based on current state
     * @param {string} lastAction - Last executed action
     * @param {string} layerType - Current layer type
     * @returns {Array} Suggested action names
     */
    function getSuggestions(lastAction, layerType) {
        var suggestions = [];
        
        // Common follow-ups based on last action
        var followUps = {
            createComp: ['importAssets', 'addTextLayer', 'addShapeLayer', 'addCamera'],
            importAssets: ['createComp', 'interpretFootage'],
            addTextLayer: ['addTextAnimator', 'animateProperty', 'applyGlow'],
            addShapeLayer: ['addTrimPaths', 'addRepeater', 'addGradientFill'],
            addCamera: ['setupDOF', 'addLightRig', 'animateFocusRack'],
            addLightRig: ['setupShadows', 'addShadowCatcher'],
            applyKeyingPreset: ['applySpillSuppressor', 'applyKeyCleaner'],
            applyLumetri: ['applyCurves', 'applyVibrance', 'applyAddGrain'],
            setup3DCameraTracker: ['linkToTrackPoint'],
            addToRenderQueue: ['setOutputModule', 'setRenderSettings', 'startRender']
        };
        
        if (followUps[lastAction]) {
            suggestions = suggestions.concat(followUps[lastAction]);
        }
        
        // Add layer-type specific suggestions
        if (layerType) {
            // Normalize solid/precomp to av behavior
            if (layerType === 'solid' || layerType === 'precomp') {
                layerType = 'av';
            }
            
            var compatible = ActionRegistry.getCompatibleActions(layerType);
            // Add top 3 most useful for this layer type
            var priorityActions = {
                text: ['addTextAnimator', 'animateProperty', 'applyGlow'],
                shape: ['addTrimPaths', 'addRepeater', 'addRoundCorners'],
                av: ['applyLumetri', 'applyBlur', 'animateProperty'],
                camera: ['setupDOF', 'animateFocusRack', 'focusOnLayer'],
                light: ['setLightFalloff'],
                'null': ['parentLayers', 'animateProperty', 'applyExpression'],
                '3dmodel': ['precompose', 'setup3DLayer', 'addLightRig']
            };
            
            if (priorityActions[layerType]) {
                for (var i = 0; i < priorityActions[layerType].length; i++) {
                    var action = priorityActions[layerType][i];
                    if (suggestions.indexOf(action) === -1) {
                        suggestions.push(action);
                    }
                }
            }
        }
        
        return suggestions;
    }
    
    return {
        listTemplates: listTemplates,
        getByLevel: getByLevel,
        getTemplate: getTemplate,
        executeTemplate: executeTemplate,
        getSuggestions: getSuggestions
    };
})();

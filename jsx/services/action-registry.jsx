// ============================================
// ACTION REGISTRY
// Maps action names to service methods
// With metadata for AI guidance
// ============================================

var ActionRegistry = (function() {
    
    /**
     * Action handlers registry
     * Each entry contains: { handler, schema, meta }
     */
    var handlers = {};
    
    /**
     * Action metadata definitions
     * layerType: 'any' | 'av' | 'text' | 'shape' | 'camera' | 'light' | 'audio' | 'none'
     * manualStep: string description if manual action required
     * needsComp: true if requires active composition
     * needsLayer: true if requires layer selection
     * category: action category for grouping
     */
    var actionMeta = {
        // ---- Camera ----
        addCamera: { layerType: 'none', needsComp: true, category: 'camera' },
        setupDOF: { layerType: 'camera', needsComp: true, needsLayer: true, category: 'camera' },
        setCameraIris: { layerType: 'camera', needsComp: true, needsLayer: true, category: 'camera' },
        animateFocusRack: { layerType: 'camera', needsComp: true, needsLayer: true, category: 'camera' },
        focusOnLayer: { layerType: 'camera', needsComp: true, needsLayer: true, category: 'camera' },
        
        // ---- Light ----
        addLightRig: { layerType: 'none', needsComp: true, category: 'light' },
        setLightFalloff: { layerType: 'light', needsComp: true, needsLayer: true, category: 'light' },
        addEnvironmentLight: { layerType: 'none', needsComp: true, category: 'light' },
        setupShadows: { layerType: 'any', needsComp: true, category: 'light' },
        
        // ---- Layer ----
        setup3DLayer: { layerType: 'any', needsComp: true, needsLayer: true, category: 'layer' },
        enableMotionBlur: { layerType: 'any', needsComp: true, category: 'layer' },
        addShadowCatcher: { layerType: 'none', needsComp: true, category: 'layer' },
        addNullController: { layerType: 'none', needsComp: true, category: 'layer' },
        parentLayers: { layerType: 'any', needsComp: true, category: 'layer' },
        unparentLayer: { layerType: 'any', needsComp: true, needsLayer: true, category: 'layer' },
        
        // ---- Effects (general - most layers) ----
        applyGlow: { layerType: 'effects', needsComp: true, needsLayer: true, category: 'effect' },
        applyBlur: { layerType: 'effects', needsComp: true, needsLayer: true, category: 'effect' },
        applyLumetri: { layerType: 'effects', needsComp: true, needsLayer: true, category: 'color' },
        applyVibrance: { layerType: 'effects', needsComp: true, needsLayer: true, category: 'color' },
        applyCurves: { layerType: 'effects', needsComp: true, needsLayer: true, category: 'color' },
        addEffect: { layerType: 'effects', needsComp: true, needsLayer: true, category: 'effect' },
        setEffectProperty: { layerType: 'effects', needsComp: true, needsLayer: true, category: 'effect' },
        applyBilateralBlur: { layerType: 'effects', needsComp: true, needsLayer: true, category: 'effect' },
        applyCompoundBlur: { layerType: 'av', needsComp: true, needsLayer: true, category: 'effect' },
        applyVectorBlur: { layerType: 'av', needsComp: true, needsLayer: true, category: 'effect' },
        
        // ---- Noise/Grain (AV only) ----
        applyFractalNoise: { layerType: 'av', needsComp: true, needsLayer: true, category: 'noise' },
        applyAddGrain: { layerType: 'av', needsComp: true, needsLayer: true, category: 'noise' },
        applyMatchGrain: { layerType: 'av', needsComp: true, needsLayer: true, category: 'noise', manualStep: 'Click "Take Sample" in Effect Controls' },
        
        // ---- Keying (AV only) ----
        applyKeylight: { layerType: 'av', needsComp: true, needsLayer: true, category: 'keying' },
        applySpillSuppressor: { layerType: 'av', needsComp: true, needsLayer: true, category: 'keying' },
        applyKeyCleaner: { layerType: 'av', needsComp: true, needsLayer: true, category: 'keying' },
        applyKeyingPreset: { layerType: 'av', needsComp: true, needsLayer: true, category: 'keying' },
        
        // ---- Time (AV only) ----
        applyTimewarp: { layerType: 'av', needsComp: true, needsLayer: true, category: 'time' },
        applyPixelMotionBlur: { layerType: 'av', needsComp: true, needsLayer: true, category: 'time' },
        applyPosterizeTime: { layerType: 'av', needsComp: true, needsLayer: true, category: 'time' },
        
        // ---- Distortion (AV only) ----
        applyWarpStabilizer: { layerType: 'av', needsComp: true, needsLayer: true, category: 'distortion', manualStep: 'Click "Analyze" in Effect Controls' },
        applyCornerPin: { layerType: 'av', needsComp: true, needsLayer: true, category: 'distortion' },
        applyDisplacementMap: { layerType: 'av', needsComp: true, needsLayer: true, category: 'distortion' },
        applyMeshWarp: { layerType: 'av', needsComp: true, needsLayer: true, category: 'distortion' },
        applyBezierWarp: { layerType: 'av', needsComp: true, needsLayer: true, category: 'distortion' },
        
        // ---- Tracking ----
        setup3DCameraTracker: { layerType: 'av', needsComp: true, needsLayer: true, category: 'tracking', manualStep: 'Click "Analyze" in Effect Controls, then create Track Null or Camera' },
        linkToTrackPoint: { layerType: 'any', needsComp: true, category: 'tracking' },
        
        // ---- Generate ----
        applyGradientRamp: { layerType: 'effects', needsComp: true, needsLayer: true, category: 'generate' },
        applyFill: { layerType: 'effects', needsComp: true, needsLayer: true, category: 'generate' },
        apply4ColorGradient: { layerType: 'effects', needsComp: true, needsLayer: true, category: 'generate' },
        
        // ---- Text (text layer only) ----
        addTextLayer: { layerType: 'none', needsComp: true, category: 'text' },
        updateText: { layerType: 'text', needsComp: true, needsLayer: true, category: 'text' },
        addTextAnimator: { layerType: 'text', needsComp: true, needsLayer: true, category: 'text' },
        addRangeSelector: { layerType: 'text', needsComp: true, needsLayer: true, category: 'text' },
        addWigglySelector: { layerType: 'text', needsComp: true, needsLayer: true, category: 'text' },
        setPerCharacter3D: { layerType: 'text', needsComp: true, needsLayer: true, category: 'text' },
        setTextTracking: { layerType: 'text', needsComp: true, needsLayer: true, category: 'text' },
        
        // ---- Shape (shape layer only) ----
        addShapeLayer: { layerType: 'none', needsComp: true, category: 'shape' },
        addTrimPaths: { layerType: 'shape', needsComp: true, needsLayer: true, category: 'shape' },
        addRepeater: { layerType: 'shape', needsComp: true, needsLayer: true, category: 'shape' },
        addGradientFill: { layerType: 'shape', needsComp: true, needsLayer: true, category: 'shape' },
        addGradientStroke: { layerType: 'shape', needsComp: true, needsLayer: true, category: 'shape' },
        addMergePaths: { layerType: 'shape', needsComp: true, needsLayer: true, category: 'shape' },
        addOffsetPaths: { layerType: 'shape', needsComp: true, needsLayer: true, category: 'shape' },
        addRoundCorners: { layerType: 'shape', needsComp: true, needsLayer: true, category: 'shape' },
        addZigZag: { layerType: 'shape', needsComp: true, needsLayer: true, category: 'shape' },
        addPuckerBloat: { layerType: 'shape', needsComp: true, needsLayer: true, category: 'shape' },
        addTwist: { layerType: 'shape', needsComp: true, needsLayer: true, category: 'shape' },
        addWigglePath: { layerType: 'shape', needsComp: true, needsLayer: true, category: 'shape' },
        
        // ---- Property ----
        setProperty: { layerType: 'any', needsComp: true, needsLayer: true, category: 'property' },
        getProperty: { layerType: 'any', needsComp: true, needsLayer: true, category: 'property' },
        addKeyframe: { layerType: 'any', needsComp: true, needsLayer: true, category: 'property' },
        animateProperty: { layerType: 'any', needsComp: true, needsLayer: true, category: 'property' },
        
        // ---- Expression ----
        applyExpression: { layerType: 'any', needsComp: true, needsLayer: true, category: 'expression' },
        removeExpression: { layerType: 'any', needsComp: true, needsLayer: true, category: 'expression' },
        applyExpressionPreset: { layerType: 'any', needsComp: true, needsLayer: true, category: 'expression' },
        
        // ---- Mask ----
        addMask: { layerType: 'visual', needsComp: true, needsLayer: true, category: 'mask' },
        setTrackMatte: { layerType: 'visual', needsComp: true, needsLayer: true, category: 'mask' },
        removeTrackMatte: { layerType: 'visual', needsComp: true, needsLayer: true, category: 'mask' },
        
        // ---- Audio (audio-capable only) ----
        setAudioLevel: { layerType: 'audio', needsComp: true, needsLayer: true, category: 'audio' },
        fadeAudioIn: { layerType: 'audio', needsComp: true, needsLayer: true, category: 'audio' },
        fadeAudioOut: { layerType: 'audio', needsComp: true, needsLayer: true, category: 'audio' },
        muteLayer: { layerType: 'audio', needsComp: true, needsLayer: true, category: 'audio' },
        soloAudio: { layerType: 'audio', needsComp: true, needsLayer: true, category: 'audio' },
        setAudioKeyframe: { layerType: 'audio', needsComp: true, needsLayer: true, category: 'audio' },
        getAudioInfo: { layerType: 'audio', needsComp: true, needsLayer: true, category: 'audio' },
        
        // ---- Layer Utils ----
        duplicateLayer: { layerType: 'any', needsComp: true, needsLayer: true, category: 'layer-utils' },
        splitLayer: { layerType: 'any', needsComp: true, needsLayer: true, category: 'layer-utils' },
        timeRemapLayer: { layerType: 'av', needsComp: true, needsLayer: true, category: 'layer-utils' },
        timeStretchLayer: { layerType: 'any', needsComp: true, needsLayer: true, category: 'layer-utils' },
        setCollapseTransformations: { layerType: 'av', needsComp: true, needsLayer: true, category: 'layer-utils' },
        setLayerBlendingMode: { layerType: 'visual', needsComp: true, needsLayer: true, category: 'layer-utils' },
        setLayerQuality: { layerType: 'any', needsComp: true, needsLayer: true, category: 'layer-utils' },
        freezeFrame: { layerType: 'av', needsComp: true, needsLayer: true, category: 'layer-utils' },
        reverseLayer: { layerType: 'av', needsComp: true, needsLayer: true, category: 'layer-utils' },
        
        // ---- Composition ----
        createComp: { layerType: 'none', needsComp: false, category: 'composition' },
        getCompInfo: { layerType: 'none', needsComp: true, category: 'composition' },
        getProjectInfo: { layerType: 'none', needsComp: false, category: 'project' },
        getRenderers: { layerType: 'none', needsComp: false, category: 'composition' },
        setupAdvanced3D: { layerType: 'none', needsComp: true, category: 'composition' },
        
        // ---- Precomp ----
        precompose: { layerType: 'any', needsComp: true, needsLayer: true, category: 'precomp' },
        duplicateComp: { layerType: 'none', needsComp: true, category: 'precomp' },
        openCompViewer: { layerType: 'none', needsComp: false, category: 'precomp' },
        replaceCompSource: { layerType: 'av', needsComp: true, needsLayer: true, category: 'precomp' },
        nestComp: { layerType: 'none', needsComp: true, category: 'precomp' },
        
        // ---- Import/Footage ----
        importAssets: { layerType: 'none', needsComp: false, category: 'import' },
        importWithDialog: { layerType: 'none', needsComp: false, category: 'import' },
        import3DModel: { layerType: 'none', needsComp: false, category: 'import' },
        listProjectItems: { layerType: 'none', needsComp: false, category: 'import' },
        replaceFootage: { layerType: 'none', needsComp: false, category: 'footage' },
        relinkFootage: { layerType: 'none', needsComp: false, category: 'footage' },
        interpretFootage: { layerType: 'none', needsComp: false, category: 'footage' },
        setProxy: { layerType: 'none', needsComp: false, category: 'footage' },
        collectFiles: { layerType: 'none', needsComp: false, category: 'footage' },
        removeUnused: { layerType: 'none', needsComp: false, category: 'footage' },
        findMissingFootage: { layerType: 'none', needsComp: false, category: 'footage' },
        
        // ---- Render ----
        addToRenderQueue: { layerType: 'none', needsComp: true, category: 'render' },
        listRenderTemplates: { layerType: 'none', needsComp: false, category: 'render' },
        startRender: { layerType: 'none', needsComp: false, category: 'render' },
        captureFrame: { layerType: 'none', needsComp: true, category: 'render' },
        captureFrameOptimized: { layerType: 'none', needsComp: true, category: 'render' },
        setOutputModule: { layerType: 'none', needsComp: false, category: 'render' },
        batchRenderComps: { layerType: 'none', needsComp: false, category: 'render' },
        setRenderRegion: { layerType: 'none', needsComp: true, category: 'render' },
        setRenderSettings: { layerType: 'none', needsComp: false, category: 'render' },
        getRenderStatus: { layerType: 'none', needsComp: false, category: 'render' },
        clearRenderQueue: { layerType: 'none', needsComp: false, category: 'render' },
        
        // ---- MOGRT ----
        exportMOGRT: { layerType: 'none', needsComp: true, category: 'mogrt' },
        addToEssentialGraphics: { layerType: 'any', needsComp: true, category: 'mogrt' },
        
        // ---- Marker ----
        addCompMarker: { layerType: 'none', needsComp: true, category: 'marker' },
        addLayerMarker: { layerType: 'any', needsComp: true, needsLayer: true, category: 'marker' },
        getCompMarkers: { layerType: 'none', needsComp: true, category: 'marker' },
        getLayerMarkers: { layerType: 'any', needsComp: true, needsLayer: true, category: 'marker' },
        removeMarker: { layerType: 'any', needsComp: true, category: 'marker' },
        updateMarker: { layerType: 'any', needsComp: true, category: 'marker' },
        addMarkersFromArray: { layerType: 'any', needsComp: true, category: 'marker' },
        
        // ---- Color ----
        setProjectColorDepth: { layerType: 'none', needsComp: false, category: 'color' },
        setProjectWorkingSpace: { layerType: 'none', needsComp: false, category: 'color' },
        applyLUT: { layerType: 'effects', needsComp: true, needsLayer: true, category: 'color' },
        applyColorProfileConverter: { layerType: 'effects', needsComp: true, needsLayer: true, category: 'color' },
        setLinearizeWorkingSpace: { layerType: 'none', needsComp: false, category: 'color' },
        setCompensateForSceneReferredProfiles: { layerType: 'none', needsComp: false, category: 'color' },
        applyColorBalance: { layerType: 'effects', needsComp: true, needsLayer: true, category: 'color' },
        applyPhotoFilter: { layerType: 'effects', needsComp: true, needsLayer: true, category: 'color' },
        
        // ---- Project ----
        getProjectSettings: { layerType: 'none', needsComp: false, category: 'project' },
        setProjectSettings: { layerType: 'none', needsComp: false, category: 'project' },
        saveProject: { layerType: 'none', needsComp: false, category: 'project' },
        closeProject: { layerType: 'none', needsComp: false, category: 'project' },
        createFolder: { layerType: 'none', needsComp: false, category: 'project' },
        organizeProjectItems: { layerType: 'none', needsComp: false, category: 'project' },
        getProjectReport: { layerType: 'none', needsComp: false, category: 'project' },
        reduceProject: { layerType: 'none', needsComp: false, category: 'project' },
        
        // ---- Workflow ----
        animateCoin: { layerType: 'any', needsComp: true, needsLayer: true, category: 'workflow' },
        createCoinTransition: { layerType: 'none', needsComp: false, category: 'workflow' },
        positionFromAnalysis: { layerType: 'any', needsComp: true, needsLayer: true, category: 'workflow' },
        applyColorMatch: { layerType: 'av', needsComp: true, needsLayer: true, category: 'workflow' },
        
        // ---- Test ----
        testScript: { layerType: 'none', needsComp: false, category: 'test' }
    };
    
    /**
     * Register an action handler
     * @param {string} name - Action name
     * @param {function} handler - Handler function
     * @param {Object} [schema] - Parameter validation schema
     */
    function register(name, handler, schema) {
        handlers[name] = {
            handler: handler,
            schema: schema || null,
            meta: actionMeta[name] || { layerType: 'any', category: 'unknown' }
        };
    }
    
    /**
     * Execute an action with optional layer type validation
     * @param {string} actionName - Action name
     * @param {Object} params - Action parameters
     * @returns {Object} Result
     */
    function execute(actionName, params) {
        var action = handlers[actionName];
        if (!action) {
            return { error: 'Unknown action: ' + actionName };
        }
        
        // Validate parameters if schema exists
        if (action.schema) {
            var errors = Utils.validateParams(params, action.schema);
            if (errors) {
                return { error: errors.join(', ') };
            }
        }
        
        return action.handler(params);
    }
    
    /**
     * Execute with layer type validation
     * @param {string} actionName - Action name
     * @param {Object} params - Action parameters
     * @returns {Object} Result with potential warnings
     */
    function executeWithValidation(actionName, params) {
        var action = handlers[actionName];
        if (!action) {
            return { error: 'Unknown action: ' + actionName };
        }
        
        var meta = action.meta;
        var warnings = [];
        
        // Validate layer type if action needs a layer
        if (meta.needsLayer && (params.layerIndex || params.layerName)) {
            var compResult = CompositionData.getActiveComp();
            if (!compResult.error) {
                var layerResult = LayerData.getLayer(compResult.comp, params);
                if (!layerResult.error) {
                    var caps = LayerData.getLayerCapabilities(layerResult.layer);
                    var valid = validateLayerType(meta.layerType, caps);
                    if (!valid.allowed) {
                        return { error: valid.reason };
                    }
                    if (valid.warning) {
                        warnings.push(valid.warning);
                    }
                }
            }
        }
        
        var result = action.handler(params);
        
        // Add manual step warning if applicable
        if (meta.manualStep && result.success) {
            result.manualStep = meta.manualStep;
            warnings.push(meta.manualStep);
        }
        
        if (warnings.length > 0) {
            result.warnings = warnings;
        }
        
        return result;
    }
    
    /**
     * Validate layer type against action requirement
     * @param {string} requiredType - Required layer type from metadata
     * @param {Object} caps - Layer capabilities from getLayerCapabilities
     * @returns {Object} { allowed, reason, warning }
     */
    function validateLayerType(requiredType, caps) {
        var type = caps.type;
        
        switch (requiredType) {
            case 'none':
                return { allowed: true };
            case 'any':
                return { allowed: true };
            case 'av':
                if (type === 'av' || type === 'solid' || type === 'precomp') {
                    return { allowed: true };
                }
                return { allowed: false, reason: 'This action requires an AV layer (footage, solid, or precomp). Current layer type: ' + type };
            case 'text':
                if (type === 'text') return { allowed: true };
                return { allowed: false, reason: 'This action requires a text layer. Current layer type: ' + type };
            case 'shape':
                if (type === 'shape') return { allowed: true };
                return { allowed: false, reason: 'This action requires a shape layer. Current layer type: ' + type };
            case 'camera':
                if (type === 'camera') return { allowed: true };
                return { allowed: false, reason: 'This action requires a camera layer. Current layer type: ' + type };
            case 'light':
                if (type === 'light') return { allowed: true };
                return { allowed: false, reason: 'This action requires a light layer. Current layer type: ' + type };
            case 'audio':
                if (caps.hasAudio) return { allowed: true };
                return { allowed: false, reason: 'This action requires a layer with audio. Current layer has no audio.' };
            case 'effects':
                if (caps.supportsEffects) return { allowed: true };
                return { allowed: false, reason: 'This action requires a layer that supports effects. Current layer type: ' + type };
            case 'visual':
                if (type !== 'camera' && type !== 'light') return { allowed: true };
                return { allowed: false, reason: 'This action cannot be applied to camera or light layers.' };
            default:
                return { allowed: true };
        }
    }
    
    /**
     * Check if action exists
     * @param {string} name - Action name
     * @returns {boolean} True if action exists
     */
    function exists(name) {
        return handlers.hasOwnProperty(name);
    }
    
    /**
     * Get list of registered actions
     * @returns {Array} Action names
     */
    function list() {
        var names = [];
        for (var name in handlers) {
            if (handlers.hasOwnProperty(name)) {
                names.push(name);
            }
        }
        return names;
    }
    
    /**
     * Get action metadata
     * @param {string} name - Action name
     * @returns {Object|null} Metadata or null
     */
    function getMeta(name) {
        if (handlers[name]) {
            return handlers[name].meta;
        }
        return actionMeta[name] || null;
    }
    
    /**
     * Get actions by category
     * @param {string} category - Category name
     * @returns {Array} Action names in category
     */
    function getByCategory(category) {
        var result = [];
        for (var name in handlers) {
            if (handlers.hasOwnProperty(name)) {
                var meta = handlers[name].meta;
                if (meta && meta.category === category) {
                    result.push(name);
                }
            }
        }
        return result;
    }
    
    /**
     * Get actions that work with a specific layer type
     * @param {string} layerType - Layer type from getLayerType()
     * @returns {Array} Compatible action names
     */
    function getCompatibleActions(layerType) {
        var result = [];
        for (var name in handlers) {
            if (handlers.hasOwnProperty(name)) {
                var meta = handlers[name].meta;
                if (!meta) continue;
                
                var reqType = meta.layerType;
                if (reqType === 'none' || reqType === 'any') {
                    result.push(name);
                } else if (reqType === 'av' && (layerType === 'av' || layerType === 'solid' || layerType === 'precomp')) {
                    result.push(name);
                } else if (reqType === layerType) {
                    result.push(name);
                } else if (reqType === 'effects' && layerType !== 'camera' && layerType !== 'light') {
                    result.push(name);
                } else if (reqType === 'visual' && layerType !== 'camera' && layerType !== 'light') {
                    result.push(name);
                }
            }
        }
        return result;
    }
    
    /**
     * Get all categories
     * @returns {Array} Category names
     */
    function getCategories() {
        var cats = {};
        for (var name in actionMeta) {
            if (actionMeta.hasOwnProperty(name) && actionMeta[name].category) {
                cats[actionMeta[name].category] = true;
            }
        }
        var result = [];
        for (var cat in cats) {
            result.push(cat);
        }
        return result;
    }
    
    return {
        register: register,
        execute: execute,
        executeWithValidation: executeWithValidation,
        exists: exists,
        list: list,
        getMeta: getMeta,
        getByCategory: getByCategory,
        getCompatibleActions: getCompatibleActions,
        getCategories: getCategories
    };
})();

// ============================================
// REGISTER ALL ACTIONS
// ============================================

(function registerActions() {
    
    // ---- Camera actions ----
    ActionRegistry.register('addCamera', CameraService.addCamera);
    ActionRegistry.register('setupDOF', CameraService.setupDOF);
    ActionRegistry.register('setCameraIris', CameraService.setCameraIris);
    ActionRegistry.register('animateFocusRack', CameraService.animateFocusRack);
    ActionRegistry.register('focusOnLayer', CameraService.focusOnLayer);
    
    // ---- Light actions ----
    ActionRegistry.register('addLightRig', LightService.addLightRig);
    ActionRegistry.register('setLightFalloff', LightService.setLightFalloff);
    ActionRegistry.register('addEnvironmentLight', LightService.addEnvironmentLight);
    ActionRegistry.register('setupShadows', LightService.setupShadows);
    
    // ---- Layer actions ----
    ActionRegistry.register('setup3DLayer', LayerService.setup3DLayer);
    ActionRegistry.register('enableMotionBlur', LayerService.enableMotionBlur);
    ActionRegistry.register('addShadowCatcher', LayerService.addShadowCatcher);
    ActionRegistry.register('addNullController', LayerService.addNullController);
    ActionRegistry.register('parentLayers', LayerService.parentLayers);
    ActionRegistry.register('unparentLayer', LayerService.unparentLayer);
    
    // ---- Effect actions ----
    ActionRegistry.register('applyGlow', EffectService.applyGlow);
    ActionRegistry.register('applyBlur', EffectService.applyBlur);
    ActionRegistry.register('applyLumetri', EffectService.applyLumetri);
    ActionRegistry.register('applyVibrance', EffectService.applyVibrance);
    ActionRegistry.register('applyCurves', EffectService.applyCurves);
    ActionRegistry.register('addEffect', EffectService.addEffect);
    ActionRegistry.register('setEffectProperty', EffectService.setEffectProperty);
    ActionRegistry.register('applyBilateralBlur', EffectService.applyBilateralBlur);
    ActionRegistry.register('applyCompoundBlur', EffectService.applyCompoundBlur);
    ActionRegistry.register('applyVectorBlur', EffectService.applyVectorBlur);
    
    // ---- Import actions ----
    ActionRegistry.register('importAssets', ImportService.importAssets);
    ActionRegistry.register('importWithDialog', ImportService.importWithDialog);
    ActionRegistry.register('import3DModel', ImportService.import3DModel);
    ActionRegistry.register('listProjectItems', ImportService.listProjectItems);
    
    // ---- Composition actions ----
    ActionRegistry.register('createComp', CompositionService.createComp);
    ActionRegistry.register('getCompInfo', CompositionService.getCompInfo);
    ActionRegistry.register('getProjectInfo', CompositionService.getProjectInfo);
    ActionRegistry.register('getRenderers', CompositionService.getRenderers);
    ActionRegistry.register('setupAdvanced3D', CompositionService.setupAdvanced3D);
    
    // ---- Text actions ----
    ActionRegistry.register('addTextLayer', TextService.addTextLayer);
    ActionRegistry.register('updateText', TextService.updateText);
    
    // ---- Shape actions ----
    ActionRegistry.register('addShapeLayer', ShapeService.addShapeLayer);
    ActionRegistry.register('addTrimPaths', ShapeService.addTrimPaths);
    ActionRegistry.register('addRepeater', ShapeService.addRepeater);
    ActionRegistry.register('addGradientFill', ShapeService.addGradientFill);
    ActionRegistry.register('addGradientStroke', ShapeService.addGradientStroke);
    
    // ---- Keying actions ----
    ActionRegistry.register('applyKeylight', KeyingService.applyKeylight);
    ActionRegistry.register('applySpillSuppressor', KeyingService.applySpillSuppressor);
    ActionRegistry.register('applyKeyCleaner', KeyingService.applyKeyCleaner);
    ActionRegistry.register('applyKeyingPreset', KeyingService.applyKeyingPreset);
    
    // ---- Time actions ----
    ActionRegistry.register('applyTimewarp', TimeService.applyTimewarp);
    ActionRegistry.register('applyPixelMotionBlur', TimeService.applyPixelMotionBlur);
    ActionRegistry.register('applyPosterizeTime', TimeService.applyPosterizeTime);
    
    // ---- Distortion actions ----
    ActionRegistry.register('applyWarpStabilizer', DistortionService.applyWarpStabilizer);
    ActionRegistry.register('applyCornerPin', DistortionService.applyCornerPin);
    ActionRegistry.register('applyDisplacementMap', DistortionService.applyDisplacementMap);
    ActionRegistry.register('applyMeshWarp', DistortionService.applyMeshWarp);
    ActionRegistry.register('applyBezierWarp', DistortionService.applyBezierWarp);
    
    // ---- Noise/Grain actions ----
    ActionRegistry.register('applyFractalNoise', NoiseService.applyFractalNoise);
    ActionRegistry.register('applyMatchGrain', NoiseService.applyMatchGrain);
    ActionRegistry.register('applyAddGrain', NoiseService.applyAddGrain);
    
    // ---- Generate actions ----
    ActionRegistry.register('applyGradientRamp', GenerateService.applyGradientRamp);
    ActionRegistry.register('applyFill', GenerateService.applyFill);
    ActionRegistry.register('apply4ColorGradient', GenerateService.apply4ColorGradient);
    
    // ---- Property actions ----
    ActionRegistry.register('setProperty', PropertyService.setProperty);
    ActionRegistry.register('getProperty', PropertyService.getProperty);
    ActionRegistry.register('addKeyframe', PropertyService.addKeyframe);
    ActionRegistry.register('animateProperty', PropertyService.animateProperty);
    
    // ---- Mask actions ----
    ActionRegistry.register('addMask', MaskService.addMask);
    ActionRegistry.register('setTrackMatte', MaskService.setTrackMatte);
    ActionRegistry.register('removeTrackMatte', MaskService.removeTrackMatte);
    
    // ---- Expression actions ----
    ActionRegistry.register('applyExpression', ExpressionService.applyExpression);
    ActionRegistry.register('removeExpression', ExpressionService.removeExpression);
    ActionRegistry.register('applyExpressionPreset', ExpressionService.applyExpressionPreset);
    
    // ---- Render actions ----
    ActionRegistry.register('addToRenderQueue', RenderService.addToRenderQueue);
    ActionRegistry.register('listRenderTemplates', RenderService.listRenderTemplates);
    ActionRegistry.register('startRender', RenderService.startRender);
    ActionRegistry.register('captureFrame', RenderService.captureFrame);
    ActionRegistry.register('captureFrameOptimized', RenderService.captureFrameOptimized);
    
    // ---- Workflow actions ----
    ActionRegistry.register('animateCoin', WorkflowService.animateCoin);
    ActionRegistry.register('createCoinTransition', WorkflowService.createCoinTransition);
    ActionRegistry.register('positionFromAnalysis', WorkflowService.positionFromAnalysis);
    ActionRegistry.register('applyColorMatch', WorkflowService.applyColorMatch);
    
    // ---- Tracking actions ----
    ActionRegistry.register('setup3DCameraTracker', TrackingService.setup3DCameraTracker);
    ActionRegistry.register('linkToTrackPoint', TrackingService.linkToTrackPoint);
    
    // ---- MOGRT/Essential Graphics actions ----
    ActionRegistry.register('exportMOGRT', MogrtService.exportMOGRT);
    ActionRegistry.register('addToEssentialGraphics', MogrtService.addToEssentialGraphics);
    
    // ---- Precomp actions ----
    ActionRegistry.register('precompose', PrecompService.precompose);
    ActionRegistry.register('duplicateComp', PrecompService.duplicateComp);
    ActionRegistry.register('openCompViewer', PrecompService.openCompViewer);
    ActionRegistry.register('replaceCompSource', PrecompService.replaceCompSource);
    ActionRegistry.register('nestComp', PrecompService.nestComp);
    
    // ---- Footage actions ----
    ActionRegistry.register('replaceFootage', FootageService.replaceFootage);
    ActionRegistry.register('relinkFootage', FootageService.relinkFootage);
    ActionRegistry.register('interpretFootage', FootageService.interpretFootage);
    ActionRegistry.register('setProxy', FootageService.setProxy);
    ActionRegistry.register('collectFiles', FootageService.collectFiles);
    ActionRegistry.register('removeUnused', FootageService.removeUnused);
    ActionRegistry.register('findMissingFootage', FootageService.findMissingFootage);
    
    // ---- Layer Utils actions ----
    ActionRegistry.register('duplicateLayer', LayerUtilsService.duplicateLayer);
    ActionRegistry.register('splitLayer', LayerUtilsService.splitLayer);
    ActionRegistry.register('timeRemapLayer', LayerUtilsService.timeRemapLayer);
    ActionRegistry.register('timeStretchLayer', LayerUtilsService.timeStretchLayer);
    ActionRegistry.register('setCollapseTransformations', LayerUtilsService.setCollapseTransformations);
    ActionRegistry.register('setLayerBlendingMode', LayerUtilsService.setLayerBlendingMode);
    ActionRegistry.register('setLayerQuality', LayerUtilsService.setLayerQuality);
    ActionRegistry.register('freezeFrame', LayerUtilsService.freezeFrame);
    ActionRegistry.register('reverseLayer', LayerUtilsService.reverseLayer);
    
    // ---- Marker actions ----
    ActionRegistry.register('addCompMarker', MarkerService.addCompMarker);
    ActionRegistry.register('addLayerMarker', MarkerService.addLayerMarker);
    ActionRegistry.register('getCompMarkers', MarkerService.getCompMarkers);
    ActionRegistry.register('getLayerMarkers', MarkerService.getLayerMarkers);
    ActionRegistry.register('removeMarker', MarkerService.removeMarker);
    ActionRegistry.register('updateMarker', MarkerService.updateMarker);
    ActionRegistry.register('addMarkersFromArray', MarkerService.addMarkersFromArray);
    
    // ---- Color actions ----
    ActionRegistry.register('setProjectColorDepth', ColorService.setProjectColorDepth);
    ActionRegistry.register('setProjectWorkingSpace', ColorService.setProjectWorkingSpace);
    ActionRegistry.register('applyLUT', ColorService.applyLUT);
    ActionRegistry.register('applyColorProfileConverter', ColorService.applyColorProfileConverter);
    ActionRegistry.register('setLinearizeWorkingSpace', ColorService.setLinearizeWorkingSpace);
    ActionRegistry.register('setCompensateForSceneReferredProfiles', ColorService.setCompensateForSceneReferredProfiles);
    ActionRegistry.register('applyColorBalance', ColorService.applyColorBalance);
    ActionRegistry.register('applyPhotoFilter', ColorService.applyPhotoFilter);
    
    // ---- Audio actions ----
    ActionRegistry.register('setAudioLevel', AudioService.setAudioLevel);
    ActionRegistry.register('fadeAudioIn', AudioService.fadeAudioIn);
    ActionRegistry.register('fadeAudioOut', AudioService.fadeAudioOut);
    ActionRegistry.register('muteLayer', AudioService.muteLayer);
    ActionRegistry.register('soloAudio', AudioService.soloAudio);
    ActionRegistry.register('setAudioKeyframe', AudioService.setAudioKeyframe);
    ActionRegistry.register('getAudioInfo', AudioService.getAudioInfo);
    
    // ---- Project actions ----
    ActionRegistry.register('getProjectSettings', ProjectService.getProjectSettings);
    ActionRegistry.register('setProjectSettings', ProjectService.setProjectSettings);
    ActionRegistry.register('saveProject', ProjectService.saveProject);
    ActionRegistry.register('closeProject', ProjectService.closeProject);
    ActionRegistry.register('createFolder', ProjectService.createFolder);
    ActionRegistry.register('organizeProjectItems', ProjectService.organizeProjectItems);
    ActionRegistry.register('getProjectReport', ProjectService.getProjectReport);
    ActionRegistry.register('reduceProject', ProjectService.reduceProject);
    
    // ---- Text actions (additional) ----
    ActionRegistry.register('addTextAnimator', TextService.addTextAnimator);
    ActionRegistry.register('addRangeSelector', TextService.addRangeSelector);
    ActionRegistry.register('addWigglySelector', TextService.addWigglySelector);
    ActionRegistry.register('setPerCharacter3D', TextService.setPerCharacter3D);
    ActionRegistry.register('setTextTracking', TextService.setTextTracking);
    
    // ---- Shape actions (additional) ----
    ActionRegistry.register('addMergePaths', ShapeService.addMergePaths);
    ActionRegistry.register('addOffsetPaths', ShapeService.addOffsetPaths);
    ActionRegistry.register('addRoundCorners', ShapeService.addRoundCorners);
    ActionRegistry.register('addZigZag', ShapeService.addZigZag);
    ActionRegistry.register('addPuckerBloat', ShapeService.addPuckerBloat);
    ActionRegistry.register('addTwist', ShapeService.addTwist);
    ActionRegistry.register('addWigglePath', ShapeService.addWigglePath);
    
    // ---- Render actions (additional) ----
    ActionRegistry.register('setOutputModule', RenderService.setOutputModule);
    ActionRegistry.register('batchRenderComps', RenderService.batchRenderComps);
    ActionRegistry.register('setRenderRegion', RenderService.setRenderRegion);
    ActionRegistry.register('setRenderSettings', RenderService.setRenderSettings);
    ActionRegistry.register('getRenderStatus', RenderService.getRenderStatus);
    ActionRegistry.register('clearRenderQueue', RenderService.clearRenderQueue);
    
    // ---- Diagnostic/Test actions ----
    ActionRegistry.register('testScript', function(params) {
        return {
            success: true,
            message: 'Modular script is working',
            timestamp: new Date().toString(),
            registeredActions: ActionRegistry.list().length
        };
    });
    
    // ---- AI Helper actions ----
    ActionRegistry.register('getLayerInfo', function(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        
        var layerResult = LayerData.getLayer(compResult.comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        
        var layer = layerResult.layer;
        var caps = LayerData.getLayerCapabilities(layer);
        var compatibleActions = ActionRegistry.getCompatibleActions(caps.type);
        
        return Utils.success({
            name: layer.name,
            index: layer.index,
            capabilities: caps,
            compatibleActions: compatibleActions,
            suggestedActions: WorkflowTemplates.getSuggestions(null, caps.type)
        });
    });
    
    ActionRegistry.register('getActionInfo', function(params) {
        var actionName = params.action || params.actionName;
        if (!actionName) return Utils.error('action parameter required');
        
        var meta = ActionRegistry.getMeta(actionName);
        if (!meta) return Utils.error('Unknown action: ' + actionName);
        
        return Utils.success({
            action: actionName,
            layerType: meta.layerType,
            needsComp: meta.needsComp,
            needsLayer: meta.needsLayer,
            category: meta.category,
            manualStep: meta.manualStep || null
        });
    });
    
    ActionRegistry.register('listTemplates', function(params) {
        var level = params.level;
        var templates = level ? WorkflowTemplates.getByLevel(level) : WorkflowTemplates.listTemplates();
        return Utils.success({ templates: templates });
    });
    
    ActionRegistry.register('executeTemplate', function(params) {
        var templateId = params.templateId || params.template;
        if (!templateId) return Utils.error('templateId parameter required');
        return WorkflowTemplates.executeTemplate(templateId, params);
    });
    
    ActionRegistry.register('getSuggestions', function(params) {
        var lastAction = params.lastAction;
        var layerType = params.layerType;
        
        // If no layerType provided but layerIndex given, detect it
        if (!layerType && (params.layerIndex || params.layerName)) {
            var compResult = CompositionData.getActiveComp();
            if (!compResult.error) {
                var layerResult = LayerData.getLayer(compResult.comp, params);
                if (!layerResult.error) {
                    layerType = LayerData.getLayerType(layerResult.layer);
                }
            }
        }
        
        var suggestions = WorkflowTemplates.getSuggestions(lastAction, layerType);
        return Utils.success({ suggestions: suggestions });
    });
    
    ActionRegistry.register('getCategories', function(params) {
        var categories = ActionRegistry.getCategories();
        var result = {};
        for (var i = 0; i < categories.length; i++) {
            var cat = categories[i];
            result[cat] = ActionRegistry.getByCategory(cat);
        }
        return Utils.success({ categories: result });
    });
    
})();

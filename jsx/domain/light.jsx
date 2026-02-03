// ============================================
// DOMAIN: Light
// Light entity and related operations
// ============================================

var LightDomain = (function() {
    
    /**
     * Light type constants (mirror AE's LightType enum)
     */
    var LIGHT_TYPES = {
        PARALLEL: 'PARALLEL',
        SPOT: 'SPOT',
        POINT: 'POINT',
        AMBIENT: 'AMBIENT',
        ENVIRONMENT: 'ENVIRONMENT'
    };
    
    /**
     * Falloff type map
     */
    var FALLOFF_TYPES = {
        'none': 1,
        'smooth': 2,
        'inverseSquare': 3
    };
    
    /**
     * Find light in composition
     * @param {CompItem} comp - The composition
     * @param {Object} params - { lightIndex, lightName }
     * @returns {Object} { light: LightLayer } or { error: string }
     */
    function findLight(comp, params) {
        params = params || {};
        
        if (params.lightIndex) {
            var layer = comp.layer(params.lightIndex);
            if (!(layer instanceof LightLayer)) {
                return { error: 'Layer ' + params.lightIndex + ' is not a light' };
            }
            return { light: layer };
        }
        
        if (params.lightName) {
            for (var i = 1; i <= comp.numLayers; i++) {
                var l = comp.layer(i);
                if (l instanceof LightLayer && l.name === params.lightName) {
                    return { light: l };
                }
            }
            return { error: 'Light not found: ' + params.lightName };
        }
        
        // Find first spot or point light
        for (var i = 1; i <= comp.numLayers; i++) {
            var l = comp.layer(i);
            if (l instanceof LightLayer && (l.lightType === LightType.SPOT || l.lightType === LightType.POINT)) {
                return { light: l };
            }
        }
        
        return { error: 'No suitable light found (Spot or Point lights only)' };
    }
    
    /**
     * Create a new light
     * @param {CompItem} comp - The composition
     * @param {string} name - Light name
     * @param {*} lightType - LightType enum value
     * @param {Object} config - Light configuration
     * @returns {LightLayer} The created light
     */
    function createLight(comp, name, lightType, config) {
        var centerPoint = [comp.width / 2, comp.height / 2];
        var lightLayer = comp.layers.addLight(name, centerPoint);
        
        lightLayer.lightType = lightType;
        
        var lightOptions = getLightOptions(lightLayer);
        var transform = lightLayer.property('ADBE Transform Group');
        
        if (config.intensity !== undefined) {
            Utils.setProp(lightOptions, 'ADBE Light Intensity', config.intensity);
        }
        if (config.color) {
            Utils.setProp(lightOptions, 'ADBE Light Color', config.color);
        }
        
        if (lightType === LightType.SPOT) {
            if (config.coneAngle !== undefined) {
                Utils.setProp(lightOptions, 'ADBE Light Cone Angle', config.coneAngle);
            }
            if (config.coneFeather !== undefined) {
                Utils.setProp(lightOptions, 'ADBE Light Cone Feather', config.coneFeather);
            }
        }
        
        if (config.shadowDarkness !== undefined && config.shadowDarkness > 0) {
            Utils.setProp(lightOptions, 'ADBE Casts Shadows', 1);
            Utils.setProp(lightOptions, 'ADBE Light Shadow Darkness', config.shadowDarkness);
            if (config.shadowDiffusion !== undefined) {
                Utils.setProp(lightOptions, 'ADBE Light Shadow Diffusion', config.shadowDiffusion);
            }
        }
        
        if (config.position) {
            Utils.setProp(transform, 'ADBE Position', config.position);
        }
        if (config.pointOfInterest) {
            Utils.setProp(transform, 'ADBE Anchor Point', config.pointOfInterest);
        }
        
        return lightLayer;
    }
    
    /**
     * Get light options property group
     * @param {LightLayer} light - The light layer
     * @returns {PropertyGroup} Light options group
     */
    function getLightOptions(light) {
        return light.property('ADBE Light Options Group');
    }
    
    /**
     * Set falloff properties on light
     * @param {LightLayer} light - The light layer
     * @param {Object} params - Falloff parameters
     * @returns {Array} Applied properties
     */
    function setFalloff(light, params) {
        var lightOptions = getLightOptions(light);
        var applied = [];
        
        if (params.falloffType !== undefined) {
            var falloffValue = typeof params.falloffType === 'string' 
                ? FALLOFF_TYPES[params.falloffType] 
                : params.falloffType;
            Utils.setProp(lightOptions, 'ADBE Light Falloff Type', falloffValue);
            applied.push('Falloff Type: ' + params.falloffType);
        }
        
        if (params.falloffStart !== undefined) {
            Utils.setProp(lightOptions, 'ADBE Light Falloff Start', params.falloffStart);
            applied.push('Falloff Start: ' + params.falloffStart);
        }
        
        if (params.falloffDistance !== undefined) {
            Utils.setProp(lightOptions, 'ADBE Light Falloff Distance', params.falloffDistance);
            applied.push('Falloff Distance: ' + params.falloffDistance);
        }
        
        return applied;
    }
    
    /**
     * Create default 3-point lighting rig configuration
     * @param {CompItem} comp - The composition
     * @returns {Object} Light configurations { keyLight, fillLight, rimLight }
     */
    function getDefaultLightRig(comp) {
        return {
            keyLight: {
                position: [comp.width * 0.7, -comp.height * 0.3, -800],
                intensity: 100,
                color: [1, 0.98, 0.95],
                shadowDarkness: 50
            },
            fillLight: {
                position: [comp.width * 0.2, comp.height * 0.5, -600],
                intensity: 40,
                color: [0.9, 0.95, 1],
                shadowDarkness: 0
            },
            rimLight: {
                position: [comp.width * 0.5, comp.height * 0.3, 500],
                intensity: 60,
                color: [1, 1, 1],
                shadowDarkness: 0
            }
        };
    }
    
    /**
     * Apply lighting adjustments from AI analysis
     * @param {LightLayer} keyLight - The key light
     * @param {CompItem} comp - The composition
     * @param {Object} lighting - Lighting analysis data
     */
    function applyAnalysisLighting(keyLight, comp, lighting) {
        var lightOptions = getLightOptions(keyLight);
        var transform = keyLight.property('ADBE Transform Group');
        
        if (lighting.intensity) {
            var intensityMap = { 'low': 60, 'medium': 100, 'high': 140 };
            Utils.setProp(lightOptions, 'ADBE Light Intensity', intensityMap[lighting.intensity] || 100);
        }
        
        if (lighting.temperature) {
            var colorMap = {
                'warm': [1, 0.92, 0.85],
                'neutral': [1, 1, 1],
                'cool': [0.85, 0.92, 1]
            };
            Utils.setProp(lightOptions, 'ADBE Light Color', colorMap[lighting.temperature] || [1, 1, 1]);
        }
        
        if (lighting.direction) {
            var directionMap = {
                'left': [-500, 0, -800],
                'right': [comp.width + 500, 0, -800],
                'top': [comp.width / 2, -500, -800],
                'bottom': [comp.width / 2, comp.height + 500, -800],
                'front': [comp.width / 2, comp.height / 2, -1500],
                'back': [comp.width / 2, comp.height / 2, 500]
            };
            var position = directionMap[lighting.direction];
            if (position) {
                Utils.setProp(transform, 'ADBE Position', position);
            }
        }
    }
    
    return {
        LIGHT_TYPES: LIGHT_TYPES,
        FALLOFF_TYPES: FALLOFF_TYPES,
        findLight: findLight,
        createLight: createLight,
        getLightOptions: getLightOptions,
        setFalloff: setFalloff,
        getDefaultLightRig: getDefaultLightRig,
        applyAnalysisLighting: applyAnalysisLighting
    };
})();

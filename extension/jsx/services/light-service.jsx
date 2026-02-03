// ============================================
// SERVICE: Light Service
// High-level lighting operations
// ============================================

var LightService = (function() {
    
    /**
     * Add a 3-point lighting rig
     * @param {Object} params - Lighting parameters
     * @returns {Object} Result
     */
    function addLightRig(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var defaults = LightDomain.getDefaultLightRig(comp);
        var lights = [];
        
        var keyConfig = params.keyLight || defaults.keyLight;
        var fillConfig = params.fillLight || defaults.fillLight;
        var rimConfig = params.rimLight || defaults.rimLight;
        
        var key = LightDomain.createLight(comp, 'Key Light', LightType.SPOT, keyConfig);
        lights.push(key.name);
        
        var fill = LightDomain.createLight(comp, 'Fill Light', LightType.POINT, fillConfig);
        lights.push(fill.name);
        
        if (params.includeRim !== false) {
            var rim = LightDomain.createLight(comp, 'Rim Light', LightType.POINT, rimConfig);
            lights.push(rim.name);
        }
        
        if (params.ambient) {
            var ambient = comp.layers.addLight('Ambient Light', [comp.width / 2, comp.height / 2]);
            ambient.lightType = LightType.AMBIENT;
            var ambientOptions = LightDomain.getLightOptions(ambient);
            Utils.setProp(ambientOptions, 'ADBE Light Intensity', params.ambient.intensity || 20);
            lights.push(ambient.name);
        }
        
        return Utils.success({ lights: lights });
    }
    
    /**
     * Set light falloff properties
     * @param {Object} params - Falloff parameters
     * @returns {Object} Result
     */
    function setLightFalloff(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var lightResult = LightDomain.findLight(comp, params);
        if (lightResult.error) return lightResult;
        var lightLayer = lightResult.light;
        
        var applied = LightDomain.setFalloff(lightLayer, params);
        
        return Utils.success({
            light: lightLayer.name,
            lightType: lightLayer.lightType,
            applied: applied
        });
    }
    
    /**
     * Add environment light (AE 24.3+)
     * @param {Object} params - Environment light parameters
     * @returns {Object} Result
     */
    function addEnvironmentLight(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        if (typeof LightType.ENVIRONMENT === 'undefined') {
            return Utils.error('Environment lights require AE 24.3+');
        }
        
        var lightLayer = comp.layers.addLight(params.name || 'Environment Light', [comp.width / 2, comp.height / 2]);
        lightLayer.lightType = LightType.ENVIRONMENT;
        
        var lightOptions = LightDomain.getLightOptions(lightLayer);
        
        if (params.intensity !== undefined) {
            Utils.setProp(lightOptions, 'ADBE Light Intensity', params.intensity);
        }
        
        if (params.sourceLayerIndex !== undefined && lightLayer.lightSource !== undefined) {
            var sourceLayer = comp.layer(params.sourceLayerIndex);
            if (sourceLayer && !sourceLayer.threeDLayer) {
                lightLayer.lightSource = sourceLayer;
            }
        }
        
        if (params.castsShadows) {
            Utils.setProp(lightOptions, 'ADBE Casts Shadows', 1);
            if (params.shadowDarkness !== undefined) {
                Utils.setProp(lightOptions, 'ADBE Light Shadow Darkness', params.shadowDarkness);
            }
        }
        
        return Utils.success({
            light: lightLayer.name,
            type: 'ENVIRONMENT'
        });
    }
    
    /**
     * Setup shadow properties on a layer
     * @param {Object} params - Shadow parameters
     * @returns {Object} Result
     */
    function setupShadows(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerIndex = params.layerIndex || 1;
        var layer = comp.layer(layerIndex);
        
        if (!layer.threeDLayer) {
            layer.threeDLayer = true;
        }
        
        var mat = layer.property('ADBE Material Options Group');
        if (mat) {
            Utils.setProp(mat, 'ADBE Casts Shadows', params.casts ? 1 : 0);
            Utils.setProp(mat, 'ADBE Accepts Shadows', params.accepts ? 1 : 0);
        }
        
        return Utils.success({ layer: layer.name });
    }
    
    return {
        addLightRig: addLightRig,
        setLightFalloff: setLightFalloff,
        addEnvironmentLight: addEnvironmentLight,
        setupShadows: setupShadows
    };
})();

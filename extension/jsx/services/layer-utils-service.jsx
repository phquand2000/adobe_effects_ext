// ============================================
// SERVICE: Layer Utils Service
// Utility operations for layer manipulation
// ============================================

var LayerUtilsService = (function() {
    
    // Blending mode mapping
    var BLEND_MODES = {
        'normal': BlendingMode.NORMAL,
        'add': BlendingMode.ADD,
        'multiply': BlendingMode.MULTIPLY,
        'screen': BlendingMode.SCREEN,
        'overlay': BlendingMode.OVERLAY,
        'softLight': BlendingMode.SOFT_LIGHT,
        'hardLight': BlendingMode.HARD_LIGHT,
        'colorDodge': BlendingMode.COLOR_DODGE,
        'colorBurn': BlendingMode.COLOR_BURN,
        'darken': BlendingMode.DARKEN,
        'lighten': BlendingMode.LIGHTEN,
        'difference': BlendingMode.DIFFERENCE,
        'exclusion': BlendingMode.EXCLUSION,
        'hue': BlendingMode.HUE,
        'saturation': BlendingMode.SATURATION,
        'color': BlendingMode.COLOR,
        'luminosity': BlendingMode.LUMINOSITY,
        'stencilAlpha': BlendingMode.STENCIL_ALPHA,
        'stencilLuma': BlendingMode.STENCIL_LUMA,
        'silhouetteAlpha': BlendingMode.SILHOUETTE_ALPHA,
        'silhouetteLuma': BlendingMode.SILHOUETTE_LUMA,
        'luminoscentPremul': BlendingMode.LUMINESCENT_PREMUL,
        'dissolve': BlendingMode.DISSOLVE,
        'dancingDissolve': BlendingMode.DANCING_DISSOLVE,
        'linearDodge': BlendingMode.LINEAR_DODGE,
        'linearBurn': BlendingMode.LINEAR_BURN,
        'linearLight': BlendingMode.LINEAR_LIGHT,
        'vividLight': BlendingMode.VIVID_LIGHT,
        'pinLight': BlendingMode.PIN_LIGHT,
        'hardMix': BlendingMode.HARD_MIX
    };
    
    // Quality mapping
    var QUALITY_MODES = {
        'best': LayerQuality.BEST,
        'draft': LayerQuality.DRAFT,
        'wireframe': LayerQuality.WIREFRAME
    };
    
    /**
     * Duplicate a layer
     * @param {Object} params - { layerIndex or layerName, count }
     * @returns {Object} Result
     */
    function duplicateLayer(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        var count = params.count || 1;
        var duplicates = [];
        
        try {
            for (var i = 0; i < count; i++) {
                var dupe = layer.duplicate();
                duplicates.push(dupe.name);
            }
            
            return Utils.success({
                original: layer.name,
                duplicates: duplicates
            });
        } catch (e) {
            return Utils.error('Failed to duplicate layer: ' + e.toString());
        }
    }
    
    /**
     * Split a layer at specified time
     * @param {Object} params - { layerIndex or layerName, time }
     * @returns {Object} Result
     */
    function splitLayer(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        var splitTime = params.time !== undefined ? params.time : comp.time;
        
        if (splitTime <= layer.inPoint || splitTime >= layer.outPoint) {
            return Utils.error('Split time must be within layer in/out points');
        }
        
        try {
            var originalOut = layer.outPoint;
            var dupe = layer.duplicate();
            
            layer.outPoint = splitTime;
            dupe.inPoint = splitTime;
            dupe.outPoint = originalOut;
            
            return Utils.success({
                original: layer.name,
                split: dupe.name,
                splitTime: splitTime
            });
        } catch (e) {
            return Utils.error('Failed to split layer: ' + e.toString());
        }
    }
    
    /**
     * Enable or disable time remapping on a layer
     * @param {Object} params - { layerIndex, enable }
     * @returns {Object} Result
     */
    function timeRemapLayer(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        var enable = params.enable !== false;
        
        try {
            if (layer.canSetTimeRemapEnabled === false) {
                return Utils.error('Time remapping cannot be enabled on this layer type');
            }
            
            layer.timeRemapEnabled = enable;
            
            return Utils.success({
                layer: layer.name,
                timeRemapEnabled: layer.timeRemapEnabled
            });
        } catch (e) {
            return Utils.error('Failed to set time remap: ' + e.toString());
        }
    }
    
    /**
     * Time stretch a layer
     * @param {Object} params - { layerIndex, stretchFactor or newDuration }
     * @returns {Object} Result
     */
    function timeStretchLayer(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        try {
            var originalStretch = layer.stretch;
            
            if (params.stretchFactor !== undefined) {
                layer.stretch = params.stretchFactor;
            } else if (params.newDuration !== undefined) {
                var originalDuration = layer.outPoint - layer.inPoint;
                if (originalDuration > 0) {
                    var stretchFactor = (params.newDuration / originalDuration) * 100;
                    layer.stretch = stretchFactor;
                }
            } else {
                return Utils.error('Must specify stretchFactor or newDuration');
            }
            
            return Utils.success({
                layer: layer.name,
                stretch: layer.stretch
            });
        } catch (e) {
            return Utils.error('Failed to stretch layer: ' + e.toString());
        }
    }
    
    /**
     * Set collapse transformations on a layer
     * @param {Object} params - { layerIndex, enable }
     * @returns {Object} Result
     */
    function setCollapseTransformations(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        var enable = params.enable !== false;
        
        try {
            layer.collapseTransformation = enable;
            
            return Utils.success({
                layer: layer.name,
                collapsed: layer.collapseTransformation
            });
        } catch (e) {
            return Utils.error('Failed to set collapse transformations: ' + e.toString());
        }
    }
    
    /**
     * Set layer blending mode
     * @param {Object} params - { layerIndex, mode }
     * @returns {Object} Result
     */
    function setLayerBlendingMode(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        var modeName = params.mode || 'normal';
        var blendMode = BLEND_MODES[modeName];
        
        if (blendMode === undefined) {
            return Utils.error('Unknown blending mode: ' + modeName);
        }
        
        try {
            layer.blendingMode = blendMode;
            
            return Utils.success({
                layer: layer.name,
                blendingMode: modeName
            });
        } catch (e) {
            return Utils.error('Failed to set blending mode: ' + e.toString());
        }
    }
    
    /**
     * Set layer quality
     * @param {Object} params - { layerIndex, quality }
     * @returns {Object} Result
     */
    function setLayerQuality(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        var qualityName = params.quality || 'best';
        var quality = QUALITY_MODES[qualityName];
        
        if (quality === undefined) {
            return Utils.error('Unknown quality: ' + qualityName + '. Use best, draft, or wireframe.');
        }
        
        try {
            layer.quality = quality;
            
            return Utils.success({
                layer: layer.name,
                quality: qualityName
            });
        } catch (e) {
            return Utils.error('Failed to set layer quality: ' + e.toString());
        }
    }
    
    /**
     * Freeze frame at specified time
     * @param {Object} params - { layerIndex, time }
     * @returns {Object} Result
     */
    function freezeFrame(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        var freezeTime = params.time !== undefined ? params.time : comp.time;
        
        try {
            if (layer.canSetTimeRemapEnabled === false) {
                return Utils.error('Time remapping cannot be enabled on this layer type');
            }
            
            layer.timeRemapEnabled = true;
            
            var timeRemapProp = layer.property('ADBE Time Remapping');
            if (timeRemapProp) {
                timeRemapProp.expression = 'value = ' + freezeTime + ';';
            }
            
            return Utils.success({
                layer: layer.name,
                frozenAt: freezeTime
            });
        } catch (e) {
            return Utils.error('Failed to freeze frame: ' + e.toString());
        }
    }
    
    /**
     * Reverse layer playback
     * @param {Object} params - { layerIndex }
     * @returns {Object} Result
     */
    function reverseLayer(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        try {
            if (layer.canSetTimeRemapEnabled === false) {
                return Utils.error('Time remapping cannot be enabled on this layer type');
            }
            
            layer.timeRemapEnabled = true;
            
            var timeRemapProp = layer.property('ADBE Time Remapping');
            if (timeRemapProp) {
                var numKeys = timeRemapProp.numKeys;
                
                if (numKeys >= 2) {
                    var keyTimes = [];
                    var keyValues = [];
                    
                    for (var i = 1; i <= numKeys; i++) {
                        keyTimes.push(timeRemapProp.keyTime(i));
                        keyValues.push(timeRemapProp.keyValue(i));
                    }
                    
                    keyValues.reverse();
                    
                    for (var j = 1; j <= numKeys; j++) {
                        timeRemapProp.setValueAtKey(j, keyValues[j - 1]);
                    }
                } else {
                    var layerDuration = layer.outPoint - layer.inPoint;
                    var inPointTime = layer.inPoint;
                    var sourceIn = layer.source ? layer.source.duration : layerDuration;
                    
                    timeRemapProp.expression = 'thisLayer.source.duration - (time - inPoint)';
                }
            }
            
            return Utils.success({
                layer: layer.name
            });
        } catch (e) {
            return Utils.error('Failed to reverse layer: ' + e.toString());
        }
    }
    
    return {
        duplicateLayer: duplicateLayer,
        splitLayer: splitLayer,
        timeRemapLayer: timeRemapLayer,
        timeStretchLayer: timeStretchLayer,
        setCollapseTransformations: setCollapseTransformations,
        setLayerBlendingMode: setLayerBlendingMode,
        setLayerQuality: setLayerQuality,
        freezeFrame: freezeFrame,
        reverseLayer: reverseLayer
    };
})();

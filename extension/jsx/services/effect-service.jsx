// ============================================
// SERVICE: Effect Service
// High-level effect operations
// ============================================

var EffectService = (function() {
    
    /**
     * Apply glow effect to layer
     * @param {Object} params - Glow parameters
     * @returns {Object} Result
     */
    function applyGlow(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        if (!layer.Effects) {
            return Utils.error('This layer does not support effects');
        }
        
        var glow = EffectData.addEffect(layer, 'ADBE Glo2');
        if (!glow) {
            return Utils.error('Failed to add Glow effect');
        }
        
        // Glow Threshold - range 1-2 (1=0%, 2=100%)
        if (params.threshold !== undefined) {
            var threshold = 1 + (Math.max(0, Math.min(100, params.threshold)) / 100);
            Utils.setProp(glow, 'ADBE Glo2-0001', threshold);
        }
        
        if (params.radius !== undefined) {
            Utils.setProp(glow, 'ADBE Glo2-0002', params.radius);
        }
        
        if (params.intensity !== undefined) {
            Utils.setProp(glow, 'ADBE Glo2-0003', params.intensity);
        }
        
        if (params.colorA) {
            Utils.setProp(glow, 'ADBE Glo2-0005', params.colorA);
        }
        if (params.colorB) {
            Utils.setProp(glow, 'ADBE Glo2-0006', params.colorB);
        }
        
        if (params.colorLooping !== undefined) {
            Utils.setProp(glow, 'ADBE Glo2-0007', params.colorLooping);
        }
        
        return Utils.success({
            layer: layer.name,
            effect: 'Glow'
        });
    }
    
    /**
     * Apply blur effect to layer
     * @param {Object} params - Blur parameters
     * @returns {Object} Result
     */
    function applyBlur(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        if (!layer.Effects) {
            return Utils.error('This layer does not support effects');
        }
        
        var blurType = params.type || 'gaussian';
        var blur;
        
        switch (blurType) {
            case 'gaussian':
                blur = EffectData.addEffect(layer, 'ADBE Gaussian Blur 2');
                if (params.blurriness !== undefined) {
                    Utils.setProp(blur, 'ADBE Gaussian Blur 2-0001', params.blurriness);
                }
                if (params.direction !== undefined) {
                    Utils.setProp(blur, 'ADBE Gaussian Blur 2-0002', params.direction);
                }
                break;
                
            case 'directional':
                blur = EffectData.addEffect(layer, 'ADBE Motion Blur');
                if (params.direction !== undefined) {
                    Utils.setProp(blur, 'ADBE Motion Blur-0001', params.direction);
                }
                if (params.length !== undefined) {
                    Utils.setProp(blur, 'ADBE Motion Blur-0002', params.length);
                }
                break;
                
            case 'radial':
                blur = EffectData.addEffect(layer, 'ADBE Radial Blur');
                if (params.amount !== undefined) {
                    Utils.setProp(blur, 'ADBE Radial Blur-0001', params.amount);
                }
                if (params.center) {
                    Utils.setProp(blur, 'ADBE Radial Blur-0002', params.center);
                }
                if (params.radialType !== undefined) {
                    Utils.setProp(blur, 'ADBE Radial Blur-0003', params.radialType);
                }
                break;
                
            case 'box':
                blur = EffectData.addEffect(layer, 'ADBE Box Blur2');
                if (params.radius !== undefined) {
                    Utils.setProp(blur, 'ADBE Box Blur2-0001', params.radius);
                }
                if (params.iterations !== undefined) {
                    Utils.setProp(blur, 'ADBE Box Blur2-0002', params.iterations);
                }
                break;
                
            case 'cameraLens':
                blur = EffectData.addEffect(layer, 'ADBE Camera Lens Blur');
                if (params.blurRadius !== undefined) {
                    Utils.setProp(blur, 'ADBE Camera Lens Blur-0001', params.blurRadius);
                }
                break;
                
            default:
                return Utils.error('Unknown blur type: ' + blurType);
        }
        
        if (!blur) {
            return Utils.error('Failed to add ' + blurType + ' blur effect');
        }
        
        return Utils.success({
            layer: layer.name,
            effect: blurType + ' blur'
        });
    }
    
    /**
     * Apply Lumetri color effect
     * @param {Object} params - Lumetri parameters
     * @returns {Object} Result
     */
    function applyLumetri(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        if (!layer.Effects) {
            return Utils.error('This layer does not support effects');
        }
        
        var lumetri = EffectData.addEffect(layer, 'ADBE Lumetri');
        if (!lumetri) {
            return Utils.error('Failed to add Lumetri Color effect');
        }
        var applied = [];
        
        var propMap = {
            temperature: 'ADBE Lumetri-0003',
            tint: 'ADBE Lumetri-0004',
            exposure: 'ADBE Lumetri-0005',
            contrast: 'ADBE Lumetri-0006',
            highlights: 'ADBE Lumetri-0007',
            shadows: 'ADBE Lumetri-0008',
            whites: 'ADBE Lumetri-0009',
            blacks: 'ADBE Lumetri-0010',
            saturation: 'ADBE Lumetri-0011',
            vibrance: 'ADBE Lumetri-0012'
        };
        
        for (var key in propMap) {
            if (params[key] !== undefined) {
                try {
                    lumetri.property(propMap[key]).setValue(params[key]);
                    applied.push(key.charAt(0).toUpperCase() + key.slice(1));
                } catch (e) {}
            }
        }
        
        return Utils.success({
            layer: layer.name,
            effect: 'Lumetri Color',
            applied: applied
        });
    }
    
    /**
     * Apply Vibrance effect
     * @param {Object} params - Vibrance parameters
     * @returns {Object} Result
     */
    function applyVibrance(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        if (!layer.Effects) {
            return Utils.error('This layer does not support effects');
        }
        
        var vibrance = EffectData.addEffect(layer, 'ADBE Vibrance');
        if (!vibrance) {
            return Utils.error('Failed to add Vibrance effect');
        }
        
        if (params.vibrance !== undefined) {
            Utils.setProp(vibrance, 'ADBE Vibrance-0001', params.vibrance);
        }
        if (params.saturation !== undefined) {
            Utils.setProp(vibrance, 'ADBE Vibrance-0002', params.saturation);
        }
        
        return Utils.success({
            layer: layer.name,
            effect: 'Vibrance'
        });
    }
    
    /**
     * Apply Curves effect
     * @param {Object} params - Curves parameters
     * @returns {Object} Result
     */
    function applyCurves(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        if (!layer.Effects) {
            return Utils.error('This layer does not support effects');
        }
        
        var curves = EffectData.addEffect(layer, 'ADBE CurvesCustom');
        if (!curves) {
            return Utils.error('Failed to add Curves effect');
        }
        
        return Utils.success({
            layer: layer.name,
            effect: 'Curves',
            note: 'Curves effect added. Adjust curve points manually or via expressions.'
        });
    }
    
    /**
     * Add generic effect by match name
     * @param {Object} params - Effect parameters
     * @returns {Object} Result
     */
    function addEffect(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        if (!layer.Effects) {
            return Utils.error('Layer does not support effects');
        }
        
        var matchName = params.matchName || params.effectName;
        if (!matchName) {
            return Utils.error('No effect match name specified');
        }
        
        var effect;
        try {
            effect = layer.Effects.addProperty(matchName);
        } catch (e) {
            return Utils.error('Failed to add effect: ' + matchName + ' - ' + e.toString());
        }
        
        if (params.name) {
            effect.name = params.name;
        }
        
        if (params.properties) {
            EffectData.setEffectProps(effect, params.properties);
        }
        
        return Utils.success({
            layer: layer.name,
            effect: effect.name,
            matchName: matchName
        });
    }
    
    /**
     * Set effect property value
     * @param {Object} params - Effect property parameters
     * @returns {Object} Result
     */
    function setEffectProperty(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        if (!layer.Effects) {
            return Utils.error('Layer does not support effects');
        }
        
        var effect = EffectData.getEffect(layer, params.effectName);
        if (!effect) {
            return Utils.error('Effect not found: ' + params.effectName);
        }
        
        var propName = params.propertyName || params.property;
        var success = EffectData.setEffectProp(effect, propName, params.value);
        
        if (!success) {
            return Utils.error('Failed to set property: ' + propName);
        }
        
        return Utils.success({
            layer: layer.name,
            effect: params.effectName,
            property: propName,
            value: params.value
        });
    }
    
    /**
     * Apply Bilateral Blur effect
     * @param {Object} params - Blur parameters
     * @returns {Object} Result
     */
    function applyBilateralBlur(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        if (!layer.Effects) {
            return Utils.error('Layer does not support effects');
        }
        
        var blur = EffectData.addEffect(layer, 'ADBE Bilateral');
        if (!blur) {
            return Utils.error('Failed to add Bilateral Blur effect');
        }
        
        if (params.radius !== undefined) {
            Utils.setProp(blur, 'ADBE Bilateral-0001', params.radius);
        }
        if (params.threshold !== undefined) {
            Utils.setProp(blur, 'ADBE Bilateral-0002', params.threshold);
        }
        if (params.colorize !== undefined) {
            Utils.setProp(blur, 'ADBE Bilateral-0003', params.colorize ? 1 : 0);
        }
        
        return Utils.success({
            layer: layer.name,
            effect: 'Bilateral Blur',
            radius: params.radius
        });
    }
    
    /**
     * Apply Compound Blur effect
     * @param {Object} params - Blur parameters
     * @returns {Object} Result
     */
    function applyCompoundBlur(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        if (!layer.Effects) {
            return Utils.error('Layer does not support effects');
        }
        
        var blur = EffectData.addEffect(layer, 'ADBE Compound Blur');
        if (!blur) {
            return Utils.error('Failed to add Compound Blur effect');
        }
        
        if (params.maxBlur !== undefined) {
            Utils.setProp(blur, 'ADBE Compound Blur-0002', params.maxBlur);
        }
        if (params.stretchMap !== undefined) {
            Utils.setProp(blur, 'ADBE Compound Blur-0003', params.stretchMap ? 1 : 0);
        }
        if (params.invertBlur !== undefined) {
            Utils.setProp(blur, 'ADBE Compound Blur-0004', params.invertBlur ? 1 : 0);
        }
        if (params.blurLayerIndex) {
            Utils.setProp(blur, 'ADBE Compound Blur-0001', params.blurLayerIndex);
        }
        
        return Utils.success({
            layer: layer.name,
            effect: 'Compound Blur',
            maxBlur: params.maxBlur
        });
    }
    
    /**
     * Apply CC Vector Blur effect
     * @param {Object} params - Blur parameters
     * @returns {Object} Result
     */
    function applyVectorBlur(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        if (!layer.Effects) {
            return Utils.error('Layer does not support effects');
        }
        
        var blur = EffectData.addEffect(layer, 'CC Vector Blur');
        if (!blur) {
            return Utils.error('Failed to add CC Vector Blur effect');
        }
        
        if (params.amount !== undefined) {
            Utils.setProp(blur, 'CC Vector Blur-0001', params.amount);
        }
        if (params.angle !== undefined) {
            Utils.setProp(blur, 'CC Vector Blur-0002', params.angle);
        }
        if (params.type !== undefined) {
            Utils.setProp(blur, 'CC Vector Blur-0003', params.type);
        }
        
        return Utils.success({
            layer: layer.name,
            effect: 'CC Vector Blur',
            amount: params.amount
        });
    }
    
    return {
        applyGlow: applyGlow,
        applyBlur: applyBlur,
        applyLumetri: applyLumetri,
        applyVibrance: applyVibrance,
        applyCurves: applyCurves,
        addEffect: addEffect,
        setEffectProperty: setEffectProperty,
        applyBilateralBlur: applyBilateralBlur,
        applyCompoundBlur: applyCompoundBlur,
        applyVectorBlur: applyVectorBlur
    };
})();

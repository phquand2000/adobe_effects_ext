// ============================================
// SERVICE: Noise Service
// Noise and grain effect operations
// ============================================

var NoiseService = (function() {
    
    /**
     * Apply Fractal Noise effect to layer
     * @param {Object} params - Fractal noise parameters
     * @param {number} [params.fractalType] - 1=Basic, 2=Turbulent Basic, 3=Soft Linear, etc.
     * @param {number} [params.noiseType] - 1=Block, 2=Linear, 3=Soft Linear, etc.
     * @param {number} [params.contrast] - Contrast value
     * @param {number} [params.brightness] - Brightness value
     * @param {number} [params.overflow] - 1=Clip, 2=Soft Clamp, 3=Wrap Back
     * @param {number} [params.scale] - Transform scale
     * @param {Array} [params.offset] - Transform offset [x, y]
     * @param {number} [params.complexity] - Fractal complexity
     * @param {number} [params.evolution] - Evolution in degrees
     * @returns {Object} Result
     */
    function applyFractalNoise(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        if (!layer.Effects) {
            return Utils.error('Layer does not support effects');
        }
        
        var noise;
        try {
            // Try AE 2025+ match name first, fallback to older versions
            try {
                noise = layer.Effects.addProperty('ADBE Fractal Noise');
            } catch (e1) {
                noise = layer.Effects.addProperty('ADBE AIF Perlin Noise 3');
            }
        } catch (e) {
            return Utils.error('Failed to add Fractal Noise effect: ' + e.toString());
        }
        
        if (params.fractalType !== undefined) {
            Utils.setProp(noise, 'ADBE AIF Perlin Noise 3-0001', params.fractalType);
        }
        
        if (params.noiseType !== undefined) {
            Utils.setProp(noise, 'ADBE AIF Perlin Noise 3-0002', params.noiseType);
        }
        
        if (params.contrast !== undefined) {
            Utils.setProp(noise, 'ADBE AIF Perlin Noise 3-0004', params.contrast);
        }
        
        if (params.brightness !== undefined) {
            Utils.setProp(noise, 'ADBE AIF Perlin Noise 3-0005', params.brightness);
        }
        
        if (params.overflow !== undefined) {
            Utils.setProp(noise, 'ADBE AIF Perlin Noise 3-0006', params.overflow);
        }
        
        if (params.scale !== undefined) {
            Utils.setProp(noise, 'ADBE AIF Perlin Noise 3-0009', params.scale);
        }
        
        if (params.offset) {
            Utils.setProp(noise, 'ADBE AIF Perlin Noise 3-0011', params.offset);
        }
        
        if (params.complexity !== undefined) {
            Utils.setProp(noise, 'ADBE AIF Perlin Noise 3-0014', params.complexity);
        }
        
        if (params.evolution !== undefined) {
            Utils.setProp(noise, 'ADBE AIF Perlin Noise 3-0017', params.evolution);
        }
        
        return Utils.success({
            layer: layer.name,
            effect: 'Fractal Noise'
        });
    }
    
    /**
     * Apply Match Grain effect to layer
     * @param {Object} params - Match grain parameters
     * @param {number} [params.viewingMode] - 1=Final Output, 2=Noise Preview, 3=Noise Sample
     * @param {number} [params.intensity] - Grain intensity
     * @param {number} [params.saturation] - Grain saturation
     * @param {number} [params.size] - Grain size
     * @param {number} [params.softness] - Grain softness
     * @returns {Object} Result
     */
    function applyMatchGrain(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        if (!layer.Effects) {
            return Utils.error('Layer does not support effects');
        }
        
        var grain;
        try {
            // Try AE 2025+ match name first, fallback to older versions
            try {
                grain = layer.Effects.addProperty('VISINF Grain Duplication');
            } catch (e1) {
                grain = layer.Effects.addProperty('ADBE Match Grain');
            }
        } catch (e) {
            return Utils.error('Failed to add Match Grain effect: ' + e.toString());
        }
        
        if (params.viewingMode !== undefined) {
            Utils.setProp(grain, 'ADBE Match Grain-0001', params.viewingMode);
        }
        
        if (params.intensity !== undefined) {
            Utils.setProp(grain, 'ADBE Match Grain-0003', params.intensity);
        }
        
        if (params.saturation !== undefined) {
            Utils.setProp(grain, 'ADBE Match Grain-0004', params.saturation);
        }
        
        if (params.size !== undefined) {
            Utils.setProp(grain, 'ADBE Match Grain-0005', params.size);
        }
        
        if (params.softness !== undefined) {
            Utils.setProp(grain, 'ADBE Match Grain-0006', params.softness);
        }
        
        return Utils.success({
            layer: layer.name,
            effect: 'Match Grain',
            message: 'Apply to footage, click "Take Sample" in Effect Controls'
        });
    }
    
    /**
     * Apply Add Grain effect to layer
     * @param {Object} params - Add grain parameters
     * @param {number} [params.viewingMode] - 1=Final Output, 2=Noise Preview
     * @param {number} [params.intensity] - Grain intensity
     * @param {number} [params.size] - Grain size
     * @param {number} [params.softness] - Grain softness
     * @param {number} [params.saturation] - Grain saturation
     * @returns {Object} Result
     */
    function applyAddGrain(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        if (!layer.Effects) {
            return Utils.error('Layer does not support effects');
        }
        
        var grain;
        try {
            // Try AE 2025+ match name first, fallback to older versions
            try {
                grain = layer.Effects.addProperty('VISINF Grain Implant');
            } catch (e1) {
                grain = layer.Effects.addProperty('ADBE Add Grain');
            }
        } catch (e) {
            return Utils.error('Failed to add Add Grain effect: ' + e.toString());
        }
        
        if (params.viewingMode !== undefined) {
            Utils.setProp(grain, 'ADBE Add Grain-0001', params.viewingMode);
        }
        
        if (params.intensity !== undefined) {
            Utils.setProp(grain, 'ADBE Add Grain-0002', params.intensity);
        }
        
        if (params.size !== undefined) {
            Utils.setProp(grain, 'ADBE Add Grain-0003', params.size);
        }
        
        if (params.softness !== undefined) {
            Utils.setProp(grain, 'ADBE Add Grain-0004', params.softness);
        }
        
        if (params.saturation !== undefined) {
            Utils.setProp(grain, 'ADBE Add Grain-0005', params.saturation);
        }
        
        return Utils.success({
            layer: layer.name,
            effect: 'Add Grain'
        });
    }
    
    return {
        applyFractalNoise: applyFractalNoise,
        applyMatchGrain: applyMatchGrain,
        applyAddGrain: applyAddGrain
    };
})();

// ============================================
// SERVICE: Generate Service
// Generate effects (Gradient Ramp, Fill, 4-Color Gradient)
// ============================================

var GenerateService = (function() {
    
    /**
     * Apply Gradient Ramp effect to layer
     * @param {Object} params - Gradient Ramp parameters
     * @param {Array} [params.startPoint] - Start point [x, y]
     * @param {Array} [params.startColor] - Start color [r, g, b, a]
     * @param {Array} [params.endPoint] - End point [x, y]
     * @param {Array} [params.endColor] - End color [r, g, b, a]
     * @param {number} [params.rampShape] - 1=Linear, 2=Radial
     * @param {number} [params.scatter] - Ramp scatter amount
     * @param {number} [params.blendWithOriginal] - Blend with original (0-100)
     * @returns {Object} Result
     */
    function applyGradientRamp(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        if (!layer.Effects) {
            return Utils.error('Layer does not support effects');
        }
        
        var ramp;
        try {
            ramp = layer.Effects.addProperty('ADBE Ramp');
        } catch (e) {
            return Utils.error('Failed to add Gradient Ramp effect: ' + e.toString());
        }
        
        // Start Point
        if (params.startPoint) {
            Utils.setProp(ramp, 'ADBE Ramp-0001', params.startPoint);
        }
        
        // Start Color
        if (params.startColor) {
            Utils.setProp(ramp, 'ADBE Ramp-0002', params.startColor);
        }
        
        // End Point
        if (params.endPoint) {
            Utils.setProp(ramp, 'ADBE Ramp-0003', params.endPoint);
        }
        
        // End Color
        if (params.endColor) {
            Utils.setProp(ramp, 'ADBE Ramp-0004', params.endColor);
        }
        
        // Ramp Shape: 1=Linear, 2=Radial
        if (params.rampShape !== undefined) {
            Utils.setProp(ramp, 'ADBE Ramp-0005', params.rampShape);
        }
        
        // Ramp Scatter
        if (params.scatter !== undefined) {
            Utils.setProp(ramp, 'ADBE Ramp-0006', params.scatter);
        }
        
        // Blend with Original
        if (params.blendWithOriginal !== undefined) {
            Utils.setProp(ramp, 'ADBE Ramp-0007', params.blendWithOriginal);
        }
        
        return Utils.success({
            layer: layer.name,
            effect: 'Gradient Ramp'
        });
    }
    
    /**
     * Apply Fill effect to layer
     * @param {Object} params - Fill parameters
     * @param {number} [params.fillMask] - Fill Mask index
     * @param {boolean} [params.allMasks] - Apply to all masks
     * @param {Array} [params.color] - Fill color [r, g, b, a]
     * @param {boolean} [params.invert] - Invert the fill
     * @param {number} [params.horizontalFeather] - Horizontal feather amount
     * @param {number} [params.verticalFeather] - Vertical feather amount
     * @param {number} [params.opacity] - Fill opacity (0-100)
     * @returns {Object} Result
     */
    function applyFill(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        if (!layer.Effects) {
            return Utils.error('Layer does not support effects');
        }
        
        var fill;
        try {
            fill = layer.Effects.addProperty('ADBE Fill');
        } catch (e) {
            return Utils.error('Failed to add Fill effect: ' + e.toString());
        }
        
        // Fill Mask
        if (params.fillMask !== undefined) {
            Utils.setProp(fill, 'ADBE Fill-0001', params.fillMask);
        }
        
        // All Masks checkbox
        if (params.allMasks !== undefined) {
            Utils.setProp(fill, 'ADBE Fill-0002', params.allMasks ? 1 : 0);
        }
        
        // Color
        if (params.color) {
            Utils.setProp(fill, 'ADBE Fill-0003', params.color);
        }
        
        // Invert
        if (params.invert !== undefined) {
            Utils.setProp(fill, 'ADBE Fill-0004', params.invert ? 1 : 0);
        }
        
        // Horizontal Feather
        if (params.horizontalFeather !== undefined) {
            Utils.setProp(fill, 'ADBE Fill-0005', params.horizontalFeather);
        }
        
        // Vertical Feather
        if (params.verticalFeather !== undefined) {
            Utils.setProp(fill, 'ADBE Fill-0006', params.verticalFeather);
        }
        
        // Opacity
        if (params.opacity !== undefined) {
            Utils.setProp(fill, 'ADBE Fill-0007', params.opacity);
        }
        
        return Utils.success({
            layer: layer.name,
            effect: 'Fill',
            color: params.color
        });
    }
    
    /**
     * Apply 4-Color Gradient effect to layer
     * @param {Object} params - 4-Color Gradient parameters
     * @param {Array} [params.point1] - Point 1 position [x, y]
     * @param {Array} [params.color1] - Color 1 [r, g, b, a]
     * @param {Array} [params.point2] - Point 2 position [x, y]
     * @param {Array} [params.color2] - Color 2 [r, g, b, a]
     * @param {Array} [params.point3] - Point 3 position [x, y]
     * @param {Array} [params.color3] - Color 3 [r, g, b, a]
     * @param {Array} [params.point4] - Point 4 position [x, y]
     * @param {Array} [params.color4] - Color 4 [r, g, b, a]
     * @param {number} [params.blend] - Blend amount
     * @param {number} [params.jitter] - Jitter amount
     * @param {number} [params.opacity] - Effect opacity (0-100)
     * @returns {Object} Result
     */
    function apply4ColorGradient(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        if (!layer.Effects) {
            return Utils.error('Layer does not support effects');
        }
        
        var gradient;
        try {
            gradient = layer.Effects.addProperty('ADBE 4ColorGradient');
        } catch (e) {
            return Utils.error('Failed to add 4-Color Gradient effect: ' + e.toString());
        }
        
        // Point 1 and Color 1
        if (params.point1) {
            Utils.setProp(gradient, 'ADBE 4ColorGradient-0001', params.point1);
        }
        if (params.color1) {
            Utils.setProp(gradient, 'ADBE 4ColorGradient-0002', params.color1);
        }
        
        // Point 2 and Color 2
        if (params.point2) {
            Utils.setProp(gradient, 'ADBE 4ColorGradient-0003', params.point2);
        }
        if (params.color2) {
            Utils.setProp(gradient, 'ADBE 4ColorGradient-0004', params.color2);
        }
        
        // Point 3 and Color 3
        if (params.point3) {
            Utils.setProp(gradient, 'ADBE 4ColorGradient-0005', params.point3);
        }
        if (params.color3) {
            Utils.setProp(gradient, 'ADBE 4ColorGradient-0006', params.color3);
        }
        
        // Point 4 and Color 4
        if (params.point4) {
            Utils.setProp(gradient, 'ADBE 4ColorGradient-0007', params.point4);
        }
        if (params.color4) {
            Utils.setProp(gradient, 'ADBE 4ColorGradient-0008', params.color4);
        }
        
        // Blend
        if (params.blend !== undefined) {
            Utils.setProp(gradient, 'ADBE 4ColorGradient-0009', params.blend);
        }
        
        // Jitter
        if (params.jitter !== undefined) {
            Utils.setProp(gradient, 'ADBE 4ColorGradient-0010', params.jitter);
        }
        
        // Opacity
        if (params.opacity !== undefined) {
            Utils.setProp(gradient, 'ADBE 4ColorGradient-0011', params.opacity);
        }
        
        return Utils.success({
            layer: layer.name,
            effect: '4-Color Gradient'
        });
    }
    
    return {
        applyGradientRamp: applyGradientRamp,
        applyFill: applyFill,
        apply4ColorGradient: apply4ColorGradient
    };
})();

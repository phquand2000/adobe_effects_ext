// ============================================
// SERVICE: Expression Service
// Apply, remove, and manage property expressions
// ============================================

var ExpressionService = (function() {
    
    var propertyMap = {
        'position': 'ADBE Transform Group/ADBE Position',
        'scale': 'ADBE Transform Group/ADBE Scale',
        'rotation': 'ADBE Transform Group/ADBE Rotate Z',
        'opacity': 'ADBE Transform Group/ADBE Opacity',
        'anchorPoint': 'ADBE Transform Group/ADBE Anchor Point',
        'xRotation': 'ADBE Transform Group/ADBE Rotate X',
        'yRotation': 'ADBE Transform Group/ADBE Rotate Y',
        'zRotation': 'ADBE Transform Group/ADBE Rotate Z'
    };
    
    /**
     * Resolve property path from simple name or full path
     * @param {string} path - Property name or full path
     * @returns {string} Resolved property path
     */
    function resolvePropertyPath(path) {
        return propertyMap[path] || path;
    }
    
    /**
     * Get property from layer by path
     * @param {Layer} layer - The layer
     * @param {string} propertyPath - Property path (slash-separated)
     * @returns {Object} Property or error
     */
    function getPropertyByPath(layer, propertyPath) {
        var prop = layer;
        var pathParts = propertyPath.split('/');
        
        for (var i = 0; i < pathParts.length; i++) {
            prop = prop.property(pathParts[i]);
            if (!prop) {
                return { error: 'Property not found: ' + pathParts[i] };
            }
        }
        
        return { property: prop };
    }
    
    /**
     * Apply expression to a property
     * @param {Object} params - Parameters
     * @param {number} [params.layerIndex] - Layer index (1-based)
     * @param {string} [params.layerName] - Layer name (alternative to layerIndex)
     * @param {string} [params.property] - Simple property name (position, scale, etc.)
     * @param {string} [params.propertyPath] - Full property path
     * @param {string} params.expression - Expression string to apply
     * @returns {Object} Result
     */
    function applyExpression(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        var propertyPath = params.propertyPath || params.property;
        if (!propertyPath) {
            return Utils.error('No property specified');
        }
        
        propertyPath = resolvePropertyPath(propertyPath);
        
        var propResult = getPropertyByPath(layer, propertyPath);
        if (propResult.error) return Utils.error(propResult.error);
        var prop = propResult.property;
        
        if (!prop.canSetExpression) {
            return Utils.error('Cannot set expression on this property');
        }
        
        prop.expression = params.expression;
        
        return Utils.success({
            layer: layer.name,
            property: propertyPath,
            expression: params.expression
        });
    }
    
    /**
     * Remove expression from a property
     * @param {Object} params - Parameters
     * @param {number} params.layerIndex - Layer index (1-based)
     * @param {string} [params.property] - Simple property name
     * @param {string} [params.propertyPath] - Full property path
     * @returns {Object} Result
     */
    function removeExpression(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        var propertyPath = params.propertyPath || params.property;
        if (!propertyPath) {
            return Utils.error('No property specified');
        }
        
        propertyPath = resolvePropertyPath(propertyPath);
        
        var propResult = getPropertyByPath(layer, propertyPath);
        if (propResult.error) return Utils.error(propResult.error);
        var prop = propResult.property;
        
        prop.expression = '';
        
        return Utils.success({
            layer: layer.name,
            property: propertyPath
        });
    }
    
    /**
     * Apply a common expression preset
     * @param {Object} params - Parameters
     * @param {string} params.preset - Preset name: wiggle, loop, loopIn, time, bounce, followNull
     * @param {number} [params.layerIndex] - Layer index
     * @param {string} [params.layerName] - Layer name
     * @param {string} [params.property] - Simple property name
     * @param {string} [params.propertyPath] - Full property path
     * @param {number} [params.frequency] - Frequency for wiggle/bounce (default: 2)
     * @param {number} [params.amplitude] - Amplitude for wiggle/bounce (default: 50 for wiggle, 0.1 for bounce)
     * @param {string} [params.loopType] - Loop type: cycle, pingpong, offset, continue (default: cycle)
     * @param {number} [params.multiplier] - Multiplier for time expression (default: 100)
     * @param {number} [params.decay] - Decay for bounce (default: 4)
     * @param {string} [params.nullName] - Null layer name for followNull (default: 'Null Controller')
     * @returns {Object} Result
     */
    function applyExpressionPreset(params) {
        var presets = {
            'wiggle': 'wiggle(' + (params.frequency || 2) + ', ' + (params.amplitude || 50) + ')',
            'loop': 'loopOut("' + (params.loopType || 'cycle') + '")',
            'loopIn': 'loopIn("' + (params.loopType || 'cycle') + '")',
            'time': 'time * ' + (params.multiplier || 100),
            'bounce': 'n = 0; if (numKeys > 0) { n = nearestKey(time).index; if (key(n).time > time) { n--; } } if (n == 0) { t = 0; } else { t = time - key(n).time; } if (n > 0 && t < 1) { v = velocityAtTime(key(n).time - thisComp.frameDuration/10); amp = ' + (params.amplitude || 0.1) + '; freq = ' + (params.frequency || 2) + '; decay = ' + (params.decay || 4) + '; value + v*amp*Math.sin(freq*t*2*Math.PI)/Math.exp(decay*t); } else { value; }',
            'followNull': 'thisComp.layer("' + (params.nullName || 'Null Controller') + '").transform.position'
        };
        
        var expression = presets[params.preset];
        if (!expression) {
            return Utils.error('Unknown preset: ' + params.preset + '. Available: wiggle, loop, loopIn, time, bounce, followNull');
        }
        
        params.expression = expression;
        return applyExpression(params);
    }
    
    return {
        applyExpression: applyExpression,
        removeExpression: removeExpression,
        applyExpressionPreset: applyExpressionPreset
    };
})();

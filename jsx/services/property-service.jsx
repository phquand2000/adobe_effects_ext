// ============================================
// SERVICE: Property Service
// Property manipulation and keyframe operations
// ============================================

var PropertyService = (function() {
    
    /**
     * Navigate to a property by path
     * @param {Layer} layer - The layer to search
     * @param {string} propertyPath - Path like "ADBE Transform Group/ADBE Position"
     * @returns {Object} Property or error
     */
    function navigateToProperty(layer, propertyPath) {
        var prop = layer;
        var pathParts = propertyPath.split('/');
        
        for (var i = 0; i < pathParts.length; i++) {
            prop = prop.property(pathParts[i]);
            if (!prop) {
                return { error: 'Property not found: ' + pathParts[i] };
            }
        }
        
        return { prop: prop };
    }
    
    /**
     * Apply easing to a keyframe
     * @param {Property} prop - The property with keyframes
     * @param {number} keyIndex - Index of the keyframe (1-based)
     * @param {string} easing - Easing type: 'linear', 'easeIn', 'easeOut', 'easeInOut'
     */
    function applyKeyframeEasing(prop, keyIndex, easing) {
        try {
            var easeIn, easeOut;
            
            switch (easing) {
                case 'easeIn':
                    easeIn = new KeyframeEase(0.33, 66);
                    easeOut = new KeyframeEase(0, 0);
                    break;
                case 'easeOut':
                    easeIn = new KeyframeEase(0, 0);
                    easeOut = new KeyframeEase(0.33, 66);
                    break;
                case 'easeInOut':
                    easeIn = new KeyframeEase(0.33, 66);
                    easeOut = new KeyframeEase(0.33, 66);
                    break;
                case 'linear':
                default:
                    easeIn = new KeyframeEase(0, 0);
                    easeOut = new KeyframeEase(0, 0);
                    break;
            }
            
            var dims = 1;
            if (prop.value instanceof Array) {
                dims = prop.value.length;
            }
            
            var easeInArray = [];
            var easeOutArray = [];
            for (var d = 0; d < dims; d++) {
                easeInArray.push(easeIn);
                easeOutArray.push(easeOut);
            }
            
            prop.setTemporalEaseAtKey(keyIndex, easeInArray, easeOutArray);
        } catch (e) {
            // Easing not supported for this property
        }
    }
    
    /**
     * Set any property by path
     * @param {Object} params - Parameters
     * @param {number} [params.layerIndex] - Layer index (1-based)
     * @param {string} [params.layerName] - Layer name
     * @param {string} params.propertyPath - Property path (e.g., "ADBE Transform Group/ADBE Position")
     * @param {*} params.value - Value to set
     * @returns {Object} Result
     */
    function setProperty(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        var propertyPath = params.propertyPath || params.property;
        if (!propertyPath) {
            return Utils.error('No property path specified');
        }
        
        var propResult = navigateToProperty(layer, propertyPath);
        if (propResult.error) return propResult;
        var prop = propResult.prop;
        
        var hadExpression = false;
        try {
            if (prop.expressionEnabled) {
                hadExpression = true;
                prop.expressionEnabled = false;
                prop.expression = '';
            }
        } catch (e) {
            // Property doesn't support expressions
        }
        
        try {
            prop.setValue(params.value);
        } catch (e) {
            if (!prop.canSetValue) {
                return Utils.error('Cannot set value on this property (read-only)');
            }
            return Utils.error('Failed to set value: ' + e.toString());
        }
        
        return Utils.success({
            layer: layer.name,
            property: propertyPath,
            value: params.value,
            clearedExpression: hadExpression
        });
    }
    
    /**
     * Get property value
     * @param {Object} params - Parameters
     * @param {number} [params.layerIndex] - Layer index (1-based)
     * @param {string} [params.layerName] - Layer name
     * @param {string} params.propertyPath - Property path
     * @returns {Object} Result with value and numKeys
     */
    function getProperty(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        var propertyPath = params.propertyPath || params.property;
        if (!propertyPath) {
            return Utils.error('No property path specified');
        }
        
        var propResult = navigateToProperty(layer, propertyPath);
        if (propResult.error) return propResult;
        var prop = propResult.prop;
        
        return Utils.success({
            layer: layer.name,
            property: propertyPath,
            value: prop.value,
            numKeys: prop.numKeys || 0
        });
    }
    
    /**
     * Add keyframe to property
     * @param {Object} params - Parameters
     * @param {number} [params.layerIndex] - Layer index (1-based)
     * @param {string} [params.layerName] - Layer name
     * @param {string} params.propertyPath - Property path
     * @param {number} [params.time] - Time in seconds (defaults to current time)
     * @param {*} params.value - Keyframe value
     * @param {string} [params.easing] - Easing type
     * @returns {Object} Result
     */
    function addKeyframe(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        var propertyPath = params.propertyPath || params.property;
        if (!propertyPath) {
            return Utils.error('No property path specified');
        }
        
        var propResult = navigateToProperty(layer, propertyPath);
        if (propResult.error) return propResult;
        var prop = propResult.prop;
        
        if (!prop.canVaryOverTime) {
            return Utils.error('Property cannot be keyframed');
        }
        
        var time = params.time !== undefined ? params.time : comp.time;
        prop.setValueAtTime(time, params.value);
        
        if (params.easing && prop.numKeys > 0) {
            var keyIndex = prop.nearestKeyIndex(time);
            applyKeyframeEasing(prop, keyIndex, params.easing);
        }
        
        return Utils.success({
            layer: layer.name,
            property: propertyPath,
            time: time,
            value: params.value,
            keyIndex: prop.numKeys
        });
    }
    
    /**
     * Animate property from one value to another
     * @param {Object} params - Parameters
     * @param {number} [params.layerIndex] - Layer index (1-based)
     * @param {string} [params.layerName] - Layer name
     * @param {string} params.propertyPath - Property path
     * @param {number} [params.startTime] - Start time in seconds (defaults to current time)
     * @param {number} [params.duration] - Duration in seconds (defaults to 1)
     * @param {*} params.startValue - Starting value
     * @param {*} params.endValue - Ending value
     * @param {string} [params.easing] - Easing type (defaults to 'easeInOut')
     * @returns {Object} Result
     */
    function animateProperty(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        var propertyPath = params.propertyPath || params.property;
        if (!propertyPath) {
            return Utils.error('No property path specified');
        }
        
        var propResult = navigateToProperty(layer, propertyPath);
        if (propResult.error) return propResult;
        var prop = propResult.prop;
        
        if (!prop.canVaryOverTime) {
            return Utils.error('Property cannot be keyframed');
        }
        
        var startTime = params.startTime !== undefined ? params.startTime : comp.time;
        var duration = params.duration !== undefined ? params.duration : 1;
        var endTime = startTime + duration;
        
        prop.setValueAtTime(startTime, params.startValue);
        prop.setValueAtTime(endTime, params.endValue);
        
        var easing = params.easing || 'easeInOut';
        applyKeyframeEasing(prop, 1, easing);
        applyKeyframeEasing(prop, 2, easing);
        
        return Utils.success({
            layer: layer.name,
            property: propertyPath,
            startTime: startTime,
            endTime: endTime,
            startValue: params.startValue,
            endValue: params.endValue
        });
    }
    
    return {
        setProperty: setProperty,
        getProperty: getProperty,
        addKeyframe: addKeyframe,
        animateProperty: animateProperty
    };
})();

// ============================================
// DATA LAYER: Property Repository
// Provides access to After Effects properties
// ============================================

var PropertyData = (function() {
    
    /**
     * Get a property by path
     * @param {Layer} layer - The layer
     * @param {string} propertyPath - Path like "ADBE Transform Group/ADBE Position"
     * @returns {Property|null} The property or null
     */
    function getPropertyByPath(layer, propertyPath) {
        try {
            var pathParts = propertyPath.split('/');
            var prop = layer;
            
            for (var i = 0; i < pathParts.length; i++) {
                prop = prop.property(pathParts[i]);
                if (!prop) return null;
            }
            
            return prop;
        } catch (e) {
            return null;
        }
    }
    
    /**
     * Set a property value
     * @param {Property} prop - The property
     * @param {*} value - Value to set
     * @returns {boolean} Success status
     */
    function setValue(prop, value) {
        try {
            // Clear expression if exists
            if (prop.expression && prop.expression !== '') {
                prop.expression = '';
            }
            
            if (prop.canSetValue) {
                prop.setValue(value);
                return true;
            }
            return false;
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Get a property value
     * @param {Property} prop - The property
     * @returns {*} The value
     */
    function getValue(prop) {
        try {
            return prop.value;
        } catch (e) {
            return null;
        }
    }
    
    /**
     * Add a keyframe
     * @param {Property} prop - The property
     * @param {number} time - Time in seconds
     * @param {*} value - Value to set
     * @returns {number} Keyframe index or -1
     */
    function addKeyframe(prop, time, value) {
        try {
            prop.setValueAtTime(time, value);
            return prop.nearestKeyIndex(time);
        } catch (e) {
            return -1;
        }
    }
    
    /**
     * Set keyframe easing
     * @param {Property} prop - The property
     * @param {number} keyIndex - Keyframe index
     * @param {string} easeType - 'linear', 'easeIn', 'easeOut', 'easeInOut', 'hold'
     */
    function setKeyframeEasing(prop, keyIndex, easeType) {
        try {
            var easeIn, easeOut;
            
            switch (easeType) {
                case 'linear':
                    easeIn = new KeyframeEase(0, 33);
                    easeOut = new KeyframeEase(0, 33);
                    break;
                case 'easeIn':
                    easeIn = new KeyframeEase(0, 33);
                    easeOut = new KeyframeEase(100, 55);
                    break;
                case 'easeOut':
                    easeIn = new KeyframeEase(100, 55);
                    easeOut = new KeyframeEase(0, 33);
                    break;
                case 'easeInOut':
                    easeIn = new KeyframeEase(100, 55);
                    easeOut = new KeyframeEase(100, 55);
                    break;
                case 'hold':
                    prop.setInterpolationTypeAtKey(keyIndex, KeyframeInterpolationType.HOLD);
                    return;
                default:
                    return;
            }
            
            var dims = prop.value instanceof Array ? prop.value.length : 1;
            var easeInArray = [];
            var easeOutArray = [];
            for (var i = 0; i < dims; i++) {
                easeInArray.push(easeIn);
                easeOutArray.push(easeOut);
            }
            
            prop.setTemporalEaseAtKey(keyIndex, easeInArray, easeOutArray);
        } catch (e) {
            // Easing not supported for this property
        }
    }
    
    /**
     * Animate a property from start to end value
     * @param {Property} prop - The property
     * @param {number} startTime - Start time in seconds
     * @param {*} startValue - Start value
     * @param {number} endTime - End time in seconds
     * @param {*} endValue - End value
     * @param {string} [easing] - Easing type
     * @returns {Object} { startKey, endKey }
     */
    function animate(prop, startTime, startValue, endTime, endValue, easing) {
        var startKey = addKeyframe(prop, startTime, startValue);
        var endKey = addKeyframe(prop, endTime, endValue);
        
        if (easing) {
            setKeyframeEasing(prop, startKey, easing);
            setKeyframeEasing(prop, endKey, easing);
        }
        
        return { startKey: startKey, endKey: endKey };
    }
    
    /**
     * Set expression on a property
     * @param {Property} prop - The property
     * @param {string} expression - Expression code
     * @returns {boolean} Success status
     */
    function setExpression(prop, expression) {
        try {
            prop.expression = expression;
            return true;
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Remove expression from a property
     * @param {Property} prop - The property
     * @returns {boolean} Success status
     */
    function removeExpression(prop) {
        try {
            prop.expression = '';
            return true;
        } catch (e) {
            return false;
        }
    }
    
    return {
        getPropertyByPath: getPropertyByPath,
        setValue: setValue,
        getValue: getValue,
        addKeyframe: addKeyframe,
        setKeyframeEasing: setKeyframeEasing,
        animate: animate,
        setExpression: setExpression,
        removeExpression: removeExpression
    };
})();

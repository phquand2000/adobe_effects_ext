// ============================================
// DOMAIN: Animation
// Keyframe and animation utilities
// ============================================

var AnimationDomain = (function() {
    
    /**
     * Easing presets
     */
    var EASING_PRESETS = {
        linear: { influence: 0, speed: 33 },
        easeIn: { inInfluence: 0, inSpeed: 33, outInfluence: 100, outSpeed: 55 },
        easeOut: { inInfluence: 100, inSpeed: 55, outInfluence: 0, outSpeed: 33 },
        easeInOut: { inInfluence: 100, inSpeed: 55, outInfluence: 100, outSpeed: 55 }
    };
    
    /**
     * Apply easing to all keyframes on a property
     * @param {Property} property - The property
     * @param {string} easingType - 'linear', 'easeIn', 'easeOut', 'easeInOut'
     */
    function applyEasing(property, easingType) {
        var numKeys = property.numKeys;
        if (numKeys < 2) return;
        
        var easeIn, easeOut;
        
        switch (easingType) {
            case 'easeIn':
                easeIn = new KeyframeEase(0.75, 50);
                easeOut = new KeyframeEase(0.25, 50);
                break;
            case 'easeOut':
                easeIn = new KeyframeEase(0.25, 50);
                easeOut = new KeyframeEase(0.75, 50);
                break;
            case 'easeInOut':
            default:
                easeIn = new KeyframeEase(0.5, 75);
                easeOut = new KeyframeEase(0.5, 75);
        }
        
        for (var i = 1; i <= numKeys; i++) {
            try {
                var val = property.keyValue(i);
                var dim = (val instanceof Array) ? val.length : 1;
                var easeInArr = [];
                var easeOutArr = [];
                for (var d = 0; d < dim; d++) {
                    easeInArr.push(easeIn);
                    easeOutArr.push(easeOut);
                }
                property.setTemporalEaseAtKey(i, easeInArr, easeOutArr);
            } catch (e) {
                // Easing not supported for this property
            }
        }
    }
    
    /**
     * Apply easing to a single keyframe
     * @param {Property} prop - The property
     * @param {number} keyIndex - Keyframe index
     * @param {string} easing - Easing type
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
     * Safely set keyframes on a property
     * @param {Property} prop - The property
     * @param {string} propName - Property display name (for logging)
     * @param {number} startTime - Start time in seconds
     * @param {*} startVal - Start value
     * @param {number} endTime - End time in seconds
     * @param {*} endVal - End value
     * @returns {Object} { success: boolean, animated: boolean, error: string? }
     */
    function safeSetKeyframes(prop, propName, startTime, startVal, endTime, endVal) {
        if (!prop) {
            return { success: false, animated: false, error: propName + ' not found' };
        }
        
        try {
            if (prop.canVaryOverTime) {
                prop.setValueAtTime(startTime, startVal);
                prop.setValueAtTime(endTime, endVal);
                return { success: true, animated: true };
            } else {
                prop.setValue(endVal);
                return { success: true, animated: false };
            }
        } catch (e) {
            return { success: false, animated: false, error: propName + ': ' + e.message };
        }
    }
    
    /**
     * Animate property from start to end value
     * @param {Property} prop - The property
     * @param {number} startTime - Start time
     * @param {*} startValue - Start value
     * @param {number} endTime - End time
     * @param {*} endValue - End value
     * @param {string} [easing] - Easing type
     * @returns {Object} { startKey, endKey }
     */
    function animateProperty(prop, startTime, startValue, endTime, endValue, easing) {
        prop.setValueAtTime(startTime, startValue);
        prop.setValueAtTime(endTime, endValue);
        
        if (easing) {
            applyKeyframeEasing(prop, 1, easing);
            applyKeyframeEasing(prop, 2, easing);
        }
        
        return { 
            startKey: prop.nearestKeyIndex(startTime), 
            endKey: prop.nearestKeyIndex(endTime) 
        };
    }
    
    /**
     * Expression presets
     */
    var EXPRESSION_PRESETS = {
        wiggle: function(params) {
            return 'wiggle(' + (params.frequency || 2) + ', ' + (params.amplitude || 50) + ')';
        },
        loop: function(params) {
            return 'loopOut("' + (params.loopType || 'cycle') + '")';
        },
        loopIn: function(params) {
            return 'loopIn("' + (params.loopType || 'cycle') + '")';
        },
        time: function(params) {
            return 'time * ' + (params.multiplier || 100);
        },
        bounce: function(params) {
            return 'n = 0; if (numKeys > 0) { n = nearestKey(time).index; if (key(n).time > time) { n--; } } if (n == 0) { t = 0; } else { t = time - key(n).time; } if (n > 0 && t < 1) { v = velocityAtTime(key(n).time - thisComp.frameDuration/10); amp = ' + (params.amplitude || 0.1) + '; freq = ' + (params.frequency || 2) + '; decay = ' + (params.decay || 4) + '; value + v*amp*Math.sin(freq*t*2*Math.PI)/Math.exp(decay*t); } else { value; }';
        },
        followNull: function(params) {
            return 'thisComp.layer("' + (params.nullName || 'Null Controller') + '").transform.position';
        }
    };
    
    /**
     * Get expression from preset
     * @param {string} presetName - Preset name
     * @param {Object} params - Preset parameters
     * @returns {string|null} Expression or null if not found
     */
    function getExpressionPreset(presetName, params) {
        if (EXPRESSION_PRESETS[presetName]) {
            return EXPRESSION_PRESETS[presetName](params || {});
        }
        return null;
    }
    
    return {
        EASING_PRESETS: EASING_PRESETS,
        applyEasing: applyEasing,
        applyKeyframeEasing: applyKeyframeEasing,
        safeSetKeyframes: safeSetKeyframes,
        animateProperty: animateProperty,
        getExpressionPreset: getExpressionPreset
    };
})();

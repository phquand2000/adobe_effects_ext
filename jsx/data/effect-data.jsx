// ============================================
// DATA LAYER: Effect Repository
// Provides access to After Effects effects
// ============================================

var EffectData = (function() {
    
    /**
     * Add an effect to a layer
     * @param {Layer} layer - The layer
     * @param {string} matchName - Effect match name
     * @returns {PropertyGroup|null} The effect or null
     */
    function addEffect(layer, matchName) {
        if (!layer.Effects) return null;
        try {
            return layer.Effects.addProperty(matchName);
        } catch (e) {
            return null;
        }
    }
    
    /**
     * Get an effect from a layer
     * @param {Layer} layer - The layer
     * @param {string|number} nameOrIndex - Effect name or index
     * @returns {PropertyGroup|null} The effect or null
     */
    function getEffect(layer, nameOrIndex) {
        if (!layer.Effects) return null;
        try {
            return layer.Effects.property(nameOrIndex);
        } catch (e) {
            return null;
        }
    }
    
    /**
     * Set effect property value
     * @param {PropertyGroup} effect - The effect
     * @param {string} propName - Property match name
     * @param {*} value - Value to set
     * @returns {boolean} Success status
     */
    function setEffectProp(effect, propName, value) {
        return Utils.setProp(effect, propName, value);
    }
    
    /**
     * Apply multiple properties to an effect
     * @param {PropertyGroup} effect - The effect
     * @param {Object} props - { matchName: value } mapping
     */
    function setEffectProps(effect, props) {
        for (var propName in props) {
            if (props.hasOwnProperty(propName) && props[propName] !== undefined) {
                Utils.setProp(effect, propName, props[propName]);
            }
        }
    }
    
    /**
     * Remove an effect from a layer
     * @param {Layer} layer - The layer
     * @param {string|number} nameOrIndex - Effect name or index
     * @returns {boolean} Success status
     */
    function removeEffect(layer, nameOrIndex) {
        try {
            var effect = getEffect(layer, nameOrIndex);
            if (effect) {
                effect.remove();
                return true;
            }
            return false;
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Check if an effect exists on a layer
     * @param {Layer} layer - The layer
     * @param {string} matchName - Effect match name
     * @returns {boolean} True if exists
     */
    function hasEffect(layer, matchName) {
        if (!layer.Effects) return false;
        try {
            var effect = layer.Effects.property(matchName);
            return effect !== null;
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Get effect count
     * @param {Layer} layer - The layer
     * @returns {number} Number of effects
     */
    function getEffectCount(layer) {
        if (!layer.Effects) return 0;
        return layer.Effects.numProperties;
    }
    
    // Effect Match Names Registry
    var EFFECT_MATCH_NAMES = {
        // Blur
        gaussianBlur: 'ADBE Gaussian Blur 2',
        directionalBlur: 'ADBE Motion Blur',
        radialBlur: 'ADBE Radial Blur',
        boxBlur: 'ADBE Box Blur2',
        cameraLensBlur: 'ADBE Camera Lens Blur',
        bilateralBlur: 'ADBE Bilateral',
        compoundBlur: 'ADBE Compound Blur',
        vectorBlur: 'CC Vector Blur',
        
        // Glow
        glow: 'ADBE Glo2',
        
        // Color
        lumetri: 'ADBE Lumetri',
        curves: 'ADBE CurvesCustom',
        vibrance: 'ADBE Vibrance',
        hueSaturation: 'ADBE HUE SATURATION',
        colorBalance: 'ADBE Color Balance 2',
        
        // Keying
        keylight: 'Keylight 906',
        spillSuppressor: 'ADBE Spill2',
        keyCleaner: 'ADBE KeyCleaner',
        extract: 'ADBE Extract',
        
        // Distort
        cornerPin: 'ADBE Corner Pin',
        meshWarp: 'ADBE MESH WARP',
        bezierWarp: 'ADBE BEZMESH',
        displacementMap: 'ADBE Displacement Map',
        warpStabilizer: 'ADBE SubspaceStabilizer',
        
        // Time
        timewarp: 'ADBE Timewarp',
        pixelMotionBlur: 'ADBE OFMotionBlur',
        posterizeTime: 'ADBE Posterize Time',
        
        // Noise & Grain - AE 2025+ uses new match names
        fractalNoise: 'ADBE Fractal Noise',           // AE 2025+, fallback: 'ADBE AIF Perlin Noise 3'
        fractalNoiseLegacy: 'ADBE AIF Perlin Noise 3', // Pre-2025
        matchGrain: 'VISINF Grain Duplication',       // AE 2025+, fallback: 'ADBE Match Grain'
        matchGrainLegacy: 'ADBE Match Grain',         // Pre-2025
        addGrain: 'VISINF Grain Implant',             // AE 2025+, fallback: 'ADBE Add Grain'
        addGrainLegacy: 'ADBE Add Grain',             // Pre-2025
        
        // Generate
        gradientRamp: 'ADBE Ramp',
        fill: 'ADBE Fill',
        fourColorGradient: 'ADBE 4ColorGradient',
        
        // Tracking
        cameraTracker: 'ADBE 3D Camera Tracker'
    };
    
    /**
     * Get effect match name by key
     * @param {string} key - Effect key
     * @returns {string|null} Match name or null
     */
    function getMatchName(key) {
        return EFFECT_MATCH_NAMES[key] || null;
    }
    
    return {
        addEffect: addEffect,
        getEffect: getEffect,
        setEffectProp: setEffectProp,
        setEffectProps: setEffectProps,
        removeEffect: removeEffect,
        hasEffect: hasEffect,
        getEffectCount: getEffectCount,
        getMatchName: getMatchName,
        MATCH_NAMES: EFFECT_MATCH_NAMES
    };
})();

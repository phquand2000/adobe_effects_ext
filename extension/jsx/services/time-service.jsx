// ============================================
// SERVICE: Time Service
// Time-based effect operations (Timewarp, Motion Blur, Posterize Time)
// ============================================

var TimeService = (function() {
    
    /**
     * Apply Timewarp effect to layer
     * @param {Object} params - Timewarp parameters
     * @param {number} [params.method] - 1=Whole Frames, 2=Frame Mix, 3=Pixel Motion
     * @param {number} [params.speed] - Speed percentage
     * @param {boolean} [params.motionBlur] - Enable motion blur
     * @param {number} [params.shutterAngle] - Shutter angle
     * @returns {Object} Result
     */
    function applyTimewarp(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        if (!layer.Effects) {
            return Utils.error('Layer does not support effects');
        }
        
        var timewarp = layer.Effects.addProperty('ADBE Timewarp');
        if (!timewarp) {
            return Utils.error('Failed to add Timewarp effect');
        }
        
        // Method: 1=Whole Frames, 2=Frame Mix, 3=Pixel Motion
        if (params.method !== undefined) {
            Utils.setProp(timewarp, 'ADBE Timewarp-0001', params.method);
        }
        
        // Speed (%)
        if (params.speed !== undefined) {
            Utils.setProp(timewarp, 'ADBE Timewarp-0003', params.speed);
        }
        
        // Tuning - Motion Blur
        if (params.motionBlur !== undefined) {
            Utils.setProp(timewarp, 'ADBE Timewarp-0006', params.motionBlur ? 1 : 0);
        }
        
        // Shutter Angle
        if (params.shutterAngle !== undefined) {
            Utils.setProp(timewarp, 'ADBE Timewarp-0007', params.shutterAngle);
        }
        
        return Utils.success({
            layer: layer.name,
            effect: 'Timewarp',
            speed: params.speed
        });
    }
    
    /**
     * Apply Pixel Motion Blur effect to layer
     * @param {Object} params - Pixel Motion Blur parameters
     * @param {number} [params.shutterAngle] - Shutter angle (0-720)
     * @param {number} [params.shutterSamples] - Shutter samples
     * @param {number} [params.vectorDetail] - Vector detail
     * @returns {Object} Result
     */
    function applyPixelMotionBlur(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        if (!layer.Effects) {
            return Utils.error('Layer does not support effects');
        }
        
        var motionBlur = layer.Effects.addProperty('ADBE OFMotionBlur');
        if (!motionBlur) {
            return Utils.error('Failed to add Pixel Motion Blur effect');
        }
        
        // Shutter Angle (0-720)
        if (params.shutterAngle !== undefined) {
            Utils.setProp(motionBlur, 'ADBE OFMotionBlur-0001', params.shutterAngle);
        }
        
        // Shutter Samples
        if (params.shutterSamples !== undefined) {
            Utils.setProp(motionBlur, 'ADBE OFMotionBlur-0002', params.shutterSamples);
        }
        
        // Vector Detail
        if (params.vectorDetail !== undefined) {
            Utils.setProp(motionBlur, 'ADBE OFMotionBlur-0003', params.vectorDetail);
        }
        
        return Utils.success({
            layer: layer.name,
            effect: 'Pixel Motion Blur',
            shutterAngle: params.shutterAngle
        });
    }
    
    /**
     * Apply Posterize Time effect to layer
     * @param {Object} params - Posterize Time parameters
     * @param {number} [params.frameRate] - Target frame rate
     * @returns {Object} Result
     */
    function applyPosterizeTime(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        if (!layer.Effects) {
            return Utils.error('Layer does not support effects');
        }
        
        var posterize = layer.Effects.addProperty('ADBE Posterize Time');
        if (!posterize) {
            return Utils.error('Failed to add Posterize Time effect');
        }
        
        // Frame Rate
        if (params.frameRate !== undefined) {
            Utils.setProp(posterize, 'ADBE Posterize Time-0001', params.frameRate);
        }
        
        return Utils.success({
            layer: layer.name,
            effect: 'Posterize Time',
            frameRate: params.frameRate
        });
    }
    
    return {
        applyTimewarp: applyTimewarp,
        applyPixelMotionBlur: applyPixelMotionBlur,
        applyPosterizeTime: applyPosterizeTime
    };
})();

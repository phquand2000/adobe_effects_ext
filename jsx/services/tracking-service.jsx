// ============================================
// SERVICE LAYER: Tracking Service
// Handles 3D camera tracking operations
// Dependencies: Utils, CompositionData
// ============================================

var TrackingService = (function() {
    
    /**
     * Apply 3D Camera Tracker effect to a layer
     * @param {Object} params - { layerIndex: number }
     * @returns {Object} Result with success/error
     */
    function setup3DCameraTracker(params) {
        var result = CompositionData.getActiveComp();
        if (result.error) return result;
        var comp = result.comp;
        
        var layerIndex = params.layerIndex || 1;
        var layer = comp.layer(layerIndex);
        
        if (!layer) {
            return Utils.error('Layer not found at index ' + layerIndex);
        }
        
        try {
            var tracker = layer.Effects.addProperty('ADBE 3D Camera Tracker');
            
            return Utils.success({
                layer: layer.name,
                message: 'Camera Tracker applied. Please click "Analyze" in the Effect Controls to track the footage.',
                manualStep: true
            });
        } catch (e) {
            return Utils.error('Failed to add 3D Camera Tracker: ' + e.toString());
        }
    }
    
    /**
     * Link a layer to a tracked null or camera
     * @param {Object} params - { coinLayerIndex: number }
     * @returns {Object} Result with parent info
     */
    function linkToTrackPoint(params) {
        var result = CompositionData.getActiveComp();
        if (result.error) return result;
        var comp = result.comp;
        
        var trackedNull = null;
        var trackedCamera = null;
        
        for (var i = 1; i <= comp.numLayers; i++) {
            var layer = comp.layer(i);
            if (layer.name.indexOf('Track') !== -1) {
                if (layer instanceof CameraLayer) {
                    trackedCamera = layer;
                } else if (layer.nullLayer) {
                    trackedNull = layer;
                }
            }
        }
        
        if (!trackedNull && !trackedCamera) {
            return Utils.error(
                'No tracked null or camera found. Please create a null/camera from a track point first.',
                { hint: 'Right-click a track point > Create Null and Camera' }
            );
        }
        
        var coinLayerIndex = params.coinLayerIndex || 1;
        var coinLayer = comp.layer(coinLayerIndex);
        
        if (!coinLayer) {
            return Utils.error('Layer not found at index ' + coinLayerIndex);
        }
        
        if (trackedNull) {
            coinLayer.parent = trackedNull;
            return Utils.success({
                coinLayer: coinLayer.name,
                parentedTo: trackedNull.name
            });
        }
        
        return Utils.success({
            camera: trackedCamera ? trackedCamera.name : null
        });
    }
    
    return {
        setup3DCameraTracker: setup3DCameraTracker,
        linkToTrackPoint: linkToTrackPoint
    };
})();

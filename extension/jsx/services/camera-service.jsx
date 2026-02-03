// ============================================
// SERVICE: Camera Service
// High-level camera operations
// ============================================

var CameraService = (function() {
    
    /**
     * Add a camera to the active composition
     * @param {Object} params - Camera parameters
     * @returns {Object} Result
     */
    function addCamera(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var name = params.name || 'AI Camera';
        var focalLength = params.focalLength || 35;
        var position = params.position || [comp.width / 2, comp.height / 2, -1500];
        var pointOfInterest = params.pointOfInterest || [comp.width / 2, comp.height / 2, 0];
        
        var cameraLayer = CameraDomain.createCamera(comp, { name: name });
        var camOptions = CameraDomain.getCameraOptions(cameraLayer);
        
        var zoom = CameraDomain.focalLengthToZoom(focalLength, comp.width);
        Utils.setProp(camOptions, 'ADBE Camera Zoom', zoom);
        
        var transform = cameraLayer.property('ADBE Transform Group');
        Utils.setProp(transform, 'ADBE Position', position);
        Utils.setProp(transform, 'ADBE Anchor Point', pointOfInterest);
        
        if (params.enableDOF) {
            CameraDomain.enableDOF(cameraLayer, params);
        }
        
        return Utils.success({
            camera: name,
            layerIndex: cameraLayer.index,
            focalLength: focalLength,
            dof: params.enableDOF || false
        });
    }
    
    /**
     * Setup depth of field on existing camera
     * @param {Object} params - DOF parameters
     * @returns {Object} Result
     */
    function setupDOF(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var cameraResult = CameraDomain.findCamera(comp, params);
        if (cameraResult.error) return cameraResult;
        var cameraLayer = cameraResult.camera;
        
        CameraDomain.enableDOF(cameraLayer, {
            focusDistance: params.focusDistance,
            blurLevel: params.blurLevel || 100
        });
        
        return Utils.success({ camera: cameraLayer.name });
    }
    
    /**
     * Set camera iris properties
     * @param {Object} params - Iris parameters
     * @returns {Object} Result
     */
    function setCameraIris(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var cameraResult = CameraDomain.findCamera(comp, params);
        if (cameraResult.error) return cameraResult;
        var cameraLayer = cameraResult.camera;
        
        var camOptions = CameraDomain.getCameraOptions(cameraLayer);
        var applied = [];
        
        if (params.enableDOF !== false) {
            Utils.setProp(camOptions, 'ADBE Camera Depth of Field', 1);
            applied.push('DOF enabled');
        }
        
        if (params.aperture !== undefined) {
            Utils.setProp(camOptions, 'ADBE Camera Aperture', params.aperture);
            applied.push('Aperture: ' + params.aperture);
        }
        
        if (params.blurLevel !== undefined) {
            Utils.setProp(camOptions, 'ADBE Camera Blur Level', params.blurLevel);
            applied.push('Blur Level: ' + params.blurLevel);
        }
        
        var irisApplied = CameraDomain.setIrisProperties(cameraLayer, params);
        applied = applied.concat(irisApplied);
        
        return Utils.success({
            camera: cameraLayer.name,
            applied: applied
        });
    }
    
    /**
     * Animate focus rack between two distances
     * @param {Object} params - Focus animation parameters
     * @returns {Object} Result
     */
    function animateFocusRack(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var cameraResult = CameraDomain.findCamera(comp, params);
        if (cameraResult.error) return cameraResult;
        var cameraLayer = cameraResult.camera;
        
        var camOptions = CameraDomain.getCameraOptions(cameraLayer);
        Utils.setProp(camOptions, 'ADBE Camera Depth of Field', 1);
        
        var focusProp = camOptions.property('ADBE Camera Focus Distance');
        if (!focusProp) {
            return Utils.error('Focus Distance property not found');
        }
        
        var startTime = params.startTime !== undefined ? params.startTime : comp.time;
        var endTime = params.endTime !== undefined ? params.endTime : startTime + 2;
        var startFocus = params.startFocus !== undefined ? params.startFocus : 500;
        var endFocus = params.endFocus !== undefined ? params.endFocus : 1500;
        
        focusProp.setValueAtTime(startTime, startFocus);
        focusProp.setValueAtTime(endTime, endFocus);
        
        AnimationDomain.applyEasing(focusProp, params.easing || 'easeInOut');
        
        return Utils.success({
            camera: cameraLayer.name,
            startFocus: startFocus,
            endFocus: endFocus,
            startTime: startTime,
            endTime: endTime
        });
    }
    
    /**
     * Focus camera on a specific layer
     * @param {Object} params - Focus parameters
     * @returns {Object} Result
     */
    function focusOnLayer(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var cameraResult = CameraDomain.findCamera(comp);
        if (cameraResult.error) return cameraResult;
        var cameraLayer = cameraResult.camera;
        
        // Find target layer
        var targetResult = LayerData.getLayer(comp, {
            layerIndex: params.targetLayerIndex,
            layerName: params.targetLayerName
        });
        if (targetResult.error) return Utils.error('Target layer not found');
        var targetLayer = targetResult.layer;
        
        var camOptions = CameraDomain.getCameraOptions(cameraLayer);
        Utils.setProp(camOptions, 'ADBE Camera Depth of Field', 1);
        
        var focusProp = camOptions.property('ADBE Camera Focus Distance');
        
        if (params.useExpression) {
            var expr = CameraDomain.generateFocusExpression(cameraLayer.name, targetLayer.name);
            focusProp.expression = expr;
            return Utils.success({
                camera: cameraLayer.name,
                focusTarget: targetLayer.name,
                method: 'expression'
            });
        } else {
            var distance = CameraDomain.calculateFocusDistance(cameraLayer, targetLayer);
            focusProp.setValue(distance);
            return Utils.success({
                camera: cameraLayer.name,
                focusTarget: targetLayer.name,
                focusDistance: distance,
                method: 'static'
            });
        }
    }
    
    return {
        addCamera: addCamera,
        setupDOF: setupDOF,
        setCameraIris: setCameraIris,
        animateFocusRack: animateFocusRack,
        focusOnLayer: focusOnLayer
    };
})();

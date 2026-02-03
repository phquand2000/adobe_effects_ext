// ============================================
// DOMAIN: Camera
// Camera entity and related operations
// ============================================

var CameraDomain = (function() {
    
    /**
     * Find camera in composition
     * @param {CompItem} comp - The composition
     * @param {Object} params - { cameraIndex } optional
     * @returns {Object} { camera: CameraLayer } or { error: string }
     */
    function findCamera(comp, params) {
        params = params || {};
        
        if (params.cameraIndex) {
            var layer = comp.layer(params.cameraIndex);
            if (!(layer instanceof CameraLayer)) {
                return { error: 'Layer ' + params.cameraIndex + ' is not a camera' };
            }
            return { camera: layer };
        }
        
        for (var i = 1; i <= comp.numLayers; i++) {
            if (comp.layer(i) instanceof CameraLayer) {
                return { camera: comp.layer(i) };
            }
        }
        
        return { error: 'No camera found in composition' };
    }
    
    /**
     * Create a new camera
     * @param {CompItem} comp - The composition
     * @param {Object} params - Camera parameters
     * @returns {CameraLayer} The created camera
     */
    function createCamera(comp, params) {
        var name = params.name || 'AI Camera';
        var centerPoint = [comp.width / 2, comp.height / 2];
        
        var cameraLayer = comp.layers.addCamera(name, centerPoint);
        return cameraLayer;
    }
    
    /**
     * Calculate zoom from focal length
     * @param {number} focalLength - Focal length in mm
     * @param {number} compWidth - Composition width
     * @returns {number} Zoom value
     */
    function focalLengthToZoom(focalLength, compWidth) {
        return focalLength * compWidth / 36;
    }
    
    /**
     * Get camera options property group
     * @param {CameraLayer} camera - The camera layer
     * @returns {PropertyGroup} Camera options group
     */
    function getCameraOptions(camera) {
        return camera.property('ADBE Camera Options Group');
    }
    
    /**
     * Enable depth of field on camera
     * @param {CameraLayer} camera - The camera layer
     * @param {Object} params - DOF parameters
     */
    function enableDOF(camera, params) {
        var camOptions = getCameraOptions(camera);
        Utils.setProp(camOptions, 'ADBE Camera Depth of Field', 1);
        
        if (params.focusDistance !== undefined) {
            Utils.setProp(camOptions, 'ADBE Camera Focus Distance', params.focusDistance);
        }
        if (params.blurLevel !== undefined) {
            Utils.setProp(camOptions, 'ADBE Camera Blur Level', params.blurLevel);
        }
        if (params.aperture !== undefined) {
            Utils.setProp(camOptions, 'ADBE Camera Aperture', params.aperture);
        }
    }
    
    /**
     * Set iris properties on camera
     * @param {CameraLayer} camera - The camera layer
     * @param {Object} params - Iris parameters
     * @returns {Array} Applied properties
     */
    function setIrisProperties(camera, params) {
        var camOptions = getCameraOptions(camera);
        var applied = [];
        
        if (params.irisShape !== undefined) {
            Utils.setProp(camOptions, 'ADBE Iris Shape', params.irisShape);
            applied.push('Iris Shape: ' + params.irisShape);
        }
        if (params.irisRotation !== undefined) {
            Utils.setProp(camOptions, 'ADBE Iris Rotation', params.irisRotation);
            applied.push('Iris Rotation: ' + params.irisRotation);
        }
        if (params.irisRoundness !== undefined) {
            Utils.setProp(camOptions, 'ADBE Iris Roundness', params.irisRoundness);
            applied.push('Iris Roundness: ' + params.irisRoundness);
        }
        if (params.irisAspectRatio !== undefined) {
            Utils.setProp(camOptions, 'ADBE Iris Aspect Ratio', params.irisAspectRatio);
            applied.push('Iris Aspect Ratio: ' + params.irisAspectRatio);
        }
        if (params.diffractionFringe !== undefined) {
            Utils.setProp(camOptions, 'ADBE Iris Diffraction Fringe', params.diffractionFringe);
            applied.push('Diffraction Fringe: ' + params.diffractionFringe);
        }
        if (params.highlightGain !== undefined) {
            Utils.setProp(camOptions, 'ADBE Iris Highlight Gain', params.highlightGain);
            applied.push('Highlight Gain: ' + params.highlightGain);
        }
        if (params.highlightThreshold !== undefined) {
            Utils.setProp(camOptions, 'ADBE Iris Highlight Threshold', params.highlightThreshold);
            applied.push('Highlight Threshold: ' + params.highlightThreshold);
        }
        
        return applied;
    }
    
    /**
     * Calculate distance between camera and target layer
     * @param {CameraLayer} camera - The camera layer
     * @param {Layer} targetLayer - The target layer
     * @returns {number} Distance
     */
    function calculateFocusDistance(camera, targetLayer) {
        var camPos = camera.property('ADBE Transform Group').property('ADBE Position').value;
        var targetPos = targetLayer.property('ADBE Transform Group').property('ADBE Position').value;
        
        return Math.sqrt(
            Math.pow(camPos[0] - targetPos[0], 2) +
            Math.pow(camPos[1] - targetPos[1], 2) +
            Math.pow(camPos[2] - targetPos[2], 2)
        );
    }
    
    /**
     * Generate focus expression for auto-following layer
     * @param {string} cameraName - Camera layer name
     * @param {string} targetName - Target layer name
     * @returns {string} Expression code
     */
    function generateFocusExpression(cameraName, targetName) {
        return 'length(thisComp.layer("' + cameraName + '").transform.position, thisComp.layer("' + targetName + '").transform.position)';
    }
    
    return {
        findCamera: findCamera,
        createCamera: createCamera,
        focalLengthToZoom: focalLengthToZoom,
        getCameraOptions: getCameraOptions,
        enableDOF: enableDOF,
        setIrisProperties: setIrisProperties,
        calculateFocusDistance: calculateFocusDistance,
        generateFocusExpression: generateFocusExpression
    };
})();

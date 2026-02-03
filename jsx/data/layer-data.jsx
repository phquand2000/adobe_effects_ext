// ============================================
// DATA LAYER: Layer Repository
// Provides access to After Effects layers
// ============================================

var LayerData = (function() {
    
    /**
     * Get a layer by name or index
     * @param {CompItem} comp - The composition
     * @param {Object} params - { layerIndex, layerName }
     * @returns {Object} { layer: Layer } or { error: string }
     */
    function getLayer(comp, params) {
        try {
            var layer = null;
            
            if (params.layerIndex) {
                if (params.layerIndex < 1 || params.layerIndex > comp.numLayers) {
                    return { error: 'Layer index out of range: ' + params.layerIndex };
                }
                layer = comp.layer(params.layerIndex);
            } else if (params.layerName) {
                for (var i = 1; i <= comp.numLayers; i++) {
                    if (comp.layer(i).name === params.layerName) {
                        layer = comp.layer(i);
                        break;
                    }
                }
                if (!layer) {
                    return { error: 'Layer not found: ' + params.layerName };
                }
            } else {
                layer = comp.layer(1);
                if (!layer) {
                    return { error: 'No layers in composition' };
                }
            }
            
            return { layer: layer };
        } catch (e) {
            return { error: 'Failed to get layer: ' + e.toString() };
        }
    }
    
    /**
     * Get layer by name or index (convenience wrapper)
     * @param {CompItem} comp - The composition
     * @param {Object} params - Parameters with layerIndex or layerName
     * @returns {Layer|null} The layer or null
     */
    function getLayerByNameOrIndex(comp, params) {
        var result = getLayer(comp, params);
        return result.layer || null;
    }
    
    /**
     * Check if layer is a camera
     * @param {Layer} layer - The layer
     * @returns {boolean} True if camera
     */
    function isCamera(layer) {
        return layer instanceof CameraLayer;
    }
    
    /**
     * Check if layer is a light
     * @param {Layer} layer - The layer
     * @returns {boolean} True if light
     */
    function isLight(layer) {
        return layer instanceof LightLayer;
    }
    
    /**
     * Check if layer is a shape layer
     * @param {Layer} layer - The layer
     * @returns {boolean} True if shape
     */
    function isShape(layer) {
        return layer instanceof ShapeLayer;
    }
    
    /**
     * Check if layer is a text layer
     * @param {Layer} layer - The layer
     * @returns {boolean} True if text
     */
    function isText(layer) {
        return layer instanceof TextLayer;
    }
    
    /**
     * Check if layer is an AV layer
     * @param {Layer} layer - The layer
     * @returns {boolean} True if AV
     */
    function isAVLayer(layer) {
        return layer instanceof AVLayer;
    }
    
    /**
     * Check if layer supports effects
     * @param {Layer} layer - The layer
     * @returns {boolean} True if supports effects
     */
    function supportsEffects(layer) {
        return layer.Effects !== undefined && layer.Effects !== null;
    }
    
    /**
     * Check if layer supports masks
     * @param {Layer} layer - The layer
     * @returns {boolean} True if supports masks
     */
    function supportsMasks(layer) {
        if (isCamera(layer) || isLight(layer)) return false;
        try {
            return layer.Masks !== undefined && layer.Masks !== null;
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Check if layer is a null object
     * @param {Layer} layer - The layer
     * @returns {boolean} True if null
     */
    function isNull(layer) {
        return layer.nullLayer === true;
    }
    
    /**
     * Check if layer is a 3D model (GLB/GLTF)
     * @param {Layer} layer - The layer
     * @returns {boolean} True if 3D model
     */
    function is3DModel(layer) {
        try {
            if (!(layer instanceof AVLayer)) return false;
            var src = layer.source;
            if (!src || !src.mainSource || !src.mainSource.file) return false;
            var name = src.mainSource.file.name.toLowerCase();
            return /\.(glb|gltf)$/.test(name);
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Check if layer is a solid
     * @param {Layer} layer - The layer
     * @returns {boolean} True if solid
     */
    function isSolid(layer) {
        try {
            if (!(layer instanceof AVLayer)) return false;
            var source = layer.source;
            return source && source.mainSource instanceof SolidSource;
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Check if layer is a precomp
     * @param {Layer} layer - The layer
     * @returns {boolean} True if precomp
     */
    function isPrecomp(layer) {
        try {
            if (!(layer instanceof AVLayer)) return false;
            var source = layer.source;
            return source && source instanceof CompItem;
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Check if layer has audio
     * @param {Layer} layer - The layer
     * @returns {boolean} True if has audio
     */
    function hasAudio(layer) {
        try {
            return layer.hasAudio === true;
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Check if layer can use time remap
     * @param {Layer} layer - The layer
     * @returns {boolean} True if can time remap
     */
    function canTimeRemap(layer) {
        try {
            return layer.canSetTimeRemapEnabled === true;
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Get layer type as string for AI guidance
     * @param {Layer} layer - The layer
     * @returns {string} Layer type: 'camera', 'light', 'text', 'shape', 'null', 'solid', 'precomp', '3dmodel', 'av', 'unknown'
     */
    function getLayerType(layer) {
        if (isCamera(layer)) return 'camera';
        if (isLight(layer)) return 'light';
        if (isText(layer)) return 'text';
        if (isShape(layer)) return 'shape';
        if (isNull(layer)) return 'null';
        if (is3DModel(layer)) return '3dmodel';
        if (isSolid(layer)) return 'solid';
        if (isPrecomp(layer)) return 'precomp';
        if (isAVLayer(layer)) return 'av';
        return 'unknown';
    }
    
    /**
     * Get layer capabilities for AI guidance
     * @param {Layer} layer - The layer
     * @returns {Object} Capabilities object
     */
    function getLayerCapabilities(layer) {
        var type = getLayerType(layer);
        return {
            type: type,
            supportsEffects: supportsEffects(layer),
            supportsMasks: supportsMasks(layer),
            hasAudio: hasAudio(layer),
            canTimeRemap: canTimeRemap(layer),
            is3D: layer.threeDLayer || false,
            // What effect categories are allowed
            allowsNoiseGrain: type === 'av' || type === 'solid' || type === 'precomp',
            allowsKeying: type === 'av' || type === 'precomp',
            allowsDistortion: type === 'av' || type === 'solid' || type === 'precomp',
            allowsTimeEffects: type === 'av' || type === 'precomp',
            // Layer-specific features
            allowsTextAnimators: type === 'text',
            allowsShapeModifiers: type === 'shape'
        };
    }
    
    /**
     * Get transform property group
     * @param {Layer} layer - The layer
     * @returns {PropertyGroup} Transform group
     */
    function getTransform(layer) {
        return layer.property('ADBE Transform Group');
    }
    
    /**
     * Set layer transform properties
     * @param {Layer} layer - The layer
     * @param {Object} transform - { position, scale, rotation, anchorPoint, opacity }
     */
    function setTransform(layer, transform) {
        var xform = getTransform(layer);
        if (!xform) return;
        
        if (transform.position) {
            Utils.setProp(xform, 'ADBE Position', transform.position);
        }
        if (transform.scale) {
            var scaleVal = Utils.normalizeArray(transform.scale, 3);
            Utils.setProp(xform, 'ADBE Scale', scaleVal);
        }
        if (transform.rotation !== undefined) {
            if (typeof transform.rotation === 'object') {
                if (transform.rotation.x !== undefined) {
                    Utils.setProp(xform, 'ADBE Rotate X', transform.rotation.x);
                }
                if (transform.rotation.y !== undefined) {
                    Utils.setProp(xform, 'ADBE Rotate Y', transform.rotation.y);
                }
                if (transform.rotation.z !== undefined) {
                    Utils.setProp(xform, 'ADBE Rotate Z', transform.rotation.z);
                }
            } else {
                Utils.setProp(xform, 'ADBE Rotate Z', transform.rotation);
            }
        }
        if (transform.anchorPoint) {
            Utils.setProp(xform, 'ADBE Anchor Point', transform.anchorPoint);
        }
        if (transform.opacity !== undefined) {
            Utils.setProp(xform, 'ADBE Opacity', transform.opacity);
        }
    }
    
    /**
     * Add a solid layer
     * @param {CompItem} comp - The composition
     * @param {Object} params - { name, color, width, height, duration }
     * @returns {AVLayer} The created solid
     */
    function addSolid(comp, params) {
        var name = params.name || 'Solid';
        var color = params.color || [0.5, 0.5, 0.5];
        var width = params.width || comp.width;
        var height = params.height || comp.height;
        var duration = params.duration || comp.duration;
        
        return comp.layers.addSolid(color, name, width, height, 1, duration);
    }
    
    /**
     * Add a null object
     * @param {CompItem} comp - The composition
     * @param {string} name - Null name
     * @returns {AVLayer} The null object
     */
    function addNull(comp, name) {
        var nullLayer = comp.layers.addNull();
        nullLayer.name = name || 'Null';
        return nullLayer;
    }
    
    return {
        getLayer: getLayer,
        getLayerByNameOrIndex: getLayerByNameOrIndex,
        isCamera: isCamera,
        isLight: isLight,
        isShape: isShape,
        isText: isText,
        isAVLayer: isAVLayer,
        isNull: isNull,
        is3DModel: is3DModel,
        isSolid: isSolid,
        isPrecomp: isPrecomp,
        hasAudio: hasAudio,
        canTimeRemap: canTimeRemap,
        supportsEffects: supportsEffects,
        supportsMasks: supportsMasks,
        getLayerType: getLayerType,
        getLayerCapabilities: getLayerCapabilities,
        getTransform: getTransform,
        setTransform: setTransform,
        addSolid: addSolid,
        addNull: addNull
    };
})();

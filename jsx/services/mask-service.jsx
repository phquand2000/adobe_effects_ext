// ============================================
// SERVICE: Mask Service
// Mask and track matte operations
// ============================================

var MaskService = (function() {
    
    var MODE_MAP = {
        'none': MaskMode.NONE,
        'add': MaskMode.ADD,
        'subtract': MaskMode.SUBTRACT,
        'intersect': MaskMode.INTERSECT,
        'lighten': MaskMode.LIGHTEN,
        'darken': MaskMode.DARKEN,
        'difference': MaskMode.DIFFERENCE
    };
    
    var TRACK_MATTE_MAP = {
        'alpha': TrackMatteType.ALPHA,
        'alphaInverted': TrackMatteType.ALPHA_INVERTED,
        'luma': TrackMatteType.LUMA,
        'lumaInverted': TrackMatteType.LUMA_INVERTED
    };
    
    /**
     * Add mask to layer
     * @param {Object} params - Mask parameters
     * @param {number} [params.layerIndex] - Layer index (1-based)
     * @param {string} [params.layerName] - Layer name
     * @param {string} [params.name] - Mask name
     * @param {string} [params.mode] - Mask mode: none/add/subtract/intersect/lighten/darken/difference
     * @param {Array} [params.rect] - Rectangle [x, y, width, height]
     * @param {Array} [params.vertices] - Custom path vertices [[x,y], ...]
     * @param {Array} [params.inTangents] - In tangents for bezier paths
     * @param {Array} [params.outTangents] - Out tangents for bezier paths
     * @param {boolean} [params.closed] - Whether path is closed (default: true)
     * @param {number} [params.feather] - Feather amount in pixels
     * @param {number} [params.expansion] - Mask expansion in pixels
     * @param {number} [params.opacity] - Mask opacity (0-100)
     * @param {boolean} [params.inverted] - Invert mask
     * @returns {Object} Result with mask info
     */
    function addMask(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        if (layer instanceof CameraLayer || layer instanceof LightLayer) {
            return Utils.error('Cameras and lights do not support masks');
        }
        
        var masksGroup = null;
        try {
            masksGroup = layer.property('ADBE Mask Parade');
        } catch (e) {
            return Utils.error('Cannot access masks on this layer type: ' + e.toString());
        }
        
        if (!masksGroup || !masksGroup.canAddProperty) {
            return Utils.error('Layer does not support masks');
        }
        
        var mask = null;
        try {
            mask = masksGroup.addProperty('ADBE Mask Atom');
        } catch (e) {
            return Utils.error('Failed to add mask: ' + e.toString());
        }
        
        if (!mask) {
            return Utils.error('Failed to create mask on this layer');
        }
        
        mask.name = params.name || 'Mask ' + masksGroup.numProperties;
        
        if (params.mode && MODE_MAP[params.mode]) {
            mask.property('ADBE Mask Mode').setValue(MODE_MAP[params.mode]);
        }
        
        var maskPath = mask.property('ADBE Mask Shape');
        var shape = new Shape();
        
        if (params.rect) {
            var x = params.rect[0];
            var y = params.rect[1];
            var w = params.rect[2];
            var h = params.rect[3];
            shape.vertices = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
            shape.closed = true;
        } else if (params.vertices) {
            shape.vertices = params.vertices;
            shape.closed = params.closed !== false;
            if (params.inTangents) shape.inTangents = params.inTangents;
            if (params.outTangents) shape.outTangents = params.outTangents;
        } else {
            var cw = comp.width * 0.5;
            var ch = comp.height * 0.5;
            var cx = comp.width / 2;
            var cy = comp.height / 2;
            shape.vertices = [
                [cx - cw / 2, cy - ch / 2],
                [cx + cw / 2, cy - ch / 2],
                [cx + cw / 2, cy + ch / 2],
                [cx - cw / 2, cy + ch / 2]
            ];
            shape.closed = true;
        }
        
        maskPath.setValue(shape);
        
        if (params.feather !== undefined) {
            mask.property('ADBE Mask Feather').setValue([params.feather, params.feather]);
        }
        
        if (params.expansion !== undefined) {
            mask.property('ADBE Mask Offset').setValue(params.expansion);
        }
        
        if (params.opacity !== undefined) {
            mask.property('ADBE Mask Opacity').setValue(params.opacity);
        }
        
        if (params.inverted) {
            mask.property('ADBE Mask Inverted').setValue(true);
        }
        
        return Utils.success({
            layer: layer.name,
            mask: mask.name,
            maskIndex: masksGroup.numProperties
        });
    }
    
    /**
     * Set track matte for layer
     * @param {Object} params - Track matte parameters
     * @param {number} [params.layerIndex] - Target layer index
     * @param {string} [params.layerName] - Target layer name
     * @param {number} [params.matteLayerIndex] - Matte layer index
     * @param {string} [params.matteLayerName] - Matte layer name
     * @param {string} [params.type] - Track matte type: alpha/alphaInverted/luma/lumaInverted
     * @returns {Object} Result
     */
    function setTrackMatte(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        var matteLayer = null;
        if (params.matteLayerIndex) {
            if (params.matteLayerIndex < 1 || params.matteLayerIndex > comp.numLayers) {
                return Utils.error('Matte layer index out of range: ' + params.matteLayerIndex);
            }
            matteLayer = comp.layer(params.matteLayerIndex);
        } else if (params.matteLayerName) {
            for (var i = 1; i <= comp.numLayers; i++) {
                if (comp.layer(i).name === params.matteLayerName) {
                    matteLayer = comp.layer(i);
                    break;
                }
            }
        }
        
        if (!matteLayer) {
            return Utils.error('Matte layer not found');
        }
        
        var matteType = TrackMatteType.ALPHA;
        if (params.type && TRACK_MATTE_MAP[params.type]) {
            matteType = TRACK_MATTE_MAP[params.type];
        }
        
        try {
            layer.setTrackMatte(matteLayer, matteType);
        } catch (e) {
            return Utils.error('setTrackMatte failed: ' + e.toString());
        }
        
        return Utils.success({
            layer: layer.name,
            matteLayer: matteLayer.name,
            matteType: params.type || 'alpha'
        });
    }
    
    /**
     * Remove track matte from layer
     * @param {Object} params - Layer parameters
     * @param {number} [params.layerIndex] - Layer index
     * @param {string} [params.layerName] - Layer name
     * @returns {Object} Result
     */
    function removeTrackMatte(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        try {
            layer.removeTrackMatte();
        } catch (e) {
            return Utils.error('removeTrackMatte failed: ' + e.toString());
        }
        
        return Utils.success({
            layer: layer.name
        });
    }
    
    return {
        addMask: addMask,
        setTrackMatte: setTrackMatte,
        removeTrackMatte: removeTrackMatte
    };
})();

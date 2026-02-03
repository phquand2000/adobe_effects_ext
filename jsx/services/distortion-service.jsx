// ============================================
// SERVICE: Distortion Service
// High-level distortion effect operations
// ============================================

var DistortionService = (function() {
    
    /**
     * Apply Warp Stabilizer VFX effect
     * @param {Object} params - Warp Stabilizer parameters
     * @param {number} [params.layerIndex] - Layer index
     * @param {string} [params.layerName] - Layer name
     * @param {number} [params.result] - 1=Smooth Motion, 2=No Motion
     * @param {number} [params.smoothness] - Smoothness (0-100%)
     * @param {number} [params.method] - 1=Position, 2=Position Scale Rotation, 3=Perspective, 4=Subspace Warp
     * @param {number} [params.framing] - 1=Stabilize Only, 2=Stabilize Crop, 3=Stabilize Crop Auto-scale, 4=Stabilize Synthesize Edges
     * @param {number} [params.cropLessSmoothMore] - Crop Less Smooth More value
     * @param {number} [params.synthesisEdgeFeather] - Synthesis Edge Feather value
     * @param {number} [params.synthesisEdgeCropping] - Synthesis Edge Cropping value
     * @returns {Object} Result
     */
    function applyWarpStabilizer(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        if (!layer.Effects) {
            return Utils.error('Layer does not support effects');
        }
        
        var stabilizer;
        try {
            stabilizer = layer.Effects.addProperty('ADBE SubspaceStabilizer');
        } catch (e) {
            return Utils.error('Failed to add Warp Stabilizer: ' + e.toString());
        }
        
        // Result: 1=Smooth Motion, 2=No Motion
        if (params.result !== undefined) {
            Utils.setProp(stabilizer, 'ADBE SubspaceStabilizer-0001', params.result);
        }
        
        // Smoothness (0-100%)
        if (params.smoothness !== undefined) {
            Utils.setProp(stabilizer, 'ADBE SubspaceStabilizer-0002', params.smoothness);
        }
        
        // Method: 1=Position, 2=Position Scale Rotation, 3=Perspective, 4=Subspace Warp
        if (params.method !== undefined) {
            Utils.setProp(stabilizer, 'ADBE SubspaceStabilizer-0003', params.method);
        }
        
        // Framing: 1=Stabilize Only, 2=Stabilize Crop, 3=Stabilize Crop Auto-scale, 4=Stabilize Synthesize Edges
        if (params.framing !== undefined) {
            Utils.setProp(stabilizer, 'ADBE SubspaceStabilizer-0004', params.framing);
        }
        
        // Crop Less Smooth More
        if (params.cropLessSmoothMore !== undefined) {
            Utils.setProp(stabilizer, 'ADBE SubspaceStabilizer-0005', params.cropLessSmoothMore);
        }
        
        // Synthesis Edge Feather
        if (params.synthesisEdgeFeather !== undefined) {
            Utils.setProp(stabilizer, 'ADBE SubspaceStabilizer-0006', params.synthesisEdgeFeather);
        }
        
        // Synthesis Edge Cropping
        if (params.synthesisEdgeCropping !== undefined) {
            Utils.setProp(stabilizer, 'ADBE SubspaceStabilizer-0007', params.synthesisEdgeCropping);
        }
        
        return Utils.success({
            layer: layer.name,
            effect: 'Warp Stabilizer VFX',
            message: 'Effect applied. Click "Analyze" in Effect Controls to start tracking.'
        });
    }
    
    /**
     * Apply Corner Pin effect
     * @param {Object} params - Corner Pin parameters
     * @param {number} [params.layerIndex] - Layer index
     * @param {string} [params.layerName] - Layer name
     * @param {Array} [params.upperLeft] - Upper left point [x, y]
     * @param {Array} [params.upperRight] - Upper right point [x, y]
     * @param {Array} [params.lowerLeft] - Lower left point [x, y]
     * @param {Array} [params.lowerRight] - Lower right point [x, y]
     * @returns {Object} Result
     */
    function applyCornerPin(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        if (!layer.Effects) {
            return Utils.error('Layer does not support effects');
        }
        
        var cornerPin;
        try {
            cornerPin = layer.Effects.addProperty('ADBE Corner Pin');
        } catch (e) {
            return Utils.error('Failed to add Corner Pin: ' + e.toString());
        }
        
        // Upper Left
        if (params.upperLeft) {
            Utils.setProp(cornerPin, 'ADBE Corner Pin-0001', params.upperLeft);
        }
        
        // Upper Right
        if (params.upperRight) {
            Utils.setProp(cornerPin, 'ADBE Corner Pin-0002', params.upperRight);
        }
        
        // Lower Left
        if (params.lowerLeft) {
            Utils.setProp(cornerPin, 'ADBE Corner Pin-0003', params.lowerLeft);
        }
        
        // Lower Right
        if (params.lowerRight) {
            Utils.setProp(cornerPin, 'ADBE Corner Pin-0004', params.lowerRight);
        }
        
        return Utils.success({
            layer: layer.name,
            effect: 'Corner Pin',
            corners: {
                upperLeft: params.upperLeft,
                upperRight: params.upperRight,
                lowerLeft: params.lowerLeft,
                lowerRight: params.lowerRight
            }
        });
    }
    
    /**
     * Apply Displacement Map effect
     * @param {Object} params - Displacement Map parameters
     * @param {number} [params.layerIndex] - Layer index
     * @param {string} [params.layerName] - Layer name
     * @param {number} [params.mapLayerIndex] - Displacement map layer index
     * @param {number} [params.useHorizontal] - Use for horizontal: 1=Luminance, 2=Hue, 3=Lightness, 4=Saturation, etc.
     * @param {number} [params.maxHorizontal] - Max horizontal displacement
     * @param {number} [params.useVertical] - Use for vertical: 1=Luminance, 2=Hue, 3=Lightness, 4=Saturation, etc.
     * @param {number} [params.maxVertical] - Max vertical displacement
     * @param {number} [params.mapBehavior] - 1=Center Map, 2=Stretch Map to Fit, 3=Tile Map
     * @param {number} [params.edgeBehavior] - 1=Wrap Pixels Around, 2=Repeat Edge Pixels
     * @returns {Object} Result
     */
    function applyDisplacementMap(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        if (!layer.Effects) {
            return Utils.error('Layer does not support effects');
        }
        
        var disp;
        try {
            disp = layer.Effects.addProperty('ADBE Displacement Map');
        } catch (e) {
            return Utils.error('Failed to add Displacement Map: ' + e.toString());
        }
        
        // Displacement Map Layer
        if (params.mapLayerIndex !== undefined) {
            Utils.setProp(disp, 'ADBE Displacement Map-0001', params.mapLayerIndex);
        }
        
        // Use For Horizontal: 1=Luminance, 2=Hue, 3=Lightness, 4=Saturation, etc.
        if (params.useHorizontal !== undefined) {
            Utils.setProp(disp, 'ADBE Displacement Map-0002', params.useHorizontal);
        }
        
        // Max Horizontal Displacement
        if (params.maxHorizontal !== undefined) {
            Utils.setProp(disp, 'ADBE Displacement Map-0003', params.maxHorizontal);
        }
        
        // Use For Vertical
        if (params.useVertical !== undefined) {
            Utils.setProp(disp, 'ADBE Displacement Map-0004', params.useVertical);
        }
        
        // Max Vertical Displacement
        if (params.maxVertical !== undefined) {
            Utils.setProp(disp, 'ADBE Displacement Map-0005', params.maxVertical);
        }
        
        // Displacement Map Behavior: 1=Center Map, 2=Stretch Map to Fit, 3=Tile Map
        if (params.mapBehavior !== undefined) {
            Utils.setProp(disp, 'ADBE Displacement Map-0006', params.mapBehavior);
        }
        
        // Edge Behavior: 1=Wrap Pixels Around, 2=Repeat Edge Pixels
        if (params.edgeBehavior !== undefined) {
            Utils.setProp(disp, 'ADBE Displacement Map-0007', params.edgeBehavior);
        }
        
        return Utils.success({
            layer: layer.name,
            effect: 'Displacement Map'
        });
    }
    
    /**
     * Apply Mesh Warp effect
     * @param {Object} params - Mesh Warp parameters
     * @param {number} [params.layerIndex] - Layer index
     * @param {string} [params.layerName] - Layer name
     * @param {number} [params.rows] - Number of rows
     * @param {number} [params.columns] - Number of columns
     * @param {number} [params.quality] - 1=Draft, 2=Best
     * @returns {Object} Result
     */
    function applyMeshWarp(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        if (!layer.Effects) {
            return Utils.error('Layer does not support effects');
        }
        
        var mesh;
        try {
            mesh = layer.Effects.addProperty('ADBE MESH WARP');
        } catch (e) {
            return Utils.error('Failed to add Mesh Warp: ' + e.toString());
        }
        
        // Rows
        if (params.rows !== undefined) {
            Utils.setProp(mesh, 'ADBE MESH WARP-0001', params.rows);
        }
        
        // Columns
        if (params.columns !== undefined) {
            Utils.setProp(mesh, 'ADBE MESH WARP-0002', params.columns);
        }
        
        // Quality: 1=Draft, 2=Best
        if (params.quality !== undefined) {
            Utils.setProp(mesh, 'ADBE MESH WARP-0003', params.quality);
        }
        
        return Utils.success({
            layer: layer.name,
            effect: 'Mesh Warp',
            rows: params.rows,
            columns: params.columns,
            message: 'Adjust mesh points in Effect Controls'
        });
    }
    
    /**
     * Apply Bezier Warp effect
     * @param {Object} params - Bezier Warp parameters
     * @param {number} [params.layerIndex] - Layer index
     * @param {string} [params.layerName] - Layer name
     * @param {number} [params.quality] - 1=Draft, 2=Normal, 3=Best
     * @returns {Object} Result
     */
    function applyBezierWarp(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        if (!layer.Effects) {
            return Utils.error('Layer does not support effects');
        }
        
        var bezier;
        try {
            bezier = layer.Effects.addProperty('ADBE BEZMESH');
        } catch (e) {
            return Utils.error('Failed to add Bezier Warp: ' + e.toString());
        }
        
        // Quality: 1=Draft, 2=Normal, 3=Best
        if (params.quality !== undefined) {
            Utils.setProp(bezier, 'ADBE BEZMESH-0001', params.quality);
        }
        
        return Utils.success({
            layer: layer.name,
            effect: 'Bezier Warp',
            message: 'Adjust bezier handles in Effect Controls'
        });
    }
    
    return {
        applyWarpStabilizer: applyWarpStabilizer,
        applyCornerPin: applyCornerPin,
        applyDisplacementMap: applyDisplacementMap,
        applyMeshWarp: applyMeshWarp,
        applyBezierWarp: applyBezierWarp
    };
})();

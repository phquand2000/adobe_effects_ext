// ============================================
// SERVICE: Precomp Service
// Precomposition and composition nesting operations
// ============================================

var PrecompService = (function() {
    
    /**
     * Find composition by name or index
     * @param {Object} params - { compName, compIndex }
     * @returns {Object} { comp: CompItem } or { error: string }
     */
    function findComp(params) {
        if (params.compName) {
            var result = ProjectData.findItemByName(params.compName);
            if (result.error) return { error: result.error };
            var item = result.item;
            if (!(item instanceof CompItem)) {
                return { error: 'Item is not a composition: ' + params.compName };
            }
            return { comp: item };
        } else if (params.compIndex !== undefined) {
            if (params.compIndex < 1 || params.compIndex > app.project.numItems) {
                return { error: 'Composition index out of range: ' + params.compIndex };
            }
            var item = app.project.item(params.compIndex);
            if (!(item instanceof CompItem)) {
                return { error: 'Item at index ' + params.compIndex + ' is not a composition' };
            }
            return { comp: item };
        }
        return { error: 'Must specify compName or compIndex' };
    }
    
    /**
     * Precompose selected layers
     * @param {Object} params - Precompose parameters
     * @param {Array} params.layerIndices - Array of layer indices to precompose
     * @param {string} [params.name] - Name for the precomp
     * @param {boolean} [params.moveAttributes] - Move attributes into new comp
     * @param {boolean} [params.adjustDuration] - Adjust duration to layer lengths
     * @returns {Object} Result
     */
    function precompose(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        if (!params.layerIndices || !(params.layerIndices instanceof Array) || params.layerIndices.length === 0) {
            return Utils.error('layerIndices must be a non-empty array');
        }
        
        for (var i = 0; i < params.layerIndices.length; i++) {
            var idx = params.layerIndices[i];
            if (idx < 1 || idx > comp.numLayers) {
                return Utils.error('Layer index out of range: ' + idx);
            }
        }
        
        var name = params.name || 'Precomp';
        var moveAttributes = params.moveAttributes !== false;
        var adjustDuration = params.adjustDuration === true;
        
        try {
            // In ExtendScript, precompose is called on the layers collection, not individual layer
            // It takes an array of layer indices and returns the new precomp layer
            var precompLayer = comp.layers.precompose(params.layerIndices, name, moveAttributes);
            
            if (adjustDuration && precompLayer && precompLayer.source instanceof CompItem) {
                var precompComp = precompLayer.source;
                var minIn = Infinity;
                var maxOut = 0;
                for (var i = 1; i <= precompComp.numLayers; i++) {
                    var layer = precompComp.layer(i);
                    if (layer.inPoint < minIn) minIn = layer.inPoint;
                    if (layer.outPoint > maxOut) maxOut = layer.outPoint;
                }
                if (maxOut > minIn) {
                    precompComp.duration = maxOut - minIn;
                }
            }
            
            return Utils.success({
                precompName: name,
                layerIndex: precompLayer ? precompLayer.index : 1
            });
        } catch (e) {
            return Utils.error('Failed to precompose: ' + e.toString());
        }
    }
    
    /**
     * Duplicate a composition
     * @param {Object} params - Duplicate parameters
     * @param {string} [params.compName] - Name of composition to duplicate
     * @param {number} [params.compIndex] - Index of composition to duplicate
     * @param {string} [params.newName] - Name for the duplicate
     * @returns {Object} Result
     */
    function duplicateComp(params) {
        var compResult = findComp(params);
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        try {
            var duplicate = comp.duplicate();
            var newName = params.newName || (comp.name + ' copy');
            duplicate.name = newName;
            
            return Utils.success({
                originalName: comp.name,
                duplicateName: duplicate.name,
                duplicateId: duplicate.id
            });
        } catch (e) {
            return Utils.error('Failed to duplicate composition: ' + e.toString());
        }
    }
    
    /**
     * Open a composition in the viewer
     * @param {Object} params - Open parameters
     * @param {string} [params.compName] - Name of composition to open
     * @param {number} [params.compIndex] - Index of composition to open
     * @returns {Object} Result
     */
    function openCompViewer(params) {
        var compResult = findComp(params);
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        try {
            comp.openInViewer();
            return Utils.success({
                compName: comp.name
            });
        } catch (e) {
            return Utils.error('Failed to open composition in viewer: ' + e.toString());
        }
    }
    
    /**
     * Replace the source of a layer with another project item
     * @param {Object} params - Replace parameters
     * @param {number} params.layerIndex - Index of layer to modify
     * @param {string} [params.newSourceName] - Name of new source item
     * @param {number} [params.newSourceId] - ID of new source item
     * @returns {Object} Result
     */
    function replaceCompSource(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, { layerIndex: params.layerIndex });
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        if (!(layer instanceof AVLayer)) {
            return Utils.error('Layer does not support source replacement');
        }
        
        var newSource = null;
        if (params.newSourceName) {
            var result = ProjectData.findItemByName(params.newSourceName);
            if (result.error) return Utils.error(result.error);
            newSource = result.item;
        } else if (params.newSourceId) {
            var result = ProjectData.findItemById(params.newSourceId);
            if (result.error) return Utils.error(result.error);
            newSource = result.item;
        } else {
            return Utils.error('Must specify newSourceName or newSourceId');
        }
        
        if (!(newSource instanceof FootageItem) && !(newSource instanceof CompItem)) {
            return Utils.error('New source must be a footage item or composition');
        }
        
        try {
            layer.replaceSource(newSource, false);
            return Utils.success({
                layerName: layer.name,
                newSource: newSource.name
            });
        } catch (e) {
            return Utils.error('Failed to replace source: ' + e.toString());
        }
    }
    
    /**
     * Nest one composition inside another
     * @param {Object} params - Nest parameters
     * @param {string} params.sourceCompName - Name of composition to nest
     * @param {string} params.targetCompName - Name of composition to nest into
     * @param {Array} [params.position] - Position for the nested layer [x, y]
     * @returns {Object} Result
     */
    function nestComp(params) {
        if (!params.sourceCompName) {
            return Utils.error('sourceCompName is required');
        }
        if (!params.targetCompName) {
            return Utils.error('targetCompName is required');
        }
        
        var sourceResult = ProjectData.findItemByName(params.sourceCompName);
        if (sourceResult.error) return Utils.error(sourceResult.error);
        var sourceItem = sourceResult.item;
        if (!(sourceItem instanceof CompItem)) {
            return Utils.error('Source is not a composition: ' + params.sourceCompName);
        }
        
        var targetResult = ProjectData.findItemByName(params.targetCompName);
        if (targetResult.error) return Utils.error(targetResult.error);
        var targetItem = targetResult.item;
        if (!(targetItem instanceof CompItem)) {
            return Utils.error('Target is not a composition: ' + params.targetCompName);
        }
        
        if (sourceItem === targetItem) {
            return Utils.error('Cannot nest a composition into itself');
        }
        
        try {
            var nestedLayer = targetItem.layers.add(sourceItem);
            
            if (params.position && params.position instanceof Array) {
                var transform = nestedLayer.property('ADBE Transform Group');
                if (transform) {
                    var pos = transform.property('ADBE Position');
                    if (pos && pos.canSetValue) {
                        pos.setValue(params.position);
                    }
                }
            }
            
            return Utils.success({
                nested: sourceItem.name,
                into: targetItem.name,
                layerIndex: nestedLayer.index
            });
        } catch (e) {
            return Utils.error('Failed to nest composition: ' + e.toString());
        }
    }
    
    return {
        precompose: precompose,
        duplicateComp: duplicateComp,
        openCompViewer: openCompViewer,
        replaceCompSource: replaceCompSource,
        nestComp: nestComp
    };
})();

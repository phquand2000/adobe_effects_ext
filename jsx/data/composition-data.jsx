// ============================================
// DATA LAYER: Composition Repository
// Provides access to After Effects compositions
// ============================================

var CompositionData = (function() {
    
    /**
     * Get the currently active composition
     * @returns {Object} { comp: CompItem } or { error: string }
     */
    function getActiveComp() {
        try {
            var comp = app.project.activeItem;
            if (!(comp instanceof CompItem)) {
                return { error: 'No active composition. Please select a composition.' };
            }
            return { comp: comp };
        } catch (e) {
            return { error: 'Failed to get active composition: ' + e.toString() };
        }
    }
    
    /**
     * Get composition info
     * @returns {Object} Composition information
     */
    function getCompInfo() {
        var result = getActiveComp();
        if (result.error) return result;
        var comp = result.comp;
        
        var layers = [];
        for (var i = 1; i <= comp.numLayers; i++) {
            var layer = comp.layer(i);
            var layerInfo = {
                index: i,
                name: layer.name,
                type: LayerData.getLayerType(layer),
                enabled: layer.enabled
            };
            
            if (layer.threeDLayer !== undefined) {
                layerInfo.is3D = layer.threeDLayer;
            }
            
            layers.push(layerInfo);
        }
        
        return Utils.success({
            name: comp.name,
            width: comp.width,
            height: comp.height,
            duration: comp.duration,
            frameRate: comp.frameRate,
            numLayers: comp.numLayers,
            renderer: comp.renderer,
            layers: layers
        });
    }
    
    /**
     * Create a new composition
     * @param {Object} params - Composition parameters
     * @returns {Object} Result
     */
    function createComp(params) {
        var name = params.name || 'AI Composition';
        var width = params.width || 1920;
        var height = params.height || 1080;
        var duration = params.duration || 10;
        var frameRate = params.frameRate || 30;
        
        try {
            var comp = app.project.items.addComp(name, width, height, 1, duration, frameRate);
            
            if (params.renderer) {
                try {
                    comp.renderer = params.renderer;
                } catch (e) {
                    // Renderer not available
                }
            }
            
            comp.openInViewer();
            
            return Utils.success({
                name: comp.name,
                width: comp.width,
                height: comp.height,
                duration: comp.duration,
                renderer: comp.renderer
            });
        } catch (e) {
            return Utils.error('Failed to create composition: ' + e.toString());
        }
    }
    
    /**
     * Get available renderers
     * @returns {Object} Available renderers
     */
    function getRenderers() {
        var result = getActiveComp();
        if (result.error) return result;
        var comp = result.comp;
        
        var renderers = [];
        try {
            var available = comp.renderers;
            for (var i = 0; i < available.length; i++) {
                renderers.push(available[i]);
            }
        } catch (e) {
            renderers = ['Classic 3D'];
        }
        
        return Utils.success({
            current: comp.renderer,
            available: renderers,
            hasAdvanced3D: renderers.indexOf('Advanced 3D') >= 0 || renderers.indexOf('Cinema 4D') >= 0
        });
    }
    
    return {
        getActiveComp: getActiveComp,
        getCompInfo: getCompInfo,
        createComp: createComp,
        getRenderers: getRenderers
    };
})();

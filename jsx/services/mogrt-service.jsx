// ============================================
// SERVICE: MOGRT Service
// Motion Graphics Template operations
// ============================================

var MogrtService = (function() {
    
    /**
     * Navigate to a property using a path string
     * @param {Layer} layer - The layer
     * @param {string} propertyPath - Path like "Transform/Position" or "Effects/Blur/Blurriness"
     * @returns {Object} { prop: Property } or { error: string }
     */
    function navigateToProperty(layer, propertyPath) {
        var pathParts = propertyPath.split('/');
        var prop = layer;
        
        for (var i = 0; i < pathParts.length; i++) {
            prop = prop.property(pathParts[i]);
            if (!prop) {
                return { error: 'Property not found: ' + pathParts[i] };
            }
        }
        
        return { prop: prop };
    }
    
    /**
     * Export composition as Motion Graphics Template
     * @param {Object} params - Export parameters
     * @param {string} params.name - Template name (sets motionGraphicsTemplateName)
     * @param {string} params.outputPath - Output file path
     * @param {boolean} [params.overwrite=true] - Overwrite existing file
     * @returns {Object} Result with success/error
     */
    function exportMOGRT(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        if (params.name) {
            comp.motionGraphicsTemplateName = params.name;
        }
        
        var outputPath = params.outputPath || '';
        var overwrite = params.overwrite !== false;
        
        try {
            var success = comp.exportAsMotionGraphicsTemplate(overwrite, outputPath);
            if (success) {
                return Utils.success({
                    comp: comp.name,
                    templateName: comp.motionGraphicsTemplateName,
                    outputPath: outputPath
                });
            } else {
                return Utils.error('Export failed');
            }
        } catch (e) {
            return Utils.error('Export error: ' + e.toString());
        }
    }
    
    /**
     * Add a property to Essential Graphics panel
     * @param {Object} params - Parameters
     * @param {number} [params.layerIndex] - Layer index (1-based)
     * @param {string} [params.layerName] - Layer name
     * @param {string} params.property - Property path (e.g., "Transform/Position")
     * @param {string} [params.propertyPath] - Alternative to property
     * @returns {Object} Result with success/error
     */
    function addToEssentialGraphics(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        var propertyPath = params.propertyPath || params.property;
        if (!propertyPath) {
            return Utils.error('No property path specified');
        }
        
        var propResult = navigateToProperty(layer, propertyPath);
        if (propResult.error) return propResult;
        var prop = propResult.prop;
        
        try {
            if (!prop.canAddToMotionGraphicsTemplate(comp)) {
                return Utils.error('Property cannot be added to Essential Graphics');
            }
            
            var success = prop.addToMotionGraphicsTemplate(comp);
            if (success) {
                return Utils.success({
                    layer: layer.name,
                    property: propertyPath
                });
            } else {
                return Utils.error('Failed to add property to Essential Graphics');
            }
        } catch (e) {
            return Utils.error('Essential Graphics error: ' + e.toString());
        }
    }
    
    return {
        exportMOGRT: exportMOGRT,
        addToEssentialGraphics: addToEssentialGraphics
    };
})();

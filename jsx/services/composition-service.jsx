// ============================================
// SERVICE: Composition Service
// High-level composition operations
// ============================================

var CompositionService = (function() {
    
    /**
     * Find project item by name
     * @param {string} name - Item name to find
     * @returns {Item|null} Found item or null
     */
    function findItemByName(name) {
        for (var i = 1; i <= app.project.numItems; i++) {
            if (app.project.item(i).name === name) {
                return app.project.item(i);
            }
        }
        return null;
    }
    
    /**
     * Get detailed layer information for a composition
     * @param {CompItem} comp - The composition
     * @returns {Object} Detailed composition info
     */
    function getCompDetails(comp) {
        var details = {
            name: comp.name,
            width: comp.width,
            height: comp.height,
            duration: comp.duration,
            fps: comp.frameRate,
            numLayers: comp.numLayers,
            motionBlur: comp.motionBlur || false,
            shutterAngle: comp.shutterAngle,
            renderer: comp.renderer,
            layers: []
        };
        
        for (var i = 1; i <= comp.numLayers; i++) {
            var layer = comp.layer(i);
            var layerInfo = {
                index: i,
                name: layer.name,
                is3D: layer.threeDLayer || false,
                isCamera: layer instanceof CameraLayer,
                isLight: layer instanceof LightLayer,
                isNull: layer.nullLayer || false,
                motionBlur: layer.motionBlur || false
            };
            
            try {
                if (typeof ThreeDModelLayer !== 'undefined') {
                    layerInfo.is3DModel = layer instanceof ThreeDModelLayer;
                } else {
                    layerInfo.is3DModel = false;
                }
            } catch (e) {
                layerInfo.is3DModel = false;
            }
            
            if (layer instanceof LightLayer) {
                layerInfo.lightType = layer.lightType;
            }
            
            details.layers.push(layerInfo);
        }
        
        return details;
    }
    
    /**
     * Set Advanced 3D renderer for a composition
     * @param {CompItem} comp - The composition
     * @returns {Object} Result with renderer info
     */
    function setupAdvanced3DRendererForComp(comp) {
        try {
            var renderers = comp.renderers;
            var idx = -1;
            
            for (var i = 0; i < renderers.length; i++) {
                if (renderers[i] === 'Advanced 3D') {
                    idx = i;
                    break;
                }
            }
            
            if (idx !== -1) {
                comp.renderer = renderers[idx];
                return { success: true, renderer: 'Advanced 3D' };
            }
            
            for (var i = 0; i < renderers.length; i++) {
                if (renderers[i].indexOf('CINEMA 4D') !== -1) {
                    comp.renderer = renderers[i];
                    return { success: true, renderer: renderers[i] };
                }
            }
            
            return { success: true, renderer: comp.renderer, note: 'Advanced 3D not found' };
        } catch (e) {
            return { success: true, renderer: 'default', error: e.toString() };
        }
    }
    
    /**
     * Create a new composition
     * @param {Object} params - Composition parameters
     * @param {string} [params.name] - Composition name
     * @param {number} [params.width] - Width in pixels
     * @param {number} [params.height] - Height in pixels
     * @param {number} [params.duration] - Duration in seconds
     * @param {number} [params.fps] - Frame rate
     * @param {string} [params.fromFootage] - Footage name to match settings from
     * @returns {Object} Result
     */
    function createComp(params) {
        var name = params.name || 'AI Composition';
        var width = params.width || 1920;
        var height = params.height || 1080;
        var duration = params.duration || 10;
        var fps = params.fps || 30;
        
        if (params.fromFootage) {
            var footage = findItemByName(params.fromFootage);
            if (footage && footage.hasVideo) {
                width = footage.width;
                height = footage.height;
                fps = footage.frameRate;
                if (footage.duration > 0) {
                    duration = footage.duration;
                }
            }
        }
        
        try {
            var comp = app.project.items.addComp(name, width, height, 1, duration, fps);
            
            var rendererResult = setupAdvanced3DRendererForComp(comp);
            comp.motionBlur = true;
            comp.openInViewer();
            
            return Utils.success({
                compId: comp.id,
                name: comp.name,
                size: [width, height],
                duration: duration,
                fps: fps,
                renderer: rendererResult.renderer
            });
        } catch (e) {
            return Utils.error('Failed to create composition: ' + e.toString());
        }
    }
    
    /**
     * Get active composition details
     * @returns {Object} Composition info with layers
     */
    function getCompInfo() {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        return Utils.success(getCompDetails(comp));
    }
    
    /**
     * Get project information
     * @returns {Object} Project info with items list
     */
    function getProjectInfo() {
        try {
            var info = {
                projectName: app.project.file ? app.project.file.name : 'Untitled',
                projectPath: app.project.file ? app.project.file.fsName : null,
                numItems: app.project.numItems,
                items: [],
                activeComp: null
            };
            
            for (var i = 1; i <= Math.min(app.project.numItems, 50); i++) {
                var item = app.project.item(i);
                info.items.push({
                    name: item.name,
                    type: item.typeName,
                    id: item.id
                });
            }
            
            if (app.project.activeItem instanceof CompItem) {
                info.activeComp = getCompDetails(app.project.activeItem);
            }
            
            return Utils.success(info);
        } catch (e) {
            return Utils.error('Failed to get project info: ' + e.toString());
        }
    }
    
    /**
     * Get available renderers for active composition
     * @returns {Object} Current and available renderers
     */
    function getRenderers() {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
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
    
    /**
     * Setup Advanced 3D renderer for active composition
     * @returns {Object} Result with renderer info
     */
    function setupAdvanced3D() {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var result = setupAdvanced3DRendererForComp(comp);
        
        if (result.success) {
            return Utils.success({
                renderer: result.renderer,
                note: result.note
            });
        }
        
        return Utils.error(result.error || 'Failed to set renderer');
    }
    
    return {
        createComp: createComp,
        getCompInfo: getCompInfo,
        getProjectInfo: getProjectInfo,
        getRenderers: getRenderers,
        setupAdvanced3D: setupAdvanced3D
    };
})();

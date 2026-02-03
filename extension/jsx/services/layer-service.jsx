// ============================================
// SERVICE: Layer Service
// High-level layer operations
// ============================================

var LayerService = (function() {
    
    /**
     * Setup layer as 3D with material options
     * @param {Object} params - Layer setup parameters
     * @returns {Object} Result
     */
    function setup3DLayer(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerIndex = params.layerIndex || 1;
        
        if (layerIndex > comp.numLayers) {
            return Utils.error('Layer index out of range: ' + layerIndex + ' (comp has ' + comp.numLayers + ' layers)');
        }
        
        var layer = comp.layer(layerIndex);
        
        // Detect if this is a 3D model layer
        var isModelLayer = false;
        try {
            isModelLayer = (typeof ThreeDModelLayer !== 'undefined' && layer instanceof ThreeDModelLayer);
        } catch (e) {}
        
        if (!isModelLayer) {
            try {
                if (layer.threeDLayer !== undefined) {
                    layer.threeDLayer = true;
                }
            } catch (e) {
                return Utils.error('Cannot enable 3D on this layer type: ' + e.toString());
            }
        }
        
        LayerData.setTransform(layer, {
            position: params.position,
            scale: params.scale,
            rotation: params.rotation
        });
        
        MaterialDomain.applyMaterial(layer, params.material || {});
        layer.motionBlur = true;
        
        return Utils.success({
            layer: layer.name,
            is3D: layer.threeDLayer,
            isModelLayer: isModelLayer
        });
    }
    
    /**
     * Enable motion blur on composition and layers
     * @param {Object} params - Motion blur parameters
     * @returns {Object} Result
     */
    function enableMotionBlur(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        comp.motionBlur = true;
        
        if (params.shutterAngle !== undefined) {
            comp.shutterAngle = params.shutterAngle;
        }
        if (params.shutterPhase !== undefined) {
            comp.shutterPhase = params.shutterPhase;
        }
        if (params.samplesPerFrame !== undefined) {
            comp.motionBlurSamplesPerFrame = params.samplesPerFrame;
        }
        if (params.adaptiveSampleLimit !== undefined) {
            comp.motionBlurAdaptiveSampleLimit = params.adaptiveSampleLimit;
        }
        
        var enabledLayers = [];
        if (params.layerIndex) {
            var layer = comp.layer(params.layerIndex);
            layer.motionBlur = true;
            enabledLayers.push(layer.name);
        } else if (params.all3D) {
            for (var i = 1; i <= comp.numLayers; i++) {
                var layer = comp.layer(i);
                if (layer.threeDLayer) {
                    layer.motionBlur = true;
                    enabledLayers.push(layer.name);
                }
            }
        }
        
        return Utils.success({
            compMotionBlur: true,
            shutterAngle: comp.shutterAngle,
            enabledLayers: enabledLayers
        });
    }
    
    /**
     * Add shadow catcher plane
     * @param {Object} params - Shadow catcher parameters
     * @returns {Object} Result
     */
    function addShadowCatcher(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var name = params.name || 'Shadow Catcher';
        var color = [1, 1, 1];
        
        var solidLayer = LayerData.addSolid(comp, {
            name: name,
            color: color,
            width: comp.width,
            height: comp.height
        });
        
        solidLayer.threeDLayer = true;
        
        var transform = LayerData.getTransform(solidLayer);
        var position = params.position || [comp.width / 2, comp.height * 0.7, 0];
        Utils.setProp(transform, 'ADBE Position', position);
        Utils.setProp(transform, 'ADBE Rotate X', params.rotationX || 90);
        
        var scale = params.scale || [200, 200, 100];
        Utils.setProp(transform, 'ADBE Scale', scale);
        
        MaterialDomain.configureShadowCatcher(solidLayer);
        
        if (params.isolateShadows !== false) {
            var levels = solidLayer.Effects.addProperty('ADBE Easy Levels2');
            levels.property('ADBE Easy Levels2-0005').setValue(1.0);
        }
        
        if (params.blendMode !== false) {
            solidLayer.blendingMode = BlendingMode.MULTIPLY;
        }
        
        var targetIndex = params.layerIndex || comp.numLayers;
        solidLayer.moveAfter(comp.layer(Math.min(targetIndex, comp.numLayers)));
        
        return Utils.success({
            layer: solidLayer.name,
            layerIndex: solidLayer.index,
            position: position,
            rotation: [params.rotationX || 90, 0, 0]
        });
    }
    
    /**
     * Add null controller with expression controls
     * @param {Object} params - Null controller parameters
     * @returns {Object} Result
     */
    function addNullController(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var name = params.name || 'Null Controller';
        var nullLayer = LayerData.addNull(comp, name);
        nullLayer.threeDLayer = params.is3D !== false;
        
        var transform = LayerData.getTransform(nullLayer);
        
        if (params.position) {
            Utils.setProp(transform, 'ADBE Position', params.position);
        } else {
            Utils.setProp(transform, 'ADBE Position', [comp.width / 2, comp.height / 2, 0]);
        }
        
        var controls = [];
        
        if (params.sliders && params.sliders.length > 0) {
            for (var i = 0; i < params.sliders.length; i++) {
                var sliderName = params.sliders[i].name || 'Slider ' + (i + 1);
                var sliderEffect = nullLayer.Effects.addProperty('ADBE Slider Control');
                sliderEffect.name = sliderName;
                if (params.sliders[i].value !== undefined) {
                    sliderEffect.property('ADBE Slider Control-0001').setValue(params.sliders[i].value);
                }
                controls.push(sliderName);
            }
        }
        
        if (params.colorControl) {
            var colorEffect = nullLayer.Effects.addProperty('ADBE Color Control');
            colorEffect.name = params.colorControl.name || 'Color';
            if (params.colorControl.value) {
                colorEffect.property('ADBE Color Control-0001').setValue(params.colorControl.value);
            }
            controls.push(params.colorControl.name || 'Color');
        }
        
        if (params.pointControl) {
            var pointEffect = nullLayer.Effects.addProperty('ADBE Point Control');
            pointEffect.name = params.pointControl.name || 'Point';
            if (params.pointControl.value) {
                pointEffect.property('ADBE Point Control-0001').setValue(params.pointControl.value);
            }
            controls.push(params.pointControl.name || 'Point');
        }
        
        return Utils.success({
            nullName: nullLayer.name,
            layerIndex: nullLayer.index,
            is3D: nullLayer.threeDLayer,
            controls: controls
        });
    }
    
    /**
     * Parent layers together
     * @param {Object} params - Parenting parameters
     * @returns {Object} Result
     */
    function parentLayers(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var parentLayer = null;
        
        if (params.parentIndex) {
            parentLayer = comp.layer(params.parentIndex);
        } else if (params.parentName) {
            var parentResult = LayerData.getLayer(comp, { layerName: params.parentName });
            if (!parentResult.error) parentLayer = parentResult.layer;
        }
        
        if (!parentLayer) {
            return Utils.error('Parent layer not found');
        }
        
        var childIndices = params.childIndices || [];
        var childNames = params.childNames || [];
        var parented = [];
        
        for (var i = 0; i < childIndices.length; i++) {
            var child = comp.layer(childIndices[i]);
            if (child && child !== parentLayer) {
                child.parent = parentLayer;
                parented.push(child.name);
            }
        }
        
        for (var i = 0; i < childNames.length; i++) {
            var childResult = LayerData.getLayer(comp, { layerName: childNames[i] });
            if (!childResult.error && childResult.layer !== parentLayer) {
                childResult.layer.parent = parentLayer;
                parented.push(childResult.layer.name);
            }
        }
        
        return Utils.success({
            parent: parentLayer.name,
            children: parented
        });
    }
    
    /**
     * Unparent a layer
     * @param {Object} params - Unparent parameters
     * @returns {Object} Result
     */
    function unparentLayer(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        var previousParent = layer.parent ? layer.parent.name : null;
        layer.parent = null;
        
        return Utils.success({
            layer: layer.name,
            previousParent: previousParent
        });
    }
    
    return {
        setup3DLayer: setup3DLayer,
        enableMotionBlur: enableMotionBlur,
        addShadowCatcher: addShadowCatcher,
        addNullController: addNullController,
        parentLayers: parentLayers,
        unparentLayer: unparentLayer
    };
})();

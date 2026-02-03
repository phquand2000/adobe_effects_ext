// ============================================
// SERVICE LAYER: Workflow Service
// Orchestrates complex animation and transition workflows
// Dependencies: Utils, CompositionData, LayerData
// ============================================

var WorkflowService = (function() {
    
    // ============================================
    // PRIVATE HELPERS
    // ============================================
    
    /**
     * Apply easing to a property's keyframes
     * @param {Property} property - The property with keyframes
     * @param {string} easingType - 'easeIn', 'easeOut', or 'easeInOut'
     */
    function applyEasing(property, easingType) {
        var numKeys = property.numKeys;
        if (numKeys < 2) return;
        
        var easeIn, easeOut;
        
        switch (easingType) {
            case 'easeIn':
                easeIn = new KeyframeEase(0.75, 50);
                easeOut = new KeyframeEase(0.25, 50);
                break;
            case 'easeOut':
                easeIn = new KeyframeEase(0.25, 50);
                easeOut = new KeyframeEase(0.75, 50);
                break;
            case 'easeInOut':
            default:
                easeIn = new KeyframeEase(0.5, 75);
                easeOut = new KeyframeEase(0.5, 75);
        }
        
        for (var i = 1; i <= numKeys; i++) {
            try {
                var val = property.keyValue(i);
                var dim = (val instanceof Array) ? val.length : 1;
                var easeInArr = [];
                var easeOutArr = [];
                for (var d = 0; d < dim; d++) {
                    easeInArr.push(easeIn);
                    easeOutArr.push(easeOut);
                }
                property.setTemporalEaseAtKey(i, easeInArr, easeOutArr);
            } catch (e) {}
        }
    }
    
    /**
     * Safely set keyframes on a property
     * @param {Property} prop - The property
     * @param {string} propName - Property name for error reporting
     * @param {*} startVal - Start value
     * @param {*} endVal - End value
     * @param {number} startTime - Start time
     * @param {number} endTime - End time
     * @param {Array} animated - Array to track animated properties
     * @param {Array} errors - Array to track errors
     * @returns {boolean} Success status
     */
    function safeSetKeyframes(prop, propName, startVal, endVal, startTime, endTime, animated, errors) {
        if (!prop) {
            errors.push(propName + ' not found');
            return false;
        }
        try {
            if (prop.canVaryOverTime && !prop.isTimeVarying) {
                prop.setValueAtTime(startTime, startVal);
                prop.setValueAtTime(endTime, endVal);
                animated.push(propName);
                return true;
            } else if (prop.canVaryOverTime) {
                prop.setValueAtTime(startTime, startVal);
                prop.setValueAtTime(endTime, endVal);
                animated.push(propName);
                return true;
            } else {
                prop.setValue(endVal);
                animated.push(propName + ' (static)');
                return true;
            }
        } catch (e) {
            errors.push(propName + ': ' + e.message);
            return false;
        }
    }
    
    /**
     * Apply lighting adjustments from AI analysis
     * @param {CompItem} comp - The composition
     * @param {Object} lighting - Lighting analysis data
     * @returns {boolean} Success status
     */
    function applyLightingFromAnalysis(comp, lighting) {
        var keyLight = null;
        for (var i = 1; i <= comp.numLayers; i++) {
            var layer = comp.layer(i);
            if (layer instanceof LightLayer && layer.name.indexOf('Key') !== -1) {
                keyLight = layer;
                break;
            }
        }
        
        if (!keyLight) return false;
        
        var lightOptions = keyLight.property('ADBE Light Options Group');
        var transform = keyLight.property('ADBE Transform Group');
        
        if (lighting.intensity) {
            var intensityMap = { 'low': 60, 'medium': 100, 'high': 140 };
            var intensity = intensityMap[lighting.intensity] || 100;
            Utils.setProp(lightOptions, 'ADBE Light Intensity', intensity);
        }
        
        if (lighting.temperature) {
            var colorMap = {
                'warm': [1, 0.92, 0.85],
                'neutral': [1, 1, 1],
                'cool': [0.85, 0.92, 1]
            };
            var color = colorMap[lighting.temperature] || [1, 1, 1];
            Utils.setProp(lightOptions, 'ADBE Light Color', color);
        }
        
        if (lighting.direction) {
            var directionMap = {
                'left': [-500, 0, -800],
                'right': [comp.width + 500, 0, -800],
                'top': [comp.width / 2, -500, -800],
                'bottom': [comp.width / 2, comp.height + 500, -800],
                'front': [comp.width / 2, comp.height / 2, -1500],
                'back': [comp.width / 2, comp.height / 2, 500]
            };
            var position = directionMap[lighting.direction];
            if (position) {
                Utils.setProp(transform, 'ADBE Position', position);
            }
        }
        
        return true;
    }
    
    // ============================================
    // PUBLIC API
    // ============================================
    
    /**
     * Animate a coin layer with scale, rotation, and position
     * @param {Object} params - Animation parameters
     * @param {number} [params.layerIndex=1] - Layer index
     * @param {number} [params.startTime] - Start time (defaults to comp time)
     * @param {number} [params.duration=2] - Animation duration
     * @param {Array} [params.startScale=[10,10,10]] - Starting scale
     * @param {Array} [params.endScale=[100,100,100]] - Ending scale
     * @param {number} [params.rotations=2] - Number of Y rotations
     * @param {Object} [params.wobble] - X rotation wobble { start, end }
     * @param {Array} [params.startPosition] - Starting position
     * @param {Array} [params.endPosition] - Ending position
     * @param {string} [params.easing='easeInOut'] - Easing type
     * @returns {Object} Result
     */
    function animateCoin(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerIndex = params.layerIndex || 1;
        var layerResult = LayerData.getLayer(comp, { layerIndex: layerIndex });
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        if (!layer.threeDLayer && !(typeof ThreeDModelLayer !== 'undefined' && layer instanceof ThreeDModelLayer)) {
            layer.threeDLayer = true;
        }
        
        var startTime = params.startTime !== undefined ? params.startTime : comp.time;
        var duration = params.duration || 2;
        var endTime = startTime + duration;
        
        var startScale = params.startScale || [10, 10, 10];
        var endScale = params.endScale || [100, 100, 100];
        
        var transform = LayerData.getTransform(layer);
        var animated = [];
        var errors = [];
        
        var scaleProp = transform.property('ADBE Scale');
        safeSetKeyframes(scaleProp, 'Scale', startScale, endScale, startTime, endTime, animated, errors);
        
        var rotations = params.rotations || 2;
        var yRotProp = transform.property('ADBE Rotate Y');
        safeSetKeyframes(yRotProp, 'Y Rotation', 0, rotations * 360, startTime, endTime, animated, errors);
        
        if (params.wobble) {
            var xRotProp = transform.property('ADBE Rotate X');
            var wobbleStart = params.wobble.start !== undefined ? params.wobble.start : -15;
            var wobbleEnd = params.wobble.end !== undefined ? params.wobble.end : 0;
            if (safeSetKeyframes(xRotProp, 'X Rotation', wobbleStart, wobbleEnd, startTime, endTime, animated, errors)) {
                applyEasing(xRotProp, params.easing || 'easeInOut');
            }
        }
        
        if (params.startPosition && params.endPosition) {
            var posProp = transform.property('ADBE Position');
            if (safeSetKeyframes(posProp, 'Position', params.startPosition, params.endPosition, startTime, endTime, animated, errors)) {
                applyEasing(posProp, params.easing || 'easeInOut');
            }
        }
        
        if (scaleProp && scaleProp.numKeys >= 2) applyEasing(scaleProp, params.easing || 'easeInOut');
        if (yRotProp && yRotProp.numKeys >= 2) applyEasing(yRotProp, params.easing || 'easeInOut');
        
        try {
            layer.motionBlur = true;
        } catch (e) {}
        
        return Utils.success({
            layer: layer.name,
            startTime: startTime,
            endTime: endTime,
            duration: duration,
            animated: animated,
            errors: errors.length > 0 ? errors : null
        });
    }
    
    /**
     * Create a complete coin transition workflow
     * @param {Object} params - Workflow parameters
     * @param {string} [params.footageName] - Footage item name to use as background
     * @param {string} [params.modelPath] - Path to 3D model file to import
     * @param {string} [params.modelName] - Name of existing 3D model in project
     * @param {string} [params.compName='Coin Transition'] - Composition name
     * @param {Array} [params.startScale=[10,10,10]] - Starting scale for animation
     * @param {Array} [params.endScale=[100,100,100]] - Ending scale for animation
     * @param {number} [params.rotations=2] - Number of rotations
     * @param {number} [params.focalLength=35] - Camera focal length
     * @param {boolean} [params.enableDOF=false] - Enable depth of field
     * @param {number} [params.focusDistance=1500] - Focus distance
     * @param {Object} [params.keyLight] - Key light settings
     * @param {Object} [params.fillLight] - Fill light settings
     * @returns {Object} Result with steps and errors
     */
    function createCoinTransition(params) {
        var results = {
            steps: [],
            errors: []
        };
        
        try {
            var comp;
            
            if (params.footageName) {
                var compResult = CompositionData.createComp({
                    name: params.compName || 'Coin Transition',
                    fromFootage: params.footageName
                });
                results.steps.push({ step: 'createComp', result: compResult });
            }
            
            var activeResult = CompositionData.getActiveComp();
            if (activeResult.error) {
                results.errors.push(activeResult.error);
                results.success = false;
                return results;
            }
            comp = activeResult.comp;
            
            var rendererResult = CompositionData.getRenderers();
            if (rendererResult.hasAdvanced3D) {
                try {
                    comp.renderer = 'Advanced 3D';
                    results.steps.push({ step: 'setupRenderer', result: { renderer: 'Advanced 3D' } });
                } catch (e) {
                    try {
                        comp.renderer = 'Cinema 4D';
                        results.steps.push({ step: 'setupRenderer', result: { renderer: 'Cinema 4D' } });
                    } catch (e2) {
                        results.errors.push('Warning: Advanced 3D renderer not available');
                        results.steps.push({ step: 'setupRenderer', result: { note: 'Advanced 3D not found' } });
                    }
                }
            } else {
                results.steps.push({ step: 'setupRenderer', result: { note: 'Advanced 3D not found' } });
            }
            
            if (params.footageName) {
                var footage = null;
                for (var i = 1; i <= app.project.numItems; i++) {
                    if (app.project.item(i).name === params.footageName) {
                        footage = app.project.item(i);
                        break;
                    }
                }
                if (footage) {
                    comp.layers.add(footage);
                    results.steps.push({ step: 'addFootage', result: { success: true } });
                }
            }
            
            var coinLayer = null;
            if (params.modelPath) {
                try {
                    var modelFile = new File(params.modelPath);
                    if (modelFile.exists) {
                        var imported = app.project.importFile(new ImportOptions(modelFile));
                        if (imported) {
                            comp.layers.add(imported);
                            coinLayer = comp.layer(1);
                            results.steps.push({ step: 'import3DModel', result: { success: true, name: imported.name } });
                        }
                    } else {
                        results.steps.push({ step: 'import3DModel', result: { error: 'Model file not found: ' + params.modelPath } });
                    }
                } catch (e) {
                    results.steps.push({ step: 'import3DModel', result: { error: e.toString() } });
                }
            } else if (params.modelName) {
                var model = null;
                for (var j = 1; j <= app.project.numItems; j++) {
                    if (app.project.item(j).name === params.modelName) {
                        model = app.project.item(j);
                        break;
                    }
                }
                if (model) {
                    comp.layers.add(model);
                    coinLayer = comp.layer(1);
                    results.steps.push({ step: 'add3DModel', result: { success: true, name: model.name } });
                } else {
                    results.steps.push({ step: 'add3DModel', result: { error: 'Model not found: ' + params.modelName } });
                }
            }
            
            var coinLayerName = coinLayer ? coinLayer.name : null;
            
            if (coinLayer) {
                var layerTransform = LayerData.getTransform(coinLayer);
                var coinPosition = params.coinPosition || [comp.width / 2, comp.height / 2, 0];
                Utils.setProp(layerTransform, 'ADBE Position', coinPosition);
                Utils.setProp(layerTransform, 'ADBE Scale', params.startScale || [10, 10, 10]);
                
                var material = coinLayer.property('ADBE Material Options Group');
                if (material) {
                    Utils.setProp(material, 'ADBE Casts Shadows', 1);
                    Utils.setProp(material, 'ADBE Accepts Lights', 1);
                    Utils.setProp(material, 'ADBE Specular Coefficient', 80);
                    Utils.setProp(material, 'ADBE Shininess Coefficient', 50);
                    Utils.setProp(material, 'ADBE Metal Coefficient', 100);
                }
                results.steps.push({ step: 'setup3DLayer', result: { success: true } });
            }
            
            var camera = comp.layers.addCamera('Main Camera', [comp.width / 2, comp.height / 2]);
            var cameraOptions = camera.property('ADBE Camera Options Group');
            Utils.setProp(cameraOptions, 'ADBE Camera Zoom', params.focalLength || 35);
            if (params.enableDOF) {
                Utils.setProp(cameraOptions, 'ADBE Camera Depth of Field', 1);
                Utils.setProp(cameraOptions, 'ADBE Camera Focus Distance', params.focusDistance || 1500);
            }
            results.steps.push({ step: 'addCamera', result: { success: true, name: camera.name } });
            
            var keyLightParams = params.keyLight || {};
            var keyLight = comp.layers.addLight('Key Light', [comp.width / 2, comp.height / 2]);
            keyLight.lightType = LightType.SPOT;
            var keyLightOptions = keyLight.property('ADBE Light Options Group');
            Utils.setProp(keyLightOptions, 'ADBE Light Intensity', keyLightParams.intensity || 100);
            var keyTransform = LayerData.getTransform(keyLight);
            Utils.setProp(keyTransform, 'ADBE Position', keyLightParams.position || [comp.width * 0.7, comp.height * 0.3, -800]);
            
            var fillLightParams = params.fillLight || {};
            var fillLight = comp.layers.addLight('Fill Light', [comp.width / 2, comp.height / 2]);
            fillLight.lightType = LightType.SPOT;
            var fillLightOptions = fillLight.property('ADBE Light Options Group');
            Utils.setProp(fillLightOptions, 'ADBE Light Intensity', fillLightParams.intensity || 50);
            var fillTransform = LayerData.getTransform(fillLight);
            Utils.setProp(fillTransform, 'ADBE Position', fillLightParams.position || [comp.width * 0.3, comp.height * 0.6, -600]);
            
            var rimLight = comp.layers.addLight('Rim Light', [comp.width / 2, comp.height / 2]);
            rimLight.lightType = LightType.SPOT;
            var rimLightOptions = rimLight.property('ADBE Light Options Group');
            Utils.setProp(rimLightOptions, 'ADBE Light Intensity', 60);
            var rimTransform = LayerData.getTransform(rimLight);
            Utils.setProp(rimTransform, 'ADBE Position', [comp.width / 2, comp.height / 2, 500]);
            
            results.steps.push({ step: 'addLightRig', result: { success: true, lights: ['Key Light', 'Fill Light', 'Rim Light'] } });
            
            var coinLayerIndex = null;
            if (coinLayerName) {
                for (var k = 1; k <= comp.numLayers; k++) {
                    if (comp.layer(k).name === coinLayerName) {
                        coinLayerIndex = k;
                        break;
                    }
                }
            }
            
            if (coinLayerIndex) {
                var animResult = animateCoin({
                    layerIndex: coinLayerIndex,
                    startTime: params.animationStart || 0,
                    duration: params.animationDuration || 2,
                    startScale: params.startScale || [10, 10, 10],
                    endScale: params.endScale || [100, 100, 100],
                    rotations: params.rotations || 2,
                    wobble: { start: -15, end: 0 },
                    easing: 'easeInOut'
                });
                results.steps.push({ step: 'animateCoin', result: animResult });
            } else {
                results.steps.push({ step: 'animateCoin', result: { error: 'Coin layer not found' } });
            }
            
            comp.motionBlur = true;
            comp.shutterAngle = 180;
            for (var m = 1; m <= comp.numLayers; m++) {
                var lyr = comp.layer(m);
                if (lyr.threeDLayer || (typeof ThreeDModelLayer !== 'undefined' && lyr instanceof ThreeDModelLayer)) {
                    try {
                        lyr.motionBlur = true;
                    } catch (e) {}
                }
            }
            results.steps.push({ step: 'enableMotionBlur', result: { success: true } });
            
            results.success = true;
            results.message = 'Coin transition setup complete. Run 3D Camera Tracker on footage layer for integration.';
            
        } catch (e) {
            results.errors.push(e.toString());
            results.success = false;
        }
        
        return results;
    }
    
    /**
     * Position a layer based on AI vision analysis
     * @param {Object} params - Positioning parameters
     * @param {number} [params.layerIndex=1] - Layer index
     * @param {Object} params.analysis - AI analysis with coinPosition
     * @param {Object} params.analysis.coinPosition - Position data { x, y, size }
     * @param {number} [params.baseScale=100] - Base scale value
     * @param {boolean} [params.adjustLighting=true] - Apply lighting adjustments
     * @param {number} [params.zDepth=0] - Z depth position
     * @returns {Object} Result
     */
    function positionFromAnalysis(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerIndex = params.layerIndex || 1;
        var layerResult = LayerData.getLayer(comp, { layerIndex: layerIndex });
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        var analysis = params.analysis;
        if (!analysis || !analysis.coinPosition) {
            return Utils.error('No coin position data in analysis');
        }
        
        var coinPos = analysis.coinPosition;
        var x = (coinPos.x / 100) * comp.width;
        var y = (coinPos.y / 100) * comp.height;
        var z = params.zDepth || 0;
        
        var sizeMultiplier = 1;
        if (coinPos.size === 'small') sizeMultiplier = 0.5;
        else if (coinPos.size === 'large') sizeMultiplier = 1.5;
        
        var baseScale = params.baseScale || 100;
        var scale = baseScale * sizeMultiplier;
        
        var transform = LayerData.getTransform(layer);
        Utils.setProp(transform, 'ADBE Position', [x, y, z]);
        Utils.setProp(transform, 'ADBE Scale', [scale, scale, scale]);
        
        var lightingApplied = false;
        if (analysis.lighting && params.adjustLighting !== false) {
            lightingApplied = applyLightingFromAnalysis(comp, analysis.lighting);
        }
        
        return Utils.success({
            layer: layer.name,
            position: [x, y, z],
            scale: [scale, scale, scale],
            lightingAdjusted: lightingApplied
        });
    }
    
    /**
     * Apply color matching effects to a layer
     * @param {Object} params - Color matching parameters
     * @param {number} [params.layerIndex=1] - Layer index
     * @param {Object} [params.levels] - Levels settings (false to skip)
     * @param {number} [params.levels.inputBlack] - Input black level
     * @param {number} [params.levels.inputWhite] - Input white level
     * @param {number} [params.levels.gamma] - Gamma
     * @param {number} [params.levels.outputBlack] - Output black level
     * @param {number} [params.levels.outputWhite] - Output white level
     * @param {number} [params.exposure] - Exposure value
     * @param {number} [params.offset] - Offset value
     * @param {number} [params.gammaCorrection] - Gamma correction
     * @param {Object} [params.hueSaturation] - Hue/Saturation settings
     * @param {number} [params.hueSaturation.hue] - Hue adjustment
     * @param {number} [params.hueSaturation.saturation] - Saturation adjustment
     * @param {number} [params.hueSaturation.lightness] - Lightness adjustment
     * @returns {Object} Result
     */
    function applyColorMatch(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerIndex = params.layerIndex || 1;
        var layerResult = LayerData.getLayer(comp, { layerIndex: layerIndex });
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        if (!LayerData.supportsEffects(layer)) {
            return Utils.error('This layer type does not support effects (3D Model layers cannot have effects applied directly)');
        }
        
        var effectsApplied = [];
        
        if (params.levels !== false) {
            var levels = layer.Effects.addProperty('ADBE Easy Levels2');
            var levelsParams = params.levels || {};
            if (levelsParams.inputBlack !== undefined) {
                levels.property('ADBE Easy Levels2-0001').setValue(levelsParams.inputBlack);
            }
            if (levelsParams.inputWhite !== undefined) {
                levels.property('ADBE Easy Levels2-0002').setValue(levelsParams.inputWhite);
            }
            if (levelsParams.gamma !== undefined) {
                levels.property('ADBE Easy Levels2-0003').setValue(levelsParams.gamma);
            }
            if (levelsParams.outputBlack !== undefined) {
                levels.property('ADBE Easy Levels2-0004').setValue(levelsParams.outputBlack);
            }
            if (levelsParams.outputWhite !== undefined) {
                levels.property('ADBE Easy Levels2-0005').setValue(levelsParams.outputWhite);
            }
            effectsApplied.push('Levels');
        }
        
        if (params.exposure !== undefined) {
            var exposure = layer.Effects.addProperty('ADBE Exposure2');
            exposure.property('ADBE Exposure2-0003').setValue(params.exposure);
            if (params.offset !== undefined) {
                exposure.property('ADBE Exposure2-0004').setValue(params.offset);
            }
            if (params.gammaCorrection !== undefined) {
                exposure.property('ADBE Exposure2-0005').setValue(params.gammaCorrection);
            }
            effectsApplied.push('Exposure');
        }
        
        if (params.hueSaturation) {
            var hueSat = layer.Effects.addProperty('ADBE HUE SATURATION');
            if (params.hueSaturation.hue !== undefined) {
                hueSat.property('ADBE HUE SATURATION-0004').setValue(params.hueSaturation.hue);
            }
            if (params.hueSaturation.saturation !== undefined) {
                hueSat.property('ADBE HUE SATURATION-0005').setValue(params.hueSaturation.saturation);
            }
            if (params.hueSaturation.lightness !== undefined) {
                hueSat.property('ADBE HUE SATURATION-0006').setValue(params.hueSaturation.lightness);
            }
            effectsApplied.push('Hue/Saturation');
        }
        
        return Utils.success({
            layer: layer.name,
            effectsApplied: effectsApplied
        });
    }
    
    // ============================================
    // PUBLIC API
    // ============================================
    
    return {
        animateCoin: animateCoin,
        createCoinTransition: createCoinTransition,
        positionFromAnalysis: positionFromAnalysis,
        applyColorMatch: applyColorMatch
    };
})();

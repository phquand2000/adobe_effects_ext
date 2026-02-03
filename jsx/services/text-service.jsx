// ============================================
// SERVICE: Text Service
// Text layer creation and manipulation
// ============================================

var TextService = (function() {
    
    /**
     * Map justification string to ParagraphJustification enum
     * @param {string} justification - left, center, right, full
     * @returns {ParagraphJustification|null}
     */
    function getJustification(justification) {
        var justMap = {
            'left': ParagraphJustification.LEFT_JUSTIFY,
            'center': ParagraphJustification.CENTER_JUSTIFY,
            'right': ParagraphJustification.RIGHT_JUSTIFY,
            'full': ParagraphJustification.FULL_JUSTIFY_LASTLINE_LEFT
        };
        return justMap[justification] || null;
    }
    
    /**
     * Add a text layer to the active composition
     * @param {Object} params - Text layer parameters
     * @param {boolean} [params.boxText] - Create box text instead of point text
     * @param {number} [params.boxWidth] - Box width (default: 400)
     * @param {number} [params.boxHeight] - Box height (default: 200)
     * @param {string} [params.text] - Text content
     * @param {string} [params.name] - Layer name
     * @param {string} [params.font] - Font name
     * @param {number} [params.fontSize] - Font size
     * @param {Array} [params.fillColor] - Fill color [r, g, b] (0-1)
     * @param {Array} [params.strokeColor] - Stroke color [r, g, b] (0-1)
     * @param {number} [params.strokeWidth] - Stroke width
     * @param {string} [params.justification] - left, center, right, full
     * @param {Array} [params.position] - Position [x, y] or [x, y, z]
     * @returns {Object} Result with layer info
     */
    function addTextLayer(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var textLayer;
        if (params.boxText) {
            textLayer = comp.layers.addBoxText([params.boxWidth || 400, params.boxHeight || 200]);
        } else {
            textLayer = comp.layers.addText(params.text || 'Text');
        }
        
        if (params.name) {
            textLayer.name = params.name;
        }
        
        var textProp = textLayer.property('ADBE Text Properties').property('ADBE Text Document');
        var textDoc = textProp.value;
        
        if (params.text) {
            textDoc.text = params.text;
        }
        
        if (params.font) {
            textDoc.font = params.font;
        }
        if (params.fontSize) {
            textDoc.fontSize = params.fontSize;
        }
        
        if (params.fillColor) {
            textDoc.applyFill = true;
            textDoc.fillColor = params.fillColor;
        }
        if (params.strokeColor) {
            textDoc.applyStroke = true;
            textDoc.strokeColor = params.strokeColor;
            if (params.strokeWidth) {
                textDoc.strokeWidth = params.strokeWidth;
            }
        }
        
        if (params.justification) {
            var just = getJustification(params.justification);
            if (just) {
                textDoc.justification = just;
            }
        }
        
        textProp.setValue(textDoc);
        
        if (params.position) {
            textLayer.property('ADBE Transform Group').property('ADBE Position').setValue(params.position);
        }
        
        return Utils.success({
            layer: textLayer.name,
            layerIndex: textLayer.index
        });
    }
    
    /**
     * Update an existing text layer
     * @param {Object} params - Update parameters
     * @param {number} [params.layerIndex] - Layer index to update
     * @param {string} [params.layerName] - Layer name to update
     * @param {string} [params.text] - New text content
     * @param {string} [params.font] - New font name
     * @param {number} [params.fontSize] - New font size
     * @param {Array} [params.fillColor] - New fill color [r, g, b] (0-1)
     * @returns {Object} Result with updated layer info
     */
    function updateText(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        if (!(layer instanceof TextLayer)) {
            return Utils.error('Layer is not a text layer');
        }
        
        var textProp = layer.property('ADBE Text Properties').property('ADBE Text Document');
        var textDoc = textProp.value;
        
        if (params.text !== undefined) {
            textDoc.text = params.text;
        }
        if (params.font) {
            textDoc.font = params.font;
        }
        if (params.fontSize) {
            textDoc.fontSize = params.fontSize;
        }
        if (params.fillColor) {
            textDoc.applyFill = true;
            textDoc.fillColor = params.fillColor;
        }
        
        textProp.setValue(textDoc);
        
        return Utils.success({
            layer: layer.name,
            text: textDoc.text
        });
    }
    
    /**
     * Add a text animator to a text layer
     * @param {Object} params - Animator parameters
     * @param {number} [params.layerIndex] - Layer index
     * @param {string} [params.layerName] - Layer name
     * @param {string} [params.animatorName] - Name for the animator
     * @param {Object} [params.properties] - Properties to add (position, scale, rotation, opacity, tracking, etc)
     * @returns {Object} Result with layer and animator info
     */
    function addTextAnimator(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        if (!(layer instanceof TextLayer)) {
            return Utils.error('Layer is not a text layer');
        }
        
        var textProps = layer.property('ADBE Text Properties');
        var animators = textProps.property('ADBE Text Animators');
        var animator = animators.addProperty('ADBE Text Animator');
        
        if (params.animatorName) {
            animator.name = params.animatorName;
        }
        
        if (params.properties) {
            var animatorProps = animator.property('ADBE Text Animator Properties');
            var propMap = {
                'position': 'ADBE Text Position',
                'scale': 'ADBE Text Scale',
                'rotation': 'ADBE Text Rotation',
                'rotationX': 'ADBE Text Rotation X',
                'rotationY': 'ADBE Text Rotation Y',
                'opacity': 'ADBE Text Opacity',
                'tracking': 'ADBE Text Tracking Amount',
                'skew': 'ADBE Text Skew',
                'skewAxis': 'ADBE Text Skew Axis',
                'fillColor': 'ADBE Text Fill Color',
                'fillHue': 'ADBE Text Fill Hue',
                'fillSaturation': 'ADBE Text Fill Saturation',
                'fillBrightness': 'ADBE Text Fill Brightness',
                'strokeColor': 'ADBE Text Stroke Color',
                'strokeHue': 'ADBE Text Stroke Hue',
                'strokeSaturation': 'ADBE Text Stroke Saturation',
                'strokeBrightness': 'ADBE Text Stroke Brightness',
                'strokeWidth': 'ADBE Text Stroke Width',
                'blur': 'ADBE Text Blur'
            };
            
            for (var propName in params.properties) {
                if (params.properties.hasOwnProperty(propName) && propMap[propName]) {
                    var addedProp = animatorProps.addProperty(propMap[propName]);
                    if (addedProp && params.properties[propName] !== undefined) {
                        addedProp.setValue(params.properties[propName]);
                    }
                }
            }
        }
        
        return Utils.success({
            layer: layer.name,
            layerIndex: layer.index,
            animator: animator.name,
            animatorIndex: animator.propertyIndex
        });
    }
    
    /**
     * Add a range selector to a text animator
     * @param {Object} params - Selector parameters
     * @param {number} params.layerIndex - Layer index
     * @param {number} [params.animatorIndex] - Animator index (1-based)
     * @param {string} [params.animatorName] - Animator name
     * @param {number} [params.start] - Start percentage (0-100)
     * @param {number} [params.end] - End percentage (0-100)
     * @param {number} [params.offset] - Offset percentage
     * @param {string} [params.shape] - Shape: Square, Ramp Up, Ramp Down, Triangle, Round, Smooth
     * @param {string} [params.mode] - Mode: Add, Subtract, Intersect, Min, Max, Difference
     * @param {number} [params.amount] - Amount percentage
     * @param {number} [params.easeHigh] - Ease High percentage
     * @param {number} [params.easeLow] - Ease Low percentage
     * @returns {Object} Result with selector info
     */
    function addRangeSelector(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        if (!(layer instanceof TextLayer)) {
            return Utils.error('Layer is not a text layer');
        }
        
        var textProps = layer.property('ADBE Text Properties');
        var animators = textProps.property('ADBE Text Animators');
        
        var animator;
        if (params.animatorIndex) {
            animator = animators.property(params.animatorIndex);
        } else if (params.animatorName) {
            animator = animators.property(params.animatorName);
        } else {
            if (animators.numProperties < 1) {
                return Utils.error('No animators found on layer');
            }
            animator = animators.property(animators.numProperties);
        }
        
        if (!animator) {
            return Utils.error('Animator not found');
        }
        
        var selectors = animator.property('ADBE Text Selectors');
        var selector = selectors.addProperty('ADBE Text Selector');
        
        if (params.start !== undefined) {
            selector.property('ADBE Text Percent Start').setValue(params.start);
        }
        if (params.end !== undefined) {
            selector.property('ADBE Text Percent End').setValue(params.end);
        }
        if (params.offset !== undefined) {
            selector.property('ADBE Text Percent Offset').setValue(params.offset);
        }
        if (params.amount !== undefined) {
            selector.property('ADBE Text Selector Max Amount').setValue(params.amount);
        }
        if (params.easeHigh !== undefined) {
            selector.property('ADBE Text Range Advanced').property('ADBE Text Selector Ease High').setValue(params.easeHigh);
        }
        if (params.easeLow !== undefined) {
            selector.property('ADBE Text Range Advanced').property('ADBE Text Selector Ease Low').setValue(params.easeLow);
        }
        if (params.shape) {
            var shapeMap = {
                'square': 1,
                'ramp up': 2,
                'ramp down': 3,
                'triangle': 4,
                'round': 5,
                'smooth': 6
            };
            var shapeVal = shapeMap[params.shape.toLowerCase()];
            if (shapeVal) {
                selector.property('ADBE Text Range Advanced').property('ADBE Text Selector Shape').setValue(shapeVal);
            }
        }
        if (params.mode) {
            var modeMap = {
                'add': 1,
                'subtract': 2,
                'intersect': 3,
                'min': 4,
                'max': 5,
                'difference': 6
            };
            var modeVal = modeMap[params.mode.toLowerCase()];
            if (modeVal) {
                selector.property('ADBE Text Range Advanced').property('ADBE Text Selector Mode').setValue(modeVal);
            }
        }
        
        return Utils.success({
            layer: layer.name,
            animator: animator.name,
            selector: selector.name,
            selectorIndex: selector.propertyIndex
        });
    }
    
    /**
     * Add a wiggly selector to a text animator
     * @param {Object} params - Wiggly selector parameters
     * @param {number} params.layerIndex - Layer index
     * @param {number} [params.animatorIndex] - Animator index (1-based)
     * @param {string} [params.animatorName] - Animator name
     * @param {string} [params.mode] - Mode: Add, Subtract, Intersect, Min, Max, Difference
     * @param {number} [params.maxAmount] - Maximum amount percentage
     * @param {number} [params.minAmount] - Minimum amount percentage
     * @param {number} [params.wigglesPerSecond] - Wiggles per second
     * @param {number} [params.correlation] - Correlation percentage
     * @param {number} [params.temporalPhase] - Temporal phase
     * @param {number} [params.spatialPhase] - Spatial phase
     * @param {boolean} [params.lockDimensions] - Lock dimensions
     * @returns {Object} Result with selector info
     */
    function addWigglySelector(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        if (!(layer instanceof TextLayer)) {
            return Utils.error('Layer is not a text layer');
        }
        
        var textProps = layer.property('ADBE Text Properties');
        var animators = textProps.property('ADBE Text Animators');
        
        var animator;
        if (params.animatorIndex) {
            animator = animators.property(params.animatorIndex);
        } else if (params.animatorName) {
            animator = animators.property(params.animatorName);
        } else {
            if (animators.numProperties < 1) {
                return Utils.error('No animators found on layer');
            }
            animator = animators.property(animators.numProperties);
        }
        
        if (!animator) {
            return Utils.error('Animator not found');
        }
        
        var selectors = animator.property('ADBE Text Selectors');
        var selector = selectors.addProperty('ADBE Text Wiggly Selector');
        
        if (params.mode) {
            var modeMap = {
                'add': 1,
                'subtract': 2,
                'intersect': 3,
                'min': 4,
                'max': 5,
                'difference': 6
            };
            var modeVal = modeMap[params.mode.toLowerCase()];
            if (modeVal) {
                selector.property('ADBE Text Wiggly Selector Mode').setValue(modeVal);
            }
        }
        if (params.maxAmount !== undefined) {
            selector.property('ADBE Text Wiggly Max Amount').setValue(params.maxAmount);
        }
        if (params.minAmount !== undefined) {
            selector.property('ADBE Text Wiggly Min Amount').setValue(params.minAmount);
        }
        if (params.wigglesPerSecond !== undefined) {
            selector.property('ADBE Text Wiggles/Second').setValue(params.wigglesPerSecond);
        }
        if (params.correlation !== undefined) {
            selector.property('ADBE Text Correlation').setValue(params.correlation);
        }
        if (params.temporalPhase !== undefined) {
            selector.property('ADBE Text Temporal Phase').setValue(params.temporalPhase);
        }
        if (params.spatialPhase !== undefined) {
            selector.property('ADBE Text Spatial Phase').setValue(params.spatialPhase);
        }
        if (params.lockDimensions !== undefined) {
            selector.property('ADBE Text Wiggly Lock Dim').setValue(params.lockDimensions ? 1 : 0);
        }
        
        return Utils.success({
            layer: layer.name,
            animator: animator.name,
            selector: selector.name,
            selectorIndex: selector.propertyIndex
        });
    }
    
    /**
     * Enable or disable per-character 3D on a text layer
     * @param {Object} params - Parameters
     * @param {number} [params.layerIndex] - Layer index
     * @param {string} [params.layerName] - Layer name
     * @param {boolean} [params.enable] - Enable per-character 3D (default: true)
     * @returns {Object} Result with layer info
     */
    function setPerCharacter3D(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        if (!(layer instanceof TextLayer)) {
            return Utils.error('Layer is not a text layer');
        }
        
        var enable = params.enable !== undefined ? params.enable : true;
        
        var textProps = layer.property('ADBE Text Properties');
        var moreOptions = textProps.property('ADBE Text More Options');
        
        if (moreOptions) {
            var anchorAlign = moreOptions.property('ADBE Text Anchor Point Align');
            if (anchorAlign && enable) {
                anchorAlign.setValue([0, 0]);
            }
        }
        
        if (layer.threeDPerChar !== undefined) {
            layer.threeDPerChar = enable;
        }
        
        layer.threeDLayer = true;
        
        return Utils.success({
            layer: layer.name,
            layerIndex: layer.index,
            perChar3D: enable
        });
    }
    
    /**
     * Set tracking (letter spacing) on a text layer
     * @param {Object} params - Parameters
     * @param {number} [params.layerIndex] - Layer index
     * @param {string} [params.layerName] - Layer name
     * @param {number} params.tracking - Tracking value
     * @returns {Object} Result with tracking info
     */
    function setTextTracking(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        if (!(layer instanceof TextLayer)) {
            return Utils.error('Layer is not a text layer');
        }
        
        if (params.tracking === undefined) {
            return Utils.error('Tracking value is required');
        }
        
        var textProp = layer.property('ADBE Text Properties').property('ADBE Text Document');
        var textDoc = textProp.value;
        
        textDoc.tracking = params.tracking;
        textProp.setValue(textDoc);
        
        return Utils.success({
            layer: layer.name,
            layerIndex: layer.index,
            tracking: params.tracking
        });
    }
    
    return {
        addTextLayer: addTextLayer,
        updateText: updateText,
        addTextAnimator: addTextAnimator,
        addRangeSelector: addRangeSelector,
        addWigglySelector: addWigglySelector,
        setPerCharacter3D: setPerCharacter3D,
        setTextTracking: setTextTracking
    };
})();

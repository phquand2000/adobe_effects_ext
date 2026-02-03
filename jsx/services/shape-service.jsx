// ============================================
// SERVICE: Shape Service
// High-level shape layer operations
// ============================================

var ShapeService = (function() {
    
    /**
     * Get shape group contents from a shape layer
     * @param {ShapeLayer} layer - The shape layer
     * @param {number} groupIndex - Group index (1-based)
     * @returns {Object} { contents: PropertyGroup } or { error: string }
     */
    function getShapeGroupContents(layer, groupIndex) {
        if (!(layer instanceof ShapeLayer)) {
            return { error: 'Layer is not a shape layer' };
        }
        
        var contents = layer.property('ADBE Root Vectors Group');
        if (!contents) {
            return { error: 'Cannot access shape layer contents' };
        }
        
        var group = contents.property(groupIndex);
        if (!group) {
            return { error: 'Shape group not found at index ' + groupIndex };
        }
        
        var groupContents = group.property('ADBE Vectors Group');
        if (!groupContents) {
            return { error: 'Cannot access group contents' };
        }
        
        return { contents: groupContents };
    }
    
    /**
     * Add a shape layer to the composition
     * @param {Object} params - Shape layer parameters
     * @param {string} [params.name] - Layer name
     * @param {string} [params.groupName] - Shape group name
     * @param {string} [params.shapeType] - rectangle, ellipse, polygon, star
     * @param {Array} [params.size] - [width, height]
     * @param {number} [params.roundness] - Rectangle corner roundness
     * @param {number} [params.points] - Number of points (polygon/star)
     * @param {number} [params.radius] - Polygon outer radius
     * @param {number} [params.outerRadius] - Star outer radius
     * @param {number} [params.innerRadius] - Star inner radius
     * @param {boolean} [params.fill] - Add fill (default: true)
     * @param {Array} [params.fillColor] - Fill color [r, g, b]
     * @param {number} [params.fillOpacity] - Fill opacity (0-100)
     * @param {boolean} [params.stroke] - Add stroke
     * @param {Array} [params.strokeColor] - Stroke color [r, g, b]
     * @param {number} [params.strokeWidth] - Stroke width
     * @param {Array} [params.position] - Layer position [x, y] or [x, y, z]
     * @returns {Object} Result
     */
    function addShapeLayer(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var shapeLayer = comp.layers.addShape();
        shapeLayer.name = params.name || 'Shape Layer';
        
        var contents = shapeLayer.property('ADBE Root Vectors Group');
        
        var group = contents.addProperty('ADBE Vector Group');
        group.name = params.groupName || 'Group 1';
        
        var groupContents = group.property('ADBE Vectors Group');
        
        var shapeType = params.shapeType || 'rectangle';
        var shapePath;
        
        switch (shapeType) {
            case 'rectangle':
                shapePath = groupContents.addProperty('ADBE Vector Shape - Rect');
                if (params.size) {
                    shapePath.property('ADBE Vector Rect Size').setValue(params.size);
                }
                if (params.roundness !== undefined) {
                    shapePath.property('ADBE Vector Rect Roundness').setValue(params.roundness);
                }
                break;
                
            case 'ellipse':
                shapePath = groupContents.addProperty('ADBE Vector Shape - Ellipse');
                if (params.size) {
                    shapePath.property('ADBE Vector Ellipse Size').setValue(params.size);
                }
                break;
                
            case 'polygon':
                shapePath = groupContents.addProperty('ADBE Vector Shape - Star');
                shapePath.property('ADBE Vector Star Type').setValue(1); // Polygon
                if (params.points !== undefined) {
                    shapePath.property('ADBE Vector Star Points').setValue(params.points);
                }
                if (params.radius !== undefined) {
                    shapePath.property('ADBE Vector Star Outer Radius').setValue(params.radius);
                }
                break;
                
            case 'star':
                shapePath = groupContents.addProperty('ADBE Vector Shape - Star');
                shapePath.property('ADBE Vector Star Type').setValue(2); // Star
                if (params.points !== undefined) {
                    shapePath.property('ADBE Vector Star Points').setValue(params.points);
                }
                if (params.outerRadius !== undefined) {
                    shapePath.property('ADBE Vector Star Outer Radius').setValue(params.outerRadius);
                }
                if (params.innerRadius !== undefined) {
                    shapePath.property('ADBE Vector Star Inner Radius').setValue(params.innerRadius);
                }
                break;
        }
        
        if (params.fill !== false) {
            var fill = groupContents.addProperty('ADBE Vector Graphic - Fill');
            if (params.fillColor) {
                fill.property('ADBE Vector Fill Color').setValue(params.fillColor);
            }
            if (params.fillOpacity !== undefined) {
                fill.property('ADBE Vector Fill Opacity').setValue(params.fillOpacity);
            }
        }
        
        if (params.stroke) {
            var stroke = groupContents.addProperty('ADBE Vector Graphic - Stroke');
            if (params.strokeColor) {
                stroke.property('ADBE Vector Stroke Color').setValue(params.strokeColor);
            }
            if (params.strokeWidth !== undefined) {
                stroke.property('ADBE Vector Stroke Width').setValue(params.strokeWidth);
            }
        }
        
        if (params.position) {
            var transform = shapeLayer.property('ADBE Transform Group');
            Utils.setProp(transform, 'ADBE Position', params.position);
        }
        
        return Utils.success({
            layer: shapeLayer.name,
            layerIndex: shapeLayer.index,
            shapeType: shapeType
        });
    }
    
    /**
     * Add trim paths to a shape group
     * @param {Object} params - Trim paths parameters
     * @param {number} [params.layerIndex] - Target layer index
     * @param {string} [params.layerName] - Target layer name
     * @param {number} [params.groupIndex] - Shape group index (default: 1)
     * @param {number} [params.start] - Trim start percentage (0-100)
     * @param {number} [params.end] - Trim end percentage (0-100)
     * @param {number} [params.offset] - Trim offset in degrees
     * @param {number} [params.trimMultipleShapes] - 1 = Simultaneously, 2 = Individually
     * @returns {Object} Result
     */
    function addTrimPaths(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        var groupIndex = params.groupIndex || 1;
        var groupResult = getShapeGroupContents(layer, groupIndex);
        if (groupResult.error) return groupResult;
        var groupContents = groupResult.contents;
        
        var trimPaths = groupContents.addProperty('ADBE Vector Filter - Trim');
        
        if (params.start !== undefined) {
            trimPaths.property('ADBE Vector Trim Start').setValue(params.start);
        }
        if (params.end !== undefined) {
            trimPaths.property('ADBE Vector Trim End').setValue(params.end);
        }
        if (params.offset !== undefined) {
            trimPaths.property('ADBE Vector Trim Offset').setValue(params.offset);
        }
        if (params.trimMultipleShapes !== undefined) {
            trimPaths.property('ADBE Vector Trim Type').setValue(params.trimMultipleShapes);
        }
        
        return Utils.success({
            layer: layer.name,
            effect: 'Trim Paths',
            start: params.start !== undefined ? params.start : 0,
            end: params.end !== undefined ? params.end : 100
        });
    }
    
    /**
     * Add repeater to a shape group
     * @param {Object} params - Repeater parameters
     * @param {number} [params.layerIndex] - Target layer index
     * @param {string} [params.layerName] - Target layer name
     * @param {number} [params.groupIndex] - Shape group index (default: 1)
     * @param {number} [params.copies] - Number of copies
     * @param {number} [params.offset] - Offset value
     * @param {Object} [params.transform] - Transform settings
     * @param {Array} [params.transform.anchorPoint] - Anchor point [x, y]
     * @param {Array} [params.transform.position] - Position offset [x, y]
     * @param {Array} [params.transform.scale] - Scale [x, y]
     * @param {number} [params.transform.rotation] - Rotation in degrees
     * @param {number} [params.startOpacity] - Start opacity (0-100)
     * @param {number} [params.endOpacity] - End opacity (0-100)
     * @returns {Object} Result
     */
    function addRepeater(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        var groupIndex = params.groupIndex || 1;
        var groupResult = getShapeGroupContents(layer, groupIndex);
        if (groupResult.error) return groupResult;
        var groupContents = groupResult.contents;
        
        var repeater = groupContents.addProperty('ADBE Vector Filter - Repeater');
        
        if (params.copies !== undefined) {
            repeater.property('ADBE Vector Repeater Copies').setValue(params.copies);
        }
        if (params.offset !== undefined) {
            repeater.property('ADBE Vector Repeater Offset').setValue(params.offset);
        }
        
        var transform = repeater.property('ADBE Vector Repeater Transform');
        if (transform) {
            var xform = params.transform || {};
            
            if (xform.anchorPoint) {
                transform.property('ADBE Vector Repeater Anchor Point').setValue(xform.anchorPoint);
            }
            if (xform.position) {
                transform.property('ADBE Vector Repeater Position').setValue(xform.position);
            }
            if (xform.scale) {
                transform.property('ADBE Vector Repeater Scale').setValue(xform.scale);
            }
            if (xform.rotation !== undefined) {
                transform.property('ADBE Vector Repeater Rotation').setValue(xform.rotation);
            }
            if (params.startOpacity !== undefined) {
                transform.property('ADBE Vector Repeater Start Opacity').setValue(params.startOpacity);
            }
            if (params.endOpacity !== undefined) {
                transform.property('ADBE Vector Repeater End Opacity').setValue(params.endOpacity);
            }
        }
        
        return Utils.success({
            layer: layer.name,
            effect: 'Repeater',
            copies: params.copies !== undefined ? params.copies : 3
        });
    }
    
    /**
     * Add gradient fill to a shape group
     * @param {Object} params - Gradient fill parameters
     * @param {number} [params.layerIndex] - Target layer index
     * @param {string} [params.layerName] - Target layer name
     * @param {number} [params.groupIndex] - Shape group index (default: 1)
     * @param {string} [params.type] - 'linear' or 'radial'
     * @param {Array} [params.startPoint] - Gradient start [x, y]
     * @param {Array} [params.endPoint] - Gradient end [x, y]
     * @param {number} [params.opacity] - Fill opacity (0-100)
     * @returns {Object} Result
     */
    function addGradientFill(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        var groupIndex = params.groupIndex || 1;
        var groupResult = getShapeGroupContents(layer, groupIndex);
        if (groupResult.error) return groupResult;
        var groupContents = groupResult.contents;
        
        var gradientFill = groupContents.addProperty('ADBE Vector Graphic - G-Fill');
        
        var gradType = params.type === 'radial' ? 2 : 1;
        gradientFill.property('ADBE Vector Grad Type').setValue(gradType);
        
        if (params.startPoint) {
            gradientFill.property('ADBE Vector Grad Start Pt').setValue(params.startPoint);
        }
        if (params.endPoint) {
            gradientFill.property('ADBE Vector Grad End Pt').setValue(params.endPoint);
        }
        if (params.opacity !== undefined) {
            gradientFill.property('ADBE Vector Fill Opacity').setValue(params.opacity);
        }
        
        return Utils.success({
            layer: layer.name,
            effect: 'Gradient Fill',
            gradientType: params.type || 'linear'
        });
    }
    
    /**
     * Add gradient stroke to a shape group
     * @param {Object} params - Gradient stroke parameters
     * @param {number} [params.layerIndex] - Target layer index
     * @param {string} [params.layerName] - Target layer name
     * @param {number} [params.groupIndex] - Shape group index (default: 1)
     * @param {string} [params.type] - 'linear' or 'radial'
     * @param {Array} [params.startPoint] - Gradient start [x, y]
     * @param {Array} [params.endPoint] - Gradient end [x, y]
     * @param {number} [params.strokeWidth] - Stroke width
     * @param {number} [params.opacity] - Stroke opacity (0-100)
     * @param {number} [params.lineCap] - 1 = Butt, 2 = Round, 3 = Projecting
     * @param {number} [params.lineJoin] - 1 = Miter, 2 = Round, 3 = Bevel
     * @returns {Object} Result
     */
    function addGradientStroke(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        var groupIndex = params.groupIndex || 1;
        var groupResult = getShapeGroupContents(layer, groupIndex);
        if (groupResult.error) return groupResult;
        var groupContents = groupResult.contents;
        
        var gradientStroke = groupContents.addProperty('ADBE Vector Graphic - G-Stroke');
        
        var gradType = params.type === 'radial' ? 2 : 1;
        gradientStroke.property('ADBE Vector Grad Type').setValue(gradType);
        
        if (params.startPoint) {
            gradientStroke.property('ADBE Vector Grad Start Pt').setValue(params.startPoint);
        }
        if (params.endPoint) {
            gradientStroke.property('ADBE Vector Grad End Pt').setValue(params.endPoint);
        }
        if (params.strokeWidth !== undefined) {
            gradientStroke.property('ADBE Vector Stroke Width').setValue(params.strokeWidth);
        }
        if (params.opacity !== undefined) {
            gradientStroke.property('ADBE Vector Stroke Opacity').setValue(params.opacity);
        }
        if (params.lineCap !== undefined) {
            gradientStroke.property('ADBE Vector Stroke Line Cap').setValue(params.lineCap);
        }
        if (params.lineJoin !== undefined) {
            gradientStroke.property('ADBE Vector Stroke Line Join').setValue(params.lineJoin);
        }
        
        return Utils.success({
            layer: layer.name,
            effect: 'Gradient Stroke',
            gradientType: params.type || 'linear'
        });
    }
    
    /**
     * Add Merge Paths to a shape group
     * @param {Object} params - Merge Paths parameters
     * @param {number} [params.layerIndex] - Target layer index
     * @param {string} [params.layerName] - Target layer name
     * @param {number} [params.groupIndex] - Shape group index (default: 1)
     * @param {string} [params.mode] - 'merge'|'add'|'subtract'|'intersect'|'excludeIntersections'
     * @returns {Object} Result
     */
    function addMergePaths(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        var groupIndex = params.groupIndex || 1;
        var groupResult = getShapeGroupContents(layer, groupIndex);
        if (groupResult.error) return groupResult;
        var groupContents = groupResult.contents;
        
        var mergePaths = groupContents.addProperty('ADBE Vector Filter - Merge');
        
        if (params.mode !== undefined) {
            var modeMap = {
                'merge': 1,
                'add': 2,
                'subtract': 3,
                'intersect': 4,
                'excludeIntersections': 5
            };
            var modeValue = modeMap[params.mode] || 1;
            mergePaths.property('ADBE Vector Merge Type').setValue(modeValue);
        }
        
        return Utils.success({
            layer: layer.name,
            effect: 'Merge Paths'
        });
    }
    
    /**
     * Add Offset Paths to a shape group
     * @param {Object} params - Offset Paths parameters
     * @param {number} [params.layerIndex] - Target layer index
     * @param {string} [params.layerName] - Target layer name
     * @param {number} [params.groupIndex] - Shape group index (default: 1)
     * @param {number} [params.amount] - Offset amount
     * @param {string} [params.lineJoin] - 'miter'|'round'|'bevel'
     * @param {number} [params.miterLimit] - Miter limit
     * @param {number} [params.copies] - Number of copies
     * @param {number} [params.copyOffset] - Copy offset
     * @returns {Object} Result
     */
    function addOffsetPaths(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        var groupIndex = params.groupIndex || 1;
        var groupResult = getShapeGroupContents(layer, groupIndex);
        if (groupResult.error) return groupResult;
        var groupContents = groupResult.contents;
        
        var offsetPaths = groupContents.addProperty('ADBE Vector Filter - Offset');
        
        if (params.amount !== undefined) {
            offsetPaths.property('ADBE Vector Offset Amount').setValue(params.amount);
        }
        if (params.lineJoin !== undefined) {
            var joinMap = {
                'miter': 1,
                'round': 2,
                'bevel': 3
            };
            var joinValue = joinMap[params.lineJoin] || 1;
            offsetPaths.property('ADBE Vector Offset Line Join').setValue(joinValue);
        }
        if (params.miterLimit !== undefined) {
            offsetPaths.property('ADBE Vector Offset Miter Limit').setValue(params.miterLimit);
        }
        if (params.copies !== undefined) {
            offsetPaths.property('ADBE Vector Offset Copies').setValue(params.copies);
        }
        if (params.copyOffset !== undefined) {
            offsetPaths.property('ADBE Vector Offset Copy Offset').setValue(params.copyOffset);
        }
        
        return Utils.success({
            layer: layer.name,
            effect: 'Offset Paths'
        });
    }
    
    /**
     * Add Round Corners to a shape group
     * @param {Object} params - Round Corners parameters
     * @param {number} [params.layerIndex] - Target layer index
     * @param {string} [params.layerName] - Target layer name
     * @param {number} [params.groupIndex] - Shape group index (default: 1)
     * @param {number} [params.radius] - Corner radius
     * @returns {Object} Result
     */
    function addRoundCorners(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        var groupIndex = params.groupIndex || 1;
        var groupResult = getShapeGroupContents(layer, groupIndex);
        if (groupResult.error) return groupResult;
        var groupContents = groupResult.contents;
        
        var roundCorners = groupContents.addProperty('ADBE Vector Filter - RC');
        
        if (params.radius !== undefined) {
            roundCorners.property('ADBE Vector RoundCorner Radius').setValue(params.radius);
        }
        
        return Utils.success({
            layer: layer.name,
            effect: 'Round Corners'
        });
    }
    
    /**
     * Add Zig Zag to a shape group
     * @param {Object} params - Zig Zag parameters
     * @param {number} [params.layerIndex] - Target layer index
     * @param {string} [params.layerName] - Target layer name
     * @param {number} [params.groupIndex] - Shape group index (default: 1)
     * @param {number} [params.size] - Size of zigzag
     * @param {number} [params.ridgesPerSegment] - Number of ridges per segment
     * @param {string} [params.points] - 'corner'|'smooth'
     * @returns {Object} Result
     */
    function addZigZag(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        var groupIndex = params.groupIndex || 1;
        var groupResult = getShapeGroupContents(layer, groupIndex);
        if (groupResult.error) return groupResult;
        var groupContents = groupResult.contents;
        
        var zigzag = groupContents.addProperty('ADBE Vector Filter - Zigzag');
        
        if (params.size !== undefined) {
            zigzag.property('ADBE Vector Zigzag Size').setValue(params.size);
        }
        if (params.ridgesPerSegment !== undefined) {
            zigzag.property('ADBE Vector Zigzag Detail').setValue(params.ridgesPerSegment);
        }
        if (params.points !== undefined) {
            var pointsValue = params.points === 'smooth' ? 2 : 1;
            zigzag.property('ADBE Vector Zigzag Points').setValue(pointsValue);
        }
        
        return Utils.success({
            layer: layer.name,
            effect: 'Zig Zag'
        });
    }
    
    /**
     * Add Pucker & Bloat to a shape group
     * @param {Object} params - Pucker & Bloat parameters
     * @param {number} [params.layerIndex] - Target layer index
     * @param {string} [params.layerName] - Target layer name
     * @param {number} [params.groupIndex] - Shape group index (default: 1)
     * @param {number} [params.amount] - Amount (negative = pucker, positive = bloat)
     * @returns {Object} Result
     */
    function addPuckerBloat(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        var groupIndex = params.groupIndex || 1;
        var groupResult = getShapeGroupContents(layer, groupIndex);
        if (groupResult.error) return groupResult;
        var groupContents = groupResult.contents;
        
        var puckerBloat = groupContents.addProperty('ADBE Vector Filter - PB');
        
        if (params.amount !== undefined) {
            puckerBloat.property('ADBE Vector PuckerBloat Amount').setValue(params.amount);
        }
        
        return Utils.success({
            layer: layer.name,
            effect: 'Pucker & Bloat'
        });
    }
    
    /**
     * Add Twist to a shape group
     * @param {Object} params - Twist parameters
     * @param {number} [params.layerIndex] - Target layer index
     * @param {string} [params.layerName] - Target layer name
     * @param {number} [params.groupIndex] - Shape group index (default: 1)
     * @param {number} [params.angle] - Twist angle in degrees
     * @param {Array} [params.center] - Twist center [x, y]
     * @returns {Object} Result
     */
    function addTwist(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        var groupIndex = params.groupIndex || 1;
        var groupResult = getShapeGroupContents(layer, groupIndex);
        if (groupResult.error) return groupResult;
        var groupContents = groupResult.contents;
        
        var twist = groupContents.addProperty('ADBE Vector Filter - Twist');
        
        if (params.angle !== undefined) {
            twist.property('ADBE Vector Twist Angle').setValue(params.angle);
        }
        if (params.center !== undefined) {
            twist.property('ADBE Vector Twist Center').setValue(params.center);
        }
        
        return Utils.success({
            layer: layer.name,
            effect: 'Twist'
        });
    }
    
    /**
     * Add Wiggle Paths to a shape group
     * @param {Object} params - Wiggle Paths parameters
     * @param {number} [params.layerIndex] - Target layer index
     * @param {string} [params.layerName] - Target layer name
     * @param {number} [params.groupIndex] - Shape group index (default: 1)
     * @param {number} [params.size] - Wiggle size
     * @param {number} [params.detail] - Detail level
     * @param {string} [params.points] - 'corner'|'smooth'
     * @param {number} [params.wigglesPerSecond] - Wiggles per second
     * @param {number} [params.correlation] - Correlation percentage
     * @param {number} [params.temporalPhase] - Temporal phase
     * @param {number} [params.spatialPhase] - Spatial phase
     * @returns {Object} Result
     */
    function addWigglePath(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        var groupIndex = params.groupIndex || 1;
        var groupResult = getShapeGroupContents(layer, groupIndex);
        if (groupResult.error) return groupResult;
        var groupContents = groupResult.contents;
        
        var wiggle = groupContents.addProperty('ADBE Vector Filter - Wiggler');
        
        if (params.size !== undefined) {
            wiggle.property('ADBE Vector Wiggler Size').setValue(params.size);
        }
        if (params.detail !== undefined) {
            wiggle.property('ADBE Vector Wiggler Detail').setValue(params.detail);
        }
        if (params.points !== undefined) {
            var pointsValue = params.points === 'smooth' ? 2 : 1;
            wiggle.property('ADBE Vector Wiggler Points').setValue(pointsValue);
        }
        if (params.wigglesPerSecond !== undefined) {
            wiggle.property('ADBE Vector Wiggler Freq').setValue(params.wigglesPerSecond);
        }
        if (params.correlation !== undefined) {
            wiggle.property('ADBE Vector Wiggler Correlation').setValue(params.correlation);
        }
        if (params.temporalPhase !== undefined) {
            wiggle.property('ADBE Vector Wiggler Temporal Phase').setValue(params.temporalPhase);
        }
        if (params.spatialPhase !== undefined) {
            wiggle.property('ADBE Vector Wiggler Spatial Phase').setValue(params.spatialPhase);
        }
        
        return Utils.success({
            layer: layer.name,
            effect: 'Wiggle Paths'
        });
    }
    
    return {
        addShapeLayer: addShapeLayer,
        addTrimPaths: addTrimPaths,
        addRepeater: addRepeater,
        addGradientFill: addGradientFill,
        addGradientStroke: addGradientStroke,
        addMergePaths: addMergePaths,
        addOffsetPaths: addOffsetPaths,
        addRoundCorners: addRoundCorners,
        addZigZag: addZigZag,
        addPuckerBloat: addPuckerBloat,
        addTwist: addTwist,
        addWigglePath: addWigglePath
    };
})();

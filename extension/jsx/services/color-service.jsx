// ============================================
// SERVICE LAYER: Color Service
// Handles color management and color effects
// ============================================

var ColorService = (function() {
    
    /**
     * Set project color depth (bits per channel)
     * @param {Object} params - { depth: 8|16|32 }
     * @returns {Object} Result
     */
    function setProjectColorDepth(params) {
        if (!params || !params.depth) {
            return Utils.error('Missing required param: depth');
        }
        
        var depth = params.depth;
        if (depth !== 8 && depth !== 16 && depth !== 32) {
            return Utils.error('Invalid depth. Must be 8, 16, or 32');
        }
        
        try {
            app.project.bitsPerChannel = depth;
            return Utils.success({
                bitsPerChannel: app.project.bitsPerChannel
            });
        } catch (e) {
            return Utils.error('Failed to set color depth: ' + e.toString());
        }
    }
    
    /**
     * Set project working color space (AE CC 2019+)
     * @param {Object} params - { workingSpace: string }
     * @returns {Object} Result
     */
    function setProjectWorkingSpace(params) {
        if (!params || !params.workingSpace) {
            return Utils.error('Missing required param: workingSpace');
        }
        
        try {
            if (app.project.workingSpace === undefined) {
                return Utils.error('Working space not supported in this version of After Effects');
            }
            
            app.project.workingSpace = params.workingSpace;
            return Utils.success({
                workingSpace: app.project.workingSpace
            });
        } catch (e) {
            return Utils.error('Failed to set working space: ' + e.toString());
        }
    }
    
    /**
     * Apply LUT effect to a layer
     * @param {Object} params - { layerIndex, lutPath, intensity }
     * @returns {Object} Result
     */
    function applyLUT(params) {
        if (!params || !params.lutPath) {
            return Utils.error('Missing required param: lutPath');
        }
        
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        if (!LayerData.supportsEffects(layer)) {
            return Utils.error('Layer does not support effects');
        }
        
        try {
            var lutFile = new File(params.lutPath);
            if (!lutFile.exists) {
                return Utils.error('LUT file not found: ' + params.lutPath);
            }
            
            var effects = layer.property('ADBE Effect Parade');
            var lutEffect = effects.addProperty('ADBE ApplyLUT');
            
            if (lutEffect) {
                var lutFileProp = lutEffect.property('ADBE ApplyLUT-0001');
                if (lutFileProp) {
                    lutFileProp.setValue(params.lutPath);
                }
                
                if (params.intensity !== undefined) {
                    var intensityProp = lutEffect.property('ADBE ApplyLUT-0002');
                    if (intensityProp) {
                        intensityProp.setValue(Utils.clamp(params.intensity, 0, 100));
                    }
                }
            }
            
            return Utils.success({
                layer: layer.name,
                lutPath: params.lutPath
            });
        } catch (e) {
            return Utils.error('Failed to apply LUT: ' + e.toString());
        }
    }
    
    /**
     * Apply color profile converter effect
     * @param {Object} params - { layerIndex, inputProfile, outputProfile, intent }
     * @returns {Object} Result
     */
    function applyColorProfileConverter(params) {
        if (!params || !params.inputProfile || !params.outputProfile) {
            return Utils.error('Missing required params: inputProfile and outputProfile');
        }
        
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        if (!LayerData.supportsEffects(layer)) {
            return Utils.error('Layer does not support effects');
        }
        
        try {
            var effects = layer.property('ADBE Effect Parade');
            var profileEffect = effects.addProperty('ADBE Color Profile Converter');
            
            if (!profileEffect) {
                return Utils.error('Color Profile Converter effect not available');
            }
            
            var inputProp = profileEffect.property('ADBE Color Profile Converter-0001');
            if (inputProp) {
                inputProp.setValue(params.inputProfile);
            }
            
            var outputProp = profileEffect.property('ADBE Color Profile Converter-0002');
            if (outputProp) {
                outputProp.setValue(params.outputProfile);
            }
            
            if (params.intent !== undefined) {
                var intentProp = profileEffect.property('ADBE Color Profile Converter-0003');
                if (intentProp) {
                    intentProp.setValue(params.intent);
                }
            }
            
            return Utils.success({
                layer: layer.name,
                inputProfile: params.inputProfile,
                outputProfile: params.outputProfile
            });
        } catch (e) {
            return Utils.error('Failed to apply color profile converter: ' + e.toString());
        }
    }
    
    /**
     * Set linearize working space (AE CC 2019+)
     * @param {Object} params - { enable: boolean }
     * @returns {Object} Result
     */
    function setLinearizeWorkingSpace(params) {
        if (!params || params.enable === undefined) {
            return Utils.error('Missing required param: enable');
        }
        
        try {
            if (app.project.linearizeWorkingSpace === undefined) {
                return Utils.error('Linearize working space not supported in this version of After Effects');
            }
            
            app.project.linearizeWorkingSpace = params.enable;
            return Utils.success({
                linearized: app.project.linearizeWorkingSpace
            });
        } catch (e) {
            return Utils.error('Failed to set linearize working space: ' + e.toString());
        }
    }
    
    /**
     * Set compensate for scene-referred profiles
     * @param {Object} params - { enable: boolean }
     * @returns {Object} Result
     */
    function setCompensateForSceneReferredProfiles(params) {
        if (!params || params.enable === undefined) {
            return Utils.error('Missing required param: enable');
        }
        
        try {
            if (app.project.compensateForSceneReferredProfiles === undefined) {
                return Utils.error('Compensate for scene-referred profiles not supported in this version of After Effects');
            }
            
            app.project.compensateForSceneReferredProfiles = params.enable;
            return Utils.success({
                compensate: app.project.compensateForSceneReferredProfiles
            });
        } catch (e) {
            return Utils.error('Failed to set compensate for scene-referred profiles: ' + e.toString());
        }
    }
    
    /**
     * Apply Color Balance effect
     * @param {Object} params - { layerIndex, shadowRed, shadowGreen, shadowBlue, midtoneRed, midtoneGreen, midtoneBlue, highlightRed, highlightGreen, highlightBlue, preserveLuminosity }
     * @returns {Object} Result
     */
    function applyColorBalance(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        if (!LayerData.supportsEffects(layer)) {
            return Utils.error('Layer does not support effects');
        }
        
        try {
            var effects = layer.property('ADBE Effect Parade');
            var colorBalanceEffect = effects.addProperty('ADBE Color Balance 2');
            
            if (!colorBalanceEffect) {
                return Utils.error('Color Balance effect not available');
            }
            
            if (params.shadowRed !== undefined) {
                Utils.setProp(colorBalanceEffect, 'ADBE Color Balance 2-0001', params.shadowRed);
            }
            if (params.shadowGreen !== undefined) {
                Utils.setProp(colorBalanceEffect, 'ADBE Color Balance 2-0002', params.shadowGreen);
            }
            if (params.shadowBlue !== undefined) {
                Utils.setProp(colorBalanceEffect, 'ADBE Color Balance 2-0003', params.shadowBlue);
            }
            if (params.midtoneRed !== undefined) {
                Utils.setProp(colorBalanceEffect, 'ADBE Color Balance 2-0004', params.midtoneRed);
            }
            if (params.midtoneGreen !== undefined) {
                Utils.setProp(colorBalanceEffect, 'ADBE Color Balance 2-0005', params.midtoneGreen);
            }
            if (params.midtoneBlue !== undefined) {
                Utils.setProp(colorBalanceEffect, 'ADBE Color Balance 2-0006', params.midtoneBlue);
            }
            if (params.highlightRed !== undefined) {
                Utils.setProp(colorBalanceEffect, 'ADBE Color Balance 2-0007', params.highlightRed);
            }
            if (params.highlightGreen !== undefined) {
                Utils.setProp(colorBalanceEffect, 'ADBE Color Balance 2-0008', params.highlightGreen);
            }
            if (params.highlightBlue !== undefined) {
                Utils.setProp(colorBalanceEffect, 'ADBE Color Balance 2-0009', params.highlightBlue);
            }
            if (params.preserveLuminosity !== undefined) {
                Utils.setProp(colorBalanceEffect, 'ADBE Color Balance 2-0010', params.preserveLuminosity ? 1 : 0);
            }
            
            return Utils.success({
                layer: layer.name,
                effect: colorBalanceEffect.name
            });
        } catch (e) {
            return Utils.error('Failed to apply color balance: ' + e.toString());
        }
    }
    
    /**
     * Apply Photo Filter effect
     * @param {Object} params - { layerIndex, filterType, color, density, preserveLuminosity }
     * @returns {Object} Result
     */
    function applyPhotoFilter(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        if (!LayerData.supportsEffects(layer)) {
            return Utils.error('Layer does not support effects');
        }
        
        try {
            var effects = layer.property('ADBE Effect Parade');
            var photoFilterEffect = effects.addProperty('ADBE Photo Filter');
            
            if (!photoFilterEffect) {
                return Utils.error('Photo Filter effect not available');
            }
            
            if (params.filterType !== undefined) {
                Utils.setProp(photoFilterEffect, 'ADBE Photo Filter-0001', params.filterType);
            }
            if (params.color !== undefined) {
                Utils.setProp(photoFilterEffect, 'ADBE Photo Filter-0002', params.color);
            }
            if (params.density !== undefined) {
                Utils.setProp(photoFilterEffect, 'ADBE Photo Filter-0003', Utils.clamp(params.density, 0, 100));
            }
            if (params.preserveLuminosity !== undefined) {
                Utils.setProp(photoFilterEffect, 'ADBE Photo Filter-0004', params.preserveLuminosity ? 1 : 0);
            }
            
            return Utils.success({
                layer: layer.name,
                filter: photoFilterEffect.name
            });
        } catch (e) {
            return Utils.error('Failed to apply photo filter: ' + e.toString());
        }
    }
    
    return {
        setProjectColorDepth: setProjectColorDepth,
        setProjectWorkingSpace: setProjectWorkingSpace,
        applyLUT: applyLUT,
        applyColorProfileConverter: applyColorProfileConverter,
        setLinearizeWorkingSpace: setLinearizeWorkingSpace,
        setCompensateForSceneReferredProfiles: setCompensateForSceneReferredProfiles,
        applyColorBalance: applyColorBalance,
        applyPhotoFilter: applyPhotoFilter
    };
})();

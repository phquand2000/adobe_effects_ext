// ============================================
// SERVICE: Keying Service
// Keying and chroma key operations
// ============================================

var KeyingService = (function() {
    
    /**
     * Apply Keylight 906 effect to layer
     * @param {Object} params - Keylight parameters
     * @returns {Object} Result
     */
    function applyKeylight(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        if (!layer.Effects) {
            return Utils.error('Layer does not support effects');
        }
        
        var keylight;
        try {
            keylight = layer.Effects.addProperty('Keylight 906');
        } catch (e) {
            return Utils.error('Failed to add Keylight effect: ' + e.toString());
        }
        
        if (params.screenColor) {
            Utils.setProp(keylight, 'Screen Colour', params.screenColor);
        }
        
        if (params.view !== undefined) {
            Utils.setProp(keylight, 'View', params.view);
        }
        
        if (params.screenGain !== undefined) {
            Utils.setProp(keylight, 'Screen Gain', params.screenGain);
        }
        
        if (params.screenBalance !== undefined) {
            Utils.setProp(keylight, 'Screen Balance', params.screenBalance);
        }
        
        if (params.clipBlack !== undefined) {
            Utils.setProp(keylight, 'Clip Black', params.clipBlack);
        }
        
        if (params.clipWhite !== undefined) {
            Utils.setProp(keylight, 'Clip White', params.clipWhite);
        }
        
        if (params.screenShrinkGrow !== undefined) {
            Utils.setProp(keylight, 'Screen Shrink/Grow', params.screenShrinkGrow);
        }
        
        if (params.screenDespotBlack !== undefined) {
            Utils.setProp(keylight, 'Screen Despot Black', params.screenDespotBlack);
        }
        
        if (params.screenDespotWhite !== undefined) {
            Utils.setProp(keylight, 'Screen Despot White', params.screenDespotWhite);
        }
        
        if (params.edgeThin !== undefined) {
            Utils.setProp(keylight, 'Edge Thin', params.edgeThin);
        }
        
        if (params.edgeFeather !== undefined) {
            Utils.setProp(keylight, 'Edge Feather', params.edgeFeather);
        }
        
        return Utils.success({
            layer: layer.name,
            effect: 'Keylight (1.2)',
            screenColor: params.screenColor
        });
    }
    
    /**
     * Apply Spill Suppressor effect to layer
     * @param {Object} params - Spill Suppressor parameters
     * @returns {Object} Result
     */
    function applySpillSuppressor(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        if (!layer.Effects) {
            return Utils.error('Layer does not support effects');
        }
        
        var spill;
        try {
            spill = layer.Effects.addProperty('ADBE Spill2');
        } catch (e) {
            return Utils.error('Failed to add Spill Suppressor effect: ' + e.toString());
        }
        
        if (params.keyColor) {
            Utils.setProp(spill, 'ADBE Spill2-0001', params.keyColor);
        }
        
        if (params.colorAccuracy !== undefined) {
            Utils.setProp(spill, 'ADBE Spill2-0002', params.colorAccuracy);
        }
        
        if (params.suppression !== undefined) {
            Utils.setProp(spill, 'ADBE Spill2-0003', params.suppression);
        }
        
        if (params.range !== undefined) {
            Utils.setProp(spill, 'ADBE Spill2-0004', params.range);
        }
        
        if (params.lumaCorrection !== undefined) {
            Utils.setProp(spill, 'ADBE Spill2-0005', params.lumaCorrection);
        }
        
        return Utils.success({
            layer: layer.name,
            effect: 'Spill Suppressor',
            keyColor: params.keyColor
        });
    }
    
    /**
     * Apply Key Cleaner effect to layer
     * @param {Object} params - Key Cleaner parameters
     * @returns {Object} Result
     */
    function applyKeyCleaner(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        if (!layer.Effects) {
            return Utils.error('Layer does not support effects');
        }
        
        var cleaner;
        try {
            cleaner = layer.Effects.addProperty('ADBE KeyCleaner');
        } catch (e) {
            return Utils.error('Failed to add Key Cleaner effect: ' + e.toString());
        }
        
        if (params.radius !== undefined) {
            Utils.setProp(cleaner, 'ADBE KeyCleaner-0001', params.radius);
        }
        
        if (params.additionalEdgeRadius !== undefined) {
            Utils.setProp(cleaner, 'ADBE KeyCleaner-0002', params.additionalEdgeRadius);
        }
        
        if (params.reduceChatter !== undefined) {
            Utils.setProp(cleaner, 'ADBE KeyCleaner-0003', params.reduceChatter ? 1 : 0);
        }
        
        if (params.performance !== undefined) {
            Utils.setProp(cleaner, 'ADBE KeyCleaner-0004', params.performance);
        }
        
        if (params.alphaContrast !== undefined) {
            Utils.setProp(cleaner, 'ADBE KeyCleaner-0005', params.alphaContrast);
        }
        
        return Utils.success({
            layer: layer.name,
            effect: 'Key Cleaner',
            radius: params.radius
        });
    }
    
    /**
     * Apply keying preset workflow to layer
     * @param {Object} params - Preset parameters
     * @returns {Object} Result
     */
    function applyKeyingPreset(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        if (!layer.Effects) {
            return Utils.error('Layer does not support effects');
        }
        
        var preset = params.preset || 'greenScreen';
        var appliedEffects = [];
        var keylight, spill, cleaner, lumaKey;
        
        switch (preset) {
            case 'greenScreen':
                try {
                    keylight = layer.Effects.addProperty('Keylight 906');
                } catch (e) {
                    return Utils.error('Failed to add Keylight effect: ' + e.toString());
                }
                if (!keylight) {
                    return Utils.error('Failed to add Keylight effect');
                }
                Utils.setProp(keylight, 'Screen Colour', [0, 1, 0]);
                Utils.setProp(keylight, 'Clip Black', 10);
                Utils.setProp(keylight, 'Clip White', 90);
                appliedEffects.push('Keylight (1.2)');
                
                try {
                    spill = layer.Effects.addProperty('ADBE Spill2');
                } catch (e) {
                    return Utils.error('Failed to add Spill Suppressor effect: ' + e.toString());
                }
                if (!spill) {
                    return Utils.error('Failed to add Spill Suppressor effect');
                }
                Utils.setProp(spill, 'ADBE Spill2-0001', [0, 1, 0]);
                appliedEffects.push('Spill Suppressor');
                
                try {
                    cleaner = layer.Effects.addProperty('ADBE KeyCleaner');
                } catch (e) {
                    return Utils.error('Failed to add Key Cleaner effect: ' + e.toString());
                }
                if (!cleaner) {
                    return Utils.error('Failed to add Key Cleaner effect');
                }
                Utils.setProp(cleaner, 'ADBE KeyCleaner-0001', 10);
                appliedEffects.push('Key Cleaner');
                break;
                
            case 'blueScreen':
                try {
                    keylight = layer.Effects.addProperty('Keylight 906');
                } catch (e) {
                    return Utils.error('Failed to add Keylight effect: ' + e.toString());
                }
                if (!keylight) {
                    return Utils.error('Failed to add Keylight effect');
                }
                Utils.setProp(keylight, 'Screen Colour', [0, 0, 1]);
                Utils.setProp(keylight, 'Clip Black', 10);
                Utils.setProp(keylight, 'Clip White', 90);
                appliedEffects.push('Keylight (1.2)');
                
                try {
                    spill = layer.Effects.addProperty('ADBE Spill2');
                } catch (e) {
                    return Utils.error('Failed to add Spill Suppressor effect: ' + e.toString());
                }
                if (!spill) {
                    return Utils.error('Failed to add Spill Suppressor effect');
                }
                Utils.setProp(spill, 'ADBE Spill2-0001', [0, 0, 1]);
                appliedEffects.push('Spill Suppressor');
                
                try {
                    cleaner = layer.Effects.addProperty('ADBE KeyCleaner');
                } catch (e) {
                    return Utils.error('Failed to add Key Cleaner effect: ' + e.toString());
                }
                if (!cleaner) {
                    return Utils.error('Failed to add Key Cleaner effect');
                }
                Utils.setProp(cleaner, 'ADBE KeyCleaner-0001', 10);
                appliedEffects.push('Key Cleaner');
                break;
                
            case 'lumaKey':
                try {
                    lumaKey = layer.Effects.addProperty('ADBE Extract');
                } catch (e) {
                    return Utils.error('Failed to add Extract effect: ' + e.toString());
                }
                if (!lumaKey) {
                    return Utils.error('Failed to add Extract effect');
                }
                if (params.blackPoint !== undefined) {
                    Utils.setProp(lumaKey, 'ADBE Extract-0001', params.blackPoint);
                }
                if (params.whitePoint !== undefined) {
                    Utils.setProp(lumaKey, 'ADBE Extract-0003', params.whitePoint);
                }
                appliedEffects.push('Extract');
                break;
                
            default:
                return Utils.error('Unknown keying preset: ' + preset);
        }
        
        return Utils.success({
            layer: layer.name,
            preset: preset,
            effects: appliedEffects
        });
    }
    
    return {
        applyKeylight: applyKeylight,
        applySpillSuppressor: applySpillSuppressor,
        applyKeyCleaner: applyKeyCleaner,
        applyKeyingPreset: applyKeyingPreset
    };
})();

// ============================================
// AUDIO SERVICE
// Audio manipulation functions for AE layers
// ============================================

var AudioService = (function() {
    
    /**
     * Get audio levels property from layer
     * @param {AVLayer} layer - The layer
     * @returns {Property|null} Audio levels property or null
     */
    function getAudioLevels(layer) {
        try {
            var audio = layer.property('ADBE Audio Group');
            if (!audio) return null;
            return audio.property('ADBE Audio Levels');
        } catch (e) {
            return null;
        }
    }
    
    /**
     * Check if layer has audio
     * @param {Layer} layer - The layer
     * @returns {boolean} True if layer has audio
     */
    function hasAudio(layer) {
        try {
            return layer.hasAudio === true;
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Set audio level for a layer
     * @param {Object} params - { layerIndex, level }
     * @returns {Object} Result
     */
    function setAudioLevel(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        if (!hasAudio(layer)) {
            return Utils.error('Layer does not have audio');
        }
        
        var level = params.level !== undefined ? params.level : 0;
        var audioLevels = getAudioLevels(layer);
        
        if (!audioLevels) {
            return Utils.error('Cannot access audio levels property');
        }
        
        try {
            audioLevels.setValue([level, level]);
            
            return Utils.success({
                layer: layer.name,
                level: level
            });
        } catch (e) {
            return Utils.error('Failed to set audio level: ' + e.toString());
        }
    }
    
    /**
     * Fade audio in at layer start
     * @param {Object} params - { layerIndex, duration, startLevel, endLevel }
     * @returns {Object} Result
     */
    function fadeAudioIn(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        if (!hasAudio(layer)) {
            return Utils.error('Layer does not have audio');
        }
        
        var duration = params.duration !== undefined ? params.duration : 1;
        var startLevel = params.startLevel !== undefined ? params.startLevel : -48;
        var endLevel = params.endLevel !== undefined ? params.endLevel : 0;
        
        var audioLevels = getAudioLevels(layer);
        if (!audioLevels) {
            return Utils.error('Cannot access audio levels property');
        }
        
        try {
            var inPoint = layer.inPoint;
            
            audioLevels.setValueAtTime(inPoint, [startLevel, startLevel]);
            audioLevels.setValueAtTime(inPoint + duration, [endLevel, endLevel]);
            
            return Utils.success({
                layer: layer.name,
                fadeIn: duration
            });
        } catch (e) {
            return Utils.error('Failed to fade audio in: ' + e.toString());
        }
    }
    
    /**
     * Fade audio out at layer end
     * @param {Object} params - { layerIndex, duration, startLevel, endLevel }
     * @returns {Object} Result
     */
    function fadeAudioOut(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        if (!hasAudio(layer)) {
            return Utils.error('Layer does not have audio');
        }
        
        var duration = params.duration !== undefined ? params.duration : 1;
        var startLevel = params.startLevel !== undefined ? params.startLevel : 0;
        var endLevel = params.endLevel !== undefined ? params.endLevel : -48;
        
        var audioLevels = getAudioLevels(layer);
        if (!audioLevels) {
            return Utils.error('Cannot access audio levels property');
        }
        
        try {
            var outPoint = layer.outPoint;
            
            audioLevels.setValueAtTime(outPoint - duration, [startLevel, startLevel]);
            audioLevels.setValueAtTime(outPoint, [endLevel, endLevel]);
            
            return Utils.success({
                layer: layer.name,
                fadeOut: duration
            });
        } catch (e) {
            return Utils.error('Failed to fade audio out: ' + e.toString());
        }
    }
    
    /**
     * Mute or unmute a layer
     * @param {Object} params - { layerIndex, mute }
     * @returns {Object} Result
     */
    function muteLayer(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        if (!hasAudio(layer)) {
            return Utils.error('Layer does not have audio');
        }
        
        var mute = params.mute !== undefined ? params.mute : true;
        
        try {
            layer.audioEnabled = !mute;
            
            return Utils.success({
                layer: layer.name,
                muted: mute
            });
        } catch (e) {
            return Utils.error('Failed to mute layer: ' + e.toString());
        }
    }
    
    /**
     * Solo audio for a layer (mute all others)
     * @param {Object} params - { layerIndex }
     * @returns {Object} Result
     */
    function soloAudio(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var targetLayer = layerResult.layer;
        
        if (!hasAudio(targetLayer)) {
            return Utils.error('Layer does not have audio');
        }
        
        try {
            for (var i = 1; i <= comp.numLayers; i++) {
                var layer = comp.layer(i);
                if (hasAudio(layer)) {
                    if (layer.index === targetLayer.index) {
                        layer.audioEnabled = true;
                    } else {
                        layer.audioEnabled = false;
                    }
                }
            }
            
            return Utils.success({
                layer: targetLayer.name
            });
        } catch (e) {
            return Utils.error('Failed to solo audio: ' + e.toString());
        }
    }
    
    /**
     * Set audio keyframe at specific time
     * @param {Object} params - { layerIndex, time, level }
     * @returns {Object} Result
     */
    function setAudioKeyframe(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        if (!hasAudio(layer)) {
            return Utils.error('Layer does not have audio');
        }
        
        var time = params.time !== undefined ? params.time : comp.time;
        var level = params.level !== undefined ? params.level : 0;
        
        var audioLevels = getAudioLevels(layer);
        if (!audioLevels) {
            return Utils.error('Cannot access audio levels property');
        }
        
        try {
            audioLevels.setValueAtTime(time, [level, level]);
            
            return Utils.success({
                layer: layer.name,
                time: time,
                level: level
            });
        } catch (e) {
            return Utils.error('Failed to set audio keyframe: ' + e.toString());
        }
    }
    
    /**
     * Get audio information for a layer
     * @param {Object} params - { layerIndex }
     * @returns {Object} Result
     */
    function getAudioInfo(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        var layerHasAudio = hasAudio(layer);
        
        if (!layerHasAudio) {
            return Utils.success({
                hasAudio: false,
                info: null
            });
        }
        
        try {
            var audioLevels = getAudioLevels(layer);
            var currentLevel = null;
            
            if (audioLevels) {
                try {
                    currentLevel = audioLevels.value;
                } catch (e) {
                    currentLevel = null;
                }
            }
            
            var info = {
                duration: layer.outPoint - layer.inPoint,
                audioEnabled: layer.audioEnabled,
                currentLevel: currentLevel
            };
            
            if (layer.source && layer.source.hasAudio) {
                try {
                    info.sourceDuration = layer.source.duration;
                } catch (e) {
                    // Source duration not available
                }
            }
            
            return Utils.success({
                hasAudio: true,
                info: info
            });
        } catch (e) {
            return Utils.error('Failed to get audio info: ' + e.toString());
        }
    }
    
    return {
        setAudioLevel: setAudioLevel,
        fadeAudioIn: fadeAudioIn,
        fadeAudioOut: fadeAudioOut,
        muteLayer: muteLayer,
        soloAudio: soloAudio,
        setAudioKeyframe: setAudioKeyframe,
        getAudioInfo: getAudioInfo
    };
})();

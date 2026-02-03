var MarkerService = (function() {
    
    function addCompMarker(params) {
        try {
            var compResult = CompositionData.getActiveComp();
            if (compResult.error) {
                return Utils.error(compResult.error);
            }
            var comp = compResult.comp;
            
            var time = params.time !== undefined ? params.time : comp.time;
            var marker = new MarkerValue(params.comment || '');
            
            if (params.chapter !== undefined) {
                marker.chapter = params.chapter;
            }
            if (params.url !== undefined) {
                marker.url = params.url;
            }
            if (params.frameTarget !== undefined) {
                marker.frameTarget = params.frameTarget;
            }
            if (params.cuePointName !== undefined) {
                marker.cuePointName = params.cuePointName;
            }
            if (params.duration !== undefined) {
                marker.duration = params.duration;
            }
            if (params.label !== undefined) {
                marker.label = params.label;
            }
            
            comp.markerProperty.setValueAtTime(time, marker);
            
            return Utils.success({
                time: time,
                comment: params.comment || ''
            });
        } catch (e) {
            return Utils.error('Failed to add comp marker: ' + e.toString());
        }
    }
    
    function addLayerMarker(params) {
        try {
            var compResult = CompositionData.getActiveComp();
            if (compResult.error) {
                return Utils.error(compResult.error);
            }
            var comp = compResult.comp;
            
            var layerResult = LayerData.getLayer(comp, {
                layerIndex: params.layerIndex
            });
            if (layerResult.error) {
                return Utils.error(layerResult.error);
            }
            
            var layer = layerResult.layer;
            var time = params.time !== undefined ? params.time : comp.time;
            var marker = new MarkerValue(params.comment || '');
            
            if (params.duration !== undefined) {
                marker.duration = params.duration;
            }
            if (params.label !== undefined) {
                marker.label = params.label;
            }
            
            layer.marker.setValueAtTime(time, marker);
            
            return Utils.success({
                layer: params.layerIndex,
                time: time,
                comment: params.comment || ''
            });
        } catch (e) {
            return Utils.error('Failed to add layer marker: ' + e.toString());
        }
    }
    
    function getCompMarkers(params) {
        try {
            var compResult = CompositionData.getActiveComp();
            if (compResult.error) {
                return Utils.error(compResult.error);
            }
            var comp = compResult.comp;
            
            var markerProp = comp.markerProperty;
            var markers = [];
            
            for (var i = 1; i <= markerProp.numKeys; i++) {
                var time = markerProp.keyTime(i);
                var markerValue = markerProp.keyValue(i);
                markers.push({
                    index: i,
                    time: time,
                    comment: markerValue.comment,
                    chapter: markerValue.chapter,
                    duration: markerValue.duration
                });
            }
            
            return Utils.success({
                markers: markers
            });
        } catch (e) {
            return Utils.error('Failed to get comp markers: ' + e.toString());
        }
    }
    
    function getLayerMarkers(params) {
        try {
            var compResult = CompositionData.getActiveComp();
            if (compResult.error) {
                return Utils.error(compResult.error);
            }
            var comp = compResult.comp;
            
            var layerResult = LayerData.getLayer(comp, {
                layerIndex: params.layerIndex
            });
            if (layerResult.error) {
                return Utils.error(layerResult.error);
            }
            
            var layer = layerResult.layer;
            var markerProp = layer.marker;
            var markers = [];
            
            for (var i = 1; i <= markerProp.numKeys; i++) {
                var time = markerProp.keyTime(i);
                var markerValue = markerProp.keyValue(i);
                markers.push({
                    index: i,
                    time: time,
                    comment: markerValue.comment
                });
            }
            
            return Utils.success({
                markers: markers
            });
        } catch (e) {
            return Utils.error('Failed to get layer markers: ' + e.toString());
        }
    }
    
    function removeMarker(params) {
        try {
            var compResult = CompositionData.getActiveComp();
            if (compResult.error) {
                return Utils.error(compResult.error);
            }
            var comp = compResult.comp;
            
            var markerProp;
            
            if (params.target === 'layer') {
                var layerResult = LayerData.getLayer(comp, {
                    layerIndex: params.layerIndex
                });
                if (layerResult.error) {
                    return Utils.error(layerResult.error);
                }
                markerProp = layerResult.layer.marker;
            } else {
                markerProp = comp.markerProperty;
            }
            
            var keyIndex;
            
            if (params.markerIndex !== undefined) {
                keyIndex = params.markerIndex;
            } else if (params.time !== undefined) {
                keyIndex = markerProp.nearestKeyIndex(params.time);
            } else {
                return Utils.error('Must specify markerIndex or time');
            }
            
            if (keyIndex < 1 || keyIndex > markerProp.numKeys) {
                return Utils.error('Invalid marker index');
            }
            
            markerProp.removeKey(keyIndex);
            
            return Utils.success({
                removed: keyIndex
            });
        } catch (e) {
            return Utils.error('Failed to remove marker: ' + e.toString());
        }
    }
    
    function updateMarker(params) {
        try {
            var compResult = CompositionData.getActiveComp();
            if (compResult.error) {
                return Utils.error(compResult.error);
            }
            var comp = compResult.comp;
            
            var markerProp;
            
            if (params.target === 'layer') {
                var layerResult = LayerData.getLayer(comp, {
                    layerIndex: params.layerIndex
                });
                if (layerResult.error) {
                    return Utils.error(layerResult.error);
                }
                markerProp = layerResult.layer.marker;
            } else {
                markerProp = comp.markerProperty;
            }
            
            var keyIndex = params.markerIndex;
            
            if (keyIndex < 1 || keyIndex > markerProp.numKeys) {
                return Utils.error('Invalid marker index');
            }
            
            var time = markerProp.keyTime(keyIndex);
            var existingMarker = markerProp.keyValue(keyIndex);
            
            var newMarker = new MarkerValue(
                params.comment !== undefined ? params.comment : existingMarker.comment
            );
            
            newMarker.chapter = params.chapter !== undefined ? params.chapter : existingMarker.chapter;
            newMarker.url = params.url !== undefined ? params.url : existingMarker.url;
            newMarker.duration = params.duration !== undefined ? params.duration : existingMarker.duration;
            newMarker.frameTarget = existingMarker.frameTarget;
            newMarker.cuePointName = existingMarker.cuePointName;
            newMarker.label = existingMarker.label;
            
            markerProp.setValueAtTime(time, newMarker);
            
            return Utils.success({
                updated: keyIndex
            });
        } catch (e) {
            return Utils.error('Failed to update marker: ' + e.toString());
        }
    }
    
    function addMarkersFromArray(params) {
        try {
            var compResult = CompositionData.getActiveComp();
            if (compResult.error) {
                return Utils.error(compResult.error);
            }
            var comp = compResult.comp;
            
            var markers = params.markers;
            if (!markers || markers.length === 0) {
                return Utils.error('No markers provided');
            }
            
            var addedCount = 0;
            var markerProp = comp.markerProperty;
            
            for (var i = 0; i < markers.length; i++) {
                var m = markers[i];
                var marker = new MarkerValue(m.comment || '');
                
                if (m.duration !== undefined) {
                    marker.duration = m.duration;
                }
                
                markerProp.setValueAtTime(m.time, marker);
                addedCount++;
            }
            
            return Utils.success({
                addedCount: addedCount
            });
        } catch (e) {
            return Utils.error('Failed to add markers from array: ' + e.toString());
        }
    }
    
    return {
        addCompMarker: addCompMarker,
        addLayerMarker: addLayerMarker,
        getCompMarkers: getCompMarkers,
        getLayerMarkers: getLayerMarkers,
        removeMarker: removeMarker,
        updateMarker: updateMarker,
        addMarkersFromArray: addMarkersFromArray
    };
})();

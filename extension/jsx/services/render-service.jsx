// ============================================
// SERVICE: Render Service
// Render queue and frame capture operations
// ============================================

var RenderService = (function() {
    
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
     * Add composition to render queue
     * @param {Object} params - Parameters
     * @param {number} [params.compIndex] - Composition index in project
     * @param {string} [params.compName] - Composition name (alternative to compIndex)
     * @param {string} [params.renderSettings] - Render settings template name
     * @param {string} [params.outputModule] - Output module template name
     * @param {string} [params.outputPath] - Output file path
     * @returns {Object} Result
     */
    function addToRenderQueue(params) {
        var comp = null;
        
        if (params.compIndex) {
            comp = app.project.item(params.compIndex);
        } else if (params.compName) {
            comp = findItemByName(params.compName);
        } else {
            var compResult = CompositionData.getActiveComp();
            if (compResult.error) return Utils.error(compResult.error);
            comp = compResult.comp;
        }
        
        if (!comp || !(comp instanceof CompItem)) {
            return Utils.error('Composition not found');
        }
        
        try {
            var rqItem = app.project.renderQueue.items.add(comp);
            
            if (params.renderSettings) {
                try {
                    rqItem.applyTemplate(params.renderSettings);
                } catch (e) {
                    // Template not found, continue with default
                }
            }
            
            if (params.outputModule) {
                try {
                    rqItem.outputModule(1).applyTemplate(params.outputModule);
                } catch (e) {
                    // Template not found
                }
            }
            
            if (params.outputPath) {
                var outputFile = new File(params.outputPath);
                rqItem.outputModule(1).file = outputFile;
            }
            
            return Utils.success({
                comp: comp.name,
                rqItemIndex: rqItem.index,
                status: String(rqItem.status)
            });
        } catch (e) {
            return Utils.error('Failed to add to render queue: ' + e.toString());
        }
    }
    
    /**
     * List available render templates
     * @returns {Object} Result with renderSettings and outputModules arrays
     */
    function listRenderTemplates() {
        var renderTemplates = [];
        var outputTemplates = [];
        var tempComp = null;
        var rqItem = null;
        
        try {
            tempComp = app.project.items.addComp('_temp_template_check', 100, 100, 1, 1, 1);
            rqItem = app.project.renderQueue.items.add(tempComp);
            
            var rsTemplates = rqItem.templates;
            for (var i = 0; i < rsTemplates.length; i++) {
                renderTemplates.push(rsTemplates[i]);
            }
            
            var omTemplates = rqItem.outputModule(1).templates;
            for (var i = 0; i < omTemplates.length; i++) {
                outputTemplates.push(omTemplates[i]);
            }
            
            rqItem.remove();
            tempComp.remove();
            
            return Utils.success({
                renderSettings: renderTemplates,
                outputModules: outputTemplates
            });
        } catch (e) {
            if (rqItem) {
                try { rqItem.remove(); } catch (e2) {}
            }
            if (tempComp) {
                try { tempComp.remove(); } catch (e2) {}
            }
            return Utils.error('Could not retrieve templates: ' + e.toString());
        }
    }
    
    /**
     * Start render queue
     * @param {Object} [params] - Optional parameters
     * @returns {Object} Result
     */
    function startRender(params) {
        var rq = app.project.renderQueue;
        
        if (rq.numItems === 0) {
            return Utils.error('Render queue is empty');
        }
        
        var queuedCount = 0;
        for (var i = 1; i <= rq.numItems; i++) {
            if (rq.item(i).status === RQItemStatus.QUEUED) {
                queuedCount++;
            }
        }
        
        if (queuedCount === 0) {
            return Utils.error('No items queued for rendering');
        }
        
        try {
            rq.render();
            
            return Utils.success({
                message: 'Render started',
                itemsQueued: queuedCount
            });
        } catch (e) {
            return Utils.error('Failed to start render: ' + e.toString());
        }
    }
    
    /**
     * Capture a single frame from the active composition
     * @param {Object} params - Parameters
     * @param {number} [params.time] - Time to capture (defaults to current time)
     * @param {string} [params.outputFolder] - Output folder path
     * @param {string} [params.fileName] - Output file name
     * @returns {Object} Result with framePath
     */
    function captureFrame(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var currentTime = params.time !== undefined ? params.time : comp.time;
        var outputFolder = params.outputFolder || Folder.temp.fsName;
        var fileName = params.fileName || 'ae_frame_' + new Date().getTime() + '.png';
        var outputPath = outputFolder + '/' + fileName;
        
        var renderItem = null;
        
        try {
            renderItem = app.project.renderQueue.items.add(comp);
            var outputModule = renderItem.outputModule(1);
            
            try {
                outputModule.applyTemplate('PNG Sequence');
            } catch (e) {
                try {
                    outputModule.applyTemplate('Lossless with Alpha');
                } catch (e2) {
                    outputModule.applyTemplate('Lossless');
                }
            }
            
            outputModule.file = new File(outputPath);
            
            renderItem.timeSpanStart = currentTime;
            renderItem.timeSpanDuration = comp.frameDuration;
            
            app.project.renderQueue.render();
            
            renderItem.remove();
            
            var outputFile = new File(outputPath);
            if (outputFile.exists) {
                return Utils.success({
                    framePath: outputPath,
                    time: currentTime,
                    width: comp.width,
                    height: comp.height
                });
            } else {
                return Utils.error('Frame capture failed', { attemptedPath: outputPath });
            }
        } catch (e) {
            if (renderItem) {
                try { renderItem.remove(); } catch (e2) {}
            }
            return Utils.error('Frame capture failed: ' + e.toString());
        }
    }
    
    /**
     * Capture frame with downscaling for optimized output
     * @param {Object} params - Parameters
     * @param {number} [params.time] - Time to capture (defaults to current time)
     * @param {string} [params.outputFolder] - Output folder path
     * @param {string} [params.fileName] - Output file name
     * @param {number} [params.maxWidth] - Maximum width (default 1280)
     * @param {number} [params.maxHeight] - Maximum height (default 720)
     * @param {string} [params.format] - Output format: 'jpg' or 'png' (default 'jpg')
     * @param {boolean} [params.downscale] - Enable downscaling (default true)
     * @returns {Object} Result with framePath and dimensions
     */
    function captureFrameOptimized(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var currentTime = params.time !== undefined ? params.time : comp.time;
        var outputFolder = params.outputFolder || Folder.temp.fsName;
        var fileName = params.fileName || 'ae_frame_' + new Date().getTime() + '.jpg';
        var outputPath = outputFolder + '/' + fileName;
        
        var targetWidth = params.maxWidth || 1280;
        var targetHeight = params.maxHeight || 720;
        
        var useProxy = (comp.width > targetWidth || comp.height > targetHeight);
        var renderComp = comp;
        var proxyComp = null;
        var newWidth = comp.width;
        var newHeight = comp.height;
        
        if (useProxy && params.downscale !== false) {
            var scale = Math.min(targetWidth / comp.width, targetHeight / comp.height);
            newWidth = Math.round(comp.width * scale);
            newHeight = Math.round(comp.height * scale);
            
            proxyComp = app.project.items.addComp(
                '_AI_Temp_' + new Date().getTime(),
                newWidth,
                newHeight,
                1,
                comp.duration,
                comp.frameRate
            );
            
            var compLayer = proxyComp.layers.add(comp);
            var layerTransform = compLayer.property('ADBE Transform Group');
            Utils.setProp(layerTransform, 'ADBE Scale', [scale * 100, scale * 100, 100]);
            Utils.setProp(layerTransform, 'ADBE Position', [newWidth / 2, newHeight / 2, 0]);
            
            renderComp = proxyComp;
        }
        
        var renderItem = null;
        
        try {
            renderItem = app.project.renderQueue.items.add(renderComp);
            var outputModule = renderItem.outputModule(1);
            
            var useJPEG = params.format === 'jpg' || params.format === 'jpeg' || !params.format;
            
            try {
                if (useJPEG) {
                    outputModule.applyTemplate('JPEG Sequence');
                } else {
                    outputModule.applyTemplate('PNG Sequence');
                }
            } catch (e) {
                try {
                    outputModule.applyTemplate('Lossless');
                } catch (e2) {}
            }
            
            outputModule.file = new File(outputPath);
            
            renderItem.timeSpanStart = currentTime;
            renderItem.timeSpanDuration = comp.frameDuration;
            
            app.project.renderQueue.render();
            
            renderItem.remove();
            
            if (proxyComp) {
                proxyComp.remove();
            }
            
            var outputFile = new File(outputPath);
            if (outputFile.exists) {
                return Utils.success({
                    framePath: outputPath,
                    time: currentTime,
                    width: newWidth,
                    height: newHeight,
                    originalSize: [comp.width, comp.height],
                    downscaled: useProxy && params.downscale !== false
                });
            } else {
                return Utils.error('Frame capture failed', { attemptedPath: outputPath });
            }
        } catch (e) {
            if (renderItem) {
                try { renderItem.remove(); } catch (e2) {}
            }
            if (proxyComp) {
                try { proxyComp.remove(); } catch (e2) {}
            }
            return Utils.error('Frame capture failed: ' + e.toString());
        }
    }
    
    /**
     * Set output module settings for a render queue item
     * @param {Object} params - Parameters
     * @param {number} params.rqItemIndex - Render queue item index (1-based)
     * @param {number} [params.outputModuleIndex] - Output module index (default 1)
     * @param {string} [params.template] - Output module template name
     * @param {string} [params.filePath] - Output file path
     * @param {string} [params.fileName] - Output file name (appended to filePath)
     * @returns {Object} Result
     */
    function setOutputModule(params) {
        var rq = app.project.renderQueue;
        var rqItemIndex = params.rqItemIndex;
        var omIndex = params.outputModuleIndex || 1;
        
        if (!rqItemIndex || rqItemIndex < 1 || rqItemIndex > rq.numItems) {
            return Utils.error('Invalid render queue item index');
        }
        
        try {
            var rqItem = rq.item(rqItemIndex);
            var om = rqItem.outputModule(omIndex);
            
            if (params.template) {
                om.applyTemplate(params.template);
            }
            
            if (params.filePath) {
                var fullPath = params.filePath;
                if (params.fileName) {
                    fullPath = params.filePath + '/' + params.fileName;
                }
                om.file = new File(fullPath);
            }
            
            return Utils.success({
                rqItem: rqItemIndex,
                outputModule: omIndex,
                template: params.template || null,
                file: om.file ? om.file.fsName : null
            });
        } catch (e) {
            return Utils.error('Failed to set output module: ' + e.toString());
        }
    }
    
    /**
     * Add multiple compositions to render queue
     * @param {Object} params - Parameters
     * @param {Array} params.compNames - Array of composition names
     * @param {string} [params.outputFolder] - Output folder path
     * @param {string} [params.template] - Render settings template
     * @param {string} [params.outputModuleTemplate] - Output module template
     * @returns {Object} Result
     */
    function batchRenderComps(params) {
        var compNames = params.compNames;
        
        if (!compNames || !compNames.length) {
            return Utils.error('No composition names provided');
        }
        
        var addedComps = [];
        var addedCount = 0;
        
        try {
            for (var i = 0; i < compNames.length; i++) {
                var compName = compNames[i];
                var comp = findItemByName(compName);
                
                if (!comp || !(comp instanceof CompItem)) {
                    continue;
                }
                
                var rqItem = app.project.renderQueue.items.add(comp);
                
                if (params.template) {
                    try {
                        rqItem.applyTemplate(params.template);
                    } catch (e) {}
                }
                
                if (params.outputModuleTemplate) {
                    try {
                        rqItem.outputModule(1).applyTemplate(params.outputModuleTemplate);
                    } catch (e) {}
                }
                
                if (params.outputFolder) {
                    var outputPath = params.outputFolder + '/' + compName;
                    rqItem.outputModule(1).file = new File(outputPath);
                }
                
                addedComps.push({
                    name: compName,
                    rqItemIndex: rqItem.index
                });
                addedCount++;
            }
            
            return Utils.success({
                addedCount: addedCount,
                comps: addedComps
            });
        } catch (e) {
            return Utils.error('Failed to batch add comps: ' + e.toString());
        }
    }
    
    /**
     * Set render time region for a render queue item
     * @param {Object} params - Parameters
     * @param {number} params.rqItemIndex - Render queue item index (1-based)
     * @param {number} [params.startTime] - Start time in seconds
     * @param {number} [params.endTime] - End time in seconds
     * @param {number} [params.startFrame] - Start frame number
     * @param {number} [params.endFrame] - End frame number
     * @param {number} [params.fps] - Frames per second (required if using frames)
     * @returns {Object} Result
     */
    function setRenderRegion(params) {
        var rq = app.project.renderQueue;
        var rqItemIndex = params.rqItemIndex;
        
        if (!rqItemIndex || rqItemIndex < 1 || rqItemIndex > rq.numItems) {
            return Utils.error('Invalid render queue item index');
        }
        
        try {
            var rqItem = rq.item(rqItemIndex);
            var startTime, endTime, duration;
            
            if (params.startTime !== undefined && params.endTime !== undefined) {
                startTime = params.startTime;
                endTime = params.endTime;
            } else if (params.startFrame !== undefined && params.endFrame !== undefined) {
                var fps = params.fps || rqItem.comp.frameRate;
                startTime = params.startFrame / fps;
                endTime = params.endFrame / fps;
            } else {
                return Utils.error('Provide startTime/endTime or startFrame/endFrame with fps');
            }
            
            duration = endTime - startTime;
            
            if (duration <= 0) {
                return Utils.error('End time must be greater than start time');
            }
            
            rqItem.timeSpanStart = startTime;
            rqItem.timeSpanDuration = duration;
            
            return Utils.success({
                start: startTime,
                end: endTime,
                duration: duration
            });
        } catch (e) {
            return Utils.error('Failed to set render region: ' + e.toString());
        }
    }
    
    /**
     * Set render settings for a render queue item
     * @param {Object} params - Parameters
     * @param {number} params.rqItemIndex - Render queue item index (1-based)
     * @param {string} [params.template] - Render settings template name
     * @param {string} [params.quality] - Quality setting
     * @param {string} [params.resolution] - Resolution setting
     * @param {boolean} [params.fieldRender] - Field render setting
     * @param {number} [params.timeSpanStart] - Time span start in seconds
     * @param {number} [params.timeSpanDuration] - Time span duration in seconds
     * @returns {Object} Result
     */
    function setRenderSettings(params) {
        var rq = app.project.renderQueue;
        var rqItemIndex = params.rqItemIndex;
        
        if (!rqItemIndex || rqItemIndex < 1 || rqItemIndex > rq.numItems) {
            return Utils.error('Invalid render queue item index');
        }
        
        try {
            var rqItem = rq.item(rqItemIndex);
            
            if (params.template) {
                rqItem.applyTemplate(params.template);
            }
            
            if (params.timeSpanStart !== undefined) {
                rqItem.timeSpanStart = params.timeSpanStart;
            }
            
            if (params.timeSpanDuration !== undefined) {
                rqItem.timeSpanDuration = params.timeSpanDuration;
            }
            
            var settings = {
                template: params.template || null,
                timeSpanStart: rqItem.timeSpanStart,
                timeSpanDuration: rqItem.timeSpanDuration
            };
            
            return Utils.success({
                settings: settings
            });
        } catch (e) {
            return Utils.error('Failed to set render settings: ' + e.toString());
        }
    }
    
    /**
     * Get status of all render queue items
     * @param {Object} params - Parameters (unused)
     * @returns {Object} Result with items array
     */
    function getRenderStatus(params) {
        var rq = app.project.renderQueue;
        var items = [];
        
        try {
            for (var i = 1; i <= rq.numItems; i++) {
                var rqItem = rq.item(i);
                var outputPath = null;
                
                try {
                    if (rqItem.outputModule(1).file) {
                        outputPath = rqItem.outputModule(1).file.fsName;
                    }
                } catch (e) {}
                
                items.push({
                    index: i,
                    compName: rqItem.comp.name,
                    status: String(rqItem.status),
                    outputPath: outputPath
                });
            }
            
            return Utils.success({
                items: items
            });
        } catch (e) {
            return Utils.error('Failed to get render status: ' + e.toString());
        }
    }
    
    /**
     * Clear items from render queue based on status
     * @param {Object} params - Parameters
     * @param {string} [params.status] - Status filter: 'done', 'queued', or 'all' (default 'all')
     * @returns {Object} Result with removedCount
     */
    function clearRenderQueue(params) {
        var rq = app.project.renderQueue;
        var statusFilter = params.status || 'all';
        var removedCount = 0;
        
        try {
            for (var i = rq.numItems; i >= 1; i--) {
                var rqItem = rq.item(i);
                var shouldRemove = false;
                
                if (statusFilter === 'all') {
                    shouldRemove = true;
                } else if (statusFilter === 'done' && rqItem.status === RQItemStatus.DONE) {
                    shouldRemove = true;
                } else if (statusFilter === 'queued' && rqItem.status === RQItemStatus.QUEUED) {
                    shouldRemove = true;
                }
                
                if (shouldRemove) {
                    rqItem.remove();
                    removedCount++;
                }
            }
            
            return Utils.success({
                removedCount: removedCount
            });
        } catch (e) {
            return Utils.error('Failed to clear render queue: ' + e.toString());
        }
    }
    
    return {
        addToRenderQueue: addToRenderQueue,
        listRenderTemplates: listRenderTemplates,
        startRender: startRender,
        captureFrame: captureFrame,
        captureFrameOptimized: captureFrameOptimized,
        setOutputModule: setOutputModule,
        batchRenderComps: batchRenderComps,
        setRenderRegion: setRenderRegion,
        setRenderSettings: setRenderSettings,
        getRenderStatus: getRenderStatus,
        clearRenderQueue: clearRenderQueue
    };
})();

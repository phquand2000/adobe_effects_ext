// ============================================
// SERVICE: Import Service
// High-level import and project item operations
// ============================================

var ImportService = (function() {
    
    // ============================================
    // HELPER FUNCTIONS
    // ============================================
    
    /**
     * Find or create a folder in the project
     * @param {string} name - Folder name
     * @returns {FolderItem} The folder
     */
    function getOrCreateFolder(name) {
        for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);
            if (item instanceof FolderItem && item.name === name) {
                return item;
            }
        }
        return app.project.items.addFolder(name);
    }
    
    /**
     * Import a single file with proper categorization
     * @param {File} file - File to import
     * @param {FolderItem} videoFolder - Folder for video files
     * @param {FolderItem} modelFolder - Folder for 3D model files
     * @returns {Object} Import result
     */
    function importSingleFile(file, videoFolder, modelFolder) {
        var ext = file.name.split('.').pop().toLowerCase();
        var result = { type: null, name: null, ext: ext, fileName: file.name };
        
        try {
            var importOptions = new ImportOptions(file);
            
            if (ext === 'mp4' || ext === 'mov' || ext === 'avi' || ext === 'mkv') {
                var item = app.project.importFile(importOptions);
                if (videoFolder) item.parentFolder = videoFolder;
                result = { type: 'video', name: item.name, id: item.id };
            } else if (ext === 'glb' || ext === 'gltf' || ext === 'obj' || ext === 'fbx') {
                var item = app.project.importFile(importOptions);
                if (modelFolder) item.parentFolder = modelFolder;
                result = { type: 'model', name: item.name, id: item.id };
            } else if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'exr' || ext === 'tif' || ext === 'hdr') {
                var item = app.project.importFile(importOptions);
                result = { type: 'image', name: item.name, id: item.id };
            } else {
                result = { type: 'unknown', ext: ext, fileName: file.name };
            }
        } catch (e) {
            result = { type: 'error', name: file.name, error: e.toString(), line: e.line };
        }
        
        return result;
    }
    
    // ============================================
    // PUBLIC API
    // ============================================
    
    /**
     * Import assets with dialog or from folder path
     * @param {Object} params - Import parameters
     * @param {string} [params.path] - Folder path to import from (optional, opens dialog if not provided)
     * @returns {Object} Result with imported files
     */
    function importAssets(params) {
        var imported = { videos: [], models: [], images: [] };
        
        try {
            // Mode 1: Import from folder path
            if (params && params.path) {
                var folder = new Folder(params.path);
                if (!folder.exists) {
                    return Utils.error('Folder not found: ' + params.path);
                }
                
                var videoFolder = getOrCreateFolder('Footage');
                var modelFolder = getOrCreateFolder('3D Models');
                
                var files = folder.getFiles();
                for (var i = 0; i < files.length; i++) {
                    var file = files[i];
                    if (file instanceof File) {
                        var result = importSingleFile(file, videoFolder, modelFolder);
                        if (result.type === 'video') imported.videos.push(result.name);
                        else if (result.type === 'model') imported.models.push(result.name);
                        else if (result.type === 'image') imported.images.push(result.name);
                    }
                }
                return Utils.success({ imported: imported });
            }
            
            // Mode 2: Open file picker dialog (default)
            var selectedFiles;
            try {
                selectedFiles = File.openDialog('Select files to import', '*.*', true);
            } catch (dialogError) {
                return Utils.error('Dialog error: ' + dialogError.toString());
            }
            
            if (selectedFiles === null || selectedFiles === undefined) {
                return Utils.success({ message: 'No files selected (cancelled)', imported: imported });
            }
            
            // Normalize to array (single file selection returns File, not Array)
            if (!(selectedFiles instanceof Array)) {
                selectedFiles = [selectedFiles];
            }
            
            if (selectedFiles.length === 0) {
                return Utils.success({ message: 'No files selected', imported: imported });
            }
            
            var videoFolder = getOrCreateFolder('Footage');
            var modelFolder = getOrCreateFolder('3D Models');
            var allResults = [];
            
            for (var i = 0; i < selectedFiles.length; i++) {
                var result = importSingleFile(selectedFiles[i], videoFolder, modelFolder);
                allResults.push(result);
                if (result.type === 'video') imported.videos.push(result.name);
                else if (result.type === 'model') imported.models.push(result.name);
                else if (result.type === 'image') imported.images.push(result.name);
            }
            
            return Utils.success({ imported: imported, details: allResults, fileCount: selectedFiles.length });
        } catch (e) {
            return Utils.error('importAssets error: ' + e.toString());
        }
    }
    
    /**
     * Open file dialog filtered by type
     * @param {Object} params - Dialog parameters
     * @param {string} [params.type] - Filter type: 'video', 'model', 'image', 'all'
     * @param {boolean} [params.multiple] - Allow multiple file selection (default: true)
     * @returns {Object} Result with imported files
     */
    function importWithDialog(params) {
        params = params || {};
        var type = params.type || 'all';
        var fileTypes;
        
        switch (type) {
            case 'video':
                fileTypes = 'Video:*.mp4;*.mov;*.avi;*.mkv';
                break;
            case 'model':
                fileTypes = '3D Model:*.glb;*.gltf;*.obj;*.fbx';
                break;
            case 'image':
                fileTypes = 'Images:*.png;*.jpg;*.jpeg;*.exr;*.hdr';
                break;
            default:
                fileTypes = 'All supported:*.mp4;*.mov;*.avi;*.mkv;*.glb;*.gltf;*.obj;*.fbx;*.png;*.jpg;*.jpeg;*.exr;*.hdr,All:*.*';
        }
        
        var multiSelect = params.multiple !== false;
        var selectedFiles = File.openDialog('Select ' + type + ' file(s)', fileTypes, multiSelect);
        
        if (!selectedFiles) {
            return Utils.success({ message: 'No files selected', imported: [] });
        }
        
        // Normalize to array
        if (!(selectedFiles instanceof Array)) {
            selectedFiles = [selectedFiles];
        }
        
        var videoFolder = getOrCreateFolder('Footage');
        var modelFolder = getOrCreateFolder('3D Models');
        var imported = [];
        
        for (var i = 0; i < selectedFiles.length; i++) {
            var result = importSingleFile(selectedFiles[i], videoFolder, modelFolder);
            if (result.name) {
                imported.push(result);
            }
        }
        
        return Utils.success({ imported: imported });
    }
    
    /**
     * Import a 3D model file
     * @param {Object} params - Import parameters
     * @param {string} params.path - Path to the 3D model file
     * @param {boolean} [params.addToComp] - Whether to add the model to the active composition
     * @returns {Object} Result
     */
    function import3DModel(params) {
        var modelPath = params.path;
        var file = new File(modelPath);
        
        if (!file.exists) {
            return Utils.error('Model file not found: ' + modelPath);
        }
        
        try {
            var importOptions = new ImportOptions(file);
            var item = app.project.importFile(importOptions);
            
            // Move to 3D Models folder
            var modelFolder = getOrCreateFolder('3D Models');
            item.parentFolder = modelFolder;
            
            if (params.addToComp) {
                var compResult = CompositionData.getActiveComp();
                if (compResult.error) return Utils.error(compResult.error);
                var comp = compResult.comp;
                
                var layer = comp.layers.add(item);
                
                return Utils.success({
                    itemName: item.name,
                    itemId: item.id,
                    layerIndex: layer.index,
                    isThreeDModelLayer: (typeof ThreeDModelLayer !== 'undefined' && layer instanceof ThreeDModelLayer)
                });
            }
            
            return Utils.success({ itemName: item.name, itemId: item.id });
        } catch (e) {
            return Utils.error('import3DModel error: ' + e.toString());
        }
    }
    
    /**
     * List project items filtered by type
     * @param {Object} params - List parameters
     * @param {string} [params.type] - Filter type: 'video', 'model', 'image', 'comp', 'all'
     * @returns {Object} Result with items array
     */
    function listProjectItems(params) {
        params = params || {};
        var filterType = params.type || 'all';
        var items = [];
        
        for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);
            var itemInfo = {
                id: item.id,
                name: item.name,
                type: item.typeName
            };
            
            if (item instanceof FootageItem && item.file) {
                var ext = item.file.name.split('.').pop().toLowerCase();
                
                if (ext === 'mp4' || ext === 'mov' || ext === 'avi' || ext === 'mkv') {
                    itemInfo.category = 'video';
                    itemInfo.duration = item.duration;
                    itemInfo.width = item.width;
                    itemInfo.height = item.height;
                    itemInfo.fps = item.frameRate;
                } else if (ext === 'glb' || ext === 'gltf' || ext === 'obj' || ext === 'fbx') {
                    itemInfo.category = 'model';
                } else if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'exr' || ext === 'tif' || ext === 'hdr') {
                    itemInfo.category = 'image';
                    itemInfo.width = item.width;
                    itemInfo.height = item.height;
                } else {
                    itemInfo.category = 'other';
                }
                itemInfo.path = item.file.fsName;
            } else if (item instanceof CompItem) {
                itemInfo.category = 'comp';
                itemInfo.duration = item.duration;
                itemInfo.width = item.width;
                itemInfo.height = item.height;
            } else if (item instanceof FolderItem) {
                itemInfo.category = 'folder';
            }
            
            // Filter by type
            if (filterType === 'all' || itemInfo.category === filterType) {
                items.push(itemInfo);
            }
        }
        
        return Utils.success({ items: items, count: items.length });
    }
    
    return {
        importAssets: importAssets,
        importWithDialog: importWithDialog,
        import3DModel: import3DModel,
        listProjectItems: listProjectItems
    };
})();

// ============================================
// SERVICE: Project Service
// Project-level operations and management
// ============================================

var ProjectService = (function() {
    
    /**
     * Find folder by name in project
     * @param {string} name - Folder name to find
     * @returns {FolderItem|null} Found folder or null
     */
    function findFolderByName(name) {
        for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);
            if (item instanceof FolderItem && item.name === name) {
                return item;
            }
        }
        return null;
    }
    
    /**
     * Find composition by name or index
     * @param {string} [name] - Composition name
     * @param {number} [index] - Composition index (1-based)
     * @returns {CompItem|null} Found composition or null
     */
    function findComp(name, index) {
        if (index !== undefined) {
            var compIndex = 0;
            for (var i = 1; i <= app.project.numItems; i++) {
                var item = app.project.item(i);
                if (item instanceof CompItem) {
                    compIndex++;
                    if (compIndex === index) {
                        return item;
                    }
                }
            }
        }
        if (name) {
            for (var i = 1; i <= app.project.numItems; i++) {
                var item = app.project.item(i);
                if (item instanceof CompItem && item.name === name) {
                    return item;
                }
            }
        }
        return null;
    }
    
    /**
     * Get project settings
     * @param {Object} params - Empty object
     * @returns {Object} Project settings
     */
    function getProjectSettings(params) {
        try {
            var proj = app.project;
            var settings = {
                filePath: proj.file ? proj.file.fsName : null,
                bitsPerChannel: proj.bitsPerChannel,
                workingSpace: proj.workingSpace,
                linearizeWorkingSpace: proj.linearizeWorkingSpace,
                timeDisplayType: proj.timeDisplayType,
                framesCountType: proj.framesCountType,
                gpuAccelType: proj.gpuAccelType
            };
            
            return Utils.success({ settings: settings });
        } catch (e) {
            return Utils.error('Failed to get project settings: ' + e.toString());
        }
    }
    
    /**
     * Set project settings
     * @param {Object} params - Settings to update
     * @param {number} [params.bitsPerChannel] - Bits per channel (8, 16, 32)
     * @param {string} [params.workingSpace] - Color working space
     * @param {boolean} [params.linearizeWorkingSpace] - Linearize working space
     * @param {number} [params.timeDisplayType] - Time display type
     * @param {number} [params.framesCountType] - Frames count type
     * @param {string} [params.expressionEngine] - Expression engine
     * @returns {Object} Result with updated properties
     */
    function setProjectSettings(params) {
        try {
            var proj = app.project;
            var updated = [];
            
            if (params.bitsPerChannel !== undefined) {
                proj.bitsPerChannel = params.bitsPerChannel;
                updated.push('bitsPerChannel');
            }
            
            if (params.workingSpace !== undefined) {
                proj.workingSpace = params.workingSpace;
                updated.push('workingSpace');
            }
            
            if (params.linearizeWorkingSpace !== undefined) {
                proj.linearizeWorkingSpace = params.linearizeWorkingSpace;
                updated.push('linearizeWorkingSpace');
            }
            
            if (params.timeDisplayType !== undefined) {
                proj.timeDisplayType = params.timeDisplayType;
                updated.push('timeDisplayType');
            }
            
            if (params.framesCountType !== undefined) {
                proj.framesCountType = params.framesCountType;
                updated.push('framesCountType');
            }
            
            if (params.expressionEngine !== undefined) {
                proj.expressionEngine = params.expressionEngine;
                updated.push('expressionEngine');
            }
            
            return Utils.success({ updated: updated });
        } catch (e) {
            return Utils.error('Failed to set project settings: ' + e.toString());
        }
    }
    
    /**
     * Save project
     * @param {Object} params - Save parameters
     * @param {string} [params.path] - File path for Save As
     * @returns {Object} Result with saved path
     */
    function saveProject(params) {
        try {
            var proj = app.project;
            var savePath;
            
            if (params.path) {
                var saveFile = new File(params.path);
                proj.save(saveFile);
                savePath = saveFile.fsName;
            } else {
                if (!proj.file) {
                    return Utils.error('Project has never been saved. Please provide a path.');
                }
                proj.save();
                savePath = proj.file.fsName;
            }
            
            return Utils.success({ path: savePath });
        } catch (e) {
            return Utils.error('Failed to save project: ' + e.toString());
        }
    }
    
    /**
     * Close project
     * @param {Object} params - Close parameters
     * @param {boolean} [params.save] - Whether to save before closing
     * @returns {Object} Result
     */
    function closeProject(params) {
        try {
            var saveChanges = params.save === true;
            var closeOption = saveChanges ? CloseOptions.SAVE_CHANGES : CloseOptions.DO_NOT_SAVE_CHANGES;
            
            app.project.close(closeOption);
            
            return Utils.success({});
        } catch (e) {
            return Utils.error('Failed to close project: ' + e.toString());
        }
    }
    
    /**
     * Create folder in project
     * @param {Object} params - Folder parameters
     * @param {string} params.name - Folder name
     * @param {string} [params.parentFolderName] - Parent folder name
     * @returns {Object} Result with folder info
     */
    function createFolder(params) {
        var validationErrors = Utils.validateParams(params, {
            name: { required: true, type: 'string' }
        });
        if (validationErrors) {
            return Utils.error(validationErrors.join(', '));
        }
        
        try {
            var folder = app.project.items.addFolder(params.name);
            
            if (params.parentFolderName) {
                var parentFolder = findFolderByName(params.parentFolderName);
                if (parentFolder) {
                    folder.parentFolder = parentFolder;
                }
            }
            
            return Utils.success({
                folderName: folder.name,
                folderId: folder.id
            });
        } catch (e) {
            return Utils.error('Failed to create folder: ' + e.toString());
        }
    }
    
    /**
     * Organize project items into folders by type
     * @param {Object} params - Organization parameters
     * @param {Array} [params.createFolders] - Folder names to create
     * @returns {Object} Result with organization details
     */
    function organizeProjectItems(params) {
        var folderNames = params.createFolders || ['Comps', 'Footage', 'Precomps', 'Solids', 'Audio'];
        
        try {
            app.beginUndoGroup('Organize Project');
            
            var folders = {};
            for (var i = 0; i < folderNames.length; i++) {
                var name = folderNames[i];
                var existing = findFolderByName(name);
                if (existing) {
                    folders[name] = existing;
                } else {
                    folders[name] = app.project.items.addFolder(name);
                }
            }
            
            var organized = {};
            for (var key in folders) {
                if (folders.hasOwnProperty(key)) {
                    organized[key] = 0;
                }
            }
            
            for (var i = 1; i <= app.project.numItems; i++) {
                var item = app.project.item(i);
                
                if (item instanceof FolderItem) {
                    continue;
                }
                
                if (item.parentFolder && item.parentFolder !== app.project.rootFolder) {
                    continue;
                }
                
                var targetFolder = null;
                
                if (item instanceof CompItem) {
                    if (folders['Comps']) {
                        targetFolder = folders['Comps'];
                        organized['Comps']++;
                    }
                } else if (item instanceof FootageItem) {
                    if (item.mainSource instanceof SolidSource) {
                        if (folders['Solids']) {
                            targetFolder = folders['Solids'];
                            organized['Solids']++;
                        }
                    } else if (item.hasAudio && !item.hasVideo) {
                        if (folders['Audio']) {
                            targetFolder = folders['Audio'];
                            organized['Audio']++;
                        }
                    } else {
                        if (folders['Footage']) {
                            targetFolder = folders['Footage'];
                            organized['Footage']++;
                        }
                    }
                }
                
                if (targetFolder) {
                    item.parentFolder = targetFolder;
                }
            }
            
            app.endUndoGroup();
            
            return Utils.success({ organized: organized });
        } catch (e) {
            app.endUndoGroup();
            return Utils.error('Failed to organize project: ' + e.toString());
        }
    }
    
    /**
     * Generate project report
     * @param {Object} params - Report parameters
     * @param {boolean} [params.includeUnused] - Include unused items count
     * @returns {Object} Result with project report
     */
    function getProjectReport(params) {
        var includeUnused = params.includeUnused !== false;
        
        try {
            var report = {
                totalItems: app.project.numItems,
                compsCount: 0,
                footageCount: 0,
                foldersCount: 0,
                solidsCount: 0,
                unusedCount: 0,
                missingFootage: []
            };
            
            for (var i = 1; i <= app.project.numItems; i++) {
                var item = app.project.item(i);
                
                if (item instanceof CompItem) {
                    report.compsCount++;
                } else if (item instanceof FolderItem) {
                    report.foldersCount++;
                } else if (item instanceof FootageItem) {
                    if (item.mainSource instanceof SolidSource) {
                        report.solidsCount++;
                    } else {
                        report.footageCount++;
                    }
                    
                    if (item.footageMissing) {
                        report.missingFootage.push({
                            name: item.name,
                            id: item.id
                        });
                    }
                }
                
                if (includeUnused && item.usedIn && item.usedIn.length === 0) {
                    if (!(item instanceof FolderItem)) {
                        report.unusedCount++;
                    }
                }
            }
            
            return Utils.success({ report: report });
        } catch (e) {
            return Utils.error('Failed to generate project report: ' + e.toString());
        }
    }
    
    /**
     * Reduce project to specified composition
     * @param {Object} params - Reduce parameters
     * @param {string} [params.targetCompName] - Target composition name
     * @param {number} [params.targetCompIndex] - Target composition index
     * @returns {Object} Result with reduction details
     */
    function reduceProject(params) {
        try {
            var comp = null;
            
            if (params.targetCompName) {
                comp = findComp(params.targetCompName);
            } else if (params.targetCompIndex !== undefined) {
                comp = findComp(null, params.targetCompIndex);
            }
            
            if (!comp) {
                return Utils.error('Target composition not found');
            }
            
            var itemsBefore = app.project.numItems;
            
            app.project.reduceProject([comp]);
            
            var itemsAfter = app.project.numItems;
            var removedCount = itemsBefore - itemsAfter;
            
            return Utils.success({
                reducedTo: comp.name,
                removedCount: removedCount
            });
        } catch (e) {
            return Utils.error('Failed to reduce project: ' + e.toString());
        }
    }
    
    return {
        getProjectSettings: getProjectSettings,
        setProjectSettings: setProjectSettings,
        saveProject: saveProject,
        closeProject: closeProject,
        createFolder: createFolder,
        organizeProjectItems: organizeProjectItems,
        getProjectReport: getProjectReport,
        reduceProject: reduceProject
    };
})();

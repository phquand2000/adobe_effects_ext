// ============================================
// SERVICE: Footage Service
// Footage management, relinking, and proxy operations
// ============================================

var FootageService = (function() {
    
    // ============================================
    // HELPER FUNCTIONS
    // ============================================
    
    /**
     * Recursively get all files from a folder
     * @param {Folder} folder - Folder to search
     * @param {boolean} recursive - Whether to search recursively
     * @returns {Array} Array of File objects
     */
    function getAllFiles(folder, recursive) {
        var files = [];
        var contents = folder.getFiles();
        
        for (var i = 0; i < contents.length; i++) {
            var item = contents[i];
            if (item instanceof File) {
                files.push(item);
            } else if (item instanceof Folder && recursive) {
                var subFiles = getAllFiles(item, true);
                for (var j = 0; j < subFiles.length; j++) {
                    files.push(subFiles[j]);
                }
            }
        }
        
        return files;
    }
    
    // ============================================
    // PUBLIC API
    // ============================================
    
    /**
     * Replace footage source with a new file
     * @param {Object} params - Replace parameters
     * @param {string} [params.itemName] - Name of the item to replace
     * @param {number} [params.itemId] - ID of the item to replace
     * @param {string} params.newFilePath - Path to the new file
     * @returns {Object} Result
     */
    function replaceFootage(params) {
        if (!params.newFilePath) {
            return Utils.error('newFilePath is required');
        }
        
        var result = ProjectData.findFootageItem(params);
        if (result.error) {
            return Utils.error(result.error);
        }
        
        var item = result.item;
        var newFile = new File(params.newFilePath);
        
        if (!newFile.exists) {
            return Utils.error('File not found: ' + params.newFilePath);
        }
        
        try {
            item.replace(newFile);
            return Utils.success({
                itemName: item.name,
                newPath: newFile.fsName
            });
        } catch (e) {
            return Utils.error('replaceFootage error: ' + e.toString());
        }
    }
    
    /**
     * Find and relink missing footage items
     * @param {Object} params - Relink parameters
     * @param {string} params.searchFolder - Folder path to search for missing files
     * @param {boolean} [params.recursive] - Search subfolders (default: true)
     * @returns {Object} Result with relinked count
     */
    function relinkFootage(params) {
        if (!params.searchFolder) {
            return Utils.error('searchFolder is required');
        }
        
        var folder = new Folder(params.searchFolder);
        if (!folder.exists) {
            return Utils.error('Folder not found: ' + params.searchFolder);
        }
        
        var recursive = params.recursive !== false;
        var relinked = 0;
        var failed = 0;
        
        try {
            var availableFiles = getAllFiles(folder, recursive);
            var fileMap = {};
            
            for (var i = 0; i < availableFiles.length; i++) {
                var f = availableFiles[i];
                fileMap[f.name.toLowerCase()] = f;
            }
            
            for (var i = 1; i <= app.project.numItems; i++) {
                var item = app.project.item(i);
                
                if (item instanceof FootageItem && item.file) {
                    if (!item.file.exists) {
                        var fileName = item.file.name.toLowerCase();
                        var matchFile = fileMap[fileName];
                        
                        if (matchFile) {
                            try {
                                item.replace(matchFile);
                                relinked++;
                            } catch (e) {
                                failed++;
                            }
                        } else {
                            failed++;
                        }
                    }
                }
            }
            
            return Utils.success({
                relinked: relinked,
                failed: failed
            });
        } catch (e) {
            return Utils.error('relinkFootage error: ' + e.toString());
        }
    }
    
    /**
     * Set footage interpretation settings
     * @param {Object} params - Interpretation parameters
     * @param {string} [params.itemName] - Name of the item
     * @param {number} [params.itemId] - ID of the item
     * @param {number} [params.frameRate] - Frame rate to set
     * @param {string} [params.fieldSeparation] - Field separation mode
     * @param {string} [params.alphaMode] - Alpha mode: 'ignore', 'straight', 'premultiplied'
     * @param {Array} [params.premulColor] - Premultiply color [r, g, b]
     * @returns {Object} Result
     */
    function interpretFootage(params) {
        var result = ProjectData.findFootageItem(params);
        if (result.error) {
            return Utils.error(result.error);
        }
        
        var item = result.item;
        
        try {
            var source = item.mainSource;
            var settings = {};
            
            if (params.frameRate !== undefined) {
                source.conformFrameRate = params.frameRate;
                settings.frameRate = params.frameRate;
            }
            
            if (params.fieldSeparation !== undefined) {
                switch (params.fieldSeparation) {
                    case 'off':
                        source.fieldSeparationType = FieldSeparationType.OFF;
                        break;
                    case 'upperFirst':
                        source.fieldSeparationType = FieldSeparationType.UPPER_FIELD_FIRST;
                        break;
                    case 'lowerFirst':
                        source.fieldSeparationType = FieldSeparationType.LOWER_FIELD_FIRST;
                        break;
                }
                settings.fieldSeparation = params.fieldSeparation;
            }
            
            if (params.alphaMode !== undefined) {
                switch (params.alphaMode) {
                    case 'ignore':
                        source.alphaMode = AlphaMode.IGNORE;
                        break;
                    case 'straight':
                        source.alphaMode = AlphaMode.STRAIGHT;
                        break;
                    case 'premultiplied':
                        source.alphaMode = AlphaMode.PREMULTIPLIED;
                        break;
                }
                settings.alphaMode = params.alphaMode;
            }
            
            if (params.premulColor !== undefined && params.premulColor instanceof Array) {
                source.premulColor = params.premulColor;
                settings.premulColor = params.premulColor;
            }
            
            return Utils.success({
                itemName: item.name,
                settings: settings
            });
        } catch (e) {
            return Utils.error('interpretFootage error: ' + e.toString());
        }
    }
    
    /**
     * Set or remove proxy for footage item
     * @param {Object} params - Proxy parameters
     * @param {string} [params.itemName] - Name of the item
     * @param {number} [params.itemId] - ID of the item
     * @param {string} [params.proxyPath] - Path to proxy file (omit or 'none' to remove)
     * @returns {Object} Result
     */
    function setProxy(params) {
        var result = ProjectData.findFootageItem(params);
        if (result.error) {
            return Utils.error(result.error);
        }
        
        var item = result.item;
        
        try {
            if (!params.proxyPath || params.proxyPath === 'none') {
                item.setProxyToNone();
                return Utils.success({
                    itemName: item.name,
                    proxySet: false
                });
            }
            
            var proxyFile = new File(params.proxyPath);
            if (!proxyFile.exists) {
                return Utils.error('Proxy file not found: ' + params.proxyPath);
            }
            
            item.setProxy(proxyFile);
            return Utils.success({
                itemName: item.name,
                proxySet: true
            });
        } catch (e) {
            return Utils.error('setProxy error: ' + e.toString());
        }
    }
    
    /**
     * Collect files and save project copy
     * @param {Object} params - Collect parameters
     * @param {string} params.folder - Destination folder path
     * @param {boolean} [params.collectSourceFiles] - Collect source files (default: true)
     * @param {boolean} [params.generateReport] - Generate report (default: false)
     * @returns {Object} Result
     */
    function collectFiles(params) {
        if (!params.folder) {
            return Utils.error('folder is required');
        }
        
        var destFolder = new Folder(params.folder);
        if (!destFolder.exists) {
            var created = destFolder.create();
            if (!created) {
                return Utils.error('Could not create folder: ' + params.folder);
            }
        }
        
        try {
            var collectSourceFiles = params.collectSourceFiles !== false;
            var generateReport = params.generateReport === true;
            var fileCount = 0;
            
            app.project.consolidateFootage();
            
            if (collectSourceFiles) {
                for (var i = 1; i <= app.project.numItems; i++) {
                    var item = app.project.item(i);
                    if (item instanceof FootageItem && item.file && item.file.exists) {
                        var destFile = new File(destFolder.fsName + '/' + item.file.name);
                        if (item.file.copy(destFile)) {
                            fileCount++;
                        }
                    }
                }
            }
            
            var projectName = app.project.file ? app.project.file.name : 'Untitled.aep';
            var projectCopy = new File(destFolder.fsName + '/' + projectName);
            app.project.save(projectCopy);
            
            var result = {
                collectedTo: destFolder.fsName,
                fileCount: fileCount
            };
            
            if (generateReport) {
                var reportFile = new File(destFolder.fsName + '/collect-report.txt');
                reportFile.open('w');
                reportFile.writeln('Collect Files Report');
                reportFile.writeln('Date: ' + new Date().toString());
                reportFile.writeln('Files collected: ' + fileCount);
                reportFile.writeln('Project saved to: ' + projectCopy.fsName);
                reportFile.close();
                result.reportPath = reportFile.fsName;
            }
            
            return Utils.success(result);
        } catch (e) {
            return Utils.error('collectFiles error: ' + e.toString());
        }
    }
    
    /**
     * Remove unused footage from project
     * @param {Object} params - Remove parameters
     * @param {boolean} [params.dryRun] - Only count, don't remove (default: false)
     * @returns {Object} Result with removed count
     */
    function removeUnused(params) {
        params = params || {};
        var dryRun = params.dryRun === true;
        
        try {
            var unusedCount = 0;
            
            if (dryRun) {
                for (var i = 1; i <= app.project.numItems; i++) {
                    var item = app.project.item(i);
                    if (item instanceof FootageItem && item.usedIn.length === 0) {
                        unusedCount++;
                    }
                }
                return Utils.success({
                    removedCount: 0,
                    unusedCount: unusedCount,
                    dryRun: true
                });
            }
            
            unusedCount = app.project.removeUnusedFootage();
            
            return Utils.success({
                removedCount: unusedCount
            });
        } catch (e) {
            return Utils.error('removeUnused error: ' + e.toString());
        }
    }
    
    /**
     * Find missing footage items in project
     * @param {Object} params - Empty params object
     * @returns {Object} Result with missing items array
     */
    function findMissingFootage(params) {
        try {
            var missing = [];
            
            for (var i = 1; i <= app.project.numItems; i++) {
                var item = app.project.item(i);
                
                if (item instanceof FootageItem && item.file) {
                    if (!item.file.exists) {
                        missing.push({
                            name: item.name,
                            path: item.file.fsName
                        });
                    }
                }
            }
            
            return Utils.success({
                missing: missing
            });
        } catch (e) {
            return Utils.error('findMissingFootage error: ' + e.toString());
        }
    }
    
    return {
        replaceFootage: replaceFootage,
        relinkFootage: relinkFootage,
        interpretFootage: interpretFootage,
        setProxy: setProxy,
        collectFiles: collectFiles,
        removeUnused: removeUnused,
        findMissingFootage: findMissingFootage
    };
})();

// ============================================
// DATA LAYER: Project Repository
// Provides access to After Effects project items
// ============================================

var ProjectData = (function() {
    
    /**
     * Find a project item by name
     * @param {string} name - Item name
     * @param {string} [type] - Optional type filter: 'footage', 'comp', 'folder'
     * @returns {Object} { item: Item } or { error: string }
     */
    function findItemByName(name, type) {
        for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);
            if (item.name === name) {
                if (type === 'footage' && !(item instanceof FootageItem)) continue;
                if (type === 'comp' && !(item instanceof CompItem)) continue;
                if (type === 'folder' && !(item instanceof FolderItem)) continue;
                return { item: item };
            }
        }
        return { error: 'Item not found: ' + name };
    }
    
    /**
     * Find a project item by ID
     * @param {number} id - Item ID
     * @returns {Object} { item: Item } or { error: string }
     */
    function findItemById(id) {
        for (var i = 1; i <= app.project.numItems; i++) {
            if (app.project.item(i).id === id) {
                return { item: app.project.item(i) };
            }
        }
        return { error: 'Item not found with ID: ' + id };
    }
    
    /**
     * Find a footage item by name or ID
     * @param {Object} params - { itemName, itemId }
     * @returns {Object} { item: FootageItem } or { error: string }
     */
    function findFootageItem(params) {
        var result;
        
        if (params.itemId) {
            result = findItemById(params.itemId);
        } else if (params.itemName) {
            result = findItemByName(params.itemName, 'footage');
        } else {
            return { error: 'itemName or itemId required' };
        }
        
        if (result.error) return result;
        
        if (!(result.item instanceof FootageItem)) {
            return { error: 'Item is not a footage item' };
        }
        
        return { item: result.item };
    }
    
    /**
     * Find a composition by name or ID
     * @param {Object} params - { compName, compId }
     * @returns {Object} { comp: CompItem } or { error: string }
     */
    function findComp(params) {
        var result;
        
        if (params.compId) {
            result = findItemById(params.compId);
        } else if (params.compName) {
            result = findItemByName(params.compName, 'comp');
        } else {
            return { error: 'compName or compId required' };
        }
        
        if (result.error) return result;
        
        if (!(result.item instanceof CompItem)) {
            return { error: 'Item is not a composition' };
        }
        
        return { comp: result.item };
    }
    
    /**
     * Get project item count by type
     * @returns {Object} Counts by type
     */
    function getItemCounts() {
        var counts = { footage: 0, comp: 0, folder: 0, total: app.project.numItems };
        
        for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);
            if (item instanceof FootageItem) counts.footage++;
            else if (item instanceof CompItem) counts.comp++;
            else if (item instanceof FolderItem) counts.folder++;
        }
        
        return counts;
    }
    
    return {
        findItemByName: findItemByName,
        findItemById: findItemById,
        findFootageItem: findFootageItem,
        findComp: findComp,
        getItemCounts: getItemCounts
    };
})();

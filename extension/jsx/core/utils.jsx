// ============================================
// CORE UTILITIES
// Shared utility functions for all modules
// ============================================

var Utils = (function() {
    
    /**
     * Safely set a property value
     * @param {PropertyGroup} group - The property group
     * @param {string} matchName - Match name or display name
     * @param {*} value - Value to set
     * @returns {boolean} Success status
     */
    function setProp(group, matchName, value) {
        if (value === undefined || value === null || !group) return false;
        try {
            var prop = group.property(matchName);
            if (prop !== null && prop.canSetValue !== false) {
                prop.setValue(value);
                return true;
            }
        } catch (e) {
            return false;
        }
        return false;
    }
    
    /**
     * Validate parameters against a schema
     * @param {Object} params - Parameters to validate
     * @param {Object} schema - Validation schema
     * @returns {Array|null} Array of errors or null if valid
     */
    function validateParams(params, schema) {
        var errors = [];
        for (var key in schema) {
            if (schema.hasOwnProperty(key)) {
                var rule = schema[key];
                var value = params[key];
                
                if (rule.required && (value === undefined || value === null)) {
                    errors.push('Missing required param: ' + key);
                    continue;
                }
                
                if (value !== undefined && value !== null && rule.type) {
                    var actualType = (value instanceof Array) ? 'array' : typeof value;
                    if (actualType !== rule.type) {
                        errors.push(key + ' must be ' + rule.type + ', got ' + actualType);
                    }
                }
            }
        }
        return errors.length > 0 ? errors : null;
    }
    
    /**
     * Create a success response
     * @param {Object} data - Response data
     * @returns {Object} Success response
     */
    function success(data) {
        var result = { success: true };
        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                result[key] = data[key];
            }
        }
        return result;
    }
    
    /**
     * Create an error response
     * @param {string} message - Error message
     * @param {Object} [extra] - Extra error info
     * @returns {Object} Error response
     */
    function error(message, extra) {
        var result = { success: false, error: message };
        if (extra) {
            for (var key in extra) {
                if (extra.hasOwnProperty(key)) {
                    result[key] = extra[key];
                }
            }
        }
        return result;
    }
    
    /**
     * Normalize array values (e.g., scale [100] -> [100, 100, 100])
     * @param {*} value - Value to normalize
     * @param {number} dimensions - Target dimensions
     * @returns {Array} Normalized array
     */
    function normalizeArray(value, dimensions) {
        if (typeof value === 'number') {
            var arr = [];
            for (var i = 0; i < dimensions; i++) {
                arr.push(value);
            }
            return arr;
        }
        return value;
    }
    
    /**
     * Clamp a value between min and max
     * @param {number} value - Value to clamp
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Clamped value
     */
    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    
    return {
        setProp: setProp,
        validateParams: validateParams,
        success: success,
        error: error,
        normalizeArray: normalizeArray,
        clamp: clamp
    };
})();

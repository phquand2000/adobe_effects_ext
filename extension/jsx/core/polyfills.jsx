// ============================================
// POLYFILLS FOR EXTENDSCRIPT
// Core polyfills for JSON and Array methods
// ============================================

if (typeof JSON === 'undefined') {
    JSON = {
        stringify: function(obj) {
            if (obj === null) return 'null';
            if (obj === undefined) return undefined;
            var t = typeof obj;
            if (t === 'number' || t === 'boolean') return String(obj);
            if (t === 'string') return '"' + obj.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t') + '"';
            if (obj instanceof Array) {
                var arr = [];
                for (var i = 0; i < obj.length; i++) {
                    var v = JSON.stringify(obj[i]);
                    arr.push(v === undefined ? 'null' : v);
                }
                return '[' + arr.join(',') + ']';
            }
            if (t === 'object') {
                var parts = [];
                for (var k in obj) {
                    if (obj.hasOwnProperty(k)) {
                        var v = JSON.stringify(obj[k]);
                        if (v !== undefined) {
                            parts.push('"' + k + '":' + v);
                        }
                    }
                }
                return '{' + parts.join(',') + '}';
            }
            return String(obj);
        },
        
        parse: function(str) {
            if (typeof str !== 'string') {
                throw new Error('JSON.parse: expected string');
            }
            str = str.replace(/^\s+|\s+$/g, ''); // trim
            
            // Strict validation: only allow safe JSON tokens
            // Step 1: Replace string contents with placeholder for validation
            // This safely removes all string content so we only validate structure
            var safeStr = str.replace(/"(?:[^"\\]|\\.)*"/g, '""');
            
            // Step 2: Check that remaining characters are only valid JSON tokens
            // Valid: {} [] , : digits . - + e E whitespace true false null ""
            var structureOnly = safeStr.replace(/""/g, '').replace(/-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/g, '').replace(/true|false|null/g, '');
            if (!/^[\[\]\{\}\,\:\s]*$/.test(structureOnly)) {
                throw new Error('JSON.parse: invalid JSON - contains unsafe tokens');
            }
            
            // Step 3: Check for function calls ONLY in the structure, not inside strings
            // safeStr has all string content replaced, so checking it is safe
            if (/[a-zA-Z_$][a-zA-Z0-9_$]*\s*\(/.test(safeStr)) {
                throw new Error('JSON.parse: invalid JSON - function call detected');
            }
            
            // Step 4: Parse using Function constructor (now safe after validation)
            try {
                return (new Function('return ' + str))();
            } catch (e) {
                throw new Error('JSON parse error: ' + e.toString());
            }
        }
    };
}

if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(item) {
        for (var i = 0; i < this.length; i++) {
            if (this[i] === item) return i;
        }
        return -1;
    };
}

if (!Array.prototype.forEach) {
    Array.prototype.forEach = function(callback) {
        for (var i = 0; i < this.length; i++) {
            callback(this[i], i, this);
        }
    };
}

if (!Array.prototype.map) {
    Array.prototype.map = function(callback) {
        var result = [];
        for (var i = 0; i < this.length; i++) {
            result.push(callback(this[i], i, this));
        }
        return result;
    };
}

if (!Array.prototype.filter) {
    Array.prototype.filter = function(callback) {
        var result = [];
        for (var i = 0; i < this.length; i++) {
            if (callback(this[i], i, this)) {
                result.push(this[i]);
            }
        }
        return result;
    };
}

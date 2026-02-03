# Core Module

Foundation layer with polyfills and utilities. **No dependencies** - must be loaded first.

## Files

| File | Module | Description |
|------|--------|-------------|
| `polyfills.jsx` | - | ES5 polyfills for ExtendScript (JSON, Array methods) |
| `utils.jsx` | `Utils` | Shared utility functions for all modules |

## Utils API

```javascript
Utils.setProp(group, matchName, value)     // Safely set AE property value
Utils.validateParams(params, schema)       // Validate params against schema
Utils.success(data)                        // Create { success: true, ...data }
Utils.error(message, extra)                // Create { success: false, error, ...extra }
Utils.normalizeArray(value, dimensions)    // Normalize scalar to array [v, v, v]
Utils.clamp(value, min, max)               // Clamp value to range
```

## Polyfills Provided

- `JSON.stringify()` / `JSON.parse()`
- `Array.prototype.indexOf()`
- `Array.prototype.forEach()`
- `Array.prototype.map()`
- `Array.prototype.filter()`

## Usage Pattern

All service methods should return:
```javascript
// Success
return Utils.success({ layer: layer.name, ... });

// Error
return Utils.error('Error message');
```

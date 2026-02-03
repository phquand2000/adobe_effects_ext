# ExtendScript Modules

AE AI Assistant ExtendScript backend with 29 services and 158 actions.

## Architecture

```
jsx/
├── core/           → Foundation (polyfills, utilities)
├── data/           → AE API access (repositories)
├── domain/         → Business logic (presets, calculations)
├── services/       → Action handlers (29 services, 158 actions)
├── loader.jsx      → Module loader (dependency order)
├── hostscript.jsx  → Thin wrapper (~60 lines), loads loader.jsx
└── test-runner.jsx → Test utilities
```

See each folder's `AGENTS.md` for detailed documentation.

## ES3 Constraints

ExtendScript only supports ECMAScript 3 (1999):
- No `const`, `let` → use `var`
- No arrow functions → use `function()`
- No template literals → use string concatenation
- No classes → use IIFE modules
- No destructuring, spread, default parameters

## Critical: $.evalFile() Scope Rule

**$.evalFile() must be called at the TOP LEVEL of a script, not inside functions.**

When `$.evalFile()` is called inside a function, `var` declarations in the loaded file do NOT escape to the global scope. This means modules won't be accessible.

```javascript
// ❌ WRONG - modules won't be global
function loadModule(path) {
    $.evalFile(path);  // var declarations stay local!
}
loadModule('utils.jsx');
Utils.success({});  // ERROR: Utils is undefined

// ✅ CORRECT - modules become global
$.evalFile('utils.jsx');  // At top level
Utils.success({});  // Works!
```

This is why `loader.jsx` uses top-level `$.evalFile()` calls for all modules.

## Module Pattern

```javascript
var ModuleName = (function() {
    function privateHelper() { ... }
    
    function publicMethod(params) {
        return Utils.success({ data: value });
    }
    
    return { publicMethod: publicMethod };
})();
```

## Layer Dependencies

| Layer | Folder | Depends On | Description |
|-------|--------|------------|-------------|
| 1 | `core/` | None | Polyfills, Utils |
| 2 | `data/` | Utils | CompositionData, LayerData, EffectData, PropertyData, ProjectData |
| 3 | `domain/` | Utils | CameraDomain, LightDomain, MaterialDomain, AnimationDomain |
| 4 | `services/` | All above | 28 service modules + ActionRegistry |

## Quick Reference

### Core (2 files)
- `polyfills.jsx` - JSON, Array methods
- `utils.jsx` - Utils.success(), Utils.error(), Utils.setProp()

### Data (5 files)
- `composition-data.jsx` - CompositionData.getActiveComp()
- `layer-data.jsx` - LayerData.getLayer(), LayerData.getLayerType(), LayerData.getLayerCapabilities()
- `effect-data.jsx` - EffectData.addEffect()
- `property-data.jsx` - PropertyData.getProperty()
- `project-data.jsx` - ProjectData.findFootageItem()

### Domain (4 files)
- `camera.jsx` - Camera presets
- `light.jsx` - Light rig configurations
- `material.jsx` - Material presets
- `animation.jsx` - Easing curves

### Services (29 files, 158 actions)

| Category | Services | Actions |
|----------|----------|---------|
| Camera & Light | camera, light | 9 |
| Layer | layer, layer-utils | 15 |
| Effects | effect, keying, distortion, noise | 21 |
| Time & Generate | time, generate | 6 |
| Text & Shape | text, shape | 19 |
| Composition | composition, precomp, project | 18 |
| Assets | import, footage | 11 |
| Properties | property, expression, mask | 10 |
| Render | render, mogrt | 13 |
| Media | marker, audio, color | 21 |
| Workflow | workflow, tracking, workflow-templates | 8 |
| AI Helper | (in registry) | 7 |

## AI Helper Actions (NEW)

| Action | Description |
|--------|-------------|
| `getLayerInfo` | Get layer type, capabilities, and compatible actions |
| `getActionInfo` | Get metadata for an action (layer type, category, manual steps) |
| `listTemplates` | List available workflow templates |
| `executeTemplate` | Execute a workflow template with parameters |
| `getSuggestions` | Get suggested next actions based on context |
| `getCategories` | Get all action categories with their actions |

## Workflow Templates

Pre-built action sequences by skill level:
- **Basic**: Text intro, slideshow
- **Intermediate**: Lower third, logo reveal, green screen
- **Advanced**: 3D scene, parallax, text animators
- **Professional**: Color grade, motion graphics, product showcase
- **VFX**: Screen replacement, tracking composite, stabilize & grade

## Action Metadata

Every action has metadata for AI guidance:

```javascript
{
    layerType: 'av' | 'text' | 'shape' | 'camera' | 'light' | 'audio' | 'effects' | 'visual' | 'any' | 'none',
    needsComp: true | false,
    needsLayer: true | false,
    category: 'camera' | 'effect' | 'text' | ...,
    manualStep: 'Click "Analyze" in Effect Controls' // optional
}
```

## Layer Type Detection

```javascript
// Get layer type as string
var type = LayerData.getLayerType(layer);
// Returns: 'camera', 'light', 'text', 'shape', 'null', 'solid', 'precomp', '3dmodel', 'av', 'unknown'

// Get full capabilities
var caps = LayerData.getLayerCapabilities(layer);
// Returns: { type, supportsEffects, supportsMasks, hasAudio, canTimeRemap, is3D, allowsNoiseGrain, ... }
```

## Error Handling

### Data Layer Returns
```javascript
{ comp: CompItem }     // or { error: "message" }
{ layer: Layer }       // or { error: "message" }
```

### Service Layer Returns
```javascript
{ success: true, layer: "name", ... }
{ success: false, error: "message" }
```

### Standard Pattern
```javascript
var compResult = CompositionData.getActiveComp();
if (compResult.error) return Utils.error(compResult.error);
var comp = compResult.comp;

var layerResult = LayerData.getLayer(comp, params);
if (layerResult.error) return Utils.error(layerResult.error);
var layer = layerResult.layer;

// Check layer type before applying AV-only effects
var type = LayerData.getLayerType(layer);
if (type !== 'av' && type !== 'solid' && type !== 'precomp') {
    return Utils.error('This effect requires an AV layer');
}

// ... implementation ...

return Utils.success({ layer: layer.name });
```

## Loading Order

Managed by `loader.jsx`:
1. `core/polyfills.jsx`
2. `core/utils.jsx`
3. `data/*.jsx` (5 files)
4. `domain/*.jsx` (4 files)
5. `services/*.jsx` (28 files)
6. `services/workflow-templates.jsx`
7. `services/action-registry.jsx` (last)

## Adding New Actions

1. Create method in `services/*-service.jsx`
2. Add metadata in `services/action-registry.jsx` actionMeta object
3. Register in `services/action-registry.jsx`:
   ```javascript
   ActionRegistry.register('actionName', ServiceName.methodName);
   ```
4. Add to `ALLOWED_ACTIONS` in `extension/js/main.js`

## Files to Keep in Sync

| File | Purpose |
|------|---------|
| `loader.jsx` | Load all modules in order |
| `services/action-registry.jsx` | Register all 158 actions + metadata |
| `../js/main.js` ALLOWED_ACTIONS | Whitelist for CEP bridge |

## Naming Conventions

- **Files**: lowercase-hyphen (e.g., `camera-service.jsx`)
- **Modules**: PascalCase (e.g., `CameraService`)
- **Functions**: camelCase (e.g., `addCamera`)
- **AE Properties**: Match names (e.g., `ADBE Transform Group`)

# Data Layer

Repository pattern for accessing After Effects API objects. **Depends on**: `Utils`

## Files

| File | Module | Description |
|------|--------|-------------|
| `composition-data.jsx` | `CompositionData` | Composition access and creation |
| `layer-data.jsx` | `LayerData` | Layer access, type detection, capabilities |
| `effect-data.jsx` | `EffectData` | Effect application and management |
| `property-data.jsx` | `PropertyData` | Property access and keyframe operations |
| `project-data.jsx` | `ProjectData` | Project item lookup by name/ID |

## Return Format

Data layer methods return `{ object }` or `{ error }` - NOT `{ success, ... }`:

```javascript
// CompositionData.getActiveComp()
{ comp: CompItem }     // Success
{ error: "message" }   // Failure

// LayerData.getLayer(comp, params)
{ layer: Layer }       // Success
{ error: "message" }   // Failure
```

## LayerData API (Extended)

### Basic Access
```javascript
LayerData.getLayer(comp, params)             // Get layer by index/name
LayerData.getLayerByNameOrIndex(comp, params)// Convenience wrapper
```

### Type Detection
```javascript
LayerData.isCamera(layer)      // Check if camera
LayerData.isLight(layer)       // Check if light
LayerData.isShape(layer)       // Check if shape layer
LayerData.isText(layer)        // Check if text layer
LayerData.isAVLayer(layer)     // Check if AV layer
LayerData.isNull(layer)        // Check if null object
LayerData.is3DModel(layer)     // Check if 3D model (GLB/GLTF)
LayerData.isSolid(layer)       // Check if solid
LayerData.isPrecomp(layer)     // Check if precomp
```

### Capabilities
```javascript
LayerData.supportsEffects(layer)  // Check effects support
LayerData.supportsMasks(layer)    // Check masks support
LayerData.hasAudio(layer)         // Check if has audio
LayerData.canTimeRemap(layer)     // Check if can time remap
```

### AI Guidance (NEW)
```javascript
// Get layer type as string
LayerData.getLayerType(layer)
// Returns: 'camera', 'light', 'text', 'shape', 'null', 'solid', 'precomp', '3dmodel', 'av', 'unknown'

// Get full capabilities object for AI decision making
LayerData.getLayerCapabilities(layer)
// Returns:
{
    type: 'text',
    supportsEffects: true,
    supportsMasks: true,
    hasAudio: false,
    canTimeRemap: false,
    is3D: false,
    allowsNoiseGrain: false,      // Only av/solid/precomp
    allowsKeying: false,          // Only av/precomp
    allowsDistortion: false,      // Only av/solid/precomp
    allowsTimeEffects: false,     // Only av/precomp
    allowsTextAnimators: true,    // Only text
    allowsShapeModifiers: false   // Only shape
}
```

### Transform
```javascript
LayerData.getTransform(layer)                // Get transform group
LayerData.setTransform(layer, transform)     // Set transform properties
```

### Creation
```javascript
LayerData.addSolid(comp, params)             // Add solid layer
LayerData.addNull(comp, name)                // Add null object
```

## Usage in Services

```javascript
var compResult = CompositionData.getActiveComp();
if (compResult.error) return Utils.error(compResult.error);
var comp = compResult.comp;

var layerResult = LayerData.getLayer(comp, { layerIndex: params.layerIndex });
if (layerResult.error) return Utils.error(layerResult.error);
var layer = layerResult.layer;

// NEW: Check layer type before applying effects
var caps = LayerData.getLayerCapabilities(layer);
if (!caps.allowsNoiseGrain) {
    return Utils.error('Noise/grain effects require AV layer. Current: ' + caps.type);
}
```

## CompositionData API

```javascript
CompositionData.getActiveComp()              // Get active composition
CompositionData.getCompInfo()                // Get detailed comp info
CompositionData.createComp(params)           // Create new composition
CompositionData.getRenderers()               // Get available renderers
```

## ProjectData API

```javascript
ProjectData.findItemByName(name, type)       // Find item by name, optional type filter
ProjectData.findItemById(id)                 // Find item by ID
ProjectData.findFootageItem(params)          // Find footage by itemName or itemId
ProjectData.findComp(params)                 // Find comp by compName or compId
ProjectData.getItemCounts()                  // Get counts by type
```

## Layer Type → Effect Compatibility Matrix

| Layer Type | Effects | Masks | Noise/Grain | Keying | Distortion | Time | Text Animators | Shape Modifiers |
|------------|---------|-------|-------------|--------|------------|------|----------------|-----------------|
| av         | ✅      | ✅    | ✅          | ✅     | ✅         | ✅   | ❌             | ❌              |
| solid      | ✅      | ✅    | ✅          | ❌     | ✅         | ❌   | ❌             | ❌              |
| precomp    | ✅      | ✅    | ✅          | ✅     | ✅         | ✅   | ❌             | ❌              |
| text       | ✅      | ✅    | ❌          | ❌     | ❌         | ❌   | ✅             | ❌              |
| shape      | ✅      | ✅    | ❌          | ❌     | ❌         | ❌   | ❌             | ✅              |
| camera     | ❌      | ❌    | ❌          | ❌     | ❌         | ❌   | ❌             | ❌              |
| light      | ❌      | ❌    | ❌          | ❌     | ❌         | ❌   | ❌             | ❌              |
| null       | ❌      | ❌    | ❌          | ❌     | ❌         | ❌   | ❌             | ❌              |
| 3dmodel   | ❌*     | ❌    | ❌          | ❌     | ❌         | ❌   | ❌             | ❌              |

*3D models must be precomposed first to apply effects

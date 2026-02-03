# Domain Layer

Business logic entities and domain-specific operations. **Depends on**: `Utils`

## Files

| File | Module | Description |
|------|--------|-------------|
| `camera.jsx` | `CameraDomain` | Camera presets and calculations |
| `light.jsx` | `LightDomain` | Light rig configurations |
| `material.jsx` | `MaterialDomain` | 3D material presets |
| `animation.jsx` | `AnimationDomain` | Animation curves and easing |

## Purpose

Domain modules contain:
- Preset configurations (camera types, light rigs, materials)
- Pure calculations (no AE API calls)
- Domain-specific constants and mappings

## CameraDomain

```javascript
CameraDomain.PRESETS          // Camera focal length presets
CameraDomain.DOF_SETTINGS     // Depth of field configurations
CameraDomain.calculateFOV()   // Field of view calculations
```

## LightDomain

```javascript
LightDomain.THREE_POINT_RIG   // Key, fill, rim light positions
LightDomain.STUDIO_PRESETS    // Studio lighting configurations
LightDomain.calculateFalloff()// Light falloff calculations
```

## MaterialDomain

```javascript
MaterialDomain.METAL_PRESETS  // Gold, silver, bronze settings
MaterialDomain.GLASS_PRESETS  // Glass material settings
MaterialDomain.getPreset()    // Get material by name
```

## AnimationDomain

```javascript
AnimationDomain.EASING        // Easing curve definitions
AnimationDomain.createEase()  // Create KeyframeEase objects
AnimationDomain.applyEasing() // Apply easing to keyframes
```

## Usage

Domain modules are used by Service layer to get configuration values:

```javascript
// In CameraService
var preset = CameraDomain.PRESETS[params.type];
var focalLength = preset.focalLength;
```

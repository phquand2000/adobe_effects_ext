# Services Layer

Action handlers that orchestrate data and domain layers. **Depends on**: `Utils`, `CompositionData`, `LayerData`, `EffectData`, `PropertyData`, Domain modules

## Overview

- **29 service files** (28 functional + action-registry)
- **158 registered actions**
- All use IIFE module pattern
- All return `Utils.success()` or `Utils.error()`

## Action Metadata System (NEW)

Every action now has metadata for AI guidance:

```javascript
{
    layerType: 'av',           // Required layer type
    needsComp: true,           // Requires active composition
    needsLayer: true,          // Requires layer selection
    category: 'effect',        // Action category
    manualStep: 'Click...'     // Manual step required (optional)
}
```

### Layer Type Values
| Value | Description |
|-------|-------------|
| `none` | Action creates layers or is project-level |
| `any` | Works on any layer |
| `av` | Requires AV layer (footage, solid, precomp) |
| `text` | Requires text layer |
| `shape` | Requires shape layer |
| `camera` | Requires camera layer |
| `light` | Requires light layer |
| `audio` | Requires layer with audio |
| `effects` | Any layer that supports effects (not camera/light) |
| `visual` | Any visual layer (not camera/light) |

## ActionRegistry API (Enhanced)

```javascript
// Basic
ActionRegistry.register(name, handler, schema)
ActionRegistry.execute(actionName, params)
ActionRegistry.exists(name)
ActionRegistry.list()

// NEW: Metadata access
ActionRegistry.getMeta(name)                    // Get action metadata
ActionRegistry.getByCategory(category)          // Get actions in category
ActionRegistry.getCompatibleActions(layerType)  // Get actions for layer type
ActionRegistry.getCategories()                  // Get all categories

// NEW: Validated execution
ActionRegistry.executeWithValidation(actionName, params)
// Validates layer type before execution, returns warnings for manual steps
```

## Service Files

### Camera & Lighting (2 services, 9 actions)
| Service | Actions |
|---------|---------|
| `camera-service.jsx` | addCamera, setupDOF, setCameraIris, animateFocusRack, focusOnLayer |
| `light-service.jsx` | addLightRig, setLightFalloff, addEnvironmentLight, setupShadows |

### Layer Operations (2 services, 15 actions)
| Service | Actions |
|---------|---------|
| `layer-service.jsx` | setup3DLayer, enableMotionBlur, addShadowCatcher, addNullController, parentLayers, unparentLayer |
| `layer-utils-service.jsx` | duplicateLayer, splitLayer, timeRemapLayer, timeStretchLayer, setCollapseTransformations, setLayerBlendingMode, setLayerQuality, freezeFrame, reverseLayer |

### Effects (4 services, 21 actions)
| Service | Actions |
|---------|---------|
| `effect-service.jsx` | applyGlow, applyBlur, applyLumetri, applyVibrance, applyCurves, addEffect, setEffectProperty, applyBilateralBlur, applyCompoundBlur, applyVectorBlur |
| `keying-service.jsx` | applyKeylight, applySpillSuppressor, applyKeyCleaner, applyKeyingPreset |
| `distortion-service.jsx` | applyWarpStabilizer*, applyCornerPin, applyDisplacementMap, applyMeshWarp, applyBezierWarp |
| `noise-service.jsx` | applyFractalNoise, applyMatchGrain*, applyAddGrain |

*Requires manual step

### Time & Generate (3 services, 6 actions)
| Service | Actions |
|---------|---------|
| `time-service.jsx` | applyTimewarp, applyPixelMotionBlur, applyPosterizeTime |
| `generate-service.jsx` | applyGradientRamp, applyFill, apply4ColorGradient |

### Text & Shape (2 services, 19 actions)
| Service | Actions |
|---------|---------|
| `text-service.jsx` | addTextLayer, updateText, addTextAnimator, addRangeSelector, addWigglySelector, setPerCharacter3D, setTextTracking |
| `shape-service.jsx` | addShapeLayer, addTrimPaths, addRepeater, addGradientFill, addGradientStroke, addMergePaths, addOffsetPaths, addRoundCorners, addZigZag, addPuckerBloat, addTwist, addWigglePath |

### Composition & Project (3 services, 18 actions)
| Service | Actions |
|---------|---------|
| `composition-service.jsx` | createComp, getCompInfo, getProjectInfo, getRenderers, setupAdvanced3D |
| `precomp-service.jsx` | precompose, duplicateComp, openCompViewer, replaceCompSource, nestComp |
| `project-service.jsx` | getProjectSettings, setProjectSettings, saveProject, closeProject, createFolder, organizeProjectItems, getProjectReport, reduceProject |

### Assets & Footage (2 services, 11 actions)
| Service | Actions |
|---------|---------|
| `import-service.jsx` | importAssets, importWithDialog, import3DModel, listProjectItems |
| `footage-service.jsx` | replaceFootage, relinkFootage, interpretFootage, setProxy, collectFiles, removeUnused, findMissingFootage |

### Properties & Expressions (3 services, 10 actions)
| Service | Actions |
|---------|---------|
| `property-service.jsx` | setProperty, getProperty, addKeyframe, animateProperty |
| `expression-service.jsx` | applyExpression, removeExpression, applyExpressionPreset |
| `mask-service.jsx` | addMask, setTrackMatte, removeTrackMatte |

### Render & Output (2 services, 13 actions)
| Service | Actions |
|---------|---------|
| `render-service.jsx` | addToRenderQueue, listRenderTemplates, startRender, captureFrame, captureFrameOptimized, setOutputModule, batchRenderComps, setRenderRegion, setRenderSettings, getRenderStatus, clearRenderQueue |
| `mogrt-service.jsx` | exportMOGRT, addToEssentialGraphics |

### Media Features (3 services, 21 actions)
| Service | Actions |
|---------|---------|
| `marker-service.jsx` | addCompMarker, addLayerMarker, getCompMarkers, getLayerMarkers, removeMarker, updateMarker, addMarkersFromArray |
| `audio-service.jsx` | setAudioLevel, fadeAudioIn, fadeAudioOut, muteLayer, soloAudio, setAudioKeyframe, getAudioInfo |
| `color-service.jsx` | setProjectColorDepth, setProjectWorkingSpace, applyLUT, applyColorProfileConverter, setLinearizeWorkingSpace, setCompensateForSceneReferredProfiles, applyColorBalance, applyPhotoFilter |

### Workflow & Integration (3 services, 8 actions)
| Service | Actions |
|---------|---------|
| `workflow-service.jsx` | animateCoin, createCoinTransition, positionFromAnalysis, applyColorMatch |
| `tracking-service.jsx` | setup3DCameraTracker*, linkToTrackPoint |
| `workflow-templates.jsx` | (provides template system, not direct actions) |

### AI Helper Actions (6 actions)
Registered directly in action-registry.jsx:
| Action | Description |
|--------|-------------|
| `getLayerInfo` | Get layer type, capabilities, and compatible actions |
| `getActionInfo` | Get metadata for an action |
| `listTemplates` | List workflow templates |
| `executeTemplate` | Execute a workflow template |
| `getSuggestions` | Get suggested next actions |
| `getCategories` | Get all categories with actions |

### Registry (1 file)
| File | Purpose |
|------|---------|
| `action-registry.jsx` | Maps action names to service methods with metadata |

### Additional Actions (1)
| Action | Purpose |
|--------|---------|
| `testScript` | Test/debug action for development |

## Workflow Templates (NEW)

Pre-built action sequences for common tasks:

### Skill Levels
| Level | Templates |
|-------|-----------|
| Basic | basicTextIntro, basicSlideshow |
| Intermediate | lowerThird, logoReveal, greenScreenBasic |
| Advanced | scene3DSetup, parallaxSlideshow, textAnimatorReveal |
| Professional | colorGradePro, motionGraphicsIntro, productShowcase |
| VFX | screenReplacement, compositeWithTracking, cleanPlate, stabilizeAndGrade |

### Usage
```javascript
// List all templates
ActionRegistry.execute('listTemplates', {});

// Execute a template
ActionRegistry.execute('executeTemplate', {
    templateId: 'lowerThird',
    name: 'John Doe',
    title: 'Software Engineer',
    compName: 'My Lower Third'
});
```

## Service Pattern

```javascript
var ServiceName = (function() {
    
    function actionName(params) {
        var compResult = CompositionData.getActiveComp();
        if (compResult.error) return Utils.error(compResult.error);
        var comp = compResult.comp;
        
        var layerResult = LayerData.getLayer(comp, params);
        if (layerResult.error) return Utils.error(layerResult.error);
        var layer = layerResult.layer;
        
        // NEW: Optional layer type check
        var caps = LayerData.getLayerCapabilities(layer);
        if (!caps.allowsNoiseGrain) {
            return Utils.error('This effect requires AV layer');
        }
        
        // ... implementation ...
        
        return Utils.success({ layer: layer.name });
    }
    
    return {
        actionName: actionName
    };
})();
```

## Adding New Actions

1. Create method in appropriate service file
2. Add metadata to `actionMeta` in `action-registry.jsx`:
   ```javascript
   newAction: { layerType: 'av', needsComp: true, needsLayer: true, category: 'effect' }
   ```
3. Register in `action-registry.jsx`:
   ```javascript
   ActionRegistry.register('newAction', ServiceName.newAction);
   ```
4. Add to `ALLOWED_ACTIONS` in `extension/js/main.js`

## Actions Requiring Manual Steps

| Action | Manual Step |
|--------|-------------|
| `applyWarpStabilizer` | Click "Analyze" in Effect Controls |
| `setup3DCameraTracker` | Click "Analyze", then create Track Null/Camera |
| `applyMatchGrain` | Click "Take Sample" in Effect Controls |

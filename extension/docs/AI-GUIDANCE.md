# AI Guidance for AE AI Assistant

Comprehensive guide for AI to effectively use 158 actions across 29 services.

## Core Principle: Layer Type Awareness

**Before applying any effect, determine the layer type.** Different layers support different actions.

---

## Layer Type Matrix

### 1. Text Layers (TextLayer)
```
Creates: addTextLayer
Modifies: updateText, addTextAnimator, addRangeSelector, addWigglySelector, 
          setPerCharacter3D, setTextTracking
Supports: Most visual effects, masks, expressions
```

### 2. Shape Layers (ShapeLayer)
```
Creates: addShapeLayer
Modifies: addTrimPaths, addRepeater, addGradientFill, addGradientStroke,
          addMergePaths, addOffsetPaths, addRoundCorners, addZigZag,
          addPuckerBloat, addTwist, addWigglePath
Supports: Visual effects, masks, expressions
⚠️ Does NOT support: Noise/Grain effects (Fractal Noise, Add Grain, Match Grain)
```

### 3. AV Layers (Footage/Solids/Precomps)
```
Supports ALL effects including:
- Noise/Grain: applyFractalNoise, applyAddGrain, applyMatchGrain
- Keying: applyKeylight, applySpillSuppressor, applyKeyCleaner, applyKeyingPreset
- Distortion: applyWarpStabilizer*, applyCornerPin, applyDisplacementMap, 
              applyMeshWarp, applyBezierWarp
- Time: applyTimewarp, applyPixelMotionBlur, applyPosterizeTime
- Tracking: setup3DCameraTracker*

* = Requires manual step (Analyze button)
```

### 4. Camera Layers
```
Creates: addCamera
Modifies: setupDOF, setCameraIris, animateFocusRack, focusOnLayer
⚠️ Does NOT support: Effects, masks, track mattes
```

### 5. Light Layers
```
Creates: addLightRig, addEnvironmentLight
Modifies: setLightFalloff
Related: setupShadows (affects 3D layers receiving shadows)
⚠️ Does NOT support: Effects, masks, track mattes
```

### 6. Null Objects
```
Creates: addNullController
Use for: Parent/child hierarchies, expression controllers
```

### 7. 3D Model Layers (GLB/GLTF)
```
Import: import3DModel
⚠️ Does NOT support: Direct effects application
Workaround: Precomp the model, apply effects to precomp
```

---

## Professional Workflow Order

AI should follow this sequence for optimal results:

```
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 1: PROJECT SETUP                                          │
├─────────────────────────────────────────────────────────────────┤
│ 1. setProjectSettings (bit depth, color space)                  │
│ 2. setProjectColorDepth (8/16/32 bit)                          │
│ 3. setProjectWorkingSpace (sRGB, Rec.709, ACEScg, etc.)        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 2: IMPORT ASSETS                                          │
├─────────────────────────────────────────────────────────────────┤
│ 1. importAssets / importWithDialog                              │
│ 2. interpretFootage (frame rate, alpha, field order)           │
│ 3. import3DModel (for GLB/GLTF files)                          │
│ 4. createFolder + organizeProjectItems                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 3: COMPOSITION                                            │
├─────────────────────────────────────────────────────────────────┤
│ 1. createComp (match footage dimensions or custom)             │
│ 2. Add layers to comp (footage, shapes, text)                  │
│ 3. Arrange layer order (z-index)                               │
│ 4. Set in/out points, splitLayer, timeStretchLayer             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 4: ANIMATION & RIGGING                                    │
├─────────────────────────────────────────────────────────────────┤
│ 1. addNullController (for rig control)                         │
│ 2. parentLayers (build hierarchy)                              │
│ 3. addKeyframe / animateProperty                               │
│ 4. applyExpression / applyExpressionPreset                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 5: 3D SETUP (if needed)                                   │
├─────────────────────────────────────────────────────────────────┤
│ 1. setupAdvanced3D (enable Cinema 4D/Advanced 3D renderer)     │
│ 2. setup3DLayer (convert layers to 3D)                         │
│ 3. addCamera                                                    │
│ 4. setupDOF (optional depth of field)                          │
│ 5. addLightRig (key, fill, rim lights)                         │
│ 6. setupShadows                                                 │
│ 7. addShadowCatcher (for ground plane)                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 6: COMPOSITING & EFFECTS                                  │
├─────────────────────────────────────────────────────────────────┤
│ Order matters! Apply in this sequence:                          │
│ 1. Keying (applyKeyingPreset → applySpillSuppressor)           │
│ 2. Cleanup (applyKeyCleaner)                                   │
│ 3. Tracking/Stabilization (applyWarpStabilizer* → manual)      │
│ 4. Distortion (applyCornerPin, applyBezierWarp)                │
│ 5. Blur/Glow (applyBlur, applyGlow)                            │
│ 6. Stylization (addEffect for custom)                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 7: COLOR GRADING                                          │
├─────────────────────────────────────────────────────────────────┤
│ 1. applyLumetri (primary correction)                           │
│ 2. applyCurves (fine-tuning)                                   │
│ 3. applyColorBalance / applyPhotoFilter                        │
│ 4. applyLUT (creative look)                                    │
│ 5. applyVibrance                                               │
│ 6. applyColorMatch (match to reference footage)                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 8: AUDIO                                                  │
├─────────────────────────────────────────────────────────────────┤
│ 1. setAudioLevel (adjust volume dB)                            │
│ 2. fadeAudioIn / fadeAudioOut                                  │
│ 3. setAudioKeyframe (for dynamic changes)                      │
│ 4. muteLayer / soloAudio (for mixing)                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 9: FINISHING                                              │
├─────────────────────────────────────────────────────────────────┤
│ 1. enableMotionBlur (for animated layers)                      │
│ 2. applyAddGrain / applyMatchGrain (film texture)              │
│ 3. addCompMarker / addLayerMarker (for notes/chapters)         │
│ 4. precompose (organize complex setups)                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 10: RENDER                                                │
├─────────────────────────────────────────────────────────────────┤
│ 1. addToRenderQueue                                             │
│ 2. setRenderSettings (quality, resolution)                     │
│ 3. setOutputModule (format: H.264, ProRes, EXR)                │
│ 4. startRender                                                  │
│                                                                 │
│ Alternatives:                                                   │
│ - captureFrame / captureFrameOptimized (single frame)          │
│ - batchRenderComps (multiple comps)                            │
│ - exportMOGRT (Motion Graphics Template)                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Intent → Action Routing

| User Says | AI Should Use |
|-----------|---------------|
| "Create a composition" | `createComp` |
| "Import video/image" | `importAssets` |
| "Add text" | `addTextLayer` |
| "Animate text letters" | `addTextAnimator` + `addRangeSelector` |
| "Create shape" | `addShapeLayer` |
| "Animate shape stroke" | `addTrimPaths` |
| "Make layer 3D" | `setup3DLayer` |
| "Add camera" | `addCamera` |
| "Add lighting" | `addLightRig` |
| "Stabilize footage" | `applyWarpStabilizer` ⚠️ manual analyze |
| "Track camera motion" | `setup3DCameraTracker` ⚠️ manual analyze |
| "Remove green screen" | `applyKeyingPreset` or `applyKeylight` |
| "Slow motion" | `applyTimewarp` or `timeRemapLayer` |
| "Speed ramp" | `timeRemapLayer` + keyframes |
| "Add blur" | `applyBlur` |
| "Add glow" | `applyGlow` |
| "Color grade" | `applyLumetri` or `applyCurves` |
| "Apply LUT" | `applyLUT` |
| "Add film grain" | `applyAddGrain` (AV layers only) |
| "Match grain" | `applyMatchGrain` ⚠️ manual sample |
| "Add expression" | `applyExpression` |
| "Wiggle animation" | `applyExpressionPreset` with type "wiggle" |
| "Parent layers" | `addNullController` + `parentLayers` |
| "Precompose" | `precompose` |
| "Render video" | `addToRenderQueue` + `setOutputModule` + `startRender` |
| "Export frame" | `captureFrame` or `captureFrameOptimized` |

---

## Actions Requiring Manual Steps

These actions apply effects that need user interaction in After Effects:

| Action | Manual Step Required |
|--------|---------------------|
| `applyWarpStabilizer` | Click "Analyze" in Effect Controls |
| `setup3DCameraTracker` | Click "Analyze", then create Track Null/Camera |
| `applyMatchGrain` | Click "Take Sample" in Effect Controls |

**AI should inform the user** about these manual steps after executing the action.

---

## Common Pitfalls & Guardrails

### 1. Layer Index Fragility
```
❌ Problem: Layer indices change when adding/removing layers
✅ Solution: Use layerName parameter when possible, or re-query with getCompInfo
```

### 2. 3D Model Layers
```
❌ Problem: Cannot apply effects directly to 3D model layers
✅ Solution: 
   1. precompose the 3D model layer
   2. Apply effects to the precomp
   OR
   1. Add adjustment layer above
   2. Apply effects to adjustment layer
```

### 3. Track Matte Order
```
❌ Problem: Track matte not working
✅ Solution: Matte layer must be DIRECTLY ABOVE target layer
   Layer 1: Matte layer
   Layer 2: Target layer (set track matte to "Alpha Matte 'Matte layer'")
```

### 4. Time Remap Restrictions
```
❌ Problem: timeRemapLayer fails
✅ Solution: Only works on layers with canSetTimeRemapEnabled = true
   - Works: Footage, precomps
   - Fails: Cameras, lights, null objects
```

### 5. Noise Effects on Wrong Layer Types
```
❌ Problem: applyFractalNoise, applyAddGrain, applyMatchGrain fail on shape layers
✅ Solution: Only apply to AV layers (footage, solids, precomps)
```

### 6. Expression Reference Errors
```
❌ Problem: Expressions break when layer/property names change
✅ Solution: Use index-based references or verify names before applying
```

### 7. Color Management
```
❌ Problem: Colors look different in render
✅ Solution: Set color space early with setProjectWorkingSpace before importing
```

---

## Effect Categories by Layer Support

### ✅ Universal (All visual layers)
- Transform: setProperty for Position, Scale, Rotation, Opacity
- Masks: addMask, setTrackMatte
- Expressions: applyExpression, applyExpressionPreset

### ✅ Effects-Capable Layers (AV, Text, Shape - NOT Camera/Light)
- Blur: applyBlur, applyBilateralBlur
- Stylize: applyGlow
- Color: applyLumetri, applyCurves, applyVibrance, applyColorBalance
- Generate: applyGradientRamp, applyFill, apply4ColorGradient

### ⚠️ AV Layers Only (Footage, Solids, Precomps)
- Noise: applyFractalNoise, applyAddGrain, applyMatchGrain
- Keying: applyKeylight, applySpillSuppressor, applyKeyCleaner
- Distortion: applyWarpStabilizer, applyCornerPin, applyDisplacementMap
- Time: applyTimewarp, applyPixelMotionBlur, applyPosterizeTime
- Tracking: setup3DCameraTracker

### 📝 Text Layers Only
- addTextAnimator, addRangeSelector, addWigglySelector
- setPerCharacter3D, setTextTracking, updateText

### 🔷 Shape Layers Only
- addTrimPaths, addRepeater, addMergePaths
- addGradientFill, addGradientStroke
- addOffsetPaths, addRoundCorners, addZigZag
- addPuckerBloat, addTwist, addWigglePath

### 🎥 Camera Layers Only
- setupDOF, setCameraIris, animateFocusRack, focusOnLayer

### 💡 Light Layers Only
- setLightFalloff (addLightRig creates lights)

### 🔊 Audio-Capable Layers Only
- setAudioLevel, fadeAudioIn, fadeAudioOut
- muteLayer, soloAudio, setAudioKeyframe, getAudioInfo

---

## Quick Decision Tree

```
User wants to apply effect
         │
         ▼
    Get layer type
    (getCompInfo)
         │
         ├─── Camera/Light? ──► Only camera/light actions
         │
         ├─── 3D Model? ──► Precomp first, then apply effects
         │
         ├─── Shape layer? ──► Use shape modifiers OR general effects
         │                     ❌ No noise/grain/keying/distortion
         │
         ├─── Text layer? ──► Use text animators OR general effects
         │                    ❌ No noise/grain/keying/distortion
         │
         └─── AV layer? ──► ✅ All effects supported
              (footage/solid/precomp)
```

---

## Example Workflows

### Basic: Text Animation
```json
{"action": "createComp", "params": {"name": "Text Comp", "width": 1920, "height": 1080}}
{"action": "addTextLayer", "params": {"text": "Hello World", "fontSize": 120}}
{"action": "addTextAnimator", "params": {"layerIndex": 1, "property": "opacity"}}
{"action": "addRangeSelector", "params": {"layerIndex": 1, "animatorIndex": 1, "start": 0, "end": 100}}
```

### Intermediate: Green Screen Keying
```json
{"action": "importAssets", "params": {"paths": ["/path/to/greenscreen.mp4"]}}
{"action": "createComp", "params": {"name": "Keyed Comp", "fromFootage": "greenscreen.mp4"}}
{"action": "applyKeyingPreset", "params": {"layerIndex": 1, "preset": "greenScreen"}}
{"action": "applyLumetri", "params": {"layerIndex": 1, "contrast": 10}}
```

### Advanced: 3D Scene
```json
{"action": "createComp", "params": {"name": "3D Scene", "width": 1920, "height": 1080}}
{"action": "setupAdvanced3D", "params": {}}
{"action": "addShapeLayer", "params": {"shape": "rectangle", "size": [500, 500]}}
{"action": "setup3DLayer", "params": {"layerIndex": 1}}
{"action": "addCamera", "params": {"preset": "35mm"}}
{"action": "addLightRig", "params": {"includeRim": true}}
{"action": "setupDOF", "params": {"aperture": 50, "blurLevel": 100}}
{"action": "addShadowCatcher", "params": {"rotationX": 90}}
```

### Professional: Color Match + Grain
```json
{"action": "applyLumetri", "params": {"layerIndex": 1, "exposure": 0.2, "contrast": 15}}
{"action": "applyCurves", "params": {"layerIndex": 1}}
{"action": "applyLUT", "params": {"layerIndex": 1, "lutPath": "/path/to/look.cube"}}
{"action": "applyAddGrain", "params": {"layerIndex": 1, "intensity": 0.3, "size": 1.5}}
```

---

## Version Notes

- **AE 2025 (v26.0)**: Effect match names updated
  - Fractal Noise: `ADBE Fractal Noise` (was `ADBE AIF Perlin Noise 3`)
  - Add Grain: `VISINF Grain Implant` (was `ADBE Add Grain`)
  - Match Grain: `VISINF Grain Duplication` (was `ADBE Match Grain`)
  - Services include fallback for older versions

---

*Last updated: January 2026*
*Total Actions: 158 | Services: 29*

# Frontend (CEP Panel)

JavaScript frontend for the AE AI Assistant CEP extension.

## Files

| File | Purpose |
|------|---------|
| `main.js` | Main entry point, UI handlers, CEP bridge |
| `ai-client.js` | AI API client for chat and vision analysis |
| `config.js` | Configuration and settings management |
| `CSInterface.js` | Adobe CEP interface library |

## Architecture

The frontend communicates with ExtendScript via CEP's `csInterface.evalScript()`.

```
main.js → CSInterface → loader.jsx → ActionRegistry → Services
```

## Security

### Action Whitelist
All actions must be in the `ALLOWED_ACTIONS` Set (lines 246-340) before they can be executed.
Currently **158 actions** are whitelisted.

### Script Loading
The frontend loads `jsx/loader.jsx` which initializes the modular ExtendScript system.

## Key Functions

| Function | Purpose |
|----------|---------|
| `executeAction(action, params)` | Execute an ExtendScript action |
| `tryParseAndExecute(content)` | Parse AI response for action JSON |
| `handleQuickAction(action)` | Handle sidebar quick action buttons |

## AI Helper Actions (NEW)

These actions help AI make better decisions:

| Action | Purpose |
|--------|---------|
| `getLayerInfo` | Get layer capabilities and compatible actions |
| `getActionInfo` | Get action metadata (layer type, manual steps) |
| `listTemplates` | List workflow templates by level |
| `executeTemplate` | Execute pre-built workflow template |
| `getSuggestions` | Get suggested next actions |
| `getCategories` | Get all action categories |

### Usage Pattern for AI
```javascript
// 1. Check layer before applying effect
const layerInfo = await executeAction('getLayerInfo', { layerIndex: 1 });
if (!layerInfo.capabilities.allowsNoiseGrain) {
    // Don't try to apply grain effects
}

// 2. Get suggestions for next action
const suggestions = await executeAction('getSuggestions', { 
    lastAction: 'addCamera',
    layerType: 'camera'
});

// 3. Execute workflow template
const result = await executeAction('executeTemplate', {
    templateId: 'lowerThird',
    name: 'John Doe',
    title: 'CEO'
});
```

## Adding New Actions

1. Implement in `jsx/services/*-service.jsx`
2. Add metadata to `actionMeta` in `jsx/services/action-registry.jsx`
3. Register in `jsx/services/action-registry.jsx`
4. Add to `ALLOWED_ACTIONS` Set in `main.js`

## Workflow Templates

The extension includes pre-built workflows:

| Level | Templates |
|-------|-----------|
| Basic | Text intro, slideshow |
| Intermediate | Lower third, logo reveal, green screen |
| Advanced | 3D scene, parallax, text animators |
| Professional | Color grade, motion graphics, product showcase |
| VFX | Screen replacement, tracking composite |

## Action Categories

Actions are organized by category for AI routing:

- `camera` - Camera creation and settings
- `light` - Lighting setup
- `layer` - Layer manipulation
- `effect` - Visual effects
- `color` - Color grading
- `text` - Text layers and animators
- `shape` - Shape layers and modifiers
- `keying` - Chroma key/green screen
- `distortion` - Warp and distortion
- `noise` - Noise and grain effects
- `time` - Time effects (slow-mo, etc)
- `generate` - Generate effects
- `property` - Property manipulation
- `expression` - Expressions
- `mask` - Masks and track mattes
- `audio` - Audio manipulation
- `render` - Render queue
- `import` - Asset import
- `footage` - Footage management
- `composition` - Comp management
- `precomp` - Precomposition
- `project` - Project settings
- `mogrt` - Motion Graphics Templates
- `marker` - Markers
- `workflow` - Workflow automation
- `tracking` - Motion tracking

# AE AI Assistant

<p align="center">
  <img src="https://img.shields.io/badge/After%20Effects-2026+-9999FF?style=for-the-badge&logo=adobe-after-effects&logoColor=white" alt="After Effects">
  <img src="https://img.shields.io/badge/CEP-12.0-00D8FF?style=for-the-badge" alt="CEP Version">
  <img src="https://img.shields.io/badge/Actions-158-green?style=for-the-badge" alt="Actions">
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="License">
</p>

<p align="center">
  <b>AI-powered automation panel for Adobe After Effects</b><br>
  Advanced 3D VFX workflows • Native .glb/.gltf support • PBR Materials • Camera Tracking
</p>

---

## ✨ Features

- **🤖 AI Integration** - Natural language commands via AI API
- **🎬 29 Services** - Camera, lighting, effects, tracking, rendering & more
- **⚡ 158 Actions** - Pre-built automation for common VFX tasks
- **🎲 3D Support** - Native .glb/.gltf import, PBR materials, 3D camera
- **🎯 Camera Tracker** - Motion tracking integration
- **🌀 Motion Blur & DOF** - Professional depth of field and blur
- **📦 Workflow Templates** - From basic to professional VFX pipelines

## 📦 Installation

### macOS

1. **Download** or clone this repository
2. **Copy** the entire folder to:
   ```
   ~/Library/Application Support/Adobe/CEP/extensions/com.aeai.assistant
   ```
3. **Enable debug mode** (for unsigned extensions):
   ```bash
   defaults write com.adobe.CSXS.12 PlayerDebugMode 1
   ```
4. **Restart** After Effects
5. Open panel: **Window → Extensions → AE AI Assistant**

### Windows

1. **Download** or clone this repository
2. **Copy** the entire folder to:
   ```
   C:\Users\<username>\AppData\Roaming\Adobe\CEP\extensions\com.aeai.assistant
   ```
3. **Enable debug mode** (for unsigned extensions):
   - Open Registry Editor (`regedit`)
   - Navigate to: `HKEY_CURRENT_USER\SOFTWARE\Adobe\CSXS.12`
   - Create DWORD value: `PlayerDebugMode` = `1`
4. **Restart** After Effects
5. Open panel: **Window → Extensions → AE AI Assistant**

### Quick Install Script

**macOS:**
```bash
mkdir -p ~/Library/Application\ Support/Adobe/CEP/extensions
cp -r . ~/Library/Application\ Support/Adobe/CEP/extensions/com.aeai.assistant
defaults write com.adobe.CSXS.12 PlayerDebugMode 1
```

**Windows (PowerShell):**
```powershell
$dest = "$env:APPDATA\Adobe\CEP\extensions\com.aeai.assistant"
New-Item -ItemType Directory -Force -Path $dest
Copy-Item -Recurse -Force * $dest
reg add "HKCU\SOFTWARE\Adobe\CSXS.12" /v PlayerDebugMode /t REG_DWORD /d 1 /f
```

## 🛠️ Development Setup

### Prerequisites

- Adobe After Effects 2026+ (v26.0+)
- Node.js 18+ (for dev tools)
- CEP debugging enabled

### Project Structure

```
├── CSXS/
│   └── manifest.xml      # Extension manifest
├── css/
│   └── style.css         # Panel styling
├── js/
│   ├── CSInterface.js    # Adobe CEP library
│   ├── ai-client.js      # AI API client
│   ├── config.js         # Configuration
│   └── main.js           # Panel controller
├── jsx/
│   ├── core/             # Polyfills & utilities
│   ├── data/             # AE API access layer
│   ├── domain/           # Business logic
│   ├── services/         # 29 service modules
│   ├── hostscript.jsx    # Entry point
│   └── loader.jsx        # Module loader
├── index.html            # Panel UI
└── package.json
```

### Development Workflow

1. **Clone & install:**
   ```bash
   git clone https://github.com/phquand2000/adobe_effects_ext.git
   cd adobe_effects_ext
   npm install
   ```

2. **Symlink for development (macOS):**
   ```bash
   ln -s "$(pwd)" ~/Library/Application\ Support/Adobe/CEP/extensions/com.aeai.assistant
   ```

3. **Symlink for development (Windows - Admin PowerShell):**
   ```powershell
   cmd /c mklink /D "$env:APPDATA\Adobe\CEP\extensions\com.aeai.assistant" (Get-Location)
   ```

4. **Enable CEP debugging:**
   - Edit `.debug` file for remote debugging
   - Access Chrome DevTools at `http://localhost:8088`

5. **Hot reload:**
   - Use the reload script or press `Ctrl+Shift+R` in panel

### ExtendScript Guidelines

> ⚠️ ExtendScript uses ECMAScript 3 (ES3) - No modern JavaScript features!

```javascript
// ❌ NOT supported
const x = 1;
let y = 2;
const fn = () => {};
`template ${literal}`;

// ✅ Use instead
var x = 1;
var y = 2;
var fn = function() {};
'string ' + variable;
```

### Adding New Actions

1. Create method in `jsx/services/*-service.jsx`
2. Add metadata in `jsx/services/action-registry.jsx`
3. Register the action:
   ```javascript
   ActionRegistry.register('actionName', ServiceName.methodName);
   ```
4. Add to `ALLOWED_ACTIONS` in `js/main.js`

## 🚀 Usage

### Quick Actions

| Action | Description |
|--------|-------------|
| 📦 Import | Import assets (.glb, .gltf, videos, images) |
| 🎬 New Comp | Create new composition |
| 🎲 3D Setup | Configure 3D environment |
| 📷 Camera | Add and configure cameras |
| 💡 Lights | Add lighting rigs |
| 🌀 Blur | Motion blur settings |
| 🎯 Tracker | 3D camera tracking |
| 🌑 Shadow | Shadow catcher setup |
| 👁️ Analyze | Analyze current frame |

### AI Commands

Connect to an AI API (OpenAI compatible) and use natural language:

- *"Add a 3D camera with depth of field"*
- *"Create a text layer with fade in animation"*
- *"Apply color correction to selected layer"*
- *"Set up a three-point lighting rig"*

### Workflow Templates

Pre-built automation sequences:
- **Basic**: Text intro, slideshow
- **Intermediate**: Lower third, logo reveal, green screen
- **Advanced**: 3D scene, parallax, text animators
- **Professional**: Color grade, motion graphics
- **VFX**: Screen replacement, tracking composite

## 📋 Requirements

| Component | Version |
|-----------|---------|
| After Effects | 2026+ (v26.0) |
| CEP Runtime | 12.0+ |
| macOS | 10.15+ |
| Windows | 10/11 |

## 🔧 Configuration

In the panel sidebar, configure:

- **API URL**: Your AI server endpoint (e.g., `http://localhost:8317/v1`)
- **API Key**: Your API authentication key

Settings are persisted locally.

## 📚 Services Reference

| Category | Services | Actions |
|----------|----------|---------|
| Camera & Light | `camera`, `light` | 9 |
| Layer | `layer`, `layer-utils` | 15 |
| Effects | `effect`, `keying`, `distortion`, `noise` | 21 |
| Time & Generate | `time`, `generate` | 6 |
| Text & Shape | `text`, `shape` | 19 |
| Composition | `composition`, `precomp`, `project` | 18 |
| Assets | `import`, `footage` | 11 |
| Properties | `property`, `expression`, `mask` | 10 |
| Render | `render`, `mogrt` | 13 |
| Media | `marker`, `audio`, `color` | 21 |
| Workflow | `workflow`, `tracking` | 8 |

## 🐛 Troubleshooting

### Extension not appearing

1. Verify debug mode is enabled
2. Check extension path is correct
3. Restart After Effects completely
4. Check Console for errors (`Window → Extensions → AE AI Assistant`, then F12)

### AI not connecting

1. Verify API URL is correct
2. Check API key is valid
3. Ensure AI server is running
4. Check network/firewall settings

### Scripts not executing

1. Enable "Allow Scripts to Write Files": `Edit → Preferences → Scripting & Expressions`
2. Check ExtendScript Toolkit for errors

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

<p align="center">
  <a href="https://buymeacoffee.com/severus1509">
    <img src="https://img.shields.io/badge/Buy%20Me%20A%20Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black" alt="Buy Me A Coffee">
  </a>
</p>

<p align="center">
  Made with ❤️ by <a href="https://github.com/phquand2000">phquand2000</a>
</p>

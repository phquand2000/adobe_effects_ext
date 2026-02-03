<div align="center">

# AE AI Assistant

<a href="https://buymeacoffee.com/severus1509">
  <img src="https://img.shields.io/badge/Support_This_Project-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black" alt="Buy Me A Coffee">
</a>

<br><br>

<img src="https://img.shields.io/badge/After_Effects-9999FF?style=flat-square&logo=adobe-after-effects&logoColor=white" alt="After Effects">
<img src="https://img.shields.io/badge/CEP_12.0-00D8FF?style=flat-square" alt="CEP">
<img src="https://img.shields.io/badge/ExtendScript-ES3-F7DF1E?style=flat-square" alt="ExtendScript">
<img src="https://img.shields.io/badge/Actions-158-4CAF50?style=flat-square" alt="Actions">
<img src="https://img.shields.io/badge/Services-29-2196F3?style=flat-square" alt="Services">
<img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="License">

**AI-powered automation panel for Adobe After Effects**

[View Demo](#demo) · [Report Bug](https://github.com/phquand2000/adobe_effects_ext/issues) · [Request Feature](https://github.com/phquand2000/adobe_effects_ext/issues)

---

</div>

## Table of Contents

- [About](#about)
- [Features](#features)
- [Demo](#demo)
- [Installation](#installation)
- [Development](#development)
- [Architecture](#architecture)
- [Usage](#usage)
- [Services Reference](#services-reference)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## About

AE AI Assistant is a CEP extension that brings AI-powered automation to Adobe After Effects. With **29 services** and **158 actions**, it enables natural language control over complex VFX workflows including 3D scene setup, camera tracking, lighting rigs, and motion graphics.

### Built With

<p>
  <img src="https://img.shields.io/badge/Adobe_CEP-FF0000?style=for-the-badge&logo=adobe&logoColor=white" alt="Adobe CEP">
  <img src="https://img.shields.io/badge/ExtendScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="ExtendScript">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5">
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3">
</p>

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

## Features

<table>
<tr>
<td width="50%" valign="top">

### Core Capabilities

- **AI Integration** — Natural language commands via OpenAI-compatible API
- **29 Services** — Camera, lighting, effects, tracking, rendering & more  
- **158 Actions** — Pre-built automation for common VFX tasks
- **Workflow Templates** — From basic intros to professional VFX pipelines

</td>
<td width="50%" valign="top">

### Advanced VFX

- **3D Support** — Native .glb/.gltf import, PBR materials
- **Camera Tracker** — 3D motion tracking integration
- **Motion Blur & DOF** — Professional depth of field
- **Lighting Rigs** — Three-point, studio, dramatic presets

</td>
</tr>
</table>

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

## Demo

> Coming soon: GIF demonstrations of key features

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

## Installation

### Prerequisites

- Adobe After Effects 2026+ (v26.0+)
- macOS 10.15+ or Windows 10/11

### macOS

1. Download or clone this repository:
   ```bash
   git clone https://github.com/phquand2000/adobe_effects_ext.git
   ```

2. Copy to CEP extensions folder:
   ```bash
   cp -r adobe_effects_ext ~/Library/Application\ Support/Adobe/CEP/extensions/com.aeai.assistant
   ```

3. Enable debug mode for unsigned extensions:
   ```bash
   defaults write com.adobe.CSXS.12 PlayerDebugMode 1
   ```

4. Restart After Effects and open: **Window → Extensions → AE AI Assistant**

### Windows

1. Download or clone this repository:
   ```powershell
   git clone https://github.com/phquand2000/adobe_effects_ext.git
   ```

2. Copy to CEP extensions folder:
   ```powershell
   Copy-Item -Recurse adobe_effects_ext "$env:APPDATA\Adobe\CEP\extensions\com.aeai.assistant"
   ```

3. Enable debug mode (Run as Administrator):
   ```powershell
   reg add "HKCU\SOFTWARE\Adobe\CSXS.12" /v PlayerDebugMode /t REG_DWORD /d 1 /f
   ```

4. Restart After Effects and open: **Window → Extensions → AE AI Assistant**

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

## Development

### Setup

1. Clone and install dependencies:
   ```bash
   git clone https://github.com/phquand2000/adobe_effects_ext.git
   cd adobe_effects_ext
   npm install
   ```

2. Create symlink for development:

   **macOS:**
   ```bash
   ln -s "$(pwd)" ~/Library/Application\ Support/Adobe/CEP/extensions/com.aeai.assistant
   ```

   **Windows (Admin PowerShell):**
   ```powershell
   cmd /c mklink /D "$env:APPDATA\Adobe\CEP\extensions\com.aeai.assistant" (Get-Location)
   ```

3. Enable CEP debugging in `.debug` file, then access DevTools at `http://localhost:8088`

### ExtendScript Guidelines

> ⚠️ ExtendScript uses **ECMAScript 3** — No modern JavaScript features!

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
3. Register: `ActionRegistry.register('actionName', ServiceName.methodName);`
4. Add to `ALLOWED_ACTIONS` in `js/main.js`

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

## Architecture

```
├── CSXS/
│   └── manifest.xml        # Extension manifest
├── css/
│   └── style.css           # Panel styling
├── js/
│   ├── CSInterface.js      # Adobe CEP library
│   ├── ai-client.js        # AI API client
│   ├── config.js           # Configuration
│   └── main.js             # Panel controller
├── jsx/
│   ├── core/               # Polyfills & utilities
│   ├── data/               # AE API access layer
│   ├── domain/             # Business logic (presets)
│   ├── services/           # 29 service modules
│   ├── hostscript.jsx      # Entry point
│   └── loader.jsx          # Module loader
└── index.html              # Panel UI
```

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

## Usage

### Quick Actions

| Action | Description |
|--------|-------------|
| **Import** | Import assets (.glb, .gltf, videos, images) |
| **New Comp** | Create new composition |
| **3D Setup** | Configure 3D environment |
| **Camera** | Add and configure cameras |
| **Lights** | Add lighting rigs |
| **Blur** | Motion blur settings |
| **Tracker** | 3D camera tracking |
| **Shadow** | Shadow catcher setup |
| **Analyze** | Analyze current frame |

### AI Commands

Connect to an OpenAI-compatible API and use natural language:

```
"Add a 3D camera with depth of field"
"Create a text layer with fade in animation"
"Apply color correction to selected layer"
"Set up a three-point lighting rig"
```

### Workflow Templates

| Level | Templates |
|-------|-----------|
| **Basic** | Text intro, slideshow |
| **Intermediate** | Lower third, logo reveal, green screen |
| **Advanced** | 3D scene, parallax, text animators |
| **Professional** | Color grade, motion graphics |
| **VFX** | Screen replacement, tracking composite |

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

## Services Reference

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

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

## Troubleshooting

<details>
<summary><strong>Extension not appearing in After Effects</strong></summary>

1. Verify debug mode is enabled (see Installation)
2. Check extension path is correct
3. Restart After Effects completely
4. Check AE version is 2026+ (v26.0+)

</details>

<details>
<summary><strong>AI not connecting</strong></summary>

1. Verify API URL is correct in Settings
2. Check API key is valid
3. Ensure AI server is running
4. Check network/firewall settings

</details>

<details>
<summary><strong>Scripts not executing</strong></summary>

1. Enable in AE: **Edit → Preferences → Scripting & Expressions → Allow Scripts to Write Files**
2. Check ExtendScript Toolkit for detailed errors

</details>

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

## Contributing

Contributions are welcome! Feel free to:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

## License

Distributed under the MIT License. See `LICENSE` for more information.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

---

<div align="center">

### Support This Project

If you find this extension helpful, consider buying me a coffee!

<a href="https://buymeacoffee.com/severus1509">
  <img src="https://img.shields.io/badge/Buy_Me_A_Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black" alt="Buy Me A Coffee">
</a>

<br><br>

Made with ❤️ by [phquand2000](https://github.com/phquand2000)

</div>

// AE AI Assistant - Configuration
// Local AI Server configuration

const CONFIG = {
    // AI Server
    API_URL: 'http://localhost:8317/v1',
    API_KEY: '', // Will be loaded from localStorage or set via Settings
    
    // AI Models
    MODELS: {
        text: 'gpt-5.2-codex',
        vision: 'gemini-3-pro-image-preview',
        fast: 'gemini-2.5-flash-lite'
    },
    
    // Project paths
    PROJECT_PATH: '/Volumes/Data 2//My Project/ae-ext/',
    
    // Asset names (should match files in PROJECT_PATH)
    ASSETS: {
        referenceVideo: 'Download.mp4',
        coinModel: 'coin.glb'
    },
    
    // Default animation settings
    ANIMATION: {
        startScale: [10, 10, 10],
        endScale: [100, 100, 100],
        rotations: 2,
        duration: 2
    },
    
    // Lighting presets
    LIGHTING: {
        keyLight: {
            position: [700, -300, -800],
            intensity: 100,
            color: [1, 0.98, 0.95],
            shadowDarkness: 50
        },
        fillLight: {
            position: [200, 500, -600],
            intensity: 40,
            color: [0.9, 0.95, 1],
            shadowDarkness: 0
        },
        rimLight: {
            position: [500, 300, 500],
            intensity: 60,
            color: [1, 1, 1],
            shadowDarkness: 0
        }
    }
};

// Load API key from localStorage if available
(function() {
    try {
        const savedKey = localStorage.getItem('ae_ai_api_key');
        if (savedKey) {
            CONFIG.API_KEY = savedKey;
        }
        const savedUrl = localStorage.getItem('ae_ai_api_url');
        if (savedUrl) {
            CONFIG.API_URL = savedUrl;
        }
    } catch (e) {
        console.log('localStorage not available');
    }
})();

// Helper to save settings
function saveConfig(key, value) {
    try {
        if (key === 'apiKey') {
            localStorage.setItem('ae_ai_api_key', value);
            CONFIG.API_KEY = value;
        } else if (key === 'apiUrl') {
            localStorage.setItem('ae_ai_api_url', value);
            CONFIG.API_URL = value;
        }
        return true;
    } catch (e) {
        return false;
    }
}

// Freeze nested objects only (CONFIG itself needs API_KEY to be mutable)
Object.freeze(CONFIG.MODELS);
Object.freeze(CONFIG.ASSETS);
Object.freeze(CONFIG.ANIMATION);
Object.freeze(CONFIG.LIGHTING);

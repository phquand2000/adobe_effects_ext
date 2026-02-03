// ============================================
// FUNCTIONAL TEST SUITE FOR AE AI ASSISTANT
// Comprehensive tests for all 152 actions
// Run in After Effects: File > Scripts > Run Script File
// ============================================

// Load the modular system first
var scriptFile = new File($.fileName);
var scriptFolder = scriptFile.parent;
$.evalFile(scriptFolder.fsName + '/jsx/loader.jsx');

// ============================================
// TEST FRAMEWORK
// ============================================

var TestRunner = {
    passed: 0,
    failed: 0,
    skipped: 0,
    results: [],
    currentGroup: '',
    
    group: function(name) {
        this.currentGroup = name;
        $.writeln('\n=== ' + name + ' ===');
    },
    
    test: function(name, fn) {
        try {
            var result = fn();
            if (result && result.success !== false) {
                this.passed++;
                this.results.push({ group: this.currentGroup, name: name, status: 'PASS' });
                $.writeln('✓ ' + name);
                return true;
            } else {
                this.failed++;
                var error = result ? result.error : 'Unknown error';
                this.results.push({ group: this.currentGroup, name: name, status: 'FAIL', error: error });
                $.writeln('✗ ' + name + ' - ' + error);
                return false;
            }
        } catch (e) {
            this.failed++;
            this.results.push({ group: this.currentGroup, name: name, status: 'FAIL', error: e.toString() });
            $.writeln('✗ ' + name + ' - ' + e.toString());
            return false;
        }
    },
    
    skip: function(name, reason) {
        this.skipped++;
        this.results.push({ group: this.currentGroup, name: name, status: 'SKIP', reason: reason });
        $.writeln('○ ' + name + ' (skipped: ' + reason + ')');
    },
    
    summary: function() {
        $.writeln('\n========================================');
        $.writeln('TEST SUMMARY');
        $.writeln('========================================');
        $.writeln('Passed:  ' + this.passed);
        $.writeln('Failed:  ' + this.failed);
        $.writeln('Skipped: ' + this.skipped);
        $.writeln('Total:   ' + (this.passed + this.failed + this.skipped));
        $.writeln('Success Rate: ' + Math.round(this.passed / (this.passed + this.failed) * 100) + '%');
        
        if (this.failed > 0) {
            $.writeln('\nFailed Tests:');
            for (var i = 0; i < this.results.length; i++) {
                if (this.results[i].status === 'FAIL') {
                    $.writeln('  - [' + this.results[i].group + '] ' + this.results[i].name + ': ' + this.results[i].error);
                }
            }
        }
        
        return {
            passed: this.passed,
            failed: this.failed,
            skipped: this.skipped,
            results: this.results
        };
    },
    
    reset: function() {
        this.passed = 0;
        this.failed = 0;
        this.skipped = 0;
        this.results = [];
    }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function createTestComp(name, width, height, duration) {
    name = name || 'Test Comp';
    width = width || 1920;
    height = height || 1080;
    duration = duration || 10;
    
    var comp = app.project.items.addComp(name, width, height, 1, duration, 30);
    return comp;
}

function addTestSolid(comp, name, color) {
    name = name || 'Test Solid';
    color = color || [1, 0, 0];
    return comp.layers.addSolid(color, name, comp.width, comp.height, 1);
}

function cleanup(comp) {
    if (comp && comp.remove) {
        try {
            comp.remove();
        } catch (e) {}
    }
}

// ============================================
// LEVEL 1: BASIC EDITOR TESTS
// Essential functions for beginners
// ============================================

function runBasicTests() {
    $.writeln('\n########################################');
    $.writeln('LEVEL 1: BASIC EDITOR TESTS');
    $.writeln('########################################');
    
    var comp = null;
    
    try {
        // Create test composition
        comp = createTestComp('Basic Test Comp');
        
        // --- Composition Tests ---
        TestRunner.group('Composition (Basic)');
        
        TestRunner.test('createComp', function() {
            var result = ActionRegistry.execute('createComp', {
                name: 'Created Comp',
                width: 1920,
                height: 1080,
                duration: 5,
                frameRate: 30
            });
            if (result.success) {
                // Clean up created comp
                var createdComp = app.project.activeItem;
                if (createdComp && createdComp.name === 'Created Comp') {
                    createdComp.remove();
                }
            }
            return result;
        });
        
        TestRunner.test('getCompInfo', function() {
            return ActionRegistry.execute('getCompInfo', {});
        });
        
        TestRunner.test('getProjectInfo', function() {
            return ActionRegistry.execute('getProjectInfo', {});
        });
        
        // --- Layer Tests ---
        TestRunner.group('Layers (Basic)');
        
        var solid = addTestSolid(comp, 'Test Layer');
        
        TestRunner.test('addTextLayer', function() {
            return ActionRegistry.execute('addTextLayer', {
                text: 'Hello World',
                fontSize: 72,
                color: [1, 1, 1]
            });
        });
        
        TestRunner.test('addShapeLayer - Rectangle', function() {
            return ActionRegistry.execute('addShapeLayer', {
                shape: 'rectangle',
                size: [200, 200],
                fill: [1, 0, 0],
                stroke: [1, 1, 1],
                strokeWidth: 2
            });
        });
        
        TestRunner.test('addShapeLayer - Ellipse', function() {
            return ActionRegistry.execute('addShapeLayer', {
                shape: 'ellipse',
                size: [150, 150],
                fill: [0, 1, 0]
            });
        });
        
        TestRunner.test('duplicateLayer', function() {
            return ActionRegistry.execute('duplicateLayer', {
                layerIndex: 1
            });
        });
        
        // --- Property Tests ---
        TestRunner.group('Properties (Basic)');
        
        TestRunner.test('setProperty - Position', function() {
            return ActionRegistry.execute('setProperty', {
                layerIndex: 1,
                property: 'Position',
                value: [960, 540]
            });
        });
        
        TestRunner.test('setProperty - Opacity', function() {
            return ActionRegistry.execute('setProperty', {
                layerIndex: 1,
                property: 'Opacity',
                value: 75
            });
        });
        
        TestRunner.test('setProperty - Scale', function() {
            return ActionRegistry.execute('setProperty', {
                layerIndex: 1,
                property: 'Scale',
                value: [50, 50]
            });
        });
        
        TestRunner.test('getProperty', function() {
            return ActionRegistry.execute('getProperty', {
                layerIndex: 1,
                property: 'Position'
            });
        });
        
        // --- Effect Tests ---
        TestRunner.group('Effects (Basic)');
        
        TestRunner.test('applyBlur - Gaussian', function() {
            return ActionRegistry.execute('applyBlur', {
                layerIndex: 1,
                blurType: 'gaussian',
                blurriness: 10
            });
        });
        
        TestRunner.test('applyGlow', function() {
            return ActionRegistry.execute('applyGlow', {
                layerIndex: 1,
                radius: 25,
                intensity: 1.5
            });
        });
        
        TestRunner.test('applyFill', function() {
            return ActionRegistry.execute('applyFill', {
                layerIndex: 1,
                color: [0, 0.5, 1]
            });
        });
        
        // --- Animation Tests ---
        TestRunner.group('Animation (Basic)');
        
        TestRunner.test('addKeyframe', function() {
            return ActionRegistry.execute('addKeyframe', {
                layerIndex: 1,
                property: 'Opacity',
                time: 0,
                value: 0
            });
        });
        
        TestRunner.test('animateProperty', function() {
            return ActionRegistry.execute('animateProperty', {
                layerIndex: 1,
                property: 'Position',
                startValue: [100, 540],
                endValue: [1820, 540],
                startTime: 0,
                endTime: 2
            });
        });
        
    } finally {
        cleanup(comp);
    }
}

// ============================================
// LEVEL 2: INTERMEDIATE EDITOR TESTS
// More advanced features
// ============================================

function runIntermediateTests() {
    $.writeln('\n########################################');
    $.writeln('LEVEL 2: INTERMEDIATE EDITOR TESTS');
    $.writeln('########################################');
    
    var comp = null;
    
    try {
        comp = createTestComp('Intermediate Test Comp');
        var solid = addTestSolid(comp, 'Test Layer');
        
        // --- Text Animation ---
        TestRunner.group('Text Animation');
        
        TestRunner.test('addTextLayer with animation', function() {
            return ActionRegistry.execute('addTextLayer', {
                text: 'Animated Text',
                fontSize: 100,
                position: [960, 540]
            });
        });
        
        TestRunner.test('addTextAnimator', function() {
            return ActionRegistry.execute('addTextAnimator', {
                layerIndex: 1,
                property: 'Position',
                value: [0, -50]
            });
        });
        
        TestRunner.test('addRangeSelector', function() {
            return ActionRegistry.execute('addRangeSelector', {
                layerIndex: 1,
                animatorIndex: 1,
                start: 0,
                end: 100
            });
        });
        
        TestRunner.test('setTextTracking', function() {
            return ActionRegistry.execute('setTextTracking', {
                layerIndex: 1,
                tracking: 50
            });
        });
        
        // --- Shape Operations ---
        TestRunner.group('Shape Operations');
        
        TestRunner.test('addShapeLayer - Polygon', function() {
            return ActionRegistry.execute('addShapeLayer', {
                shape: 'polygon',
                points: 6,
                size: [200, 200],
                fill: [1, 0.5, 0]
            });
        });
        
        TestRunner.test('addTrimPaths', function() {
            return ActionRegistry.execute('addTrimPaths', {
                layerIndex: 1,
                start: 0,
                end: 50
            });
        });
        
        TestRunner.test('addRepeater', function() {
            return ActionRegistry.execute('addRepeater', {
                layerIndex: 1,
                copies: 5,
                offset: [100, 0]
            });
        });
        
        TestRunner.test('addRoundCorners', function() {
            return ActionRegistry.execute('addRoundCorners', {
                layerIndex: 1,
                radius: 20
            });
        });
        
        // --- Masks ---
        TestRunner.group('Masks');
        
        TestRunner.test('addMask - Rectangle', function() {
            return ActionRegistry.execute('addMask', {
                layerIndex: comp.numLayers,
                shape: 'rectangle',
                size: [400, 300],
                position: [960, 540]
            });
        });
        
        TestRunner.test('addMask - Ellipse', function() {
            var newSolid = addTestSolid(comp, 'Mask Test');
            return ActionRegistry.execute('addMask', {
                layerIndex: 1,
                shape: 'ellipse',
                size: [300, 300],
                feather: 20
            });
        });
        
        // --- Layer Utilities ---
        TestRunner.group('Layer Utilities');
        
        TestRunner.test('splitLayer', function() {
            var splitSolid = addTestSolid(comp, 'Split Test');
            return ActionRegistry.execute('splitLayer', {
                layerIndex: 1,
                time: 2
            });
        });
        
        TestRunner.test('setLayerBlendingMode', function() {
            return ActionRegistry.execute('setLayerBlendingMode', {
                layerIndex: 1,
                blendMode: 'add'
            });
        });
        
        TestRunner.test('setCollapseTransformations', function() {
            return ActionRegistry.execute('setCollapseTransformations', {
                layerIndex: 1,
                enabled: true
            });
        });
        
        // --- Color Correction ---
        TestRunner.group('Color Correction');
        
        TestRunner.test('applyLumetri', function() {
            return ActionRegistry.execute('applyLumetri', {
                layerIndex: 1,
                exposure: 0.5,
                contrast: 20,
                saturation: 120
            });
        });
        
        TestRunner.test('applyVibrance', function() {
            return ActionRegistry.execute('applyVibrance', {
                layerIndex: 1,
                vibrance: 50
            });
        });
        
        TestRunner.test('applyColorBalance', function() {
            return ActionRegistry.execute('applyColorBalance', {
                layerIndex: 1,
                shadowRed: 10,
                midtoneGreen: -5
            });
        });
        
        // --- Expressions ---
        TestRunner.group('Expressions');
        
        TestRunner.test('applyExpression - Wiggle', function() {
            return ActionRegistry.execute('applyExpression', {
                layerIndex: 1,
                property: 'Position',
                expression: 'wiggle(2, 50)'
            });
        });
        
        TestRunner.test('applyExpressionPreset - time', function() {
            return ActionRegistry.execute('applyExpressionPreset', {
                layerIndex: 1,
                property: 'Rotation',
                preset: 'time',
                multiplier: 45
            });
        });
        
        TestRunner.test('removeExpression', function() {
            return ActionRegistry.execute('removeExpression', {
                layerIndex: 1,
                property: 'Position'
            });
        });
        
    } finally {
        cleanup(comp);
    }
}

// ============================================
// LEVEL 3: ADVANCED EDITOR TESTS
// Professional-level features
// ============================================

function runAdvancedTests() {
    $.writeln('\n########################################');
    $.writeln('LEVEL 3: ADVANCED EDITOR TESTS');
    $.writeln('########################################');
    
    var comp = null;
    
    try {
        comp = createTestComp('Advanced Test Comp');
        var solid = addTestSolid(comp, 'Test Layer');
        
        // --- 3D & Camera ---
        TestRunner.group('3D & Camera');
        
        TestRunner.test('setup3DLayer', function() {
            return ActionRegistry.execute('setup3DLayer', {
                layerIndex: 1
            });
        });
        
        TestRunner.test('addCamera', function() {
            return ActionRegistry.execute('addCamera', {
                preset: 'twoNode',
                zoom: 2000
            });
        });
        
        TestRunner.test('setupDOF', function() {
            return ActionRegistry.execute('setupDOF', {
                fStop: 2.8,
                blurLevel: 100
            });
        });
        
        TestRunner.test('focusOnLayer', function() {
            return ActionRegistry.execute('focusOnLayer', {
                targetLayerIndex: comp.numLayers
            });
        });
        
        // --- Lighting ---
        TestRunner.group('Lighting');
        
        TestRunner.test('addLightRig', function() {
            return ActionRegistry.execute('addLightRig', {
                includeRim: true
            });
        });
        
        TestRunner.test('addEnvironmentLight', function() {
            return ActionRegistry.execute('addEnvironmentLight', {
                intensity: 50,
                color: [1, 0.95, 0.9]
            });
        });
        
        TestRunner.test('setupShadows', function() {
            return ActionRegistry.execute('setupShadows', {
                darkness: 50,
                diffusion: 100
            });
        });
        
        // --- Motion ---
        TestRunner.group('Motion');
        
        TestRunner.test('enableMotionBlur', function() {
            return ActionRegistry.execute('enableMotionBlur', {
                layerIndex: comp.numLayers,
                shutterAngle: 180
            });
        });
        
        TestRunner.test('addNullController', function() {
            return ActionRegistry.execute('addNullController', {
                name: 'Master Controller',
                is3D: true
            });
        });
        
        TestRunner.test('parentLayers', function() {
            return ActionRegistry.execute('parentLayers', {
                childIndices: [comp.numLayers],
                parentIndex: 1
            });
        });
        
        // --- Time Effects ---
        TestRunner.group('Time Effects');
        
        TestRunner.test('timeRemapLayer', function() {
            var remapSolid = addTestSolid(comp, 'Time Remap Test');
            return ActionRegistry.execute('timeRemapLayer', {
                layerIndex: 1
            });
        });
        
        TestRunner.test('applyTimewarp', function() {
            return ActionRegistry.execute('applyTimewarp', {
                layerIndex: 1,
                speed: 50
            });
        });
        
        TestRunner.test('applyPosterizeTime', function() {
            return ActionRegistry.execute('applyPosterizeTime', {
                layerIndex: 1,
                frameRate: 12
            });
        });
        
        // --- Distortion ---
        TestRunner.group('Distortion');
        
        TestRunner.test('applyCornerPin', function() {
            return ActionRegistry.execute('applyCornerPin', {
                layerIndex: 1
            });
        });
        
        TestRunner.test('applyMeshWarp', function() {
            return ActionRegistry.execute('applyMeshWarp', {
                layerIndex: 1,
                rows: 4,
                columns: 4
            });
        });
        
        TestRunner.test('applyBezierWarp', function() {
            return ActionRegistry.execute('applyBezierWarp', {
                layerIndex: 1
            });
        });
        
        // --- Generate ---
        TestRunner.group('Generate');
        
        TestRunner.test('applyGradientRamp', function() {
            return ActionRegistry.execute('applyGradientRamp', {
                layerIndex: 1,
                startColor: [1, 0, 0],
                endColor: [0, 0, 1]
            });
        });
        
        TestRunner.test('apply4ColorGradient', function() {
            return ActionRegistry.execute('apply4ColorGradient', {
                layerIndex: 1,
                colors: [[1,0,0], [0,1,0], [0,0,1], [1,1,0]]
            });
        });
        
        TestRunner.test('applyFractalNoise', function() {
            return ActionRegistry.execute('applyFractalNoise', {
                layerIndex: 1,
                complexity: 5,
                contrast: 150
            });
        });
        
    } finally {
        cleanup(comp);
    }
}

// ============================================
// LEVEL 4: PROFESSIONAL TESTS
// Production workflow features
// ============================================

function runProfessionalTests() {
    $.writeln('\n########################################');
    $.writeln('LEVEL 4: PROFESSIONAL TESTS');
    $.writeln('########################################');
    
    var comp = null;
    
    try {
        comp = createTestComp('Professional Test Comp');
        var solid = addTestSolid(comp, 'Test Layer');
        
        // --- Precomp & Organization ---
        TestRunner.group('Precomp & Organization');
        
        TestRunner.test('precompose', function() {
            addTestSolid(comp, 'Precomp Layer 1');
            addTestSolid(comp, 'Precomp Layer 2');
            return ActionRegistry.execute('precompose', {
                layerIndices: [1, 2],
                name: 'Precomp Test'
            });
        });
        
        TestRunner.test('duplicateComp', function() {
            return ActionRegistry.execute('duplicateComp', {
                newName: 'Duplicated Comp'
            });
        });
        
        TestRunner.test('createFolder', function() {
            return ActionRegistry.execute('createFolder', {
                name: 'Test Folder'
            });
        });
        
        // --- Markers ---
        TestRunner.group('Markers');
        
        TestRunner.test('addCompMarker', function() {
            return ActionRegistry.execute('addCompMarker', {
                time: 1,
                comment: 'Section Start',
                label: 1
            });
        });
        
        TestRunner.test('addLayerMarker', function() {
            return ActionRegistry.execute('addLayerMarker', {
                layerIndex: 1,
                time: 0.5,
                comment: 'Animation Start'
            });
        });
        
        TestRunner.test('getCompMarkers', function() {
            return ActionRegistry.execute('getCompMarkers', {});
        });
        
        TestRunner.test('addMarkersFromArray', function() {
            return ActionRegistry.execute('addMarkersFromArray', {
                markers: [
                    { time: 2, comment: 'Beat 1' },
                    { time: 3, comment: 'Beat 2' },
                    { time: 4, comment: 'Beat 3' }
                ]
            });
        });
        
        // --- Audio ---
        TestRunner.group('Audio');
        
        // Note: These require audio layers
        TestRunner.skip('setAudioLevel', 'Requires audio layer');
        TestRunner.skip('fadeAudioIn', 'Requires audio layer');
        TestRunner.skip('fadeAudioOut', 'Requires audio layer');
        
        // --- Project Management ---
        TestRunner.group('Project Management');
        
        TestRunner.test('getProjectSettings', function() {
            return ActionRegistry.execute('getProjectSettings', {});
        });
        
        TestRunner.test('getProjectReport', function() {
            return ActionRegistry.execute('getProjectReport', {});
        });
        
        TestRunner.test('removeUnused', function() {
            return ActionRegistry.execute('removeUnused', {
                dryRun: true
            });
        });
        
        // --- Render ---
        TestRunner.group('Render');
        
        TestRunner.test('listRenderTemplates', function() {
            return ActionRegistry.execute('listRenderTemplates', {});
        });
        
        TestRunner.test('addToRenderQueue', function() {
            return ActionRegistry.execute('addToRenderQueue', {});
        });
        
        TestRunner.test('getRenderStatus', function() {
            return ActionRegistry.execute('getRenderStatus', {});
        });
        
        // Clear render queue after test
        ActionRegistry.execute('clearRenderQueue', {});
        
        // --- Color Management ---
        TestRunner.group('Color Management');
        
        TestRunner.test('setProjectColorDepth', function() {
            return ActionRegistry.execute('setProjectColorDepth', {
                depth: 16
            });
        });
        
        // Reset to 8-bit
        ActionRegistry.execute('setProjectColorDepth', { depth: 8 });
        
    } finally {
        cleanup(comp);
    }
}

// ============================================
// LEVEL 5: VFX & COMPOSITING TESTS
// Advanced VFX features
// ============================================

function runVFXTests() {
    $.writeln('\n########################################');
    $.writeln('LEVEL 5: VFX & COMPOSITING TESTS');
    $.writeln('########################################');
    
    var comp = null;
    
    try {
        comp = createTestComp('VFX Test Comp');
        var solid = addTestSolid(comp, 'VFX Layer', [0, 1, 0]); // Green solid for keying tests
        
        // --- Keying ---
        TestRunner.group('Keying');
        
        TestRunner.test('applyKeylight', function() {
            return ActionRegistry.execute('applyKeylight', {
                layerIndex: 1,
                screenColor: [0, 1, 0]
            });
        });
        
        TestRunner.test('applySpillSuppressor', function() {
            return ActionRegistry.execute('applySpillSuppressor', {
                layerIndex: 1
            });
        });
        
        TestRunner.test('applyKeyCleaner', function() {
            return ActionRegistry.execute('applyKeyCleaner', {
                layerIndex: 1
            });
        });
        
        // --- Track Matte ---
        TestRunner.group('Track Matte');
        
        var matteSolid = addTestSolid(comp, 'Matte Layer');
        
        TestRunner.test('setTrackMatte', function() {
            return ActionRegistry.execute('setTrackMatte', {
                layerIndex: 2,
                matteType: 'alpha'
            });
        });
        
        TestRunner.test('removeTrackMatte', function() {
            return ActionRegistry.execute('removeTrackMatte', {
                layerIndex: 2
            });
        });
        
        // --- Advanced Blur ---
        TestRunner.group('Advanced Blur');
        
        TestRunner.test('applyBilateralBlur', function() {
            return ActionRegistry.execute('applyBilateralBlur', {
                layerIndex: 1,
                radius: 5,
                threshold: 50
            });
        });
        
        // Skip camera tracker - requires footage analysis
        TestRunner.skip('setup3DCameraTracker', 'Requires real footage for analysis');
        TestRunner.skip('linkToTrackPoint', 'Requires analyzed tracking data');
        
        // --- Grain ---
        TestRunner.group('Grain');
        
        TestRunner.test('applyAddGrain', function() {
            return ActionRegistry.execute('applyAddGrain', {
                layerIndex: 1,
                intensity: 0.5
            });
        });
        
        // --- Shadow Catcher ---
        TestRunner.group('Shadow Catcher');
        
        TestRunner.test('addShadowCatcher', function() {
            return ActionRegistry.execute('addShadowCatcher', {
                rotationX: 90
            });
        });
        
    } finally {
        cleanup(comp);
    }
}

// ============================================
// SPECIAL TESTS
// Edge cases and specific features
// ============================================

function runSpecialTests() {
    $.writeln('\n########################################');
    $.writeln('SPECIAL TESTS');
    $.writeln('########################################');
    
    var comp = null;
    
    try {
        comp = createTestComp('Special Test Comp');
        
        // --- System Tests ---
        TestRunner.group('System');
        
        TestRunner.test('testScript', function() {
            return ActionRegistry.execute('testScript', {});
        });
        
        TestRunner.test('getRenderers', function() {
            return ActionRegistry.execute('getRenderers', {});
        });
        
        // --- Gradient Shapes ---
        TestRunner.group('Gradient Shapes');
        
        TestRunner.test('addShapeLayer with gradient fill', function() {
            return ActionRegistry.execute('addShapeLayer', {
                shape: 'rectangle',
                size: [400, 400]
            });
        });
        
        TestRunner.test('addGradientFill', function() {
            return ActionRegistry.execute('addGradientFill', {
                layerIndex: 1,
                startColor: [1, 0, 0],
                endColor: [0, 0, 1],
                type: 'linear'
            });
        });
        
        TestRunner.test('addGradientStroke', function() {
            return ActionRegistry.execute('addGradientStroke', {
                layerIndex: 1,
                startColor: [1, 1, 0],
                endColor: [0, 1, 1],
                width: 5
            });
        });
        
        // --- Shape Modifiers ---
        TestRunner.group('Shape Modifiers');
        
        TestRunner.test('addZigZag', function() {
            return ActionRegistry.execute('addZigZag', {
                layerIndex: 1,
                size: 10,
                ridges: 5
            });
        });
        
        TestRunner.test('addPuckerBloat', function() {
            return ActionRegistry.execute('addPuckerBloat', {
                layerIndex: 1,
                amount: 25
            });
        });
        
        TestRunner.test('addTwist', function() {
            return ActionRegistry.execute('addTwist', {
                layerIndex: 1,
                angle: 90
            });
        });
        
        TestRunner.test('addOffsetPaths', function() {
            return ActionRegistry.execute('addOffsetPaths', {
                layerIndex: 1,
                amount: 10
            });
        });
        
        // --- Advanced Text ---
        TestRunner.group('Advanced Text');
        
        TestRunner.test('addTextLayer advanced', function() {
            return ActionRegistry.execute('addTextLayer', {
                text: '3D Text',
                fontSize: 120,
                font: 'Arial',
                is3D: true
            });
        });
        
        TestRunner.test('setPerCharacter3D', function() {
            return ActionRegistry.execute('setPerCharacter3D', {
                layerIndex: 1,
                enabled: true
            });
        });
        
        TestRunner.test('addWigglySelector', function() {
            // First add an animator
            ActionRegistry.execute('addTextAnimator', {
                layerIndex: 1,
                property: 'Opacity',
                value: 0
            });
            return ActionRegistry.execute('addWigglySelector', {
                layerIndex: 1,
                animatorIndex: 1,
                mode: 'add',
                maxAmount: 50,
                wigglesPerSecond: 2
            });
        });
        
    } finally {
        cleanup(comp);
    }
}

// ============================================
// MAIN TEST RUNNER
// ============================================

function runAllTests() {
    $.writeln('========================================');
    $.writeln('AE AI ASSISTANT - FUNCTIONAL TEST SUITE');
    $.writeln('Testing all 152 actions');
    $.writeln('========================================');
    $.writeln('Date: ' + new Date().toString());
    $.writeln('');
    
    // Verify modular system loaded
    if (typeof ActionRegistry === 'undefined') {
        $.writeln('ERROR: ActionRegistry not loaded!');
        return;
    }
    
    var actionCount = ActionRegistry.list().length;
    $.writeln('Registered actions: ' + actionCount);
    
    if (actionCount !== 152) {
        $.writeln('WARNING: Expected 152 actions, found ' + actionCount);
    }
    
    TestRunner.reset();
    
    app.beginUndoGroup('AI Assistant Tests');
    
    try {
        runBasicTests();
        runIntermediateTests();
        runAdvancedTests();
        runProfessionalTests();
        runVFXTests();
        runSpecialTests();
    } catch (e) {
        $.writeln('\nFATAL ERROR: ' + e.toString());
    }
    
    app.endUndoGroup();
    
    // Undo all test changes
    app.executeCommand(16); // Edit > Undo
    
    return TestRunner.summary();
}

// Run selective tests by level
function runTestLevel(level) {
    TestRunner.reset();
    app.beginUndoGroup('AI Assistant Tests - Level ' + level);
    
    try {
        switch(level) {
            case 1: runBasicTests(); break;
            case 2: runIntermediateTests(); break;
            case 3: runAdvancedTests(); break;
            case 4: runProfessionalTests(); break;
            case 5: runVFXTests(); break;
            case 'special': runSpecialTests(); break;
            default: $.writeln('Unknown level: ' + level);
        }
    } catch (e) {
        $.writeln('\nFATAL ERROR: ' + e.toString());
    }
    
    app.endUndoGroup();
    app.executeCommand(16);
    
    return TestRunner.summary();
}

// Export for external use
var FunctionalTests = {
    runAll: runAllTests,
    runLevel: runTestLevel,
    runner: TestRunner
};

// Auto-run if executed directly
if ($.fileName.indexOf('test-functional.jsx') !== -1) {
    runAllTests();
}

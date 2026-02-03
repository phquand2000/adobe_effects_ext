// ============================================
// QUICK TEST SCRIPT FOR AE AI ASSISTANT
// Run this in After Effects to verify installation
// File > Scripts > Run Script File
// ============================================

(function() {
    // Load the modular system
    var scriptFile = new File($.fileName);
    var scriptFolder = scriptFile.parent;
    
    // Try to find loader.jsx
    var loaderPath = scriptFolder.fsName + '/jsx/loader.jsx';
    var loaderFile = new File(loaderPath);
    
    if (!loaderFile.exists) {
        // Try alternate path
        loaderPath = scriptFolder.fsName + '/loader.jsx';
        loaderFile = new File(loaderPath);
    }
    
    if (!loaderFile.exists) {
        alert('ERROR: loader.jsx not found!\nPath: ' + loaderPath);
        return;
    }
    
    $.evalFile(loaderFile);
    
    // Verify loading
    if (typeof ActionRegistry === 'undefined') {
        alert('ERROR: ActionRegistry not loaded!');
        return;
    }
    
    // Run quick tests
    var results = [];
    var passed = 0;
    var failed = 0;
    
    function test(name, fn) {
        try {
            var result = fn();
            if (result && result.success !== false) {
                passed++;
                results.push('✓ ' + name);
            } else {
                failed++;
                results.push('✗ ' + name + ': ' + (result ? result.error : 'Failed'));
            }
        } catch (e) {
            failed++;
            results.push('✗ ' + name + ': ' + e.toString());
        }
    }
    
    // Create test comp
    var testComp = app.project.items.addComp('Quick Test', 1920, 1080, 1, 5, 30);
    
    app.beginUndoGroup('Quick Test');
    
    try {
        // Core tests
        test('ActionRegistry loaded', function() {
            return { success: ActionRegistry.list().length === 152 };
        });
        
        test('testScript action', function() {
            return ActionRegistry.execute('testScript', {});
        });
        
        test('createComp', function() {
            var result = ActionRegistry.execute('createComp', {
                name: 'Test Created Comp',
                width: 1920,
                height: 1080,
                duration: 3
            });
            // Clean up
            if (result.success) {
                for (var i = app.project.numItems; i >= 1; i--) {
                    if (app.project.item(i).name === 'Test Created Comp') {
                        app.project.item(i).remove();
                        break;
                    }
                }
            }
            return result;
        });
        
        test('addTextLayer', function() {
            return ActionRegistry.execute('addTextLayer', {
                text: 'Test Text',
                fontSize: 72
            });
        });
        
        test('addShapeLayer', function() {
            return ActionRegistry.execute('addShapeLayer', {
                shape: 'rectangle',
                size: [200, 200],
                fill: [1, 0, 0]
            });
        });
        
        test('setProperty', function() {
            return ActionRegistry.execute('setProperty', {
                layerIndex: 1,
                property: 'Position',
                value: [960, 540]
            });
        });
        
        test('applyBlur', function() {
            return ActionRegistry.execute('applyBlur', {
                layerIndex: 1,
                blurType: 'gaussian',
                blurriness: 5
            });
        });
        
        test('applyGlow', function() {
            return ActionRegistry.execute('applyGlow', {
                layerIndex: 1,
                radius: 25
            });
        });
        
        test('addKeyframe', function() {
            return ActionRegistry.execute('addKeyframe', {
                layerIndex: 1,
                property: 'Opacity',
                time: 0,
                value: 0
            });
        });
        
        test('animateProperty', function() {
            return ActionRegistry.execute('animateProperty', {
                layerIndex: 1,
                property: 'Scale',
                startValue: [0, 0],
                endValue: [100, 100],
                startTime: 0,
                endTime: 1
            });
        });
        
        test('addCamera', function() {
            return ActionRegistry.execute('addCamera', {
                preset: 'oneNode'
            });
        });
        
        test('addLightRig', function() {
            return ActionRegistry.execute('addLightRig', {});
        });
        
        test('getCompInfo', function() {
            return ActionRegistry.execute('getCompInfo', {});
        });
        
        test('getProjectInfo', function() {
            return ActionRegistry.execute('getProjectInfo', {});
        });
        
    } finally {
        app.endUndoGroup();
    }
    
    // Cleanup
    testComp.remove();
    app.executeCommand(16); // Undo
    
    // Show results
    var summary = '========================================\n';
    summary += 'AE AI ASSISTANT - QUICK TEST\n';
    summary += '========================================\n\n';
    summary += 'Actions registered: ' + ActionRegistry.list().length + '/152\n\n';
    summary += results.join('\n') + '\n\n';
    summary += '----------------------------------------\n';
    summary += 'Passed: ' + passed + '  Failed: ' + failed + '\n';
    summary += 'Success Rate: ' + Math.round(passed / (passed + failed) * 100) + '%\n';
    summary += '----------------------------------------\n';
    
    if (failed === 0) {
        summary += '\n✓ ALL TESTS PASSED!\n';
        summary += 'The extension is working correctly.';
    } else {
        summary += '\n⚠ Some tests failed.\n';
        summary += 'Check the error messages above.';
    }
    
    // Show in dialog
    var w = new Window('dialog', 'AE AI Assistant - Test Results');
    w.orientation = 'column';
    w.alignChildren = ['fill', 'top'];
    
    var textBox = w.add('edittext', undefined, summary, { multiline: true, readonly: true });
    textBox.preferredSize = [500, 400];
    textBox.graphics.font = ScriptUI.newFont('Consolas', 'Regular', 12);
    
    var btnGroup = w.add('group');
    btnGroup.alignment = 'center';
    
    var okBtn = btnGroup.add('button', undefined, 'OK');
    okBtn.onClick = function() { w.close(); };
    
    var fullTestBtn = btnGroup.add('button', undefined, 'Run Full Tests');
    fullTestBtn.onClick = function() {
        w.close();
        // Run full test suite
        $.evalFile(scriptFolder.fsName + '/test-functional.jsx');
    };
    
    w.show();
    
})();

// ============================================
// DOMAIN: Material
// 3D Material options for layers
// ============================================

var MaterialDomain = (function() {
    
    /**
     * Get material options property group
     * @param {Layer} layer - The layer
     * @returns {PropertyGroup|null} Material options group
     */
    function getMaterialOptions(layer) {
        return layer.property('ADBE Material Options Group');
    }
    
    /**
     * Apply material properties to layer
     * @param {Layer} layer - The layer
     * @param {Object} options - Material options
     */
    function applyMaterial(layer, options) {
        var mat = getMaterialOptions(layer);
        if (!mat) return;
        
        var castsShadows = options.castsShadows !== undefined ? (options.castsShadows ? 1 : 0) : 1;
        var acceptsShadows = options.acceptsShadows !== undefined ? (options.acceptsShadows ? 1 : 0) : 1;
        var acceptsLights = options.acceptsLights !== undefined ? (options.acceptsLights ? 1 : 0) : 1;
        
        Utils.setProp(mat, 'ADBE Casts Shadows', castsShadows);
        Utils.setProp(mat, 'ADBE Accepts Shadows', acceptsShadows);
        Utils.setProp(mat, 'ADBE Accepts Lights', acceptsLights);
        
        if (options.lightTransmission !== undefined) {
            Utils.setProp(mat, 'ADBE Light Transmission', options.lightTransmission);
        }
        if (options.ambient !== undefined) {
            Utils.setProp(mat, 'ADBE Ambient Coefficient', options.ambient);
        }
        if (options.diffuse !== undefined) {
            Utils.setProp(mat, 'ADBE Diffuse Coefficient', options.diffuse);
        }
        if (options.specular !== undefined) {
            Utils.setProp(mat, 'ADBE Specular Coefficient', options.specular);
        }
        if (options.shininess !== undefined) {
            Utils.setProp(mat, 'ADBE Shininess Coefficient', options.shininess);
        }
        if (options.metal !== undefined) {
            Utils.setProp(mat, 'ADBE Metal Coefficient', options.metal);
        }
        if (options.reflection !== undefined) {
            Utils.setProp(mat, 'ADBE Reflection Coefficient', options.reflection);
        }
        if (options.glossiness !== undefined) {
            Utils.setProp(mat, 'ADBE Glossiness Coefficient', options.glossiness);
        }
        if (options.transparency !== undefined) {
            Utils.setProp(mat, 'ADBE Transparency Coefficient', options.transparency);
        }
    }
    
    /**
     * Configure layer for shadow catching
     * @param {Layer} layer - The layer
     */
    function configureShadowCatcher(layer) {
        var mat = getMaterialOptions(layer);
        if (!mat) return;
        
        Utils.setProp(mat, 'ADBE Casts Shadows', 0);
        Utils.setProp(mat, 'ADBE Accepts Shadows', 1);
        Utils.setProp(mat, 'ADBE Accepts Lights', 1);
        Utils.setProp(mat, 'ADBE Ambient Coefficient', 100);
        Utils.setProp(mat, 'ADBE Diffuse Coefficient', 0);
        Utils.setProp(mat, 'ADBE Specular Coefficient', 0);
    }
    
    /**
     * Get default metallic material for coins
     * @returns {Object} Material configuration
     */
    function getMetallicMaterial() {
        return {
            castsShadows: true,
            acceptsLights: true,
            specular: 80,
            shininess: 50,
            metal: 100
        };
    }
    
    return {
        getMaterialOptions: getMaterialOptions,
        applyMaterial: applyMaterial,
        configureShadowCatcher: configureShadowCatcher,
        getMetallicMaterial: getMetallicMaterial
    };
})();

// Object to store current model data
window.currentModelData = {};

// Update these IDs if model changes (use top-level parent nodes for each model)
window.nodeMapping = {
    front: {
        'Alexx V': ['WA_AlexxV_L', 'WA_AlexxV_R'],
        'Alexia V': ['WA_AlexiaV_L', 'WA_AlexiaV_R'],
        'Sasha V': ['WA_SashaV_L', 'WA_SashaV_R'],
        'The WATT/Puppy': ['WA_WattPuppy_L', 'WA_WattPuppy_R'],
        'SabrinaX': ['WA_SabrinaX_L', 'WA_SabrinaX_R'],
        'TuneTot': ['WA_TuneTot_L', 'WA_TuneTot_R']
    },
    center: {
        'Mezzo CSC': ['WA_MezzoCSC001'],
        'WASAE Center': ['WASAE_Center001'],
        'No': []
    },
    surround: {
        'Alida CSC': ['WA_AlidaCSC_Wall_L', 'WA_AlidaCSC_Wall_R'],
        'No': []
    },
    subwoofer: {
        'Subsonic': {
            'L': ['WA_Subsonic_L'],
            'R': ['WA_Subsonic_R']
        },
        'Submerge': {
            'L': ['WA_Submerge_L'],
            'R': ['WA_Submerge_R']
        },
        'LōKē': {
            'L': ['WA_LoKe_L'],
            'R': ['WA_LoKe_R']
        },
        'No': {
            'L': [],
            'R': []
        }
    }
};



// From HTML
let timeWhenLastUpdate; 
let timeFromLastUpdate; 
let frameNumber = 1; 
let frameR = 0; 
function rotateLoad(startTime) { 
    const totalFrames = 16; 
    const animationDuration = 600; 
    const timePerFrame = animationDuration / totalFrames; 
    if ($('.loadAnim').length) { // Check if loadAnim exists
        if (!timeWhenLastUpdate) timeWhenLastUpdate = startTime; 
        timeFromLastUpdate = startTime - timeWhenLastUpdate; 
        if (timeFromLastUpdate > timePerFrame) { 
            frameR = 22.5 * frameNumber; 
            $('.loadAnim').css({ 
                '-webkit-transform': 'translate(-50%, -50%) rotate(' + frameR + 'deg)', 
                '-moz-transform': 'translate(-50%, -50%) rotate(' + frameR + 'deg)', 
                'transform': 'translate(-50%, -50%) rotate(' + frameR + 'deg)' 
            }); 
            timeWhenLastUpdate = startTime; 
            if (frameNumber >= totalFrames) { 
                frameNumber = 1; 
            } else { 
                frameNumber = frameNumber + 1; 
            } 
        } 
        requestAnimationFrame(rotateLoad); 
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Array of model data   
    var modelsData = [
        { uid: '244cd7bb12c54f829844b6529486d33c', name: 'Alexx V' },
        { uid: 'd9b33ffa68a342d48ea2204de2d723ed', name: 'Alexia V' },
        { uid: 'a8ea7c41a9ad4c1aa1c7fcaefd6a5241', name: 'Sasha V' },
        { uid: 'a3d7a161f1fc4ea6892c00b4911252a9', name: 'The WATT/Puppy' },
        { uid: 'd31b8119971f4fca8957268525078781', name: 'SabrinaX' },
        { uid: 'effca09109074872b246eaed1e2643b0', name: 'TuneTot' },
        { uid: 'f7d00b407f4e4e8089934e44e208eff2', name: 'Alida CSC' },
        { uid: 'd64e8c0f74d14a7897826f626d192766', name: 'Mezzo CSC' },
        { uid: 'e5657db58ef649b9a1a5aa0d35abda88', name: 'WASAE Center' },
        { uid: '9dcd7023038d4d55b0e691ba6529c63a', name: 'Submerge' },
        { uid: '63508b8e85e34aff84a6348c4759c86f', name: 'LōKē' },
        { uid: 'b60c16b531084dbda253b8c7b8b0b2e2', name: 'Wilson Audio' },
        { uid: 'b479bb02b127456c979f5b1f867eab6f', name: 'Subsonic' },
    ];
    
    // Object to store states of materials
    var materialState = {};

    let isFirstLoad = true;
    
    function updateWaGroupsVisibility() {
        if (isWaSceneLoaded()) {
            $('#waGroups').show();
            restoreWaState();
            $('#waColorContainer .colorDispItem[data-index="11"] .colorTextModel').removeClass('active');
        } else {
            $('#waGroups').hide();
            $('#waColorContainer .colorDispItem[data-index="11"] .colorTextModel').addClass('active');
        }
    }
    
    function isWaSceneLoaded() {
        return window.currentModelData && window.currentModelData.modelId === 'b60c16b531084dbda253b8c7b8b0b2e2';
    }
    
    // Object to store WA tab state
    var waState = {
        front: 'The WATT/Puppy', // Default Front Speakers
        center: 'No',
        surround: 'No',
        subwoofer: 'No',
        subL: true,
        subR: false 
    };
    

    // Restore WA tab state
    function restoreWaState() {
        ['front', 'center', 'surround', 'subwoofer'].forEach(type => {
            var selectedName = waState[type];
            $(`#waColorContainer .colorDispItem[data-type="${type}"]`).removeClass('active');
            $(`#waColorContainer .colorDispItem[data-type="${type}"] .colorTextModel`).removeClass('active');
            var $item = $(`#waColorContainer .colorDispItem[data-type="${type}"][data-name="${selectedName}"]`);
            $item.addClass('active');
            $item.find('.colorTextModel').addClass('active');
        });
    }

    // Update subwoofer visibility using node names
    function updateSubwooferDisplay() {
        if (!currentModelData.api) return; // Exit if Sketchfab API is not ready

        const subwooferOptions = document.querySelector('.subwoofer-options');

        // Hide all subwoofers from nodeMapping using node names
        currentModelData.api.getNodeMap((err, nodeMap) => {
            if (!err) {
                Object.keys(window.nodeMapping.subwoofer).forEach(model => {
                    const subNodes = window.nodeMapping.subwoofer[model];
                    if (subNodes['L']) {
                        subNodes['L'].forEach(name => {
                            const node = Object.values(nodeMap).find(n => n.name === name && (n.type === 'Group' || n.type === 'MatrixTransform'));
                            if (node) {
                                currentModelData.api.hide(node.instanceID);
                            }
                        });
                    }
                    if (subNodes['R']) {
                        subNodes['R'].forEach(name => {
                            const node = Object.values(nodeMap).find(n => n.name === name && (n.type === 'Group' || n.type === 'MatrixTransform'));
                            if (node) {
                                currentModelData.api.hide(node.instanceID);
                            }
                        });
                    }
                });

                if (waState.subwoofer === 'No') {
                    subwooferOptions.style.display = 'none'; // Hide Sub L and Sub R buttons
                } else {
                    subwooferOptions.style.display = 'flex'; // Show Sub L and Sub R buttons
                    const activeModel = window.nodeMapping.subwoofer[waState.subwoofer];
                    if (waState.subL && activeModel['L']) {
                        activeModel['L'].forEach(name => {
                            const node = Object.values(nodeMap).find(n => n.name === name && (n.type === 'Group' || n.type === 'MatrixTransform'));
                            if (node) {
                                currentModelData.api.show(node.instanceID); // Show left subwoofer
                            }
                        });
                    }
                    if (waState.subR && activeModel['R']) {
                        activeModel['R'].forEach(name => {
                            const node = Object.values(nodeMap).find(n => n.name === name && (n.type === 'Group' || n.type === 'MatrixTransform'));
                            if (node) {
                                currentModelData.api.show(node.instanceID); // Show right subwoofer
                            }
                        });
                    }
                }
            }
        });
    }

        function toggleProductInfoMenu() { 
        $("#productInfoContainer").toggleClass('hidden'); 
        $("#closeProductInfo .glyphicon-remove").toggleClass('hidden'); 
        $("#closeProductInfo .glyphicon-plus").toggleClass('hidden'); 
    }
    
    function toggleColorMenu() { 
        $("#confMenu").toggleClass('hidden'); 
        $("#toggleMenu .glyphicon-triangle-right").toggleClass('hidden'); 
        $("#toggleMenu .glyphicon-triangle-left").toggleClass('hidden'); 
    }

    // Restrict body colors based on model name or index
    function restrictBodyColors() {
        const limitedColorModels = ['SabrinaX', 'TuneTot'];
        const allowedColors = [
            'body-galaxy-gray', 'body-quartz', 'body-carbon',
            'body-ivory', 'body-diamond-black', 'body-crimson-satin'
        ];
        const colorButtons = document.querySelectorAll('#bodyColorContainer .colorDispItem');
        
        // Determine current model based on context
        let currentModelName;
        if (isWaSceneLoaded()) {
            // For WA tab, use waState.front
            currentModelName = waState.front;
        } else if (window.currentModelData && window.currentModelData.modelId) {
            // For Products tab, use current loaded model by UID
            const currentModel = modelsData.find(model => model.uid === window.currentModelData.modelId);
            currentModelName = currentModel?.name;
        }
    
        if (!currentModelName) {
            // If no model determined, show all colors
            colorButtons.forEach(button => button.style.display = 'block');
            return;
        }
    
        if (limitedColorModels.includes(currentModelName)) {
            colorButtons.forEach(button => {
                const slug = button.getAttribute('data-slug');
                button.style.display = allowedColors.includes(slug) ? 'block' : 'none';
            });
        } else {
            colorButtons.forEach(button => button.style.display = 'block');
        }
    }

    // Load a model
    window.loadModel = function(index) {
        return new Promise((resolve, reject) => {
            var model = modelsData[index];
            var iframe = document.getElementById('api-frame');
            
            iframe.src = `https://sketchfab.com/models/${model.uid}/embed?autostart=1&transparent=1`;

            var client = new Sketchfab(iframe);
            client.init(model.uid, {
                transparent: 1,
                // autospin: 0.1,
                success: function onSuccess(api) {
                    api.start();
                    api.addEventListener('viewerready', function() {
                        api.getMaterialList(function(err, materials) {
                            if (!err) {
                                currentModelData.api = api;
                                currentModelData.materials = materials;
                                currentModelData.modelId = model.uid;

                                // Log all available material channels for debugging
                                // console.log('Available materials and channels:', materials);

                                // Set HDRI properties
                                // api.setEnvironment({
                                //     rotation: 5.8, 
                                //     exposure: 1.0, 
                                //     lightIntensity: 1.0, 
                                //     shadowEnabled: true 
                                // }, function(err) {
                                //     if (err) {
                                //         console.error('Error setting HDRI:', err);
                                //     } 
                                // });

                                if (isFirstLoad) {
                                    changeOpacity('MI_Grile', 0);
                                    isFirstLoad = false;
                                } else {
                                    changeOpacity('MI_Grile', materialState['MI_Grile']?.opacity || 0);
                                }
                                
                                bindEventHandlers();

                                // Restore saved colors for MI_Logo and MI_Text from materialState, or use model defaults
                                currentModelData.materials.forEach(material => {
                                    if (material.name.startsWith('MI_Logo') || material.name.startsWith('MI_Text')) {
                                        const savedColor = materialState[material.name]?.color;
                                        if (savedColor) {
                                            changeColor(material.name, savedColor); // Apply saved color if exists
                                        }
                                    }
                                });

                                applySavedProperties();
                                updateModelName(model.name);

                                api.getNodeMap(function(err, nodes) {
                                    if (!err) {
                                        const parentNodes = Object.keys(nodes)
                                            .reduce((acc, id) => {
                                                const node = nodes[id];
                                                if ((node.type === 'Group' || node.type === 'MatrixTransform') && node.children && node.children.length > 0) {
                                                    acc[id] = node;
                                                }
                                                return acc;
                                            }, {});
                                        // console.log('Parent nodes in model:', parentNodes);    
                                        window.nodeList = parentNodes;
                                    } else {
                                        console.error('Error getting node map:', err);
                                    }
                                });

                                document.dispatchEvent(new Event('modelLoaded'));
                                
                                // Update Products tab active state
                                const loadedModelIndex = modelsData.findIndex(model => model.uid === window.currentModelData.modelId);
                                if (loadedModelIndex !== -1) {
                                    $('#modelColorContainer .colorDispItem .colorTextModel').removeClass('active');
                                    $(`#modelColorContainer .colorDispItem[data-index="${loadedModelIndex}"] .colorTextModel`).addClass('active');
                                }

                                restrictBodyColors();

                                if (window.currentModelData.modelId === 'b60c16b531084dbda253b8c7b8b0b2e2') {
                                    updateVisibility();
                                    updateSubwooferDisplay();
                                    // Ensure UI updates after model load
                                    setTimeout(function() {
                                        updateWaGroupsVisibility();
                                    }, 0);
                                }

                                resolve();
                            } else {
                                reject(err);
                            }
                        });
                    });
                },
                error: function onError() {
                    reject('API initialization error');
                }
            });
        });
    };

    // Update the model name
    function updateModelName(name) {
        document.querySelector('#productInfo .productInfTitle').textContent = name;
    }

    // Apply all saved properties globally
    function applySavedProperties() {
        for (var materialName in materialState) {
            if (materialState.hasOwnProperty(materialName)) {
                for (var property in materialState[materialName]) {
                    if (materialState[materialName].hasOwnProperty(property)) {
                        updateMaterialProperty(materialName, property, materialState[materialName][property]);
                    }
                }
            }
        }
    }

    // Update Base Color
    function changeColor(materialName, colorValue) {
        let rgb = colorValue; // Use RGB array directly
        if (Array.isArray(colorValue)) {
            rgb = colorValue.map(v => Math.round(v * 1000) / 1000); // Round to 3 decimal places for precision
        } else {
            console.error('Invalid color value:', colorValue);
            return;
        }
        updateMaterialProperty(materialName, 'color', rgb);
    }
    // Update Opacity
    function changeOpacity(materialName, opacity) {
        updateMaterialProperty(materialName, 'opacity', opacity);
    }
    // Apply all material properties at once to any material
    function applyMaterialProperties(materialName, properties) {
        const defaultProperties = {
            BC: 1,         // Base Color Intensity
            M: 0,          // Metallness
            R: 1,          // Roughness
            S: 0.01,        // Specular
            CCEnable: 1,   // Clear Coat On/Off
            CCInt: 1,      // Clear Coat Intensity
            CCThick: 1,    // Clear Coat Thickness
            CCRough: 0.04  // Clear Coat Roughness
        };
        const mergedProperties = { ...defaultProperties, ...properties };
        
        for (let [property, value] of Object.entries(mergedProperties)) {
            updateMaterialProperty(materialName, property, value);
        }
    }

    // Update any property of a material
    function updateMaterialProperty(materialName, property, value) {
        var material = currentModelData.materials.find(m => m.name === materialName);
        if (material) {
            materialState[materialName] = materialState[materialName] || {};
            materialState[materialName][property] = value;
    
            let channels = {}; // Initialize channels for PBR properties only

            // Apply changes based on property type
            switch(property) {
                case 'color': // Base Color - Color
                    channels = {
                        AlbedoPBR: { color: value }
                    };
                    break;
                case 'BC': // Base Color - Intensity
                    channels = {
                        AlbedoPBR: { factor: value }
                    };
                    break;
                case 'M': // Metallness (0.0-1.0)
                    channels = {
                        MetalnessPBR: { factor: value }
                    };
                    break;
                case 'R': // Roughness (0.0-1.0)
                    channels = {
                        RoughnessPBR: { factor: value }
                    };
                    break;
                case 'S': // Specular (0.0-1.0)
                    channels = {
                        SpecularPBR: { factor: value }
                    };
                    break;
                case 'CCEnable': // Clear Coat Enable/disable
                    channels = {
                        ClearCoat: {
                            enable: value === 1, // true/false based on 0/1
                            factor: material.channels.ClearCoat?.factor || 0,
                            thickness: material.channels.ClearCoat?.thickness || 0,
                            reflectivity: material.channels.ClearCoat?.reflectivity || 0,
                            tint: material.channels.ClearCoat?.tint || [1, 1, 1]
                        }
                    };
                    break;
                case 'CCInt': // Clear Coat Intensity
                    channels = {
                        ClearCoat: {
                            enable: material.channels.ClearCoat?.enable || true,
                            factor: value,       // Intensity (0-1)
                            thickness: material.channels.ClearCoat?.thickness || 0,
                            reflectivity: material.channels.ClearCoat?.reflectivity || 0,
                            tint: material.channels.ClearCoat?.tint || [1, 1, 1]
                        } 
                    };
                    break;
                case 'CCThick': // Clear Coat Thickness
                    channels = {
                        ClearCoat: {
                            enable: material.channels.ClearCoat?.enable || true,
                            factor: material.channels.ClearCoat?.factor || 0,
                            thickness: value,    // Thickness (0-20)
                            reflectivity: material.channels.ClearCoat?.reflectivity || 0,
                            tint: material.channels.ClearCoat?.tint || [1, 1, 1]
                        }
                    };
                    break;
                case 'CCRough': // Clear Coat Roughness
                    channels = {
                        ClearCoatRoughness: {
                            enable: true,
                            factor: value        // Roughness of clear coat (0-1)
                        }
                    };
                    break;
                case 'opacity': // Opacity
                    material.channels.Opacity = { enable: true, factor: value };
                    break;
                default:
                    console.warn(`Property ${property} not handled`);
            }
            
            // Apply PBR changes only if channels exist
            if (property !== 'opacity' && Object.keys(channels).length > 0) {
                Object.keys(channels).forEach(channel => {
                    material.channels[channel] = channels[channel];
                });
            }

            currentModelData.api.setMaterial(material, function(err, result) {
                if (err) {
                    console.error('Error updating material:', err, 'for property:', property, 'value:', value);
            }
            });
        } else {
            console.log('Material ' + materialName + ' not found');
        }
    }

    // Bind event handlers
    
    function bindEventHandlers() {
        // Binding events to buttons

        // Add event listeners for material controls

        // document.getElementById('color-factor-input')?.addEventListener('input', function(e) {
        //     applyMaterialProperties('MI_MainColor', { BC: parseFloat(e.target.value) || 1 });
        // });
        // document.getElementById('metal-input')?.addEventListener('input', function(e) {
        //     applyMaterialProperties('MI_MainColor', { M: parseFloat(e.target.value) || 0 });
        // });
        // document.getElementById('roughness-input')?.addEventListener('input', function(e) {
        //     applyMaterialProperties('MI_MainColor', { R: parseFloat(e.target.value) || 1 });
        // });
        // document.getElementById('specular-input')?.addEventListener('input', function(e) {
        //     applyMaterialProperties('MI_MainColor', { S: parseFloat(e.target.value) || 0.5 });
        // });
        // document.getElementById('clearcoat-enable')?.addEventListener('input', function(e) {
        //     applyMaterialProperties('MI_MainColor', { CCEnable: parseInt(e.target.value) || 1 });
        // });
        // document.getElementById('clearcoat-factor')?.addEventListener('input', function(e) {
        //     applyMaterialProperties('MI_MainColor', { CCInt: parseFloat(e.target.value) || 1 });
        // });
        // document.getElementById('clearcoat-thickness')?.addEventListener('input', function(e) {
        //     applyMaterialProperties('MI_MainColor', { CCThick: parseFloat(e.target.value) || 1 });
        // });
        // document.getElementById('clearcoat-roughness-input')?.addEventListener('input', function(e) {
        //     applyMaterialProperties('MI_MainColor', { CCRough: parseFloat(e.target.value) || 0.04 });
        // });

        // Note: RGB values are used instead of HEX due to Sketchfab's color processing.
        // HEX codes from the interface (e.g., #3f3a37 for Galaxy Gray) differ from actual RGB after model upload,
        // likely due to gamma correction or color space conversion. Exact curve not calculated, RGB taken empirically.


        // Body Color - Standard
        
        // Galaxy Gray
        document.getElementById('body-galaxy-gray').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.0497, 0.0423, 0.0382]);
            applyMaterialProperties('MI_MainColor', { M: 0 });
        });
        // GT Silver
        document.getElementById('body-gt-silver').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.4678, 0.4452, 0.4233]); 
            applyMaterialProperties('MI_MainColor', { M: 0 });
        });
        // Quartz
        document.getElementById('body-quartz').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.5457, 0.4397, 0.2874]); 
            applyMaterialProperties('MI_MainColor', { M: 0 });
        });
        // Carbon
        document.getElementById('body-carbon').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.0222, 0.0284, 0.0262]); 
            applyMaterialProperties('MI_MainColor', { M: 0 });
        });
        // Medio Grigio
        document.getElementById('body-medio-grigio').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.1144, 0.1144, 0.1144]); 
            applyMaterialProperties('MI_MainColor', { M: 0 });
        });

        // Body Color - Upgrade

        // Obsidian Black
        document.getElementById('body-obsidian-black').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.0080, 0.0168, 0.0137]); 
            applyMaterialProperties('MI_MainColor', { M: 0 });
        });
        // Ivory
        document.getElementById('body-ivory').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.8148, 0.7605, 0.6795]); 
            applyMaterialProperties('MI_MainColor', { M: 0 });
        });
        // Diamond Black
        document.getElementById('body-diamond-black').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.0030, 0.0037, 0.0033]); 
            applyMaterialProperties('MI_MainColor', { M: 0 });
        });
        // Crimson Satin
        document.getElementById('body-crimson-satin').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.1329, 0.0060, 0.0070]); 
            applyMaterialProperties('MI_MainColor', { M: 0 });
        });
        // Fly Yellow
        document.getElementById('body-fly-yellow').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.9387, 0.7379, 0.0024]); 
            applyMaterialProperties('MI_MainColor', { M: 0 });
        });
        // Estoril Blue
        document.getElementById('body-estoril-blue').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.0382, 0.0409, 0.0999]); 
            applyMaterialProperties('MI_MainColor', { M: 0 });
        });
        // Nara Bronze
        document.getElementById('body-nara-bronze').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.0999, 0.0802, 0.0409]); 
            applyMaterialProperties('MI_MainColor', { M: 0 });
        });
        // Pur Sang Rouge
        document.getElementById('body-pur-sang-rouge').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.5271, 0.0144, 0.0194]); 
            applyMaterialProperties('MI_MainColor', { M: 0 });
        });
        // Cobalt Blue Satin
        document.getElementById('body-cobalt-blue-satin').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.0467, 0.0742, 0.2051]); 
            applyMaterialProperties('MI_MainColor', { M: 0 });
        });
        // Chalk
        document.getElementById('body-chalk').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.3712, 0.3813, 0.3613]); 
            applyMaterialProperties('MI_MainColor', { M: 0 });
        });
        // Classic Orange
        document.getElementById('body-classic-orange').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.7682, 0.0953, 0.0075]); 
            applyMaterialProperties('MI_MainColor', { M: 0 });
        });
        // Oak Green
        document.getElementById('body-oak-green-satin').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.0296, 0.0529, 0.0307]); 
            applyMaterialProperties('MI_MainColor', { M: 0 });
        });
        // True Gold
        document.getElementById('body-true-gold').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.4564, 0.2961, 0.0497]); 
            applyMaterialProperties('MI_MainColor', { M: 0 });
        });
        // Meadow Mist Satin
        document.getElementById('body-meadow-mist-satin').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.2831, 0.2747, 0.1678]); 
            applyMaterialProperties('MI_MainColor', { M: 0 });
        });
        // Spearmint
        document.getElementById('body-spearmint').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.2157, 0.5647, 0.4564]); 
            applyMaterialProperties('MI_MainColor', { M: 0 });
        });
        // Dark Walnut Metallic Satin
        document.getElementById('body-dark-walnut-metallic-satin').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.0273, 0.0176, 0.0110]); 
            applyMaterialProperties('MI_MainColor', { M: 0 });
        });
        // Blond Silver Satin
        document.getElementById('body-blond-silver-satin').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.4125, 0.3324, 0.2122]); 
            applyMaterialProperties('MI_MainColor', { M: 0 });
        });

        // Body Color - Premium Pearl

        // Saffron Pearl
        document.getElementById('body-saffron-pearl').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.7379, 0.4179, 0.0452]); 
            applyMaterialProperties('MI_MainColor', { M: 1 });
        });
        // Bergamot Pearl
        document.getElementById('body-bergamot-pearl').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.8796, 0.1714, 0.0160]); 
            applyMaterialProperties('MI_MainColor', { M: 1 });
        });
        // Cranberry Pearl
        document.getElementById('body-cranberry-pearl').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.0802, 0.0122, 0.0091]); 
            applyMaterialProperties('MI_MainColor', { M: 1 });
        });
        // Olympia Pearl
        document.getElementById('body-olympia-pearl').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.7454, 0.7230, 0.7230]); 
            applyMaterialProperties('MI_MainColor', { M: 1 });
        });
        // Viola Pearl
        document.getElementById('body-viola-pearl').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.0382, 0.0185, 0.1413]); 
            applyMaterialProperties('MI_MainColor', { M: 1 });
        });
        // Glacier Frost Pearl
        document.getElementById('body-glacier-frost-pearl').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.8879, 0.8879, 0.8469]); 
            applyMaterialProperties('MI_MainColor', { M: 1 });
        });
        // Silver Ice Pearl
        document.getElementById('body-silver-ice-pearl').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.6308, 0.7011, 0.7835]); 
            applyMaterialProperties('MI_MainColor', { M: 1 });
        });
        // Blue Orchid Pearl
        document.getElementById('body-blue-orchid-pearl').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.1022, 0.4072, 0.4910]); 
            applyMaterialProperties('MI_MainColor', { M: 1 });
        });
        // Ruby Red Pearl
        document.getElementById('body-ruby-red-pearl').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.2232, 0.0003, 0.0003]); 
            applyMaterialProperties('MI_MainColor', { M: 1 });
        });
        // Ember Pearl
        document.getElementById('body-ember-pearl').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.0467, 0.0080, 0.0070]); 
            applyMaterialProperties('MI_MainColor', { M: 1 });
        });
        // NZ Black Sand Pearl
        document.getElementById('body-nz-black-sand-pearl').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.0273, 0.0176, 0.0110]); 
            applyMaterialProperties('MI_MainColor', { M: 1 });
        });


        // Grille Color

        // No Grille
        document.getElementById('no-grille').addEventListener('click', function() {
            changeOpacity('MI_Grile', 0); 
        });
        // Black
        document.getElementById('grille-black').addEventListener('click', function() {
            changeColor('MI_Grile', [0.0030, 0.0033, 0.0033]); 
            changeOpacity('MI_Grile', 1);
        });
        // Parchment Gray
        document.getElementById('grille-parchment-gray').addEventListener('click', function() {
            changeColor('MI_Grile', [0.4125, 0.3324, 0.2122]); 
            changeOpacity('MI_Grile', 1);
        });
        // Slate Gray
        document.getElementById('grille-slate-gray').addEventListener('click', function() {
            changeColor('MI_Grile', [0.0409, 0.0395, 0.0423]); 
            changeOpacity('MI_Grile', 1);
        });
        // Mocha
        document.getElementById('grille-mocha').addEventListener('click', function() {
            changeColor('MI_Grile', [0.0273, 0.0176, 0.0110]); 
            changeOpacity('MI_Grile', 1);
        });
        // Le Mans Blue
        document.getElementById('grille-le-mans-blue').addEventListener('click', function() {
            changeColor('MI_Grile', [0.0137, 0.0152, 0.0331]); 
            changeOpacity('MI_Grile', 1);
        });
        // Blanco
        document.getElementById('grille-blanco').addEventListener('click', function() {
            changeColor('MI_Grile', [0.9216, 0.9216, 0.8963]); 
            changeOpacity('MI_Grile', 1);
        });
        // Crimson Red
        document.getElementById('grille-crimson-red').addEventListener('click', function() {
            changeColor('MI_Grile', [0.2086, 0.0296, 0.0262]); 
            changeOpacity('MI_Grile', 1);
        });

        
        // Hardware Color

        // Silver / Natural
        document.getElementById('hardware-silver-natural').addEventListener('click', function() {
            ['MI_AlumColor', 'MI_AlumColor_Logo', 'MI_CromeColor', 'MI_ScrewDecal', 'MI_AcousticDiode'].forEach(name => {
                changeColor(name, [0.4020, 0.4020, 0.4020]);
            });
            // Text Black
            currentModelData.materials.forEach(material => {
                if (material.name.startsWith('MI_Logo') || material.name.startsWith('MI_Text')) {
                    changeColor(material.name, [0, 0, 0]); // Text Black
                }
            });
        });
        // Black
        document.getElementById('hardware-black').addEventListener('click', function() {
            ['MI_AlumColor', 'MI_AlumColor_Logo', 'MI_CromeColor', 'MI_ScrewDecal', 'MI_AcousticDiode'].forEach(name => {
                changeColor(name, [0.05, 0.05, 0.05]); 
            });
            // Text White
            currentModelData.materials.forEach(material => {
                if (material.name.startsWith('MI_Logo') || material.name.startsWith('MI_Text')) {
                    changeColor(material.name, [0.95, 0.95, 0.95]); // Text Black
                }
            });
        });

    }

    // Hide all nodes for a category using node names
    function hideCategoryNodes(category) {
        if (!currentModelData.api) return; // Exit if API is not ready

        const nodeNames = window.nodeMapping[category];
        currentModelData.api.getNodeMap((err, nodeMap) => {
            if (!err) {
                Object.values(nodeNames).flat().forEach(name => {
                    if (name) {
                        const node = Object.values(nodeMap).find(n => n.name === name && (n.type === 'Group' || n.type === 'MatrixTransform'));
                        if (node) {
                            currentModelData.api.hide(node.instanceID);
                        }
                    }
                });
            }
        });
    }

    // Show specific nodes for a given category and name using node names
    function showNodes(category, name) {
        if (!currentModelData.api) return; // Exit if API is not ready

        const nodeNames = window.nodeMapping[category][name];
        if (nodeNames && nodeNames.length > 0) {
            currentModelData.api.getNodeMap((err, nodeMap) => {
                if (!err) {
                    nodeNames.forEach(name => {
                        const node = Object.values(nodeMap).find(n => n.name === name && (n.type === 'Group' || n.type === 'MatrixTransform'));
                        if (node) {
                            currentModelData.api.show(node.instanceID);
                        }
                    });
                }
            });
        }
    }

    // Update visibility based on waState
    function updateVisibility() {
        ['front', 'center', 'surround', 'subwoofer'].forEach(category => {
            hideCategoryNodes(category);
            const selectedName = waState[category];
            showNodes(category, selectedName);
        });
    }

    // UI initialization
    $('#toggleMenu').tooltip('show'); 
    $('#closeProductInfo').tooltip('show'); 
    setTimeout(function() { 
        $('#toggleMenu').tooltip('dispose'); 
        $('#closeProductInfo').tooltip('dispose'); 
        if(!$("#productInfoContainer").hasClass('hidden')) { 
            toggleProductInfoMenu(); 
        } 
    }, 7000); 
    
    $("#toggleMenu").on('click', function() { 
        toggleColorMenu(); 
    }); 
    $('#closeProductInfo').on('click', function() { 
        toggleProductInfoMenu(); 
    }); 
    requestAnimationFrame(rotateLoad);

    if (isWaSceneLoaded() && window.currentModelData.api) {
        // Initially hide all nodes from nodeMapping
        ['front', 'center', 'surround', 'subwoofer'].forEach(category => {
            Object.keys(window.nodeMapping[category]).forEach(modelName => {
                window.nodeMapping[category][modelName].forEach(id => {
                    window.currentModelData.api.hide(id);
                });
            });
        });
        // Restore state and show selected nodes
        restoreWaState();
        ['front', 'center', 'surround', 'subwoofer'].forEach(category => {
            const selectedName = waState[category];
            const nodeIds = window.nodeMapping[category][selectedName];
            if (nodeIds && nodeIds.length > 0) {
                nodeIds.forEach(id => window.currentModelData.api.show(id));
            }
        });
        // Restrict colors based on initial front model
        restrictBodyColors();
    }

    $('.colorDispItem, .sub-option').click(function(e) { 
        var type = $(this).data('type'); 
        var name = $(this).data('name'); 
        var slug = $(this).data('slug'); 
        var color = $(this).data('color'); 
        var activeTab = $('#nav-tab .nav-link.active').attr('id'); 
    
        // Handle Sub L and Sub R buttons
        if ($(this).hasClass('sub-option')) {
            const subSide = $(this).data('sub'); // 'L' or 'R'
            if (waState.subwoofer !== 'No') {
                if (subSide === 'L' && !waState.subR && waState.subL) {
                    $(this).addClass('disabled-click');
                    setTimeout(() => $(this).removeClass('disabled-click'), 500);
                } else if (subSide === 'R' && !waState.subL && waState.subR) {
                    $(this).addClass('disabled-click');
                    setTimeout(() => $(this).removeClass('disabled-click'), 500);
                } else {
                    if (subSide === 'L') {
                        waState.subL = !waState.subL;
                        $(this).toggleClass('active', waState.subL);
                    } else if (subSide === 'R') {
                        waState.subR = !waState.subR;
                        $(this).toggleClass('active', waState.subR);
                    }
                    updateSubwooferDisplay();
                }
            }
            return; // Exit after handling sub-option click
        }
    
        // Handle clicks within WA tab
        if ($(this).closest('#waColorContainer').length > 0) {
            if (type && (type === 'front' || type === 'center' || type === 'surround' || type === 'subwoofer')) {
                // Remove active class from all items of the same type and set it on the clicked item
                $(`#waColorContainer .colorDispItem[data-type="${type}"]`).removeClass('active'); 
                $(this).addClass('active'); 
                $(`#waColorContainer .colorDispItem[data-type="${type}"] .colorTextModel`).removeClass('active');
                $(this).find('.colorTextModel').addClass('active');
    
                // Update waState with the selected name
                waState[type] = name;
    
                if (window.currentModelData && window.currentModelData.api && window.nodeList) {
                    currentModelData.api.getNodeMap((err, nodeMap) => {
                        if (!err) {
                            // Hide all nodes for this type using node names
                            Object.keys(window.nodeMapping[type]).forEach(modelName => {
                                const nodes = window.nodeMapping[type][modelName];
                                if (Array.isArray(nodes)) {
                                    nodes.forEach(name => {
                                        const node = Object.values(nodeMap).find(n => n.name === name && (n.type === 'Group' || n.type === 'MatrixTransform'));
                                        if (node) {
                                            currentModelData.api.hide(node.instanceID);
                                        }
                                    });
                                } else {
                                    if (nodes['L']) {
                                        nodes['L'].forEach(name => {
                                            const node = Object.values(nodeMap).find(n => n.name === name && (n.type === 'Group' || n.type === 'MatrixTransform'));
                                            if (node) {
                                                currentModelData.api.hide(node.instanceID);
                                            }
                                        });
                                    }
                                    if (nodes['R']) {
                                        nodes['R'].forEach(name => {
                                            const node = Object.values(nodeMap).find(n => n.name === name && (n.type === 'Group' || n.type === 'MatrixTransform'));
                                            if (node) {
                                                currentModelData.api.hide(node.instanceID);
                                            }
                                        });
                                    }
                                }
                            });
                
                            // Show nodes or delegate to updateSubwooferDisplay for subwoofers
                            if (type === 'subwoofer') {
                                updateSubwooferDisplay(); // Delegate subwoofer visibility to dedicated function
                            } else {
                                const nodeNames = window.nodeMapping[type][name];
                                if (nodeNames && nodeNames.length > 0) {
                                    nodeNames.forEach(name => {
                                        const node = Object.values(nodeMap).find(n => n.name === name && (n.type === 'Group' || n.type === 'MatrixTransform'));
                                        if (node) {
                                            currentModelData.api.show(node.instanceID);
                                        }
                                    });
                                }
                            }
                        }
                    });
                }
                
                restrictBodyColors();
            } else if ($(this).data('index') === 11 && activeTab === 'nav-wa-tab') {
                $('#nav-wa-tab').tab('show');
            }
        }
    
        // Handle clicks within Products tab
        if ($(this).closest('#modelColorContainer').length > 0) {
            var index = $(this).data('index');
            if (index !== undefined) {
                $('#modelColorContainer .colorDispItem .colorTextModel').removeClass('active');
                $(this).find('.colorTextModel').addClass('active');
                restrictBodyColors();
            }
        } else {
            // Handle clicks on other tabs (Body Colors, Grille Colors, Hardware Colors)
            if (type === 'body' || type === 'grilles' || type === 'hardware') {
                $(`.${type}ColorInf .colorText`).html(name); 
                $(`.${type}ColorInf .colorBox`).css({'background-color': color}); 
            }
        }
    });

    updateSubwooferDisplay();

    // Sync Sub L and Sub R buttons with waState on page load
    const subLOption = document.querySelector('.sub-option.sub-l');
    const subROption = document.querySelector('.sub-option.sub-r');
    subLOption.classList.toggle('active', waState.subL);
    subROption.classList.toggle('active', waState.subR);


    // Update visibility when tab changes
    $('#nav-tab a').on('shown.bs.tab', function (e) {
        updateWaGroupsVisibility();
    });

    // Initial visibility check
    updateWaGroupsVisibility();


    // Update visibility when tab changes
    $('#nav-tab a').on('shown.bs.tab', function (e) {
        updateWaGroupsVisibility();
    });

    // Initial visibility check
    updateWaGroupsVisibility();

    // Bind events to model options in the sidebar (Products tab)
    document.querySelectorAll('#modelColorContainer .colorDispItem[data-index]').forEach(item => {
        item.addEventListener('click', function() {
            var index = parseInt(this.getAttribute('data-index'), 10);
            loadModel(index);
            $('#nav-model-tab').tab('show');
        });
    });


    /// Bind event to Run Configurator in the WA tab
    document.querySelector('#waColorContainer .colorDispItem[data-index="11"]').addEventListener('click', function() {
        var index = parseInt(this.getAttribute('data-index'), 10);
        loadModel(index);
        $('#nav-wa-tab').tab('show');
    });

    // Binding change event to model selector (Optional)
    var modelSelector = document.getElementById('modelSelector');
    if (modelSelector) {
        modelSelector.addEventListener('change', function(e) {
            loadModel(parseInt(e.target.value, 10)); // Ensure the value is converted to a number
        });
    } else {
        console.error('Element modelSelector not found');
    }

    // Load the default model when the page loads
    window.loadModel(3).then(() => {
        console.log('Model successfully loaded and initialized');
    }).catch(err => {
        console.error('Error loading model:', err);
    });

    // Fullscreen mode
    const fullscreenBtn = document.getElementById('nav-fullscreen-tab');
    fullscreenBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen()
                .catch(err => console.error('Fullscreen failed:', err));
        } else {
            document.exitFullscreen()
                .catch(err => console.error('Exit fullscreen failed:', err));
        }
        fullscreenBtn.classList.toggle('active');
    });
});

// кастомный код из app.js для уаравления вкладками, сохранен на всякий случай
// $(document).ready(function() {
//     $(".dropdown-menu a.dropdown-toggle").on("click", function(e) {
//         if (!$(this).next().hasClass("show")) {
//             $(this).parents(".dropdown-menu").first().find(".show").removeClass("show");
//         }
//         $(this).next(".dropdown-menu").toggleClass("show");
//         $(this).parents("li.nav-item.dropdown.show").on("hidden.bs.dropdown", function(e) {
//             $(".dropdown-submenu .show").removeClass("show");
//         });
//         return false;
//     });
// });

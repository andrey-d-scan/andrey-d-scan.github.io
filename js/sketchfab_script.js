document.addEventListener('DOMContentLoaded', function() {
    // Array of model data   
    var modelsData = [
        { uid: '244cd7bb12c54f829844b6529486d33c', name: 'Alexx V' },
        { uid: 'd9b33ffa68a342d48ea2204de2d723ed', name: 'Alexia V' },
        { uid: 'a8ea7c41a9ad4c1aa1c7fcaefd6a5241', name: 'Sasha V' },
        { uid: 'a3d7a161f1fc4ea6892c00b4911252a9', name: 'The Watt Puppy' },
        { uid: 'd31b8119971f4fca8957268525078781', name: 'Sabrina X' },
        { uid: 'effca09109074872b246eaed1e2643b0', name: 'Tune Tot' },
        { uid: 'f7d00b407f4e4e8089934e44e208eff2', name: 'Alida CSC' },
        { uid: 'd64e8c0f74d14a7897826f626d192766', name: 'Mezzo CSC' },
        { uid: 'e5657db58ef649b9a1a5aa0d35abda88', name: 'WASAE Center' },
        { uid: '9dcd7023038d4d55b0e691ba6529c63a', name: 'Submerge' },
        { uid: '63508b8e85e34aff84a6348c4759c86f', name: 'LōKē' },
    ];

    // Object to store current model data
    var currentModelData = {};
    
    // Object to store states of materials
    var materialState = {};

    let isFirstLoad = true;
    
    // Lload a model
    window.loadModel = function(index) {
        return new Promise((resolve, reject) => {
            var model = modelsData[index];
            var iframe = document.getElementById('api-frame');
            
            iframe.src = `https://sketchfab.com/models/${model.uid}/embed?autostart=1&transparent=1`;

            var client = new Sketchfab(iframe);
            client.init(model.uid, {
                transparent: 1,
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
                                    changeOpacity('MI_Grile', 0); // Установить прозрачность 0 только при первой загрузке
                                    isFirstLoad = false; // Отметить, что первая загрузка выполнена
                                } else {
                                    changeOpacity('MI_Grile', materialState['MI_Grile']?.opacity || 0); // Восстановить сохранённое значение или 0, если нет
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

                                // Apply initial settings for specific model (index 3)
                                // if (index === 3) {
                                //     changeColor('MI_MainColor', [0.9490, 0.9490, 0.9490]); //Ethereal White Premium Pearl
                                //     ['MI_AlumColor', 'MI_AlumColor_Logo', 'MI_CromeColor', 'MI_ScrewDecal', 'MI_AcousticDiode'].forEach(name => {
                                //         changeColor(name, [0.851, 0.682, 0.2]); // Gold
                                //     });
                                //     ['MI_Logo', 'MI_Logo_2', 'MI_Text', 'MI_Text_2'].forEach(name => {
                                //         changeColor(name, [1, 1, 1]); // Text White
                                //     });
                                // }

                                // Ограничение цветов для моделей с индексами 0 и 1
                                const limitedColorModels = [4, 5]; // Sabrina X и Tune Tot
                                const allowedColors = [
                                    'body-galaxy-gray', // Galaxy Gray
                                    'body-quartz',      // Quartz
                                    'body-carbon',      // Carbon
                                    'body-ivory',       // Ivory
                                    'body-diamond-black', // Diamond Black
                                    'body-crimson-satin'  // Crimson Satin
                                ];
                                const colorButtons = document.querySelectorAll('#bodyColorContainer .colorDispItem');
                                if (limitedColorModels.includes(index)) {
                                    colorButtons.forEach(button => {
                                        const slug = button.getAttribute('data-slug');
                                        button.style.display = allowedColors.includes(slug) ? 'block' : 'none';
                                    });
                                } else {
                                    colorButtons.forEach(button => button.style.display = 'block');
                                }

                                resolve(); // Model fully initialized
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
            S: 0.5,        // Specular
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
            changeColor('MI_MainColor', 
                [0.0497, 0.0423, 0.0382]);
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

    // Bind events to model options in the sidebar (Products tab)
    document.querySelectorAll('#modelColorContainer .colorDispItem[data-index]').forEach(item => {
        item.addEventListener('click', function() {
            var index = parseInt(this.getAttribute('data-index'), 10);
            loadModel(index);
            // Switch to Products tab (optional, if you want to stay on Products after clicking)
            $('#nav-model-tab').tab('show');
        });
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

});

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


    // Function to load a model
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
                                
                                changeOpacity('MI_Grile', 0); 

                                // Set HDRI properties
                                api.setEnvironment({
                                    rotation: 0, 
                                    exposure: 1.0, 
                                    lightIntensity: 1.0, 
                                    shadowEnabled: true 
                                }, function(err) {
                                    if (err) {
                                        console.error('Error setting HDRI:', err);
                                    } 
                                });

                                                                
                                bindEventHandlers();
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

    // New function to update the model name
    function updateModelName(name) {
        document.querySelector('#productInfo .productInfTitle').textContent = name;
    }

    // Function to apply all saved properties globally
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

    // Function to change color of a material
    function changeColor(materialName, color) {
        updateMaterialProperty(materialName, 'color', color);
    }

    // Function to change opacity of a material
    function changeOpacity(materialName, opacity) {
        updateMaterialProperty(materialName, 'opacity', opacity);
    }


    // Function to update any property of a material
    function updateMaterialProperty(materialName, property, value) {
        var material = currentModelData.materials.find(m => m.name === materialName);
        if (material) {
            materialState[materialName] = materialState[materialName] || {};
            materialState[materialName][property] = value;
    
            // Apply changes based on property type
            switch(property) {
                case 'color':
                    material.channels.AlbedoPBR = {
                        enable: true,
                        color: value,
                        factor: 1
                    };
                    break;
                case 'opacity':
                    material.channels.Opacity = {
                        enable: true,
                        factor: value
                    };
                    break;
                default:
                    console.warn(`Property ${property} not handled`);
            }
    
            currentModelData.api.setMaterial(material, function(err, result) {
                if (err) {
                    console.error('Error updating material:', err);
                }
            });
        } else {
            console.log('Material ' + materialName + ' not found');
        }
    }

    // Function to bind event handlers
    function bindEventHandlers() {
        // Binding events to buttons
        // Body Color Standard
        document.getElementById('body-galaxy-gray').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.2471, 0.2275, 0.2157]); // Galaxy Gray
        });
        document.getElementById('body-gt-silver').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.7137, 0.6980, 0.6824]); // GT Silver
        });
        document.getElementById('body-quartz').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.7647, 0.6941, 0.5725]); // Quartz
        });
        document.getElementById('body-carbon').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.1608, 0.1843, 0.1765]); // Carbon
        });
        document.getElementById('body-medio-grigio').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.3725, 0.3725, 0.3725]); // Medio Grigio
        });

        // Body Color Upgrade
        document.getElementById('body-obsidian-black').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.0863, 0.1373, 0.1216]); // Obsidian Black
        });
        document.getElementById('body-ivory').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.9137, 0.8863, 0.8431]); // Ivory
        });
        document.getElementById('body-diamond-black').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.0392, 0.0471, 0.0431]); // Diamond Black
        });
        document.getElementById('body-crimson-satin').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.4000, 0.0706, 0.0784]); // Crimson Satin
        });
        document.getElementById('body-fly-yellow').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.9725, 0.8745, 0.0314]); // Fly Yellow
        });
        document.getElementById('body-estoril-blue').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.2157, 0.2235, 0.3490]); // Estoril Blue
        });
        document.getElementById('body-nara-bronze').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.3490, 0.3137, 0.2235]); // Nara Bronze
        });
        document.getElementById('body-pur-sang-rouge').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.7529, 0.1255, 0.1490]); // Pur Sang Rouge
        });
        document.getElementById('body-cobalt-blue-satin').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.2392, 0.3020, 0.4902]); // Cobalt Blue Satin
        });
        document.getElementById('body-chalk').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.6431, 0.6510, 0.6353]); // Chalk
        });
        document.getElementById('body-classic-orange').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.8902, 0.3412, 0.0824]); // Classic Orange
        });
        document.getElementById('body-oak-green-satin').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.1882, 0.2549, 0.1922]); // Oak Green
        });
        document.getElementById('body-true-gold').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.7059, 0.5804, 0.2471]); // True Gold
        });
        document.getElementById('body-meadow-mist-satin').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.5686, 0.5608, 0.4471]); // Meadow Mist Satin
        });
        document.getElementById('body-spearmint').addEventListener('click', function() {
            changeColor('MI_MainColor',[0.5020, 0.7765, 0.7059]); // Spearmint
        });
        document.getElementById('body-dark-walnut-metallic-satin').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.1804, 0.1412, 0.1059]); // Dark Walnut Metallic Satin
        });
        document.getElementById('body-blond-silver-satin').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.6745, 0.6118, 0.4980]); // Blond Silver Satin
        });

        // Body Color Premium Pearl
        document.getElementById('body-saffron-pearl').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.8745, 0.6784, 0.2353]); // Saffron Pearl
        });
        document.getElementById('body-bergamot-pearl').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.9451, 0.4510, 0.1333]); // Bergamot Pearl
        });
        document.getElementById('body-cranberry-pearl').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.3137, 0.1137, 0.0941]); // Cranberry Pearl
        });
        document.getElementById('body-olympia-pearl').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.8784, 0.8667, 0.8667]); // Olympia Pearl
        });
        document.getElementById('body-viola-pearl').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.2157, 0.1451, 0.4118]); // Viola Pearl
        });
        document.getElementById('body-glacier-frost-pearl').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.9490, 0.9490, 0.9294]); // Glacier Frost Pearl
        });
        document.getElementById('body-silver-ice-pearl').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.8157, 0.8549, 0.8980]); // Silver Ice Pearl
        });
        document.getElementById('body-blue-orchid-pearl').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.3529, 0.6706, 0.7294]); // Blue Orchid Pearl
        });
        document.getElementById('body-ruby-red-pearl').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.5098, 0.0039, 0.0039]); // Ruby Red Pearl
        });
        document.getElementById('body-ember-pearl').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.2392, 0.0863, 0.0784]); // Ember Pearl
        });
        document.getElementById('body-nz-black-sand-pearl').addEventListener('click', function() {
            changeColor('MI_MainColor', [0.1804, 0.1412, 0.1059]); // NZ Black Sand Pearl
        });

        // Grille Color
        document.getElementById('no-grille').addEventListener('click', function() {
            changeOpacity('MI_Grile', 0); // No Grille
        });
        document.getElementById('grille-black').addEventListener('click', function() {
            changeColor('MI_Grile', [0.0392, 0.0431, 0.0431]); // Black
            changeOpacity('MI_Grile', 1); //
        });
        document.getElementById('grille-parchment-gray').addEventListener('click', function() {
            changeColor('MI_Grile', [0.7137, 0.6706, 0.6471]); // Parchment Gray
            changeOpacity('MI_Grile', 1); //
        });
        document.getElementById('grille-slate-gray').addEventListener('click', function() {
            changeColor('MI_Grile', [0.2235, 0.2196, 0.2275]); // Slate Gray
            changeOpacity('MI_Grile', 1); //
        });
        document.getElementById('grille-mocha').addEventListener('click', function() {
            changeColor('MI_Grile', [0.2275, 0.1765, 0.1333]); // Mocha
            changeOpacity('MI_Grile', 1); //
        });
        document.getElementById('grille-le-mans-blue').addEventListener('click', function() {
            changeColor('MI_Grile', [0.1216, 0.1294, 0.2]); // Le Mans Blue
            changeOpacity('MI_Grile', 1); //
        });
        document.getElementById('grille-blanco').addEventListener('click', function() {
            changeColor('MI_Grile', [0.9647, 0.9647, 0.9529]); // Blanco
            changeOpacity('MI_Grile', 1); //
        });
        document.getElementById('grille-crimson-red').addEventListener('click', function() {
            changeColor('MI_Grile', [0.4941, 0.1882, 0.1765]); // Crimson Red
            changeOpacity('MI_Grile', 1); //
        });

        
        // Hardware Color
        document.getElementById('hardware-silver-natural').addEventListener('click', function() {
            ['MI_AlumColor', 'MI_AlumColor_Logo', 'MI_CromeColor', 'MI_ScrewDecal', 'MI_AcousticDiode' ].forEach(name => {
                changeColor(name, [0.6667, 0.6667, 0.6667]); // Silver / Natural
            });
            ['MI_Logo', 'MI_Logo_2', 'MI_Text', 'MI_Text_2' ].forEach(name => {
                changeColor(name, [0.05, 0.05, 0.05]); // Text Black
            });
        });

        document.getElementById('hardware-black').addEventListener('click', function() {
            ['MI_AlumColor', 'MI_AlumColor_Logo', 'MI_CromeColor', 'MI_ScrewDecal', 'MI_AcousticDiode' ].forEach(name => {
                changeColor(name, [0.05, 0.05, 0.05]); // Black
            });
            ['MI_Logo', 'MI_Logo_2', 'MI_Text', 'MI_Text_2' ].forEach(name => {
                changeColor(name, [1, 1, 1]); // Text White
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

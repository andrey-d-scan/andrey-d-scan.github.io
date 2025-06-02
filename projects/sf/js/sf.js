document.addEventListener('DOMContentLoaded', function() {
    var iframe = document.getElementById('api-frame');
    var client = new Sketchfab(iframe);
    
    const materialUtils = {
        setMaterialTextures(materialName, albedoUid, normalUid, roughnessUid) {
            const material = window.currentModelData.materials.find(m => m.name === materialName);
            if (material) {
                if (albedoUid) material.channels.AlbedoPBR.texture = { uid: albedoUid };
                if (normalUid) {
                    material.channels.NormalMap.enable = true;
                    material.channels.NormalMap.texture = { uid: normalUid };
                }
                if (roughnessUid) {
                    material.channels.RoughnessPBR.enable = true;
                    material.channels.RoughnessPBR.texture = { uid: roughnessUid };
                }
                window.currentModelData.api.setMaterial(material, function(err) {
                    if (err) console.error('Error updating textures:', err);
                });
            }
        },
    
        // Apply only specified material properties
        applyMaterialProperties(materialName, properties) {
            const defaultProperties = {
                BC: [1, 1, 1],
                BCInt: 1,
                M: 0,
                R: 1,
                S: 0.01,
                CCEnable: 1,
                CCInt: 1,
                CCThick: 1,
                CCRough: 0.04,
                Op: 1
            };
    
            for (let [property, value] of Object.entries(properties)) {
                this.updateMaterialProperty(materialName, property, value);
            }
        },
        
        // Update any property of a material
        updateMaterialProperty(materialName, property, value) {
            const material = window.currentModelData.materials.find(m => m.name === materialName);
            if (material) {
                let channels = {};
                switch(property) {
                    case 'BC':
                        if (Array.isArray(value)) {
                            channels = { AlbedoPBR: { color: value.map(v => Math.round(v * 1000) / 1000) } };
                        } else {
                            console.error('Invalid BC value:', value);
                            return;
                        }
                        break;
                    case 'BCInt':
                        channels = { AlbedoPBR: { factor: value } };
                        break;
                    case 'M':
                        channels = { MetalnessPBR: { factor: value } };
                        break;
                    case 'R':
                        channels = { RoughnessPBR: { factor: value } };
                        break;
                    case 'S':
                        channels = { SpecularPBR: { factor: value } };
                        break;
                    case 'CCEnable':
                        channels = {
                            ClearCoat: {
                                enable: value === 1,
                                factor: material.channels.ClearCoat?.factor || 0,
                                thickness: material.channels.ClearCoat?.thickness || 0,
                                reflectivity: material.channels.ClearCoat?.reflectivity || 0,
                                tint: material.channels.ClearCoat?.tint || [1, 1, 1]
                            }
                        };
                        break;
                    case 'CCInt':
                        channels = {
                            ClearCoat: {
                                enable: material.channels.ClearCoat?.enable || true,
                                factor: value,
                                thickness: material.channels.ClearCoat?.thickness || 0,
                                reflectivity: material.channels.ClearCoat?.reflectivity || 0,
                                tint: material.channels.ClearCoat?.tint || [1, 1, 1]
                            }
                        };
                        break;
                    case 'CCThick':
                        channels = {
                            ClearCoat: {
                                enable: material.channels.ClearCoat?.enable || true,
                                factor: material.channels.ClearCoat?.factor || 0,
                                thickness: value,
                                reflectivity: material.channels.ClearCoat?.reflectivity || 0,
                                tint: material.channels.ClearCoat?.tint || [1, 1, 1]
                            }
                        };
                        break;
                    case 'CCRough':
                        channels = {
                            ClearCoatRoughness: { enable: true, factor: value }
                        };
                        break;
                    case 'Op':
                        material.channels.Opacity = { enable: true, factor: value };
                        break;
                    default:
                        console.warn(`Property ${property} not handled`);
                }
                if (property !== 'Op' && Object.keys(channels).length > 0) {
                    Object.keys(channels).forEach(channel => {
                        material.channels[channel] = channels[channel];
                    });
                }
                window.currentModelData.api.setMaterial(material, function(err) {
                    if (err) console.error('Error updating material:', err);
                });
            } else {
                console.log('Material ' + materialName + ' not found');
            }
        }
    };

    // Конфигурация объектов (аналогично первому коду)
    const nodeMapping = {
        front: {
            'Model C': ['SF_Model_C_L', 'SF_Model_C_R'],
            'Model B': ['SF_Model_B_L', 'SF_Model_B_R'],
            'Model A': ['SF_Model_A_L', 'SF_Model_A_R']
        },
        center: {
            'Center A': ['SF_Center_A'],
            'No': []
        },
        surround: {
            'Sur A': ['SF_Sur_A_SL', 'SF_Sur_A_SR'],
            'No': []
        },
        subwoofer: {
            'Sub A': ['SF_Sub_A'],
            'No': []
        }
    };

    // Состояние выбора
    const configState = {
        front: 'Model A',
        center: 'No',
        surround: 'No',
        subwoofer: 'No',
        grilleVisible: true
    };
    
    
    // Load a model
    client.init('46f74f13389e46b499d74d7388a73a0e', {
        autostart: 1,
        // camera: 0,
        transparent: 1,
        success: function onSuccess(api) {
            api.start();
            let textureUIDs = {};

            api.addEventListener('viewerready', function() {
                // Инициализируем объект сразу, но без материалов и узлов
                window.currentModelData = {
                    api: api,
                    materials: [],
                    modelId: '46f74f13389e46b499d74d7388a73a0e'
                };

                // Получение материалов
                api.getMaterialList(function(err, materials) {
                    if (!err) {
                        window.currentModelData.materials = materials;
                        // console.log('All materials:', materials.map(m => ({
                        //     name: m.name,
                        //     albedo: m.channels.AlbedoPBR.texture?.uid || 'color: ' + m.channels.AlbedoPBR.color,
                        //     normal: m.channels.NormalMap.texture?.uid || null,
                        //     roughness: m.channels.RoughnessPBR.texture?.uid || null
                        // })));

                        textureUIDs = materials.reduce((acc, material) => {
                            acc[material.name] = {
                                albedo: material.channels.AlbedoPBR.texture?.uid || null,
                                normal: material.channels.NormalMap.texture?.uid || null,
                                roughness: material.channels.RoughnessPBR.texture?.uid || null
                            };
                            return acc;
                        }, {});

                        // Получение узлов и вызов updateVisibility только после обоих запросов
                        api.getNodeMap(function(err, nodes) {
                            if (!err) {
                                window.nodeList = Object.keys(nodes)
                                    .reduce((acc, id) => {
                                        const node = nodes[id];
                                        if ((node.type === 'Group' || node.type === 'MatrixTransform') && node.children?.length > 0) {
                                            acc[id] = node;
                                        }
                                        return acc;
                                    }, {});
                                bindEventHandlers(textureUIDs); 
                                updateVisibility();
                            } else {
                                console.error('Error getting node map:', err);
                            }
                        });
                    } else {
                        console.error('Error getting materials:', err);
                    }
                });
            });
        },
        error: function onError() {
            console.error('API initialization error');
        }
    });

    // Управление видимостью объектов
    function hideCategoryNodes(category) {
        const nodeNames = Object.values(nodeMapping[category]).flat();
        nodeNames.forEach(name => {
            const node = Object.values(window.nodeList).find(n => n.name === name);
            if (node) window.currentModelData.api.hide(node.instanceID);
        });
    }

    function showNodes(category, name) {
        const nodeNames = nodeMapping[category][name] || [];
        nodeNames.forEach(name => {
            const node = Object.values(window.nodeList).find(n => n.name === name);
            if (node) window.currentModelData.api.show(node.instanceID);
        });
    }

    function updateVisibility() {
        ['front', 'center', 'surround', 'subwoofer'].forEach(category => {
            hideCategoryNodes(category);
            showNodes(category, configState[category]);
        });
        toggleGrilleVisibility();
    }

    // Управление видимостью Grille
    function toggleGrilleVisibility() {
        const visibleParents = ['front', 'center', 'surround', 'subwoofer']
            .map(category => nodeMapping[category][configState[category]])
            .flat()
            .filter(Boolean);
    
        Object.values(window.nodeList).forEach(node => {
            if (node.name && node.name.includes('_Grille')) { // Добавляем проверку на node.name
                // Проверяем, связан ли гриль с видимым родителем по имени
                const isParentVisible = visibleParents.some(parent => node.name.includes(parent.split('_')[1])); // Извлекаем имя модели (Amati, Serafino и т.д.)
                if (configState.grilleVisible && isParentVisible) {
                    window.currentModelData.api.show(node.instanceID);
                } else {
                    window.currentModelData.api.hide(node.instanceID);
                }
            }
        });
    }

    function bindEventHandlers(textureUIDs) {

        // Устанавливаем начальный активный финиш
        let currentFinish = 'Red Wood'; // По умолчанию
        
        updateFinishDisplay(currentFinish);

        // Graphite Wood
        document.getElementById('Graphite Wood')?.addEventListener('click', function() {
            materialUtils.setMaterialTextures('SF_Wood', textureUIDs['SF_WoodGraphite'].albedo,)
            materialUtils.applyMaterialProperties('SF_Wood', { BCInt: 1, });
            materialUtils.applyMaterialProperties('SF_Leather', { BC: [0.01,0.01,0.01],BCInt: 1, });
            materialUtils.applyMaterialProperties('SF_Alum_Color', { BC: [0.05,0.05,0.05],});
            updateFinishDisplay('Graphite Wood');
        });
        // Wenge Wood
        document.getElementById('Wenge Wood')?.addEventListener('click', function() {
            materialUtils.setMaterialTextures('SF_Wood', textureUIDs['SF_Wood'].albedo,);
            materialUtils.applyMaterialProperties('SF_Wood', { BCInt: 1.5,}); 
            materialUtils.applyMaterialProperties('SF_Leather', { BC: [0.09759,0.04666,0.03560],});
            materialUtils.applyMaterialProperties('SF_Alum_Color', { BC: [1,1,1],});
            updateFinishDisplay('Wenge Wood');
        });
        // Red Wood
        document.getElementById('Red Wood')?.addEventListener('click', function() {
            materialUtils.setMaterialTextures('SF_Wood', textureUIDs['SF_WoodRed'].albedo,);
            materialUtils.applyMaterialProperties('SF_Wood', { BCInt: 1,});
            materialUtils.applyMaterialProperties('SF_Leather', { BC: [0.01,0.01,0.01],});
            materialUtils.applyMaterialProperties('SF_Alum_Color', { BC: [0.05,0.05,0.05],});
            updateFinishDisplay('Red Wood');
        });
             
        // Переключение моделей
        document.querySelectorAll('.test-btn:not(#Grille)').forEach(btn => {
            btn.addEventListener('click', function() {
                const type = this.dataset.type;
                const name = this.id;
    
                // Убираем .active только у кнопок той же категории
                document.querySelectorAll(`.test-btn[data-type="${type}"]:not(#Grille)`).forEach(b => b.classList.remove('active'));
                this.classList.add('active');
    
                configState[type] = name;
                updateVisibility();
            });
    
            // Устанавливаем дефолтные активные кнопки
            const type = btn.dataset.type;
            const name = btn.id;
            if (configState[type] === name) {
                btn.classList.add('active');
            }
        });

        // Переключение гриля
        const grilleBtn = document.getElementById('Grille');
        if (grilleBtn) {
            // Устанавливаем дефолтное состояние гриля
            grilleBtn.classList.toggle('active', configState.grilleVisible);

            grilleBtn.addEventListener('click', function() {
                configState.grilleVisible = !configState.grilleVisible;
                this.classList.toggle('active');
                toggleGrilleVisibility();
            });
        }

        
        // Функция обновления отображения финиша с применением материалов
        function updateFinishDisplay(finish) {
            document.querySelectorAll('.FinishSet_detail__9tvBh').forEach(detail => {
                const detailText = detail.querySelector('p').textContent.trim();
                detail.classList.remove('active');
                if (detailText === finish) {
                    detail.classList.add('active');
                }
            });
            document.querySelectorAll('.Finishes_bullet__c5E_E').forEach(bullet => {
                const buttonId = bullet.querySelector('button').id;
                bullet.classList.remove('Finishes_current__kGBCq');
                if (buttonId === finish) {
                    bullet.classList.add('Finishes_current__kGBCq');
                }
            });
        }

        // После привязки всех обработчиков применяем дефолтный финиш
        const defaultButton = document.getElementById(currentFinish);
        if (defaultButton) {
            defaultButton.dispatchEvent(new Event('click'));
        } else {
            console.error('Default finish button not found:', currentFinish);
        }
    }
});
document.addEventListener('DOMContentLoaded', function() {
    var iframe = document.getElementById('api-frame');
    var client = new Sketchfab(iframe);
    const videoMode = 1; // 0 - Reset (сброс видео при скрытии), 1 - Background (видео идёт в фоне)
    let videoTextureUid = null; // Для хранения UID видео текстуры
    let screenState = { isActive: false }; // Состояние экрана
    let brightnessState = { isHigh: true }; // true - стандартная яркость, false - низкая

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


    // Object Positions
    const objectPositions = {};

    // Конфигурация смещений для объектов (можно менять вручную)
    const objectMovements = {
        'Door_1300A_Handle_001': {move: [0, 0, 0], moveTime: 2, rotation: [0, 0, 75],rotationTime: 1.5},
        'Door_1300A_NoHandle_001': {move: [0, 0, 0], moveTime: 2, rotation: [0, 0, -75],rotationTime: 1.5},
        'Door_1300B_Handle_001': {move: [0, -57, 0], moveTime: 2, rotation: [0, 0, 0], rotationTime: 1.5},
        'Door_1300B_Handle_002': {move: [0, 57, 0], moveTime: 2, rotation: [0, 0, 0], rotationTime: 1.5}
    };
    
    let objectStates = {
        'Door_1300A_Handle_001': { isShifted: false, isRotated: false },
        'Door_1300A_NoHandle_001': { isShifted: false, isRotated: false },
        'Door_1300B_Handle_001': { isShifted: false, isRotated: false },
        'Door_1300B_Handle_002': { isShifted: false, isRotated: false }
    };
    let currentRotation = {}; // в радианах

    function updateObjectPositions(nodeNames) {
        if (!window.nodeList || !window.currentModelData) {
            console.error('Node list or model data not initialized');
            return;
        }
        nodeNames.forEach(nodeName => {
            const node = Object.values(window.nodeList).find(n => n.name === nodeName);
            if (node) {
                window.currentModelData.api.getMatrix(node.instanceID, function(err, matrixData) {
                    if (err) {
                        console.error(`Error getting matrix for ${nodeName}:`, err);
                        return;
                    }
                    const matrix = matrixData.local || [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
                    const initialPos = [matrix[12], matrix[13], matrix[14]];
        
                    const sy = Math.sqrt(matrix[0] * matrix[0] + matrix[4] * matrix[4]);
                    const singular = sy < 1e-6;
                    let x, y, z;
                    if (!singular) {
                        x = Math.atan2(matrix[9], matrix[10]);
                        y = Math.atan2(-matrix[8], sy);
                        z = Math.atan2(matrix[4], matrix[0]);
                    } else {
                        x = Math.atan2(-matrix[6], matrix[5]);
                        y = Math.atan2(-matrix[8], sy);
                        z = 0;
                    }
        
                    const move = objectMovements[nodeName]?.move || [0, 0, 0];
                    objectPositions[nodeName] = {
                        initial: initialPos,
                        shifted: [initialPos[0] + move[0], initialPos[1] + move[1], initialPos[2] + move[2]],
                        initialRotation: { x, y, z } // Сохраняем начальный поворот
                    };
                    currentRotation[nodeName] = { x, y, z };
                });
            } else {
                console.error(`Node "${nodeName}" not found in nodeList`);
            }
        });
    }

    // Move object
    function transformNode(nodeName, targetPosition, targetRotations = { x: 0, y: 0, z: 0 }, duration = 1000) {
        if (!window.nodeList || !window.currentModelData) {
            console.error('Node list or model data not initialized');
            return;
        }
        const node = Object.values(window.nodeList).find(n => n.name === nodeName);
        if (!node) {
            console.error(`Node "${nodeName}" not found in nodeList`);
            return;
        }
        
        const config = objectMovements[nodeName] || {};
        const moveDuration = (config.moveTime || 1) * 1000;
        const rotDuration = (config.rotationTime || 1) * 1000;
        
        window.currentModelData.api.getMatrix(node.instanceID, function(err, matrixData) {
            if (err) {
                console.error('Error getting current matrix:', err);
                return;
            }
            const matrix = matrixData.local || [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
            const startPosition = [matrix[12], matrix[13], matrix[14]];
            const startRotations = currentRotation[nodeName] || { x: 0, y: 0, z: 0 }; // Берем текущий поворот
            const startTime = performance.now();
            const useDuration = rotDuration; // Используем только время поворота для rotate
    
            function animate(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / useDuration, 1);
        
                const newX = startPosition[0] + (targetPosition[0] - startPosition[0]) * progress;
                const newY = startPosition[1] + (targetPosition[1] - startPosition[1]) * progress;
                const newZ = startPosition[2] + (targetPosition[2] - startPosition[2]) * progress;
        
                const angleX = startRotations.x + (targetRotations.x - startRotations.x) * progress;
                const angleY = startRotations.y + (targetRotations.y - startRotations.y) * progress;
                const angleZ = startRotations.z + (targetRotations.z - startRotations.z) * progress;
        
                const cosX = Math.cos(angleX), sinX = Math.sin(angleX);
                const cosY = Math.cos(angleY), sinY = Math.sin(angleY);
                const cosZ = Math.cos(angleZ), sinZ = Math.sin(angleZ);
        
                const m11 = cosY * cosZ;
                const m12 = -cosY * sinZ;
                const m13 = sinY;
                const m21 = sinX * sinY * cosZ + cosX * sinZ;
                const m22 = -sinX * sinY * sinZ + cosX * cosZ;
                const m23 = -sinX * cosY;
                const m31 = -cosX * sinY * cosZ + sinX * sinZ;
                const m32 = cosX * sinY * sinZ + sinX * cosZ;
                const m33 = cosX * cosY;
        
                const newMatrix = [
                    m11, m12, m13, 0,
                    m21, m22, m23, 0,
                    m31, m32, m33, 0,
                    newX, newY, newZ, 1
                ];
        
                window.currentModelData.api.setMatrix(node.instanceID, newMatrix, function(err) {
                    if (err) {
                        console.error('Error during animation:', err);
                    }
                });
        
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    currentRotation[nodeName] = { x: angleX, y: angleY, z: angleZ }; // Обновляем текущий поворот
                }
            }
        
            requestAnimationFrame(animate);
        });
    }

    function handleAction(nodeName, action) {
        if (!objectPositions[nodeName]) {
            console.error(`Positions for ${nodeName} not initialized`);
            return;
        }
        const state = objectStates[nodeName];
        const config = objectMovements[nodeName] || {};
        const targetRot = {
            x: (config.rotation?.[0] || 0) * Math.PI / 180,
            y: (config.rotation?.[1] || 0) * Math.PI / 180,
            z: (config.rotation?.[2] || 0) * Math.PI / 180
        };
        const baseRot = currentRotation[nodeName] || { x: 0, y: 0, z: 0 };
    
        if (action === 'shift') {
            if (state.isShifted) {
                transformNode(nodeName, objectPositions[nodeName].initial, currentRotation[nodeName]);
                state.isShifted = false;
            } else {
                transformNode(nodeName, objectPositions[nodeName].shifted, currentRotation[nodeName]);
                state.isShifted = true;
            }
        } else if (action === 'rotate') {
            const currentPos = state.isShifted ? objectPositions[nodeName].shifted : objectPositions[nodeName].initial;
            const baseRot = objectPositions[nodeName].initialRotation || currentRotation[nodeName]; // Берем начальное значение
            if (state.isRotated) {
                transformNode(nodeName, currentPos, baseRot); // Возвращаем к начальному повороту
                state.isRotated = false;
            } else {
                transformNode(nodeName, currentPos, {
                    x: baseRot.x + targetRot.x,
                    y: baseRot.y + targetRot.y,
                    z: baseRot.z + targetRot.z
                });
                state.isRotated = true;
            }
        } else if (action === 'both') {
            if (state.isShifted && state.isRotated) {
                transformNode(nodeName, objectPositions[nodeName].initial, baseRot);
                state.isShifted = false;
                state.isRotated = false;
            } else {
                transformNode(nodeName, objectPositions[nodeName].shifted, {
                    x: baseRot.x + targetRot.x,
                    y: baseRot.y + targetRot.y,
                    z: baseRot.z + targetRot.z
                });
                state.isShifted = true;
                state.isRotated = true;
            }
        }
    }
    
    // Конфигурация действий для кнопок (новая логика)
    const buttonActions = {  //'shift', 'rotate', 'both'
        'test-btn-9': [
            { node: 'Door_1300A_Handle_001', action: 'rotate' },
            { node: 'Door_1300A_NoHandle_001', action: 'rotate' },
            { node: 'Door_1300B_Handle_001', action: 'shift' },
            { node: 'Door_1300B_Handle_002', action: 'shift' }
        ],
    };
    
    
    // Load a model
    client.init('c18058d0c3624784ad6cd56f93e81e1f', {
        autostart: 1,
        camera: 0,
        success: function onSuccess(api) {
            api.start();
            let textureUIDs = {};
            
            api.addEventListener('viewerready', function() {
                // Получение списка материалов
                api.getMaterialList(function(err, materials) {
                    if (!err) {
                        window.currentModelData = {
                            api: api,
                            materials: materials,
                            modelId: 'c18058d0c3624784ad6cd56f93e81e1f'
                        };

                        

                        // Вывод всех материалов в консоль
                        console.log('All materials:', materials.map(m => ({
                            name: m.name,
                            albedo: m.channels.AlbedoPBR.texture?.uid || 'color: ' + m.channels.AlbedoPBR.color,
                            normal: m.channels.NormalMap.texture?.uid || null,
                            roughness: m.channels.RoughnessPBR.texture?.uid || null
                        })));

                        // Создание textureUIDs динамически
                        materials.forEach(material => {
                            textureUIDs[material.name] = {
                                albedo: material.channels.AlbedoPBR.texture?.uid || null,
                                normal: material.channels.NormalMap.texture?.uid || null,
                                roughness: material.channels.RoughnessPBR.texture?.uid || null
                            };
                        });

                        bindEventHandlers(textureUIDs);
                        

                    } else {
                        console.error('Error getting materials:', err);
                    }
                });

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
                        updateObjectPositions(Object.keys(objectMovements));
                    } else {
                        console.error('Error getting node map:', err);
                    }
                });

                // Загрузка видео текстуры
                api.addVideoTexture(`${window.location.origin}/img/video/video.mp4`, { loop: true, mute: true }, function(err, uid) {
                    if (!err) {
                        videoTextureUid = uid;
                        console.log('Video texture loaded with UID:', uid);
                    } else {
                        console.error('Error loading video texture:', err);
                    }
                });



            });
        },
        error: function onError() {
            console.error('API initialization error');
        }
    });

    function bindEventHandlers(textureUIDs) {

        // Добавление обработчиков для ползунков калибровки
        // document.getElementById('color-factor-input')?.addEventListener('input', function(e) {materialUtils.applyMaterialProperties('Floor_Marble', { BCInt: parseFloat(e.target.value) || 1 });});
        // document.getElementById('metal-input')?.addEventListener('input', function(e) {materialUtils.applyMaterialProperties('Floor_Marble', { M: parseFloat(e.target.value) || 0 });});
        // document.getElementById('roughness-input')?.addEventListener('input', function(e) {materialUtils.applyMaterialProperties('Floor_Marble', { R: parseFloat(e.target.value) || 1 });});
        // document.getElementById('specular-input')?.addEventListener('input', function(e) {materialUtils.applyMaterialProperties('Floor_Marble', { S: parseFloat(e.target.value) || 0.01 });});
        // document.getElementById('clearcoat-enable')?.addEventListener('input', function(e) {materialUtils.applyMaterialProperties('Floor_Marble', { CCEnable: parseInt(e.target.value) || 1 });});
        // document.getElementById('clearcoat-factor')?.addEventListener('input', function(e) {materialUtils.applyMaterialProperties('Floor_Marble', { CCInt: parseFloat(e.target.value) || 1 });});
        // document.getElementById('clearcoat-thickness')?.addEventListener('input', function(e) {materialUtils.applyMaterialProperties('Floor_Marble', { CCThick: parseFloat(e.target.value) || 1 });});
        // document.getElementById('clearcoat-roughness-input')?.addEventListener('input', function(e) {materialUtils.applyMaterialProperties('Floor_Marble', { CCRough: parseFloat(e.target.value) || 0.04 });});
        // document.getElementById('opacity-input')?.addEventListener('input', function(e) {materialUtils.applyMaterialProperties('Floor_Marble', { Op: parseFloat(e.target.value) || 1 });});

        // Diamond Black
        document.getElementById('test-btn-1')?.addEventListener('click', function() {
            // materialUtils.setMaterialTextures('Floor_Marble', textureUIDs['Floor_Marble'].albedo, textureUIDs['Floor_Marble'].normal, textureUIDs['Floor_Marble'].roughness);
            materialUtils.applyMaterialProperties('M_Glass_Bl', { BC: [0.0030, 0.0037, 0.0033], BCInt: 1, M: 0, R: 0});
        });
        // Obsidian Black
        document.getElementById('test-btn-2')?.addEventListener('click', function() {
            // materialUtils.setMaterialTextures('Floor_Marble', textureUIDs['MI_ScrewDecal'].albedo, textureUIDs['MI_ScrewDecal'].normal, textureUIDs['MI_ScrewDecal'].roughness);
            materialUtils.applyMaterialProperties('M_Glass_Bl', { BC: [0.0080, 0.0168, 0.0137], BCInt: 1, M: 0, R: 0}); 
        });
        // Nara Bronze
        document.getElementById('test-btn-3')?.addEventListener('click', function() {
            // materialUtils.setMaterialTextures('Floor_Marble', textureUIDs['MI_CurtainA'].albedo, textureUIDs['MI_CurtainA'].normal, textureUIDs['MI_CurtainA'].roughness);
            materialUtils.applyMaterialProperties('M_Glass_Bl', { BC: [0.0999, 0.0802, 0.0409], BCInt: 1, M: 1, R: 0});
        });
        // True Gold
        document.getElementById('test-btn-4')?.addEventListener('click', function() {
            materialUtils.applyMaterialProperties('M_Glass_Bl', { BC: [0.4564, 0.2961, 0.0497], BCInt: 1, M: 1, R: 0});
        });
        // Mirror
        document.getElementById('test-btn-5')?.addEventListener('click', function() {
            materialUtils.applyMaterialProperties('M_Glass_Bl', { BC: [1, 1, 1], BCInt: 1, M: 1, R: 0});
        });
    
        document.getElementById('test-btn-6')?.addEventListener('click', function() {
            materialUtils.applyMaterialProperties('M_Glass_Bl', { M: 0 });
        });
    
        document.getElementById('test-btn-7')?.addEventListener('click', function() {
            materialUtils.applyMaterialProperties('M_Glass_Bl', { M: 1 });
        });
    
        document.getElementById('test-btn-8')?.addEventListener('click', function() {
            materialUtils.applyMaterialProperties('M_Glass_Bl', { M: 1 });
        });
        
        document.getElementById('test-btn-10')?.addEventListener('click', function() {
            if (!videoTextureUid) {
                console.error('Video texture not loaded yet');
                return;
            }
            if (!screenState.isActive) {
                // Показываем экран и запускаем видео
                materialUtils.updateMaterialProperty('MI_Video_2', 'Op', 0.5);
                materialUtils.updateMaterialProperty('MI_Video_2', 'BCInt', 4); 
                materialUtils.setMaterialTextures('MI_Video_2', videoTextureUid, null, null);
                screenState.isActive = true;
            } else {
                // Скрываем экран
                materialUtils.updateMaterialProperty('MI_Video_2', 'Op', 0);
                if (videoMode === 0) {
                    // Режим Reset: убираем текстуру, видео останавливается
                    materialUtils.setMaterialTextures('MI_Video_2', null, null, null);
                }
                // Режим Background: ничего не делаем с текстурой, видео идёт в фоне
                screenState.isActive = false;
            }
        });

        // Кнопки 9-10 (новая логика через buttonActions)
        Object.keys(buttonActions).forEach(btnId => {
            document.getElementById(btnId)?.addEventListener('click', function() {
                buttonActions[btnId].forEach(({ node, action }) => {
                    handleAction(node, action);
                });
            });
        });
        
    }
});
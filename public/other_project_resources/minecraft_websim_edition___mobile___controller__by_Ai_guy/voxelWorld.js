import * as THREE from 'three';
import { SimplexNoise } from './utils.js';
import { generateSuperflat, getSuperflatHeight } from './superflat.js';
import { Door } from './door.js';
import { TOOL_DURABILITIES } from './pickaxes.js';

export class VoxelWorld {
    constructor(scene, worldData = null) {
        this.scene = scene;
        this.chunkSize = 16;
        this.blockSize = 1;
        this.chunks = new Map();
        this.textureLoader = new THREE.TextureLoader();
        this.materials = this.createMaterials();
        this.loadCustomBlockMaterials();
        this.raycaster = new THREE.Raycaster();
        this.worldData = worldData;
        this.renderDistance = 6;
        this.visibleChunks = new Set();
        this.chunkUpdateNeeded = true;
        this.isSuperflat = false;
        this.generateStructuresOnSuperflat = false;
        this.isStructureCreationMode = false;
        this.structureCreationBounds = { width: 0, length: 0 };
        this.worldBounds = null;
        if (worldData && worldData.settings && worldData.settings.worldBounds) {
            this.worldBounds = worldData.settings.worldBounds;
        }
        this.dirtyChunks = new Set();
        this.rebuildQueue = [];
        this.maxRebuildsPerFrame = 2;
        this.isProcessingRebuilds = false;
        this.generationQueue = [];
        this.maxGeneratesPerFrame = 2;
        this.door = new Door();
        this.slabTypes = ['oakslab', 'birchslab', 'spruceslab', 'cherryslab'];
        this.hutLocations = new Set(); // Stores "chunkX,chunkZ" of chunks with huts
        this.towerLocations = new Set(); // Stores "chunkX,chunkZ" of chunks with towers
        this.chests = new Map();
        this.crops = new Map();
        this.plantedSaplings = new Map(); // Map to store {x,y,z, type, plantTime}
        this.ladders = new Map();
        this.blockOrientations = new Map();
        this.lastCropUpdate = 0;
        this.lastSaplingUpdate = 0;
        this.droppedItems = new Map();
        this.nextItemId = 0;

        if (worldData && worldData.chunks) {
            for (const chunkKey in worldData.chunks) {
                this.dirtyChunks.add(chunkKey);
            }
        }
        if (worldData && worldData.chests) {
            for (const [key, data] of Object.entries(worldData.chests)) {
                this.chests.set(key, data);
            }
        }
        if (worldData && worldData.crops) {
            for (const [cropKey, cropData] of Object.entries(worldData.crops)) {
                this.crops.set(cropKey, cropData);
            }
        }
        if (worldData && worldData.plantedSaplings) {
            for (const [saplingKey, saplingData] of Object.entries(worldData.plantedSaplings)) {
                this.plantedSaplings.set(saplingKey, saplingData);
            }
        }
        if (worldData && worldData.blockOrientations) {
            for (const [key, data] of Object.entries(worldData.blockOrientations)) {
                this.blockOrientations.set(key, data);
            }
        }
        if (worldData && worldData.ladders) {
            for (const [key, data] of Object.entries(worldData.ladders)) {
                this.ladders.set(key, data);
            }
        }

        if (worldData && worldData.hutLocations) {
            this.hutLocations = new Set(worldData.hutLocations);
        }
        if (worldData && worldData.towerLocations) {
            this.towerLocations = new Set(worldData.towerLocations);
        }

        const worldSeed = worldData?.seed || Math.floor(Math.random() * 1000000);
        this.worldSeed = worldSeed;
        this.noise = new SimplexNoise(this.worldSeed);
        this.biomeNoise = new SimplexNoise(this.worldSeed + 10000);
        this.treeNoise = new SimplexNoise(this.worldSeed + 20000);
        this.cactusNoise = new SimplexNoise(this.worldSeed + 25000);
        this.treeTypeNoise = new SimplexNoise(this.worldSeed + 27000);
        this.structureNoise = new SimplexNoise(this.worldSeed + 90000);
        this.caveNoise = new SimplexNoise(this.worldSeed + 30000);
        this.caveNoise2 = new SimplexNoise(this.worldSeed + 40000);
        this.grassNoise = new SimplexNoise(this.worldSeed + 50000);
        this.blendNoise = new SimplexNoise(this.worldSeed + 60000);
        this.snowNoise = new SimplexNoise(this.worldSeed + 70000);
        this.snowBlockNoise = new SimplexNoise(this.worldSeed + 80000);
        this.deadbushNoise = new SimplexNoise(this.worldSeed + 100000);
        this.flowerNoise = new SimplexNoise(this.worldSeed + 120000);

        if (worldData && worldData.superflatLayers) {
            import('./superflat.js').then(module => {
                module.setSuperflatLayers(worldData.superflatLayers);
            });
        }

        this.customStructures = [];
        try {
            this.customStructures = JSON.parse(localStorage.getItem('minecraft_custom_structures') || '[]');
        } catch (e) {
            console.error("Failed to load custom structures:", e);
        }

        this.biomes = {
            flatlands: {
                name: "Flatlands", baseHeight: 30, heightVariation: 1.5, hilliness: 0.5,
                detailScale: 0.3, treeDensity: 0.016, treeTypes: { oak: 0.8, birch: 0.2 }, grassDensity: 0.1, topBlock: 'grass',
                underBlock: 'dirt', deepBlock: 'stone', colorIntensity: 1.3, hutChance: 0.001,
                towerChance: 0.0004,
                adjective: "Flat"
            },
            hills: {
                name: "Hills", baseHeight: 46, heightVariation: 18, hilliness: 7,
                detailScale: 0.7, treeDensity: 0.008, treeTypes: { oak: 1.0 }, plateauThreshold: 0.82, grassDensity: 0.05,
                topBlock: 'grass', underBlock: 'dirt', deepBlock: 'stone', colorIntensity: 1.25,
                adjective: "Hilly",
                hutChance: 0.0006,
                towerChance: 0.0005
            },
            desert: {
                name: "Desert", baseHeight: 29, heightVariation: 2, hilliness: 0.4,
                detailScale: 0.2, cactusDensity: 0.05, treeDensity: 0, topBlock: 'sand',
                underBlock: 'sand', deepBlock: 'sandstone', colorIntensity: 1.4,
                adjective: "Desert",
                deadbushDensity: 0.08
            },
            mountains: {
                name: "Mountains", baseHeight: 48, heightVariation: 40, hilliness: 12,
                detailScale: 0.9, treeDensity: 0.024, treeTypes: { spruce: 1.0 }, grassDensity: 0.05, snowHeight: 55,
                snowVariation: 5, snowBlockThreshold: 60, snowBlockVariation: 8,
                topBlock: 'grass', underBlock: 'dirt', deepBlock: 'stone', colorIntensity: 1.2,
                adjective: "Mountainous"
            },
            oak_forest: {
                name: "Oak Forest", baseHeight: 32, heightVariation: 2, hilliness: 0.7,
                detailScale: 0.4, treeDensity: 0.32, treeTypes: { oak: 0.9, birch: 0.1 }, grassDensity: 0.2,
                topBlock: 'grass', underBlock: 'dirt', deepBlock: 'stone', colorIntensity: 1.35,
                adjective: "Oak",
                hutChance: 0.0005,
                towerChance: 0.00045
            },
            birch_forest: {
                name: "Birch Forest", baseHeight: 32, heightVariation: 2.5, hilliness: 0.8,
                detailScale: 0.4, treeDensity: 0.36, treeTypes: { birch: 0.95, oak: 0.05 }, grassDensity: 0.2,
                topBlock: 'grass', underBlock: 'dirt', deepBlock: 'stone', colorIntensity: 1.35,
                adjective: "Birch",
                hutChance: 0.0005,
                towerChance: 0.00045
            },
            spruce_forest: {
                name: "Spruce Forest", baseHeight: 31, heightVariation: 3, hilliness: 1.0,
                detailScale: 0.4, treeDensity: 0.4, treeTypes: { spruce: 1.0 }, grassDensity: 0.15,
                topBlock: 'grass', underBlock: 'dirt', deepBlock: 'stone', colorIntensity: 1.28,
                adjective: "Spruce",
                hutChance: 0.0005,
                towerChance: 0.00045
            },
            cherry_grove: {
                name: "Cherry Grove", baseHeight: 32, heightVariation: 1.5, hilliness: 0.6,
                detailScale: 0.35, treeDensity: 0.28, treeTypes: { cherry: 1.0 }, grassDensity: 0.25,
                topBlock: 'grass', underBlock: 'dirt', deepBlock: 'stone', colorIntensity: 1.4,
                adjective: "Cherry",
                hutChance: 0.0005,
                towerChance: 0.00045
            },
            multiforest: {
                name: "Multiforest", baseHeight: 32, heightVariation: 2, hilliness: 0.7,
                detailScale: 0.4, treeDensity: 0.36, treeTypes: { oak: 0.45, birch: 0.45, cherry: 0.1 }, grassDensity: 0.2,
                topBlock: 'grass', underBlock: 'dirt', deepBlock: 'stone', colorIntensity: 1.35,
                adjective: "Mixed Forest",
                hutChance: 0.0005,
                towerChance: 0.00045
            }
        };
    }

    getMaterialsForBlock(blockType) {
        const m = this.materials;
        switch (blockType) {
            case 'grass':
                return [m.grassSide, m.grassSide, m.grassTop, m.grassBottom, m.grassSide, m.grassSide];
            case 'wood':
                return [m.logSide, m.logSide, m.logTopBottom, m.logTopBottom, m.logSide, m.logSide];
            case 'birchwood':
                return [m.birchLogSide, m.birchLogSide, m.birchLogTopBottom, m.birchLogTopBottom, m.birchLogSide, m.birchLogSide];
            case 'sprucewood':
                return [m.spruceLogSide, m.spruceLogSide, m.spruceLogTopBottom, m.spruceLogTopBottom, m.spruceLogSide, m.spruceLogSide];
            case 'cherrywood':
                return [m.cherryLogSide, m.cherryLogSide, m.cherryLogTopBottom, m.cherryLogTopBottom, m.cherryLogSide, m.cherryLogSide];
            case 'craftingtable':
                // right, left, top, bottom, front, back
                return [m.craftingTableSide, m.craftingTableSide, m.craftingTableTop, m.plank, m.craftingTableSide, m.craftingTableSide];
            case 'furnace':
                return [m.furnaceSide, m.furnaceSide, m.furnaceTopBottom, m.furnaceTopBottom, m.furnaceFront, m.furnaceSide];
            case 'chest':
                return [m.chestSide, m.chestSide, m.chestTopBottom, m.chestTopBottom, m.chestFront, m.chestSide];
            case 'haybale':
                return [m.haybaleSide, m.haybaleSide, m.haybaleTopBottom, m.haybaleTopBottom, m.haybaleSide, m.haybaleSide];
            default:
                let singleMaterial = this.materials[blockType];
                if (singleMaterial) {
                    return singleMaterial;
                }
                const materialMap = {
                    'oakslab': 'oakSlab',
                    'birchslab': 'birchSlab',
                    'spruceslab': 'spruceSlab',
                    'cherryslab': 'cherrySlab',
                    'oak_stairs': 'plank',
                    'birch_stairs': 'birchplank',
                    'spruce_stairs': 'sprucePlank',
                    'cherry_stairs': 'cherryPlank',
                    'cobble_stairs': 'cobble',
                    'stone_stairs': 'smoothstone',
                };
                const mappedType = materialMap[blockType] || blockType;
                return this.materials[mappedType] || this.materials.stone;
        }
    }

    loadCustomBlockMaterials() {
        try {
            const customBlocks = JSON.parse(localStorage.getItem('minecraft_custom_blocks') || '[]');
            customBlocks.forEach(block => {
                if (block.id && block.textures) {
                    const textureUrl = block.textures.front || Object.values(block.textures)[0];
                    if (textureUrl) {
                        const texture = this.textureLoader.load(textureUrl);
                        texture.magFilter = THREE.NearestFilter;
                        texture.minFilter = THREE.NearestFilter;
                        this.materials[block.id] = new THREE.MeshLambertMaterial({
                            map: texture,
                            color: 0xFFFFFF,
                        });
                    }
                }
            });
        } catch (e) {
            console.error("Error loading custom block materials", e);
        }
    }

    smoothStep(t) {
        const x = Math.max(0, Math.min(1, t));
        return x * x * (3 - 2 * x);
    }

    createMaterials() {
        const textures = {};
        const textureNames = [
            'dirt', 'grassTop', 'grassSide', 'stone', 'smoothstone', 'logSide', 'logTopBottom',
            'leaves', 'plank', 'craftingTableSide', 'craftingTableTop', 'oakdoor', 'oakdoorSide',
            'birchdoor', 'birchdoorSide', 'grass_plant', 'bedrock', 'sand', 'sandstone', 'cacti',
            'cobble', 'birchLogSide', 'birchLogTopBottom', 'birchLeaves', 'birchplank', 'snowGrassTop',
            'snowGrassSide', 'snow', 'furnaceFront', 'furnaceSide', 'furnaceTopBottom', 'glass', 'newglass',
            'oakSlab', 'birchSlab', 'chestFront', 'chestSide', 'chestTopBottom', 'farmland',
            'snowyDirt', 'seeds', 'wheatstage1', 'wheatstage2', 'wheatstage3', 'wheatfinished', 'haybaleSide',
            'haybaleTopBottom', 'oaksapling', 'birchsapling', 
            'spruceLogSide', 'spruceLogTopBottom', 'spruceLeaves', 'sprucePlank', 'sprucesapling', 'spruceSlab',
            'deadbush', 'wool', 'cherryLogSide', 'cherryLogTopBottom', 'cherryLeaves', 'cherryPlank', 'cherrysapling', 'cherrySlab',
            'rose', 'dandelion', 'petals', 'ladder', 'oak_stairs', 'birch_stairs', 'spruce_stairs', 'cherry_stairs', 'cobble_stairs', 'stone_stairs'
        ];
        const fileMap = {
            'grassTop': 'grass_top.png', 'grassSide': 'grass_side.png', 'logSide': 'logside.png',
            'logTopBottom': 'logtopbottom.png', 'craftingTableSide': 'CFSIDE.png',
            'craftingTableTop': 'cftopbottom.png', 'oakdoorSide': 'oakdoorside.png',
            'birchdoorSide': 'birchdoorside.png', 'grass_plant': 'grass.png',
            'birchLogSide': 'birchlogside.png', 'birchLogTopBottom': 'birchlogtopbottom.png',
            'birchLeaves': 'birchleaves.png', 'birchPlank': 'birchplank.png',
            'snowGrassTop': 'grasssnowtop.png', 'snowGrassSide': 'snowgrassside.png',
            'furnaceFront': 'furnaceunlit.png', 'furnaceSide': 'furnaceside.png',
            'furnaceTopBottom': 'furnacetopbottom.png', 'oakSlab': 'plank.png',
            'birchSlab': 'birchplank.png', 'cherrySlab': 'cherryplank.png',
            'chestFront': 'chestfront.png', 'chestSide': 'chestside.png', 'chestTopBottom': 'chesttopbottom.png',
            'cobble': 'cobbles.png', 'oakdoor': 'door.png', 'birchdoor': 'birchdoor.png',
            'wheatstage1': 'wheatstage1.png', 'wheatstage2': 'wheatstage2.png',
            'wheatstage3': 'wheatstage3.png', 'wheatfinished': 'wheatfinished.png',
            'haybaleSide': 'haybaleside.png', 'haybaleTopBottom': 'haybaletopbottom.png',
            'oaksapling': 'oaksapling.png', 'birchsapling': 'birchsapling.png',
            'spruceLogSide': 'sprucelog.png', 'spruceLogTopBottom': 'sprucetopbottom.png',
            'spruceLeaves': 'spruceleafs.png', 'sprucePlank': 'spruceplank.png',
            'sprucesapling': 'sprucesapling.png', 'cherrysapling': 'cherrysapling.png', 'spruceSlab': 'spruceplank.png',
            'deadbush': 'deadbush.png', 'wool': 'wool.png',
            'cherryLogSide': 'cherrylog.png', 'cherryLogTopBottom': 'cherrylogtopbottom.png',
            'cherryLeaves': 'cherryleaves.png', 'cherryPlank': 'cherryplank.png',
            'rose': 'rose.png', 'dandelion': 'dandelion.png', 'petals': 'petals.png',
            'ladder': 'asset_name.png'
        };

        textureNames.forEach(name => {
            const file = fileMap[name] || `${name.toLowerCase()}.png`;
            textures[name] = this.textureLoader.load(file);
            textures[name].magFilter = THREE.NearestFilter;
            textures[name].minFilter = THREE.NearestFilter;
            textures[name].wrapS = textures[name].wrapT = THREE.RepeatWrapping;
        });

        const materials = {};
        const setupMaterial = (name, textureName, props = {}) => {
            materials[name] = new THREE.MeshLambertMaterial({ 
                map: textures[textureName], 
                ...props
            });
            materials[name].shadowSide = THREE.FrontSide;
        };

        setupMaterial('dirt', 'dirt', { color: 0xc69d71, reflectivity: 0.08, aoMapIntensity: 0.4 });
        setupMaterial('stone', 'stone', { color: 0x9a9a9a, reflectivity: 0.12, aoMapIntensity: 0.5 });
        setupMaterial('smoothstone', 'smoothstone', { color: 0x929292, reflectivity: 0.15, aoMapIntensity: 0.4 });
        setupMaterial('leaves', 'leaves', { transparent: true, alphaTest: 0.5, color: 0x47c52a, emissive: 0x183a0e, emissiveIntensity: 0.07, aoMapIntensity: 0.15 });
        setupMaterial('logSide', 'logSide', { color: 0xc68242, emissive: 0x3a2815, emissiveIntensity: 0.035, aoMapIntensity: 0.3 });
        setupMaterial('logTopBottom', 'logTopBottom', { color: 0xd99a56, emissive: 0x3a2815, emissiveIntensity: 0.035, aoMapIntensity: 0.3 });
        setupMaterial('grassTop', 'grassTop', { color: 0x5ac546, emissive: 0x0a3a05, emissiveIntensity: 0.035, aoMapIntensity: 0.25 });
        setupMaterial('grassSide', 'grassSide', { color: 0x7cc054, aoMapIntensity: 0.3 });
        setupMaterial('grassBottom', 'dirt', { color: 0xd6a877, reflectivity: 0.15, aoMapIntensity: 0.35 });
        setupMaterial('plank', 'plank', { color: 0xc99e55, aoMapIntensity: 0.4 });
        setupMaterial('craftingTableSide', 'craftingTableSide', { color: 0xd6a65a, aoMapIntensity: 0.4 });
        setupMaterial('craftingTableTop', 'craftingTableTop', { color: 0xdaae65, aoMapIntensity: 0.3 });
        setupMaterial('oakdoor', 'oakdoor', { 
            color: 0xaf804c, 
            aoMapIntensity: 0.5, 
            transparent: true, 
            alphaTest: 0.1, 
            side: THREE.DoubleSide 
        });
        setupMaterial('oakdoorSide', 'oakdoorSide', { color: 0xaf804c, aoMapIntensity: 0.5, side: THREE.DoubleSide });
        setupMaterial('birchdoor', 'birchdoor', { 
            color: 0xe3d7b4, 
            aoMapIntensity: 0.5, 
            transparent: true, 
            alphaTest: 0.1, 
            side: THREE.DoubleSide 
        });
        setupMaterial('birchdoorSide', 'birchdoorSide', { color: 0xe3d7b4, aoMapIntensity: 0.5, side: THREE.DoubleSide });
        setupMaterial('grass_plant', 'grass_plant', { transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, color: 0x6fb542, emissive: 0x183a0e, emissiveIntensity: 0.025 });
        setupMaterial('bedrock', 'bedrock', { color: 0x606060, reflectivity: 0.05, aoMapIntensity: 0.6 });
        setupMaterial('sand', 'sand', { color: 0xffeeb0, reflectivity: 0.12, aoMapIntensity: 0.25 });
        setupMaterial('sandstone', 'sandstone', { color: 0xead9a3, reflectivity: 0.15, aoMapIntensity: 0.4 });
        setupMaterial('cacti', 'cacti', { color: 0x66bb44, emissive: 0x0a3a05, emissiveIntensity: 0.035, aoMapIntensity: 0.3 });
        setupMaterial('cobble', 'cobble', { color: 0x8a8a8a, reflectivity: 0.15, aoMapIntensity: 0.5 });
        setupMaterial('birchLogSide', 'birchLogSide', { color: 0xf5f5e8, emissive: 0x333322, emissiveIntensity: 0.035, aoMapIntensity: 0.2 });
        setupMaterial('birchLogTopBottom', 'birchLogTopBottom', { color: 0xededd0, emissive: 0x333322, emissiveIntensity: 0.035, aoMapIntensity: 0.2 });
        setupMaterial('birchLeaves', 'birchLeaves', { transparent: true, alphaTest: 0.5, color: 0xd1e367, emissive: 0x293a0a, emissiveIntensity: 0.07, aoMapIntensity: 0.2 });
        setupMaterial('birchplank', 'birchplank', { color: 0xeae4c0, aoMapIntensity: 0.3 });
        setupMaterial('snowGrassTop', 'snowGrassTop', { color: 0xffffff, reflectivity: 0.35, aoMapIntensity: 0.15 });
        setupMaterial('snowGrassSide', 'snowGrassSide', { color: 0xf8f8ff, reflectivity: 0.25, aoMapIntensity: 0.25 });
        setupMaterial('snow', 'snow', { color: 0xffffff, reflectivity: 0.4, emissive: 0x334455, emissiveIntensity: 0.045, aoMapIntensity: 0.15 });
        setupMaterial('furnaceFront', 'furnaceFront', { color: 0x8a8a8a, reflectivity: 0.1, aoMapIntensity: 0.5 });
        setupMaterial('furnaceSide', 'furnaceSide', { color: 0x8a8a8a, reflectivity: 0.1, aoMapIntensity: 0.5 });
        setupMaterial('furnaceTopBottom', 'furnaceTopBottom', { color: 0x8a8a8a, reflectivity: 0.1, aoMapIntensity: 0.5 });
        setupMaterial('glass', 'glass', { transparent: true, alphaTest: 0.5, color: 0xeeffff, reflectivity: 0.4, emissive: 0x112233, emissiveIntensity: 0.07, aoMapIntensity: 0.2 });
        setupMaterial('newglass', 'newglass', { transparent: true, alphaTest: 0.5, color: 0xeeffff, reflectivity: 0.4, emissive: 0x112233, emissiveIntensity: 0.07, aoMapIntensity: 0.2 });
        setupMaterial('oakSlab', 'oakSlab', { color: 0xc99e55, aoMapIntensity: 0.4 });
        setupMaterial('birchSlab', 'birchSlab', { color: 0xeae4c0, aoMapIntensity: 0.3 });
        setupMaterial('cherrySlab', 'cherrySlab', { color: 0xD19A9A, aoMapIntensity: 0.4 });
        setupMaterial('chestFront', 'chestFront', { color: 0xb7834c, aoMapIntensity: 0.4 });
        setupMaterial('chestSide', 'chestSide', { color: 0xb7834c, aoMapIntensity: 0.4 });
        setupMaterial('chestTopBottom', 'chestTopBottom', { color: 0xb7834c, aoMapIntensity: 0.4 });
        setupMaterial('farmland', 'farmland', { color: 0xa86f32, reflectivity: 0.08, aoMapIntensity: 0.4 });
        setupMaterial('snowyDirt', 'dirt', { color: 0xd5c0a8, reflectivity: 0.15, aoMapIntensity: 0.35 });
        setupMaterial('seeds', 'seeds', { 
            transparent: true, 
            alphaTest: 0.5, 
            side: THREE.DoubleSide, 
            color: 0x95c447, 
            emissive: 0x183a0e, 
            emissiveIntensity: 0.025 
        });
        setupMaterial('wheatstage1', 'wheatstage1', { 
            transparent: true, 
            alphaTest: 0.5, 
            side: THREE.DoubleSide, 
            color: 0xFFFFFF, 
            emissive: 0x183a0e, 
            emissiveIntensity: 0.025 
        });
        setupMaterial('wheatstage2', 'wheatstage2', { 
            transparent: true, 
            alphaTest: 0.5, 
            side: THREE.DoubleSide, 
            color: 0xFFFFFF, 
            emissive: 0x183a0e, 
            emissiveIntensity: 0.025 
        });
        setupMaterial('wheatstage3', 'wheatstage3', { 
            transparent: true, 
            alphaTest: 0.5, 
            side: THREE.DoubleSide, 
            color: 0xFFFFFF, 
            emissive: 0x183a0e, 
            emissiveIntensity: 0.025 
        });
        setupMaterial('wheatfinished', 'wheatfinished', { 
            transparent: true, 
            alphaTest: 0.5, 
            side: THREE.DoubleSide, 
            color: 0xFFFFFF, 
            emissive: 0x183a0e, 
            emissiveIntensity: 0.025 
        });
        setupMaterial('haybaleSide', 'haybaleSide', { color: 0xeedd55, aoMapIntensity: 0.4 });
        setupMaterial('haybaleTopBottom', 'haybaleTopBottom', { color: 0xeedd55, aoMapIntensity: 0.4 });
        setupMaterial('oaksapling', 'oaksapling', { transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, color: 0x8FBC8F, emissive: 0x228B22, emissiveIntensity: 0.02 });
        setupMaterial('birchsapling', 'birchsapling', { transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, color: 0x90EE90, emissive: 0x3CB371, emissiveIntensity: 0.02 });
        setupMaterial('spruceLogSide', 'spruceLogSide', { color: 0x6E4C3C, emissive: 0x2A1D16, emissiveIntensity: 0.035, aoMapIntensity: 0.3 });
        setupMaterial('spruceLogTopBottom', 'spruceLogTopBottom', { color: 0x826451, emissive: 0x2A1D16, emissiveIntensity: 0.035, aoMapIntensity: 0.3 });
        setupMaterial('spruceLeaves', 'spruceLeaves', { transparent: true, alphaTest: 0.5, color: 0x486c48, emissive: 0x1a291a, emissiveIntensity: 0.07, aoMapIntensity: 0.15 });
        setupMaterial('sprucePlank', 'sprucePlank', { color: 0x826451, aoMapIntensity: 0.4 });
        setupMaterial('sprucesapling', 'sprucesapling', { transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, color: 0x486c48, emissive: 0x1a291a, emissiveIntensity: 0.02 });
        setupMaterial('spruceSlab', 'spruceSlab', { color: 0xA47D5E, aoMapIntensity: 0.4 });
        setupMaterial('deadbush', 'deadbush', { transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, color: 0xccbbaa });
        setupMaterial('wool', 'wool', { color: 0xEEEEEE, aoMapIntensity: 0.2 });
        setupMaterial('cherryLogSide', 'cherryLogSide', { color: 0xB56576, emissive: 0x3D2329, emissiveIntensity: 0.035, aoMapIntensity: 0.3 });
        setupMaterial('cherryLogTopBottom', 'cherryLogTopBottom', { color: 0xC78D97, emissive: 0x3D2329, emissiveIntensity: 0.035, aoMapIntensity: 0.3 });
        setupMaterial('cherryLeaves', 'cherryLeaves', { transparent: true, alphaTest: 0.5, color: 0xFFB7C5, emissive: 0x4D373C, emissiveIntensity: 0.07, aoMapIntensity: 0.15 });
        setupMaterial('cherryPlank', 'cherryPlank', { color: 0xD19A9A, aoMapIntensity: 0.4 });
        setupMaterial('cherrysapling', 'cherrysapling', { transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, color: 0xFFC0CB, emissive: 0x5E3E44, emissiveIntensity: 0.02 });
        setupMaterial('cherrySlab', 'cherrySlab', { color: 0xD19A9A, aoMapIntensity: 0.4 });
        setupMaterial('rose', 'rose', { transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, color: 0xFFFFFF });
        setupMaterial('dandelion', 'dandelion', { transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, color: 0xFFFFFF });
        setupMaterial('petals', 'petals', { transparent: true, alphaTest: 0.1, side: THREE.DoubleSide, color: 0xFFC0CB });
        setupMaterial('ladder', 'ladder', { transparent: true, alphaTest: 0.1, side: THREE.DoubleSide, color: 0x8B5A2B });
        setupMaterial('oak_stairs', 'plank', { color: 0xc99e55, aoMapIntensity: 0.4, side: THREE.DoubleSide });
        setupMaterial('birch_stairs', 'birchplank', { color: 0xeae4c0, aoMapIntensity: 0.3, side: THREE.DoubleSide });
        setupMaterial('spruce_stairs', 'sprucePlank', { color: 0x826451, aoMapIntensity: 0.4, side: THREE.DoubleSide });
        setupMaterial('cherry_stairs', 'cherryPlank', { color: 0xD19A9A, aoMapIntensity: 0.4, side: THREE.DoubleSide });
        setupMaterial('cobble_stairs', 'cobble', { color: 0x8a8a8a, reflectivity: 0.15, aoMapIntensity: 0.5, side: THREE.DoubleSide });
        setupMaterial('stone_stairs', 'smoothstone', { color: 0x929292, reflectivity: 0.15, aoMapIntensity: 0.4, side: THREE.DoubleSide });
        return materials;
    }

    createMeshFromBlocks(blocks, offsetX, offsetY, offsetZ) {
        const geometries = {};
        const matNames = [
            'dirt', 'stone', 'smoothstone', 'logSide', 'logTopBottom', 'leaves', 'grassTop',
            'grassSide', 'grassBottom', 'plank', 'craftingTableSide', 'craftingTableTop',
            'oakdoor', 'oakdoorSide', 'birchdoor', 'birchdoorSide', 'grass_plant', 'bedrock',
            'sand', 'sandstone', 'cacti', 'cobble', 'birchLogSide', 'birchLogTopBottom',
            'birchLeaves', 'birchplank', 'snowGrassTop', 'snowGrassSide', 'snow', 'furnaceFront',
            'furnaceSide', 'furnaceTopBottom', 'glass', 'newglass', 'oakSlab', 'birchSlab',
            'chestFront', 'chestSide', 'chestTopBottom', 'farmland', 'snowyDirt', 'seeds',
            'wheatstage1', 'wheatstage2', 'wheatstage3', 'wheatfinished', 'haybaleSide', 'haybaleTopBottom',
            'oaksapling', 'birchsapling', 
            'spruceLogSide', 'spruceLogTopBottom', 'spruceLeaves', 'sprucePlank', 'sprucesapling', 'spruceSlab',
            'deadbush', 'wool', 'cherryLogSide', 'cherryLogTopBottom', 'cherryLeaves', 'cherryPlank', 'cherrysapling', 'cherrySlab',
            'rose', 'dandelion', 'petals', 'ladder', 'oak_stairs', 'birch_stairs', 'spruce_stairs', 'cherry_stairs', 'cobble_stairs', 'stone_stairs'
        ];
        const transparentBlocks = ['leaves', 'birchleaves', 'spruceleaves', 'glass', 'newglass', 'oaksapling', 'birchsapling', 'sprucesapling', 'cherryleaves', 'cherrysapling'];
        const nonCullingBlocks = ['oakdoor', 'birchdoor', 'oakslab', 'birchslab', 'farmland', 'spruceslab', 'cherryslab'];

        matNames.forEach(name => {
            geometries[name] = { vertices: [], indices: [], uvs: [], normals: [], vertexIndex: 0 };
        });

        try {
            const customBlocks = JSON.parse(localStorage.getItem('minecraft_custom_blocks') || '[]');
            customBlocks.forEach(block => {
                if (!geometries[block.id]) {
                    geometries[block.id] = { vertices: [], indices: [], uvs: [], normals: [], vertexIndex: 0 };
                }
            });
        } catch (error) {
            console.error('Error loading custom block geometries:', error);
        }

        for (const [blockKey, blockType] of blocks.entries()) {
            if (blockKey.endsWith('_grass_decoration')) {
                const [coords] = blockKey.split('_grass_decoration');
                const [x, y, z] = coords.split(',').map(Number);
                this.createCrossedPlant(geometries.grass_plant, x + offsetX, y + offsetY, z + offsetZ);
                continue;
            } else if (blockKey.endsWith('_deadbush_decoration')) {
                const [coords] = blockKey.split('_deadbush_decoration');
                const [x, y, z] = coords.split(',').map(Number);
                this.createCrossedPlant(geometries.deadbush, x + offsetX, y + offsetY, z + offsetZ);
                continue;
            }
            if (blockKey.endsWith('_rose_decoration')) {
                const [coords] = blockKey.split('_rose_decoration');
                const [x, y, z] = coords.split(',').map(Number);
                this.createCrossedPlant(geometries.rose, x + offsetX, y + offsetY, z + offsetZ);
                continue;
            }
            if (blockKey.endsWith('_dandelion_decoration')) {
                const [coords] = blockKey.split('_dandelion_decoration');
                const [x, y, z] = coords.split(',').map(Number);
                this.createCrossedPlant(geometries.dandelion, x + offsetX, y + offsetY, z + offsetZ);
                continue;
            }
            if (blockKey.endsWith('_petals_decoration')) {
                const [coords] = blockKey.split('_petals_decoration');
                const [x, y, z] = coords.split(',').map(Number);
                this.createFlatOverlay(geometries.petals, x + offsetX, y + offsetY, z + offsetZ);
                continue;
            }
            if (blockKey.endsWith('_crop')) {
                const [coords] = blockKey.split('_crop');
                const [x, y, z] = coords.split(',').map(Number);
                const worldX = x + offsetX;
                const worldY = y + offsetY;
                const worldZ = z + offsetZ;
                const cropKey = `${x},${y},${z}`;
                const cropData = this.crops.get(cropKey);
                let stage = 'wheatstage1';
                if (cropData) {
                    const now = Date.now();
                    const elapsedTime = (now - cropData.plantTime) / 60000;
                    if (elapsedTime >= 7.5) {
                        stage = 'wheatfinished';
                    } else if (elapsedTime >= 5) {
                        stage = 'wheatstage3';
                    } else if (elapsedTime >= 2.5) {
                        stage = 'wheatstage2';
                    } else {
                        stage = 'wheatstage1';
                    }
                }
                this.createCropPlant(geometries[stage], x + offsetX, y + offsetY, z + offsetZ);
                continue;
            }
            const [x, y, z] = blockKey.split(',').map(Number);
            if (blockType === 'oakdoor' || blockType === 'birchdoor') {
                const isOpen = this.door.isOpen(x + offsetX, y + offsetY, z + offsetZ);
                const isLowerHalf = !blocks.has(`${x},${y - 1},${z}`) ||
                    (blocks.get(`${x},${y - 1},${z}`) !== 'oakdoor' && blocks.get(`${x},${y - 1},${z}`) !== 'birchdoor');
                const doorType = blockType === 'birchdoor' ? 'birch' : 'oak';
                const doorGeometry = doorType === 'birch' ? geometries.birchdoor : geometries.oakdoor;
                this.door.createDoorGeometry(doorGeometry, x + offsetX, y + offsetY, z + offsetZ, isOpen, isLowerHalf);
                continue;
            }
            if (blockType === 'ladder') {
                this.createLadder(geometries.ladder, x + offsetX, y + offsetY, z + offsetZ);
                continue;
            }
            if (blockType.endsWith('_stairs')) {
                const worldX = x + offsetX;
                const worldY = y + offsetY;
                const worldZ = z + offsetZ;
                const orientation = this.blockOrientations.get(`${worldX},${worldY},${worldZ}`) || 0; // Default south
                this.createStairGeometry(geometries[blockType], worldX, worldY, worldZ, orientation);
                continue;
            }
            const worldX = x + offsetX;
            const worldY = y + offsetY;
            const worldZ = z + offsetZ;

            // Sapling rendering logic
            if (blockType === 'oaksapling' || blockType === 'birchsapling' || blockType === 'sprucesapling' || blockType === 'cherrysapling') {
                this.generateSaplingPlant(geometries[blockType], worldX, worldY, worldZ);
                continue; // Skip normal face generation for saplings
            }

            const faces = this.getFaceData(x, y, z, blockType);
            for (let i = 0; i < faces.length; i++) {
                const [faceVertices, faceIndices, normal] = faces[i];
                const adjacentX = x + normal[0];
                const adjacentY = y + normal[1];
                const adjacentZ = z + normal[2];
                const adjacentBlock = blocks.get(`${adjacentX},${adjacentY},${adjacentZ}`);
                const isCurrentBlockTransparent = transparentBlocks.includes(blockType);
                const isAdjacentBlockTransparent = adjacentBlock && transparentBlocks.includes(adjacentBlock);
                const isAdjacentBlockNonCulling = adjacentBlock && nonCullingBlocks.includes(adjacentBlock);
                const isAdjacentLadder = adjacentBlock === 'ladder';
                const isAdjacentBlockStairs = adjacentBlock && adjacentBlock.endsWith('_stairs');
                const isCustomBlock = blockType && blockType.startsWith('custom_');
                const isAdjacentCustomBlock = adjacentBlock && adjacentBlock.startsWith('custom_');

                if (!adjacentBlock || isCurrentBlockTransparent || isAdjacentBlockTransparent || isAdjacentLadder ||
                    isAdjacentBlockNonCulling || isCustomBlock || isAdjacentCustomBlock || isAdjacentBlockStairs) {
                    let materialType;

                    if (blockType === 'grass') {
                        const isSnowy = this.isSnowHeight(worldX, worldY, worldZ);
                        if (normal[1] === 1) materialType = isSnowy ? 'snowGrassTop' : 'grassTop';
                        else if (normal[1] === -1) materialType = 'grassBottom';
                        else materialType = isSnowy ? 'snowGrassSide' : 'grassSide';
                    } else if (blockType === 'wood') {
                        materialType = (normal[1] === 1 || normal[1] === -1) ? 'logTopBottom' : 'logSide';
                    } else if (blockType === 'birchwood') {
                        materialType = (normal[1] === 1 || normal[1] === -1) ? 'birchLogTopBottom' : 'birchLogSide';
                    } else if (blockType === 'birchleaves') {
                        materialType = 'birchLeaves';
                    } else if (blockType === 'birchplank') { // Birch plank
                        materialType = 'birchplank';
                    } else if (blockType === 'cherrywood') { // Cherry wood
                        materialType = (normal[1] === 1 || normal[1] === -1) ? 'cherryLogTopBottom' : 'cherryLogSide';
                    } else if (blockType === 'cherryleaves') { // Cherry leaves
                        materialType = 'cherryLeaves';
                    } else if (blockType === 'cherryplank') { // Cherry plank
                        materialType = 'cherryPlank';
                    } else if (blockType === 'cherrysapling') { // Cherry sapling
                        materialType = 'cherrysapling';
                    } else if (blockType === 'sprucewood') { // Spruce wood
                        materialType = (normal[1] === 1 || normal[1] === -1) ? 'spruceLogTopBottom' : 'spruceLogSide';
                    } else if (blockType === 'spruceleaves') { // Spruce leaves
                        materialType = 'spruceLeaves';
                    } else if (blockType === 'spruceplank') { // Spruce plank
                        materialType = 'sprucePlank';
                    } else if (blockType === 'sprucesapling') { // Spruce sapling
                        materialType = 'sprucesapling';
                    } else if (blockType === 'craftingtable') {
                        materialType = (normal[1] === 1 || normal[1] === -1) ? 'craftingTableTop' : 'craftingTableSide';
                    } else if (blockType === 'oakdoor') {
                        materialType = (normal[1] === 0) ? 'oakdoorSide' : 'oakdoor';
                    } else if (blockType === 'birchdoor') {
                        materialType = (normal[1] === 0) ? 'birchdoorSide' : 'birchdoor';
                    } else if (blockType === 'furnace') {
                        const orientation = this.blockOrientations.get(`${worldX},${worldY},${worldZ}`) || 0; // Default south
                        if (normal[1] === 1 || normal[1] === -1) {
                            materialType = 'furnaceTopBottom';
                        } else {
                            // 0: South (+Z), 1: West (-X), 2: North (-Z), 3: East (+X)
                            let isFront = false;
                            switch(orientation) {
                                case 0: if(normal[2] === 1) isFront = true; break; // Facing South
                                case 1: if(normal[0] === -1) isFront = true; break; // Facing West
                                case 2: if(normal[2] === -1) isFront = true; break; // Facing North
                                case 3: if(normal[0] === 1) isFront = true; break; // Facing East
                            }
                            materialType = isFront ? 'furnaceFront' : 'furnaceSide';
                        }
                    } else if (blockType === 'glass') {
                        materialType = 'glass';
                    } else if (blockType === 'newglass') {
                        materialType = 'newglass';
                    } else if (blockType === 'oakslab') {
                        materialType = 'oakSlab';
                    } else if (blockType === 'birchslab') {
                        materialType = 'birchSlab';
                    } else if (blockType === 'cherryslab') {
                        materialType = 'cherrySlab';
                    } else if (blockType === 'chest') {
                        const orientation = this.blockOrientations.get(`${worldX},${worldY},${worldZ}`) || 0; // Default south
                        if (normal[1] === 1 || normal[1] === -1) {
                            materialType = 'chestTopBottom';
                        } else {
                            let isFront = false;
                            switch(orientation) {
                                case 0: if(normal[2] === 1) isFront = true; break;
                                case 1: if(normal[0] === -1) isFront = true; break;
                                case 2: if(normal[2] === -1) isFront = true; break;
                                case 3: if(normal[0] === 1) isFront = true; break;
                            }
                            materialType = isFront ? 'chestFront' : 'chestSide';
                        }
                    } else if (blockType === 'farmland') {
                        materialType = (normal[1] === 1) ? 'farmland' : 'dirt';
                    } else if (blockType === 'snowydirt') {
                        materialType = 'snowyDirt';
                    } else if (blockType === 'haybale') {
                        materialType = (normal[1] === 1 || normal[1] === -1) ? 'haybaleTopBottom' : 'haybaleSide';
                    } else {
                        materialType = blockType;
                    }
                    const geo = geometries[materialType];
                    if (!geo) continue;
                    const baseVertexIndex = geo.vertexIndex;
                    for (const vertex of faceVertices) {
                        geo.vertices.push(vertex[0] + worldX, vertex[1] + worldY, vertex[2] + worldZ);
                    }
                    for (let n = 0; n < 4; n++) {
                        geo.normals.push(normal[0], normal[1], normal[2]);
                    }
                    const uvOffset = 0.01;
                    const uvs = [
                        uvOffset, uvOffset, 1 - uvOffset, uvOffset, 1 - uvOffset, 1 - uvOffset, uvOffset, 1 - uvOffset
                    ];
                    geo.uvs.push(...uvs);
                    
                    geo.indices.push(
                        baseVertexIndex, baseVertexIndex + 1, baseVertexIndex + 2,
                        baseVertexIndex, baseVertexIndex + 2, baseVertexIndex + 3
                    );
                    
                    geo.vertexIndex += 4;
                }
            }
        }

        const group = new THREE.Group();

        for (const type in geometries) {
            const geo = geometries[type];
            if (geo.vertices.length === 0) continue;
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(geo.vertices, 3));
            geometry.setAttribute('normal', new THREE.Float32BufferAttribute(geo.normals, 3));
            geometry.setAttribute('uv', new THREE.Float32BufferAttribute(geo.uvs, 2));
            geometry.setIndex(geo.indices);
            let material;
            if (type.startsWith('custom_')) {
                material = this.materials[type];
                if (!material) {
                    // Fallback if material wasn't loaded for some reason
                    material = new THREE.MeshLambertMaterial({ color: 0xFF00FF });
                }
            } else {
                material = this.materials[type];
            }
            if (!material) {
                material = new THREE.MeshLambertMaterial({ color: 0xFF00FF });
            }
            const mesh = new THREE.Mesh(geometry, material);
            mesh.castShadow = mesh.receiveShadow = true;
            group.add(mesh);
        }
        return group;
    }

    createStairGeometry(geometry, x, y, z, orientation) {
        // Bottom slab
        this._addBoxGeometry(geometry, 1, 0.5, 1, 0, 0, 0, x, y, z);
    
        // Top part, orientation determines which part is solid
        // 0: South(+Z), 1: West(-X), 2: North(-Z), 3: East(+X)
        switch(orientation) {
            case 0: // Facing South, cutout is south, solid part is on north side
                this._addBoxGeometry(geometry, 1, 0.5, 0.5, 0, 0.5, 0, x, y, z);
                break;
            case 1: // Facing West, cutout is west, solid part is on east side
                this._addBoxGeometry(geometry, 0.5, 0.5, 1, 0.5, 0.5, 0, x, y, z);
                break;
            case 2: // Facing North, cutout is north, solid part is on south side
                this._addBoxGeometry(geometry, 1, 0.5, 0.5, 0, 0.5, 0.5, x, y, z);
                break;
            case 3: // Facing East, cutout is east, solid part is on west side
                this._addBoxGeometry(geometry, 0.5, 0.5, 1, 0, 0.5, 0, x, y, z);
                break;
        }
    }

    _addBoxGeometry(geometry, width, height, depth, offsetX, offsetY, offsetZ, worldX, worldY, worldZ) {
        const v = [
            [offsetX, offsetY, offsetZ + depth],
            [offsetX + width, offsetY, offsetZ + depth],
            [offsetX + width, offsetY + height, offsetZ + depth],
            [offsetX, offsetY + height, offsetZ + depth],
    
            [offsetX + width, offsetY, offsetZ],
            [offsetX, offsetY, offsetZ],
            [offsetX, offsetY + height, offsetZ],
            [offsetX + width, offsetY + height, offsetZ],
        ];
    
        const faces = [
            { normal: [0, 0, 1], verts: [v[0], v[1], v[2], v[3]] },   // Front (+Z)
            { normal: [0, 0, -1], verts: [v[4], v[5], v[6], v[7]] },  // Back (-Z)
            { normal: [0, 1, 0], verts: [v[3], v[2], v[7], v[6]] },   // Top (+Y)
            { normal: [0, -1, 0], verts: [v[1], v[0], v[5], v[4]] },  // Bottom (-Y)
            { normal: [1, 0, 0], verts: [v[1], v[4], v[7], v[2]] },   // Right (+X)
            { normal: [-1, 0, 0], verts: [v[5], v[0], v[3], v[6]] },  // Left (-X)
        ];
    
        for (const face of faces) {
            const { normal, verts } = face;
            const baseVertexIndex = geometry.vertexIndex;
    
            for (const vert of verts) {
                geometry.vertices.push(
                    vert[0] + worldX,
                    vert[1] + worldY,
                    vert[2] + worldZ
                );
                geometry.normals.push(normal[0], normal[1], normal[2]);
            }
    
            const uvOffset = 0.01;
            geometry.uvs.push(
                uvOffset, uvOffset, 1 - uvOffset, uvOffset, 1 - uvOffset, 1 - uvOffset, uvOffset, 1 - uvOffset
            );
            
            geometry.indices.push(
                baseVertexIndex, baseVertexIndex + 1, baseVertexIndex + 2,
                baseVertexIndex, baseVertexIndex + 2, baseVertexIndex + 3
            );
    
            geometry.vertexIndex += 4;
        }
    }

    createCrossedPlant(geometry, x, y, z) {
        const halfWidth = 0.4;
        const plantHeight = 0.8;
        const centerX = x + 0.5;
        const centerZ = z + 0.5;

        // Crossed planes, axis-aligned for better appearance
        const positions = [
            // Plane 1 (Z-aligned)
            [centerX - halfWidth, y, centerZ],
            [centerX + halfWidth, y, centerZ],
            [centerX + halfWidth, y + plantHeight, centerZ],
            [centerX - halfWidth, y + plantHeight, centerZ],

            // Plane 2 (X-aligned)
            [centerX, y, centerZ - halfWidth],
            [centerX, y, centerZ + halfWidth],
            [centerX, y + plantHeight, centerZ + halfWidth],
            [centerX, y + plantHeight, centerZ - halfWidth]
        ];
        
        const baseVertexIndex = geometry.vertexIndex;

        for (const pos of positions) {
            geometry.vertices.push(pos[0], pos[1], pos[2]);
        }
        for (let i = 0; i < 8; i++) {
            geometry.normals.push(0, 1, 0); // Simplified normal, fine for non-lit plants
        }
        const uvOffset = 0.01;
        const uvs = [
            uvOffset, uvOffset, 1 - uvOffset, uvOffset, 1 - uvOffset, 1 - uvOffset, uvOffset, 1 - uvOffset, // Plane 1
            uvOffset, uvOffset, 1 - uvOffset, uvOffset, 1 - uvOffset, 1 - uvOffset, uvOffset, 1 - uvOffset  // Plane 2
        ];
        geometry.uvs.push(...uvs);

        const indices = [
            // First plane
            0, 1, 2, 0, 2, 3,
            // Second plane
            4, 5, 6, 4, 6, 7
        ];
        for (const index of indices) {
            geometry.indices.push(index + baseVertexIndex);
        }
        geometry.vertexIndex += 8;
    }

    createFlatOverlay(geometry, x, y, z) {
        const size = this.blockSize;
        const heightOffset = 0.01; // Small offset to prevent z-fighting with the ground

        const vertices = [
            [x, y + heightOffset, z],
            [x + size, y + heightOffset, z],
            [x + size, y + heightOffset, z + size],
            [x, y + heightOffset, z + size]
        ];
        
        const baseVertexIndex = geometry.vertexIndex;

        for (const pos of vertices) {
            geometry.vertices.push(pos[0], pos[1], pos[2]);
        }
        
        const normal = [0, 1, 0]; // Facing up
        for (let i = 0; i < 4; i++) {
            geometry.normals.push(...normal);
        }
        
        const uvOffset = 0.01;
        geometry.uvs.push(
            uvOffset, uvOffset, 1 - uvOffset, uvOffset, 1 - uvOffset, 1 - uvOffset, uvOffset, 1 - uvOffset
        );

        const indices = [0, 1, 2, 0, 2, 3];
        for (const index of indices) {
            geometry.indices.push(index + baseVertexIndex);
        }
        
        geometry.vertexIndex += 4;
    }

    generateSaplingPlant(geometry, x, y, z) {
        // This is essentially the same as other crossed plants.
        this.createCrossedPlant(geometry, x, y, z);
    }

    getFaceData(x, y, z, blockType) {
        const size = this.blockSize;
        if (blockType === 'farmland') {
            return [
                [[[0, 0, size], [size, 0, size], [size, 0.9, size], [0, 0.9, size]], [0, 1, 2, 0, 2, 3], [0, 0, 1]],
                [[[size, 0, 0], [0, 0, 0], [0, 0.9, 0], [size, 0.9, 0]], [0, 1, 2, 0, 2, 3], [0, 0, -1]],
                [[[0, 0.9, 0], [0, 0.9, size], [size, 0.9, size], [size, 0.9, 0]], [0, 1, 2, 0, 2, 3], [0, 1, 0]],
                [[[0, 0, size], [0, 0, 0], [size, 0, 0], [size, 0, size]], [0, 1, 2, 0, 2, 3], [0, -1, 0]],
                [[[size, 0, size], [size, 0, 0], [size, 0.9, 0], [size, 0.9, size]], [0, 1, 2, 0, 2, 3], [1, 0, 0]],
                [[[0, 0, 0], [0, 0, size], [0, 0.9, size], [0, 0.9, 0]], [0, 1, 2, 0, 2, 3], [-1, 0, 0]]
            ];
        } else if (this.isSuperflat) {
            return [
                [[[0, 0, size], [size, 0, size], [size, 1, size], [0, 1, size]], [0, 1, 2, 0, 2, 3], [0, 0, 1]],
                [[[size, 0, 0], [0, 0, 0], [0, 1, 0], [size, 1, 0]], [0, 1, 2, 0, 2, 3], [0, 0, -1]],
                [[[0, 1, 0], [0, 1, size], [size, 1, size], [size, 1, 0]], [0, 1, 2, 0, 2, 3], [0, 1, 0]],
                [[[0, 0, size], [0, 0, 0], [size, 0, 0], [size, 0, size]], [0, 1, 2, 0, 2, 3], [0, -1, 0]],
                [[[size, 0, size], [size, 0, 0], [size, 1, 0], [size, 1, size]], [0, 1, 2, 0, 2, 3], [1, 0, 0]],
                [[[0, 0, 0], [0, 0, size], [0, 1, size], [0, 1, 0]], [0, 1, 2, 0, 2, 3], [-1, 0, 0]]
            ];
        } else if (this.isSlab(blockType)) {
            const halfHeight = size / 2;
            return [
                [[[0, 0, size], [size, 0, size], [size, halfHeight, size], [0, halfHeight, size]], [0, 1, 2, 0, 2, 3], [0, 0, 1]],
                [[[size, 0, 0], [0, 0, 0], [0, halfHeight, 0], [size, halfHeight, 0]], [0, 1, 2, 0, 2, 3], [0, 0, -1]],
                [[[0, halfHeight, 0], [0, halfHeight, size], [size, halfHeight, size], [size, halfHeight, 0]], [0, 1, 2, 0, 2, 3], [0, 1, 0]],
                [[[0, 0, size], [0, 0, 0], [size, 0, 0], [size, 0, size]], [0, 1, 2, 0, 2, 3], [0, -1, 0]],
                [[[size, 0, size], [size, 0, 0], [size, halfHeight, 0], [size, halfHeight, size]], [0, 1, 2, 0, 2, 3], [1, 0, 0]],
                [[[0, 0, 0], [0, 0, size], [0, halfHeight, size], [0, halfHeight, 0]], [0, 1, 2, 0, 2, 3], [-1, 0, 0]]
            ];
        } else {
            return [
                [[[0, 0, size], [size, 0, size], [size, size, size], [0, size, size]], [0, 1, 2, 0, 2, 3], [0, 0, 1]],
                [[[size, 0, 0], [0, 0, 0], [0, size, 0], [size, size, 0]], [0, 1, 2, 0, 2, 3], [0, 0, -1]],
                [[[0, size, 0], [0, size, size], [size, size, size], [size, size, 0]], [0, 1, 2, 0, 2, 3], [0, 1, 0]],
                [[[0, 0, size], [0, 0, 0], [size, 0, 0], [size, 0, size]], [0, 1, 2, 0, 2, 3], [0, -1, 0]],
                [[[size, 0, size], [size, 0, 0], [size, size, 0], [size, size, size]], [0, 1, 2, 0, 2, 3], [1, 0, 0]],
                [[[0, 0, 0], [0, 0, size], [0, size, size], [0, size, 0]], [0, 1, 2, 0, 2, 3], [-1, 0, 0]]
            ];
        }
    }

    generateTree(blocks, x, y, z) {
        if (x < 2 || x > this.chunkSize - 3 || z < 2 || z > this.chunkSize - 3) return;
        const trunkHeight = 4 + Math.floor(Math.random() * 3);
        for (let i = 0; i < trunkHeight; i++) {
            blocks.set(`${x},${y + i},${z}`, 'wood');
        }
        if (Math.random() < 0.5) {
            const extraHeight = 1 + Math.floor(Math.random() * 2);
            for (let i = 0; i < extraHeight; i++) {
                blocks.set(`${x},${y + trunkHeight + i},${z}`, 'wood');
            }
        }
        const hasBranches = Math.random() < 0.6;
        if (hasBranches) {
            const branchY = y + Math.floor(trunkHeight * 0.6);
            const branchDirections = [];
            const possibleDirections = [{ dx: 1, dz: 0 }, { dx: -1, dz: 0 }, { dx: 0, dz: 1 }, { dx: 0, dz: -1 }];
            const branchCount = 1 + Math.floor(Math.random() * 2);
            for (let i = 0; i < branchCount; i++) {
                if (possibleDirections.length > 0) {
                    const randIndex = Math.floor(Math.random() * possibleDirections.length);
                    branchDirections.push(possibleDirections.splice(randIndex, 1)[0]);
                }
            }
            branchDirections.forEach(dir => {
                blocks.set(`${x + dir.dx},${branchY},${z + dir.dz}`, 'wood');
                blocks.set(`${x + dir.dx * 2},${branchY},${z + dir.dz * 2}`, 'wood');
                for (let lx = -1; lx <= 1; lx++) {
                    for (let ly = 0; ly <= 1; ly++) {
                        for (let lz = -1; lz <= 1; lz++) {
                            blocks.set(`${x + dir.dx * 2 + lx},${branchY + ly},${z + dir.dz * 2 + lz}`, 'leaves');
                        }
                    }
                }
            });
        }
        const leavesY = y + trunkHeight - 1;
        for (let lx = -2; lx <= 2; lx++) {
            for (let lz = -2; lz <= 2; lz++) {
                if (Math.abs(lx) == 2 && Math.abs(lz) == 1) continue; 

                blocks.set(`${x + lx},${leavesY},${z + lz}`, 'leaves');
                blocks.set(`${x + lx},${leavesY + 1},${z + lz}`, 'leaves');

                if (Math.abs(lx) < 2 && Math.abs(lz) < 2) {
                    blocks.set(`${x + lx},${leavesY + 2},${z + lz}`, 'leaves');
                }
            }
        }
        blocks.set(`${x},${leavesY + 3},${z}`, 'leaves');
        blocks.set(`${x},${leavesY + 4},${z}`, 'leaves');
    }

    generateBirchTree(blocks, x, y, z) {
        if (x < 2 || x > this.chunkSize - 3 || z < 2 || z > this.chunkSize - 3) return;
        const trunkHeight = 5 + Math.floor(Math.random() * 4);
        for (let i = 0; i < trunkHeight; i++) {
            blocks.set(`${x},${y + i},${z}`, 'birchwood');
        }
        if (Math.random() < 0.4) {
            const branchY = y + Math.floor(trunkHeight * 0.7);
            const direction = Math.floor(Math.random() * 4);
            let dx = 0, dz = 0;
            if (direction === 0) dx = 1;
            else if (direction === 1) dx = -1;
            else if (direction === 2) dz = 1;
            else dz = -1;
            blocks.set(`${x + dx},${branchY},${z + dz}`, 'birchleaves');
            if (Math.random() < 0.5) {
                blocks.set(`${x + dx},${branchY + 1},${z + dz}`, 'birchleaves');
            }
        }
        const leavesY = y + trunkHeight - 2;
        for (let lx = -2; lx <= 2; lx++) {
            for (let lz = -2; lz <= 2; lz++) {
                if (Math.abs(lx) == 2 && Math.abs(lz) == 2) {
                    if (Math.random() < 0.4) { 
                         blocks.set(`${x + lx},${leavesY},${z + lz}`, 'birchleaves');
                         if (Math.random() < 0.5) {
                             blocks.set(`${x + lx},${leavesY + 1},${z + lz}`, 'birchleaves');
                         }
                    }
                } else {
                    blocks.set(`${x + lx},${leavesY},${z + lz}`, 'birchleaves');
                    blocks.set(`${x + lx},${leavesY + 1},${z + lz}`, 'birchleaves');
                    if ((Math.abs(lx) + Math.abs(lz)) < 3 || Math.random() < 0.7) {
                        blocks.set(`${x + lx},${leavesY + 2},${z + lz}`, 'birchleaves');
                    }
                    if ((Math.abs(lx) < 2 && Math.abs(lz) < 2) && Math.random() < 0.5) {
                        blocks.set(`${x + lx},${leavesY + 3},${z + lz}`, 'birchleaves');
                    }
                }
            }
        }
        blocks.set(`${x},${leavesY + 3},${z}`, 'birchleaves');
        blocks.set(`${x},${leavesY + 4},${z}`, 'birchleaves');
    }

    generateSpruceTree(blocks, x, y, z) {
        if (x < 2 || x > this.chunkSize - 3 || z < 2 || z > this.chunkSize - 3) return;

        const trunkHeight = 6 + Math.floor(Math.random() * 4); 

        // Trunk
        for (let i = 0; i < trunkHeight; i++) {
            blocks.set(`${x},${y + i},${z}`, 'sprucewood');
        }
        // Conical leaves structure
        let currentRadius = 0;
        for (let ly = y + trunkHeight + 2; ly >= y + 2; ly--) { 
            if (ly > y + trunkHeight - 1) { 
                currentRadius = 0;
            } else if (ly > y + trunkHeight - 3) {
                currentRadius = 1;
            } else if (ly > y + trunkHeight - 5) {
                currentRadius = 2;
            } else {
                currentRadius = 3; 
            }

            for (let lx = -currentRadius; lx <= currentRadius; lx++) {
                for (let lz = -currentRadius; lz <= currentRadius; lz++) {
                    if (Math.sqrt(lx * lx + lz * lz) <= currentRadius + 0.5) { 
                        blocks.set(`${x + lx},${ly},${z + lz}`, 'spruceleaves');
                    }
                }
            }
        }
    }

    generateCherryTree(blocks, x, y, z) {
        if (x < 4 || x > this.chunkSize - 5 || z < 4 || z > this.chunkSize - 5) return;
        const trunkHeight = 4 + Math.floor(Math.random() * 3);

        // Main trunk
        for (let i = 0; i < trunkHeight; i++) {
            blocks.set(`${x},${y + i},${z}`, 'cherrywood');
        }

        // Branching logs
        const branchCount = 3 + Math.floor(Math.random() * 3); 
        const branches = [];
        for (let i = 0; i < branchCount; i++) {
            const angle = (i / branchCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
            const pitch = Math.PI / 4 + (Math.random() - 0.5) * 0.3; 
            const length = 2 + Math.floor(Math.random() * 3);

            let currentX = x;
            let currentY = y + trunkHeight - 1;
            let currentZ = z;

            for (let l = 0; l < length; l++) {
                currentX += Math.sin(pitch) * Math.cos(angle);
                currentY += Math.cos(pitch);
                currentZ += Math.sin(pitch) * Math.sin(angle);

                const blockX = Math.round(currentX);
                const blockY = Math.round(currentY);
                const blockZ = Math.round(currentZ);

                if (!blocks.has(`${blockX},${blockY},${blockZ}`)) {
                    blocks.set(`${blockX},${blockY},${blockZ}`, 'cherrywood');
                }

                if (l === length - 1) { 
                     branches.push({ x: blockX, y: blockY, z: blockZ });
                }
            }
        }

        // Generate leaf canopy around branch ends
        const leafClusters = new Set();
        branches.forEach(branchEnd => {
            const radius = 2 + Math.random();
            for (let lx = -3; lx <= 3; lx++) {
                for (let ly = -2; ly <= 2; ly++) {
                    for (let lz = -3; lz <= 3; lz++) {
                        const distSq = (lx * lx) / (radius * radius) + (ly * ly) / ((radius - 1) * (radius - 1)) + (lz * lz) / (radius * radius);
                        if (distSq <= 1) {
                            const leafX = branchEnd.x + lx;
                            const leafY = branchEnd.y + ly;
                            const leafZ = branchEnd.z + lz;
                            const key = `${leafX},${leafY},${leafZ}`;
                            leafClusters.add(key);
                        }
                    }
                }
            }
        });

        // Add a central canopy as well
        const topY = y + trunkHeight + 1;
        for (let ly = 0; ly < 3; ly++) {
            const radius = (ly === 0) ? 3.5 : (ly === 1 ? 3 : 2);
            for (let lx = -4; lx <= 4; lx++) {
                for (let lz = -4; lz <= 4; lz++) {
                    if (Math.sqrt(lx * lx + lz * lz) <= radius) {
                        const leafX = x + lx;
                        const leafY = topY + ly;
                        const leafZ = z + lz;
                        const key = `${leafX},${leafY},${leafZ}`;
                        leafClusters.add(key);
                    }
                }
            }
        }

        leafClusters.forEach(key => {
            if (!blocks.has(key)) {
                blocks.set(key, 'cherryleaves');
            }
        });

        // Add some "hanging" leaves for weeping effect
        leafClusters.forEach(key => {
            const coords = key.split(',').map(Number);
            const lx = coords[0];
            const ly = coords[1];
            const lz = coords[2];

            if (Math.random() < 0.15) { 
                 const vineLength = 1 + Math.floor(Math.random() * 2);
                 for (let i = 1; i <= vineLength; i++) {
                     const vineKey = `${lx + (Math.random() < 0.5 ? -1 : 1)},${ly - i},${lz}`;
                     if (!blocks.has(vineKey)) {
                         blocks.set(vineKey, 'cherryleaves');
                     } else {
                         break; 
                     }
                 }
            }
        });

        // Add petals on grass blocks around the tree base
        const petalRadius = 4;
        for (let dx = -petalRadius; dx <= petalRadius; dx++) {
            for (let dz = -petalRadius; dz <= petalRadius; dz++) {
                if (dx * dx + dz * dz > petalRadius * petalRadius) continue;
                if (dx === 0 && dz === 0) continue; 

                const blockX = x + dx;
                const blockZ = z + dz;

                // Find ground level at this position
                let groundY = -1;
                for (let scanY = y + 5; scanY >= y - 5; scanY--) { 
                    // check if current block is solid and block above is not
                    const blockKey = `${blockX},${scanY},${blockZ}`;
                    const blockAboveKey = `${blockX},${scanY + 1},${blockZ}`;
                    if (blocks.has(blockKey) && !blocks.has(blockAboveKey)) {
                        groundY = scanY;
                        break;
                    }
                }

                if (groundY !== -1) {
                    const topBlockType = blocks.get(`${blockX},${groundY},${blockZ}`);
                    if (topBlockType === 'grass' && Math.random() < 0.6) { 
                         blocks.set(`${blockX},${groundY + 1},${blockZ}_petals_decoration`, 'petals');
                    }
                }
            }
        }
    }

    generateCactus(blocks, x, y, z) {
        if (x < 0 || x >= this.chunkSize || z < 0 || z >= this.chunkSize) return;
        for (let i = 0; i < 3; i++) {
            blocks.set(`${x},${y + i},${z}`, 'cacti');
        }
    }

    isNearVegetation(vegetationPositions, x, z, minDistance) {
        for (let dx = -minDistance; dx <= minDistance; dx++) {
            for (let dz = -minDistance; dz <= minDistance; dz++) {
                if (dx === 0 && dz === 0) continue;
                const checkX = x + dx;
                const checkZ = z + dz;
                if (vegetationPositions.has(`${checkX},${checkZ}`)) {
                    const distSq = dx * dx + dz * dz;
                    if (distSq <= minDistance * minDistance) return true;
                }
            }
        }
        return false;
    }

    getBlock(x, y, z) {
        const chunkX = Math.floor(x / this.chunkSize);
        const chunkZ = Math.floor(z / this.chunkSize);
        const chunkKey = `${chunkX},${chunkZ}`;
        const chunk = this.chunks.get(chunkKey);
        if (!chunk) return null;
        const localX = ((x % this.chunkSize) + this.chunkSize) % this.chunkSize;
        const localZ = ((z % this.chunkSize) + this.chunkSize) % this.chunkSize;
        return chunk.blocks.get(`${localX},${y},${localZ}`);
    }

    getBiomeAt(x, z) {
        const biomeValue = this.biomeNoise.noise2D(x * (0.002), z * (0.002));
        const secondaryNoise = this.biomeNoise.noise2D(x * (0.002 / 0.6) + 500, z * (0.002 / 0.6) + 500);
        const tertiaryNoise = this.biomeNoise.noise2D(x * 0.002 + 1000, z * 0.002 + 1000);
        const mountainNoise = this.biomeNoise.noise2D(x * (0.002 / 0.5) + 1500, z * (0.002 / 0.5) + 1500);
        const microVariation = this.blendNoise.noise2D(x * 0.02, z * 0.02) * 0.02;

        const hillsThreshold = 0.4, transitionWidth = 0.1 + microVariation;
        const desertThreshold = 0.2, desertTransitionWidth = 0.1 + microVariation;
        const forestThreshold = 0.2, forestTransitionWidth = 0.1 + microVariation;
        const mountainThreshold = 0.7, mountainTransitionWidth = 0.2 + microVariation;

        let biomeBlends = [];
        let totalNonFlatBlend = 0;

        // Mountains
        let mountainBlendFactor = 0;
        if (mountainNoise > mountainThreshold + mountainTransitionWidth) {
            mountainBlendFactor = 1.0;
        } else if (mountainNoise > mountainThreshold - mountainTransitionWidth) {
            const t = (mountainNoise - (mountainThreshold - mountainTransitionWidth)) / (mountainTransitionWidth * 2);
            mountainBlendFactor = this.smoothStep(t);
        }
        if (mountainBlendFactor > 0) {
            biomeBlends.push({ name: 'mountains', blend: mountainBlendFactor });
            totalNonFlatBlend += mountainBlendFactor;
        }

        // Hills
        let hillBlendFactor = 0;
        if (totalNonFlatBlend < 1.0 && biomeValue > hillsThreshold + transitionWidth) {
            hillBlendFactor = 1.0 * (1.0 - totalNonFlatBlend);
        } else if (totalNonFlatBlend < 1.0 && biomeValue > hillsThreshold - transitionWidth) {
            const t = (biomeValue - (hillsThreshold - transitionWidth)) / (transitionWidth * 2);
            hillBlendFactor = this.smoothStep(t) * (1.0 - totalNonFlatBlend);
        }
        if (hillBlendFactor > 0) {
            biomeBlends.push({ name: 'hills', blend: hillBlendFactor });
            totalNonFlatBlend += hillBlendFactor;
        }

        // Desert
        let desertBlendFactor = 0;
        if (totalNonFlatBlend < 1.0 && secondaryNoise > desertThreshold + desertTransitionWidth) {
            desertBlendFactor = 1.0 * (1.0 - totalNonFlatBlend);
        } else if (totalNonFlatBlend < 1.0 && secondaryNoise > desertThreshold - desertTransitionWidth) {
            const t = (secondaryNoise - (desertThreshold - desertTransitionWidth)) / (desertTransitionWidth * 2);
            desertBlendFactor = this.smoothStep(t) * (1.0 - totalNonFlatBlend);
        }
        if (desertBlendFactor > 0) {
            biomeBlends.push({ name: 'desert', blend: desertBlendFactor });
            totalNonFlatBlend += desertBlendFactor;
        }

        // Forests
        let forestBlendFactor = 0;
        if (totalNonFlatBlend < 1.0 && tertiaryNoise > forestThreshold + forestTransitionWidth) {
            forestBlendFactor = 1.0 * (1.0 - totalNonFlatBlend);
        } else if (totalNonFlatBlend < 1.0 && tertiaryNoise > forestThreshold - forestTransitionWidth) {
            const t = (tertiaryNoise - (forestThreshold - forestTransitionWidth)) / (forestTransitionWidth * 2);
            forestBlendFactor = this.smoothStep(t) * (1.0 - totalNonFlatBlend);
        }

        if (forestBlendFactor > 0) {
            let forestNoise = this.treeTypeNoise.noise2D(x * 0.001, z * 0.001);
            if (forestNoise < 0.0) {
                biomeBlends.push({ name: 'birch_forest', blend: forestBlendFactor });
            } else if (forestNoise < 0.15) {
                biomeBlends.push({ name: 'cherry_grove', blend: forestBlendFactor });
            } else {
                biomeBlends.push({ name: 'oak_forest', blend: forestBlendFactor });
            }
            totalNonFlatBlend += forestBlendFactor;
        }

        // Flatlands is what's left
        const flatlandsBlend = Math.max(0, 1.0 - totalNonFlatBlend);
        if (flatlandsBlend > 0) {
            biomeBlends.push({ name: 'flatlands', blend: flatlandsBlend });
        }

        return {
            biome: this.getBlendedBiome(biomeBlends)
        };
    }

    getBlendedBiome(biomeBlends) {
        // Find dominant biome
        let dominant = biomeBlends.length > 0 ? biomeBlends[0] : { name: 'flatlands', blend: 1.0 };
        for (let i = 1; i < biomeBlends.length; i++) {
            if (biomeBlends[i].blend > dominant.blend) {
                dominant = biomeBlends[i];
            }
        }

        // If one biome is clearly dominant, use its properties
        if (dominant.blend > 0.85) {
            const baseBiomeObject = this.biomes[dominant.name];
            return {
                ...baseBiomeObject,
                snowHeight: baseBiomeObject.snowHeight !== undefined ? baseBiomeObject.snowHeight : 999,
                snowVariation: baseBiomeObject.snowVariation !== undefined ? baseBiomeObject.snowVariation : 0,
                snowBlockThreshold: baseBiomeObject.snowBlockThreshold !== undefined ? baseBiomeObject.snowBlockThreshold : 999,
                snowBlockVariation: baseBiomeObject.snowBlockVariation !== undefined ? baseBiomeObject.snowBlockVariation : 0,
                dominantBiome: baseBiomeObject
            };
        }

        // Otherwise, blend properties
        const dominantBiomeForName = this.biomes[dominant.name];
        return {
            name: this.getBlendedBiomeName(biomeBlends),
            baseHeight: this.blendBiomeValue('baseHeight', biomeBlends),
            heightVariation: this.blendBiomeValue('heightVariation', biomeBlends),
            hilliness: this.blendBiomeValue('hilliness', biomeBlends),
            detailScale: this.blendBiomeValue('detailScale', biomeBlends),
            treeDensity: this.blendBiomeValue('treeDensity', biomeBlends),
            treeTypes: dominantBiomeForName.treeTypes, 
            grassDensity: this.blendBiomeValue('grassDensity', biomeBlends),
            cactusDensity: this.blendBiomeValue('cactusDensity', biomeBlends),
            snowHeight: this.blendBiomeValue('snowHeight', biomeBlends, 999),
            snowVariation: this.blendBiomeValue('snowVariation', biomeBlends, 0),
            snowBlockThreshold: this.blendBiomeValue('snowBlockThreshold', biomeBlends, 999),
            snowBlockVariation: this.blendBiomeValue('snowBlockVariation', biomeBlends, 0),
            dominantBiome: dominantBiomeForName
        };
    }

    getBlendedBiomeName(biomeBlends) {
        const significantBiomes = biomeBlends
            .filter(b => b.blend > 0.20)
            .sort((a, b) => b.blend - a.blend)
            .map(b => ({ ...b, adjective: this.biomes[b.name].adjective, name: this.biomes[b.name].name }));

        if (significantBiomes.length === 0) {
            const dominant = biomeBlends.sort((a, b) => b.blend - a.blend)[0];
            return dominant ? this.biomes[dominant.name].name : "Mixed Terrain";
        }

        if (significantBiomes.length === 1) {
            return significantBiomes[0].name;
        }

        if (significantBiomes[0].blend > 0.6 && significantBiomes[0].blend > significantBiomes[1].blend * 1.8) {
            return `${significantBiomes[0].name} with ${significantBiomes[1].adjective.toLowerCase()} areas`;
        }

        let primaryName = significantBiomes[0].adjective;
        let secondaryName = significantBiomes[1].adjective.toLowerCase();

        if (primaryName.toLowerCase() === secondaryName || primaryName === significantBiomes[1].name.split('-')[0]) {
            secondaryName = significantBiomes[1].name.toLowerCase();
        }

        if (primaryName === secondaryName && significantBiomes.length > 2) {
            secondaryName = significantBiomes[2].adjective.toLowerCase();
            if (primaryName === significantBiomes[2].name.split('-')[0] || primaryName === significantBiomes[2].name) {
                secondaryName = significantBiomes[2].name.toLowerCase();
            }
        }

        let combinedName = `${primaryName} ${secondaryName}`;
        if (primaryName.toLowerCase() === secondaryName.toLowerCase()) { 
            combinedName = primaryName;
        }

        combinedName = combinedName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        return combinedName;
    }

    blendBiomeValue(propertyName, biomeBlends, defaultValue = 0) {
        let totalValue = 0;
        let totalBlend = 0;

        for (const item of biomeBlends) {
            const biome = this.biomes[item.name];
            if (biome && biome[propertyName] !== undefined && item.blend > 0) {
                totalValue += biome[propertyName] * item.blend;
                totalBlend += item.blend;
            }
        }

        if (totalBlend === 0) {
            return defaultValue;
        }
        return totalValue / totalBlend;
    }

    generateNormalTerrain(blocks, worldOffsetX, worldOffsetZ, treesToGenerate, cactiToGenerate, grassToGenerate, vegetationPositions) {
        let canSpawnHut = false;
        let hutX = 0, hutZ = 0, hutHeight = 0;
        let canSpawnTower = false;
        let towerX = 0, towerZ = 0, towerHeight = 0;
        let canSpawnCustomStructure = false;
        let customStructureToSpawn = null;
        let structureX = 0, structureZ = 0, structureBaseHeight = 0;

        const chunkCenterX = worldOffsetX + this.chunkSize / 2;
        const chunkCenterZ = worldOffsetZ + this.chunkSize / 2;
        const biomeDataForStructures = this.getBiomeAt(chunkCenterX, chunkCenterZ).biome;
        const dominantBiome = biomeDataForStructures.dominantBiome || biomeDataForStructures;

        let spawnHutInBiome = false;
        let hutChance = 0;
        let spawnTowerInBiome = false;
        let towerChance = 0;

        if (dominantBiome.hutChance) {
            spawnHutInBiome = true;
            hutChance = dominantBiome.hutChance;
        }

        if (dominantBiome.towerChance) {
            spawnTowerInBiome = true;
            towerChance = dominantBiome.towerChance;
        }

        if (spawnHutInBiome) {
            const structureValue = this.structureNoise.noise2D(worldOffsetX * 0.01, worldOffsetZ * 0.01);
            let tooClose = false;
            for (const location of this.hutLocations) {
                const [existingX, existingZ] = location.split(',').map(Number);
                const dx = existingX - chunkCenterX;
                const dz = existingZ - chunkCenterZ;
                if (dx * dx + dz * dz < 230400) {
                    tooClose = true;
                    break;
                }
            }
            if (!tooClose && structureValue < hutChance) {
                hutX = Math.floor(this.chunkSize / 2) - 2 + Math.floor(this.structureNoise.noise2D(worldOffsetX, worldOffsetZ) * 3);
                hutZ = Math.floor(this.chunkSize / 2) - 2 + Math.floor(this.structureNoise.noise2D(worldOffsetX + 100, worldOffsetZ + 100) * 3);
                hutX = Math.max(3, Math.min(hutX, this.chunkSize - 6));
                hutZ = Math.max(3, Math.min(hutZ, this.chunkSize - 6));

                const baseHeight = this.getHeight(worldOffsetX + hutX, worldOffsetZ + hutZ);
                
                let isFlatEnough = true;
                for (let dx = 0; dx <= 6; dx++) {
                    for (let dz = 0; dz <= 4; dz++) {
                        const checkHeight = this.getHeight(worldOffsetX + hutX + dx, worldOffsetZ + hutZ + dz);
                        if (Math.abs(checkHeight - baseHeight) > 2) { // Allow small variations
                            isFlatEnough = false;
                            break;
                        }
                    }
                    if (!isFlatEnough) break;
                }

                if (isFlatEnough) {
                    canSpawnHut = true;
                    hutHeight = baseHeight;
                    this.hutLocations.add(`${chunkCenterX},${chunkCenterZ}`);
                }
            }
        }

        if (spawnTowerInBiome) {
            const towerStructureValue = this.structureNoise.noise2D(worldOffsetX * 0.01 + 200, worldOffsetZ * 0.01 + 200);

            let tooCloseToHut = false;
            for (const location of this.hutLocations) {
                const [existingX, existingZ] = location.split(',').map(Number);
                const dx = existingX - chunkCenterX;
                const dz = existingZ - chunkCenterZ;
                if (dx * dx + dz * dz < 230400) {
                    tooCloseToHut = true;
                    break;
                }
            }
            
            let tooCloseToTower = false;
            for (const location of this.towerLocations) {
                const [existingX, existingZ] = location.split(',').map(Number);
                const dx = existingX - chunkCenterX;
                const dz = existingZ - chunkCenterZ;
                if (dx * dx + dz * dz < 360000) {
                    tooCloseToTower = true;
                    break;
                }
            }

            if (!canSpawnHut && !tooCloseToHut && !tooCloseToTower && towerStructureValue < towerChance) {
                towerX = Math.floor(this.chunkSize / 2) - 3 + Math.floor(this.structureNoise.noise2D(worldOffsetX + 300, worldOffsetZ + 300) * 4);
                towerZ = Math.floor(this.chunkSize / 2) - 3 + Math.floor(this.structureNoise.noise2D(worldOffsetX + 400, worldOffsetZ + 400) * 4);
                towerX = Math.max(4, Math.min(towerX, this.chunkSize - 8));
                towerZ = Math.max(4, Math.min(towerZ, this.chunkSize - 8));
                const towerHeight = this.getHeight(worldOffsetX + towerX, worldOffsetZ + towerZ);
                this.generateTower(blocks, towerX, towerHeight, towerZ, vegetationPositions, worldOffsetX, worldOffsetZ);
                this.towerLocations.add(`${chunkCenterX},${chunkCenterZ}`);
            }
        }

        // Custom Structure Generation Logic
        if (this.customStructures && this.customStructures.length > 0) {
            const structureCheckValue = this.structureNoise.noise2D(worldOffsetX * 0.02, worldOffsetZ * 0.02);
            for (const structure of this.customStructures) {
                // Check if structure can spawn in this biome
                const canSpawnInBiome = structure.biomes && (structure.biomes.includes('all') || structure.biomes.includes(dominantBiome.name.toLowerCase().replace(/ /g, '_')));
                if (!canSpawnInBiome) continue;

                if (structureCheckValue < structure.rarity) {
                     // Check if there's enough flat space for the structure
                    const structureX = Math.floor(this.chunkSize / 2) - Math.floor(structure.width / 2);
                    const structureZ = Math.floor(this.chunkSize / 2) - Math.floor(structure.length / 2);
                    const baseHeight = this.getHeight(worldOffsetX + structureX, worldOffsetZ + structureZ);
                    
                    let isFlatEnough = true;
                    for (let dx = 0; dx < structure.width; dx++) {
                        for (let dz = 0; dz < structure.length; dz++) {
                            const checkHeight = this.getHeight(worldOffsetX + structureX + dx, worldOffsetZ + structureZ + dz);
                            if (Math.abs(checkHeight - baseHeight) > 2) { // Allow small variations
                                isFlatEnough = false;
                                break;
                            }
                        }
                        if (!isFlatEnough) break;
                    }

                    if (isFlatEnough) {
                        canSpawnCustomStructure = true;
                        customStructureToSpawn = structure;
                        structureBaseHeight = baseHeight;
                        // prevent other structures from spawning
                        canSpawnHut = false;
                        canSpawnTower = false;
                        break; // spawn first one that fits criteria
                    }
                }
            }
        }

        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                const worldX = worldOffsetX + x;
                const worldZ = worldOffsetZ + z;

                if (this.worldBounds) {
                    const { width, length } = this.worldBounds;
                    const halfWidth = width / 2;
                    const halfLength = length / 2;
                    if (worldX < -halfWidth || worldX >= halfWidth || worldZ < -halfLength || worldZ >= halfLength) {
                        continue; 
                    }
                }

                const height = this.getHeight(worldX, worldZ);
                const biomeData = this.getBiomeAt(worldX, worldZ);
                const biome = biomeData.biome;

                let topBlockType = null;
                for (let y = 0; y < height; y++) {
                    let blockType;
                    if (y === 0) {
                        blockType = 'bedrock';
                    } else {
                        if (y >= height - 3 && y < height) {
                            if (y === height - 1) {
                                if (biome.snowHeight && y >= biome.snowHeight && this.shouldPlaceSnowBlock(worldX, y, worldZ)) {
                                    blockType = 'snow';
                                } else {
                                    blockType = biome.dominantBiome.topBlock;
                                }
                                topBlockType = blockType;
                            } else {
                                if (this.isSnowHeight(worldX, y, worldZ)) {
                                    blockType = 'snowydirt';
                                } else {
                                    blockType = biome.dominantBiome.underBlock;
                                }
                            }
                        } else {
                            blockType = biome.dominantBiome.deepBlock;
                        }
                    }
                    blocks.set(`${x},${y},${z}`, blockType);
                }
                if (topBlockType === 'grass' || topBlockType === 'snow') {
                    const treeNoiseSample = this.treeNoise.noise2D(worldX * 0.1, worldZ * 0.1);
                    const effectiveTreeDensity = biome.treeDensity || 0;

                    if (treeNoiseSample > 0.85 - effectiveTreeDensity && !this.isNearVegetation(vegetationPositions, x, z, 4)) {
                        if (biome.treeTypes) {
                            const treeChoices = Object.entries(biome.treeTypes).map(([type, weight]) => ({ item: type, weight }));
                            const treeGenType = this.weightedChoice(treeChoices);
                            if (treeGenType) {
                                treesToGenerate.push({ x: x, y: height, z: z, type: treeGenType });
                                vegetationPositions.add(`${x},${z}`);
                            }
                        }
                    } else if (!this.isNearVegetation(vegetationPositions, x, z, 1)) {
                        const flowerNoiseValue = this.flowerNoise.noise2D(worldX * 0.1, worldZ * 0.1);
                        const flowerPatchNoise = this.flowerNoise.noise2D(worldX * 0.03, worldZ * 0.03);
                        const flowerDensity = 0.1;

                        let shouldSpawnFlower = false;
                        if (flowerPatchNoise > 0.6) { 
                            if (flowerNoiseValue > 0.4) {
                                shouldSpawnFlower = true;
                            }
                        } else { 
                            if (flowerNoiseValue > 1.0 - flowerDensity) {
                                shouldSpawnFlower = true;
                            }
                        }

                        if (shouldSpawnFlower) {
                            const flowerType = this.flowerNoise.noise2D(worldX, worldZ) > 0.5 ? 'rose' : 'dandelion';
                            grassToGenerate.push({ x: x, y: height, z: z, type: flowerType });
                            vegetationPositions.add(`${x},${z}`);
                        } else {
                            const grassNoiseSample = this.grassNoise.noise2D(worldX * 0.5, worldZ * 0.5);
                            const effectiveGrassDensity = biome.grassDensity || 0;
                            if (grassNoiseSample > 1 - effectiveGrassDensity) {
                                grassToGenerate.push({ x: x, y: height, z: z });
                                vegetationPositions.add(`${x},${z}`);
                            }
                        }
                    }
                } else if (topBlockType === 'sand') {
                    const effectiveCactusDensity = biome.cactusDensity || 0;
                    if (this.cactusNoise.noise2D(worldX * 0.2, worldZ * 0.2) > 1 - effectiveCactusDensity && !this.isNearVegetation(vegetationPositions, x, z, 3)) {
                        cactiToGenerate.push({ x: x, y: height, z: z });
                        vegetationPositions.add(`${x},${z}`);
                    } else {
                        const effectiveDeadbushDensity = biome.deadbushDensity || 0;
                        if (this.deadbushNoise.noise2D(worldX * 0.3, worldZ * 0.3) > 1.0 - effectiveDeadbushDensity && !this.isNearVegetation(vegetationPositions, x, z, 2)) {
                            grassToGenerate.push({ x: x, y: height, z: z, type: 'deadbush' });
                            vegetationPositions.add(`${x},${z}`);
                        }
                    }
                }
            }
        }

        if (canSpawnHut) {
            this.generateHut(blocks, hutX, hutHeight, hutZ, vegetationPositions, worldOffsetX, worldOffsetZ);
        } else if (canSpawnTower) {
            this.generateTower(blocks, towerX, towerHeight, towerZ, vegetationPositions, worldOffsetX, worldOffsetZ);
        } else if (canSpawnCustomStructure) {
            this.placeCustomStructure(blocks, structureX, structureBaseHeight, structureZ, customStructureToSpawn);
        }
    }

    placeCustomStructure(blocks, x, y, z, structureData) {
        // We will no longer clear the area first. Instead, we will overwrite blocks.
        // This will place the structure on top of the existing terrain without removing it.

        // Place blocks from structure data
        for (const block of structureData.blocks) {
            // The structure was built on a plane at y=0, so block.y is relative to that.
            // We need to place it relative to the ground height `y` where the structure spawns.
            // We subtract 1 from block.y because a block at y=1 in the builder should be on the ground (y=0 in builder space).
            const placeX = x + block.x;
            const placeY = y + block.y - 1;
            const placeZ = z + block.z;
            
            // Overwrite any existing block at this location
            blocks.set(`${placeX},${placeY},${placeZ}`, block.type);

            // Also clear any potential decoration blocks at this new location to prevent grass from poking through floors.
            const decorationSuffixes = ['_grass_decoration', '_deadbush_decoration', '_rose_decoration', '_dandelion_decoration', '_crop', '_petals_decoration'];
            for (const dec of decorationSuffixes) {
                const decKey = `${placeX},${placeY},${placeZ}${dec}`;
                if (blocks.has(decKey)) {
                    blocks.delete(decKey);
                }
            }
        }
    }

    generateHut(blocks, x, y, z, vegetationPositions, chunkOffsetX = 0, chunkOffsetZ = 0) {
        for (let dx = -3; dx <= 7; dx++) {
            for (let dz = -3; dz <= 5; dz++) {
                vegetationPositions.add(`${x + dx},${z + dz}`);
            }
        }
        for (let dx = 0; dx < 15; dx++) {
            for (let dz = 0; dz < 15; dz++) {
                const blockKey = `${x + dx},${y},${z + dz}_grass_decoration`;
                if (blocks.has(blockKey)) {
                    blocks.delete(blockKey);
                }
            }
        }

        // Generate floor of logs
        const floorMaterial = 'wood';
        for (let dx = 0; dx <= 6; dx++) {
            for (let dz = 0; dz <= 4; dz++) {
                blocks.set(`${x + dx},${y},${z + dz}`, floorMaterial);
            }
        }
        
        const wallMaterial = 'plank';
        // Generate walls
        for (let dx = 0; dx <= 6; dx++) {
            for (let h = 1; h <= 3; h++) {
                if (dx !== 3 || h > 2) { // Leave a hole for the door
                    blocks.set(`${x + dx},${y + h},${z}`, wallMaterial);
                }
                blocks.set(`${x + dx},${y + h},${z + 4}`, wallMaterial); 
            }
        }
        for (let dz = 1; dz <= 3; dz++) {
            for (let h = 1; h <= 3; h++) {
                if (dz === 2 && h === 2) { // Window
                    blocks.set(`${x},${y + h},${z + dz}`, 'newglass');
                    blocks.set(`${x + 6},${y + h},${z + dz}`, 'newglass');
                } else {
                    blocks.set(`${x},${y + h},${z + dz}`, wallMaterial);
                    blocks.set(`${x + 6},${y + h},${z + dz}`, wallMaterial);
                }
            }
        }

        // Add log corners for better structure
        for (let h = 1; h <= 3; h++) {
            blocks.set(`${x},${y + h},${z}`, 'wood');     
            blocks.set(`${x + 6},${y + h},${z}`, 'wood');  
            blocks.set(`${x},${y + h},${z + 4}`, 'wood');  
            blocks.set(`${x + 6},${y + h},${z + 4}`, 'wood'); 
        }

        // Add an entrance stair
        blocks.set(`${x + 3},${y},${z - 1}`, 'oak_stairs');
        this.blockOrientations.set(`${x + 3 + chunkOffsetX},${y},${z - 1 + chunkOffsetZ}`, 2); // Facing North


        // Roof
        const roofY = y + 3; // Top of the wall

        // Layer 1: Bottom of the roof, overhang
        for (let dx = -1; dx <= 7; dx++) {
            // Front side (facing -Z)
            blocks.set(`${x + dx},${roofY + 1},${z - 1}`, 'oak_stairs');
            this.blockOrientations.set(`${x + dx + chunkOffsetX},${roofY + 1},${z - 1 + chunkOffsetZ}`, 2); // Facing North

            // Back side (facing +Z)
            blocks.set(`${x + dx},${roofY + 1},${z + 5}`, 'oak_stairs');
            this.blockOrientations.set(`${x + dx + chunkOffsetX},${roofY + 1},${z + 5 + chunkOffsetZ}`, 0); // Facing South
        }

        // Layer 2:
        for (let dx = -1; dx <= 7; dx++) {
            // Front side
            blocks.set(`${x + dx},${roofY + 2},${z}`, 'oak_stairs');
            this.blockOrientations.set(`${x + dx + chunkOffsetX},${roofY + 2},${z + chunkOffsetZ}`, 2); // Facing North

            // Back side
            blocks.set(`${x + dx},${roofY + 2},${z + 4}`, 'oak_stairs');
            this.blockOrientations.set(`${x + dx + chunkOffsetX},${roofY + 2},${z + 4 + chunkOffsetZ}`, 0); // Facing South
        }

        // Layer 3:
        for (let dx = -1; dx <= 7; dx++) {
            // Front side
            blocks.set(`${x + dx},${roofY + 3},${z + 1}`, 'oak_stairs');
            this.blockOrientations.set(`${x + dx + chunkOffsetX},${roofY + 3},${z + 1 + chunkOffsetZ}`, 2); // Facing North

            // Back side
            blocks.set(`${x + dx},${roofY + 3},${z + 3}`, 'oak_stairs');
            this.blockOrientations.set(`${x + dx + chunkOffsetX},${roofY + 3},${z + 3 + chunkOffsetZ}`, 0); // Facing South
        }

        // Roof peak
        for (let dx = -1; dx <= 7; dx++) {
            blocks.set(`${x + dx},${roofY + 4},${z + 2}`, 'plank');
        }

        // Fill in the gables (the triangular wall parts under the roof)
        for (let dx of [-1, 7]) {
            // at roofY+1
            for (let dz = 0; dz <= 4; dz++) {
                blocks.set(`${x + dx},${roofY + 1},${z + dz}`, 'plank');
            }
            // at roofY+2
            for (let dz = 1; dz <= 3; dz++) {
                blocks.set(`${x + dx},${roofY + 2},${z + dz}`, 'plank');
            }
            // at roofY+3
            blocks.set(`${x + dx},${roofY + 3},${z + 2}`, 'plank');
        }


        const doorMaterial = 'oakdoor';
        blocks.set(`${x + 3},${y + 1},${z}`, doorMaterial);
        blocks.set(`${x + 3},${y + 2},${z}`, doorMaterial);
        const worldX = x + 3;
        const worldY = y + 1;
        const worldZ = z;
        this.door.place(worldX, worldY, worldZ, null, 'oak');

        blocks.set(`${x + 1},${y + 1},${z + 1}`, 'chest');
        const chestWorldX = x + 1 + chunkOffsetX;
        const chestWorldY = y + 1;
        const chestWorldZ = z + 1 + chunkOffsetZ;
        this.initializeChest(chestWorldX, chestWorldY, chestWorldZ, null);
        // Populate chest with random items
        const chestKey = `${chestWorldX},${chestWorldY},${chestWorldZ}`;
        const chestData = this.chests.get(chestKey);
        if (chestData) {
            const possibleItems = [
                'plank', 'birchplank', 'stick', 'cobble', 'stone', 'dirt',
                'wood', 'birchwood', 'sand', 'glass', 'seeds', 'wheat'
            ];

            try {
                const customBlocks = JSON.parse(localStorage.getItem('minecraft_custom_blocks') || '[]');
                customBlocks.forEach(block => {
                    possibleItems.push(block.id);
                });
            } catch (error) {
                console.error("Failed to load custom blocks for chest:", error);
            }
            const numItems = Math.floor(Math.random() * 3) + 1; 
            for (let i = 0; i < numItems; i++) {
                const randomItem = possibleItems[Math.floor(Math.random() * possibleItems.length)];
                const emptySlot = chestData.inventory.find(slot => !slot.type);
                if (emptySlot) {
                    emptySlot.type = randomItem;
                    emptySlot.count = Math.floor(Math.random() * 8) + 1;
                }
            }
        }
        blocks.set(`${x + 1},${y + 1},${z + 3}`, 'craftingtable');
        blocks.set(`${x + 2},${y + 1},${z + 3}`, 'furnace');
        const furnaceWorldX = x + 2 + chunkOffsetX;
        const furnaceWorldY = y + 1;
        const furnaceWorldZ = z + 3 + chunkOffsetZ;
        this.blockOrientations.set(`${furnaceWorldX},${furnaceWorldY},${furnaceWorldZ}`, 2); // Facing North
    }

    generateTower(blocks, x, y, z, vegetationPositions, chunkOffsetX = 0, chunkOffsetZ = 0) {
        // Clear area for the tower
        const towerRadius = 5;
        for (let dx = -towerRadius; dx <= towerRadius; dx++) {
            for (let dz = -towerRadius; dz <= towerRadius; dz++) {
                vegetationPositions.add(`${x + dx},${z + dz}`);
            }
        }

        const height = 12 + Math.floor(Math.random() * 5);
        const radius = 4;
        const wallMaterial = 'cobble';
        const floorMaterial = 'plank';
        const detailMaterial = 'stone';

        // Ladder position (local to tower center)
        const ladderX_local = -radius + 1; // Against the inner west wall
        const ladderZ_local = 0;

        // Foundation
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dz = -radius; dz <= radius; dz++) {
                if (dx * dx + dz * dz <= radius * radius) {
                    blocks.set(`${x + dx},${y},${z + dz}`, wallMaterial);
                }
            }
        }

        // Walls and Floors
        for (let h = 1; h < height; h++) {
            // Generate the circular wall
            for (let dx = -radius; dx <= radius; dx++) {
                for (let dz = -radius; dz <= radius; dz++) {
                    const distSq = dx * dx + dz * dz;
                    if (distSq > (radius - 1) * (radius - 1) && distSq <= radius * radius) {
                        // This is the wall ring
                        // Create windows (arrow slits) every 4 blocks high, alternating
                        if (h % 4 === 2 && (Math.abs(dx) === radius || Math.abs(dz) === radius) && (dx + dz) % 2 === 0) {
                            // Leave empty for a window
                        } else {
                            blocks.set(`${x + dx},${y + h},${z + dz}`, wallMaterial);
                        }
                    }
                }
            }
            
            // Generate floors every 5 blocks, but not right at the top
            if (h > 0 && h % 5 === 0 && h < height - 1) {
                for (let dx = -radius + 1; dx <= radius - 1; dx++) {
                    for (let dz = -radius + 1; dz <= radius - 1; dz++) {
                        // Leave a hole for the ladder
                        if (dx === ladderX_local && dz === ladderZ_local) continue;
                        
                        if (dx * dx + dz * dz < (radius - 1) * (radius - 1)) {
                            blocks.set(`${x + dx},${y + h},${z + dz}`, floorMaterial);
                        }
                    }
                }
            }
        }

        // Add a second chest in a lower room with a 50% chance
        if (Math.random() < 0.5) {
            const floorLevel = 5; // First floor is at y + 5
            
            if (height > floorLevel + 2) {
                const chestRoomY = y + floorLevel + 1; // Place on top of the floor
                
                const chestRadius = radius - 2;
                let chestRoomX_local, chestRoomZ_local;
                let attempts = 0;
                do {
                    const angle = Math.random() * Math.PI * 2;
                    chestRoomX_local = Math.round(chestRadius * Math.cos(angle));
                    chestRoomZ_local = Math.round(chestRadius * Math.sin(angle));
                    attempts++;
                } while ((chestRoomX_local === ladderX_local && chestRoomZ_local === ladderZ_local) && attempts < 10);

                const chestX_chunk = x + chestRoomX_local;
                const chestZ_chunk = z + chestRoomZ_local;

                blocks.set(`${chestX_chunk},${chestRoomY},${chestZ_chunk}`, 'chest');
                
                const chestWorldX = chestX_chunk + chunkOffsetX;
                const chestWorldY = chestRoomY;
                const chestWorldZ = chestZ_chunk + chunkOffsetZ;
                
                this.initializeChest(chestWorldX, chestWorldY, chestWorldZ, null);
                
                const chestKey = `${chestWorldX},${chestWorldY},${chestWorldZ}`;
                const chestData = this.chests.get(chestKey);
                if (chestData) {
                    const possibleItems = [
                        'plank', 'birchplank', 'stick', 'cobble', 'stone', 'dirt',
                        'wood', 'birchwood', 'sand', 'glass', 'seeds', 'wheat'
                    ];

                    const numItems = 1 + Math.floor(Math.random() * 3); // 1 to 3 items
                    for (let i = 0; i < numItems; i++) {
                        const randomItem = possibleItems[Math.floor(Math.random() * possibleItems.length)];
                        const emptySlot = chestData.inventory.find(slot => !slot.type);
                        if (emptySlot) {
                            emptySlot.type = randomItem;
                            emptySlot.count = Math.floor(Math.random() * 8) + 1;
                        }
                    }
                }
            }
        }
        
        // Doorway
        blocks.delete(`${x + radius},${y + 1},${z}`);
        blocks.delete(`${x + radius},${y + 2},${z}`);
        blocks.set(`${x + radius},${y + 3},${z}`, detailMaterial); // Lintel

        // Ladder
        const ladderX = x + ladderX_local;
        const ladderZ = z + ladderZ_local;
        const ladderWallX = ladderX - 1; 
        const ladderWallZ = ladderZ;
        const ladderWallNormal = { x: 1, y: 0, z: 0 }; 

        for (let h = 1; h < height; h++) {
            // Make sure there is a wall to attach to
            blocks.set(`${ladderWallX},${y + h},${ladderWallZ}`, wallMaterial);

            // Place ladder block
            blocks.set(`${ladderX},${y + h},${ladderZ}`, 'ladder');

            // Store ladder orientation data
            const ladderWorldX = ladderX + chunkOffsetX;
            const ladderWorldY = y + h;
            const ladderWorldZ = ladderZ + chunkOffsetZ;
            this.ladders.set(`${ladderWorldX},${ladderWorldY},${ladderWorldZ}`, ladderWallNormal);
        }

        // Top Floor & Battlements
        const topY = y + height;
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dz = -radius; dz <= radius; dz++) {
                const distSq = dx * dx + dz * dz;
                if (distSq <= (radius - 1) * (radius - 1)) {
                    // This is the top floor area
                    if (dx === ladderX_local && dz === ladderZ_local) continue; // Hole for ladder
                    blocks.set(`${x + dx},${topY-1},${z + dz}`, floorMaterial);
                } else if (distSq <= radius * radius) {
                    // This is the wall ring at the top
                     // Every other block is a crenellation
                    if ((Math.abs(dx) + Math.abs(dz)) % 2 === 0) {
                        blocks.set(`${x + dx},${topY},${z + dz}`, wallMaterial);
                    }
                }
            }
        }

        // Loot chest
        const chestX = x;
        const chestY = y + height;
        const chestZ = z;
        blocks.set(`${chestX},${chestY},${chestZ}`, 'chest');
        const chestWorldX = chestX + chunkOffsetX;
        const chestWorldY = chestY;
        const chestWorldZ = chestZ + chunkOffsetZ;
        this.initializeChest(chestWorldX, chestWorldY, chestWorldZ, null);

        const chestKey = `${chestWorldX},${chestWorldY},${chestWorldZ}`;
        const chestData = this.chests.get(chestKey);
        if (chestData) {
            const possibleItems = [
                {type: 'string', count: 2 + Math.floor(Math.random()*5)},
                {type: 'stick', count: 3 + Math.floor(Math.random()*8)},
                {type: 'cobble', count: 5 + Math.floor(Math.random()*12)},
                {type: 'stone', count: 2 + Math.floor(Math.random()*6)},
                {type: 'seeds', count: 1 + Math.floor(Math.random()*4)},
                {type: 'woodpickaxe', count: 1},
                {type: 'stonepickaxe', count: 1},
                {type: 'woodaxe', count: 1},
            ];

            const numItems = 2 + Math.floor(Math.random() * 4); // 2 to 5 items
            for (let i = 0; i < numItems; i++) {
                const randomItem = possibleItems[Math.floor(Math.random() * possibleItems.length)];
                const emptySlotIndex = chestData.inventory.findIndex(slot => !slot.type);
                if (emptySlotIndex !== -1) {
                    const itemToAdd = { ...randomItem };
                    if (TOOL_DURABILITIES[itemToAdd.type]) {
                        itemToAdd.durability = TOOL_DURABILITIES[itemToAdd.type];
                        itemToAdd.maxDurability = TOOL_DURABILITIES[itemToAdd.type];
                    }
                    chestData.inventory[emptySlotIndex] = itemToAdd;
                }
            }
        }
    }

    generateChunk(chunkX, chunkZ) {
        const chunkKey = `${chunkX},${chunkZ}`;
        if (this.chunks.has(chunkKey)) return;

        if (this.worldBounds) {
            const { width, length } = this.worldBounds;
            const halfWidth = width / 2;
            const halfLength = length / 2;
            
            const worldOffsetX = chunkX * this.chunkSize;
            const worldOffsetZ = chunkZ * this.chunkSize;
    
            if (worldOffsetX >= halfWidth || worldOffsetX + this.chunkSize <= -halfWidth ||
                worldOffsetZ >= halfLength || worldOffsetZ + this.chunkSize <= -halfLength) {
                return; 
            }
        }

        const blocks = new Map();
        const worldOffsetX = chunkX * this.chunkSize;
        const worldOffsetZ = chunkZ * this.chunkSize;
        const treesToGenerate = [];
        const cactiToGenerate = [];
        const vegetationPositions = new Set();
        const grassToGenerate = [];

        let isModified = false;
        let hasExistingData = false;

        if (this.worldData && this.worldData.chunks) {
            const savedChunk = this.worldData.chunks[chunkKey];
            if (savedChunk) {
                for (const [blockKey, blockType] of Object.entries(savedChunk)) {
                    blocks.set(blockKey, blockType);
                    hasExistingData = true;
                }
                isModified = true;
            }
        }
        if (this.worldData && this.worldData.chests) {
            for (const [key, data] of Object.entries(this.worldData.chests)) {
                this.chests.set(key, data);
            }
        }

        const needsNaturalTerrain = !hasExistingData;

        if (needsNaturalTerrain) {
            if (this.isSuperflat) {
                generateSuperflat(blocks, this.chunkSize, worldOffsetX, worldOffsetZ, this.worldBounds);

                if (this.generateStructuresOnSuperflat) {
                    const chunkCenterX = worldOffsetX + this.chunkSize / 2;
                    const chunkCenterZ = worldOffsetZ + this.chunkSize / 2;
                    const chunkRadius = this.chunkSize / 2;

                    // Hut generation
                    const hutChance = 0.001;
                    const towerChance = 0.0004;
                    const structureValue = this.structureNoise.noise2D(x * 0.01, y * 0.01);
                    const towerStructureValue = this.structureNoise.noise2D(x * 0.01 + 200, y * 0.01 + 200);

                    let canSpawnHut = false;
                    let canSpawnTower = false;

                    let hutTooClose = false;
                    for (const location of this.hutLocations) {
                        const [existingX, existingZ] = location.split(',').map(Number);
                        const dx = existingX - chunkCenterX;
                        const dz = existingZ - chunkCenterZ;
                        if (dx * dx + dz * dz < 230400) {
                            hutTooClose = true;
                            break;
                        }
                    }

                    if (!hutTooClose && structureValue < hutChance) {
                        canSpawnHut = true;
                    }

                    let towerTooCloseToHut = hutTooClose;
                    let towerTooCloseToTower = false;
                    for (const location of this.towerLocations) {
                        const [existingX, existingZ] = location.split(',').map(Number);
                        const dx = existingX - chunkCenterX;
                        const dz = existingZ - chunkCenterZ;
                        if (dx * dx + dz * dz < 360000) {
                            towerTooCloseToTower = true;
                            break;
                        }
                    }
                    
                    if (!canSpawnHut && !towerTooCloseToHut && !towerTooCloseToTower && towerStructureValue < towerChance) {
                        canSpawnTower = true;
                    }

                    if (canSpawnHut) {
                        let hutX = Math.floor(this.chunkSize / 2) - 2 + Math.floor(this.structureNoise.noise2D(worldOffsetX, worldOffsetZ) * 3);
                        let hutZ = Math.floor(this.chunkSize / 2) - 2 + Math.floor(this.structureNoise.noise2D(worldOffsetX + 100, worldOffsetZ + 100) * 3);
                        hutX = Math.max(3, Math.min(hutX, this.chunkSize - 6));
                        hutZ = Math.max(3, Math.min(hutZ, this.chunkSize - 6));
                        const hutHeight = getSuperflatHeight();
                        this.generateHut(blocks, hutX, hutHeight, hutZ, vegetationPositions, worldOffsetX, worldOffsetZ);
                        this.hutLocations.add(`${chunkCenterX},${chunkCenterZ}`);
                    } else if (canSpawnTower) {
                        let towerX = Math.floor(this.chunkSize / 2) - 3 + Math.floor(this.structureNoise.noise2D(worldOffsetX + 300, worldOffsetZ + 300) * 4);
                        let towerZ = Math.floor(this.chunkSize / 2) - 3 + Math.floor(this.structureNoise.noise2D(worldOffsetX + 400, worldOffsetZ + 400) * 4);
                        towerX = Math.max(4, Math.min(towerX, this.chunkSize - 8));
                        towerZ = Math.max(4, Math.min(towerZ, this.chunkSize - 8));
                        const towerHeight = getSuperflatHeight();
                        this.generateTower(blocks, towerX, towerHeight, towerZ, vegetationPositions, worldOffsetX, worldOffsetZ);
                        this.towerLocations.add(`${chunkCenterX},${chunkCenterZ}`);
                    }
                }
            } else if (this.isStructureCreationMode) {
                // Generate a flat plane for structure building
                const { width, length } = this.structureCreationBounds;
                const chunkMinX = worldOffsetX;
                const chunkMaxX = worldOffsetX + this.chunkSize;
                const chunkMinZ = worldOffsetZ;
                const chunkMaxZ = worldOffsetZ + this.chunkSize;
                const structureMinX = 0;
                const structureMaxX = width;
                const structureMinZ = 0;
                const structureMaxZ = length;
                const overlaps = !(chunkMaxX <= structureMinX || chunkMinX >= structureMaxX ||
                                   chunkMaxZ <= structureMinZ || chunkMinZ >= structureMaxZ);
                if (overlaps) {
                    for (let x = 0; x < this.chunkSize; x++) {
                        for (let z = 0; z < this.chunkSize; z++) {
                            const worldX = worldOffsetX + x;
                            const worldZ = worldOffsetZ + z;
                            if (worldX >= 0 && worldX < width && worldZ >= 0 && worldZ < length) {
                                blocks.set(`${x},0,${z}`, 'grass');
                            }
                        }
                    }
                }
            } else {
                this.generateNormalTerrain(blocks, worldOffsetX, worldOffsetZ, treesToGenerate, cactiToGenerate, grassToGenerate, vegetationPositions);
            }
        }

        treesToGenerate.forEach(tree => {
            if (tree.type === 'oak') {
                this.generateTree(blocks, tree.x, tree.y, tree.z);
            } else if (tree.type === 'birch') {
                this.generateBirchTree(blocks, tree.x, tree.y, tree.z);
            } else if (tree.type === 'spruce') {
                this.generateSpruceTree(blocks, tree.x, tree.y, tree.z);
            } else if (tree.type === 'cherry') {
                this.generateCherryTree(blocks, tree.x, tree.y, tree.z);
            }
        });
        cactiToGenerate.forEach(cactus => {
            this.generateCactus(blocks, cactus.x, cactus.y, cactus.z);
        });
        grassToGenerate.forEach(grass => {
            if(grass.type === 'deadbush') {
                 blocks.set(`${grass.x},${grass.y},${grass.z}_deadbush_decoration`, 'deadbush');
            } else if (grass.type === 'rose') {
                 blocks.set(`${grass.x},${grass.y},${grass.z}_rose_decoration`, 'rose');
            } else if (grass.type === 'dandelion') {
                 blocks.set(`${grass.x},${grass.y},${grass.z}_dandelion_decoration`, 'dandelion');
            } else {
                 blocks.set(`${grass.x},${grass.y},${grass.z}_grass_decoration`, 'tall_grass');
            }
        });

        const mesh = this.createMeshFromBlocks(blocks, worldOffsetX, 0, worldOffsetZ);

        this.chunks.set(chunkKey, {
            blocks,
            mesh,
            x: chunkX,
            z: chunkZ,
            isDirty: isModified,
            neighbors: {}
        });
        if (isModified) {
            this.dirtyChunks.add(chunkKey);
        }
        this.connectChunkNeighbors(chunkX, chunkZ);
    }

    markChunkDirty(chunkX, chunkZ) {
        const chunkKey = `${chunkX},${chunkZ}`;
        const chunk = this.chunks.get(chunkKey);
        if (!chunk) return;
        chunk.isDirty = true;
        this.dirtyChunks.add(chunkKey);
        if (!this.rebuildQueue.some(item => item.chunkKey === chunkKey)) {
            const isVisible = this.visibleChunks.has(chunkKey);
            this.rebuildQueue.push({
                chunkKey,
                isVisible,
                priority: isVisible ? 1 : 0
            });
            this.rebuildQueue.sort((a, b) => b.priority - a.priority);
        }
    }

    rebuildChunkMesh(chunk) {
        if (chunk.mesh) {
            if (this.visibleChunks.has(`${chunk.x},${chunk.z}`)) {
                this.scene.remove(chunk.mesh);
            }
            if (chunk.mesh.children && chunk.mesh.children.length > 0) {
                chunk.mesh.children.forEach(child => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(material => material.dispose());
                        } else {
                            child.material.dispose();
                        }
                    }
                });
            }
        }
        const worldOffsetX = chunk.x * this.chunkSize;
        const worldOffsetZ = chunk.z * this.chunkSize;
        chunk.mesh = this.createMeshFromBlocks(chunk.blocks, worldOffsetX, 0, worldOffsetZ);
        if (this.visibleChunks.has(`${chunk.x},${chunk.z}`)) {
            this.scene.add(chunk.mesh);
        }
    }

    processRebuildQueue() {
        if (this.rebuildQueue.length === 0 || this.isProcessingRebuilds) return;
        this.isProcessingRebuilds = true;
        let rebuildsThisFrame = 0;
        while (rebuildsThisFrame < this.maxRebuildsPerFrame && this.rebuildQueue.length > 0) {
            const { chunkKey } = this.rebuildQueue.shift();
            const chunk = this.chunks.get(chunkKey);
            if (chunk && chunk.isDirty) {
                this.rebuildChunkMesh(chunk);
                rebuildsThisFrame++;
                chunk.isDirty = false;
            }
        }
        this.isProcessingRebuilds = false;
    }

    processGenerationQueue(playerChunkX, playerChunkZ) {
        if (this.generationQueue.length === 0) return;

        // Re-sort queue based on current player position to prioritize closest chunks
        this.generationQueue.sort((a, b) => {
            const distA = (a.chunkX - playerChunkX)**2 + (a.chunkZ - playerChunkZ)**2;
            const distB = (b.chunkX - playerChunkX)**2 + (b.chunkZ - playerChunkZ)**2;
            return distA - distB;
        });

        let generatesThisFrame = 0;
        while (generatesThisFrame < this.maxGeneratesPerFrame && this.generationQueue.length > 0) {
            const { chunkX, chunkZ } = this.generationQueue.shift();
            
            // Double check it wasn't generated somehow
            if (!this.chunks.has(`${chunkX},${chunkZ}`)) {
                this.generateChunk(chunkX, chunkZ);
                generatesThisFrame++;
            }
        }
    }

    updateChunks(playerChunkX, playerChunkZ) {
        const chunksToShow = new Set();
        
        // Find all chunks that should be visible
        for (let x = -this.renderDistance; x <= this.renderDistance; x++) {
            for (let z = -this.renderDistance; z <= this.renderDistance; z++) {
                if (x * x + z * z > this.renderDistance * this.renderDistance) continue;
                
                const chunkX = playerChunkX + x;
                const chunkZ = playerChunkZ + z;
                const chunkKey = `${chunkX},${chunkZ}`;
                chunksToShow.add(chunkKey);
            }
        }

        // Process chunks to show: make visible or queue for generation
        for (const chunkKey of chunksToShow) {
            if (this.chunks.has(chunkKey)) {
                // Existing chunk, ensure it's visible
                if (!this.visibleChunks.has(chunkKey)) {
                    this.visibleChunks.add(chunkKey);
                    const chunk = this.chunks.get(chunkKey);
                    if (chunk && chunk.mesh) {
                        this.scene.add(chunk.mesh);
                    }
                }
            } else {
                // New chunk, queue for generation if not already queued
                const [chunkXStr, chunkZStr] = chunkKey.split(',');
                const chunkX = parseInt(chunkXStr, 10);
                const chunkZ = parseInt(chunkZStr, 10);
                
                const alreadyInQueue = this.generationQueue.some(c => c.chunkX === chunkX && c.chunkZ === chunkZ);
                if (!alreadyInQueue) {
                    this.generationQueue.push({ chunkX, chunkZ });
                }
            }
        }

        // Hide chunks that are now out of range
        for (const chunkKey of this.visibleChunks) {
            if (!chunksToShow.has(chunkKey)) {
                const chunk = this.chunks.get(chunkKey);
                if (chunk && chunk.mesh) {
                    this.scene.remove(chunk.mesh);
                }
                this.visibleChunks.delete(chunkKey);
            }
        }
    }

    connectChunkNeighbors(chunkX, chunkZ) {
        const chunk = this.chunks.get(`${chunkX},${chunkZ}`);
        if (!chunk) return;
        const neighbors = [
            { x: 1, z: 0, dir: 'east' },
            { x: -1, z: 0, dir: 'west' },
            { x: 0, z: 1, dir: 'south' },
            { x: 0, z: -1, dir: 'north' },
        ];
        for (const neighbor of neighbors) {
            const nx = chunkX + neighbor.x;
            const nz = chunkZ + neighbor.z;
            const neighborKey = `${nx},${nz}`;
            const neighborChunk = this.chunks.get(neighborKey);
            if (neighborChunk) {
                chunk.neighbors[neighbor.dir] = neighborChunk;
                const oppositeDir = this.getOppositeDirection(neighbor.dir);
                neighborChunk.neighbors[oppositeDir] = chunk;
            }
        }
    }

    getOppositeDirection(direction) {
        switch (direction) {
            case 'east': return 'west';
            case 'west': return 'east';
            case 'north': return 'south';
            case 'south': return 'north';
            default: return direction;
        }
    }

    generateWorld(playerChunkX, playerChunkZ) {
        this.updateChunks(playerChunkX, playerChunkZ);
    }

    ensureChunkLoaded(chunkX, chunkZ) {
        const chunkKey = `${chunkX},${chunkZ}`;
        if (!this.chunks.has(chunkKey)) {
            this.generateChunk(chunkX, chunkZ);
        }
    }

    placeBlock(x, y, z, blockType, playerPosition = null, extraData = null) {
        const chunkX = Math.floor(x / this.chunkSize);
        const chunkZ = Math.floor(z / this.chunkSize);
        const chunkKey = `${chunkX},${chunkZ}`;

        const chunk = this.chunks.get(chunkKey);
        if (!chunk) return false;

        const localX = ((x % this.chunkSize) + this.chunkSize) % this.chunkSize;
        const localZ = ((z % this.chunkSize) + this.chunkSize) % this.chunkSize;

        const blockKeyInChunk = `${localX},${y},${localZ}`; 

        const currentBlockType = chunk.blocks.get(blockKeyInChunk);
        if (currentBlockType === blockType && !(blockType === 'oakdoor' || blockType === 'birchdoor')) {
                return true;
        }

        if (blockType === 'oakdoor' || blockType === 'birchdoor') {
            const blockBelow = this.getBlock(x, y - 1, z);

            // This is a recursive call to place the top half of the door
            if (blockBelow === blockType) { // Breaking bottom part of door
                if (chunk.blocks.has(blockKeyInChunk)) {
                    return false;
                }
                chunk.blocks.set(blockKeyInChunk, blockType);
                this.markChunkDirty(chunkX, chunkZ);
                return true;
            }

            // This is the primary call to place the bottom half
            const blockAbove = this.getBlock(x, y + 1, z);
            if (blockAbove) {
                return false;
            }
            
            chunk.blocks.set(blockKeyInChunk, blockType);

            const topPlacedSuccessfully = this.placeBlock(x, y + 1, z, blockType, playerPosition, extraData);
            
            if (!topPlacedSuccessfully) {
                chunk.blocks.delete(blockKeyInChunk);
                this.markChunkDirty(chunkX, chunkZ);
                return false;
            }

            // Set door metadata for BOTH halves. Only needs to be done once from bottom half placement.
            const doorType = blockType === 'birchdoor' ? 'birch' : 'oak';
            this.door.place(x, y, z, playerPosition, doorType);
            
            // Adjacent chunks might need update due to top half.
            this.markChunkDirty(chunkX, chunkZ);
            this.markAdjacentChunksIfNeeded(chunkX, chunkZ, localX, localZ);
            
            return true;
        }
        if (blockType === 'furnace' || blockType === 'chest' || blockType.endsWith('_stairs')) {
            if (playerPosition) {
                const dx = playerPosition.x - (x + 0.5);
                const dz = playerPosition.z - (z + 0.5);
        
                const angle = Math.atan2(dz, dx);
                
                let orientation; 
                if (angle >= -Math.PI / 4 && angle < Math.PI / 4) {
                    orientation = 3; 
                } else if (angle >= Math.PI / 4 && angle < 3 * Math.PI / 4) {
                    orientation = 0; 
                } else if (angle >= 3 * Math.PI / 4 || angle < -3 * Math.PI / 4) {
                    orientation = 1; 
                } else {
                    orientation = 2; 
                }
        
                if (!this.blockOrientations) {
                    this.blockOrientations = new Map();
                }
                this.blockOrientations.set(`${x},${y},${z}`, orientation);
            }
        }
        
        if (blockType === 'chest') {
            this.initializeChest(x, y, z);
        }
        
        if (blockType === 'ladder' && extraData) { 
            this.ladders.set(`${x},${y},${z}`, extraData);
        }
        chunk.blocks.set(blockKeyInChunk, blockType);
        this.markChunkDirty(chunkX, chunkZ);

        if (blockType === 'oaksapling' || blockType === 'birchsapling' || blockType === 'sprucesapling' || blockType === 'cherrysapling') {
            const worldSaplingKey = `${x},${y},${z}`;
            this.plantedSaplings.set(worldSaplingKey, {
                x: x, y: y, z: z, type: blockType, plantTime: Date.now()
            });
        }

        if (localX === 0) this.markChunkDirty(chunkX - 1, chunkZ);
        else if (localX === this.chunkSize - 1) this.markChunkDirty(chunkX + 1, chunkZ);

        if (localZ === 0) this.markChunkDirty(chunkX, chunkZ - 1);
        else if (localZ === this.chunkSize - 1) this.markChunkDirty(chunkX, chunkZ + 1);
        return true;
    }

    plantCrop(x, y, z) {
        const cropKey = `${x},${y},${z}`;
        if (this.crops.has(cropKey)) return; 
        this.crops.set(cropKey, {
            x, y, z,
            plantTime: Date.now(),
            stage: 'wheatstage1'
        });
    }

    updateCrops(deltaTime) {
        if (!this.lastCropUpdate) this.lastCropUpdate = 0;
        this.lastCropUpdate += deltaTime;

        if (this.lastCropUpdate < 1) return;

        this.lastCropUpdate = 0;

        for (const [key, cropData] of this.crops.entries()) {
            const now = Date.now();
            const elapsedTime = (now - cropData.plantTime) / 60000; 
            
            let currentStage = 'wheatstage1';
            
            if (elapsedTime >= 7.5) {
                currentStage = 'wheatfinished';
            } else if (elapsedTime >= 5) {
                currentStage = 'wheatstage3';
            } else if (elapsedTime >= 2.5) {
                currentStage = 'wheatstage2';
            } else {
                currentStage = 'wheatstage1';
            }
            
            if (cropData.stage !== currentStage) {
                cropData.stage = currentStage; 
                
                const { x, y, z } = cropData;
                const chunkX = Math.floor(x / this.chunkSize);
                const chunkZ = Math.floor(z / this.chunkSize);
                this.markChunkDirty(chunkX, chunkZ);
            }
        }
    }

    updateSaplings(deltaTime) {
        if (!this.lastSaplingUpdate) this.lastSaplingUpdate = 0;
        this.lastSaplingUpdate += deltaTime;

        if (this.lastSaplingUpdate < 5) return;
        this.lastSaplingUpdate = 0;

        const saplingsToGrow = [];

        for (const [key, saplingData] of this.plantedSaplings.entries()) {
            const now = Date.now();
            const elapsedTimeMinutes = (now - saplingData.plantTime) / 60000; 
            
            if (elapsedTimeMinutes > 1 && Math.random() < 0.05) { 
                 saplingsToGrow.push(saplingData);
            }
        }

        for (const saplingData of saplingsToGrow) {
            const { x, y, z, type } = saplingData;

            const chunkX = Math.floor(x / this.chunkSize);
            const chunkZ = Math.floor(z / this.chunkSize);
            const chunk = this.chunks.get(`${chunkX},${chunkZ}`);
            
            const localX = ((x % this.chunkSize) + this.chunkSize) % this.chunkSize;
            const localZ = ((z % this.chunkSize) + this.chunkSize) % this.chunkSize;

            // Remove sapling block
            chunk.blocks.delete(`${localX},${y},${localZ}`);
            this.plantedSaplings.delete(`${x},${y},${z}`);

            // Generate tree
            switch (type) {
                case 'oaksapling':
                    this.generateTree(chunk.blocks, localX, y, localZ);
                    break;
                case 'birchsapling':
                    this.generateBirchTree(chunk.blocks, localX, y, localZ);
                    break;
                case 'sprucesapling':
                    this.generateSpruceTree(chunk.blocks, localX, y, localZ);
                    break;
                case 'cherrysapling':
                    this.generateCherryTree(chunk.blocks, localX, y, localZ);
                    break;
            }

            // Mark this chunk and neighbors as dirty because a tree can span across chunks.
            this.markChunkDirty(chunkX, chunkZ);
            this.markChunkDirty(chunkX + 1, chunkZ);
            this.markChunkDirty(chunkX - 1, chunkZ);
            this.markChunkDirty(chunkX, chunkZ + 1);
            this.markChunkDirty(chunkX, chunkZ - 1);
        }
    }

    weightedChoice(choices) {
        const totalWeight = choices.reduce((sum, choice) => sum + choice.weight, 0);
        if (totalWeight <= 0) return null;
        let random = Math.random() * totalWeight;
        for (const choice of choices) {
            random -= choice.weight;
            if (random <= 0) return choice.item;
        }
        return choices[0].item;
    }

    isPositionColliding(position) {
        const x = Math.floor(position.x);
        const y = Math.floor(position.y);
        const z = Math.floor(position.z);
        const blockType = this.getBlock(x, y, z);
        if (!blockType) return false;

        if (blockType === 'oakdoor' || blockType === 'birchdoor') {
            const isOpen = this.door.isOpen(x, y, z);
            if (isOpen) {
                const localX = position.x - x;
                const localZ = position.z - z;
                if (localX > 0.5 || localZ > 0.5) return false;
            }
        }
        if (blockType === 'ladder') {
            return false;
        }
        if (blockType === 'oaksapling' || blockType === 'birchsapling' || blockType === 'sprucesapling' || blockType === 'cherrysapling') {
            return false;
        }
        return this.isBlockSolid(x, y, z);
    }

    getVoxelBelow(position) {
        const x = Math.floor(position.x);
        const y = Math.floor(position.y);
        const z = Math.floor(position.z);
        const blockType = this.getBlock(x, y, z);

        if (blockType) {
            if (blockType === 'oakdoor' || blockType === 'birchdoor') {
                return this.door.isSolid(x, y, z);
            }
            if (blockType === 'oaksapling' || blockType === 'birchsapling' || blockType === 'sprucesapling' || blockType === 'cherrysapling') { 
                return false;
            }
            return this.isBlockSolid(x, y, z);
        }
        return false;
    }

    isBlockSolid(x, y, z) {
        const block = this.getBlock(x, y, z);
        if (!block) return false;

        if (block === 'ladder') {
            return false;
        }

        if (block === 'oakdoor' || block === 'birchdoor') {
            return this.door.isSolid(x, y, z);
        }
        if (block === 'oaksapling' || block === 'birchsapling' || block === 'sprucesapling' || block === 'cherrysapling') { 
            return false;
        }
        return block != null;
    }

    isSlab(blockType) {
        return this.slabTypes.includes(blockType) || blockType === 'cherryslab';
    }

    getHeight(x, z) {
        if (this.isSuperflat) {
            return getSuperflatHeight();
        }

        const biomeData = this.getBiomeAt(x, z);
        const biome = biomeData.biome;

        const mainNoise = this.noise.noise2D(x * 0.002, z * 0.002) * biome.heightVariation;
        const hillNoise = this.noise.noise2D(x * 0.008, z * 0.008) * biome.hilliness;
        const detailNoise = this.noise.noise2D(x * 0.04, z * 0.04) * biome.detailScale * 5;

        let height = biome.baseHeight + mainNoise + hillNoise + detailNoise;

        if (biome.name === 'Hills' && biome.plateauThreshold) {
            const plateauNoise = this.noise.noise2D(x * 0.002, z * 0.002);
            if (plateauNoise > biome.plateauThreshold + biome.plateauTransitionWidth) {
                height = biome.baseHeight + (biome.heightVariation / 2); 
            } else if (plateauNoise > biome.plateauThreshold - biome.plateauTransitionWidth) {
                const t = (plateauNoise - (biome.plateauThreshold - biome.plateauTransitionWidth)) / (biome.plateauTransitionWidth * 2);
                height = biome.baseHeight + (biome.heightVariation / 2) * this.smoothStep(t);
            }
        }

        // The lowest terrain should be at y=12 to allow for 8 blocks of stone above bedrock (y=0) and 3 layers of dirt/grass.
        return Math.floor(Math.max(12.0, height));
    }

    isSnowHeight(x, y, z) {
        const biomeData = this.getBiomeAt(x, z);
        const mountainBiome = this.biomes.mountains;
        if (!biomeData || biomeData.mountainBlend < 0.3 || !mountainBiome.snowHeight) return false;

        const snowLine = mountainBiome.snowHeight;
        const snowVariation = mountainBiome.snowVariation || 0;
        const snowNoise = this.snowNoise.noise2D(x * 0.01, z * 0.01) * snowVariation;

        return y >= snowLine + snowNoise;
    }

    shouldPlaceSnowBlock(x, y, z) {
        const biomeData = this.getBiomeAt(x, z);
        const mountainBiome = this.biomes.mountains;
        if (!biomeData || biomeData.mountainBlend < 0.6 || !mountainBiome.snowBlockThreshold) return false;

        const snowBlockLine = mountainBiome.snowBlockThreshold;
        const snowBlockVariation = mountainBiome.snowBlockVariation || 0;
        const snowBlockNoise = this.snowBlockNoise.noise2D(x * 0.02, z * 0.02) * snowBlockVariation;

        return y >= snowBlockLine + snowBlockNoise;
    }

    initializeChest(x, y, z) {
        const chestKey = `${x},${y},${z}`;
        if (this.chests.has(chestKey)) return;
        this.chests.set(chestKey, {
            x, y, z,
            inventory: new Array(27).fill().map(() => ({ type: null, count: 0 }))
        });
    }

    getChestData(x, y, z) {
        const chestKey = `${x},${y},${z}`;
        return this.chests.get(chestKey);
    }

    markAdjacentChunksIfNeeded(chunkX, chunkZ, localX, localZ) {
        if (localX === 0) this.markChunkDirty(chunkX - 1, chunkZ);
        else if (localX === this.chunkSize - 1) this.markChunkDirty(chunkX + 1, chunkZ);

        if (localZ === 0) this.markChunkDirty(chunkX, chunkZ - 1);
        else if (localZ === this.chunkSize - 1) this.markChunkDirty(chunkX, chunkZ + 1);
    }

    toggleDoor(x, y, z) {
        return this.door.toggle(x, y, z, this);
    }

    raycast(pos, dir) {
        const lastPos = new THREE.Vector3();
        const faceNormal = new THREE.Vector3();
        const stepDistance = 0.05;
        const maxDistance = (this.worldData && this.worldData.settings && this.worldData.settings.isCreative) ? 100 : 5;
        const maxSteps = Math.floor(maxDistance / stepDistance);
        const currentPos = new THREE.Vector3(pos.x, pos.y, pos.z);
        const step = new THREE.Vector3(dir.x, dir.y, dir.z).normalize().multiplyScalar(stepDistance);
    
        for (let i = 0; i < maxSteps; i++) {
            lastPos.copy(currentPos);
            currentPos.add(step);
    
            const blockX = Math.floor(currentPos.x);
            const blockY = Math.floor(currentPos.y);
            const blockZ = Math.floor(currentPos.z);
            
            // Avoid re-checking the same block
            if (blockX === Math.floor(lastPos.x) && blockY === Math.floor(lastPos.y) && blockZ === Math.floor(lastPos.z)) {
                continue;
            }
    
            const chunkX = Math.floor(blockX / this.chunkSize);
            const chunkZ = Math.floor(blockZ / this.chunkSize);
            const chunk = this.chunks.get(`${chunkX},${chunkZ}`);
    
            if (chunk) {
                const localX = ((blockX % this.chunkSize) + this.chunkSize) % this.chunkSize;
                const localZ = ((blockZ % this.chunkSize) + this.chunkSize) % this.chunkSize;

                // Check for decoration blocks first
                const decorationSuffixes = ['_grass_decoration', '_deadbush_decoration', '_rose_decoration', '_dandelion_decoration', '_crop'];
                for (const dec of decorationSuffixes) {
                    const decKey = `${localX},${blockY},${localZ}${dec}`;
                    if (chunk.blocks.has(decKey)) {
                        faceNormal.set(0, 1, 0); 
                        return {
                            position: { x: blockX, y: blockY, z: blockZ },
                            face: { normal: faceNormal },
                            type: dec.replace(/_decoration$/, ''),
                            isSlab: false
                        };
                    }
                }
                
                const blockKeyInChunk = `${localX},${blockY},${localZ}`; 
                const blockType = chunk.blocks.get(blockKeyInChunk);

                if (blockType) {
                    // We hit a block. Now determine the face.
                    const lastBlockX = Math.floor(lastPos.x);
                    const lastBlockY = Math.floor(lastPos.y);
                    const lastBlockZ = Math.floor(lastPos.z);
                    
                    if (blockX > lastBlockX) faceNormal.set(-1, 0, 0);
                    else if (blockX < lastBlockX) faceNormal.set(1, 0, 0);
                    else if (blockY > lastBlockY) faceNormal.set(0, -1, 0);
                    else if (blockY < lastBlockY) faceNormal.set(0, 1, 0);
                    else if (blockZ > lastBlockZ) faceNormal.set(0, 0, -1);
                    else if (blockZ < lastBlockZ) faceNormal.set(0, 0, 1);
                    else { // Ray started inside a block, can't determine face.
                        faceNormal.set(0, 0, 0);
                    }
                    
                    return {
                        position: { x: blockX, y: blockY, z: blockZ },
                        face: { normal: faceNormal },
                        type: blockType,
                        isSlab: this.isSlab(blockType)
                    };
                }
            }
        }
        return null;
    }

    dropItem(position, velocity, item) {
        const itemId = this.nextItemId++;
        const itemSize = 0.2675; 
        
        const geometry = new THREE.BoxGeometry(itemSize, itemSize, itemSize);
        
        const itemType = item.type;
        let material = this.getMaterialsForBlock(itemType);

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        
        this.scene.add(mesh);

        this.droppedItems.set(itemId, {
            id: itemId,
            mesh: mesh,
            velocity: velocity,
            itemData: item,
            age: 0,
            grounded: false
        });
    }

    updateDroppedItems(deltaTime) {
        const gravity = 20.0;
        const itemHalfHeight = 0.2675 / 2;
        for (const [id, item] of this.droppedItems.entries()) {
            item.age += deltaTime;
            if (item.age > 300) { 
                this.removeItem(id);
                continue;
            }

            if (item.grounded) {
                // Item is on the ground, do bobbing animation.
                const bobbingSpeed = 3;
                const bobbingHeight = 0.05;
                item.mesh.position.y = item.groundedY + Math.sin(item.age * bobbingSpeed) * bobbingHeight;

                // Optional: check if the block below is still there. If not, unground.
                const blockX = Math.floor(item.mesh.position.x);
                const blockZ = Math.floor(item.mesh.position.z);
                const blockBelowY = Math.floor(item.mesh.position.y - itemHalfHeight - 0.1);
                if (!this.getBlock(blockX, blockBelowY, blockZ)) {
                    item.grounded = false;
                    delete item.groundedY;
                }
            } else {
                // Item is in the air, apply physics.
                item.velocity.y -= gravity * deltaTime;
                item.mesh.position.add(item.velocity.clone().multiplyScalar(deltaTime));

                // Check for collision
                const itemPos = item.mesh.position;
                const blockX = Math.floor(itemPos.x);
                const blockZ = Math.floor(itemPos.z);
                const blockBelowY = Math.floor(itemPos.y - itemHalfHeight);
                const blockBelowType = this.getBlock(blockX, blockBelowY, blockZ);

                let collided = false;
                let groundY = 0;

                if (blockBelowType) {
                    if (this.isSlab(blockBelowType)) {
                        if (itemPos.y <= blockBelowY + 0.5 + itemHalfHeight) {
                            collided = true;
                            groundY = blockBelowY + 0.5 + itemHalfHeight;
                        }
                    } else {
                        if (itemPos.y <= blockBelowY + 1 + itemHalfHeight) {
                            collided = true;
                            groundY = blockBelowY + 1 + itemHalfHeight;
                        }
                    }
                }

                if (collided) {
                    item.grounded = true;
                    item.groundedY = groundY;
                    item.mesh.position.y = groundY; // Snap to ground to prevent jitter
                    item.velocity.set(0, 0, 0); // Stop movement
                }
            }
        }
    }

    checkPickup(playerPosition) {
        const pickupRadiusSq = 1.95 * 1.95; 
        for (const [id, item] of this.droppedItems.entries()) {
            // Add a 1-second delay before an item can be picked up.
            if (item.age < 1.0) {
                continue;
            }
            const distanceSq = playerPosition.distanceToSquared(item.mesh.position);
            if (distanceSq < pickupRadiusSq) {
                return {
                    id: id,
                    ...item.itemData
                };
            }
        }
        return null;
    }

    removeItem(id) {
        const item = this.droppedItems.get(id);
        if (item) {
            this.scene.remove(item.mesh);
            item.mesh.geometry.dispose();
            if (Array.isArray(item.mesh.material)) {
                item.mesh.material.forEach(material => material.dispose());
            } else {
                item.mesh.material.dispose();
            }
            this.droppedItems.delete(id);
        }
    }

    breakBlock(x, y, z) {
        const chunkX = Math.floor(x / this.chunkSize);
        const chunkZ = Math.floor(z / this.chunkSize);
        const chunkKey = `${chunkX},${chunkZ}`;
    
        const chunk = this.chunks.get(chunkKey);
        if (!chunk) return false;
    
        const localX = ((x % this.chunkSize) + this.chunkSize) % this.chunkSize;
        const localZ = ((z % this.chunkSize) + this.chunkSize) % this.chunkSize;

        // First check for decoration blocks as they are not "solid" but can be broken
        const decorationSuffixes = ['_grass_decoration', '_deadbush_decoration', '_rose_decoration', '_dandelion_decoration', '_crop'];
        for (const dec of decorationSuffixes) {
            const decKey = `${localX},${y},${localZ}${dec}`;
            if (chunk.blocks.has(decKey)) {
                const decType = chunk.blocks.get(decKey); // e.g., 'tall_grass'
                chunk.blocks.delete(decKey);
                this.markChunkDirty(chunkX, chunkZ);
                
                if (decType === 'tall_grass') return Math.random() < 0.1 ? { type: 'seeds', count: 1 } : null;
                if (decType === 'rose') return 'rose';
                if (decType === 'dandelion') return 'dandelion';
                if (decType === 'deadbush') return 'stick';
                if (decType === 'crop') {
                    const worldCropKey = `${x},${y},${z}`;
                    const cropData = this.crops.get(worldCropKey);
                    this.crops.delete(worldCropKey);
                    if (cropData) {
                        const now = Date.now();
                        const elapsedTime = (now - cropData.plantTime) / 60000;
                        if (elapsedTime >= 7.5) {
                            return { type: 'wheat', count: 1 + Math.floor(Math.random() * 2) };
                        }
                    }
                    return { type: 'seeds', count: 1 };
                }
                return null; // No drop for some decorations
            }
        }
        
        const blockKeyInChunk = `${localX},${y},${localZ}`;
        const blockType = chunk.blocks.get(blockKeyInChunk);
    
        if (!blockType) return false;
    
        // Logic for multi-block structures like doors
        if (blockType === 'oakdoor' || blockType === 'birchdoor') {
            const blockAbove = this.getBlock(x, y + 1, z);
            const blockBelow = this.getBlock(x, y - 1, z);
    
            if (blockAbove === blockType) { // Breaking bottom part of door
                this.removeBlock(x, y + 1, z);
            } else if (blockBelow === blockType) { // Breaking top part
                this.removeBlock(x, y - 1, z);
            }
            this.door.remove(x, y, z);
        }
        
        // Remove from special maps
        const worldKey = `${x},${y},${z}`;
        if (blockType.endsWith('_stairs') || blockType === 'furnace' || blockType === 'chest') {
            this.blockOrientations.delete(worldKey);
        }
        if (blockType === 'chest') {
            this.chests.delete(worldKey);
        }
        if (blockType === 'ladder') {
            this.ladders.delete(worldKey);
        }
        if (blockType.endsWith('sapling')) {
            this.plantedSaplings.delete(worldKey);
        }
    
        chunk.blocks.delete(blockKeyInChunk);
        this.markChunkDirty(chunkX, chunkZ);
        this.markAdjacentChunksIfNeeded(chunkX, chunkZ, localX, localZ);
    
        // Drop logic
        if (blockType === 'stone' || blockType === 'smoothstone') {
            return 'cobble';
        }
        if (blockType === 'grass') {
            return 'dirt';
        }
        if (blockType.includes('leaves')) {
            if (Math.random() < 0.05) { // 5% chance to drop sapling
                if (blockType === 'leaves') return 'oaksapling';
                if (blockType === 'birchleaves') return 'birchsapling';
                if (blockType === 'spruceleaves') return 'sprucesapling';
                if (blockType === 'cherryleaves') return 'cherrysapling';
            }
            if(Math.random() < 0.02) { // 2% chance to drop stick
                return 'stick';
            }
            return null; // No drop
        }
        if (blockType === 'oakdoor' || blockType === 'birchdoor') {
            return blockType;
        }
    
        return blockType;
    }
    
    removeBlock(x, y, z) {
        const chunkX = Math.floor(x / this.chunkSize);
        const chunkZ = Math.floor(z / this.chunkSize);
        const chunk = this.chunks.get(`${chunkX},${chunkZ}`);
        if (chunk) {
            const localX = ((x % this.chunkSize) + this.chunkSize) % this.chunkSize;
            const localZ = ((z % this.chunkSize) + this.chunkSize) % this.chunkSize;
            chunk.blocks.delete(`${localX},${y},${localZ}`);
            this.markChunkDirty(chunkX, chunkZ);
        }
    }
}
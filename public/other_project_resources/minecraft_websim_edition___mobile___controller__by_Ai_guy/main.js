import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { VoxelWorld } from './voxelWorld.js';
import { Player } from './player.js';
import { Inventory } from './inventory.js';
import { 
    gameSettings, fogSettings, loadGameSettings, saveGameSettings, 
    updateSettingsUI, updateKeybindButtonsDisplay, getKeyDisplayName,
    updateCameraFOV, applyCameraSensitivity, updateShadowSettings,
    updateFogForRenderDistance, updateFog, toggleFog, toggleFogType,
    updateChunkUpdateRate, resetSettings, resetKeybindings
} from './settings.js';
import * as mods from './mods.js';
import './pickaxes.js';
import { BlockBreaker } from './blockBreaking.js';
import { BlockPlacer } from './blockPlacing.js';
import { BlockParticleSystem } from './blockParticles.js';
import { 
    dayNightCycle, initDayNightCycle, updateDayNightCycle, 
    updateShadowPosition, updateStarsPosition
} from './dayNightCycle.js';
import { TOOL_DURABILITIES } from './pickaxes.js'; // Added import
import { soundManager } from './utils.js';

let scene, camera, renderer, controls;
let player, voxelWorld, inventory;
let clock = new THREE.Clock();
let frameCount = 0;
let lastFpsUpdate = 0;
let lastFrameTime = 0;
let highlightBox;
let highlightBoxEdges;
let currentWorldName = null;
let directionalLight;
let sun;
let ambientLight, hemisphereLight, sunTarget;
let particleSystem;
let dayCounter = null;
let daysPassed = 0;
let lastDayCheck = 0;
let isPaused = false;
let animationFrameId = null;
let isMobileMode = false;
let prevGamepadState = null; // For gamepad button press detection

// NEW: For structure creation mode
let isStructureCreationMode = false;
let structureCreationBounds = { width: 0, length: 0 };

// NEW: Gamepad UI Navigator
window.gamepadUINavigator = {
    active: false,
    grid: [],
    x: 0,
    y: 0,
    currentScreen: null,
    navMap: null,
    moveCooldown: 0,

    activate(screenId) {
        this.deactivate(); // Clear previous state
        this.active = true;
        this.currentScreen = screenId;
        this.buildNavMap();
        if (this.navMap) {
            this.x = this.navMap.startX || 0;
            this.y = this.navMap.startY || 0;
            this.updateSelection();
        }
    },

    deactivate() {
        if (this.active) {
            this.active = false;
            this.navMap = null;
            document.querySelectorAll('.gamepad-selected').forEach(el => el.classList.remove('gamepad-selected'));
            if (inventory.isDragging) {
                inventory.returnItemToSource();
                inventory.isDragging = false;
                inventory.draggedItem = null;
                document.getElementById('dragged-item').style.display = 'none';
            }
        }
    },

    buildNavMap() {
        const screen = document.getElementById(this.currentScreen);
        if (!screen) { this.navMap = null; return; }

        const invGrid = Array.from({length: 3}, (_, r) => Array.from({length: 9}, (_, c) => `inventory-${r*9+c}`));
        const hotbarGrid = [Array.from({length: 9}, (_, c) => `hotbar-${c}`)];

        if (this.currentScreen === 'inventory-screen') {
            const mainGrid = [
                [null, null, null, null, 'craft-0', 'craft-1', null, 'craft-result'],
                [null, null, null, null, 'craft-2', 'craft-3', null, null],
                ...invGrid,
                ...hotbarGrid
            ];

            const quickCraftItems = screen.querySelectorAll('#inventory-quick-craft-list .quick-craft-item');
            const quickCraftSlots = Array.from(quickCraftItems).map(el => el.dataset.slot);

            // Add quick craft slots as a new column with padding
            for (let i = 0; i < mainGrid.length; i++) {
                mainGrid[i].push(null); // padding column
                mainGrid[i].push(quickCraftSlots[i] || null);
            }

            // If quick craft has more items, add rows for them
            if (quickCraftSlots.length > mainGrid.length) {
                for (let i = mainGrid.length; i < quickCraftSlots.length; i++) {
                    const newRow = Array(10).fill(null);
                    newRow.push(quickCraftSlots[i]);
                    mainGrid.push(newRow);
                }
            }

            this.navMap = {
                grid: mainGrid,
                queryRoot: screen,
                startX: 4, startY: 2,
            };
        } else if (this.currentScreen === 'crafting-table-screen') {
            const mainGrid = [
                ['table-craft-0', 'table-craft-1', 'table-craft-2', null, 'table-craft-result'],
                ['table-craft-3', 'table-craft-4', 'table-craft-5', null, null],
                ['table-craft-6', 'table-craft-7', 'table-craft-8', null, null],
                ...invGrid,
                ...hotbarGrid
            ];

            const quickCraftItems = screen.querySelectorAll('#crafting-table-quick-craft-list .quick-craft-item');
            const quickCraftSlots = Array.from(quickCraftItems).map(el => el.dataset.slot);

            // Get the length of the longest row in mainGrid before adding more columns
            const longestRowLength = Math.max(...mainGrid.map(r => r.length));

            // Add padding and quick craft column
            for (let i = 0; i < mainGrid.length; i++) {
                while (mainGrid[i].length < longestRowLength) { mainGrid[i].push(null); } // Pad current row
                mainGrid[i].push(null); // padding column
                mainGrid[i].push(quickCraftSlots[i] || null);
            }
            
            if (quickCraftSlots.length > mainGrid.length) {
                for (let i = mainGrid.length; i < quickCraftSlots.length; i++) {
                    const newRow = Array(longestRowLength + 1).fill(null);
                    newRow.push(quickCraftSlots[i]);
                    mainGrid.push(newRow);
                }
            }
            
            this.navMap = {
                grid: mainGrid,
                queryRoot: screen,
                startX: 0, startY: 3,
            };
        } else if (this.currentScreen === 'furnace-screen') {
            this.navMap = {
                grid: [
                    [null, null, null, null, 'furnace-input', null, null, null, null],
                    [null, null, null, null, 'furnace-fuel', null, null, null, null],
                    [null, null, null, null, 'furnace-result', null, null, null, null],
                    ...invGrid,
                    ...hotbarGrid
                ],
                queryRoot: screen,
                startX: 4, startY: 3,
            };
        } else if (this.currentScreen === 'chest-screen') {
            const chestGrid = Array.from({length: 3}, (_, r) => Array.from({length: 9}, (_, c) => `chest-${r*9+c}`));
            this.navMap = {
                grid: [
                    ...chestGrid,
                    ...invGrid,
                    ...hotbarGrid
                ],
                queryRoot: screen,
                startX: 0, startY: 0,
            };
        } else {
            this.navMap = null;
        }
    },

    move(dx, dy) {
        if (!this.active || !this.navMap) return;
        let newX = this.x + dx;
        let newY = this.y + dy;
    
        // Clamp Y
        newY = Math.max(0, Math.min(this.navMap.grid.length - 1, newY));
        
        // Clamp X based on new row
        const row = this.navMap.grid[newY];
        if (!row) return; // Should not happen
        newX = Math.max(0, Math.min(row.length - 1, newX));
    
        // If target is null, we need to search.
        if (!row[newX]) {
            if (dx > 0) { // moving right
                for (let i = newX; i < row.length; i++) { if (row[i]) { newX = i; break; }}
            } else if (dx < 0) { // moving left
                for (let i = newX; i >= 0; i--) { if (row[i]) { newX = i; break; }}
            } else { // vertical movement into a null column
                let bestX = -1, minDiff = Infinity;
                for(let i=0; i<row.length; i++) {
                    if (row[i]) {
                        const diff = Math.abs(i - this.x);
                        if (diff < minDiff) { minDiff = diff; bestX = i; }
                    }
                }
                if (bestX !== -1) newX = bestX;
                else return; // Whole row is empty, do not move.
            }
        }
        
        // Final check if we found a valid slot
        if (this.navMap.grid[newY]?.[newX]) {
            this.x = newX;
            this.y = newY;
            this.updateSelection();
        }
    },

    updateSelection() {
        if (!this.active || !this.navMap) return;
        document.querySelectorAll('.gamepad-selected').forEach(el => el.classList.remove('gamepad-selected'));
        
        const slotId = this.navMap.grid[this.y]?.[this.x];
        if (slotId) {
            const queryScreen = this.navMap.queryRoot;
            let slotEl = queryScreen.querySelector(`[data-slot="${slotId}"]`);
            // data-slot can be duplicated in different sections (main inventory vs hotbar)
            // so we need to be more specific.
            if (slotId.startsWith('hotbar-')) {
                slotEl = queryScreen.querySelector(`.inventory-hotbar [data-slot="${slotId}"]`);
            } else if (slotId.startsWith('inventory-')) {
                slotEl = queryScreen.querySelector(`.main-inventory[data-slot="${slotId}"]`) || queryScreen.querySelector(`[data-slot="${slotId}"]`);
            }
             
            if (slotEl) {
                slotEl.classList.add('gamepad-selected');
                // scrollIntoView can be janky, but let's keep it for now
                slotEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
                inventory.updateGamepadDraggedItemPosition();
            }
        }
    },

    click() {
        if (!this.active || !this.navMap) return;
        const slotId = this.navMap.grid[this.y]?.[this.x];
        if (slotId) {
            inventory.handleGamepadClick(slotId);
        }
    },

    resetToHotbar() {
        if (!this.active || !this.navMap) return;

        // Find the hotbar row
        let hotbarY = -1;
        for (let i = this.navMap.grid.length - 1; i >= 0; i--) {
            if (this.navMap.grid[i].some(slotId => slotId && slotId.startsWith('hotbar-'))) {
                hotbarY = i;
                break;
            }
        }
        
        if (hotbarY !== -1) {
            this.y = hotbarY;
            // Find first non-null slot in hotbar row, defaulting to the left-most.
            this.x = this.navMap.grid[hotbarY].findIndex(slotId => !!slotId);
            if (this.x === -1) this.x = 0; // fallback if hotbar is empty
            this.updateSelection();
        }
    },
};

// Day/night cycle variables
let gameTime = 0;
let stars = [];
let moon;

function requestFullscreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(err => {
            console.warn(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    } else if (elem.mozRequestFullScreen) { // Firefox
        elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) { // Chrome, Safari and Opera
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { // IE/Edge
        elem.msRequestFullscreen();
    }
}

// Pre-load sounds to reduce delay
const clickSound = new Audio('click.mp3');
clickSound.volume = 0.5;

let worldSettings = {
    isCreative: false,
    isSuperflat: false,
    starterChestEnabled: false, // Added starterChestEnabled
    showDays: false,
    isStructureCreation: false // Add this flag
};

async function showLoadingScreenAndInit(worldData, isNewWorld = false) {
    const loadingScreen = document.getElementById('loading-screen');
    const loadingBar = document.getElementById('loading-bar');
    const loadingText = document.getElementById('loading-text');
    const loadingTips = document.getElementById('loading-tips');

    // Ensure elements exist
    if (!loadingScreen || !loadingBar || !loadingText || !loadingTips) {
        console.error("Loading screen elements not found! Starting world immediately.");
        init(worldData);
        return;
    }

    loadingText.textContent = isNewWorld ? "Building terrain..." : "Loading world...";

    const tips = [
        "Right-click to place blocks!",
        "Hold sprint to move faster!",
        "Punch trees to get wood.",
        "Craft a pickaxe to mine stone.",
        "Beware of the dark...",
        "You can find diamonds deep underground.",
        "Use a furnace to smelt ores.",
        "Slabs can be placed as half-blocks.",
        "Chests can store your items.",
        "Use a crafting table for more complex recipes.",
        "Ladders help you climb vertical surfaces.",
        "Doors can be opened and closed with a right-click."
    ];
    loadingTips.textContent = tips[Math.floor(Math.random() * tips.length)];

    // Hide the menu immediately
    document.getElementById('menu-container').style.display = 'none';

    // Reset and show loading screen
    loadingBar.style.transition = 'none';
    loadingBar.style.width = '0%';
    loadingScreen.style.display = 'flex';
    
    // Force a reflow to ensure the transition starts from 0%
    loadingBar.getBoundingClientRect(); 

    // Start the loading bar animation
    loadingBar.style.transition = 'width 2s ease-out'; // Faster loading bar
    loadingBar.style.width = '100%';

    const timerPromise = new Promise(resolve => setTimeout(resolve, 2000));
    const initPromise = init(worldData);

    await Promise.all([timerPromise, initPromise]);
    
    // After both are complete, hide loading screen
    loadingScreen.style.display = 'none';
}

async function init(worldData = null) {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    isPaused = false;
    // Stop menu music and start game music
    soundManager.stopLoop('menu_music', 1.0);

    document.getElementById('menu-container').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
    document.getElementById('pause-menu').style.display = 'none';
    
    document.getElementById('inventory-screen').style.display = 'none';
    document.getElementById('crafting-table-screen').style.display = 'none';
    document.getElementById('furnace-screen').style.display = 'none';
    document.getElementById('chest-screen').style.display = 'none';

    if (isMobileMode) {
        document.body.classList.add('is-mobile');
    } else {
        document.body.classList.remove('is-mobile');
    }
    
    // Remove the held item display if it exists
    const heldItemDisplay = document.getElementById('held-item-display');
    if (heldItemDisplay) {
        heldItemDisplay.style.display = 'none';
    }
    
    loadGameSettings();

    const fpsDisplay = document.getElementById('fps-display');
    if (fpsDisplay) {
        fpsDisplay.style.display = gameSettings.showFps ? 'block' : 'none';
    }

    if (worldData && worldData.settings) {
        worldSettings = worldData.settings;
        isStructureCreationMode = worldSettings.isStructureCreation || false; // Set global flag
    }

    if (worldSettings.isCreative) {
        createFlyingIndicator();
    }
    if (worldSettings.alwaysDay === undefined) {
        worldSettings.alwaysDay = false;
    }

    scene = new THREE.Scene();
    
    // Initialize with day sky color but we'll update it based on time
    scene.background = new THREE.Color(0x9edfff);

    updateFogForRenderDistance(scene);

    if (gameSettings.fog) {
        if (fogSettings.fogType === 'linear') {
            scene.fog = new THREE.Fog(fogSettings.fogColor, fogSettings.linearFogNear, fogSettings.linearFogFar);
            scene.fog._baseFar = fogSettings.linearFogFar; 
        } else {
            scene.fog = new THREE.FogExp2(fogSettings.fogColor, fogSettings.expFogDensity);
            scene.fog._baseDensity = fogSettings.expFogDensity; 
        }
        
        function enhancedUpdateFog(scene, camera) {
            updateFog(scene, camera);
            
            if (scene && scene.fog && scene.fog.isFog) {
                scene.traverse(object => {
                    if (object.isMesh && object.position.y > fogSettings.skyHeightCutoff) {
                        if (!object._originalMaterial) {
                            object._originalMaterial = object.material;
                            object.material = object.material.clone();
                            object.material.fog = false;
                        }
                    } else if (object.isMesh && object._originalMaterial && object.position.y <= fogSettings.skyHeightCutoff) {
                        object.material = object._originalMaterial;
                        delete object._originalMaterial;
                    }
                });
            }
        }
        
        window.gameUpdateFog = enhancedUpdateFog;
    }

    camera = new THREE.PerspectiveCamera(gameSettings.fov, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 30, 0);

    const canvas = document.getElementById('game-canvas');
    renderer = new THREE.WebGLRenderer({ 
        canvas, 
        antialias: true,
        shadowMap: {
            enabled: true
        }
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    renderer.shadowMap.enabled = gameSettings.shadows;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.85;
    
    setupLighting();
    
    const dayNightObjects = initDayNightCycle(scene);
    stars = dayNightObjects.stars;
    moon = dayNightObjects.moon;
    sun = dayNightObjects.sun;
    
    controls = new PointerLockControls(camera, document.body);
    
    // Make controls globally accessible for inventory screens
    window.controls = controls;
    
    applyCameraSensitivity(controls);

    inventory = new Inventory();
    if (isMobileMode) {
        inventory.setupMobileEventListeners();
    }

    if (worldData && worldData.inventory) {
        inventory.loadFromData(worldData.inventory);
    } else {
        inventory.loadInventory();
    }

    particleSystem = new BlockParticleSystem(scene);
    particleSystem.setCamera(camera);

    voxelWorld = new VoxelWorld(scene, worldData);
    voxelWorld.renderDistance = gameSettings.renderDistance;
    voxelWorld.isSuperflat = worldSettings.isSuperflat;

    if (worldSettings.isStructureCreation && worldData.structureCreationBounds) {
        voxelWorld.isStructureCreationMode = true;
        voxelWorld.structureCreationBounds = worldData.structureCreationBounds;
    }

    if (worldSettings.isSuperflat) {
        voxelWorld.generateStructuresOnSuperflat = worldSettings.generateStructuresOnSuperflat;
    }

    updateChunkUpdateRate(voxelWorld);

    player = new Player(camera, controls, voxelWorld, inventory, gameSettings.keybindings, isMobileMode);
    player.particleSystem = particleSystem;
    
    if (worldSettings.isCreative) {
        player.isCreative = true;
        player.canFly = true;
        
        if (inventory) {
            inventory.isCreative = true;
            inventory.fillCreativeInventory();
        }
    }
    
    player.justSpawned = true;
    player._lastGroundedY = player.camera.position.y;
    player._wasGrounded = false;
    
    const originalUpdate = player.update.bind(player);
    player.update = function(deltaTime) {
        originalUpdate(deltaTime);
        
        if (this.grounded) {
            if (!this._wasGrounded) {
                if (!this.justSpawned) {
                    const fallDistance = this._lastGroundedY - this.camera.position.y;
                    
                    if (fallDistance > 3) {
                        const damage = Math.floor((fallDistance - 3) * 2);
                        if (damage > 0) {
                            this.takeDamage(damage);
                        }
                    }
                } else {
                    this.justSpawned = false;
                }
                
                this._lastGroundedY = this.camera.position.y;
            }
            this._wasGrounded = true;
        } else {
            this._wasGrounded = false;
        }
    };

    if (isMobileMode) {
        setupMobileControls();
    }

    setupEventListeners();

    let positionLoaded = false;
    if (worldData && worldData.player) {
        positionLoaded = player.loadFromData(worldData.player);
    } else {
        positionLoaded = player.loadPosition();
    }

    let centerChunkX = 0, centerChunkZ = 0;
    if (positionLoaded) {
        centerChunkX = Math.floor(camera.position.x / voxelWorld.chunkSize);
        centerChunkZ = Math.floor(camera.position.z / voxelWorld.chunkSize);
    }

    voxelWorld.generateWorld(centerChunkX, centerChunkZ);

    if (!positionLoaded) {
        if (worldSettings.isStructureCreation) {
            const { width, length } = worldData.structureCreationBounds;
            camera.position.set(width / 2, 5, length / 2);
        } else {
            const spawnPoint = findSpawnPoint(centerChunkX, centerChunkZ);
            camera.position.copy(spawnPoint);
        }
    }

    player.ensureValidPosition(); // Ensure player is in a valid spot after potential loading/spawning.

    // Spawn starter chest if enabled, after player position is set and initial world generated
    if (worldSettings.starterChestEnabled && !worldData?.starterChestSpawned) {
        spawnStarterChest(camera.position.clone(), player.eyeLevel, voxelWorld);
        const worlds = JSON.parse(localStorage.getItem('minecraft_worlds') || '{}'); // Load worlds here
        if (worlds[currentWorldName]) { // Mark that chest has been spawned for this world
            worlds[currentWorldName].starterChestSpawned = true; 
            localStorage.setItem('minecraft_worlds', JSON.stringify(worlds)); // Save immediately
        }
    }

    createHighlightBox();

    updateShadowSettings(renderer, directionalLight);
    
    updateFogForRenderDistance(scene);
    if (window.gameUpdateFog) {
        window.gameUpdateFog(scene, camera);
    } else {
        updateFog(scene, camera);
    }

    // Setup day counter if needed
    if (worldData && worldData.settings && worldData.settings.showDays) {
        setupDayCounter();
    }
    setupAutosaveTimer();
    
    gameTime = worldData && worldData.gameTime !== undefined ? worldData.gameTime : 0;
    daysPassed = worldData && worldData.days !== undefined ? worldData.days : 0;
    lastDayCheck = gameTime;

    if (worldSettings.alwaysDay) {
        gameTime = dayNightCycle.dayDuration / 2; // Set to noon
        updateDayNightCycle(0, gameTime, scene, camera, directionalLight, sunTarget, ambientLight, hemisphereLight);
    }

    animationFrameId = requestAnimationFrame(animate);

    window.addEventListener('beforeunload', saveGameState);
}

function setupLighting() {
    ambientLight = new THREE.AmbientLight(0xffffee, 0.6);
    scene.add(ambientLight);
    
    hemisphereLight = new THREE.HemisphereLight(0xbbeeff, 0x71a734, 0.6);
    scene.add(hemisphereLight);
    
    sunTarget = new THREE.Object3D();
    scene.add(sunTarget);
    
    directionalLight = new THREE.DirectionalLight(0xfff6e0, 1.1);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = gameSettings.shadows;
    directionalLight.shadow.bias = -0.0005;
    directionalLight.shadow.normalBias = 0.03;
    directionalLight.target = sunTarget;
    scene.add(directionalLight);
    
    const shadowSize = 180;
    const resolution = 1024;
    
    directionalLight.shadow.camera.left = -shadowSize / 2;
    directionalLight.shadow.camera.right = shadowSize / 2;
    directionalLight.shadow.camera.top = shadowSize / 2;
    directionalLight.shadow.camera.bottom = -shadowSize / 2;
    directionalLight.shadow.camera.near = 5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.mapSize.width = resolution;
    directionalLight.shadow.mapSize.height = resolution;
}

function findSpawnPoint(chunkX, chunkZ) {
    const startX = chunkX * voxelWorld.chunkSize + voxelWorld.chunkSize / 2;
    const startZ = chunkZ * voxelWorld.chunkSize + voxelWorld.chunkSize / 2;
    
    let y = 100;
    
    while (y > 0) {
        if (voxelWorld.isBlockSolid(Math.floor(startX), y-1, Math.floor(startZ))) {
            return new THREE.Vector3(startX, y + 0.1, startZ);
        }
        y--;
    }
    
    return new THREE.Vector3(startX, 30, startZ);
}

function createFlyingIndicator() {
    const flyingIndicator = document.createElement('div');
    flyingIndicator.id = 'flying-indicator';
    flyingIndicator.className = 'flying-indicator';
    flyingIndicator.textContent = 'Flying';
    document.getElementById('game-container').appendChild(flyingIndicator);
}

function updateFlyingIndicator(isFlying) {
    const indicator = document.getElementById('flying-indicator');
    if (indicator) {
        if (isFlying) {
            indicator.classList.add('visible');
        } else {
            indicator.classList.remove('visible');
        }
    }
}

function fillCreativeInventory(currentInventory) { // Accept inventory as argument
    if (!currentInventory) return;

    currentInventory.isCreative = true;
    currentInventory.slots = new Array(9).fill().map(() => ({ type: null, count: 0 }));
    currentInventory.mainSlots = new Array(27).fill().map(() => ({ type: null, count: 0 }));
    
    const allBlocks = [
        'grass', 'dirt', 'stone', 'smoothstone', 'cobble', 
        'wood', 'birchwood', 'leaves', 'birchleaves',
        'plank', 'birchplank', 'craftingtable', 'oakdoor', 'birchdoor',
        'sand', 'sandstone', 'cacti', 'furnace', 'glass',
        'snow', 'oakslab', 'birchslab', 'chest', 'stick', 
        'woodpickaxe', 'stonepickaxe', 'woodhoe', 'seeds', 'wheat', 
        'haybale', 'farmland', 'oaksapling', 'birchsapling', // Added saplings
        'sprucewood', 'spruceleaves', 'spruceplank', 'sprucesapling', // Spruce blocks
        'woodaxe', 'stoneaxe', // Added axes
        'wool', 'string',
        'cherrywood', 'cherryleaves', 'cherryplank', 'cherrysapling', 'cherryslab',
        'rose', 'dandelion'
    ];
    
    allBlocks.forEach((blockType, index) => {
        const item = { type: blockType, count: currentInventory.isToolWithDurability(blockType) ? 1 : 64 }; // For inventory, not game logic
        if (TOOL_DURABILITIES[blockType]) {
            item.durability = TOOL_DURABILITIES[blockType];
            item.maxDurability = TOOL_DURABILITIES[blockType];
        }

        if (index < 9) {
            currentInventory.slots[index] = item;
        } else if (index < 36) { // Max 9 hotbar + 27 main = 36
            currentInventory.mainSlots[index - 9] = item;
        }
    });
    
    currentInventory.updateAllDisplays();
}

function createAndStartWorld(worldName) {
    const worlds = JSON.parse(localStorage.getItem('minecraft_worlds') || '{}');

    if (worlds[worldName]) {
        alert('A world with this name already exists. Please choose another name.');
        return;
    }

    const seedInput = document.getElementById('world-seed-input').value.trim();
    let worldSeed;

    if (seedInput) {
        if (!isNaN(seedInput)) {
            worldSeed = parseInt(seedInput);
        } else {
            worldSeed = 0;
            for (let i = 0; i < seedInput.length; i++) {
                worldSeed += seedInput.charCodeAt(i);
            }
        }
    } else {
        worldSeed = Math.floor(Math.random() * 1000000);
    }

    const isCreative = document.getElementById('creative-toggle').checked;
    const isSuperflat = document.getElementById('superflat-toggle').checked;
    const showDays = document.getElementById('show-days-toggle').checked;
    const starterChestEnabled = document.getElementById('starter-chest-toggle').checked;
    const generateStructuresOnSuperflat = document.getElementById('superflat-structures-toggle').checked;
    const alwaysDay = document.getElementById('always-day-toggle').checked;
    const worldSizeSelect = document.getElementById('world-size-select');
    const worldSize = worldSizeSelect ? worldSizeSelect.value : 'infinite';

    const sizeMap = {
        classic: { width: 864, length: 864 },
        small: { width: 1024, length: 1024 },
        medium: { width: 3072, length: 3072 },
        large: { width: 5120, length: 5120 }
    };
    const worldBounds = sizeMap[worldSize] || null;

    currentWorldName = worldName;

    const initialWorldData = {
        seed: worldSeed,
        name: worldName,
        settings: {
            isCreative: isCreative,
            isSuperflat: isSuperflat,
            showDays: showDays,
            starterChestEnabled: starterChestEnabled, // Save starter chest setting
            generateStructuresOnSuperflat: generateStructuresOnSuperflat,
            alwaysDay: alwaysDay,
            worldSize: worldSize,
            worldBounds: worldBounds
        },
        days: 0,
        gameTime: 0,
        starterChestSpawned: false // Track if chest has been spawned
    };

    if (isSuperflat) {
        import('./superflat.js').then(superflatModule => {
            initialWorldData.superflatLayers = superflatModule.getSuperflatLayers();
            showLoadingScreenAndInit(initialWorldData, true);
        });
    } else {
        showLoadingScreenAndInit(initialWorldData, true);
    }
}

function loadWorld(worldName) {
    const worlds = JSON.parse(localStorage.getItem('minecraft_worlds') || '{}');

    if (worlds[worldName]) {
        currentWorldName = worldName;
        
        if (!worlds[worldName].settings) {
            worlds[worldName].settings = {
                isCreative: false,
                isSuperflat: false,
                showDays: false,
                starterChestEnabled: false, // Default for older worlds
                generateStructuresOnSuperflat: false,
                alwaysDay: false,
                worldSize: 'infinite',
                worldBounds: null
            };
        } else {
             if (worlds[worldName].settings.showDays === undefined) {
                worlds[worldName].settings.showDays = false;
            }
            if (worlds[worldName].settings.starterChestEnabled === undefined) {
                worlds[worldName].settings.starterChestEnabled = false; // Default for older worlds
            }
            if (worlds[worldName].settings.generateStructuresOnSuperflat === undefined) {
                worlds[worldName].settings.generateStructuresOnSuperflat = false;
            }
            if (worlds[worldName].settings.alwaysDay === undefined) {
                worlds[worldName].settings.alwaysDay = false;
            }
            if (worlds[worldName].settings.worldSize === undefined) {
                worlds[worldName].settings.worldSize = 'infinite';
                worlds[worldName].settings.worldBounds = null;
            }
        }
        
        const worldData = JSON.parse(JSON.stringify(worlds[worldName]));
        if (worldData.settings.isSuperflat && worldData.superflatLayers) {
            import('./superflat.js').then(module => {
                module.setSuperflatLayers(worldData.superflatLayers);
                showLoadingScreenAndInit(worldData);
            }).catch(err => {
                console.error('Error loading superflat layers:', err);
                showLoadingScreenAndInit(worldData); 
            });
        } else {
            showLoadingScreenAndInit(worldData);
        }
    } else {
        alert('World not found!');
    }
}

function showOptionsMenu() {
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('options-menu').style.display = 'flex';

    updateFOVButtonText();
    
    updateSettingsUI();
    updateKeybindButtonsDisplay();
}

function pauseGame() {
    if (scene && player) {
        isPaused = true;
        document.getElementById('pause-menu').style.display = 'flex';

        const saveBtn = document.getElementById('save-structure-ingame-btn');
        const saveQuitBtn = document.getElementById('save-quit-btn');

        if (isStructureCreationMode) {
            saveBtn.style.display = 'none'; // "remove save structure"
            saveQuitBtn.textContent = 'Finalize Structure';
        } else {
            saveBtn.style.display = 'none';
            saveQuitBtn.textContent = 'Save and Quit';
        }

        updateSettingsUI();
    }
}

function hidePauseMenu() {
    document.getElementById('pause-menu').style.display = 'none';
}

function showMainMenu() {
    // Stop game music and start menu music
    soundManager.stopAllLoops(1.0);
    soundManager.playLoop('menu_music', { volume: 0.5 });

    isStructureCreationMode = false;

    document.getElementById('game-container').style.display = 'none';
    document.getElementById('world-selection').style.display = 'none';
    document.getElementById('create-world-screen').style.display = 'none';
    document.getElementById('pause-menu').style.display = 'none';
    document.getElementById('options-menu').style.display = 'none';
    document.getElementById('fov-submenu').style.display = 'none';
    document.getElementById('sound-submenu').style.display = 'none';
    document.getElementById('video-submenu').style.display = 'none';
    document.getElementById('controls-submenu').style.display = 'none';

    document.querySelectorAll('.minecraft-dialog').forEach(dialog => {
        dialog.style.display = 'none';
    });

    document.getElementById('menu-container').style.display = 'flex';
    document.getElementById('main-menu').style.display = 'flex';

    if (scene) {
        saveGameState();

        scene = null;
        camera = null;
        renderer = null;
        controls = null;
        player = null;
        voxelWorld = null;
        inventory = null;
        highlightBox = null;
        highlightBoxEdges = null;
        currentWorldName = null;
        if (window.autosaveInterval) {
            clearInterval(window.autosaveInterval);
            window.autosaveInterval = null;
        }
    }
}

function showWorldSelection() {
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('create-world-screen').style.display = 'none';

    document.getElementById('world-selection').style.display = 'flex';

    const worldsList = document.getElementById('worlds-list');
    worldsList.innerHTML = '';

    const worlds = JSON.parse(localStorage.getItem('minecraft_worlds') || '{}');

    for (const [worldName, worldData] of Object.entries(worlds)) {
        const worldItem = document.createElement('div');
        worldItem.className = 'world-item';
        
        const worldContent = document.createElement('div');
        worldContent.className = 'world-content';
        
        const worldIcon = document.createElement('div');
        worldIcon.className = 'world-icon';
        
        const iconImg = document.createElement('img');
        if (worldData.settings && worldData.settings.isSuperflat) {
            iconImg.src = 'dirt.png';
        } else if (worldData.settings && worldData.settings.isCreative) {
            iconImg.src = 'grass_top.png';
        } else {
            iconImg.src = 'grass_side.png';
        }
        worldIcon.appendChild(iconImg);
        worldContent.appendChild(worldIcon);
        
        const worldDetails = document.createElement('div');
        worldDetails.className = 'world-details';
        
        const worldNameElem = document.createElement('div');
        worldNameElem.className = 'world-name';
        worldNameElem.textContent = worldName;
        worldDetails.appendChild(worldNameElem);
        
        const worldInfo = document.createElement('div');
        worldInfo.className = 'world-info';
        worldInfo.textContent = `Seed: ${worldData.seed}`;
        worldDetails.appendChild(worldInfo);
        
        if (worldData.settings) {
            const gameMode = document.createElement('div');
            gameMode.className = 'world-biome';
            gameMode.textContent = worldData.settings.isCreative ? 'Creative Mode' : 'Survival Mode';
            
            if (worldData.settings.isSuperflat) {
                gameMode.textContent += ', Superflat';
            }
            
            worldDetails.appendChild(gameMode);
        }
        
        if (worldData.lastSaved) {
            const lastPlayed = document.createElement('div');
            lastPlayed.className = 'world-last-played';
            
            const lastPlayedDate = new Date(worldData.lastSaved);
            const formattedDate = lastPlayedDate.toLocaleDateString() + ' ' + 
                                  lastPlayedDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            lastPlayed.textContent = `Last played: ${formattedDate}`;
            worldDetails.appendChild(lastPlayed);
        }
        
        worldContent.appendChild(worldDetails);
        worldItem.appendChild(worldContent);
        
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'world-button-container';
        
        const playBtn = document.createElement('button');
        playBtn.className = 'play-btn';
        playBtn.textContent = 'Play';
        buttonContainer.appendChild(playBtn);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Delete';
        buttonContainer.appendChild(deleteBtn);
        
        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.textContent = 'Edit';
        buttonContainer.appendChild(editBtn);
        
        worldItem.appendChild(buttonContainer);
        worldsList.appendChild(worldItem);

        playBtn.addEventListener('click', function() {
            playClickSound();
            requestFullscreen();
            loadWorld(worldName);
        });

        deleteBtn.addEventListener('click', function() {
            playClickSound();
            deleteWorld(worldName);
            showWorldSelection();
        });

        editBtn.addEventListener('click', function() {
            playClickSound();
            showWorldEditDialog(worldName, worldData);
        });
    }

    if (Object.keys(worlds).length === 0) {
        const noWorlds = document.createElement('div');
        noWorlds.className = 'no-worlds';
        noWorlds.textContent = 'No worlds found. Create a new world to get started!';
        worldsList.appendChild(noWorlds);
    }

    const existingDeleteBtn = document.querySelector('.delete-all-btn');
    if (existingDeleteBtn) {
        existingDeleteBtn.remove();
    }

    const deleteAllButton = document.createElement('button');
    deleteAllButton.className = 'menu-button delete-all-btn';
    deleteAllButton.textContent = 'Delete All Worlds';
    deleteAllButton.addEventListener('click', function() {
        playClickSound();
        deleteAllWorlds();
    });

    document.querySelector('#world-selection .menu-buttons').prepend(deleteAllButton);
}

function showCreateWorldScreen() {
    document.getElementById('world-selection').style.display = 'none';
    document.getElementById('create-world-screen').style.display = 'flex';
    
    document.getElementById('world-name-input').value = '';
    document.getElementById('world-seed-input').value = '';
    document.getElementById('creative-toggle').checked = false;
    document.getElementById('superflat-toggle').checked = false;
    document.getElementById('show-days-toggle').checked = false;
    document.getElementById('starter-chest-toggle').checked = false;
    document.getElementById('superflat-structures-toggle').checked = false;
    document.getElementById('superflat-structures-option').style.display = 'none';
    document.getElementById('always-day-toggle').checked = false;
    document.getElementById('show-days-toggle').closest('.form-group').style.display = 'block';
    
    const worldSizeSelect = document.getElementById('world-size-select');
    if (worldSizeSelect) {
        worldSizeSelect.value = 'infinite';
    }
    
    document.getElementById('world-name-input').focus();
}

function deleteWorld(worldName) {
    const worlds = JSON.parse(localStorage.getItem('minecraft_worlds') || '{}');

    if (worlds[worldName]) {
        if (confirm(`Are you sure you want to delete "${worldName}"? This action cannot be undone.`)) {
            delete worlds[worldName];
            localStorage.setItem('minecraft_worlds', JSON.stringify(worlds));
        }
    }
}

function deleteAllWorlds() {
    if (confirm('Are you sure you want to delete ALL worlds? This cannot be undone!')) {
        localStorage.removeItem('minecraft_worlds');
        showWorldSelection();
    }
}

function updateFps() {
    frameCount++;
    const now = performance.now();
    if (now - lastFpsUpdate > 1000) {
        const fps = Math.round((frameCount * 1000) / (now - lastFpsUpdate));
        lastFpsUpdate = now;
        frameCount = 0;
        
        if (gameSettings.showFps) {
            const fpsDisplay = document.getElementById('fps-display');
            if (fpsDisplay) {
                fpsDisplay.textContent = `FPS: ${fps}`;
            }
        }
    }
}

function updatePositionDisplay() {
    const coordsDisplay = document.getElementById('coordinates-display');
    if (coordsDisplay && player && player.camera) {
        const pos = player.camera.position;
        const x = Math.floor(pos.x);
        const y = Math.floor(pos.y);
        const z = Math.floor(pos.z);
        coordsDisplay.textContent = `XYZ: ${x} / ${y} / ${z}`;
    }
}

function updateTargetBlockHighlight() {
    if (player.targetBlock) {
        const { x, y, z } = player.targetBlock.position;
        const isSlab = player.targetBlock.isSlab;
        
        if (isSlab) {
            highlightBox.position.set(x + 0.5, y + 0.25, z + 0.5);
            highlightBoxEdges.position.set(x + 0.5, y + 0.25, z + 0.5);
            
            highlightBox.scale.set(1, 0.5, 1);
            highlightBoxEdges.scale.set(1, 0.5, 1);
        } else {
            highlightBox.position.set(x + 0.5, y + 0.5, z + 0.5);
            highlightBoxEdges.position.set(x + 0.5, y + 0.5, z + 0.5);

            highlightBox.scale.set(1, 1, 1);
            highlightBoxEdges.scale.set(1, 1, 1);
        }

        highlightBox.visible = true;
        highlightBoxEdges.visible = true;
    } else {
        highlightBox.visible = false;
        highlightBoxEdges.visible = false;
    }
}

function animate(currentTime) {
    if (!scene) {
        // When scene is null, it means we've exited the game.
        // Stop the animation loop.
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        return;
    }
    animationFrameId = requestAnimationFrame(animate);

    if (isPaused) {
        return;
    }

    if (gameSettings.fpsCap > 0) {
        const frameInterval = 1000 / gameSettings.fpsCap;
        const elapsed = currentTime - lastFrameTime;

        if (elapsed < frameInterval) {
            return; // Skip this frame
        }
        // Adjust lastFrameTime to stay in sync with the desired frame rate, prevents drift.
        lastFrameTime = currentTime - (elapsed % frameInterval);
    } else {
        lastFrameTime = currentTime;
    }

    const now = performance.now();
    
    const delta = clock.getDelta();

    handleGamepadInput();

    // Update UI navigation cooldown
    if (gamepadUINavigator.moveCooldown > 0) {
        gamepadUINavigator.moveCooldown -= delta;
    }

    // Update day/night cycle
    if (!worldSettings.alwaysDay) {
        const previousDayCount = Math.floor(lastDayCheck / dayNightCycle.totalDuration);
        gameTime = updateDayNightCycle(delta, gameTime, scene, camera, directionalLight, sunTarget, ambientLight, hemisphereLight);
        const currentDayCount = Math.floor(gameTime / dayNightCycle.totalDuration);
        if (currentDayCount > previousDayCount) {
            daysPassed++;
            if (dayCounter) {
                dayCounter.textContent = `Day: ${daysPassed}`;
            }
        }
        lastDayCheck = gameTime;
    }

    player.update(delta);

    if (particleSystem) {
        particleSystem.update(delta);
    }

    // Update crop growth
    if (voxelWorld) {
        voxelWorld.updateCrops(delta);
        voxelWorld.updateSaplings(delta); // Add sapling update
        voxelWorld.updateDroppedItems(delta);
    }

    updateShadowPosition(camera, directionalLight, sunTarget);
    updateStarsPosition(camera);

    updateFogForRenderDistance(scene);
    updateFog(scene, camera);

    updateFps();
    updatePositionDisplay();
    updateTargetBlockHighlight();

    const playerChunkX = Math.floor(camera.position.x / voxelWorld.chunkSize);
    const playerChunkZ = Math.floor(camera.position.z / voxelWorld.chunkSize);

    voxelWorld.updateChunks(playerChunkX, playerChunkZ);
    voxelWorld.processGenerationQueue(playerChunkX, playerChunkZ);

    if (voxelWorld.rebuildQueue && voxelWorld.rebuildQueue.length > 0) {
        voxelWorld.processRebuildQueue();
    }

    if (inventory && inventory.furnaceActive) {
        inventory.updateFurnace(delta);
    }

    renderer.render(scene, camera);
}

function createHighlightBox() {
    const geometry = new THREE.BoxGeometry(1.005, 1.005, 1.005);
    const material = new THREE.MeshBasicMaterial({ 
        color: 0x55aaff,
        opacity: 0.35,
        transparent: true,
        depthTest: true,
        depthWrite: false
    });
    highlightBox = new THREE.Mesh(geometry, material);

    const edgesGeometry = new THREE.EdgesGeometry(geometry);
    const edgesMaterial = new THREE.LineBasicMaterial({ 
        color: 0xffffff,
        linewidth: 2,
        opacity: 1.0,
        transparent: true,
        depthTest: true
    });
    highlightBoxEdges = new THREE.LineSegments(edgesGeometry, edgesMaterial);

    highlightBox.visible = false;
    highlightBoxEdges.visible = false;
    scene.add(highlightBox);
    scene.add(highlightBoxEdges);
}

function setupEventListeners() {
    document.getElementById('game-canvas').addEventListener('click', () => {
        if (!isMobileMode) {
            controls.lock();
        }
    });

    controls.addEventListener('lock', () => {
        if (document.getElementById('pause-menu').style.display === 'flex') {
            hidePauseMenu();
        }
    });

    controls.addEventListener('unlock', () => {
        if (scene && player) {
            const inventoryOpen = document.getElementById('inventory-screen').style.display === 'flex' ||
                             document.getElementById('crafting-table-screen').style.display === 'flex' ||
                             document.getElementById('furnace-screen').style.display === 'flex' ||
                             document.getElementById('chest-screen').style.display === 'flex';
                             
            if (!inventoryOpen) {
                pauseGame();
            }
        }
    });

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    const continueBtn = document.getElementById('continue-btn');
    if (continueBtn) {
        continueBtn.addEventListener('click', function() {
            isPaused = false;
            hidePauseMenu();
            controls.lock();
        });
    }

    const saveQuitBtn = document.getElementById('save-quit-btn');
    if (saveQuitBtn) {
        saveQuitBtn.addEventListener('click', function() {
            if (isStructureCreationMode) {
                // New logic for finalizing structure
                if (!voxelWorld) {
                    alert("Voxel world not found.");
                    return;
                }

                const structureData = {
                    width: voxelWorld.structureCreationBounds.width,
                    length: voxelWorld.structureCreationBounds.length,
                    blocks: []
                };
                
                for (const chunk of voxelWorld.chunks.values()) {
                    for (const [key, type] of chunk.blocks.entries()) {
                        const parts = key.split(',');
                        const y = parseInt(parts[1], 10);
                        if (y <= 0) continue; // Don't save grass plane
                        
                        const localX = parseInt(parts[0], 10);
                        const localZ_str = parts[2];
                        const localZ = parseInt(localZ_str.split('_')[0], 10); 
                        const worldX = chunk.x * voxelWorld.chunkSize + localX;
                        const worldY = y;
                        const worldZ = chunk.z * voxelWorld.chunkSize + localZ;
                        
                        if (worldX >= 0 && worldX < structureData.width &&
                            worldY > 0 && 
                            worldZ >= 0 && worldZ < structureData.length) {
                            structureData.blocks.push({ x: worldX, y: worldY, z: worldZ, type });
                        }
                    }
                }

                if (structureData.blocks.length === 0) {
                    if (!confirm("Structure is empty. Quit without saving?")) {
                        return;
                    }
                    window.tempStructureData = null;
                } else {
                    window.tempStructureData = structureData;
                }
                
                // --- Custom Exit Logic ---
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                    animationFrameId = null;
                }
                isPaused = false;
                soundManager.stopAllLoops(1.0);
                soundManager.playLoop('menu_music', { volume: 0.5 });
            
                document.getElementById('game-container').style.display = 'none';
                document.getElementById('pause-menu').style.display = 'none';
                document.getElementById('menu-container').style.display = 'flex';
            
                scene = null;
                camera = null;
                renderer = null;
                controls = null;
                voxelWorld = null;
                player = null;
                inventory = null;
                isStructureCreationMode = false;

                if (window.tempStructureData) {
                    mods.showModsDialog();
                    mods.showSaveStructureDialog();
                } else {
                    mods.showModsDialog();
                }

            } else {
                // Original logic for normal worlds
                saveGameState();
                showMainMenu();
            }
        });
    }

    const saveStructureBtn = document.getElementById('save-structure-ingame-btn');
    if (saveStructureBtn) {
        saveStructureBtn.addEventListener('click', function() {
            if (!voxelWorld || !voxelWorld.isStructureCreationMode) return;
            // The logic is now in the save-quit button.
            // This button is hidden by pauseGame() in structure mode.
        });
    }

    const finalizeStructureBtn = document.getElementById('finalize-structure-btn');
    if (finalizeStructureBtn) {
        finalizeStructureBtn.addEventListener('click', function() {
           // This dialog and button are being removed in favor of the pause menu's quit button.
        });
    }

    const cancelFinalizeStructureBtn = document.getElementById('cancel-finalize-structure-btn');
    if (cancelFinalizeStructureBtn) {
        cancelFinalizeStructureBtn.addEventListener('click', function() {
            mods.hideFinalizeStructureDialog();
        });
    }

    const renderDistanceSlider = document.getElementById('render-distance-slider');
    if (renderDistanceSlider) {
        renderDistanceSlider.addEventListener('input', function() {
            const newValue = parseInt(this.value);
            gameSettings.renderDistance = newValue;
            document.getElementById('render-distance-value').textContent = newValue;

            if (voxelWorld) {
                voxelWorld.renderDistance = newValue;

                updateFogForRenderDistance(scene);
                updateFog(scene, camera);
            }
        });
    }

    const shadowToggle = document.getElementById('shadow-toggle');
    if (shadowToggle) {
        shadowToggle.addEventListener('change', function() {
            gameSettings.shadows = this.checked;
            updateShadowSettings(renderer, directionalLight);
        });
    }

    const sensitivitySlider = document.getElementById('sensitivity-slider');
    if (sensitivitySlider) {
        sensitivitySlider.addEventListener('input', function() {
            const value = parseInt(this.value);
            gameSettings.cameraSensitivity = value;
            
            document.getElementById('sensitivity-value').textContent = `${value}%`;
            
            if (controls) {
                applyCameraSensitivity(controls);
            }
        });
    }

    const sensitivityPauseSlider = document.getElementById('sensitivity-pause-slider');
    if (sensitivityPauseSlider) {
        sensitivityPauseSlider.addEventListener('input', function() {
            const value = parseInt(this.value);
            gameSettings.cameraSensitivity = value;
            
            document.getElementById('sensitivity-pause-value').textContent = `${value}%`;
            
            if (controls) {
                applyCameraSensitivity(controls);
            }
        });
    }

    const chunkUpdateSlider = document.getElementById('chunk-update-slider');
    if (chunkUpdateSlider) {
        chunkUpdateSlider.addEventListener('input', function() {
            const value = parseInt(this.value);
            gameSettings.chunkUpdateRate = value;
            
            let chunkUpdateText = 'Medium';
            switch (value) {
                case 0: chunkUpdateText = 'Low'; break;
                case 1: chunkUpdateText = 'Medium'; break;
                case 2: chunkUpdateText = 'High'; break;
            }
            
            document.getElementById('chunk-update-value').textContent = chunkUpdateText;
            updateChunkUpdateRate(voxelWorld);
        });
    }
    
    const resetSettingsBtn = document.getElementById('reset-settings-btn');
    if (resetSettingsBtn) {
        resetSettingsBtn.addEventListener('click', function() {
            if (confirm('Reset all game settings to default values?')) {
                resetSettings();
                
                if (voxelWorld) {
                    voxelWorld.renderDistance = gameSettings.renderDistance;
                }
                if (camera) {
                    updateCameraFOV(camera);
                }
                if (renderer) {
                    updateShadowSettings(renderer, directionalLight);
                }
                if (scene) {
                    updateFogForRenderDistance(scene);
                    updateFog(scene, camera);
                }
                if (voxelWorld) {
                    updateChunkUpdateRate(voxelWorld);
                }
                if (controls) {
                    applyCameraSensitivity(controls);
                }
                
                updateSettingsUI();
            }
        });
    }
    
    const resetKeybindsBtn = document.getElementById('reset-keybinds-btn');
    if (resetKeybindsBtn) {
        resetKeybindsBtn.addEventListener('click', function() {
            if (confirm('Reset all keybindings to default values?')) {
                resetKeybindings();
                
                if (player) {
                    player.keybindings = gameSettings.keybindings;
                }
                
                updateKeybindButtonsDisplay();
            }
        });
    }

    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            if (inventory) {
                inventory.closeChest();
            }
        }
    });

    const gameContainer = document.getElementById('game-container');
    const breakProgressBar = document.createElement('div');
    breakProgressBar.id = 'break-progress';
    breakProgressBar.className = 'break-progress';
    gameContainer.appendChild(breakProgressBar);

    setupVolumeSlider('master-volume-slider', 'master-volume-value');
    setupVolumeSlider('music-volume-slider', 'music-volume-value');
    setupVolumeSlider('sound-volume-slider', 'sound-volume-value');
    
    document.querySelectorAll('.crafting-recipe-slot').forEach(slot => {
        slot.addEventListener('click', () => {
            document.querySelectorAll('.crafting-recipe-slot').forEach(s => s.classList.remove('selected'));
            slot.classList.add('selected');
        });
    });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            if (scene && player && !isPaused) {
                isPaused = true;
                if (controls.isLocked) {
                    controls.unlock();
                } else {
                    pauseGame();
                }
            }
        }
    });
}

function setupVolumeSlider(sliderId, valueId) {
    const slider = document.getElementById(sliderId);
    const valueDisplay = document.getElementById(valueId);
    
    if (!slider || !valueDisplay) return;
    
    valueDisplay.textContent = slider.value + '%';
    
    slider.addEventListener('input', function() {
        valueDisplay.textContent = this.value + '%';
        
        const volumeType = sliderId.split('-')[0];
        
        if (typeof setVolume === 'function') {
            setVolume(volumeType, this.value / 100);
        }
    });
    
    slider.addEventListener('change', playClickSound);
}

function setupDayCounter() {
    // Create the day counter element if it doesn't exist
    if (!document.getElementById('day-counter')) {
        dayCounter = document.createElement('div');
        dayCounter.id = 'day-counter';
        dayCounter.className = 'day-counter';
        dayCounter.textContent = `Day: ${daysPassed}`;
        document.getElementById('game-container').appendChild(dayCounter);
    } else {
        dayCounter = document.getElementById('day-counter');
        dayCounter.textContent = `Day: ${daysPassed}`;
        dayCounter.style.display = 'block';
    }
}

function saveGameState() {
    if (!currentWorldName || (typeof currentWorldName === 'string' && currentWorldName.startsWith('Loaded:'))) {
        if (scene && controls && controls.isLocked) {
             // Don't show save indicator for non-saved worlds.
        }
        return;
    }
    // Do not save structure creation worlds to localStorage
    if (isStructureCreationMode) {
        console.log("In structure creation mode, skipping save.");
        return;
    }

    try {
        const worlds = JSON.parse(localStorage.getItem('minecraft_worlds') || '{}');

        const modifiedChunks = {};
        
        if (voxelWorld) {
            for (const chunkKey of voxelWorld.dirtyChunks) {
                const chunk = voxelWorld.chunks.get(chunkKey);
                if (chunk) {
                    modifiedChunks[chunkKey] = {};
                    
                    for (const [blockKey, blockType] of chunk.blocks.entries()) {
                        modifiedChunks[chunkKey][blockKey] = blockType;
                    }
                }
            }
            
            if (worlds[currentWorldName] && worlds[currentWorldName].chunks) {
                for (const [chunkKey, chunkData] of Object.entries(worlds[currentWorldName].chunks)) {
                    if (!modifiedChunks[chunkKey]) {
                        modifiedChunks[chunkKey] = chunkData;
                    }
                }
            }
        }

        const chestData = {};
        if (voxelWorld && voxelWorld.chests) {
            for (const [chestKey, chest] of voxelWorld.chests.entries()) {
                chestData[chestKey] = chest;
            }
        }
        
        const blockOrientationsData = {};
        if (voxelWorld && voxelWorld.blockOrientations) {
            for (const [key, data] of voxelWorld.blockOrientations.entries()) {
                blockOrientationsData[key] = data;
            }
        }

        // Save ladder data
        const ladderData = {};
        if (voxelWorld && voxelWorld.ladders) {
            for (const [key, data] of voxelWorld.ladders.entries()) {
                ladderData[key] = data;
            }
        }

        // Save crop data
        const cropData = {};
        if (voxelWorld && voxelWorld.crops) {
            for (const [cropKey, crop] of voxelWorld.crops.entries()) {
                cropData[cropKey] = crop;
            }
        }

        // Save planted sapling data
        const plantedSaplingsData = {};
        if (voxelWorld && voxelWorld.plantedSaplings) {
            for (const [saplingKey, sapling] of voxelWorld.plantedSaplings.entries()) {
                plantedSaplingsData[saplingKey] = sapling;
            }
        }

        const hutLocationsData = voxelWorld ? Array.from(voxelWorld.hutLocations) : [];
        const towerLocationsData = voxelWorld ? Array.from(voxelWorld.towerLocations) : [];

        let superflatLayers = null;
        if (worldSettings.isSuperflat) {
            try {
                const superflatModule = require('./superflat.js');
                superflatLayers = superflatModule.getSuperflatLayers();
            } catch (e) {
                import('./superflat.js').then(module => {
                    superflatLayers = module.getSuperflatLayers();
                    finishSaving();
                    return;
                }).catch(err => {
                    console.error('Error importing superflat module:', err);
                    finishSaving();
                    return;
                });
            }
        }

        finishSaving();

        function finishSaving() {
            const worldData = {
                name: currentWorldName,
                seed: voxelWorld ? voxelWorld.worldSeed : (worlds[currentWorldName] ? worlds[currentWorldName].seed : Math.floor(Math.random() * 1000000)),
                player: player ? player.getPlayerData() : null,
                inventory: inventory ? inventory.getInventoryData() : null,
                chunks: modifiedChunks,
                chests: chestData,
                ladders: ladderData,
                blockOrientations: blockOrientationsData,
                crops: cropData, 
                plantedSaplings: plantedSaplingsData, // Save sapling data
                hutLocations: hutLocationsData,
                towerLocations: towerLocationsData,
                settings: worldSettings, // worldSettings already includes starterChestEnabled
                lastSaved: new Date().toISOString(),
                gameTime: gameTime,
                days: daysPassed,
                starterChestSpawned: worlds[currentWorldName]?.starterChestSpawned || (worldSettings.starterChestEnabled && scene ? true : false) // Persist if chest was spawned
            };

            if (superflatLayers) {
                worldData.superflatLayers = superflatLayers;
            } else if (worlds[currentWorldName] && worlds[currentWorldName].superflatLayers) {
                worldData.superflatLayers = worlds[currentWorldName].superflatLayers;
            }

            worlds[currentWorldName] = worldData;
            
            saveGameSettings();

            try {
                localStorage.setItem('minecraft_worlds', JSON.stringify(worlds));
                document.getElementById('storage-error-message').style.display = 'none';
            } catch (e) {
                console.error('Error saving game:', e);
                showStorageError();
            }
            if (scene && controls && controls.isLocked) {
                showSaveIndicator();
            }
        }
    } catch (e) {
        console.error('Error building game state:', e);
        showStorageError();
    }
}

function playClickSound() {
    soundManager.play('click', { volume: 0.5 });
}

function setupAutosaveTimer() {
    if (window.autosaveInterval) {
        clearInterval(window.autosaveInterval);
    }
    
    window.autosaveInterval = setInterval(() => {
        if (scene && player) {
            saveGameState();
        }
    }, 60000); 
}

function setupMenuEventListeners() {
    document.querySelectorAll('.menu-button').forEach(button => {
        button.addEventListener('click', function() {
            playClickSound();
        });
    });

    document.querySelectorAll('.back-btn').forEach(button => {
        button.addEventListener('click', function() {
            playClickSound();
            if (document.getElementById('world-selection').style.display === 'flex') {
                showMainMenu();
            } else if (document.getElementById('create-world-screen').style.display === 'flex') {
                showWorldSelection();
            }
        });
    });

    document.getElementById('singleplayer-btn').addEventListener('click', function() {
        playClickSound();
        document.getElementById('main-menu').style.display = 'none';
        document.getElementById('device-selection-dialog').style.display = 'flex';
    });
    
    document.getElementById('mobile-device-btn').addEventListener('click', function() {
        playClickSound();
        isMobileMode = true;
        document.getElementById('device-selection-dialog').style.display = 'none';
        showWorldSelection();
        document.getElementById('sensitivity-slider').max = 300;
        document.getElementById('sensitivity-pause-slider').max = 300;
    });

    document.getElementById('pc-device-btn').addEventListener('click', function() {
        playClickSound();
        isMobileMode = false;
        document.getElementById('device-selection-dialog').style.display = 'none';
        showWorldSelection();
        document.getElementById('sensitivity-slider').max = 200;
        document.getElementById('sensitivity-pause-slider').max = 200;
    });

    document.getElementById('device-back-btn').addEventListener('click', function() {
        playClickSound();
        document.getElementById('device-selection-dialog').style.display = 'none';
        document.getElementById('main-menu').style.display = 'flex';
    });

    document.getElementById('load-from-code-btn').addEventListener('click', function() {
        playClickSound();
        showLoadFromCodeDialog();
    });

    document.getElementById('information-btn').addEventListener('click', function() {
        playClickSound();
        document.getElementById('information-dialog').style.display = 'flex';
    });

    document.getElementById('close-information-dialog-btn').addEventListener('click', function() {
        playClickSound();
        document.getElementById('information-dialog').style.display = 'none';
    });

    document.getElementById('options-btn').addEventListener('click', function() {
        playClickSound();
        showOptionsMenu();
    });
    
    document.getElementById('quit-game-btn').addEventListener('click', function() {
        playClickSound();
        window.location.href = 'https://websim.com';
    });

    document.getElementById('mods-btn').addEventListener('click', function() {
        playClickSound();
        mods.showModsDialog();
    });

    document.getElementById('close-mods-screen-btn').addEventListener('click', function() {
        playClickSound();
        mods.hideModsDialog();
    });
    
    // The event listeners for block-creation-btn and structure-creation-btn will be added in mods.js where the dialog is created

    document.getElementById('save-recipe-btn').addEventListener('click', function() {
        playClickSound();
        mods.saveCustomBlockWithRecipe();
    });
    
    document.getElementById('skip-recipe-btn').addEventListener('click', function() {
        playClickSound();
        mods.skipRecipe();
    });
    
    document.getElementById('cancel-recipe-btn').addEventListener('click', function() {
        playClickSound();
        mods.hideCraftingRecipeCreator();
        mods.showBlockCreatorDialog();
    });
    
    document.getElementById('share-selected-mods-btn').addEventListener('click', function() {
        playClickSound();
        const selectedMods = document.querySelectorAll('.mod-item-checkbox:checked');
        
        if (selectedMods.length === 0) {
            alert('Please select at least one mod to share.');
            return;
        }
        
        const selectedBlockIds = Array.from(selectedMods).map(checkbox => {
            return checkbox.closest('.mod-item').getAttribute('data-block-id');
        });
        
        mods.shareSelectedMods(selectedBlockIds);
    });

    document.getElementById('save-options-btn').addEventListener('click', function() {
        playClickSound();
        saveOptionsAndReturn();
    });

    document.getElementById('fov-settings-btn').addEventListener('click', function() {
        playClickSound();
        showSubMenu('fov-submenu');
    });

    document.getElementById('sound-settings-btn').addEventListener('click', function() {
        playClickSound();
        showSubMenu('sound-submenu');
    });

    document.getElementById('video-settings-btn').addEventListener('click', function() {
        playClickSound();
        showSubMenu('video-submenu');
    });

    document.getElementById('controls-settings-btn').addEventListener('click', function() {
        playClickSound();
        showSubMenu('controls-submenu');
    });

    document.getElementById('fov-back-btn').addEventListener('click', function() {
        playClickSound();
        hideSubMenu('fov-submenu');
        updateFOVButtonText();
    });

    document.getElementById('sound-back-btn').addEventListener('click', function() {
        playClickSound();
        hideSubMenu('sound-submenu');
    });

    document.getElementById('video-back-btn').addEventListener('click', function() {
        playClickSound();
        hideSubMenu('video-submenu');
    });

    document.getElementById('controls-back-btn').addEventListener('click', function() {
        playClickSound();
        hideSubMenu('controls-submenu');
    });

    const fovSlider = document.getElementById('fov-slider');
    if (fovSlider) {
        fovSlider.addEventListener('input', function() {
            const newValue = parseInt(this.value);
            document.getElementById('fov-value').textContent = newValue;
            gameSettings.fov = newValue;
            
            updateFOVDescription(newValue);
            
            if (camera) {
                updateCameraFOV(camera);
            }
        });
    }

    const renderDistanceMenuSlider = document.getElementById('render-distance-menu-slider');
    if (renderDistanceMenuSlider) {
        renderDistanceMenuSlider.addEventListener('input', function() {
            const newValue = parseInt(this.value);
            document.getElementById('render-distance-menu-value').textContent = newValue;
            gameSettings.renderDistance = newValue;
            
            if (voxelWorld) {
                voxelWorld.renderDistance = newValue;
            }
            
            updateFogForRenderDistance(scene);
            updateFog(scene, camera);
        });
    }

    const shadowMenuToggle = document.getElementById('shadow-menu-toggle');
    if (shadowMenuToggle) {
        shadowMenuToggle.addEventListener('change', function() {
            gameSettings.shadows = this.checked;
            updateShadowSettings(renderer, directionalLight);
        });
    }

    const fogMenuToggle = document.getElementById('fog-menu-toggle');
    if (fogMenuToggle) {
        fogMenuToggle.addEventListener('change', function() {
            gameSettings.fog = this.checked;
            toggleFog(scene);
        });
    }

    const showFpsToggle = document.getElementById('show-fps-toggle');
    if (showFpsToggle) {
        showFpsToggle.addEventListener('change', function() {
            gameSettings.showFps = this.checked;
            playClickSound();
            const fpsDisplay = document.getElementById('fps-display');
            if (fpsDisplay) {
                fpsDisplay.style.display = this.checked ? 'block' : 'none';
                if (!this.checked) {
                    fpsDisplay.textContent = '';
                }
            }
        });
    }

    const fpsCapSlider = document.getElementById('fps-cap-slider');
    if (fpsCapSlider) {
        fpsCapSlider.addEventListener('input', function() {
            const valueMap = { 0: 30, 1: 40, 2: 60, 3: 0 }; // map slider value to fps (0 is unlimited)
            const textMap = { 0: '30 FPS', 1: '40 FPS', 2: '60 FPS', 3: 'Unlimited' };
            
            const sliderValue = parseInt(this.value);
            gameSettings.fpsCap = valueMap[sliderValue];
            
            const fpsCapValue = document.getElementById('fps-cap-value');
            if (fpsCapValue) {
                fpsCapValue.textContent = textMap[sliderValue];
            }
        });
    }

    const keybindButtons = document.querySelectorAll('.keybind-button');
    keybindButtons.forEach(button => {
        button.addEventListener('click', function() {
            playClickSound();
            startKeybindChange(this.getAttribute('data-action'), this);
        });
    });

    document.getElementById('cancel-keybind-btn').addEventListener('click', function() {
        playClickSound();
        hideKeybindOverlay();
    });

    document.querySelectorAll('input[type="range"]').forEach(slider => {
        slider.addEventListener('change', playClickSound);
    });

    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', playClickSound);
    });

    document.getElementById('create-world-btn').addEventListener('click', function() {
        playClickSound();
        showCreateWorldScreen();
    });
    
    document.getElementById('create-new-world-btn').addEventListener('click', function() {
        playClickSound();
        document.getElementById('create-world-screen').style.display = 'none';
        document.getElementById('controls-info-dialog').style.display = 'flex';
    });
    
    document.getElementById('world-name-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            playClickSound();
            document.getElementById('create-world-screen').style.display = 'none';
            document.getElementById('controls-info-dialog').style.display = 'flex';
        }
    });
    
    document.getElementById('superflat-advanced-btn').addEventListener('click', function() {
        playClickSound();
        showSuperflatAdvancedSettings();
    });
    
    document.getElementById('superflat-toggle').addEventListener('change', function() {
        const structuresOption = document.getElementById('superflat-structures-option');
        if (this.checked) {
            structuresOption.style.display = 'block';
        } else {
            structuresOption.style.display = 'none';
            document.getElementById('superflat-structures-toggle').checked = false;
        }
        updateSuperflatDescription();
    });
    
    document.getElementById('save-superflat-settings-btn').addEventListener('click', function() {
        playClickSound();
        saveSuperflatSettings();
    });
    
    document.getElementById('cancel-superflat-settings-btn').addEventListener('click', function() {
        playClickSound();
        hideSuperflatAdvancedSettings();
    });
    
    document.getElementById('add-layer-btn').addEventListener('click', function() {
        playClickSound();
        addSuperflatLayer();
    });
    
    document.getElementById('reset-layers-btn').addEventListener('click', function() {
        playClickSound();
        resetSuperflatLayers();
    });
    document.getElementById('update-log-btn').addEventListener('click', function() {
        playClickSound();
        document.getElementById('update-log-dialog').style.display = 'flex';
    });

    document.getElementById('close-update-log-dialog-btn').addEventListener('click', function() {
        playClickSound();
        document.getElementById('update-log-dialog').style.display = 'none';
    });

    document.getElementById('load-world-btn').addEventListener('click', function() {
        playClickSound();
        requestFullscreen();
        loadWorldFromCode();
    });

    document.getElementById('cancel-load-code-btn').addEventListener('click', function() {
        playClickSound();
        hideLoadFromCodeDialog();
    });

    const alwaysDayToggle = document.getElementById('always-day-toggle');
    if (alwaysDayToggle) {
        alwaysDayToggle.addEventListener('change', function() {
            const showDaysGroup = document.getElementById('show-days-toggle').closest('.form-group');
            if (this.checked) {
                showDaysGroup.style.display = 'none';
                document.getElementById('show-days-toggle').checked = false; // Also uncheck it
            } else {
                showDaysGroup.style.display = 'block';
            }
        });
    }

    // Add new listeners for the controls info dialog
    document.getElementById('start-world-btn').addEventListener('click', function() {
        playClickSound();
        requestFullscreen();
        document.getElementById('controls-info-dialog').style.display = 'none';
        const worldName = document.getElementById('world-name-input').value.trim() || "My World";
        createAndStartWorld(worldName);
    });

    document.getElementById('cancel-world-creation-btn').addEventListener('click', function() {
        playClickSound();
        document.getElementById('controls-info-dialog').style.display = 'none';
        document.getElementById('create-world-screen').style.display = 'flex';
    });

    document.getElementById('structure-rarity-slider').addEventListener('input', e => {
        const rarityMap = { 0: "Very Common", 1: "Common", 2: "Normal", 3: "Rare", 4: "Very Rare" };
        document.getElementById('rarity-value').textContent = rarityMap[e.target.value];
    });

    document.getElementById('structure-width').addEventListener('input', e => {
        document.getElementById('structure-width-value').textContent = e.target.value;
    });
    document.getElementById('structure-length').addEventListener('input', e => {
        document.getElementById('structure-length-value').textContent = e.target.value;
    });

    document.getElementById('start-building-btn').addEventListener('click', function() {
        playClickSound();
        mods.hideStructureSizeDialog();

        const width = parseInt(document.getElementById('structure-width').value, 10);
        const length = parseInt(document.getElementById('structure-length').value, 10);

        isStructureCreationMode = true;

        showLoadingScreenAndInit({
            name: `StructureBuilder_${Date.now()}`,
            isTemp: true,
            settings: {
                isCreative: true,
                isStructureCreation: true,
            },
            structureCreationBounds: {
                width,
                length
            }
        }, true);
    });
    
    document.getElementById('cancel-structure-size-btn').addEventListener('click', function() {
        playClickSound();
        mods.hideStructureSizeDialog();
    });

    document.getElementById('confirm-save-structure-btn').addEventListener('click', function() {
        playClickSound();
        const structureName = document.getElementById('structure-name-input').value.trim();
        const rarityValue = document.getElementById('structure-rarity-slider').value;
        const rarityMap = { 0: 0.005, 1: 0.002, 2: 0.001, 3: 0.0005, 4: 0.0001 };
        const rarity = rarityMap[rarityValue];

        const biomeSelect = document.getElementById('structure-biome-select');
        const selectedBiomes = Array.from(biomeSelect.selectedOptions).map(option => option.value);

        if (!structureName) {
            alert("Please provide a name for your structure.");
            return;
        }

        if (selectedBiomes.length === 0) {
            alert("Please select at least one biome for the structure to spawn in.");
            return;
        }

        if (!window.tempStructureData) {
             alert("No structure data found to save.");
             return;
        }

        const structureData = window.tempStructureData;
        structureData.name = structureName;
        structureData.rarity = rarity;
        structureData.biomes = selectedBiomes; // Save selected biomes

        try {
            const existingStructures = JSON.parse(localStorage.getItem('minecraft_custom_structures') || '[]');
            const existingIndex = existingStructures.findIndex(s => s.name === structureName);
            if (existingIndex > -1) {
                existingStructures[existingIndex] = structureData;
            } else {
                existingStructures.push(structureData);
            }
            
            localStorage.setItem('minecraft_custom_structures', JSON.stringify(existingStructures));
            alert(`Structure "${structureName}" saved successfully!`);
            
            delete window.tempStructureData;
            
            mods.hideSaveStructureDialog();
            mods.loadCustomBlocks(); // Refresh the list

        } catch(e) {
            alert("Error saving structure. The structure might be too large.");
            console.error(e);
        }
    });
    
    document.getElementById('cancel-save-structure-btn').addEventListener('click', function() {
        playClickSound();
        mods.hideSaveStructureDialog();
    });

    // NEW: AI structure dialog functions
    const makeWithAiBtn = document.getElementById('make-with-ai-btn');
    if (makeWithAiBtn) {
        makeWithAiBtn.addEventListener('click', function() {
            playClickSound();
            mods.hideStructureSizeDialog();
            showAiPromptDialog();
        });
    }

    const generateAiBtn = document.getElementById('generate-ai-structure-btn');
    if (generateAiBtn) {
        generateAiBtn.addEventListener('click', function() {
            playClickSound();
            generateStructureWithAI();
        });
    }

    const cancelAiBtn = document.getElementById('cancel-ai-structure-btn');
    if (cancelAiBtn) {
        cancelAiBtn.addEventListener('click', function() {
            playClickSound();
            hideAiPromptDialog();
            mods.showStructureSizeDialog();
        });
    }
}

function showSubMenu(menuId) {
    document.getElementById('options-menu').style.display = 'none';
    document.getElementById(menuId).style.display = 'flex';
}

function hideSubMenu(menuId) {
    document.getElementById(menuId).style.display = 'none';
    document.getElementById('options-menu').style.display = 'flex';
}

function startKeybindChange(action, buttonElement) {
    const overlay = document.getElementById('keybind-overlay');
    const actionSpan = document.getElementById('keybind-action');
    
    actionSpan.textContent = action;
    overlay.style.display = 'flex';
    
    overlay.dataset.action = action;
    overlay.dataset.button = buttonElement.getAttribute('data-action');
    
    document.addEventListener('keydown', handleKeybindKeyPress);
}

function handleKeybindKeyPress(event) {
    event.preventDefault();
    
    const overlay = document.getElementById('keybind-overlay');
    const action = overlay.dataset.action;
    const buttonData = overlay.dataset.button;
    
    if (!action || !buttonData) {
        hideKeybindOverlay();
        return;
    }
    
    const keyCode = event.code;
    
    gameSettings.keybindings[buttonData] = keyCode;
    
    const button = document.querySelector(`.keybind-button[data-action="${buttonData}"]`);
    if (button) {
        button.textContent = getKeyDisplayName(keyCode);
    }
    
    document.removeEventListener('keydown', handleKeybindKeyPress);
    hideKeybindOverlay();
    
    saveGameSettings();
    
    if (player) {
        player.keybindings = gameSettings.keybindings;
    }
}

function hideKeybindOverlay() {
    const overlay = document.getElementById('keybind-overlay');
    overlay.style.display = 'none';
    overlay.dataset.action = '';
    overlay.dataset.button = '';
    
    document.removeEventListener('keydown', handleKeybindKeyPress);
}

function updateFOVButtonText() {
    const fovButton = document.getElementById('fov-settings-btn');
    if (fovButton) {
        const fovValue = gameSettings.fov;
        let fovText = 'Normal';
        
        if (fovValue < 50) fovText = 'Narrow';
        else if (fovValue < 60) fovText = 'Slightly Narrow';
        else if (fovValue < 70) fovText = 'Normal';
        else if (fovValue < 80) fovText = 'Slightly Wide';
        else if (fovValue < 90) fovText = 'Wide';
        else fovText = 'Quake Pro';
        
        fovButton.textContent = `FOV: ${fovText}`;
    }
}

function updateFOVDescription(fovValue) {
    let fovText = 'Normal';
    
    if (fovValue < 50) fovText = 'Narrow';
    else if (fovValue < 60) fovText = 'Slightly Narrow';
    else if (fovValue < 70) fovText = 'Normal';
    else if (fovValue < 80) fovText = 'Slightly Wide';
    else if (fovValue < 90) fovText = 'Wide';
    else fovText = 'Quake Pro';
    
    const fovStatus = document.querySelector('.fov-status');
    if (fovStatus) {
        fovStatus.textContent = fovText;
    }
}

function saveOptionsAndReturn() {
    saveGameSettings();
    document.getElementById('options-menu').style.display = 'none';
    document.getElementById('main-menu').style.display = 'flex';
}

async function showWorldEditDialog(worldName, worldData) {
    let editDialog = document.getElementById('world-edit-dialog');
    
    if (!editDialog) {
        editDialog = document.createElement('div');
        editDialog.id = 'world-edit-dialog';
        editDialog.className = 'minecraft-dialog';
        
        const dialogContent = document.createElement('div');
        dialogContent.className = 'minecraft-dialog-content';
        
        const title = document.createElement('h2');
        title.textContent = 'Edit World';
        dialogContent.appendChild(title);
        
        const form = document.createElement('div');
        form.className = 'world-creation-form';
        
        const nameGroup = document.createElement('div');
        nameGroup.className = 'form-group';
        
        const nameLabel = document.createElement('label');
        nameLabel.setAttribute('for', 'edit-world-name');
        nameLabel.textContent = 'World Name:';
        nameGroup.appendChild(nameLabel);
        
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.id = 'edit-world-name';
        nameInput.placeholder = 'Enter world name';
        nameGroup.appendChild(nameInput);
        
        form.appendChild(nameGroup);
        
        const gameModeGroup = document.createElement('div');
        gameModeGroup.className = 'form-group';
        
        const gameModeOptions = document.createElement('div');
        gameModeOptions.className = 'game-mode-options';
        
        const creativeLabel = document.createElement('label');
        creativeLabel.className = 'toggle-label';
        creativeLabel.textContent = 'Creative Mode';
        
        const creativeToggle = document.createElement('input');
        creativeToggle.type = 'checkbox';
        creativeToggle.id = 'edit-creative-toggle';
        creativeLabel.appendChild(creativeToggle);
        
        gameModeOptions.appendChild(creativeLabel);
        
        const gameModeHint = document.createElement('div');
        gameModeHint.className = 'settings-hint';
        gameModeHint.textContent = 'Fly, access all blocks, no damage';
        gameModeOptions.appendChild(gameModeHint);
        
        gameModeGroup.appendChild(gameModeOptions);
        form.appendChild(gameModeGroup);
        
        const daysGroup = document.createElement('div');
        daysGroup.className = 'form-group';
        
        const daysOptions = document.createElement('div');
        daysOptions.className = 'game-options';
        
        const daysLabel = document.createElement('label');
        daysLabel.className = 'toggle-label';
        daysLabel.textContent = 'Show Days Counter';
        
        const daysToggle = document.createElement('input');
        daysToggle.type = 'checkbox';
        daysToggle.id = 'edit-days-toggle';
        daysLabel.appendChild(daysToggle);
        
        daysOptions.appendChild(daysLabel);
        
        const daysHint = document.createElement('div');
        daysHint.className = 'settings-hint';
        daysHint.textContent = 'Display a counter showing how many days you\'ve survived';
        daysOptions.appendChild(daysHint);
        
        daysGroup.appendChild(daysOptions);
        form.appendChild(daysGroup);
        
        dialogContent.appendChild(form);
        
        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'dialog-buttons';
        
        const copyCodeButton = document.createElement('button');
        copyCodeButton.id = 'copy-world-code-btn';
        copyCodeButton.className = 'menu-button button-java-old';
        copyCodeButton.textContent = 'Copy World Code';
        buttonsDiv.appendChild(copyCodeButton);
        
        const saveButton = document.createElement('button');
        saveButton.id = 'save-world-edit-btn';
        saveButton.className = 'menu-button button-java-old';
        saveButton.textContent = 'Save Changes';
        buttonsDiv.appendChild(saveButton);
        
        const cancelButton = document.createElement('button');
        cancelButton.id = 'cancel-world-edit-btn';
        cancelButton.className = 'menu-button button-java-old';
        cancelButton.textContent = 'Cancel';
        buttonsDiv.appendChild(cancelButton);
        
        dialogContent.appendChild(buttonsDiv);
        editDialog.appendChild(dialogContent);
        document.getElementById('menu-container').appendChild(editDialog);
        
        saveButton.addEventListener('click', function() {
            playClickSound();
            saveWorldEdits();
        });
        
        cancelButton.addEventListener('click', function() {
            playClickSound();
            hideWorldEditDialog();
        });

        copyCodeButton.addEventListener('click', function() {
            playClickSound();
            const originalName = document.getElementById('world-edit-dialog').dataset.originalName;
            copyWorldCodeToClipboard(originalName);
        });
    }
    
    editDialog.dataset.originalName = worldName;
    
    document.getElementById('edit-world-name').value = worldName;
    
    const isCreative = worldData.settings && worldData.settings.isCreative;
    document.getElementById('edit-creative-toggle').checked = isCreative;
    
    const showDays = worldData.settings && worldData.settings.showDays;
    document.getElementById('edit-days-toggle').checked = showDays;

    // Starter chest is a creation-time option, not editable here.
    // Could add a read-only display if desired, but omitting for now.
    
    editDialog.style.display = 'flex';
}

function hideWorldEditDialog() {
    const editDialog = document.getElementById('world-edit-dialog');
    if (editDialog) {
        editDialog.style.display = 'none';
    }
}

function saveWorldEdits() {
    const editDialog = document.getElementById('world-edit-dialog');
    if (!editDialog) return;
    
    const originalName = editDialog.dataset.originalName;
    const newName = document.getElementById('edit-world-name').value.trim();
    const isCreative = document.getElementById('edit-creative-toggle').checked;
    const showDays = document.getElementById('edit-days-toggle').checked;
    
    if (!newName) {
        alert('Please enter a world name.');
        return;
    }
    
    const worlds = JSON.parse(localStorage.getItem('minecraft_worlds') || '{}');

    if (newName !== originalName && worlds[newName]) {
        alert('A world with this name already exists. Please choose another name.');
        return;
    }
    
    const worldData = worlds[originalName];
    
    if (!worldData) {
        alert('World data not found!');
        return;
    }
    
    if (!worldData.settings) {
        worldData.settings = {};
    }
    
    worldData.settings.isCreative = isCreative;
    worldData.settings.showDays = showDays;
    // worldData.settings.starterChestEnabled remains as it was at creation.
    
    if (newName !== originalName) {
        worlds[newName] = worldData;
        worlds[newName].name = newName; 
        delete worlds[originalName];
    } else {
        worlds[originalName] = worldData;
    }
    
    localStorage.setItem('minecraft_worlds', JSON.stringify(worlds));
    
    hideWorldEditDialog();
    showWorldSelection(); 
    
    alert(`World "${newName}" has been updated.`);
}

function showLoadFromCodeDialog() {
    document.getElementById('load-from-code-dialog').style.display = 'flex';
}

function hideLoadFromCodeDialog() {
    document.getElementById('load-from-code-dialog').style.display = 'none';
}

// NEW: AI structure dialog functions
function showAiPromptDialog() {
    document.getElementById('ai-structure-prompt-dialog').style.display = 'flex';
    document.getElementById('ai-structure-prompt-input').focus();
}

function hideAiPromptDialog() {
    document.getElementById('ai-structure-prompt-dialog').style.display = 'none';
}

async function generateStructureWithAI() {
    const promptInput = document.getElementById('ai-structure-prompt-input');
    const userPrompt = promptInput.value.trim();

    if (!userPrompt) {
        alert("Please describe the structure you want to build.");
        return;
    }

    hideAiPromptDialog();

    const loadingScreen = document.getElementById('loading-screen');
    const loadingText = document.getElementById('loading-text');
    if (loadingScreen && loadingText) {
        loadingText.textContent = "AI is building your structure...";
        loadingScreen.style.display = 'flex';
    }

    try {
        const availableBlocks = [
            'plank', 'birchplank', 'spruceplank', 'cherryplank', 'cobble', 'stone', 'smoothstone', 
            'glass', 'newglass', 'oak_stairs', 'birch_stairs', 'spruce_stairs', 'cobble_stairs', 
            'oakslab', 'birchslab', 'spruceslab', 'wood', 'birchwood', 'sprucewood', 'wool',
            'craftingtable', 'furnace', 'chest', 'ladder', 'haybale', 'farmland',
            'leaves', 'birchleaves', 'spruceleaves', 'cherryleaves'
        ];

        const systemPrompt = `You are an expert architect for a block-based sandbox game, similar to Minecraft. Your task is to generate a list of blocks that form a structure based on a user's prompt.

Respond ONLY with a JSON object with the following schema:
{
  "blocks": [{ "x": number, "y": number, "z": number, "type": "string" }]
}

**CRITICAL RULES:**
1.  **Hollow Structures**: Buildings like houses, cabins, towers, and castles MUST be hollow inside. They need walls, a floor, and a roof, creating an empty, usable interior space for a player.
2.  **Interior Details**: For any building a player might live in, add functional interior details. Use items like 'craftingtable', 'furnace', 'chest', and 'ladder' for multi-story buildings. Don't leave them empty.
3.  **Size & Origin**: The entire structure must fit within a 32x32 block area on the X/Z plane. The origin (0,0,0) should be the approximate bottom-center of the structure. The 'y' coordinate MUST start from 1 (as y=0 is the ground).
4.  **Physical Logic**: Ensure the structure is properly supported and makes sense physically (e.g., no large floating sections without support).
5.  **Available Blocks**: Use ONLY the following block types: ${availableBlocks.join(', ')}.

**Example:**
User prompt: "a small wooden cabin"
A good response would include:
- 'wood' for corner pillars and 'plank' for walls/floor.
- 'oak_stairs' for a sloped roof.
- 'glass' or 'newglass' for windows.
- A completely empty interior space.
- A 'craftingtable', 'furnace', and 'chest' placed inside against a wall.
- The entire cabin is small, perhaps 10x8 blocks.

Now, generate the structure for the user's prompt.`;

        const completion = await websim.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            json: true
        });

        const result = JSON.parse(completion.content);
        if (!result.blocks || !Array.isArray(result.blocks)) {
            throw new Error("AI response did not contain a 'blocks' array.");
        }

        let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
        
        result.blocks.forEach(block => {
            minX = Math.min(minX, block.x);
            maxX = Math.max(maxX, block.x);
            minZ = Math.min(minZ, block.z);
            maxZ = Math.max(maxZ, block.z);
        });

        if (minX === Infinity) {
             throw new Error("The AI did not generate any blocks.");
        }

        const normalizedBlocks = result.blocks.map(block => ({
            x: block.x - minX,
            y: block.y,
            z: block.z - minZ,
            type: block.type
        }));

        const structureWidth = maxX - minX + 1;
        const structureLength = maxZ - minZ + 1;

        const worldData = {
            name: `AI_Structure_${Date.now()}`,
            isTemp: true,
            settings: {
                isCreative: true,
                isStructureCreation: true,
            },
            structureCreationBounds: {
                width: Math.max(32, structureWidth + 16),
                length: Math.max(32, structureLength + 16)
            },
            chunks: {}
        };

        normalizedBlocks.forEach(block => {
            const placeX = block.x + 8;
            const placeY = block.y;
            const placeZ = block.z + 8;

            const chunkX = Math.floor(placeX / 16);
            const chunkZ = Math.floor(placeZ / 16);
            const chunkKey = `${chunkX},${chunkZ}`;

            if (!worldData.chunks[chunkKey]) {
                worldData.chunks[chunkKey] = {};
            }

            const localX = placeX % 16;
            const localZ = placeZ % 16;
            const blockKeyInChunk = `${localX},${placeY},${localZ}`;
            worldData.chunks[chunkKey][blockKeyInChunk] = block.type;
        });

        isStructureCreationMode = true;
        
        await showLoadingScreenAndInit(worldData, true);

    } catch (error) {
        console.error("Failed to generate structure with AI:", error);
        alert("Sorry, the AI could not build the structure. It might be too complex or there was an error. Please try again with a simpler prompt.");
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
        showAiPromptDialog();
    }
}

async function copyWorldCodeToClipboard(worldName) {
    try {
        const worlds = JSON.parse(localStorage.getItem('minecraft_worlds') || '{}');
        const worldData = worlds[worldName];

        if (!worldData) {
            alert('Could not find world data to copy.');
            return;
        }

        const worldCode = btoa(JSON.stringify(worldData));

        await navigator.clipboard.writeText(worldCode);
        alert('World code copied to clipboard!');

    } catch (error) {
        alert('Failed to copy world code.');
        console.error('Error copying world code:', error);
    }
}

document.getElementById('superflat-toggle').addEventListener('change', function() {
    updateSuperflatDescription();
});

function showSuperflatAdvancedSettings() {
    document.getElementById('superflat-advanced-dialog').style.display = 'flex';
    renderSuperflatLayers();
    updateSuperflatDescription();
}

function hideSuperflatAdvancedSettings() {
    document.getElementById('superflat-advanced-dialog').style.display = 'none';
}

function renderSuperflatLayers() {
    const layerList = document.getElementById('superflat-layer-list');
    layerList.innerHTML = '';
    
    import('./superflat.js').then(module => {
        const layers = module.getSuperflatLayers();
        
        layers.forEach((layer, index) => {
            const layerItem = document.createElement('div');
            layerItem.className = 'superflat-layer-item';
            
            const layerDetails = document.createElement('div');
            layerDetails.className = 'layer-details';
            
            const blockPreview = document.createElement('div');
            blockPreview.className = 'layer-block-preview';
            blockPreview.style.backgroundImage = `url('${getItemTexture(layer.blockType)}')`;
            
            const blockName = document.createElement('div');
            blockName.className = 'layer-block-name';
            blockName.textContent = getBlockDisplayName(layer.blockType);
            
            const thicknessInput = document.createElement('input');
            thicknessInput.type = 'number';
            thicknessInput.className = 'layer-thickness';
            thicknessInput.value = layer.thickness;
            thicknessInput.min = 1;
            thicknessInput.max = 32;
            thicknessInput.addEventListener('change', function() {
                const thickness = parseInt(this.value);
                if (thickness > 0 && thickness <= 32) {
                    updateSuperflatLayer(index, layer.blockType, thickness);
                }
            });
            
            layerDetails.appendChild(blockPreview);
            layerDetails.appendChild(blockName);
            layerDetails.appendChild(thicknessInput);
            
            const blockSelector = document.createElement('select');
            blockSelector.className = 'layer-block-selector';
            
            getAvailableBlockTypes().forEach(blockType => {
                const option = document.createElement('option');
                option.value = blockType;
                option.textContent = getBlockDisplayName(blockType);
                if (blockType === layer.blockType) {
                    option.selected = true;
                }
                blockSelector.appendChild(option);
            });
            
            blockSelector.addEventListener('change', function() {
                updateSuperflatLayer(index, this.value, layer.thickness);
                blockPreview.style.backgroundImage = `url('${getItemTexture(this.value)}')`;
                blockName.textContent = getBlockDisplayName(this.value);
            });
            
            layerDetails.appendChild(blockSelector);
            
            const layerActions = document.createElement('div');
            layerActions.className = 'layer-actions';
            
            if (layers.length > 1) {
                const removeBtn = document.createElement('button');
                removeBtn.textContent = 'X';
                removeBtn.className = 'remove-layer-btn';
                removeBtn.addEventListener('click', function() {
                    playClickSound();
                    removeSuperflatLayer(index);
                });
                
                layerActions.appendChild(removeBtn);
            }
            
            layerItem.appendChild(layerDetails);
            layerItem.appendChild(layerActions);
            
            layerList.appendChild(layerItem);
        });
    });
}

function updateSuperflatDescription() {
    import('./superflat.js').then(module => {
        const layers = module.getSuperflatLayers();
        let description = 'Default superflat world';
        if (layers && Array.isArray(layers) && layers.length > 0) {
            const layerDescriptions = layers.map(layer => {
                const blockName = getBlockDisplayName(layer.blockType);
                return `${layer.thickness} ${blockName}`;
            });
            description = layerDescriptions.join(', ');
        }
        const superflatHint = document.querySelector('.world-type-options .settings-hint');
        if (superflatHint) {
            superflatHint.textContent = description;
        }
    }).catch(error => {
        console.error('Error updating superflat description:', error);
    });
}

function saveSuperflatSettings() {
    import('./superflat.js').then(module => {
        const layers = module.getSuperflatLayers();
        console.log('Superflat layers saved:', layers);
        
        updateSuperflatDescription();
    }).catch(error => {
        console.error('Error saving superflat settings:', error);
    });
    
    hideSuperflatAdvancedSettings();
}

function addSuperflatLayer() {
    import('./superflat.js').then(module => {
        module.addLayer('stone', 1);
        setTimeout(() => {
            renderSuperflatLayers();
        }, 10);
    });
}

function removeSuperflatLayer(index) {
    import('./superflat.js').then(module => {
        module.removeLayer(index);
        setTimeout(() => {
            renderSuperflatLayers();
        }, 10);
    });
}

function updateSuperflatLayer(index, blockType, thickness) {
    import('./superflat.js').then(module => {
        module.updateLayer(index, blockType, thickness);
        setTimeout(() => {
            renderSuperflatLayers();
        }, 10);
    });
}

function resetSuperflatLayers() {
    import('./superflat.js').then(module => {
        module.resetSuperflatLayers();
        setTimeout(() => {
            renderSuperflatLayers();
        }, 10);
    });
}

function getSuperflatLayers() {
    try {
        return require('./superflat.js').getSuperflatLayers();
    } catch (e) {
        return [
            { blockType: 'bedrock', thickness: 1 },
            { blockType: 'dirt', thickness: 2 },
            { blockType: 'grass', thickness: 1 }
        ];
    }
}

function getBlockDisplayName(blockType) {
    switch(blockType) {
        case 'bedrock': return 'Bedrock';
        case 'dirt': return 'Dirt';
        case 'grass': return 'Grass';
        case 'stone': return 'Stone';
        case 'cobble': return 'Cobblestone';
        case 'sand': return 'Sand';
        case 'sandstone': return 'Sandstone';
        case 'wood': return 'Oak Log';
        case 'birchwood': return 'Birch Log';
        case 'plank': return 'Oak Planks';
        case 'birchplank': return 'Birch Planks';
        case 'glass': return 'Glass';
        case 'snow': return 'Snow';
        case 'wheat': return 'Wheat';
        case 'sprucewood': return 'Spruce Log';
        case 'spruceleaves': return 'Spruce Leaves'; // Added for consistency
        case 'spruceplank': return 'Spruce Planks';
        case 'sprucesapling': return 'Spruce Sapling'; // Added for consistency
        case 'spruceslab': return 'Spruce Slab'; // Added for consistency
        case 'cherrywood': return 'Cherry Log';
        case 'cherryplank': return 'Cherry Planks';
        case 'cherrysapling': return 'Cherry Sapling';
        case 'cherryslab': return 'Cherry Slab';
        default: 
             if (blockType.startsWith('custom_')) {
                const name = blockType.substring(7).replace(/_/g, ' ');
                return name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            }
            return blockType.charAt(0).toUpperCase() + blockType.slice(1);
    }
}

function getItemTexture(blockType) {
    switch(blockType) {
        case 'dirt': return 'dirt.png';
        case 'stone': return 'stone.png';
        case 'cobble': return 'cobbles.png';
        case 'bedrock': return 'bedrock.png';
        case 'grass': return 'grass_top.png';
        case 'sand': return 'sand.png';
        case 'sandstone': return 'sandstone.png';
        case 'wood': return 'logtopbottom.png';
        case 'birchwood': return 'birchlogtopbottom.png';
        case 'plank': return 'plank.png';
        case 'birchplank': return 'birchplank.png';
        case 'glass': return 'glass.png';
        case 'snow': return 'snow.png';
        case 'wheat': return 'wheatfinished.png';
        case 'sprucewood': return 'sprucelog.png'; // Corrected to sprucelog.png for log top/bottom in superflat preview
        case 'spruceplank': return 'spruceplank.png';
        case 'sprucesapling': return 'sprucesapling.png'; // Added for spruce sapling preview
        case 'spruceslab': return 'spruceplank.png'; // Spruce slab icon
        case 'cherrywood': return 'cherrylog.png';
        case 'cherryplank': return 'cherryplank.png';
        default: return 'dirt.png';
    }
}

function getAvailableBlockTypes() {
    return [
        'bedrock', 'dirt', 'grass', 'stone', 'cobble', 
        'sand', 'sandstone', 'wood', 'birchwood', 'plank', 
        'birchplank', 'glass', 'snow',
        'sprucewood', 'spruceplank', 'cherrywood', 'cherryplank' // Spruce blocks for superflat
        // Note: Not adding slabs or leaves to superflat layer selection by default
    ];
}

function spawnStarterChest(playerSpawnPos, playerEyeLevel, voxelWorldInstance) {
    console.log("Attempting to spawn starter chest...");
    const searchRadiusMin = 3;
    const searchRadiusMax = 6;
    let chestPlaced = false;
    let chestX, chestY, chestZ; // Declare here to be accessible later

    for (let r = searchRadiusMin; r <= searchRadiusMax && !chestPlaced; r++) {
        for (let i = 0; i < 16 && !chestPlaced; i++) { // Check up to 16 points at this radius
            const angle = (i / 16) * Math.PI * 2;
            const dx = Math.round(r * Math.cos(angle));
            const dz = Math.round(r * Math.sin(angle));

            const currentChestX = Math.floor(playerSpawnPos.x) + dx;
            const currentChestZ = Math.floor(playerSpawnPos.z) + dz;
            
            const playerFeetY = Math.floor(playerSpawnPos.y - playerEyeLevel);
            let currentChestY = -1;

            for (let yOffset = 0; yOffset <= 3; yOffset++) { 
                const checkY = playerFeetY + yOffset;
                if (voxelWorldInstance.isBlockSolid(currentChestX, checkY -1, currentChestZ) &&
                    !voxelWorldInstance.getBlock(currentChestX, checkY, currentChestZ) &&
                    !voxelWorldInstance.getBlock(currentChestX, checkY + 1, currentChestZ)) {
                    currentChestY = checkY;
                    break;
                }
            }
            if (currentChestY === -1) { 
                 for (let yOffset = -1; yOffset >= -3; yOffset--) {
                    const checkY = playerFeetY + yOffset;
                     if (voxelWorldInstance.isBlockSolid(currentChestX, checkY - 1, currentChestZ) &&
                         !voxelWorldInstance.getBlock(currentChestX, checkY, currentChestZ) &&
                         !voxelWorldInstance.getBlock(currentChestX, checkY + 1, currentChestZ)) {
                        currentChestY = checkY;
                        break;
                    }
                }
            }

            if (currentChestY !== -1) {
                chestX = currentChestX; // Assign to outer scope variables
                chestY = currentChestY;
                chestZ = currentChestZ;

                console.log(`Found spot for starter chest at ${chestX}, ${chestY}, ${chestZ}`);
                voxelWorldInstance.ensureChunkLoaded(Math.floor(chestX / voxelWorldInstance.chunkSize), Math.floor(chestZ / voxelWorldInstance.chunkSize));

                const placed = voxelWorldInstance.placeBlock(chestX, chestY, chestZ, 'chest', playerSpawnPos);
                if (!placed) {
                    console.warn("Failed to place chest block, trying again.");
                    continue;
                }
                chestPlaced = true; // Mark chest as placed
                break; 
            }
        }
    }

    if (chestPlaced) {
        let chestData = voxelWorldInstance.getChestData(chestX, chestY, chestZ);
        if (!chestData) {
             console.warn(`Chest data not found immediately after placeBlock for ${chestX},${chestY},${chestZ}. Attempting to initialize.`);
             voxelWorldInstance.initializeChest(chestX, chestY, chestZ, playerSpawnPos);
             chestData = voxelWorldInstance.getChestData(chestX, chestY, chestZ);
        }

        if (chestData) {
            const materialPool = [
                { type: 'wood', count: 10 },
                { type: 'stone', count: 10 },
                { type: 'plank', count: 16 },
                { type: 'stick', count: 16 },
                { type: 'cobble', count: 8 },
            ];
            const toolPool = [ // Only one tool will be selected
                { type: 'woodpickaxe', count: 1 },
                // { type: 'woodhoe', count: 1 }, // Example if you want to vary tools
            ];
            const saplingPool = [ // Only one sapling type will be selected
                { type: 'oaksapling', count: 2 },
                { type: 'birchsapling', count: 2 },
                { type: 'sprucesapling', count: 2 },
            ];
            const utilityPool = [
                { type: 'seeds', count: 4 },
                { type: 'craftingtable', count: 1 },
                // { type: 'furnace', count: 1 }, // Furnace might be too much for starter
            ];

            let chosenItems = [];
            
            const shuffleArray = (array) => array.sort(() => 0.5 - Math.random());
            shuffleArray(materialPool);
            shuffleArray(toolPool);
            shuffleArray(saplingPool);
            shuffleArray(utilityPool);

            // 1. Add one tool
            if (toolPool.length > 0 && chosenItems.length < 6) {
                const toolToAdd = { ...toolPool[0] }; // shallow copy
                 if (TOOL_DURABILITIES[toolToAdd.type]) {
                    toolToAdd.durability = TOOL_DURABILITIES[toolToAdd.type];
                    toolToAdd.maxDurable = TOOL_DURABILITIES[toolToAdd.type];
                }
                chosenItems.push(toolToAdd);
            }

            // 2. Add one sapling type
            if (saplingPool.length > 0 && chosenItems.length < 6) {
                 if (!chosenItems.some(item => saplingPool.map(s=>s.type).includes(item.type))) { // ensure no sapling type already added
                    chosenItems.push(saplingPool[0]);
                }
            }
            
            // 3. Add some materials (e.g., 2-3, ensuring uniqueness)
            const numMaterialsToPick = Math.min(materialPool.length, 3);
            for (let i = 0; i < numMaterialsToPick && chosenItems.length < 6; i++) {
                if (!chosenItems.some(item => item.type === materialPool[i].type)) {
                    chosenItems.push(materialPool[i]);
                }
            }

            // 4. Fill remaining slots with utility items (up to 6 total unique items, ensuring uniqueness)
            for (const utilityItem of utilityPool) {
                if (chosenItems.length >= 6) break;
                if (!chosenItems.some(item => item.type === utilityItem.type)) {
                    chosenItems.push(utilityItem);
                }
            }
            
            // Ensure chosenItems does not exceed 6 unique items.
            // The logic above prioritizes tool and sapling, then materials, then utilities.
            // If after this, chosenItems > 6, it means some categories had multiple items pushed.
            // This scenario should be less likely with the current pool sizes and picking logic.
            // However, a final trim might be needed if pools were larger or logic more complex.
            if (chosenItems.length > 6) {
                chosenItems = chosenItems.slice(0, 6);
            }

            for (let i = 0; i < chosenItems.length && i < chestData.inventory.length; i++) {
                // Ensure item is copied and durability is set if it was missed or is a material that could be a tool (not typical)
                const itemToStore = { ...chosenItems[i] };
                if (TOOL_DURABILITIES[itemToStore.type] && !itemToStore.hasOwnProperty('durability')) {
                    itemToStore.durability = TOOL_DURABILITIES[itemToStore.type];
                    itemToStore.maxDurability = TOOL_DURABILITIES[itemToStore.type];
                }
                chestData.inventory[i] = itemToStore;
            }

            console.log("Starter chest populated with (max 6 unique):", chestData.inventory.filter(s => s.type));
            voxelWorldInstance.markChunkDirty(Math.floor(chestX / voxelWorldInstance.chunkSize), Math.floor(chestZ / voxelWorldInstance.chunkSize));
        } else {
            console.error(`Failed to get/initialize chest data at ${chestX}, ${chestY}, ${chestZ}`);
        }
    }
    if (!chestPlaced) {
        console.warn("Could not find a suitable location for the starter chest.");
    }
}

function setupMobileControls() {
    // 1. Joystick for movement
    const joystickContainer = document.getElementById('joystick-container');
    const joystick = nipplejs.create({
        zone: joystickContainer,
        mode: 'static',
        position: { left: '50%', top: '50%' },
        color: 'white',
        size: 150
    }).get();

    joystick.on('move', (evt, data) => {
        if (!data.vector) return;
        
        // Correcting joystick forward/backward movement as requested.
        const y_movement = data.vector.y;
        const x_movement = data.vector.x;

        const threshold = 0.2;

        // nipplejs: angle=90(up) is y=1, angle=270(down) is y=-1.
        player.keys.forward = y_movement > threshold;
        player.keys.backward = y_movement < -threshold;
        player.keys.left = x_movement < -threshold;
        player.keys.right = x_movement > threshold;
        
        // Sprint when joystick is pushed far forward
        player.keys.sprint = player.keys.forward && data.force > 0.9;

        player.isMoving = player.keys.forward || player.keys.backward || player.keys.left || player.keys.right;
    });

    joystick.on('end', () => {
        player.keys.forward = false;
        player.keys.backward = false;
        player.keys.left = false;
        player.keys.right = false;
        player.keys.sprint = false;
        player.isMoving = false;
    });

    // 2. Camera and Interaction handling
    const canvas = renderer.domElement;
    let touchStartX, touchStartY;
    let interactionTimer;
    let isDragging = false;
    let isHolding = false;
    
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        // Only interact if touch is on the right 2/3 of the screen
        const touch = Array.from(e.changedTouches).find(t => t.clientX > window.innerWidth / 3);
        if (!touch) return;

        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        isDragging = false;
        isHolding = false;
        
        interactionTimer = setTimeout(() => {
            if (!isDragging) {
                isHolding = true;
                const x = (touch.clientX / window.innerWidth) * 2 - 1;
                const y = -(touch.clientY / window.innerHeight) * 2 + 1;
                const touchCoords = new THREE.Vector2(x, y);
                
                const raycaster = new THREE.Raycaster();
                raycaster.setFromCamera(touchCoords, camera);
                const targetBlock = voxelWorld.raycast(camera.position, raycaster.ray.direction);

                player.targetBlock = targetBlock;
                if (targetBlock) {
                    player.blockBreaker.startBreakingBlock(targetBlock, player.isCreative);
                }
            }
        }, 300); // 300ms hold time
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = Array.from(e.changedTouches).find(t => t.clientX > window.innerWidth / 3);
        if (!touch) return;
        
        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;

        if (!isDragging && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
            isDragging = true;
            clearTimeout(interactionTimer); // A drag cancels the hold timer
        }

        if (isDragging) {
            if (player) {
                player.rotateCamera(deltaX, deltaY);
            }
        } else if (isHolding) {
            // If already holding, update the target block as the finger moves
            const x = (touch.clientX / window.innerWidth) * 2 - 1;
            const y = -(touch.clientY / window.innerHeight) * 2 + 1;
            const touchCoords = new THREE.Vector2(x, y);

            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(touchCoords, camera);
            player.targetBlock = voxelWorld.raycast(camera.position, raycaster.ray.direction);
        }

        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        const touch = Array.from(e.changedTouches).find(t => t.clientX > window.innerWidth / 3);
        if (!touch) return;

        clearTimeout(interactionTimer);

        if (isHolding) {
            player.blockBreaker.cancelBlockBreaking();
        } else if (!isDragging) {
            // This was a tap, so place block
            const x = (touch.clientX / window.innerWidth) * 2 - 1;
            const y = -(touch.clientY / window.innerHeight) * 2 + 1;
            const touchCoords = new THREE.Vector2(x, y);

            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(touchCoords, camera);
            const targetBlock = voxelWorld.raycast(camera.position, raycaster.ray.direction);
            
            if (targetBlock) {
                player.blockPlacer.attemptPlaceBlock(targetBlock, player.camera.position, player.isCreative);
            }
        }
        
        isHolding = false;
        player.targetBlock = null; // Clear target block after mobile interaction ends
    }, { passive: false });

    // 3. UI Buttons
    const jumpButton = document.getElementById('mobile-jump-btn');
    const inventoryButton = document.getElementById('mobile-inventory-btn');
    const settingsButton = document.getElementById('mobile-settings-btn');

    jumpButton.addEventListener('touchstart', e => { e.preventDefault(); player.onKeyDown({ code: 'Space' }); });
    jumpButton.addEventListener('touchend', e => { e.preventDefault(); player.onKeyUp({ code: 'Space' }); });

    inventoryButton.addEventListener('click', () => {
        inventory.toggleInventory();
    });

    settingsButton.addEventListener('click', () => {
        pauseGame();
    });
}

document.addEventListener('DOMContentLoaded', function() {
    soundManager.init();
    soundManager.preload('click', 'click.mp3');
    soundManager.preload('pickup', 'pickup.mp3');
    soundManager.preload('tool_break', 'assets/tool_break.mp3');
    soundManager.preload('wood_jump', 'Woodjump.mp3');
    soundManager.preload('door_open', 'dooropen.ogg');
    soundManager.preload('grass_break', 'grassbreak.ogg');
    soundManager.preload('grass_jump', 'grassjump.mp3');
    soundManager.preload('grasswalk', 'grasswalk.mp3');
    soundManager.preload('stone_break', 'stonebreak.ogg');
    soundManager.preload('stone_jump', 'stonejump.wav');
    soundManager.preload('wood_break', 'woodbreak.ogg');
    soundManager.preload('wool_break', 'woolbreak.ogg');
    soundManager.preload('wool_jump', 'wooljump.wav');
    soundManager.preload('glass_break', 'glassbreak.ogg');
    soundManager.preload('sand_break', 'Sandbreak.ogg');
    soundManager.preload('sand_jump', 'sandjump.ogg');
    soundManager.preload('woodwalk', 'woodwalk.mp3');
    soundManager.preload('walksand', 'walksand.mp3');
    soundManager.preload('stonewalk', 'stonewalk.mp3');
    
    // Preload music
    soundManager.preload('menu_music', 'dryhands.mp3');
    
    setupMenuEventListeners();
    showMainMenu();
    
    document.querySelectorAll('.upload-texture-btn').forEach(button => {
        button.addEventListener('click', function() {
            playClickSound();
        });
    });
    
    document.querySelectorAll('.crafting-recipe-slot').forEach(slot => {
        slot.addEventListener('click', function() {
            document.querySelectorAll('.crafting-recipe-slot').forEach(s => {
                s.classList.remove('selected');
            });
            this.classList.add('selected');
        });
    });
});

function handleGamepadInput() {
    if (!navigator.getGamepads || !player) return;

    const gamepads = navigator.getGamepads();
    const gamepad = gamepads[0]; // Assuming the first connected gamepad

    if (!gamepad) {
        if (prevGamepadState) {
            player.keys.forward = false;
            player.keys.backward = false;
            player.keys.left = false;
            player.keys.right = false;
            player.keys.sprint = false;
            player.isMoving = false;
            prevGamepadState = null;
        }
        return;
    }

    if (!prevGamepadState) {
        prevGamepadState = {
            buttons: gamepad.buttons.map(b => b.pressed),
            axes: [...gamepad.axes]
        };
    }

    const wasButtonPressed = (index) => prevGamepadState.buttons[index];
    const isButtonPressed = (index) => gamepad.buttons[index].pressed;
    const onButtonDown = (index) => isButtonPressed(index) && !wasButtonPressed(index);
    const leftStickX = gamepad.axes[0];
    const leftStickY = gamepad.axes[1];
    const stickThreshold = 0.5;

    // UI Navigation Mode
    const openScreen = inventory.isInventoryOpen(true);
    if (openScreen) {
        if (!gamepadUINavigator.active || gamepadUINavigator.currentScreen !== openScreen) {
            gamepadUINavigator.activate(openScreen);
        }

        // D-Pad and Left Stick navigation for UI
        if (gamepadUINavigator.moveCooldown <= 0) {
            let moved = false;
            if (isButtonPressed(12) || leftStickY < -stickThreshold) { gamepadUINavigator.move(0, -1); moved = true; }
            else if (isButtonPressed(13) || leftStickY > stickThreshold) { gamepadUINavigator.move(0, 1); moved = true; }
            else if (isButtonPressed(14) || leftStickX < -stickThreshold) { gamepadUINavigator.move(-1, 0); moved = true; }
            else if (isButtonPressed(15) || leftStickX > stickThreshold) { gamepadUINavigator.move(1, 0); moved = true; }
            
            if (moved) {
                gamepadUINavigator.moveCooldown = 0.18; // 180ms cooldown
            }
        }


        // Action button (A/X)
        if (onButtonDown(0)) {
            gamepadUINavigator.click();
        }

        // Back button (B/O)
        if (onButtonDown(1)) {
            if (inventory.isDragging) {
                // If dragging an item with gamepad, cancel drag
                inventory.returnItemToSource();
                inventory.isDragging = false;
                inventory.draggedItem = null;
                document.getElementById('dragged-item').style.display = 'none';
            } else {
                inventory.closeAllScreens();
                if (controls && !controls.isLocked) controls.lock();
            }
        }
        
        // Update prev state and return to prevent player movement
        prevGamepadState.buttons = gamepad.buttons.map(b => b.pressed);
        prevGamepadState.axes = [...gamepad.axes];
        return;
    } 
    // Deactivate navigator if no UI is open
    else if (gamepadUINavigator.active) {
        gamepadUINavigator.deactivate();
    }


    // --- Axes for Movement and Camera ---
    const rightStickX = gamepad.axes[2];
    const rightStickY = gamepad.axes[3];
    const camStickThreshold = 0.2;

    player.keys.forward = leftStickY < -stickThreshold;
    player.keys.backward = leftStickY > stickThreshold;
    player.keys.left = leftStickX < -stickThreshold;
    player.keys.right = leftStickX > stickThreshold;
    player.isMoving = player.keys.forward || player.keys.backward || player.keys.left || player.keys.right;

    player.keys.sprint = player.keys.forward && leftStickY < -0.8;
    
    if (Math.abs(rightStickX) > camStickThreshold || Math.abs(rightStickY) > camStickThreshold) {
        const cameraSpeed = 18; // Adjusted speed for gamepad camera
        player.rotateCamera(rightStickX * cameraSpeed, rightStickY * cameraSpeed);
    }
    
    // --- Buttons for Actions ---
    // Button 0 (A/X): Jump
    if (onButtonDown(0)) {
        player.onKeyDown({ code: player.keybindings.jump });
    }
    if (!isButtonPressed(0) && wasButtonPressed(0)) {
        player.onKeyUp({ code: player.keybindings.jump });
    }

    // Button 1 (B/O): Cancel breaking
    if (onButtonDown(1)) {
        player.blockBreaker.cancelBlockBreaking();
    }

    // Buttons 2 (X/Square) & 3 (Y/Triangle): Inventory
    if (onButtonDown(2) || onButtonDown(3)) {
        inventory.toggleInventory();
    }

    // Buttons 4 (LB/L1) & 5 (RB/R1): Hotbar navigation
    if (onButtonDown(4)) {
        inventory.selectSlot((inventory.selectedSlot - 1 + 9) % 9);
    }
    if (onButtonDown(5)) {
        inventory.selectSlot((inventory.selectedSlot + 1) % 9);
    }

    // Button 7 (RT/R2): Break block (hold)
    const breakButtonIndex = 7;
    if (isButtonPressed(breakButtonIndex)) {
        player.updateTargetBlock();
        if (player.targetBlock) {
             if (!player.blockBreaker.isBreakingBlock()) {
                player.blockBreaker.startBreakingBlock(player.targetBlock, player.isCreative);
             }
        }
    } else if (wasButtonPressed(breakButtonIndex)) {
        player.blockBreaker.cancelBlockBreaking();
    }
    
    // Button 6 (LT/L2): Place block (press)
    const placeButtonIndex = 6;
    if (onButtonDown(placeButtonIndex)) {
        player.updateTargetBlock();
        if (player.targetBlock) {
            player.blockPlacer.attemptPlaceBlock(
                player.targetBlock, 
                player.camera.position, 
                player.isCreative
            );
        }
    }

    // Button 9 (Start/Options): Pause/Settings
    if (onButtonDown(9)) {
        if (inventory.isInventoryOpen()) {
            inventory.closeAllScreens();
            if (controls && !controls.isLocked) controls.lock();
        } else if (controls && controls.isLocked) {
            controls.unlock();
        } else {
            pauseGame();
        }
    }

    prevGamepadState.buttons = gamepad.buttons.map(b => b.pressed);
    prevGamepadState.axes = [...gamepad.axes];
}
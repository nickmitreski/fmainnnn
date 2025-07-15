// Mods management system
import { soundManager } from './utils.js';

// ---------- UI Dialog Controls ----------
export function showModsDialog() {
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('mod-management-screen').style.display = 'flex';
    loadCustomBlocks();
}

export function hideModsDialog() {
    document.getElementById('mod-management-screen').style.display = 'none';
    document.getElementById('main-menu').style.display = 'flex';
}

export function showBlockCreationDialog() {
    document.getElementById('block-creation-dialog').style.display = 'flex';
    
    // Reset fields
    document.getElementById('block-name').value = '';
    document.getElementById('is-slab-checkbox').checked = false;
    document.getElementById('same-texture-toggle').checked = true;
    
    const previews = document.querySelectorAll('#block-creation-dialog .texture-preview');
    previews.forEach(p => {
        p.style.backgroundImage = '';
        p.removeAttribute('data-texture-url');
    });

    // Set initial visibility based on toggle
    const sameTextureToggle = document.getElementById('same-texture-toggle');
    document.getElementById('single-texture-upload-container').style.display = sameTextureToggle.checked ? 'block' : 'none';
    document.getElementById('multi-texture-upload-container').style.display = sameTextureToggle.checked ? 'none' : 'grid';

    setupTextureUploadInputs();
}

export function hideBlockCreationDialog() {
    const dialog = document.getElementById('block-creation-dialog');
    dialog.style.display = 'none';

    // Reset editing state
    delete dialog.dataset.editingBlockId;
    const title = dialog.querySelector('h2');
    if (title) title.textContent = 'Block Creator';
    document.getElementById('block-name').disabled = false;
}

export function showBlockFacesDialog() {
    // This is now handled by the Block Creator dialog.
    // We can re-route this call to the new dialog.
    showBlockCreationDialog();
}

export function hideBlockFacesDialog() {
    // No longer needed
}

export function showBlockCreatorDialog() {
    document.getElementById('block-creation-dialog').style.display = 'flex';
    
    // Reset fields
    document.getElementById('block-name').value = '';
    document.getElementById('is-slab-checkbox').checked = false;
    document.getElementById('same-texture-toggle').checked = true;
    
    const previews = document.querySelectorAll('#block-creation-dialog .texture-preview');
    previews.forEach(p => {
        p.style.backgroundImage = '';
        p.removeAttribute('data-texture-url');
    });

    // Set initial visibility based on toggle
    const sameTextureToggle = document.getElementById('same-texture-toggle');
    document.getElementById('single-texture-upload-container').style.display = sameTextureToggle.checked ? 'block' : 'none';
    document.getElementById('multi-texture-upload-container').style.display = sameTextureToggle.checked ? 'none' : 'grid';

    setupTextureUploadInputs();
}

export function hideBlockCreatorDialog() {
    const dialog = document.getElementById('block-creation-dialog');
    dialog.style.display = 'none';

    // Reset editing state
    delete dialog.dataset.editingBlockId;
    const title = dialog.querySelector('h2');
    if (title) title.textContent = 'Block Creator';
    document.getElementById('block-name').disabled = false;
}

export function showBlockTextureUploader() {
    // Re-routed to the new dialog
    showBlockCreationDialog();
}

export function hideBlockTextureUploader() {
    // Re-routed to the new dialog
    hideBlockCreationDialog();
}

export function showSingleTextureUploader() {
    // Re-routed to the new dialog
    showBlockCreationDialog();
}

export function hideSingleTextureUploader() {
    // Re-routed to the new dialog
    hideBlockCreationDialog();
}

export function showModImportDialog() {
    document.getElementById('mod-import-dialog').style.display = 'flex';
    loadCustomBlocks();
}

export function hideModImportDialog() {
    document.getElementById('mod-import-dialog').style.display = 'none';
}

export function showCraftingRecipeCreator() {
    document.getElementById('crafting-recipe-creator').style.display = 'flex';
    populateBlockSelector();
}

export function hideCraftingRecipeCreator() {
    document.getElementById('crafting-recipe-creator').style.display = 'none';
}

// ---------- NEW: Structure Creation Dialogs ----------

export function showStructureSizeDialog() {
    document.getElementById('structure-size-dialog').style.display = 'flex';
}

export function hideStructureSizeDialog() {
    document.getElementById('structure-size-dialog').style.display = 'none';
}

export function showSaveStructureDialog() {
    document.getElementById('save-structure-dialog').style.display = 'flex';
    populateBiomeSelector();
}

function populateBiomeSelector() {
    const biomeSelect = document.getElementById('structure-biome-select');
    if (!biomeSelect) return;

    biomeSelect.innerHTML = ''; // Clear existing options

    const biomes = {
        all: "All Biomes (Overrides others)",
        flatlands: "Flatlands",
        hills: "Hills",
        desert: "Desert",
        mountains: "Mountains",
        oak_forest: "Oak Forest",
        birch_forest: "Birch Forest",
        spruce_forest: "Spruce Forest",
        cherry_grove: "Cherry Grove",
        multiforest: "Mixed Forest"
    };

    for (const [key, name] of Object.entries(biomes)) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = name;
        biomeSelect.appendChild(option);
    }
}

export function hideSaveStructureDialog() {
    document.getElementById('save-structure-dialog').style.display = 'none';
}

export function showFinalizeStructureDialog() {
    document.getElementById('finalize-structure-dialog').style.display = 'flex';
}

export function hideFinalizeStructureDialog() {
    document.getElementById('finalize-structure-dialog').style.display = 'none';
}

function editCustomBlock(blockId) {
    const customBlocks = JSON.parse(localStorage.getItem('minecraft_custom_blocks') || '[]');
    const blockToEdit = customBlocks.find(b => b.id === blockId);

    if (!blockToEdit) {
        alert('Could not find block to edit.');
        return;
    }

    showBlockCreationDialog();

    const dialog = document.getElementById('block-creation-dialog');
    dialog.dataset.editingBlockId = blockId;

    const title = dialog.querySelector('h2');
    if (title) title.textContent = 'Edit Block';
    
    const blockNameInput = document.getElementById('block-name');
    blockNameInput.value = blockToEdit.name;
    blockNameInput.disabled = true; // Prevent changing name/ID

    document.getElementById('is-slab-checkbox').checked = blockToEdit.isSlab || false;
    document.getElementById('block-category-select').value = blockToEdit.category || 'simple';

    const useSameTexture = !Object.keys(blockToEdit.textures).some(k => k !== 'all' && blockToEdit.textures[k]);
    document.getElementById('same-texture-toggle').checked = useSameTexture;

    // Trigger change event to update UI visibility
    document.getElementById('same-texture-toggle').dispatchEvent(new Event('change'));

    if (useSameTexture && blockToEdit.textures.all) {
        const preview = document.getElementById('preview-all');
        preview.style.backgroundImage = `url('${blockToEdit.textures.all}')`;
        preview.dataset.textureUrl = blockToEdit.textures.all;
    } else {
        const faces = ['top', 'bottom', 'front', 'back', 'left', 'right'];
        faces.forEach(face => {
            if (blockToEdit.textures[face]) {
                const preview = document.getElementById(`preview-${face}`);
                preview.style.backgroundImage = `url('${blockToEdit.textures[face]}')`;
                preview.dataset.textureUrl = blockToEdit.textures[face];
            }
        });
    }
}

// ---------- Texture Upload Handling ----------
export function setupTextureUploadInputs() {
    const uploadInputs = document.querySelectorAll('#block-creation-dialog .texture-file');
    
    uploadInputs.forEach(input => {
        input.removeEventListener('change', handleTextureUpload);
        input.addEventListener('change', handleTextureUpload);
    });
}

export function setupTextureUploadButtons() {
    // This function is obsolete and can be removed.
}

export function setupSingleTextureUploadButton() {
    // This function is now obsolete, merged into setupTextureUploadButtons.
    // But we keep it to avoid breaking calls from old code if any exist.
}

async function handleTextureUpload(event) {
    const fileInput = event.target;
    const face = fileInput.dataset.face;
    if (!face) return;

    if (!fileInput.files || !fileInput.files[0]) {
        // No file selected, do nothing. This happens if user cancels file dialog.
        return;
    }
    
    const previewElement = document.getElementById(`preview-${face}`);
    if (!previewElement) return;
    
    const file = fileInput.files[0];
    
    previewElement.innerHTML = '<div class="loading-texture">Uploading...</div>';
    
    try {
        let url;
        if (window.websim && window.websim.upload) {
            url = await window.websim.upload(file);
        } else {
            url = await readFileAsDataURL(file);
        }
        
        previewElement.innerHTML = '';
        previewElement.style.backgroundImage = `url('${url}')`;
        previewElement.setAttribute('data-texture-url', url);
        
        soundManager.play('click', { volume: 0.5 });
    } catch (error) {
        console.error(`Error uploading texture for ${face}:`, error);
        previewElement.innerHTML = '';
        alert(`Failed to upload texture for ${face}. Please try again.`);
    }
}

async function handleSingleTextureUpload(event) {
    // Obsolete - consolidated into handleTextureUpload
    handleTextureUpload(event);
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            resolve(e.target.result);
        };
        reader.onerror = function(e) {
            reject(new Error('Failed to read file'));
        };
        reader.readAsDataURL(file);
    });
}

function saveBlockData(blockData) {
    if (!blockData || !blockData.id) {
        console.error("Invalid block data to save.");
        return;
    }
    
    try {
        const customBlocks = JSON.parse(localStorage.getItem('minecraft_custom_blocks') || '[]');
        const existingIndex = customBlocks.findIndex(b => b.id === blockData.id);

        if (existingIndex > -1) {
            // Update existing, ensuring recipe is carried over if not edited
            if (blockData.recipe === null) {
                blockData.recipe = customBlocks[existingIndex].recipe;
            }
            customBlocks[existingIndex] = blockData;
        } else {
            // Add new
            if (blockData.recipe === null) {
                blockData.recipe = Array(9).fill(null);
            }
            customBlocks.push(blockData);
        }

        localStorage.setItem('minecraft_custom_blocks', JSON.stringify(customBlocks));
        alert(`Block "${blockData.name}" saved successfully!`);
    } catch (error) {
        console.error('Error saving custom block:', error);
        alert('Failed to save custom block. Please try again.');
    }
}

// ---------- Block Creation Functions ----------
function processAndSaveBlock(withRecipe) {
    const dialog = document.getElementById('block-creation-dialog');
    const editingBlockId = dialog.dataset.editingBlockId;
    const blockName = document.getElementById('block-name').value.trim();
    if (!blockName) {
        alert('Please enter a block name.');
        return false;
    }

    const isSlab = document.getElementById('is-slab-checkbox').checked;
    const category = document.getElementById('block-category-select').value;
    const useSameTexture = document.getElementById('same-texture-toggle').checked;
    const blockId = editingBlockId || 'custom_' + blockName.toLowerCase().replace(/\s+/g, '_');
    
    const textures = {};
    let hasAtLeastOne = false;

    if (useSameTexture) {
        const preview = document.getElementById('preview-all');
        const textureUrl = preview.getAttribute('data-texture-url');
        if (textureUrl) {
            textures['all'] = textureUrl; // A single texture for all sides
            hasAtLeastOne = true;
        }
    } else {
        const faces = ['top', 'bottom', 'front', 'back', 'left', 'right'];
        for (const face of faces) {
            const preview = document.getElementById(`preview-${face}`);
            const textureUrl = preview.getAttribute('data-texture-url');
            if (textureUrl) {
                textures[face] = textureUrl;
                hasAtLeastOne = true;
            }
        }
    }

    if (!hasAtLeastOne) {
        alert('Please upload at least one texture.');
        return false;
    }

    window.tempBlockData = {
        id: blockId,
        name: blockName,
        textures,
        isSlab,
        category,
        recipe: null // Placeholder for recipe if going to next step
    };

    if (withRecipe) {
        hideBlockCreationDialog();
        showCraftingRecipeCreator();
        if (editingBlockId) {
            const customBlocks = JSON.parse(localStorage.getItem('minecraft_custom_blocks') || '[]');
            const blockToEdit = customBlocks.find(b => b.id === editingBlockId);
            if (blockToEdit && blockToEdit.recipe) {
                populateRecipeCreator(blockToEdit.recipe);
            }
        }
    } else {
        // Save directly without recipe
        saveBlockData(window.tempBlockData);
        window.tempBlockData = null;
        hideBlockCreationDialog();
    }
    return true;
}

export async function saveBlockWithTextures() {
    // This function is now obsolete, replaced by processAndSaveBlock.
    // Kept for compatibility if it's called from somewhere else.
    processAndSaveBlock(true);
}

export async function saveSingleTextureBlock() {
    // This function is now obsolete, replaced by processAndSaveBlock.
    // Kept for compatibility.
    processAndSaveBlock(true);
}

export function saveCustomBlockWithRecipe() {
    if (!window.tempBlockData) {
        alert('No block data available.');
        return;
    }
    
    const recipe = [];
    for (let i = 0; i < 9; i++) {
        const slot = document.querySelector(`.crafting-recipe-slot[data-index="${i}"]`);
        const blockItem = slot.querySelector('.block-item');
        recipe.push(blockItem ? blockItem.getAttribute('data-block-type') : null);
    }
    
    window.tempBlockData.recipe = recipe;
    
    saveBlockData(window.tempBlockData);
    
    window.tempBlockData = null;
    
    hideCraftingRecipeCreator();
}

export function skipRecipe() {
    if (!window.tempBlockData) {
        alert('No block data available.');
        return;
    }
    
    saveBlockData(window.tempBlockData); // saveBlockData handles null recipe correctly
    
    window.tempBlockData = null;
    hideCraftingRecipeCreator();
}

function populateRecipeCreator(recipe) {
    if (!recipe || !Array.isArray(recipe) || recipe.length !== 9) return;

    for (let i = 0; i < 9; i++) {
        const slot = document.querySelector(`.crafting-recipe-slot[data-index="${i}"]`);
        if (!slot) continue;
        slot.innerHTML = ''; // Clear it first
        
        const blockType = recipe[i];
        if (blockType) {
            const blockItem = document.createElement('div');
            blockItem.className = 'block-item';
            
            const texture = getItemTexture(blockType);
            if (texture) {
                blockItem.style.backgroundImage = `url('${texture}')`;
            }

            blockItem.setAttribute('data-block-type', blockType);
            slot.appendChild(blockItem);
        }
    }
}

export function populateBlockSelector() {
    const selectorGrid = document.getElementById('block-selector-grid');
    if (!selectorGrid) return;
    
    selectorGrid.innerHTML = '';
    
    const standardBlocks = [
        'grass', 'dirt', 'stone', 'cobble', 'wood', 'birchwood', 
        'plank', 'birchplank', 'glass', 'sand', 'sandstone'
    ];
    
    standardBlocks.forEach(blockType => {
        const blockItem = document.createElement('div');
        blockItem.className = 'block-selector-item';
        
        const blockIcon = document.createElement('div');
        blockIcon.className = 'block-icon';
        blockIcon.style.backgroundImage = `url('${getItemTexture(blockType)}')`;
        
        blockItem.appendChild(blockIcon);
        blockItem.setAttribute('data-block-type', blockType);
        
        blockItem.addEventListener('click', () => {
            selectBlockForRecipe(blockType);
        });
        
        selectorGrid.appendChild(blockItem);
    });
    
    try {
        const customBlocks = JSON.parse(localStorage.getItem('minecraft_custom_blocks') || '[]');
        
        customBlocks.forEach(block => {
            const blockItem = document.createElement('div');
            blockItem.className = 'block-selector-item';
            
            const blockIcon = document.createElement('div');
            blockIcon.className = 'block-icon';
            
            const mainTexture = block.textures.all || block.textures.front || Object.values(block.textures)[0];
            blockIcon.style.backgroundImage = mainTexture ? `url('${mainTexture}')` : `url('dirt.png')`;
            
            blockItem.appendChild(blockIcon);
            blockItem.setAttribute('data-block-type', block.id);
            
            blockItem.addEventListener('click', () => {
                selectBlockForRecipe(block.id);
            });
            
            selectorGrid.appendChild(blockItem);
        });
    } catch (error) {
        console.error('Error loading custom blocks for recipes:', error);
    }
}

export function selectBlockForRecipe(blockType) {
    const selectedSlot = document.querySelector('.crafting-recipe-slot.selected');
    if (!selectedSlot) {
        alert('Please select a crafting slot first.');
        return;
    }
    
    selectedSlot.innerHTML = '';
    
    const blockItem = document.createElement('div');
    blockItem.className = 'block-item';
    blockItem.style.backgroundImage = `url('${getItemTexture(blockType)}')`;
    blockItem.setAttribute('data-block-type', blockType);
    
    selectedSlot.appendChild(blockItem);
    
    selectedSlot.classList.remove('selected');
}

export function loadCustomBlocks() {
    const availableModsList = document.getElementById('available-mods-list');
    if (!availableModsList) return;
    
    availableModsList.innerHTML = '';
    
    try {
        const customBlocks = JSON.parse(localStorage.getItem('minecraft_custom_blocks') || '[]');
        
        if (customBlocks.length === 0) {
            const noModsMessage = document.createElement('p');
            noModsMessage.className = 'no-mods-message';
            noModsMessage.textContent = 'No custom blocks available yet.';
            availableModsList.appendChild(noModsMessage);
        } else {
            customBlocks.forEach(block => {
                const modItem = document.createElement('div');
                modItem.className = 'mod-item';
                modItem.setAttribute('data-mod-id', block.id);
                modItem.setAttribute('data-mod-type', 'block');

                const modContent = document.createElement('div');
                modContent.className = 'mod-content';

                const modCheckbox = document.createElement('input');
                modCheckbox.type = 'checkbox';
                modCheckbox.className = 'mod-item-checkbox';
                
                const modIcon = document.createElement('div');
                modIcon.className = 'mod-item-icon';
                const mainTexture = block.textures.all || block.textures.front || Object.values(block.textures)[0];
                modIcon.style.backgroundImage = mainTexture ? `url('${mainTexture}')` : `url('dirt.png')`;
                
                const modDetails = document.createElement('div');
                modDetails.className = 'mod-item-details';
                
                const modName = document.createElement('div');
                modName.className = 'mod-item-name';
                modName.textContent = block.name;
                
                const modInfo = document.createElement('div');
                modInfo.className = 'mod-item-info';
                modInfo.textContent = `Type: Custom Block`;

                const biomeInfo = document.createElement('div');
                biomeInfo.className = 'mod-item-info';
                let biomesText = block.biomes ? block.biomes.join(', ') : 'Default';
                if (biomesText.includes('all')) biomesText = 'All Biomes';
                biomeInfo.textContent = `Biomes: ${biomesText}`;
                
                modDetails.appendChild(modName);
                modDetails.appendChild(modInfo);
                modDetails.appendChild(biomeInfo);

                modContent.appendChild(modCheckbox);
                modContent.appendChild(modIcon);
                modContent.appendChild(modDetails);
                
                const modButtonContainer = document.createElement('div');
                modButtonContainer.className = 'mod-button-container';

                const editBtn = document.createElement('button');
                editBtn.className = 'edit-btn';
                editBtn.textContent = 'Edit';
                editBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    editCustomBlock(block.id);
                });

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-btn';
                deleteBtn.textContent = 'Delete';
                deleteBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    if (confirm(`Are you sure you want to delete the "${block.name}" block?`)) {
                        deleteCustomBlock(block.id);
                        loadCustomBlocks();
                    }
                });
                
                modButtonContainer.appendChild(editBtn);
                modButtonContainer.appendChild(deleteBtn);

                modItem.appendChild(modContent);
                modItem.appendChild(modButtonContainer);
                
                availableModsList.appendChild(modItem);
            });
        }
        
        const customStructures = JSON.parse(localStorage.getItem('minecraft_custom_structures') || '[]');
        if (customStructures.length > 0) {
            if (availableModsList.querySelector('.no-mods-message')) {
                availableModsList.innerHTML = '';
            }

            const structuresHeader = document.createElement('h3');
            structuresHeader.textContent = "Custom Structures";
            structuresHeader.style.color = "#FFD700";
            structuresHeader.style.textAlign = 'center';
            structuresHeader.style.marginBottom = '10px';
            availableModsList.appendChild(structuresHeader);

            customStructures.forEach(structure => {
                const modItem = document.createElement('div');
                modItem.className = 'mod-item';
                modItem.setAttribute('data-mod-id', structure.name);
                modItem.setAttribute('data-mod-type', 'structure');

                const modContent = document.createElement('div');
                modContent.className = 'mod-content';

                const modCheckbox = document.createElement('input');
                modCheckbox.type = 'checkbox';
                modCheckbox.className = 'mod-item-checkbox';
                
                const modIcon = document.createElement('div');
                modIcon.className = 'mod-item-icon';
                modIcon.style.backgroundImage = `url('plank.png')`;
                
                const modDetails = document.createElement('div');
                modDetails.className = 'mod-item-details';
                
                const modName = document.createElement('div');
                modName.className = 'mod-item-name';
                modName.textContent = structure.name;
                
                const modInfo = document.createElement('div');
                modInfo.className = 'mod-item-info';
                modInfo.textContent = `Type: Custom Structure`;

                const biomeInfo = document.createElement('div');
                biomeInfo.className = 'mod-item-info';
                let biomesText = structure.biomes ? structure.biomes.join(', ') : 'Default';
                if (biomesText.includes('all')) biomesText = 'All Biomes';
                biomeInfo.textContent = `Biomes: ${biomesText}`;
                
                modDetails.appendChild(modName);
                modDetails.appendChild(modInfo);
                modDetails.appendChild(biomeInfo);

                modContent.appendChild(modCheckbox);
                modContent.appendChild(modIcon);
                modContent.appendChild(modDetails);
                
                const modButtonContainer = document.createElement('div');
                modButtonContainer.className = 'mod-button-container';

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-btn';
                deleteBtn.textContent = 'Delete';
                deleteBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    if (confirm(`Are you sure you want to delete the "${structure.name}" structure?`)) {
                        deleteCustomStructure(structure.name);
                        loadCustomBlocks();
                    }
                });
                
                modButtonContainer.appendChild(deleteBtn);

                modItem.appendChild(modContent);
                modItem.appendChild(modButtonContainer);
                
                availableModsList.appendChild(modItem);
            });
        }

    } catch (error) {
        console.error('Error loading custom mods:', error);
        const errorMessage = document.createElement('p');
        errorMessage.className = 'no-mods-message';
        errorMessage.textContent = 'Error loading custom mods. Please try again.';
        availableModsList.appendChild(errorMessage);
    }
}

export function deleteCustomBlock(blockId) {
    try {
        const customBlocks = JSON.parse(localStorage.getItem('minecraft_custom_blocks') || '[]');
        const updatedBlocks = customBlocks.filter(block => block.id !== blockId);
        localStorage.setItem('minecraft_custom_blocks', JSON.stringify(updatedBlocks));
    } catch (error) {
        console.error('Error deleting custom block:', error);
        alert('Failed to delete block. Please try again.');
    }
}

export function deleteCustomStructure(structureName) {
    try {
        const customStructures = JSON.parse(localStorage.getItem('minecraft_custom_structures') || '[]');
        const updatedStructures = customStructures.filter(structure => structure.name !== structureName);
        localStorage.setItem('minecraft_custom_structures', JSON.stringify(updatedStructures));
    } catch (error) {
        console.error('Error deleting custom structure:', error);
        alert('Failed to delete structure. Please try again.');
    }
}

export function getItemTexture(blockType) {
    switch (blockType) {
        case 'grass': return 'grass_top.png';
        case 'dirt': return 'dirt.png';
        case 'stone': return 'stone.png';
        case 'smoothstone': return 'smoothstone.png';
        case 'cobble': return 'cobbles.png';
        case 'wood': return 'logtopbottom.png';
        case 'leaves': return 'leaves.png';
        case 'plank': return 'plank.png';
        case 'craftingtable': return 'cftopbottom.png';
        case 'oakdoor': return 'door.png';
        case 'birchdoor': return 'birchdoor.png';
        case 'sand': return 'sand.png';
        case 'sandstone': return 'sandstone.png';
        case 'cacti': return 'cacti.png';
        case 'birchwood': return 'birchlogtopbottom.png';
        case 'birchleaves': return 'birchleaves.png';
        case 'birchplank': return 'birchplank.png';
        case 'stick': return 'stick.png';
        case 'furnace': return 'cobbles.png';
        case 'glass': return 'glass.png';
        case 'snow': return 'snow.png';
        case 'oakslab': return 'plank.png';
        case 'birchslab': return 'birchplank.png';
        default:
            try {
                const customBlocks = JSON.parse(localStorage.getItem('minecraft_custom_blocks') || '[]');
                const customBlock = customBlocks.find(block => block.id === blockType);
                if (customBlock && customBlock.textures) {
                    return customBlock.textures.front || Object.values(customBlock.textures)[0];
                }
            } catch (error) {
                console.error('Error getting custom block texture:', error);
            }
            return 'dirt.png';
    }
}

export function shareSelectedMods(blockIds) {
    alert('Sharing functionality has been disabled.');
}

// Pre-load the click sound to avoid delay
function playClickSound() {
    soundManager.play('click', { volume: 0.5 });
}

// ---------- Event Listeners Setup ----------
document.addEventListener('DOMContentLoaded', () => {
    // Cancel button in the new block creator
    document.getElementById('cancel-block-creation-btn').addEventListener('click', () => {
        playClickSound();
        hideBlockCreationDialog();
        showModsDialog();
    });

    // "Next" button in the new block creator
    document.getElementById('next-to-crafting-btn').addEventListener('click', () => {
        playClickSound();
        processAndSaveBlock(true);
    });

    // "Save without recipe" button in new block creator
    document.getElementById('save-block-no-recipe-btn').addEventListener('click', () => {
        playClickSound();
        processAndSaveBlock(false);
    });

    // Toggle for same/different textures
    document.getElementById('same-texture-toggle').addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        document.getElementById('single-texture-upload-container').style.display = isChecked ? 'block' : 'none';
        document.getElementById('multi-texture-upload-container').style.display = isChecked ? 'none' : 'grid';
    });

    // Close button for mod management screen
    document.getElementById('close-mods-screen-btn').addEventListener('click', function() {
        playClickSound();
        hideModsDialog();
    });
    
    // Create mod button
    document.getElementById('create-mod-btn').addEventListener('click', function() {
        playClickSound();
        // This button will now open a sub-dialog asking to create a block or structure.
        const creationTypeDialog = document.createElement('div');
        creationTypeDialog.id = 'creation-type-dialog';
        creationTypeDialog.className = 'minecraft-dialog';
        creationTypeDialog.style.display = 'flex';
        
        creationTypeDialog.innerHTML = `
            <div class="minecraft-dialog-content">
                <h2>What would you like to create?</h2>
                <div class="dialog-buttons">
                    <button id="block-creation-btn" class="menu-button button-java-old">Create Block</button>
                    <button id="structure-creation-btn" class="menu-button button-java-old">Create Structure</button>
                    <button id="cancel-creation-type-btn" class="menu-button button-java-old">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(creationTypeDialog);

        document.getElementById('block-creation-btn').addEventListener('click', () => {
            playClickSound();
            document.body.removeChild(creationTypeDialog);
            showBlockCreationDialog();
        });

        document.getElementById('structure-creation-btn').addEventListener('click', () => {
            playClickSound();
            document.body.removeChild(creationTypeDialog);
            showStructureSizeDialog();
        });

        document.getElementById('cancel-creation-type-btn').addEventListener('click', () => {
            playClickSound();
            document.body.removeChild(creationTypeDialog);
        });
    });
    
    // Save recipe button
    document.getElementById('save-recipe-btn').addEventListener('click', function() {
        playClickSound();
        saveCustomBlockWithRecipe();
    });
    
    // Skip recipe button
    document.getElementById('skip-recipe-btn').addEventListener('click', function() {
        playClickSound();
        skipRecipe();
    });

    // Cancel recipe button
    document.getElementById('cancel-recipe-btn').addEventListener('click', function() {
        playClickSound();
        hideCraftingRecipeCreator();
        // Depending on flow, decide where to go. Assuming back to block creator.
        showBlockCreationDialog();
    });

    // Share mods button
    document.getElementById('share-selected-mods-btn').addEventListener('click', function() {
        playClickSound();
        const selectedModItems = document.querySelectorAll('.mod-item-checkbox:checked');
        
        if (selectedModItems.length === 0) {
            alert('Please select at least one item to share.');
            return;
        }
        
        const selectedMods = Array.from(selectedModItems).map(checkbox => {
            const modItem = checkbox.closest('.mod-item');
            return {
                id: modItem.getAttribute('data-mod-id'),
                type: modItem.getAttribute('data-mod-type')
            };
        });
        
        shareSelectedMods(selectedMods);
    });
});
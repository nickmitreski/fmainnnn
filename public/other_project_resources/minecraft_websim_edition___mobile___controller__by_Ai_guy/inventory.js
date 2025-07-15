import { TOOL_DURABILITIES } from './pickaxes.js'; // Import TOOL_DURABILITIES
import { soundManager } from './utils.js';

export class Inventory {
    constructor() {
        this.mainSlots = new Array(27).fill().map(() => ({ type: null, count: 0 }));
        this.slots = new Array(9).fill().map(() => ({ type: null, count: 0 }));
        this.isCreative = false;
        this.creativeTab = 1;
        this.creativeItemsPerPage = 54;
        
        this.craftingSlots = new Array(4).fill().map(() => ({ type: null, count: 0 }));
        this.craftingResult = { type: null, count: 0 };
        this.tableCraftingSlots = new Array(9).fill().map(() => ({ type: null, count: 0 }));
        this.tableCraftingResult = { type: null, count: 0 };

        this.furnaceInput = { type: null, count: 0 };
        this.furnaceFuel = { type: null, count: 0 };
        this.furnaceResult = { type: null, count: 0 };

        this.furnaceActive = false;
        this.smeltProgress = 0;
        this.maxSmeltTime = 10;
        this.burnTimeLeft = 0;
        this.maxBurnTime = 0;

        this.currentFurnacePos = null;

        this.selectedSlot = 0;
        this.maxStackSize = 64;
        this.isDragging = false;
        this.draggedItem = null;
        this.draggedSource = null;
        this.draggedButton = 0;
        this.gamepadHeldItem = null;

        this.preloadBlockTextures();

        this.createHotbarUI();

        this.createInventoryUI();

        this.createCraftingTableUI();

        this.createFurnaceUI();

        this.createChestUI();

        this.setupEventListeners();

        this.setupCraftingRecipes();
        
        this.createHeldItemDisplay = function() {};
        this.toolBreakSound = new Audio('assets/tool_break.mp3'); // Preload break sound
        this.toolBreakSound.load();
        this.smeltingSound = new Audio('click.mp3');
        this.smeltingSound.load();
        this.itemNameDisplayTimeout = null;
    }

    isInventoryOpen(returnScreenId = false) {
        const inventoryScreen = document.getElementById('inventory-screen');
        const craftingTableScreen = document.getElementById('crafting-table-screen');
        const furnaceScreen = document.getElementById('furnace-screen');
        const chestScreen = document.getElementById('chest-screen');

        if (inventoryScreen && inventoryScreen.style.display === 'flex') {
            return returnScreenId ? 'inventory-screen' : true;
        }
        if (craftingTableScreen && craftingTableScreen.style.display === 'flex') {
            return returnScreenId ? 'crafting-table-screen' : true;
        }
        if (furnaceScreen && furnaceScreen.style.display === 'flex') {
            return returnScreenId ? 'furnace-screen' : true;
        }
        if (chestScreen && chestScreen.style.display === 'flex') {
            return returnScreenId ? 'chest-screen' : true;
        }

        return returnScreenId ? null : false;
    }

    closeAllScreens() {
        this.closeInventory();
        this.closeCraftingTable();
        this.closeFurnace();
        this.closeChest();
    }

    setupCloseButton(buttonId, closeFunction) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.addEventListener('click', () => {
                closeFunction.call(this);
                if (window.controls && !window.controls.isLocked) {
                    // Short timeout to allow browser to process UI changes before locking
                    setTimeout(() => {
                        try {
                            window.controls.lock();
                        } catch (e) {
                            // This can fail if the user clicks away, which is fine.
                        }
                    }, 100);
                }
            });
        }
    }

    setupMobileEventListeners() {
        if (!document.body.classList.contains('is-mobile')) return;

        const allSlots = document.querySelectorAll('.inventory-slot, .hotbar-slot, .crafting-slot, .crafting-result, .chest-slot');
        const draggedItemEl = document.getElementById('dragged-item');

        allSlots.forEach(slot => {
            let touchStartInfo = null;
            let moveHandler = null;
            let endHandler = null;
            let isDraggingStarted = false;

            slot.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const touch = e.touches[0];
                touchStartInfo = { time: Date.now(), x: touch.clientX, y: touch.clientY, moved: false };
                isDraggingStarted = false;

                moveHandler = (moveEvent) => {
                    if (!touchStartInfo) return;
                    const moveTouch = moveEvent.touches[0];
                    const distance = Math.hypot(moveTouch.clientX - touchStartInfo.x, moveTouch.clientY - touchStartInfo.y);
                    touchStartInfo.moved = distance > 5; // A small move registers as moved

                    if (distance > 15 && !this.isDragging) {
                        isDraggingStarted = true;
                        const slotType = slot.getAttribute('data-slot');
                        let itemData = this.getSlotReference(slotType);

                        if (itemData && itemData.type) {
                            this.isDragging = true;
                            this.draggedItem = { ...itemData };
                            this.draggedSource = slotType;

                            if (slotType.includes('result')) {
                                if (slotType === 'craft-result') this.takeFromCraftingResult();
                                else if (slotType === 'table-craft-result') this.takeFromTableCraftingResult();
                                else { itemData.type = null; itemData.count = 0; }
                            } else {
                                itemData.type = null;
                                itemData.count = 0;
                                delete itemData.durability;
                                delete itemData.maxDurability;
                            }

                            this.updateAllDisplays();
                            draggedItemEl.style.backgroundImage = `url('${this.getItemTexture(this.draggedItem.type)}')`;
                            draggedItemEl.innerHTML = this.draggedItem.count > 1 ? `<div class="item-count">${this.draggedItem.count}</div>` : '';
                            draggedItemEl.style.display = 'block';
                        }
                    }

                    if (this.isDragging) {
                        draggedItemEl.style.left = `${moveTouch.clientX - 16}px`;
                        draggedItemEl.style.top = `${moveTouch.clientY - 16}px`;
                    }
                };

                endHandler = (endEvent) => {
                    document.removeEventListener('touchmove', moveHandler);
                    document.removeEventListener('touchend', endHandler);

                    if (!touchStartInfo) return;

                    if (this.isDragging) {
                        const touch = endEvent.changedTouches[0];
                        const dropTargetEl = document.elementFromPoint(touch.clientX, touch.clientY);
                        const dropSlot = dropTargetEl ? dropTargetEl.closest('.hotbar-slot, .inventory-slot, .crafting-slot, .crafting-result, .chest-slot') : null;

                        if (dropSlot) {
                            this.completeItemTransfer(dropSlot.getAttribute('data-slot'));
                        } else {
                            this.returnItemToSource();
                        }
                        this.isDragging = false;
                        this.draggedItem = null;
                        draggedItemEl.style.display = 'none';
                    } else if (!touchStartInfo.moved) {
                        const duration = Date.now() - touchStartInfo.time;
                        if (duration < 250) {
                            const slotType = slot.getAttribute('data-slot');
                            if (slotType && slotType.startsWith('hotbar-')) {
                                this.selectSlot(parseInt(slotType.split('-')[1]));
                            }
                        }
                    }
                    touchStartInfo = null;
                };

                document.addEventListener('touchmove', moveHandler, { passive: false });
                document.addEventListener('touchend', endHandler, { passive: false });
            }, { passive: false });
        });
    }

    preloadBlockTextures() {
        this.textureCache = {};
        
        const blockTypes = [
            'grass', 'dirt', 'stone', 'smoothstone', 'cobble', 
            'wood', 'birchwood', 'leaves', 'birchleaves',
            'plank', 'birchplank', 'craftingtable', 'door',
            'sand', 'sandstone', 'cacti', 'furnace', 'glass',
            'snow', 'stick', 'oakslab', 'birchslab', 'chest',
            'seeds', 'wheat', 'haybale', 'newglass',
            'oaksapling', 'birchsapling', 
            'sprucewood', 'spruceleaves', 'spruceplank', 'sprucesapling', 'spruceslab',
            'woodaxe', 'stoneaxe', // Added axes
            'wool', 'string',
            'cherrywood', 'cherryleaves', 'cherryplank', 'cherrysapling', 'cherryslab',
            'rose', 'dandelion', 'ladder',
            'oak_stairs', 'birch_stairs', 'spruce_stairs', 'cherry_stairs', 'cobble_stairs', 'stone_stairs'
        ];
        
        blockTypes.forEach(blockType => {
            const imgUrl = this.getItemTexture(blockType);
            if (imgUrl) {
                const img = new Image();
                img.src = imgUrl;
                this.textureCache[blockType] = img;
            }
        });
    }

    createHotbarUI() {
        const hotbar = document.getElementById('hotbar');
        hotbar.innerHTML = '';

        for (let i = 0; i < 9; i++) {
            const slot = document.createElement('div');
            slot.className = 'hotbar-slot';
            slot.id = `slot-${i}`;
            slot.setAttribute('data-slot', `hotbar-${i}`);
            if (i === this.selectedSlot) {
                slot.classList.add('selected');
            }

            const item = document.createElement('div');
            item.className = 'slot-item';
            item.id = `item-${i}`;

            const count = document.createElement('div');
            count.className = 'slot-count';
            count.id = `count-${i}`;

            // Durability bar elements will be added/updated in updateSlotUI
            slot.appendChild(item);
            slot.appendChild(count);
            hotbar.appendChild(slot);
        }
    }

    createInventoryUI() {
        const mainInventory = document.querySelector('#inventory-screen .main-inventory');
        mainInventory.innerHTML = '';

        const slotCount = this.isCreative ? 54 : 27;

        for (let i = 0; i < slotCount; i++) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            slot.setAttribute('data-slot', `inventory-${i}`);
            mainInventory.appendChild(slot);
        }

        const inventoryHotbar = document.getElementById('inventory-hotbar');
        inventoryHotbar.innerHTML = '';

        for (let i = 0; i < 9; i++) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            slot.setAttribute('data-slot', `hotbar-${i}`);
            if (i === this.selectedSlot) {
                slot.classList.add('selected');
            }
            inventoryHotbar.appendChild(slot);
        }

        for (let i = 0; i < 4; i++) {
            const craftingSlot = document.querySelector(`[data-slot="craft-${i}"]`);
            if (craftingSlot) {
                craftingSlot.innerHTML = '';
            }
        }

        const resultSlot = document.querySelector('[data-slot="craft-result"]');
        if (resultSlot) {
            resultSlot.innerHTML = '';
        }

        this.updateAllDisplays();
    }

    createCraftingTableUI() {
        const craftingTableInventory = document.getElementById('crafting-table-inventory');
        if (craftingTableInventory) {
            craftingTableInventory.innerHTML = '';

            const slotCount = this.isCreative ? 54 : 27;
            for (let i = 0; i < slotCount; i++) {
                const slot = document.createElement('div');
                slot.className = 'inventory-slot';
                slot.setAttribute('data-slot', `inventory-${i}`);
                craftingTableInventory.appendChild(slot);
            }
        }

        const craftingTableHotbar = document.getElementById('crafting-table-hotbar');
        if (craftingTableHotbar) {
            craftingTableHotbar.innerHTML = '';

            for (let i = 0; i < 9; i++) {
                const slot = document.createElement('div');
                slot.className = 'inventory-slot';
                slot.setAttribute('data-slot', `hotbar-${i}`);
                if (i === this.selectedSlot) {
                    slot.classList.add('selected');
                }
                craftingTableHotbar.appendChild(slot);
            }
        }
    }

    createFurnaceUI() {
        const furnaceInputSlot = document.querySelector('[data-slot="furnace-input"]');
        furnaceInputSlot.innerHTML = '';

        const furnaceFuelSlot = document.querySelector('[data-slot="furnace-fuel"]');
        furnaceFuelSlot.innerHTML = '';

        const furnaceResultSlot = document.querySelector('[data-slot="furnace-result"]');
        furnaceResultSlot.innerHTML = '';

        const furnaceInventory = document.getElementById('furnace-inventory');
        if (furnaceInventory) {
            furnaceInventory.innerHTML = '';
            
            const slotCount = this.isCreative ? 54 : 27;
            for (let i = 0; i < slotCount; i++) {
                const slot = document.createElement('div');
                slot.className = 'inventory-slot';
                slot.setAttribute('data-slot', `inventory-${i}`);
                furnaceInventory.appendChild(slot);
            }
        }

        const furnaceHotbar = document.getElementById('furnace-hotbar');
        if (furnaceHotbar) {
            furnaceHotbar.innerHTML = '';

            for (let i = 0; i < 9; i++) {
                const slot = document.createElement('div');
                slot.className = 'inventory-slot';
                slot.setAttribute('data-slot', `hotbar-${i}`);
                if (i === this.selectedSlot) {
                    slot.classList.add('selected');
                }
                furnaceHotbar.appendChild(slot);
            }
        }

        const fireIcon = document.querySelector('.furnace-fire');
        if (fireIcon) {
            if (!document.querySelector('.furnace-timer')) {
                const timerElement = document.createElement('div');
                timerElement.className = 'furnace-timer';
                timerElement.textContent = '0.0s';
                fireIcon.parentNode.insertBefore(timerElement, fireIcon.nextSibling);
            }
        }

        this.furnaceInput = { type: null, count: 0 };
        this.furnaceFuel = { type: null, count: 0 };
        this.furnaceResult = { type: null, count: 0 };

        this.updateFurnaceDisplay();
    }

    createChestUI() {
        const chestInventory = document.getElementById('chest-inventory');
        if (chestInventory) {
            chestInventory.innerHTML = '';

            for (let i = 0; i < 27; i++) { // Chests are always 27 slots
                const slot = document.createElement('div');
                slot.className = 'chest-slot';
                slot.setAttribute('data-slot', `chest-${i}`);
                chestInventory.appendChild(slot);
            }
        }

        const chestPlayerInventory = document.getElementById('chest-player-inventory');
        if (chestPlayerInventory) {
            chestPlayerInventory.innerHTML = '';
            const slotCount = this.isCreative ? 54 : 27;
            for (let i = 0; i < slotCount; i++) {
                const slot = document.createElement('div');
                slot.className = 'inventory-slot';
                slot.setAttribute('data-slot', `inventory-${i}`);
                chestPlayerInventory.appendChild(slot);
            }
        }

        const chestPlayerHotbar = document.getElementById('chest-player-hotbar');
        if (chestPlayerHotbar) {
            chestPlayerHotbar.innerHTML = '';

            for (let i = 0; i < 9; i++) {
                const slot = document.createElement('div');
                slot.className = 'inventory-slot';
                slot.setAttribute('data-slot', `hotbar-${i}`);
                if (i === this.selectedSlot) {
                    slot.classList.add('selected');
                }
                chestPlayerHotbar.appendChild(slot);
            }
        }
    }

    setupEventListeners() {
        window.addEventListener('wheel', (event) => {
            if (event.deltaY > 0) {
                this.selectSlot((this.selectedSlot + 1) % 9);
            } else {
                this.selectSlot((this.selectedSlot - 1 + 9) % 9);
            }
        });

        window.addEventListener('keydown', (event) => {
            const keyNum = parseInt(event.key);
            if (keyNum >= 1 && keyNum <= 9) {
                this.selectSlot(keyNum - 1);
            }

            if (event.key === 'Escape') {
                this.closeInventory();
                this.closeCraftingTable();
                this.closeFurnace();
                this.closeChest();
            }
        });

        this.setupDragAndDrop();

        this.setupCloseButton('inventory-close-btn', this.closeInventory);
        this.setupCloseButton('crafting-table-close-btn', this.closeCraftingTable);
        this.setupCloseButton('furnace-close-btn', this.closeFurnace);
        this.setupCloseButton('chest-close-btn', this.closeChest);

        const creativeTabs = document.querySelectorAll('.creative-tab-button');
        creativeTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabNumber = parseInt(e.target.dataset.tab, 10);
                this.setCreativeTab(tabNumber);
            });
        });

        this.setupMobileEventListeners();
    }

    setupDragAndDrop() {
        const draggedItemEl = document.getElementById('dragged-item');
    
        // This listener handles moving the dragged item visualization
        document.addEventListener('mousemove', (e) => {
            if (this.isDragging && draggedItemEl) {
                draggedItemEl.style.left = `${e.clientX - 16}px`;
                draggedItemEl.style.top = `${e.clientY - 16}px`;
            }
        });
    
        // Delegated mousedown handler for all inventory screens
        document.body.addEventListener('mousedown', (e) => {
            if (!this.isInventoryOpen() || this.isMobile) return;
            const slot = e.target.closest('.inventory-slot, .hotbar-slot, .crafting-slot, .crafting-result, .chest-slot');
            if (!slot) return;
    
            const isRightClick = e.button === 2;
            this.draggedButton = e.button;
    
            if (e.button !== 0 && e.button !== 2) return;
    
            const slotType = slot.getAttribute('data-slot');
            if (!slotType) return;
    
            let itemData = this.getSlotReference(slotType);
    
            if (this.isCreative) {
                const isHotbarSlot = slotType.startsWith('hotbar-');

                if (isHotbarSlot) {
                    // Dragging from hotbar in creative: MOVE the item, don't clone.
                    if (itemData && itemData.type) {
                        this.isDragging = true;
                        this.draggedItem = { ...itemData }; // take the whole stack
                        this.draggedSource = slotType; // remember the source
                        
                        // Clear the source slot
                        itemData.type = null;
                        itemData.count = 0;
                        delete itemData.durability;
                        delete itemData.maxDurability;
                    }
                } else {
                    // Dragging from creative grid or another non-hotbar slot: CLONE the item.
                    if (itemData && itemData.type) {
                        this.isDragging = true;
                        this.draggedItem = { ...itemData, count: this.isToolWithDurability(itemData.type) ? 1 : this.maxStackSize };
                        if (this.isToolWithDurability(this.draggedItem.type)) {
                            this.draggedItem.durability = TOOL_DURABILITIES[this.draggedItem.type];
                            this.draggedItem.maxDurability = TOOL_DURABILITIES[this.draggedItem.type];
                        }
                        this.draggedSource = 'creative'; // Special source for cloning
                    }
                }
            } else { // Survival mode logic
                if (itemData && itemData.type && itemData.count > 0) {
                    if ((slotType.includes('result')) && !isRightClick) {
                        const itemToAdd = { ...itemData };
                        
                        if (slotType === 'craft-result') this.takeFromCraftingResult();
                        else if (slotType === 'table-craft-result') this.takeFromTableCraftingResult();
                        else if (slotType === 'furnace-result') { itemData.type = null; itemData.count = 0; }
                        
                        if (this.addItem(itemToAdd.type, itemToAdd.count)) {
                            this.updateAllDisplays(); this.updateFurnaceDisplay();
                            return;
                        }
                        this.isDragging = true;
                        this.draggedItem = itemToAdd; // itemToAdd is { type, count } from recipe

                        // Ensure durability is set if it's a tool being dragged from crafting
                        if (this.isToolWithDurability(this.draggedItem.type) && this.draggedItem.count === 1) {
                            this.draggedItem.durability = TOOL_DURABILITIES[this.draggedItem.type];
                            this.draggedItem.maxDurability = TOOL_DURABILITIES[this.draggedItem.type];
                        }
                    } else {
                        this.isDragging = true;
                        if (isRightClick) {
                            const amountToPickUp = 1;
                            this.draggedItem = { ...itemData, count: amountToPickUp };
                            itemData.count -= amountToPickUp;
                            if (itemData.count <= 0) {
                                itemData.type = null;
                                delete itemData.durability;
                                delete itemData.maxDurability;
                            }
                        } else {
                            this.draggedItem = { ...itemData };
                            itemData.type = null;
                            itemData.count = 0;
                            delete itemData.durability;
                            delete itemData.maxDurability;
                        }
                    }
                    this.draggedSource = slotType;
                }
            }
            
            if (this.isDragging) {
                draggedItemEl.style.backgroundImage = `url('${this.getItemTexture(this.draggedItem.type)}')`;
                draggedItemEl.innerHTML = this.draggedItem.count > 1 ? `<div class="item-count">${this.draggedItem.count}</div>` : '';
                draggedItemEl.style.display = 'block';
                
                draggedItemEl.style.left = `${e.clientX - 16}px`;
                draggedItemEl.style.top = `${e.clientY - 16}px`;
                
                this.updateAllDisplays();
                e.preventDefault();
            }
        });
    
        // Delegated mouseup handler
        document.body.addEventListener('mouseup', (e) => {
            if (!this.isDragging || !this.draggedItem || this.isMobile) return;
            
            const targetSlotEl = e.target.closest('.inventory-slot, .hotbar-slot, .crafting-slot, .crafting-result, .chest-slot');
    
            if (targetSlotEl) {
                const targetSlotType = targetSlotEl.getAttribute('data-slot');
                if (this.isCreative) {
                     const targetSlotRef = this.getSlotReference(targetSlotType);
                     if (targetSlotRef && !targetSlotType.includes('result')) {
                        const isClearing = e.button === 2;
                        if(isClearing) {
                            targetSlotRef.type = null;
                            targetSlotRef.count = 0;
                            delete targetSlotRef.durability;
                            delete targetSlotRef.maxDurability;
                        } else {
                            Object.assign(targetSlotRef, this.draggedItem);
                        }
                     }
                } else {
                    if (this.draggedButton === 2) {
                        this.completeRightClickTransfer(targetSlotType);
                    } else {
                        this.completeItemTransfer(targetSlotType);
                    }
                }
            } else {
                if (this.isCreative) {
                    // In creative mode, dropping an item outside the inventory deletes it.
                    this.draggedItem = null;
                } else if (!e.target.closest('.inventory-overlay')) {
                    if (this._onItemDrop) this._onItemDrop(this.draggedItem);
                } else {
                    this.returnItemToSource();
                }
            }
    
            // Reset drag state
            this.isDragging = false;
            this.draggedItem = null;
            this.draggedSource = null;
            this.draggedButton = 0;
            draggedItemEl.style.display = 'none';
    
            this.updateAllDisplays();
            e.preventDefault();
        });
        
        document.addEventListener('contextmenu', (e) => {
            if (e.target.closest('.inventory-slot, .hotbar-slot, .crafting-slot, .crafting-result, [data-slot^="furnace-"], .chest-slot')) {
                e.preventDefault();
            }
        });
    }

    completeRightClickTransfer(targetSlotType) {
        if (!this.draggedItem) return;

        let targetItem;
        let targetArray;
        let targetIndex;
        let isChestSlot = false;

        if (targetSlotType.startsWith('hotbar-')) {
            targetArray = this.slots;
            targetIndex = parseInt(targetSlotType.split('-')[1]);
        } else if (targetSlotType.startsWith('inventory-')) {
            targetArray = this.mainSlots;
            targetIndex = parseInt(targetSlotType.split('-')[1]);
        } else if (targetSlotType.startsWith('craft-') && targetSlotType !== 'craft-result') {
            targetArray = this.craftingSlots;
            targetIndex = parseInt(targetSlotType.split('-')[1]);
        } else if (targetSlotType.startsWith('table-craft-') && targetSlotType !== 'table-craft-result') {
            targetArray = this.tableCraftingSlots;
            targetIndex = parseInt(targetSlotType.split('-')[2]);
        } else if (targetSlotType === 'craft-result' || targetSlotType === 'table-craft-result' || targetSlotType === 'furnace-result') {
            this.returnItemToSource();
            return;
        } else if (targetSlotType === 'furnace-input') {
            if (!this.getSmeltingRecipe(this.draggedItem.type)) {
                this.returnItemToSource();
                return;
            }
            targetItem = this.furnaceInput; // Directly assign
        } else if (targetSlotType === 'furnace-fuel') {
            if (!this.fuelTypes[this.draggedItem.type]) {
                this.returnItemToSource();
                return;
            }
            targetItem = this.furnaceFuel; // Directly assign
        } else if (targetSlotType.startsWith('chest-') && this.currentChestData) {
            targetArray = this.currentChestData.inventory;
            targetIndex = parseInt(targetSlotType.split('-')[1]);
            isChestSlot = true;
        }
         else {
            this.returnItemToSource();
            return;
        }

        let targetItemRef;
        if (targetArray && targetIndex !== undefined) {
            targetItemRef = targetArray[targetIndex];
        } else if (targetSlotType.startsWith('furnace-')) {
             // targetItem already assigned for furnace slots
        } else {
            this.returnItemToSource();
            return;
        }
        if (!targetItemRef && targetItem) targetItemRef = targetItem; // For furnace slots


        if (!targetItemRef) { // Should not happen if logic above is correct
            this.returnItemToSource();
            return;
        }

        if (!targetItemRef.type) { // Target slot is empty
            targetItemRef.type = this.draggedItem.type;
            targetItemRef.count = 1;
            if (this.isToolWithDurability(this.draggedItem.type)) {
                targetItemRef.durability = this.draggedItem.durability;
                targetItemRef.maxDurability = this.draggedItem.maxDurability;
            }
            this.draggedItem.count--;
        }
        else if (targetItemRef.type === this.draggedItem.type && targetItemRef.count < this.maxStackSize && !this.isToolWithDurability(targetItemRef.type)) { // Target has same, stackable item
            const spaceLeft = this.maxStackSize - targetItemRef.count;
            const amountToAdd = Math.min(spaceLeft, this.draggedItem.count);

            targetItemRef.count += amountToAdd;
            this.draggedItem.count -= amountToAdd;

            if (this.draggedItem.count <= 0) { // Changed from > 0 to <= 0
                this.draggedItem = null; // Clear draggedItem if fully transferred
            } else {
                 // If items remain, they should be returned to source by the global mouseup if not placed.
                 // No explicit returnItemToSource() here, as some might have been transferred.
            }
        }
        else { // Target has different item, or is a tool, or stack is full - swap
            // The user wants items to swap positions, not replace and pick up.
            const itemFromTarget = { ...targetItemRef }; // Make a copy of the item in the target slot
            
            // Place the dragged item into the target slot
            Object.assign(targetItemRef, this.draggedItem);
            
            // Now, find the original source slot and place the item from the target slot there.
            let sourceItemRef;
            if (this.draggedSource.startsWith('hotbar-')) {
                sourceItemRef = this.slots[parseInt(this.draggedSource.split('-')[1])];
            } else if (this.draggedSource.startsWith('inventory-')) {
                sourceItemRef = this.mainSlots[parseInt(this.draggedSource.split('-')[1])];
            } else if (this.draggedSource.startsWith('craft-')) {
                sourceItemRef = this.craftingSlots[parseInt(this.draggedSource.split('-')[1])];
            } else if (this.draggedSource.startsWith('table-craft-')) {
                sourceItemRef = this.tableCraftingSlots[parseInt(this.draggedSource.split('-')[2])];
            } else if (this.draggedSource.startsWith('chest-') && this.currentChestData) {
                sourceItemRef = this.currentChestData.inventory[parseInt(this.draggedSource.split('-')[1])];
            } else if (this.draggedSource === 'furnace-input') {
                sourceItemRef = this.furnaceInput;
            } else if (this.draggedSource === 'furnace-fuel') {
                sourceItemRef = this.furnaceFuel;
            }

            if (sourceItemRef) {
                // The source slot was emptied when dragging started. Now fill it with the item from the target.
                Object.assign(sourceItemRef, itemFromTarget);
                this.draggedItem = null; // Clear the item on the cursor.
            } else {
                // Fallback to original behavior if source slot couldn't be determined
                this.draggedItem = itemFromTarget.type ? itemFromTarget : null;
            }
        }
        if (isChestSlot) {
            this.updateChestDisplay();
        } else {
            this.updateAllDisplays(); // General update
            this.updateFurnaceDisplay(); // If it's a furnace interaction
        }

        this.checkCraftingRecipe();
        this.checkTableCraftingRecipe();
        this.checkContinueSmelting();
        this.updateQuickCraftSidebar();

        if (document.getElementById('crafting-table-screen').style.display === 'flex') {
            this.updateQuickCraftSidebar();
        }
    }

    takeFromCraftingResult() {
        if (!this.craftingResult.type || this.craftingResult.count <= 0) return;
        
        for (let i = 0; i < this.craftingSlots.length; i++) {
            if (this.craftingSlots[i].type && this.craftingSlots[i].count > 0) {
                this.craftingSlots[i].count--;
                if (this.craftingSlots[i].count <= 0) {
                    this.craftingSlots[i].type = null;
                }
            }
        }
        
        this.checkCraftingRecipe();
        this.updateQuickCraftSidebar();
    }

    takeFromTableCraftingResult() {
        if (!this.tableCraftingResult.type || this.tableCraftingResult.count <= 0) return;
        
        for (let i = 0; i < this.tableCraftingSlots.length; i++) {
            if (this.tableCraftingSlots[i].type && this.tableCraftingSlots[i].count > 0) {
                this.tableCraftingSlots[i].count--;
                if (this.tableCraftingSlots[i].count <= 0) {
                    this.tableCraftingSlots[i].type = null;
                }
            }
        }
        
        this.checkTableCraftingRecipe();
        
        this.updateQuickCraftSidebar();
    }

    addItem(type, count = 1) {
        if (!type) return false;
        if (typeof type === 'object' && type !== null) {
            // called with an item object e.g. {type: 'wood', count: 4}
            if (!type.type || !type.count) return false;
            return this.addItemToFirstAvailableSlot(type);
        } else if (typeof type === 'string') {
            // called with type and optional count
            return this.addItemToFirstAvailableSlot({ type, count });
        }
        return false;
    }

    completeItemTransfer(targetSlotType) {
        if (!this.draggedItem) return;

        let targetItem;
        let targetArray;
        let targetIndex;
        let isChestSlot = false;

        if (targetSlotType.startsWith('hotbar-')) {
            targetArray = this.slots;
            targetIndex = parseInt(targetSlotType.split('-')[1]);
        } else if (targetSlotType.startsWith('inventory-')) {
            targetArray = this.mainSlots;
            targetIndex = parseInt(targetSlotType.split('-')[1]);
        } else if (targetSlotType.startsWith('craft-') && targetSlotType !== 'craft-result') {
            targetArray = this.craftingSlots;
            targetIndex = parseInt(targetSlotType.split('-')[1]);
        } else if (targetSlotType.startsWith('table-craft-') && targetSlotType !== 'table-craft-result') {
            targetArray = this.tableCraftingSlots;
            targetIndex = parseInt(targetSlotType.split('-')[2]);
        } else if (targetSlotType.startsWith('chest-') && this.currentChestData) {
            targetArray = this.currentChestData.inventory;
            targetIndex = parseInt(targetSlotType.split('-')[1]);
            isChestSlot = true;
        }
         else if (targetSlotType === 'craft-result' || targetSlotType === 'table-craft-result' || targetSlotType === 'furnace-result') {
            this.returnItemToSource();
            return;
        } else if (targetSlotType === 'furnace-input') {
            if (!this.getSmeltingRecipe(this.draggedItem.type)) {
                this.returnItemToSource();
                return;
            }
            targetItem = this.furnaceInput; // Directly assign
        } else if (targetSlotType === 'furnace-fuel') {
            if (!this.fuelTypes[this.draggedItem.type]) {
                this.returnItemToSource();
                return;
            }
            targetItem = this.furnaceFuel; // Directly assign
        } else {
            this.returnItemToSource();
            return;
        }
        
        let targetItemRef;
        if (targetArray && targetIndex !== undefined) {
            targetItemRef = targetArray[targetIndex];
        } else if (targetSlotType.startsWith('furnace-')) {
             // targetItem already assigned for furnace slots
        } else {
            this.returnItemToSource();
            return;
        }
        if (!targetItemRef && targetItem) targetItemRef = targetItem; // For furnace slots


        if (!targetItemRef) {
            this.returnItemToSource();
            return;
        }

        if (!targetItemRef.type) { // Target slot is empty
            Object.assign(targetItemRef, this.draggedItem);
            this.draggedItem = null;
        }
        else if (targetItemRef.type === this.draggedItem.type && targetItemRef.count < this.maxStackSize && !this.isToolWithDurability(targetItemRef.type)) { // Target has same stackable item
            const spaceLeft = this.maxStackSize - targetItemRef.count;
            const amountToAdd = Math.min(spaceLeft, this.draggedItem.count);

            targetItemRef.count += amountToAdd;
            this.draggedItem.count -= amountToAdd;

            if (this.draggedItem.count <= 0) { // Changed from > 0 to <= 0
                this.draggedItem = null; // Clear draggedItem if fully transferred
            } else {
                 // If items remain, they should be returned to source by the global mouseup if not placed.
                 // No explicit returnItemToSource() here, as some might have been transferred.
            }
        }
        else { // Target has different item, or is a tool, or stack is full - swap
            // The user wants items to swap positions, not replace and pick up.
            const itemFromTarget = { ...targetItemRef }; // Make a copy of the item in the target slot
            
            // Place the dragged item into the target slot
            Object.assign(targetItemRef, this.draggedItem);
            
            // Now, find the original source slot and place the item from the target slot there.
            let sourceItemRef;
            if (this.draggedSource.startsWith('hotbar-')) {
                sourceItemRef = this.slots[parseInt(this.draggedSource.split('-')[1])];
            } else if (this.draggedSource.startsWith('inventory-')) {
                sourceItemRef = this.mainSlots[parseInt(this.draggedSource.split('-')[1])];
            } else if (this.draggedSource.startsWith('craft-')) {
                sourceItemRef = this.craftingSlots[parseInt(this.draggedSource.split('-')[1])];
            } else if (this.draggedSource.startsWith('table-craft-')) {
                sourceItemRef = this.tableCraftingSlots[parseInt(this.draggedSource.split('-')[2])];
            } else if (this.draggedSource.startsWith('chest-') && this.currentChestData) {
                sourceItemRef = this.currentChestData.inventory[parseInt(this.draggedSource.split('-')[1])];
            } else if (this.draggedSource === 'furnace-input') {
                sourceItemRef = this.furnaceInput;
            } else if (this.draggedSource === 'furnace-fuel') {
                sourceItemRef = this.furnaceFuel;
            }

            if (sourceItemRef) {
                // The source slot was emptied when dragging started. Now fill it with the item from the target.
                Object.assign(sourceItemRef, itemFromTarget);
                this.draggedItem = null; // Clear the item on the cursor.
            } else {
                // Fallback to original behavior if source slot couldn't be determined
                this.draggedItem = itemFromTarget.type ? itemFromTarget : null;
            }
        }
        if (isChestSlot) {
            this.updateChestDisplay();
        } else {
            this.updateAllDisplays(); // General update
            this.updateFurnaceDisplay(); // If it's a furnace interaction
        }

        this.checkCraftingRecipe();
        this.checkTableCraftingRecipe();
        this.checkContinueSmelting();
        this.updateQuickCraftSidebar();

        if (document.getElementById('crafting-table-screen').style.display === 'flex') {
            this.updateQuickCraftSidebar();
        }
    }

    selectSlot(index) {
        document.getElementById(`slot-${this.selectedSlot}`).classList.remove('selected');

        this.selectedSlot = index;

        document.getElementById(`slot-${this.selectedSlot}`).classList.add('selected');

        const inventorySlot = document.querySelector(`#inventory-hotbar [data-slot="hotbar-${index}"]`);
        if (inventorySlot) {
            const allInventorySlots = document.querySelectorAll('#inventory-hotbar .inventory-slot');
            allInventorySlots.forEach(slot => slot.classList.remove('selected'));
            inventorySlot.classList.add('selected');
        }

        if (this._onItemChange) {
            this._onItemChange();
        }
        this.updateItemNameDisplay();
    }

    toggleInventory() {
        const inventoryScreen = document.getElementById('inventory-screen');
        const isVisible = inventoryScreen.style.display === 'flex';

        if (isVisible) {
            this.closeInventory();
            
            if (window.controls && !window.controls.isLocked) {
                setTimeout(() => {
                    try {
                        window.controls.lock();
                    } catch (e) {
                        console.error('Could not lock controls:', e);
                    }
                }, 100);
            }
        } else {
            this.openInventory();
        }
    }

    openInventory() {
        const inventoryScreen = document.getElementById('inventory-screen');
        const mainInventory = inventoryScreen.querySelector('.main-inventory');

        if (this.isCreative) {
            mainInventory.classList.add('creative');
            // Show the creative tabs
            const creativeTabs = document.getElementById('creative-inventory-tabs');
            if (creativeTabs) {
                creativeTabs.style.display = 'flex';
            }
        } else {
            mainInventory.classList.remove('creative');
        }

        // Recreate UI to ensure correct number of slots
        this.createInventoryUI();

        inventoryScreen.style.display = 'flex';

        const sidebar = document.getElementById('inventory-quick-craft-sidebar');
        if(sidebar && !this.isCreative) sidebar.style.display = 'block';

        const creativeTabs = document.getElementById('creative-inventory-tabs');
        if (this.isCreative) {
            creativeTabs.style.display = 'flex';
        } else {
            creativeTabs.style.display = 'none';
        }

        if (window.controls && window.controls.isLocked) {
            window.controls.unlock();
        }

        this.updateAllDisplays();
        this.updateQuickCraftSidebar();
    }

    closeInventory() {
        const inventoryScreen = document.getElementById('inventory-screen');
        inventoryScreen.style.display = 'none';

        const sidebar = document.getElementById('inventory-quick-craft-sidebar');
        if(sidebar) sidebar.style.display = 'none';

        this.isDragging = false;
        this.draggedItem = null;
        document.getElementById('dragged-item').style.display = 'none';
        
        const pauseMenu = document.getElementById('pause-menu');
        if (pauseMenu && pauseMenu.style.display === 'flex') {
            pauseMenu.style.display = 'none';
        }
    }

    openCraftingTable() {
        const craftingTableScreen = document.getElementById('crafting-table-screen');
        craftingTableScreen.style.display = 'flex';

        const sidebar = document.getElementById('crafting-table-quick-craft-sidebar');
        if(sidebar) sidebar.style.display = 'block';

        if (window.controls && window.controls.isLocked) {
            window.controls.unlock();
        }

        this.updateAllDisplays();
        this.updateCraftingTableDisplay();

        this.updateQuickCraftSidebar();
    }

    closeCraftingTable() {
        const craftingTableScreen = document.getElementById('crafting-table-screen');
        craftingTableScreen.style.display = 'none';

        const sidebar = document.getElementById('crafting-table-quick-craft-sidebar');
        if(sidebar) sidebar.style.display = 'none';

        this.returnCraftingTableItems();

        this.isDragging = false;
        this.draggedItem = null;
        document.getElementById('dragged-item').style.display = 'none';
    }

    returnCraftingTableItems() {
        for (let i = 0; i < this.tableCraftingSlots.length; i++) {
            const slot = this.tableCraftingSlots[i];
            if (slot.type && slot.count > 0) {
                this.addItem(slot.type, slot.count); // Return to main inventory
                slot.type = null;
                slot.count = 0;
            }
        }
    }

    openFurnace(furnacePos) {
        const furnaceScreen = document.getElementById('furnace-screen');
        furnaceScreen.style.display = 'flex';

        this.currentFurnacePos = furnacePos;

        if (window.controls && window.controls.isLocked) {
            window.controls.unlock();
        }

        this.updateAllDisplays();
        this.updateFurnaceDisplay();
    }

    closeFurnace() {
        const furnaceScreen = document.getElementById('furnace-screen');
        furnaceScreen.style.display = 'none';

        this.returnFurnaceItems();

        this.currentFurnacePos = null;

        this.isDragging = false;
        this.draggedItem = null;
        document.getElementById('dragged-item').style.display = 'none';
    }

    returnFurnaceItems() {
        if (this.furnaceInput.type && this.furnaceInput.count > 0) {
            this.addItem(this.furnaceInput.type, this.furnaceInput.count);
            this.furnaceInput = { type: null, count: 0 };
        }

        if (this.furnaceFuel.type && this.furnaceFuel.count > 0) {
            this.addItem(this.furnaceFuel.type, this.furnaceFuel.count);
            this.furnaceFuel = { type: null, count: 0 };
        }

        if (this.furnaceResult.type && this.furnaceResult.count > 0) {
            this.addItem(this.furnaceResult.type, this.furnaceResult.count);
            this.furnaceResult = { type: null, count: 0 };
        }
    }

    openChest(chestData) {
        this.currentChestData = chestData;
        document.getElementById('chest-screen').style.display = 'flex';
        
        if (window.controls && window.controls.isLocked) {
            window.controls.unlock();
        }
        
        this.updateChestDisplay();
        this.updateAllDisplays();
    }

    closeChest() {
        document.getElementById('chest-screen').style.display = 'none';
        this.currentChestData = null;
        
        this.isDragging = false;
        this.draggedItem = null;
        document.getElementById('dragged-item').style.display = 'none';
    }

    updateChestDisplay() {
        if (!this.currentChestData) return;
        
        for (let i = 0; i < 45; i++) {
            const slotElement = document.querySelector(`[data-slot="chest-${i}"]`);
            if (!slotElement) continue;
            
            slotElement.innerHTML = '';
            
            const itemData = this.currentChestData.inventory[i];
            if (itemData && itemData.type && itemData.count > 0) {
                const item = document.createElement('div');
                item.className = 'item-stack';
                if (this.isSlab(itemData.type)) {
                    item.classList.add('slab-item');
                } else if (this.isStair(itemData.type)) {
                    item.classList.add('stair-item');
                }
                item.style.backgroundImage = `url('${this.getItemTexture(itemData.type)}')`;
                
                if (itemData.count > 1) {
                    const count = document.createElement('div');
                    count.className = 'item-count';
                    count.textContent = itemData.count;
                    item.appendChild(count);
                }
                
                slotElement.appendChild(item);
            }
        }
        
        for (let i = 0; i < this.mainSlots.length; i++) {
            const slot = document.querySelector(`#chest-player-inventory [data-slot="inventory-${i}"]`);
            if (!slot) continue;
            
            slot.innerHTML = '';
            
            const itemData = this.mainSlots[i];
            if (itemData.type && itemData.count > 0) {
                const item = document.createElement('div');
                item.className = 'item-stack';
                if (this.isSlab(itemData.type)) {
                    item.classList.add('slab-item');
                } else if (this.isStair(itemData.type)) {
                    item.classList.add('stair-item');
                }
                item.style.backgroundImage = `url('${this.getItemTexture(itemData.type)}')`;
                
                if (itemData.count > 1) {
                    const count = document.createElement('div');
                    count.className = 'item-count';
                    count.textContent = itemData.count;
                    item.appendChild(count);
                }
                
                slot.appendChild(item);
            }
        }
        
        for (let i = 0; i < this.slots.length; i++) {
            const slot = document.querySelector(`#chest-player-hotbar [data-slot="hotbar-${i}"]`);
            if (!slot) continue;
            
            slot.innerHTML = '';
            
            const itemData = this.slots[i];
            if (itemData.type && itemData.count > 0) {
                const item = document.createElement('div');
                item.className = 'item-stack';
                if (this.isSlab(itemData.type)) {
                    item.classList.add('slab-item');
                } else if (this.isStair(itemData.type)) {
                    item.classList.add('stair-item');
                }
                item.style.backgroundImage = `url('${this.getItemTexture(itemData.type)}')`;
                
                if (itemData.count > 1) {
                    const count = document.createElement('div');
                    count.className = 'item-count';
                    count.textContent = itemData.count;
                    item.appendChild(count);
                }
                
                slot.appendChild(item);
                
                if (i === this.selectedSlot) {
                    slot.classList.add('selected');
                } else {
                    slot.classList.remove('selected');
                }
            }
        }
    }

    setupCraftingRecipes() {
        Promise.all([
            import('./craftingRecipes.js'),
            import('./pickaxes.js')
        ]).then(([craftingRecipes, pickaxesModule]) => {
            // Initialize recipe arrays
            this.recipes = [...craftingRecipes.BASIC_RECIPES];
            this.recipes.push(...pickaxesModule.PICKAXE_RECIPES);
            
            this.tableRecipes = [...craftingRecipes.TABLE_RECIPES];
            this.tableRecipes.push(...pickaxesModule.PICKAXE_TABLE_RECIPES);
            
            this.smeltingRecipes = [...craftingRecipes.SMELTING_RECIPES];
            this.fuelTypes = {...craftingRecipes.FUEL_TYPES};
            
            // Load any custom block recipes
            try {
                const customBlocks = JSON.parse(localStorage.getItem('minecraft_custom_blocks') || '[]');
                customBlocks.forEach(block => {
                    if (block.recipe && block.recipe.some(item => item !== null)) {
                        this.tableRecipes.push({
                            pattern: block.recipe,
                            result: { type: block.id, count: 1 },
                            needsExactMatch: true,
                            displayName: block.name,
                            ingredients: ['Custom Recipe']
                        });
                    }
                });
            } catch (error) {
                console.error('Error loading custom block recipes:', error);
            }
        }).catch(error => {
            console.error('Error setting up crafting recipes:', error);
        });
    }

    setupSmeltingRecipes() {
        import('./craftingRecipes.js').then(craftingRecipes => {
            this.smeltingRecipes = [...craftingRecipes.SMELTING_RECIPES];
            this.fuelTypes = {...craftingRecipes.FUEL_TYPES};
        });
    }

    checkCraftingRecipe() {
        const ingredients = this.craftingSlots.map(slot => slot.type);

        if (ingredients.every(type => !type)) {
            this.craftingResult = { type: null, count: 0 };
            this.updateCraftingResult();
            return;
        }

        for (const recipe of this.recipes) {
            if (this.recipeMatches(ingredients, recipe.pattern, recipe.needsExactMatch)) {
                this.craftingResult = { ...recipe.result };
                this.updateCraftingResult();
                return;
            }
        }

        this.craftingResult = { type: null, count: 0 };
        this.updateCraftingResult();
    }

    checkTableCraftingRecipe() {
        const ingredients = this.tableCraftingSlots.map(slot => slot.type);

        if (ingredients.every(type => !type)) {
            this.tableCraftingResult = { type: null, count: 0 };
            this.updateTableCraftingResult();
            return;
        }

        for (const recipe of this.tableRecipes) {
            if (this.tableRecipeMatches(ingredients, recipe.pattern, recipe.needsExactMatch)) {
                this.tableCraftingResult = { ...recipe.result };
                this.updateTableCraftingResult();
                return;
            }
        }

        this.tableCraftingResult = { type: null, count: 0 };
        this.updateTableCraftingResult();
    }

    recipeMatches(ingredients, pattern, needsExactMatch) {
        if (!needsExactMatch) {
            const woodCount = ingredients.filter(type => type === 'wood').length;

            if (pattern.includes('wood') && pattern.filter(p => p !== null).length === 1) {
                return woodCount === 1 && ingredients.filter(type => type !== null && type !== 'wood').length === 0;
            }
        }

        if (needsExactMatch) {
            for (let i = 0; i < pattern.length; i++) {
                if (pattern[i] !== ingredients[i]) {
                    return false;
                }
            }
            return true;
        } else {
            for (let i = 0; i < pattern.length; i++) {
                if (pattern[i] === null) continue;

                if (ingredients[i] !== pattern[i]) {
                    return false;
                }
            }
            return true;
        }
    }

    tableRecipeMatches(ingredients, pattern, needsExactMatch) {
        if (needsExactMatch) {
            for (let i = 0; i < pattern.length; i++) {
                if (pattern[i] !== ingredients[i]) {
                    return false;
                }
            }
            return true;
        } else {
            for (let i = 0; i < pattern.length; i++) {
                if (pattern[i] === null) continue;

                if (ingredients[i] !== pattern[i]) {
                    return false;
                }
            }
            return true;
        }
    }

    updateCraftingResult() {
        const resultSlot = document.querySelector('[data-slot="craft-result"]');
        resultSlot.innerHTML = '';

        if (this.craftingResult.type && this.craftingResult.count > 0) {
            const item = document.createElement('div');
            item.className = 'item-stack';
            item.style.backgroundImage = `url('${this.getItemTexture(this.craftingResult.type)}')`;

            if (this.craftingResult.count > 1) {
                const count = document.createElement('div');
                count.className = 'item-count';
                count.textContent = this.craftingResult.count;
                item.appendChild(count);
            }

            resultSlot.appendChild(item);
        }
    }

    updateTableCraftingResult() {
        const resultSlot = document.querySelector('[data-slot="table-craft-result"]');
        if (!resultSlot) return;

        resultSlot.innerHTML = '';

        if (this.tableCraftingResult.type && this.tableCraftingResult.count > 0) {
            const item = document.createElement('div');
            item.className = 'item-stack';
            item.style.backgroundImage = `url('${this.getItemTexture(this.tableCraftingResult.type)}')`;

            if (this.tableCraftingResult.count > 1) {
                const count = document.createElement('div');
                count.className = 'item-count';
                count.textContent = this.tableCraftingResult.count;
                item.appendChild(count);
            }

            resultSlot.appendChild(item);
        }
    }

    updateFurnaceDisplay() {
        const inputSlot = document.querySelector('[data-slot="furnace-input"]');
        inputSlot.innerHTML = '';

        if (this.furnaceInput.type && this.furnaceInput.count > 0) {
            const item = document.createElement('div');
            item.className = 'item-stack';
            item.style.backgroundImage = `url('${this.getItemTexture(this.furnaceInput.type)}')`;

            if (this.furnaceInput.count > 1) {
                const count = document.createElement('div');
                count.className = 'item-count';
                count.textContent = this.furnaceInput.count;
                item.appendChild(count);
            }

            inputSlot.appendChild(item);
        }

        const fuelSlot = document.querySelector('[data-slot="furnace-fuel"]');
        fuelSlot.innerHTML = '';

        if (this.furnaceFuel.type && this.furnaceFuel.count > 0) {
            const item = document.createElement('div');
            item.className = 'item-stack';
            item.style.backgroundImage = `url('${this.getItemTexture(this.furnaceFuel.type)}')`;

            if (this.furnaceFuel.count > 1) {
                const count = document.createElement('div');
                count.className = 'item-count';
                count.textContent = this.furnaceFuel.count;
                item.appendChild(count);
            }

            fuelSlot.appendChild(item);
        }

        const resultSlot = document.querySelector('[data-slot="furnace-result"]');
        resultSlot.innerHTML = '';

        if (this.furnaceResult.type && this.furnaceResult.count > 0) {
            const item = document.createElement('div');
            item.className = 'item-stack';
            item.style.backgroundImage = `url('${this.getItemTexture(this.furnaceResult.type)}')`;

            if (this.furnaceResult.count > 1) {
                const count = document.createElement('div');
                count.className = 'item-count';
                count.textContent = this.furnaceResult.count;
                item.appendChild(count);
            }

            resultSlot.appendChild(item);
        }

        const invSlotCount = this.isCreative ? 54 : 27;
        for (let i = 0; i < invSlotCount; i++) {
            this.updateFurnaceInventorySlotUI(i);
        }

        for (let i = 0; i < this.slots.length; i++) {
            this.updateFurnaceHotbarUI(i);
        }

        const fireIcon = document.querySelector('.furnace-fire');
        if (fireIcon) {
            if (this.furnaceActive && this.burnTimeLeft > 0) {
                fireIcon.textContent = '';
                fireIcon.style.opacity = '1';
                fireIcon.classList.add('active');
                
                const burnProgress = this.burnTimeLeft / this.maxBurnTime;
                fireIcon.style.background = `linear-gradient(to top, #ff7700 ${burnProgress * 100}%, #333333 ${burnProgress * 100}%)`;
            } else {
                fireIcon.textContent = '';
                fireIcon.style.opacity = '0.3';
                fireIcon.classList.remove('active');
                fireIcon.style.background = '#333333';
            }
        }

        const timerElement = document.querySelector('.furnace-timer');
        if (timerElement) {
            if (this.furnaceActive && this.smeltProgress > 0) {
                const timeLeft = (this.maxSmeltTime - this.smeltProgress).toFixed(1);
                const fuelLeft = this.burnTimeLeft.toFixed(1);
                timerElement.innerHTML = `Smelting: ${timeLeft}s<br>Fuel: ${fuelLeft}s`;
                timerElement.style.display = 'block';
            } else if (this.burnTimeLeft > 0) {
                const fuelLeft = this.burnTimeLeft.toFixed(1);
                timerElement.innerHTML = `Fuel: ${fuelLeft}s`;
                timerElement.style.display = 'block';
            } else {
                timerElement.style.display = 'none';
            }
        }

        const arrow = document.querySelector('.crafting-arrow');
        if (this.furnaceActive && this.smeltProgress > 0) {
            const progressPercent = (this.smeltProgress / this.maxSmeltTime) * 100;
            arrow.style.background = `linear-gradient(to right, #4CAF50 ${progressPercent}%, transparent ${progressPercent}%, transparent 100%)`;
            arrow.style.color = '#4CAF50';
        } else {
            arrow.style.background = 'none';
            arrow.style.color = '#bbbbbb';
        }
    }

    updateFurnaceInventorySlotUI(index) {
        const slot = document.querySelector(`#furnace-inventory [data-slot="inventory-${index}"]`);
        if (!slot) return;

        slot.innerHTML = '';

        const itemData = this.mainSlots[index];
        if (itemData.type && itemData.count > 0) {
            const item = document.createElement('div');
            item.className = 'item-stack';
            if (this.isSlab(itemData.type)) {
                item.classList.add('slab-item');
            } else if (this.isStair(itemData.type)) {
                item.classList.add('stair-item');
            }
            item.style.backgroundImage = `url('${this.getItemTexture(itemData.type)}')`;

            if (itemData.count > 1) {
                const count = document.createElement('div');
                count.className = 'item-count';
                count.textContent = itemData.count;
                item.appendChild(count);
            }
            slot.appendChild(item);
            this.updateSlotUIDurability(item, itemData); // Pass the item-stack div
        } else {
             this.updateSlotUIDurability(slot, null); // Ensure bar is cleared if slot is empty
        }
    }

    updateFurnaceHotbarUI(index) {
        const slot = document.querySelector(`#furnace-hotbar [data-slot="hotbar-${index}"]`);
        if (!slot) return;

        slot.innerHTML = '';

        const itemData = this.slots[index];
        if (itemData.type && itemData.count > 0) {
            const item = document.createElement('div');
            item.className = 'item-stack';
            if (this.isSlab(itemData.type)) {
                item.classList.add('slab-item');
            } else if (this.isStair(itemData.type)) {
                item.classList.add('stair-item');
            }
            item.style.backgroundImage = `url('${this.getItemTexture(itemData.type)}')`;

            if (itemData.count > 1) {
                const count = document.createElement('div');
                count.className = 'item-count';
                count.textContent = itemData.count;
                item.appendChild(count);
            }
            slot.appendChild(item);
            this.updateSlotUIDurability(item, itemData);
        } else {
            this.updateSlotUIDurability(slot, null);
        }


        if (index === this.selectedSlot) {
            slot.classList.add('selected');
        } else {
            slot.classList.remove('selected');
        }
    }

    updateAllDisplays() {
        for (let i = 0; i < this.slots.length; i++) {
            this.updateSlotUI(i);
            this.updateInventoryHotbarUI(i);
        }

        const invSlotCount = this.isCreative ? 54 : 27;
        for (let i = 0; i < invSlotCount; i++) {
            this.updateInventorySlotUI(i);
        }

        for (let i = 0; i < this.craftingSlots.length; i++) {
            this.updateCraftingSlotUI(i);
        }

        this.updateCraftingResult();

        if (document.getElementById('crafting-table-screen').style.display === 'flex') {
            this.updateCraftingTableDisplay();
        }

        if (document.getElementById('furnace-screen').style.display === 'flex') {
            this.updateFurnaceDisplay();
        }

        if (document.getElementById('chest-screen').style.display === 'flex') {
            this.updateChestDisplay();
        }
    }

    updateCraftingTableDisplay() {
        for (let i = 0; i < this.tableCraftingSlots.length; i++) {
            this.updateTableCraftingSlotUI(i);
        }

        this.updateTableCraftingResult();

        const invSlotCount = this.isCreative ? 54 : 27;
        for (let i = 0; i < invSlotCount; i++) {
            this.updateCraftingTableInventorySlotUI(i);
        }

        for (let i = 0; i < this.slots.length; i++) {
            this.updateCraftingTableHotbarUI(i);
        }

        this.updateQuickCraftSidebar();
    }

    updateCraftingTableInventorySlotUI(index) {
        const slot = document.querySelector(`#crafting-table-inventory [data-slot="inventory-${index}"]`);
        if (!slot) return;

        slot.innerHTML = '';

        const itemData = this.mainSlots[index];
        if (itemData.type && itemData.count > 0) {
            const item = document.createElement('div');
            item.className = 'item-stack';
            if (this.isSlab(itemData.type)) {
                item.classList.add('slab-item');
            } else if (this.isStair(itemData.type)) {
                item.classList.add('stair-item');
            }
            item.style.backgroundImage = `url('${this.getItemTexture(itemData.type)}')`;

            if (itemData.count > 1) {
                const count = document.createElement('div');
                count.className = 'item-count';
                count.textContent = itemData.count;
                item.appendChild(count);
            }
            slot.appendChild(item);
            this.updateSlotUIDurability(item, itemData); // Pass the item-stack div
        } else {
             this.updateSlotUIDurability(slot, null); // Ensure bar is cleared if slot is empty
        }
    }

    updateCraftingTableHotbarUI(index) {
        const slot = document.querySelector(`#crafting-table-hotbar [data-slot="hotbar-${index}"]`);
        if (!slot) return;

        slot.innerHTML = '';

        const itemData = this.slots[index];
        if (itemData.type && itemData.count > 0) {
            const item = document.createElement('div');
            item.className = 'item-stack';
            if (this.isSlab(itemData.type)) {
                item.classList.add('slab-item');
            } else if (this.isStair(itemData.type)) {
                item.classList.add('stair-item');
            }
            item.style.backgroundImage = `url('${this.getItemTexture(itemData.type)}')`;

            if (itemData.count > 1) {
                const count = document.createElement('div');
                count.className = 'item-count';
                count.textContent = itemData.count;
                item.appendChild(count);
            }
            slot.appendChild(item);
            this.updateSlotUIDurability(item, itemData);
        } else {
            this.updateSlotUIDurability(slot, null);
        }


        if (index === this.selectedSlot) {
            slot.classList.add('selected');
        } else {
            slot.classList.remove('selected');
        }
    }

    autoFillInventoryCraftingGrid(recipe) {
        // 1. Clear existing items from 2x2 grid and return to inventory
        for (let i = 0; i < this.craftingSlots.length; i++) {
            const slot = this.craftingSlots[i];
            if (slot.type && slot.count > 0) {
                this.addItem(slot.type, slot.count); // Return to main inventory
                slot.type = null;
                slot.count = 0;
            }
        }
    
        // 2. Remove required items from inventory and place into grid
        for (let i = 0; i < recipe.pattern.length; i++) {
            if (recipe.pattern[i]) {
                if (this.removeItemFromInventory(recipe.pattern[i])) {
                    this.craftingSlots[i].type = recipe.pattern[i];
                    this.craftingSlots[i].count = 1;
                }
            }
        }
    
        // 3. Update displays
        this.checkCraftingRecipe(); // This will update the result slot
        this.updateAllDisplays();   // This will update the grid UI
        this.updateQuickCraftSidebar(); // Refresh sidebar to show updated availability
    }

    quickCraftItem(recipe) {
        if (!recipe) return;

        // 1. Check if we have ingredients
        const requiredItems = {};
        recipe.pattern.forEach(item => {
            if (item) {
                if (!requiredItems[item]) requiredItems[item] = 0;
                requiredItems[item]++;
            }
        });
    
        const availableItems = {};
        [...this.slots, ...this.mainSlots].forEach(slot => {
            if (slot.type) {
                if (!availableItems[slot.type]) {
                    availableItems[slot.type] = 0;
                }
                availableItems[slot.type] += slot.count;
            }
        });
    
        let canCraft = true;
        for (const [itemType, count] of Object.entries(requiredItems)) {
            if (!availableItems[itemType] || availableItems[itemType] < count) {
                canCraft = false;
                break;
            }
        }
    
        if (!canCraft) {
            console.warn("Cannot quick craft, not enough ingredients.");
            // TODO: play a fail sound
            return;
        }

        // 2. Remove ingredients
        for (const [itemType, count] of Object.entries(requiredItems)) {
            for (let i=0; i<count; i++) {
                 this.removeItemFromInventory(itemType);
            }
        }
    
        // 3. Add result to inventory
        const resultItem = recipe.result;
        if (this.isToolWithDurability(resultItem.type)) {
            resultItem.durability = TOOL_DURABILITIES[resultItem.type];
            resultItem.maxDurability = TOOL_DURABILITIES[resultItem.type];
        }

        this.addItem(resultItem.type, resultItem.count);
        
        soundManager.play('click', { volume: 0.5 }); // A generic crafting sound for now
    
        // 4. Update UI
        this.updateAllDisplays();
        this.checkCraftingRecipe();
        this.checkTableCraftingRecipe();
        this.checkContinueSmelting();
        this.updateQuickCraftSidebar();
    }

    updateQuickCraftSidebar() {
        const isInventoryOpen = document.getElementById('inventory-screen').style.display === 'flex';
        const isTableOpen = document.getElementById('crafting-table-screen').style.display === 'flex';
    
        let quickCraftList;
        let recipeSource;
        let fillFunction;
    
        if (this.isCreative) {
            if (isInventoryOpen) document.getElementById('inventory-quick-craft-sidebar').style.display = 'none';
            if (isTableOpen) document.getElementById('crafting-table-quick-craft-sidebar').style.display = 'none';
            return;
        } else {
             if (isInventoryOpen) document.getElementById('inventory-quick-craft-sidebar').style.display = 'block';
             if (isTableOpen) document.getElementById('crafting-table-quick-craft-sidebar').style.display = 'block';
        }
    
        if (isTableOpen) {
            quickCraftList = document.getElementById('crafting-table-quick-craft-list');
            recipeSource = this.tableRecipes;
            fillFunction = (recipe) => this.autoFillCraftingGrid(recipe);
        } else if (isInventoryOpen) {
            quickCraftList = document.getElementById('inventory-quick-craft-list');
            recipeSource = this.recipes;
            fillFunction = (recipe) => this.autoFillInventoryCraftingGrid(recipe);
        } else {
            return; // No relevant screen is open
        }
    
        if (!quickCraftList || !recipeSource) return;
    
        quickCraftList.innerHTML = '';
    
        const availableItems = {};
    
        [...this.slots, ...this.mainSlots].forEach(slot => {
            if (slot.type && slot.count > 0) {
                if (!availableItems[slot.type]) {
                    availableItems[slot.type] = 0;
                }
                availableItems[slot.type] += slot.count;
            }
        });
    
        const craftableRecipes = [];
    
        for (const recipe of recipeSource) {
            const requiredItems = {};
            recipe.pattern.forEach(item => {
                if (item) {
                    if (!requiredItems[item]) {
                        requiredItems[item] = 0;
                    }
                    requiredItems[item]++;
                }
            });
    
            let canCraft = true;
            const tempAvailable = { ...availableItems };
            for (const [itemType, count] of Object.entries(requiredItems)) {
                if (!tempAvailable[itemType] || tempAvailable[itemType] < count) {
                    canCraft = false;
                    break;
                }
            }
    
            if (canCraft) {
                if (!craftableRecipes.some(r => r.result.type === recipe.result.type && r.displayName === recipe.displayName)) {
                    craftableRecipes.push(recipe);
                }
            }
        }
    
        craftableRecipes.forEach((recipe, index) => {
            const recipeItem = document.createElement('div');
            recipeItem.className = 'quick-craft-item';
            recipeItem.setAttribute('data-slot', `quick-craft-${index}`);
            recipeItem.dataset.recipe = JSON.stringify(recipe);

            const resultIcon = document.createElement('div');
            resultIcon.className = 'quick-craft-icon';
            resultIcon.style.backgroundImage = `url('${this.getItemTexture(recipe.result.type)}')`;
    
            const recipeInfo = document.createElement('div');
            recipeInfo.className = 'quick-craft-info';
    
            const recipeName = document.createElement('div');
            recipeName.className = 'quick-craft-name';
            recipeName.textContent = recipe.displayName;
    
            const recipeIngredients = document.createElement('div');
            recipeIngredients.className = 'quick-craft-ingredients';
            recipeIngredients.textContent = recipe.ingredients.join(', ');
    
            recipeInfo.appendChild(recipeName);
            recipeInfo.appendChild(recipeIngredients);
    
            recipeItem.appendChild(resultIcon);
            recipeItem.appendChild(recipeInfo);
    
            recipeItem.addEventListener('click', () => {
                fillFunction(recipe);
            });
    
            quickCraftList.appendChild(recipeItem);
        });
    
        if (craftableRecipes.length === 0) {
            const noRecipes = document.createElement('div');
            noRecipes.className = 'no-recipes';
            noRecipes.textContent = 'No recipes available';
            quickCraftList.appendChild(noRecipes);
        }
    }

    autoFillCraftingGrid(recipe) {
        for (let i = 0; i < this.tableCraftingSlots.length; i++) {
            if (this.tableCraftingSlots[i].count > 0) {
                this.addItem(this.tableCraftingSlots[i].type, this.tableCraftingSlots[i].count);
                this.tableCraftingSlots[i].type = null;
                this.tableCraftingSlots[i].count = 0;
            }
        }

        for (let i = 0; i < recipe.pattern.length; i++) {
            if (recipe.pattern[i]) {
                if (this.removeItemFromInventory(recipe.pattern[i])) {
                    this.tableCraftingSlots[i].type = recipe.pattern[i];
                    this.tableCraftingSlots[i].count = 1;
                }
            }
        }

        this.checkTableCraftingRecipe();
        this.updateCraftingTableDisplay();
        this.updateQuickCraftSidebar();
    }

    removeItemFromInventory(itemType) {
        for (let i = 0; i < this.slots.length; i++) {
            if (this.slots[i].type === itemType && this.slots[i].count > 0) {
                this.slots[i].count--;
                if (this.slots[i].count === 0) {
                    this.slots[i].type = null;
                }
                return true;
            }
        }

        for (let i = 0; i < this.mainSlots.length; i++) {
            if (this.mainSlots[i].type === itemType && this.mainSlots[i].count > 0) {
                this.mainSlots[i].count--;
                if (this.mainSlots[i].count === 0) {
                    this.mainSlots[i].type = null;
                }
                return true;
            }
        }

        return false;
    }

    updateHeldItemDisplay() {}
    showHeldItem() {}
    hideHeldItem() {}

    playSmeltingCompleteSound() {
        soundManager.play('click', { volume: 0.3, playbackRate: 1.5 });
    }

    showFuelNeededIndicator() {
        const fireIcon = document.querySelector('.furnace-fire');
        if (fireIcon) {
            fireIcon.style.animation = 'fuel-needed 1s ease-in-out infinite';
            setTimeout(() => {
                if (fireIcon) {
                    fireIcon.style.animation = '';
                }
            }, 3000);
        }
    }

    isSlab(blockType) {
        return blockType === 'oakslab' || blockType === 'birchslab' || blockType === 'spruceslab' || blockType === 'cherryslab'; // Added spruceslab
    }

    isStair(blockType) {
        return blockType && blockType.endsWith('_stairs');
    }

    isTool(itemType) {
        return itemType === 'woodpickaxe' || 
               itemType === 'stonepickaxe' || 
               itemType === 'woodhoe' ||
               itemType === 'woodaxe' || // Added woodaxe
               itemType === 'stoneaxe'; // Added stoneaxe
    }

    isToolWithDurability(itemType) {
        return TOOL_DURABILITIES.hasOwnProperty(itemType);
    }

    useDurabilityOnSelected() {
        const slot = this.slots[this.selectedSlot];
        if (slot && slot.type && this.isToolWithDurability(slot.type)) {
            slot.durability--;
            this.updateSlotUI(this.selectedSlot); // Update UI immediately
            this.updateInventoryHotbarUI(this.selectedSlot);

            if (slot.durability <= 0) {
                slot.type = null;
                slot.count = 0;
                delete slot.durability;
                delete slot.maxDurability;
                this.updateSlotUI(this.selectedSlot); // Update again after breaking
                this.updateInventoryHotbarUI(this.selectedSlot);
                this.updateItemNameDisplay();

                soundManager.play('tool_break');

                if (this._onItemChange) {
                    this._onItemChange(); // Notify player if current item changed
                }
                return true; // Tool broke
            }
            if (this._onItemChange) {
                 this._onItemChange(); // Notify if durability changed but tool didn't break
            }
            return false; // Tool still has durability
        }
        return false; // Not a tool or no item selected
    }

    setCreativeTab(tabNumber) {
        if (!this.isCreative) return;
        this.creativeTab = tabNumber;

        document.querySelectorAll('.creative-tab-button').forEach(btn => {
            if (parseInt(btn.dataset.tab, 10) === tabNumber) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        this.fillCreativeInventory();
    }
    
    fillCreativeInventory() {
        if (!this.isCreative) return;

        this.slots = new Array(9).fill().map(() => ({ type: null, count: 0 }));
        this.mainSlots = new Array(54).fill().map(() => ({ type: null, count: 0 }));
        this.craftingSlots = new Array(4).fill().map(() => ({ type: null, count: 0 }));
        
        let itemsForPage = [];

        if (this.creativeTab === 1) { // Blocks tab
            itemsForPage = [
                'grass', 'dirt', 'stone', 'smoothstone', 'cobble', 
                'wood', 'birchwood', 'leaves', 'birchleaves',
                'plank', 'birchplank', 'craftingtable', 'oakdoor', 'birchdoor',
                'sand', 'sandstone', 'cacti', 'furnace', 'glass',
                'snow', 'oakslab', 'birchslab', 'chest', 'stick', 
                'seeds', 'wheat', 
                'haybale', 'farmland', 'oaksapling', 'birchsapling',
                'sprucewood', 'spruceleaves', 'spruceplank', 'sprucesapling',
                'wool', 
                'cherrywood', 'cherryleaves', 'cherryplank', 'cherrysapling', 'cherryslab',
                'rose', 'dandelion', 'ladder',
                'oak_stairs', 'birch_stairs', 'spruce_stairs', 'cherry_stairs', 'cobble_stairs', 'stone_stairs'
            ];
        } else if (this.creativeTab === 2) { // Mods tab
            try {
                const customBlocks = JSON.parse(localStorage.getItem('minecraft_custom_blocks') || '[]');
                itemsForPage = customBlocks.map(block => block.id);
            } catch (error) {
                console.error('Error loading custom blocks for creative inventory:', error);
                itemsForPage = [];
            }
        }

        itemsForPage.forEach((blockType, index) => {
            const item = { type: blockType, count: this.isToolWithDurability(blockType) ? 1 : 64 };
            if (TOOL_DURABILITIES[blockType]) {
                item.durability = TOOL_DURABILITIES[blockType];
                item.maxDurability = TOOL_DURABILITIES[blockType];
            }

            // Populate main inventory first
            if (index < 54) {
                this.mainSlots[index] = item;
            }
        });
        
        this.checkCraftingRecipe();
        this.updateAllDisplays();
    }

    updateSlotUI(index) {
        const slotData = this.slots[index];
        const slotElement = document.getElementById(`slot-${index}`); // This is the .hotbar-slot
        const itemEl = document.getElementById(`item-${index}`); // This is the .slot-item inside
        const countEl = document.getElementById(`count-${index}`);

        if (slotData.type && slotData.count > 0) {
            itemEl.style.backgroundImage = `url('${this.getItemTexture(slotData.type)}')`;
            
            itemEl.classList.remove('slab-item', 'stair-item');
            if (this.isSlab(slotData.type)) {
                itemEl.classList.add('slab-item');
            } else if (this.isStair(slotData.type)) {
                itemEl.classList.add('stair-item');
            }

            if (slotData.count > 1) {
                countEl.textContent = slotData.count;
            } else {
                countEl.textContent = '';
            }
            this.updateSlotUIDurability(itemEl, slotData); // Pass itemEl which is .slot-item
        } else {
            itemEl.style.backgroundImage = 'none';
            itemEl.classList.remove('slab-item', 'stair-item');
            countEl.textContent = '';
            this.updateSlotUIDurability(itemEl, null); // Clear durability bar
        }
    }

    updateInventorySlotUI(index) {
        const slotElement = document.querySelector(`.main-inventory [data-slot="inventory-${index}"]`);
        if (!slotElement) return;

        slotElement.innerHTML = ''; // Clear previous content including old durability bars

        const itemData = this.mainSlots[index];
        if (itemData.type && itemData.count > 0) {
            const item = document.createElement('div');
            item.className = 'item-stack'; // item-stack should be relative for durability bar
            
            if (this.isSlab(itemData.type)) {
                item.classList.add('slab-item');
            } else if (this.isStair(itemData.type)) {
                item.classList.add('stair-item');
            }

            item.style.backgroundImage = `url('${this.getItemTexture(itemData.type)}')`;

            if (itemData.count > 1) {
                const count = document.createElement('div');
                count.className = 'item-count';
                count.textContent = itemData.count;
                item.appendChild(count);
            }
            slotElement.appendChild(item);
            this.updateSlotUIDurability(item, itemData); // Pass the item-stack div
        } else {
             this.updateSlotUIDurability(slotElement, null); // Ensure bar is cleared if slot is empty
        }
    }

    updateInventoryHotbarUI(index) {
        const slotElement = document.querySelector(`#inventory-hotbar [data-slot="hotbar-${index}"]`);
        if (!slotElement) return;

        slotElement.innerHTML = '';

        const itemData = this.slots[index];
        if (itemData.type && itemData.count > 0) {
            const item = document.createElement('div');
            item.className = 'item-stack';
            if (this.isSlab(itemData.type)) {
                item.classList.add('slab-item');
            } else if (this.isStair(itemData.type)) {
                item.classList.add('stair-item');
            }
            item.style.backgroundImage = `url('${this.getItemTexture(itemData.type)}')`;

            if (itemData.count > 1) {
                const count = document.createElement('div');
                count.className = 'item-count';
                count.textContent = itemData.count;
                item.appendChild(count);
            }
            slotElement.appendChild(item);
            this.updateSlotUIDurability(item, itemData);
        } else {
            this.updateSlotUIDurability(slotElement, null);
        }


        if (index === this.selectedSlot) {
            slotElement.classList.add('selected');
        } else {
            slotElement.classList.remove('selected');
        }
    }

    updateCraftingSlotUI(index, isTable = false) {
        const slotIdentifier = isTable ? `table-craft-${index}` : `craft-${index}`;
        const slotElement = document.querySelector(`[data-slot="${slotIdentifier}"]`);
        if (!slotElement) return;

        slotElement.innerHTML = '';

        const itemData = isTable ? this.tableCraftingSlots[index] : this.craftingSlots[index];
        if (itemData.type && itemData.count > 0) {
            const item = document.createElement('div');
            item.className = 'item-stack';
            if (this.isSlab(itemData.type)) {
                item.classList.add('slab-item');
            } else if (this.isStair(itemData.type)) {
                item.classList.add('stair-item');
            }
            item.style.backgroundImage = `url('${this.getItemTexture(itemData.type)}')`;

            if (itemData.count > 1) {
                const count = document.createElement('div');
                count.className = 'item-count';
                count.textContent = itemData.count;
                item.appendChild(count);
            }
            slotElement.appendChild(item);
            this.updateSlotUIDurability(item, itemData);
        } else {
            this.updateSlotUIDurability(slotElement, null);
        }
    }

    updateTableCraftingSlotUI(index) {
        this.updateCraftingSlotUI(index, true);
    }

    getSlotReference(slotId) {
        if (!slotId) return null;

        if (slotId.startsWith('hotbar-')) {
            return this.slots[parseInt(slotId.split('-')[1])];
        } else if (slotId.startsWith('inventory-')) {
            return this.mainSlots[parseInt(slotId.split('-')[1])];
        } else if (slotId.startsWith('craft-') && slotId !== 'craft-result') {
            return this.craftingSlots[parseInt(slotId.split('-')[1])];
        } else if (slotId === 'craft-result') {
            return this.craftingResult;
        } else if (slotId.startsWith('table-craft-') && slotId !== 'table-craft-result') {
            return this.tableCraftingSlots[parseInt(slotId.split('-')[2])];
        } else if (slotId === 'table-craft-result') {
            return this.tableCraftingResult;
        } else if (slotId === 'furnace-input') {
            return this.furnaceInput;
        } else if (slotId === 'furnace-fuel') {
            return this.furnaceFuel;
        } else if (slotId === 'furnace-result') {
            return this.furnaceResult;
        } else if (slotId.startsWith('chest-') && this.currentChestData) {
            return this.currentChestData.inventory[parseInt(slotId.split('-')[1])];
        }
        return null;
    }

    updateGamepadDraggedItemPosition() {
        const draggedItemEl = document.getElementById('dragged-item');
        if (!this.isDragging || !draggedItemEl) return;

        const selectedSlot = document.querySelector('.gamepad-selected');
        if (selectedSlot) {
            const rect = selectedSlot.getBoundingClientRect();
            // Center the dragged item on the selected slot
            draggedItemEl.style.left = `${rect.left + (rect.width / 2) - 16}px`;
            draggedItemEl.style.top = `${rect.top + (rect.height / 2) - 16}px`;
        }
    }

    handleGamepadClick(slotId) {
        if (slotId.startsWith('quick-craft-')) {
            const openScreen = this.isInventoryOpen(true);
            if (openScreen) {
                const screenEl = document.getElementById(openScreen);
                const quickCraftItem = screenEl.querySelector(`[data-slot="${slotId}"]`);
                if (quickCraftItem && quickCraftItem.dataset.recipe) {
                    try {
                        const recipe = JSON.parse(quickCraftItem.dataset.recipe);
                        this.quickCraftItem(recipe);
                        // Now, reset selection
                        if (window.gamepadUINavigator) {
                            window.gamepadUINavigator.resetToHotbar();
                        }
                    } catch(e) {
                        console.error("Failed to parse recipe from quick craft item:", e);
                    }
                }
            }
            return;
        }

        if (this.isDragging) { // An item is being held by the "cursor"
            // Get a reference to the target slot
            const targetSlotRef = this.getSlotReference(slotId);
            if (!targetSlotRef) {
                this.returnItemToSource(); // Clicked outside, return item
                return;
            }
            // Use existing mouseup logic to place/swap the item
            this.completeItemTransfer(slotId);
            this.isDragging = false;
            this.draggedItem = null;
            document.getElementById('dragged-item').style.display = 'none';

        } else { // No item is being held, attempt to pick one up
            const itemData = this.getSlotReference(slotId);
            if (itemData && itemData.type) {
                this.isDragging = true;
                
                // Special handling for crafting results which are generated on the fly
                if (slotId === 'craft-result' || slotId === 'table-craft-result' || slotId === 'furnace-result') {
                    // For gamepad, we assume taking the whole stack from result
                    this.draggedItem = { ...itemData };
                    if (this.isToolWithDurability(this.draggedItem.type)) {
                       this.draggedItem.durability = TOOL_DURABILITIES[this.draggedItem.type];
                       this.draggedItem.maxDurability = TOOL_DURABILITIES[this.draggedItem.type];
                    }
                    if (slotId === 'craft-result') this.takeFromCraftingResult();
                    else if (slotId === 'table-craft-result') this.takeFromTableCraftingResult();
                    else { // furnace result
                         itemData.type = null;
                         itemData.count = 0;
                    }
                } else {
                    this.draggedItem = { ...itemData };
                    // Clear the source slot
                    itemData.type = null;
                    itemData.count = 0;
                    delete itemData.durability;
                    delete itemData.maxDurability;
                }
                
                this.draggedSource = slotId;

                // Visually update the "dragged" item
                const draggedItemEl = document.getElementById('dragged-item');
                draggedItemEl.style.backgroundImage = `url('${this.getItemTexture(this.draggedItem.type)}')`;
                if (this.draggedItem.count > 1) {
                    draggedItemEl.innerHTML = `<div class="item-count">${this.draggedItem.count}</div>`;
                } else {
                    draggedItemEl.innerHTML = '';
                }
                draggedItemEl.style.display = 'block';
                this.updateGamepadDraggedItemPosition();
            }
        }

        // Update all displays to reflect changes
        this.updateAllDisplays();
        this.checkCraftingRecipe();
        this.checkTableCraftingRecipe();
        this.checkContinueSmelting();
        this.updateQuickCraftSidebar();
    }

    returnItemToSource() {
        if (!this.draggedSource || !this.draggedItem) return;

        let sourceItem;
        if (this.draggedSource.startsWith('hotbar-')) {
            const index = parseInt(this.draggedSource.split('-')[1]);
            sourceItem = this.slots[index];
        } else if (this.draggedSource.startsWith('inventory-')) {
            const index = parseInt(this.draggedSource.split('-')[1]);
            sourceItem = this.mainSlots[index];
        } else if (this.draggedSource.startsWith('craft-') && !this.draggedSource.startsWith('craft-result')) {
            const index = parseInt(this.draggedSource.split('-')[1]);
            sourceItem = this.craftingSlots[index];
        } else if (this.draggedSource.startsWith('table-craft-') && !this.draggedSource.startsWith('table-craft-result')) {
            const index = parseInt(this.draggedSource.split('-')[2]);
            sourceItem = this.tableCraftingSlots[index];
        } else if (this.draggedSource === 'furnace-input') {
            sourceItem = this.furnaceInput;
        } else if (this.draggedSource === 'furnace-fuel') {
            sourceItem = this.furnaceFuel;
        } else if (this.draggedSource === 'furnace-result') {
            sourceItem = this.furnaceResult;
        } else if (this.draggedSource.startsWith('chest-') && this.currentChestData) {
            const index = parseInt(this.draggedSource.split('-')[1]);
            sourceItem = this.currentChestData.inventory[index];
        }

        if (!sourceItem) {
            this.addItemToFirstAvailableSlot(this.draggedItem);
        }
        else if (!sourceItem.type) {
            Object.assign(sourceItem, this.draggedItem);
        }
        else if (sourceItem.type === this.draggedItem.type &&
            sourceItem.count + this.draggedItem.count <= this.maxStackSize) {
            sourceItem.count += this.draggedItem.count;
        }
        else {
            const temp = { ...sourceItem };
            Object.assign(sourceItem, this.draggedItem);
            this.draggedItem = temp;
            this.returnItemToSource();
        }

        this.draggedItem = null;
        this.updateAllDisplays();
        this.updateFurnaceDisplay();
    }

    addItemToFirstAvailableSlot(item) {
        if (!item || item.count <= 0) return false; // Added null check for item
        
        // If it's a tool, it needs its own slot
        if (this.isToolWithDurability(item.type)) {
            for (let i = 0; i < this.slots.length; i++) {
                if (!this.slots[i].type) {
                    this.slots[i] = { ...item }; // copy all properties including durability
                    this.updateSlotUI(i);
                    this.updateInventoryHotbarUI(i);
                    if (i === this.selectedSlot && this._onItemChange) this._onItemChange();
                    return true;
                }
            }
            for (let i = 0; i < this.mainSlots.length; i++) {
                if (!this.mainSlots[i].type) {
                    this.mainSlots[i] = { ...item };
                    this.updateInventorySlotUI(i);
                    return true;
                }
            }
            return false; // No empty slot for the tool
        }

        // Stackable items logic
        for (let i = 0; i < this.slots.length; i++) {
            if (this.slots[i].type === item.type && 
                this.slots[i].count + item.count <= this.maxStackSize) {
                this.slots[i].count += item.count;
                this.updateSlotUI(i);
                this.updateInventoryHotbarUI(i);
                
                if (i === this.selectedSlot && this._onItemChange) {
                    this._onItemChange();
                }
                
                return true;
            }
        }
        
        for (let i = 0; i < this.mainSlots.length; i++) {
            if (this.mainSlots[i].type === item.type && 
                this.mainSlots[i].count + item.count <= this.maxStackSize) {
                this.mainSlots[i].count += item.count;
                this.updateInventorySlotUI(i);
                return true;
            }
        }
        
        for (let i = 0; i < this.slots.length; i++) {
            if (!this.slots[i].type) {
                this.slots[i].type = item.type;
                this.slots[i].count = item.count;
                this.updateSlotUI(i);
                this.updateInventoryHotbarUI(i);
                
                if (i === this.selectedSlot && this._onItemChange) {
                    this._onItemChange();
                }
                
                return true;
            }
        }
        
        for (let i = 0; i < this.mainSlots.length; i++) {
            if (!this.mainSlots[i].type) {
                this.mainSlots[i].type = item.type;
                this.mainSlots[i].count = item.count;
                this.updateInventorySlotUI(i);
                return true;
            }
        }
        
        return false;
    }

    getSelectedItem() {
        return this.slots[this.selectedSlot];
    }
    
    removeSelectedItem() {
        const selectedItem = this.slots[this.selectedSlot];
        if (selectedItem.type && selectedItem.count > 0) {
            const blockType = selectedItem.type;
            selectedItem.count--;
            
            if (selectedItem.count <= 0) {
                selectedItem.type = null;
            }
            
            this.updateSlotUI(this.selectedSlot);
            this.updateInventoryHotbarUI(this.selectedSlot);
            this.updateItemNameDisplay();
            
            return blockType;
        }
        
        return null;
    }

    dropSelectedItem() {
        const selectedItem = this.getSelectedItem();
        if (selectedItem && selectedItem.type && selectedItem.count > 0) {
            const droppedItem = { ...selectedItem, count: 1 }; // Drop one item

            selectedItem.count--;
            if (selectedItem.count <= 0) {
                selectedItem.type = null;
                delete selectedItem.durability;
                delete selectedItem.maxDurability;
            }

            if (this._onItemDrop) {
                this._onItemDrop(droppedItem);
            }

            this.updateAllDisplays();
            this.updateItemNameDisplay();
        }
    }

    getItemTexture(blockType) {
        switch(blockType) {
            case 'dirt': return 'dirt.png';
            case 'stone': return 'stone.png';
            case 'smoothstone': return 'smoothstone.png';
            case 'cobble': return 'cobbles.png';
            case 'wood': return 'logtopbottom.png';
            case 'birchwood': return 'birchlogside.png';
            case 'leaves': return 'leaves.png';
            case 'birchleaves': return 'birchleaves.png';
            case 'plank': return 'plank.png';
            case 'birchplank': return 'birchplank.png';
            case 'craftingtable': return 'cftopbottom.png';
            case 'oakdoor': return 'door.png';
            case 'birchdoor': return 'birchdoor.png';
            case 'sand': return 'sand.png';
            case 'sandstone': return 'sandstone.png';
            case 'cacti': return 'cacti.png';
            case 'furnace': return 'furnaceunlit.png';
            case 'glass': return 'glass.png';
            case 'snow': return 'snow.png';
            case 'stick': return 'stick.png';
            case 'oakslab': return 'plank.png';
            case 'birchslab': return 'birchplank.png';
            case 'chest': return 'chestfront.png';
            case 'woodpickaxe': return 'woodpickaxe.png';
            case 'stonepickaxe': return 'stonepickaxe.png';
            case 'woodhoe': return 'woodhoe.png'; 
            case 'farmland': return 'farmland.png';
            case 'seeds': return 'seeds.png';
            case 'haybale': return 'haybaletopbottom.png';
            case 'wheat': return 'wheat.png';
            case 'newglass': return 'newglass.png';
            case 'oaksapling': return 'oaksapling.png';
            case 'birchsapling': return 'birchsapling.png';
            case 'sprucewood': return 'sprucelog.png';
            case 'spruceleaves': return 'spruceleafs.png';
            case 'spruceplank': return 'spruceplank.png';
            case 'sprucesapling': return 'sprucesapling.png'; // Updated texture
            case 'spruceslab': return 'spruceplank.png'; // Spruce slab uses spruce plank texture
            case 'woodaxe': return 'woodaxe.png'; // Added wood axe texture
            case 'stoneaxe': return 'stoneaxe.png'; // Added stone axe texture
            case 'wool': return 'wool.png';
            case 'string': return 'string.png';
            case 'cherrywood': return 'cherrylog.png';
            case 'cherryleaves': return 'cherryleaves.png';
            case 'cherryplank': return 'cherryplank.png';
            case 'cherrysapling': return 'cherrysapling.png';
            case 'cherryslab': return 'cherryplank.png';
            case 'rose': return 'rose.png';
            case 'dandelion': return 'dandelion.png';
            case 'ladder': return 'asset_name.png';
            case 'oak_stairs': return 'plank.png';
            case 'birch_stairs': return 'birchplank.png';
            case 'spruce_stairs': return 'spruceplank.png';
            case 'cherry_stairs': return 'cherryplank.png';
            case 'cobble_stairs': return 'cobbles.png';
            case 'stone_stairs': return 'smoothstone.png';
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
        
        if (this.textureCache[blockType]) {
            return this.textureCache[blockType];
        }
        
        const img = new Image();
        img.src = this.getItemTexture(blockType);
        this.textureCache[blockType] = img;
        
        return img.src;
    }

    getBlockDisplayName(blockType) {
        if (!blockType) return '';
        
        const nameMap = {
            'grass': 'Grass Block',
            'dirt': 'Dirt',
            'stone': 'Stone',
            'smoothstone': 'Smooth Stone',
            'cobble': 'Cobblestone',
            'wood': 'Oak Log',
            'birchwood': 'Birch Log',
            'sprucewood': 'Spruce Log',
            'cherrywood': 'Cherry Log',
            'leaves': 'Oak Leaves',
            'birchleaves': 'Birch Leaves',
            'spruceleaves': 'Spruce Leaves',
            'cherryleaves': 'Cherry Leaves',
            'plank': 'Oak Planks',
            'birchplank': 'Birch Planks',
            'spruceplank': 'Spruce Planks',
            'cherryplank': 'Cherry Planks',
            'craftingtable': 'Crafting Table',
            'oakdoor': 'Oak Door',
            'birchdoor': 'Birch Door',
            'sand': 'Sand',
            'sandstone': 'Sandstone',
            'cacti': 'Cactus',
            'furnace': 'Furnace',
            'glass': 'Glass',
            'newglass': 'Glass Pane',
            'snow': 'Snow Block',
            'stick': 'Stick',
            'oakslab': 'Oak Slab',
            'birchslab': 'Birch Slab',
            'spruceslab': 'Spruce Slab',
            'cherryslab': 'Cherry Slab',
            'chest': 'Chest',
            'woodpickaxe': 'Wooden Pickaxe',
            'stonepickaxe': 'Stone Pickaxe',
            'woodhoe': 'Wooden Hoe',
            'woodaxe': 'Wooden Axe',
            'stoneaxe': 'Stone Axe',
            'farmland': 'Farmland',
            'seeds': 'Seeds',
            'haybale': 'Hay Bale',
            'wheat': 'Wheat',
            'oaksapling': 'Oak Sapling',
            'birchsapling': 'Birch Sapling',
            'sprucesapling': 'Spruce Sapling',
            'cherrysapling': 'Cherry Sapling',
            'wool': 'Wool',
            'string': 'String',
            'rose': 'Rose',
            'dandelion': 'Dandelion',
            'ladder': 'Ladder',
            'oak_stairs': 'Oak Stairs',
            'birch_stairs': 'Birch Stairs',
            'spruce_stairs': 'Spruce Stairs',
            'cherry_stairs': 'Cherry Stairs',
            'cobble_stairs': 'Cobblestone Stairs',
            'stone_stairs': 'Smooth Stone Stairs'
        };

        if (nameMap[blockType]) {
            return nameMap[blockType];
        }
        
        if (blockType.startsWith('custom_')) {
            const name = blockType.substring(7).replace(/_/g, ' ');
            return name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        }
        
        return blockType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
    
    updateItemNameDisplay() {
        const displayNameEl = document.getElementById('selected-item-name-display');
        if (!displayNameEl) return;

        if (this.itemNameDisplayTimeout) {
            clearTimeout(this.itemNameDisplayTimeout);
            this.itemNameDisplayTimeout = null;
        }
        
        const selectedItem = this.getSelectedItem();
        if (selectedItem && selectedItem.type) {
            const displayName = this.getBlockDisplayName(selectedItem.type);
            displayNameEl.textContent = displayName;
            displayNameEl.classList.add('visible');
            
            this.itemNameDisplayTimeout = setTimeout(() => {
                displayNameEl.classList.remove('visible');
            }, 2000);
        } else {
            displayNameEl.classList.remove('visible');
        }
    }

    getInventoryData() {
        return {
            slots: this.slots.map(slot => ({ ...slot })), // Deep copy
            mainSlots: this.mainSlots.map(slot => ({ ...slot })), // Deep copy
            selectedSlot: this.selectedSlot
        };
    }

    loadFromData(inventoryData) {
        if (inventoryData && inventoryData.slots) {
            this.slots = inventoryData.slots;
            this.selectedSlot = inventoryData.selectedSlot || 0;

            if (inventoryData.mainSlots) {
                this.mainSlots = inventoryData.mainSlots;
            }

            this.updateAllDisplays();

            this.selectSlot(this.selectedSlot);

            return true;
        }
        return false;
    }

    saveInventory() {
    }

    loadInventory() {
        for (let i = 0; i < this.slots.length; i++) {
            this.slots[i] = { type: null, count: 0 };
            this.updateSlotUI(i);
        }

        for (let i = 0; i < this.mainSlots.length; i++) {
            this.mainSlots[i] = { type: null, count: 0 };
        }

        this.selectSlot(this.selectedSlot);

        return false;
    }

    registerCallbacks(onItemChange, onItemDrop) {
        this._onItemChange = onItemChange;
        this._onItemDrop = onItemDrop;
    }

    updateSlotUIDurability(slotElement, itemData) {
        // Remove existing durability bar if any
        const existingBar = slotElement.querySelector('.durability-bar-container');
        if (existingBar) {
            existingBar.remove();
        }

        if (itemData && itemData.type && this.isToolWithDurability(itemData.type) && itemData.durability !== undefined && itemData.maxDurability) {
            const durabilityBarContainer = document.createElement('div');
            durabilityBarContainer.className = 'durability-bar-container';

            const durabilityBar = document.createElement('div');
            durabilityBar.className = 'durability-bar';
            const percentage = (itemData.durability / itemData.maxDurability) * 100;
            durabilityBar.style.width = `${Math.max(0, Math.min(100, percentage))}%`;
            
            // Change color based on durability
            if (percentage <= 25) {
                durabilityBar.style.backgroundColor = 'red';
            } else if (percentage <= 50) {
                durabilityBar.style.backgroundColor = 'orange';
            } else {
                durabilityBar.style.backgroundColor = 'yellow';
            }

            durabilityBarContainer.appendChild(durabilityBar);
            
            // Find the .slot-item to append to, or append to slotElement itself
            const itemVisualEl = slotElement.querySelector('.slot-item') || slotElement.querySelector('.item-stack') || slotElement;
            itemVisualEl.appendChild(durabilityBarContainer);
        }
    }

    getSmeltingRecipe(inputType) {
        if (!this.smeltingRecipes) return null;
        return this.smeltingRecipes.find(recipe => recipe.input === inputType);
    }

    checkContinueSmelting() {
        if (this.furnaceActive) return; // Already smelting, let updateFurnace handle it.
    
        const recipe = this.getSmeltingRecipe(this.furnaceInput.type);
    
        if (!recipe) {
            this.furnaceActive = false;
            this.smeltProgress = 0;
            this.updateFurnaceDisplay();
            return;
        }
    
        // Check if output can accept the result
        const canAcceptOutput = !this.furnaceResult.type ||
                               (this.furnaceResult.type === recipe.result &&
                                this.furnaceResult.count + recipe.count <= this.maxStackSize);
    
        if (!canAcceptOutput) {
            this.furnaceActive = false;
            this.updateFurnaceDisplay();
            return;
        }
        
        // Check for fuel
        if (this.burnTimeLeft > 0) {
            this.furnaceActive = true;
        } else if (this.furnaceFuel.type && this.fuelTypes[this.furnaceFuel.type]) {
            // Consume one fuel item
            this.furnaceFuel.count--;
            this.burnTimeLeft += this.fuelTypes[this.furnaceFuel.type];
            this.maxBurnTime = this.fuelTypes[this.furnaceFuel.type];
            if (this.furnaceFuel.count <= 0) {
                this.furnaceFuel.type = null;
            }
            this.furnaceActive = true;
        } else {
            this.furnaceActive = false;
            if (this.furnaceInput.type) {
                this.showFuelNeededIndicator();
            }
        }
        this.updateFurnaceDisplay();
    }

    updateFurnace(deltaTime) {
        // If the furnace isn't open, we don't need to do anything
        if (!this.currentFurnacePos) {
            if (this.furnaceActive) {
                this.furnaceActive = false;
            }
            return;
        }
        
        // If furnace becomes inactive, try to reactivate it.
        if (!this.furnaceActive) {
            this.checkContinueSmelting();
            // If it's still not active, return.
            if (!this.furnaceActive) {
                this.smeltProgress = 0;
                this.updateFurnaceDisplay();
                return;
            }
        }

        // --- Active Furnace Logic ---
        
        // 1. Deplete fuel
        if (this.burnTimeLeft > 0) {
            this.burnTimeLeft -= deltaTime;
        } else {
            // Fuel ran out mid-smelt
            this.furnaceActive = false;
            this.updateFurnaceDisplay();
            this.checkContinueSmelting(); // Try to use new fuel
            return;
        }

        // 2. Check if we can still smelt the current item
        const recipe = this.getSmeltingRecipe(this.furnaceInput.type);
        const canAcceptOutput = !this.furnaceResult.type ||
                              (this.furnaceResult.type === recipe?.result &&
                               this.furnaceResult.count + (recipe?.count || 0) <= this.maxStackSize);

        if (!recipe || !canAcceptOutput) {
            // Cannot continue (e.g. input removed, or output full)
            this.furnaceActive = false;
            this.updateFurnaceDisplay();
            return;
        }

        // 3. Increase smelt progress
        this.smeltProgress += deltaTime;

        // 4. Check if an item is finished smelting
        if (this.smeltProgress >= this.maxSmeltTime) {
            this.smeltProgress = 0; // Reset for next item

            // Add to output
            if (!this.furnaceResult.type) {
                this.furnaceResult.type = recipe.result;
                this.furnaceResult.count = 0;
            }
            this.furnaceResult.count += recipe.count;

            // Remove from input
            this.furnaceInput.count--;
            if (this.furnaceInput.count <= 0) {
                this.furnaceInput.type = null;
            }

            this.playSmeltingCompleteSound();

            // After smelting, furnace becomes inactive and we try to restart it on the next tick
            this.furnaceActive = false;
        }
        
        // 5. Update UI
        this.updateFurnaceDisplay();
    }
}
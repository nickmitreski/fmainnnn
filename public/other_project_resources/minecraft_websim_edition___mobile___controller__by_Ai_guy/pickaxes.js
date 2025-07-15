export const PICKAXE_EFFECTIVENESS = {
    'woodpickaxe': { rock: 0.42 }, // 90% faster
    'stonepickaxe': { rock: 0.08 } // 80% faster
};

export const BLOCK_CATEGORIES = {
    rock: ['stone', 'cobble', 'smoothstone', 'sandstone', 'furnace', 'stone_stairs', 'cobble_stairs'],
    wood: ['plank', 'birchplank', 'wood', 'birchwood', 'craftingtable', 'oakslab', 'birchslab', 'chest', 'spruceplank', 'sprucewood', 'spruceslab', 'cherrywood', 'cherryplank', 'cherryslab', 'oak_stairs', 'birch_stairs', 'spruce_stairs', 'cherry_stairs'],
    simple: ['dirt', 'grass', 'sand', 'snow', 'cacti', 'wool'],
    instant: ['leaves', 'birchleaves', 'glass', 'newglass', 'spruceleaves', 'cherryleaves']
};

export const BREAK_TIMES = {
    rock: 7.0,     
    wood: 1.7,    
    simple: 0.8,  
    instant: 0.1   
};

export const TOOL_DURABILITIES = {
    'woodpickaxe': 35,
    'stonepickaxe': 80,
    'woodhoe': 35,
    'woodaxe': 35, // Added wooden axe durability
    'stoneaxe': 80 // Added stone axe durability
    // No durability for seeds by default
};

export const AXE_EFFECTIVENESS = {
    'woodaxe': { wood: (1.0 / 1.7) }, // Approx 0.588
    'stoneaxe': { wood: (0.6 / 1.7) }  // Approx 0.353
};

export function getBlockCategory(blockType) {
    if (blockType && blockType.startsWith('custom_')) {
        try {
            const customBlocks = JSON.parse(localStorage.getItem('minecraft_custom_blocks') || '[]');
            const customBlock = customBlocks.find(block => block.id === blockType);
            if (customBlock && customBlock.category) {
                return customBlock.category; // rock, wood, simple
            }
        } catch (e) {
            console.error("Failed to get custom block category:", e);
        }
    }

    for (const [category, blocks] of Object.entries(BLOCK_CATEGORIES)) {
        if (blocks.includes(blockType)) {
            return category;
        }
    }
    return 'simple';
}

export function calculateBreakTime(blockType, toolType) {
    const category = getBlockCategory(blockType);
    let breakTime = BREAK_TIMES[category] || BREAK_TIMES.simple;
    
    if (toolType) {
        if (PICKAXE_EFFECTIVENESS[toolType] && PICKAXE_EFFECTIVENESS[toolType][category]) {
            breakTime *= PICKAXE_EFFECTIVENESS[toolType][category];
        } else if (AXE_EFFECTIVENESS[toolType] && category === 'wood') { // Check for axes on wood
            breakTime *= AXE_EFFECTIVENESS[toolType][category];
        }
    }
    
    return breakTime;
}

export const PICKAXE_TABLE_RECIPES = [
    {
        pattern: [
            'plank', 'plank', 'plank',
            null, 'stick', null,
            null, 'stick', null
        ],
        result: { type: 'woodpickaxe', count: 1 },
        needsExactMatch: true,
        displayName: 'Wooden Pickaxe',
        ingredients: ['3x Planks', '2x Sticks']
    },
    {
        pattern: [
            'birchplank', 'birchplank', 'birchplank',
            null, 'stick', null,
            null, 'stick', null
        ],
        result: { type: 'woodpickaxe', count: 1 },
        needsExactMatch: true,
        displayName: 'Wooden Pickaxe',
        ingredients: ['3x Birch Planks', '2x Sticks']
    },
    {
        pattern: [
            'spruceplank', 'spruceplank', 'spruceplank',
            null, 'stick', null,
            null, 'stick', null
        ],
        result: { type: 'woodpickaxe', count: 1 },
        needsExactMatch: true,
        displayName: 'Wooden Pickaxe',
        ingredients: ['3x Spruce Planks', '2x Sticks']
    },
    {
        pattern: [
            'cobble', 'cobble', 'cobble',
            null, 'stick', null,
            null, 'stick', null
        ],
        result: { type: 'stonepickaxe', count: 1 },
        needsExactMatch: true,
        displayName: 'Stone Pickaxe',
        ingredients: ['3x Cobblestone', '2x Sticks']
    },
    {
        pattern: [
            'plank', 'plank', null,
            null, 'stick', null,
            null, 'stick', null
        ],
        result: { type: 'woodhoe', count: 1 },
        needsExactMatch: true,
        displayName: 'Wooden Hoe',
        ingredients: ['2x Planks', '2x Sticks']
    },
    {
        pattern: [
            'birchplank', 'birchplank', null,
            null, 'stick', null,
            null, 'stick', null
        ],
        result: { type: 'woodhoe', count: 1 },
        needsExactMatch: true,
        displayName: 'Wooden Hoe',
        ingredients: ['2x Birch Planks', '2x Sticks']
    },
    {
        pattern: [
            'spruceplank', 'spruceplank', null,
            null, 'stick', null,
            null, 'stick', null
        ],
        result: { type: 'woodhoe', count: 1 },
        needsExactMatch: true,
        displayName: 'Wooden Hoe',
        ingredients: ['2x Spruce Planks', '2x Sticks']
    },
    // Axe Recipes
    { // Wooden Axe (Oak)
        pattern: [
            'plank', 'plank', null,
            'plank', 'stick', null,
            null, 'stick', null
        ],
        result: { type: 'woodaxe', count: 1 },
        needsExactMatch: true,
        displayName: 'Wooden Axe',
        ingredients: ['3x Oak Planks', '2x Sticks']
    },
    { // Wooden Axe (Birch)
        pattern: [
            'birchplank', 'birchplank', null,
            'birchplank', 'stick', null,
            null, 'stick', null
        ],
        result: { type: 'woodaxe', count: 1 },
        needsExactMatch: true,
        displayName: 'Wooden Axe',
        ingredients: ['3x Birch Planks', '2x Sticks']
    },
    { // Wooden Axe (Spruce)
        pattern: [
            'spruceplank', 'spruceplank', null,
            'spruceplank', 'stick', null,
            null, 'stick', null
        ],
        result: { type: 'woodaxe', count: 1 },
        needsExactMatch: true,
        displayName: 'Wooden Axe',
        ingredients: ['3x Spruce Planks', '2x Sticks']
    },
    { // Stone Axe
        pattern: [
            'cobble', 'cobble', null,
            'cobble', 'stick', null,
            null, 'stick', null
        ],
        result: { type: 'stoneaxe', count: 1 },
        needsExactMatch: true,
        displayName: 'Stone Axe',
        ingredients: ['3x Cobblestone', '2x Sticks']
    }
];

export const PICKAXE_RECIPES = [
    {
        pattern: ['plank', null, 'plank', null, 'stick', null],
        result: { type: 'woodpickaxe', count: 1 },
        needsExactMatch: true,
        displayName: 'Wooden Pickaxe',
        ingredients: ['2x Planks', '1x Stick']
    },
    {
        pattern: ['birchplank', null, 'birchplank', null, 'stick', null],
        result: { type: 'woodpickaxe', count: 1 },
        needsExactMatch: true,
        displayName: 'Wooden Pickaxe',
        ingredients: ['2x Birch Planks', '1x Stick']
    },
    {
        pattern: ['spruceplank', null, 'spruceplank', null, 'stick', null],
        result: { type: 'woodpickaxe', count: 1 },
        needsExactMatch: true,
        displayName: 'Wooden Pickaxe',
        ingredients: ['2x Spruce Planks', '1x Stick']
    },
    {
        pattern: ['plank', 'plank', null, 'stick', null, 'stick'],
        result: { type: 'woodhoe', count: 1 },
        needsExactMatch: true,
        displayName: 'Wooden Hoe',
        ingredients: ['2x Planks', '2x Sticks']
    },
    {
        pattern: ['birchplank', 'birchplank', null, 'stick', null, 'stick'],
        result: { type: 'woodhoe', count: 1 },
        needsExactMatch: true,
        displayName: 'Wooden Hoe',
        ingredients: ['2x Birch Planks', '2x Sticks']
    },
    {
        pattern: ['spruceplank', 'spruceplank', null, 'stick', null, 'stick'],
        result: { type: 'woodhoe', count: 1 },
        needsExactMatch: true,
        displayName: 'Wooden Hoe',
        ingredients: ['2x Spruce Planks', '2x Sticks']
    }
];

export function isPickaxe(itemType) {
    return itemType === 'woodpickaxe' || itemType === 'stonepickaxe' || itemType === 'woodhoe' || itemType === 'woodaxe' || itemType === 'stoneaxe';
}

// Get appropriate texture for pickaxe
export function getPickaxeTexture(pickaxeType) {
    switch(pickaxeType) {
        case 'woodpickaxe':
            return 'woodpickaxe.png';
        case 'stonepickaxe':
            return 'stonepickaxe.png';
        case 'woodhoe':
            return 'woodhoe.png'; 
        default:
            return null;
    }
}

// Added getAxeTexture
export function getAxeTexture(axeType) {
    switch(axeType) {
        case 'woodaxe':
            return 'woodaxe.png';
        case 'stoneaxe':
            return 'stoneaxe.png';
        default:
            return null;
    }
}
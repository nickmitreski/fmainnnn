import * as THREE from 'three';
import { SimplexNoise } from './utils.js';

export const BASIC_RECIPES = [
    {
        pattern: ['wood', null, null, null],
        result: { type: 'plank', count: 4 },
        needsExactMatch: false,
        displayName: 'Wood Planks',
        ingredients: ['1x Wood']
    },
    {
        pattern: [null, 'wood', null, null],
        result: { type: 'plank', count: 4 },
        needsExactMatch: false,
        displayName: 'Wood Planks',
        ingredients: ['1x Wood']
    },
    {
        pattern: [null, null, 'wood', null],
        result: { type: 'plank', count: 4 },
        needsExactMatch: false,
        displayName: 'Wood Planks',
        ingredients: ['1x Wood']
    },
    {
        pattern: [null, null, null, 'wood'],
        result: { type: 'plank', count: 4 },
        needsExactMatch: false,
        displayName: 'Wood Planks',
        ingredients: ['1x Wood']
    },
    {
        pattern: ['birchwood', null, null, null],
        result: { type: 'birchplank', count: 4 },
        needsExactMatch: false,
        displayName: 'Birch Planks',
        ingredients: ['1x Birch Wood']
    },
    {
        pattern: [null, 'birchwood', null, null],
        result: { type: 'birchplank', count: 4 },
        needsExactMatch: false,
        displayName: 'Birch Planks',
        ingredients: ['1x Birch Wood']
    },
    {
        pattern: [null, null, 'birchwood', null],
        result: { type: 'birchplank', count: 4 },
        needsExactMatch: false,
        displayName: 'Birch Planks',
        ingredients: ['1x Birch Wood']
    },
    {
        pattern: [null, null, null, 'birchwood'],
        result: { type: 'birchplank', count: 4 },
        needsExactMatch: false,
        displayName: 'Birch Planks',
        ingredients: ['1x Birch Wood']
    },
    {
        pattern: ['sprucewood', null, null, null],
        result: { type: 'spruceplank', count: 4 },
        needsExactMatch: false,
        displayName: 'Spruce Planks',
        ingredients: ['1x Spruce Wood']
    },
    {
        pattern: [null, 'sprucewood', null, null],
        result: { type: 'spruceplank', count: 4 },
        needsExactMatch: false,
        displayName: 'Spruce Planks',
        ingredients: ['1x Spruce Wood']
    },
    {
        pattern: [null, null, 'sprucewood', null],
        result: { type: 'spruceplank', count: 4 },
        needsExactMatch: false,
        displayName: 'Spruce Planks',
        ingredients: ['1x Spruce Wood']
    },
    {
        pattern: [null, null, null, 'sprucewood'],
        result: { type: 'spruceplank', count: 4 },
        needsExactMatch: false,
        displayName: 'Spruce Planks',
        ingredients: ['1x Spruce Wood']
    },
    {
        pattern: ['cherrywood', null, null, null],
        result: { type: 'cherryplank', count: 4 },
        needsExactMatch: false,
        displayName: 'Cherry Planks',
        ingredients: ['1x Cherry Wood']
    },
    {
        pattern: [null, 'cherrywood', null, null],
        result: { type: 'cherryplank', count: 4 },
        needsExactMatch: false,
        displayName: 'Cherry Planks',
        ingredients: ['1x Cherry Wood']
    },
    {
        pattern: [null, null, 'cherrywood', null],
        result: { type: 'cherryplank', count: 4 },
        needsExactMatch: false,
        displayName: 'Cherry Planks',
        ingredients: ['1x Cherry Wood']
    },
    {
        pattern: [null, null, null, 'cherrywood'],
        result: { type: 'cherryplank', count: 4 },
        needsExactMatch: false,
        displayName: 'Cherry Planks',
        ingredients: ['1x Cherry Wood']
    },
    {
        pattern: ['plank', null, 'plank', null],
        result: { type: 'stick', count: 4 },
        needsExactMatch: true,
        displayName: 'Sticks',
        ingredients: ['2x Planks']
    },
    {
        pattern: [null, 'plank', null, 'plank'],
        result: { type: 'stick', count: 4 },
        needsExactMatch: true,
        displayName: 'Sticks',
        ingredients: ['2x Planks']
    },
    {
        pattern: ['birchplank', null, 'birchplank', null],
        result: { type: 'stick', count: 4 },
        needsExactMatch: true,
        displayName: 'Sticks',
        ingredients: ['2x Birch Planks']
    },
    {
        pattern: [null, 'birchplank', null, 'birchplank'],
        result: { type: 'stick', count: 4 },
        needsExactMatch: true,
        displayName: 'Sticks',
        ingredients: ['2x Birch Planks']
    },
    {
        pattern: ['spruceplank', null, 'spruceplank', null],
        result: { type: 'stick', count: 4 },
        needsExactMatch: true,
        displayName: 'Sticks',
        ingredients: ['2x Spruce Planks']
    },
    {
        pattern: [null, 'spruceplank', null, 'spruceplank'],
        result: { type: 'stick', count: 4 },
        needsExactMatch: true,
        displayName: 'Sticks',
        ingredients: ['2x Spruce Planks']
    },
    {
        pattern: ['cherryplank', null, 'cherryplank', null],
        result: { type: 'stick', count: 4 },
        needsExactMatch: true,
        displayName: 'Sticks',
        ingredients: ['2x Cherry Planks']
    },
    {
        pattern: [null, 'cherryplank', null, 'cherryplank'],
        result: { type: 'stick', count: 4 },
        needsExactMatch: true,
        displayName: 'Sticks',
        ingredients: ['2x Cherry Planks']
    },
    {
        pattern: ['plank', 'plank', 'plank', 'plank'],
        result: { type: 'craftingtable', count: 1 },
        needsExactMatch: true,
        displayName: 'Crafting Table',
        ingredients: ['4x Planks']
    },
    {
        pattern: ['birchplank', 'birchplank', 'birchplank', 'birchplank'],
        result: { type: 'craftingtable', count: 1 },
        needsExactMatch: true,
        displayName: 'Crafting Table',
        ingredients: ['4x Birch Planks']
    },
    {
        pattern: ['spruceplank', 'spruceplank', 'spruceplank', 'spruceplank'],
        result: { type: 'craftingtable', count: 1 },
        needsExactMatch: true,
        displayName: 'Crafting Table',
        ingredients: ['4x Spruce Planks']
    },
    {
        pattern: ['cherryplank', 'cherryplank', 'cherryplank', 'cherryplank'],
        result: { type: 'craftingtable', count: 1 },
        needsExactMatch: true,
        displayName: 'Crafting Table',
        ingredients: ['4x Cherry Planks']
    },
    {
        pattern: ['plank', 'plank', null, null],
        result: { type: 'oakslab', count: 3 },
        needsExactMatch: true,
        displayName: 'Oak Slabs',
        ingredients: ['2x Oak Planks']
    },
    {
        pattern: [null, null, 'plank', 'plank'],
        result: { type: 'oakslab', count: 3 },
        needsExactMatch: true,
        displayName: 'Oak Slabs',
        ingredients: ['2x Oak Planks']
    },
    {
        pattern: ['plank', null, 'plank', null],
        result: { type: 'oakslab', count: 3 },
        needsExactMatch: true,
        displayName: 'Oak Slabs',
        ingredients: ['2x Oak Planks']
    },
    {
        pattern: [null, 'plank', null, 'plank'],
        result: { type: 'oakslab', count: 3 },
        needsExactMatch: true,
        displayName: 'Oak Slabs',
        ingredients: ['2x Oak Planks']
    },
    {
        pattern: ['birchplank', 'birchplank', null, null],
        result: { type: 'birchslab', count: 3 },
        needsExactMatch: true,
        displayName: 'Birch Slabs',
        ingredients: ['2x Birch Planks']
    },
    {
        pattern: [null, null, 'birchplank', 'birchplank'],
        result: { type: 'birchslab', count: 3 },
        needsExactMatch: true,
        displayName: 'Birch Slabs',
        ingredients: ['2x Birch Planks']
    },
    {
        pattern: ['birchplank', null, 'birchplank', null],
        result: { type: 'birchslab', count: 3 },
        needsExactMatch: true,
        displayName: 'Birch Slabs',
        ingredients: ['2x Birch Planks']
    },
    {
        pattern: ['spruceplank', 'spruceplank', null, null],
        result: { type: 'spruceslab', count: 3 },
        needsExactMatch: true,
        displayName: 'Spruce Slabs',
        ingredients: ['2x Spruce Planks']
    },
    {
        pattern: [null, null, 'spruceplank', 'spruceplank'],
        result: { type: 'spruceslab', count: 3 },
        needsExactMatch: true,
        displayName: 'Spruce Slabs',
        ingredients: ['2x Spruce Planks']
    },
    {
        pattern: ['spruceplank', null, 'spruceplank', null],
        result: { type: 'spruceslab', count: 3 },
        needsExactMatch: true,
        displayName: 'Spruce Slabs',
        ingredients: ['2x Spruce Planks']
    },
    {
        pattern: ['cherryplank', 'cherryplank', null, null],
        result: { type: 'cherryslab', count: 3 },
        needsExactMatch: true,
        displayName: 'Cherry Slabs',
        ingredients: ['2x Cherry Planks']
    },
    {
        pattern: [null, null, 'cherryplank', 'cherryplank'],
        result: { type: 'cherryslab', count: 3 },
        needsExactMatch: true,
        displayName: 'Cherry Slabs',
        ingredients: ['2x Cherry Planks']
    },
    {
        pattern: ['cherryplank', null, 'cherryplank', null],
        result: { type: 'cherryslab', count: 3 },
        needsExactMatch: true,
        displayName: 'Cherry Slabs',
        ingredients: ['2x Cherry Planks']
    },
    {
        pattern: ['plank', 'plank', 'plank', 'plank'],
        result: { type: 'chest', count: 1 },
        needsExactMatch: false,
        displayName: 'Chest',
        ingredients: ['4x Planks']
    },
    {
        pattern: ['birchplank', 'birchplank', 'birchplank', 'birchplank'],
        result: { type: 'chest', count: 1 },
        needsExactMatch: false,
        displayName: 'Chest',
        ingredients: ['4x Birch Planks']
    },
    {
        pattern: ['spruceplank', 'spruceplank', 'spruceplank', 'spruceplank'],
        result: { type: 'chest', count: 1 },
        needsExactMatch: false,
        displayName: 'Chest',
        ingredients: ['4x Spruce Planks']
    },
    {
        pattern: ['cherryplank', 'cherryplank', 'cherryplank', 'cherryplank'],
        result: { type: 'chest', count: 1 },
        needsExactMatch: false,
        displayName: 'Chest',
        ingredients: ['4x Cherry Planks']
    },
    {
        pattern: ['glass', 'glass', 'glass', null],
        result: { type: 'newglass', count: 1 },
        needsExactMatch: true,
        displayName: 'New Glass',
        ingredients: ['3x Glass']
    },
    {
        pattern: [null, 'glass', 'glass', 'glass'],
        result: { type: 'newglass', count: 1 },
        needsExactMatch: true,
        displayName: 'New Glass',
        ingredients: ['3x Glass']
    },
    {
        pattern: ['string', 'string', 'string', 'string'],
        result: { type: 'wool', count: 1 },
        needsExactMatch: true,
        displayName: 'Wool',
        ingredients: ['4x String']
    }
];

export const TABLE_RECIPES = [
    {
        pattern: [
            'stick', null, 'stick',
            'stick', 'stick', 'stick',
            'stick', null, 'stick'
        ],
        result: { type: 'ladder', count: 3 },
        needsExactMatch: true,
        displayName: 'Ladder',
        ingredients: ['7x Sticks']
    },
    {
        pattern: ['wood', null, null, null, null, null, null, null, null],
        result: { type: 'plank', count: 4 },
        needsExactMatch: false,
        displayName: 'Wood Planks',
        ingredients: ['1x Wood']
    },
    {
        pattern: [null, 'wood', null, null, null, null, null, null, null],
        result: { type: 'plank', count: 4 },
        needsExactMatch: false,
        displayName: 'Wood Planks',
        ingredients: ['1x Wood']
    },
    {
        pattern: ['birchwood', null, null, null, null, null, null, null, null],
        result: { type: 'birchplank', count: 4 },
        needsExactMatch: false,
        displayName: 'Birch Planks',
        ingredients: ['1x Birch Wood']
    },
    {
        pattern: [null, 'birchwood', null, null, null, null, null, null, null],
        result: { type: 'birchplank', count: 4 },
        needsExactMatch: false,
        displayName: 'Birch Planks',
        ingredients: ['1x Birch Wood']
    },
    {
        pattern: ['sprucewood', null, null, null, null, null, null, null, null],
        result: { type: 'spruceplank', count: 4 },
        needsExactMatch: false,
        displayName: 'Spruce Planks',
        ingredients: ['1x Spruce Wood']
    },
    {
        pattern: [null, 'sprucewood', null, null, null, null, null, null, null],
        result: { type: 'spruceplank', count: 4 },
        needsExactMatch: false,
        displayName: 'Spruce Planks',
        ingredients: ['1x Spruce Wood']
    },
    {
        pattern: ['cherrywood', null, null, null, null, null, null, null, null],
        result: { type: 'cherryplank', count: 4 },
        needsExactMatch: false,
        displayName: 'Cherry Planks',
        ingredients: ['1x Cherry Wood']
    },
    {
        pattern: [null, 'cherrywood', null, null, null, null, null, null, null],
        result: { type: 'cherryplank', count: 4 },
        needsExactMatch: false,
        displayName: 'Cherry Planks',
        ingredients: ['1x Cherry Wood']
    },
    {
        pattern: ['plank', null, null, 'plank', null, null, null, null, null],
        result: { type: 'stick', count: 4 },
        needsExactMatch: true,
        displayName: 'Sticks',
        ingredients: ['2x Planks']
    },
    {
        pattern: [null, 'plank', null, null, 'plank', null, null, null, null],
        result: { type: 'stick', count: 4 },
        needsExactMatch: true,
        displayName: 'Sticks',
        ingredients: ['2x Planks']
    },
    {
        pattern: ['birchplank', null, null, 'birchplank', null, null, null, null, null],
        result: { type: 'stick', count: 4 },
        needsExactMatch: true,
        displayName: 'Sticks',
        ingredients: ['2x Birch Planks']
    },
    {
        pattern: [null, 'birchplank', null, null, 'birchplank', null, null, null, null],
        result: { type: 'stick', count: 4 },
        needsExactMatch: true,
        displayName: 'Sticks',
        ingredients: ['2x Birch Planks']
    },
    {
        pattern: ['spruceplank', null, null, 'spruceplank', null, null, null, null, null],
        result: { type: 'stick', count: 4 },
        needsExactMatch: true,
        displayName: 'Sticks',
        ingredients: ['2x Spruce Planks']
    },
    {
        pattern: [null, 'spruceplank', null, null, 'spruceplank', null, null, null, null],
        result: { type: 'stick', count: 4 },
        needsExactMatch: true,
        displayName: 'Sticks',
        ingredients: ['2x Spruce Planks']
    },
    {
        pattern: [
            'plank', 'plank', null,
            'plank', 'plank', null,
            'plank', 'plank', null
        ],
        result: { type: 'oakdoor', count: 1 },
        needsExactMatch: true,
        displayName: 'Oak Door',
        ingredients: ['6x Planks']
    },
    {
        pattern: [
            'birchplank', 'birchplank', null,
            'birchplank', 'birchplank', null,
            'birchplank', 'birchplank', null
        ],
        result: { type: 'birchdoor', count: 1 },
        needsExactMatch: true,
        displayName: 'Birch Door',
        ingredients: ['6x Birch Planks']
    },
    {
        pattern: [
            'spruceplank', 'spruceplank', null,
            'spruceplank', 'spruceplank', null,
            'spruceplank', 'spruceplank', null
        ],
        result: { type: 'sprucedoor', count: 1 },
        needsExactMatch: true,
        displayName: 'Spruce Door',
        ingredients: ['6x Spruce Planks']
    },
    {
        pattern: [
            'cherryplank', 'cherryplank', null,
            'cherryplank', 'cherryplank', null,
            'cherryplank', 'cherryplank', null
        ],
        result: { type: 'cherrydoor', count: 1 },
        needsExactMatch: true,
        displayName: 'Cherry Door',
        ingredients: ['6x Cherry Planks']
    },
    {
        pattern: [
            'glass', null, null,
            'glass', null, null,
            'glass', null, null
        ],
        result: { type: 'newglass', count: 1 },
        needsExactMatch: true,
        displayName: 'New Glass',
        ingredients: ['3x Glass']
    },
    {
        pattern: [
            null, 'glass', null,
            null, 'glass', null,
            null, 'glass', null
        ],
        result: { type: 'newglass', count: 1 },
        needsExactMatch: true,
        displayName: 'New Glass',
        ingredients: ['3x Glass']
    },
    {
        pattern: [
            null, null, 'glass',
            null, null, 'glass',
            null, null, 'glass'
        ],
        result: { type: 'newglass', count: 1 },
        needsExactMatch: true,
        displayName: 'New Glass',
        ingredients: ['3x Glass']
    },
    {
        pattern: [
            'cobble', 'cobble', 'cobble',
            'cobble', null, 'cobble',
            'cobble', 'cobble', 'cobble'
        ],
        result: { type: 'furnace', count: 1 },
        needsExactMatch: true,
        displayName: 'Furnace',
        ingredients: ['8x Cobblestone']
    },
    {
        pattern: [
            'wheat', 'wheat', 'wheat',
            'wheat', 'wheat', 'wheat',
            'wheat', 'wheat', 'wheat'
        ],
        result: { type: 'haybale', count: 1 },
        needsExactMatch: true,
        displayName: 'Hay Bale',
        ingredients: ['9x Wheat']
    },
    {
        pattern: [
            'plank', 'plank', 'plank',
            'plank', null, 'plank',
            'plank', 'plank', 'plank'
        ],
        result: { type: 'chest', count: 1 },
        needsExactMatch: true,
        displayName: 'Chest',
        ingredients: ['8x Planks']
    },
    {
        pattern: [
            'birchplank', 'birchplank', 'birchplank',
            'birchplank', null, 'birchplank',
            'birchplank', 'birchplank', 'birchplank'
        ],
        result: { type: 'chest', count: 1 },
        needsExactMatch: true,
        displayName: 'Chest',
        ingredients: ['8x Birch Planks']
    },
    {
        pattern: [
            'spruceplank', 'spruceplank', 'spruceplank',
            'spruceplank', null, 'spruceplank',
            'spruceplank', 'spruceplank', 'spruceplank'
        ],
        result: { type: 'chest', count: 1 },
        needsExactMatch: true,
        displayName: 'Chest',
        ingredients: ['8x Spruce Planks']
    },
    {
        pattern: [
            'cherryplank', 'cherryplank', 'cherryplank',
            'cherryplank', null, 'cherryplank',
            'cherryplank', 'cherryplank', 'cherryplank'
        ],
        result: { type: 'chest', count: 1 },
        needsExactMatch: true,
        displayName: 'Chest',
        ingredients: ['8x Cherry Planks']
    },
    {
        pattern: [
            'string', 'string', null,
            'string', 'string', null,
            null, null, null
        ],
        result: { type: 'wool', count: 1 },
        needsExactMatch: true,
        displayName: 'Wool',
        ingredients: ['4x String']
    },
    // Oak Stairs
    {
        pattern: [
            'plank', null, null,
            'plank', 'plank', null,
            'plank', 'plank', 'plank'
        ],
        result: { type: 'oak_stairs', count: 4 },
        needsExactMatch: true,
        displayName: 'Oak Stairs',
        ingredients: ['6x Oak Planks']
    },
    // Birch Stairs
    {
        pattern: [
            'birchplank', null, null,
            'birchplank', 'birchplank', null,
            'birchplank', 'birchplank', 'birchplank'
        ],
        result: { type: 'birch_stairs', count: 4 },
        needsExactMatch: true,
        displayName: 'Birch Stairs',
        ingredients: ['6x Birch Planks']
    },
    // Spruce Stairs
    {
        pattern: [
            'spruceplank', null, null,
            'spruceplank', 'spruceplank', null,
            'spruceplank', 'spruceplank', 'spruceplank'
        ],
        result: { type: 'spruce_stairs', count: 4 },
        needsExactMatch: true,
        displayName: 'Spruce Stairs',
        ingredients: ['6x Spruce Planks']
    },
    // Cherry Stairs
    {
        pattern: [
            'cherryplank', null, null,
            'cherryplank', 'cherryplank', null,
            'cherryplank', 'cherryplank', 'cherryplank'
        ],
        result: { type: 'cherry_stairs', count: 4 },
        needsExactMatch: true,
        displayName: 'Cherry Stairs',
        ingredients: ['6x Cherry Planks']
    },
    // Cobblestone Stairs
    {
        pattern: [
            'cobble', null, null,
            'cobble', 'cobble', null,
            'cobble', 'cobble', 'cobble'
        ],
        result: { type: 'cobble_stairs', count: 4 },
        needsExactMatch: true,
        displayName: 'Cobblestone Stairs',
        ingredients: ['6x Cobblestone']
    },
    // Stone Stairs
    {
        pattern: [
            'smoothstone', null, null,
            'smoothstone', 'smoothstone', null,
            'smoothstone', 'smoothstone', 'smoothstone'
        ],
        result: { type: 'stone_stairs', count: 4 },
        needsExactMatch: true,
        displayName: 'Smooth Stone Stairs',
        ingredients: ['6x Smoothstone']
    }
];

export const SMELTING_RECIPES = [
    {
        input: 'sand',
        result: 'glass',
        count: 1
    },
    {
        input: 'cobble',
        result: 'smoothstone',
        count: 1
    },
    {
        input: 'wood',
        result: 'plank',
        count: 4
    },
    {
        input: 'birchwood',
        result: 'birchplank',
        count: 4
    },
    {
        input: 'sprucewood',
        result: 'spruceplank',
        count: 4
    },
    {
        input: 'cherrywood',
        result: 'cherryplank',
        count: 4
    }
];

export const FUEL_TYPES = {
    'wood': 20,      
    'birchwood': 20, 
    'sprucewood': 20,
    'plank': 10,     
    'birchplank': 10,
    'spruceplank': 10,
    'cherrywood': 20,
    'cherryplank': 10
};
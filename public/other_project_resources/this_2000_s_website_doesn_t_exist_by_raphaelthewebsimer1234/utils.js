export const galleryImages = [
    'gallery-cat.png',
    'gallery-dog.png',
    'gallery-hamster.png',
    'gallery-pizza.png',
];

export const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Function to determine the era based on the year
export const getEra = (year) => {
    if (year <= 2000) return 'early';
    if (year <= 2006) return 'skeuomorphic';
    return 'late'; // Corresponds to Frutiger Aero
};
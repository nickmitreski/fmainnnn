import { getWebsiteStructureAI, generateGuestbookEntriesAI, generatePageContentAI, checkIfTopicIsAnachronisticGameAI, checkIfTopicIsSearchEngineAI, generateSearchResultsAI, checkIfTopicIsVideoSharingAI, generateVideoCommentsAI, checkIfTopicIsWikiAI, generateWikiArticleAI, checkIfTopicIsGibberishAI, generateVideoListAI } from './ai.js';
import { setRendererConfig, generateStandardPage, generateGalleryPage, generateGuestbookPage, generateVideoPage, generateVideoWatchPageHTML } from './renderer.js';

const promptInput = document.getElementById('prompt-input');
const generateBtn = document.getElementById('generate-btn');
const websiteContainer = document.getElementById('website-container');
const yearSelect = document.getElementById('year-select');
const loadingIndicator = document.getElementById('loading-indicator');

let generatedPages = {};
let lastGeneratedConfig = {}; // Store the config for the current site

// --- CALCULATOR LOGIC ---
// State for the calculator
let calculatorState = {
    displayValue: '0',
    firstOperand: null,
    operator: null,
    waitingForSecondOperand: false,
};

// Calculation functions
const performCalculation = {
    '÷': (first, second) => first / second,
    '×': (first, second) => first * second,
    '+': (first, second) => first + second,
    '-': (first, second) => first - second,
    '=': (first, second) => second,
};

function handleCalculatorInput(type, value) {
    const display = document.getElementById('calculator-display');
    if (!display) return;

    switch(type) {
        case 'number':
            if (calculatorState.waitingForSecondOperand) {
                calculatorState.displayValue = value;
                calculatorState.waitingForSecondOperand = false;
            } else {
                calculatorState.displayValue = calculatorState.displayValue === '0' ? value : calculatorState.displayValue + value;
            }
            if (value === '.') {
                if (calculatorState.displayValue.indexOf('.') !== calculatorState.displayValue.lastIndexOf('.')) {
                    calculatorState.displayValue = calculatorState.displayValue.slice(0, -1);
                }
            }
            break;
        case 'operator':
            const inputValue = parseFloat(calculatorState.displayValue);
            if (calculatorState.operator && calculatorState.waitingForSecondOperand) {
                calculatorState.operator = value;
                return;
            }
            if (calculatorState.firstOperand === null) {
                calculatorState.firstOperand = inputValue;
            } else if (calculatorState.operator) {
                const result = performCalculation[calculatorState.operator](calculatorState.firstOperand, inputValue);
                calculatorState.displayValue = `${parseFloat(result.toPrecision(15))}`;
                calculatorState.firstOperand = result;
            }
            calculatorState.waitingForSecondOperand = true;
            calculatorState.operator = value;
            break;
        case 'function':
             switch (value) {
                case 'AC':
                    calculatorState.displayValue = '0';
                    calculatorState.firstOperand = null;
                    calculatorState.operator = null;
                    calculatorState.waitingForSecondOperand = false;
                    break;
                case '+/-':
                    calculatorState.displayValue = String(parseFloat(calculatorState.displayValue) * -1);
                    break;
                case '%':
                    calculatorState.displayValue = String(parseFloat(calculatorState.displayValue) / 100);
                    break;
            }
            break;
    }

    display.textContent = calculatorState.displayValue;
}

function renderCalculator(container) {
     // Reset state whenever calculator is rendered
    calculatorState = {
        displayValue: '0',
        firstOperand: null,
        operator: null,
        waitingForSecondOperand: false,
    };

    const calculatorHTML = `
        <div class="calculator-container">
            <div id="calculator-display" class="calculator-display">0</div>
            <div class="calculator-buttons">
                <button class="calc-btn function" data-type="function" data-value="AC">AC</button>
                <button class="calc-btn function" data-type="function" data-value="+/-">+/-</button>
                <button class="calc-btn function" data-type="function" data-value="%">%</button>
                <button class="calc-btn operator" data-type="operator" data-value="÷">÷</button>
                <button class="calc-btn number" data-type="number" data-value="7">7</button>
                <button class="calc-btn number" data-type="number" data-value="8">8</button>
                <button class="calc-btn number" data-type="number" data-value="9">9</button>
                <button class="calc-btn operator" data-type="operator" data-value="×">×</button>
                <button class="calc-btn number" data-type="number" data-value="4">4</button>
                <button class="calc-btn number" data-type="number" data-value="5">5</button>
                <button class="calc-btn number" data-type="number" data-value="6">6</button>
                <button class="calc-btn operator" data-type="operator" data-value="-">-</button>
                <button class="calc-btn number" data-type="number" data-value="1">1</button>
                <button class="calc-btn number" data-type="number" data-value="2">2</button>
                <button class="calc-btn number" data-type="number" data-value="3">3</button>
                <button class="calc-btn operator" data-type="operator" data-value="+">+</button>
                <button class="calc-btn number zero" data-type="number" data-value="0">0</button>
                <button class="calc-btn number" data-type="number" data-value=".">.</button>
                <button class="calc-btn operator" data-type="operator" data-value="=">=</button>
            </div>
        </div>`;
    container.innerHTML = calculatorHTML;
}

// --- WEBSITE GENERATION ---

function renderPage(pageName) {
    if (generatedPages[pageName]) {
        websiteContainer.innerHTML = generatedPages[pageName];
        // Re-attach event listeners for navigation links
        const navLinks = websiteContainer.querySelectorAll('.site-nav a, .site-nav-two-column a');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.target.getAttribute('data-page');
                renderPage(page);
            });
        });

        // Add listeners for video sharing pages
        if (lastGeneratedConfig.specialCase === 'video_sharing') {
            addVideoClickListeners();
        }

        // Add wiki link listeners if it's a wiki page
        if (lastGeneratedConfig.specialCase === 'wiki') {
             addWikiLinkListeners();
        }
    }
}

async function handleVideoSearch(query) {
    const queryLower = query.toLowerCase().trim();
    // Use original topic if search is empty
    const generationTopic = queryLower || lastGeneratedConfig.topic;

    websiteContainer.innerHTML = `
        <div class="video-search-loading">
            <h2>Generating new videos about "${generationTopic}"...</h2>
            <div class="spinner"></div>
        </div>`;
    
    const { navLinks, layout } = lastGeneratedConfig;

    // Create a new config for generation based on the search query
    const generationConfig = { ...lastGeneratedConfig, topic: generationTopic };

    // Generate a completely new list of videos based on the topic
    const newVideoList = await generateVideoListAI(generationConfig);

    // Update the config and generated pages with the new video list
    // This makes the new videos the "main" content of the site until a new search
    lastGeneratedConfig.videoList = newVideoList;
    for (const pageName of navLinks) {
        if (['home', 'browse', 'videos'].includes(pageName)) {
            generatedPages[pageName] = await generateVideoPage(pageName, navLinks, layout, newVideoList);
        }
    }

    // Render the home page, which now contains the newly generated videos
    renderPage('home');
}

async function generateWebsite() {
    generateBtn.disabled = true;
    loadingIndicator.style.display = 'block';
    websiteContainer.innerHTML = '';
    
    const topic = promptInput.value.trim() || "My Awesome Website";
    const year = parseInt(yearSelect.value, 10);
    const lowerCaseTopic = topic.toLowerCase();
    
    // Check for special cases
    let specialCase = null;
    
    // New special case checks
    if (topic.length === 1 && /^[a-zA-Z]$/.test(topic)) {
        specialCase = 'single_letter_error';
    } else {
        const gibberishCheck = await checkIfTopicIsGibberishAI(topic);
        if (gibberishCheck.isGibberish) {
            specialCase = 'domain_sale';
        }
    }

    if (!specialCase) {
        const anachronismCheck = await checkIfTopicIsAnachronisticGameAI(topic, year);
        const searchEngineCheck = await checkIfTopicIsSearchEngineAI(topic);
        const videoSiteCheck = await checkIfTopicIsVideoSharingAI(topic);
        const wikiCheck = await checkIfTopicIsWikiAI(topic);

        if (lowerCaseTopic.includes('ames') && year === 2002) {
            specialCase = 'ames_shutdown';
        } else if (lowerCaseTopic.includes('ames') && year >= 2003) {
            specialCase = 'domain_sale';
        } else if (videoSiteCheck.isVideoSite) {
            specialCase = 'video_sharing';
        } else if (searchEngineCheck.isSearchEngine) {
            specialCase = 'search_engine';
        } else if (wikiCheck.isWiki) {
            specialCase = 'wiki';
        } else if (anachronismCheck.isGame && anachronismCheck.isAnachronistic) {
            specialCase = 'domain_sale';
        } else if (lowerCaseTopic.includes('michael jackson') && year === 2009) {
            specialCase = 'mj_memorial';
        } else if (lowerCaseTopic.includes('circuit city') && year === 2009) {
            specialCase = 'circuit_city_shutdown';
        }
    }

    lastGeneratedConfig = { topic, year, specialCase };
    generatedPages = {}; // Reset pages

    // 1. Generate website structure (nav links, layout, and theme)
    const structure = await getWebsiteStructureAI({ topic, year, specialCase });
    const { type: websiteType, navLinks, layout, skeuomorphicTheme } = structure;
    
    lastGeneratedConfig = { ...lastGeneratedConfig, navLinks, layout, skeuomorphicTheme };

    // Handle video site data loading separately
    if (specialCase === 'video_sharing') {
        const videoList = await generateVideoListAI(lastGeneratedConfig);
        lastGeneratedConfig.videoList = videoList;
    }

    // 2. Generate content for all pages in parallel
    const contentPromises = {};
    for (const page of navLinks) {
        let needsContent = true;
        if (['gallery', 'guestbook', 'memories', 'tributes'].includes(page)) {
            needsContent = false;
        }
        if (specialCase === 'video_sharing' && ['home', 'browse', 'videos'].includes(page)) {
            needsContent = false;
        }

        if (needsContent) {
             contentPromises[page] = generatePageContentAI(page, lastGeneratedConfig);
        }
    }
    // Guestbook entries are a special case
    contentPromises.guestbookEntries = generateGuestbookEntriesAI(lastGeneratedConfig);

    const generatedResults = await Promise.all(Object.values(contentPromises));
    const contentKeys = Object.keys(contentPromises);
    const pageContents = {};
    let guestbookEntries = [];
    for (let i = 0; i < contentKeys.length; i++) {
        const key = contentKeys[i];
        if (key === 'guestbookEntries') {
            guestbookEntries = generatedResults[i] || [];
        } else {
            pageContents[key] = generatedResults[i];
        }
    }
    
    // 3. Configure the renderer with the latest generated info
    setRendererConfig(lastGeneratedConfig, guestbookEntries);

    // 4. Generate the HTML for each page
    for (const pageName of navLinks) {
        if (specialCase === 'video_sharing' && ['home', 'browse', 'videos'].includes(pageName)) {
            generatedPages[pageName] = await generateVideoPage(pageName, navLinks, layout, lastGeneratedConfig.videoList);
        } else if (['gallery', 'memories', 'tributes'].includes(pageName)) {
            generatedPages[pageName] = await generateGalleryPage(pageName, navLinks, layout);
        } else if (pageName === 'guestbook') {
            generatedPages.guestbook = await generateGuestbookPage(navLinks, layout);
        } else {
            const content = pageContents[pageName] || `<p>Content for ${pageName} is under construction!</p>`;
            generatedPages[pageName] = await generateStandardPage(pageName, content, navLinks, layout);
        }
    }

    // Render the home page initially
    renderPage(navLinks[0] || 'home');
    
    loadingIndicator.style.display = 'none';
    generateBtn.disabled = false;
}

generateBtn.addEventListener('click', generateWebsite);

async function handleSearch(query) {
    const resultsContainer = document.getElementById('search-results-container');
    if (!resultsContainer) return;

    if (query.toLowerCase().trim() === 'calculator') {
        renderCalculator(resultsContainer);
        return;
    }

    resultsContainer.innerHTML = `<p>Searching the information super-highway for "${query}"...</p><div class="spinner"></div>`;

    const year = lastGeneratedConfig.year || 2005;
    const results = await generateSearchResultsAI(query, year);

    let resultsHTML = `<p>Found ${results.length} results for "<strong>${query}</strong>":</p><hr>`;
    results.forEach(result => {
        resultsHTML += `
            <div class="search-result">
                <h3><a href="#" onclick="return false;">${result.title}</a></h3>
                <p class="search-url">${result.url}</p>
                <p class="search-snippet">${result.snippet}</p>
            </div>
        `;
    });

    resultsContainer.innerHTML = resultsHTML;
}

// Attach event listeners to the nav links after a page is rendered
websiteContainer.addEventListener('click', (e) => {
    if (e.target.tagName === 'A' && e.target.hasAttribute('data-page')) {
        e.preventDefault();
        const page = e.target.getAttribute('data-page');
        renderPage(page);
    }
    // Handle calculator button clicks
    if (e.target.matches('.calc-btn')) {
        const type = e.target.dataset.type;
        const value = e.target.dataset.value;
        handleCalculatorInput(type, value);
    }
    // Prevent form submission in guestbook
    if (e.target.tagName === 'INPUT' && e.target.type === 'submit') {
        e.preventDefault();
        const form = e.target.closest('form');
        if (form && form.classList.contains('search-form')) {
            const input = form.querySelector('.search-input');
            if (input && input.value) {
                handleSearch(input.value);
            }
        } else if (form && form.classList.contains('video-search-form')) {
            const input = form.querySelector('.video-search-input');
            handleVideoSearch(input.value); // Does not need to be a non-empty value
        } else {
            alert('Guestbook signing is currently under construction! Check back soon!');
        }
    }
    // Handle video clicks
    const videoItem = e.target.closest('.video-item-clickable');
    if (videoItem) {
        e.preventDefault();
        const videoDetails = JSON.parse(videoItem.dataset.videoDetails);
        renderVideoWatchPage(videoDetails);
    }
});

function addVideoClickListeners() {
    websiteContainer.querySelectorAll('.video-item-clickable').forEach(item => {
        if (!item.dataset.listenerAttached) {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const videoDetails = JSON.parse(item.dataset.videoDetails);
                renderVideoWatchPage(videoDetails);
            });
            item.dataset.listenerAttached = 'true';
        }
    });
}

async function renderVideoWatchPage(videoDetails) {
    websiteContainer.innerHTML = `
        <div class="video-watch-loading">
            <h2>Loading Video: ${videoDetails.title}</h2>
            <p>Please wait while we load the video experience...</p>
            <div class="spinner"></div>
        </div>`;

    // 1. Get Up Next videos (all videos except the current one)
    const upNextVideos = lastGeneratedConfig.videoList.filter(v => v.title !== videoDetails.title);

    // 2. Generate comments for this video
    const comments = await generateVideoCommentsAI(videoDetails.title, lastGeneratedConfig);

    // 3. Generate a large "player" image for the video
    const playerImage = await websim.imageGen({
        prompt: `A blurry, low-resolution video player showing a still frame for a video titled "${videoDetails.title}". The image should look like it's from a 2000s-era digital video. Include some fake player UI elements like a play button and timeline.`,
        aspect_ratio: "16:9"
    });

    // 4. Render the final page
    const pageHtml = await generateVideoWatchPageHTML(videoDetails, upNextVideos, comments, playerImage.url);
    websiteContainer.innerHTML = pageHtml;

    // 5. Re-attach listeners for nav and other video links
    const navLinks = websiteContainer.querySelectorAll('.site-nav a, .site-nav-two-column a');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = e.target.getAttribute('data-page');
            renderPage(page);
        });
    });
    addVideoClickListeners();
}

function addWikiLinkListeners() {
    websiteContainer.querySelectorAll('a.wiki-link').forEach(link => {
        // Check if the listener has already been attached to avoid duplicates
        if (!link.dataset.listenerAttached) {
            link.addEventListener('click', handleWikiLinkClick);
            link.dataset.listenerAttached = 'true';
        }
    });
}

async function handleWikiLinkClick(e) {
    e.preventDefault();
    const articleTitle = e.target.dataset.pageTitle;
    const contentArea = websiteContainer.querySelector('.site-content');
    if (!contentArea) return;

    // Show loading state
    contentArea.innerHTML = `
        <h2>${articleTitle}</h2>
        <p>Loading article...</p>
        <div class="spinner"></div>
    `;

    // Generate new article content
    const articleHtml = await generateWikiArticleAI(articleTitle, lastGeneratedConfig);

    // Create a new page in memory (without adding to nav)
    const newPage = await generateStandardPage(articleTitle, articleHtml, lastGeneratedConfig.navLinks, lastGeneratedConfig.layout);

    // We only want the *content* of the new page, not the whole structure
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = newPage;
    const newContent = tempDiv.querySelector('.site-content').innerHTML;

    // Replace the content and re-attach listeners for any new links
    contentArea.innerHTML = newContent;
    addWikiLinkListeners();
}
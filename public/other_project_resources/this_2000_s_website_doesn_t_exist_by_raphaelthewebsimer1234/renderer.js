import { getRandomInt, getEra, getRandomElement, galleryImages } from './utils.js';
import { generateGalleryImagesAI, generateVideoListAI, generateVideoCommentsAI } from './ai.js';

let guestbookEntries = [];
let lastGeneratedConfig = {};

export function setRendererConfig(config, entries) {
    lastGeneratedConfig = config;
    guestbookEntries = entries;
}

function parseWikiText(htmlContent) {
    if (!htmlContent) return '';
    // This regex finds [[Article Name]] and captures "Article Name"
    const wikiLinkRegex = /\[\[(.*?)\]\]/g;
    return htmlContent.replace(wikiLinkRegex, (match, articleTitle) => {
        const pageId = articleTitle.trim().toLowerCase().replace(/\s+/g, '_');
        return `<a href="#" class="wiki-link" data-page-title="${articleTitle.trim()}">${articleTitle.trim()}</a>`;
    });
}

function createPageHTML(pageContent, navLinks, layoutType) {
    const { topic, year, specialCase, skeuomorphicTheme } = lastGeneratedConfig;

    const navHTML = navLinks.map(link => {
        const displayName = link.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        return `<a data-page="${link}">${displayName}</a>`;
    }).join(' | ');

    const era = getEra(year);
    let siteStyles = '';
    let headerFont = "'Comic Sans MS', cursive";
    let bodyClasses = `site-body era-${era} ${layoutType}`;
    let footerImage = 'under-construction.gif';

    if (specialCase === 'wiki') {
        bodyClasses += ' wiki-site';
    }

    if (specialCase === 'mj_memorial' || specialCase === 'circuit_city_shutdown' || specialCase === 'ames_shutdown') {
        const themeClass = specialCase.replace(/_/g, '-');
        siteStyles = `background-color: #111; color: #ccc; font-family: 'Georgia', serif;`;
        headerFont = "'Georgia', serif";
        bodyClasses += ` ${themeClass}`;
        footerImage = ''; // No cheesy gif on these pages
    } else if (specialCase === 'domain_sale') {
        const domainName = topic.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/\s+/g, '-') + '.com';
        siteStyles = `background-color: #f0f0f0; color: #333; font-family: 'Arial', sans-serif;`;
        headerFont = "'Arial Black', sans-serif";
        bodyClasses += ' domain-sale';
        footerImage = '';
    } else if (specialCase === 'single_letter_error') {
        siteStyles = `background-color: #000080; color: #FFFFFF; font-family: 'Courier New', monospace;`; // Classic BSOD colors
        headerFont = "'Courier New', monospace";
        footerImage = '';
    } else if (era === 'early') {
        siteStyles = `background-color: #${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}; font-family: 'Times New Roman', serif;`;
    } else if (era === 'skeuomorphic') {
        bodyClasses += ` skeuomorphic skeuomorphic-${skeuomorphicTheme || 'linen'}`;
        // The background image is now set in CSS based on the theme
        siteStyles = `font-family: 'Helvetica', Arial, sans-serif; color: #333;`;
        headerFont = "'Helvetica Neue', Helvetica, Arial, sans-serif";
    } else { // late
        bodyClasses += ' frutiger-aero';
        siteStyles = `
            background-image: url('frutiger-background.png');
            background-size: cover;
            background-position: center;
            font-family: Arial, sans-serif;
            color: #222;
        `;
        headerFont = "Arial, Helvetica, sans-serif";
    }

    const welcomeMessage = specialCase === 'mj_memorial' 
        ? `In Loving Memory of Michael Jackson` 
        : specialCase === 'circuit_city_shutdown'
        ? 'So Long, Circuit City'
        : specialCase === 'ames_shutdown'
        ? 'Goodbye, Ames'
        : specialCase === 'domain_sale'
        ? `This Domain Is For Sale`
        : specialCase === 'single_letter_error'
        ? 'A Fatal Exception Has Occurred'
        : `~*~ Welcome to ${topic} ~*~`;

    const videoSearchForm = specialCase === 'video_sharing'
        ? `
            <form class="video-search-form">
                <input type="text" class="video-search-input" placeholder="Search videos...">
                <input type="submit" class="video-search-button" value="Search">
            </form>
        `
        : '';

    const footerText = specialCase === 'mj_memorial' 
        ? `Rest in Peace. 1958 - 2009` 
        : specialCase === 'domain_sale'
        ? `&copy; ${year} Domain Holdings Inc.`
        : specialCase === 'single_letter_error'
        ? `Press any key to restart.`
        : `&copy; ${year} ${topic}. All rights reserved. Probably.`;

    const footer = `
        <footer class="site-footer">
            <p>This website was last updated on ${new Date(year, getRandomInt(0, 11), getRandomInt(1, 28)).toDateString()}</p>
            ${footerImage ? `<img src="${footerImage}" alt="Under Construction" width="100">` : ''}
            <div class="hit-counter">
                <span>${String(getRandomInt(100, 99999)).padStart(6, '0')}</span>
            </div>
            <p>${footerText}</p>
        </footer>
    `;

    const header = `
        <header class="site-header">
            <marquee behavior="scroll" direction="left" scrollamount="${getRandomInt(4, 10)}">
                <h1 style="font-family: ${headerFont};">${welcomeMessage}</h1>
            </marquee>
            ${videoSearchForm}
        </header>
    `;
    
    if (layoutType === 'layout2') { // Two-column layout
        return `
            <div class="${bodyClasses}" style="${siteStyles}">
                ${header}
                <div class="site-main-container-two-column">
                    <nav class="site-nav-two-column">
                        ${navLinks.map(link => `<a data-page="${link}">${link.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</a>`).join('')}
                    </nav>
                    <main class="site-content">
                        ${pageContent}
                    </main>
                </div>
                ${footer}
            </div>
        `;
    }

    if (layoutType === 'layout3') { // Centered column layout
        return `
            <div class="${bodyClasses}" style="${siteStyles}">
                ${header}
                <div class="site-main-container-centered">
                    <nav class="site-nav">
                        ${navHTML}
                    </nav>
                    <main class="site-content">
                        ${pageContent}
                    </main>
                </div>
                ${footer}
            </div>
        `;
    }

    // Default layout (layout1)
    return `
        <div class="${bodyClasses}" style="${siteStyles}">
            ${header}
            <nav class="site-nav">
                ${navHTML}
            </nav>
            <main class="site-content">
                ${pageContent}
            </main>
            ${footer}
        </div>
    `;
}


export async function generateStandardPage(pageName, content, navLinks, layoutType) {
    const { specialCase } = lastGeneratedConfig;
    const title = pageName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    // Don't show a title for the single letter error page, as the content is the full message.
    if (specialCase === 'single_letter_error') {
        return createPageHTML(content, navLinks, layoutType);
    }
    
    const pageContent = `
        <h2>${title}</h2>
        ${parseWikiText(content)}
    `;
    return createPageHTML(pageContent, navLinks, layoutType);
}

export async function generateGalleryPage(pageName, navLinks, layoutType) {
    const { topic, year, specialCase } = lastGeneratedConfig;
    let imageGenPrompt = `A low-resolution, heavily compressed jpeg-style photo of ${topic} from the year ${year}. The lighting is from a camera flash, typical of an early digital camera or disposable camera.`;
    let pageTitle = "My Cool Pix!";
    let pageIntro = `Here are some cool pictures I found on the web related to ${topic}. Some I even took myself with my new digital camera!`;

    if (specialCase === 'mj_memorial') {
        imageGenPrompt = `A somber, respectful photo montage of Michael Jackson for a memorial website in 2009. Black and white photos, candles, flowers, grieving fans. A sad, respectful mood.`;
        pageTitle = pageName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        pageIntro = `Remembering the King of Pop through these photos.`;
    } else if (specialCase === 'circuit_city_shutdown') {
        imageGenPrompt = `Photos of a Circuit City store going out of business in 2009. Empty shelves, 'Store Closing' signs, nostalgic but sad atmosphere. Low-resolution, jpeg-style photo with camera flash lighting.`;
        pageTitle = pageName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        pageIntro = `Some pictures to remember the good times. It's hard to see the stores like this.`;
    }
    
    const imageResults = await generateGalleryImagesAI(imageGenPrompt);
    const imagesHTML = imageResults.map(result => `<img src="${result.url}" alt="A picture about ${topic}" style="width: 45%; margin: 5px; border: 5px ridge gold;">`).join('');

    const content = `
        <h2>${pageTitle}</h2>
        <p>${pageIntro}</p>
        <div class="gallery" style="text-align: center;">
            ${imagesHTML}
        </div>
    `;
    return createPageHTML(content, navLinks, layoutType);
}

export async function generateGuestbookPage(navLinks, layoutType) {
    let entriesHTML = '';
    guestbookEntries.forEach(entry => {
        entriesHTML += `
            <div class="guestbook-entry">
                <p><strong>From:</strong> ${entry.name}</p>
                <p>${entry.message}</p>
            </div>
        `;
    });
    const content = `
        <h2>Sign My Guestbook!</h2>
        <p>Please leave a message to let me know you were here!</p>
        ${entriesHTML}
        <hr>
        <form>
            <strong>Name:</strong><br>
            <input type="text"><br>
            <strong>Message:</strong><br>
            <textarea rows="4" cols="50"></textarea><br>
            <input type="submit" value="Sign!">
        </form>
    `;
    return createPageHTML(content, navLinks, layoutType);
}

export async function generateVideoPage(pageName, navLinks, layoutType, videosToRender) {
    const { topic, videoList } = lastGeneratedConfig;
    const currentVideoList = videosToRender || videoList;

    let pageTitle = "Featured Videos";
    let pageIntro = `Check out these awesome videos about ${topic}! Click a title to watch!`;
    if (videosToRender) {
        pageTitle = `Search Results (${currentVideoList.length})`;
        pageIntro = `Found ${currentVideoList.length} video(s) matching your search.`;
    }

    // 1. We already have the video list in lastGeneratedConfig
    if (!currentVideoList) {
        return createPageHTML('<p>Could not load video list.</p>', navLinks, layoutType);
    }
    
    // 2. Generate thumbnails for each video sequentially to avoid rate limiting
    const thumbnailResults = [];
    for (const video of currentVideoList) {
        try {
            const result = await websim.imageGen({
                prompt: `A blurry, low-resolution video thumbnail for a video titled "${video.title}". The image should look like a still frame from a 2000s-era digital video camera.`,
                aspect_ratio: "4:3"
            });
            thumbnailResults.push(result);
        } catch (e) {
             console.error("AI thumbnail gen failed, using fallback:", e);
             thumbnailResults.push({ url: getRandomElement(galleryImages) });
        }
    }

    // 3. Build the HTML for the video grid
    const videosHTML = currentVideoList.map((video, index) => {
        const videoDetails = JSON.stringify(video).replace(/"/g, '&quot;');
        return `
            <a href="#" class="video-item-clickable" data-video-details="${videoDetails}">
                <div class="video-item">
                    <img src="${thumbnailResults[index].url}" alt="Video thumbnail for ${video.title}">
                    <span class="title">${video.title}</span>
                    <p class="uploader">${video.uploader}</p>
                    <p class="stats">${video.views} &bull; ${video.duration}</p>
                </div>
            </a>
        `;
    }).join('');

    const content = `
        <h2>${pageTitle}</h2>
        <p>${pageIntro}</p>
        <div class="video-grid">
            ${videosHTML}
        </div>
    `;
    return createPageHTML(content, navLinks, layoutType);
}

export async function generateVideoWatchPageHTML(videoDetails, upNextVideos, comments, playerImageUrl) {
    const { navLinks, layout } = lastGeneratedConfig;

    // Generate thumbnails for the "Up Next" videos sequentially
    const thumbnailResults = [];
    for (const video of upNextVideos.slice(0, 5)) { // Limit to 5 up next videos
        try {
            const result = await websim.imageGen({
                prompt: `A small, blurry, low-resolution video thumbnail for a video titled "${video.title}".`,
                aspect_ratio: "4:3"
            });
            thumbnailResults.push(result);
        } catch (e) {
            console.error("AI thumbnail gen for up next failed, using fallback:", e);
            thumbnailResults.push({ url: getRandomElement(galleryImages) });
        }
    }

    const upNextHTML = upNextVideos.slice(0, 5).map((video, index) => {
        const videoData = JSON.stringify(video).replace(/"/g, '&quot;');
        return `
             <a href="#" class="video-item-clickable" data-video-details="${videoData}">
                <div class="video-item">
                    <img src="${thumbnailResults[index].url}" alt="${video.title}">
                    <div>
                        <span class="title">${video.title}</span>
                        <p class="uploader">${video.uploader}</p>
                        <p class="stats">${video.views}</p>
                    </div>
                </div>
            </a>
        `;
    }).join('');

    const commentsHTML = comments.map(comment => `
        <div class="comment-item">
            <div class="comment-avatar"></div>
            <div class="comment-body">
                <p class="username">${comment.username}</p>
                <p class="text">${comment.comment}</p>
            </div>
        </div>
    `).join('');

    const pageContent = `
        <div class="video-watch-container">
            <div class="video-main-column">
                <div class="video-player">
                    <img src="${playerImageUrl}" alt="Video player for ${videoDetails.title}">
                </div>
                <div class="video-details">
                    <h2>${videoDetails.title}</h2>
                    <div class="video-stats">
                        <span>${videoDetails.views}</span> &bull; <span>Uploaded by: <strong>${videoDetails.uploader}</strong></span>
                    </div>
                    <div class="video-description">
                        <p>${videoDetails.description}</p>
                    </div>
                </div>
                <div class="video-comments-section">
                    <h3>Comments (${comments.length})</h3>
                    ${commentsHTML}
                </div>
            </div>
            <div class="video-sidebar-column">
                <h3>Up Next</h3>
                <div class="up-next-list">
                    ${upNextHTML}
                </div>
            </div>
        </div>
    `;

    // Use createPageHTML to wrap it in the site's theme, but without a page title (the video title serves that purpose)
    return createPageHTML(pageContent, navLinks, layout);
}
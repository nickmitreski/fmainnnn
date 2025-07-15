import { getRandomInt, getRandomElement, galleryImages } from './utils.js';

export async function checkIfTopicIsSearchEngineAI(topic) {
    if (topic.toLowerCase().includes('search')) {
        return { isSearchEngine: true };
    }
    try {
        const completion = await websim.chat.completions.create({
            messages: [{
                role: "system",
                content: `You are an AI that determines if a user's topic for a website is a search engine.
Respond with only a JSON object with "isSearchEngine" (boolean).
It should be true if the topic is a brand name of a search engine (Google, Yahoo, Ask Jeeves, etc.) or a description of one ("a search engine for cats").`
            }, {
                role: "user",
                content: `Topic: "${topic}".`
            }],
            json: true,
        });
        const result = JSON.parse(completion.content);
        return result.isSearchEngine ? { isSearchEngine: true } : { isSearchEngine: false };
    } catch (e) {
        console.error("AI search engine check failed:", e);
        return { isSearchEngine: false };
    }
}

export async function checkIfTopicIsGibberishAI(topic) {
    // Simple non-AI check for obviously long gibberish to save an API call
    if (topic.length > 15 && !topic.includes(' ')) {
        const vowelCount = (topic.match(/[aeiou]/gi) || []).length;
        const consonantCount = (topic.match(/[bcdfghjklmnpqrstvwxyz]/gi) || []).length;
        if (consonantCount > 0 && vowelCount / consonantCount < 0.1) {
            return { isGibberish: true };
        }
    }

    try {
        const completion = await websim.chat.completions.create({
            messages: [{
                role: "system",
                content: `You are an AI that determines if a user's topic for a website is meaningless gibberish.
Gibberish is a random, unpronounceable string of characters like "asdfghjkl" or "fkhlfhsdghsmghk".
A single word, even if obscure, a name, a typo, or a non-English word is NOT gibberish. Only truly random-looking character strings are gibberish.
Respond with only a JSON object with "isGibberish" (boolean).`
            }, {
                role: "user",
                content: `Topic: "${topic}".`
            }],
            json: true,
        });
        const result = JSON.parse(completion.content);
        return result.isGibberish ? { isGibberish: true } : { isGibberish: false };
    } catch (e) {
        console.error("AI gibberish check failed:", e);
        return { isGibberish: false }; // Fail safe
    }
}

export async function checkIfTopicIsVideoSharingAI(topic) {
    try {
        const completion = await websim.chat.completions.create({
            messages: [{
                role: "system",
                content: `You are an AI that determines if a user's topic for a website is a video-sharing site.
Respond with only a JSON object with "isVideoSite" (boolean).
It should be true if the topic is a brand name of a video site (YouTube, Vimeo, etc.) or a description of one ("my cool video page", "a site for cat videos").`
            }, {
                role: "user",
                content: `Topic: "${topic}".`
            }],
            json: true,
        });
        const result = JSON.parse(completion.content);
        return result.isVideoSite ? { isVideoSite: true } : { isVideoSite: false };
    } catch (e) {
        console.error("AI video site check failed:", e);
        return { isVideoSite: false };
    }
}

export async function checkIfTopicIsWikiAI(topic) {
    try {
        const completion = await websim.chat.completions.create({
            messages: [{
                role: "system",
                content: `You are an AI that determines if a user's topic for a website is a wiki.
Respond with only a JSON object with "isWiki" (boolean).
It should be true if the topic is a brand name of a wiki (Wikipedia, etc.) or a description of one ("my personal wiki", "a wiki for cats", "a [topic] encyclopedia").`
            }, {
                role: "user",
                content: `Topic: "${topic}".`
            }],
            json: true,
        });
        const result = JSON.parse(completion.content);
        return result.isWiki ? { isWiki: true } : { isWiki: false };
    } catch (e) {
        console.error("AI wiki check failed:", e);
        return { isWiki: false };
    }
}

export async function checkIfTopicIsAnachronisticGameAI(topic, year) {
    try {
        const completion = await websim.chat.completions.create({
            messages: [{
                role: "system",
                content: `You are an expert in video game history. Your task is to determine two things about a given topic:
1. Is the topic a video game?
2. If it IS a video game, was its initial release date *after* the given year?

If the topic is a video game released *after* the given year, it is anachronistic.

Respond with only a JSON object with "isGame" (boolean) and "isAnachronistic" (boolean).
- "isGame" should be true if the topic is a video game.
- "isAnachronistic" should be true ONLY if "isGame" is true AND the game's release year is AFTER the provided year. It should be false in all other cases (i.e., if it's not a game, or if it's a game that existed in or before the chosen year).

Example for topic "Fortnite", year 2010: { "isGame": true, "isAnachronistic": true }
Example for topic "Super Mario 64", year 2002: { "isGame": true, "isAnachronistic": false }
Example for topic "my dog", year 2005: { "isGame": false, "isAnachronistic": false }`
            }, {
                role: "user",
                content: `Topic: "${topic}", Year: ${year}.`
            }],
            json: true,
        });
        const result = JSON.parse(completion.content);
        if (typeof result.isGame === 'boolean' && typeof result.isAnachronistic === 'boolean') {
            return result;
        }
        return { isGame: false, isAnachronistic: false }; // Fallback on invalid structure
    } catch (e) {
        console.error("AI game existence check failed:", e);
        return { isGame: false, isAnachronistic: false }; // Fallback on error
    }
}

export async function getWebsiteStructureAI(config) {
    const { topic, year, specialCase } = config;
    if (specialCase === 'mj_memorial') {
        return {
            type: "fan_site",
            navLinks: ["home", "tributes", "memories", "guestbook", "legacy"],
            layout: "layout3" // A more modern, centered layout
        };
    }
    if (specialCase === 'domain_sale') {
        return {
            type: "domain_sale",
            navLinks: ["home", "pricing", "contact"],
            layout: "layout3"
        };
    }
    if (specialCase === 'search_engine') {
        return {
            type: "search_engine",
            navLinks: ["home", "images", "about"],
            layout: "layout3"
        };
    }
    if (specialCase === 'video_sharing') {
        return {
            type: "video_site",
            navLinks: ["home", "browse", "upload", "my_account"],
            layout: "layout2" // A two-column layout is good for video sites
        };
    }
    if (specialCase === 'wiki') {
        return {
            type: "wiki",
            navLinks: ["main_page", "random_article", "recent_changes", "about_this_wiki"],
            layout: "layout2"
        };
    }
    if (specialCase === 'circuit_city_shutdown') {
        return {
            type: "fan_site_shutdown",
            navLinks: ["home", "memories", "goodbye_circuit_city", "guestbook"],
            layout: "layout3" // A somber, centered layout
        };
    }
    if (specialCase === 'ames_shutdown') {
        return {
            type: "fan_site_shutdown",
            navLinks: ["home", "memories", "goodbye_ames", "guestbook"],
            layout: "layout3" // A somber, centered layout
        };
    }
    if (specialCase === 'single_letter_error') {
        return {
            type: "error_page",
            navLinks: ["home"],
            layout: "layout3"
        };
    }

    // Determine if we need a skeuomorphic theme
    const isSkeuomorphicEra = year >= 2001 && year <= 2006;
    const themeInstruction = isSkeuomorphicEra 
        ? `The year is in the skeuomorphic design era. You must also choose a 'skeuomorphicTheme'. Options are: "linen" (light, fabric texture), "metal" (dark, brushed aluminum), "wood" (tacky wood paneling).`
        : '';
    const jsonSchema = isSkeuomorphicEra
        ? `{ "type": "string", "navLinks": ["string"], "layout": "string", "skeuomorphicTheme": "string" }`
        : `{ "type": "string", "navLinks": ["string"], "layout": "string" }`;

    try {
        const completion = await websim.chat.completions.create({
            messages: [{
                role: "system",
                content: `You are an AI that determines the structure for a personal website from the 2000s.
Analyze the user's topic ("${topic}", year ${year}) and decide on a website 'type', appropriate navigation links, and a layout.
The navLinks array should always include 'home'. It should usually include 'about', 'gallery', and 'guestbook'. Add 1-2 other relevant pages based on the topic.
For years 2007-2009, be more creative and generate unique page names that reflect the topic.
The layout should be one of: "layout1" (classic top nav), "layout2" (two-column side nav), "layout3" (centered single column).
${themeInstruction}
Respond with only a JSON object matching this structure: ${jsonSchema}.
Example for "my hamster website", year 2005: { "type": "fan_site", "navLinks": ["home", "about_me", "my_hamster_pix", "guestbook"], "layout": "layout1", "skeuomorphicTheme": "wood" }
Example for "local town news", year 2002: { "type": "news_site", "navLinks": ["home", "latest_news", "photo_gallery", "about_us"], "layout": "layout2", "skeuomorphicTheme": "linen" }`
            }, {
                role: "user",
                content: `Generate a structure for my website about ${topic} from ${year}.`
            }],
            json: true,
        });
        const result = JSON.parse(completion.content);
        // Basic validation
        if (result && result.navLinks && Array.isArray(result.navLinks) && result.layout) {
            if (isSkeuomorphicEra && !result.skeuomorphicTheme) {
                 result.skeuomorphicTheme = getRandomElement(['linen', 'metal', 'wood']); // Add theme if AI forgets
            }
            return result;
        }
        throw new Error("Invalid JSON structure from AI.");
    } catch (e) {
        console.error("AI structure generation failed:", e);
        // Fallback structure
        const fallbackTheme = isSkeuomorphicEra ? getRandomElement(['linen', 'metal', 'wood']) : null;
        return {
            type: "personal_blog",
            navLinks: ["home", "about", "gallery", "guestbook"],
            layout: `layout${getRandomInt(1, 3)}`,
            skeuomorphicTheme: fallbackTheme
        };
    }
}

export async function generateGuestbookEntriesAI(config) {
    const { topic, year, specialCase } = config;
    let system_prompt = `You are an AI that generates nostalgic guestbook entries for a personal website from the 2000s. The user is making a website about "${topic}" set in the year ${year}. Generate 4 distinct guestbook entries. Each entry should have a 'name' (a typical screen name from that era) and a 'message' (using slang and style appropriate for ${year}). Respond with only a JSON array of objects, where each object has "name" and "message" keys.`;

    if (specialCase === 'mj_memorial') {
        system_prompt = `You are an AI generating guestbook entries for a Michael Jackson memorial website in 2009. The topic is "${topic}". Generate 4 distinct guestbook entries expressing sadness, condolences, and memories. The tone should be somber and respectful. Each entry should have a 'name' and a 'message'. Respond with only a JSON array of objects.`;
    } else if (specialCase === 'circuit_city_shutdown') {
        system_prompt = `You are an AI generating guestbook entries for a defunct Circuit City fan page in 2009. The topic is "${topic}". Generate 4 distinct guestbook entries expressing sadness, nostalgia for the store, and memories of shopping there. The tone is sad and nostalgic. Each entry should have a 'name' and a 'message'. Respond with only a JSON array of objects.`;
    } else if (specialCase === 'ames_shutdown') {
        system_prompt = `You are an AI generating guestbook entries for a defunct Ames Department Store fan page in 2002. The topic is "${topic}". Generate 4 distinct guestbook entries expressing sadness, nostalgia for the store, and memories of shopping there. The tone is sad and nostalgic. Each entry should have a 'name' and a 'message'. Respond with only a JSON array of objects.`;
    }

    try {
        const completion = await websim.chat.completions.create({
            messages: [{
                role: "system",
                content: system_prompt,
            }, {
                role: "user",
                content: `Generate guestbook entries for my website about ${topic} from ${year}.`
            }],
            json: true,
        });
        return JSON.parse(completion.content);
    } catch (e) {
        console.error("AI guestbook generation failed:", e);
        if (specialCase === 'mj_memorial') {
            return [
                { name: "MusicLover88", message: "RIP King of Pop. We'll miss you forever. Your music will live on." },
                { name: "SarahJ", message: "I can't believe it... So sad. Sending love to his family." },
                { name: "Moonwalker_Fan", message: "Gone too soon. Thank you for the music and the magic, Michael. #RIPMJ" },
            ];
        }
        if (specialCase === 'circuit_city_shutdown') {
            return [
               { name: "TechGuy2001", message: "Man, I'm gonna miss this place. Bought my first DVD player here. RIP." },
               { name: "FormerEmployee_KC", message: "Worked there for 5 years. So many good memories with my coworkers. Sad to see it go." },
               { name: "GamerDad99", message: "This was the best place for video games... way better than Best Buy. So long, Circuit City." },
           ];
        }
        if (specialCase === 'ames_shutdown') {
            return [
               { name: "MomOf3_CT", message: "So sad to see them go. I bought all my kids' school clothes at Ames." },
               { name: "FormerCashier89", message: "RIP Ames. I loved working there. End of an era." },
               { name: "BargainHunter", message: "No one could beat their prices. I'll miss them." },
           ];
        }
        return [ // Fallback entries
            { name: "Sk8rBoi1999", message: "ur site is so cool!! luv it! XD" },
            { name: "WebMasterZero", message: "Greetings. Your use of HTML is... adequate." },
            { name: "GlitterGurl_2k1", message: "OMG! Add more glitter!!!! *~*~*~*" },
        ];
    }
}

export async function generatePageContentAI(pageType, config) {
    const { topic, year, specialCase } = config;

    let system_prompt = `You are an AI that writes content for a personal website from the 2000s. The user is making a website about "${topic}" set in the year ${year}. Write the content for the "${pageType}" page. Use slang, references, and a writing style appropriate for the era. The tone should be enthusiastic and amateurish. Respond with a single HTML string containing paragraphs and other simple tags. Do not include h2 tags.`;

    if (specialCase === 'single_letter_error') {
        system_prompt = `You are an AI writing an error message for a website generator. The user entered a single letter ("${topic}") as their topic, which is invalid. Write a user-friendly, slightly quirky error message explaining that they need to provide a more descriptive topic. The tone should be like a helpful but slightly primitive error from the 2000s. Respond with a single HTML string. Do not include h2 tags.`;
    } else if (specialCase === 'mj_memorial') {
        system_prompt = `You are an AI writing content for a Michael Jackson memorial website from 2009. The user is making a website about "${topic}". Write content for the "${pageType}" page. The tone must be somber, respectful, and reflective of his passing. For the 'home' page, write a short welcome expressing disbelief and sadness. For 'tributes', describe how fans are paying tribute. For 'memories', share a fond memory. For 'legacy', talk about his impact. Respond with a single HTML string. Do not include h2 tags.`;
    } else if (specialCase === 'circuit_city_shutdown') {
        const pagePrompts = {
            home: `You are an AI writing content for the homepage of a Circuit City fan site in 2009, right after the company announced its shutdown. Write a short, sad announcement that the site will no longer be updated. Express dismay and nostalgia. The tone is like a fan saying goodbye to their favorite thing. Respond with a single HTML string. Do not include h2 tags.`,
            memories: `You are an AI writing for the 'memories' page of a defunct Circuit City fan site in 2009. Share some fond, nostalgic memories of shopping at Circuit City. Mention things like buying your first CD, browsing the video games, or getting help from the staff. The tone is bittersweet. Respond with a single HTML string. Do not include h2 tags.`,
            goodbye_circuit_city: `You are an AI writing the final page for a Circuit City fan site in 2009. The page is titled 'Goodbye Circuit City'. Write a final, heartfelt farewell message to the company, its employees, and fellow fans. It's the end of an era. Respond with a single HTML string. Do not include h2 tags.`
        };
        system_prompt = pagePrompts[pageType] || pagePrompts.home;
    } else if (specialCase === 'ames_shutdown') {
        const pagePrompts = {
            home: `You are an AI writing content for the homepage of an Ames Department Store fan site in 2002, right after the company announced its shutdown. Write a short, sad announcement that the site will no longer be updated. Express dismay and nostalgia. The tone is like a fan saying goodbye to their favorite thing. Respond with a single HTML string. Do not include h2 tags.`,
            memories: `You are an AI writing for the 'memories' page of a defunct Ames fan site in 2002. Share some fond, nostalgic memories of shopping at Ames. Mention things like layaway, the craft section, or the snack bar. The tone is bittersweet. Respond with a single HTML string. Do not include h2 tags.`,
            goodbye_ames: `You are an AI writing the final page for an Ames fan site in 2002. The page is titled 'Goodbye Ames'. Write a final, heartfelt farewell message to the company, its employees, and fellow shoppers. It's the end of an era for the discount store. Respond with a single HTML string. Do not include h2 tags.`
        };
        system_prompt = pagePrompts[pageType] || pagePrompts.home;
    } else if (specialCase === 'wiki') {
        const pagePrompts = {
            main_page: `You are an AI writing the "Main Page" for a wiki about "${topic}" from the year ${year}. Write a welcome message and a brief introduction to the wiki. The tone should be collaborative and community-driven. Crucially, you MUST include several internal wiki links to potential starting articles by wrapping them in double square brackets, like [[An Important Concept]] or [[Key Figure]]. Respond with a single HTML string. Do not include h2 tags.`,
            random_article: `You are an AI writing a placeholder page for a wiki about "${topic}". The page is "Random Article". Explain that clicking a special link or button would take the user to a random page in the wiki. For now, just show this placeholder text as the feature is 'under construction'. Respond with a single HTML string. Do not include h2 tags.`,
            recent_changes: `You are an AI writing a placeholder page for a wiki about "${topic}". The page is "Recent Changes". Explain that this page would normally show a list of the latest edits and new articles from the community. Generate a few plausible-looking but fake recent change log entries. For example: "18:32 - User:CoolEditor123 edited page [[Some Article]] (added new section)". Respond with a single HTML string. Do not include h2 tags.`,
            about_this_wiki: `You are an AI writing the "About" page for a wiki about "${topic}". Explain the purpose of this wiki - to be a comprehensive, fan-made encyclopedia for everything related to ${topic}. Use an encouraging and community-focused tone. Respond with a single HTML string. Do not include h2 tags.`
        };
        system_prompt = pagePrompts[pageType] || pagePrompts.main_page;
    } else if (specialCase === 'domain_sale') {
        const domainName = topic.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/\s+/g, '-') + '.com';
        const pagePrompts = {
            home: `You are an AI writing content for a parked domain sale page from the year ${year}. The domain for sale is "${domainName}". Write a professional and slightly generic landing page message. Announce that the domain is for sale and is a premium web address for businesses related to "${topic}". Respond with a single HTML string. Do not include h2 tags.`,
            pricing: `You are an AI writing content for the pricing page of a domain sale website from the year ${year}. The domain for sale is "${domainName}". Create some plausible pricing tiers, like 'Lease-to-Own' and 'Full Buyout'. Use generic corporate language. Respond with a single HTML string. Do not include h2 tags.`,
            contact: `You are an AI writing content for the contact page of a domain sale website from the year ${year}. The domain for sale is "${domainName}". Write a short message encouraging serious inquiries and mention that they can get in touch via a contact form. Respond with a single HTML string. Do not include h2 tags.`
        };
        // For the 'home' page, we use a static template. For others, we generate.
        if (pageType === 'home' || pageType === 'images' || pageType === 'browse' || pageType === 'videos' || pageType === 'upload' || pageType === 'my_account') {
             return pagePrompts[pageType] || `<p>This page is under construction! Check back soon!</p>`;
        }
        system_prompt = pagePrompts[pageType] || pagePrompts.about;
    } else if (specialCase === 'search_engine') {
        const searchEngineName = topic;
        const pagePrompts = {
            home: `<div class="search-engine-home">
                <div class="search-engine-logo" data-text="${searchEngineName}">${searchEngineName}</div>
                <form class="search-form">
                    <input type="text" class="search-input" name="query">
                    <input type="submit" class="search-button" value="Search the Web!">
                </form>
            </div>
            <div id="search-results-container"></div>`,
            images: `<p>Our new Image Search is currently under development! We are indexing billions of images (mostly of cats) from across the World Wide Web and it should be ready soon. Check back later!</p>`,
            about: `You are an AI writing content for the "About" page of a search engine called "${searchEngineName}" from the year ${year}. Write a short, slightly corporate but also quirky mission statement for this new search engine. Explain your goal to index the entire internet. Respond with a single HTML string. Do not include h2 tags.`
        };
        // For the 'home' page, we use a static template. For others, we generate.
        if (pageType === 'home' || pageType === 'images') {
             return pagePrompts[pageType];
        }
        system_prompt = pagePrompts[pageType] || pagePrompts.about;
    }

     try {
        const completion = await websim.chat.completions.create({
            messages: [{
                role: "system",
                content: system_prompt,
            }, {
                role: "user",
                content: `Generate the content for the "${pageType}" page of my website about ${topic} from ${year}.`
            }],
        });
        return completion.content;
    } catch (e) {
        console.error(`AI ${pageType} content generation failed:`, e);
        if (pageType === 'home') return `<p>Hi and welcome to my new website, all about <strong>${topic}</strong>! I made this myself using Notepad!</p><p class="blinking-text" style="color: red; font-weight: bold;">**NEW** Check out the gallery page!</p><p>I'm still learning HTML so some parts are under construction. Please sign my guestbook before you leave!</p>`;
        return `<p>This page is about ${pageType}. It's dedicated to my passion: ${topic}.</p><p>I hope you like it. I spent a lot of time picking out the colors.</p>`;
    }
}

export async function generateWikiArticleAI(articleTitle, config) {
    const { topic, year } = config;
    try {
        const completion = await websim.chat.completions.create({
            messages: [{
                role: "system",
                content: `You are an AI that writes a wiki article for a user's generated wiki about "${topic}" from the year ${year}.
The article is titled "${articleTitle}". The content should be informative but written in a slightly amateur, collaborative style appropriate for a niche wiki of that era.
Crucially, you MUST include internal wiki links to other potential articles by wrapping them in double square brackets, like [[Another Article]]. Make at least 3-4 of these links.
Do NOT include a title/h2 tag in your response.
Respond with only the HTML content (paragraphs, lists, etc.) for the article body.`,
            }, {
                role: "user",
                content: `Generate the wiki article content for "${articleTitle}".`
            }],
        });
        return completion.content;
    } catch (e) {
        console.error(`AI wiki article generation for "${articleTitle}" failed:`, e);
        return `<p>The page "${articleTitle}" has not been created yet.</p><p>This wiki is a collaborative effort! Why don't you be the first to write about it? (Editing is under construction, of course.)</p>`;
    }
}

export async function generateSearchResultsAI(query, year) {
    try {
        const completion = await websim.chat.completions.create({
            messages: [{
                role: "system",
                content: `You are an AI that generates fake search results for a custom search engine website set in the year ${year}.
The user is searching for "${query}". Generate 5 plausible but fake search results.
The results should look like they are from ${year}. They could be from Geocities, Angelfire, personal homepages, or old forums.
Respond with only a JSON array of objects. Each object must have "title", "url", and "snippet" keys.
The url should look authentic for the era.
The tone should be nostalgic and slightly amateurish.
Example: [{ "title": "Cool Sk8er Tricks", "url": "www.geocities.com/hollywood/skate/1234/tricks.html", "snippet": "Check out my sick kickflips and grinds! My Angelfire homepage about skateboarding..." }]`
            }, {
                role: "user",
                content: `Generate search results for the query: "${query}"`
            }],
            json: true,
        });
        return JSON.parse(completion.content);
    } catch (e) {
        console.error("AI search result generation failed:", e);
        return [{
            title: `Error finding results for ${query}`,
            url: '#',
            snippet: 'The web is vast and mysterious. Our hamsters couldn\'t find anything for that query. Please try again.'
        }];
    }
}

export async function generateVideoListAI(config) {
    const { topic, year } = config;
    try {
        const completion = await websim.chat.completions.create({
            messages: [{
                role: "system",
                content: `You are an AI that generates a plausible list of videos for a video-sharing website from the year ${year}.
The website's topic is "${topic}". Generate 6 plausible but fake video titles.
The titles should reflect the kind of content that would be popular in ${year} (e.g., funny clips, animation, vlogs, game videos).
For each video, create a title, an era-appropriate uploader name, a view count, a duration, and a short, amateurish description.
Respond with only a JSON array of objects. Each object must have "title", "uploader", "views", "duration", and "description" keys.
The view counts should be realistic for the time before viral megahits were common.
Example: [{ "title": "My cat falls off the couch!! SO FUNNY", "uploader": "xX_CatLover_Xx", "views": "1,245 views", "duration": "0:32", "description": "i was just filming my cat fluffy and he fell off the couch LOL. watch til the end" }]`
            }, {
                role: "user",
                content: `Generate a video list for a site about "${topic}" from ${year}.`
            }],
            json: true,
        });
        return JSON.parse(completion.content);
    } catch (e) {
        console.error("AI video list generation failed:", e);
        return [{
            title: `Funny ${topic} Video`,
            uploader: 'Admin',
            views: '1,337 views',
            duration: '1:05',
            description: 'This is a default video because the AI failed. Sorry!'
        }];
    }
}

export async function generateVideoCommentsAI(videoTitle, config) {
    const { topic, year } = config;
    try {
        const completion = await websim.chat.completions.create({
            messages: [{
                role: "system",
                content: `You are an AI that generates nostalgic comments for a video on a video-sharing website from the year ${year}.
The website's topic is "${topic}" and the video is titled "${videoTitle}".
Generate 4 distinct comments. Each comment should have a 'username' (a typical screen name from that era) and a 'comment' (using slang, typos, and style appropriate for ${year}).
The tone should be amateurish, ranging from positive to critical to spammy.
Respond with only a JSON array of objects, where each object has "username" and "comment" keys.`
            }, {
                role: "user",
                content: `Generate comments for the video "${videoTitle}".`
            }],
            json: true,
        });
        return JSON.parse(completion.content);
    } catch (e) {
        console.error("AI video comment generation failed:", e);
        return [
            { username: "CoolDude2k", comment: "First!! lol" },
            { username: "SoccerMom_4", comment: "this is very funny my son showed me this" },
            { username: "SpamBot99", comment: "CHECK OUT MY SITE FOR FREE MP3s www.geocities.com/freeringtones/spam.html" },
            { username: "GenericUser", comment: "lol" }
        ];
    }
}

export async function generateGalleryImagesAI(imageGenPrompt) {
    const images = [];
    for (let i = 0; i < 4; i++) {
        try {
            const result = await websim.imageGen({ prompt: `${imageGenPrompt}, seed: ${i}`, aspect_ratio: "4:3" });
            images.push(result);
        } catch (e) {
            console.error("AI image gen failed, using fallback:", e);
            images.push({ url: getRandomElement(galleryImages) }); // Fallback on error
        }
    }
    return images;
}
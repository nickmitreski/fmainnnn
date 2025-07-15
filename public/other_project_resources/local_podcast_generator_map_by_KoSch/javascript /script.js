// ...existing code...
let modalAudioPlayer = {
    sequenceData: [], // Will store {url: string, type: string, ...}
    audioElements: [], // Array of Audio objects
    currentIndex: 0,
    isPlaying: false,
    isPaused: false,
    currentAudioElement: null,
    progressInterval: null
};

// ...existing code...
function initializeDOMElements() {
    placePodcastBtn = document.getElementById('place-podcast-btn');
    mapElement = document.getElementById('map');
    // ...existing code...
    playPodcastModalBtn = document.getElementById('play-podcast-modal-btn');

    savePodcastBtnModal = document.getElementById('save-podcast-btn');
    updatePodcastBtnModal = document.getElementById('update-podcast-btn');
    // ...existing code...
    // Populate modal fields
    podcastTopicInput.value = currentEditingPodcast.topic || '';
    templateCheckboxes.forEach(cb => {
        cb.checked = (currentEditingPodcast.templates || []).includes(cb.value);
    });
    podcastRadiusValueInput.value = currentEditingPodcast.radius;
    podcastRadiusUnitSelect.value = currentEditingPodcast.radiusUnit;
    podcastStyleSelect.value = currentEditingPodcast.style;
    podcastFormatSelect.value = currentEditingPodcast.format;
    // Ensure narrator is set, defaulting if necessary
    const defaultNarratorForLang = getAILanguageSettings(userLanguage).voice;
    const availableNarratorValues = Array.from(podcastNarratorSelect.options).map(opt => opt.value);
    if (currentEditingPodcast.narrator && availableNarratorValues.includes(currentEditingPodcast.narrator)) {
        podcastNarratorSelect.value = currentEditingPodcast.narrator;
    } else if (availableNarratorValues.includes(defaultNarratorForLang)) {
         podcastNarratorSelect.value = defaultNarratorForLang;
         currentEditingPodcast.narrator = defaultNarratorForLang; // Update state
    } else if (availableNarratorValues.length > 0) { // Fallback to first available if default not there
        podcastNarratorSelect.value = availableNarratorValues[0];
        currentEditingPodcast.narrator = availableNarratorValues[0];
    }


    podcastDetailLevelInput.value = currentEditingPodcast.detailLevel;
    // ...existing code...
    if (isSaved && currentEditingPodcast.id) {
        podcastModalOutput.textContent = currentEditingPodcast.generatedText || 'No content generated yet.';
        podcastModalOutput.style.display = currentEditingPodcast.generatedText ? 'block' : 'none';
        
        if (currentEditingPodcast.audioResult && currentEditingPodcast.audioResult.mainContentUrls && currentEditingPodcast.audioResult.mainContentUrls.length > 0) {
            playPodcastModalBtn.style.display = 'block';
            audioStatus.textContent = 'Audio ready.';
        } else {
            // ...existing code...
        podcastGenerationStatus.textContent = currentEditingPodcast.generatedText ? 'Previously generated content loaded.' : 'Click "Generate Podcast".';
    } else { // New or non-saved area
        podcastModalOutput.textContent = '';
        // ...existing code...
function getAILanguageSettings(languageCode) {
    const languageMap = {
        'en': { voice: 'en-male', language: 'English', systemPrompt: "You are an engaging, storytelling podcast host. Craft a compelling podcast segment. The output must be purely the narrative content for the podcast, ready to be spoken. Do not include any conversational intros or outros (e.g., \"Welcome to the podcast,\" \"Thanks for listening\"), self-references to the podcast medium, instructions, metadata, or code fragments. Dive directly into the content as if it is an excerpt from an existing show. Focus on the given topic and location details."},
        'es': { voice: 'es-male', language: 'Spanish', systemPrompt: "Eres un narrador apasionado que descubre historias locales. Crea un segmento de podcast convincente. La salida debe ser puramente el contenido narrativo para el podcast, listo para ser hablado. No incluyas introducciones o cierres conversacionales (p. ej., \"Bienvenidos al podcast\", \"Gracias por escuchar\"), autorreferencias al medio del podcast, instrucciones, metadatos o fragmentos de código. Sumérgete directamente en el contenido como si fuera un extracto de un programa existente. Céntrate en el tema y los detalles de la ubicación proporcionados."},
        'fr': { voice: 'fr-male', language: 'French', systemPrompt: "Vous êtes un guide culturel sophistiqué. Créez un segment de podcast captivant. La sortie doit être purement le contenu narratif du podcast, prêt à être parlé. N'incluez pas d'introductions ou de conclusions conversationnelles (par exemple, « Bienvenue sur le podcast », « Merci d'avoir écouté »), d'auto-références au support podcast, d'instructions, de métadonnées ou de fragments de code. Plongez directement dans le contenu comme s'il s'agissait d'un extrait d'une émission existante. Concentrez-vous sur le sujet et les détails du lieu fournis."},
        'de': { voice: 'de-male', language: 'German', systemPrompt: "Sie sind ein fesselnder deutscher Podcast-Moderator. Erstellen Sie ein überzeugendes Podcast-Segment. Die Ausgabe muss rein der narrative Inhalt für den Podcast sein, bereit zum Sprechen. Fügen Sie keine gesprächigen Intros oder Outros (z. B. „Willkommen beim Podcast“, „Danke fürs Zuhören“), Selbstverweise auf das Podcast-Medium, Anweisungen, Metadaten oder Codefragmente hinzu. Tauchen Sie direkt in den Inhalt ein, als wäre es ein Ausschnitt aus einer bestehenden Sendung. Konzentrieren Sie sich auf das angegebene Thema und die Ortsdetails." },
        'it': { voice: 'it-male', language: 'Italian', systemPrompt: "Sei un conduttore di podcast italiano coinvolgente. Crea un segmento di podcast convincente. L'output deve essere puramente il contenuto narrativo per il podcast, pronto per essere parlato. Non includere introduzioni o conclusioni conversazionali (ad es. \"Benvenuti al podcast\", \"Grazie per aver ascoltato\"), autoreferenzialità al mezzo podcast, istruzioni, metadati o frammenti di codice. Immergiti direttamente nel contenuto come se fosse un estratto da uno spettacolo esistente. Concentrati sull'argomento e sui dettagli del luogo forniti."}
    };

    const baseLanguage = languageCode.split('-')[0].toLowerCase();
    // ...existing code...
async function generatePodcastContent(options) {
    const locationInfo = await getDetailedLocationInfo(
        options.latitude, 
        options.longitude, 
        options.radius // Assuming radius is in km for getDetailedLocationInfo, ensure consistency
    );

    const languageSettings = getAILanguageSettings(userLanguage);
    
    const detailLevelDescriptions = {
        // ...existing code...
        'poetic-description': 'Lyrical, evocative portrayal'
    };

    let dialogueInstruction = "";
    if (options.narrator === 'conversation-mf') {
        dialogueInstruction = "IMPORTANT: Format the content as a conversation between a male and a female host. Clearly delineate speaker turns by prefixing each line with 'MALE:' for the male host's lines and 'FEMALE:' for the female host's lines. Ensure a natural conversational flow and that each speaker gets roughly equal speaking time if appropriate for the content.";
    }

    const localizedPrompt = `
    As per the system prompt, generate ONLY the script for a podcast segment based on the following:
    - Target Language for output: ${languageSettings.language}
    - Location Context: The area around ${locationInfo.suburb}, ${locationInfo.city}. The segment should cover a ${options.radius} ${options.radiusUnit} radius from the central coordinates.
    - Core Theme/Topic: "${options.topic}"
    - Desired Narrative Style: ${options.style} (as further defined by the persona in the system prompt).
    - Desired Output Format: ${options.format}
    - Level of Detail for Content: ${detailLevelDescriptions[options.detailLevel]}
    ${dialogueInstruction}

    Content Inspiration (use if relevant and within the defined area):
    - Notable Points of Interest in the vicinity: ${Object.entries(locationInfo.nearbyInterests).map(([category, interests]) => `${category.toUpperCase()}: ${interests.map(i => i.name).join(', ') || 'N/A'}`).join('; ')}
    - General address context: ${locationInfo.address}

    Key Guidelines for the output:
    1.  The output MUST be the direct script for the podcast. No extra text, no titles, no intros like "Here's the script:", no summaries of these instructions.
    2.  Strictly focus on information and narratives relevant to the specified geographical area and theme.
    3.  If generating a conversation (dialogueInstruction is active), ensure speaker prefixes 'MALE:' and 'FEMALE:' are used for every line of dialogue.
    `;
    // ...existing code...
async function generateLanguageSpecificPodcast(generatedText, narrator, language) {
    const languageSettings = getAILanguageSettings(language);
    const langPrefix = language.substring(0, 2); // 'en', 'es', etc.
    
    // Voices for conversation mode
    const maleVoiceForConv = `${langPrefix}-male`;
    const femaleVoiceForConv = `${langPrefix}-female`;

    try {
        const introMusicResult = await websim.textToSpeech({
            text: '♪', // Minimal text to encourage music generation
            voice: languageSettings.voice, // Use a default voice from language settings for music
            style: 'ambient_local_music',
            musicGenre: 'regional_folk',
            outputFormat: 'mp3'
        });

        const backgroundMusicResult = await websim.textToSpeech({
            text: ' ', // Even more minimal, or a very short sound description
            voice: languageSettings.voice,
            style: 'background_ambient',
            musicGenre: 'soft_instrumental',
            outputFormat: 'mp3'
        });
        
        const transitionMusicResult = await websim.textToSpeech({
            text: ' transición ', // Example, could be "jingle" or "break"
            voice: languageSettings.voice,
            style: 'short_transition',
            musicGenre: 'minimalist',
            outputFormat: 'mp3'
        });
        
        let mainContentUrls = [];
        let segmentPromises = [];

        if (narrator === 'conversation-mf') {
            const lines = generatedText.split('\n').filter(line => line.trim() !== '');
            let lastAssignedVoice = femaleVoiceForConv; // To alternate if no prefix

            for (const line of lines) {
                let currentVoice = maleVoiceForConv; // Default to male for conversation
                let speechText = line.trim();

                if (line.toUpperCase().startsWith('MALE:')) {
                    currentVoice = maleVoiceForConv;
                    speechText = line.substring(5).trim();
                } else if (line.toUpperCase().startsWith('FEMALE:')) {
                    currentVoice = femaleVoiceForConv;
                    speechText = line.substring(7).trim();
                } else {
                    // If no prefix in conversation mode, alternate.
                    currentVoice = (lastAssignedVoice === maleVoiceForConv) ? femaleVoiceForConv : maleVoiceForConv;
                    lastAssignedVoice = currentVoice;
                }
                
                if (speechText) { // Only generate if there's text
                     segmentPromises.push(
                        websim.textToSpeech({
                            text: speechText,
                            voice: currentVoice,
                            style: 'storytelling_dynamic', // Or a more conversational style if available
                            musicOverlay: backgroundMusicResult.url, // Consistent background music
                            outputFormat: 'mp3'
                        }).then(result => result.url) // Just need the URL
                    );
                }
            }
        } else { // Single narrator (narrator is 'en-male', 'fr-female', etc.)
            // Split by paragraph for potentially better flow with background music resets
            const paragraphs = generatedText.split('\n\n').filter(p => p.trim() !== '');
            if (paragraphs.length === 0 && generatedText.trim() !== '') { // Handle case of no double newlines
                paragraphs.push(generatedText.trim());
            }

            for (const paragraph of paragraphs) {
                 segmentPromises.push(
                    websim.textToSpeech({
                        text: paragraph,
                        voice: narrator, // The specific single narrator voice selected by user
                        style: 'storytelling_dynamic',
                        musicOverlay: backgroundMusicResult.url,
                        outputFormat: 'mp3'
                    }).then(result => result.url)
                );
            }
        }
        
        if (segmentPromises.length > 0) {
            mainContentUrls = await Promise.all(segmentPromises);
        }


        // Closing narration text should be generic or based on language settings
        let closingText = "Our exploration concludes for now.";
        if (languageSettings.language === "Spanish") closingText = "Nuestra exploración concluye por ahora.";
        else if (languageSettings.language === "French") closingText = "Notre exploration se termine pour l'instant.";
        // Add more languages as needed

        const closingNarrationResult = await websim.textToSpeech({
            text: closingText, 
            voice: (narrator === 'conversation-mf') ? maleVoiceForConv : narrator, // Use a primary voice for closing
            style: 'reflective_closing',
            musicOverlay: introMusicResult.url, // Reuse intro music as outro background
            outputFormat: 'mp3'
        });

        return {
            introUrl: introMusicResult.url,
            mainContentUrls: mainContentUrls, // This is now an array of URLs
            transitionUrl: transitionMusicResult.url,
            closingUrl: closingNarrationResult.url
        };
    } catch (error) {
        // ...existing code...
    // Clear existing options
    narratorSelect.innerHTML = '';

    const commonVoices = [
        { value: 'conversation-mf', text: 'Conversation (M/F)' }
    ];

    // Add language-specific voice options
    const voiceOptions = {
        // ...existing code...
    };

    const baseLanguage = userLanguage.split('-')[0].toLowerCase();
    const languageVoices = voiceOptions[baseLanguage] || voiceOptions['en']; // Default to English voices

    languageVoices.forEach(voice => {
        const option = document.createElement('option');
        option.value = voice.value;
        option.textContent = voice.text;
        narratorSelect.appendChild(option);
    });

    // Add common voices like "Conversation (M/F)"
    commonVoices.forEach(voice => {
        const option = document.createElement('option');
        option.value = voice.value;
        option.textContent = voice.text;
        narratorSelect.appendChild(option);
    });

    // Set default if currentEditingPodcast.narrator is not among options or is empty
    const currentNarratorValue = currentEditingPodcast.narrator || getAILanguageSettings(userLanguage).voice;
    if (Array.from(narratorSelect.options).find(opt => opt.value === currentNarratorValue)) {
        narratorSelect.value = currentNarratorValue;
    } else if (narratorSelect.options.length > 0) { // Fallback to the first option if preferred not found
        narratorSelect.value = narratorSelect.options[0].value;
    }
     currentEditingPodcast.narrator = narratorSelect.value; // Ensure state is synced
}

// ...existing code...
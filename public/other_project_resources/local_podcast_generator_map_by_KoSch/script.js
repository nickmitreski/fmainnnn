const room = new WebsimSocket();

// --- Global State ---
let map;
const userLanguage = navigator.language || navigator.userLanguage;
console.log(`Detected language: ${userLanguage}`);

let isPlacingPodcastMarker = false;
let currentMapMarker = null;
let currentMapCircle = null;

// Holds data for the podcast being actively configured in the modal
let currentEditingPodcast = {
    id: null,
    latitude: null,
    longitude: null,
    radius: 1,
    radiusUnit: 'km',
    topic: '',
    templates: [],
    style: 'informative',
    format: 'summary',
    detailLevel: 5,
    narrator: '', // Will be set by language default
    generatedText: '',
    audioResult: null, // Will store { introUrl, mainContentUrls, transitionUrl, closingUrl }
    references: [] // Will store source references
};

// Audio playback state for modal
let modalAudioPlayer = {
    sequenceData: [], // Array of Audio objects
    audioElements: [],
    currentIndex: 0,
    isPlaying: false,
    isPaused: false,
    currentAudioElement: null,
    progressInterval: null
};

// Read aloud state
let readAloudPlayer = {
    isPlaying: false,
    isPaused: false,
    currentIndex: 0,
    paragraphs: [],
    currentAudio: null
};

// Global variable for AI tool modal
let currentAiToolIndex = null;

// --- DOM Elements ---
let placePodcastBtn, mapElement, podcastModal, closeButton,
    savedPodcastListUl, noSavedPodcastsMsg, currentPodcastDetailsDiv,
    currentLocationInfoSpan, podcastTopicInput, templateCheckboxes, podcastRadiusValueInput, podcastRadiusUnitSelect,
    podcastStyleSelect, podcastFormatSelect, podcastNarratorsSelect, podcastNarratorsNote,
    podcastDetailLevelInput,
    detailLevelValueSpan, generatePodcastModalBtn, podcastGenerationStatus,
    podcastGenerationProgressContainer, podcastGenerationProgress, podcastModalOutput,
    audioStatus, audioProgressBarContainerModal, audioProgressBarModal, playPodcastModalBtn,
    savePodcastBtnModal, updatePodcastBtnModal, deletePodcastBtnModal, viewPodcastsBtn,
    referencesTableContainer, referencesTable, noReferencesMsg;

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initializeDOMElements();
    initializeMap(); // This will also call applySettingsFromURL after map is ready
    setupEventListeners();
    updateFullNarratorOptions(); // Set initial narrator options with new system
    localizeUI();
});

function initializeDOMElements() {
    placePodcastBtn = document.getElementById('place-podcast-btn');
    mapElement = document.getElementById('map');
    podcastModal = document.getElementById('podcast-modal');
    closeButton = podcastModal.querySelector('.close-button');
    
    savedPodcastListUl = document.getElementById('saved-podcast-list')?.querySelector('ul');
    noSavedPodcastsMsg = document.getElementById('saved-podcast-list')?.querySelector('.no-saved-podcasts');
    currentPodcastDetailsDiv = document.getElementById('current-podcast-details');
    currentLocationInfoSpan = document.getElementById('current-location-info');

    podcastTopicInput = document.getElementById('podcast-topic');
    templateCheckboxes = Array.from(document.querySelectorAll('.template-checkbox'));
    podcastRadiusValueInput = document.getElementById('podcast-radius-value');
    podcastRadiusUnitSelect = document.getElementById('podcast-radius-unit');
    podcastStyleSelect = document.getElementById('podcast-style-select');
    podcastFormatSelect = document.getElementById('podcast-format-select');
    podcastNarratorsSelect = document.getElementById('podcast-narrators'); // <-- fixed from 'podcast-narrator'
    podcastNarratorsNote = document.getElementById('voice-selection-note');
    podcastDetailLevelInput = document.getElementById('podcast-detail-level');
    detailLevelValueSpan = document.getElementById('detail-level-value');

    generatePodcastModalBtn = document.getElementById('generate-podcast-modal-btn');
    podcastGenerationStatus = document.getElementById('podcast-generation-status');
    podcastGenerationProgressContainer = document.getElementById('podcast-generation-progress-container');
    podcastGenerationProgress = document.getElementById('podcast-generation-progress');
    podcastModalOutput = document.getElementById('podcast-modal-output');

    audioStatus = document.getElementById('audio-status');
    audioProgressBarContainerModal = document.getElementById('audio-progress-bar-container');
    audioProgressBarModal = document.getElementById('audio-progress-bar');
    playPodcastModalBtn = document.getElementById('play-podcast-modal-btn');

    savePodcastBtnModal = document.getElementById('save-podcast-btn');
    updatePodcastBtnModal = document.getElementById('update-podcast-btn');
    deletePodcastBtnModal = document.getElementById('delete-podcast-btn');
    viewPodcastsBtn = document.getElementById('view-podcasts-btn');
    
    referencesTableContainer = document.getElementById('references-table-container');
    referencesTable = document.getElementById('references-table');
    noReferencesMsg = document.getElementById('no-references');
}

// Localization system
function getLocalizedText(key) {
    const translations = {
        'en': {
            'place_podcast_btn': 'Place Podcast Area',
            'view_podcasts_btn': 'View/Manage Saved Podcasts',
            'podcast_area_details': 'Podcast Area Details',
            'saved_podcast_areas': 'Saved Podcast Areas',
            'no_saved_podcasts': 'No saved podcast areas yet. Click "Place Podcast Area" to create one.',
            'configure_new_area': 'Configure New or Loaded Podcast Area',
            'main_topic_label': 'Main Topic / What\'s it about? (Free Text)',
            'topic_placeholder': 'e.g., History of this park',
            'choose_templates': 'Or choose from templates:',
            'best_restaurants': 'Best Restaurants',
            'must_know_places': 'Must Know Places',
            'history': 'History (Parks, Buildings, Landmarks)',
            'local_culture': 'Local Culture',
            'nature_scenery': 'Nature & Scenery',
            'architecture': 'Architecture',
            'arts_culture': 'Arts and Culture',
            'family_fun': 'Family Fun',
            'hidden_gems': 'Hidden Gems',
            'sports_history': 'Sports History',
            'radius_label': 'Radius:',
            'podcast_style_label': 'Podcast Style/Tone:',
            'informative': 'Informative',
            'conversational': 'Conversational',
            'historical': 'Historical Focus',
            'foodie': 'Foodie Guide',
            'travelogue': 'Travelogue',
            'storytelling': 'Storytelling',
            'upbeat': 'Upbeat/Energetic',
            'relaxed': 'Relaxed/Calm',
            'output_format_label': 'Output Format:',
            'summary': 'Summary',
            'script_excerpt': 'Script Excerpt',
            'interview_style': 'Interview Style',
            'documentary': 'Documentary',
            'poetic_description': 'Poetic Description',
            'narrator_voice_label': 'Narrator Voice:',
            'detail_level_label': 'Detail Level:',
            'generated_content': 'Generated Content',
            'generate_podcast': 'Generate Podcast',
            'read_aloud': 'Read Aloud',
            'generate_audio': 'Generate Audio from Edited Content',
            'download_podcast': 'Download Podcast',
            'sources_references': 'Sources & References',
            'audio_playback': 'Audio Playback',
            'play_audio': 'Play Audio',
            'save_podcast_area': 'Save Podcast Area',
            'update_podcast_area': 'Update Podcast Area',
            'delete_podcast_area': 'Delete Podcast Area',
            'download_format': 'Select download format:',
            'audio_mp3': 'Audio (MP3)',
            'script_txt': 'Script (TXT)',
            'full_data_json': 'Full Data (JSON)',
            'ai_tool_title': 'AI Tool - Edit Paragraph',
            'ai_instruction_label': 'Enter your instruction for this paragraph:',
            'ai_instruction_placeholder': 'e.g., make it more dramatic, add historical context, focus on architecture, make it more engaging...',
            'apply_ai_instruction': 'Apply AI Instruction',
            'cancel': 'Cancel',
            'footer_text': 'Local Podcast Generator Map by <a href="https://kosch.cloud" target="_blank">KoSch</a> using <a href="https://www.openstreetmap.org" target="_blank">OpenStreetMap</a> and <a href="https://websim.ai" target="_blank">websim.ai</a> technology | <a href="https://websim.ai/@kosch" target="_blank">Kosch on Websim</a> | <a href="https://kosch.cloud" target="_blank">kosch.cloud</a>',
            'error_no_location': 'Please select a location on the map first by using the \'Place Podcast Area\' tool.',
            'error_save_no_location': 'Cannot save: No location defined for this podcast area.',
            'confirm_save_incomplete': 'Content or audio has not been generated. Save with current settings anyway?',
            'success_saved': 'Podcast area saved successfully!',
            'error_save_failed': 'Failed to save podcast: ',
            'error_update_no_id': 'Cannot update: Podcast ID is missing.',
            'success_updated': 'Podcast area updated successfully!',
            'error_update_failed': 'Failed to update podcast: ',
            'error_delete_no_id': 'Cannot delete: Podcast ID is missing.',
            'confirm_delete': 'Are you sure you want to delete this podcast area? This action cannot be undone.',
            'success_deleted': 'Podcast area deleted successfully.',
            'error_delete_failed': 'Failed to delete podcast: ',
            'edit': 'Edit',
            'shorter': 'Shorter',
            'longer': 'Longer',
            'ai_tool': 'AI Tool',
            'enable_edit_mode': 'Enable Edit Mode',
            'disable_edit_mode': 'Back to Read Mode'
        },
        'es': {
            'place_podcast_btn': 'Colocar Área de Podcast',
            'view_podcasts_btn': 'Ver/Gestionar Podcasts Guardados',
            'podcast_area_details': 'Detalles del Área de Podcast',
            'saved_podcast_areas': 'Áreas de Podcast Guardadas',
            'no_saved_podcasts': 'Aún no hay áreas de podcast guardadas. Haz clic en "Colocar Área de Podcast" para crear una.',
            'configure_new_area': 'Configurar Área de Podcast Nueva o Cargada',
            'main_topic_label': 'Tema Principal / De qué se trata? (Texto Libre)',
            'topic_placeholder': 'ej., Historia de este parque',
            'choose_templates': 'O elige de las plantillas:',
            'best_restaurants': 'Mejores Restaurantes',
            'must_know_places': 'Lugares Imprescindibles',
            'history': 'Historia (Parques, Edificios, Monumentos)',
            'local_culture': 'Cultura Local',
            'nature_scenery': 'Naturaleza y Paisajes',
            'architecture': 'Arquitectura',
            'arts_culture': 'Artes y Cultura',
            'family_fun': 'Diversión Familiar',
            'hidden_gems': 'Joyas Ocultas',
            'sports_history': 'Historia Deportiva',
            'radius_label': 'Radio:',
            'podcast_style_label': 'Estilo/Tono del Podcast:',
            'informative': 'Informativo',
            'conversational': 'Conversacional',
            'historical': 'Enfoque Histórico',
            'foodie': 'Guía Gastronómica',
            'travelogue': 'Relato de Viaje',
            'storytelling': 'Narrativo',
            'upbeat': 'Animado/Enérgico',
            'relaxed': 'Relajado/Tranquilo',
            'output_format_label': 'Formato de Salida:',
            'summary': 'Resumen',
            'script_excerpt': 'Extracto de Guión',
            'interview_style': 'Estilo Entrevista',
            'documentary': 'Documental',
            'poetic_description': 'Descripción Poética',
            'narrator_voice_label': 'Voz del Narrador:',
            'detail_level_label': 'Nivel de Detalle:',
            'generated_content': 'Contenido Generado',
            'generate_podcast': 'Generar Podcast',
            'read_aloud': 'Leer en Voz Alta',
            'generate_audio': 'Generar Audio del Contenido Editado',
            'download_podcast': 'Descargar Podcast',
            'sources_references': 'Fuentes y Referencias',
            'audio_playback': 'Reproducción de Audio',
            'play_audio': 'Reproducir Audio',
            'save_podcast_area': 'Guardar Área de Podcast',
            'update_podcast_area': 'Actualizar Área de Podcast',
            'delete_podcast_area': 'Eliminar Área de Podcast',
            'download_format': 'Selecciona formato de descarga:',
            'audio_mp3': 'Audio (MP3)',
            'script_txt': 'Guión (TXT)',
            'full_data_json': 'Datos Completos (JSON)',
            'ai_tool_title': 'Herramienta IA - Editar Párrafo',
            'ai_instruction_label': 'Ingresa tu instrucción para este párrafo:',
            'ai_instruction_placeholder': 'ej., hazlo más dramático, añade contexto histórico, enfócate en arquitectura, hazlo más atractivo...',
            'apply_ai_instruction': 'Aplicar Instrucción IA',
            'cancel': 'Cancelar',
            'footer_text': 'Mapa Generador de Podcasts Locales por <a href="https://kosch.cloud" target="_blank">KoSch</a> usando <a href="https://www.openstreetmap.org" target="_blank">OpenStreetMap</a> y tecnología <a href="https://websim.ai" target="_blank">websim.ai</a> | <a href="https://websim.ai/@kosch" target="_blank">Kosch en Websim</a> | <a href="https://kosch.cloud" target="_blank">kosch.cloud</a>',
            'error_no_location': 'Por favor selecciona primero una ubicación en el mapa usando la herramienta \'Colocar Área de Podcast\'.',
            'error_save_no_location': 'No se puede guardar: No hay ubicación definida para esta área de podcast.',
            'confirm_save_incomplete': 'El contenido o audio no ha sido generado. ¿Guardar con la configuración actual de todos modos?',
            'success_saved': '¡Área de podcast guardada exitosamente!',
            'error_save_failed': 'Error al guardar podcast: ',
            'error_update_no_id': 'No se puede actualizar: ID del podcast manquant.',
            'success_updated': '¡Área de podcast actualizada exitosamente!',
            'error_update_failed': 'Error al actualizar podcast: ',
            'error_delete_no_id': 'No se puede eliminar: ID del podcast manquant.',
            'confirm_delete': '¿Estás seguro de que quieres eliminar esta área de podcast? Esta acción no se puede deshacer.',
            'success_deleted': 'Área de podcast eliminada exitosamente.',
            'error_delete_failed': 'Error al eliminar podcast: ',
            'edit': 'Editar',
            'shorter': 'Más Corto',
            'longer': 'Más Largo',
            'ai_tool': 'Herramienta IA',
            'enable_edit_mode': 'Activar Modo Edición',
            'disable_edit_mode': 'Volver a Modo Lectura'
        },
        'fr': {
            'place_podcast_btn': 'Placer Zone de Podcast',
            'view_podcasts_btn': 'Voir/Gérer Podcasts Sauvegardés',
            'podcast_area_details': 'Détails de la Zone de Podcast',
            'saved_podcast_areas': 'Zones de Podcast Sauvegardées',
            'no_saved_podcasts': 'Aucune zone de podcast sauvegardée pour le moment. Cliquez sur "Placer Zone de Podcast" pour en créer une.',
            'configure_new_area': 'Configurer Zone de Podcast Nouvelle ou Chargée',
            'main_topic_label': 'Sujet Principal / De quoi s\'agit-il ? (Texte Libre)',
            'topic_placeholder': 'ex., Histoire de ce parc',
            'choose_templates': 'Ou choisissez parmi les modèles:',
            'best_restaurants': 'Meilleurs Restaurants',
            'must_know_places': 'Lieux Incontournables',
            'history': 'Histoire (Parcs, Bâtiments, Monuments)',
            'local_culture': 'Culture Locale',
            'nature_scenery': 'Nature et Paysages',
            'architecture': 'Architecture',
            'arts_culture': 'Arts et Culture',
            'family_fun': 'Plaisir Familial',
            'hidden_gems': 'Perles Cachées',
            'sports_history': 'Histoire Sportive',
            'radius_label': 'Rayon:',
            'podcast_style_label': 'Style/Ton du Podcast:',
            'informative': 'Informatif',
            'conversational': 'Conversationnel',
            'historical': 'Focus Historique',
            'foodie': 'Guide Gastronomique',
            'travelogue': 'Récit de Voyage',
            'storytelling': 'Narratif',
            'upbeat': 'Enjoué/Énergique',
            'relaxed': 'Détendu/Calme',
            'output_format_label': 'Format de Sortie:',
            'summary': 'Résumé',
            'script_excerpt': 'Extrait de Script',
            'interview_style': 'Style Interview',
            'documentary': 'Documentaire',
            'poetic_description': 'Description Poétique',
            'narrator_voice_label': 'Voix du Narrateur:',
            'detail_level_label': 'Niveau de Détail:',
            'generated_content': 'Contenu Généré',
            'generate_podcast': 'Générer Podcast',
            'read_aloud': 'Lire à Haute Voix',
            'generate_audio': 'Générer Audio du Contenu Édité',
            'download_podcast': 'Télécharger Podcast',
            'sources_references': 'Sources et Références',
            'audio_playback': 'Lecture Audio',
            'play_audio': 'Lire Audio',
            'save_podcast_area': 'Sauvegarder Zone de Podcast',
            'update_podcast_area': 'Mettre à Jour Zone de Podcast',
            'delete_podcast_area': 'Supprimer Zone de Podcast',
            'download_format': 'Sélectionnez le format de téléchargement:',
            'audio_mp3': 'Audio (MP3)',
            'script_txt': 'Script (TXT)',
            'full_data_json': 'Données Complètes (JSON)',
            'ai_tool_title': 'Outil IA - Éditer Paragraphe',
            'ai_instruction_label': 'Entrez votre instruction pour ce paragraphe:',
            'ai_instruction_placeholder': 'ex., rendez-le plus dramatique, ajoutez du contexte historique, concentrez-vous sur l\'architecture, rendez-le plus engageant...',
            'apply_ai_instruction': 'Appliquer Instruction IA',
            'cancel': 'Annuler',
            'footer_text': 'Carte Générateur de Podcasts Locaux par <a href="https://kosch.cloud" target="_blank">KoSch</a> utilisant <a href="https://www.openstreetmap.org" target="_blank">OpenStreetMap</a> et la technologie <a href="https://websim.ai" target="_blank">websim.ai</a> | <a href="https://websim.ai/@kosch" target="_blank">Kosch sur Websim</a> | <a href="https://kosch.cloud" target="_blank">kosch.cloud</a>',
            'error_no_location': 'Veuillez d\'abord sélectionner un emplacement sur la carte en utilisant l\'outil \'Placer Zone de Podcast\'.',
            'error_save_no_location': 'Impossible de sauvegarder: Aucun emplacement défini pour cette zone de podcast.',
            'confirm_save_incomplete': 'Le contenu ou l\'audio n\'a pas été généré. Sauvegarder avec les paramètres actuels quand même?',
            'success_saved': 'Zone de podcast sauvegardée avec succès!',
            'error_save_failed': 'Échec de la sauvegarde du podcast: ',
            'error_update_no_id': 'Impossible de mettre à jour: ID du podcast manquant.',
            'success_updated': 'Zone de podcast mise à jour avec succès!',
            'error_update_failed': 'Échec de la mise à jour du podcast: ',
            'error_delete_no_id': 'Impossible de supprimer: ID du podcast manquant.',
            'confirm_delete': 'Êtes-vous sûr de vouloir supprimer cette zone de podcast? Cette action ne peut pas être annulée.',
            'success_deleted': 'Zone de podcast supprimée avec succès.',
            'error_delete_failed': 'Échec de la suppression du podcast: ',
            'edit': 'Éditer',
            'shorter': 'Plus Court',
            'longer': 'Plus Long',
            'ai_tool': 'Outil IA',
            'enable_edit_mode': 'Activer Mode Édition',
            'disable_edit_mode': 'Retour Mode Lecture'
        },
        'de': {
            'place_podcast_btn': 'Podcast-Bereich Platzieren',
            'view_podcasts_btn': 'Gespeicherte Podcasts Anzeigen/Verwalten',
            'podcast_area_details': 'Podcast-Bereich Details',
            'saved_podcast_areas': 'Gespeicherte Podcast-Bereiche',
            'no_saved_podcasts': 'Noch keine gespeicherten Podcast-Bereiche. Klicken Sie auf "Podcast-Bereich Platzieren", um einen zu erstellen.',
            'configure_new_area': 'Neuen oder Geladenen Podcast-Bereich Konfigurieren',
            'main_topic_label': 'Hauptthema / Worum geht es? (Freier Text)',
            'topic_placeholder': 'z.B., Geschichte dieses Parks',
            'choose_templates': 'Oder wählen Sie aus Vorlagen:',
            'best_restaurants': 'Beste Restaurants',
            'must_know_places': 'Sehenswerte Orte',
            'history': 'Geschichte (Parks, Gebäude, Denkmäler)',
            'local_culture': 'Lokale Kultur',
            'nature_scenery': 'Natur & Landschaft',
            'architecture': 'Architektur',
            'arts_culture': 'Kunst und Kultur',
            'family_fun': 'Familienspaß',
            'hidden_gems': 'Versteckte Schätze',
            'sports_history': 'Sportgeschichte',
            'radius_label': 'Radius:',
            'podcast_style_label': 'Podcast-Stil/Ton:',
            'informative': 'Informativ',
            'conversational': 'Unterhaltend',
            'historical': 'Historischer Fokus',
            'foodie': 'Kulinarischer Führer',
            'travelogue': 'Reisebericht',
            'storytelling': 'Erzählend',
            'upbeat': 'Schwungvoll/Energisch',
            'relaxed': 'Entspannt/Ruhig',
            'output_format_label': 'Ausgabeformat:',
            'summary': 'Zusammenfassung',
            'script_excerpt': 'Skript-Auszug',
            'interview_style': 'Interview-Stil',
            'documentary': 'Dokumentation',
            'poetic_description': 'Poetische Beschreibung',
            'narrator_voice_label': 'Erzählerstimme:',
            'detail_level_label': 'Detailgrad:',
            'generated_content': 'Generierter Inhalt',
            'generate_podcast': 'Podcast Generieren',
            'read_aloud': 'Vorlesen',
            'generate_audio': 'Audio aus Bearbeitetem Inhalt Generieren',
            'download_podcast': 'Podcast Herunterladen',
            'sources_references': 'Quellen und Referenzen',
            'audio_playback': 'Audio-Wiedergabe',
            'play_audio': 'Audio Abspielen',
            'save_podcast_area': 'Podcast-Bereich Speichern',
            'update_podcast_area': 'Podcast-Bereich Aktualisieren',
            'delete_podcast_area': 'Podcast-Bereich Löschen',
            'download_format': 'Download-Format auswählen:',
            'audio_mp3': 'Audio (MP3)',
            'script_txt': 'Skript (TXT)',
            'full_data_json': 'Vollständige Daten (JSON)',
            'ai_tool_title': 'KI-Tool - Absatz Bearbeiten',
            'ai_instruction_label': 'Geben Sie Ihre Anweisung für diesen Absatz ein:',
            'ai_instruction_placeholder': 'z.B., machen Sie es dramatischer, fügen Sie historischen Kontext hinzu, konzentrieren Sie sich auf Architektur, machen Sie es ansprechender...',
            'apply_ai_instruction': 'KI-Anweisung Anwenden',
            'cancel': 'Abbrechen',
            'footer_text': 'Lokaler Podcast-Generator Karte von <a href="https://kosch.cloud" target="_blank">KoSch</a> mit <a href="https://www.openstreetmap.org" target="_blank">OpenStreetMap</a> und <a href="https://websim.ai" target="_blank">websim.ai</a> Technologie | <a href="https://websim.ai/@kosch" target="_blank">Kosch auf Websim</a> | <a href="https://kosch.cloud" target="_blank">kosch.cloud</a>',
            'error_no_location': 'Bitte wählen Sie zuerst einen Ort auf der Karte mit dem \'Podcast-Bereich Platzieren\' Tool.',
            'error_save_no_location': 'Kann nicht speichern: Kein Ort für diesen Podcast-Bereich definiert.',
            'confirm_save_incomplete': 'Inhalt oder Audio wurde nicht generiert. Mit aktuellen Einstellungen trotzdem speichern?',
            'success_saved': 'Podcast-Bereich erfolgreich gespeichert!',
            'error_save_failed': 'Podcast speichern fehlgeschlagen: ',
            'error_update_no_id': 'Kann nicht aktualisieren: Podcast-ID fehlt.',
            'success_updated': 'Podcast-Bereich erfolgreich aktualisiert!',
            'error_update_failed': 'Podcast aktualisieren fehlgeschlagen: ',
            'error_delete_no_id': 'Kann nicht löschen: Podcast-ID fehlt.',
            'confirm_delete': 'Sind Sie sicher, dass Sie diesen Podcast-Bereich löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.',
            'success_deleted': 'Podcast-Bereich erfolgreich gelöscht.',
            'error_delete_failed': 'Podcast löschen fehlgeschlagen: ',
            'edit': 'Bearbeiten',
            'shorter': 'Kürzer',
            'longer': 'Länger',
            'ai_tool': 'KI-Tool',
            'enable_edit_mode': 'Bearbeitungsmodus Aktivieren',
            'disable_edit_mode': 'Zurück zum Lesemodus'
        },
        'it': {
            'place_podcast_btn': 'Collocare Area del Podcast',
            'view_podcasts_btn': 'Visualizza/Gestisci Podcast Salvati',
            'podcast_area_details': 'Dettagli dell\'Area del Podcast',
            'saved_podcast_areas': 'Aree del Podcast Salvate',
            'no_saved_podcasts': 'Nessuna area del podcast salvata al momento. Clicca su "Collocare Area del Podcast" per crearne una.',
            'configure_new_area': 'Configurare Nuova o Caricata Area del Podcast',
            'main_topic_label': 'Argomento Principale / Di cosa si tratta? (Testo Libero)',
            'topic_placeholder': 'ad es., Storia di questo parco',
            'choose_templates': 'O scegli tra i modelli:',
            'best_restaurants': 'Migliori Ristoranti',
            'must_know_places': 'Luoghi Imperdibili',
            'history': 'Storia (Parchi, Edifici, Monumenti)',
            'local_culture': 'Cultura Locale',
            'nature_scenery': 'Natura e Paesaggi',
            'architecture': 'Architettura',
            'arts_culture': 'Arte e Cultura',
            'family_fun': 'Divertimento Familiare',
            'hidden_gems': 'Pietre Preziose Nascoste',
            'sports_history': 'Storia dello Sport',
            'radius_label': 'Raggio:',
            'podcast_style_label': 'Stile/Tono del Podcast:',
            'informative': 'Informativo',
            'conversational': 'Conversazionale',
            'historical': 'Focus Storico',
            'foodie': 'Guida Gastronomica',
            'travelogue': 'Racconto di Viaggio',
            'storytelling': 'Narrativo',
            'upbeat': 'Allegro/Energico',
            'relaxed': 'Rilassato/Calmo',
            'output_format_label': 'Formato di Uscita:',
            'summary': 'Riassunto',
            'script_excerpt': 'Estratto di Sceneggiatura',
            'interview_style': 'Stile Intervista',
            'documentary': 'Documentario',
            'poetic_description': 'Descrizione Poetica',
            'narrator_voice_label': 'Voce del Narratore:',
            'detail_level_label': 'Livello di Dettaglio:',
            'generated_content': 'Contenuto Generato',
            'generate_podcast': 'Generare Podcast',
            'read_aloud': 'Leggere a Voce Alta',
            'generate_audio': 'Generare Audio dal Contenuto Modificato',
            'download_podcast': 'Scaricare Podcast',
            'sources_references': 'Fonti e Riferimenti',
            'audio_playback': 'Riproduzione Audio',
            'play_audio': 'Riprodurre Audio',
            'save_podcast_area': 'Salvare Area del Podcast',
            'update_podcast_area': 'Aggiornare Area del Podcast',
            'delete_podcast_area': 'Eliminare Area del Podcast',
            'download_format': 'Selezionare il formato di download:',
            'audio_mp3': 'Audio (MP3)',
            'script_txt': 'Sceneggiatura (TXT)',
            'full_data_json': 'Dati Completi (JSON)',
            'ai_tool_title': 'Strumento IA - Modificare Paragrafo',
            'ai_instruction_label': 'Inserire istruzioni per questo paragrafo:',
            'ai_instruction_placeholder': 'ad es., rendilo più drammatico, aggiungi contesto storico, concentra su architettura, rendilo più coinvolgente...',
            'apply_ai_instruction': 'Applicare Istruzione IA',
            'cancel': 'Annulla',
            'footer_text': 'Mappa Generatore di Podcast Locali di <a href="https://kosch.cloud" target="_blank">KoSch</a> utilizzando <a href="https://www.openstreetmap.org" target="_blank">OpenStreetMap</a> e tecnologia <a href="https://websim.ai" target="_blank">websim.ai</a> | <a href="https://websim.ai/@kosch" target="_blank">Kosch su Websim</a> | <a href="https://kosch.cloud" target="_blank">kosch.cloud</a>',
            'error_no_location': 'Per favore seleziona prima una posizione sulla mappa utilizzando lo strumento \'Collocare Area del Podcast\'.',
            'error_save_no_location': 'Impossibile salvare: Nessuna posizione definita per questa area del podcast.',
            'confirm_save_incomplete': 'Contenuto o audio non è stato generato. Salvare con le impostazioni attuali comunque?',
            'success_saved': 'Area del podcast salvata con successo!',
            'error_save_failed': 'Errore durante il salvataggio del podcast: ',
            'error_update_no_id': 'Impossibile aggiornare: ID del podcast mancante.',
            'success_updated': 'Area del podcast aggiornata con successo!',
            'error_update_failed': 'Errore durante l\'aggiornamento del podcast: ',
            'error_delete_no_id': 'Impossibile eliminare: ID del podcast mancante.',
            'confirm_delete': 'Sei sicuro di voler eliminare questa area del podcast? Questa azione non può essere annullata.',
            'success_deleted': 'Area del podcast eliminata con successo.',
            'error_delete_failed': 'Errore durante l\'eliminazione del podcast: ',
            'edit': 'Modificare',
            'shorter': 'Più Breve',
            'longer': 'Più Lungo',
            'ai_tool': 'Strumento IA',
            'enable_edit_mode': 'Abilitare Modalità di Modifica',
            'disable_edit_mode': 'Torna alla Modalità di Lettura'
        }
    };
    
    const baseLanguage = userLanguage.split('-')[0].toLowerCase();
    const languageTranslations = translations[baseLanguage] || translations['en'];
    return languageTranslations[key] || key;
}

// Apply localization to UI elements
function localizeUI() {
    // Update buttons
    if (placePodcastBtn) placePodcastBtn.textContent = getLocalizedText('place_podcast_btn');
    if (viewPodcastsBtn) viewPodcastsBtn.textContent = getLocalizedText('view_podcasts_btn');
    if (generatePodcastModalBtn) generatePodcastModalBtn.textContent = getLocalizedText('generate_podcast');
    if (savePodcastBtnModal) savePodcastBtnModal.textContent = getLocalizedText('save_podcast_area');
    if (updatePodcastBtnModal) updatePodcastBtnModal.textContent = getLocalizedText('update_podcast_area');
    if (deletePodcastBtnModal) deletePodcastBtnModal.textContent = getLocalizedText('delete_podcast_area');
    if (playPodcastModalBtn) playPodcastModalBtn.textContent = getLocalizedText('play_audio');
    
    // Update modal titles and labels
    const podcastModalTitle = document.getElementById('podcast-modal-title');
    if (podcastModalTitle) podcastModalTitle.textContent = getLocalizedText('podcast_area_details');
    
    const savedPodcastListTitle = document.querySelector('#saved-podcast-list-container h4');
    if (savedPodcastListTitle) savedPodcastListTitle.textContent = getLocalizedText('saved_podcast_areas');
    
    const currentPodcastDetailsTitle = document.querySelector('#current-podcast-details h4');
    if (currentPodcastDetailsTitle) currentPodcastDetailsTitle.textContent = getLocalizedText('configure_new_area');
    
    // Update labels
    const labels = [
        { selector: 'label[for="podcast-topic"]', key: 'main_topic_label' },
        { selector: 'label[for="podcast-radius-value"]', key: 'radius_label' },
        { selector: 'label[for="podcast-style-select"]', key: 'podcast_style_label' },
        { selector: 'label[for="podcast-format-select"]', key: 'output_format_label' },
        { selector: 'label[for="podcast-narrators"]', key: 'narrator_voice_label' },
        { selector: 'label[for="podcast-detail-level"]', key: 'detail_level_label' },
        { selector: 'label[for="ai-instruction"]', key: 'ai_instruction_label' }
    ];
    
    labels.forEach(({selector, key}) => {
        const element = document.querySelector(selector);
        if (element) element.textContent = getLocalizedText(key);
    });
    
    // Update placeholders
    if (podcastTopicInput) podcastTopicInput.placeholder = getLocalizedText('topic_placeholder');
    const aiInstruction = document.getElementById('ai-instruction');
    if (aiInstruction) aiInstruction.placeholder = getLocalizedText('ai_instruction_placeholder');
    
    // Update template checkboxes
    const templateLabels = {
        'Best Restaurants': 'best_restaurants',
        'Must Know Places': 'must_know_places', 
        'History': 'history',
        'Local Culture': 'local_culture',
        'Nature & Scenery': 'nature_scenery',
        'Architecture': 'architecture',
        'Arts and Culture': 'arts_culture',
        'Family Fun': 'family_fun',
        'Hidden Gems': 'hidden_gems',
        'Sports History': 'sports_history'
    };
    
    templateCheckboxes.forEach(cb => {
        const label = cb.parentElement;
        const key = templateLabels[cb.value];
        if (key && label) {
            const textNode = Array.from(label.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
            if (textNode) textNode.textContent = ' ' + getLocalizedText(key);
        }
    });
    
    // Update select options
    const styleOptions = {
        'informative': 'informative',
        'conversational': 'conversational', 
        'historical': 'historical',
        'foodie': 'foodie',
        'travelogue': 'travelogue',
        'storytelling': 'storytelling',
        'upbeat': 'upbeat',
        'relaxed': 'relaxed'
    };
    
    if (podcastStyleSelect) {
        Array.from(podcastStyleSelect.options).forEach(option => {
            const key = styleOptions[option.value];
            if (key) option.textContent = getLocalizedText(key);
        });
    }
    
    const formatOptions = {
        'summary': 'summary',
        'script-excerpt': 'script_excerpt', 
        'interview-style': 'interview_style', 
        'documentary': 'documentary',
        'poetic-description': 'poetic_description'
    };
    
    if (podcastFormatSelect) {
        Array.from(podcastFormatSelect.options).forEach(option => {
            const key = formatOptions[option.value];
            if (key) option.textContent = getLocalizedText(key);
        });
    }
    
    // Update other content
    const generatedContentTitle = document.querySelector('h4');
    if (generatedContentTitle && generatedContentTitle.textContent === 'Generated Content') {
        generatedContentTitle.textContent = getLocalizedText('generated_content');
    }
    
    // Update footer
    const footer = document.querySelector('.app-footer');
    if (footer) footer.innerHTML = getLocalizedText('footer_text');
    
    // Update no saved podcasts message
    if (noSavedPodcastsMsg) noSavedPodcastsMsg.textContent = getLocalizedText('no_saved_podcasts');
    
    // Update template introduction text
    const templateIntro = document.querySelector('.podcast-templates p');
    if (templateIntro) templateIntro.textContent = getLocalizedText('choose_templates');
    
    // Update download modal
    const downloadModalTitle = document.querySelector('#download-modal h3');
    if (downloadModalTitle) downloadModalTitle.textContent = getLocalizedText('download_podcast');
    
    const downloadText = document.querySelector('#download-modal p');
    if (downloadText) downloadText.textContent = getLocalizedText('download_format');
    
    // Update AI tool modal
    const aiToolModalTitle = document.querySelector('#ai-tool-modal h3');
    if (aiToolModalTitle) aiToolModalTitle.textContent = getLocalizedText('ai_tool_title');
}

async function initializeMap() {
    map = L.map('map');
    try {
        const location = await getUserLocation();
        map.setView([location.lat, location.lng], 13);
    } catch (error) {
        console.error("Failed to get user location for initial map view:", error);
        map.setView([51.505, -0.09], 13); // Fallback
    }

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    map.on('click', handleMapClick);
    applySettingsFromURL(); // Apply URL params after map is ready
}

// --- Map Interaction ---
function togglePodcastPlacementTool() {
    isPlacingPodcastMarker = !isPlacingPodcastMarker;
    placePodcastBtn.classList.toggle('active', isPlacingPodcastMarker);
    mapElement.classList.toggle('placing-marker', isPlacingPodcastMarker);
    if (isPlacingPodcastMarker) {
        console.log('Podcast placement tool activated. Click on the map.');
    } else {
        console.log('Podcast placement tool deactivated.');
    }
}

function handleMapClick(e) {
    if (isPlacingPodcastMarker) {
        const latlng = e.latlng;
        clearExistingMapMarkerAndCircle(); // Clear previous temporary marker

        currentMapMarker = L.marker(latlng).addTo(map);
        const initialRadiusMeters = currentEditingPodcast.radius * (currentEditingPodcast.radiusUnit === 'km' ? 1000 : 1609.34);
        currentMapCircle = L.circle(latlng, {
            color: 'blue', fillColor: '#30f', fillOpacity: 0.2, radius: initialRadiusMeters
        }).addTo(map);

        currentEditingPodcast = { // Reset/initialize for new area
            ...currentEditingPodcast, // keep default style, format etc.
            id: null,
            latitude: latlng.lat,
            longitude: latlng.lng,
            // radius and unit are already in currentEditingPodcast defaults
            topic: '',
            templates: [],
            generatedText: '',
            audioResult: null
        };
        
        const popupContent = `
            <b>New Podcast Area</b><br>
            Lat: ${latlng.lat.toFixed(4)}, Lng: ${latlng.lng.toFixed(4)}<br>
            <button class="open-details-map-btn">Configure Details</button>
        `;
        currentMapMarker.bindPopup(popupContent).openPopup();
        currentMapMarker.on('popupopen', (event) => {
            const button = event.popup.getElement().querySelector('.open-details-map-btn');
            if(button) {
                button.addEventListener('click', () => {
                     openPodcastModalForEditing(currentEditingPodcast, false);
                });
            }
        });
        
        // Automatically open modal for this new point
        openPodcastModalForEditing(currentEditingPodcast, false);

        isPlacingPodcastMarker = false;
        placePodcastBtn.classList.remove('active');
        mapElement.classList.remove('placing-marker');
    }
}

function updateRadiusFromModal() {
    if (currentMapCircle && map.hasLayer(currentMapCircle)) {
        const value = parseFloat(podcastRadiusValueInput.value);
        const unit = podcastRadiusUnitSelect.value;
        let radiusInMeters = 0;
        if (!isNaN(value) && value > 0) {
            radiusInMeters = unit === 'km' ? value * 1000 : value * 1609.34;
            currentMapCircle.setRadius(radiusInMeters);
            currentEditingPodcast.radius = value;
            currentEditingPodcast.radiusUnit = unit;
            updateURLWithCurrentModalSettings();
        }
    }
}

function clearExistingMapMarkerAndCircle() {
    if (currentMapMarker) {
        map.removeLayer(currentMapMarker);
        currentMapMarker = null;
    }
    if (currentMapCircle) {
        map.removeLayer(currentMapCircle);
        currentMapCircle = null;
    }
}

// --- Modal Management ---
function openPodcastModalForEditing(podcastData, isSaved = false) {
    currentEditingPodcast = { ...currentEditingPodcast, ...podcastData }; // Merge defaults with provided data

    // Populate modal fields
    podcastTopicInput.value = currentEditingPodcast.topic || '';
    templateCheckboxes.forEach(cb => {
        cb.checked = (currentEditingPodcast.templates || []).includes(cb.value);
    });
    podcastRadiusValueInput.value = currentEditingPodcast.radius;
    podcastRadiusUnitSelect.value = currentEditingPodcast.radiusUnit;
    podcastStyleSelect.value = currentEditingPodcast.style;
    podcastFormatSelect.value = currentEditingPodcast.format;
    podcastDetailLevelInput.value = currentEditingPodcast.detailLevel;
    detailLevelValueSpan.textContent = currentEditingPodcast.detailLevel;

    currentLocationInfoSpan.textContent = (currentEditingPodcast.latitude && currentEditingPodcast.longitude) ?
        `Editing area around: Lat ${currentEditingPodcast.latitude.toFixed(4)}, Lng ${currentEditingPodcast.longitude.toFixed(4)}` :
        'No location selected. Place a marker on the map.';

    if (isSaved && currentEditingPodcast.id) {
        // For saved podcasts, show editable content if available
        if (currentEditingPodcast.generatedText) {
            podcastModalOutput.style.display = 'none';
            displayEditablePodcastContent(currentEditingPodcast.generatedText);
            document.getElementById('editable-podcast-content').style.display = 'block';
            document.getElementById('generate-audio-btn').style.display = 'block';
            document.getElementById('read-aloud-btn').style.display = 'block';
        } else {
            podcastModalOutput.textContent = 'No content generated yet.';
            podcastModalOutput.style.display = 'block';
            document.getElementById('editable-podcast-content').style.display = 'none';
        }
        
        // Display references if available
        displayReferences(currentEditingPodcast.references || []);
        
        if (currentEditingPodcast.audioResult && currentEditingPodcast.audioResult.mainContentUrls) {
            playPodcastModalBtn.style.display = 'block';
            audioStatus.textContent = 'Audio ready.';
        } else {
            playPodcastModalBtn.style.display = 'none';
            audioStatus.textContent = currentEditingPodcast.generatedText ? 'Audio not generated or available.' : 'Generate content to enable audio.';
        }
        
        savePodcastBtnModal.style.display = 'none';
        updatePodcastBtnModal.style.display = 'inline-block';
        updatePodcastBtnModal.dataset.podcastId = currentEditingPodcast.id;
        deletePodcastBtnModal.style.display = 'inline-block';
        deletePodcastBtnModals.dataset.podcastId = currentEditingPodcast.id;
        podcastGenerationStatus.textContent = currentEditingPodcast.generatedText ? 'Previously generated content loaded.' : 'Click "Generate Podcast".';
    } else { // New or non-saved area
        podcastModalOutput.textContent = '';
        podcastModalOutput.style.display = 'none';
        document.getElementById('editable-podcast-content').style.display = 'none';
        displayReferences([]); // Clear references
        playPodcastModalBtn.style.display = 'none';
        
        savePodcastBtnModal.style.display = 'inline-block';
        updatePodcastBtnModal.style.display = 'none';
        deletePodcastBtnModal.style.display = 'none';
        podcastGenerationStatus.textContent = 'Configure settings and click "Generate Podcast".';
        audioStatus.textContent = 'Audio will be available after generation.';
        document.getElementById('generate-audio-btn').style.display = 'none';
        document.getElementById('read-aloud-btn').style.display = 'none';
    }
    resetAudioPlayer(modalAudioPlayer); // Reset player state
    playPodcastModalBtn.textContent = 'Play Audio';

    // Ensure map marker/circle reflect currentEditingPodcast if lat/lng exist
    if (currentEditingPodcast.latitude && currentEditingPodcast.longitude) {
        clearExistingMapMarkerAndCircle();
        const latlng = [currentEditingPodcast.latitude, currentEditingPodcast.longitude];
        currentMapMarker = L.marker(latlng).addTo(map);
        const radiusMeters = currentEditingPodcast.radius * (currentEditingPodcast.radiusUnit === 'km' ? 1000 : 1609.34);
        currentMapCircle = L.circle(latlng, {
            color: isSaved ? 'green' : 'blue', 
            fillColor: isSaved ? '#0f0' : '#30f', 
            fillOpacity: 0.2, 
            radius: radiusMeters
        }).addTo(map);
        map.setView(latlng, 13);

        const popupText = isSaved ? `<b>${currentEditingPodcast.topic || 'Saved Area'}</b>` : `<b>New Area</b>`;
        currentMapMarker.bindPopup(`${popupText}<br><button class="open-details-map-btn">Configure Details</button>`);
        currentMapMarker.on('popupopen', (event) => {
            const button = event.popup.getElement().querySelector('.open-details-map-btn');
            if(button) {
                button.addEventListener('click', () => {
                     openPodcastModalForEditing(currentEditingPodcast, isSaved); // Pass current state
                });
            }
        });
    }

    podcastModal.style.display = 'flex';
    displaySavedPodcastsInModal(); // Refresh saved list view
    updateURLWithCurrentModalSettings();
}

function closeModal() {
    podcastModal.style.display = 'none';
    stopAudioPlayback(modalAudioPlayer);
    // Clear temporary URL params if the podcast wasn't saved
    if (!currentEditingPodcast.id) {
       history.pushState({}, '', window.location.pathname); // Clear params
    }
    // Optionally, reset currentEditingPodcast if it was a transient new configuration
    // currentEditingPodcast = { ... (default values) ...}; 
    // clearExistingMapMarkerAndCircle(); // if it was a temp marker for a new unsaved podcast
}

function openViewSavedPodcastsModal() {
    displaySavedPodcastsInModal();
    // Optionally clear or hide the "Current Podcast Details" form if no specific podcast is loaded yet
    // For now, it will show the last edited or default state.
    currentPodcastDetailsDiv.style.display = 'block'; // Ensure it's visible
    if (!currentEditingPodcast.id && !currentEditingPodcast.latitude) { // If no active area
        currentLocationInfoSpan.textContent = 'Select a podcast from the list or place a new area on the map.';
    }
    podcastModal.style.display = 'flex';
}

// --- Podcast Generation and Playback in Modal ---
async function handleGeneratePodcastInModal() {
    if (!currentEditingPodcast.latitude || !currentEditingPodcast.longitude) {
        alert(getLocalizedText('error_no_location'));
        return;
    }

    const freeTextTopic = podcastTopicInput.value.trim();
    const selectedTemplates = templateCheckboxes.filter(cb => cb.checked).map(cb => cb.value);
    let topicSummary = [];
    if (freeTextTopic) topicSummary.push(`"${freeTextTopic}"`);
    if (selectedTemplates.length > 0) topicSummary.push(`${selectedTemplates.join(', ')}`);
    const finalTopic = topicSummary.length > 0 ? topicSummary.join(' and ') : 'general points of interest';

    currentEditingPodcast.topic = finalTopic; // Or distinguish between input topic and finalTopic
    currentEditingPodcast.templates = selectedTemplates;
    currentEditingPodcast.radius = parseFloat(podcastRadiusValueInput.value);
    currentEditingPodcast.radiusUnit = podcastRadiusUnitSelect.value;
    currentEditingPodcast.style = podcastStyleSelect.value;
    currentEditingPodcast.format = podcastFormatSelect.value;
    currentEditingPodcast.detailLevel = parseInt(podcastDetailLevelInput.value);
    currentEditingPodcast.narrator = getPodcastNarrators().host;

    generatePodcastModalBtn.textContent = 'Generating...';
    generatePodcastModalBtn.disabled = true;
    podcastModalOutput.style.display = 'none';
    playPodcastModalBtn.style.display = 'none';
    podcastGenerationStatus.textContent = 'Generating podcast content...';
    podcastGenerationProgressContainer.style.display = 'block';
    podcastGenerationProgress.style.width = '0%';
    podcastGenerationProgress.classList.add('indeterminate');
    audioStatus.textContent = 'Waiting for content generation...';

    try {
        const aiPrompt = {
            latitude: currentEditingPodcast.latitude,
            longitude: currentEditingPodcast.longitude,
            radius: currentEditingPodcast.radius,
            radiusUnit: currentEditingPodcast.radiusUnit,
            topic: currentEditingPodcast.topic, // Use the derived finalTopic
            style: currentEditingPodcast.style,
            format: currentEditingPodcast.format,
            detailLevel: currentEditingPodcast.detailLevel
        };
        currentEditingPodcast.generatedText = await generatePodcastContent(aiPrompt);

        podcastGenerationStatus.textContent = 'Content generated. Ready for editing.';
        podcastGenerationProgress.classList.remove('indeterminate');
        podcastGenerationProgress.style.width = '50%';
        
        // Hide the old output and show editable content
        podcastModalOutput.style.display = 'none';
        displayEditablePodcastContent(currentEditingPodcast.generatedText);
        document.getElementById('editable-podcast-content').style.display = 'block';

        // Display generated references
        displayReferences(currentEditingPodcast.references);

        audioStatus.textContent = 'Edit paragraphs then generate audio.';
        document.getElementById('generate-audio-btn').style.display = 'block';
        document.getElementById('read-aloud-btn').style.display = 'block';
        podcastGenerationProgress.style.width = '100%';

    } catch (error) {
        console.error("Error during modal podcast generation:", error);
        podcastGenerationStatus.textContent = `Error: ${error.message}`;
        podcastModalOutput.textContent = `Error generating content or audio: ${error.message}`;
        podcastModalOutput.style.display = 'block';
        audioStatus.textContent = 'Audio generation failed.';
    } finally {
        generatePodcastModalBtn.textContent = 'Generate Podcast';
        generatePodcastModalBtn.disabled = false;
        setTimeout(() => { // Hide progress bar after a short delay
            podcastGenerationProgressContainer.style.display = 'none';
            podcastGenerationProgress.style.width = '0%';
        }, 2000);
        podcastGenerationProgress.classList.remove('indeterminate');
    }
}

function handlePlayPauseAudioModal() {
    if (!currentEditingPodcast.audioResult) {
        audioStatus.textContent = 'No audio to play.';
        return;
    }

    const player = modalAudioPlayer;

    if (player.isPlaying) {
        player.currentAudioElement.pause();
        player.isPaused = true;
        player.isPlaying = false;
        playPodcastModalBtn.textContent = 'Resume Audio';
        audioStatus.textContent = 'Audio paused.';
        if(player.progressInterval) clearInterval(player.progressInterval);
    } else if (player.isPaused) {
        player.currentAudioElement.play();
        player.isPaused = false;
        player.isPlaying = true;
        playPodcastModalBtn.textContent = 'Pause Audio';
        audioStatus.textContent = 'Playing audio...';
        startAudioProgressUpdater(player, audioProgressBarModal, audioStatus, playPodcastModalBtn);
    } else {
        stopAudioPlayback(player);
        
        // Build complete sequence with all audio elements
        const sequenceData = [
            { url: currentEditingPodcast.audioResult.introUrl, name: "Intro Music" }
        ];
        
        // Add transition music before main content
        sequenceData.push({ url: currentEditingPodcast.audioResult.transitionUrl, name: "Transition" });
        
        // Add all main content segments
        if (currentEditingPodcast.audioResult.mainContentUrls && Array.isArray(currentEditingPodcast.audioResult.mainContentUrls)) {
            currentEditingPodcast.audioResult.mainContentUrls.forEach((url, index) => {
                sequenceData.push({ url: url, name: `Content ${index + 1}` });
            });
        } else if (currentEditingPodcast.audioResult.mainContentUrl) {
            // Backward compatibility
            sequenceData.push({ url: currentEditingPodcast.audioResult.mainContentUrl, name: "Main Content" });
        }
        
        sequenceData.push({ url: currentEditingPodcast.audioResult.closingUrl, name: "Outro" });
        
        player.sequenceData = sequenceData;
        player.audioElements = sequenceData.map(segment => new Audio(segment.url));
        player.currentIndex = 0;
        playNextSegmentModal();
    }
}

function playNextSegmentModal() {
    const player = modalAudioPlayer;
    if (player.currentIndex < player.audioElements.length) {
        player.currentAudioElement = player.audioElements[player.currentIndex];
        const segmentName = player.sequenceData[player.currentIndex].name;
        
        player.currentAudioElement.onended = () => {
            if(player.progressInterval) clearInterval(player.progressInterval);
            player.currentIndex++;
            playNextSegmentModal();
        };
        
        player.currentAudioElement.onerror = () => {
            audioStatus.textContent = `Error playing ${segmentName}.`;
            if(player.progressInterval) clearInterval(player.progressInterval);
            resetAudioPlayer(player);
            playPodcastModalBtn.textContent = 'Play Audio';
        };

        player.currentAudioElement.play()
            .then(() => {
                player.isPlaying = true;
                player.isPaused = false;
                playPodcastModalBtn.textContent = 'Pause Audio';
                audioStatus.textContent = `Playing: ${segmentName}`;
                audioProgressBarContainerModal.style.display = 'block';
                startAudioProgressUpdater(player, audioProgressBarModal, audioStatus, playPodcastModalBtn);
            })
            .catch(err => {
                console.error("Error playing audio:", err);
                audioStatus.textContent = "Error starting audio playback.";
                resetAudioPlayer(player);
                playPodcastModalBtn.textContent = 'Play Audio';
            });
    } else {
        audioStatus.textContent = 'Podcast playback completed.';
        resetAudioPlayer(player);
        playPodcastModalBtn.textContent = 'Play Audio';
        audioProgressBarModal.style.width = '0%';
        setTimeout(() => audioProgressBarContainerModal.style.display = 'none', 1000);
    }
}

function startAudioProgressUpdater(player, progressBarElement, statusElement, playButtonElement) {
    if (player.progressInterval) clearInterval(player.progressInterval); // Clear existing interval for this player

    player.progressInterval = setInterval(() => {
        if (player.currentAudioElement && player.currentAudioElement.duration) {
            const progress = (player.currentAudioElement.currentTime / player.currentAudioElement.duration) * 100;
            progressBarElement.style.width = `${progress}%`;
        }
    }, 250); // Update 4 times a second
}

function stopAudioPlayback(player) {
    if (player.currentAudioElement) {
        player.currentAudioElement.pause();
        player.currentAudioElement.currentTime = 0;
        player.currentAudioElement.onended = null; // Remove listener
        player.currentAudioElement.onerror = null; // Remove listener
    }
    if (player.progressInterval) {
        clearInterval(player.progressInterval);
        player.progressInterval = null;
    }
   resetAudioPlayer(player);
}

function resetAudioPlayer(player) {
    player.sequenceData = [];
    player.audioElements = [];
    player.currentIndex = 0;
    player.isPlaying = false;
    player.isPaused = false;
    player.currentAudioElement = null;
    if(player.progressInterval) clearInterval(player.progressInterval);
    player.progressInterval = null;
}

// --- Database Operations ---
async function handleSavePodcastFromModal() {
    if (!currentEditingPodcast.latitude || !currentEditingPodcast.longitude) {
        alert(getLocalizedText('error_save_no_location'));
        return;
    }
    if (!currentEditingPodcast.generatedText || !currentEditingPodcast.audioResult) {
        const confirmSave = confirm(getLocalizedText('confirm_save_incomplete'));
        if (!confirmSave) return;
    }

    // Consolidate data from currentEditingPodcast and modal form (in case of direct edits not yet in currentEditingPodcast)
    const podcastDataToSave = {
        latitude: currentEditingPodcast.latitude,
        longitude: currentEditingPodcast.longitude,
        radius: parseFloat(podcastRadiusValueInput.value),
        radiusUnit: podcastRadiusUnitSelect.value,
        topic: podcastTopicInput.value.trim() || "Untitled Podcast",
        templates: templateCheckboxes.filter(cb => cb.checked).map(cb => cb.value),
        style: podcastStyleSelect.value,
        format: podcastFormatSelect.value,
        detailLevel: parseInt(podcastDetailLevelInput.value),
        narrator: getPodcastNarrators().host,
        narrators: getPodcastNarrators().narrators,
        generatedText: currentEditingPodcast.generatedText || '',
        // Store the whole audioResult object or just URLs as needed
        audioResult: currentEditingPodcast.audioResult, // Or simplify to audioUrl: currentEditingPodcast.audioResult?.mainContentUrl
        references: currentEditingPodcast.references || []
    };

    try {
        savePodcastBtnModal.disabled = true;
        savePodcastBtnModal.textContent = getLocalizedText('saving') || 'Saving...';
        const savedPodcast = await room.collection('podcast_areas_v2').create(podcastDataToSave);
        currentEditingPodcast.id = savedPodcast.id; // Update current editing state with ID

        alert(getLocalizedText('success_saved'));
        // Update UI to reflect saved state
        savePodcastBtnModal.style.display = 'none';
        updatePodcastBtnModal.style.display = 'inline-block';
        updatePodcastBtnModal.dataset.podcastId = savedPodcast.id;
        deletePodcastBtnModal.style.display = 'inline-block';
        deletePodcastBtnModal.dataset.podcastId = savedPodcast.id;
        
        if (currentMapCircle) currentMapCircle.setStyle({color: 'green', fillColor: '#0f0'}); // Mark as saved on map
        
        displaySavedPodcastsInModal(); // Refresh list
        updateURLWithCurrentModalSettings(); // Add podcastId to URL

    } catch (error) {
        console.error("Failed to save podcast:", error);
        alert(getLocalizedText('error_save_failed') + error.message);
    } finally {
        savePodcastBtnModal.disabled = false;
        savePodcastBtnModal.textContent = getLocalizedText('save_podcast_area');
    }
}

async function handleUpdatePodcastFromModal() {
    const podcastId = updatePodcastBtnModal.dataset.podcastId;
    if (!podcastId) {
        alert(getLocalizedText('error_update_no_id'));
        return;
    }

    const updatedData = {
        // latitude and longitude are generally not updated once set, but could be if UI allows moving
        radius: parseFloat(podcastRadiusValueInput.value),
        radiusUnit: podcastRadiusUnitSelect.value,
        topic: podcastTopicInput.value.trim() || "Untitled Podcast",
        templates: templateCheckboxes.filter(cb => cb.checked).map(cb => cb.value),
        style: podcastStyleSelect.value,
        format: podcastFormatSelect.value,
        detailLevel: parseInt(podcastDetailLevelInput.value),
        narrator: getPodcastNarrators().host,
        narrators: getPodcastNarrators().narrators,
        generatedText: currentEditingPodcast.generatedText, // Assumes generation updates currentEditingPodcast
        audioResult: currentEditingPodcast.audioResult,
        references: currentEditingPodcast.references || []
    };
    
    try {
        updatePodcastBtnModal.disabled = true;
        updatePodcastBtnModal.textContent = getLocalizedText('updating') || 'Updating...';
        await room.collection('podcast_areas_v2').update(podcastId, updatedData);
        
        // Update currentEditingPodcast with the new data
        currentEditingPodcast = { ...currentEditingPodcast, ...updatedData };

        alert(getLocalizedText('success_updated'));
        displaySavedPodcastsInModal(); // Refresh list in case topic changed
        updateURLWithCurrentModalSettings();

    } catch (error) {
        console.error("Failed to update podcast:", error);
        alert(getLocalizedText('error_update_failed') + error.message);
    } finally {
        updatePodcastBtnModal.disabled = false;
        updatePodcastBtnModal.textContent = getLocalizedText('update_podcast_area');
    }
}

async function handleDeletePodcastFromModal() {
    const podcastId = deletePodcastBtnModal.dataset.podcastId;
    if (!podcastId) {
        alert(getLocalizedText('error_delete_no_id'));
        return;
    }
    if (!confirm(getLocalizedText('confirm_delete'))) {
        return;
    }

    try {
        deletePodcastBtnModal.disabled = true;
        deletePodcastBtnModal.textContent = getLocalizedText('deleting') || 'Deleting...';
        await room.collection('podcast_areas_v2').delete(podcastId);
        alert(getLocalizedText('success_deleted'));
        
        // Reset UI
        clearExistingMapMarkerAndCircle(); // Remove from map
        
        // Reset currentEditingPodcast to a clean state or load another if desired
        currentEditingPodcast = { id: null, latitude: null, longitude: null, radius: 1, radiusUnit: 'km', topic: '', templates: [], style: 'informative', format: 'summary', detailLevel: 5, narrator: getAILanguageSettings(userLanguage).voice, generatedText: '', audioResult: null, references: [] };
        openPodcastModalForEditing(currentEditingPodcast, false); // Effectively resets the form to "new"
        
        displaySavedPodcastsInModal(); // Refresh list
        history.pushState({}, '', window.location.pathname); // Clear URL params

    } catch (error) {
        console.error("Failed to delete podcast:", error);
        alert(getLocalizedText('error_delete_failed') + error.message);
    } finally {
        deletePodcastBtnModal.disabled = false;
        deletePodcastBtnModal.textContent = getLocalizedText('delete_podcast_area');
    }
}

async function displaySavedPodcastsInModal() {
    try {
        // To filter to only the current user's podcasts, fetch user info:
        let currentUser = null;
        try {
            currentUser = await window.websim.getCurrentUser();
        } catch (err) {
            // Not blocking; allow showing all if user fetch fails (e.g. not logged in)
        }

        const podcasts = await room.collection('podcast_areas_v2').getList(); // Returns newest first
        let filtered = podcasts;
        if (currentUser && currentUser.username) {
            filtered = podcasts.filter(p => p.username === currentUser.username);
        }

        savedPodcastListUl.innerHTML = ''; // Clear existing
        if (filtered.length === 0) {
            noSavedPodcastsMsg.style.display = 'block';
            return;
        }
        noSavedPodcastsMsg.style.display = 'none';

        filtered.reverse().forEach(podcast => { // Show oldest first
            const li = document.createElement('li');
            li.innerHTML = `<strong>${podcast.topic || 'Untitled Podcast'}</strong>`;
            const loadBtn = document.createElement('button');
            loadBtn.textContent = getLocalizedText('edit');
            loadBtn.onclick = () => loadPodcastToMapAndModal(podcast.id);
            li.appendChild(loadBtn);
            savedPodcastListUl.appendChild(li);
        });
    } catch (error) {
        console.error("Error fetching saved podcasts:", error);
        noSavedPodcastsMsg.textContent = getLocalizedText('error_save_failed');
        noSavedPodcastsMsg.style.display = 'block';
    }
}

async function loadPodcastToMapAndModal(podcastId) {
    try {
        // Fetch the specific podcast - getList might not be efficient if we only need one.
        // Assuming there's no direct 'getById', we filter. If many podcasts, this isn't ideal.
        // For now, we'll re-fetch list and find. A true getById would be better.
        const podcasts = await room.collection('podcast_areas_v2').getList();
        const podcastData = podcasts.find(p => p.id === podcastId);

        if (!podcastData) {
            alert('Could not find the selected podcast. It may have been deleted.');
            return;
        }
        
        clearExistingMapMarkerAndCircle();
        const latlng = [podcastData.latitude, podcastData.longitude];
        currentMapMarker = L.marker(latlng).addTo(map);
        const radiusMeters = podcastData.radius * (podcastData.radiusUnit === 'km' ? 1000 : 1609.34);
        currentMapCircle = L.circle(latlng, {
            color: 'green', fillColor: '#0f0', fillOpacity: 0.2, radius: radiusMeters
        }).addTo(map);
        
        currentMapMarker.bindPopup(`<b>${podcastData.topic || 'Saved Area'}</b><br><button class="open-details-map-btn">Configure Details</button>`);
         currentMapMarker.on('popupopen', (event) => {
            const button = event.popup.getElement().querySelector('.open-details-map-btn');
            if(button) {
                button.addEventListener('click', () => {
                     openPodcastModalForEditing(podcastData, true); // Pass full data, mark as saved
                });
            }
        });

        map.setView(latlng, 13);
        openPodcastModalForEditing(podcastData, true); // Open modal with this loaded podcast
        
        // If modal isn't open, open it
        if (podcastModal.style.display !== 'flex') {
            podcastModal.style.display = 'flex';
        }

    } catch (error) {
        console.error("Error loading podcast:", error);
        alert("Failed to load podcast: " + error.message);
    }
}

// --- URL State Management ---
function updateURLWithCurrentModalSettings() {
    if (!currentEditingPodcast.latitude || !currentEditingPodcast.id) return; // Don't update if nothing meaningful to share

    const params = new URLSearchParams();
    if (currentEditingPodcast.id) {
        params.set('podcastId', currentEditingPodcast.id);
    }
    if (currentEditingPodcast.latitude && currentEditingPodcast.longitude) {
        params.set('lat', currentEditingPodcast.latitude.toFixed(5));
        params.set('lng', currentEditingPodcast.longitude.toFixed(5));
        params.set('radius', podcastRadiusValueInput.value);
        params.set('radiusUnit', podcastRadiusUnitSelect.value);
        params.set('topic', podcastTopicInput.value.trim());
        params.set('templates', templateCheckboxes.filter(cb => cb.checked).map(cb => cb.value).join(','));
        params.set('style', podcastStyleSelect.value);
        params.set('format', podcastFormatSelect.value);
        params.set('narrator', getPodcastNarrators().host);
        params.set('detailLevel', podcastDetailLevelInput.value);
    }
    // Do not include generatedText or audioResult in URL, too long.
    
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    history.pushState({ path: newUrl }, '', newUrl);
}

async function applySettingsFromURL() {
    const params = new URLSearchParams(window.location.search);
    const podcastId = params.get('podcastId');
    if (podcastId) {
        // Wait for DOM and map and saved podcasts to be initialized and loaded before attempting to load
        // Retry until savedPodcastListUl exists and podcasts are loaded (max 3s)
        let attempts = 0;
        while ((!savedPodcastListUl || typeof room.collection !== "function") && attempts < 40) {
            await new Promise(res => setTimeout(res, 75));
            attempts++;
        }
        // Also, since the getList can be slow to load (if network slow), give it up to 3s to show up
        let podcasts = [];
        let podcastData = null;
        for (let i = 0; i < 30; i++) {
            podcasts = await room.collection('podcast_areas_v2').getList();
            podcastData = podcasts.find(p => p.id === podcastId);
            if (podcastData) break;
            await new Promise(res => setTimeout(res, 100));
        }
        if (podcastData) {
            await loadPodcastToMapAndModal(podcastId);
        }
        // If not found, no further action
    } else if (params.has('lat') && params.has('lng')) {
        const lat = parseFloat(params.get('lat'));
        const lng = parseFloat(params.get('lng'));
        if (!isNaN(lat) && !isNaN(lng)) {
            const urlPodcastData = {
                id: null,
                latitude: lat,
                longitude: lng,
                radius: parseFloat(params.get('radius') || 1),
                radiusUnit: params.get('radiusUnit') || 'km',
                topic: params.get('topic') || '',
                templates: (params.get('templates') || '').split(',').filter(t => t),
                style: params.get('style') || 'informative',
                format: params.get('format') || 'summary',
                narrator: params.get('narrator') || getAILanguageSettings(userLanguage).voice,
                detailLevel: parseInt(params.get('detailLevel') || 5),
                generatedText: '',
                audioResult: null,
                references: []
            };
            // Place marker and open modal
            clearExistingMapMarkerAndCircle();
            currentMapMarker = L.marker([lat, lng]).addTo(map);
            const radiusMeters = urlPodcastData.radius * (urlPodcastData.radiusUnit === 'km' ? 1000 : 1609.34);
            currentMapCircle = L.circle([lat, lng], {
                color: 'blue', fillColor: '#30f', fillOpacity: 0.2, radius: radiusMeters
            }).addTo(map);
            currentMapMarker.bindPopup(`<b>Area from URL</b><br><button class="open-details-map-btn">Configure Details</button>`);
            currentMapMarker.on('popupopen', (event) => {
                const button = event.popup.getElement().querySelector('.open-details-map-btn');
                if(button) {
                    button.addEventListener('click', () => {
                        openPodcastModalForEditing(urlPodcastData, false);
                    });
                }
            });

            map.setView([lat, lng], 13);
            openPodcastModalForEditing(urlPodcastData, false);
        }
    }
}

// --- Utility Functions ---
function getUserLocation() {
    return new Promise((resolve, reject) => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
                (error) => {
                    console.warn(`Geolocation error: ${error.message}`);
                    reject(error); // Fallback handled by caller
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        } else {
            reject(new Error("Geolocation not supported."));
        }
    });
}

async function getDetailedLocationInfo(latitude, longitude, radiusKm) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&limit=1`); // Zoom 18 for more detail
        const data = await response.json();
        
        const locationInfo = {
            address: data.display_name || 'Unknown Location',
            suburb: data.address?.suburb || data.address?.village || data.address?.town || data.address?.city_district || 'Local Area',
            city: data.address?.city || data.address?.town || 'Nearby City',
            county: data.address?.county || 'Local Region',
            country: data.address?.country || 'Current Location',
            postcode: data.address?.postcode || '',
            nearbyInterests: await findNearbyPointsOfInterest(latitude, longitude, radiusKm)
        };
        return locationInfo;
    } catch (error) {
        console.error("Failed to get detailed location info:", error);
        return { suburb: 'Local Area', city: 'Nearby City', county: 'Local Region', country: 'Current Location', nearbyInterests: [], address: 'Unknown Location' };
    }
}

async function findNearbyPointsOfInterest(latitude, longitude, radiusKm) {
    try {
        const radiusMeters = radiusKm * 1000;
        const overpassQuery = `
        [out:json][timeout:25];
        (
          nwr["tourism"](around:${radiusMeters},${latitude},${longitude});
          nwr["amenity"](around:${radiusMeters},${latitude},${longitude});
          nwr["historic"](around:${radiusMeters},${latitude},${longitude});
          nwr["leisure"](around:${radiusMeters},${latitude},${longitude});
          nwr["shop"](around:${radiusMeters},${latitude},${longitude});
          nwr["natural"="peak"](around:${radiusMeters},${latitude},${longitude});
          nwr["natural"="tree"](around:${radiusMeters},${latitude},${longitude});
          nwr["man_made"="lighthouse"](around:${radiusMeters},${latitude},${longitude});
        );
        out body center;
        >;
        out skel qt;
        `;
        const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST', body: `data=${encodeURIComponent(overpassQuery)}`, headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        const data = await response.json();
        const interestTypes = { tourism: [], amenity: [], historic: [], leisure: [], shop: [], natural: [], man_made: [] };
        data.elements.forEach(element => {
            if (element.tags) {
                for (const key in interestTypes) {
                    if (element.tags[key]) {
                        interestTypes[key].push({ name: element.tags.name || `Unnamed ${element.tags[key]}`, type: element.tags[key] });
                        break; // Assign to first matching category
                    }
                }
            }
        });
        return interestTypes;
    } catch (error) {
        console.error("Error finding nearby points of interest:", error); return {};
    }
}

function getAILanguageSettings(languageCode) {
    const languageMap = {
        'en': { voice: 'en-male', language: 'English', systemPrompt: "You are a professional podcast host creating engaging location-based content. Generate ONLY the podcast script content - no introductions, no meta-commentary, no code fragments. Start directly with the substantive content about the location. Focus on historical significance, cultural importance, architectural details, local stories, and interesting facts about places within the specified radius. Structure your content with clear narrative flow and include specific local references, street names, and landmark details when relevant." },
        'es': { voice: 'es-male', language: 'Spanish', systemPrompt: "Eres un presentador de podcast profesional que crea contenido atractivo basado en ubicaciones. Genera SOLO el contenido del guión del podcast: no introducciones, no metacomentarios, no fragmentos de código. Comienza directamente con el contenido sustantivo sobre la ubicación. Céntrate en la importancia histórica, la importancia cultural, los detalles arquitectónicos, las historias locales y los datos interesantes sobre los lugares dentro del radio especificado." },
        'fr': { voice: 'fr-male', language: 'French', systemPrompt: "Vous êtes un animateur de podcast professionnel créant du contenu engageant basé sur des lieux. Générez UNIQUEMENT le contenu du script du podcast - pas d'introductions, pas de méta-commentaires, pas de fragments de code. Commencez directement par le contenu substantiel sur l'emplacement. Concentrez-vous sur l'importance historique, l'importance culturelle, les détails architecturaux, les histoires locales et les faits intéressants sur les lieux dans le rayon spécifié." },
        'de': { voice: 'de-male', language: 'German', systemPrompt: "Sie sind ein professioneller Podcast-Moderator, der ansprechende ortsbasierte Inhalte erstellt. Generieren Sie NUR den Podcast-Skriptinhalt - keine Einführungen, keine Meta-Kommentare, keine Code-Fragmente. Beginnen Sie direkt mit dem substantiellen Inhalt über den Ort. Konzentrieren Sie sich auf historische Bedeutung, kulturelle Wichtigkeit, architektonische Details, lokale Geschichten und interessante Fakten über Orte im angegebenen Radius." },
        'it': { voice: 'it-male', language: 'Italian', systemPrompt: "Sei un conduttore di podcast professionale che crea contenuti coinvolgenti basati sulla posizione. Genera SOLO il contenuto dello script del podcast - nessuna introduzione, nessun meta-commento, nessun frammento di codice. Inizia direttamente con il contenuto sostanziale sulla posizione. Concentrati sull'importanza storica, l'importanza culturale, i dettagli architettonici, le storie locali e i fatti interessanti sui luoghi nel raggio specificato." }
    };

    const baseLanguage = languageCode.split('-')[0].toLowerCase();
    return languageMap[baseLanguage] || languageMap['en'];
}

async function generatePodcastContent(options) {
    const locationInfo = await getDetailedLocationInfo(
        options.latitude, 
        options.longitude, 
        options.radius
    );

    const languageSettings = getAILanguageSettings(userLanguage);
    
    const detailLevelDescriptions = {
        1: 'Very brief overview (2-3 sentences)',
        2: 'Short summary (1 paragraph)',
        3: 'Concise exploration (2-3 paragraphs)',
        4: 'Moderate detail (3-4 paragraphs)',
        5: 'Balanced narrative (4-5 paragraphs with context)',
        6: 'Detailed coverage (5-6 paragraphs with background)',
        7: 'Comprehensive exploration (6-8 paragraphs with history)',
        8: 'In-depth analysis (8-10 paragraphs with cultural context)',
        9: 'Extensive coverage (10-12 paragraphs with multiple perspectives)',
        10: 'Exhaustive deep-dive (12+ paragraphs with complete historical and cultural analysis)'
    };

    const formatStyles = {
        'summary': 'Structured overview with key highlights and main points',
        'script-excerpt': 'Broadcast-ready narrative with smooth transitions and engaging storytelling',
        'interview-style': 'Conversational format with questions and expert insights',
        'storytelling': 'Narrative-driven exploration with anecdotes and human interest stories',
        'documentary': 'Factual, journalistic presentation with verified information and sources',
        'poetic-description': 'Lyrical, evocative portrayal with rich imagery and metaphors'
    };

    const styleInstructions = {
        'informative': 'Present facts clearly and educationally with authoritative tone',
        'conversational': 'Use friendly, accessible language as if talking to a friend',
        'historical': 'Focus on chronological development and historical significance',
        'foodie': 'Emphasize culinary culture, restaurants, and food-related experiences',
        'travelogue': 'Guide-like presentation with practical insights and recommendations',
        'storytelling': 'Weave narratives and human stories into the content',
        'upbeat': 'Energetic, enthusiastic tone that builds excitement',
        'relaxed': 'Calm, contemplative approach that invites reflection'
    };

    const nearbyContext = Object.entries(locationInfo.nearbyInterests)
        .map(([category, interests]) => {
            if (interests.length > 0) {
                return `${category.toUpperCase()}: ${interests.map(i => i.name).join(', ')}`;
            }
            return null;
        })
        .filter(Boolean)
        .join('\n');

    let dialogueInstruction = "";
    if (options.narrator === 'conversation-mf') {
        dialogueInstruction = "\n\nIMPORTANT: Format as a natural conversation between MALE and FEMALE hosts. Use 'MALE:' and 'FEMALE:' prefixes for each speaking turn. Create engaging dialogue with questions, responses, and shared insights about the location.";
    }

    const comprehensivePrompt = `
Create a ${detailLevelDescriptions[options.detailLevel]} podcast segment about the area within ${options.radius} ${options.radiusUnit} of ${locationInfo.suburb}, ${locationInfo.city}.

CONTENT REQUIREMENTS:
- Topic Focus: ${options.topic}
- Narrative Style: ${styleInstructions[options.style]}
- Format: ${formatStyles[options.format]}
- Language: ${languageSettings.language}

LOCATION CONTEXT:
- Central Area: ${locationInfo.suburb}, ${locationInfo.city}
- Address Context: ${locationInfo.address}
- Points of Interest in Radius:
${nearbyContext || 'No specific landmarks identified - focus on neighborhood character and general area features'}

STRICT GUIDELINES:
1. Generate ONLY podcast content - no introductions, no meta-commentary, no code fragments
2. Start immediately with substantive content about the location
3. Include specific local references, street names, and landmarks when possible
4. Mention historical context, architectural features, and cultural significance
5. Stay strictly within the ${options.radius} ${options.radiusUnit} radius
6. Include interesting facts, local stories, and community aspects
7. Reference specific businesses, institutions, or landmarks mentioned in the points of interest
8. Provide context about how this area fits into the broader city/region${dialogueInstruction}

Generate comprehensive, engaging content that truly captures the essence of this specific location.`;

    try {
        const completion = await websim.chat.completions.create({
            messages: [
                { role: "system", content: languageSettings.systemPrompt },
                { role: "user", content: comprehensivePrompt }
            ],
            temperature: 0.7,
            max_tokens: Math.min(1500, 200 + (options.detailLevel * 150))
        });

        const references = await generateReferences(locationInfo, options);
        currentEditingPodcast.references = references;

        return completion.content.trim();
    } catch (error) {
        console.error("Enhanced podcast generation error:", error);
        throw new Error(`Failed to generate podcast content: ${error.message}`);
    }
}

async function generateReferences(locationInfo, options) {
    const references = [];
    
    references.push({
        source: "OpenStreetMap",
        type: "Geographic Data",
        link: `https://www.openstreetmap.org/#map=16/${options.latitude}/${options.longitude}`
    });
    
    const cityName = locationInfo.city.replace(/\s+/g, '_');
    references.push({
        source: `Wikipedia - ${locationInfo.city}`,
        type: "Encyclopedia",
        link: `https://en.wikipedia.org/wiki/${cityName}`
    });
    
    references.push({
        source: `${locationInfo.city} Tourism Information`,
        type: "Tourism",
        link: `https://www.google.com/search?q=${encodeURIComponent(locationInfo.city + ' tourism official site')}`
    });
    
    if (locationInfo.nearbyInterests.historic && locationInfo.nearbyInterests.historic.length > 0) {
        references.push({
            source: "Historical Landmarks Database",
            type: "Historical",
            link: `https://www.google.com/search?q=${encodeURIComponent(locationInfo.city + ' historical landmarks')}`
        });
    }
    
    return references;
}

function displayReferences(references) {
    const tbody = referencesTable.querySelector('tbody');
    tbody.innerHTML = '';
    
    if (references && references.length > 0) {
        references.forEach(ref => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${ref.source}</td>
                <td>${ref.type}</td>
                <td><a href="${ref.link}" target="_blank">Open</a></td>
            `;
        });
        referencesTableContainer.style.display = 'block';
        noReferencesMsg.style.display = 'none';
    } else {
        referencesTableContainer.style.display = 'none';
        noReferencesMsg.style.display = 'block';
    }
}

// --- Editable Content ---
function displayEditablePodcastContent(text) {
    const editableContainer = document.getElementById('editable-podcast-content');
    editableContainer.innerHTML = '';
    
    // Add mode toggle button
    const modeToggleDiv = document.createElement('div');
    modeToggleDiv.style.marginBottom = '15px';
    modeToggleDiv.innerHTML = `
        <button id="edit-mode-toggle" onclick="toggleEditMode()" style="background: linear-gradient(145deg, #6c757d, #5a6268); color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600;">
            ${getLocalizedText('enable_edit_mode') || 'Enable Edit Mode'}
        </button>
    `;
    editableContainer.appendChild(modeToggleDiv);
    
    // Combined view (default)
    const combinedView = document.createElement('div');
    combinedView.id = 'combined-view';
    combinedView.className = 'combined-content-view';
    combinedView.innerHTML = `<div style="background: white; padding: 20px; border-radius: 8px; line-height: 1.6; white-space: pre-wrap;">${text}</div>`;
    editableContainer.appendChild(combinedView);
    
    // Individual paragraphs view (hidden by default)
    const paragraphsView = document.createElement('div');
    paragraphsView.id = 'paragraphs-view';
    paragraphsView.style.display = 'none';
    
    const paragraphs = text.split('\n\n').filter(p => p.trim() !== '');
    
    paragraphs.forEach((paragraph, index) => {
        const paragraphDiv = document.createElement('div');
        paragraphDiv.className = 'editable-paragraph';
        paragraphDiv.innerHTML = `
            <div class="paragraph-content" data-index="${index}">
                <div class="paragraph-text">${paragraph}</div>
                <div class="paragraph-tools">
                    <button class="edit-btn" onclick="editParagraph(${index})">${getLocalizedText('edit')}</button>
                    <button class="regen-shorter-btn" onclick="regenerateParagraph(${index}, 'shorter')">${getLocalizedText('shorter')}</button>
                    <button class="regen-longer-btn" onclick="regenerateParagraph(${index}, 'longer')">${getLocalizedText('longer')}</button>
                    <button class="ai-tool-btn" onclick="aiToolParagraph(${index})">${getLocalizedText('ai_tool')}</button>
                </div>
            </div>
        `;
        paragraphsView.appendChild(paragraphDiv);
    });
    
    editableContainer.appendChild(paragraphsView);
}

function toggleEditMode() {
    const combinedView = document.getElementById('combined-view');
    const paragraphsView = document.getElementById('paragraphs-view');
    const toggleBtn = document.getElementById('edit-mode-toggle');
    
    if (combinedView.style.display === 'none') {
        // Switch to combined view
        combinedView.style.display = 'block';
        paragraphsView.style.display = 'none';
        toggleBtn.textContent = getLocalizedText('enable_edit_mode') || 'Enable Edit Mode';
        toggleBtn.style.background = 'linear-gradient(145deg, #6c757d, #5a6268)';
    } else {
        // Switch to edit view
        combinedView.style.display = 'none';
        paragraphsView.style.display = 'block';
        toggleBtn.textContent = getLocalizedText('disable_edit_mode') || 'Back to Read Mode';
        toggleBtn.style.background = 'linear-gradient(145deg, #28a745, #20c997)';
        
        // Update the combined view with any edits from paragraph view
        updateCombinedViewFromParagraphs();
    }
}

function updateCombinedViewFromParagraphs() {
    const paragraphs = Array.from(document.querySelectorAll('#paragraphs-view .paragraph-text'))
        .map(p => p.textContent.trim())
        .filter(text => text !== '');
    
    const combinedText = paragraphs.join('\n\n');
    const combinedContentDiv = document.querySelector('#combined-view > div');
    if (combinedContentDiv) {
        combinedContentDiv.textContent = combinedText;
    }
    
    // Update the currentEditingPodcast state
    currentEditingPodcast.generatedText = combinedText;
}

async function editParagraph(index) {
    const paragraphDiv = document.querySelector(`[data-index="${index}"] .paragraph-text`);
    
    // Make the paragraph editable
    paragraphDiv.contentEditable = true;
    paragraphDiv.classList.add('editing');
    paragraphDiv.focus();
    
    // Save on blur or Enter key
    const saveEdit = () => {
        paragraphDiv.contentEditable = false;
        paragraphDiv.classList.remove('editing');
        updateEditedPodcastContent();
        paragraphDiv.removeEventListener('blur', saveEdit);
        paragraphDiv.removeEventListener('keydown', handleEditKeydown);
    };
    
    const handleEditKeydown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            saveEdit();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            paragraphDiv.contentEditable = false;
            paragraphDiv.classList.remove('editing');
            paragraphDiv.removeEventListener('blur', saveEdit);
            paragraphDiv.removeEventListener('keydown', handleEditKeydown);
        }
    };
    
    paragraphDiv.addEventListener('blur', saveEdit);
    paragraphDiv.addEventListener('keydown', handleEditKeydown);
}

async function regenerateParagraph(index, lengthType) {
    const paragraphDiv = document.querySelector(`[data-index="${index}"] .paragraph-text`);
    const currentText = paragraphDiv.textContent;
    
    paragraphDiv.innerHTML = '<em>Regenerating...</em>';
    
    try {
        const languageSettings = getAILanguageSettings(userLanguage);
        const lengthInstruction = lengthType === 'shorter' ? 
            'Make this paragraph significantly shorter and more concise while keeping the key information:' :
            'Expand this paragraph with more detail, context, and interesting information:';
            
        const completion = await websim.chat.completions.create({
            messages: [
                { role: "system", content: languageSettings.systemPrompt },
                { role: "user", content: `${lengthInstruction}\n\n${currentText}` }
            ],
            temperature: 0.7,
            max_tokens: lengthType === 'shorter' ? 150 : 400
        });
        
        paragraphDiv.textContent = completion.content.trim();
        updateEditedPodcastContent();
    } catch (error) {
        paragraphDiv.textContent = currentText;
        alert('Error regenerating paragraph: ' + error.message);
    }
}

async function aiToolParagraph(index) {
    currentAiToolIndex = index;
    const paragraphDiv = document.querySelector(`[data-index="${index}"] .paragraph-text`);
    const currentText = paragraphDiv.textContent;
    
    // Pre-fill the current text context in the modal (optional, for reference)
    document.getElementById('ai-instruction').placeholder = `Current paragraph: "${currentText.substring(0, 100)}${currentText.length > 100 ? '...' : ''}"`;
    document.getElementById('ai-instruction').value = '';
    document.getElementById('ai-tool-modal').style.display = 'flex';
    document.getElementById('ai-instruction').focus();
}

function closeAiToolModal() {
    document.getElementById('ai-tool-modal').style.display = 'none';
    currentAiToolIndex = null;
}

async function applyAiInstruction() {
    if (currentAiToolIndex === null) return;
    
    const instruction = document.getElementById('ai-instruction').value.trim();
    if (!instruction) {
        alert('Please enter an instruction.');
        return;
    }
    
    const paragraphDiv = document.querySelector(`[data-index="${currentAiToolIndex}"] .paragraph-text`);
    const currentText = paragraphDiv.textContent;
    const originalText = currentText;
    
    paragraphDiv.innerHTML = '<em>Processing AI instruction...</em>';
    closeAiToolModal();
    
    try {
        const languageSettings = getAILanguageSettings(userLanguage);
        const completion = await websim.chat.completions.create({
            messages: [
                { role: "system", content: languageSettings.systemPrompt },
                { role: "user", content: `Apply this instruction to the paragraph: "${instruction}"\n\nOriginal paragraph:\n${currentText}` }
            ],
            temperature: 0.7,
            max_tokens: 300
        });
        
        paragraphDiv.textContent = completion.content.trim();
        updateEditedPodcastContent();
    } catch (error) {
        paragraphDiv.textContent = originalText;
        alert('Error applying AI instruction: ' + error.message);
    }
}

function updateEditedPodcastContent() {
    const paragraphs = Array.from(document.querySelectorAll('#paragraphs-view .paragraph-text'))
        .map(p => p.textContent.trim())
        .filter(text => text !== '');
    
    currentEditingPodcast.generatedText = paragraphs.join('\n\n');
    
    // Also update combined view if it exists
    updateCombinedViewFromParagraphs();
}

// --- Read Aloud (Using selected speakers/hosts and skipping directing instructions) ---
async function handleReadAloud() {
    const readAloudBtn = document.getElementById('read-aloud-btn');

    // If already playing, stop playback
    if (readAloudPlayer.isPlaying) {
        readAloudPlayer.isPlaying = false;
        if (readAloudPlayer.currentAudio instanceof Audio) {
            readAloudPlayer.currentAudio.pause();
            readAloudPlayer.currentAudio = null;
        }
        readAloudBtn.textContent = getLocalizedText('read_aloud') || 'Read Aloud';
        return;
    }

    // Get paragraphs, skipping/director's comments, but DO generate audio for eligible paragraphs
    const paragraphElements = document.querySelectorAll('.paragraph-text');
    let paragraphs = Array.from(paragraphElements)
        .map(p => p.textContent.trim())
        .filter(text => !!text && !isDirectiveLine(text));
    if (paragraphs.length === 0) {
        alert('No content to read aloud');
        return;
    }
    readAloudPlayer.isPlaying = true;
    readAloudBtn.textContent = getLocalizedText('stop_reading') || 'Stop Reading';

    try {
        // Generate TTS audio files using Websim ElevenLabs API for each paragraph
        const selectedNarratorIds = getSelectedNarratorIds();
        let mainVoice = selectedNarratorIds[0] || getAILanguageSettings(userLanguage).voice;
        let voices = selectedNarratorIds.length > 0 ? selectedNarratorIds : [getAILanguageSettings(userLanguage).voice];

        // Generate TTS mp3 for each paragraph and play sequentially
        let playOrder = [];
        for (let i = 0; i < paragraphs.length; ++i) {
            let narratorId = voices[i % voices.length];
            let ttsResult = await websim.textToSpeech({
                text: paragraphs[i],
                voice: narratorId,
                outputFormat: 'mp3'
            });
            playOrder.push(ttsResult.url);
        }

        await playReadAloudTTSChunks(playOrder, readAloudBtn);

    } catch (err) {
        readAloudPlayer.isPlaying = false;
        readAloudBtn.textContent = getLocalizedText('read_aloud') || 'Read Aloud';
        alert('Error generating audio for read aloud: ' + err.message);
    }
}

async function playReadAloudTTSChunks(urls, readAloudBtn) {
    let idx = 0;
    const playNext = async () => {
        if (!readAloudPlayer.isPlaying || idx >= urls.length) {
            readAloudPlayer.isPlaying = false;
            readAloudBtn.textContent = getLocalizedText('read_aloud') || 'Read Aloud';
            return;
        }
        const url = urls[idx];
        let audio = new Audio(url);
        readAloudPlayer.currentAudio = audio;
        audio.onended = () => {
            idx++;
            playNext();
        };
        audio.onerror = () => {
            idx++;
            playNext();
        };
        try {
            await audio.play();
        } catch (err) {
            idx++;
            playNext();
        }
    };
    playNext();
}

// Check if a paragraph or line is a director's/sound effect instruction
function isDirectiveLine(line) {
    // Director's comments often in [] or with parenthesis, or contain words like "JINGLE", "APPLAUSE", etc.
    const trimmed = line.trim();
    // Example patterns: [APPLAUSE], [TRANSITION MUSIC], [SFX: ], (music), etc.
    return (
        (/^\[.*\]$/.test(trimmed)) ||
        (/^\(.*\)$/.test(trimmed)) ||
        /^[A-Z\s-]*SFX[:]?/i.test(trimmed) ||
        /\btransition music\b|\bjingle\b|\bapplause\b|\bsfx\b|\btheme\b|\bbackground\b|\bambient sound\b/i.test(trimmed)
    );
}

// --- Generate Audio Function (handles TTS and SFX for all paragraphs) ---
async function handleGenerateAudioFromEditedContent({ silent = false } = {}) {
    updateEditedPodcastContent(); // Get latest user edit of paragraphs

    // Get selected narrator/voice(s)
    let podcastNarratorsSelect = document.getElementById('podcast-narrators');
    let selectedNarratorIds = [];
    if (podcastNarratorsSelect) {
        selectedNarratorIds = Array.from(podcastNarratorsSelect.selectedOptions).map(opt => opt.value);
    }
    if (!selectedNarratorIds.length) {
        // pick primary default based on language
        const langVoice = getAILanguageSettings(userLanguage).voice;
        selectedNarratorIds = [langVoice];
    }

    // Get latest paragraphs (split on double newline)
    const text = currentEditingPodcast.generatedText || '';
    let paragraphs = text.split('\n\n').map(p=>p.trim()).filter(Boolean);

    // SFX mapping: recognize some lines in brackets or known director instructions
    const sfxMap = {
        'jingle': 'happy podcast jingle, friendly, 3 seconds',
        'applause': 'applause short, podcast audience',
        'transition': 'short transition stinger for podcasts',
        'ambient sound': 'natural ambiance city park or crowds, short',
        'music': 'pleasant light background music, short'
    };

    let mainContentUrls = [];
    let paragraphPlaybackMap = [];
    let paragraphSoundUrls = [];

    for (let i = 0; i < paragraphs.length; ++i) {
        let line = paragraphs[i];
        if (isDirectiveLine(line)) {
            // SFX replacement
            let sfxPrompt = (line.match(/\b(jingle|applause|transition|music|ambient)\b/i) || [])[1];
            let prompt = sfxMap[sfxPrompt && sfxPrompt.toLowerCase()] || 'short transition stinger for podcasts';
            try {
                let res = await websim.textToSpeech({
                    text: '',
                    voice: selectedNarratorIds[0], // Required, not used for SFX
                    outputFormat: 'mp3',
                    soundEffect: prompt
                });
                mainContentUrls.push(res.url);
                paragraphPlaybackMap.push('sfx');
                paragraphSoundUrls.push({ soundUrl: res.url, prompt });
                continue;
            } catch (e) {
                mainContentUrls.push(null);
                paragraphPlaybackMap.push('sfx');
                paragraphSoundUrls.push({ soundUrl: null, prompt });
                continue;
            }
        } else {
            // TTS: alternate voices if multiple selected
            let narratorId = selectedNarratorIds[i % selectedNarratorIds.length];
            try {
                let ttsResult = await websim.textToSpeech({
                    text: line,
                    voice: narratorId,
                    outputFormat: 'mp3'
                });
                mainContentUrls.push(ttsResult.url);
                paragraphPlaybackMap.push('tts');
                paragraphSoundUrls.push({ soundUrl: null, prompt: null });
            } catch (err) {
                // Mark missing audio
                mainContentUrls.push(null);
                paragraphPlaybackMap.push('tts');
                paragraphSoundUrls.push({ soundUrl: null, prompt: null });
                if (!silent) {
                    audioStatus.textContent = "Error generating audio for a paragraph.";
                }
            }
        }
    }

    // Generate intro, transition, and outro sound assets up front
    let introRes = null, transitionRes = null, closingRes = null;
    try {
        introRes = await websim.textToSpeech({
            text: '',
            voice: selectedNarratorIds[0],
            outputFormat: 'mp3',
            soundEffect: 'happy podcast intro music, 3 seconds'
        });
    } catch (err) {
        introRes = { url: null };
        if (!silent) audioStatus.textContent = "Intro sound failed to generate.";
    }
    try {
        transitionRes = await websim.textToSpeech({
            text: '',
            voice: selectedNarratorIds[0],
            outputFormat: 'mp3',
            soundEffect: 'short transition stinger for podcasts'
        });
    } catch (err) {
        transitionRes = { url: null };
        if (!silent) audioStatus.textContent = "Transition sound failed to generate.";
    }
    try {
        closingRes = await websim.textToSpeech({
            text: '',
            voice: selectedNarratorIds[0],
            outputFormat: 'mp3',
            soundEffect: 'gentle podcast outro music, 4 seconds'
        });
    } catch (err) {
        closingRes = { url: null };
        if (!silent) audioStatus.textContent = "Outro sound failed to generate.";
    }

    // Save generated audio urls even if some are missing!
    currentEditingPodcast.audioResult = {
        introUrl: introRes && introRes.url,
        mainContentUrls,
        transitionUrl: transitionRes && transitionRes.url,
        closingUrl: closingRes && closingRes.url,
        paragraphPlaybackMap,
        paragraphSoundUrls
    };

    // UI updates if not silent
    if (!silent) {
        let failedSegs = mainContentUrls.reduce((n, url)=>n+(!url?1:0),0);
        if (failedSegs>0) {
            audioStatus.textContent = `Some audio segments failed to generate (${failedSegs}/${mainContentUrls.length})`;
        } else {
            audioStatus.textContent = 'Audio generated for all segments.';
        }
        let playPodcastModalBtn = document.getElementById('play-podcast-modal-btn');
        if (playPodcastModalBtn && mainContentUrls.some(Boolean)) playPodcastModalBtn.style.display = 'block';
        let podcastGenerationStatus = document.getElementById('podcast-generation-status');
        if (podcastGenerationStatus) podcastGenerationStatus.textContent = 'Audio generated. Ready for playback.';
        let downloadBtn = document.getElementById('download-podcast-btn');
        if (downloadBtn && mainContentUrls.some(Boolean)) downloadBtn.style.display = 'block';
        let generateAudioBtn = document.getElementById('generate-audio-btn');
        if (generateAudioBtn) {
            const restoreText = generateAudioBtn.querySelector('span') ? generateAudioBtn.querySelector('span').textContent : generateAudioBtn.textContent;
            generateAudioBtn.disabled = false;
            if (generateAudioBtn.querySelector('span')) generateAudioBtn.querySelector('span').textContent = restoreText || 'Generate Audio';
        }
    }
    updateAudiofilesList();
}

// --- Audio files download panel: gracefully handle missing urls
function updateAudiofilesList() {
    const audiofilesListSection = document.getElementById('audiofiles-list-section');
    const audiofilesList = document.getElementById('audiofiles-list');
    // Guard
    if (!audiofilesListSection || !audiofilesList) return;
    const audioResult = currentEditingPodcast.audioResult;

    // Clear first
    audiofilesList.innerHTML = '';

    if (!audioResult || !(audioResult.mainContentUrls && audioResult.mainContentUrls.length)) {
        audiofilesListSection.style.display = 'none';
        return;
    }

    // Collate audio URLs in order: intro, transition, segment1..N, closing
    const audioFilesNamed = [];
    let idx = 1;
    if (audioResult.introUrl) audioFilesNamed.push({ name: "Intro", url: audioResult.introUrl });
    if (audioResult.transitionUrl) audioFilesNamed.push({ name: "Transition", url: audioResult.transitionUrl });
    if (Array.isArray(audioResult.mainContentUrls)) {
        audioResult.mainContentUrls.forEach((url, i) => {
            audioFilesNamed.push({ name: `Segment ${i+1}`, url });
        });
    } else if (audioResult.mainContentUrl) {
        audioFilesNamed.push({ name: "Main Content", url: audioResult.mainContentUrl });
    }
    if (audioResult.closingUrl) audioFilesNamed.push({ name: "Outro", url: audioResult.closingUrl });

    // Hide if nothing valid to show
    if (!audioFilesNamed.some(seg => !!seg.url)) {
        audiofilesListSection.style.display = 'none';
        return;
    }

    audiofilesListSection.style.display = 'block';
    audioFilesNamed.forEach(({ name, url }, i) => {
        if (!url) {
            const li = document.createElement('li');
            li.innerHTML = `<span style="color:#f00;">${name} (Audio segment failed)</span>`;
            audiofilesList.appendChild(li);
            return;
        }
        const li = document.createElement('li');
        const shortName = name.replace(/ /g,"_").toLowerCase();
        const a = document.createElement('a');
        a.href = url;
        a.download = `${shortName}.mp3`;
        a.textContent = `Download ${name} (mp3)`;
        a.style.display = 'inline-block';
        a.style.marginRight = '14px';
        a.target = "_blank";
        // Play inline button
        const playBtn = document.createElement('button');
        playBtn.innerHTML = `<i class="fas fa-play"></i>`;
        playBtn.title = `Play ${name}`;
        playBtn.style.marginLeft = '4px';
        playBtn.onclick = (e) => {
            e.preventDefault();
            // Use the same logic as playReadAloudTTSChunks but for this segment only
            playSingleAudioSegment(url, playBtn);
        };
        li.appendChild(a);
        li.appendChild(playBtn);
        audiofilesList.appendChild(li);
    });
}

// Play a single audio segment for the audiofiles-list play buttons
function playSingleAudioSegment(url, playBtn) {
    if (!url) return;
    const audio = new Audio(url);
    // Pause any existing playback
    if (window._audiofilesCurrentSegment) {
        window._audiofilesCurrentSegment.pause();
        window._audiofilesCurrentSegment = null;
    }
    playBtn.disabled = true;
    audio.onended = () => {
        playBtn.disabled = false;
        window._audiofilesCurrentSegment = null;
    };
    audio.onerror = () => {
        playBtn.disabled = false;
        window._audiofilesCurrentSegment = null;
        alert('Error playing audio segment.');
    };
    audio.play().then(() => {
        window._audiofilesCurrentSegment = audio;
    }).catch((err) => {
        playBtn.disabled = false;
        window._audiofilesCurrentSegment = null;
        alert('Error playing audio segment: ' + err.message);
    });
}

// Ensure this global so modal button still works:
window.handleGenerateAudioFromEditedContent = handleGenerateAudioFromEditedContent;

// Rewire setupEventListeners to guarantee correct handler use
function setupEventListeners() {
    // Handle case: DOM elements may be null if not present, so always check before .addEventListener
    if (placePodcastBtn) placePodcastBtn.addEventListener('click', togglePodcastPlacementTool);
    if (closeButton) closeButton.addEventListener('click', closeModal);
    if (viewPodcastsBtn) viewPodcastsBtn.addEventListener('click', openViewSavedPodcastsModal);

    // Modal form listeners
    if (podcastRadiusValueInput) podcastRadiusValueInput.addEventListener('input', updateRadiusFromModal);
    if (podcastRadiusUnitSelect) podcastRadiusUnitSelect.addEventListener('change', updateRadiusFromModal);
    if (podcastDetailLevelInput && detailLevelValueSpan) {
        podcastDetailLevelInput.addEventListener('input', () => {
            detailLevelValueSpan.textContent = podcastDetailLevelInput.value;
        });
    }

    if (generatePodcastModalBtn) generatePodcastModalBtn.addEventListener('click', handleGeneratePodcastInModal);
    if (playPodcastModalBtn) playPodcastModalBtn.addEventListener('click', handlePlayPauseAudioModal);
    
    if (savePodcastBtnModal) savePodcastBtnModal.addEventListener('click', handleSavePodcastFromModal);
    if (updatePodcastBtnModal) updatePodcastBtnModal.addEventListener('click', handleUpdatePodcastFromModal);
    if (deletePodcastBtnModal) deletePodcastBtnModal.addEventListener('click', handleDeletePodcastFromModal);

    // Update URL when modal form inputs change (debounced or on blur might be better for performance)
    [
        podcastTopicInput, podcastRadiusValueInput, podcastRadiusUnitSelect,
        podcastStyleSelect, podcastFormatSelect, podcastNarratorsSelect,
        podcastDetailLevelInput
    ].forEach(input => {
        if (input) input.addEventListener('change', () => updateURLWithCurrentModalSettings());
    });
    templateCheckboxes.forEach(cb => {
        cb.addEventListener('change', () => updateURLWithCurrentModalSettings());
    });

    // Prevent modal from closing when clicking inside, but allow for scrollbar clicks
    if (podcastModal) {
        podcastModal.addEventListener('click', (event) => {
            if (event.target === podcastModal) { // Clicked on the backdrop
                closeModal();
            }
        });
    }

    // Add generate audio button listener
    const generateAudioBtn = document.getElementById('generate-audio-btn');
    if (generateAudioBtn) {
        generateAudioBtn.removeEventListener('click', handleGenerateAudioFromEditedContent); // Defensive: remove duplicate first
        generateAudioBtn.addEventListener('click', handleGenerateAudioFromEditedContent);
    }

    // Add read aloud button listener
    const readAloudBtn = document.getElementById('read-aloud-btn');
    if (readAloudBtn) {
        readAloudBtn.removeEventListener('click', handleReadAloud); // Defensive: remove duplicate first
        readAloudBtn.addEventListener('click', handleReadAloud);
    }

    // Add download button listener
    const downloadBtn = document.getElementById('download-podcast-btn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', openDownloadModal);
    }
}

// --- Download ---
function openDownloadModal() {
    document.getElementById('download-modal').style.display = 'flex';
}

function closeDownloadModal() {
    document.getElementById('download-modal').style.display = 'none';
}

async function downloadPodcast(format) {
    try {
        let filename, content, mimeType;
        if (format === 'mp3') {
            // Check if mainContentUrls already exist and are valid
            let audioResult = currentEditingPodcast.audioResult;

            // If not generated, but text and narrators exist, trigger generation here before download
            if (!audioResult || !Array.isArray(audioResult.mainContentUrls) || !audioResult.mainContentUrls.length) {
                // Try to generate now
                await handleGenerateAudioFromEditedContent({ silent: true });
                audioResult = currentEditingPodcast.audioResult;
            }

            if (!audioResult || !audioResult.mainContentUrls || !audioResult.mainContentUrls.length) {
                alert('No audio generated yet. Please generate audio first.');
                return;
            }

            // Collate all segment URLs (intro, transition, main content, closing)
            const urls = [];
            if (audioResult.introUrl) urls.push({ url: audioResult.introUrl, name: '01_intro.mp3' });
            if (audioResult.transitionUrl) urls.push({ url: audioResult.transitionUrl, name: '02_transition.mp3' });

            if (Array.isArray(audioResult.mainContentUrls)) {
                // Map paragraph mp3s
                let idx = 3;
                for (let u of audioResult.mainContentUrls) {
                    urls.push({ url: u, name: `${String(idx).padStart(2, '0')}_segment.mp3` });
                    idx++;
                }
            }
            if (audioResult.closingUrl) urls.push({ url: audioResult.closingUrl, name: `99_closing.mp3` });

            if (!urls.length) {
                alert('No audio segments found.');
                return;
            }

            // Download all and pack into a single zip mp3 for the user
            if (typeof JSZip === "undefined") {
                await loadJsZip();
            }
            const zip = new JSZip();
            let errors = 0;
            for (const { url, name } of urls) {
                if (!url) continue;
                try {
                    const response = await fetch(url);
                    if (!response.ok) { errors++; continue; }
                    zip.file(name, await response.blob());
                } catch (e) {
                    errors++;
                }
            }
            if (errors && errors === urls.length) {
                alert('All audio segments failed to download.');
                return;
            }
            const zippedBlob = await zip.generateAsync({ type: 'blob' });
            filename = `podcast_${Date.now()}.zip`;
            content = zippedBlob;
            mimeType = 'application/zip';

        } else if (format === 'wav') {
            // Not supported: Conversion from MP3 to WAV in-browser is non-trivial and not done here
            alert('Direct WAV download is not supported. Download as MP3 (ZIP).');
            return;
        } else if (format === 'txt') {
            if (!currentEditingPodcast.generatedText) {
                alert('No content generated yet.');
                return;
            }
            filename = `podcast_script_${Date.now()}.txt`;
            content = new Blob([currentEditingPodcast.generatedText], { type: 'text/plain' });
            mimeType = 'text/plain';
        } else if (format === 'json') {
            const podcastData = {
                topic: currentEditingPodcast.topic,
                location: {
                    latitude: currentEditingPodcast.latitude,
                    longitude: currentEditingPodcast.longitude,
                    radius: currentEditingPodcast.radius,
                    radiusUnit: currentEditingPodcast.radiusUnit
                },
                settings: {
                    style: currentEditingPodcast.style,
                    format: currentEditingPodcast.format,
                    narrator: currentEditingPodcast.narrator,
                    narrators: currentEditingPodcast.narrators,
                    detailLevel: currentEditingPodcast.detailLevel,
                },
                content: currentEditingPodcast.generatedText,
                references: currentEditingPodcast.references,
                audioResult: currentEditingPodcast.audioResult,
                generatedAt: new Date().toISOString()
            };
            filename = `podcast_data_${Date.now()}.json`;
            content = new Blob([JSON.stringify(podcastData, null, 2)], { type: 'application/json' });
            mimeType = 'application/json';
        }

        // Provide download link (Blob-based)
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        closeDownloadModal();

    } catch (error) {
        console.error('Download error:', error);
        alert('Error downloading file: ' + error.message);
    }
}

// Helper: Dynamically load JSZip for zipping audio segments
async function loadJsZip() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load JSZip for zipping audio.'));
        document.body.appendChild(script);
    });
}

// Helper: For manual triggering (for backward usage)
window.downloadPodcast = downloadPodcast;

// --- Update Narrator Options ---
function updateFullNarratorOptions(selectedIds = null) {
    if (!podcastNarratorsSelect) return;
    podcastNarratorsSelect.innerHTML = '';

    // Prioritize: Featured (Hank/Hope), language defaults, then A-Z all
    const featuredVoices = ELEVENLABS_VOICES.filter(v=>v.isFeatured);
    let baseLang = (navigator.language || 'en').split('-')[0].toLowerCase();
    let langDefaults = ELEVENLABS_VOICES.filter(v=>v.isDefaultWebsimVoice && v.id.startsWith(baseLang));
    let otherVoices = ELEVENLABS_VOICES.filter(v=>!langDefaults.includes(v)&&!featuredVoices.includes(v)).sort((a,b)=>a.language.localeCompare(b.language)||a.label.localeCompare(b.label));
    let allVoices = [...featuredVoices, ...langDefaults, ...otherVoices];

    allVoices.forEach(voice => {
        let opt = document.createElement('option');
        opt.value = voice.id;
        opt.textContent = `${voice.label} ${voice.language?'('+voice.language+')':''}`;
        podcastNarratorsSelect.appendChild(opt);
    });

    // Try restore saved selection
    if (selectedIds && Array.isArray(selectedIds)) {
        Array.from(podcastNarratorsSelect.options).forEach(opt=>{
            if(selectedIds.includes(opt.value)) opt.selected = true;
        });
    } else {
        // Default: select first featured, then language default
        let defaultIdx = 0;
        if (featuredVoices.length > 0) {
            const firstFeatured = allVoices.findIndex(v => v.isFeatured);
            if (firstFeatured >= 0) defaultIdx = firstFeatured;
        } else if (langDefaults.length > 0) {
            const firstLang = allVoices.findIndex(v => v.isDefaultWebsimVoice && v.id.startsWith(baseLang));
            if (firstLang >= 0) defaultIdx = firstLang;
        }
        podcastNarratorsSelect.selectedIndex = defaultIdx;
    }
}

// On Generate Audio button: Pass multiselect
podcastNarratorsSelect && podcastNarratorsSelect.addEventListener('change', function (e) {
    const selected = Array.from(this.selectedOptions);
    if (selected.length > 3) {
        // Deselect last selected
        selected[selected.length - 1].selected = false;
        podcastNarratorsNote.textContent = 'Max. 3 voices allowed (1 host, 2 guest)';
        setTimeout(() => { podcastNarratorsNote.textContent = 'Select up to 1 host & 2 guest voices. The first is main host, the rest are guests for conversation/dialogue.'; }, 2000);
    }
});

// Internal helper for multi voice pick (host, guest1, guest2)
function getSelectedNarratorIds() {
    return Array.from(podcastNarratorsSelect.selectedOptions).map(opt => opt.value);
}

function getPodcastNarrators() {
    // Returns {host: id, guests: [id, id], narrators: [id, id, id]}
    const selected = getSelectedNarratorIds();
    return {
        host: selected[0] || null,
        guests: selected.slice(1,3),
        narrators: selected // pass all for ease
    };
}

// --- Modal population (sync currentEditingPodcast.narrators) ---
function updatePodcastModalUI(podcastData) {
    setPodcastNarratorsFromPodcastData(podcastData);
}

function setPodcastNarratorsFromPodcastData(podcastData) {
    let narrators = podcastData.narrators;
    if (!narrators) {
        // backward compatibility
        narrators = [];
        if (podcastData.narrator) narrators = [podcastData.narrator];
    }
    updateFullNarratorOptions(narrators);
    // Reselect voices in UI if present
    if (podcastNarratorsSelect && narrators) {
        Array.from(podcastNarratorsSelect.options).forEach(opt => {
            opt.selected = narrators.includes(opt.value);
        });
    }
}

// Patch ShepherdJS Guide to fix possible missing DOM errors on show
// Shepherd.js can throw errors if a DOM element for a step is missing
// We'll monkey-patch Shepherd.Step.prototype._getResolvedAttachTo
if (window.Shepherd && window.Shepherd.Step) {
    const originalGetAttachTo = window.Shepherd.Step.prototype._getResolvedAttachTo;
    window.Shepherd.Step.prototype._getResolvedAttachTo = function(...args) {
        // Defensive: If the element doesn't exist, show a warning and move to a fallback (e.g., document.body)
        try {
            const desc = this.options && this.options.attachTo;
            let element;
            if (
                desc &&
                desc.element &&
                typeof desc.element === 'string'
            ) {
                element = document.querySelector(desc.element);
            } else if (desc && desc.element instanceof Element) {
                element = desc.element;
            }
            if (!element) {
                // Try fallback: body, or skip attachTo entirely to avoid errors
                // Option: Use a generic overlay to display the step if key element is missing
                // Or, just skip the attachTo for this step by returning {} or null
                // Optionally, could call Shepherd.next() or Shepherd.cancel() here
                // But for resilience, we set to body
                console.warn(`[Shepherd patch] Missing attachTo element '${desc && desc.element}', using document.body.`);
                return { element: document.body, on: (desc && desc.on) || 'bottom' };
            }
            // Normal case
            return originalGetAttachTo.call(this, ...args);
        } catch (err) {
            // Hard fail-safe
            console.error('Error in Shepherd Step _getResolvedAttachTo:', err);
            // Don't crash — use body as fallback
            return { element: document.body, on: 'bottom' };
        }
    };
}

// Make functions globally accessible
window.editParagraph = editParagraph;
window.regenerateParagraph = regenerateParagraph;
window.aiToolParagraph = aiToolParagraph;
window.toggleEditMode = toggleEditMode;
window.closeDownloadModal = closeDownloadModal;
window.downloadPodcast = downloadPodcast;
window.closeAiToolModal = closeAiToolModal;
window.applyAiInstruction = applyAiInstruction;

// TTS/ElevenLabs voice registry (demo set, fetch full via API or static list)
const ELEVENLABS_VOICES = [
    // Websim/ElevenLabs defaults (keep these, see above)
    { id: 'en-male', label: 'English Male (Default)', language: 'English', gender: 'Male', isDefaultWebsimVoice: true },
    { id: 'en-female', label: 'English Female (Default)', language: 'English', gender: 'Female', isDefaultWebsimVoice: true },
    { id: 'es-male', label: 'Spanish Male (Default)', language: 'Spanish', gender: 'Male', isDefaultWebsimVoice: true },
    { id: 'es-female', label: 'Spanish Female (Default)', language: 'Spanish', gender: 'Female', isDefaultWebsimVoice: true },
    { id: 'fr-male', label: 'French Male (Default)', language: 'French', gender: 'Male', isDefaultWebsimVoice: true },
    { id: 'fr-female', label: 'French Female (Default)', language: 'French', gender: 'Female', isDefaultWebsimVoice: true },
    { id: 'de-male', label: 'German Male (Default)', language: 'German', gender: 'Male', isDefaultWebsimVoice: true },
    { id: 'de-female', label: 'German Female (Default)', language: 'German', gender: 'Female', isDefaultWebsimVoice: true },
    { id: 'it-male', label: 'Italian Male (Default)', language: 'Italian', gender: 'Male', isDefaultWebsimVoice: true },
    { id: 'it-female', label: 'Italian Female (Default)', language: 'Italian', gender: 'Female', isDefaultWebsimVoice: true },
    // Most requested special voices:
    { id: '6F5Zhi321D3Oq7v1oNT4', label: 'Hank (English, Male)', language: 'English', gender: 'Male', isFeatured: true }, // <-- Hank
    { id: 'zGjIP4SZlMnY9m93k97r', label: 'Hope (English, Female)', language: 'English', gender: 'Female', isFeatured: true }, // <-- Hope
    // More ElevenLabs public voices (sample - adjust as desired, can be expanded as much as needed):
    { id: 'pNInz6obpgDQGcFmaJgB', label: 'Adam (English, Male)', language: 'English', gender: 'Male' },
    { id: 'yoZ06aMxZJJ28mfd3POQ', label: 'Antoni (English, Male)', language: 'English', gender: 'Male' },
    { id: 'TxGEqnHWrfWFTfGW9XjX', label: 'Josh (English, Male)', language: 'English', gender: 'Male' },
    { id: 'MF3mGyEYCl7XYWbV9V6O', label: 'Arnold (English, Male)', language: 'English', gender: 'Male' },
    { id: 'XNl5w3GzXuB2IzVFS4w5', label: 'Bella (English, Female)', language: 'English', gender: 'Female' },
    { id: 'ErXwobaYiN019PkySvjV', label: 'Rachel (English, Female)', language: 'English', gender: 'Female' },
    { id: '21m00Tcm4TlvDq8ikWAM', label: 'Clyde (English, Male)', language: 'English', gender: 'Male' },
    { id: 'AZnzlk1XvdvUeBnXmlld', label: 'Elli (English, Female)', language: 'English', gender: 'Female' },
    { id: 'VR6AewLTigWG4xSOukaG', label: 'Domi (English, Male)', language: 'English', gender: 'Male' },
    { id: 'LcfcDJNUP1GQjkzn1xUU', label: 'Charlie (English, Male)', language: 'English', gender: 'Male' },
    { id: 'EXAVITQu4vr4xnSDxMaL', label: 'Sarah (English, Female)', language: 'English', gender: 'Female' },
    { id: '9WRa3jZnGElUAZ39B5vM', label: 'Glinda (English, Female)', language: 'English', gender: 'Female' },
    { id: 'e10Z39ZbK5uHwHYr47zR', label: 'Matthew (English, Male)', language: 'English', gender: 'Male' },
    { id: 'N2lVS1w4EtoH3f6l9xwj', label: 'Matilda (English, Female)', language: 'English', gender: 'Female' },
    { id: 'KoaCmLoqBJNBH5I8M6zu', label: 'James (English, Male)', language: 'English', gender: 'Male' },
    // Add more as needed; full official ElevenLabs public voices can be fetched via their API.
];
class iPhoneEmulator {
    constructor() {
        this.currentApp = 'home';
        this.messagesConversationHistory = [
            { role: "assistant", content: "Hello! How can I help you today?" }
        ];
        this.callConversationHistory = []; 
        this.activeConversationHistory = this.messagesConversationHistory; 

        this.inCall = false;
        this.currentCallingContact = null;
        this.callMessageSent = false; 

        this.photos = []; 
        this.trashBin = []; 
        this.currentWallpaper = '';
        
        this.safariConversationHistory = []; 
        this._safariIsDarkMode = false; 
        this.safariCurrentSearchResult = null; 
        this.safariTypingTimeout = null;

        this.files = []; 
        this.virusActive = false;
        this.virusAppCount = 0;
        this.virusInterval = null;
        this.phoneCrashed = false; 

        this.isShutDown = false; 
        this.powerButtonHoldTimeout = null;
        this.powerButtonIsHeld = false;

        this.appStoreApps = [
            { id: 'websim-chat', name: 'WebSim Chat', developer: 'WebSim', rating: 5, icon: 'websim-chat-icon.png' },
            { id: 'websim-game', name: 'WebSim Game', developer: 'WebSim Studios', rating: 4.5, icon: 'websim-game-icon.png' },
            { id: 'todo-list', name: 'To-Do List', developer: 'Productivity Inc.', rating: 4, icon: 'todo-list-icon.png' },
            { id: 'photo-editor', name: 'Photo Editor Pro', developer: 'Creative Apps', rating: 4.8, icon: 'photo-editor-icon.png' }
        ];
        this.appStoreSearchHistory = [];
        this.installedApps = []; 

        this.room = null; 
        this.websimChatMessages = []; 
        this.websimChatPresence = {}; 
        this.websimChatJoined = false;

        this.init();
    }

    async init() {
        this.getDomElements();
        this.loadInitialInstalledApps(); 
        this.setupEventListeners();
        this.startStatusBarUpdates();
        this.loadDarkModePreference(); 
        this.renderMessages(); 
        this.loadPhotosState(); 
        this.loadWallpaperPreference(); 
        this.loadSafariPreference(); 
        this.loadFilesState(); 
        this.renderFiles(); 
        this.renderHomeApps(); 

        this.room = new WebsimSocket();
        this.room.onmessage = (event) => this.handleWebsimEvent(event);
        this.room.subscribePresence((currentPresence) => {
            this.websimChatPresence = currentPresence; 
            this.updateWebsimChatMembersCount(); 
        });
    }

    getDomElements() {
        this.homeScreen = document.querySelector('.home-screen');
        this.messagesAppScreen = document.querySelector('.messages-app-screen');
        this.chatMessagesContainer = document.querySelector('.chat-messages'); 
        this.messageInput = document.getElementById('message-input'); 
        this.sendButton = document.getElementById('send-button'); 
        this.messagesBackButton = document.querySelector('.messages-app-screen .back-button');

        this.phoneAppScreen = document.querySelector('.phone-app-screen');
        this.phoneBackButton = document.querySelector('.phone-app-screen .back-button');
        this.contactsList = document.querySelector('.contacts-list');
        this.callScreen = document.querySelector('.call-screen');
        this.callContactNameDisplay = document.querySelector('.call-contact-name');
        this.callStatusDisplay = document.querySelector('.call-status');
        this.callChatMessagesContainer = document.querySelector('.call-chat-messages');
        this.callMessageInput = document.getElementById('call-message-input');
        this.callSendButton = document.getElementById('call-send-button');
        this.hangUpButton = document.querySelector('.hang-up-button');

        this.settingsAppScreen = document.querySelector('.settings-app-screen');
        this.settingsBackButton = document.querySelector('.settings-app-screen .back-button');
        this.darkModeToggle = document.getElementById('darkModeToggle');
        this.screenElement = document.querySelector('.screen'); 

        this.photosAppScreen = document.querySelector('.photos-app-screen');
        this.photosBackButton = document.querySelector('.photos-app-screen .back-button');
        this.photosGrid = document.querySelector('.photos-grid');
        this.trashBinScreen = document.querySelector('.trash-bin-screen');
        this.trashBinGrid = document.querySelector('.trash-bin-grid');
        this.trashEmptyMessage = document.querySelector('.trash-empty-message');
        this.bottomTabs = document.querySelector('.bottom-tabs');
        this.photoContextMenu = document.getElementById('photo-context-menu');
        this.trashContextMenu = document.getElementById('trash-context-menu');
        this.wallpaperElement = document.querySelector('.wallpaper');

        this.weatherAppScreen = document.querySelector('.weather-app-screen');
        this.weatherBackButton = document.querySelector('.weather-app-screen .back-button');

        this.safariAppScreen = document.querySelector('.safari-app-screen');
        this.safariBackButton = document.querySelector('.safari-app-screen .back-button');
        this.safariUrlInput = document.getElementById('safari-url-input');
        this.safariClearInputButton = document.getElementById('safari-clear-input');
        this.safariDefaultPage = document.querySelector('.safari-default-page');
        this.safariSearchResults = document.querySelector('.safari-search-results');
        this.safariBottomBar = document.querySelector('.safari-bottom-bar');
        this.safariBottomBarIcons = document.querySelectorAll('.safari-bottom-bar .bottom-bar-icon');
        this.safariSettingsModal = document.querySelector('.safari-settings-modal');
        this.safariSettingsDoneButton = document.getElementById('safari-settings-done');
        this.safariPrivateBrowsingToggle = document.getElementById('safariPrivateBrowsing');
        this.safariClearHistoryButton = document.getElementById('safari-clear-history');
        this.safariDarkModeToggle = document.getElementById('safariDarkModeToggle');

        this.musicAppScreen = document.querySelector('.music-app-screen');
        this.musicBackButton = document.querySelector('.music-app-screen .back-button');
        this.musicJokeContent = document.querySelector('.music-joke-content');
        this.musicJokeMessage = document.querySelector('.music-joke-content .joke-message');
        this.flyingCatGif = document.querySelector('.music-joke-content .flying-cat-gif');

        this.filesAppScreen = document.querySelector('.files-app-screen');
        this.filesBackButton = document.querySelector('.files-app-screen .back-button');
        this.filesList = document.getElementById('files-list');
        this.noFilesMessage = document.querySelector('.no-files-message');

        this.appstoreAppScreen = document.querySelector('.appstore-app-screen');
        this.appstoreBackButton = document.querySelector('.appstore-app-screen .back-button');
        this.appstoreSearchInput = document.getElementById('appstore-search-input');
        this.appstoreClearInputButton = document.getElementById('appstore-clear-input');
        this.appstoreFeaturedList = document.getElementById('appstore-featured-list');
        this.appstoreSearchResultsContainer = document.querySelector('.appstore-search-results');
        this.appstoreCategories = document.querySelector('.appstore-categories');
        this.appstoreFeaturedAppsSection = document.querySelector('.appstore-featured-apps');

        this.websimChatAppScreen = document.querySelector('.websim-chat-app-screen');
        this.websimChatBackButton = document.querySelector('.websim-chat-app-screen .back-button');
        this.websimChatMessagesContainer = document.querySelector('.websim-chat-messages');
        this.websimChatInput = document.getElementById('websim-chat-input');
        this.websimSendButton = document.getElementById('websim-send-button');
        this.websimChatMembersCount = document.querySelector('.chat-members-count');

        this.appGrid = document.querySelector('.app-grid');

        this.powerMenuOverlay = document.querySelector('.power-menu-overlay');
        this.powerMenuButtons = document.querySelectorAll('.power-menu-button');

        this.factoryResetLoadingScreen = document.querySelector('.factory-reset-loading');
        this.loadingMessage = document.getElementById('loading-message');
    }

    setupEventListeners() {
        this.setupHardwareButtons();

        this.messagesBackButton.addEventListener('click', () => this.goHome());
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { 
                e.preventDefault(); 
                this.sendMessage();
            }
        });

        this.phoneBackButton.addEventListener('click', () => this.goHome());
        document.querySelectorAll('.contact-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const contactName = e.currentTarget.dataset.contactName;
                this.startCall(contactName);
            });
        });
        this.hangUpButton.addEventListener('click', () => this.endCall());
        this.callSendButton.addEventListener('click', () => this.sendCallMessage());
        this.callMessageInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendCallMessage();
            }
        });

        this.settingsBackButton.addEventListener('click', () => this.goHome());
        this.darkModeToggle.addEventListener('change', () => this.toggleDarkMode());

        this.photosBackButton.addEventListener('click', () => this.goHome());
        this.bottomTabs.querySelectorAll('.tab-item').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchPhotoTab(e.currentTarget.dataset.tab));
        });

        document.addEventListener('click', (e) => {
            if (!this.photoContextMenu.contains(e.target)) {
                this.photoContextMenu.style.display = 'none';
            }
            if (!this.trashContextMenu.contains(e.target)) {
                this.trashContextMenu.style.display = 'none';
            }
        });
        this.screenElement.addEventListener('contextmenu', (e) => {
            if (!e.target.closest('.photo-item')) {
                e.preventDefault();
            }
        });

        this.weatherBackButton.addEventListener('click', () => this.goHome());

        this.safariBackButton.addEventListener('click', () => this.goHome());
        this.safariUrlInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                this.searchSafari();
            }
            this.safariClearInputButton.style.display = this.safariUrlInput.value ? 'flex' : 'none';
        });
        this.safariClearInputButton.addEventListener('click', () => {
            this.safariUrlInput.value = '';
            this.safariUrlInput.focus();
            this.safariClearInputButton.style.display = 'none';
            this.showSafariDefaultPage();
        });
        this.safariBottomBarIcons.forEach(icon => {
            icon.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleSafariBottomBarAction(action);
            });
        });
        this.safariSettingsDoneButton.addEventListener('click', () => this.hideSafariSettings());
        this.safariClearHistoryButton.addEventListener('click', () => this.clearSafariHistory());
        this.safariDarkModeToggle.addEventListener('change', () => this.toggleSafariDarkMode());

        this.musicBackButton.addEventListener('click', () => this.goHome());

        this.filesBackButton.addEventListener('click', () => this.goHome());

        this.appstoreBackButton.addEventListener('click', () => this.goHome());
        this.appstoreSearchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                this.searchAppStore(this.appstoreSearchInput.value);
            }
            this.appstoreClearInputButton.style.display = this.appstoreSearchInput.value ? 'flex' : 'none';
        });
        this.appstoreClearInputButton.addEventListener('click', () => {
            this.appstoreSearchInput.value = '';
            this.appstoreSearchInput.focus();
            this.appstoreClearInputButton.style.display = 'none';
            this.showAppStoreHome();
        });
        document.querySelectorAll('.appstore-categories .category-item').forEach(category => {
            category.addEventListener('click', (e) => {
                this.searchAppStore(e.target.textContent + ' apps'); 
            });
        });

        this.websimChatBackButton.addEventListener('click', () => this.goHome());
        this.websimSendButton.addEventListener('click', () => this.sendWebsimChatMessage());
        this.websimChatInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendWebsimChatMessage();
            }
        });

        this.powerMenuOverlay.addEventListener('click', (e) => {
            if (e.target === this.powerMenuOverlay) { 
                this.hidePowerMenu();
            }
        });
        this.powerMenuButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handlePowerMenuAction(action);
            });
        });
    }

    setupHardwareButtons() {
        const powerButton = document.querySelector('.power-button');
        const volumeUp = document.querySelector('.volume-up');
        const volumeDown = document.querySelector('.volume-down');

        powerButton.addEventListener('mousedown', () => {
            if (this.phoneCrashed) return; 
            this.powerButtonIsHeld = false;
            this.powerButtonHoldTimeout = setTimeout(() => {
                this.powerButtonIsHeld = true;
                this.showPowerMenu();
            }, 1000); 
        });

        powerButton.addEventListener('mouseup', () => {
            clearTimeout(this.powerButtonHoldTimeout);
            if (this.phoneCrashed) return;
            if (!this.powerButtonIsHeld && !this.isShutDown) { 
                this.toggleScreen();
            }
            this.powerButtonIsHeld = false; 
        });
        
        powerButton.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        volumeUp.addEventListener('click', () => {
            if (this.phoneCrashed || this.isShutDown) return;
            this.adjustVolume(1);
        });

        volumeDown.addEventListener('click', () => {
            if (this.phoneCrashed || this.isShutDown) return;
            this.adjustVolume(-1);
        });
    }

    openApp(appName) {
        if (this.virusActive || this.phoneCrashed || this.isShutDown) {
            this.showNotification("System unstable or shut down. Cannot open app.");
            return;
        }

        const appIcon = document.querySelector(`.app-icon[data-app="${appName}"]`);
        if (appIcon) { 
            appIcon.style.transform = 'scale(0.8)';

            setTimeout(() => {
                appIcon.style.transform = '';
            }, 150);
        }

        this.homeScreen.style.display = 'none';
        this.messagesAppScreen.style.display = 'none';
        this.phoneAppScreen.style.display = 'none';
        this.settingsAppScreen.style.display = 'none';
        this.photosAppScreen.style.display = 'none';
        this.weatherAppScreen.style.display = 'none';
        this.safariAppScreen.style.display = 'none';
        this.musicAppScreen.style.display = 'none'; 
        this.filesAppScreen.style.display = 'none'; 
        this.appstoreAppScreen.style.display = 'none'; 
        this.websimChatAppScreen.style.display = 'none';

        this.currentApp = appName;

        if (appName === 'messages') {
            this.activeConversationHistory = this.messagesConversationHistory;
            this.messagesAppScreen.style.display = 'flex';
            this.renderMessages();
            this.messageInput.focus();
        } else if (appName === 'phone') {
            this.inCall = false;
            this.currentCallingContact = null;
            this.callConversationHistory = []; 
            this.activeConversationHistory = this.callConversationHistory; 
            
            this.phoneAppScreen.style.display = 'flex';
            this.contactsList.style.display = 'block'; 
            this.callScreen.style.display = 'none'; 
        } else if (appName === 'settings') {
            this.settingsAppScreen.style.display = 'flex';
            this.activeConversationHistory = this.messagesConversationHistory; 
        } else if (appName === 'photos') {
            this.photosAppScreen.style.display = 'flex';
            this.activeConversationHistory = this.messagesConversationHistory; 
            this.switchPhotoTab('photos'); 
        } else if (appName === 'weather') {
            this.weatherAppScreen.style.display = 'flex';
            this.activeConversationHistory = this.messagesConversationHistory; 
        } else if (appName === 'safari') { 
            this.safariAppScreen.style.display = 'flex';
            this.activeConversationHistory = this.safariConversationHistory; 
            this.safariUrlInput.focus();
            this.loadSafariContent(); 
            this.loadSafariPreference(); 
        } else if (appName === 'music') { 
            this.musicAppScreen.style.display = 'flex';
            this.activeConversationHistory = this.messagesConversationHistory; 
            this.showMusicJoke(); 
        } else if (appName === 'files') {
            this.filesAppScreen.style.display = 'flex';
            this.activeConversationHistory = this.messagesConversationHistory; 
            this.renderFiles();
        } else if (appName === 'appstore') {
            this.appstoreAppScreen.style.display = 'flex';
            this.activeConversationHistory = this.appStoreSearchHistory; 
            this.showAppStoreHome();
        } else if (appName === 'websim-chat') { 
            this.websimChatAppScreen.style.display = 'flex';
            this.startWebsimChat();
        } else {
            const installedApp = this.installedApps.find(app => app.id === appName);
            if (installedApp && installedApp.type === 'user-installed') {
                this.homeScreen.style.display = 'block'; 
                this.showNotification(`${installedApp.name} app opened (Generic)`);
            } else {
                this.homeScreen.style.display = 'block'; 
                this.showNotification(`Could not open ${appName} app.`);
            }
        }
    }

    goHome() {
        if (this.phoneCrashed || this.isShutDown) return;

        if (this.currentApp === 'messages') {
            this.messagesConversationHistory = this.activeConversationHistory;
            this.messageInput.value = ''; 
        } else if (this.currentApp === 'phone') {
            if (this.inCall) {
                this.endCall();
            }
            this.callConversationHistory = [];
            this.callMessageInput.value = '';
        } else if (this.currentApp === 'settings') {
        } else if (this.currentApp === 'photos') {
        } else if (this.currentApp === 'weather') {
        } else if (this.currentApp === 'safari') { 
            this.hideSafariSettings();
            this.safariCurrentSearchResult = null;
            this.safariUrlInput.value = ''; 
            this.safariClearInputButton.style.display = 'none';
        } else if (this.currentApp === 'music') {
            this.musicAppScreen.classList.remove('joke-background-active');
        } else if (this.currentApp === 'files') {
        } else if (this.currentApp === 'appstore') {
            this.appstoreSearchInput.value = '';
            this.appstoreClearInputButton.style.display = 'none';
        } else if (this.currentApp === 'websim-chat') { 
            this.websimChatInput.value = ''; 
        }

        this.messagesAppScreen.style.display = 'none';
        this.phoneAppScreen.style.display = 'none';
        this.settingsAppScreen.style.display = 'none';
        this.photosAppScreen.style.display = 'none';
        this.weatherAppScreen.style.display = 'none';
        this.safariAppScreen.style.display = 'none';
        this.musicAppScreen.style.display = 'none'; 
        this.filesAppScreen.style.display = 'none'; 
        this.appstoreAppScreen.style.display = 'none'; 
        this.websimChatAppScreen.style.display = 'none';

        this.homeScreen.style.display = 'block';
        this.currentApp = 'home';
        this.activeConversationHistory = this.messagesConversationHistory; 
    }

    async sendMessage() {
        const messageText = this.messageInput.value.trim();
        if (!messageText) return;
        if (this.phoneCrashed || this.isShutDown) return;

        this.activeConversationHistory.push({ role: "user", content: messageText });
        this.renderMessages();
        this.messageInput.value = ''; 
        this.messageInput.style.height = 'auto'; 

        this.showTypingIndicator(this.chatMessagesContainer);

        try {
            const historyForAI = this.activeConversationHistory.slice(-10);
            const completion = await websim.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: "You are a friendly iPhone assistant named Siri. Respond concisely and helpfully.",
                    },
                    ...historyForAI,
                ],
            });

            this.removeTypingIndicator(this.chatMessagesContainer);

            const aiResponse = completion.content;
            this.activeConversationHistory.push({ role: "assistant", content: aiResponse });
            this.renderMessages();
        } catch (error) {
            console.error("Error communicating with AI:", error);
            this.removeTypingIndicator(this.chatMessagesContainer);
            this.activeConversationHistory.push({ role: "assistant", content: "Sorry, I'm having trouble connecting right now." });
            this.renderMessages();
        }
    }

    renderMessages() {
        const container = this.currentApp === 'messages' ? this.chatMessagesContainer : this.callChatMessagesContainer;
        if (!container) return; 

        container.innerHTML = ''; 

        this.activeConversationHistory.forEach(message => {
            const messageBubble = document.createElement('div');
            messageBubble.classList.add('message-bubble');
            messageBubble.classList.add(message.role === 'user' ? 'user-message' : 'ai-message');
            messageBubble.textContent = message.content;
            container.appendChild(messageBubble);
        });

        container.scrollTop = container.scrollHeight;
    }

    async startCall(contactName) {
        if (this.phoneCrashed || this.isShutDown) return;
        this.inCall = true;
        this.currentCallingContact = contactName;
        this.callMessageSent = false; 

        this.contactsList.style.display = 'none';
        this.callScreen.style.display = 'flex'; 

        this.callContactNameDisplay.textContent = contactName;
        this.callStatusDisplay.textContent = 'Calling...';

        this.callConversationHistory = [{ role: "assistant", content: `Hello, this is ${contactName}. How can I help you?` }];
        this.activeConversationHistory = this.callConversationHistory; 
        this.renderMessages(); 

        this.callMessageInput.focus();

        setTimeout(() => {
            this.callStatusDisplay.textContent = 'On Call';
            this.showNotification(`Calling ${contactName}...`);
        }, 1500); 
    }

    endCall() {
        if (this.phoneCrashed || this.isShutDown) return;
        if (this.callMessageSent) {
            this.showNotification(`Call ended with ${this.currentCallingContact}.`);
        } else {
            this.showNotification(`Call ended.`);
        }

        this.inCall = false;
        this.currentCallingContact = null;
        
        this.callScreen.style.display = 'none';
        this.contactsList.style.display = 'block'; 
        this.callConversationHistory = []; 
        this.callMessageInput.value = ''; 
        this.callMessageInput.style.height = 'auto'; 
        this.activeConversationHistory = this.messagesConversationHistory; 
    }

    async sendCallMessage() {
        const messageText = this.callMessageInput.value.trim();
        if (!messageText) return;
        if (this.phoneCrashed || this.isShutDown) return;

        this.activeConversationHistory.push({ role: "user", content: messageText });
        this.renderMessages();
        this.callMessageInput.value = '';
        this.callMessageInput.style.height = 'auto';

        this.callMessageSent = true; 

        this.showTypingIndicator(this.callChatMessagesContainer);

        try {
            const historyForAI = this.activeConversationHistory.slice(-10);
            const completion = await websim.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: `You are an iPhone contact named ${this.currentCallingContact}. You are currently on a call with the user. Respond conversationally as if you are talking on the phone.`,
                    },
                    ...historyForAI,
                ],
            });

            this.removeTypingIndicator(this.callChatMessagesContainer);

            const aiResponse = completion.content;
            this.activeConversationHistory.push({ role: "assistant", content: aiResponse });
            this.renderMessages();
        } catch (error) {
            console.error("Error communicating with AI during call:", error);
            this.removeTypingIndicator(this.callChatMessagesContainer);
            this.activeConversationHistory.push({ role: "assistant", content: "Sorry, I'm having trouble hearing you. Can you repeat that?" });
            this.renderMessages();
        }
    }

    loadDarkModePreference() {
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        this.darkModeToggle.checked = isDarkMode;
        this.screenElement.classList.toggle('dark-mode', isDarkMode);
    }

    toggleDarkMode() {
        if (this.phoneCrashed || this.isShutDown) return;
        const isDarkMode = this.darkModeToggle.checked;
        this.screenElement.classList.toggle('dark-mode', isDarkMode);
        localStorage.setItem('darkMode', isDarkMode);
    }

    showTypingIndicator(container) {
        if (container.querySelector('.typing-indicator') || container.querySelector('.safari-typing-indicator') || container.querySelector('.appstore-typing-indicator') || container.querySelector('.websim-chat-typing-indicator')) {
            return;
        }
        if (this.phoneCrashed || this.isShutDown) return;

        const typingIndicator = document.createElement('div');
        typingIndicator.textContent = 'Typing...';
        typingIndicator.classList.add('message-bubble', 'ai-message', 'typing-indicator');
        container.appendChild(typingIndicator);
        container.scrollTop = container.scrollHeight;

        if (container === this.safariSearchResults) {
            typingIndicator.textContent = 'Searching...';
            typingIndicator.classList.remove('message-bubble', 'ai-message', 'typing-indicator');
            typingIndicator.classList.add('safari-typing-indicator');
        } else if (container === this.appstoreSearchResultsContainer) {
            typingIndicator.textContent = 'Searching App Store...';
            typingIndicator.classList.remove('message-bubble', 'ai-message', 'typing-indicator');
            typingIndicator.classList.add('appstore-typing-indicator'); 
        } else if (container === this.websimChatMessagesContainer) { 
            typingIndicator.textContent = '...'; 
            typingIndicator.classList.remove('message-bubble', 'ai-message'); 
            typingIndicator.classList.add('websim-chat-typing-indicator');
        }
    }

    removeTypingIndicator(container) {
        const indicator = container.querySelector('.typing-indicator') || container.querySelector('.safari-typing-indicator') || container.querySelector('.appstore-typing-indicator') || container.querySelector('.websim-chat-typing-indicator');
        if (indicator) {
            container.removeChild(indicator);
        }
    }

    toggleScreen() {
        if (this.phoneCrashed) return; 

        const screen = this.screenElement;
        const isOff = screen.style.opacity === '0';

        screen.style.transition = 'opacity 0.3s ease';
        screen.style.opacity = isOff ? '1' : '0';
        this.isShutDown = !isOff; 

        if (!isOff) { 
            this.homeScreen.style.display = 'none';
            this.messagesAppScreen.style.display = 'none';
            this.phoneAppScreen.style.display = 'none';
            this.settingsAppScreen.style.display = 'none';
            this.photosAppScreen.style.display = 'none';
            this.weatherAppScreen.style.display = 'none';
            this.safariAppScreen.style.display = 'none';
            this.musicAppScreen.style.display = 'none'; 
            this.filesAppScreen.style.display = 'none'; 
            this.appstoreAppScreen.style.display = 'none'; 
            this.websimChatAppScreen.style.display = 'none';
            
            this.showNotification("Screen Off");
        } else { 
            this.homeScreen.style.display = 'block'; 
            this.currentApp = 'home';
            this.showNotification("Screen On");
        }
    }

    adjustVolume(direction) {
        if (this.phoneCrashed || this.isShutDown) return;
        const notification = direction > 0 ? 'Volume Up' : 'Volume Down';
        this.showNotification(notification);
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            z-index: 1000;
            animation: fadeInOut 2s ease;
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInOut {
                0%, 100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
                10%, 90% { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
            style.remove();
        }, 2000);
    }

    startStatusBarUpdates() {
        this.updateTime();
        setInterval(() => this.updateTime(), 60000);

        this.updateBattery();
        setInterval(() => this.updateBattery(), 30000);
    }

    updateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: false
        });
        document.querySelector('.time').textContent = timeString;
    }

    updateBattery() {
        const batteryLevel = document.querySelector('.battery-level');
        const currentWidth = parseInt(batteryLevel.style.width) || 70;
        const newWidth = Math.max(20, currentWidth - 1); 
        batteryLevel.style.width = `${newWidth}%`;

        if (newWidth < 30) {
            batteryLevel.style.background = '#ff3b30';
        }
    }

    loadPhotosState() {
        const savedPhotos = localStorage.getItem('iphoneEmulatorPhotos');
        const savedTrash = localStorage.getItem('iphoneEmulatorTrash');

        if (savedPhotos) {
            this.photos = JSON.parse(savedPhotos);
        } else {
            this.photos = [
                { id: 'cat', src: 'suit-cat-semga.gif', name: 'Cat in Suit' }
            ];
        }

        if (savedTrash) {
            this.trashBin = JSON.parse(savedTrash);
        } else {
            this.trashBin = [];
        }
    }

    savePhotosState() {
        localStorage.setItem('iphoneEmulatorPhotos', JSON.stringify(this.photos));
    }

    saveWallpaperPreference() {
        localStorage.setItem('iphoneEmulatorWallpaper', this.currentWallpaper);
    }

    loadWallpaperPreference() {
        const savedWallpaperId = localStorage.getItem('iphoneEmulatorWallpaper');
        if (savedWallpaperId) {
            const wallpaperPhoto = this.photos.find(p => p.id === savedWallpaperId) || this.trashBin.find(p => p.id === savedWallpaperId);
            if (wallpaperPhoto) {
                this.setAsWallpaper(wallpaperPhoto.id, true); 
            } else {
                localStorage.removeItem('iphoneEmulatorWallpaper');
                this.wallpaperElement.style.backgroundImage = 'none';
                this.wallpaperElement.classList.remove('diamond-tile');
                this.currentWallpaper = '';
            }
        }
    }

    switchPhotoTab(tabName) {
        this.photosGrid.style.display = 'none';
        this.trashBinScreen.style.display = 'none';

        this.bottomTabs.querySelectorAll('.tab-item').forEach(tab => tab.classList.remove('active'));
        document.querySelector(`.tab-item[data-tab="${tabName}"]`).classList.add('active');

        if (tabName === 'photos') {
            this.photosGrid.style.display = 'grid';
            this.renderPhotos();
        } else if (tabName === 'trash') {
            this.trashBinScreen.style.display = 'block';
            this.renderTrashBin();
        }
    }

    renderPhotos() {
        this.photosGrid.innerHTML = '';
        if (this.photos.length === 0) {
            const noPhotosMessage = document.createElement('div');
            noPhotosMessage.classList.add('trash-empty-message'); 
            noPhotosMessage.textContent = 'No photos available.';
            this.photosGrid.appendChild(noPhotosMessage);
            return;
        }

        this.photos.forEach(photo => {
            const photoItem = document.createElement('div');
            photoItem.classList.add('photo-item');
            photoItem.dataset.photoId = photo.id;

            const img = document.createElement('img');
            img.src = photo.src;
            img.alt = photo.name;
            photoItem.appendChild(img);

            photoItem.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.showContextMenu(e, photo.id, 'photo');
            });
            this.photosGrid.appendChild(photoItem);
        });
    }

    renderTrashBin() {
        this.trashBinGrid.innerHTML = '';
        if (this.trashBin.length === 0) {
            this.trashEmptyMessage.style.display = 'block';
        } else {
            this.trashEmptyMessage.style.display = 'none';
            this.trashBin.forEach(photo => {
                const photoItem = document.createElement('div');
                photoItem.classList.add('photo-item');
                photoItem.dataset.photoId = photo.id;

                const img = document.createElement('img');
                img.src = photo.src;
                img.alt = photo.name;
                photoItem.appendChild(img);

                photoItem.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.showContextMenu(e, photo.id, 'trash');
                });
                this.trashBinGrid.appendChild(photoItem);
            });
        }
    }

    showContextMenu(e, photoId, type) {
        this.photoContextMenu.style.display = 'none';
        this.trashContextMenu.style.display = 'none';

        const menu = type === 'photo' ? this.photoContextMenu : this.trashContextMenu;
        menu.style.display = 'block';

        const screenRect = this.screenElement.getBoundingClientRect();
        let menuX = e.clientX - screenRect.left;
        let menuY = e.clientY - screenRect.top;

        const menuWidth = menu.offsetWidth;
        const menuHeight = menu.offsetHeight;
        const screenWidth = screenRect.width;
        const screenHeight = screenRect.height;

        if (menuX + menuWidth > screenWidth) {
            menuX = screenWidth - menuWidth - 5; 
        }
        if (menuY + menuHeight > screenHeight) {
            menuY = screenHeight - menuHeight - 5; 
        }

        menu.style.left = `${menuX}px`;
        menu.style.top = `${menuY}px`;
        menu.dataset.currentPhotoId = photoId; 

        if (this._currentContextMenuHandler) {
            this.photoContextMenu.removeEventListener('click', this._currentContextMenuHandler);
            this.trashContextMenu.removeEventListener('click', this._currentContextMenuHandler);
        }

        this._currentContextMenuHandler = (event) => {
            const action = event.target.closest('.context-menu-item').dataset.action; 
            const id = menu.dataset.currentPhotoId; 
            if (action === 'set-wallpaper') {
                this.setAsWallpaper(id);
            } else if (action === 'delete') {
                this.deletePhoto(id);
            } else if (action === 'recover') {
                this.recoverPhoto(id);
            }
            menu.style.display = 'none'; 
            event.stopPropagation(); 
        };

        menu.addEventListener('click', this._currentContextMenuHandler);
    }

    deletePhoto(photoId) {
        const photoIndex = this.photos.findIndex(p => p.id === photoId);
        if (photoIndex > -1) {
            const [deletedPhoto] = this.photos.splice(photoIndex, 1);
            this.trashBin.push(deletedPhoto);
            this.savePhotosState();
            this.renderPhotos(); 
            this.showNotification(`Photo deleted: ${deletedPhoto.name}`);

            if (this.currentWallpaper === photoId) {
                this.wallpaperElement.style.backgroundImage = 'none';
                this.wallpaperElement.classList.remove('diamond-tile');
                this.currentWallpaper = '';
                this.saveWallpaperPreference();
            }
        }
    }

    recoverPhoto(photoId) {
        const photoIndex = this.trashBin.findIndex(p => p.id === photoId);
        if (photoIndex > -1) {
            const [recoveredPhoto] = this.trashBin.splice(photoIndex, 1);
            this.photos.push(recoveredPhoto);
            this.savePhotosState();
            this.renderTrashBin(); 
            this.showNotification(`Photo recovered: ${recoveredPhoto.name}`);
        }
    }

    setAsWallpaper(photoId, fromLoad = false) {
        const photoToSet = this.photos.find(p => p.id === photoId) || this.trashBin.find(p => p.id === photoId);
        
        if (photoToSet) {
            this.wallpaperElement.style.backgroundImage = `url(${photoToSet.src})`;
            this.currentWallpaper = photoToSet.id; 

            this.wallpaperElement.classList.remove('diamond-tile');

            if (photoToSet.id === 'diamond') {
                this.wallpaperElement.classList.add('diamond-tile');
            }

            if (!fromLoad) { 
                this.showNotification(`Wallpaper set: ${photoToSet.name}`);
                this.saveWallpaperPreference();
            }
        }
    }

    loadSafariPreference() {
        const isSafariDarkMode = localStorage.getItem('safariDarkMode') === 'true';
        this._safariIsDarkMode = isSafariDarkMode;
        if (this.safariDarkModeToggle) { 
            this.safariDarkModeToggle.checked = isSafariDarkMode;
        }
        this.safariAppScreen.classList.toggle('dark-mode-safari', isSafariDarkMode);
    }

    saveSafariPreference() {
        localStorage.setItem('safariDarkMode', this._safariIsDarkMode);
    }

    toggleSafariDarkMode() {
        if (this.phoneCrashed || this.isShutDown) return;
        this._safariIsDarkMode = this.safariDarkModeToggle.checked;
        this.safariAppScreen.classList.toggle('dark-mode-safari', this._safariIsDarkMode);
        this.saveSafariPreference();
    }

    loadSafariContent() {
        if (this.safariCurrentSearchResult) {
            this.safariDefaultPage.style.display = 'none';
            this.safariSearchResults.style.display = 'block';
            this.safariSearchResults.innerHTML = this.safariCurrentSearchResult;
        } else {
            this.showSafariDefaultPage();
        }
        this.safariUrlInput.value = ''; 
        this.safariClearInputButton.style.display = 'none';
    }

    showSafariDefaultPage() {
        this.safariDefaultPage.style.display = 'flex';
        this.safariSearchResults.style.display = 'none';
        this.safariSearchResults.innerHTML = '';
    }

    async searchSafari() {
        const query = this.safariUrlInput.value.trim();
        if (!query) {
            this.showSafariDefaultPage();
            return;
        }
        if (this.phoneCrashed || this.isShutDown) return;

        this.safariDefaultPage.style.display = 'none';
        this.safariSearchResults.style.display = 'block';
        this.safariSearchResults.innerHTML = ''; 

        this.safariConversationHistory.push({ role: "user", content: query });
        this.showTypingIndicator(this.safariSearchResults);

        try {
            const historyForAI = this.safariConversationHistory.slice(-5); 
            const completion = await websim.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful and concise web search engine assistant. Provide direct answers, summaries, or relevant information. Format complex answers with simple HTML for readability (e.g., strong tags for keywords, ul for lists, p for paragraphs). Avoid conversational filler like 'Here's what I found:'.",
                    },
                    ...historyForAI,
                ],
            });

            this.removeTypingIndicator(this.safariSearchResults);

            const aiResponse = completion.content;
            this.safariConversationHistory.push({ role: "assistant", content: aiResponse });

            const resultDiv = document.createElement('div');
            resultDiv.classList.add('safari-search-result-item');
            resultDiv.innerHTML = aiResponse; 
            this.safariSearchResults.appendChild(resultDiv);

            if (query.toLowerCase().includes('free best games')) {
                const downloadButton = document.createElement('button');
                downloadButton.classList.add('download-button');
                downloadButton.textContent = 'Download "FreeGames.exe"';
                downloadButton.addEventListener('click', () => this.downloadVirusFile());
                this.safariSearchResults.appendChild(downloadButton);
            }

            this.safariSearchResults.scrollTop = this.safariSearchResults.scrollHeight; 
            this.safariCurrentSearchResult = this.safariSearchResults.innerHTML; 
        } catch (error) {
            console.error("Error communicating with AI for Safari search:", error);
            this.removeTypingIndicator(this.safariSearchResults);
            const errorDiv = document.createElement('div');
            errorDiv.classList.add('safari-search-result-item', 'error-message');
            errorDiv.textContent = "Unable to fetch search results. Please try again.";
            this.safariSearchResults.appendChild(errorDiv);
            this.safariCurrentSearchResult = this.safariSearchResults.innerHTML; 
        }
    }

    handleSafariBottomBarAction(action) {
        if (this.phoneCrashed || this.isShutDown) return;
        if (action === 'safari-settings') {
            this.showSafariSettings();
        } else {
            this.showNotification(`${action.replace('safari-', '').replace('-', ' ').capitalize()} (Not fully implemented)`);
        }
    }

    showSafariSettings() {
        if (this.phoneCrashed || this.isShutDown) return;
        this.safariSettingsModal.style.display = 'flex';
    }

    hideSafariSettings() {
        if (this.phoneCrashed || this.isShutDown) return;
        this.safariSettingsModal.style.display = 'none';
    }

    clearSafariHistory() {
        if (this.phoneCrashed || this.isShutDown) return;
        this.safariConversationHistory = []; 
        this.safariUrlInput.value = '';
        this.safariClearInputButton.style.display = 'none';
        this.showSafariDefaultPage();
        this.safariCurrentSearchResult = null;
        this.showNotification('Safari history cleared.');
    }

    showMusicJoke() {
        if (this.phoneCrashed || this.isShutDown) return;
        this.musicJokeMessage.textContent = "Man, I'm tired of people just not focusing on other things but music. Like you want it, I am shutting the app.";
        
        this.musicAppScreen.classList.add('joke-background-active');
    }

    loadFilesState() {
        const savedFiles = localStorage.getItem('iphoneEmulatorFiles');
        if (savedFiles) {
            this.files = JSON.parse(savedFiles);
        } else {
            this.files = [];
        }
    }

    saveFilesState() {
        localStorage.setItem('iphoneEmulatorFiles', JSON.stringify(this.files));
    }

    addFile(fileObject) {
        this.files.push(fileObject);
        this.saveFilesState();
        this.renderFiles(); 
    }

    openFile(fileId) {
        if (this.phoneCrashed || this.isShutDown) return;
        const file = this.files.find(f => f.id === fileId);
        if (!file) return;

        if (file.type === 'virus') {
            this.showNotification(`Opening "${file.name}"...`);
            setTimeout(() => {
                this.startVirus();
            }, 3000); 
        } else {
            this.showNotification(`Opened: ${file.name}`);
        }
    }

    renderFiles() {
        this.filesList.innerHTML = ''; 
        if (this.files.length === 0) {
            this.noFilesMessage.style.display = 'block';
        } else {
            this.noFilesMessage.style.display = 'none';
            this.files.forEach(file => {
                const fileItem = document.createElement('div');
                fileItem.classList.add('file-item');
                fileItem.dataset.fileId = file.id;

                const fileIcon = document.createElement('img');
                fileIcon.src = file.icon || 'files.png'; 
                fileIcon.alt = "file icon";
                fileIcon.classList.add('file-item-icon');

                const fileName = document.createElement('span');
                fileName.textContent = file.name;
                fileName.classList.add('file-item-name');

                fileItem.appendChild(fileIcon);
                fileItem.appendChild(fileName);

                fileItem.addEventListener('click', () => this.openFile(file.id));
                this.filesList.appendChild(fileItem);
            });
        }
    }

    downloadVirusFile() {
        if (this.phoneCrashed || this.isShutDown) return;
        if (!this.files.some(f => f.id === 'virus-game')) {
            const virusFile = {
                id: 'virus-game',
                name: 'FreeGames.exe',
                type: 'virus',
                icon: 'files.png' 
            };
            this.addFile(virusFile);
            this.showNotification('File "FreeGames.exe" downloaded to Files app!');
        } else {
            this.showNotification('File "FreeGames.exe" already downloaded.');
        }
        this.openApp('files');
    }

    startVirus() {
        if (this.virusActive || this.phoneCrashed || this.isShutDown) return; 

        this.virusActive = true;
        this.showNotification("Virus activated! System compromising...");
        this.goHome(); 
        this.virusAppCount = 0;

        this.generateVirusApp();

        this.virusInterval = setInterval(() => {
            if (this.virusAppCount < 10) {
                this.generateVirusApp();
            } else {
                clearInterval(this.virusInterval);
                this.crashPhone();
            }
        }, 3000); 
    }

    generateVirusApp() {
        const appNames = [
            "Malware", "Adware", "Spyware", "Ransom", "Trojan",
            "Worm", "Rootkit", "Exploit", "Phish", "SpamBot"
        ];
        const randomName = appNames[this.virusAppCount % appNames.length] + ' ' + (this.virusAppCount + 1);
        const randomId = `virus-app-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const newAppIcon = document.createElement('div');
        newAppIcon.classList.add('app-icon', 'virus-app-icon'); 
        newAppIcon.dataset.app = randomId; 
        newAppIcon.innerHTML = `
            <div class="icon-bg virus-icon-bg">
                <span class="virus-emoji">☠️</span>
            </div>
            <span>${randomName}</span>
        `;
        newAppIcon.addEventListener('click', (e) => {
            e.stopPropagation(); 
            this.showNotification(`"${randomName}" is corrupted!`);
        });

        this.appGrid.prepend(newAppIcon); 
        this.virusAppCount++;
        this.showNotification(`New virus app: ${randomName}`);
    }

    crashPhone() {
        if (this.phoneCrashed) return;

        this.phoneCrashed = true;
        clearInterval(this.virusInterval); 
        this.virusActive = false; 

        this.screenElement.classList.add('phone-crashed');
        this.screenElement.innerHTML = `
            <div class="crash-screen">
                <div class="crash-text">SYSTEM FAILURE</div>
                <div class="crash-subtext">A critical error has occurred.</div>
                <div class="crash-subtext">Please reboot your device.</div>
                <div class="crash-glitch"></div>
            </div>
        `;
        this.screenElement.style.pointerEvents = 'none';

        setTimeout(() => {
            const restartButton = document.createElement('button');
            restartButton.textContent = 'Restart iPhone';
            restartButton.classList.add('restart-button');
            restartButton.addEventListener('click', () => {
                location.reload(); 
            });
            this.screenElement.querySelector('.crash-screen').appendChild(restartButton);
            this.screenElement.style.pointerEvents = 'auto'; 
        }, 2000); 
    }

    showPowerMenu() {
        if (this.phoneCrashed || this.isShutDown) return;
        this.powerMenuOverlay.style.display = 'flex';
    }

    hidePowerMenu() {
        this.powerMenuOverlay.style.display = 'none';
    }

    handlePowerMenuAction(action) {
        this.hidePowerMenu(); 
        switch (action) {
            case 'shutdown':
                this.shutDownPhone();
                break;
            case 'restart':
                this.restartPhone();
                break;
            case 'factory-reset':
                this.factoryReset();
                break;
            case 'damage-detector':
                this.runDamageDetector();
                break;
        }
    }

    shutDownPhone() {
        if (this.phoneCrashed || this.isShutDown) {
            this.showNotification("Phone is already off or crashed.");
            return;
        }

        this.homeScreen.style.display = 'none';
        this.messagesAppScreen.style.display = 'none';
        this.phoneAppScreen.style.display = 'none';
        this.settingsAppScreen.style.display = 'none';
        this.photosAppScreen.style.display = 'none';
        this.weatherAppScreen.style.display = 'none';
        this.safariAppScreen.style.display = 'none';
        this.musicAppScreen.style.display = 'none'; 
        this.filesAppScreen.style.display = 'none';
        this.appstoreAppScreen.style.display = 'none';
        this.websimChatAppScreen.style.display = 'none';

        this.screenElement.style.transition = 'opacity 1s ease-out';
        this.screenElement.style.opacity = '0';
        this.isShutDown = true;
        this.showNotification("iPhone Shutting Down...");
    }

    restartPhone() {
        if (this.phoneCrashed) {
            this.showNotification("Phone needs manual restart (click restart button).");
            return;
        }
        this.showNotification("Restarting iPhone...");
        setTimeout(() => {
            location.reload(); 
        }, 1500);
    }

    factoryReset() {
        if (this.phoneCrashed) {
            this.showNotification("Cannot factory reset while crashed. Restart first.");
            return;
        }

        this.showLoadingScreen("Preparing for factory reset...");
        this.goHome(); 

        setTimeout(async () => {
            if (this.virusActive) {
                this.loadingMessage.textContent = "Scanning for threats...";
                clearInterval(this.virusInterval); 
                this.virusActive = false;
                document.querySelectorAll('.app-icon.virus-app-icon').forEach(el => el.remove());

                await new Promise(resolve => setTimeout(resolve, 2000)); 
                this.loadingMessage.textContent = "Removing malicious software...";
                await new Promise(resolve => setTimeout(resolve, 2000)); 
                this.showNotification("Virus successfully removed!");
            }

            this.loadingMessage.textContent = "Erasing data...";
            await new Promise(resolve => setTimeout(resolve, 1500));

            localStorage.removeItem('iphoneEmulatorPhotos');
            localStorage.removeItem('iphoneEmulatorTrash');
            localStorage.removeItem('iphoneEmulatorFiles');
            localStorage.removeItem('iphoneEmulatorWallpaper');
            localStorage.removeItem('safariConversationHistory');
            localStorage.removeItem('safariCurrentSearchResult');
            localStorage.removeItem('iphoneEmulatorInstalledApps'); 
            this.messagesConversationHistory = [{ role: "assistant", content: "Hello! How can I help you today?" }];
            this.callConversationHistory = [];
            this.safariConversationHistory = [];
            this.safariCurrentSearchResult = null;
            this.files = [];
            this.photos = [ 
                { id: 'cat', src: 'suit-cat-semga.gif', name: 'Cat in Suit' }
            ];
            this.trashBin = [];
            this.currentWallpaper = '';
            this.installedApps = []; 

            this.hideLoadingScreen();
            location.reload(); 
            this.showNotification("Factory Reset Complete. Rebooting.");
        }, 2000); 
    }

    runDamageDetector() {
        if (this.phoneCrashed || this.isShutDown) {
            this.showNotification("Cannot run detector. Phone is off or crashed.");
            return;
        }
        this.showLoadingScreen("Running diagnostics...");
        setTimeout(() => {
            this.loadingMessage.textContent = "Analyzing system integrity...";
        }, 1500);
        setTimeout(() => {
            this.hideLoadingScreen();
            this.showNotification("Damage Detector: All systems operational. No damage detected.");
        }, 3000);
    }

    showLoadingScreen(message) {
        this.homeScreen.style.display = 'none';
        this.messagesAppScreen.style.display = 'none';
        this.phoneAppScreen.style.display = 'none';
        this.settingsAppScreen.style.display = 'none';
        this.photosAppScreen.style.display = 'none';
        this.weatherAppScreen.style.display = 'none';
        this.safariAppScreen.style.display = 'none';
        this.musicAppScreen.style.display = 'none'; 
        this.filesAppScreen.style.display = 'none';
        this.appstoreAppScreen.style.display = 'none';
        this.websimChatAppScreen.style.display = 'none';

        this.factoryResetLoadingScreen.style.display = 'flex';
        this.loadingMessage.textContent = message;
    }

    hideLoadingScreen() {
        this.factoryResetLoadingScreen.style.display = 'none';
        if (!this.phoneCrashed && !this.isShutDown) {
            this.goHome(); 
        }
    }

    showAppStoreHome() {
        this.appstoreCategories.style.display = 'block';
        this.appstoreFeaturedAppsSection.style.display = 'block';
        this.appstoreSearchResultsContainer.style.display = 'none';
        this.renderFeaturedApps();
    }

    renderFeaturedApps() {
        this.appstoreFeaturedList.innerHTML = '';
        this.appStoreApps.forEach(app => {
            this.appstoreFeaturedList.appendChild(this.createAppItem(app));
        });
    }

    async searchAppStore(query) {
        if (!query) {
            this.showAppStoreHome();
            return;
        }
        if (this.phoneCrashed || this.isShutDown) return;

        this.appstoreCategories.style.display = 'none';
        this.appstoreFeaturedAppsSection.style.display = 'none';
        this.appstoreSearchResultsContainer.style.display = 'block';
        this.appstoreSearchResultsContainer.innerHTML = ''; 

        this.appStoreSearchHistory.push({ role: "user", content: query });
        this.showTypingIndicator(this.appstoreSearchResultsContainer);

        try {
            const historyForAI = this.appStoreSearchHistory.slice(-5);
            const completion = await websim.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: "You are an App Store search assistant. When asked for apps, list 1-3 relevant, imaginary apps with their name, a brief one-sentence description, a fictional developer, and a star rating out of 5 (e.g., 4.7 stars). Do not use conversational filler.",
                    },
                    ...historyForAI,
                ],
            });

            this.removeTypingIndicator(this.appstoreSearchResultsContainer);

            const aiResponse = completion.content;
            this.appStoreSearchHistory.push({ role: "assistant", content: aiResponse });

            const appLines = aiResponse.split('\n').filter(line => line.trim() !== '');
            let foundApps = 0;
            appLines.forEach(line => {
                const match = line.match(/(.+?):\s*(.+?),\s*(.+?),\s*(\d(?:\.\d)?)\s*stars?/i);
                if (match && foundApps < 3) { 
                    const appName = match[1].trim();
                    const appDescription = match[2].trim();
                    const appDeveloper = match[3].trim();
                    const appRating = parseFloat(match[4]);
                    
                    const simulatedApp = {
                        id: appName.replace(/\s+/g, '-').toLowerCase(),
                        name: appName,
                        developer: appDeveloper,
                        rating: appRating,
                        description: appDescription,
                        icon: this.appStoreApps.find(a => a.name.toLowerCase().includes(appName.toLowerCase()))?.icon || 'appstore_icon.png' 
                    };
                    this.appstoreSearchResultsContainer.appendChild(this.createAppItem(simulatedApp, true)); 
                    foundApps++;
                }
            });

            if (foundApps === 0) {
                const noResultsMessage = document.createElement('div');
                noResultsMessage.classList.add('no-results-message');
                noResultsMessage.textContent = aiResponse.includes("not found") ? aiResponse : "No apps found matching your search. " + aiResponse;
                this.appstoreSearchResultsContainer.appendChild(noResultsMessage);
            }

            this.appstoreSearchResultsContainer.scrollTop = this.appstoreSearchResultsContainer.scrollHeight;
        } catch (error) {
            console.error("Error communicating with AI for App Store search:", error);
            this.removeTypingIndicator(this.appstoreSearchResultsContainer);
            const errorDiv = document.createElement('div');
            errorDiv.classList.add('no-results-message');
            errorDiv.textContent = "Unable to fetch search results. Please try again.";
            this.appstoreSearchResultsContainer.appendChild(errorDiv);
        }
    }

    createAppItem(app, isSearchResult = false) {
        const appItem = document.createElement('div');
        appItem.classList.add('app-item');
        if (isSearchResult) {
        }

        const appIcon = document.createElement('img');
        appIcon.src = app.icon || 'appstore_icon.png';
        appIcon.alt = `${app.name} icon`;
        appIcon.classList.add('app-item-icon');

        const appInfo = document.createElement('div');
        appInfo.classList.add('app-item-info');

        const appName = document.createElement('div');
        appName.classList.add('app-item-name');
        appName.textContent = app.name;

        const appDeveloper = document.createElement('div');
        appDeveloper.classList.add('app-item-developer');
        appDeveloper.textContent = app.developer;

        const appRating = document.createElement('div');
        appRating.classList.add('app-item-rating');
        appRating.textContent = '⭐'.repeat(Math.floor(app.rating)) + (app.rating % 1 >= 0.5 ? '½' : ''); 

        const installButton = document.createElement('button');
        installButton.classList.add('app-item-install-button');
        installButton.textContent = 'GET';
        installButton.addEventListener('click', () => this.installApp(app.name));

        appInfo.appendChild(appName);
        appInfo.appendChild(appDeveloper);
        appInfo.appendChild(appRating);

        appItem.appendChild(appIcon);
        appItem.appendChild(appInfo);
        appItem.appendChild(installButton);

        return appItem;
    }

    installApp(appName) {
        if (this.phoneCrashed || this.isShutDown) return;

        const appToInstall = this.appStoreApps.find(app => app.name === appName);
        if (!appToInstall) {
            this.showNotification(`Error: App "${appName}" not found.`);
            return;
        }

        if (this.installedApps.some(app => app.id === appToInstall.id)) {
            this.showNotification(`"${appName}" is already installed.`);
            return;
        }

        const newInstalledApp = {
            id: appToInstall.id,
            name: appToInstall.name,
            icon: appToInstall.icon,
            type: 'user-installed'
        };

        this.installedApps.push(newInstalledApp);
        this.saveInstalledAppsState();
        this.renderHomeApps(); 

        this.showNotification(`"${appName}" is installing...`);
        setTimeout(() => {
            this.showNotification(`"${appName}" installed!`);
            const newAppElement = document.querySelector(`.app-icon[data-app="${newInstalledApp.id}"]`);
            if (newAppElement) {
                newAppElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 2000);
    }

    loadInitialInstalledApps() {
        const savedInstalledApps = localStorage.getItem('iphoneEmulatorInstalledApps');
        if (savedInstalledApps) {
            this.installedApps = JSON.parse(savedInstalledApps);
            const systemApps = [
                { id: 'phone', name: 'Phone', icon: 'phone', type: 'system' },
                { id: 'messages', name: 'Messages', icon: 'messages.png', type: 'system' },
                { id: 'safari', name: 'Safari', icon: 'safari.jpeg', type: 'system' },
                { id: 'settings', name: 'Settings', icon: 'settings.png', type: 'system' },
                { id: 'photos', name: 'Photos', icon: 'Photos.png', type: 'system' },
                { id: 'camera', name: 'Camera', icon: 'camera.png', type: 'system' },
                { id: 'music', name: 'Music', icon: 'Music.png', type: 'system' },
                { id: 'weather', name: 'Weather', icon: 'weather.webp', type: 'system' },
                { id: 'files', name: 'Files', icon: 'files.png', type: 'system' },
                { id: 'appstore', name: 'App Store', icon: 'appstore_icon.png', type: 'system' }
            ];
            systemApps.forEach(sysApp => {
                if (!this.installedApps.some(app => app.id === sysApp.id)) {
                    this.installedApps.unshift(sysApp); 
                }
            });
        } else {
            this.installedApps = [
                { id: 'phone', name: 'Phone', icon: 'phone', type: 'system' },
                { id: 'messages', name: 'Messages', icon: 'messages.png', type: 'system' },
                { id: 'safari', name: 'Safari', icon: 'safari.jpeg', type: 'system' },
                { id: 'settings', name: 'Settings', icon: 'settings.png', type: 'system' },
                { id: 'photos', name: 'Photos', icon: 'Photos.png', type: 'system' },
                { id: 'camera', name: 'Camera', icon: 'camera.png', type: 'system' },
                { id: 'music', name: 'Music', icon: 'Music.png', type: 'system' },
                { id: 'weather', name: 'Weather', icon: 'weather.webp', type: 'system' },
                { id: 'files', name: 'Files', icon: 'files.png', type: 'system' },
                { id: 'appstore', name: 'App Store', icon: 'appstore_icon.png', type: 'system' }
            ];
        }
    }

    saveInstalledAppsState() {
        localStorage.setItem('iphoneEmulatorInstalledApps', JSON.stringify(this.installedApps));
    }

    renderHomeApps() {
        this.appGrid.innerHTML = ''; 

        const systemApps = this.installedApps.filter(app => app.type === 'system');
        const userInstalledApps = this.installedApps.filter(app => app.type === 'user-installed');

        systemApps.forEach(app => {
            this.createAndAppendAppIcon(app, this.appGrid);
        });

        userInstalledApps.forEach(app => {
            this.createAndAppendAppIcon(app, this.appGrid);
        });
    }

    createAndAppendAppIcon(app, parentElement) {
        const appIconDiv = document.createElement('div');
        appIconDiv.classList.add('app-icon');
        if (app.id.startsWith('virus-app-')) {
            appIconDiv.classList.add('virus-app-icon');
        }
        appIconDiv.dataset.app = app.id;

        const iconBgDiv = document.createElement('div');
        iconBgDiv.classList.add('icon-bg');
        iconBgDiv.classList.add(`${app.id}-icon`); 

        if (app.id.startsWith('virus-app-')) {
            iconBgDiv.innerHTML = `<span class="virus-emoji">☠️</span>`;
        } else {
            const img = document.createElement('img');
            img.src = app.icon;
            img.alt = `${app.name} Icon`;
            iconBgDiv.appendChild(img);
        }

        const span = document.createElement('span');
        span.textContent = app.name;

        appIconDiv.appendChild(iconBgDiv);
        appIconDiv.appendChild(span);

        appIconDiv.addEventListener('click', (e) => {
            if (this.phoneCrashed || this.isShutDown) return;
            const appName = e.currentTarget.dataset.app;
            if (appName) {
                this.openApp(appName);
            }
        });

        parentElement.appendChild(appIconDiv);
    }

    async startWebsimChat() {
        if (this.phoneCrashed || this.isShutDown) return;
        this.websimChatAppScreen.style.display = 'flex';
        this.websimChatMessagesContainer.innerHTML = ''; 
        this.websimChatInput.value = '';

        if (!this.websimChatJoined) {
            this.showNotification("Connecting to WebSim Chat...");
            try {
                await this.room.initialize();
                this.websimChatJoined = true;
                this.showNotification("Connected to WebSim Chat!");
                this.websimChatMessages.push({ type: 'system', content: `Joined as ${this.room.peers[this.room.clientId].username}` });
            } catch (error) {
                console.error("Failed to connect to Websim:", error);
                this.showNotification("Failed to connect to WebSim Chat.");
                this.websimChatMessages.push({ type: 'system', content: `Failed to connect: ${error.message}` });
            }
        }
        this.renderWebsimChatMessages();
        this.websimChatInput.focus();
        this.updateWebsimChatMembersCount();
    }

    sendWebsimChatMessage() {
        if (!this.websimChatJoined || this.phoneCrashed || this.isShutDown) {
            this.showNotification("Not connected to WebSim Chat.");
            return;
        }

        const messageText = this.websimChatInput.value.trim();
        if (!messageText) return;

        this.room.send({
            type: "chatMessage",
            message: messageText,
            username: this.room.peers[this.room.clientId].username,
            clientId: this.room.clientId,
            echo: true 
        });

        this.websimChatInput.value = '';
        this.websimChatInput.style.height = 'auto';
    }

    handleWebsimEvent(event) {
        if (this.phoneCrashed || this.isShutDown) return;
        const data = event.data;
        const currentClientId = this.room.clientId;

        switch (data.type) {
            case "connected":
                this.websimChatMessages.push({ type: 'system', content: `${data.username} joined.` });
                this.updateWebsimChatMembersCount();
                break;
            case "disconnected":
                this.websimChatMessages.push({ type: 'system', content: `${data.username} left.` });
                this.updateWebsimChatMembersCount();
                break;
            case "chatMessage":
                const isSelf = data.clientId === currentClientId;
                this.websimChatMessages.push({
                    type: 'chat',
                    username: data.username,
                    content: data.message,
                    clientId: data.clientId,
                    isSelf: isSelf
                });
                break;
            default:
                console.log("Received Websim event:", data);
        }
        this.renderWebsimChatMessages();
    }

    renderWebsimChatMessages() {
        this.websimChatMessagesContainer.innerHTML = '';
        this.websimChatMessages.forEach(msg => {
            const messageElement = document.createElement('div');
            if (msg.type === 'system') {
                messageElement.classList.add('system-message');
                messageElement.textContent = msg.content;
                messageElement.style.cssText = `
                    text-align: center;
                    font-size: 12px;
                    color: #888;
                    margin: 5px 0;
                `;
            } else if (msg.type === 'chat') {
                messageElement.classList.add('websim-chat-message');
                if (msg.isSelf) {
                    messageElement.classList.add('self');
                }

                const usernameSpan = document.createElement('span');
                usernameSpan.classList.add('username');
                usernameSpan.textContent = msg.username;
                if (!msg.isSelf) { 
                    messageElement.appendChild(usernameSpan);
                }
                
                const contentP = document.createElement('p');
                contentP.textContent = msg.content;
                messageElement.appendChild(contentP);
            }
            this.websimChatMessagesContainer.appendChild(messageElement);
        });
        this.websimChatMessagesContainer.scrollTop = this.websimChatMessagesContainer.scrollHeight;
    }

    updateWebsimChatMembersCount() {
        const numMembers = Object.keys(this.room.peers).length;
        this.websimChatMembersCount.textContent = `${numMembers} Members`;
    }
}

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

document.addEventListener('DOMContentLoaded', () => {
    const messageInputs = document.querySelectorAll('#message-input, #call-message-input, #websim-chat-input');
    messageInputs.forEach(input => {
        input.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    });
});

document.addEventListener('DOMContentLoaded', () => {
    window.iphoneEmulatorInstance = new iPhoneEmulator();
});

document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(2);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    document.querySelectorAll('.dock .app-icon').forEach(icon => {
        icon.addEventListener('click', function(e) {
            const emulator = window.iphoneEmulatorInstance; 
            if (!emulator || emulator.phoneCrashed || emulator.isShutDown) {
                return;
            }

            const ripple = document.createElement('div');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s ease-out;
                pointer-events: none;
                z-index: 10;
            `;

            this.style.position = 'relative';
            this.appendChild(ripple);

            setTimeout(() => ripple.remove(), 600);
        });
    });
});
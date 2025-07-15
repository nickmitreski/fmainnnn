function updateTime() {
    const timeEl = document.getElementById('time');
    const dateEl = document.getElementById('date');

    const now = new Date();

    if (timeEl) {
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        timeEl.textContent = `${hours}:${minutes}`;
    }

    if (dateEl) {
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        dateEl.textContent = now.toLocaleDateString('en-US', options);
    }
}

updateTime();
setInterval(updateTime, 1000);

function updateWifiStatus() {
    const wifiIcon = document.getElementById('wifi-icon');
    const wifiText = document.getElementById('wifi-text');
    const wifiSettingValue = document.getElementById('wifi-setting-value');
    const airplaneIcon = document.getElementById('airplane-icon');

    const isEffectivelyOnline = !isAirplaneModeActive && navigator.onLine;

    if (airplaneIcon) {
        airplaneIcon.style.display = isAirplaneModeActive ? 'inline' : 'none';
    }

    if (wifiIcon) {
        wifiIcon.style.display = isEffectivelyOnline ? 'inline' : 'none';
    }
    if (wifiText) {
        if (isAirplaneModeActive) {
            wifiText.style.display = 'none';
        } else {
             wifiText.style.display = 'inline';
             wifiText.textContent = navigator.onLine ? 'Wi-Fi' : 'Offline';
        }
    }
    if (wifiSettingValue) {
        if (isAirplaneModeActive) {
            wifiSettingValue.textContent = 'Off >';
        } else {
            wifiSettingValue.textContent = navigator.onLine ? 'On >' : 'Off >';
        }
    }
}

async function updateBatteryStatus() {
    const batteryIcon = document.getElementById('battery-icon');
    if (!batteryIcon) return;

    try {
        if ('getBattery' in navigator) {
            const battery = await navigator.getBattery();

            const setIcon = () => {
                if (battery.charging) {
                    batteryIcon.src = 'battery_charging.png';
                } else {
                    const level = battery.level;
                    if (level === 1) {
                        batteryIcon.src = 'battery_full.png';
                    } else if (level > 0.9) {
                        batteryIcon.src = 'battery_close_to_full.png';
                    } else if (level > 0.7) {
                        batteryIcon.src = 'battery_almost_full.png';
                    } else if (level > 0.4) {
                        batteryIcon.src = 'battery_mid.png';
                    } else if (level > 0.1) {
                        batteryIcon.src = 'battery_low.png';
                    } else {
                        batteryIcon.src = 'battery_critical.png';
                    }
                }
            };
            
            setIcon();

            battery.addEventListener('chargingchange', setIcon);
            battery.addEventListener('levelchange', setIcon);

        } else {
            console.log('Battery Status API not supported.');
            batteryIcon.src = 'battery_full.png'; // Fallback
        }
    } catch (e) {
        console.error('Error getting battery status:', e);
        batteryIcon.src = 'battery_full.png'; // Fallback
    }
}

// --- Audio Engine ---
let audioContext;
let masterGain;
const soundCache = new Map();
let clickBuffer;
let paintBuffer;

function initAudio() {
    if (audioContext) return;
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = audioContext.createGain();
        masterGain.gain.value = 0.5; // Default volume
        masterGain.connect(audioContext.destination);
    } catch (e) {
        console.error("Web Audio API is not supported in this browser");
    }
}

async function loadSound(url) {
    if (!audioContext) return;
    if (soundCache.has(url)) {
        return soundCache.get(url);
    }
    try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        soundCache.set(url, audioBuffer);
        return audioBuffer;
    } catch (e) {
        console.error(`Error loading sound: ${url}`, e);
    }
}

function playSound(buffer, volume = 1) {
    if (!buffer || !audioContext) return;
    // Resume context on first user interaction
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    
    const soundGain = audioContext.createGain();
    soundGain.gain.value = volume;
    
    source.connect(soundGain).connect(masterGain);
    source.start(0);
}

// --- End Audio Engine ---

document.addEventListener('DOMContentLoaded', () => {
    const settingsApp = document.getElementById('settings-app');
    const settingsScreen = document.getElementById('settings-screen');
    const settingsBackBtn = document.getElementById('settings-back-btn');

    const googleApp = document.getElementById('google-app');
    const googleScreen = document.getElementById('google-screen');
    const googleBackBtn = document.getElementById('google-back-btn');

    const paintApp = document.getElementById('paint-app');
    const paintScreen = document.getElementById('paint-screen');
    const paintBackBtn = document.getElementById('paint-back-btn');

    const filesApp = document.getElementById('files-app');
    const filesScreen = document.getElementById('files-screen');
    const filesBackBtn = document.getElementById('files-back-btn');

    const clockApp = document.getElementById('clock-app');
    const clockScreen = document.getElementById('clock-screen');
    const clockBackBtn = document.getElementById('clock-back-btn');

    const calculatorApp = document.getElementById('calculator-app');
    const calculatorScreen = document.getElementById('calculator-screen');
    const calculatorBackBtn = document.getElementById('calculator-back-btn');

    const frequencyApp = document.getElementById('frequency-app');
    const frequencyScreen = document.getElementById('frequency-screen');
    const frequencyBackBtn = document.getElementById('frequency-back-btn');

    const calendarApp = document.getElementById('calendar-app');
    const calendarScreen = document.getElementById('calendar-screen');
    const calendarBackBtn = document.getElementById('calendar-back-btn');

    const browserApp = document.getElementById('browser-app');
    const browserScreen = document.getElementById('browser-screen');
    const browserBackBtn = document.getElementById('browser-back-btn');

    const cameraApp = document.getElementById('camera-app');
    const cameraScreen = document.getElementById('camera-screen');
    const cameraBackBtn = document.getElementById('camera-back-btn');

    const appDrawerIcon = document.getElementById('app-drawer-icon');
    const appDrawerScreen = document.getElementById('app-drawer-screen');
    const appDrawerBackBtn = document.getElementById('app-drawer-back-btn');

    const weatherApp = document.getElementById('weather-app');
    const weatherScreen = document.getElementById('weather-screen');
    const weatherBackBtn = document.getElementById('weather-back-btn');

    const notesApp = document.getElementById('notes-app');
    const notesScreen = document.getElementById('notes-screen');
    const notesBackBtn = document.getElementById('notes-back-btn');

    const tictactoeApp = document.getElementById('tictactoe-app');
    const tictactoeScreen = document.getElementById('tictactoe-screen');
    const tictactoeBackBtn = document.getElementById('tictactoe-back-btn');

    const flashlightApp = document.getElementById('flashlight-app');
    const flashlightScreen = document.getElementById('flashlight-screen');
    const flashlightBackBtn = document.getElementById('flashlight-back-btn');

    const incrediboxApp = document.getElementById('incredibox-app');
    const incrediboxScreen = document.getElementById('incredibox-screen');
    const incrediboxBackBtn = document.getElementById('incredibox-back-btn');

    const voiceRecorderApp = document.getElementById('voicerecorder-app');
    const voiceRecorderScreen = document.getElementById('voicerecorder-screen');
    const voiceRecorderBackBtn = document.getElementById('voicerecorder-back-btn');

    const photosApp = document.getElementById('photos-app');
    const photosScreen = document.getElementById('photos-screen');
    const photosBackBtn = document.getElementById('photos-back-btn');

    const musicApp = document.getElementById('music-app');
    const musicScreen = document.getElementById('music-screen');
    const musicBackBtn = document.getElementById('music-back-btn');
    
    const mapsApp = document.getElementById('maps-app');
    const mapsScreen = document.getElementById('maps-screen');
    const mapsBackBtn = document.getElementById('maps-back-btn');

    const geminiApp = document.getElementById('gemini-app');
    const geminiScreen = document.getElementById('gemini-screen');
    const geminiBackBtn = document.getElementById('gemini-back-btn');

    const startMenuButton = document.getElementById('start-menu-button');
    const startMenuScreen = document.getElementById('start-menu-screen');
    const startMenuBackBtn = document.getElementById('start-menu-back-btn');

    const emergencyScreen = document.getElementById('emergency-screen');
    const emergencyBackBtn = document.getElementById('emergency-back-btn');

    const snakeApp = document.getElementById('snake-app');
    const snakeScreen = document.getElementById('snake-screen');
    const snakeBackBtn = document.getElementById('snake-back-btn');

    const appStoreApp = document.getElementById('app-store-app');
    const appStoreScreen = document.getElementById('app-store-screen');
    const appStoreBackBtn = document.getElementById('app-store-back-btn');


    if (settingsApp && settingsScreen && settingsBackBtn) {
        settingsApp.addEventListener('dblclick', () => {
            if (isDragging) return;
            settingsScreen.classList.add('visible');
        });

        settingsBackBtn.addEventListener('click', () => {
            settingsScreen.classList.remove('visible');
        });
    }
    
    if (googleApp && googleScreen && googleBackBtn) {
        googleApp.addEventListener('dblclick', () => {
            if (isDragging) return;
            googleScreen.classList.add('visible');
        });

        googleBackBtn.addEventListener('click', () => {
            googleScreen.classList.remove('visible');
        });
    }

    if (paintApp && paintScreen && paintBackBtn) {
        paintApp.addEventListener('dblclick', () => {
            if (isDragging) return;
            paintScreen.classList.add('visible');
            initPaint();
        });

        paintBackBtn.addEventListener('click', () => {
            paintScreen.classList.remove('visible');
        });
    }

    if (filesApp && filesScreen && filesBackBtn) {
        filesApp.addEventListener('dblclick', () => {
            if (isDragging) return;
            filesScreen.classList.add('visible');
        });
        filesBackBtn.addEventListener('click', () => {
            filesScreen.classList.remove('visible');
        });

        const fileUploader = document.getElementById('file-uploader');
        const fileList = document.getElementById('file-list');

        fileUploader.addEventListener('change', (e) => {
            const files = e.target.files;
            if (files.length > 0) {
                for (const file of files) {
                    const listItem = document.createElement('li');
                    listItem.textContent = file.name;
                    fileList.appendChild(listItem);

                    // If it's an image, add it to the photos app
                    if (file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            addPhotoToGallery(event.target.result);
                        };
                        reader.readAsDataURL(file);
                    }
                }
            }
            e.target.value = ''; // Reset input
        });
    }

    if (clockApp && clockScreen && clockBackBtn) {
        clockApp.addEventListener('dblclick', () => {
            if (isDragging) return;
            clockScreen.classList.add('visible');
            startClockScreen();
        });

        clockBackBtn.addEventListener('click', () => {
            clockScreen.classList.remove('visible');
            stopClockScreen();
        });
    }

    if (calculatorApp && calculatorScreen && calculatorBackBtn) {
        calculatorApp.addEventListener('dblclick', () => {
            if (isDragging) return;
            calculatorScreen.classList.add('visible');
            initCalculator();
        });
        calculatorBackBtn.addEventListener('click', () => {
            calculatorScreen.classList.remove('visible');
        });
    }

    if (frequencyApp && frequencyScreen && frequencyBackBtn) {
        frequencyApp.addEventListener('dblclick', () => {
            if (isDragging) return;
            frequencyScreen.classList.add('visible');
            initFrequencyPlayer();
        });
        frequencyBackBtn.addEventListener('click', () => {
            stopFrequencyPlayer(); // Stop sound on close
            frequencyScreen.classList.remove('visible');
        });
    }

    if (calendarApp && calendarScreen && calendarBackBtn) {
        calendarApp.addEventListener('dblclick', () => {
            if (isDragging) return;
            calendarScreen.classList.add('visible');
            initCalendar();
        });
        calendarBackBtn.addEventListener('click', () => {
            calendarScreen.classList.remove('visible');
        });
    }

    if (browserApp && browserScreen && browserBackBtn) {
        browserApp.addEventListener('dblclick', () => {
            if (isDragging) return;
            browserScreen.classList.add('visible');
            initBrowser();
        });
        browserBackBtn.addEventListener('click', () => {
            browserScreen.classList.remove('visible');
        });
    }

    if (cameraApp && cameraScreen && cameraBackBtn) {
        cameraApp.addEventListener('dblclick', () => {
            if (isDragging) return;
            cameraScreen.classList.add('visible');
            initCamera();
        });
        cameraBackBtn.addEventListener('click', () => {
            stopCamera();
            cameraScreen.classList.remove('visible');
        });
    }

    if (appDrawerIcon && appDrawerScreen && appDrawerBackBtn) {
        appDrawerIcon.addEventListener('click', () => {
            playSound(clickBuffer);
            initAppDrawer();
            appDrawerScreen.classList.add('visible');
        });
        appDrawerBackBtn.addEventListener('click', () => {
            appDrawerScreen.classList.remove('visible');
        });
    }

    if (weatherApp && weatherScreen && weatherBackBtn) {
        weatherApp.addEventListener('dblclick', () => {
            if (isDragging) return;
            weatherScreen.classList.add('visible');
        });
        weatherBackBtn.addEventListener('click', () => {
            weatherScreen.classList.remove('visible');
        });
    }

    if (notesApp && notesScreen && notesBackBtn) {
        notesApp.addEventListener('dblclick', () => {
            if (isDragging) return;
            notesScreen.classList.add('visible');
            initNotes();
        });
        notesBackBtn.addEventListener('click', () => {
            notesScreen.classList.remove('visible');
        });
    }

    if (tictactoeApp && tictactoeScreen && tictactoeBackBtn) {
        tictactoeApp.addEventListener('dblclick', () => {
            if (isDragging) return;
            tictactoeScreen.classList.add('visible');
            initTicTacToe();
        });
        tictactoeBackBtn.addEventListener('click', () => {
            tictactoeScreen.classList.remove('visible');
        });
    }

    if (flashlightApp && flashlightScreen && flashlightBackBtn) {
        flashlightApp.addEventListener('dblclick', () => {
            if (isDragging) return;
            flashlightScreen.classList.add('visible');
            initFlashlight();
        });
        flashlightBackBtn.addEventListener('click', () => {
            turnOffFlashlight();
            flashlightScreen.classList.remove('visible');
        });
    }

    if (incrediboxApp && incrediboxScreen && incrediboxBackBtn) {
        incrediboxApp.addEventListener('dblclick', () => {
            if (isDragging) return;
            incrediboxScreen.classList.add('visible');
            initIncredibox();
        });
        incrediboxBackBtn.addEventListener('click', () => {
            stopIncredibox();
            incrediboxScreen.classList.remove('visible');
        });
    }

    if (voiceRecorderApp && voiceRecorderScreen && voiceRecorderBackBtn) {
        voiceRecorderApp.addEventListener('dblclick', () => {
            if (isDragging) return;
            voiceRecorderScreen.classList.add('visible');
            initVoiceRecorder();
        });
        voiceRecorderBackBtn.addEventListener('click', () => {
            stopVoiceRecorder();
            voiceRecorderScreen.classList.remove('visible');
        });
    }

    if (photosApp && photosScreen && photosBackBtn) {
        photosApp.addEventListener('dblclick', () => {
            if (isDragging) return;
            initPhotosApp();
            photosScreen.classList.add('visible');
        });
        photosBackBtn.addEventListener('click', () => {
            photosScreen.classList.remove('visible');
        });
    }

    if (musicApp && musicScreen && musicBackBtn) {
        musicApp.addEventListener('dblclick', () => {
            if (isDragging) return;
            initMusicPlayer();
            musicScreen.classList.add('visible');
        });
        musicBackBtn.addEventListener('click', () => {
            stopMusicPlayer();
            musicScreen.classList.remove('visible');
        });
    }

    if (mapsApp && mapsScreen && mapsBackBtn) {
        mapsApp.addEventListener('dblclick', () => {
            if (isDragging) return;
            mapsScreen.classList.add('visible');
        });
        mapsBackBtn.addEventListener('click', () => {
            mapsScreen.classList.remove('visible');
        });
    }

    if (geminiApp && geminiScreen && geminiBackBtn) {
        geminiApp.addEventListener('dblclick', () => {
            if (isDragging) return;
            initGeminiAssistant();
            geminiScreen.classList.add('visible');
        });
        geminiBackBtn.addEventListener('click', () => {
            geminiScreen.classList.remove('visible');
        });
    }

    if (startMenuButton && startMenuScreen && startMenuBackBtn) {
        startMenuButton.addEventListener('click', () => {
            if (isDragging) return;
            playSound(clickBuffer);
            initStartMenu();
            startMenuScreen.classList.add('visible');
        });
        startMenuBackBtn.addEventListener('click', () => {
            startMenuScreen.classList.remove('visible');
        });
    }

    if (emergencyScreen && emergencyBackBtn) {
        emergencyBackBtn.addEventListener('click', () => {
            emergencyScreen.classList.remove('visible');
            startMenuScreen.classList.add('visible'); // Go back to power menu
        });
    }

    if (snakeApp && snakeScreen && snakeBackBtn) {
        snakeApp.addEventListener('dblclick', () => {
            if (isDragging) return;
            snakeScreen.classList.add('visible');
            initSnakeGame();
        });
        snakeBackBtn.addEventListener('click', () => {
            stopSnakeGame();
            snakeScreen.classList.remove('visible');
        });
    }

    if (appStoreApp && appStoreScreen && appStoreBackBtn) {
        appStoreApp.addEventListener('dblclick', () => {
            if (isDragging) return;
            appStoreScreen.classList.add('visible');
        });
        appStoreBackBtn.addEventListener('click', () => {
            appStoreScreen.classList.remove('visible');
        });
    }

    // Initial check and event listeners for wifi status
    updateWifiStatus();
    window.addEventListener('online', updateWifiStatus);
    window.addEventListener('offline', updateWifiStatus);

    // Initial check for battery status
    updateBatteryStatus();

    // Setup audio and event listeners after DOM is loaded
    // One-time audio initialization on first user interaction
    const initAudioOnInteraction = () => {
        initAudio();
        // Pre-load sounds
        loadSound('click.mp3').then(buffer => clickBuffer = buffer);
        loadSound('paint_stroke.mp3').then(buffer => paintBuffer = buffer);
        
        // Pre-load incredibox sounds (they are still used)
        loadSound('beat1.mp3');
        loadSound('beat2.mp3');
        loadSound('melody1.mp3');
        loadSound('melody2.mp3');
        loadSound('voice1.mp3');
        loadSound('effect1.mp3');
        
        // Pre-load new music
        loadSound('song1.mp3');
        loadSound('song2.mp3');
        loadSound('song3.mp3');

        document.body.removeEventListener('click', initAudioOnInteraction);
        document.body.removeEventListener('touchstart', initAudioOnInteraction);
    };
    document.body.addEventListener('click', initAudioOnInteraction, { once: true });
    document.body.addEventListener('touchstart', initAudioOnInteraction, { once: true });

    // Volume Slider
    const volumeSlider = document.getElementById('volume-slider');
    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            if (masterGain) {
                masterGain.gain.setValueAtTime(e.target.value, audioContext.currentTime);
            }
        });
    }

    // App Click Sounds
    const appIcons = document.querySelectorAll('.app-icon');
    appIcons.forEach(icon => {
        icon.addEventListener('click', (e) => {
            if (isDragging) return;
            playSound(clickBuffer);
            if (icon.classList.contains('folder')) {
                openFolder(icon);
                e.stopPropagation();
            }
        });
    });

    // --- Drag and Drop Folder Logic ---
    initDragAndDrop();

    // Initialize Airplane Mode logic
    initAirplaneMode();

    // Init power controls
    initPowerControls();
});

let isDragging = false;
let folderCounter = 0;

function initDragAndDrop() {
    const appGrid = document.querySelector('.app-grid');

    appGrid.addEventListener('dragstart', e => {
        if (e.target.classList.contains('app-icon')) {
            isDragging = true;
            setTimeout(() => e.target.classList.add('dragging'), 0);
            e.dataTransfer.setData('text/plain', e.target.id);
            e.dataTransfer.effectAllowed = 'move';
        }
    });

    appGrid.addEventListener('dragend', e => {
        if (e.target.classList.contains('app-icon')) {
            isDragging = false;
            e.target.classList.remove('dragging');
            document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
        }
    });

    appGrid.addEventListener('dragover', e => {
        const targetIcon = e.target.closest('.app-icon');
        if (targetIcon && !targetIcon.classList.contains('dragging') && !targetIcon.classList.contains('drag-over')) {
            document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
            targetIcon.classList.add('drag-over');
            e.preventDefault();
        }
    });

    appGrid.addEventListener('dragleave', e => {
        const targetIcon = e.target.closest('.app-icon');
        if (targetIcon && targetIcon.classList.contains('drag-over')) {
            targetIcon.classList.remove('drag-over');
        }
    });

    appGrid.addEventListener('drop', e => {
        e.preventDefault();
        document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));

        const draggedId = e.dataTransfer.getData('text/plain');
        const draggedEl = document.getElementById(draggedId);
        const targetEl = e.target.closest('.app-icon');

        if (targetEl && draggedEl && targetEl !== draggedEl) {
            createFolderWithApps(draggedEl, targetEl);
        }
    });
}

function createFolderWithApps(app1, app2) {
    const appGrid = document.querySelector('.app-grid');
    folderCounter++;
    
    // Create folder element
    const folder = document.createElement('div');
    folder.id = `folder-${folderCounter}`;
    folder.className = 'app-icon folder';
    folder.draggable = true;
    
    const folderPreview = document.createElement('div');
    folderPreview.className = 'app-icon-img-wrapper'; // Use wrapper for consistent sizing

    const folderName = document.createElement('span');
    folderName.textContent = 'Folder';

    folder.appendChild(folderPreview);
    folder.appendChild(folderName);
    
    // Move apps into folder's data
    folder.dataset.apps = JSON.stringify([app1.outerHTML, app2.outerHTML]);
    
    // Update preview
    updateFolderPreview(folder);
    
    // Replace the target app with the new folder
    appGrid.insertBefore(folder, app2);
    appGrid.removeChild(app1);
    appGrid.removeChild(app2);

    // Re-add event listener for the new folder
    folder.addEventListener('click', (e) => {
        if (isDragging) return;
        playSound(clickBuffer);
        openFolder(folder);
        e.stopPropagation();
    });
}

function updateFolderPreview(folderEl) {
    const folderPreview = folderEl.querySelector('.app-icon-img-wrapper');
    if (!folderPreview) return;
    folderPreview.innerHTML = '';
    
    const appsHTML = JSON.parse(folderEl.dataset.apps || '[]');
    const previewApps = appsHTML.slice(0, 4);

    previewApps.forEach(appHTML => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = appHTML;
        const img = tempDiv.querySelector('img');
        if (img) {
            folderPreview.appendChild(img.cloneNode(true));
        }
    });
}

function openFolder(folderEl) {
    const folderView = document.getElementById('folder-view');
    const folderGrid = document.getElementById('folder-apps-grid');
    folderGrid.innerHTML = '';

    const appsHTML = JSON.parse(folderEl.dataset.apps || '[]');
    appsHTML.forEach(appHTML => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = appHTML.trim();
        const appNode = tempDiv.firstChild;
        if(appNode) {
            // Make sure the app is not draggable inside the folder
            appNode.draggable = false;
            // Re-attach dblclick listener logic
            appNode.addEventListener('dblclick', () => {
                const originalApp = document.getElementById(appNode.id);
                if (originalApp) {
                     originalApp.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
                }
                folderView.classList.remove('visible');
            });
            folderGrid.appendChild(appNode);
        }
    });

    folderView.classList.add('visible');
    
    const closeFolder = (e) => {
        if (e.target === folderView) { // Only close if clicking on the background
            folderView.classList.remove('visible');
            folderView.removeEventListener('click', closeFolder);
        }
    };
    folderView.addEventListener('click', closeFolder);
}

let paintInitialized = false;

function initPaint() {
    if (paintInitialized) return;
    paintInitialized = true;

    const canvas = document.getElementById('paint-canvas');
    const ctx = canvas.getContext('2d');
    const paintArea = document.querySelector('.paint-area');

    const colorPicker = document.getElementById('color-picker');
    const brushSize = document.getElementById('brush-size');
    const clearBtn = document.getElementById('clear-canvas-btn');
    const imageLoader = document.getElementById('image-loader');

    let painting = false;

    function resizeCanvas() {
        canvas.width = paintArea.clientWidth;
        canvas.height = paintArea.clientHeight;
        ctx.fillStyle = '#1c1c1e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    window.addEventListener('resize', resizeCanvas); // Adjust if phone size changes
    resizeCanvas(); // Initial size

    function startPosition(e) {
        e.preventDefault();
        painting = true;
        playSound(paintBuffer, 0.5); // Play paint sound on starting a stroke
        draw(e);
    }

    function endPosition() {
        painting = false;
        ctx.beginPath();
    }

    function getMousePos(canvas, evt) {
        const rect = canvas.getBoundingClientRect();
        const clientX = evt.clientX || (evt.touches && evt.touches[0].clientX);
        const clientY = evt.clientY || (evt.touches && evt.touches[0].clientY);
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    function draw(e) {
        if (!painting) return;
        
        e.preventDefault();
        
        const { x, y } = getMousePos(canvas, e);

        ctx.lineWidth = brushSize.value;
        ctx.lineCap = 'round';
        ctx.strokeStyle = colorPicker.value;

        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    }

    canvas.addEventListener('mousedown', startPosition);
    canvas.addEventListener('mouseup', endPosition);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseleave', endPosition);

    canvas.addEventListener('touchstart', startPosition);
    canvas.addEventListener('touchend', endPosition);
    canvas.addEventListener('touchmove', draw);

    clearBtn.addEventListener('click', () => {
        ctx.fillStyle = '#1c1c1e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    });

    imageLoader.addEventListener('change', (e) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                // Scale image to fit canvas while maintaining aspect ratio
                const hRatio = canvas.width / img.width;
                const vRatio = canvas.height / img.height;
                const ratio = Math.min(hRatio, vRatio, 1);
                const centerShift_x = (canvas.width - img.width * ratio) / 2;
                const centerShift_y = (canvas.height - img.height * ratio) / 2;
                ctx.drawImage(img, 0, 0, img.width, img.height,
                              centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);
            }
            img.src = event.target.result;
        }
        if (e.target.files[0]) {
            reader.readAsDataURL(e.target.files[0]);
        }
        e.target.value = ''; // Reset input so same file can be loaded again
    });

    // To ensure canvas is sized correctly when the screen becomes visible
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class' && document.getElementById('paint-screen').classList.contains('visible')) {
                resizeCanvas();
            }
        });
    });
    observer.observe(document.getElementById('paint-screen'), { attributes: true });
}

let clockInterval;

function startClockScreen() {
    const timeDisplay = document.getElementById('clock-time-display');
    const dateDisplay = document.getElementById('clock-date-display');

    function update() {
        if (!timeDisplay || !dateDisplay) return;
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        timeDisplay.textContent = `${hours}:${minutes}:${seconds}`;

        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateDisplay.textContent = now.toLocaleDateString(undefined, options);
    }
    
    stopClockScreen(); // Clear any existing interval
    update();
    clockInterval = setInterval(update, 1000);
}

function stopClockScreen() {
    clearInterval(clockInterval);
}

let calcInitialized = false;

function initCalculator() {
    if (calcInitialized) return;
    calcInitialized = true;

    const expressionDiv = document.getElementById('calc-expression');
    const resultDiv = document.getElementById('calc-result');
    const buttons = document.querySelector('.calculator-buttons');
    const modeBtn = document.getElementById('calc-mode');
    
    let expression = '';
    let isRad = true;

    buttons.addEventListener('click', (e) => {
        if (!e.target.classList.contains('calc-btn')) return;

        const btn = e.target;
        const value = btn.textContent;
        
        playSound(clickBuffer, 0.7);

        if (btn.id === 'calc-clear') {
            expression = '';
            resultDiv.textContent = '0';
        } else if (btn.id === 'calc-del') {
            if (expression.endsWith('(')) {
                // handles cases like sin(, log(, etc.
                const match = expression.match(/(sin|cos|tan|ln|log|√|arcsin|arccos|arctan)\($/);
                if (match) {
                    expression = expression.slice(0, -match[0].length);
                } else {
                    expression = expression.slice(0, -1);
                }
            } else {
                expression = expression.slice(0, -1);
            }
        } else if (btn.id === 'calc-equals') {
            try {
                if (expression === '') {
                    resultDiv.textContent = '0';
                    return;
                }
                const result = evaluateExpression(expression, isRad);
                resultDiv.textContent = Number.isFinite(result) ? result : 'Error';
                expression = '';
            } catch (error) {
                console.error("Calc Error:", error);
                resultDiv.textContent = 'Error';
                expression = '';
            }
        } else if (btn.id === 'calc-mode') {
            isRad = !isRad;
            btn.textContent = isRad ? 'RAD' : 'DEG';
        } else if (['sin', 'cos', 'tan', 'ln', 'log', '√', 'arcsin', 'arccos', 'arctan'].includes(value)) {
             expression += `${value}(`;
        } else {
            expression += value;
        }

        expressionDiv.textContent = expression.replace(/×/g, '*').replace(/÷/g, '/');
    });

    function factorial(n) {
        if (n < 0) return NaN;
        if (n === 0) return 1;
        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }

    function evaluateExpression(expr, isRadMode) {
        // Pre-process for factorial
        expr = expr.replace(/(\d+)!/g, (match, n) => factorial(parseInt(n)));
        
        // Pre-process for percent
        expr = expr.replace(/(\d+(\.\d+)?)%/g, '($1/100)');

        const sanitizedExpr = expr
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/\^/g, '**')
            .replace(/π/g, 'Math.PI')
            .replace(/√\(/g, 'Math.sqrt(')
            .replace(/log\(/g, 'Math.log10(')
            .replace(/ln\(/g, 'Math.log(')
            .replace(/arcsin\(/g, 'Math.asin(')
            .replace(/arccos\(/g, 'Math.acos(')
            .replace(/arctan\(/g, 'Math.atan(');

        // Angle conversion for trig functions
        const trigPattern = /(sin|cos|tan)\(([^)]+)\)/g;
        const finalExpr = sanitizedExpr.replace(trigPattern, (match, func, angleExpr) => {
            let angle = new Function(`return ${angleExpr}`)();
            if (!isRadMode) { // convert DEG to RAD if in DEG mode
                angle = angle * Math.PI / 180;
            }
            return `Math.${func}(${angle})`;
        });

        // Use Function constructor for safer evaluation than direct eval()
        return new Function('return ' + finalExpr)();
    }
}

function initCalendar() {
    const monthYearEl = document.getElementById('calendar-month-year');
    const gridBodyEl = document.getElementById('calendar-grid-body');

    const today = new Date();
    const month = today.getMonth();
    const year = today.getFullYear();

    // Set month and year header
    monthYearEl.textContent = today.toLocaleString('default', { month: 'long', year: 'numeric' });

    // Clear previous grid
    gridBodyEl.innerHTML = '';

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Add empty cells for days before the 1st
    for (let i = 0; i < firstDayOfMonth; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.classList.add('calendar-day', 'other-month');
        gridBodyEl.appendChild(emptyCell);
    }

    // Add day cells for the current month
    for (let i = 1; i <= daysInMonth; i++) {
        const dayCell = document.createElement('div');
        dayCell.classList.add('calendar-day');
        dayCell.textContent = i;
        if (i === today.getDate()) {
            dayCell.classList.add('today');
        }
        gridBodyEl.appendChild(dayCell);
    }
}

let freqPlayerInitialized = false;
let frequencyOscillator = null;

function stopFrequencyPlayer() {
    if (frequencyOscillator) {
        frequencyOscillator.stop();
        frequencyOscillator.disconnect();
        frequencyOscillator = null;
        document.getElementById('play-stop-btn').textContent = 'Play';
        document.getElementById('play-stop-btn').classList.remove('playing');
    }
}

function initFrequencyPlayer() {
    if (freqPlayerInitialized) return;
    freqPlayerInitialized = true;

    const playStopBtn = document.getElementById('play-stop-btn');
    const freqSlider = document.getElementById('freq-slider');
    const freqDisplay = document.getElementById('freq-display');
    const waveformSelector = document.querySelector('.waveform-selector');
    
    let currentWaveform = 'sine';

    waveformSelector.addEventListener('click', (e) => {
        if (e.target.classList.contains('waveform-btn')) {
            // Remove active class from all buttons
            waveformSelector.querySelectorAll('.waveform-btn').forEach(btn => btn.classList.remove('active'));
            // Add active class to the clicked one
            e.target.classList.add('active');
            currentWaveform = e.target.dataset.wave;
            
            if (frequencyOscillator) {
                frequencyOscillator.type = currentWaveform;
            }
        }
    });

    freqSlider.addEventListener('input', () => {
        const freq = freqSlider.value;
        freqDisplay.textContent = `${freq} Hz`;
        if (frequencyOscillator) {
            frequencyOscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
        }
    });

    playStopBtn.addEventListener('click', () => {
        if (!audioContext) {
            console.error("Audio context not ready");
            return;
        }
         if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        if (frequencyOscillator) {
            // It's playing, so stop it
            stopFrequencyPlayer();
        } else {
            // It's stopped, so play it
            frequencyOscillator = audioContext.createOscillator();
            frequencyOscillator.type = currentWaveform;
            frequencyOscillator.frequency.setValueAtTime(freqSlider.value, audioContext.currentTime);
            
            frequencyOscillator.connect(masterGain);
            frequencyOscillator.start();
            
            playStopBtn.textContent = 'Stop';
            playStopBtn.classList.add('playing');

            // When the oscillator actually ends (e.g., if we set a duration, which we don't, but good practice)
            frequencyOscillator.onended = () => {
                if(frequencyOscillator && !frequencyOscillator.stopTime) { // Ensure it wasn't stopped manually
                    stopFrequencyPlayer();
                }
            };
        }
    });
}

let browserInitialized = false;

function initBrowser() {
    if (browserInitialized) return;
    browserInitialized = true;

    const reloadBtn = document.getElementById('browser-reload-btn');
    const goBtn = document.getElementById('browser-go-btn');
    const urlInput = document.getElementById('browser-url-input');
    const iframe = document.getElementById('browser-iframe');

    reloadBtn.addEventListener('click', () => {
        iframe.src = iframe.src; // Simple way to reload
    });

    const navigate = () => {
        let url = urlInput.value.trim();
        if (!url) return;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        // Use a CORS proxy for sites that block iframe embedding
        iframe.src = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    };

    goBtn.addEventListener('click', navigate);
    urlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            navigate();
        }
    });
}

let cameraInitialized = false;
let mediaStream = null;
let currentFacingMode = 'environment'; // 'environment' for back, 'user' for front

async function initCamera() {
    if (cameraInitialized) {
        // If already initialized, just try to start the stream again
        await startCameraStream();
        return;
    }
    cameraInitialized = true;

    const video = document.getElementById('camera-feed');
    const shutterBtn = document.getElementById('shutter-btn');
    const canvas = document.getElementById('camera-canvas');
    const flipBtn = document.getElementById('flip-camera-btn');

    await startCameraStream();

    flipBtn.addEventListener('click', async () => {
        playSound(clickBuffer, 0.7);
        currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
        await startCameraStream(); // Restart stream with new facing mode
    });

    shutterBtn.addEventListener('click', () => {
        if (!mediaStream) return;
        playSound(clickBuffer, 0.8); // Use the camera click sound
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const dataUrl = canvas.toDataURL('image/png');
        
        // Add photo to gallery
        addPhotoToGallery(dataUrl);

        const link = document.createElement('a');
        link.href = dataUrl;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        link.download = `photo-${timestamp}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}

async function startCameraStream() {
    const video = document.getElementById('camera-feed');
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
            stopCamera(); // Stop any existing stream first
            mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: currentFacingMode }
            });
            video.srcObject = mediaStream;
        } catch (err) {
            console.error(`Error accessing ${currentFacingMode} camera:`, err);
            // Fallback to the other camera if preferred one fails
            try {
                currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
                mediaStream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: currentFacingMode }
                });
                video.srcObject = mediaStream;
            } catch (err2) {
                console.error("Error accessing any camera:", err2);
                alert("Could not access camera. Please check permissions.");
            }
        }
    } else {
        alert("Camera not supported on this device/browser.");
    }
}

function stopCamera() {
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
        const video = document.getElementById('camera-feed');
        if (video) video.srcObject = null;
    }
}

let appDrawerInitialized = false;

function initAppDrawer() {
    if (appDrawerInitialized) return;
    appDrawerInitialized = true;

    const appDrawerList = document.getElementById('app-drawer-list');
    const allAppIcons = [...document.querySelectorAll('.app-grid .app-icon')];
    
    const apps = allAppIcons.map(icon => {
        const span = icon.querySelector('span');
        return {
            id: icon.id,
            name: span ? span.textContent : '',
        };
    }).filter(app => app.name); // Filter out any icons without names

    apps.sort((a, b) => a.name.localeCompare(b.name));

    appDrawerList.innerHTML = ''; // Clear previous list

    apps.forEach(app => {
        const item = document.createElement('div');
        item.className = 'app-drawer-item';
        item.innerHTML = `<img src="${app.imgSrc}" alt="${app.name}"><span>${app.name}</span>`;
        
        item.addEventListener('click', () => {
            playSound(clickBuffer);
            const appElement = document.getElementById(app.id);
            if (appElement) {
                appElement.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
                // Close the drawer after opening an app
                document.getElementById('app-drawer-screen').classList.remove('visible');
            }
        });
        appDrawerList.appendChild(item);
    });
}

// --- New App Initializers ---

let notesInitialized = false;
function initNotes() {
    if (notesInitialized) return;
    notesInitialized = true;

    const notesTextarea = document.getElementById('notes-textarea');
    
    // Load saved note
    notesTextarea.value = localStorage.getItem('gemini-notes') || '';

    // Save note on input
    notesTextarea.addEventListener('input', () => {
        localStorage.setItem('gemini-notes', notesTextarea.value);
    });
}

let tictactoeInitialized = false;
function initTicTacToe() {
    if (tictactoeInitialized) return;
    tictactoeInitialized = true;

    const statusDisplay = document.getElementById('tictactoe-status');
    const grid = document.getElementById('tictactoe-grid');
    const cells = document.querySelectorAll('.tictactoe-cell');
    const restartBtn = document.getElementById('tictactoe-restart-btn');

    let board = ["", "", "", "", "", "", "", "", ""];
    let currentPlayer = "X";
    let gameActive = true;

    const winningConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    const handleResultValidation = () => {
        let roundWon = false;
        let winningCombo = [];
        for (let i = 0; i < winningConditions.length; i++) {
            const winCondition = winningConditions[i];
            const a = board[winCondition[0]];
            const b = board[winCondition[1]];
            const c = board[winCondition[2]];
            if (a === '' || b === '' || c === '') continue;
            if (a === b && b === c) {
                roundWon = true;
                winningCombo = winCondition;
                break;
            }
        }

        if (roundWon) {
            statusDisplay.textContent = `Player ${currentPlayer} has won!`;
            gameActive = false;
            winningCombo.forEach(index => cells[index].classList.add('win'));
            return;
        }

        if (!board.includes("")) {
            statusDisplay.textContent = `Game ended in a draw!`;
            gameActive = false;
            return;
        }

        currentPlayer = currentPlayer === "X" ? "O" : "X";
        statusDisplay.textContent = `Player ${currentPlayer}'s turn`;
    };

    const handleCellClick = (e) => {
        const clickedCell = e.target;
        const clickedCellIndex = parseInt(clickedCell.getAttribute('data-index'));

        if (board[clickedCellIndex] !== "" || !gameActive) {
            return;
        }

        board[clickedCellIndex] = currentPlayer;
        clickedCell.textContent = currentPlayer;
        clickedCell.classList.add(currentPlayer.toLowerCase());
        playSound(clickBuffer, 0.7);

        handleResultValidation();
    };
    
    const handleRestartGame = () => {
        board = ["", "", "", "", "", "", "", "", ""];
        gameActive = true;
        currentPlayer = "X";
        statusDisplay.textContent = `Player ${currentPlayer}'s turn`;

        cells.forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('x', 'o', 'win');
        });
    };

    cells.forEach(cell => cell.addEventListener('click', handleCellClick));
    restartBtn.addEventListener('click', handleRestartGame);
    
    // Call restart to set initial state when app opens
    handleRestartGame();
}

let flashlightInitialized = false;
function initFlashlight() {
    if (flashlightInitialized) return;
    flashlightInitialized = true;

    const toggleBtn = document.getElementById('flashlight-toggle-btn');
    const content = document.getElementById('flashlight-content');
    const text = document.getElementById('flashlight-text');

    toggleBtn.addEventListener('click', () => {
        const isOn = content.classList.toggle('on');
        toggleBtn.classList.toggle('on');
        text.classList.toggle('on');
        text.textContent = isOn ? 'Tap to turn off' : 'Tap to turn on';
        playSound(clickBuffer, isOn ? 0.8 : 0.6);
    });
}

function turnOffFlashlight() {
    const toggleBtn = document.getElementById('flashlight-toggle-btn');
    const content = document.getElementById('flashlight-content');
    const text = document.getElementById('flashlight-text');
    
    content.classList.remove('on');
    toggleBtn.classList.remove('on');
    text.classList.remove('on');
    text.textContent = 'Tap to turn on';
}

// --- Snake Game ---
let snakeGameInitialized = false;
let snakeGameInterval;

function stopSnakeGame() {
    clearInterval(snakeGameInterval);
}

function initSnakeGame() {
    if (snakeGameInitialized) {
        // If already initialized, just restart the game logic
        const restartBtn = document.getElementById('snake-restart-btn');
        if(restartBtn) restartBtn.click();
        return;
    }
    snakeGameInitialized = true;

    const canvas = document.getElementById('snake-canvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('snake-score');
    const gameOverElement = document.getElementById('snake-game-over');
    const restartBtn = document.getElementById('snake-restart-btn');
    const gameArea = document.querySelector('.snake-game-area');
    const peaceModeBtn = document.getElementById('snake-peace-mode-btn');
    const colorPicker = document.getElementById('snake-color-picker');
    const dpad = {
        up: document.getElementById('snake-btn-up'),
        down: document.getElementById('snake-btn-down'),
        left: document.getElementById('snake-btn-left'),
        right: document.getElementById('snake-btn-right'),
    };

    const gridSize = 20;
    let tileCountX, tileCountY;
    
    let snake, food, direction, score, gameOver, peaceMode, snakeColor;
    const foodImage = new Image();
    let foodImageLoaded = false;

    foodImage.src = 'snake_apple.png';
    foodImage.onload = () => {
        foodImageLoaded = true;
    };

    function resizeCanvas() {
        canvas.width = gameArea.clientWidth;
        canvas.height = gameArea.clientHeight;
        tileCountX = Math.floor(canvas.width / gridSize);
        tileCountY = Math.floor(canvas.height / gridSize);
    }
    window.addEventListener('resize', resizeCanvas);

    function setupGame() {
        resizeCanvas();
        gameOver = false;
        gameOverElement.style.display = 'none';
        score = 0;
        scoreElement.textContent = `Score: ${score}`;
        peaceMode = false;
        peaceModeBtn.textContent = 'Peace: OFF';
        peaceModeBtn.classList.remove('active');
        direction = { x: 1, y: 0 }; // Start moving right
        snake = [{ x: Math.floor(tileCountX / 2), y: Math.floor(tileCountY / 2) }];
        snakeColor = colorPicker.value;
        placeFood();
        stopSnakeGame();
        snakeGameInterval = setInterval(gameLoop, 100); // Game speed
    }

    function placeFood() {
        food = {
            x: Math.floor(Math.random() * tileCountX),
            y: Math.floor(Math.random() * tileCountY)
        };
        // Ensure food is not placed on the snake
        for (let segment of snake) {
            if (segment.x === food.x && segment.y === food.y) {
                placeFood();
                break;
            }
        }
    }

    function gameLoop() {
        if (gameOver) {
            stopSnakeGame();
            gameOverElement.style.display = 'flex';
            return;
        }

        update();
        draw();
    }

    function update() {
        const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

        // Wall collision
        if (peaceMode) {
            // Peace mode: wrap around walls
            if (head.x < 0) head.x = tileCountX - 1;
            else if (head.x >= tileCountX) head.x = 0;
            if (head.y < 0) head.y = tileCountY - 1;
            else if (head.y >= tileCountY) head.y = 0;
        } else if (head.x < 0 || head.x >= tileCountX || head.y < 0 || head.y >= tileCountY) {
            gameOver = true;
            return;
        }

        // Self collision
        if (!peaceMode) {
            for (let i = 1; i < snake.length; i++) {
                if (head.x === snake[i].x && head.y === snake[i].y) {
                    gameOver = true;
                    return;
                }
            }
        }

        snake.unshift(head);

        // Food collision
        if (head.x === food.x && head.y === food.y) {
            score++;
            scoreElement.textContent = `Score: ${score}`;
            placeFood();
        } else {
            snake.pop();
        }
    }

    function draw() {
        // Background
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Food
        if (foodImageLoaded) {
            ctx.drawImage(foodImage, food.x * gridSize, food.y * gridSize, gridSize, gridSize);
        } else {
            // Fallback if image fails to load
            ctx.fillStyle = '#ff3b30'; // Red
            ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);
        }

        // Snake
        ctx.fillStyle = snakeColor;
        snake.forEach(segment => {
            ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2);
        });
    }

    function changeDirection(e) {
        const key = e.key;
        // Prevent 180-degree turns
        if ((key === 'ArrowUp' || key === 'w') && direction.y === 0) {
            direction = { x: 0, y: -1 };
        } else if ((key === 'ArrowDown' || key === 's') && direction.y === 0) {
            direction = { x: 0, y: 1 };
        } else if ((key === 'ArrowLeft' || key === 'a') && direction.x === 0) {
            direction = { x: -1, y: 0 };
        } else if ((key === 'ArrowRight' || key === 'd') && direction.x === 0) {
            direction = { x: 1, y: 0 };
        }
    }

    document.addEventListener('keydown', changeDirection);
    restartBtn.addEventListener('click', setupGame);
    
    peaceModeBtn.addEventListener('click', () => {
        peaceMode = !peaceMode;
        peaceModeBtn.textContent = `Peace: ${peaceMode ? 'ON' : 'OFF'}`;
        peaceModeBtn.classList.toggle('active', peaceMode);
    });

    colorPicker.addEventListener('input', (e) => {
        snakeColor = e.target.value;
    });

    dpad.up.addEventListener('click', () => { if (direction.y === 0) direction = { x: 0, y: -1 }; });
    dpad.down.addEventListener('click', () => { if (direction.y === 0) direction = { x: 0, y: 1 }; });
    dpad.left.addEventListener('click', () => { if (direction.x === 0) direction = { x: -1, y: 0 }; });
    dpad.right.addEventListener('click', () => { if (direction.x === 0) direction = { x: 1, y: 0 }; });

    setupGame();
}

// --- Incredibox ---
let incrediboxInitialized = false;
const incrediboxState = {}; // { characterId: { sound: 'beat1', sourceNode: <AudioNode> }, ... }

function stopIncredibox() {
    Object.values(incrediboxState).forEach(state => {
        if (state.sourceNode) {
            state.sourceNode.stop();
        }
    });
    // Clear state
    for (const key in incrediboxState) {
        delete incrediboxState[key];
    }
}

async function initIncredibox() {
    if (incrediboxInitialized) return;
    incrediboxInitialized = true;

    const stage = document.getElementById('incredibox-stage');
    const soundTray = document.getElementById('incredibox-sound-tray');

    const NUM_CHARACTERS = 5;
    const sounds = {
        Beats: [{ id: 'beat1', icon: 'icon-beat.png'}, { id: 'beat2', icon: 'icon-beat.png'}],
        Melodies: [{ id: 'melody1', icon: 'icon-melody.png'}, { id: 'melody2', icon: 'icon-melody.png'}],
        Voices: [{ id: 'voice1', icon: 'icon-voice.png'}],
        Effects: [{ id: 'effect1', icon: 'icon-effects.png'}]
    };

    // Populate stage with characters
    stage.innerHTML = '';
    for (let i = 0; i < NUM_CHARACTERS; i++) {
        const charWrapper = document.createElement('div');
        charWrapper.className = 'incredibox-character';
        charWrapper.dataset.id = i;
        charWrapper.innerHTML = `
            <img src="incredibox-character.png" class="idle-char-img" alt="Character ${i+1}">
            <img src="incredibox-character-active.png" class="active-char-img" alt="Active Character ${i+1}">
        `;
        stage.appendChild(charWrapper);

        charWrapper.addEventListener('click', () => {
            removeSoundFromCharacter(i);
        });
    }

    // Populate sound tray
    soundTray.innerHTML = '';
    for (const category in sounds) {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'incredibox-sound-category';
        
        const title = document.createElement('h3');
        title.textContent = category;
        categoryDiv.appendChild(title);

        const soundsDiv = document.createElement('div');
        soundsDiv.className = 'incredibox-sounds';

        sounds[category].forEach(sound => {
            const soundEl = document.createElement('div');
            soundEl.className = 'incredibox-sound';
            soundEl.id = `sound-${sound.id}`;
            soundEl.dataset.soundId = sound.id;
            soundEl.draggable = true;
            soundEl.style.backgroundImage = `url(${sound.icon})`;
            soundsDiv.appendChild(soundEl);
        });
        categoryDiv.appendChild(soundsDiv);
        soundTray.appendChild(categoryDiv);
    }

    // Drag and Drop Logic
    soundTray.addEventListener('dragstart', e => {
        if (e.target.classList.contains('incredibox-sound')) {
            e.target.classList.add('dragging');
            e.dataTransfer.setData('text/plain', e.target.dataset.soundId);
            e.dataTransfer.effectAllowed = 'copy';
        }
    });

    soundTray.addEventListener('dragend', e => {
        if (e.target.classList.contains('incredibox-sound')) {
            e.target.classList.remove('dragging');
        }
    });

    stage.addEventListener('dragover', e => {
        e.preventDefault();
        const targetChar = e.target.closest('.incredibox-character');
        if (targetChar) {
            document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
            targetChar.classList.add('drag-over');
        }
    });
    
    stage.addEventListener('dragleave', e => {
        const targetChar = e.target.closest('.incredibox-character');
        if (targetChar) {
            targetChar.classList.remove('drag-over');
        }
    });

    stage.addEventListener('drop', e => {
        e.preventDefault();
        document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
        const targetCharEl = e.target.closest('.incredibox-character');
        const soundId = e.dataTransfer.getData('text/plain');

        if (targetCharEl && soundId) {
            const charId = targetCharEl.dataset.id;
            addSoundToCharacter(soundId, charId);
        }
    });
}

async function addSoundToCharacter(soundId, charId) {
    if (!audioContext) initAudio();
    if (audioContext.state === 'suspended') await audioContext.resume();
    
    // If character already has a sound, remove it first
    if (incrediboxState[charId]) {
        removeSoundFromCharacter(charId);
    }
    
    const buffer = await loadSound(`${soundId}.mp3`);
    if (!buffer) {
        console.error(`Could not load sound buffer for ${soundId}`);
        return;
    }

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(masterGain);
    source.start(0);

    incrediboxState[charId] = { sound: soundId, sourceNode: source };

    // Update UI
    document.querySelector(`.incredibox-character[data-id='${charId}']`).classList.add('active');
    document.getElementById(`sound-${soundId}`).classList.add('in-use');
}

function removeSoundFromCharacter(charId) {
    const state = incrediboxState[charId];
    if (state) {
        // Stop the sound
        state.sourceNode.stop();
        
        // Update UI
        document.querySelector(`.incredibox-character[data-id='${charId}']`).classList.remove('active');
        document.getElementById(`sound-${state.sound}`).classList.remove('in-use');

        // Remove from state
        delete incrediboxState[charId];
    }
}

// --- Voice Recorder ---
let voiceRecorderInitialized = false;
let mediaRecorder;
let audioChunks = [];
let recordingTimerInterval;
let recordingStartTime;

function stopVoiceRecorder() {
    // Stop any active recording
    if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
    }
    // Stop the timer
    clearInterval(recordingTimerInterval);
}

function initVoiceRecorder() {
    if (voiceRecorderInitialized) return;
    voiceRecorderInitialized = true;

    const recordBtn = document.getElementById('record-btn');
    const timerDisplay = document.getElementById('record-timer');
    const recordingList = document.getElementById('recording-list');
    const tabRecord = document.getElementById('tab-record');
    const tabTts = document.getElementById('tab-tts');
    const recordPanel = document.getElementById('record-panel');
    const ttsPanel = document.getElementById('tts-panel');
    const ttsInput = document.getElementById('tts-input');
    const ttsGenerateBtn = document.getElementById('tts-generate-btn');
    const ttsAudioPlayer = document.getElementById('tts-audio-player');
    const ttsVoiceSelect = document.getElementById('tts-voice-select');

    // Tab switching logic
    tabRecord.addEventListener('click', () => {
        tabRecord.classList.add('active');
        tabTts.classList.remove('active');
        recordPanel.classList.add('active');
        ttsPanel.classList.remove('active');
    });

    tabTts.addEventListener('click', () => {
        tabTts.classList.add('active');
        tabRecord.classList.remove('active');
        ttsPanel.classList.add('active');
        recordPanel.classList.remove('active');
    });

    // Voice Recording Logic
    recordBtn.addEventListener('click', async () => {
        if (!audioContext) initAudio();
        if (audioContext.state === 'suspended') await audioContext.resume();
        
        if (mediaRecorder && mediaRecorder.state === "recording") {
            mediaRecorder.stop();
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.start();

                audioChunks = [];
                mediaRecorder.addEventListener("dataavailable", event => {
                    audioChunks.push(event.data);
                });

                mediaRecorder.addEventListener("stop", () => {
                    recordBtn.classList.remove('recording');
                    recordBtn.textContent = '🎤';
                    clearInterval(recordingTimerInterval);
                    timerDisplay.textContent = "00:00";

                    const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' }); // Name as mp3
                    const audioUrl = URL.createObjectURL(audioBlob);
                    
                    addRecordingToList(audioUrl);
                    
                    // Stop all media tracks to turn off the mic indicator
                    stream.getTracks().forEach(track => track.stop());
                });

                recordBtn.classList.add('recording');
                recordBtn.textContent = '⏹️';
                startTimer();

            } catch (err) {
                console.error("Error accessing microphone:", err);
                alert("Could not access microphone. Please check permissions.");
            }
        }
    });

    function startTimer() {
        recordingStartTime = Date.now();
        recordingTimerInterval = setInterval(() => {
            const elapsedTime = Date.now() - recordingStartTime;
            const totalSeconds = Math.floor(elapsedTime / 1000);
            const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
            const seconds = String(totalSeconds % 60).padStart(2, '0');
            timerDisplay.textContent = `${minutes}:${seconds}`;
        }, 1000);
    }

    function addRecordingToList(audioUrl) {
        const recordingItem = document.createElement('div');
        recordingItem.className = 'recording-item';
        
        const audio = new Audio(audioUrl);
        audio.controls = true;

        const downloadLink = document.createElement('a');
        downloadLink.href = audioUrl;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        downloadLink.download = `recording-${timestamp}.mp3`;
        downloadLink.textContent = '💾';
        downloadLink.title = 'Save';

        recordingItem.appendChild(audio);
        recordingItem.appendChild(downloadLink);
        recordingList.insertBefore(recordingItem, recordingList.firstChild);
    }

    // Text-to-Speech Logic
    ttsGenerateBtn.addEventListener('click', async () => {
        const text = ttsInput.value.trim();
        const voice = ttsVoiceSelect.value;
        if (!text) {
            alert('Please enter some text.');
            return;
        }

        ttsGenerateBtn.disabled = true;
        ttsGenerateBtn.textContent = 'Generating...';

        try {
            if (!audioContext) initAudio();
             if (audioContext.state === 'suspended') await audioContext.resume();
            
            const result = await websim.textToSpeech({ text, voice });
            const audioUrl = result.url;

            ttsAudioPlayer.innerHTML = ''; // Clear previous
            const ttsResultDiv = document.createElement('div');
            ttsResultDiv.className = 'tts-result';

            const audio = new Audio(audioUrl);
            audio.controls = true;
            audio.autoplay = true;

            const downloadLink = document.createElement('a');
            downloadLink.href = audioUrl;
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            downloadLink.download = `tts-${timestamp}.mp3`;
            downloadLink.textContent = '💾';
            downloadLink.title = 'Save';
            
            ttsResultDiv.appendChild(audio);
            ttsResultDiv.appendChild(downloadLink);
            ttsAudioPlayer.appendChild(ttsResultDiv);

        } catch (error) {
            console.error('Error generating speech:', error);
            alert('Failed to generate speech. Please try again.');
            ttsAudioPlayer.innerHTML = `<p style="color: #ff30;">Error generating audio.</p>`;
        } finally {
            ttsGenerateBtn.disabled = false;
            ttsGenerateBtn.textContent = 'Generate';
        }
    });
}

let isAirplaneModeActive = false;

function setAirplaneMode(isOn, playSoundEffect) {
    const toggle = document.getElementById('airplane-mode-toggle');
    const phone = document.querySelector('.phone');
    const wifiSettingItem = document.querySelector('.wifi-setting-item');
    const airplaneModeStatus = document.getElementById('airplane-mode-status');
    
    isAirplaneModeActive = isOn;
    
    if (toggle && toggle.checked !== isOn) {
        toggle.checked = isOn;
    }
    
    if (phone) phone.classList.toggle('airplane-mode-on', isOn);
    
    if (wifiSettingItem) {
        wifiSettingItem.classList.toggle('disabled', isOn);
    }

    if (airplaneModeStatus) {
        airplaneModeStatus.textContent = isOn ? 'enabled' : 'disabled';
    }
    
    localStorage.setItem('airplaneMode', isOn);

    if (playSoundEffect) {
        playSound(clickBuffer);
    }

    // This will trigger a UI update for wifi status and icons
    updateWifiStatus(); 
}

function initAirplaneMode() {
    const toggle = document.getElementById('airplane-mode-toggle');
    if (!toggle) return;

    // Load state from storage on init
    const savedState = localStorage.getItem('airplaneMode') === 'true';
    setAirplaneMode(savedState, false); // Don't play sound on initial load

    toggle.addEventListener('change', (e) => {
        setAirplaneMode(e.target.checked, true);
    });
}

function addPhotoToGallery(imageDataUrl) {
    let galleryItems = JSON.parse(localStorage.getItem('galleryItems') || '[]');
    // Avoid duplicates
    if (!galleryItems.includes(imageDataUrl)) {
        galleryItems.unshift(imageDataUrl); // Add new photos to the beginning
        localStorage.setItem('galleryItems', JSON.stringify(galleryItems));
    }
}

let photosAppInitialized = false;

function initPhotosApp() {
    if (!photosAppInitialized) {
        // Run this part only once to set up listeners, etc.
        photosAppInitialized = true;
        // Could add fullscreen view logic here if desired
    }
    
    // Always refresh the gallery view when the app is opened
    const photoGrid = document.getElementById('photos-grid');
    const noPhotosMessage = document.getElementById('no-photos-message');
    photoGrid.innerHTML = '';

    const galleryItems = JSON.parse(localStorage.getItem('galleryItems') || '[]');

    if (galleryItems.length === 0) {
        noPhotosMessage.style.display = 'block';
    } else {
        noPhotosMessage.style.display = 'none';
        galleryItems.forEach(src => {
            const img = document.createElement('img');
            img.src = src;
            photoGrid.appendChild(img);
        });
    }
}

let musicPlayerInitialized = false;
let audioPlayer = new Audio();
let currentTrackIndex = 0;
let isPlaying = false;

let playlistData = [
    { title: 'Uplifting Pop', artist: 'Synth Surfers', src: 'song1.mp3', icon: 'icon-melody.png' },
    { title: 'Lofi Chill', artist: 'Jazzy Robot', src: 'song2.mp3', icon: 'icon-music.png' },
    { title: 'Rock Anthem', artist: 'The Power Chords', src: 'song3.mp3', icon: 'icon-beat.png' },
];

function stopMusicPlayer() {
    audioPlayer.pause();
    isPlaying = false;
}

function initMusicPlayer() {
    if (musicPlayerInitialized) return;
    musicPlayerInitialized = true;
    
    const playPauseBtn = document.getElementById('play-pause-btn');
    const nextBtn = document.getElementById('next-btn');
    const prevBtn = document.getElementById('prev-btn');
    const playlistEl = document.getElementById('playlist');
    const progressBar = document.getElementById('progress-bar');
    const progressContainer = document.querySelector('.progress-container');
    const currentTimeEl = document.getElementById('current-time');
    const totalTimeEl = document.getElementById('total-time');
    const audioUploader = document.getElementById('audio-uploader');

    function renderPlaylist() {
        // Populate playlist
        playlistEl.innerHTML = '';
        playlistData.forEach((track, index) => {
            const item = document.createElement('div');
            item.className = 'playlist-item';
            item.dataset.index = index;
            item.innerHTML = `
                <img src="${track.icon}" alt="track icon">
                <div class="track-info">
                    <strong>${track.title}</strong>
                    <br>
                    <small>${track.artist}</small>
                </div>
            `;
            item.addEventListener('click', () => {
                loadTrack(index);
                playTrack();
            });
            playlistEl.appendChild(item);
        });
    }
    
    function loadTrack(index) {
        if (index >= playlistData.length || index < 0) return;
        currentTrackIndex = index;
        const track = playlistData[index];
        audioPlayer.src = track.src;
        document.getElementById('album-art').src = track.icon;
        document.getElementById('song-title').textContent = track.title;
        document.getElementById('song-artist').textContent = track.artist;
        
        document.querySelectorAll('.playlist-item').forEach(item => item.classList.remove('playing'));
        const currentPlaylistItem = document.querySelector(`.playlist-item[data-index='${index}']`);
        if (currentPlaylistItem) {
            currentPlaylistItem.classList.add('playing');
        }
    }

    function playTrack() {
        if (!audioPlayer.src) {
             if (playlistData.length > 0) {
                loadTrack(0); // Load the first track if nothing is loaded
            } else {
                return; // No songs to play
            }
        }
        isPlaying = true;
        playPauseBtn.textContent = '⏸';
        audioPlayer.play();
    }

    function pauseTrack() {
        isPlaying = false;
        playPauseBtn.textContent = '▶';
        audioPlayer.pause();
    }

    playPauseBtn.addEventListener('click', () => {
        if (isPlaying) {
            pauseTrack();
        } else {
            playTrack();
        }
    });

    nextBtn.addEventListener('click', () => {
        currentTrackIndex = (currentTrackIndex + 1) % playlistData.length;
        loadTrack(currentTrackIndex);
        playTrack();
    });

    prevBtn.addEventListener('click', () => {
        currentTrackIndex = (currentTrackIndex - 1 + playlistData.length) % playlistData.length;
        loadTrack(currentTrackIndex);
        playTrack();
    });

    audioPlayer.addEventListener('ended', () => {
        nextBtn.click();
    });

    audioPlayer.addEventListener('timeupdate', () => {
        const { duration, currentTime } = audioPlayer;
        if (duration) {
            const progressPercent = (currentTime / duration) * 100;
            progressBar.style.width = `${progressPercent}%`;

            // Update time stamps
            totalTimeEl.textContent = formatTime(duration);
            currentTimeEl.textContent = formatTime(currentTime);
        }
    });

    progressContainer.addEventListener('click', (e) => {
        const width = progressContainer.clientWidth;
        const clickX = e.offsetX;
        const duration = audioPlayer.duration;
        if (duration) {
            audioPlayer.currentTime = (clickX / width) * duration;
        }
    });

    audioUploader.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('audio/')) {
            const fileUrl = URL.createObjectURL(file);
            const newTrack = {
                title: file.name.replace(/\.[^/.]+$/, ""), // remove extension
                artist: 'Uploaded',
                src: fileUrl,
                icon: 'icon-files.png' // generic icon for uploads
            };
            playlistData.push(newTrack);
            renderPlaylist();
            loadTrack(playlistData.length - 1);
            playTrack();
        }
        e.target.value = ''; // Reset input
    });

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${String(secs).padStart(2, '0')}`;
    }

    // Connect to master gain from audio engine
    if (audioContext && masterGain) {
        const source = audioContext.createMediaElementSource(audioPlayer);
        source.connect(masterGain);
    }
    
    renderPlaylist();
    loadTrack(0); // Load first track by default
}

let geminiInitialized = false;
let conversationHistory = [];

function initGeminiAssistant() {
    if (geminiInitialized) return;
    geminiInitialized = true;

    const chatContainer = document.getElementById('gemini-chat-container');
    const input = document.getElementById('gemini-input');
    const sendBtn = document.getElementById('gemini-send-btn');

    const addMessage = (text, sender) => {
        const messageEl = document.createElement('div');
        messageEl.className = `chat-message ${sender}-message`;
        messageEl.textContent = text;
        chatContainer.appendChild(messageEl);
        chatContainer.scrollTop = chatContainer.scrollHeight; // Scroll to bottom
    };

    const showTypingIndicator = () => {
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.id = 'typing-indicator';
        indicator.innerHTML = '<span></span><span></span><span></span>';
        chatContainer.appendChild(indicator);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    };
    
    const removeTypingIndicator = () => {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    };
    
    const sendMessage = async () => {
        const userInput = input.value.trim();
        if (userInput === '') return;

        addMessage(userInput, 'user');
        input.value = '';
        showTypingIndicator();

        const newMessage = { role: 'user', content: userInput };
        conversationHistory.push(newMessage);
        conversationHistory = conversationHistory.slice(-10); // Keep history short

        try {
            const completion = await websim.chat.completions.create({
                messages: [
                    { role: 'system', content: 'You are a helpful and friendly AI assistant running on a virtual mobile phone.' },
                    ...conversationHistory
                ],
            });
            
            removeTypingIndicator();
            const botResponse = completion.content;
            addMessage(botResponse, 'bot');
            conversationHistory.push({ role: 'assistant', content: botResponse });

        } catch (error) {
            removeTypingIndicator();
            console.error('AI Chat Error:', error);
            addMessage('Sorry, something went wrong. Please try again.', 'bot');
        }
    };

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    addMessage("Hello! I'm Gemini. How can I help you today?", 'bot');
}


let startMenuInitialized = false;

function initStartMenu() {
    if (startMenuInitialized) return;
    startMenuInitialized = true;
    // Event listeners for the buttons are now in initPowerControls
}

function initPowerControls() {
    const shutdownBtn = document.getElementById('shutdown-btn');
    const restartBtn = document.getElementById('restart-btn');
    const emergencyBtn = document.getElementById('emergency-btn');
    const overlay = document.getElementById('shutdown-overlay');

    const showOverlay = (message) => {
        overlay.textContent = message;
        overlay.classList.add('visible');
    };

    shutdownBtn.addEventListener('click', () => {
        playSound(clickBuffer);
        showOverlay('Shutting down...');
        setTimeout(() => {
            location.reload();
        }, 2000);
    });

    restartBtn.addEventListener('click', () => {
        playSound(clickBuffer);
        showOverlay('Restarting...');
        setTimeout(() => {
            location.reload();
        }, 1500);
    });

    emergencyBtn.addEventListener('click', () => {
        playSound(clickBuffer);
        document.getElementById('start-menu-screen').classList.remove('visible');
        document.getElementById('emergency-screen').classList.add('visible');
        initEmergencyDialer();
    });
}

let emergencyDialerInitialized = false;

function initEmergencyDialer() {
    if (emergencyDialerInitialized) return;
    emergencyDialerInitialized = true;

    const display = document.getElementById('emergency-display');
    const keypad = document.querySelector('.emergency-keypad');
    const callBtn = document.getElementById('emergency-call-btn');
    const deleteBtn = document.getElementById('emergency-delete-btn');

    let number = '';

    const updateDisplay = () => {
        display.textContent = number;
        deleteBtn.disabled = number.length === 0;
    };

    keypad.addEventListener('click', (e) => {
        if (e.target.classList.contains('keypad-btn')) {
            playSound(clickBuffer, 0.6);
            number += e.target.textContent;
            updateDisplay();
        }
    });

    deleteBtn.addEventListener('click', () => {
        playSound(clickBuffer, 0.6);
        number = number.slice(0, -1);
        updateDisplay();
    });

    callBtn.addEventListener('click', () => {
        if (number.length > 0) {
            playSound(clickBuffer, 0.8);
            alert(`Calling ${number}...`);
            // Reset after call attempt
            number = '';
            updateDisplay();
            document.getElementById('emergency-screen').classList.remove('visible');
        }
    });
    
    updateDisplay(); // Set initial state of delete button
}
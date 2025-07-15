let audioContext;
let clickBuffer;

async function loadClickSound() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    try {
        const response = await fetch('/click_sound.mp3');
        const arrayBuffer = await response.arrayBuffer();
        clickBuffer = await audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
        console.error('Error loading click sound:', error);
    }
}

function playClickSound() {
    if (clickBuffer && audioContext.state === 'running') {
        const source = audioContext.createBufferSource();
        source.buffer = clickBuffer;
        source.connect(audioContext.destination);
        source.start(0);
    } else if (audioContext && audioContext.state === 'suspended') {
        // Resume audio context if suspended (e.g., due to user interaction policy)
        audioContext.resume().then(() => {
            playClickSound(); // Try again after resuming
        });
    }
}

// Global data for Notes and Mail apps
let notesData = [
    { title: 'Groceries', content: '- Milk\n- Eggs\n- Bread\n- Butter\n- Apples' },
    { title: 'Meeting Ideas', content: '- Project X discussion\n- Q4 planning\n- Team feedback session\n- Brainstorm new features' },
    { title: 'Reminders', content: '- Call mom on Sunday\n- Pay bills by 15th\n- Doctor appointment on 20th' }
];

const emails = [
    { sender: 'Apple Support', subject: 'Your Apple ID has been signed in from a new device.', preview: 'If this was not you, please review your account activity immediately.', body: 'Dear Customer,\n\nYour Apple ID was used to sign in to iCloud on a new device. If this was you, you can disregard this email. If this was not you, please sign in to your Apple ID account page at appleid.apple.com to review and update your security settings.\n\nThank you,\nApple Support' },
    { sender: 'Tim Cook', subject: 'A Special Event in September', preview: 'Join us to unveil the future of iPhone and more. Save the date!', body: 'Hi Team,\n\nWe\'re thrilled to invite you to our annual Special Event, where we\'ll be announcing groundbreaking new products. Expect to see the next generation of iPhone and other exciting innovations. More details will follow soon.\n\nBest,\nTim' },
    { sender: 'Junk Mail', subject: 'YOU\'VE WON A FREE IPHONE!', preview: 'Click here to claim your prize! Limited time offer!', body: 'Congratulations! You have been selected as the winner of our exclusive iPhone giveaway! To claim your brand new iPhone, simply click on the link below and provide your personal details:\n\n[Suspicious Link Here]\n\nDo not miss out on this amazing opportunity!\n\nSincerely,\nThe "Totally Legitimate" Sweepstakes Team' }
];

const photos = [
    { src: '/sunflower_sky.jpg', title: 'Sunflower' },
    { src: 'https://images.unsplash.com/photo-1506744038136-465a7d3bb63d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w1NzI0MjZ8MHwxfHNlYXJjaHw1fHxuYXR1cmV8ZW58MHx8fHwxNzE4NzQzMDY2fDA&ixlib=rb-4.0.3&q=80&w=400', title: 'Mountain Lake' },
    { src: 'https://images.unsplash.com/photo-1542382343-4c577011961e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w1NzI0MjZ8MHwxfHNlYXJjaHw4fHxjaXR5c2NhcGV8ZW58MHx8fHwxNzE4NzQzMDY2fDA&ixlib=rb-4.0.3&q=80&w=400', title: 'Cityscape' },
    { src: 'https://images.unsplash.com/photo-1502790692550-9304bd84dd2e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w1NzI0MjZ8MHwxfHNlYXJjaHwxNHx8Y29mZmVlfGVufDB8fHx8MTcxODc0MzI1Nnww&ixlib=rb-4.0.3&q=80&w=400', title: 'Coffee Latte' }
];

const songs = [
    { title: 'Imagine', artist: 'John Lennon', album: 'Imagine' },
    { title: 'Bohemian Rhapsody', artist: 'Queen', album: 'A Night at the Opera' },
    { title: 'Hotel California', artist: 'Eagles', album: 'Hotel California' },
    { title: 'Billie Jean', artist: 'Michael Jackson', album: 'Thriller' }
];

const videos = [
    { title: 'iPhone 2007 Reveal', duration: '9:53', videoId: 'eUkZNk90rbQ' },
    { title: 'iPhone Commercial - First Look', duration: '0:30', videoId: 't0JyCdk5ymo' },
    { title: 'Hello. (iPhone Commercial)', duration: '0:30', videoId: 'npjF032TDDQ' },
    { title: 'iPhone Launch - Steve Jobs Keynote 2007', duration: '9:25', videoId: 'jNQXAC9IVRw' }
];

// Global YouTube player instance
let ytPlayer = null;

// Function called by the YouTube IFrame Player API when it's ready
window.onYouTubeIframeAPIReady = () => {
    console.log('YouTube IFrame API is ready.');
    // No action needed immediately, player will be created when Videos app opens
};

document.addEventListener('DOMContentLoaded', () => {
    const apps = [
        { name: 'Phone', icon: '/Phone_29_2007.webp' },
        { name: 'Mail', icon: '/Mail.jpg' },
        { name: 'Safari', icon: '/Safari_29_2007.webp' },
        { name: 'Notes', icon: '/notes.jpg' },
        { name: 'Calendar', icon: '/IOSCalendarApp.webp' },
        { name: 'Calculator', icon: '/IPhone_Calulator_29.webp' },
        { name: 'Settings', icon: '/settings app.jpg' },
        { name: 'Weather', icon: '/weather.jpg' },
        { name: 'Photos', icon: '/photos.jpg' },
        { name: 'iPod', icon: '/ipod.jpg' },
        { name: 'Videos', icon: '/77877f3b-2c54-44ce-aac1-28b2967567c6.jpg' },
        // Add more apps as needed, up to 16 for a full 4x4 grid
    ];

    const appGrid = document.querySelector('.app-grid');
    const appScreen = document.querySelector('.app-screen');
    const appTitle = appScreen.querySelector('.app-title');
    const appScreenContent = appScreen.querySelector('.app-screen-content');
    const homeButton = document.querySelector('.home-button');

    // Load click sound
    loadClickSound();

    apps.forEach(app => {
        const appIconDiv = document.createElement('div');
        appIconDiv.classList.add('app-icon');
        appIconDiv.dataset.appName = app.name; // Store app name for easy access

        const img = document.createElement('img');
        img.src = app.icon;
        img.alt = app.name;

        const span = document.createElement('span');
        span.textContent = app.name;

        appIconDiv.appendChild(img);
        appIconDiv.appendChild(span);
        appGrid.appendChild(appIconDiv);

        appIconDiv.addEventListener('click', () => {
            playClickSound(); // Add sound to app icon click
            appGrid.classList.add('hidden');
            appScreen.classList.remove('hidden');
            appTitle.textContent = app.name;
            renderAppContent(app.name);
        });
    });

    // Home button functionality
    homeButton.addEventListener('click', () => {
        playClickSound(); // Add sound to home button click
        if (!appScreen.classList.contains('hidden')) {
            appScreen.classList.add('hidden');
            appGrid.classList.remove('hidden');
            appScreenContent.innerHTML = ''; // Clear app content
            appTitle.textContent = ''; // Clear app title

            // If Videos app was open, destroy the YouTube player
            if (ytPlayer) {
                ytPlayer.destroy();
                ytPlayer = null;
            }
        }
    });

    // Set dynamic time in status bar
    const updateTime = () => {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 || 12; // Convert to 12-hour format
        const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
        document.querySelector('.status-bar .time').textContent = `${formattedHours}:${formattedMinutes} ${ampm}`;
    };

    updateTime();
    setInterval(updateTime, 60000); // Update every minute

    function renderAppContent(appName) {
        appScreenContent.innerHTML = ''; // Clear previous content

        // Destroy YouTube player if switching from Videos app
        if (ytPlayer && appName !== 'Videos') {
            ytPlayer.destroy();
            ytPlayer = null;
        }

        switch (appName) {
            case 'Phone':
                appScreenContent.innerHTML = `
                    <div class="dial-pad">
                        <input type="text" class="dial-input" placeholder="Enter number" readonly>
                        <div class="dial-grid">
                            <button>1</button><button>2</button><button>3</button>
                            <button>4</button><button>5</button><button>6</button>
                            <button>7</button><button>8</button><button>9</button>
                            <button class="key-star">*</button><button>0</button><button class="key-hash">#</button>
                        </div>
                        <button class="call-button">Call</button>
                    </div>
                    <div class="secret-menu hidden">
                        <h2>Secret Menu</h2>
                        <p>Welcome, developer!</p>
                        <ul class="secret-options">
                            <li data-action="debug">App Debug Info</li>
                            <li data-action="logs">System Logs</li>
                            <li data-action="reset">Reset Settings</li>
                            <li data-action="easter-egg">Discover Easter Egg</li>
                        </ul>
                        <button class="back-to-dial-pad">Back</button>
                    </div>
                `;
                const dialInput = appScreenContent.querySelector('.dial-input');
                const dialPad = appScreenContent.querySelector('.dial-pad');
                const secretMenu = appScreenContent.querySelector('.secret-menu');
                const backButton = appScreenContent.querySelector('.back-to-dial-pad');
                const callButton = appScreenContent.querySelector('.call-button');

                appScreenContent.querySelectorAll('.dial-grid button').forEach(button => {
                    button.addEventListener('click', () => {
                        playClickSound(); // Add sound to dial pad buttons
                        const digit = button.textContent;
                        dialInput.value += digit;
                        
                        // Check for secret code "*0*"
                        if (dialInput.value.includes('*0*')) {
                            dialPad.classList.add('hidden');
                            secretMenu.classList.remove('hidden');
                            dialInput.value = ''; // Clear input after triggering secret menu
                        }
                    });
                });

                callButton.addEventListener('click', () => {
                    playClickSound(); // Add sound to call button
                    if (!secretMenu.classList.contains('hidden')) {
                        // If secret menu is visible, call button should not act as a dialer
                        return;
                    }
                    if (dialInput.value) {
                        if (confirm(`Are you sure you want to call ${dialInput.value}?`)) {
                            alert(`Calling ${dialInput.value}...`);
                            dialInput.value = ''; // Clear after "call"
                        }
                    } else {
                        alert('Please enter a number to call.');
                    }
                });

                backButton.addEventListener('click', () => {
                    playClickSound(); // Add sound to back button
                    secretMenu.classList.add('hidden');
                    dialPad.classList.remove('hidden');
                    dialInput.value = ''; // Clear input when returning to dial pad
                });

                // Secret menu actions
                appScreenContent.querySelectorAll('.secret-options li').forEach(item => {
                    item.addEventListener('click', () => {
                        playClickSound(); // Add sound to secret menu options
                        const action = item.dataset.action;
                        switch (action) {
                            case 'debug':
                                alert('Displaying app debug information...');
                                break;
                            case 'logs':
                                alert('Retrieving system logs... (Please wait)');
                                break;
                            case 'reset':
                                if (confirm('Are you sure you want to reset all settings? This cannot be undone.')) {
                                    alert('Settings have been reset.');
                                }
                                break;
                            case 'easter-egg':
                                alert('You found a hidden message: "Hello from 2007!"');
                                break;
                            default:
                                alert(`Action "${action}" triggered.`);
                        }
                    });
                });
                break;
            case 'Mail':
                function renderMailList() {
                    appScreenContent.innerHTML = `
                        <div class="mail-app">
                            <div class="mail-header">Inbox (${emails.length})</div>
                            <ul class="mail-list">
                                ${emails.map((mail, index) => `
                                    <li data-mail-index="${index}">
                                        <span class="sender">${mail.sender}</span>
                                        <span class="subject">${mail.subject}</span>
                                        <span class="preview">${mail.preview}</span>
                                    </li>
                                `).join('')}
                            </ul>
                            <button class="compose-mail">Compose</button>
                        </div>
                    `;

                    appScreenContent.querySelectorAll('.mail-list li').forEach(item => {
                        item.addEventListener('click', () => {
                            playClickSound(); // Add sound to mail list items
                            const index = parseInt(item.dataset.mailIndex);
                            renderMailView(emails[index]);
                        });
                    });

                    appScreenContent.querySelector('.compose-mail').addEventListener('click', () => {
                        playClickSound(); // Add sound to compose button
                        alert('Composing a new email...');
                    });
                }

                function renderMailView(mail) {
                    appScreenContent.innerHTML = `
                        <div class="mail-view">
                            <div class="mail-view-header">
                                <button class="back-to-inbox">&lt; Inbox</button>
                                <h3>${mail.subject}</h3>
                            </div>
                            <div class="mail-view-content">
                                <p><strong>From:</strong> ${mail.sender}</p>
                                <p class="mail-body">${mail.body.replace(/\n/g, '<br>')}</p>
                            </div>
                            <div class="mail-view-actions">
                                <button>Reply</button>
                                <button>Forward</button>
                                <button>Delete</button>
                            </div>
                        </div>
                    `;
                    appScreenContent.querySelector('.back-to-inbox').addEventListener('click', () => {
                        playClickSound(); // Add sound to back to inbox button
                        renderMailList();
                    });
                    appScreenContent.querySelectorAll('.mail-view-actions button').forEach(button => {
                        button.addEventListener('click', () => {
                            playClickSound(); // Add sound to mail view action buttons
                            alert(`${button.textContent} (Simulated)`);
                        });
                    });
                }

                renderMailList();
                break;
            case 'Safari':
                appScreenContent.innerHTML = `
                    <div class="safari-app">
                        <div class="address-bar">
                            <input type="text" class="url-input" value="https://www.apple.com">
                            <button class="go-button">Go</button>
                        </div>
                        <div class="browser-content">
                            <!-- Content will be dynamically loaded here -->
                        </div>
                    </div>
                `;

                const urlInput = appScreenContent.querySelector('.url-input');
                const goButton = appScreenContent.querySelector('.go-button');
                const browserContent = appScreenContent.querySelector('.browser-content');

                function loadPage(url) {
                    let contentHtml = '';
                    let displayUrl = url;

                    if (!url.startsWith('http://') && !url.startsWith('https://')) {
                        url = 'https://' + url; // Prepend https for common usage
                        displayUrl = url;
                    }

                    if (url.includes('apple.com')) {
                        contentHtml = `
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/200px-Apple_logo_black.svg.png" alt="Apple Logo" class="apple-logo">
                            <h2>Welcome to Apple!</h2>
                            <p>Explore our products and services.</p>
                            <p>Currently viewing: <strong>${displayUrl}</strong></p>
                            <a href="#" onclick="alert('Link clicked! (Simulated)'); return false;">Discover the latest iPhone</a>
                        `;
                    } else if (url.includes('google.com')) {
                        contentHtml = `
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/100px-Google_2015_logo.svg.png" alt="Google Logo" style="width: 100px; margin-bottom: 15px;">
                            <h2>Welcome to Google!</h2>
                            <p>Search the world's information.</p>
                            <p>Currently viewing: <strong>${displayUrl}</strong></p>
                            <a href="#" onclick="alert('Link clicked! (Simulated)'); return false;">Search now</a>
                        `;
                    } else if (url.includes('wikipedia.org')) {
                        contentHtml = `
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Wikipedia_Logo_1.0.png/80px-Wikipedia_Logo_1.0.png" alt="Wikipedia Logo" style="width: 80px; margin-bottom: 15px;">
                            <h2>Welcome to Wikipedia!</h2>
                            <p>The Free Encyclopedia.</p>
                            <p>Currently viewing: <strong>${displayUrl}</strong></p>
                            <a href="#" onclick="alert('Link clicked! (Simulated)'); return false;">Explore articles</a>
                        `;
                    } else {
                        contentHtml = `
                            <h2>Page Not Found</h2>
                            <p>The requested URL <strong>${displayUrl}</strong> could not be loaded.</p>
                            <p>This is a simplified web browser experience.</p>
                        `;
                    }
                    browserContent.innerHTML = contentHtml;
                    urlInput.value = displayUrl; // Update input with resolved URL
                }

                goButton.addEventListener('click', () => {
                    playClickSound(); // Add sound to go button
                    loadPage(urlInput.value);
                });

                urlInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        playClickSound(); // Add sound to URL input on enter
                        loadPage(urlInput.value);
                    }
                });

                // Initial load
                loadPage(urlInput.value);
                break;
            case 'Notes':
                function renderNotesList() {
                    appScreenContent.innerHTML = `
                        <div class="notes-app">
                            <div class="notes-list-container">
                                <ul class="notes-list">
                                    ${notesData.length > 0 ? notesData.map((note, index) => `
                                        <li data-note-index="${index}">
                                            <span>${note.title}</span>
                                            <span class="note-preview">${note.content.split('\n')[0].substring(0, 50)}...</span>
                                        </li>
                                    `).join('') : '<p class="no-notes-message">No notes yet. Click "New Note" to create one!</p>'}
                                </ul>
                            </div>
                            <textarea class="note-textarea hidden" placeholder="Write your notes here..."></textarea>
                            <div class="notes-actions">
                                <button class="new-note">New Note</button>
                                <button class="save-note hidden">Save Note</button>
                                <button class="delete-note hidden">Delete Note</button>
                            </div>
                        </div>
                    `;

                    const noteTextArea = appScreenContent.querySelector('.note-textarea');
                    const saveNoteBtn = appScreenContent.querySelector('.save-note');
                    const newNoteBtn = appScreenContent.querySelector('.new-note');
                    const deleteNoteBtn = appScreenContent.querySelector('.delete-note');
                    const notesListContainer = appScreenContent.querySelector('.notes-list-container');
                    let currentNoteIndex = -1; // -1 for new note, otherwise index of existing note

                    function showNoteEditor(index = -1) {
                        notesListContainer.classList.add('hidden');
                        noteTextArea.classList.remove('hidden');
                        saveNoteBtn.classList.remove('hidden');
                        newNoteBtn.textContent = 'Back to Notes'; // Change button text
                        deleteNoteBtn.classList.add('hidden'); // Hide delete when editing or creating
                        if (index !== -1) {
                            noteTextArea.value = notesData[index].content;
                            currentNoteIndex = index;
                            deleteNoteBtn.classList.remove('hidden'); // Show delete if it's an existing note
                        } else {
                            noteTextArea.value = '';
                            currentNoteIndex = -1;
                        }
                        appTitle.textContent = 'Notes - Editing';
                    }

                    function showNotesList() {
                        notesListContainer.classList.remove('hidden');
                        noteTextArea.classList.add('hidden');
                        saveNoteBtn.classList.add('hidden');
                        deleteNoteBtn.classList.add('hidden');
                        newNoteBtn.textContent = 'New Note';
                        appTitle.textContent = 'Notes'; // Reset app title
                        currentNoteIndex = -1;
                        renderNotesList(); // Re-render the list to update
                    }

                    appScreenContent.querySelectorAll('.notes-list li').forEach(item => {
                        item.addEventListener('click', () => {
                            playClickSound(); // Add sound to notes list items
                            showNoteEditor(parseInt(item.dataset.noteIndex));
                        });
                    });

                    saveNoteBtn.addEventListener('click', () => {
                        playClickSound(); // Add sound to save note button
                        const content = noteTextArea.value.trim();
                        if (!content) {
                            alert('Note cannot be empty!');
                            return;
                        }
                        const title = content.split('\n')[0].substring(0, 20) || 'New Note';
                        if (currentNoteIndex !== -1) {
                            // Update existing note
                            notesData[currentNoteIndex].content = content;
                            notesData[currentNoteIndex].title = title;
                        } else {
                            // Save as new note
                            notesData.push({ title: title, content: content });
                        }
                        alert('Note saved!');
                        showNotesList();
                    });

                    newNoteBtn.addEventListener('click', () => {
                        playClickSound(); // Add sound to new note button
                        if (noteTextArea.classList.contains('hidden')) {
                            // Currently viewing list, switch to editor
                            showNoteEditor();
                        } else {
                            // Currently editing, switch back to list
                            if (noteTextArea.value.trim() && currentNoteIndex === -1) {
                                if (confirm('Do you want to save this new note before going back?')) {
                                    saveNoteBtn.click(); // Simulate click on save
                                } else {
                                    showNotesList();
                                }
                            } else {
                                showNotesList();
                            }
                        }
                    });

                    deleteNoteBtn.addEventListener('click', () => {
                        playClickSound(); // Add sound to delete note button
                        if (currentNoteIndex !== -1 && confirm('Are you sure you want to delete this note?')) {
                            notesData.splice(currentNoteIndex, 1);
                            alert('Note deleted!');
                            showNotesList();
                        }
                    });

                    // Initial render for the notes list
                    if (notesData.length > 0) {
                        notesListContainer.classList.remove('hidden');
                        noteTextArea.classList.add('hidden');
                        saveNoteBtn.classList.add('hidden');
                        deleteNoteBtn.classList.add('hidden');
                        newNoteBtn.textContent = 'New Note';
                    } else {
                        // If no notes, immediately show the editor for a new note
                        showNoteEditor();
                    }
                }
                renderNotesList(); // Call initially
                break;
            case 'Calendar':
                const today = new Date();
                const currentMonth = today.toLocaleString('default', { month: 'long' });
                const currentYear = today.getFullYear();
                let selectedDay = today.getDate(); // Keep track of the currently selected day

                const calendarEvents = {
                    [today.getDate()]: [{ time: '10 AM', desc: 'Meet with Sarah' }], // Today's event
                    15: [{ time: 'All Day', desc: 'Project Deadline!' }],
                    22: [{ time: '2 PM', desc: 'Dentist Appointment' }, { time: '6 PM', desc: 'Dinner with friends' }]
                };

                function renderCalendar() {
                    appScreenContent.innerHTML = `
                        <div class="calendar-app">
                            <div class="calendar-nav">
                                <button class="prev-month">&lt;</button>
                                <span class="month-year">${currentMonth} ${currentYear}</span>
                                <button class="next-month">&gt;</button>
                            </div>
                            <div class="weekdays"><span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span></div>
                            <div class="days-grid">
                                ${Array(30).fill(0).map((_, i) => {
                                    const day = i + 1;
                                    const isToday = day === today.getDate();
                                    const hasEvent = calendarEvents[day];
                                    const isSelected = day === selectedDay;
                                    return `<span class="day-cell ${isToday ? 'today' : ''} ${hasEvent ? 'event' : ''} ${isSelected ? 'selected' : ''}" data-day="${day}">${day}</span>`;
                                }).join('')}
                            </div>
                            <div class="events-for-day">
                                <h3>Events for <span class="selected-date">${currentMonth} ${selectedDay}</span></h3>
                                <ul class="event-list">
                                    <!-- Events will be listed here -->
                                </ul>
                                <button class="add-event-button">Add Event</button>
                            </div>
                        </div>
                    `;

                    const eventList = appScreenContent.querySelector('.event-list');
                    const selectedDateSpan = appScreenContent.querySelector('.selected-date');
                    const addEventButton = appScreenContent.querySelector('.add-event-button');

                    function updateEventList(day) {
                        selectedDateSpan.textContent = `${currentMonth} ${day}`;
                        eventList.innerHTML = '';
                        const events = calendarEvents[day];
                        if (events && events.length > 0) {
                            events.forEach(event => {
                                const li = document.createElement('li');
                                li.innerHTML = `<strong>${event.time}</strong>: ${event.desc}`;
                                eventList.appendChild(li);
                            });
                        } else {
                            eventList.innerHTML = '<li>No events for this day.</li>';
                        }
                    }

                    // Initial update for today's events
                    updateEventList(selectedDay);

                    appScreenContent.querySelectorAll('.day-cell').forEach(cell => {
                        cell.addEventListener('click', () => {
                            playClickSound(); // Add sound to day cells
                            // Remove 'selected' from previous cell
                            const prevSelected = appScreenContent.querySelector('.day-cell.selected');
                            if (prevSelected) {
                                prevSelected.classList.remove('selected');
                            }

                            const day = parseInt(cell.dataset.day);
                            selectedDay = day; // Update selected day
                            cell.classList.add('selected'); // Add 'selected' to clicked cell
                            updateEventList(selectedDay);
                        });
                    });

                    appScreenContent.querySelectorAll('.calendar-nav button').forEach(button => {
                        button.addEventListener('click', () => {
                            playClickSound(); // Add sound to calendar nav buttons
                            alert(`Navigating calendar (simulated for ${button.classList.contains('prev-month') ? 'previous' : 'next'} month)`);
                        });
                    });

                    addEventButton.addEventListener('click', () => {
                        playClickSound(); // Add sound to add event button
                        const eventDesc = prompt(`Add a new event for ${currentMonth} ${selectedDay}:`);
                        if (eventDesc) {
                            const eventTime = prompt('What time is the event? (e.g., 2 PM, All Day)');
                            if (!calendarEvents[selectedDay]) {
                                calendarEvents[selectedDay] = [];
                            }
                            calendarEvents[selectedDay].push({ time: eventTime || 'N/A', desc: eventDesc });
                            alert('Event added!');
                            renderCalendar(); // Re-render to update the grid and list
                            // Re-select the day after re-rendering
                            appScreenContent.querySelector(`.day-cell[data-day="${selectedDay}"]`).classList.add('selected');
                            updateEventList(selectedDay);
                        }
                    });
                }
                renderCalendar(); // Initial render
                break;
            case 'Calculator':
                appScreenContent.innerHTML = `
                    <div class="calculator-app">
                        <input type="text" class="calculator-display" value="0" readonly>
                        <div class="calculator-buttons">
                            <button>AC</button><button>+/-</button><button>%</button><button class="operator">÷</button>
                            <button>7</button><button>8</button><button>9</button><button class="operator">×</button>
                            <button>4</button><button>5</button><button>6</button><button class="operator">−</button>
                            <button>1</button><button>2</button><button>3</button><button class="operator">+</button>
                            <button class="zero">0</button><button class="decimal">.</button><button class="equals">=</button>
                        </div>
                    </div>
                `;
                // Basic calculator logic
                const calcDisplay = appScreenContent.querySelector('.calculator-display');
                let currentInput = '0';
                let firstOperand = null;
                let operator = null;
                let waitingForSecondOperand = false;

                function updateDisplay() {
                    calcDisplay.value = currentInput;
                }

                function inputDigit(digit) {
                    if (waitingForSecondOperand) {
                        currentInput = digit;
                        waitingForSecondOperand = false;
                    } else {
                        currentInput = currentInput === '0' ? digit : currentInput + digit;
                    }
                    updateDisplay();
                }

                function inputDecimal(dot) {
                    if (waitingForSecondOperand) {
                        currentInput = '0.';
                        waitingForSecondOperand = false;
                        updateDisplay();
                        return;
                    }
                    if (!currentInput.includes(dot)) {
                        currentInput += dot;
                    }
                    updateDisplay();
                }

                function handleOperator(nextOperator) {
                    const inputValue = parseFloat(currentInput);

                    if (operator && waitingForSecondOperand) {
                        operator = nextOperator;
                        return;
                    }

                    if (firstOperand === null) {
                        firstOperand = inputValue;
                    } else if (operator) {
                        const result = performCalculation[operator](firstOperand, inputValue);
                        currentInput = String(result);
                        firstOperand = result;
                    }

                    waitingForSecondOperand = true;
                    operator = nextOperator;
                    updateDisplay();
                }

                const performCalculation = {
                    '÷': (firstOperand, secondOperand) => secondOperand === 0 ? 'Error' : firstOperand / secondOperand,
                    '×': (firstOperand, secondOperand) => firstOperand * secondOperand,
                    '+': (firstOperand, secondOperand) => firstOperand + secondOperand,
                    '−': (firstOperand, secondOperand) => firstOperand - secondOperand,
                    '=': (firstOperand, secondOperand) => secondOperand // For equals, just show second operand if operator wasn't handled
                };

                function resetCalculator() {
                    currentInput = '0';
                    firstOperand = null;
                    operator = null;
                    waitingForSecondOperand = false;
                    updateDisplay();
                }

                function toggleSign() {
                    currentInput = String(parseFloat(currentInput) * -1);
                    updateDisplay();
                }

                function calculatePercentage() {
                    currentInput = String(parseFloat(currentInput) / 100);
                    updateDisplay();
                }

                appScreenContent.querySelectorAll('.calculator-buttons button').forEach(button => {
                    button.addEventListener('click', () => {
                        playClickSound(); // Play sound on every button click
                        const value = button.textContent;

                        if (value === 'AC') {
                            resetCalculator();
                        } else if (value === '+/-') {
                            toggleSign();
                        } else if (value === '%') {
                            calculatePercentage();
                        } else if (['+', '−', '×', '÷', '='].includes(value)) {
                            handleOperator(value);
                        } else if (value === '.') {
                            inputDecimal(value);
                        } else {
                            inputDigit(value);
                        }
                    });
                });
                break;
            case 'Settings':
                appScreenContent.innerHTML = `
                    <div class="settings-app">
                        <ul class="settings-list">
                            <li>
                                <span class="setting-icon wifi"></span> Wi-Fi
                                <label class="switch">
                                    <input type="checkbox" data-setting="wifi">
                                    <span class="slider round"></span>
                                </label>
                                <span class="status wifi-status">Not Connected</span>
                            </li>
                            <li>
                                <span class="setting-icon bluetooth"></span> Bluetooth
                                <label class="switch">
                                    <input type="checkbox" data-setting="bluetooth">
                                    <span class="slider round"></span>
                                </label>
                                <span class="status bluetooth-status">Off</span>
                            </li>
                            <li><span class="setting-icon general"></span> General<span class="status"> ></span></li>
                            <li><span class="setting-icon sound"></span> Sounds & Haptics<span class="status"> ></span></li>
                            <li><span class="setting-icon display"></span> Display & Brightness<span class="status"> ></span></li>
                            <li><span class="setting-icon privacy"></span> Privacy & Security<span class="status"> ></span></li>
                        </ul>
                    </div>
                `;

                appScreenContent.querySelectorAll('.settings-list li').forEach(item => {
                    const toggleInput = item.querySelector('input[type="checkbox"]');
                    const statusSpan = item.querySelector('.status');

                    if (toggleInput) {
                        // Initialize based on checkbox state (or default to unchecked)
                        if (toggleInput.dataset.setting === 'wifi') {
                            statusSpan.textContent = toggleInput.checked ? 'Connected' : 'Not Connected';
                        } else if (toggleInput.dataset.setting === 'bluetooth') {
                            statusSpan.textContent = toggleInput.checked ? 'On' : 'Off';
                        }

                        toggleInput.addEventListener('change', (event) => {
                            playClickSound(); // Add sound to toggle switches
                            const setting = event.target.dataset.setting;
                            if (setting === 'wifi') {
                                statusSpan.textContent = event.target.checked ? 'Connected' : 'Not Connected';
                                alert(`Wi-Fi is now ${event.target.checked ? 'ON' : 'OFF'}`);
                            }
                            else if (setting === 'bluetooth') {
                                statusSpan.textContent = event.target.checked ? 'On' : 'Off';
                                alert(`Bluetooth is now ${event.target.checked ? 'ON' : 'OFF'}`);
                            }
                        });
                    } else {
                        // For general settings that are just clickable
                        item.addEventListener('click', () => {
                            playClickSound(); // Add sound to general settings list items
                            const settingName = item.querySelector('span:nth-child(2)').textContent.trim();
                            alert(`Tapped on "${settingName}" setting.`);
                        });
                    }
                });
                break;
            case 'Weather':
                appScreenContent.innerHTML = `
                    <div class="weather-app">
                        <div class="weather-location">Cupertino</div>
                        <div class="weather-temperature">22°</div>
                        <div class="weather-condition">Partly Cloudy</div>
                        <div class="weather-details">
                            <p>Humidity: 60%</p>
                            <p>Wind: 10 km/h</p>
                        </div>
                        <div class="forecast">
                            <h3>5-Day Forecast</h3>
                            <div class="forecast-day">
                                <span>Tue</span>
                                <img src="https://openweathermap.org/img/wn/01d@2x.png" alt="Sunny" />
                                <span>24° / 15°</span>
                            </div>
                            <div class="forecast-day">
                                <span>Wed</span>
                                <img src="https://openweathermap.org/img/wn/03d@2x.png" alt="Cloudy" />
                                <span>20° / 12°</span>
                            </div>
                            <div class="forecast-day">
                                <span>Thu</span>
                                <img src="https://openweathermap.org/img/wn/10d@2x.png" alt="Rain" />
                                <span>18° / 10°</span>
                            </div>
                        </div>
                    </div>
                `;
                break;
            case 'Photos':
                function renderPhotoGrid() {
                    appScreenContent.innerHTML = `
                        <div class="photos-app">
                            <div class="album-header">All Photos (${photos.length})</div>
                            <div class="photo-grid">
                                ${photos.map((photo, index) => `
                                    <div class="photo-thumbnail" data-photo-index="${index}">
                                        <img src="${photo.src}" alt="${photo.title}">
                                    </div>
                                `).join('')}
                            </div>
                            <div class="photo-view hidden">
                                <button class="back-to-grid">&lt; Back</button>
                                <img class="full-photo" src="" alt="">
                                <div class="photo-title"></div>
                            </div>
                        </div>
                    `;

                    const photoView = appScreenContent.querySelector('.photo-view');
                    const fullPhoto = photoView.querySelector('.full-photo');
                    const photoTitle = photoView.querySelector('.photo-title');
                    const backToGridButton = photoView.querySelector('.back-to-grid');
                    const photoGrid = appScreenContent.querySelector('.photo-grid');
                    const albumHeader = appScreenContent.querySelector('.album-header');

                    appScreenContent.querySelectorAll('.photo-thumbnail').forEach(thumbnail => {
                        thumbnail.addEventListener('click', () => {
                            playClickSound(); // Add sound to photo thumbnails
                            const index = parseInt(thumbnail.dataset.photoIndex);
                            fullPhoto.src = photos[index].src;
                            fullPhoto.alt = photos[index].title;
                            photoTitle.textContent = photos[index].title;

                            photoGrid.classList.add('hidden');
                            albumHeader.classList.add('hidden');
                            photoView.classList.remove('hidden');
                            appTitle.textContent = 'Photos - Viewing';
                        });
                    });

                    backToGridButton.addEventListener('click', () => {
                        playClickSound(); // Add sound to back to grid button
                        photoView.classList.add('hidden');
                        photoGrid.classList.remove('hidden');
                        albumHeader.classList.remove('hidden');
                        appTitle.textContent = 'Photos';
                    });
                }
                renderPhotoGrid();
                break;
            case 'iPod':
                appScreenContent.innerHTML = `
                    <div class="ipod-app">
                        <div class="ipod-controls">
                            <button class="play-pause-button">Play</button>
                            <button class="next-song-button">Next</button>
                            <input type="file" id="music-upload-input" accept="audio/*" style="display: none;">
                            <button class="upload-music-button">Upload Music</button>
                        </div>
                        <div class="now-playing">
                            <div class="song-title">No song playing</div>
                            <div class="song-artist"></div>
                        </div>
                        <ul class="song-list">
                            <h3>My Music</h3>
                            ${songs.map(song => `
                                <li>
                                    <span class="song-item-title">${song.title}</span>
                                    <span class="song-item-artist">${song.artist} - ${song.album}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                `;

                const playPauseButton = appScreenContent.querySelector('.play-pause-button');
                const nextSongButton = appScreenContent.querySelector('.next-song-button');
                const nowPlayingTitle = appScreenContent.querySelector('.now-playing .song-title');
                const nowPlayingArtist = appScreenContent.querySelector('.now-playing .song-artist');
                const musicUploadInput = appScreenContent.querySelector('#music-upload-input');
                const uploadMusicButton = appScreenContent.querySelector('.upload-music-button');

                let currentSongIndex = -1;
                let isPlaying = false;

                function updateNowPlaying() {
                    if (currentSongIndex === -1) {
                        nowPlayingTitle.textContent = 'No song playing';
                        nowPlayingArtist.textContent = '';
                        playPauseButton.textContent = 'Play';
                    } else {
                        const song = songs[currentSongIndex];
                        nowPlayingTitle.textContent = song.title;
                        nowPlayingArtist.textContent = song.artist;
                        playPauseButton.textContent = isPlaying ? 'Pause' : 'Play';
                    }
                }

                playPauseButton.addEventListener('click', () => {
                    playClickSound(); // Add sound to play/pause button
                    if (currentSongIndex === -1 && songs.length > 0) {
                        currentSongIndex = 0;
                    }
                    if (currentSongIndex !== -1) {
                        isPlaying = !isPlaying;
                        alert(isPlaying ? `Playing: ${songs[currentSongIndex].title}` : `Paused: ${songs[currentSongIndex].title}`);
                        updateNowPlaying();
                    } else {
                        alert('No songs available!');
                    }
                });

                nextSongButton.addEventListener('click', () => {
                    playClickSound(); // Add sound to next song button
                    if (songs.length > 0) {
                        currentSongIndex = (currentSongIndex + 1) % songs.length;
                        isPlaying = true;
                        alert(`Now Playing: ${songs[currentSongIndex].title}`);
                        updateNowPlaying();
                    } else {
                        alert('No songs to play!');
                    }
                });

                appScreenContent.querySelectorAll('.song-list li').forEach((item, index) => {
                    item.addEventListener('click', () => {
                        playClickSound(); // Add sound to song list items
                        currentSongIndex = index;
                        isPlaying = true;
                        alert(`Playing: ${songs[currentSongIndex].title}`);
                        updateNowPlaying();
                    });
                });

                // New Upload Music functionality
                uploadMusicButton.addEventListener('click', () => {
                    playClickSound(); // Add sound to upload music button
                    musicUploadInput.click(); // Trigger the hidden file input
                });

                musicUploadInput.addEventListener('change', (event) => {
                    const files = event.target.files;
                    if (files.length > 0) {
                        for (let i = 0; i < files.length; i++) {
                            const file = files[i];
                            // Simple parsing for title from filename
                            const title = file.name.split('.').slice(0, -1).join('.') || 'Unknown Title';
                            // Add to songs array
                            songs.push({
                                title: title,
                                artist: 'Uploaded', // Placeholder
                                album: 'My Uploads' // Placeholder
                            });
                        }
                        alert(`${files.length} song(s) added!`);
                        // Re-render the iPod app to show the new songs
                        renderAppContent('iPod');
                        // Reset input value to allow selecting same file again if needed
                        musicUploadInput.value = '';
                    }
                });

                updateNowPlaying(); // Initial update
                break;
            case 'Videos':
                appScreenContent.innerHTML = `
                    <div class="video-app">
                        <div class="video-player">
                            <div id="youtube-player"></div>
                            <p class="video-message">Tap a video to play!</p>
                            <div class="player-controls hidden">
                                <button class="play-video">▶️</button>
                                <span class="video-current-time">0:00</span> / <span class="video-duration"></span>
                            </div>
                        </div>
                        <ul class="video-list">
                            <h3>My Videos</h3>
                            ${videos.map((video, index) => `
                                <li data-video-index="${index}">
                                    <span class="video-item-title">${video.title}</span>
                                    <span class="video-item-duration">${video.duration}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                `;

                const videoPlayerContainer = appScreenContent.querySelector('.video-player');
                const youtubePlayerDiv = appScreenContent.querySelector('#youtube-player');
                const videoMessage = appScreenContent.querySelector('.video-message');
                const playerControls = appScreenContent.querySelector('.player-controls');
                const playVideoButton = appScreenContent.querySelector('.play-video');
                const videoCurrentTime = appScreenContent.querySelector('.video-current-time');
                const videoDurationSpan = appScreenContent.querySelector('.video-duration');
                
                let currentVideoIndex = -1;
                
                // Function to load and play a specific YouTube video
                function loadYouTubeVideo(index) {
                    if (typeof YT !== 'undefined' && YT.Player) {
                        const video = videos[index];
                        if (!video) return;

                        if (ytPlayer) {
                            ytPlayer.loadVideoById(video.videoId);
                        } else {
                            // Create the YouTube player if it doesn't exist
                            ytPlayer = new YT.Player('youtube-player', {
                                videoId: video.videoId,
                                playerVars: {
                                    controls: 0, // Hide YouTube's native controls
                                    modestbranding: 1,
                                    rel: 0, // Do not show related videos
                                    showinfo: 0,
                                    autoplay: 1 // Start playing immediately
                                },
                                events: {
                                    'onReady': onPlayerReady,
                                    'onStateChange': onPlayerStateChange
                                }
                            });
                        }
                        currentVideoIndex = index;
                        videoMessage.classList.add('hidden');
                        playerControls.classList.remove('hidden');
                        updateVideoControls(video);
                    } else {
                        console.error('YouTube IFrame API not loaded.');
                        alert('YouTube player not ready. Please try again or check internet connection.');
                    }
                }

                function onPlayerReady(event) {
                    event.target.playVideo();
                }

                function onPlayerStateChange(event) {
                    const video = videos[currentVideoIndex];
                    if (!video) return;

                    // YT.PlayerState: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued).
                    if (event.data === YT.PlayerState.PLAYING) {
                        playVideoButton.textContent = '⏸️';
                        // Update current time (simplified, not real-time)
                        if (!this._interval) {
                            this._interval = setInterval(() => {
                                const time = event.target.getCurrentTime();
                                videoCurrentTime.textContent = formatTime(time);
                            }, 1000);
                        }
                    } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.BUFFERING) {
                        playVideoButton.textContent = '▶️';
                        if (this._interval) {
                            clearInterval(this._interval);
                            this._interval = null;
                        }
                    } else if (event.data === YT.PlayerState.ENDED) {
                        playVideoButton.textContent = '▶️';
                        videoCurrentTime.textContent = '0:00'; // Reset on end
                        if (this._interval) {
                            clearInterval(this._interval);
                            this._interval = null;
                        }
                        // Optionally play next video
                    } else {
                        playVideoButton.textContent = '▶️'; // Default to play if not playing
                    }
                    updateVideoControls(video);
                }

                function updateVideoControls(video) {
                    if (video) {
                        videoMessage.textContent = `Now Playing: ${video.title}`;
                        videoDurationSpan.textContent = video.duration;
                    }
                }

                function formatTime(seconds) {
                    const minutes = Math.floor(seconds / 60);
                    const remainingSeconds = Math.floor(seconds % 60);
                    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
                }

                playVideoButton.addEventListener('click', () => {
                    playClickSound(); // Add sound to play video button
                    if (ytPlayer && ytPlayer.getPlayerState) {
                        const playerState = ytPlayer.getPlayerState();
                        if (playerState === YT.PlayerState.PLAYING) {
                            ytPlayer.pauseVideo();
                        } else {
                            ytPlayer.playVideo();
                        }
                    }
                });

                appScreenContent.querySelectorAll('.video-list li').forEach((item, index) => {
                    item.addEventListener('click', () => {
                        playClickSound(); // Add sound to video list items
                        loadYouTubeVideo(index);
                    });
                });
                
                // Initial state when app opens
                if (videos.length > 0) {
                    // Pre-load the first video details without playing automatically
                    updateVideoControls(videos[0]);
                } else {
                    playerControls.classList.add('hidden');
                    videoMessage.classList.remove('hidden');
                }
                break;
            default:
                appScreenContent.innerHTML = `<p class="app-message">Welcome to your ${appName} app. This app is still under development. (Tap Home button to return)</p>`;
                break;
        }
    }
});
document.addEventListener('DOMContentLoaded', () => {
    // Update time in status bar and lock screen
    updateTime();
    setInterval(updateTime, 1000);

    // Lock screen functionality
    const lockScreen = document.querySelector('.lock-screen');
    const swipeIndicator = document.querySelector('.swipe-indicator');
    const flashlightIcon = document.querySelector('.flashlight-icon');
    const cameraIcon = document.querySelector('.camera-icon');

    // Lock screen swipe up to unlock
    let touchStartY = 0;
    let touchEndY = 0;
    let isDragging = false;

    lockScreen.addEventListener('touchstart', e => {
        touchStartY = e.touches[0].clientY;
        isDragging = true;
        lockScreen.style.transition = '';
    });

    lockScreen.addEventListener('touchmove', e => {
        if (!isDragging) return;
        touchEndY = e.touches[0].clientY;
        const diff = touchStartY - touchEndY;

        if (diff > 0) {
            lockScreen.style.transform = `translateY(-${diff}px)`;
            lockScreen.style.opacity = 1 - (diff / 300);
        }
    });

    lockScreen.addEventListener('touchend', e => {
        if (!isDragging) return;
        isDragging = false;
        const diff = touchStartY - touchEndY;

        if (diff > 150) { // Swipe up threshold
            unlockPhone();
        } else {
            // Reset position if not swiped enough
            lockScreen.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
            lockScreen.style.transform = 'translateY(0)';
            lockScreen.style.opacity = '1';
        }
    });

    // For desktop usage - click on swipe indicator to unlock
    swipeIndicator.addEventListener('click', () => {
        lockScreen.style.transition = 'transform 0.5s ease, opacity 0.5s ease';
        unlockPhone();
        // Add haptic feedback if supported
        if (window.navigator && window.navigator.vibrate) {
            navigator.vibrate(50);
        }
    });

    // Add mouse event support for lock screen
    lockScreen.addEventListener('mousedown', e => {
        touchStartY = e.clientY;
        isDragging = true;
        lockScreen.style.transition = '';
    });

    lockScreen.addEventListener('mousemove', e => {
        if (!isDragging) return;
        touchEndY = e.clientY;
        const diff = touchStartY - touchEndY;

        if (diff > 0) {
            lockScreen.style.transform = `translateY(-${diff}px)`;
            lockScreen.style.opacity = 1 - (diff / 300);
        }
    });

    lockScreen.addEventListener('mouseup', e => {
        if (!isDragging) return;
        isDragging = false;
        const diff = touchStartY - touchEndY;

        if (diff > 150) { // Swipe up threshold
            unlockPhone();
        } else {
            // Reset position if not swiped enough
            lockScreen.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
            lockScreen.style.transform = 'translateY(0)';
            lockScreen.style.opacity = '1';
        }
    });

    // Flashlight and camera icons
    flashlightIcon.addEventListener('click', () => {
        flashlightIcon.style.animation = 'flashlight-pulse 0.5s';
        setTimeout(() => {
            flashlightIcon.style.animation = '';
        }, 500);
        // Add haptic feedback
        if (window.navigator && window.navigator.vibrate) {
            navigator.vibrate(50);
        }
    });

    cameraIcon.addEventListener('click', () => {
        const cameraApp = document.getElementById('camera-app');
        unlockPhone();
        setTimeout(() => {
            if (cameraApp) {
                cameraApp.style.display = 'flex';
                cameraApp.style.animation = 'app-open 0.3s forwards';
            }
        }, 500);
        // Add haptic feedback
        if (window.navigator && window.navigator.vibrate) {
            navigator.vibrate(50);
        }
    });

    // Function to unlock the phone
    function unlockPhone() {
        lockScreen.style.animation = 'slide-up-unlock 0.5s forwards';
        // Add haptic feedback
        if (window.navigator && window.navigator.vibrate) {
            navigator.vibrate([30, 30, 30]);
        }
        setTimeout(() => {
            lockScreen.style.display = 'none';
            document.querySelector('.screen-content').style.display = 'flex'; // Show home screen content after unlock
            // Reset for when we lock the phone again
            lockScreen.style.animation = '';
            lockScreen.style.transform = 'translateY(0)';
            lockScreen.style.opacity = '1';
        }, 500);
    }

    // Function to update time and date
    function updateTime() {
        const now = new Date();
        let hours = now.getHours();
        let minutes = now.getMinutes();

        // Format for status bar
        const formattedHours = hours < 10 ? '0' + hours : hours;
        const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
        document.querySelector('.time').textContent = `${formattedHours}:${formattedMinutes}`;

        // Format for lock screen - use 12-hour format
        const lockTime = document.querySelector('.lock-time');
        if (lockTime) {
            let displayHours = hours % 12;
            if (displayHours === 0) displayHours = 12;
            minutes = minutes < 10 ? '0' + minutes : minutes;
            lockTime.textContent = `${displayHours}:${minutes}`;

            // Update date with proper formatting
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            const day = days[now.getDay()];
            const month = months[now.getMonth()];
            const date = now.getDate();
            document.querySelector('.lock-date').textContent = `${day}, ${month} ${date}`;
        }
    }

    // App opening functionality with mouse click support
    const apps = document.querySelectorAll('.app, .dock-app');
    let appScreens = document.querySelectorAll('.app-screen');
    const homeIndicator = document.querySelector('.home-indicator');

    apps.forEach(app => {
        app.addEventListener('click', () => {
            const appName = app.getAttribute('data-app');
            const appScreen = document.getElementById(`${appName}-app`);

            if (appScreen) {
                // Add ripple effect
                createRippleEffect(app);

                // Open the app after a short delay
                setTimeout(() => {
                    appScreen.style.display = 'flex';
                    appScreen.style.animation = 'app-open 0.3s forwards';
                }, 200);
            }
        });
    });

    // Home indicator functionality with mouse support
    homeIndicator.addEventListener('click', () => {
        appScreens.forEach(screen => {
            if (screen.style.display === 'flex') {
                screen.style.animation = 'app-close 0.3s forwards';
                setTimeout(() => {
                    screen.style.display = 'none';
                }, 300);
            }
        });
    });

    // For better keyboard accessibility
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            // ESC key closes any open app
            appScreens.forEach(screen => {
                if (screen.style.display === 'flex') {
                    screen.style.animation = 'app-close 0.3s forwards';
                    setTimeout(() => {
                        screen.style.display = 'none';
                    }, 300);
                }
            });
        } else if (e.key === 'Enter' && lockScreen.style.display !== 'none') {
            // Enter key unlocks phone from lock screen
            unlockPhone();
        }
    });

    // Add swipe up gesture for home
    let touchStartYHome = 0;
    document.addEventListener('touchstart', e => {
        touchStartYHome = e.touches[0].clientY;
    });

    document.addEventListener('touchend', e => {
        const touchEndYHome = e.changedTouches[0].clientY;
        const diffHome = touchStartYHome - touchEndYHome;

        if (diffHome > 100) { // Swipe up threshold
            appScreens.forEach(screen => {
                screen.style.animation = 'app-close 0.3s forwards';
                setTimeout(() => {
                    screen.style.display = 'none';
                }, 300);
            });
        }
    });

    // For mouse users - simulate swipe up with mouse drag
    let mouseStartY = 0;
    let mouseIsDragging = false;

    document.addEventListener('mousedown', e => {
        mouseStartY = e.clientY;
        mouseIsDragging = true;
    });

    document.addEventListener('mousemove', e => {
        if (!mouseIsDragging) return;
    });

    document.addEventListener('mouseup', e => {
        if (!mouseIsDragging) return;

        const diffY = mouseStartY - e.clientY;
        if (diffY > 100) { // Swipe up threshold
            appScreens.forEach(screen => {
                if (screen.style.display === 'flex') {
                    screen.style.animation = 'app-close 0.3s forwards';
                    setTimeout(() => {
                        screen.style.display = 'none';
                    }, 300);
                }
            });
        }
        mouseIsDragging = false;
    });

    // Add wheel support for closing apps
    document.addEventListener('wheel', e => {
        if (e.deltaY < 0) { // Scrolling up
            const visibleAppScreens = Array.from(document.querySelectorAll('.app-screen')).filter(
                screen => screen.style.display === 'flex'
            );

            visibleAppScreens.forEach(screen => {
                screen.style.animation = 'app-close 0.3s forwards';
                setTimeout(() => {
                    screen.style.display = 'none';
                }, 300);
            });
        }
    });

    // Camera shutter effect
    const cameraShutter = document.querySelector('.camera-shutter');
    if (cameraShutter) {
        cameraShutter.addEventListener('click', () => {
            const flash = document.createElement('div');
            flash.className = 'camera-flash';
            flash.style.position = 'absolute';
            flash.style.top = '0';
            flash.style.left = '0';
            flash.style.right = '0';
            flash.style.bottom = '0';
            flash.style.backgroundColor = 'white';
            flash.style.opacity = '0';
            flash.style.zIndex = '100';

            document.getElementById('camera-app').appendChild(flash);

            requestAnimationFrame(() => {
                flash.style.transition = 'opacity 0.1s ease-in-out';
                flash.style.opacity = '1';

                setTimeout(() => {
                    flash.style.opacity = '0';
                    setTimeout(() => {
                        flash.remove();
                        // Take photo and add to photo gallery
                        takePhoto();
                    }, 100);
                }, 100);
            });
        });
    }

    function createRippleEffect(element) {
        const ripple = document.createElement('span');
        ripple.className = 'ripple';

        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);

        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${-size / 2 + rect.width / 2}px`;
        ripple.style.top = `${-size / 2 + rect.height / 2}px`;

        ripple.style.position = 'absolute';
        ripple.style.borderRadius = '50%';
        ripple.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
        ripple.style.transform = 'scale(0)';
        ripple.style.pointerEvents = 'none';

        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);

        requestAnimationFrame(() => {
            ripple.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            ripple.style.transform = 'scale(1)';

            setTimeout(() => {
                ripple.remove();
            }, 400);
        });
    }

    // Messages app functionality
    const messageItems = document.querySelectorAll('.message-item');
    const conversationView = document.querySelector('.conversation-view');
    const messagesContainer = document.querySelector('.messages-container');
    const backButton = document.querySelector('.back-button');
    const messageInput = document.querySelector('.message-input');
    const sendButton = document.querySelector('.send-button');
    const contactNameDisplay = document.querySelector('.conversation-header .contact-name');

    // Message conversations data - now using localStorage to persist messages
    let conversations = {};

    // Load saved conversations from localStorage
    if (localStorage.getItem('iosSimulatorConversations')) {
        conversations = JSON.parse(localStorage.getItem('iosSimulatorConversations'));
    } else {
        // Default conversations if none exist
        conversations = {
            'John Appleseed': [
                { text: 'Hey! Are we still meeting later?', sender: 'them', time: '8:45 AM' },
                { text: 'I was thinking coffee around 3pm?', sender: 'them', time: '8:46 AM' }
            ],
            'Tim Cook': [
                { text: 'Great work on the new iOS design!', sender: 'them', time: '9:30 AM' },
                { text: 'The team really loves what you\'ve done.', sender: 'them', time: '9:31 AM' },
                { text: 'Thank you! I appreciate the feedback.', sender: 'me', time: '9:35 AM' }
            ],
            'Steve Wozniak': [
                { text: 'I\'ve got some new ideas for the circuit design.', sender: 'them', time: 'Yesterday' },
                { text: 'Let me know when you\'re free to discuss.', sender: 'them', time: 'Yesterday' },
                { text: 'Sounds exciting! I\'m available tomorrow.', sender: 'me', time: 'Yesterday' }
            ]
        };
        localStorage.setItem('iosSimulatorConversations', JSON.stringify(conversations));
    }

    // Open conversation when clicking on a message item
    messageItems.forEach(item => {
        item.addEventListener('click', () => {
            const contact = item.getAttribute('data-contact');
            openConversation(contact);

            // Remove unread status if present
            if (item.classList.contains('unread')) {
                item.classList.remove('unread');
            }
        });
    });

    // Back button in conversation
    backButton.addEventListener('click', () => {
        conversationView.style.display = 'none';
    });

    // Open conversation function
    function openConversation(contact) {
        // Set contact name in header
        contactNameDisplay.textContent = contact;

        // Clear messages container
        messagesContainer.innerHTML = '';

        // Load messages for this contact
        if (conversations[contact]) {
            conversations[contact].forEach(msg => {
                addMessageToConversation(msg.text, msg.sender, msg.time);
            });
        }

        // Show conversation view
        conversationView.style.display = 'flex';

        // Focus input field
        setTimeout(() => {
            messageInput.focus();
        }, 300);

        // Scroll to bottom of messages
        scrollToBottom();
    }

    // Add message to conversation
    function addMessageToConversation(text, sender, time) {
        const messageDiv = document.createElement('div');
        messageDiv.className = sender === 'me' ? 'message-bubble message-sent' : 'message-bubble message-received';
        messageDiv.textContent = text;

        const timeDiv = document.createElement('div');
        timeDiv.className = sender === 'me' ? 'message-time-sent' : 'message-time-received';
        timeDiv.textContent = time;

        const wrapper = document.createElement('div');
        wrapper.appendChild(messageDiv);
        wrapper.appendChild(timeDiv);

        messagesContainer.appendChild(wrapper);
    }

    // Send message functionality
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Monitor input for enabling/disabling send button
    messageInput.addEventListener('input', () => {
        sendButton.disabled = messageInput.value.trim() === '';
    });

    // Send message function
    function sendMessage() {
        const text = messageInput.value.trim();
        if (text === '') return;

        const contact = contactNameDisplay.textContent;
        const now = new Date();
        let hours = now.getHours();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // Convert 0 to 12
        const minutes = now.getMinutes() < 10 ? '0' + now.getMinutes() : now.getMinutes();
        const time = `${hours}:${minutes} ${ampm}`;

        // Add message to UI
        addMessageToConversation(text, 'me', 'Now');

        // Add message to data structure
        if (!conversations[contact]) {
            conversations[contact] = [];
        }
        conversations[contact].push({ text, sender: 'me', time });

        // Save to localStorage
        localStorage.setItem('iosSimulatorConversations', JSON.stringify(conversations));

        // Update preview in message list
        updateMessagePreview(contact, text);

        // Clear input
        messageInput.value = '';
        sendButton.disabled = true;

        // Scroll to bottom
        scrollToBottom();

        // Generate intelligent reply based on message context
        setTimeout(() => {
            let response;

            // More contextual replies
            if (text.includes('meet') || text.includes('meeting')) {
                response = "Yes, I'm available for a meeting. What time works for you?";
            } else if (text.includes('hello') || text.includes('hi') || text.includes('hey')) {
                response = "Hi there! How are you doing today?";
            } else if (text.includes('how are you')) {
                response = "I'm doing great, thanks for asking! How about you?";
            } else if (text.includes('thanks') || text.includes('thank you')) {
                response = "You're welcome! Glad I could help.";
            } else if (text.includes('time')) {
                response = `It's currently ${hours}:${minutes} ${ampm}.`;
            } else if (text.includes('bye') || text.includes('goodbye')) {
                response = "Talk to you later! Have a great day.";
            } else if (text.includes('weekend')) {
                response = "My weekend was great! I went hiking and caught up on some reading. How about yours?";
            } else if (text.includes('weather')) {
                response = "The weather looks nice today! Perfect for a walk outside.";
            } else if (text.includes('?')) {
                // It's a question
                const questions = [
                    "That's a good question. Let me think about that.",
                    "I'm not entirely sure, but I think so.",
                    "Yes, definitely!",
                    "No, I don't think so.",
                    "Maybe we should discuss that in person."
                ];
                response = questions[Math.floor(Math.random() * questions.length)];
            } else {
                // Default responses
                const responses = [
                    "That sounds interesting!",
                    "I agree with you on that.",
                    "Let's discuss this more later.",
                    "Thanks for letting me know.",
                    "I appreciate you sharing that with me.",
                    "Good point!",
                    "That's exactly what I was thinking.",
                    "I hadn't thought of it that way before."
                ];
                response = responses[Math.floor(Math.random() * responses.length)];
            }

            // Add response to UI
            addMessageToConversation(response, 'them', time);

            // Add to data
            conversations[contact].push({ text: response, sender: 'them', time });

            // Save to localStorage
            localStorage.setItem('iosSimulatorConversations', JSON.stringify(conversations));

            // Update preview
            updateMessagePreview(contact, response);

            // Scroll to bottom
            scrollToBottom();
        }, 1000 + Math.random() * 2000);
    }

    // Update message preview in list
    function updateMessagePreview(contact, text) {
        const messageItems = document.querySelectorAll('.message-item');
        messageItems.forEach(item => {
            if (item.getAttribute('data-contact') === contact) {
                const preview = item.querySelector('.message-preview');
                preview.textContent = text.length > 30 ? text.substring(0, 30) + '...' : text;

                const timeEl = item.querySelector('.message-time');
                timeEl.textContent = 'Now';

                // Move conversation to top
                const parent = item.parentNode;
                parent.insertBefore(item, parent.firstChild);
            }
        });
    }

    // Scroll messages to bottom
    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Add phone functionality
    const phoneContacts = document.querySelectorAll('.contact');
    phoneContacts.forEach(contact => {
        const callIcon = contact.querySelector('.call-icon');
        callIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            const name = contact.querySelector('.contact-name').textContent;
            startPhoneCall(name);
        });
    });

    function startPhoneCall(name) {
        // Create calling screen
        const callingScreen = document.createElement('div');
        callingScreen.className = 'calling-screen';
        callingScreen.innerHTML = `
            <div class="calling-header">
                <div class="calling-status">Calling...</div>
                <div class="calling-name">${name}</div>
            </div>
            <div class="calling-avatar">${name.charAt(0)}</div>
            <div class="chat-container">
                <div class="call-messages"></div>
                <div class="call-input-area">
                    <input type="text" placeholder="Type a message" class="call-input">
                    <button class="call-send-button">
                        <svg viewBox="0 0 24 24" width="24" height="24"><path fill="#007AFF" d="M2,21L23,12L2,3V10L17,12L2,14V21Z" /></svg>
                    </button>
                </div>
            </div>
            <div class="calling-controls">
                <div class="calling-button mute">
                    <svg viewBox="0 0 24 24" width="30" height="30"><path fill="white" d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z" /></svg>
                    <span>mute</span>
                </div>
                <div class="calling-button keypad">
                    <svg viewBox="0 0 24 24" width="24" height="24"><path fill="white" d="M12,2C6.5,2 2,6.5 2,12s4.5,10 10,10s10-4.5 10-10S17.5,2 12,2z M12,20c-4.4,0-8-3.6-8-8s3.6-8 8-8s8,3.6 8,8S16.4,20 12,20z" /></svg>
                    <span>keypad</span>
                </div>
                <div class="calling-button speaker">
                    <svg viewBox="0 0 24 24" width="30" height="30"><path fill="white" d="M12,12A3,3 0 0,0 9,15A3,3 0 0,0 12,18A3,3 0 0,0 15,15A3,3 0 0,0 12,12M12,20A5,5 0 0,1 7,15A5,5 0 0,1 12,10A5,5 0 0,1 17,15A5,5 0 0,1 12,20M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8C11.68,8 11.38,7.92 11.12,7.78C11.92,8.3 12.5,9.07 12.5,10A0.75,0.75 0 0,1 11.75,10.75A0.75,0.75 0 0,1 11,10A1.5,1.5 0 0,0 9.5,8.5A1.5,1.5 0 0,0 8,10A0.75,0.75 0 0,1 7.25,10.75A0.75,0.75 0 0,1 6.5,10C6.5,8.83 7.23,7.89 8.28,7.4C8.11,7.11 8,6.77 8,6.5C8,5.12 9.12,4 10.5,4H10C10,2.9 10.9,2 12,2M17.4,6.5C17.4,8.99 15.39,11 12.9,11C12.9,11 12.9,11 12.9,11H11.07C11.46,11.95 12.16,12.76 13.06,13.33C13.35,13.5 13.35,13.9 13.18,14.18C13,14.47 12.93,14.5 12.64,14.34C12.04,14 11.5,13.56 11.06,13.03C10.56,13.75 10.29,14.61 10.29,15.5A6,6 0 0,0 16.29,21.5C18.08,21.5 19.7,20.79 20.84,19.61L21.22,19.23L21.59,20.36L22.44,22.93C22.5,23.13 22.5,23.5 22.38,23.66C21.78,24.18 18.92,24 17.5,23.5C14.68,22.56 12.7,20.8 11.53,18.35C11,17.3 10.71,16.08 10.71,14.79L10.44,14.5C8.21,12.3 7.23,9.05 8,6C8.63,3.5 10.68,2.22 12.4,2.06C12.5,2.04 12.7,2 13,2C13.3,2 13.6,2.11 14,2.3C14.27,2.45 14.74,2.73 15.04,3.03C15.34,3.33 15.6,3.8 15.74,4.07C15.93,4.5 16,4.75 16,5C16,5.25 15.97,5.43 15.92,5.66C15.87,5.86 15.8,6.05 15.7,6.24C17.4,8.13 17.4,5.88 17.4,6.5Z" /></svg>
                    <span>speaker</span>
                </div>
                <div class="calling-button add-call">
                    <svg viewBox="0 0 24 24" width="30" height="30"><path fill="white" d="M20,15.5C18.8,15.5 17.5,15.3 16.4,14.9C16.3,14.9 16.2,14.9 16.1,14.9C15.8,14.9 15.6,15 15.4,15.2L13.2,17.4C10.4,15.9 8,13.6 6.6,10.8L8.8,8.6C9.1,8.3 9.2,7.9 9,7.6C8.7,6.5 8.5,5.2 8.5,4C8.5,3.5 8,3 7.5,3H4C3.5,3 3,3.5 3,4C3,13.4 10.6,21 20,21C20.5,21 21,20.5 21,20V16.5C21,16 20.5,15.5 20,15.5M5,5H6.5C6.6,5.9 6.8,6.8 7,7.6L5.8,8.8C5.4,7.6 5.1,6.3 5,5M19,19C17.7,18.9 16.4,18.6 15.2,18.2L16.4,17C17.2,17.2 18.1,17.4 19,17.4V19Z" /></svg>
                    <span>add call</span>
                </div>
            </div>
            <div class="end-call-button">
                <svg viewBox="0 0 24 24" width="30" height="30"><path fill="white" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" /></svg>
            </div>
        `;

        // Add styles to the head
        document.head.insertAdjacentHTML('beforeend', `
            <style>
                .calling-screen {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: #222;
                    z-index: 100;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 60px 20px;
                    color: white;
                }
                .calling-header {
                    text-align: center;
                    margin-bottom: 20px;
                }
                .calling-status {
                    font-size: 20px;
                    opacity: 0.8;
                    margin-bottom: 10px;
                }
                .calling-name {
                    font-size: 32px;
                    font-weight: 600;
                }
                .calling-avatar {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    background-color: #444;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 40px;
                    margin-bottom: 20px;
                }
                .chat-container {
                    width: 100%;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    margin-bottom: 20px;
                    background-color: rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    padding: 10px;
                    max-height: 200px;
                }
                .call-messages {
                    flex: 1;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    padding: 5px;
                }
                .call-input-area {
                    display: flex;
                    padding: 5px;
                    background-color: rgba(255, 255, 255, 0.2);
                    border-radius: 20px;
                    margin-top: 10px;
                }
                .call-input {
                    flex: 1;
                    border: none;
                    background: transparent;
                    padding: 8px;
                    color: white;
                    outline: none;
                }
                .call-input::placeholder {
                    color: rgba(255, 255, 255, 0.5);
                }
                .call-send-button {
                    background: none;
                    border: none;
                    padding: 5px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .call-message {
                    max-width: 80%;
                    padding: 8px 12px;
                    border-radius: 16px;
                    font-size: 14px;
                    position: relative;
                }
                .call-message-sent {
                    align-self: flex-end;
                    background-color: #0b93f6;
                    color: white;
                }
                .call-message-received {
                    align-self: flex-start;
                    background-color: #444;
                    color: white;
                }
                .calling-controls {
                    display: flex;
                    justify-content: space-around;
                    width: 100%;
                    margin-bottom: 20px;
                }
                .calling-button {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 5px;
                }
                .calling-button span {
                    font-size: 12px;
                    opacity: 0.8;
                }
                .end-call-button {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background-color: #FF3B30;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                }
            </style>
        `);

        document.body.appendChild(callingScreen);

        // Chat functionality for call
        const callInput = callingScreen.querySelector('.call-input');
        const callSendButton = callingScreen.querySelector('.call-send-button');
        const callMessages = callingScreen.querySelector('.call-messages');

        // Send a message function
        function sendCallMessage() {
            const text = callInput.value.trim();
            if (!text) return;

            addCallMessage(text, 'sent');
            callInput.value = '';

            // Simulate response after delay
            setTimeout(() => {
                const responses = [
                    "Yes, I can hear you clearly.",
                    "I'll be there in 10 minutes.",
                    "Can you repeat that please?",
                    "That sounds great!",
                    "I'm not sure about that.",
                    "Let me check my schedule.",
                    "I agree with your suggestion.",
                    "Thanks for calling!",
                    "Could you speak a bit louder?",
                    "I'm driving right now, texting while on call."
                ];
                const response = responses[Math.floor(Math.random() * responses.length)];
                addCallMessage(response, 'received');
            }, 1000 + Math.random() * 2000);
        }

        // Add message to call
        function addCallMessage(text, type) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `call-message call-message-${type}`;
            messageDiv.textContent = text;
            callMessages.appendChild(messageDiv);

            // Scroll to bottom
            callMessages.scrollTop = callMessages.scrollHeight;
        }

        // Event listeners for call chat
        callSendButton.addEventListener('click', sendCallMessage);
        callInput.addEventListener('keypress', e => {
            if (e.key === 'Enter') {
                sendCallMessage();
            }
        });

        // End call when button is clicked
        const endCallButton = callingScreen.querySelector('.end-call-button');
        endCallButton.addEventListener('click', () => {
            callingScreen.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(() => {
                callingScreen.remove();
            }, 300);
        });

        // Automatically "connect" call after a delay
        setTimeout(() => {
            const callingStatus = callingScreen.querySelector('.calling-status');
            callingStatus.textContent = 'Connected';

            // Add initial greeting message
            setTimeout(() => {
                addCallMessage(`Hi, this is ${name}. How can I help you?`, 'received');
            }, 500);
        }, 2000);
    }

    // Camera functionality
    let photoGallery = [];

    function takePhoto() {
        // Create a snapshot from camera viewfinder
        const snapshot = {
            id: Date.now(),
            date: new Date().toLocaleDateString(),
            src: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><rect width="100%" height="100%" fill="%23${Math.floor(Math.random()*16777215).toString(16)}"/><text x="50%" y="50%" font-family="Arial" font-size="20" fill="white" text-anchor="middle">Photo ${photoGallery.length + 1}</text></svg>`
        };

        // Add to gallery
        photoGallery.push(snapshot);

        // Show confirmation
        const confirmation = document.createElement('div');
        confirmation.className = 'photo-confirmation';
        confirmation.innerHTML = `
            <div class="photo-thumbnail">
                <img src="${snapshot.src}" alt="Photo">
            </div>
        `;

        // Add styles
        document.head.insertAdjacentHTML('beforeend', `
            <style>
                .photo-confirmation {
                    position: absolute;
                    bottom: 100px;
                    left: 20px;
                    animation: slideIn 0.3s forwards;
                }
                .photo-thumbnail {
                    width: 60px;
                    height: 60px;
                    border-radius: 8px;
                    overflow: hidden;
                    border: 2px solid white;
                }
                .photo-thumbnail img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                @keyframes slideIn {
                    from { transform: translateX(-100%); }
                    to { transform: translateX(0); }
                }
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
            </style>
        `);

        document.getElementById('camera-app').appendChild(confirmation);

        // Remove confirmation after a delay
        setTimeout(() => {
            confirmation.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(() => {
                confirmation.remove();
            }, 300);
        }, 2000);
    }

    // Photos app functionality
    const photosApp = document.querySelector('[data-app="photos"]');
    photosApp.addEventListener('click', () => {
        // Create and show photos app content if it doesn't exist
        let photosAppScreen = document.getElementById('photos-app');

        if (!photosAppScreen) {
            photosAppScreen = document.createElement('div');
            photosAppScreen.id = 'photos-app';
            photosAppScreen.className = 'app-screen';

            // Create initial structure
            photosAppScreen.innerHTML = `
                <div class="app-header">
                    <h1>Photos</h1>
                </div>
                <div class="photos-tabs">
                    <div class="photos-tab active">Library</div>
                    <div class="photos-tab">For You</div>
                    <div class="photos-tab">Albums</div>
                    <div class="photos-tab">Search</div>
                </div>
                <div class="photos-grid"></div>
            `;

            // Add styles
            document.head.insertAdjacentHTML('beforeend', `
                <style>
                    #photos-app {
                        background-color: #f2f2f7;
                    }
                    .photos-tabs {
                        display: flex;
                        border-bottom: 1px solid #e0e0e0;
                        margin-bottom: 15px;
                    }
                    .photos-tab {
                        flex: 1;
                        text-align: center;
                        padding: 10px 0;
                        font-size: 14px;
                        color: var(--ios-gray);
                    }
                    .photos-tab.active {
                        color: var(--ios-blue);
                        font-weight: 600;
                        border-bottom: 2px solid var(--ios-blue);
                    }
                    .photos-grid {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 2px;
                        padding: 2px;
                        overflow-y: auto;
                        height: calc(100% - 120px);
                    }
                    .photo-item {
                        aspect-ratio: 1/1;
                        background-color: #eee;
                        overflow: hidden;
                    }
                    .photo-item img {
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                    }
                    .empty-photos {
                        text-align: center;
                        padding: 40px 20px;
                        color: #555;
                    }
                </style>
            `);

            document.querySelector('.iphone').appendChild(photosAppScreen);

            // Make sure our newly created photos app is included in appScreens collection
            appScreens = document.querySelectorAll('.app-screen');
        }

        // Show the photos app
        photosAppScreen.style.display = 'flex';

        // Update photos grid
        const photosGrid = photosAppScreen.querySelector('.photos-grid');
        photosGrid.innerHTML = '';

        if (photoGallery.length === 0) {
            // Sample photos for the gallery
            const sampleColors = ['4CAF50', '2196F3', 'F44336', 'FFC107', '9C27B0', '795548'];
            for (let i = 0; i < 9; i++) {
                const color = sampleColors[i % sampleColors.length];
                photoGallery.push({
                    id: i,
                    date: new Date().toLocaleDateString(),
                    src: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="100%" height="100%" fill="%23${color}"/><text x="50%" y="50%" font-family="Arial" font-size="20" fill="white" text-anchor="middle">Sample ${i + 1}</text></svg>`
                });
            }
        }

        // Display photos
        photoGallery.forEach(photo => {
            const photoItem = document.createElement('div');
            photoItem.className = 'photo-item';
            photoItem.innerHTML = `<img src="${photo.src}" alt="Photo">`;
            photosGrid.appendChild(photoItem);

            // Add click event to show full photo
            photoItem.addEventListener('click', () => {
                showFullPhoto(photo);
            });
        });
    });

    // Show full photo
    function showFullPhoto(photo) {
        const fullPhoto = document.createElement('div');
        fullPhoto.className = 'full-photo-view';
        fullPhoto.innerHTML = `
            <div class="full-photo-header">
                <div class="back-button">
                    <svg viewBox="0 0 24 24" width="24" height="24"><path fill="#007AFF" d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z" /></svg>
                </div>
                <div class="photo-actions">
                    <div class="share-button">
                        <svg viewBox="0 0 24 24" width="24" height="24"><path fill="#007AFF" d="M18,16.08C17.24,16.08 16.56,16.38 16.04,16.85L8.91,12.7C8.96,12.47 9,12.24 9,12C9,11.76 8.96,11.53 8.91,11.3L15.96,7.19C16.5,7.69 17.21,8 18,8A3,3 0 0,0 21,5A3,3 0 0,0 18,2A3,3 0 0,0 15,5C15,5.24 15.04,5.47 15.09,5.7L8.04,9.81C7.5,9.31 6.79,9 6,9A3,3 0 0,0 3,12A3,3 0 0,0 6,15C6.79,15 7.5,14.69 8.04,14.19L15.16,18.34C15.11,18.55 15.08,18.77 15.08,19C15.08,20.61 16.39,21.91 18,21.91C19.61,21.91 20.92,20.61 20.92,19A2.92,2.92 0 0,0 18,16.08Z" /></svg>
                    </div>
                    <div class="delete-button">
                        <svg viewBox="0 0 24 24" width="24" height="24"><path fill="#FF3B30" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" /></svg>
                    </div>
                </div>
            </div>
            <div class="full-photo-container">
                <img src="${photo.src}" alt="Full Photo">
            </div>
        `;

        // Add styles
        document.head.insertAdjacentHTML('beforeend', `
            <style>
                .full-photo-view {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: black;
                    z-index: 150;
                    display: flex;
                    flex-direction: column;
                }
                .full-photo-header {
                    padding: 50px 20px 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .photo-actions {
                    display: flex;
                    gap: 5px;
                }
                .full-photo-container {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .full-photo-container img {
                    max-width: 100%;
                    max-height: 100%;
                    object-fit: contain;
                }
            </style>
        `);

        document.body.appendChild(fullPhoto);

        // Back button functionality
        const backButton = fullPhoto.querySelector('.back-button');
        backButton.addEventListener('click', () => {
            fullPhoto.remove();
        });

        // Delete functionality
        const deleteButton = fullPhoto.querySelector('.delete-button');
        deleteButton.addEventListener('click', () => {
            // Remove from gallery
            photoGallery = photoGallery.filter(p => p.id !== photo.id);
            fullPhoto.remove();

            // Refresh photos grid if visible
            const photosApp = document.getElementById('photos-app');
            if (photosApp && photosApp.style.display === 'flex') {
                const photosGrid = photosApp.querySelector('.photos-grid');
                photosGrid.innerHTML = '';

                if (photoGallery.length === 0) {
                    photosGrid.innerHTML = '<div class="empty-photos">No photos to display</div>';
                } else {
                    photoGallery.forEach(p => {
                        const photoItem = document.createElement('div');
                        photoItem.className = 'photo-item';
                        photoItem.innerHTML = `<img src="${p.src}" alt="Photo">`;
                        photosGrid.appendChild(photoItem);

                        photoItem.addEventListener('click', () => {
                            showFullPhoto(p);
                        });
                    });
                }
            }
        });
    }

    // Add WindowsXP App functionality
    const windowsxpApp = document.querySelector('[data-app="windowsxp"]');
    windowsxpApp.addEventListener('click', () => {
        // Create and show Windows XP app if it doesn't exist
        let windowsxpAppScreen = document.getElementById('windowsxp-app');

        if (!windowsxpAppScreen) {
            windowsxpAppScreen = document.createElement('div');
            windowsxpAppScreen.id = 'windowsxp-app';
            windowsxpAppScreen.className = 'app-screen';

            // Create initial structure with iframe
            windowsxpAppScreen.innerHTML = `
                <div class="app-header">
                    <div class="back-button">
                        <svg viewBox="0 0 24 24" width="24" height="24"><path fill="#007AFF" d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z" /></svg>
                    </div>
                    <h1>Windows XP - Phone Edition</h1>
                </div>
                <div class="windowsxp-container">
                    <iframe src="https://windowsxp-websimbro.on.websim.ai" frameborder="0"></iframe>
                </div>
            `;

            // Add styles
            document.head.insertAdjacentHTML('beforeend', `
                <style>
                    #windowsxp-app {
                        background-color: #f2f2f7;
                    }
                    .windowsxp-container {
                        flex: 1;
                        overflow: hidden;
                    }
                    .windowsxp-container iframe {
                        width: 100%;
                        height: 100%;
                        border: none;
                    }
                    .back-button {
                        padding: 5px;
                        margin-right: 10px;
                    }
                    #windowsxp-app .app-header {
                        display: flex;
                        align-items: center;
                    }
                    #windowsxp-app .app-header h1 {
                        font-size: 20px;
                    }
                </style>
            `);

            document.querySelector('.iphone').appendChild(windowsxpAppScreen);

            // Make sure our newly created app is included in appScreens collection
            appScreens = document.querySelectorAll('.app-screen');

            // Back button functionality
            const backButton = windowsxpAppScreen.querySelector('.back-button');
            backButton.addEventListener('click', () => {
                windowsxpAppScreen.style.animation = 'app-close 0.3s forwards';
                setTimeout(() => {
                    windowsxpAppScreen.style.display = 'none';
                }, 300);
            });
        }

        // Show the Windows XP app
        windowsxpAppScreen.style.display = 'flex';
    });

    // Add AI Assistant functionality
    const aiApp = document.querySelector('[data-app="ai-assistant"]');
    let conversationHistory = [];

    // Load saved AI conversation from localStorage
    if (localStorage.getItem('iosSimulatorAiChat')) {
        conversationHistory = JSON.parse(localStorage.getItem('iosSimulatorAiChat'));
    }

    aiApp.addEventListener('click', () => {
        // Create and show AI assistant app content if it doesn't exist
        let aiAppScreen = document.getElementById('ai-assistant-app');

        if (aiAppScreen) {
            aiAppScreen.style.display = 'flex';

            // If conversation is empty, add initial welcome message
            if (conversationHistory.length === 0 && !aiMessagesContainer.innerHTML) {
                setTimeout(() => {
                    const welcomeMessage = "Hello! I'm your AI assistant. How can I help you today?";
                    addAiMessage(welcomeMessage, 'received');
                    conversationHistory.push({
                        role: "assistant",
                        content: welcomeMessage
                    });
                    localStorage.setItem('iosSimulatorAiChat', JSON.stringify(conversationHistory));
                }, 1000);
            } else if (conversationHistory.length > 0 && !aiMessagesContainer.innerHTML) {
                // Load conversation history into UI
                conversationHistory.forEach(msg => {
                    addAiMessage(msg.content, msg.role === "user" ? 'sent' : 'received');
                });
            }
        }
    });

    // Setup AI Assistant
    const aiMessagesContainer = document.querySelector('.ai-messages-container');
    const aiMessageInput = document.querySelector('.ai-message-input');
    const aiSendButton = document.querySelector('.ai-send-button');

    if (aiMessageInput && aiSendButton) {
        // Send message on click or Enter key
        aiSendButton.addEventListener('click', sendAiMessage);
        aiMessageInput.addEventListener('keypress', e => {
            if (e.key === 'Enter') {
                sendAiMessage();
            }
        });

        // Monitor input for enabling/disabling send button
        aiMessageInput.addEventListener('input', () => {
            aiSendButton.disabled = aiMessageInput.value.trim() === '';
        });
    }

    // Function to send message to AI
    async function sendAiMessage() {
        const text = aiMessageInput.value.trim();
        if (!text) return;

        // Add user message to UI
        addAiMessage(text, 'sent');

        // Add to conversation history
        conversationHistory.push({
            role: "user",
            content: text
        });

        // Save to localStorage
        localStorage.setItem('iosSimulatorAiChat', JSON.stringify(conversationHistory));

        // Clear input
        aiMessageInput.value = '';
        aiSendButton.disabled = true;

        // Show thinking indicator
        const thinkingIndicator = document.createElement('div');
        thinkingIndicator.className = 'ai-thinking';
        thinkingIndicator.innerHTML = `
            <div class="ai-thinking-dots">
                <div class="ai-thinking-dot"></div>
                <div class="ai-thinking-dot"></div>
                <div class="ai-thinking-dot"></div>
            </div>
        `;
        aiMessagesContainer.appendChild(thinkingIndicator);
        aiMessagesContainer.scrollTop = aiMessagesContainer.scrollHeight;

        // Process the AI response
        try {
            const response = await getAiResponse(text);

            // Remove thinking indicator
            thinkingIndicator.remove();

            // Add AI response to UI
            addAiMessage(response, 'received');

            // Add to conversation history
            conversationHistory.push({
                role: "assistant",
                content: response
            });

            // Save to localStorage
            localStorage.setItem('iosSimulatorAiChat', JSON.stringify(conversationHistory));

            // Keep history limited to last 10 messages
            if (conversationHistory.length > 20) {
                conversationHistory = conversationHistory.slice(-20);
                localStorage.setItem('iosSimulatorAiChat', JSON.stringify(conversationHistory));
            }
        } catch (error) {
            // Remove thinking indicator
            thinkingIndicator.remove();

            // Show error message
            addAiMessage("I'm sorry, I couldn't process your request. Please try again.", 'received');
        }
    }

    // Function to get AI response (using language model API)
    async function getAiResponse(userMessage) {
        try {
            // Use the language model to generate a response
            const completion = await websim.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful, friendly AI assistant on an iOS device. Provide concise, informative responses. If you don't know something, say so clearly. Avoid long explanations or disclaimers. Respond as if you're having a natural conversation with a friend."
                    },
                    ...conversationHistory.slice(-10)  // Send the last 10 messages for context
                ],
            });

            return completion.content;
        } catch (error) {
            console.error("Error getting AI response:", error);
            return "I'm sorry, I'm having trouble processing your request. Could you try again?";
        }
    }

    // Add message to AI chat
    function addAiMessage(text, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `ai-message-bubble ai-message-${type}`;
        messageDiv.textContent = text;

        if (aiMessagesContainer) {
            aiMessagesContainer.appendChild(messageDiv);

            // Scroll to bottom
            aiMessagesContainer.scrollTop = aiMessagesContainer.scrollHeight;
        }
    }

    document.head.insertAdjacentHTML('beforeend', `
        <style>
            @keyframes app-open {
                from { transform: scale(0.95); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
            }

            @keyframes app-close {
                from { transform: scale(1); opacity: 1; }
                to { transform: scale(0.95); opacity: 0; }
            }

            .ripple {
                position: absolute;
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s linear;
                background-color: rgba(255, 255, 255, 0.7);
            }

            @keyframes ripple {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }

            @keyframes slide-up-unlock {
                0% { transform: translateY(0); opacity: 1; }
                100% { transform: translateY(-100%); opacity: 0; }
            }
        </style>
    `);

    // Add App Store functionality
    const appStoreApp = document.querySelector('[data-app="app-store"]');
    appStoreApp.addEventListener('click', () => {
        // Create and show App Store if it doesn't exist
        let appStoreScreen = document.getElementById('app-store-app');

        if (!appStoreScreen) {
            appStoreScreen = document.createElement('div');
            appStoreScreen.id = 'app-store-app';
            appStoreScreen.className = 'app-screen';

            // Create initial structure
            appStoreScreen.innerHTML = `
                <div class="app-header">
                    <h1>App Store</h1>
                </div>
                <div class="app-store-tabs">
                    <div class="app-store-tab active">Today</div>
                    <div class="app-store-tab">Games</div>
                    <div class="app-store-tab">Apps</div>
                    <div class="app-store-tab">Arcade</div>
                    <div class="app-store-tab">Search</div>
                </div>
                <div class="app-store-content">
                    <div class="app-store-featured">
                        <h2>FEATURED APP</h2>
                        <div class="featured-app">
                            <div class="featured-app-icon">
                                <svg viewBox="0 0 24 24" width="60" height="60"><path fill="#FF9800" d="M21,16.5C21,16.88 20.79,17.21 20.47,17.38L12.57,21.82C12.41,21.94 12.21,22 12,22C11.79,22 11.59,21.94 11.43,21.82L3.53,17.38C3.21,17.21 3,16.88 3,16.5V7.5C3,7.12 3.21,6.79 3.53,6.62L11.43,2.18C11.59,2.06 11.79,2 12,2C12.21,2 12.41,2.06 12.57,2.18L20.47,6.62C20.79,6.79 21,7.12 21,7.5V16.5M12,4.15L6.04,7.5L12,10.85L17.96,7.5L12,4.15M5,15.91L11,19.29V12.58L5,9.21V15.91M19,15.91V9.21L13,12.58V19.29L19,15.91Z" /></svg>
                            </div>
                            <div class="featured-app-info">
                                <div class="featured-app-name">AR Builder Pro</div>
                                <div class="featured-app-desc">Build amazing augmented reality experiences</div>
                                <button class="app-download-btn">GET</button>
                            </div>
                        </div>

                        <div class="app-categories">
                            <h2>CATEGORIES</h2>
                            <div class="category-grid">
                                <div class="category-item" data-category="games">
                                    <div class="category-icon" style="background-color: #FF5722;">
                                        <svg viewBox="0 0 24 24" width="30" height="30"><path fill="white" d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,6H3C1.9,6 1,6.9 1,8V16C1,17.1 1.9,18 3,18H21C22.1,18 23,17.1 23,16V8C23,6.9 22.1,6 21,6M21,16H3V8H21V16M6,15H8V13H10V11H8V9H6V11H4V13H6V15M14.5,12A1.5,1.5 0 0,1 16,13.5A1.5,1.5 0 0,1 14.5,15A1.5,1.5 0 0,1 13,13.5A1.5,1.5 0 0,1 14.5,12M18.5,9A1.5,1.5 0 0,1 20,10.5A1.5,1.5 0 0,1 18.5,12A1.5,1.5 0 0,1 17,10.5A1.5,1.5 0 0,1 18.5,9Z" /></svg>
                                    </div>
                                    <div class="category-name">Games</div>
                                </div>
                                <div class="category-item" data-category="productivity">
                                    <div class="category-icon" style="background-color: #4CAF50;">
                                        <svg viewBox="0 0 24 24" width="30" height="30"><path fill="white" d="M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,1 5,21H19A2,2 0 0,1 21,19V5C21,3.89 20.1,3 19,3M19,5V19H5V5H19Z" /></svg>
                                    </div>
                                    <div class="category-name">Productivity</div>
                                </div>
                                <div class="category-item" data-category="education">
                                    <div class="category-icon" style="background-color: #2196F3;">
                                        <svg viewBox="0 0 24 24" width="30" height="30"><path fill="white" d="M12,3L1,9L12,15L21,10.09V17H23V9M5,15.91L11,19.29V12.58L5,9.21V15.91M19,15.91V9.21L13,12.58V19.29L19,15.91Z" /></svg>
                                    </div>
                                    <div class="category-name">Education</div>
                                </div>
                                <div class="category-item" data-category="entertainment">
                                    <div class="category-icon" style="background-color: #9C27B0;">
                                        <svg viewBox="0 0 24 24" width="30" height="30"><path fill="white" d="M18,9H16V7H18M18,13H16V11H18M18,17H16V15H18M6,15H8V13H10V11H8V9H6V11H4V13H6V15M14.5,12A1.5,1.5 0 0,1 16,13.5A1.5,1.5 0 0,1 14.5,15A1.5,1.5 0 0,1 13,13.5A1.5,1.5 0 0,1 14.5,12M18.5,9A1.5,1.5 0 0,1 20,10.5A1.5,1.5 0 0,1 18.5,12A1.5,1.5 0 0,1 17,10.5A1.5,1.5 0 0,1 18.5,9Z" /></svg>
                                    </div>
                                    <div class="category-name">Entertainment</div>
                                </div>
                            </div>
                        </div>

                        <div class="app-list-section">
                            <h2>TOP FREE APPS</h2>
                            <div class="app-list">
                                <div class="app-list-item">
                                    <div class="app-rank">1</div>
                                    <div class="app-list-icon">
                                        <svg viewBox="0 0 24 24" width="50" height="50"><path fill="#5D4037" d="M4,2H20A2,2 0 0,1 22,4V20A2,2 0 0,1 20,22H4A2,2 0 0,1 2,20V4A2,2 0 0,1 4,2M6,6V10H10V6H6M12,6V10H16V6H12M18,6V10H20V6H18M6,12V16H10V12H6M12,12V16H16V12H12M18,12V16H20V12H18M6,18V20H10V18H6M12,18V20H16V18H12M18,18V20H20V18H18Z" /></svg>
                                    </div>
                                    <div class="app-list-info">
                                        <div class="app-list-name">Minecraft</div>
                                        <div class="app-list-desc">Explore, build, and survive!</div>
                                    </div>
                                    <button class="app-get-btn">GET</button>
                                </div>
                                <div class="app-list-item">
                                    <div class="app-rank">2</div>
                                    <div class="app-list-icon">
                                        <svg viewBox="0 0 24 24" width="50" height="50"><path fill="#4CAF50" d="M12,17.5C8.09,17.5 5,14.41 5,10.5C5,6.59 8.09,3.5 12,3.5C15.91,3.5 19,6.59 19,10.5C19,14.41 15.91,17.5 12,17.5M12,2A8.5,8.5 0 0,0 3.5,10.5A8.5,8.5 0 0,0 12,19A8.5,8.5 0 0,0 20.5,10.5A8.5,8.5 0 0,0 12,2M12,5A3.5,3.5 0 0,0 8.5,8.5A3.5,3.5 0 0,0 12,12A3.5,3.5 0 0,0 15.5,8.5A3.5,3.5 0 0,0 12,5M12,7A1.5,1.5 0 0,1 13.5,8.5A1.5,1.5 0 0,1 12,10A1.5,1.5 0 0,1 10.5,8.5A1.5,1.5 0 0,1 12,7Z" /></svg>
                                    </div>
                                    <div class="app-list-info">
                                        <div class="app-list-name">Weather Radar Pro</div>
                                        <div class="app-list-desc">Real-time weather forecasts</div>
                                    </div>
                                    <button class="app-get-btn">GET</button>
                                </div>
                            </div>
                        </div>

                        <div class="app-detail-view">
                            <div class="app-detail-header">
                                <div class="back-button">
                                    <svg viewBox="0 0 24 24" width="24" height="24"><path fill="#007AFF" d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z" /></svg>
                                </div>
                                <div class="app-detail-title"></div>
                            </div>
                            <div class="app-detail-content">
                                <div class="app-detail-hero">
                                    <div class="app-detail-icon"></div>
                                    <div class="app-detail-info">
                                        <div class="app-detail-name"></div>
                                        <div class="app-detail-developer"></div>
                                        <button class="app-install-btn">GET</button>
                                    </div>
                                </div>
                                <div class="app-detail-screenshots">
                                    <div class="screenshot"></div>
                                    <div class="screenshot"></div>
                                    <div class="screenshot"></div>
                                </div>
                                <div class="app-detail-description"></div>
                                <div class="app-detail-reviews">
                                    <h3>Ratings & Reviews</h3>
                                    <div class="app-rating">4.8 ★★★★★</div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            // Add styles
            document.head.insertAdjacentHTML('beforeend', `
                <style>
                    #app-store-app {
                        background-color: #f2f2f7;
                    }
                    .app-store-tabs {
                        display: flex;
                        justify-content: space-around;
                        border-bottom: 1px solid #e0e0e0;
                        padding: 0 10px;
                    }
                    .app-store-tab {
                        padding: 10px 0;
                        font-size: 14px;
                        color: var(--ios-gray);
                        position: relative;
                    }
                    .app-store-tab.active {
                        color: var(--ios-blue);
                        font-weight: 600;
                    }
                    .app-store-tab.active::after {
                        content: '';
                        position: absolute;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        height: 2px;
                        background-color: var(--ios-blue);
                    }
                    .app-store-content {
                        flex: 1;
                        overflow-y: auto;
                        padding: 15px;
                    }
                    .app-store-featured, .app-categories, .app-list-section {
                        margin-bottom: 25px;
                    }
                    .app-store-content h2 {
                        font-size: 14px;
                        color: #888;
                        margin-bottom: 10px;
                    }
                    .featured-app {
                        background-color: white;
                        border-radius: 12px;
                        padding: 15px;
                        display: flex;
                        align-items: center;
                        box-shadow: 0 2px 6px rgba(0,0,0,0.05);
                    }
                    .featured-app-icon {
                        margin-right: 15px;
                    }
                    .featured-app-info {
                        flex: 1;
                    }
                    .featured-app-name {
                        font-size: 18px;
                        font-weight: 600;
                        margin-bottom: 5px;
                    }
                    .featured-app-desc {
                        font-size: 14px;
                        color: #666;
                        margin-bottom: 10px;
                    }
                    .app-download-btn, .app-get-btn, .app-install-btn {
                        background-color: #f2f2f7;
                        border: none;
                        border-radius: 15px;
                        padding: 5px 20px;
                        font-weight: 600;
                        color: var(--ios-blue);
                        cursor: pointer;
                    }
                    .app-install-btn {
                        padding: 8px 30px;
                        font-size: 16px;
                    }
                    .app-download-btn:active, .app-get-btn:active, .app-install-btn:active {
                        background-color: #e5e5ea;
                    }
                    .category-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 10px;
                    }
                    .category-item {
                        background-color: white;
                        border-radius: 12px;
                        padding: 15px;
                        display: flex;
                        align-items: center;
                        box-shadow: 0 2px 6px rgba(0,0,0,0.05);
                        cursor: pointer;
                    }
                    .category-icon {
                        width: 50px;
                        height: 50px;
                        border-radius: 10px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin-right: 10px;
                    }
                    .category-name {
                        font-size: 16px;
                        font-weight: 500;
                    }
                    .app-list {
                        background-color: white;
                        border-radius: 12px;
                        overflow: hidden;
                        box-shadow: 0 2px 6px rgba(0,0,0,0.05);
                    }
                    .app-list-item {
                        display: flex;
                        align-items: center;
                        padding: 12px 15px;
                        border-bottom: 1px solid #f2f2f7;
                    }
                    .app-list-item:last-child {
                        border-bottom: none;
                    }
                    .app-rank {
                        width: 24px;
                        font-size: 17px;
                        font-weight: 600;
                        color: #666;
                        text-align: center;
                    }
                    .app-list-icon {
                        margin: 0 15px;
                        border-radius: 10px;
                        overflow: hidden;
                    }
                    .app-list-info {
                        flex: 1;
                    }
                    .app-list-name {
                        font-size: 16px;
                        font-weight: 500;
                        margin-bottom: 2px;
                    }
                    .app-list-desc {
                        font-size: 13px;
                        color: #666;
                    }
                    .app-get-btn {
                        padding: 5px 15px;
                        font-size: 14px;
                    }
                    .app-detail-view {
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background-color: #f2f2f7;
                        z-index: 30;
                        display: none;
                        flex-direction: column;
                    }
                    .app-detail-header {
                        padding: 50px 20px 10px;
                        display: flex;
                        align-items: center;
                        background-color: #f2f2f7;
                    }
                    .app-detail-title {
                        font-size: 20px;
                        font-weight: 600;
                        margin-left: 15px;
                    }
                    .app-detail-content {
                        flex: 1;
                        overflow-y: auto;
                        padding: 15px;
                    }
                    .app-detail-hero {
                        display: flex;
                        align-items: center;
                        margin-bottom: 20px;
                    }
                    .app-detail-icon {
                        width: 100px;
                        height: 100px;
                        border-radius: 20px;
                        margin-right: 15px;
                        background-color: #eee;
                        overflow: hidden;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .app-detail-info {
                        flex: 1;
                    }
                    .app-detail-name {
                        font-size: 24px;
                        font-weight: 600;
                        margin-bottom: 5px;
                    }
                    .app-detail-developer {
                        font-size: 14px;
                        color: #666;
                        margin-bottom: 15px;
                    }
                    .app-detail-screenshots {
                        display: flex;
                        gap: 10px;
                        overflow-x: auto;
                        margin-bottom: 20px;
                        padding: 5px 0;
                    }
                    .screenshot {
                        min-width: 200px;
                        height: 350px;
                        background-color: #ddd;
                        border-radius: 12px;
                    }
                    .app-detail-description {
                        font-size: 15px;
                        line-height: 1.5;
                        margin-bottom: 20px;
                    }
                    .app-detail-reviews {
                        margin-bottom: 20px;
                    }
                    .app-detail-reviews h3 {
                        font-size: 18px;
                        margin-bottom: 10px;
                    }
                    .app-rating {
                        font-size: 28px;
                        font-weight: 600;
                    }
                    .installed-badge {
                        background-color: #e0e0e0;
                        color: #666;
                        border-radius: 15px;
                        padding: 5px 15px;
                        font-weight: 600;
                        font-size: 14px;
                    }
                </style>
            `);

            document.querySelector('.iphone').appendChild(appStoreScreen);

            // Make sure our newly created app is included in appScreens collection
            appScreens = document.querySelectorAll('.app-screen');

            // App detail data
            const appDetails = {
                'Weather Radar Pro': {
                    name: 'Weather Radar Pro',
                    developer: 'CloudTech Inc.',
                    icon: '<svg viewBox="0 0 24 24" width="80" height="80"><path fill="#4CAF50" d="M12,17.5C8.09,17.5 5,14.41 5,10.5C5,6.59 8.09,3.5 12,3.5C15.91,3.5 19,6.59 19,10.5C19,14.41 15.91,17.5 12,17.5M12,2A8.5,8.5 0 0,0 3.5,10.5A8.5,8.5 0 0,0 12,19A8.5,8.5 0 0,0 20.5,10.5A8.5,8.5 0 0,0 12,2M12,5A3.5,3.5 0 0,0 8.5,8.5A3.5,3.5 0 0,0 12,12A3.5,3.5 0 0,0 15.5,8.5A3.5,3.5 0 0,0 12,5M12,7A1.5,1.5 0 0,1 13.5,8.5A1.5,1.5 0 0,1 12,10A1.5,1.5 0 0,1 10.5,8.5A1.5,1.5 0 0,1 12,7Z" /></svg>',
                    description: 'Weather Radar Pro provides real-time weather forecasts with advanced radar technology. Track storms, check hourly forecasts, and receive severe weather alerts. Features include: temperature maps, precipitation radar, wind speed indicators, and 10-day forecasts.',
                    category: 'Utilities'
                },
                'Pixel Dungeon': {
                    name: 'Pixel Dungeon',
                    developer: 'Retro Games Studio',
                    icon: '<svg viewBox="0 0 24 24" width="80" height="80"><path fill="#F44336" d="M21,6H3C1.9,6 1,6.9 1,8V16C1,17.1 1.9,18 3,18H21C22.1,18 23,17.1 23,16V8C23,6.9 22.1,6 21,6M21,16H3V8H21V16M6,15H8V13H10V11H8V9H6V11H4V13H6V15M14.5,12A1.5,1.5 0 0,1 16,13.5A1.5,1.5 0 0,1 14.5,15A1.5,1.5 0 0,1 13,13.5A1.5,1.5 0 0,1 14.5,12M18.5,9A1.5,1.5 0 0,1 20,10.5A1.5,1.5 0 0,1 18.5,12A1.5,1.5 0 0,1 17,10.5A1.5,1.5 0 0,1 18.5,9Z" /></svg>',
                    description: 'Pixel Dungeon is a traditional roguelike game with pixel art graphics and simple but challenging gameplay. Explore randomly generated dungeons, collect items, fight monsters, and try to survive as long as possible. Features procedurally generated levels, multiple character classes, and hundreds of items to discover.',
                    category: 'Games'
                },
                'ChatMaster': {
                    name: 'ChatMaster',
                    developer: 'SocialApps Ltd.',
                    icon: '<svg viewBox="0 0 24 24" width="80" height="80"><path fill="#2196F3" d="M4,2H20A2,2 0 0,1 22,4V16A2,2 0 0,1 20,18H16L12,22L8,18H4A2,2 0 0,1 2,16V4A2,2 0 0,1 4,2M4,4V16H8.83L12,19.17L15.17,16H20V4H4M6,7H18V9H6V7M6,11H16V13H6V11Z" /></svg>',
                    description: 'ChatMaster is the ultimate messaging app that lets you connect with friends and family around the world. Send text messages, voice notes, photos, videos, and more. Features end-to-end encryption, group chats, voice and video calls, and customizable themes.',
                    category: 'Social'
                },
                'DataVault': {
                    name: 'DataVault',
                    developer: 'SecureTech Solutions',
                    icon: '<svg viewBox="0 0 24 24" width="80" height="80"><path fill="#FF9800" d="M12,3C7.58,3 4,4.79 4,7C4,9.21 7.58,11 12,11C16.42,11 20,9.21 20,7C20,4.79 16.42,3 12,3M4,9V12C4,14.21 7.58,16 12,16C16.42,16 20,14.21 20,12V9C20,11.21 16.42,13 12,13C7.58,13 4,11.21 4,9M4,14V17C4,19.21 7.58,21 12,21C16.42,21 20,19.21 20,17V14C20,16.21 16.42,18 12,18C7.58,18 4,16.21 4,14Z" /></svg>',
                    description: 'DataVault is a secure password manager that helps you generate, store, and manage your passwords across all your devices. With military-grade encryption, your sensitive information stays protected. Features include password generator, autofill capabilities, security breach alerts, and secure notes.',
                    category: 'Security'
                },
                'AR Builder Pro': {
                    name: 'AR Builder Pro',
                    developer: 'Future Tech Labs',
                    icon: '<svg viewBox="0 0 24 24" width="80" height="80"><path fill="#FF9800" d="M21,16.5C21,16.88 20.79,17.21 20.47,17.38L12.57,21.82C12.41,21.94 12.21,22 12,22C11.79,22 11.59,21.94 11.43,21.82L3.53,17.38C3.21,17.21 3,16.88 3,16.5V7.5C3,7.12 3.21,6.79 3.53,6.62L11.43,2.18C11.59,2.06 11.79,2 12,2C12.21,2 12.41,2.06 12.57,2.18L20.47,6.62C20.79,6.79 21,7.12 21,7.5V16.5M12,4.15L6.04,7.5L12,10.85L17.96,7.5L12,4.15M5,15.91L11,19.29V12.58L5,9.21V15.91M19,15.91V9.21L13,12.58V19.29L19,15.91Z" /></svg>',
                    description: 'AR Builder Pro is a powerful augmented reality development platform that lets you create immersive AR experiences with no coding required. Build 3D models, create interactive animations, and share your creations with friends. Perfect for education, gaming, interior design, and more.',
                    category: 'Productivity'
                },
                'Minecraft': {
                    name: 'Minecraft',
                    developer: 'Mojang Studios',
                    icon: '<svg viewBox="0 0 24 24" width="80" height="80"><path fill="#5D4037" d="M4,2H20A2,2 0 0,1 22,4V20A2,2 0 0,1 20,22H4A2,2 0 0,1 2,20V4A2,2 0 0,1 4,2M6,6V10H10V6H6M12,6V10H16V6H12M18,6V10H20V6H18M6,12V16H10V12H6M12,12V16H16V12H12M18,12V16H20V12H18M6,18V20H10V18H6M12,18V20H16V18H12M18,18V20H20V18H18Z" /></svg>',
                    description: 'Explore infinite worlds and build everything from the simplest of homes to the grandest of castles. Play in creative mode with unlimited resources or mine deep into the world in survival mode, crafting weapons and armor to fend off dangerous mobs.',
                    category: 'Games'
                }
            };

            // Store for installed apps
            let installedApps = [];
            if (localStorage.getItem('iosSimulatorInstalledApps')) {
                installedApps = JSON.parse(localStorage.getItem('iosSimulatorInstalledApps'));
            }

            // Featured app click event
            const featuredApp = appStoreScreen.querySelector('.featured-app');
            featuredApp.addEventListener('click', () => {
                showAppDetail('AR Builder Pro');
            });

            // App list items click events
            const appListItems = appStoreScreen.querySelectorAll('.app-list-item');
            appListItems.forEach(item => {
                const appName = item.querySelector('.app-list-name').textContent;
                item.addEventListener('click', () => {
                    showAppDetail(appName);
                });
            });

            // App download buttons
            const downloadButtons = appStoreScreen.querySelectorAll('.app-download-btn, .app-get-btn');
            downloadButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent triggering parent click
                    const appItem = button.closest('.featured-app') || button.closest('.app-list-item');
                    const appName = appItem.querySelector('.featured-app-name, .app-list-name').textContent;

                    // Start download animation
                    button.textContent = 'DOWNLOADING...';
                    setTimeout(() => {
                        button.textContent = 'INSTALLING...';
                        setTimeout(() => {
                            // Add to installed apps
                            if (!installedApps.includes(appName)) {
                                installedApps.push(appName);
                                localStorage.setItem('iosSimulatorInstalledApps', JSON.stringify(installedApps));
                            }

                            button.textContent = 'INSTALLED';
                            button.disabled = true;
                            button.style.backgroundColor = '#e0e0e0';
                            button.style.color = '#666';

                            // Show temporary notification
                            showInstalledNotification(appName);
                        }, 1500);
                    }, 1500);
                });
            });

            // Show app detail
            function showAppDetail(appName) {
                const appData = appDetails[appName];
                if (!appData) return;

                const detailView = appStoreScreen.querySelector('.app-detail-view');
                const detailTitle = detailView.querySelector('.app-detail-title');
                const detailIcon = detailView.querySelector('.app-detail-icon');
                const detailName = detailView.querySelector('.app-detail-name');
                const detailDeveloper = detailView.querySelector('.app-detail-developer');
                const detailDescription = detailView.querySelector('.app-detail-description');
                const installBtn = detailView.querySelector('.app-install-btn');

                // Set details
                detailTitle.textContent = appData.category;
                detailIcon.innerHTML = appData.icon;
                detailName.textContent = appData.name;
                detailDeveloper.textContent = appData.developer;
                detailDescription.textContent = appData.description;

                // Check if app is already installed
                if (installedApps.includes(appName)) {
                    installBtn.textContent = 'INSTALLED';
                    installBtn.disabled = true;
                    installBtn.style.backgroundColor = '#e0e0e0';
                    installBtn.style.color = '#666';
                } else {
                    installBtn.textContent = 'GET';
                    installBtn.disabled = false;
                    installBtn.style.backgroundColor = '';
                    installBtn.style.color = '';
                }

                // Generate random screenshots
                const screenshots = detailView.querySelectorAll('.screenshot');
                const colors = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336'];
                screenshots.forEach((screenshot, index) => {
                    const color = colors[index % colors.length];
                    screenshot.style.backgroundColor = color;
                });

                // Show detail view
                detailView.style.display = 'flex';

                // Install button event
                installBtn.onclick = (e) => {
                    e.stopPropagation();
                    if (installBtn.disabled) return;

                    // Start download animation
                    installBtn.textContent = 'DOWNLOADING...';
                    setTimeout(() => {
                        installBtn.textContent = 'INSTALLING...';
                        setTimeout(() => {
                            // Add to installed apps
                            if (!installedApps.includes(appName)) {
                                installedApps.push(appName);
                                localStorage.setItem('iosSimulatorInstalledApps', JSON.stringify(installedApps));
                            }

                            installBtn.textContent = 'INSTALLED';
                            installBtn.disabled = true;
                            installBtn.style.backgroundColor = '#e0e0e0';
                            installBtn.style.color = '#666';

                            // Show temporary notification
                            showInstalledNotification(appName);
                        }, 1500);
                    }, 1500);
                };

                // Back button
                const backButton = detailView.querySelector('.back-button');
                backButton.onclick = () => {
                    detailView.style.display = 'none';
                };
            }

            // Show installed notification
            function showInstalledNotification(appName) {
                const notification = document.createElement('div');
                notification.className = 'app-installed-notification';
                notification.innerHTML = `
                    <div class="app-notification-icon">
                        <svg viewBox="0 0 24 24" width="24" height="24"><path fill="#4CAF50" d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" /></svg>
                    </div>
                    <div class="app-notification-text">${appName} successfully installed</div>
                `;

                // Add styles
                document.head.insertAdjacentHTML('beforeend', `
                    <style>
                        .app-installed-notification {
                            position: fixed;
                            top: 80px;
                            left: 50%;
                            transform: translateX(-50%);
                            background-color: rgba(0, 0, 0, 0.8);
                            color: white;
                            padding: 12px 20px;
                            border-radius: 10px;
                            display: flex;
                            align-items: center;
                            gap: 10px;
                            z-index: 1000;
                            animation: notification-appear 0.3s, notification-disappear 0.3s 2s forwards;
                        }
                        .app-notification-icon {
                            background-color: #4CAF50;
                            border-radius: 50%;
                            width: 30px;
                            height: 30px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        }
                        @keyframes notification-appear {
                            from { opacity: 0; transform: translate(-50%, -20px); }
                            to { opacity: 1; transform: translate(-50%, 0); }
                        }
                        @keyframes notification-disappear {
                            from { opacity: 1; transform: translate(-50%, 0); }
                            to { opacity: 0; transform: translate(-50%, -20px); }
                        }
                    </style>
                `);

                document.body.appendChild(notification);

                // Remove after animation
                setTimeout(() => {
                    notification.remove();
                }, 2500);
                
                // Add the installed app to the home screen
                addAppToHomeScreen(appName);
            }
            
            // Function to add installed app to home screen
            function addAppToHomeScreen(appName) {
                const appGrid = document.querySelector('.app-grid');
                const appData = appDetails[appName];
                
                if (!appData) return;
                
                // Create app icon for home screen
                const appElement = document.createElement('div');
                appElement.className = 'app';
                appElement.setAttribute('data-app', appName.toLowerCase().replace(/\s+/g, '-'));
                
                // Get icon from app details
                appElement.innerHTML = `
                    ${appData.icon.replace('width="80" height="80"', 'width="35" height="35"')}
                    <span>${appName}</span>
                `;
                
                // Add to app grid
                appGrid.appendChild(appElement);
                
                // Add click event to open the app
                appElement.addEventListener('click', () => {
                    // Create app screen if it doesn't exist
                    let appScreen = document.getElementById(`${appName.toLowerCase().replace(/\s+/g, '-')}-app`);
                    
                    if (!appScreen) {
                        appScreen = document.createElement('div');
                        appScreen.id = `${appName.toLowerCase().replace(/\s+/g, '-')}-app`;
                        appScreen.className = 'app-screen';
                        
                        // Basic app content
                        appScreen.innerHTML = `
                            <div class="app-header">
                                <h1>${appName}</h1>
                            </div>
                            <div class="app-content">
                                ${appName === 'Minecraft' ? 
                                `<iframe src="https://eaglercraft-minecraft-game.on.websim.ai/" frameborder="0" style="width:100%; height:100%; border:none;"></iframe>` :
                                `<div class="app-welcome">
                                    <h2>Welcome to ${appName}</h2>
                                    <p>This app was installed from the App Store.</p>
                                    <p>${appData.description}</p>
                                </div>`}
                            </div>
                        `;
                        
                        // Add styles
                        document.head.insertAdjacentHTML('beforeend', `
                            <style>
                                #${appName.toLowerCase().replace(/\s+/g, '-')}-app {
                                    background-color: #f2f2f7;
                                }
                                .app-content {
                                    flex: 1;
                                    padding: 20px;
                                    overflow-y: auto;
                                }
                                .app-welcome {
                                    background-color: white;
                                    border-radius: 12px;
                                    padding: 20px;
                                    box-shadow: 0 2px 6px rgba(0,0,0,0.05);
                                }
                                .app-welcome h2 {
                                    margin-bottom: 15px;
                                    font-size: 22px;
                                }
                                .app-welcome p {
                                    margin-bottom: 10px;
                                    line-height: 1.4;
                                }
                            </style>
                        `);
                        
                        document.querySelector('.iphone').appendChild(appScreen);
                        
                        // Update app screens collection
                        appScreens = document.querySelectorAll('.app-screen');
                    }
                    
                    // Show the app screen
                    appScreen.style.display = 'flex';
                    
                    // Add ripple effect
                    createRippleEffect(appElement);
                });
            }
            
            // Load previously installed apps on startup
            function loadInstalledApps() {
                if (installedApps && installedApps.length > 0) {
                    installedApps.forEach(appName => {
                        addAppToHomeScreen(appName);
                    });
                }
            }
            
            // Load installed apps when App Store is initialized
            loadInstalledApps();
        }

        // Show the App Store
        appStoreScreen.style.display = 'flex';
    });
});
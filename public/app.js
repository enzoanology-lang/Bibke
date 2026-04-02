// State Management
const state = {
    isAuthenticated: false,
    userToken: null,
    userName: null,
    chatHistory: [],
    sessionId: null
};

// DOM Elements
const elements = {
    loginModal: document.getElementById('login-modal'),
    modalLoginBtn: document.getElementById('modal-login-btn'),
    modalSignupBtn: document.getElementById('modal-signup-btn'),
    modalGuestBtn: document.getElementById('modal-guest-btn'),
    chatContainer: document.getElementById('chat-container'),
    messageInput: document.getElementById('message-input'),
    sendBtn: document.getElementById('send-btn'),
    micBtn: document.getElementById('mic-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    profileLink: document.getElementById('profile-link'),
    bibleLink: document.getElementById('bible-link'),
    aboutLink: document.getElementById('about-link')
};

// API Configuration
const API_ENDPOINT = 'https://rest-api-ruhv.onrender.com/api/bibleai';
const API_KEY = 'selovasx2024';

// Generate a unique session ID
function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Get or create session ID
function getSessionId() {
    let sessionId = localStorage.getItem('bibleai_session_id');
    if (!sessionId) {
        sessionId = generateSessionId();
        localStorage.setItem('bibleai_session_id', sessionId);
    }
    return sessionId;
}

// Initialize App
function initApp() {
    state.sessionId = getSessionId();
    console.log('Session ID:', state.sessionId);
    checkAuthentication();
    setupEventListeners();
    adjustTextareaHeight();
    loadChatHistory();
    updateSessionInfo();
}

// Update session info display
function updateSessionInfo() {
    const sessionInfoElement = document.getElementById('session-info');
    if (sessionInfoElement && state.sessionId) {
        const shortId = state.sessionId.substring(0, 12);
        sessionInfoElement.textContent = `Session: ${shortId}...`;
    }
}

// Authentication Check
function checkAuthentication() {
    const token = localStorage.getItem('bibleai_token');
    const userName = localStorage.getItem('bibleai_user');
    
    if (token) {
        state.isAuthenticated = true;
        state.userToken = token;
        state.userName = userName || 'User';
        hideLoginModal();
    } else {
        showLoginModal();
    }
}

// Show/Hide Login Modal
function showLoginModal() {
    elements.loginModal.classList.add('active');
}

function hideLoginModal() {
    elements.loginModal.classList.remove('active');
}

// Event Listeners
function setupEventListeners() {
    // Modal buttons
    elements.modalLoginBtn.addEventListener('click', () => {
        window.location.href = 'sign-in.html';
    });

    elements.modalSignupBtn.addEventListener('click', () => {
        window.location.href = 'sign-up.html';
    });

    elements.modalGuestBtn.addEventListener('click', handleGuestAccess);

    // Send message
    elements.sendBtn.addEventListener('click', handleSendMessage);
    elements.messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });

    // Auto-resize textarea
    elements.messageInput.addEventListener('input', adjustTextareaHeight);

    // Logout
    elements.logoutBtn.addEventListener('click', handleLogout);

    // Mic button (voice input placeholder)
    elements.micBtn.addEventListener('click', handleVoiceInput);

    // Navigation links
    // Profile link - Navigate to profile.html if authenticated
    elements.profileLink.addEventListener('click', (e) => {
        if (!state.isAuthenticated) {
            e.preventDefault();
            showLoginModal();
        }
        // If authenticated, let the link navigate to profile.html
    });

    // Bible link - coming soon
    elements.bibleLink.addEventListener('click', (e) => {
        e.preventDefault();
        alert('Bible reading feature coming soon!');
    });

    // About link
    elements.aboutLink.addEventListener('click', (e) => {
        e.preventDefault();
        alert('Bibleai is your AI-powered companion for exploring scripture and biblical wisdom.');
    });

    // New Chat button
    const newChatBtn = document.getElementById('new-chat-btn');
    if (newChatBtn) {
        newChatBtn.addEventListener('click', handleNewChat);
    }
}

// New Chat - Reset session
function handleNewChat() {
    if (confirm('Start a new conversation? This will clear the current chat history.')) {
        // Generate new session ID
        state.sessionId = generateSessionId();
        localStorage.setItem('bibleai_session_id', state.sessionId);
        
        // Update session info display
        updateSessionInfo();
        
        // Clear chat history
        state.chatHistory = [];
        
        // Clear chat container
        elements.chatContainer.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-icon">✨</div>
                <h2>Welcome to Bibleai</h2>
                <p>Ask any question about scripture, theology, or biblical wisdom. I'm here to help guide your spiritual journey.</p>
            </div>
        `;
        
        // Save empty history
        saveChatHistory();
        
        console.log('New chat started with session ID:', state.sessionId);
    }
}

// Guest Access
function handleGuestAccess() {
    state.isAuthenticated = true;
    state.userName = 'Guest';
    localStorage.setItem('bibleai_token', 'guest_token');
    localStorage.setItem('bibleai_user', 'Guest');
    hideLoginModal();
}

// Handle Logout
function handleLogout() {
    // Keep session ID but clear other data
    localStorage.removeItem('bibleai_token');
    localStorage.removeItem('bibleai_user');
    state.isAuthenticated = false;
    state.userToken = null;
    state.userName = null;
    state.chatHistory = [];
    window.location.reload();
}

// Auto-resize Textarea
function adjustTextareaHeight() {
    elements.messageInput.style.height = 'auto';
    elements.messageInput.style.height = Math.min(elements.messageInput.scrollHeight, 150) + 'px';
}

// Send Message
async function handleSendMessage() {
    const message = elements.messageInput.value.trim();
    
    if (!message) return;

    if (!state.isAuthenticated) {
        showLoginModal();
        return;
    }

    // Clear input
    elements.messageInput.value = '';
    adjustTextareaHeight();

    // Add user message to chat
    addMessage(message, 'user');

    // Show typing indicator
    const typingId = showTypingIndicator();

    try {
        // Build URL with parameters including sessionId
        const url = `${API_ENDPOINT}?prompt=${encodeURIComponent(message)}&apikey=${API_KEY}&sessionId=${state.sessionId}`;
        console.log('Sending request with session ID:', state.sessionId);
        
        // Make the API request
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            }
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        console.log('API Response:', data);
        
        // Remove typing indicator
        removeTypingIndicator(typingId);

        // Extract answer from the API response
        let aiResponse = "I received a response but couldn't understand it. Please try again.";
        
        if (data.success && data.answer) {
            aiResponse = data.answer;
        } else if (data.answer) {
            aiResponse = data.answer;
        } else if (data.response) {
            aiResponse = data.response;
        } else if (data.message) {
            aiResponse = data.message;
        }
        
        // Ensure we have the complete response
        if (aiResponse && aiResponse.length > 0) {
            addMessage(aiResponse, 'assistant');
            
            // Update chat history with session context
            state.chatHistory.push({
                id: Date.now(),
                sessionId: state.sessionId,
                user: message,
                assistant: aiResponse,
                timestamp: new Date().toISOString()
            });
            
            // Save to localStorage
            saveChatHistory();
        } else {
            throw new Error('Empty response from API');
        }

    } catch (error) {
        console.error('Detailed error:', error);
        removeTypingIndicator(typingId);
        
        // Show more specific error message
        let errorMessage = 'I apologize, but I encountered an error. ';
        
        if (error.message.includes('Failed to fetch')) {
            errorMessage += 'Unable to connect to the server. Please check your internet connection.';
        } else if (error.message.includes('status 404')) {
            errorMessage += 'The API endpoint was not found. Please contact support.';
        } else if (error.message.includes('status 500')) {
            errorMessage += 'The server encountered an error. Please try again later.';
        } else if (error.message === 'Empty response from API') {
            errorMessage = 'The API returned an empty response. Please try again.';
        } else {
            errorMessage += error.message;
        }
        
        addMessage(errorMessage, 'assistant');
    }

    // Scroll to bottom
    scrollToBottom();
}

// Add Message to Chat
function addMessage(content, role) {
    // Remove welcome message if it exists and this is the first message
    const welcomeMessage = elements.chatContainer.querySelector('.welcome-message');
    if (welcomeMessage && elements.chatContainer.children.length <= 1) {
        welcomeMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    messageDiv.setAttribute('data-timestamp', new Date().toISOString());

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = role === 'user' ? (state.userName ? state.userName[0].toUpperCase() : 'U') : '🤖';

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    // Process the content to ensure it displays properly
    let processedContent = content;
    
    // If content is truncated, make sure we have the full text
    if (processedContent && typeof processedContent === 'string') {
        // Convert markdown-like formatting to HTML
        processedContent = formatMessage(processedContent);
    } else {
        processedContent = String(processedContent || 'No content available');
    }
    
    messageContent.innerHTML = processedContent;
    
    // Add copy button for long messages
    if (content.length > 500) {
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-btn';
        copyButton.innerHTML = '📋 Copy';
        copyButton.style.cssText = `
            background: none;
            border: 1px solid #d4a574;
            border-radius: 4px;
            padding: 4px 8px;
            font-size: 12px;
            cursor: pointer;
            margin-top: 10px;
            color: #d4a574;
            transition: all 0.3s ease;
        `;
        copyButton.onmouseover = () => {
            copyButton.style.backgroundColor = '#d4a574';
            copyButton.style.color = 'white';
        };
        copyButton.onmouseout = () => {
            copyButton.style.backgroundColor = 'transparent';
            copyButton.style.color = '#d4a574';
        };
        copyButton.onclick = () => {
            navigator.clipboard.writeText(content);
            copyButton.textContent = '✓ Copied!';
            setTimeout(() => {
                copyButton.innerHTML = '📋 Copy';
            }, 2000);
        };
        messageContent.appendChild(copyButton);
    }

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);

    elements.chatContainer.appendChild(messageDiv);
    
    // Scroll to show the new message
    setTimeout(() => {
        scrollToBottom();
    }, 100);
}

// Format Message with better text handling
function formatMessage(text) {
    if (!text) return '';
    
    // First, ensure we have the complete text
    let formatted = text;
    
    // Handle line breaks
    formatted = formatted.replace(/\n/g, '<br>');
    
    // Handle Bible verses (e.g., Psalm 34:18, John 3:16)
    formatted = formatted.replace(/([A-Za-z]+\s+\d+:\d+(-\d+)?)/g, '<strong class="bible-verse">$1</strong>');
    
    // Handle book names with chapter and verse (e.g., Genesis 1:1)
    formatted = formatted.replace(/(Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|1 Samuel|2 Samuel|1 Kings|2 Kings|1 Chronicles|2 Chronicles|Ezra|Nehemiah|Esther|Job|Psalms|Proverbs|Ecclesiastes|Song of Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|1 Corinthians|2 Corinthians|Galatians|Ephesians|Philippians|Colossians|1 Thessalonians|2 Thessalonians|1 Timothy|2 Timothy|Titus|Philemon|Hebrews|James|1 Peter|2 Peter|1 John|2 John|3 John|Jude|Revelation)\s+(\d+:\d+(-\d+)?)/gi, '<strong class="bible-verse">$1 $2</strong>');
    
    // Bold: **text** or __text__
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/__(.*?)__/g, '<strong>$1</strong>');
    
    // Italic: *text* or _text_
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    formatted = formatted.replace(/_(.*?)_/g, '<em>$1</em>');
    
    // Split into paragraphs for better readability
    const paragraphs = formatted.split('<br><br>');
    if (paragraphs.length > 1) {
        formatted = paragraphs.map(p => `<p>${p}</p>`).join('');
    } else {
        // If no double line breaks, still wrap in paragraph
        formatted = `<p>${formatted}</p>`;
    }
    
    return formatted;
}

// Typing Indicator
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message assistant';
    typingDiv.id = 'typing-indicator';

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = '🤖';

    const typingContent = document.createElement('div');
    typingContent.className = 'message-content';
    typingContent.innerHTML = `
        <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;

    typingDiv.appendChild(avatar);
    typingDiv.appendChild(typingContent);

    elements.chatContainer.appendChild(typingDiv);
    scrollToBottom();

    return 'typing-indicator';
}

function removeTypingIndicator(id) {
    const typingIndicator = document.getElementById(id);
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Scroll to Bottom
function scrollToBottom() {
    elements.chatContainer.scrollTop = elements.chatContainer.scrollHeight;
}

// Voice Input
function handleVoiceInput() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            elements.micBtn.style.color = '#d4a574';
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            elements.messageInput.value = transcript;
            adjustTextareaHeight();
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            alert('Voice input error. Please check your microphone permissions.');
        };

        recognition.onend = () => {
            elements.micBtn.style.color = '';
        };

        recognition.start();
    } else {
        alert('Voice input is not supported in your browser. Please use Chrome or Safari.');
    }
}

// Load chat history from localStorage
function loadChatHistory() {
    const savedHistory = localStorage.getItem('bibleai_chat_history');
    if (savedHistory) {
        try {
            const history = JSON.parse(savedHistory);
            // Only load history for current session
            state.chatHistory = history.filter(item => item.sessionId === state.sessionId);
            
            // Optionally display previous messages for current session
            if (state.chatHistory.length > 0 && elements.chatContainer.children.length <= 1) {
                // Remove welcome message
                const welcomeMessage = elements.chatContainer.querySelector('.welcome-message');
                if (welcomeMessage) {
                    welcomeMessage.remove();
                }
                
                // Display previous messages
                state.chatHistory.forEach(item => {
                    addMessage(item.user, 'user');
                    addMessage(item.assistant, 'assistant');
                });
            }
        } catch (e) {
            console.error('Error loading chat history:', e);
        }
    }
}

// Save chat history to localStorage
function saveChatHistory() {
    try {
        // Save all chat history (including all sessions)
        const allHistory = JSON.parse(localStorage.getItem('bibleai_all_chat_history') || '[]');
        
        // Update or add current session history
        const sessionIndex = allHistory.findIndex(item => item.sessionId === state.sessionId);
        const currentSessionData = {
            sessionId: state.sessionId,
            messages: state.chatHistory,
            lastUpdated: new Date().toISOString(),
            userName: state.userName
        };
        
        if (sessionIndex !== -1) {
            allHistory[sessionIndex] = currentSessionData;
        } else {
            allHistory.push(currentSessionData);
        }
        
        // Keep only last 10 sessions to avoid storage limits
        while (allHistory.length > 10) {
            allHistory.shift();
        }
        
        localStorage.setItem('bibleai_all_chat_history', JSON.stringify(allHistory));
        localStorage.setItem('bibleai_chat_history', JSON.stringify(state.chatHistory));
    } catch (e) {
        console.error('Error saving chat history:', e);
    }
}

// Auto-save chat history
setInterval(() => {
    if (state.chatHistory.length > 0) {
        saveChatHistory();
    }
}, 30000);

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initApp();
    });
} else {
    initApp();
}

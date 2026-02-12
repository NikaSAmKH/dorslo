const socket = io();

let username = '';
let accountType = ''; // 'registered' or 'guest'

// Elements
const loginScreen = document.getElementById('loginScreen');
const chatScreen = document.getElementById('chatScreen');

// Tab buttons
const signupTab = document.getElementById('signupTab');
const loginTab = document.getElementById('loginTab');
const guestTab = document.getElementById('guestTab');

// Forms
const signupForm = document.getElementById('signupForm');
const loginForm = document.getElementById('loginForm');
const guestForm = document.getElementById('guestForm');

// Sign up elements
const signupUsername = document.getElementById('signupUsername');
const signupPassword = document.getElementById('signupPassword');
const signupBtn = document.getElementById('signupBtn');
const signupError = document.getElementById('signupError');

// Login elements
const loginUsername = document.getElementById('loginUsername');
const loginPassword = document.getElementById('loginPassword');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');

// Guest elements
const guestUsername = document.getElementById('guestUsername');
const guestBtn = document.getElementById('guestBtn');

// Chat elements
const currentUser = document.getElementById('currentUser');
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const logoutBtn = document.getElementById('logoutBtn');

// Image elements
const imageInput = document.getElementById('imageInput');
const imageBtn = document.getElementById('imageBtn');
const imagePreview = document.getElementById('imagePreview');
const previewImg = document.getElementById('previewImg');
const removePreview = document.getElementById('removePreview');

let pendingImage = null;

// Tab switching
signupTab.addEventListener('click', () => {
    setActiveTab('signup');
});

loginTab.addEventListener('click', () => {
    setActiveTab('login');
});

guestTab.addEventListener('click', () => {
    setActiveTab('guest');
});

function setActiveTab(tab) {
    // Remove active class from all tabs
    signupTab.classList.remove('active');
    loginTab.classList.remove('active');
    guestTab.classList.remove('active');
    
    // Hide all forms
    signupForm.classList.add('hidden');
    loginForm.classList.add('hidden');
    guestForm.classList.add('hidden');
    
    // Clear errors
    signupError.textContent = '';
    loginError.textContent = '';
    
    // Show selected tab and form
    if (tab === 'signup') {
        signupTab.classList.add('active');
        signupForm.classList.remove('hidden');
    } else if (tab === 'login') {
        loginTab.classList.add('active');
        loginForm.classList.remove('hidden');
    } else if (tab === 'guest') {
        guestTab.classList.add('active');
        guestForm.classList.remove('hidden');
    }
}

// Sign up
signupBtn.addEventListener('click', () => {
    const user = signupUsername.value.trim();
    const pass = signupPassword.value.trim();
    
    if (user && pass) {
        socket.emit('signup', { username: user, password: pass });
    } else {
        signupError.textContent = 'Please enter username and password';
    }
});

socket.on('signup-response', (result) => {
    if (result.success) {
        username = signupUsername.value.trim();
        accountType = 'registered';
        enterChat();
        // Save login info
        localStorage.setItem('username', username);
        localStorage.setItem('password', signupPassword.value.trim());
    } else {
        signupError.textContent = result.error;
    }
});

// Login
loginBtn.addEventListener('click', () => {
    const user = loginUsername.value.trim();
    const pass = loginPassword.value.trim();
    
    if (user && pass) {
        socket.emit('login', { username: user, password: pass });
    } else {
        loginError.textContent = 'Please enter username and password';
    }
});

socket.on('login-response', (result) => {
    if (result.success) {
        username = result.user.username;
        accountType = 'registered';
        enterChat();
        // Save login info
        localStorage.setItem('username', loginUsername.value.trim());
        localStorage.setItem('password', loginPassword.value.trim());
    } else {
        loginError.textContent = result.error;
    }
});

// Guest
guestBtn.addEventListener('click', () => {
    const user = guestUsername.value.trim();
    
    if (user) {
        socket.emit('guest', user);
    }
});

socket.on('guest-response', (result) => {
    if (result.success) {
        username = guestUsername.value.trim();
        accountType = 'guest';
        enterChat();
    }
});

// Enter chat screen
function enterChat() {
    loginScreen.style.display = 'none';
    chatScreen.style.display = 'flex';
    currentUser.textContent = `${username} ${accountType === 'guest' ? '(Guest)' : ''}`;
    
    // Set avatar and username display
    document.getElementById('userAvatar').textContent = username.charAt(0).toUpperCase();
    document.getElementById('usernameDisplay').textContent = username;
}

// Logout
logoutBtn.addEventListener('click', () => {
    // Clear saved login
    localStorage.removeItem('username');
    localStorage.removeItem('password');
    
    // Reset
    username = '';
    accountType = '';
    messagesDiv.innerHTML = '';
    
    // Go back to login screen
    chatScreen.style.display = 'none';
    loginScreen.style.display = 'flex';
    
    // Clear inputs
    signupUsername.value = '';
    signupPassword.value = '';
    loginUsername.value = '';
    loginPassword.value = '';
    guestUsername.value = '';
});

// Auto-login if saved credentials exist
window.addEventListener('load', () => {
    const savedUsername = localStorage.getItem('username');
    const savedPassword = localStorage.getItem('password');
    
    if (savedUsername && savedPassword) {
        socket.emit('login', { username: savedUsername, password: savedPassword });
    }
});

// Send message
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

function sendMessage() {
    const message = messageInput.value.trim();
    
    if (pendingImage) {
        // Send image with optional text
        socket.emit('message', {
            username: username,
            text: message,
            image: pendingImage,
            timestamp: new Date().toLocaleTimeString()
        });
        messageInput.value = '';
        pendingImage = null;
        imagePreview.style.display = 'none';
        previewImg.src = '';
    } else if (message) {
        // Send text only
        socket.emit('message', {
            username: username,
            text: message,
            timestamp: new Date().toLocaleTimeString()
        });
        messageInput.value = '';
    }
}

// Receive messages
socket.on('message', (data) => {
    const messageEl = document.createElement('div');
    messageEl.className = 'message';
    
    const firstLetter = data.username.charAt(0).toUpperCase();
    
    let content = '';
    if (data.text) {
        content += `<div class="message-text">${data.text}</div>`;
    }
    if (data.image) {
        content += `<img src="${data.image}" class="message-image" alt="Shared image">`;
    }
    
    messageEl.innerHTML = `
        <div class="message-avatar">${firstLetter}</div>
        <div class="message-content">
            <div class="message-header">
                <span class="message-author">${data.username}</span>
                <span class="message-time">${data.timestamp}</span>
            </div>
            ${content}
        </div>
    `;
    messagesDiv.appendChild(messageEl);
    
    // Scroll to bottom
    const wrapper = document.querySelector('.messages-wrapper');
    wrapper.scrollTop = wrapper.scrollHeight;
});

// Image upload
imageBtn.addEventListener('click', () => {
    imageInput.click();
});

imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        showImagePreview(file);
        imageInput.value = '';
    }
});

// Show image preview
function showImagePreview(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
        pendingImage = event.target.result;
        previewImg.src = pendingImage;
        imagePreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// Remove preview
removePreview.addEventListener('click', () => {
    pendingImage = null;
    imagePreview.style.display = 'none';
    previewImg.src = '';
});

// Drag and drop
const messagesWrapper = document.querySelector('.messages-wrapper');

messagesWrapper.addEventListener('dragover', (e) => {
    e.preventDefault();
    messagesWrapper.style.backgroundColor = 'rgba(88, 101, 242, 0.1)';
});

messagesWrapper.addEventListener('dragleave', () => {
    messagesWrapper.style.backgroundColor = '';
});

messagesWrapper.addEventListener('drop', (e) => {
    e.preventDefault();
    messagesWrapper.style.backgroundColor = '';
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        showImagePreview(file);
    }
});

// Paste images
document.addEventListener('paste', (e) => {
    const items = e.clipboardData.items;
    
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            showImagePreview(file);
            e.preventDefault();
            break;
        }
    }
});

// ============================================
// VOICE CHAT
// ============================================

const voiceChannel = document.getElementById('voiceChannel');
const voiceUsers = document.getElementById('voiceUsers');
const voiceControls = document.getElementById('voiceControls');
const muteBtn = document.getElementById('muteBtn');
const disconnectBtn = document.getElementById('disconnectBtn');

let inVoiceChannel = false;
let localStream = null;
let peers = {}; // Store peer connections
let muted = false;

// Join voice channel
voiceChannel.addEventListener('click', () => {
    if (!inVoiceChannel) {
        joinVoiceChannel();
    }
});

async function joinVoiceChannel() {
    try {
        // Get microphone access
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        
        inVoiceChannel = true;
        voiceControls.style.display = 'block';
        voiceChannel.classList.add('connected');
        
        // Tell server we joined
        socket.emit('join-voice', { username: username });
        
        console.log('Joined voice channel');
    } catch (error) {
        console.error('Error accessing microphone:', error);
        alert('Could not access microphone. Please check permissions.');
    }
}

// Leave voice channel
disconnectBtn.addEventListener('click', () => {
    leaveVoiceChannel();
});

function leaveVoiceChannel() {
    // Stop local stream
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    
    // Close all peer connections
    Object.values(peers).forEach(peer => {
        if (peer) peer.destroy();
    });
    peers = {};
    
    inVoiceChannel = false;
    voiceControls.style.display = 'none';
    voiceChannel.classList.remove('connected');
    voiceUsers.innerHTML = '';
    
    socket.emit('leave-voice');
    console.log('Left voice channel');
}

// Mute/unmute
muteBtn.addEventListener('click', () => {
    if (localStream) {
        muted = !muted;
        localStream.getAudioTracks()[0].enabled = !muted;
        
        if (muted) {
            muteBtn.classList.add('muted');
            muteBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v1a7 7 0 0 1-14 0v-1"/>
                    <path d="M12 18.92V22"/>
                    <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="2"/>
                </svg>
            `;
        } else {
            muteBtn.classList.remove('muted');
            muteBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v1a7 7 0 0 1-14 0v-1"/>
                    <path d="M12 18.92V22"/>
                </svg>
            `;
        }
    }
});

// When someone joins voice
socket.on('user-joined-voice', (data) => {
    console.log('User joined voice:', data.username);
    
    // Update user list
    updateVoiceUserList(data.usersInVoice);
    
    // If this is not us and we're in voice, create peer connection
    if (data.userId !== socket.id && inVoiceChannel) {
        createPeerConnection(data.userId, true);
    }
});

// When someone leaves voice
socket.on('user-left-voice', (data) => {
    console.log('User left voice:', data.username);
    
    // Remove user from list
    const userEl = document.getElementById(`voice-user-${data.userId}`);
    if (userEl) userEl.remove();
    
    // Close peer connection
    if (peers[data.userId]) {
        peers[data.userId].destroy();
        delete peers[data.userId];
    }
});

// WebRTC signaling
socket.on('signal', (data) => {
    if (!peers[data.from]) {
        createPeerConnection(data.from, false);
    }
    
    peers[data.from].signal(data.signal);
});

// Create peer connection
function createPeerConnection(userId, initiator) {
    // Load simple-peer from CDN
    if (!window.SimplePeer) {
        console.error('SimplePeer not loaded');
        return;
    }
    
    const peer = new SimplePeer({
        initiator: initiator,
        stream: localStream,
        trickle: false
    });
    
    peer.on('signal', (signal) => {
        socket.emit('signal', {
            signal: signal,
            to: userId
        });
    });
    
    peer.on('stream', (remoteStream) => {
        console.log('Receiving remote stream');
        playAudio(remoteStream, userId);
    });
    
    peer.on('error', (err) => {
        console.error('Peer error:', err);
    });
    
    peers[userId] = peer;
}

// Play remote audio
function playAudio(stream, userId) {
    let audio = document.getElementById(`audio-${userId}`);
    if (!audio) {
        audio = document.createElement('audio');
        audio.id = `audio-${userId}`;
        audio.autoplay = true;
        document.body.appendChild(audio);
    }
    audio.srcObject = stream;
}

// Update voice user list
function updateVoiceUserList(users) {
    voiceUsers.innerHTML = '';
    
    users.forEach(user => {
        const userEl = document.createElement('div');
        userEl.className = 'voice-user';
        userEl.id = `voice-user-${user.id}`;
        
        const initial = user.username ? user.username.charAt(0).toUpperCase() : 'U';
        
        userEl.innerHTML = `
            <div class="voice-user-avatar">${initial}</div>
            <span class="voice-user-name">${user.username || 'User'}</span>
            <div class="voice-speaking-indicator"></div>
        `;
        
        voiceUsers.appendChild(userEl);
    });
}
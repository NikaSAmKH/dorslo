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
    if (message) {
        socket.emit('message', {
            username: username,
            text: message,
            timestamp: new Date().toLocaleTimeString()
        });
        messageInput.value = '';
    }
}
// Image upload
const imageInput = document.getElementById('imageInput');
const imageBtn = document.getElementById('imageBtn');

imageBtn.addEventListener('click', () => {
    imageInput.click();
});

imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
            socket.emit('message', {
                username: username,
                text: '',
                image: event.target.result,
                timestamp: new Date().toLocaleTimeString()
            });
        };
        reader.readAsDataURL(file);
        imageInput.value = ''; // Reset input
    }
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
        const reader = new FileReader();
        reader.onload = (event) => {
            socket.emit('message', {
                username: username,
                text: '',
                image: event.target.result,
                timestamp: new Date().toLocaleTimeString()
            });
        };
        reader.readAsDataURL(file);
    }
});
// Receive messages
socket.on('message', (data) => {
    const messageEl = document.createElement('div');
    messageEl.className = 'message';
    
    const firstLetter = data.username.charAt(0).toUpperCase();
    
    let content = '';
    if (data.image) {
        content = `<img src="${data.image}" class="message-image" alt="Shared image">`;
    } else {
        content = `<div class="message-text">${data.text}</div>`;
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
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
});
// Paste images
document.addEventListener('paste', (e) => {
    const items = e.clipboardData.items;
    
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            const reader = new FileReader();
            
            reader.onload = (event) => {
                socket.emit('message', {
                    username: username,
                    text: '',
                    image: event.target.result,
                    timestamp: new Date().toLocaleTimeString()
                });
            };
            
            reader.readAsDataURL(file);
            e.preventDefault(); // Prevent default paste behavior
            break;
        }
    }
});
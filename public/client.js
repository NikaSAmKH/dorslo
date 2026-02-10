const socket = io();

let username = '';

// Elements
const loginScreen = document.getElementById('loginScreen');
const chatScreen = document.getElementById('chatScreen');
const usernameInput = document.getElementById('usernameInput');
const loginBtn = document.getElementById('loginBtn');
const currentUser = document.getElementById('currentUser');
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');

// Login
loginBtn.addEventListener('click', () => {
    username = usernameInput.value.trim();
    if (username) {
        socket.emit('register', username);
        loginScreen.style.display = 'none';
        chatScreen.style.display = 'flex';
        currentUser.textContent = `${username}`;
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

// Receive messages
socket.on('message', (data) => {
    const messageEl = document.createElement('div');
    messageEl.className = 'message';
    messageEl.innerHTML = `
        <span class="message-author">${data.username}</span>
        <span class="message-time">${data.timestamp}</span>
        <div>${data.text}</div>
    `;
    messagesDiv.appendChild(messageEl);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
});
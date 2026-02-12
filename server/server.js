const path = require('path');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { createUser, checkLogin } = require('./database');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.static(path.join(__dirname, '../public')));

// Store connected users
const users = new Map();

io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);

  // Handle signup
  socket.on('signup', (data) => {
    const result = createUser(data.username, data.password);
    socket.emit('signup-response', result);
    
    if (result.success) {
      users.set(socket.id, data.username);
      console.log(`${data.username} signed up`);
    }
  });

  // Handle login
  socket.on('login', (data) => {
    const result = checkLogin(data.username, data.password);
    socket.emit('login-response', result);
    
    if (result.success) {
      users.set(socket.id, data.username);
      console.log(`${data.username} logged in`);
    }
  });

  // Handle guest login (no password)
  socket.on('guest', (username) => {
    users.set(socket.id, username);
    socket.emit('guest-response', { success: true });
    console.log(`${username} joined as guest`);
  });

  socket.on('message', (data) => {
    io.emit('message', data);
  });

  socket.on('disconnect', () => {
    const username = users.get(socket.id);
    users.delete(socket.id);
    console.log(`${username} disconnected`);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
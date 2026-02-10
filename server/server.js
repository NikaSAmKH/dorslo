const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.static('public'));

// Store connected users
const users = new Map();

io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);

  socket.on('register', (username) => {
    users.set(socket.id, username);
    console.log(`${username} registered`);
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
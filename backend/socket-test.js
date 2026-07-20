const { io } = require('socket.io-client');
const socket = io('http://localhost:5000');

socket.on('connect', () => {
  console.log('Connected as', socket.id);
  socket.emit('join_case', 'test-case-id-123');
});

socket.on('new_message', (msg) => {
  console.log('Received message:', msg);
});

// utils/socket.js
let io = null;

function initSocket(server) {
  const { Server } = require('socket.io');
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET','POST']
    }
  });

  io.on('connection', socket => {
    console.log('socket connected', socket.id);

    socket.on('join_user', userId => {
      socket.join(`user_${userId}`);
      console.log('user joined room', `user_${userId}`);
    });

    socket.on('join_admin', adminId => {
      socket.join('admins');
      console.log('an admin joined admins room:', adminId || socket.id);
    });

    socket.on('disconnect', () => {
      console.log('socket disconnected', socket.id);
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

module.exports = { initSocket, getIO };

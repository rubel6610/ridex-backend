const { Server } = require('socket.io');
const { getCollection } = require('../utils/getCollection');
const { ObjectId } = require('mongodb');

let io = null;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_user', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined room user_${userId}`);
    });

    socket.on('join_admin', (adminId) => {
      socket.join('admins');
      console.log(`Admin ${adminId} joined admins room`);
    });

    // Typing indicators
    socket.on('user_typing_start', async (data) => {
      try {
        const threads = getCollection('support_threads');
        const thread = await threads.findOne({ _id: new ObjectId(data.threadId) });
        if (thread) {
          socket.to('admins').emit('user_typing_start', {
            threadId: data.threadId,
            userId: thread.userId
          });
        }
      } catch (error) {
        console.error('Error in user_typing_start:', error);
      }
    });

    socket.on('user_typing_stop', async (data) => {
      try {
        const threads = getCollection('support_threads');
        const thread = await threads.findOne({ _id: new ObjectId(data.threadId) });
        if (thread) {
          socket.to('admins').emit('user_typing_stop', {
            threadId: data.threadId,
            userId: thread.userId
          });
        }
      } catch (error) {
        console.error('Error in user_typing_stop:', error);
      }
    });

    socket.on('admin_typing_start', async (data) => {
      try {
        const threads = getCollection('support_threads');
        const thread = await threads.findOne({ _id: new ObjectId(data.threadId) });
        if (thread) {
          socket.to(`user_${thread.userId}`).emit('admin_typing_start', {
            threadId: data.threadId
          });
        }
      } catch (error) {
        console.error('Error in admin_typing_start:', error);
      }
    });

    socket.on('admin_typing_stop', async (data) => {
      try {
        const threads = getCollection('support_threads');
        const thread = await threads.findOne({ _id: new ObjectId(data.threadId) });
        if (thread) {
          socket.to(`user_${thread.userId}`).emit('admin_typing_stop', {
            threadId: data.threadId
          });
        }
      } catch (error) {
        console.error('Error in admin_typing_stop:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
}

module.exports = {
  initSocket,
  getIO
};
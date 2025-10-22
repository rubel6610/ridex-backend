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

    // Join rider-specific room for receiving ride requests
    socket.on('join_rider', (riderId) => {
      socket.join(`rider_${riderId}`);
      console.log(`Rider ${riderId} joined room rider_${riderId}`);
    });

    // Join a ride-specific chat room
    socket.on('join_ride_chat', (data) => {
      const { rideId, userId, userType } = data;
      socket.join(`ride_${rideId}`);
      console.log(`${userType} ${userId} joined ride chat room: ride_${rideId}`);
    });

    // Leave a ride-specific chat room
    socket.on('leave_ride_chat', (data) => {
      const { rideId, userId, userType } = data;
      socket.leave(`ride_${rideId}`);
      console.log(`${userType} ${userId} left ride chat room: ride_${rideId}`);
    });

    // Send ride chat message
    socket.on('send_ride_message', async (data) => {
      try {
        const { rideId, senderId, senderType, message, timestamp } = data;
        
        const rides = getCollection('rides');
        const ride = await rides.findOne({ _id: new ObjectId(rideId) });
        
        if (!ride) {
          socket.emit('message_error', { error: 'Ride not found' });
          return;
        }

        // Create message object
        const chatMessage = {
          id: new ObjectId().toString(),
          senderId,
          senderType, // 'user' or 'rider'
          text: message,
          timestamp: timestamp || new Date().toISOString(),
          read: false
        };

        // Update ride document with new message
        await rides.updateOne(
          { _id: new ObjectId(rideId) },
          { 
            $push: { 
              chatMessages: chatMessage 
            } 
          }
        );

        // Emit message to all users in the ride chat room
        io.to(`ride_${rideId}`).emit('receive_ride_message', {
          rideId,
          message: chatMessage
        });

        console.log(`Message sent in ride ${rideId} from ${senderType} ${senderId}`);
      } catch (error) {
        console.error('Error in send_ride_message:', error);
        socket.emit('message_error', { error: 'Failed to send message' });
      }
    });

    // Mark messages as read
    socket.on('mark_messages_read', async (data) => {
      try {
        const { rideId, userId } = data;
        
        const rides = getCollection('rides');
        await rides.updateOne(
          { _id: new ObjectId(rideId) },
          { 
            $set: { 
              'chatMessages.$[elem].read': true 
            } 
          },
          {
            arrayFilters: [{ 'elem.senderId': { $ne: userId } }]
          }
        );

        io.to(`ride_${rideId}`).emit('messages_marked_read', { rideId, userId });
      } catch (error) {
        console.error('Error in mark_messages_read:', error);
      }
    });

    // Typing indicators for ride chat
    socket.on('ride_typing_start', (data) => {
      const { rideId, userId, userType } = data;
      socket.to(`ride_${rideId}`).emit('ride_typing_start', {
        rideId,
        userId,
        userType
      });
    });

    socket.on('ride_typing_stop', (data) => {
      const { rideId, userId, userType } = data;
      socket.to(`ride_${rideId}`).emit('ride_typing_stop', {
        rideId,
        userId,
        userType
      });
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
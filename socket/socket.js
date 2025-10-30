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
    // Removed debug console log: console.log('User connected:', socket.id);

    socket.on('join_user', (userId) => {
      socket.join(`user_${userId}`);
      // Removed debug console log: console.log(`User ${userId} joined room user_${userId}`);
      
      // Check for pending payment notifications
      if (global.pendingPaymentNotifications && global.pendingPaymentNotifications.has(userId)) {
        const notificationData = global.pendingPaymentNotifications.get(userId);
        socket.emit('payment_success_notification', notificationData);
        global.pendingPaymentNotifications.delete(userId);
      }
    });

    socket.on('join_admin', (adminId) => {
      socket.join('admins');
      // Removed debug console log: console.log(`Admin ${adminId} joined admins room`);
    });

    // Join rider-specific room for receiving ride requests
    socket.on('join_rider', (riderId) => {
      socket.join(`rider_${riderId}`);
    });

    // Join a ride-specific chat room
    socket.on('join_ride_chat', (data) => {
      const { rideId, userId, userType } = data;
      socket.join(`ride_${rideId}`);
      // Removed debug console log: console.log(`${userType} ${userId} joined ride chat room: ride_${rideId}`);
    });

    // Leave a ride-specific chat room
    socket.on('leave_ride_chat', (data) => {
      const { rideId, userId, userType } = data;
      socket.leave(`ride_${rideId}`);
      // Removed debug console log: console.log(`${userType} ${userId} left ride chat room: ride_${rideId}`);
    });

    socket.on('send_ride_message', async (data) => {
      try {
        const { rideId, senderId, senderType, message, timestamp } = data;
        
        const rides = getCollection('rides');
        const ride = await rides.findOne({ _id: new ObjectId(rideId) });
        
        if (!ride) {
          socket.emit('message_error', { error: 'Ride not found' });
          return;
        }

        const chatMessage = {
          id: new ObjectId().toString(),
          senderId,
          senderType,
          text: message,
          timestamp: timestamp || new Date().toISOString(),
          read: false
        };

        await rides.updateOne(
          { _id: new ObjectId(rideId) },
          { 
            $push: { 
              chatMessages: chatMessage 
            } 
          }
        );

        io.to(`ride_${rideId}`).emit('receive_ride_message', {
          rideId,
          message: chatMessage
        });

        if (senderType === 'user' && ride.riderId) {
          io.to(`rider_${ride.riderId.toString()}`).emit('new_message_notification', {
            rideId,
            from: 'passenger',
            message: message.substring(0, 50),
            timestamp: chatMessage.timestamp
          });
        }

        if (senderType === 'rider' && ride.userId) {
          io.to(`user_${ride.userId}`).emit('new_message_notification', {
            rideId,
            from: 'rider',
            message: message.substring(0, 50),
            timestamp: chatMessage.timestamp
          });
        }

        // Removed debug console log: console.log(`Message sent in ride ${rideId} from ${senderType} ${senderId}`);
      } catch (error) {
        // Keep error logging for critical issues
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
        // Keep error logging for critical issues
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
        // Keep error logging for critical issues
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
        // Keep error logging for critical issues
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
        // Keep error logging for critical issues
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
        // Keep error logging for critical issues
        console.error('Error in admin_typing_stop:', error);
      }
    });

    socket.on('disconnect', () => {
      // Removed debug console log: console.log('User disconnected:', socket.id);
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
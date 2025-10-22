const { getIO } = require('../socket/socket');
const { getCollection } = require('../utils/getCollection');
const { ObjectId } = require('mongodb');

async function userSendMessage(req, res) {
  try {
    const { userId, text, userType } = req.body; // Added userType
    if (!userId || !text) return res.status(400).json({ error: 'userId and text required' });

    const threads = getCollection('support_threads');
    const users = getCollection('users');
    const riders = getCollection('riders');

    const msg = { 
      sender: userType === 'rider' ? 'rider' : 'user', // Support both
      text, 
      createdAt: new Date(),
      _id: new ObjectId()
    };

    // Get user/rider data based on type
    let userData;
    if (userType === 'rider') {
      // Find rider first, then get user data
      const riderData = await riders.findOne({ userId: userId });
      if (riderData) {
        userData = await users.findOne({ _id: new ObjectId(userId) });
        userData = { ...userData, isRider: true, riderId: riderData._id };
      }
    } else {
      userData = await users.findOne({ _id: new ObjectId(userId) });
    }
    
    let thread = await threads.findOne({ userId, userType: userType || 'user' });

    if (!thread) {
      const doc = {
        userId,
        userType: userType || 'user', // Track if rider or user
        userName: userData?.fullName || `${userType === 'rider' ? 'Rider' : 'User'} ${userId}`,
        userPhoto: userData?.photoUrl || null,
        messages: [msg],
        lastMessage: text,
        unreadCount: 1,
        status: 'waiting',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const result = await threads.insertOne(doc);
      thread = await threads.findOne({ _id: result.insertedId });
    } else {
      await threads.updateOne(
        { _id: thread._id },
        { 
          $push: { messages: msg },
          $set: { 
            lastMessage: text,
            unreadCount: (thread.unreadCount || 0) + 1,
            status: 'waiting',
            updatedAt: new Date() 
          }
        }
      );
      thread = await threads.findOne({ _id: thread._id });
    }

    const io = getIO();
    
    // Notify all admins with user data
    io.to('admins').emit('new_support_thread', {
      ...thread,
      userName: userData?.fullName || `${userType === 'rider' ? 'Rider' : 'User'} ${userId}`,
      userPhoto: userData?.photoUrl || null
    });
    
    // Send updated thread to user/rider
    io.to(`user_${userId}`).emit('thread_updated', { thread });

    return res.json({ thread });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

async function getThreadForUser(req, res) {
  try {
    const { userId } = req.params;
    const { userType } = req.query; // Get userType from query
    const threads = getCollection('support_threads');
    const users = getCollection('users');
    
    const thread = await threads.findOne({ 
      userId, 
      userType: userType || 'user' 
    });
    
    // Enrich thread with user data
    if (thread) {
      try {
        const userData = await users.findOne({ _id: new ObjectId(thread.userId) });
        thread.userName = userData?.fullName || `${thread.userType === 'rider' ? 'Rider' : 'User'} ${thread.userId}`;
        thread.userPhoto = userData?.photoUrl || null;
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    }
    
    return res.json({ thread });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

async function getThreadsForAdmin(req, res) {
  try {
    const threads = getCollection('support_threads');
    const users = getCollection('users');
    
    const list = await threads.find({})
      .sort({ updatedAt: -1 })
      .limit(100)
      .toArray();

    // Enrich threads with user data
    const enrichedThreads = await Promise.all(
      list.map(async (thread) => {
        try {
          const userData = await users.findOne({ _id: new ObjectId(thread.userId) });
          return {
            ...thread,
            userName: userData?.fullName || `User ${thread.userId}`,
            userPhoto: userData?.photoUrl || null
          };
        } catch (error) {
          return thread;
        }
      })
    );

    return res.json({ threads: enrichedThreads });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

async function adminReply(req, res) {
  try {
    const { threadId, adminId, text } = req.body;
    if (!threadId || !text) return res.status(400).json({ error: 'threadId and text required' });

    const threads = getCollection('support_threads');
    const _id = new ObjectId(threadId);
    const thread = await threads.findOne({ _id });
    if (!thread) return res.status(404).json({ error: 'thread not found' });

    const msg = { 
      sender: 'admin', 
      adminId, 
      text, 
      createdAt: new Date(),
      _id: new ObjectId()
    };

    await threads.updateOne(
      { _id },
      { 
        $push: { messages: msg },
        $set: { 
          status: 'answered', 
          lastMessage: text,
          unreadCount: 0,
          updatedAt: new Date() 
        }
      }
    );

    const updated = await threads.findOne({ _id });

    const io = getIO();
    
    // Notify user
    io.to(`user_${thread.userId}`).emit('new_message', {
      threadId: thread._id.toString(),
      message: msg
    });

    // Notify admins
    io.to('admins').emit('thread_updated', { thread: updated });
    io.to('admins').emit('new_message', {
      threadId: thread._id.toString(),
      message: msg
    });

    return res.json({ thread: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

async function markAsRead(req, res) {
  try {
    const { threadId } = req.body;
    const threads = getCollection('support_threads');
    const _id = new ObjectId(threadId);

    await threads.updateOne(
      { _id },
      { $set: { unreadCount: 0, updatedAt: new Date() } }
    );

    const updated = await threads.findOne({ _id });

    const io = getIO();
    io.to('admins').emit('thread_updated', { thread: updated });

    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  userSendMessage,
  getThreadForUser,
  getThreadsForAdmin,
  adminReply,
  markAsRead
};
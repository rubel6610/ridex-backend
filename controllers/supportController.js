const { getIO } = require('../socket/socket');
const { getCollection } = require('../utils/getCollection');
const { ObjectId } = require('mongodb');

// User sends a message
async function userSendMessage(req, res) {
  try {
    const { userId, text } = req.body;
    if (!userId || !text) return res.status(400).json({ error: 'userId and text required' });

    const threads = getCollection('support_threads');

    const msg = { sender: 'user', text, createdAt: new Date() };

    // find an open thread (not closed) for this user
    let thread = await threads.findOne({ userId, status: { $ne: 'closed' } });

    if (!thread) {
      const doc = {
        userId,
        status: 'waiting',
        messages: [msg],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const result = await threads.insertOne(doc);
      thread = await threads.findOne({ _id: result.insertedId });
    } else {
      await threads.updateOne(
        { _id: thread._id },
        { $push: { messages: msg }, $set: { status: 'waiting', updatedAt: new Date() } }
      );
      thread = await threads.findOne({ _id: thread._id });
    }

    // notify admins in real-time
    const io = getIO();
    io.to('admins').emit('new_support_thread', {
      _id: thread._id.toString(),
      userId,
      lastMessage: text,
      status: thread.status,
      updatedAt: thread.updatedAt,
      messages: thread.messages
    });

    // ack to user
    io.to(`user_${userId}`).emit('message_sent_ack', {
      threadId: thread._id.toString(),
      text,
      createdAt: msg.createdAt
    });

    return res.json({ thread });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

// Get user's current thread
async function getThreadForUser(req, res) {
  try {
    const { userId } = req.params;
    const threads = getCollection('support_threads');
    const thread = await threads.findOne({ userId, status: { $ne: 'closed' } });
    return res.json({ thread });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

// Admin: list threads
async function getThreadsForAdmin(req, res) {
  try {
    const threads = getCollection('support_threads');
    const list = await threads.find({}).sort({ updatedAt: -1 }).limit(200).toArray();
    return res.json({ threads: list });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

// Admin replies to a thread
async function adminReply(req, res) {
  try {
    const { threadId, adminId, text } = req.body;
    if (!threadId || !text) return res.status(400).json({ error: 'threadId and text required' });

    const threads = getCollection('support_threads');
    const _id = new ObjectId(threadId);
    const thread = await threads.findOne({ _id });
    if (!thread) return res.status(404).json({ error: 'thread not found' });

    const msg = { sender: 'admin', adminId, text, createdAt: new Date() };

    await threads.updateOne(
      { _id },
      { $push: { messages: msg }, $set: { status: 'answered', updatedAt: new Date() } }
    );

    const updated = await threads.findOne({ _id });

    const io = getIO();
    // notify user
    io.to(`user_${thread.userId}`).emit('support_reply', {
      threadId: thread._id.toString(),
      adminId,
      text,
      createdAt: msg.createdAt
    });

    // notify admins
    io.to('admins').emit('thread_updated', {
      _id: thread._id.toString(),
      status: 'answered',
      updatedAt: updated.updatedAt
    });

    return res.json({ thread: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  userSendMessage,
  getThreadForUser,
  getThreadsForAdmin,
  adminReply
};

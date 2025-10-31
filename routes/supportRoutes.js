const express = require('express');
const router = express.Router();
const {
  userSendMessage,
  getThreadForUser,
  getThreadsForAdmin,
  adminReply,
  markAsRead
} = require('../controllers/supportController');

// User routes
router.post('/send', userSendMessage);
router.get('/thread/:userId', getThreadForUser);

// Admin routes
router.get('/admin/threads',  getThreadsForAdmin);
router.post('/admin/reply',  adminReply);
router.post('/admin/mark-read',  markAsRead);

module.exports = router;

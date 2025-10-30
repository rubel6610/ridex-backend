const express = require('express');
const router = express.Router();
const {
  userSendMessage,
  getThreadForUser,
  getThreadsForAdmin,
  adminReply,
  markAsRead
} = require('../controllers/supportController');
const { verifyToken, verifyAdmin, verifyUser } = require('../middleware/authMiddleware');

// User routes
router.post('/send', verifyToken, verifyUser, userSendMessage);
router.get('/thread/:userId', verifyToken, verifyUser, getThreadForUser);

// Admin routes
router.get('/admin/threads', verifyToken, verifyAdmin, getThreadsForAdmin);
router.post('/admin/reply', verifyToken, verifyAdmin, adminReply);
router.post('/admin/mark-read', verifyToken, verifyAdmin, markAsRead);

module.exports = router;

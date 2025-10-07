const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/supportController');

// User sends message
router.post('/send', ctrl.userSendMessage);

// Get user's current thread
router.get('/thread/:userId', ctrl.getThreadForUser);

// Admin: list threads (protected)
router.get('/admin/threads', ctrl.getThreadsForAdmin);

// Admin reply (protected)
router.post('/admin/reply',  ctrl.adminReply);

module.exports = router;

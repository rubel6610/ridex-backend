const express = require('express');
const { chatBot } = require('../controllers/chatBotController');
const { verifyToken } = require('../middleware/authMiddleware');
const router = express.Router();

// Protected route - only authenticated users can access chatbot
router.post('/chatbot', verifyToken, chatBot);

module.exports = router;

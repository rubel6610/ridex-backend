const express = require('express');
const { chatBot } = require('../controllers/chatBotController');

const router = express.Router();

router.post('/chatbot', chatBot);

module.exports = router;

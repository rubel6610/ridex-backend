const express = require("express");
const { getMessages, sendMessages, replyMessages } = require("../controllers/chatController");

const router = express.Router();

// User ↔ Admin messages
router.get("/messages", getMessages);       
router.post("/messages", sendMessages);     
router.post("/messages/reply", replyMessages); 
module.exports = router;

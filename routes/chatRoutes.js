const express = require("express");
const { getMessages, sendMessages } = require("../controllers/chatController");
;
const router = express.Router();

router.get("/messages", getMessages);
router.post("/messages", sendMessages);

module.exports = router;

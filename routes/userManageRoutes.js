const express = require('express');
const { approveAndRejectRider } = require('../controllers/ridersManageController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');
const router = express.Router();

// Admin routes
router.patch("/approveAndrejectUser/:id", verifyToken, verifyAdmin, approveAndRejectRider);

module.exports = router;

const express = require('express');
const { approveAndRejectRider } = require('../controllers/ridersManageController');

const router = express.Router();

// Admin routes
router.patch("/approveAndrejectUser/:id", approveAndRejectRider);

module.exports = router;

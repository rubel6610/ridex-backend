const express = require('express');
const router = express.Router();
const {
  getUserAnalytics,
  getRiderAnalytics,
  getAdminAnalytics,
} = require('../controllers/analyticsController');
const { verifyToken, verifyAdmin, verifyUser, verifyRider } = require('../middleware/authMiddleware');

// User analytics (user can only access their own analytics)
router.get('/user/:userId', verifyToken, verifyUser, getUserAnalytics);

// Rider analytics (rider can only access their own analytics)
router.get('/rider/:riderId', verifyToken, verifyRider, getRiderAnalytics);

// Admin analytics (admin can access overall analytics)
router.get('/admin', verifyToken, verifyAdmin, getAdminAnalytics);

module.exports = router;

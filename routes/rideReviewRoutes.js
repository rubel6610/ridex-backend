const express = require('express');
const router = express.Router();
const {
  createRideReview,
  getRiderReviews,
  getAllRideReviews,
  updateRiderReviews
} = require('../controllers/rideReviewController');
const { verifyToken, verifyAdmin, verifyUser } = require('../middleware/authMiddleware');

// User routes
router.post('/', verifyToken, verifyUser, createRideReview);
router.get('/rider/:riderId', getRiderReviews); // Public access to view rider reviews

// Admin routes
router.get('/', verifyToken, verifyAdmin, getAllRideReviews);
router.put('/update', verifyToken, verifyAdmin, updateRiderReviews);

module.exports = router;

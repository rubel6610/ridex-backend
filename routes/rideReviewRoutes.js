const express = require('express');
const router = express.Router();
const {
  createRideReview,
  getRiderReviews,
  getAllRideReviews,
  updateRiderReviews
} = require('../controllers/rideReviewController');


// User routes
router.post('/',createRideReview);
router.get('/rider/:riderId', getRiderReviews); // Public access to view rider reviews

// Admin routes
router.get('/',getAllRideReviews);
router.put('/update', updateRiderReviews);

module.exports = router;

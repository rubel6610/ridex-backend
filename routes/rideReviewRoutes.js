const express = require('express');
const router = express.Router();
const {
  createRideReview,
  getRiderReviews,
  getAllRideReviews,
  updateRiderReviews,
} = require('../controllers/rideReviewController');

// POST => create a review
router.post('/', createRideReview);

// Update => rider reviews
router.put('/update', updateRiderReviews)

// GET => all reviews for a specific rider
router.get('/rider/:riderId', getRiderReviews);

// GET => all ride reviews (for admin)
router.get('/', getAllRideReviews);

module.exports = router;

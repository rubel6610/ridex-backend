const express = require('express');
const router = express.Router();
const {
  createRideReview,
  getRiderReviews,
  getAllRideReviews,
} = require('../controllers/rideReviewController');

// POST => create a review
router.post('/', createRideReview);

// GET => all reviews for a specific rider
router.get('/rider/:riderId', getRiderReviews);

// GET => all ride reviews (for admin)
router.get('/', getAllRideReviews);

module.exports = router;

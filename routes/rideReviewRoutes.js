const express = require('express');
const router = express.Router();
const {
  createRideReview,
  getRiderReviews,
  getAllRideReviews,
  updateRiderReviews
} = require('../controllers/rideReviewController');

// POST => create a review
router.post('/', createRideReview);

// GET => all reviews for a specific rider
router.get('/rider/:riderId', getRiderReviews);

// GET => all ride reviews (for admin)
router.get('/', getAllRideReviews);

// Update => rider reviews
router.put('/update', updateRiderReviews)

module.exports = router;

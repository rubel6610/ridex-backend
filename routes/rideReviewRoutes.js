const express = require('express');
const router = express.Router();
const {
  createRideReview,
  getRiderReviews,
  getAllRideReviews,
} = require('../controllers/rideReviewController');

// POST => create a review
router.post('/', createRideReview);



module.exports = router;

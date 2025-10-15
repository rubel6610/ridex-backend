const express = require('express');
const router = express.Router();
const {
  createRideReview,
  getRiderReviews,
  getAllRideReviews,
} = require('../controllers/rideReviewController');



module.exports = router;

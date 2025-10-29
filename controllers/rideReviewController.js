// controllers/rideReviewController.js
const { ObjectId } = require('mongodb');
const { getCollection } = require('../utils/getCollection');

// Create new ride review
const createRideReview = async (req, res) => {
  try {
    const { rideId, riderId, userId, rating, comment } = req.body;
    console.log("rideid:", rideId, "riderid:", riderId);
    if (!rideId || !riderId || !userId || rating == null) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const rideReviews = getCollection('rideReviews');

    const review = {
      rideId: rideId,
      riderId: riderId,
      userId: userId,
      rating: Number(rating),
      comment: comment || '',
      createdAt: new Date(),
    };

    const result = await rideReviews.insertOne(review);

    res.status(201).json({
      message: 'Review submitted successfully',
      reviewId: result.insertedId,
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all reviews for a specific rider
const getRiderReviews = async (req, res) => {
  try {
    const { riderId } = req.params;

    if (!riderId) {
      return res.status(400).json({ message: 'riderId is required' });
    }

    const rideReviews = getCollection('rideReviews');

    const reviews = await rideReviews
      .find({ riderId: new ObjectId(riderId) })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all reviews (optional - for admin)
const getAllRideReviews = async (req, res) => {
  try {
    const rideReviews = getCollection('rideReviews');

    const reviews = await rideReviews.find().sort({ createdAt: -1 }).toArray();

    res.status(200).json(reviews);
  } catch (error) {
    console.error('Error fetching all reviews:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update rider document with new review (numeric rating update)
const updateRiderReviews = async (req, res) => {
  try {
    const { riderId, review } = req.body;
    console.log(req.body);
    if (!riderId || !review) {
      return res.status(400).json({ message: 'riderId and numeric rating are required' });
    }

    const ridersCollection = getCollection('riders');

    // Find existing rider
    const existingRider = await ridersCollection.findOne({ _id: new ObjectId(riderId) });
    if (!existingRider) {
      return res.status(404).json({ message: 'Rider not found' });
    }

    // Safely handle null or undefined reviews field
    let previousRating = 0;
    if (existingRider.reviews === null || existingRider.reviews === undefined || isNaN(existingRider.reviews)) {
      previousRating = 0;
    } else {
      previousRating = Number(existingRider.reviews);
    }

    const newRating = Number(review);
    const updatedRating = previousRating + newRating;

    // Update the rider document
    const result = await ridersCollection.updateOne(
      { _id: new ObjectId(riderId) },
      { $set: { reviews: updatedRating } }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({ message: 'Failed to update review rating' });
    }

    res.status(200).json({
      message: 'Rider review rating updated successfully',
      previousRating,
      newRating,
      totalRating: updatedRating,
    });
  } catch (error) {
    console.error('Error updating rider review rating:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};



module.exports = {
  createRideReview,
  getRiderReviews,
  getAllRideReviews,
  updateRiderReviews
};

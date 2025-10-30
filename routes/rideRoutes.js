const express = require('express');
const router = express.Router();
const {
  getAllRides,
  getAvailableRide,
  getCurrentRide,
  getSpecificRide,
  insertRides,
  deleteAllRides,
  requestStatus,
  setStatusOffline,
  updateLocation,
  acceptRide,
  rejectRide,
  rideRequest,
  getRideChatMessages,
  cancelRideRequest,
  completeRide,
} = require('../controllers/ridesController');
const { verifyToken, verifyAdmin, verifyUser, verifyRider } = require('../middleware/authMiddleware');

// ADMIN ROUTES
router.get('/rides', verifyToken, verifyAdmin, getAllRides);
router.post('/ride/insert-allRides', verifyToken, verifyAdmin, insertRides);
router.delete('/ride/delete-allRides', verifyToken, verifyAdmin, deleteAllRides);

// RIDER ROUTES
router.get('/rides/:riderId', verifyToken, verifyRider, getAvailableRide);
router.get('/ride/:rideId', verifyToken, getCurrentRide);
router.get('/specific-rider-ride/:riderId', verifyToken, verifyRider, getSpecificRide);
router.post('/status', verifyToken, verifyRider, requestStatus);
router.post('/status/offline', verifyToken, verifyRider, setStatusOffline);
router.post('/location', verifyToken, verifyRider, updateLocation);
router.post('/req/ride-accept', verifyToken, verifyRider, acceptRide);
router.post('/req/ride-reject', verifyToken, verifyRider, rejectRide);

// USER ROUTES
router.post('/request', verifyToken, verifyUser, rideRequest);
router.post('/ride/cancel', verifyToken, verifyUser, cancelRideRequest);
router.post('/ride/complete', verifyToken, verifyUser, completeRide);

// CHAT ROUTES (accessible by both user and rider for a specific ride)
router.get('/ride/:rideId/chat', verifyToken, getRideChatMessages);

module.exports = router;

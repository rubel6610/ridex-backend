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

// COMMON ROUTES
router.get('/rides', getAllRides);
router.get('/rides/:riderId', getAvailableRide);
router.get('/ride/:rideId', getCurrentRide);
router.get('/specific-rider-ride/:riderId', getSpecificRide);
router.post('/ride/insert-allRides', insertRides);
router.delete('/ride/delete-allRides', deleteAllRides);

// RIDER ROUTES
router.post('/status', requestStatus);
router.post('/status/offline', setStatusOffline);
router.post('/location', updateLocation);
router.post('/req/ride-accept', acceptRide);
router.post('/req/ride-reject', rejectRide);

// USER ROUTES
router.post('/request', rideRequest);
router.post('/ride/cancel', cancelRideRequest);
router.post('/ride/complete', completeRide);

// CHAT ROUTES
router.get('/ride/:rideId/chat', getRideChatMessages);

module.exports = router;
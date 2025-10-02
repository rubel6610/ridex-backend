const express = require('express');
const router = express.Router();
const {
  getAllRides,
  getInstantRide,
  requestStatus,
  setStatusOffline,
  updateLocation,
  acceptRide,
  rejectRide,
  rideRequest,
} = require('../controllers/ridesController');

// COMMON NEED
router.get('/rides', getAllRides);
router.get('/rides/:rideId', getInstantRide);

// FROM RIDER
router.post('/status', requestStatus);
router.post('/status/offline', setStatusOffline);
router.post('/location', updateLocation);
router.post('/rider/ride-accept', acceptRide);
router.post('/rider/ride-reject', rejectRide);

// FROM USER
router.post('/request', rideRequest);

module.exports = router;

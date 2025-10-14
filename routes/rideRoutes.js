const express = require('express');
const router = express.Router();
const {
  getAllRides,
  getAvailableRide,
  getCurrentRide,
  insertRides,
  deleteAllRides,
  requestStatus,
  setStatusOffline,
  updateLocation,
  acceptRide,
  rejectRide,
  rideRequest,
} = require('../controllers/ridesController');

// COMMON NEED
router.get('/rides', getAllRides);
router.get('/rides/:riderId', getAvailableRide);
router.get('/ride/:rideId', getCurrentRide);
router.post('/ride/insert-allRides', insertRides);
router.delete('/ride/delete-allRides', deleteAllRides);


// FROM RIDER
router.post('/status', requestStatus);
router.post('/status/offline', setStatusOffline);
router.post('/location', updateLocation);
router.post('/req/ride-accept', acceptRide);
router.post('/req/ride-reject', rejectRide);

// FROM USER
router.post('/request', rideRequest);

module.exports = router;

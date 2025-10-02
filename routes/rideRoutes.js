const express = require('express');
const router = express.Router();
const {
  requestStatus,
  setStatusOffline,
  updateLocation,
  rideRequest,
} = require('../controllers/ridesController');

// FROM RIDER
router.post('/status', requestStatus);
router.post('/status/offline', setStatusOffline);
router.post('/location', updateLocation);

// FROM USER
router.post('/request', rideRequest);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  becomeRider,
  getRiders,
  getSingleRider,
  updateRiderById,
  deleteRiderById,
  requestStatus,
  setStatusOffline,
  updateLocation,
} = require('../controllers/ridersController');

router.post('/become-rider', becomeRider);
router.get('/riders', getRiders);
router.post('/rider/:id', getSingleRider);
router.put('/update-rider/:id', updateRiderById);
router.delete('/delete-rider/:id', deleteRiderById);


router.post('/status', requestStatus);
router.post('/status/offline', setStatusOffline);
router.post('/location', updateLocation);

module.exports = router;

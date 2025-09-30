const express = require('express');
const router = express.Router();
const {
  becomeRider,
  getRiders,
  getSingleRider,
  getSingleRiderByUserID,
  insertRiders,
  updateRiderById,
  deleteRiderById,
  deleteAll,
  requestStatus,
  updateLocation,
} = require('../controllers/ridersController');

// RIDERS INITIAL AND REGISTER APIS:
router.post('/become-rider', becomeRider);
router.get('/riders', getRiders);
router.get('/rider/user/:id', getSingleRider);
router.get('/rider/:userId', getSingleRiderByUserID);
router.post('/insert-all-riders', insertRiders);
router.put('/update-rider/:id', updateRiderById);
router.delete('/delete-rider/:id', deleteRiderById);
router.delete('/delete-all-riders', deleteAll);

// RIDERS RIDING PROCESS APIS:
router.post('/status', requestStatus);
router.post('/location', updateLocation);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  becomeRider,
  getRiders,
  getSingleRider,
  updateRiderById,
  deleteRiderById,
  requestStatus,
} = require('../controllers/ridersController');

// RIDERS INITIAL AND REGISTER APIS:
router.post('/become-rider', becomeRider);
router.get('/riders', getRiders);
router.post('/rider/:id', getSingleRider);
router.put('/update-rider/:id', updateRiderById);
router.delete('/delete-rider/:id', deleteRiderById);

// RIDERS RIDING PROCESS APIS:
router.post('/status', requestStatus);

module.exports = router;

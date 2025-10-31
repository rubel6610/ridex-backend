const express = require('express');
const router = express.Router();
const {
  becomeRider,
  getRiders,
  getSingleRider,
  insertRiders,
  updateRiderById,
  deleteRiderById,
  deleteAllRiders,
} = require('../controllers/ridersController');


// Public routes
router.post('/become-rider', becomeRider);

// Admin routes
router.get('/riders', getRiders);
router.post('/rider/insert-allRiders', insertRiders);
router.put('/update-rider/:id', updateRiderById);
router.delete('/delete-rider/:id', deleteRiderById);
router.delete('/rider/delete-allRiders', deleteAllRiders);

// Rider specific route (accessible by rider and admin)
router.get('/rider/:id', getSingleRider);

module.exports = router;

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
const { verifyToken, verifyAdmin, verifyUser, verifyRider } = require('../middleware/authMiddleware');

// Public routes
router.post('/become-rider', becomeRider);

// Admin routes
router.get('/riders', verifyToken, verifyAdmin, getRiders);
router.post('/rider/insert-allRiders', verifyToken, verifyAdmin, insertRiders);
router.put('/update-rider/:id', verifyToken, verifyAdmin, updateRiderById);
router.delete('/delete-rider/:id', verifyToken, verifyAdmin, deleteRiderById);
router.delete('/rider/delete-allRiders', verifyToken, verifyAdmin, deleteAllRiders);

// Rider specific route (accessible by rider and admin)
router.get('/rider/:id', verifyToken, getSingleRider);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  getAllNIds,
  getAllUsers,
  getSingleUser,
  getSingleRiderByUserId,
  insertUsers,
  updateUser,
  getMessagedUsers,
  deleteUser,
  deleteAllUsers,
} = require('../controllers/userController');
const { verifyToken, verifyAdmin, verifyUser, verifyRider } = require('../middleware/authMiddleware');

// Public routes
router.get('/nids', getAllNIds);

// Admin routes
router.get('/users', verifyToken, verifyAdmin, getAllUsers);
router.post('/insert-allUsers', verifyToken, verifyAdmin, insertUsers);
router.delete('/delete-allUsers', verifyToken, verifyAdmin, deleteAllUsers);

// User routes (accessible by users and admins)
router.get('/user', verifyToken, getSingleUser);
router.get('/rider/userId', verifyToken, getSingleRiderByUserId);
router.get('/users/messaged', verifyToken, getMessagedUsers);
router.put('/user/:id', verifyToken, updateUser);
router.delete('/user/:id', verifyToken, deleteUser);

module.exports = router;

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


// Public routes
router.get('/nids', getAllNIds);

// Admin routes
router.get('/users', getAllUsers);
router.post('/insert-allUsers', insertUsers);
router.delete('/delete-allUsers', deleteAllUsers);

// User routes (accessible by users and admins)
router.get('/user', getSingleUser);
router.get('/rider/userId', getSingleRiderByUserId);
router.get('/users/messaged',  getMessagedUsers);
router.put('/user/:id',  updateUser);
router.delete('/user/:id', deleteUser);

module.exports = router;

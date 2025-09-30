const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getSingleUser,
  updateUser,
  deleteUser,
  rideRequest,
} = require('../controllers/userController');

// USERS INITIAL APIS:
router.get('/users', getAllUsers);
router.get('/user', getSingleUser);
router.put('/user/:id', updateUser);
router.delete('/user/:id', deleteUser);

// USERS RIDING PROCESS APIS:
router.post('/request', rideRequest);

module.exports = router;

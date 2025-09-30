const express = require('express');
const router = express.Router();
const {
  getAllNIds,
  getAllUsers,
  getSingleUser,
  insertUsers,
  updateUser,
  deleteUser,
  deleteAll,
  rideRequest,
} = require('../controllers/userController');

// USERS INITIAL APIS:
router.get('/nids', getAllNIds);
router.get('/users', getAllUsers);
router.get('/user', getSingleUser);
router.post('/insert-all-users', insertUsers);
router.put('/user/:id', updateUser);
router.delete('/user/:id', deleteUser);
router.delete('/delete-all-users', deleteAll);


// USERS RIDING PROCESS APIS:
router.post('/request', rideRequest);

module.exports = router;

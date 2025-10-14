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

router.get('/nids', getAllNIds);
router.get('/users', getAllUsers);
router.get('/user', getSingleUser);
router.get('/rider/userId', getSingleRiderByUserId);
router.post('/insert-allUsers', insertUsers);
router.get('/users/messaged', getMessagedUsers);
router.put('/user/:id', updateUser);
router.delete('/user/:id', deleteUser);
router.delete('/delete-allUsers', deleteAllUsers);

module.exports = router;

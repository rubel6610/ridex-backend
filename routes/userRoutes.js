const express = require('express');
const router = express.Router();
const {getAllNIds,getAllUsers,getSingleUser,getSingleRiderByUserId,insertUsers,updateUser,
getMessagedUsers,deleteUser,deleteAll,
} = require('../controllers/userController');

router.get('/nids', getAllNIds);
router.get('/users', getAllUsers);
router.get('/user', getSingleUser);
router.get('/rider/userId', getSingleRiderByUserId);
router.post('/insert-all', insertUsers);
router.get('/users/messaged', getMessagedUsers);
router.put('/user/:id', updateUser);
router.delete('/user/:id', deleteUser);
router.delete('/delete-all', deleteAll);

module.exports = router;

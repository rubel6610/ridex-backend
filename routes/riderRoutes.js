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

router.post('/become-rider', becomeRider);
router.get('/riders', getRiders);
router.get('/rider/:id', getSingleRider);
router.post('/rider/insert-allRiders', insertRiders);
router.put('/update-rider/:id', updateRiderById);
router.delete('/delete-rider/:id', deleteRiderById);
router.delete('/rider/delete-allRiders', deleteAllRiders);

module.exports = router;

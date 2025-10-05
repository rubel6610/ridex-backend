const express = require('express');
const router = express.Router();
const {
  becomeRider,
  getRiders,
  getSingleRider,
  insertRiders,
  updateRiderById,
  deleteRiderById,
  deleteAll,
} = require('../controllers/ridersController');

router.post('/become-rider', becomeRider);
router.get('/riders', getRiders);
router.post('/rider/:id', getSingleRider);
router.delete('/rider/:insert-all', insertRiders);
router.put('/update-rider/:id', updateRiderById);
router.delete('/delete-rider/:id', deleteRiderById);
router.delete('/rider/delete-all', deleteAll);

module.exports = router;

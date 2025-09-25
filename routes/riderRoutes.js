const express = require('express');
const router = express.Router();
const {
  becomeRider,
  getRiders,
  getSingleRider,
  updateRiderById,
  deleteRiderById,
} = require('../controllers/ridersController');

router.post('/become-rider', becomeRider);
router.get('/riders', getRiders);
router.post('/rider/:id', getSingleRider);
router.put('/update-rider/:id', updateRiderById);
router.delete('/delete-rider/:id', deleteRiderById);

module.exports = router;

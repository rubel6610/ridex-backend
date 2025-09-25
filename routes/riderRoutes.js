const express = require('express');
const {
  getRiders,
  deleteRiderById,
  becomeRider,
  updateRiderById,
} = require('../controllers/ridersController');
const router = express.Router();

router.get('/riders', getRiders);
router.post('/become-rider', becomeRider);
router.put('/update-rider', updateRiderById);
router.delete('/delete-rider', deleteRiderById);

module.exports = router;

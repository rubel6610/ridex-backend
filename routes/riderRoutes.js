const express = require('express');
const {
  getRiders,
  becomeRider,
  updateRiderById,
} = require('../controllers/ridersController');
const router = express.Router();

router.get('/riders', getRiders);
router.post('/become-rider', becomeRider);
router.put('/update-rider', updateRiderById);

module.exports = router;

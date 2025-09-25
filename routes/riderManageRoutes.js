const express = require('express');
const router = express.Router();
const {
  approveRider,
  rejectRider,
} = require('../controllers/ridersManageController');

router.post('/approve-rider', approveRider);
router.get('/reject-rider', rejectRider);

module.exports = router;

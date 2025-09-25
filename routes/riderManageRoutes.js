const express = require('express');
const router = express.Router();
const {
  approveRider,
  rejectRider,
} = require('../controllers/ridersManageController');

router.post('/approve-rider/:id', approveRider);
router.post('/reject-rider/:id', rejectRider);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  approveUser,
  rejectUser,
} = require('../controllers/usersManageController');

router.post('/approve-user/:id', approveUser);
router.post('/reject-user/:id', rejectUser);

module.exports = router;

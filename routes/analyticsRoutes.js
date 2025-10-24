const express = require('express');
const router = express.Router();
const {
  getUserAnalytics,
  getRiderAnalytics,
  getAdminAnalytics,
} = require('../controllers/analyticsController');

router.get('/user/:userId', getUserAnalytics);
router.get('/rider/:riderId', getRiderAnalytics);
router.get('/admin', getAdminAnalytics);

module.exports = router;

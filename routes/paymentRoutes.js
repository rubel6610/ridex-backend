const express = require('express');
const router = express.Router();
const {
  initPayment, 
  successPayment, 
  failPayment, 
  cancelPayment, 
  getAllPayments, 
  getRiderPerformanceStats
} = require('../controllers/paymentsController');
const { verifyToken, verifyAdmin, verifyUser, verifyRider } = require('../middleware/authMiddleware');

// Public routes (payment callbacks)
router.post('/success', successPayment);
router.post('/fail', failPayment);
router.post('/cancel', cancelPayment);

// Admin routes
router.get('/all', verifyToken, verifyAdmin, getAllPayments);

// User routes
router.post('/init', verifyToken, verifyUser, initPayment);

// Rider routes
router.get('/rider-stats/:userId', verifyToken, verifyRider, getRiderPerformanceStats);

module.exports = router;

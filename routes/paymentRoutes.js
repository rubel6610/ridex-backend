const express = require('express');
const router = express.Router();
const {
initPayment, successPayment, failPayment, cancelPayment, getAllPayments, getRiderPerformanceStats
} = require('../controllers/paymentsController');

router.post('/init', initPayment);
router.post('/success', successPayment);
router.post('/fail', failPayment);
router.post('/cancel', cancelPayment);
router.get('/all', getAllPayments);
router.get('/rider-stats/:userId', getRiderPerformanceStats);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
initPayment, successPayment, failPayment, cancelPayment, getAllPayments, getRiderPerformanceStats, markRiderAsPaid, getAllPlatformPayments, getAllRiderPayments, getAllUserPayments
} = require('../controllers/paymentsController');

router.post('/init', initPayment);
router.post('/success', successPayment);
router.post('/fail', failPayment);
router.post('/cancel', cancelPayment);
router.get('/all', getAllPayments);
router.get('/rider-stats/:userId', getRiderPerformanceStats);
router.post('/mark-rider-paid', markRiderAsPaid);
router.get('/platform-payments', getAllPlatformPayments);
router.get('/rider-payments', getAllRiderPayments);
router.get('/user-payments', getAllUserPayments);

module.exports = router;
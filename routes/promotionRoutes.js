const express = require('express');
const {
  createPromotion,
  getPromotions,
  getActivePromotions,
  validatePromoCode,
  getSinglePromotion,
  updatePromotion,
  deletePromotion,
  deleteAllPromotions
} = require('../controllers/promotionsController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');
const router = express.Router();

// Public routes (for users to see active promotions and validate codes)
router.get('/promotions/active', getActivePromotions);
router.post('/promotions/validate', validatePromoCode);

// Admin routes (protected)
router.post('/promotions', verifyToken, verifyAdmin, createPromotion);
router.get('/promotions', verifyToken, verifyAdmin, getPromotions);
router.get('/promotions/:id', verifyToken, verifyAdmin, getSinglePromotion);
router.put('/promotions/:id', verifyToken, verifyAdmin, updatePromotion);
router.delete('/promotions/:id', verifyToken, verifyAdmin, deletePromotion);
router.delete('/promotions/delete-all', verifyToken, verifyAdmin, deleteAllPromotions);

module.exports = router;

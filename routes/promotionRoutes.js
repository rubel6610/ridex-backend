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

const router = express.Router();

// Public routes (for users to see active promotions and validate codes)
router.get('/promotions/active', getActivePromotions);
router.post('/promotions/validate', validatePromoCode);

// Admin routes (protected)
router.post('/promotions', createPromotion);
router.get('/promotions', getPromotions);
router.get('/promotions/:id',  getSinglePromotion);
router.put('/promotions/:id',updatePromotion);
router.delete('/promotions/:id', deletePromotion);
router.delete('/promotions/delete-all', deleteAllPromotions);

module.exports = router;

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


// POST → Create new promotion
router.post('/promotions', createPromotion);

// POST → Validate promo code
router.post('/promotions/validate', validatePromoCode);

// GET → Get all promotions
router.get('/promotions', getPromotions);

// GET → Get active promotions (for users) - MUST be before /:id
router.get('/promotions/active', getActivePromotions);

// GET → Get single promotion by ID
router.get('/promotions/:id', getSinglePromotion);

// PUT → Update promotion by ID
router.put('/promotions/:id', updatePromotion);

// DELETE → Delete promotion by ID
router.delete('/promotions/:id', deletePromotion);

// DELETE → Delete all promotions (optional)
router.delete('/promotions/delete-all', deleteAllPromotions);

module.exports = router;
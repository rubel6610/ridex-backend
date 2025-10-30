// routes/emailRoutes.js
const express = require('express');
const router = express.Router();
const {
  contactFormSubmit,
  subscribeToNewsletter,
  getAllSubscribers
} = require('../controllers/emailController');

router.post('/contact', contactFormSubmit);
router.post('/subscribe', subscribeToNewsletter);
router.get('/subscribers', getAllSubscribers);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  logoutUser,
} = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/signIn', loginUser);
router.post("/forgot-password",forgotPassword)
router.post("/reset-password",resetPassword)
router.post('/logout', logoutUser);

module.exports = router;

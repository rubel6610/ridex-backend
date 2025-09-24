const express = require('express');
const { registerUser,loginUser } = require('../controllers/authController');
const { forgotPassword, resetPassword } = require('../controllers/forgotpasswordController');

const router = express.Router();

router.post('/register', registerUser);
router.post('/signIn', loginUser);
router.post("/forgot-password",forgotPassword)
router.post("/reset-password",resetPassword)

module.exports = router;

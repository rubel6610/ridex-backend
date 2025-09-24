const express = require('express');
const {
  addRiderDirectly,
} = require('../controllers/ridersController');
const router = express.Router();

router.post('/add-rider', addRiderDirectly);

module.exports = router;

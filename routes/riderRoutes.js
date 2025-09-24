const express = require('express');
const {
  getRiders,
  addRiderDirectly,
} = require('../controllers/ridersController');
const router = express.Router();

router.get('/riders', getRiders);
router.post('/add-rider', addRiderDirectly);

module.exports = router;

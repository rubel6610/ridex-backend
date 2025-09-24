const express = require('express');
const {
  getRiders,
  addRiderDirectly,
  becomeRider,
} = require('../controllers/ridersController');
const router = express.Router();

router.get('/riders', getRiders);
router.post('/add-rider', addRiderDirectly);
router.post('/become-rider', becomeRider);

module.exports = router;

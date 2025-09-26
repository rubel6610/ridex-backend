const express = require('express');
const { approveAndRejectRider } = require('../controllers/ridersManageController');
const router = express.Router();


router.patch("/approveAndreject-rider/:id", approveAndRejectRider);


module.exports = router;

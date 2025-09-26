const express = require('express');
const { approveAndRejectRider } = require('../controllers/ridersManageController');

const router = express.Router();



router.patch("/approveAndrejectUser/:id", approveAndRejectRider)


module.exports = router;

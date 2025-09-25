const express = require('express');
const { approveAndrejectUser } = require('../controllers/userManageController');
const router = express.Router();



router.patch("/approveAndrejectUser/:id", approveAndrejectUser)


module.exports = router;

const express = require("express");
const router = express.Router();
const { reverseGeocode } = require("../controllers/geoCodeControllers");
const { verifyToken } = require("../middleware/authMiddleware");

// Protected route - only authenticated users can access geocoding
router.get("/reverse-geocode", verifyToken, reverseGeocode);

module.exports = router;

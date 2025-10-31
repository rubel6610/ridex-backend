const express = require("express");
const router = express.Router();
const { reverseGeocode } = require("../controllers/geoCodeControllers");


// Protected route - only authenticated users can access geocoding
router.get("/reverse-geocode",reverseGeocode);

module.exports = router;

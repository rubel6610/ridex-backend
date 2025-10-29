const express = require("express");
const router = express.Router();
const { reverseGeocode } = require("../controllers/geoCodeControllers");


router.get("/reverse-geocode", reverseGeocode);

module.exports = router;

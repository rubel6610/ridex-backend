const reverseGeocode = async (req, res) => {
  try {
    const { lat, lon } = req.query;
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Reverse geocode error:", error);
    if (error.name === "AbortError") {
      return res.status(408).json({ error: "Request timed out" });
    }
    res.status(500).json({ error: "Failed to fetch location" });
  }
};


module.exports = {reverseGeocode}
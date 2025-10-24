const reverseGeocode = async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    // Validate input parameters
    if (!lat || !lon) {
      return res.status(400).json({ error: "Missing latitude or longitude" });
    }
    
    // Set timeout for the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      { signal: controller.signal }
    );
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
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
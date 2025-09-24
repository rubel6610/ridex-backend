const { getCollection } = require('../utils/getCollection');

// GET: Get all riders
const getRiders = async (req, res) => {
  try {
    const ridersCollection = getCollection('riders');
    const riders = await ridersCollection.find().toArray();
    res.status(200).json({ riders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST: Simple rider insert (no checks)
const addRiderDirectly = async (req, res) => {
  try {
    const ridersCollection = getCollection('riders');
    const riderData = req.body;

    // automatically add createdAt if not provided
    if (!riderData.createdAt) {
      riderData.createdAt = new Date();
    }

    await ridersCollection.insertOne(riderData);
    res
      .status(201)
      .json({ message: 'Rider added successfully', rider: riderData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getRiders, addRiderDirectly };

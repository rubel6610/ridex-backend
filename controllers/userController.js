const { getDb } = require('../config/db');

const getAllUsers = async (req, res) => {
  try {
    const db = getDb();
    const usersCollection = db.collection('demoUsers');
    const users = await usersCollection.find().toArray();
    res.send(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAllUsers };

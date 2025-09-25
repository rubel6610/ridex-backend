const { getCollection } = require('../utils/getCollection');
const { ObjectId } = require('mongodb');

// PUT: Approve user
const approveUser = async (req, res) => {
  try {
    const usersCollection = getCollection('users');
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const user = await usersCollection.findOne({ _id: new ObjectId(id) });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified === 'approved') {
      return res.status(400).json({ message: 'User is already approved.' });
    }

    await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { isVerified: 'approved' } }
    );

    res.status(200).json({ message: 'User approved successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PUT: Reject user
const rejectUser = async (req, res) => {
  try {
    const usersCollection = getCollection('users');
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const user = await usersCollection.findOne({ _id: new ObjectId(id) });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified === 'rejected') {
      return res.status(400).json({ message: 'User is already rejected.' });
    }

    await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { isVerified: 'rejected' } }
    );

    res.status(200).json({ message: 'User rejected successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { approveUser, rejectUser };

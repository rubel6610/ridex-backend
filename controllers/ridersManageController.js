const { ObjectId } = require('mongodb');
const { getCollection } = require('../utils/getCollection');

// PUT: Approve rider request
const approveRider = async (req, res) => {
  try {
    const ridersCollection = getCollection('riders');
    const usersCollection = getCollection('users');

    const { riderId } = req.params; 

    if (!riderId) {
      return res.status(400).json({ message: 'Rider ID is required' });
    }

    // find rider request
    const rider = await ridersCollection.findOne({
      _id: new ObjectId(riderId),
    });
    if (!rider) {
      return res.status(404).json({ message: 'Rider not found' });
    }

    // update rider status to approved
    await ridersCollection.updateOne(
      { _id: new ObjectId(riderId) },
      { $set: { status: 'approved', approvedAt: new Date() } }
    );

    // update user role to rider
    await usersCollection.updateOne(
      { _id: rider.userId },
      { $set: { role: 'rider' } }
    );

    res.status(200).json({ message: 'Rider approved successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PUT: Reject rider request
const rejectRider = async (req, res) => {
  try {
    const ridersCollection = getCollection('riders');
    const usersCollection = getCollection('users');

    const { riderId } = req.params; 

    if (!riderId) {
      return res.status(400).json({ message: 'Rider ID is required' });
    }

    // find rider request
    const rider = await ridersCollection.findOne({
      _id: new ObjectId(riderId),
    });
    if (!rider) {
      return res.status(404).json({ message: 'Rider not found' });
    }

    // update rider status to rejected
    await ridersCollection.updateOne(
      { _id: new ObjectId(riderId) },
      { $set: { status: 'rejected', rejectedAt: new Date() } }
    );

    // update user role back to user
    await usersCollection.updateOne(
      { _id: rider.userId },
      { $set: { role: 'user' } }
    );

    res.status(200).json({ message: 'Rider rejected successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  approveRider,
  rejectRider,
};
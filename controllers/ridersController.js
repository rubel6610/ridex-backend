const { ObjectId } = require('mongodb');
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

// POST: Become a rider with checks
const becomeRider = async (req, res) => {
  try {
    const ridersCollection = getCollection('riders');
    const usersCollection = getCollection('users');

    const {
      userId,
      present_address,
      vehicleType,
      vehicleModel,
      vehicleRegisterNumber,
      drivingLicense,
    } = req.body;

    // find user
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // already rider check
    if (user.role === 'rider') {
      return res.status(400).json({ message: 'You are already a rider' });
    }

    // already pending check
    const existingRider = await ridersCollection.findOne({
      userId: new ObjectId(userId),
    });
    if (existingRider && existingRider.status === 'pending') {
      return res
        .status(400)
        .json({ message: 'Your rider request is already under review' });
    }

    // create rider profile
    const riderData = {
      userId: user._id,
      fullName: user.fullName,
      dateOfBirth: user.dateOfBirth,
      email: user.email,
      emergency_contact: user.phoneNumber,
      present_address,
      vehicleType,
      vehicleModel,
      vehicleRegisterNumber,
      drivingLicense,
      status: 'pending',
      createdAt: new Date(),
    };

    await ridersCollection.insertOne(riderData);

    // update user present_address if changed
    if (present_address) {
      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { present_address } }
      );
    }

    res
      .status(201)
      .json({ message: 'Rider request submitted', rider: riderData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getRiders, addRiderDirectly, becomeRider };

const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const { getCollection } = require('../utils/getCollection');

// POST: Become a rider with password validation
const becomeRider = async (req, res) => {
  try {
    const ridersCollection = getCollection('riders');
    const usersCollection = getCollection('users');

    const {
      userId,
      password,
      present_address,
      vehicleType,
      vehicleModel,
      vehicleRegisterNumber,
      drivingLicense,
    } = req.body;

    // find user
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // check if already pending
    const existingRider = await ridersCollection.findOne({
      userId: new ObjectId(userId),
    });

    // check if user already rider
    if (user.role === 'rider' && existingRider.status === 'approved') {
      return res.status(400).json({ message: 'You are already a rider' });
    }

    // check if user already requested to be a rider
    if (
      existingRider &&
      existingRider.status === 'pending' &&
      user.role === 'user'
    ) {
      return res
        .status(400)
        .json({ message: 'Your rider request is already under review' });
    }

    // validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // hash password again for riders collection
    const hashedPassword = await bcrypt.hash(password, 10);

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
      password: hashedPassword,
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

    res.status(201).json({ message: 'Rider request submitted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

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

// GET: Get single rider by ID
const getSingleRider = async (req, res) => {
  try {
     const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json({ message: 'Id is required' });
    }

    const risersCollection = getCollection('riders');

    const query = {
      _id: new ObjectId(id),
    };
    const singleRider = await risersCollection.findOne(query);

    if (!singleRider) {
      return res.status(404).json({ message: 'Rider not found' });
    }

    res.status(200).json(singleRider);
  } catch (error) {
    console.error('❌ Error fetching user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT: Update rider by ID
const updateRiderById = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!id) return res.status(400).json({ message: 'Id is required' });

    const ridersCollection = getCollection('riders');

    const existingRider = await ridersCollection.findOne({
      _id: new ObjectId(id),
    });
    if (!existingRider)
      return res.status(404).json({ message: 'Rider not found' });

    // $set will update only the keys provided in the request body
    await ridersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    res.status(200).json({
      message: 'Rider updated successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// DELETE: Delete rider by ID
const deleteRiderById = async (req, res) => {
  try {
   const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'Rider ID is required' });

    const existingRider = await ridersCollection.findOne({
      _id: new ObjectId(id),
    });
    if (!existingRider){
        return res.status(404).json({ message: 'Rider not found' });
    }
    
    const result = await ridersCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
        return res.status(404).json({ message: 'Rider not found' });
      }

    res.status(200).json({ message: 'Rider deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  becomeRider,
  getRiders,
  getSingleRider,
  deleteRiderById,
  updateRiderById,
};

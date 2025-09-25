const { ObjectId } = require('mongodb');
const { getCollection } = require('../utils/getCollection');


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

// PUT: Update rider by ID
const updateRiderById = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!id) return res.status(400).json({ message: 'Rider ID is required' });

    if (!updateData || Object.keys(updateData).length === 0)
      return res.status(400).json({ message: 'No data provided for update' });

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

    const updatedRider = await ridersCollection.findOne({
      _id: new ObjectId(id),
    });

    res.status(200).json({
      message: 'Rider updated successfully',
      rider: updatedRider,
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
  deleteRiderById,
  updateRiderById,
};

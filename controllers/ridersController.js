const { ObjectId } = require('mongodb');
const { getCollection } = require('../utils/getCollection');
const bcrypt = require('bcrypt');

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
      verifyImage: frontFace, 
      leftPose,  
      rightPose,
      frontPose,
    } = req.body;

    // Find user by ID
    const user = await usersCollection.findOne({
      $or: [{ _id: new ObjectId(new ObjectId(userId)) }, { _id: userId }],
    });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // check if already rider
    if (user.role === 'rider') {
      return res.status(400).json({ message: 'You are already a rider' });
    }

    // Check if user already requested to be a rider
    const existingRider = await ridersCollection.findOne({
      userId: user._id.toString(),
    });
    if (existingRider && user.role === 'user') {
      return res
        .status(400)
        .json({ message: 'Your rider request is already under review' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Hash password again for riders collection
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create rider profile
    const riderData = {
      userId: user._id.toString(),
      fullName: user.fullName,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth,
      email: user.email,
      emergency_contact: user.phoneNumber,
      present_address: present_address || user.present_address,
      reviews: 0,
      ratings: 0,
      completedRides: 0,
      vehicleType,
      vehicleModel,
      vehicleRegisterNumber,
      drivingLicense,
      password: hashedPassword,
      status: 'pending',
      location: null,
      ongoingTripId: null,
      lastUpdated: null,
      createdAt: new Date(),
    };

    // Add frontFace if provided (identity verification)
    if (frontFace) {
      riderData.frontFace = frontFace;
    }
    
    // Add 3-step face verification if provided
    if (leftPose && rightPose && frontPose) {
      riderData.faceVerification = {
        leftPose,
        rightPose,
        frontPose,
        verifiedAt: new Date(),
      };
    }

    // Insert into riders collection
    const result = await ridersCollection.insertOne(riderData);

    // Update user present_address if changed
    if (present_address) {
      await usersCollection.updateOne(
        { _id: new ObjectId(user._id) },
        { $set: { present_address } }
      );
    }

    console.log('✅ Rider created:', result.insertedId);

    res.status(201).json({ 
      message: 'Rider request submitted!',
      rider: { ...riderData, _id: result.insertedId }
    });
  } catch (error) {
    console.error('❌ Error in becomeRider:', error);
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
      return res.status(400).json({ message: 'Id is required' });
    }

    const ridersCollection = getCollection('riders');

    let query;
    if (ObjectId.isValid(id)) {
      query = { _id: new ObjectId(id) };
    } else {
      query = { _id: id }; // fallback (যদি কখনও _id string আকারে stored থাকে)
    }

    const singleRider = await ridersCollection.findOne(query);

    if (!singleRider) {
      return res.status(404).json({ message: 'Rider not found' });
    }

    res.status(200).json(singleRider);
  } catch (error) {
    console.error('❌ Error fetching rider:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST: Insert many riders
const insertRiders = async (req, res) => {
  try {
    const ridersCollection = getCollection('riders');

    const docs = req.body;

    const result = await ridersCollection.insertMany(docs);

    res.json({
      message: `Inserted ${result.insertedCount} documents into riders collection`,
      insertedIds: result.insertedIds,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
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
      $or: [{ _id: new ObjectId(id) }, { _id: id }],
    });
    if (!existingRider)
      return res.status(404).json({ message: 'Rider not found' });

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

    const ridersCollection = getCollection('riders');

    const existingRider = await ridersCollection.findOne({
      $or: [{ _id: new ObjectId(id) }, { _id: id }],
    });
    if (!existingRider) {
      return res.status(404).json({ message: 'Rider not found' });
    }

    const result = await ridersCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Rider not found' });
    }

    res.status(200).json({ message: 'Rider deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// DELETE: Delete fall riders
const deleteAllRiders = async (req, res) => {
  try {
    const ridersCollection = getCollection('riders');

    const result = await ridersCollection.deleteMany({});
    res.json({
      message: `Deleted ${result.deletedCount} documents from riders collection`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  becomeRider,
  getRiders,
  getSingleRider,
  insertRiders,
  updateRiderById,
  deleteRiderById,
  deleteAllRiders,
};

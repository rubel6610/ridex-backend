const { transporter } = require('../config/email');
const { getCollection } = require('../utils/getCollection');
const { ObjectId } = require('mongodb');

// USERS INITIAL CONTROLLERS:
// GET: Get all NID collections
const getAllNIds = async (req, res) => {
  try {
    const nidCollection = getCollection('nidCollection');

    const users = await nidCollection.find().toArray();

   res.status(200).json(users);
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

// GET: Get all users
const getAllUsers = async (req, res) => {
  try {
    const usersCollection = getCollection('users');

    const users = await usersCollection.find().toArray();

    res.status(200).json(users);
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET: Get single user by ID
const getSingleUser = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: 'User email required' });
    }
    const usersCollection = getCollection('users');
    const query = { email };
    const singleUser = await usersCollection.findOne(query);

    if (!singleUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(singleUser);
  } catch (error) {
    console.error('❌ Error fetching user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST: Insert many users
const insertUsers = async (req, res) => {
   try {
    const usersCollection = getCollection('users'); 

    const docs = req.body;
    if (!Array.isArray(docs) || docs.length === 0) {
      return res.status(400).json({ message: 'Provide an array of documents' });
    }

    const result = await usersCollection.insertMany(docs);
    res.json({
      message: `Inserted ${result.insertedCount} documents into users collection`,
      insertedIds: result.insertedIds,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PATCH: Update user by ID
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    if (!id) {
      return res.status(400).json({ message: 'id is required' });
    }

    const usersCollection = getCollection('users');

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET: Get message from users
const getMessagedUsers = async (req, res) => {
  try {
    const messageCollection = getCollection('messages');
    const userCollection = getCollection('users');

    // Get unique senderIds who sent a message
    const senderIds = await messageCollection.distinct('senderId');

    // Get user details for those senderIds
    const users = await userCollection
      .find({ _id: { $in: senderIds }, role: 'user' })
      .toArray();

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load users' });
  }
};

// DELETE: Delete user by ID
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const usersCollection = getCollection('users');

    const result = await usersCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE: Delete full collection
const deleteAll = async (req, res) => {
  try {
    const DeleteCollection = getCollection('users');

    const result = await DeleteCollection.deleteMany({});
    res.json({
      message: `Deleted ${result.deletedCount} documents from users collection`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// USERS RIDE RELATED CONTROLLERS:
// POST: User ride requests
const rideRequest = async (req, res) => {
  try {
    // Rider & Ride collection
    const ridersCollection = getCollection('riders');
    const ridesCollection = getCollection('rides');

    const { userId, pickup, drop, vehicleType, fare } = req.body;
    console.log(userId, pickup, drop, vehicleType, fare);

    // Validate input
    if (!userId || !pickup || !drop || !vehicleType || !fare) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // nearest rider search using geoNear
    const riders = await ridersCollection
      .aggregate([
        {
          $geoNear: {
            near: pickup, // { type: 'Point', coordinates: [lng, lat] }
            distanceField: 'distance',
            spherical: true,
            maxDistance: 5000, // ৫ কিমি
          },
        },
        {
          $match: {
            status: 'online',
            vehicleType: vehicleType,
          },
        },
        { $limit: 1 },
      ])
      .toArray();

    if (riders.length === 0) {
      return res.status(404).json({ message: 'No rider found nearby' });
    }

    const rider = riders[0];

    // Ride document with default fields
    const ride = {
      userId: new ObjectId(userId),
      riderId: new ObjectId(rider._id),
      pickup,
      drop,
      fare,
      vehicleType,
      status: 'pending',
      createdAt: new Date(),
      acceptedAt: null,
      rejectedAt: null,
      cancelledAt: null,
      liveLocation: null,
      distance: rider.distance || null,
      riderInfo: {
        fullName: rider.fullName || null,
        vehicleType: rider.vehicleType || null,
        vehicleModel: rider.vehicleModel || null,
        vehicleRegisterNumber: rider.vehicleRegisterNumber || null,
        email: rider.email || null,
      },
    };

    // Insert ride into rides collection
    const result = await ridesCollection.insertOne(ride);

    // TODO: Socket.IO: notify rider in real-time
    // io.to(rider._id.toString()).emit('ride-request', ride);

    // Send email to rider
    await transporter.sendMail({
      from: `"RideX Support" <${process.env.EMAIL_USER}>`,
      to: rider.email,
      subject: 'New Ride Request',
      html: `
        <h2>New Ride Request</h2>
        <p>Hello ${rider.fullName || 'Rider'},</p>
        <p>You have a new ride request from user ${userId}.</p>
        <ul>
          <li><strong>Pickup:</strong> ${pickup.coordinates.join(', ')}</li>
          <li><strong>Drop:</strong> ${drop.coordinates.join(', ')}</li>
          <li><strong>Fare:</strong> ${fare}</li>
        </ul>
        <p>Please check your dashboard or app to accept or reject this request.</p>
      `,
    });

    // Response to frontend
    res.status(201).json({
      success: true,
      rideId: result.insertedId,
      rider: {
        _id: rider._id,
        fullName: rider.fullName,
        vehicleType: rider.vehicleType,
        distance: rider.distance,
      },
    });
  } catch (error) {
    console.error('Ride request error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAllNIds,
  getAllUsers,
  getSingleUser,
  insertUsers,
  updateUser,
  getMessagedUsers,
  deleteUser,
  deleteAll,
  rideRequest,
}

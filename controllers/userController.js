const { transporter } = require('../config/email');
const { getCollection } = require('../utils/getCollection');
const { ObjectId } = require('mongodb');

// USERS INITIAL CONTROLLERS:
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

// USERS RIDE RELATED CONTROLLERS:
// POST: User ride requests
const rideRequest = async (req, res) => {
  try {
    const ridersCollection = getCollection('riders');
    const { userId, pickup, drop, vehicleType, fare } = req.body;

    // aggregation pipeline দিয়ে nearest rider খুঁজছি
    const riders = await ridersCollection
      .aggregate([
        {
          $geoNear: {
            near: pickup,
            distanceField: 'distance',
            spherical: true,
            maxDistance: 5000, // ৫ কিমি পর্যন্ত rider
          },
        },
        {
          $match: {
            status: 'online',
            vehicleType: vehicleType,
          },
        },
        { $limit: 1 }, // শুধু ১ জন rider নেবে
      ])
      .toArray();

    if (riders.length === 0) {
      return res.status(404).json({ message: 'No rider found' });
    }

    const rider = riders[0];

    // rides collection এ insert করছি
    const ride = {
      userId: new ObjectId(userId),
      riderId: new ObjectId(rider._id),
      pickup,
      drop,
      fare,
      status: 'pending',
      createdAt: new Date(),
    };

    const result = await ridersCollection('rides').insertOne(ride);

    // এখানে Socket/Notification দিয়ে rider কে রিকোয়েস্ট পাঠাতে হবে
    // উদাহরণ: io.to(rider._id.toString()).emit('ride-request', ride);

    // rider কে মেইল পাঠাচ্ছি (just for now)
    await transporter.sendMail({
      from: `"RideX Support" <${process.env.EMAIL_USER}>`,
      to: rider.email, // রাইডারের ইমেইল
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

    res.json({ success: true, rideId: result.insertedId, rider });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAllUsers,
  getSingleUser,
  updateUser,
  deleteUser,
  rideRequest,
};
  
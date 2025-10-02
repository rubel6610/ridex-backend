const { getCollection } = require('../utils/getCollection');
const transporter = require('../config/email');

// RIDERS RIDE RELATED CONTROLLERS:
// GET: Get all rides here
const getAllRides = async(req, res) => {
  try {
    const ridesCollection = getCollection('rides');

    const rides = await ridesCollection.find().toArray();

    res.status(200).json(rides);
  } catch (error) {
    console.error('❌ Error fetching rides:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

// POST: update rider status by rideId
const requestStatus = async (req, res) => {
  try {
    const ridersCollection = getCollection('riders');
    const { riderId, status } = req.body; // online/offline

    if (!riderId || !status) {
      return res
        .status(400)
        .json({ message: 'riderId and status are required' });
    }

    const result = await ridersCollection.updateOne(
      { _id: riderId }, // riderId দিয়ে খুঁজছি
      { $set: { status } }
    );

    res.status(200).json({
      success: true,
      message: 'Rider status updated successfully!',
      result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST: update rider status offline on logout
const setStatusOffline = async (req, res) => {
  try {
    const ridersCollection = getCollection('riders');
    const { userId } = req.body;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: 'userId is required' });
    }

    const result = await ridersCollection.updateOne(
      { userId },
      { $set: { status: 'offline' } }
    );

    if (result.matchedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'Rider not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Rider status set to offline successfully!',
      result,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: 'Server error', error: error.message });
  }
};

// POST: update rider location by riderId
const updateLocation = async (req, res) => {
  try {
    const ridersCollection = getCollection('riders');
    const { riderId, longitude, latitude } = req.body;

    if (!riderId || !longitude || !latitude) {
      return res
        .status(400)
        .json({ message: 'riderId, longitude, latitude are required' });
    }

    const updatedDoc = {
      location: {
        type: 'Point',
        coordinates: [longitude, latitude],
      },
      lastUpdated: new Date(),
    };

    const result = await ridersCollection.updateOne(
      { _id: riderId }, // riderId দিয়ে খুঁজছি
      { $set: updatedDoc }
    );

    res.status(200).json({
      success: true,
      message: 'Rider current location updated successfully!',
      result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
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

    // Send email to rider\
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
  getAllRides,
  requestStatus,
  setStatusOffline,
  updateLocation,
  rideRequest,
};


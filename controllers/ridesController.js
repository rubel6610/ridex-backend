const { getCollection } = require("../utils/getCollection");
const transporter = require("../config/email");
const { ObjectId } = require("mongodb");

// RIDERS RIDE RELATED CONTROLLERS:
// GET: Get all rides here
const getAllRides = async (req, res) => {
  try {
    const ridesCollection = getCollection("rides");

    const rides = await ridesCollection.find().toArray();

    res.status(200).json(rides);
  } catch (error) {
    console.error("❌ Error fetching rides:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET: Get single specific ride with rideId with verification
const getInstantRide = async (req, res) => {
  try {
    const { rideId } = req.query;
    const token = req.query.token;

    // Token empty verify
    if (!token) {
      return res.status(401).json({ message: "Token missing" });
    }

    // Token correct verify
    let decoded;
    try {
      decoded = JWT_SECRET.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(403).json({ message: "Invalid token" });
    }

    // rides collection
    const ridesCollection = getCollection("rides");

    // ride fetch
    const ride = await ridesCollection.findOne({
      $or: [{ _id: new ObjectId(rideId) }, { _id: rideId }],
    });

    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    res.json(ride);
  } catch (err) {
    console.error("Ride fetch error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// POST: Update rider status by rideId
const requestStatus = async (req, res) => {
  try {
    const ridersCollection = getCollection("riders");
    const { riderId, status } = req.body; // online/offline

    if (!riderId || !status) {
      return res
        .status(400)
        .json({ message: "riderId and status are required" });
    }

    const result = await ridersCollection.updateOne(
      { $or: [{ _id: new ObjectId(riderId) }, { _id: riderId }] }, // riderId দিয়ে খুঁজছি
      { $set: { status } }
    );

    res.status(200).json({
      success: true,
      message: "Rider status updated successfully!",
      result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// POST: Update rider status offline on logout
const setStatusOffline = async (req, res) => {
  try {
    const ridersCollection = getCollection("riders");
    const { userId } = req.body;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "userId is required" });
    }

    const result = await ridersCollection.updateOne(
      {$or:[
      { _id: new ObjectId(userId) },
      {_id:userId}
    ]},
      { $set: { status: "offline" } },{
        upsert:true,
      }
    );

    if (result.matchedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Rider not found" });
    }

    res.status(200).json({
      success: true,
      message: "Rider status set to offline successfully!",
      result,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// POST: Update rider location by riderId
const updateLocation = async (req, res) => {
  try {
    const ridersCollection = getCollection("riders");
    const { riderId, longitude, latitude } = req.body;

    if (!riderId || !longitude || !latitude) {
      return res
        .status(400)
        .json({ message: "riderId, longitude, latitude are required" });
    }

    const updatedDoc = {
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
      lastUpdated: new Date(),
    };

    const result = await ridersCollection.updateOne(
      {$or:[
      { _id: new ObjectId(riderId) },
      {_id:riderId}
    ]},
      { $set: updatedDoc },{
        upsert:true,
      }
    );

    res.status(200).json({
      success: true,
      message: "Rider current location updated successfully!",
      result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// POST: Rider accept
const acceptRide = async (req, res) => {
  try {
    const { rideId, riderId } = req.body;
    if (!rideId || !riderId)
      return res.status(400).json({ message: "rideId and riderId required" });

    const ridesCollection = getCollection("rides");

    const ride = await ridesCollection.findOneAndUpdate(
      { _id: new ObjectId(rideId), riderId: new ObjectId(riderId) },
      { $set: { status: "accepted", acceptedAt: new Date() } },
      { returnDocument: "after" }
    );

    if (!ride.value)
      return res
        .status(404)
        .json({ message: "Ride not found or already processed" });

    // TODO: Socket.IO: notify user
    // io.to(ride.value.userId.toString()).emit('ride-accepted', { rideId, riderInfo: ride.value.riderInfo, eta: '5 mins' });

    // Send email to user
    await transporter.sendMail({
      from: `"RideX Support" <${process.env.EMAIL_USER}>`,
      to: "user@example.com", // এখানে User email বসাবে
      subject: "Your Ride Accepted",
      html: `
        <h2>Ride Accepted</h2>
        <p>Rider ${ride.value.riderInfo.fullName} has accepted your ride request.</p>
        <ul>
          <li><strong>Vehicle:</strong> ${ride.value.riderInfo.vehicleModel}</li>
          <li><strong>Plate:</strong> ${ride.value.riderInfo.vehicleRegisterNumber}</li>
          <li><strong>ETA:</strong> 5 mins</li>
        </ul>
      `,
    });

    res.json({ success: true, ride: ride.value });
  } catch (error) {
    console.error("Accept ride error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// POST: Rider reject
const rejectRide = async (req, res) => {
  try {
    const { rideId, riderId } = req.body;
    if (!rideId || !riderId)
      return res.status(400).json({ message: "rideId and riderId required" });

    const ridesCollection = getCollection("rides");
    const ridersCollection = getCollection("riders");

    await ridesCollection.updateOne(
      { _id: new ObjectId(rideId), riderId: new ObjectId(riderId) },
      { $set: { status: "rejected", rejectedAt: new Date() } }
    );

    const ride = await ridesCollection.findOne({ _id: new ObjectId(rideId) });
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    // Find next nearest rider excluding current rejected rider
    const nearestRiders = await ridersCollection
      .aggregate([
        {
          $geoNear: {
            near: ride.pickup,
            distanceField: "distance",
            spherical: true,
            maxDistance: 5000,
          },
        },
        {
          $match: {
            status: "online",
            vehicleType: ride.vehicleType,
            _id: { $ne: new ObjectId(riderId) },
          },
        },
        { $limit: 1 },
      ])
      .toArray();

    if (nearestRiders.length === 0)
      return res.status(404).json({ message: "No other rider found" });

    const nextRider = nearestRiders[0];

    // TODO: Socket.IO: notify nextRider
    // io.to(nextRider._id.toString()).emit('ride-request', ride);

    // Send email to next rider
    await transporter.sendMail({
      from: `"RideX Support" <${process.env.EMAIL_USER}>`,
      to: nextRider.email,
      subject: "New Ride Request",
      html: `
        <h2>New Ride Request</h2>
        <p>Hello ${nextRider.fullName || "Rider"},</p>
        <p>You have a new ride request (replacement) from user ${
          ride.userId
        }.</p>
        <ul>
          <li><strong>Pickup:</strong> ${ride.pickup.coordinates.join(
            ", "
          )}</li>
          <li><strong>Drop:</strong> ${ride.drop.coordinates.join(", ")}</li>
          <li><strong>Fare:</strong> ${ride.fare}</li>
        </ul>
      `,
    });

    res.json({ success: true, nextRider });
  } catch (error) {
    console.error("Reject ride error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// USERS RIDE RELATED CONTROLLERS:
// POST: User ride requests
const rideRequest = async (req, res) => {
  try {
    // Rider & Ride collection
    const ridersCollection = getCollection("riders");
    const ridesCollection = getCollection("rides");

    const { userId, pickup, drop, vehicleType, fare } = req.body;
    console.log(userId, pickup, drop, vehicleType, fare);

    // Validate input
    if (!userId || !pickup || !drop || !vehicleType || !fare) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // nearest rider search using geoNear
    const riders = await ridersCollection
      .aggregate([
        {
          $geoNear: {
            near: pickup, // { type: 'Point', coordinates: [lng, lat] }
            distanceField: "distance",
            spherical: true,
            maxDistance: 5000, // ৫ কিমি
          },
        },
        {
          $match: {
            status: "online",
            vehicleType: vehicleType,
          },
        },
        { $limit: 1 },
      ])
      .toArray();

    if (riders.length === 0) {
      return res.status(404).json({ message: "No rider found nearby" });
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
      status: "pending",
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

    const dashboardUrl = `http://localhost:3000/dashboard/rider/available-rides?rideId=${result._id}`;

    // Send email to rider\
    await transporter.sendMail({
      from: `"RideX Support" <${process.env.EMAIL_USER}>`,
      to: rider.email,
      subject: "New Ride Request",
      html: `
    <h2>New Ride Request</h2>
    <p>Hello ${rider.fullName || "Rider"},</p>
    <p>You have a new ride request from user ${userId}.</p>
    <ul>
      <li><strong>Pickup:</strong> ${pickup.coordinates.join(", ")}</li>
      <li><strong>Drop:</strong> ${drop.coordinates.join(", ")}</li>
      <li><strong>Fare:</strong> ${fare}</li>
    </ul>
     <a href="${dashboardUrl}" style="background:#4CAF50;color:white;padding:10px 15px;border-radius:5px;text-decoration:none;">
      View Ride
    </a>
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
    console.error("Ride request error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getAllRides,
  getInstantRide,
  requestStatus,
  setStatusOffline,
  updateLocation,
  acceptRide,
  rejectRide,
  rideRequest,
};

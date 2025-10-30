const { getCollection } = require('../utils/getCollection');
const transporter = require('../config/email');
const { ObjectId } = require('mongodb');
const { getIO } = require('../socket/socket');


// GET: Get chat messages for a ride
const getRideChatMessages = async (req, res) => {
  try {
    const { rideId } = req.params;

    if (!rideId) {
      return res.status(400).json({ message: 'Ride ID is required' });
    }

    const ridesCollection = getCollection('rides');
    const ride = await ridesCollection.findOne({ _id: new ObjectId(rideId) });

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    return res.json({
      success: true,
      messages: ride.chatMessages || [],
      rideInfo: {
        userId: ride.userId,
        riderId: ride.riderId,
        status: ride.status
      }
    });
  } catch (error) {
    console.error('Error fetching ride chat messages:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// RIDERS RIDE RELATED CONTROLLERS:
// GET: Get all rides here
const getAllRides = async (req, res) => {
  try {
    const ridesCollection = getCollection('rides');

    const rides = await ridesCollection.find().toArray();

    res.status(200).json(rides);
  } catch (error) {
    console.error('❌ Error fetching rides:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET: Get all available rides with riderId
const getAvailableRide = async (req, res) => {
  try {
    const riderId = req.params.riderId;

    const ridersCollection = getCollection('riders');
    const ridesCollection = getCollection('rides');

    // find the rider document first
    const rider = await ridersCollection.findOne({ userId: riderId });

    if (!rider) {
      return res.status(404).json({ message: 'Rider not found' });
    }

    // now find rides for that rider
    const rides = await ridesCollection
      .find({ riderId: rider._id, status: 'pending' })
      .toArray();

    res.json({ rides, rider });
  } catch (err) {
    console.error('Ride fetch error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET: Get current ride status and info by ID
const getCurrentRide = async (req, res) => {
  try {
    const { rideId } = req.params;

    if (!rideId) {
      return res.status(400).json({ message: 'Ride ID is required' });
    }

    const ridesCollection = getCollection('rides');
    const ride = await ridesCollection.findOne({ _id: new ObjectId(rideId) });

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    // শুধু স্ট্যাটাস ও রাইডার ইনফো পাঠানো দরকার
    return res.json({
      success: true,
      status: ride.status,
      rideInfo: ride || null,
    });
  } catch (error) {
    console.error('🔥 Ride status fetch error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET: Get specific rider and ride by rider ID
const getSpecificRide = async (req, res) => {
  try {
    const riderId = req.params.riderId;
    const ridersCollection = getCollection('riders');
    const ridesCollection = getCollection('rides');

    // find the rider document first
    const rider = await ridersCollection.findOne({
      userId: riderId,
    });

    if (!rider) {
      return res.status(404).json({ message: 'Rider not found' });
    }

    // now find only accepted rides for that rider (for ongoing rides page)
    const rides = await ridesCollection.find({ 
      riderId: rider._id,
      status: 'accepted' // Only return accepted rides for ongoing section
    }).toArray();

    res.json({ rides, rider });
  } catch (err) {
    console.error('Ride fetch error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST: Insert many rides
const insertRides = async (req, res) => {
  try {
    const ridesCollection = getCollection('rides');
    const usersCollection = getCollection('users');
    const docs = req.body;

    // Enrich each ride doc with user's photoUrl from users collection
    const enrichedDocs = await Promise.all(
      (Array.isArray(docs) ? docs : [docs]).map(async (rideDoc) => {
        try {
          const userId = rideDoc?.userId;
          const user = userId
            ? await usersCollection.findOne({ _id: new ObjectId(userId) })
            : null;

          const userPhotoUrl = user?.photoUrl || null;
          return { ...rideDoc, userPhotoUrl };
        } catch (_) {
          // If lookup fails for any reason, proceed without photo
          return { ...rideDoc };
        }
      })
    );

    const result = await ridesCollection.insertMany(enrichedDocs);

    res.json({
      message: `Inserted ${result.insertedCount} documents into rides collection`,
      insertedIds: result.insertedIds,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// DELETE: Delete all rides
const deleteAllRides = async (req, res) => {
  try {
    const ridesCollection = getCollection('rides');

    const result = await ridesCollection.deleteMany({});
    res.json({
      message: `Deleted ${result.deletedCount} documents from rides collection`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST: Update rider status by rideId
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
      { _id: new ObjectId(riderId) },
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

// POST: Update rider status offline on logout
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

// POST: Update rider location by riderId
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
      { _id: new ObjectId(riderId) }, // riderId দিয়ে খুঁজছি
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

// POST: Rider accept ride
const acceptRide = async (req, res) => {
  try {
    const { rideId, riderId } = req.body;
    console.log('acceptRide called with:', { rideId, riderId, bodyKeys: Object.keys(req.body) });

    if (!rideId || !riderId) {
      console.log('Missing parameters:', { rideId, riderId });
      return res.status(400).json({ message: 'rideId and riderId required' });
    }

    const ridesCollection = getCollection('rides');
    const ridersCollection = getCollection('riders');
    const usersCollection = getCollection('users');

    // ✅ Check if rider exists and is online
    const rider = await ridersCollection.findOne({ _id: new ObjectId(riderId) });
    
    if (!rider) {
      return res.status(404).json({ message: 'Rider not found' });
    }

    if (rider.status !== 'online') {
      return res.status(400).json({ 
        message: 'You must be online to accept rides',
        requiresOnline: true
      });
    }

    // ✅ Check if rider already has an active ride (pending or accepted)
    const existingActiveRide = await ridesCollection.findOne({
      riderId: new ObjectId(riderId),
      status: { $in: ['pending', 'accepted'] }
    });

    // if (existingActiveRide && existingActiveRide._id.toString() !== rideId) {
    //   return res.status(400).json({ 
    //     message: 'You already have an active ride. Complete it before accepting another.',
    //     hasActiveRide: true
    //   });
    // }

    const filter = { _id: new ObjectId(rideId) };
    const ride = await ridesCollection.findOne(filter);
    
    if (!ride) {
      console.log('🚫 Ride not found with filter:', { filter });
      return res.status(404).json({ message: 'Ride not found' });
    }

    // Check if ride is still pending
    if (ride.status !== 'pending') {
      return res.status(400).json({ 
        message: `Ride is already ${ride.status}`,
        currentStatus: ride.status
      });
    }

    await ridesCollection.updateOne(filter, {
      $set: { status: 'accepted', acceptedAt: new Date() },
    });

    const user = await usersCollection.findOne({
      _id: new ObjectId(ride.userId),
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updatedRide = await ridesCollection.findOne(filter);

    if (!updatedRide) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    // ✅ Enrich ride with user information for rider accept-ride page
    const enrichedRide = {
      ...updatedRide,
      userInfo: {
        fullName: user.fullName || user.name || 'Unknown Passenger',
        email: user.email || '',
        phone: user.phone || '',
        rating: user.rating || 0,
        photoUrl: user.photoUrl || null
      }
    };

    // ✅ Emit Socket.IO event to notify user
    const io = getIO();
    console.log('Ride acceptance: Emitting to room:', `user_${ride.userId}`);
    console.log('Ride acceptance: User ID type:', typeof ride.userId, 'User ID value:', ride.userId);
    io.to(`user_${ride.userId}`).emit('ride_accepted', {
      rideId: rideId.toString(),
      riderInfo: updatedRide.riderInfo
    });

    // Send email to user
    await transporter.sendMail({
      from: `"RideX Support" <${process.env.EMAIL_USER}>`,
      to: user?.email,
      subject: 'Your Ride Accepted',
      html: `
            <h2>Ride Accepted</h2>
            <p>Rider ${ride?.riderInfo?.fullName} has accepted your ride request.</p>
            <ul>
              <li><strong>Vehicle:</strong> ${ride?.riderInfo?.vehicleModel}</li>
              <li><strong>Plate:</strong> ${ride?.riderInfo?.vehicleRegisterNumber}</li>
              <li><strong>ETA:</strong> 5 mins</li>
            </ul>
          `,
    });

    return res.json({ success: true, ride: enrichedRide });
  } catch (error) {
    console.error('🔥 Accept ride error caught:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST: Rider reject
const rejectRide = async (req, res) => {
  try {
    const { rideId, riderId } = req.body;

    if (!rideId || !riderId) {
      return res.status(400).json({ message: 'rideId and riderId required' });
    }

    const ridesCollection = getCollection('rides');
    const ridersCollection = getCollection('riders');

    // Get the current ride
    const currentRide = await ridesCollection.findOne({
      _id: new ObjectId(rideId),
    });
    
    if (!currentRide) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    // Mark the current ride as rejected by this rider
    await ridesCollection.updateOne(
      { _id: new ObjectId(rideId) },
      { 
        $set: { status: 'rejected', rejectedAt: new Date() },
        $push: { rejectedByRiders: new ObjectId(riderId) } // Track who rejected
      }
    );

    // Helper: find nearest available rider (excluding already tried)
    const findNearestRider = async (excludeIds = []) => {
      const nearest = await ridersCollection
        .aggregate([
          {
            $geoNear: {
              near: currentRide.pickup,
              distanceField: 'distance',
              spherical: true,
            },
          },
          {
            $match: {
              status: 'online',
              vehicleType: currentRide.vehicleType,
              _id: { $nin: excludeIds },
            },
          },
          { $sort: { distance: 1 } }, // ascending — closest first
          { $limit: 1 },
        ])
        .toArray();

      return nearest[0] || null;
    };

    const sendRideEmail = async (rider, subject, htmlBody) => {
      const dashboardUrl = `http://localhost:3000/dashboard/rider/available-rides`;
      await transporter.sendMail({
        from: `"RideX Support" <${process.env.EMAIL_USER}>`,
        to: rider.email,
        subject,
        html: htmlBody.replace('{dashboardUrl}', dashboardUrl),
      });
    };

    // Recursive function: assign next rider and auto-handle rejection
    const tryAssignNextRider = async (excludeIds = []) => {
      const rider = await findNearestRider(excludeIds);
      if (!rider) {
        console.log('No nearby riders available.');
        // Update to no_riders_available instead of creating new ride
        await ridesCollection.updateOne(
          { _id: new ObjectId(rideId) },
          { $set: { status: 'no_riders_available', updatedAt: new Date() } }
        );
        return;
      }

      // ✅ UPDATE the same ride document with new rider info
      await ridesCollection.updateOne(
        { _id: new ObjectId(rideId) },
        {
          $set: {
            riderId: rider._id,
            status: 'pending',
            assignedAt: new Date(),
            riderInfo: {
              fullName: rider.fullName,
              vehicleType: rider.vehicleType,
              vehicleModel: rider.vehicleModel,
              vehicleRegisterNumber: rider.vehicleRegisterNumber,
              email: rider.email,
              ratings: rider.ratings || 0,
              completedRides: rider.completedRides || 0,
            },
          },
        }
      );

      // ✅ Emit real-time notification to new rider
      const io = getIO();
      io.to(`rider_${rider._id.toString()}`).emit('new_ride_request', {
        rideId: rideId.toString(),
        ride: {
          _id: rideId.toString(),
          userId: currentRide.userId,
          fare: currentRide.fare,
          vehicleType: currentRide.vehicleType,
          status: 'pending',
          pickup: currentRide.pickup,
          drop: currentRide.drop,
          createdAt: currentRide.createdAt,
        },
      });

      // ✅ Send email to new rider
      await sendRideEmail(
        rider,
        'New Ride Request',
        `
        <h2>New Ride Request</h2>
        <p>Hello ${rider.fullName || 'Rider'},</p>
        <p>You have a new ride request from user <b>${currentRide.userId}</b>.</p>
        <a href="{dashboardUrl}" style="background:#4CAF50;color:white;padding:10px 15px;border-radius:5px;text-decoration:none;">View Ride</a>
        <p>If you don't accept this ride within 60 seconds, it will automatically go to another nearby driver.</p>
        `
      );

      // Wait 60 seconds → if still pending, auto-reject + find next rider
      setTimeout(async () => {
        const updatedRide = await ridesCollection.findOne({ _id: new ObjectId(rideId) });
        if (updatedRide && updatedRide.status === 'pending') {
          await ridesCollection.updateOne(
            { _id: new ObjectId(rideId) },
            { 
              $set: { status: 'auto-rejected', rejectedAt: new Date() },
              $push: { rejectedByRiders: rider._id }
            }
          );

          console.log('Auto-rejected ride:', rideId);

          // Notify rider about auto-rejection
          io.to(`rider_${rider._id.toString()}`).emit('ride_auto_rejected', {
            rideId: rideId.toString(),
          });

          await sendRideEmail(
            rider,
            'Ride Request Auto-Rejected',
            `
            <h2>Ride Request Auto-Rejected</h2>
            <p>Hello ${rider.fullName || 'Rider'},</p>
            <p>Your recent ride request was automatically rejected since it wasn't accepted within 60 seconds.</p>
            <p>— RideX Team</p>
            `
          );

          // Recursively find next nearest rider excluding this one
          await tryAssignNextRider([...excludeIds, rider._id]);
        }
      }, 60000);
    };

    // Start from excluding the just-rejected rider
    await tryAssignNextRider([new ObjectId(riderId)]);

    res.json({ success: true, message: 'Ride reassignment process started' });
  } catch (error) {
    console.error('Reject ride error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// USERS RIDE RELATED CONTROLLERS:
// POST: User ride requests
const rideRequest = async (req, res) => {
  try {
    const ridersCollection = getCollection('riders');
    const ridesCollection = getCollection('rides');

    const { userId, pickup, drop, vehicleType, fare } = req.body;

    if (!userId || !pickup || !drop || !vehicleType || !fare) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Helper: find nearest available rider (excluding already tried)
    const findNearestRider = async (excludeIds = []) => {
      const rider = await ridersCollection
        .aggregate([
          {
            $geoNear: {
              near: pickup,
              distanceField: 'distance',
              spherical: true,
            },
          },
          {
            $match: {
              status: 'online',
              vehicleType,
              _id: { $nin: excludeIds },
            },
          },
          { $sort: { distance: 1, _id: 1 } }, // nearest first
          { $limit: 1 },
        ])
        .toArray();

      return rider[0] || null;
    };

    const sendRideEmail = async (rider, subject, htmlBody) => {
      const dashboardUrl = `http://localhost:3000/dashboard/rider/available-rides`;
      await transporter.sendMail({
        from: `"RideX Support" <${process.env.EMAIL_USER}>`,
        to: rider.email,
        subject,
        html: htmlBody.replace('{dashboardUrl}', dashboardUrl),
      });
    };

    // ✅ Generate unique rideId immediately
    const rideId = new ObjectId();

    // Recursive logic to handle retries
    const tryAssignRider = async (excludeIds = []) => {
      const rider = await findNearestRider(excludeIds);
      if (!rider) {
        console.log('❌ No more riders available.');
        // Update ride status to no_riders_available
        await ridesCollection.updateOne(
          { _id: rideId },
          { $set: { status: 'no_riders_available', updatedAt: new Date() } }
        );
        return;
      }

      // Create a new ride document for this rider
      const ride = {
        _id: rideId,
        userId,
        riderId: rider._id,
        pickup,
        drop,
        fare,
        status: 'pending',
        createdAt: new Date(),
        acceptedAt: null,
        rejectedAt: null,
        cancelledAt: null,
        assignedAt: new Date(),
        startRideAt: null,
        endRideAt: null,
        completedAt: null,
        autoRejectTimer: Date.now() + 60000, // 60 seconds from now
        riderInfo: {
          fullName: rider.fullName,
          vehicleType: rider.vehicleType,
          vehicleModel: rider.vehicleModel,
          vehicleRegisterNumber: rider.vehicleRegisterNumber,
          email: rider.email,
          ratings: rider.ratings || 0,
          completedRides: rider.completedRides || 0,
        },
        chatMessages: [], // Initialize chat messages array
      };

      await ridesCollection.insertOne(ride);

      // ✅ Emit real-time notification to the rider via Socket.IO
      const io = getIO();
      io.to(`rider_${rider._id.toString()}`).emit('new_ride_request', {
        rideId: rideId.toString(),
        ride: {
          _id: rideId.toString(),
          userId,
          fare,
          vehicleType,
          status: 'pending',
          pickup,
          drop,
          createdAt: ride.createdAt,
        },
      });

      console.log(`✅ Real-time ride request sent to rider ${rider._id}`);

      // ✅ Send email as backup notification
      await sendRideEmail(
        rider,
        'New Ride Request',
        `
        <h2>New Ride Request</h2>
        <p>Hello ${rider.fullName || 'Rider'},</p>
        <p>You have a new ride request from user <b>${userId}</b>.</p>
        <a href="{dashboardUrl}" style="background:#4CAF50;color:white;padding:10px 15px;border-radius:5px;text-decoration:none;">View Ride</a>
        <p>If you don't accept this ride within 60 seconds, it will automatically go to another nearby driver.</p>
        `
      );

      // Wait 60s → auto reject if still pending
      setTimeout(async () => {
        const currentRide = await ridesCollection.findOne({ _id: rideId });
        if (currentRide && currentRide.status === 'pending') {
          await ridesCollection.updateOne(
            { _id: rideId },
            { $set: { status: 'auto-rejected', rejectedAt: new Date() } }
          );

          // Notify rider about auto-rejection
          io.to(`rider_${rider._id.toString()}`).emit('ride_auto_rejected', {
            rideId: rideId.toString(),
          });

          await sendRideEmail(
            rider,
            'Ride Request Auto-Rejected',
            `
            <h2>Ride Request Auto-Rejected</h2>
            <p>Hello ${rider.fullName || 'Rider'},</p>
            <p>Your recent ride request was automatically rejected since it wasn't accepted within 60 seconds.</p>
            <p>— RideX Team</p>
            `
          );

          // Try next nearest rider (add current rider to excluded list)
          await tryAssignRider([...excludeIds, rider._id]);
        }
      }, 60000); // 60 seconds
    };

    // Start first attempt
    tryAssignRider([]);

    // ✅ Respond immediately with rideId
    return res.status(201).json({
      success: true,
      message: 'Ride request started',
      rideId: rideId.toString(),
    });
  } catch (error) {
    console.error('🔥 Ride request error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST: User or Rider cancel ride request
const cancelRideRequest = async (req, res) => {
  try {
    const { rideId, userId, riderId } = req.body;

    if (!rideId || (!userId && !riderId)) {
      return res.status(400).json({ message: 'rideId and either userId or riderId are required' });
    }

    const ridesCollection = getCollection('rides');
    const ride = await ridesCollection.findOne({ _id: new ObjectId(rideId) });

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }


    // Verify the user/rider has permission to cancel this ride
    if (userId && ride.userId !== userId) {
      return res.status(403).json({ message: 'You can only cancel your own rides' });
    }
    
    if (riderId && ride.riderId.toString() !== riderId) {
      console.log('❌ Rider ID mismatch:', { 
        providedRiderId: riderId, 
        rideRiderId: ride.riderId,
        rideRiderIdString: ride.riderId.toString(),
        types: { provided: typeof riderId, ride: typeof ride.riderId }
      });
      return res.status(403).json({ message: 'You can only cancel rides you accepted' });
    }

    // Only allow cancellation if ride is pending, accepted, rejected, auto-rejected, or no_riders_available (before completion)
    if (!['pending', 'accepted', 'rejected', 'auto-rejected', 'no_riders_available'].includes(ride.status)) {
      return res.status(400).json({ 
        message: `Cannot cancel ride with status: ${ride.status}` 
      });
    }

    // Update ride status to cancelled
    await ridesCollection.updateOne(
      { _id: new ObjectId(rideId) },
      { 
        $set: { 
          status: 'cancelled', 
          cancelledAt: new Date(),
          cancelledBy: 'user'
        } 
      }
    );

    // Notify rider via Socket.IO if ride was accepted
    if (ride.status === 'accepted' && ride.riderId) {
      const io = getIO();
      io.to(`rider_${ride.riderId.toString()}`).emit('ride_cancelled_by_user', {
        rideId: rideId.toString(),
        message: 'User has cancelled the ride'
      });
    }

    return res.json({ 
      success: true, 
      message: 'Ride cancelled successfully' 
    });
  } catch (error) {
    console.error('Cancel ride error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST: Update ride status to completed after payment
const completeRide = async (req, res) => {
  try {
    const { rideId } = req.body;

    if (!rideId) {
      return res.status(400).json({ message: 'rideId is required' });
    }

    const ridesCollection = getCollection('rides');
    const ride = await ridesCollection.findOne({ _id: new ObjectId(rideId) });

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    // Update ride status to completed
    await ridesCollection.updateOne(
      { _id: new ObjectId(rideId) },
      { 
        $set: { 
          status: 'completed', 
          completedAt: new Date(),
          endRideAt: new Date()
        } 
      }
    );

    // Notify both user and rider via Socket.IO
    const io = getIO();
    io.to(`user_${ride.userId}`).emit('ride_completed', {
      rideId: rideId.toString(),
    });
    
    if (ride.riderId) {
      io.to(`rider_${ride.riderId.toString()}`).emit('ride_completed', {
        rideId: rideId.toString(),
      });
    }

    return res.json({ 
      success: true, 
      message: 'Ride marked as completed' 
    });
  } catch (error) {
    console.error('Complete ride error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAllRides,
  getAvailableRide,
  getCurrentRide,
  getSpecificRide,
  insertRides,
  deleteAllRides,
  requestStatus,
  setStatusOffline,
  updateLocation,
  acceptRide,
  rejectRide,
  rideRequest,
  getRideChatMessages,
  cancelRideRequest,
  completeRide,
};

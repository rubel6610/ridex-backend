const SSLCommerzPayment = require('sslcommerz-lts');
const { getCollection } = require('../utils/getCollection');
const { ObjectId } = require('mongodb');
const { getIO } = require('../socket/socket');
require('dotenv').config({ quiet: true });

const store_id = process.env.STORE_ID;
const store_passwd = process.env.STORE_PASSWORD;
const is_live = false;


const initPayment = async (req, res) => {
  try {
    const ridePay = getCollection('payments');

    // Map frontend data to backend structure
    const ridePayDoc = {
      userEmail: req.body.userEmail,
      riderEmail: req.body.riderEmail,

      rideId: req.body.rideId,
      userId: req.body.userId,
      riderId: req.body.riderId,

      promoCode: req.body.promo || null,
      currency: 'BDT',
      paymentMethod: 'SSLCommerz',
      transactionId: null,
      status: 'Pending',
      paid: false,

      rideDetails: {
        pickup: req.body.pickup || null,
        drop: req.body.drop || null,
        vehicleType: req.body.vehicleType || null,
        vehicleModel: req.body.vehicleModel || null,
        VehicleRegistration: req.body.vehicleRegisterNumber || null,
        distance: req.body.distance || null,
        arrivalTime: req.body.arrivalTime || null,
        rideType: req.body.mode || null,

        fareBreakdown: {
          baseFare: req.body.baseFare || 0,
          distanceFare: req.body.distanceFare || 0,
          timeFare: req.body.timeFare || 0,
          platformCommission: req.body.platformCommission || 0,
          riderCommission: req.body.riderCommission || 0,
          totalAmount: req.body.amount || 0,
        },
      },

      timestamps: {
        rideStartTime: req.body.rideStartTime || null,
        rideEndTime: req.body.rideEndTime || null,
        paymentInitiatedAt: new Date(),
        paymentCompletedAt: null,
      },
    };
    const insertResult = await ridePay.insertOne(ridePayDoc);
    // Removed debug console log: console.log(req);
    // sslcommerz init data
    const data = {
      total_amount: req.body.amount ||  0,
      currency: 'BDT',
      tran_id: insertResult.insertedId.toString(),
      success_url: `${process.env.SERVER_BASE_URL}/api/payment/success`,
      fail_url: `${process.env.SERVER_BASE_URL}/api/payment/fail`,
      cancel_url: `${process.env.SERVER_BASE_URL}/api/payment/cancel`,
      ipn_url: `${process.env.SERVER_BASE_URL}/api/payment/ipn`,

      // ✅ send custom data the correct way
      value_a: req.body.rideId,
      value_b: req.body.userId,
      value_c: req.body.riderId,

      cus_name: req.body.username || 'Customer',
      cus_email: req.body.userEmail || 'customer@example.com',
      cus_add1: req.body.userAddress1 || 'Dhaka',
      cus_add2: 'Dhaka',
      cus_city: 'Dhaka',
      cus_state: 'Dhaka',
      cus_postcode: '1000',
      cus_country: 'Bangladesh',
      cus_phone: '01711111111',
      cus_fax: '01711111111',
      product_name: 'Ride Fare',
      product_category: 'Transport',
      product_profile: 'general',
      ship_name: 'Customer Name',
      ship_add1: 'Dhaka',
      ship_add2: 'Dhaka',
      ship_city: 'Dhaka',
      ship_state: 'Dhaka',
      ship_postcode: 1000,
      ship_country: 'Bangladesh',
      shipping_method: 'Courier',
    };


    // sslcommerz initiating
    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
    const apiResponse = await sslcz.init(data);
    // Removed debug console log: console.log(apiResponse);

    // Redirect the user to payment gateway
    res.json({ url: apiResponse.GatewayPageURL });

  } catch (err) {
    // Keep error logging for critical issues
    console.error(err);
    res.status(500).json({ message: 'Payment init failed' });
  }
};

const successPayment = async (req, res) => {
  try {
    const { tran_id, value_a, value_b, value_c, amount } = req.body;
    const rideId = value_a;
    const userId = value_b;
    const riderId = value_c;

    const ridePay = getCollection('payments');
    const ridePayId = new ObjectId(tran_id);

    const result = await ridePay.updateOne(
      { _id: ridePayId },
      {
        $set: {
          status: 'Paid',
          transactionId: tran_id,
          paymentCompletedAt: new Date(),
        },
      }
    );

    // Fetch user information for admin notification
    let userName = 'Unknown User';
    if (userId) {
      try {
        const usersCollection = getCollection('users');
        const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
        userName = user?.fullName || user?.name || 'Unknown User';
      } catch (userErr) {
        // Keep error logging for critical issues
        console.error('Error fetching user info:', userErr);
      }
    }

    // Create payment transaction record
    try {
      const paymentTransactions = getCollection('paymentTransactions');
      await paymentTransactions.insertOne({
        transactionId: tran_id,
        userId: userId,
        riderId: riderId,
        amount: amount,
        paidAt: new Date()
      });
    } catch (transactionErr) {
      // Keep error logging for critical issues
      console.error('Error creating payment transaction record:', transactionErr);
    }

    // Notify admins about the successful payment
    try {
      const io = getIO();
      const notificationData = {
        userId,
        userName,
        amount,
        transactionId: tran_id,
        timestamp: new Date(),
        message: `New payment of ৳${amount} received from ${userName}`
      };
      
      io.to('admins').emit('new_payment_notification', notificationData);
      
      // Store payment success notification for user (to be delivered when they connect)
      if (userId) {
        const userNotificationData = {
          userId,
          amount,
          transactionId: tran_id,
          timestamp: new Date(),
          message: `Your payment of ৳${amount} has been successfully processed. Transaction ID: ${tran_id}`
        };
        
        // Store in a simple in-memory cache (in production, use Redis or database)
        if (global.pendingPaymentNotifications === undefined) {
          global.pendingPaymentNotifications = new Map();
        }
        
        global.pendingPaymentNotifications.set(userId, userNotificationData);
      } else {
        // Changed to warning level as per project guidelines
        console.warn('User ID not available, cannot store payment success notification for user');
      }
    } catch (socketErr) {
      // Changed to warning level for non-critical socket issues as per project guidelines
      console.warn('Warning: Error emitting payment notification:', socketErr);
    }

    if (result.modifiedCount > 0) {
      const redirectUrl = `${process.env.CLIENT_URL}/dashboard/user/payment/success-review?paymentId=${tran_id}&rideId=${rideId}&userId=${userId}&riderId=${riderId}&amount=${amount}`;
      return res.redirect(redirectUrl);
    } else {
      res.status(404).send('Payment not found or already updated');
    }
  } catch (err) {
    // Keep error logging for critical issues
    console.error(err);
    res.status(500).send('Payment success handler failed');
  }
};

const failPayment = async (req, res) => {
  try {
    const { tran_id } = req.body;
    const ridePay = getCollection('payments');

    if (!tran_id) {
      return res.status(400).send('Transaction ID missing');
    }

    const ridePayId = new ObjectId(tran_id);

    // update status
    await ridePay.updateOne(
      { _id: ridePayId },
      {
        $set: {
          status: 'Failed',
          transactionId: tran_id,
          paymentCompletedAt: new Date(),
        },
      }
    );

    // redirect user to frontend fail page
    res.redirect(`${process.env.CLIENT_URL}/payment/fail`);
  } catch (err) {
    // Keep error logging for critical issues
    console.error(err);
    res.status(500).send('Payment fail handler failed');
  }
};

const cancelPayment = async (req, res) => {
  try {
    const { tran_id } = req.body;
    const ridePay = getCollection('payments');

    if (!tran_id) {
      return res.status(400).send('Transaction ID missing');
    }

    const ridePayId = new ObjectId(tran_id);

    // update status
    await ridePay.updateOne(
      { _id: ridePayId },
      {
        $set: {
          status: 'Cancelled',
          transactionId: tran_id,
          paymentCompletedAt: new Date(),
        },
      }
    );

    // redirect user to frontend cancel page
    res.redirect(`${process.env.CLIENT_URL}/payment/cancel`);
  } catch (err) {
    // Keep error logging for critical issues
    console.error(err);
    res.status(500).send('Payment cancel handler failed');
  }
};

const getAllPayments = async (req, res) => {
  try {
    const paymentsCollection = getCollection('payments');

    const payments = await paymentsCollection.find().toArray();

    res.status(200).json(payments);
  } catch (error) {
    // Keep error logging for critical issues
    console.error('❌ Error fetching payments:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// NEW: Mark rider as paid
const markRiderAsPaid = async (req, res) => {
  try {
    const { paymentId } = req.body;
    
    if (!paymentId) {
      return res.status(400).json({ message: 'Payment ID is required' });
    }

    const paymentsCollection = getCollection('payments');
    const riderPaymentsCollection = getCollection('riderPayments');
    const platformPaymentsCollection = getCollection('platformPayments');
    const userPaymentsCollection = getCollection('userPayments');
    
    // First, get the payment details
    const payment = await paymentsCollection.findOne({ _id: new ObjectId(paymentId) });
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Extract payment details
    const transactionId = payment.transactionId || paymentId;
    const userId = payment.userId;
    const riderId = payment.riderId;
    const amount = payment.rideDetails?.fareBreakdown?.totalAmount || 0;
    const riderCommission = payment.rideDetails?.fareBreakdown?.riderCommission || 0;
    const platformCommission = payment.rideDetails?.fareBreakdown?.platformCommission || 0;

    // Create a rider payment record
    const riderPaymentRecord = {
      userId: userId,
      riderId: riderId,
      amount: amount,
      riderCommission: riderCommission,
      paidAt: new Date(),
      paymentId: paymentId
    };

    // Create a platform payment record
    const platformPaymentRecord = {
      userId: userId,
      riderId: riderId,
      amount: amount,
      platformCommission: platformCommission,
      paidAt: new Date(),
      paymentId: paymentId
    };

    // Create a user payment record
    const userPaymentRecord = {
      userId: userId,
      riderId: riderId,
      amount: amount,
      paidAt: new Date(),
      paymentId: paymentId
    };

    // Insert the records
    await riderPaymentsCollection.insertOne(riderPaymentRecord);
    await platformPaymentsCollection.insertOne(platformPaymentRecord);
    await userPaymentsCollection.insertOne(userPaymentRecord);

    // Update the payment status
    const result = await paymentsCollection.updateOne(
      { _id: new ObjectId(paymentId) },
      { 
        $set: { 
          paid: true,
          riderPaid: 'Paid',
          riderPaidAt: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Notify the rider about the payment
    try {
      const io = getIO();
      const notificationData = {
        paymentId,
        amount,
        riderCommission,
        paidAt: new Date(),
        message: `You have received ৳${riderCommission} for your ride service. Payment processed successfully.`
      };
      
      // Emit notification to the specific rider's room
      io.to(`rider_${riderId}`).emit('rider_payment_notification', notificationData);
    } catch (socketErr) {
      // Changed to warning level for non-critical socket issues as per project guidelines
      console.warn('Warning: Error emitting rider payment notification:', socketErr);
    }

    res.status(200).json({ message: 'Rider marked as paid successfully' });
  } catch (error) {
    // Keep error logging for critical issues
    console.error('❌ Error marking rider as paid:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET: Get rider performance statistics
const getRiderPerformanceStats = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const paymentsCollection = getCollection('payments');
    const ridesCollection = getCollection('rides');
    const rideReviewsCollection = getCollection('rideReviews');
    const ridersCollection = getCollection('riders');

    // First, find the rider document using the userId
    const rider = await ridersCollection.findOne({ userId });

    if (!rider) {
      return res.status(404).json({
        message: 'Rider profile not found. Please ensure you have completed your rider registration.'
      });
    }

    const riderId = rider._id;

    // Removed debug console log: console.log('🔍 Rider found:', { riderId, userId, riderName: rider.fullName });

    // Get all payments for this rider (handle both string and ObjectId formats)
    const payments = await paymentsCollection.find({
      $or: [
        { riderId: riderId.toString() },
        { riderId: riderId }
      ]
    }).toArray();

    // Get all rides for this rider
    const rides = await ridesCollection.find({ riderId: riderId }).toArray();

    // Get all reviews for this rider
    const reviews = await rideReviewsCollection.find({ riderId: riderId }).toArray();

    // Removed debug console log: console.log('Data counts:', {
    //   payments: payments.length,
    //   rides: rides.length,
    //   reviews: reviews.length
    // });

    // Calculate payment statistics
    const completedPayments = payments.filter(p => p.status === 'Paid');
    const pendingPayments = payments.filter(p => p.status === 'Pending');
    const failedPayments = payments.filter(p => p.status === 'Failed');
    const cancelledPayments = payments.filter(p => p.status === 'Cancelled');

    const totalEarnings = completedPayments.reduce((sum, payment) => {
      return sum + (payment.rideDetails?.fareBreakdown?.totalAmount || 0);
    }, 0);

    // Calculate ride statistics
    const acceptedRides = rides.filter(ride => ride.status === 'accepted');
    const completedRides = rides.filter(ride => ride.status === 'completed');
    const rejectedRides = rides.filter(ride => ride.status === 'rejected' || ride.status === 'auto-rejected');
    const cancelledRides = rides.filter(ride => ride.status === 'cancelled');
    const pendingRides = rides.filter(ride => ride.status === 'pending');

    // Calculate rates
    const totalRideRequests = rides.length;
    const acceptanceRate = totalRideRequests > 0 ? Math.round((acceptedRides.length / totalRideRequests) * 100) : 0;
    const completionRate = acceptedRides.length > 0 ? Math.round((completedRides.length / acceptedRides.length) * 100) : 0;
    const cancellationRate = totalRideRequests > 0 ? Math.round(((rejectedRides.length + cancelledRides.length) / totalRideRequests) * 100) : 0;

    // Calculate average rating
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length
      : 0;

    // Calculate weekly rating trend (last 7 weeks)
    const now = new Date();
    const weeklyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7 + 6));
      const weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() - (i * 7));

      const weekReviews = reviews.filter(review => {
        if (!review.createdAt) return false;
        const reviewDate = new Date(review.createdAt);
        return reviewDate >= weekStart && reviewDate <= weekEnd;
      });

      const weekRating = weekReviews.length > 0
        ? weekReviews.reduce((sum, review) => sum + (review.rating || 0), 0) / weekReviews.length
        : (averageRating || 0);

      weeklyTrend.push(Math.round(weekRating * 10) / 10);
    }

    const performanceStats = {
      rating: Math.round(averageRating * 10) / 10,
      cancelledRate: cancellationRate,
      acceptanceRate: acceptanceRate,
      completionRate: completionRate,
      totalEarnings: totalEarnings,
      completedRides: completedRides.length,
      pendingRides: pendingRides.length,
      totalRideRequests: totalRideRequests,
      totalReviews: reviews.length,
      trend: weeklyTrend,
      paymentBreakdown: {
        completed: completedPayments.length,
        pending: pendingPayments.length,
        failed: failedPayments.length,
        cancelled: cancelledPayments.length
      },
      rideBreakdown: {
        accepted: acceptedRides.length,
        completed: completedRides.length,
        rejected: rejectedRides.length,
        cancelled: cancelledRides.length,
        pending: pendingRides.length
      }
    };

    // Removed debug console log: console.log('✅ Performance stats calculated:', {
    //   rating: performanceStats.rating,
    //   totalEarnings: performanceStats.totalEarnings,
    //   totalRides: performanceStats.totalRideRequests,
    //   totalReviews: performanceStats.totalReviews
    // });

    res.status(200).json(performanceStats);
  } catch (error) {
    // Keep error logging for critical issues
    console.error('❌ Error fetching rider performance stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET: Get all platform payments
const getAllPlatformPayments = async (req, res) => {
  try {
    const platformPaymentsCollection = getCollection('platformPayments');

    const platformPayments = await platformPaymentsCollection.find().toArray();

    res.status(200).json(platformPayments);
  } catch (error) {
    // Keep error logging for critical issues
    console.error('❌ Error fetching platform payments:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET: Get all rider payments
const getAllRiderPayments = async (req, res) => {
  try {
    const riderPaymentsCollection = getCollection('riderPayments');

    const riderPayments = await riderPaymentsCollection.find().toArray();

    res.status(200).json(riderPayments);
  } catch (error) {
    // Keep error logging for critical issues
    console.error('❌ Error fetching rider payments:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET: Get all user payments
const getAllUserPayments = async (req, res) => {
  try {
    const userPaymentsCollection = getCollection('userPayments');

    const userPayments = await userPaymentsCollection.find().toArray();

    res.status(200).json(userPayments);
  } catch (error) {
    // Keep error logging for critical issues
    console.error('❌ Error fetching user payments:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  initPayment,
  successPayment,
  failPayment,
  cancelPayment,
  getAllPayments,
  getRiderPerformanceStats,
  markRiderAsPaid,
  getAllPlatformPayments,
  getAllRiderPayments,
  getAllUserPayments
};
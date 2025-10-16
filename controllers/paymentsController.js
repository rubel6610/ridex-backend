const SSLCommerzPayment = require('sslcommerz-lts');
const { getCollection } = require('../utils/getCollection');
const { ObjectId } = require('mongodb');
require('dotenv').config({ quiet: true });

const store_id = process.env.STORE_ID;
const store_passwd = process.env.STORE_PASSWORD;
const is_live = false;

const initPayment = async (req, res) => {
  try {
    const ridePay = getCollection('payments');

    // ✅ Full ride payment info
    const ridePayDoc = {
      rideId: req.body.rideId,
      userId: req.body.userId,
      riderId: req.body.riderId,

      userName: req.body.userName,
      userEmail: req.body.userEmail,
      riderName: req.body.riderName || null,
      riderEmail: req.body.riderEmail || null,

      promoCode: req.body.promo || null,
      currency: 'BDT',
      paymentMethod: 'SSLCommerz',
      transactionId: null,
      status: 'Pending',

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
          baseFare: req.body.baseFareNum || 0,
          distanceFare: req.body.distanceFareNum || 0,
          timeFare: req.body.timeFareNum || 0,
          tax: req.body.taxNum || 0,
          totalAmount: req.body.totalNum || 0,
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

    // sslcommerz init data
    const data = {
      total_amount: req.body.totalNum,
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
    console.log(apiResponse);

    // Redirect the user to payment gateway
    res.json({ url: apiResponse.GatewayPageURL });
   
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Payment init failed' });
  }
};

const successPayment = async (req, res) => {
  try {
    console.log('✅ SSLCommerz Success Data:', req.body);

    const { tran_id, value_a, value_b, value_c } = req.body;

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

    if (result.modifiedCount > 0) {
      const redirectUrl = `${process.env.CLIENT_URL}/dashboard/user/payment/success-review?paymentId=${tran_id}&rideId=${rideId}&userId=${userId}&riderId=${riderId}`;
      console.log('➡️ Redirecting to:', redirectUrl);
      return res.redirect(redirectUrl);
    } else {
      res.status(404).send('Payment not found or already updated');
    }
  } catch (err) {
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
    console.error('❌ Error fetching payments:', error);
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
    
    console.log('🔍 Rider found:', { riderId, userId, riderName: rider.fullName });

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
    
    console.log('📊 Data counts:', { 
      payments: payments.length, 
      rides: rides.length, 
      reviews: reviews.length 
    });

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

    console.log('✅ Performance stats calculated:', {
      rating: performanceStats.rating,
      totalEarnings: performanceStats.totalEarnings,
      totalRides: performanceStats.totalRideRequests,
      totalReviews: performanceStats.totalReviews
    });

    res.status(200).json(performanceStats);
  } catch (error) {
    console.error('❌ Error fetching rider performance stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  initPayment,
  successPayment,
  failPayment,
  cancelPayment,
  getAllPayments,
  getRiderPerformanceStats,
};

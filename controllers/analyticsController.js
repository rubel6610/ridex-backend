const { getCollection } = require('../utils/getCollection');
const { ObjectId } = require('mongodb');

const getUserAnalytics = async (req, res) => {
  try {
    const { userId } = req.params;

    const paymentsCollection = getCollection('payments');
    const reviewsCollection = getCollection('ride_reviews');
    const ridesCollection = getCollection('rides');

    const [payments, reviews, rides] = await Promise.all([
      paymentsCollection.find({ userId, status: 'Paid' }).toArray(),
      reviewsCollection.find({ userId }).toArray(),
      ridesCollection.find({ userId }).toArray(),
    ]);

    const totalRides = rides.length;
    const totalSpent = payments.reduce((sum, p) => sum + (p.amount || p.totalAmount || 0), 0);
    const avgRating = reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0;

    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weeklyRidesCount = rides.reduce((acc, ride) => {
      const date = new Date(ride.createdAt || ride.date || ride.timestamps?.createdAt);
      const day = weekDays[date.getDay()];
      if (day) acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});
    const weeklyRidesData = weekDays.map((day) => ({ day, rides: weeklyRidesCount[day] || 0 }));

    res.json({
      success: true,
      analytics: {
        totalRides,
        totalSpent,
        avgRating: parseFloat(avgRating.toFixed(1)),
        monthlySpending: payments.map(p => ({
          month: new Date(p.paymentCompletedAt || p.timestamps?.paymentCompletedAt).toLocaleString('en-US', { month: 'short' }),
          amount: p.amount || p.totalAmount || 0
        })),
        weeklyRides: weeklyRidesData,
        ratingsOverTime: reviews.map(r => ({
          week: new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          rating: r.rating
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getRiderAnalytics = async (req, res) => {
  try {
    const { riderId } = req.params;

    const ridersCollection = getCollection('riders');
    const ridesCollection = getCollection('rides');
    const paymentsCollection = getCollection('payments');

    const rider = await ridersCollection.findOne({ userId: riderId });
    if (!rider) {
      return res.status(404).json({ message: 'Rider not found' });
    }

    const rides = await ridesCollection.find({ riderId: rider._id }).toArray();
    const completedRides = rides.filter(r => r.status === 'completed').length;
    const activeRides = rides.filter(r => r.status === 'accepted').length;
    const canceledRides = rides.filter(r => r.status === 'cancelled' || r.status === 'rejected').length;

    const payments = await paymentsCollection.find({ 
      'rideDetails.riderId': rider._id.toString(), 
      status: 'Paid' 
    }).toArray();
    
    const totalEarnings = payments.reduce((sum, p) => {
      const amount = p.amount || p.totalAmount || 0;
      return sum + (amount * 0.8);
    }, 0);

    const monthlyEarnings = {};
    payments.forEach(p => {
      const month = new Date(p.paymentCompletedAt || p.timestamps?.paymentCompletedAt).toLocaleString('en-US', { month: 'short' });
      const earnings = (p.amount || p.totalAmount || 0) * 0.8;
      monthlyEarnings[month] = (monthlyEarnings[month] || 0) + earnings;
    });

    const monthlyEarningsData = Object.entries(monthlyEarnings).map(([month, earnings]) => ({
      month,
      earnings
    }));

    const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const weeklyRidesCount = rides.reduce((acc, ride) => {
      const date = new Date(ride.createdAt || ride.timestamps?.createdAt);
      const day = weekDays[date.getDay()];
      if (day) acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});
    const weeklyRidesData = weekDays.map((day) => ({ day, rides: weeklyRidesCount[day] || 0 }));

    res.json({
      success: true,
      analytics: {
        completedRides,
        activeRides,
        canceledRides,
        totalEarnings,
        monthlyEarnings: monthlyEarningsData,
        weeklyRides: weeklyRidesData
      }
    });
  } catch (error) {
    console.error('Error fetching rider analytics:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAdminAnalytics = async (req, res) => {
  try {
    const usersCollection = getCollection('users');
    const ridersCollection = getCollection('riders');
    const paymentsCollection = getCollection('payments');
    const ridesCollection = getCollection('rides');

    const [users, riders, payments, rides] = await Promise.all([
      usersCollection.find({ role: 'user' }).toArray(),
      ridersCollection.find().toArray(),
      paymentsCollection.find({ status: 'Paid' }).toArray(),
      ridesCollection.find().toArray(),
    ]);

    const totalPassengers = users.length;
    const totalRiders = riders.length;
    const totalUsers = totalPassengers + totalRiders;
    const totalEarnings = payments.reduce((sum, p) => 
      sum + (p.amount || p.totalAmount || 0), 0
    );

    const monthlyRevenue = {};
    payments.forEach(p => {
      const month = new Date(p.paymentCompletedAt || p.timestamps?.paymentCompletedAt).toLocaleString('en-US', { month: 'short' });
      const amount = p.amount || p.totalAmount || 0;
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + amount;
    });

    const monthlyRevenueData = Object.entries(monthlyRevenue).map(([month, revenue]) => ({
      month,
      revenue
    }));

    const rideStatuses = {
      completed: rides.filter(r => r.status === 'completed').length,
      active: rides.filter(r => r.status === 'accepted').length,
      pending: rides.filter(r => r.status === 'pending').length,
      cancelled: rides.filter(r => r.status === 'cancelled').length,
    };

    res.json({
      success: true,
      analytics: {
        totalPassengers,
        totalRiders,
        totalUsers,
        totalEarnings,
        monthlyRevenue: monthlyRevenueData,
        rideStatuses
      }
    });
  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getUserAnalytics,
  getRiderAnalytics,
  getAdminAnalytics,
};

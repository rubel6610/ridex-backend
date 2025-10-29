// index.js
require('dotenv').config({ quiet: true });
const express = require('express');
const { initSocket } = require('./socket/socket');
const cors = require('cors');
const { connectDB } = require('./config/db');
const bodyParser = require('body-parser');
const http = require('http');


const app = express();
const server = http.createServer(app);

// Middlewares
app.use(cors({
  origin: ['http://localhost:3000','http://192.168.0.107:3000', 'http://localhost:3001', process.env.CLIENT_URL],
  credentials: true,
}));

// Body parser with increased limit for image uploads (must be before routes)
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));
app.use(bodyParser.json({ limit: "100mb" }));
app.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

initSocket(server);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const riderRoutes = require('./routes/riderRoutes');
const userManageRoutes = require('./routes/userManageRoutes');
const riderManageRoutes = require('./routes/riderManageRoutes');
const rideRoutes = require('./routes/rideRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const supportRoutes = require('./routes/supportRoutes');
const rideReviewRoutes = require('./routes/rideReviewRoutes');
const geoCodeRoutes = require('./routes/geoCodeRoutes');
const promotionRoutes = require('./routes/promotionRoutes');
const blogRoutes = require('./routes/blogRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

// Default route
app.get('/', (req, res) => {
  res.send('🚀 Server is running...');
});

app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);
app.use('/api', rideRoutes);
app.use('/api', riderRoutes);
app.use('/api', userManageRoutes);
app.use('/api', riderManageRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/support', supportRoutes);
app.use('/api/ride-reviews', rideReviewRoutes);
app.use('/api', geoCodeRoutes);
app.use('/api', promotionRoutes);
app.use('/api', blogRoutes);
app.use('/api/analytics', analyticsRoutes);

// Start server
const PORT = process.env.PORT || 5002;

(async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    // riders collection 2dsphere index create
    // const ridersCollection = getCollection('riders');
    // await ridersCollection.createIndex({ location: '2dsphere' });

    // console.log('✅ 2dsphere index created on riders.location');
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (err) {
    console.error('❌ Failed to connect DB:', err);
    process.exit(1);
  }
})();
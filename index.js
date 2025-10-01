// index.js
require('dotenv').config({ quiet: true });
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const http = require('http');

const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const riderRoutes = require('./routes/riderRoutes');
const userManageRoutes = require('./routes/userManageRoutes');
const riderManageRoutes = require('./routes/riderManageRoutes');
const chatRoutes = require('./routes/chatRoutes');

const { initSocket } = require('./socket/socket');
const { getCollection } = require('./utils/getCollection');

const app = express();
const server = http.createServer(app);

// Middlewares
app.use(cors());
app.use(express.json());
initSocket(server);
// Default route
app.get('/', (req, res) => {
  res.send('🚀 Server is running...');
});

// ROUTES
app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);
app.use('/api', riderRoutes);
app.use('/api', userManageRoutes);
app.use('/api', riderManageRoutes);
app.use('/api', chatRoutes);

// Start server
const PORT = process.env.PORT || 5000;

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

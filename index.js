// index.js
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
require('dotenv').config({ quiet: true });

const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes'); 

const app = express();

// Middlewares
app.use(cors({
  origin: ['http://localhost:3000','http://localhost:3001','http://localhost:3001','https://ridex-fronted.netlify.app'],
  credentials: true, 
}));
app.use(express.json());

// Default route
app.get("/", (req, res) => {
  res.send('🚀 Server is running...');
});

// ROUTES
app.use('/api', userRoutes);   
app.use('/api/auth', authRoutes); 

// Start server
const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (err) {
    console.error('❌ Failed to connect DB:', err);
    process.exit(1);
  }
})();

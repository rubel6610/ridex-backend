const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
require('dotenv').config({ quiet: true });
const userRoutes = require('./routes/userRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Default route
app.get("/", (req, res) => {
  res.send('🚀 Server is running...');
});

// ROUTES:
// User routes:
app.use('/api', userRoutes);

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

const { getDb } = require('../config/db');
const bcrypt = require('bcrypt');

const registerUser = async (req, res) => {
  const db = getDb();
  const demoUsersCollection = db.collection('demoUsers');

  try {
    const { photoUrl, phoneNumber, role, email, password, ...rest } =
      req.body;

      // 1. Check if email already exists
      const existingUser = await demoUsersCollection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // 2. Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // 3. Create new user object
      const newUser = {
        ...rest,
        password: hashedPassword,
        role,
        isVerified: 'pending',
        photoUrl: photoUrl,
        failedAttempts: 0,
        accountLockedUntil: null,
        createdAt: new Date().toISOString(),
      };

      // 4. Insert into MongoDB
      const result = await demoUsersCollection.insertOne(newUser);

      return res.status(201).json({
        message: 'User registered successfully',
        userId: result.insertedId,
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };
  module.exports = { registerUser };
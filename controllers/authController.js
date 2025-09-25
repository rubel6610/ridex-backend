// controllers/authController.js
const { getDb } = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


// ==========================
// Register Controller (NID check without email)
// ==========================
const registerUser = async (req, res) => {
  const db = getDb();
  const nidCollection = db.collection("nidCollection");   // Dummy NID DB
  const usersCollection = db.collection("users");        // Real users DB

  try {
    const { fullName, NIDno, dateOfBirth, email, password, photoUrl } = req.body;

    // 1. NID validation from dummy DB (without email check)
    const nidData = await nidCollection.findOne({ fullName, NIDno, dateOfBirth });
    if (!nidData) {
      return res.status(404).json({ message: "NID not found or invalid" });
    }

    // 2. Check if user already exists
    const existingUser = await usersCollection.findOne({ NIDno });
    if (existingUser) {
      return res.status(400).json({ message: "User already registered. Please login." });
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create user
    const newUser = {
      ...nidData,
      email, // user-provided email will be saved now
      password: hashedPassword,
      role: "user",
      isVerified: "pending",
      photoUrl: photoUrl,
      failedAttempts: 0,
      isLocked: false,
      lastFailedAt: null,
      createdAt: new Date().toLocaleString(),
    };

    const result = await usersCollection.insertOne(newUser);

    res.status(201).json({
      message: "User registered successfully",
      userId: result.insertedId,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ==========================
// Login Controller with failed attempts
// ==========================
const loginUser = async (req, res) => {
  const db = getDb();
  const usersCollection = db.collection("users");

  try {
    const { email, password } = req.body;

    // 1. Find user
    const user = await usersCollection.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2. Check if account is locked
    if (user.isLocked) {
      // Optional: auto-unlock after 30 min
      const lockDuration = 30 * 60 * 1000; // 30 minutes
      if (user.lastFailedAt && (Date.now() - user.lastFailedAt.getTime()) > lockDuration) {
        await usersCollection.updateOne(
          { email },
          { $set: { isLocked: false, failedAttempts: 0 } }
        );
        user.isLocked = false;
        user.failedAttempts = 0;
      } else {
        return res.status(403).json({
          message: "Account locked due to multiple failed login attempts. Try later."
        });
      }
    }

    // 3. Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const failedAttempts = (user.failedAttempts || 0) + 1;
      const isLocked = failedAttempts >= 5; // lock after 5 fails

      await usersCollection.updateOne(
        { email },
        { 
          $set: { isLocked, lastFailedAt: new Date() },
          $inc: { failedAttempts: 1 }
        }
      );

      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 4. Reset failed attempts on success
    if (user.failedAttempts > 0 || user.isLocked) {
      await usersCollection.updateOne(
        { email },
        { $set: { failedAttempts: 0, isLocked: false } }
      );
    }

    // 5. Issue JWT
    const token = jwt.sign(
      { id: user._id, nid: user.nid, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { registerUser, loginUser };

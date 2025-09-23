// controllers/authController.js
const { getDb } = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// ==========================
// Register Controller (NID check)
// ==========================
const registerUser = async (req, res) => {
  const db = getDb();
  const nidCollection = db.collection("nidCollection");   // Dummy NID DB
  const usersCollection = db.collection("users");        // Real users DB

  try {
    const { NIDno, dateOfBirth, email, password, photoUrl } = req.body;

    // 1. NID validation from dummy DB
    const nidData = await nidCollection.findOne({ NIDno,email,dateOfBirth});
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
      password: hashedPassword,
      role: "user",
      isVerified: "pending", 
      photoUrl: photoUrl,
      createdAt: new Date(),
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
// Login Controller
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

    // 2. Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 3. Issue JWT
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

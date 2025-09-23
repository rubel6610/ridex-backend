// controllers/authController.js
const { getDb } = require("../config/db");
const bcrypt = require("bcrypt");


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



module.exports = { registerUser};

// controllers/authController.js
const { getCollection } = require("../utils/getCollection");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const transporter = require("../config/email");

// ============================
// POST: Register Controller
// ============================
const registerUser = async (req, res) => {
  const nidCollection = getCollection("nidCollection");
  const usersCollection = getCollection("users");
  try {
    const { fullName, NIDno, dateOfBirth, email, password, photoUrl } =
      req.body;

    // 1. NID validation
    const nidData = await nidCollection.findOne({
      fullName,
      NIDno,
      dateOfBirth,
    });

    if (!nidData) {
      return res
        .status(404)
        .json({ message: "NID not found or invalid. Check your data." });
    }

    // 2. Check if user already exists
    const existingUser = await usersCollection.findOne({ NIDno });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "You are already registered." });
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create user
    const newUser = {
      ...nidData,
      email,
      password: hashedPassword,
      role: 'user',
      isVerified: 'verified',
      photoUrl,
      failedAttempts: 0,
      isLocked: false,
      lastFailedAt: null,
      createdAt: new Date().toLocaleString(),
      reviews: 0,
      ratings: 0,
      completedRides: 0,
    };

    const result = await usersCollection.insertOne(newUser);

    res.status(201).json({
      message: "User registered successfully ",
      userId: result.insertedId,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================
// POST: Login Controller
// ============================
const loginUser = async (req, res) => {
  const usersCollection = getCollection("users");

  try {
    const { email, password } = req.body;

    // 1. Find user
    const user = await usersCollection.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2. Check if account is locked
    if (user.isLocked) {
      const lockDuration = 30 * 60 * 1000; // 30 minutes
      if (
        user.lastFailedAt &&
        Date.now() - user.lastFailedAt.getTime() > lockDuration
      ) {
        await usersCollection.updateOne(
          { email },
          { $set: { isLocked: false, failedAttempts: 0 } }
        );
        user.isLocked = false;
        user.failedAttempts = 0;
      } else {
        return res.status(403).json({
          message:
            "Account locked due to multiple failed login attempts. Try later.",
        });
      }
    }

    // 3. Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const failedAttempts = (user.failedAttempts || 0) + 1;
      const isLocked = failedAttempts >= 5;

      await usersCollection.updateOne(
        { email },
        {
          $set: { isLocked, lastFailedAt: new Date() },
          $inc: { failedAttempts: 1 },
        }
      );

      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 4. Reset failed attempts on success & update lastLogin
    const currentLoginTime = new Date().toLocaleString();
    await usersCollection.updateOne(
      { email },
      {
        $set: {
          failedAttempts: 0,
          isLocked: false,
          lastLogin: currentLoginTime,
        },
      },
      { upsert: true }
    );

    // 5. Issue JWT
    const token = jwt.sign(
      { id: user._id, nid: user.nid, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        ...user,
        lastLogin: currentLoginTime, // return updated login time
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================
// POST: Forgot Password
// ============================
const forgotPassword = async (req, res) => {
  const usersCollection = getCollection("users");

  try {
    const { email } = req.body;
    const user = await usersCollection.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpire = new Date(Date.now() + 10 * 60 * 1000);

    await usersCollection.updateOne(
      { email },
      { $set: { resetToken, resetExpire } }
    );

    const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    await transporter.sendMail({
      from: `"RideX Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset Request",
      html: `
        <h2>Password Reset</h2>
        <p>Hello ${user.fullName || "User"},</p>
        <p>You requested to reset your password. Click the link below to reset it:</p>
        <a href="${resetLink}" target="_blank">${resetLink}</a>
        <p>This link will expire in 10 minutes.</p>
        <p>If you did not request this, ignore this email.</p>
      `,
    });

    return res
      .status(200)
      .json({ message: "Password reset link sent to your email" });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ============================
// POST: Reset Password
// ============================
const resetPassword = async (req, res) => {
  const usersCollection = getCollection("users");

  try {
    const { resetToken, newPassword } = req.body;

    const user = await usersCollection.findOne({ resetToken });
    if (!user) {
      return res.status(400).json({ message: "Invalid token" });
    }

    const now = new Date();
    if (!user.resetExpire || user.resetExpire <= now) {
      return res.status(400).json({ message: "Token has expired" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await usersCollection.updateOne(
      { email: user.email },
      {
        $set: { password: hashedPassword },
        $unset: { resetToken: "", resetExpire: "" },
      }
    );

    return res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ============================
// POST: Logout Controller
// ============================
const logoutUser = async (req, res) => {
  try {
    const { userId, role } = req.body;

    // Validate request
    if (!userId || !role) {
      return res.status(400).json({ 
        message: "Missing required fields: userId and role" 
      });
    }

    // If the user is a rider, set their status to offline
    if (role === "rider") {
      const ridersCollection = getCollection("riders");
      const { ObjectId } = require("mongodb");

      try {
        // Convert userId to ObjectId
        const objectId = new ObjectId(userId);
        
        const result = await ridersCollection.updateOne(
          { userId: objectId },
          { $set: { status: "offline" } }
        );

        console.log(`Rider status update result:`, result.modifiedCount);
      } catch (err) {
        console.error("Error updating rider status:", err);
        // Continue with logout even if rider status update fails
      }
    }

    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error.message 
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  logoutUser,
};

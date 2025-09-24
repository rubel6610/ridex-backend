const bcrypt = require("bcrypt");
const crypto = require("crypto");
const transporter = require("../config/email");
const { getCollection } = require("../utils/getCollection");

// =========================
// Forgot Password Controller
// =========================
const forgotPassword = async (req, res) => {
  const usersCollection = getCollection("users");

  try {
    const { email } = req.body;
    const user = await usersCollection.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpire = new Date(Date.now() + 10 * 60 * 1000); 

    // Save token and expiration as Date in DB
    await usersCollection.updateOne(
      { email },
      { $set: { resetToken, resetExpire } }
    );

    // Construct reset link
    const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    // Send reset email
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


// Reset Password Controller

const resetPassword = async (req, res) => {
  const usersCollection = getCollection("users");

  try {
    const { resetToken, newPassword } = req.body;

    const user = await usersCollection.findOne({ resetToken: resetToken });
    if (!user) {
      return res.status(400).json({ message: "Invalid token" });
    }

    console.log(user.resetExpire, user.email);
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

module.exports = { forgotPassword, resetPassword };

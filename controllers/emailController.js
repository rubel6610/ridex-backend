// controllers/emailController.js
const { getCollection } = require("../utils/getCollection");
const transporter = require("../config/email");

// ============================
// POST: Contact Form Submission
// ============================
const contactFormSubmit = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ 
        message: "Name, email, subject, and message are required" 
      });
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: "Please provide a valid email address" 
      });
    }

    // Send email to admin/support
    await transporter.sendMail({
      from: `"RideX Contact Form" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to admin email
      subject: `Contact Form: ${subject}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
        <p><strong>Subject:</strong> ${subject}</p>
        <div>
          <strong>Message:</strong>
          <p>${message}</p>
        </div>
        <hr>
        <p><em>Sent from RideX Contact Form</em></p>
      `,
    });

    // Optional: Send confirmation to user
    try {
      await transporter.sendMail({
        from: `"RideX Support" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "We Received Your Message",
        html: `
          <h2>Thank you for contacting RideX!</h2>
          <p>Hi ${name},</p>
          <p>We've received your message and will get back to you as soon as possible.</p>
          <p><strong>Your message details:</strong></p>
          <p><strong>Subject:</strong> ${subject}</p>
          <div>
            <strong>Message:</strong>
            <p>${message}</p>
          </div>
          <p>Thank you for choosing RideX!</p>
          <p>Best regards,<br>The RideX Team</p>
        `,
      });
    } catch (confirmationError) {
      console.error("Failed to send confirmation email:", confirmationError);
      // Don't fail the main request if confirmation fails
    }

    return res.status(200).json({ 
      message: "Message sent successfully! We'll get back to you soon." 
    });
  } catch (error) {
    console.error("Contact form error:", error);
    return res.status(500).json({ 
      message: "Failed to send message. Please try again later." 
    });
  }
};

// ============================
// POST: Subscribe to Newsletter
// ============================
const subscribeToNewsletter = async (req, res) => {
  try {
    const { email } = req.body;
    const subscribersCollection = getCollection("subscribers");

    // Validate email
    if (!email) {
      return res.status(400).json({ 
        message: "Email is required" 
      });
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: "Please provide a valid email address" 
      });
    }

    // Check if already subscribed
    const existingSubscriber = await subscribersCollection.findOne({ email });
    if (existingSubscriber) {
      return res.status(200).json({ 
        message: "You are already subscribed to our newsletter!" 
      });
    }

    // Add to subscribers collection
    await subscribersCollection.insertOne({
      email,
      subscribedAt: new Date(),
      isActive: true
    });

    // Send welcome email
    await transporter.sendMail({
      from: `"RideX Newsletter" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Welcome to RideX Newsletter!",
      html: `
        <h2>Welcome to RideX Newsletter!</h2>
        <p>Thank you for subscribing to our newsletter!</p>
        <p>You'll now receive updates about our latest news, blog posts, and special offers.</p>
        <p>If you have any questions, feel free to contact us at any time.</p>
        <p>Best regards,<br>The RideX Team</p>
      `,
    });

    return res.status(200).json({ 
      message: "Thank you for subscribing! You'll receive our latest updates." 
    });
  } catch (error) {
    console.error("Subscription error:", error);
    return res.status(500).json({ 
      message: "Failed to subscribe. Please try again later." 
    });
  }
};

// ============================
// GET: Get All Subscribers (for admin)
// ============================
const getAllSubscribers = async (req, res) => {
  try {
    const subscribersCollection = getCollection("subscribers");
    const subscribers = await subscribersCollection.find({}).toArray();
    return res.status(200).json(subscribers);
  } catch (error) {
    console.error("Get subscribers error:", error);
    return res.status(500).json({ 
      message: "Failed to retrieve subscribers" 
    });
  }
};

module.exports = {
  contactFormSubmit,
  subscribeToNewsletter,
  getAllSubscribers
};

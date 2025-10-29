const { getCollection } = require("../utils/getCollection");
const { ObjectId } = require("mongodb");

// PATCH: Approve or Reject Rider
const approveAndRejectRider = async (req, res) => {
  try {
    const ridersCollection = getCollection("riders");
    const usersCollection = getCollection("users");
    const { id } = req.params;
    const { status } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Rider ID is required" });
    }

    if (!status || !["approved", "rejected"].includes(status)) {
      return res
        .status(400)
        .json({ message: 'Status must be either "approved" or "rejected"' });
    }

    // Convert string ID to ObjectId
    const riderId = new ObjectId(id);

    const rider = await ridersCollection.findOne({ _id: riderId });
    if (!rider) {
      return res.status(404).json({ message: "Rider not found" });
    }

    if (rider.status === status) {
      return res.status(400).json({ message: `Rider is already ${status}.` });
    }

    // Update rider status
    await ridersCollection.updateOne(
      { _id: riderId },
      { $set: { status: status, updatedAt: new Date() } }
    );

    // If approved, update user role to rider
    if (status === "approved" && rider.userId) {
      const userId = typeof rider.userId === 'string' ? new ObjectId(rider.userId) : rider.userId;
      await usersCollection.updateOne(
        { _id: userId },
        { $set: { role: 'rider', approvedAt: new Date() } }
      );
    }

    res.status(200).json({ 
      success: true,
      message: `Rider ${status} successfully`,
      rider: { ...rider, status }
    });
  } catch (error) {
    console.error("Error in approveAndRejectRider:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { approveAndRejectRider };

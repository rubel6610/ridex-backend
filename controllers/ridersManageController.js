
const { ObjectId } = require("mongodb");
const { getCollection } = require("../utils/getCollection");

// PATCH: Approve or Reject Rider
const approveAndRejectRider = async (req, res) => {
  try {
    const ridersCollection = getCollection("riders");
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

    const rider = await ridersCollection.findOne({ _id: new ObjectId(id) });
    if (!rider) {
      return res.status(404).json({ message: "Rider not found" });
    }

    if (rider.status === status) {
      return res.status(400).json({ message: `Rider is already ${status}.` });
    }

    await ridersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: status } }
    );

    res.status(200).json({ message: `Rider ${status} successfully.`, status: status });
  } catch (error) {
    console.error("Error in approveAndRejectRider:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { approveAndRejectRider };

const { getCollection } = require("../utils/getCollection");

// PATCH: Approve or Reject user
const approveAndrejectUser = async (req, res) => {
  try {
    const usersCollection = getCollection("users");
    const { id } = req.params;
    const { status } = req.body; 

    if (!id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    if (!status || !["approved", "rejected"].includes(status)) {
      return res
        .status(400)
        .json({ message: 'Status must be either "approved" or "rejected"' });
    }

    const user = await usersCollection.findOne({ _id: id });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified === status) {
      return res.status(400).json({ message: `User is already ${status}.` });
    }

    await usersCollection.updateOne(
      { _id: id },
      { $set: { isVerified: status } }
    );

    res.status(200).json({ message: `User ${status} successfully.`, status: status });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { approveAndrejectUser };

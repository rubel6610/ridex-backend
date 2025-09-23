const { getCollection } = require("../utils/getCollection");

// get all data of the users
const getAllUsers = async (req, res) => {
  try {
    const usersCollection = getCollection("users");
    const users = await usersCollection.find().toArray();
    res.status(200).json(users);
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
};
//get single user data
const getSingleUser = async (req, res) => {
  try {
    const {email, NIDno} = req.query;
     if (!email && !NIDno) {
      return res.status(400).json({ message: "Email or NID required" });
    }
    const usersCollection = getCollection("users");
    const query = {
      $or:[]
    };
    if(email){
      query.$or.push({email});
    }
    if(NIDno){
      query.$or.push({NIDno})
    }
    const singleUser = await usersCollection.findOne( query );

    if (!singleUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(singleUser);
  } catch (error) {
    console.error("❌ Error fetching user:", error);
    res.status(500).json({ message: "Server error" });
  }
};
// update user
const updateUser = async (req, res) => {
  try {
    const { email } = req.params;   
    const updatedData = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const usersCollection = getCollection("users");

    const result = await usersCollection.updateOne(
      { email },             
      { $set: updatedData }   
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    console.error("❌ Error updating user:", error);
    res.status(500).json({ message: "Server error" });
  }
};



module.exports = { getAllUsers, getSingleUser,updateUser,deleteUser };

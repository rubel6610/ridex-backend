const { getCollection } = require('../utils/getCollection');
const { ObjectId } = require('mongodb');

// GET: Get all users
const getAllUsers = async (req, res) => {
  try {
    const usersCollection = getCollection('users');

    const users = await usersCollection.find().toArray();

    res.status(200).json(users);
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET: Get single user by ID
const getSingleUser = async (req, res) => {
  try {
      const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Id is required' });
    }

    const usersCollection = getCollection('users');

    const query = {
      _id: new ObjectId(id),
    };
    const singleUser = await usersCollection.findOne(query);

    if (!singleUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(singleUser);
  } catch (error) {
    console.error('❌ Error fetching user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH: Update user by ID
const updateUser = async (req, res) => {
  try {
   const { id } = req.params;
    const updatedData = req.body;

    if (!id) {
      return res.status(400).json({ message: 'Id is required' });
    }

    const usersCollection = getCollection('users');

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE: Delete user by ID
const deleteUser = async (req, res) => {
  try {
   const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Id is required' });
    }

    const usersCollection = getCollection('users');

    const result = await usersCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllUsers,
  getSingleUser,
  updateUser,
  deleteUser,
};

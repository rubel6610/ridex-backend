const { getCollection } = require('../utils/getCollection');
const { ObjectId } = require('mongodb');

// USERS INITIAL CONTROLLERS:
// GET: Get all NID collections
const getAllNIds = async (req, res) => {
  try {
    const nidCollection = getCollection('nidCollection');

    const users = await nidCollection.find().toArray();

    res.status(200).json(users);
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

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

// GET: Get single user by ID or Email
const getSingleUser = async (req, res) => {
  try {
    const { userId, email } = req.query;

    if (!userId && !email) {
      return res.status(400).json({ message: 'User ID or email required' });
    }

    const usersCollection = getCollection('users');
    let query = {};

    if (userId) {
      query = { _id: new ObjectId(userId) };
    } else if (email) {
      query = { email };
    }

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

// GET: Get single user by userId
const getSingleRiderByUserId = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: 'userId required' });
    }

    const ridersCollection = getCollection('riders');
    const query = { userId }; // userId দিয়ে খুঁজছি
    const singleRider = await ridersCollection.findOne(query);

    if (!singleRider) {
      return res.status(404).json({ message: 'Rider not found' });
    }

    res.status(200).json(singleRider);
  } catch (error) {
    console.error('❌ Error fetching rider:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST: Insert many users
const insertUsers = async (req, res) => {
  try {
    const usersCollection = getCollection('users');

    const docs = req.body;

    const result = await usersCollection.insertMany(docs);
    res.json({
      message: `Inserted ${result.insertedCount} documents into users collection`,
      insertedIds: result.insertedIds,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PATCH: Update user by ID
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;
    if (!id) {
      return res.status(400).json({ message: 'id is required' });
    }

    const usersCollection = getCollection('users');

    const result = await usersCollection.updateOne(
      {$or:[{_id: new ObjectId(id)},{_id:id}]  },
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

// GET: Get message from users
const getMessagedUsers = async (req, res) => {
  try {
    const messageCollection = getCollection('messages');
    const userCollection = getCollection('users');

    // Get unique senderIds who sent a message
    const senderIds = await messageCollection.distinct('senderId');

    // Get user details for those senderIds
    const users = await userCollection
      .find({ _id: { $in: senderIds }, role: 'user' })
      .toArray();

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load users' });
  }
};

// DELETE: Delete user by ID
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
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

// DELETE: Delete all users
const deleteAllUsers = async (req, res) => {
  try {
    const usersCollection = getCollection('users');

    const result = await usersCollection.deleteMany({});
    res.json({
      message: `Deleted ${result.deletedCount} documents from users collection`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getAllNIds,
  getAllUsers,
  getSingleUser,
  getSingleRiderByUserId,
  insertUsers,
  updateUser,
  getMessagedUsers,
  deleteUser,
  deleteAllUsers,
};

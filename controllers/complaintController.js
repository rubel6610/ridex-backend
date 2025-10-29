const { ObjectId } = require('mongodb');
const { getCollection } = require('../utils/getCollection');

// POST: Create a new complaint
const createComplaint = async (req, res) => {
  try {
    const complaintsCollection = getCollection('complaints');
    const { userId, name, email, subject, message, rideId, status } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const newComplaint = {
      userId: userId || null,
      name,
      email,
      subject,
      message,
      rideId: rideId || null,
      status: status || 'Pending', // default status
      createdAt: new Date(),
    };

    const result = await complaintsCollection.insertOne(newComplaint);

    res.status(201).json({
      message: 'Complaint submitted successfully',
      complaint: newComplaint,
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error('❌ Error creating complaint:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET: Get all complaints
const getComplaints = async (req, res) => {
  try {
    const complaintsCollection = getCollection('complaints');
    const complaints = await complaintsCollection.find().toArray();
    res.status(200).json(complaints);
  } catch (error) {
    console.error('❌ Error fetching complaints:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET: Get single complaint by ID
const getSingleComplaint = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) return res.status(400).json({ message: 'Complaint ID is required' });

    const complaintsCollection = getCollection('complaints');

    let query;
    if (ObjectId.isValid(id)) query = { _id: new ObjectId(id) };
    else query = { _id: id };

    const complaint = await complaintsCollection.findOne(query);

    if (!complaint)
      return res.status(404).json({ message: 'Complaint not found' });

    res.status(200).json(complaint);
  } catch (error) {
    console.error('❌ Error fetching single complaint:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PUT: Update complaint status or message
const updateComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!id) return res.status(400).json({ message: 'Complaint ID is required' });

    const complaintsCollection = getCollection('complaints');

    const existing = await complaintsCollection.findOne({
      $or: [{ _id: new ObjectId(id) }, { _id: id }],
    });

    if (!existing) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    await complaintsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updateData } }
    );

    res.status(200).json({ message: 'Complaint updated successfully' });
  } catch (error) {
    console.error('❌ Error updating complaint:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PUT: Resolve complaint
const resolveComplaint = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) return res.status(400).json({ message: 'Complaint ID is required' });

    const complaintsCollection = getCollection('complaints');

    const existing = await complaintsCollection.findOne({
      $or: [{ _id: new ObjectId(id) }, { _id: id }],
    });

    if (!existing) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    await complaintsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: 'Resolved', resolvedAt: new Date() } }
    );

    res.status(200).json({ message: 'Complaint resolved successfully' });
  } catch (error) {
    console.error('❌ Error resolving complaint:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// DELETE: Delete complaint by ID
const deleteComplaint = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) return res.status(400).json({ message: 'Complaint ID is required' });

    const complaintsCollection = getCollection('complaints');

    const result = await complaintsCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0)
      return res.status(404).json({ message: 'Complaint not found' });

    res.status(200).json({ message: 'Complaint deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting complaint:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

//  DELETE: Delete all complaints (for testing)
const deleteAllComplaints = async (req, res) => {
  try {
    const complaintsCollection = getCollection('complaints');
    const result = await complaintsCollection.deleteMany({});
    res.json({
      message: `Deleted ${result.deletedCount} complaints`,
    });
  } catch (error) {
    console.error('❌ Error deleting all complaints:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createComplaint,
  getComplaints,
  getSingleComplaint,
  updateComplaint,
  deleteComplaint,
  deleteAllComplaints,
  resolveComplaint,
};
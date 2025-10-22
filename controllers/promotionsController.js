const { ObjectId } = require('mongodb');
const { getCollection } = require('../utils/getCollection');


// 🟢 POST: Create a new promotion
const createPromotion = async (req, res) => {
  try {
    const promotionsCollection = getCollection('promotions');
    const { title, discount, code, status, startDate, endDate } = req.body;

    if (!title || !discount || !code || !startDate || !endDate) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingCode = await promotionsCollection.findOne({ code });
    if (existingCode) {
      return res.status(400).json({ message: 'Promo code already exists' });
    }

    const newPromotion = {
      title,
      discount: parseInt(discount),
      code,
      status: status || 'Active',
      startDate,
      endDate,
      usage: 0,
      createdAt: new Date(),
    };

    const result = await promotionsCollection.insertOne(newPromotion);
    res.status(201).json({
      message: 'Promotion created successfully',
      promotion: newPromotion,
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error('❌ Error creating promotion:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 🟡 GET: Get all promotions
const getPromotions = async (req, res) => {
  try {
    const promotionsCollection = getCollection('promotions');
    const promotions = await promotionsCollection.find().toArray();
    res.status(200).json(promotions);
  } catch (error) {
    console.error('❌ Error fetching promotions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✅ GET: Get active promotions (for users)
const getActivePromotions = async (req, res) => {
  try {
    const promotionsCollection = getCollection('promotions');
    const now = new Date();
    
    const activePromotions = await promotionsCollection.find({
      status: 'Active',
      startDate: { $lte: now },
      endDate: { $gte: now }
    }).toArray();
    
    res.status(200).json(activePromotions);
  } catch (error) {
    console.error('❌ Error fetching active promotions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✅ POST: Validate and apply promo code
const validatePromoCode = async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ message: 'Promo code is required' });
    }

    const promotionsCollection = getCollection('promotions');
    const now = new Date();
    
    const promo = await promotionsCollection.findOne({
      code: code,
      status: 'Active',
      startDate: { $lte: now },
      endDate: { $gte: now }
    });
    
    if (!promo) {
      return res.status(404).json({ 
        valid: false,
        message: 'Invalid or expired promo code' 
      });
    }

    // Increment usage count
    await promotionsCollection.updateOne(
      { _id: promo._id },
      { $inc: { usage: 1 } }
    );
    
    res.status(200).json({ 
      valid: true,
      discount: promo.discount,
      code: promo.code,
      title: promo.title
    });
  } catch (error) {
    console.error('❌ Error validating promo code:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 🟠 GET: Get single promotion by ID
const getSinglePromotion = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) return res.status(400).json({ message: 'Promotion ID is required' });

    const promotionsCollection = getCollection('promotions');

    let query;
    if (ObjectId.isValid(id)) query = { _id: new ObjectId(id) };
    else query = { _id: id };

    const promotion = await promotionsCollection.findOne(query);

    if (!promotion)
      return res.status(404).json({ message: 'Promotion not found' });

    res.status(200).json(promotion);
  } catch (error) {
    console.error('❌ Error fetching single promotion:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 🔵 PUT: Update promotion by ID
const updatePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!id) return res.status(400).json({ message: 'Promotion ID is required' });

    const promotionsCollection = getCollection('promotions');

    const existing = await promotionsCollection.findOne({
      $or: [{ _id: new ObjectId(id) }, { _id: id }],
    });

    if (!existing) {
      return res.status(404).json({ message: 'Promotion not found' });
    }

    await promotionsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updateData, discount: parseInt(updateData.discount) } }
    );

    res.status(200).json({ message: 'Promotion updated successfully' });
  } catch (error) {
    console.error('❌ Error updating promotion:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 🔴 DELETE: Delete promotion by ID
const deletePromotion = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) return res.status(400).json({ message: 'Promotion ID is required' });

    const promotionsCollection = getCollection('promotions');

    const result = await promotionsCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0)
      return res.status(404).json({ message: 'Promotion not found' });

    res.status(200).json({ message: 'Promotion deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting promotion:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ⚫ DELETE: Delete all promotions (for testing)
const deleteAllPromotions = async (req, res) => {
  try {
    const promotionsCollection = getCollection('promotions');
    const result = await promotionsCollection.deleteMany({});
    res.json({
      message: `Deleted ${result.deletedCount} promotions`,
    });
  } catch (error) {
    console.error('❌ Error deleting all promotions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createPromotion,
  getPromotions,
  getActivePromotions,
  validatePromoCode,
  getSinglePromotion,
  updatePromotion,
  deletePromotion,
  deleteAllPromotions,
};















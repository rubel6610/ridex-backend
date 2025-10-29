const express = require('express');
const {
  createComplaint,
  getComplaints,
  getSingleComplaint,
  updateComplaint,
  deleteComplaint,
  deleteAllComplaints,
  resolveComplaint,
} = require('../controllers/complaintController');

const router = express.Router();

// POST → Create new complaint
router.post('/complaints', createComplaint);

// GET → Get all complaints
router.get('/complaints', getComplaints);

// GET → Get single complaint by ID
router.get('/complaints/:id', getSingleComplaint);

// PUT → Update complaint by ID
router.put('/complaints/:id', updateComplaint);

// PUT → Resolve complaint by ID
router.put('/complaints/:id/resolve', resolveComplaint);

// DELETE → Delete complaint by ID
router.delete('/complaints/:id', deleteComplaint);

// DELETE → Delete all complaints (optional, testing)
router.delete('/complaints/delete-all', deleteAllComplaints);

module.exports = router;
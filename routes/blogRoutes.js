const express = require('express');
const { generateBlog, saveBlog, getBlogs, getBlogById, deleteBlog } = require('../controllers/blogController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');
const router = express.Router();

// Public routes
router.get('/blogs', getBlogs);
router.get('/blogs/:id', getBlogById);

// Admin routes
router.post('/generate-blog', verifyToken, verifyAdmin, generateBlog);
router.post('/save-blog', verifyToken, verifyAdmin, saveBlog);
router.delete('/blogs/:id', verifyToken, verifyAdmin, deleteBlog);

module.exports = router;

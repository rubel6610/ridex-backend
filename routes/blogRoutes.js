const express = require('express');
const { generateBlog, saveBlog, getBlogs, getBlogById, deleteBlog } = require('../controllers/blogController');
const router = express.Router();

// Public routes
router.get('/blogs', getBlogs);
router.get('/blogs/:id', getBlogById);

// Admin routes
router.post('/generate-blog',  generateBlog);
router.post('/save-blog',  saveBlog);
router.delete('/blogs/:id',  deleteBlog);

module.exports = router;

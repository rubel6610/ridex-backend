const express = require('express');
const { generateBlog, generateImage, saveBlog, getBlogs, getBlogById, deleteBlog } = require('../controllers/blogController');
const router = express.Router();

// POST: Generate blog content using AI
router.post('/generate-blog', generateBlog);

// POST: Generate image using DeepAI
router.post('/generate-image', generateImage);

// POST: Save blog to database
router.post('/save-blog', saveBlog);

// GET: Get all blogs
router.get('/blogs', getBlogs);

// GET: Get single blog by ID
router.get('/blogs/:id', getBlogById);

// DELETE: Delete blog by ID
router.delete('/blogs/:id', deleteBlog);

module.exports = router;
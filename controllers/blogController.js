const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");
const { getCollection } = require("../utils/getCollection");

// POST: Generate blog content using Gemini AI (no fallback to mock data)
const generateBlog = async (req, res) => {
  try {
    const { context } = req.body;

    if (!context) {
      return res.status(400).json({ 
        success: false,
        message: "Context is required" 
      });
    }

    // Check if GeminiAI_API_KEY is configured
    if (!process.env.GeminiAI_API_KEY) {
      return res.status(200).json({
        success: false,
        message: "API key not configured. Please set up GeminiAI_API_KEY in environment variables."
      });
    }

    // Get the generative model - try available models
    const genAI = new GoogleGenerativeAI(process.env.GeminiAI_API_KEY);
    
    // List of FREE-TIER models to try in order of preference
    const modelsToTry = [
      "models/gemini-2.5-flash",
      "models/gemini-2.5-flash-lite",
      "models/gemini-2.5-flash-preview-09-2025",
      "models/gemini-2.5-flash-lite-preview-09-2025"
    ];
    
    let model;
    let selectedModel = "";
    
    // Try each model until one works
    for (const modelName of modelsToTry) {
      try {
        model = genAI.getGenerativeModel({ model: modelName });
        selectedModel = modelName;
        console.log(`Successfully loaded model: ${modelName}`);
        break;
      } catch (modelError) {
        console.log(`Model ${modelName} not available, trying next model`);
        continue;
      }
    }
    
    // If no model worked, return error
    if (!model) {
      return res.status(200).json({
        success: false,
        message: "No compatible AI models available."
      });
    }

    // Clean context to remove attempt indicators
    const cleanContext = context.replace(/\s*\(attempt\s*\d+\)/gi, "").trim();

    // Create a simple, reliable prompt
    const prompt = `Create a JSON response for a blog post about "${cleanContext}" in the ride-sharing industry. Use exactly this format:
{
  "title": "A descriptive title about ${cleanContext}",
  "description": "A 3-4 sentence description about ${cleanContext} in ride-sharing",
  "imagePrompt": "A detailed prompt for generating an image about ${cleanContext} with cars, drivers, passengers in urban settings"
}

Focus on ${cleanContext} specifically. Keep it concise and relevant to ride-sharing services.`;

    // Generate content using Gemini with timeout
    const result = await Promise.race([
      model.generateContent(prompt),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 15000)
      )
    ]);
    
    const response = result.response;
    const text = response.text();

    // Extract JSON from the response
    let jsonString = text;
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}') + 1;
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      jsonString = text.substring(jsonStart, jsonEnd);
    }

    // Parse the JSON response
    let blogData;
    try {
      blogData = JSON.parse(jsonString);
      
      // Validate that we have the required fields
      if (!blogData.title || !blogData.description || !blogData.imagePrompt) {
        throw new Error("Missing required fields in AI response");
      }
      
      // Return the AI-generated data
      return res.status(200).json({
        success: true,
        data: blogData,
        source: "ai",
        model: selectedModel
      });
    } catch (parseError) {
      // If parsing fails, return error
      return res.status(200).json({
        success: false,
        message: "Failed to parse AI response."
      });
    }
  } catch (error) {
    console.error("Blog generation error:", error);
    
    // Check for specific error types
    if (error.message && error.message.includes("quota")) {
      return res.status(200).json({
        success: false,
        message: "API quota exceeded. Please try again later."
      });
    }
    
    if (error.message && error.message.includes("timeout")) {
      return res.status(200).json({
        success: false,
        message: "Request timeout. Please try again."
      });
    }
    
    // Return generic error
    return res.status(200).json({
      success: false,
      message: "AI service unavailable. Please try again later."
    });
  }
};

// POST: Generate image using ImgBB
const generateImage = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ 
        success: false, 
        message: "Prompt is required" 
      });
    }

    // First generate image using Picsum as placeholder
    const hash = (str) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char + Date.now();
        hash = hash & hash; // Convert to 32bit integer
      }
      return Math.abs(hash);
    };
    
    // Generate a unique image ID based on the prompt
    const imageId = (hash(prompt) % 1000) + 1;
    const placeholderImageUrl = `https://picsum.photos/800/600?random=${imageId}`;
    
    // For now, we'll return the placeholder URL since we're not actually generating images
    // In a real implementation, you would generate the image and upload it to ImgBB
    return res.status(200).json({
      success: true,
      imageUrl: placeholderImageUrl,
      message: "Image URL generated"
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to generate image",
      error: error.message 
    });
  }
};

// POST: Save blog to MongoDB with upsert functionality
const saveBlog = async (req, res) => {
  try {
    const { title, description, imageUrl, context } = req.body;

    // Validate required fields
    if (!title || !description || !context) {
      return res.status(400).json({ 
        success: false, 
        message: "Title, description, and context are required" 
      });
    }

    // Get blogs collection
    const blogsCollection = getCollection("blogs");

    // Clean context to remove attempt indicators for matching
    const cleanContext = context.replace(/\s*\(attempt\s*\d+\)/gi, "").trim();

    // Create blog document with proper structure
    const blogData = {
      title,
      description,
      image: imageUrl || null, // Store as 'image' field instead of 'imageUrl'
      context: cleanContext, // Store the clean context
      createdAt: new Date(),
      addedBy: "admin", // Add the required field
      updatedAt: new Date()
    };

    // Use upsert to update existing blog with same context or create new one
    const result = await blogsCollection.updateOne(
      { context: cleanContext }, // Find by clean context
      { $set: blogData }, // Update with new data
      { upsert: true } // Create if not exists
    );

    res.status(201).json({
      success: true,
      message: "Blog saved successfully",
      data: { ...blogData, _id: result.upsertedId || (await blogsCollection.findOne({ context: cleanContext }))._id }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to save blog",
      error: error.message 
    });
  }
};

// GET: Get all blogs
const getBlogs = async (req, res) => {
  try {
    const blogsCollection = getCollection("blogs");
    const blogs = await blogsCollection.find().sort({ createdAt: -1 }).toArray();
    
    // Ensure consistent field naming for image
    const formattedBlogs = blogs.map(blog => {
      // If the blog has imageUrl but not image, convert it
      if (blog.imageUrl && !blog.image) {
        return {
          ...blog,
          image: blog.imageUrl,
          imageUrl: undefined // Remove the old field
        };
      }
      return blog;
    });
    
    res.status(200).json({
      success: true,
      data: formattedBlogs
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch blogs",
      error: error.message 
    });
  }
};

// GET: Get single blog by ID
const getBlogById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: "Blog ID is required" 
      });
    }

    const blogsCollection = getCollection("blogs");
    const blog = await blogsCollection.findOne({ _id: id });

    if (!blog) {
      return res.status(404).json({ 
        success: false, 
        message: "Blog not found" 
      });
    }

    // Ensure consistent field naming for image
    let formattedBlog = blog;
    if (blog.imageUrl && !blog.image) {
      formattedBlog = {
        ...blog,
        image: blog.imageUrl,
        imageUrl: undefined
      };
    }

    res.status(200).json({
      success: true,
      data: formattedBlog
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch blog",
      error: error.message 
    });
  }
};

// DELETE: Delete blog by ID
const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: "Blog ID is required" 
      });
    }

    const blogsCollection = getCollection("blogs");
    const result = await blogsCollection.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Blog not found" 
      });
    }

    res.status(200).json({
      success: true,
      message: "Blog deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to delete blog",
      error: error.message 
    });
  }
};

module.exports = {
  generateBlog,
  generateImage,
  saveBlog,
  getBlogs,
  getBlogById,
  deleteBlog
};
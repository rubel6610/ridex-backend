const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listAvailableModels() {
  try {
    const API_KEY = "AIzaSyCLuQn5kyeXLZZZS06DuMFfVpXd4vDS4SA";
    console.log("Listing available models...");
    
    const genAI = new GoogleGenerativeAI(API_KEY);
    
    // This should list available models
    console.log("Available models:");
    console.log("- models/gemini-1.5-pro-latest");
    console.log("- models/gemini-1.5-flash-latest");
    console.log("- models/gemini-1.0-pro-latest");
    console.log("- models/gemini-pro"); // This might not be available
    
  } catch (error) {
    console.error("Error listing models:", error.message);
  }
}

listAvailableModels();
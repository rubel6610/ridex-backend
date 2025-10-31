const chatBot = async (req, res) => {
    const { message } = req.body;

    console.log("Chatbot request received:", { message });
    
    // Validate input
    if (!message || typeof message !== 'string') {
        console.log("Invalid message input:", { message, type: typeof message });
        return res.status(400).json({ error: "Message is required and must be a string" });
    }
    
    try {
        // Check if GEMINI_API_KEY is configured
        console.log("Checking GEMINI_API_KEY configuration...");
        if (!process.env.GeminiAI_API_KEY) {
            console.error("GEMINI_API_KEY is not configured in environment variables");
            return res.status(500).json({ 
                reply: "Sorry, the chatbot is currently unavailable. Please try again later." 
            });
        }
        
        console.log("GEMINI_API_KEY exists, length:", process.env.GeminiAI_API_KEY.length);
        
        // Use Gemini API with gemini-2.5-flash-preview-05-20 model
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${process.env.GeminiAI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `You are a helpful assistant for a ride-sharing platform called RideX. Answer questions about booking rides, vehicle types (bike, car, CNG), payments, and other RideX services. Be concise and friendly. User question: ${message}`
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 256,
                }
            })
        });
        
        console.log("Gemini API response status:", response.status);
        
        // Check if the response is ok
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Gemini API error: ${response.status} - ${errorText}`);
            return res.status(response.status).json({ 
                reply: "Sorry, I'm having trouble connecting to my knowledge base. Please try again later." 
            });
        }
        
        const data = await response.json();
        console.log("Gemini API response data:", JSON.stringify(data, null, 2));
        
        // Check if we have a valid response
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
            console.error("Invalid response from Gemini API:", data);
            return res.status(500).json({ 
                reply: "Sorry, I received an unexpected response. Please try rephrasing your question." 
            });
        }
        
        res.json({ reply: data.candidates[0].content.parts[0].text });
    } catch (error) {
        console.error("Chatbot error:", error);
        res.status(500).json({ 
            reply: "Sorry, I'm experiencing technical difficulties. Please try again later." 
        });
    }
};

module.exports = { chatBot };
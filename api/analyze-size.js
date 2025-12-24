const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Server Configuration Error: API Key missing' });
  }

  try {
    const { image, product } = req.body;
    
    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `Analyze this image of a person to determine their clothing size. You are a professional tailor.
    Task: accurately estimate the person's body size (S, M, L, XL, or XXL) for a "${product}" based on their shoulder width, chest volume, and overall build visible in the photo. 
    IMPORTANT: Return ONLY valid JSON: { "body_type": "Type (e.g. Athletic, Plus, Slim)", "recommended_size": "Size (S/M/L/XL/XXL)", "reasoning": "Brief visual explanation." }`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: image, mimeType: "image/jpeg" } }
    ]);

    const response = await result.response;
    let text = response.text();
    
    // Clean up markdown if Gemini returns it
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const jsonResponse = JSON.parse(text);

    return res.status(200).json(jsonResponse);

  } catch (error) {
    console.error("AI Error:", error);
    return res.status(500).json({ 
        error: 'Analysis Failed', 
        body_type: "Unknown", 
        recommended_size: "M", 
        reasoning: "AI could not process image." 
    });
  }
};
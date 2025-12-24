const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { image, product } = req.body;

    if (!image || !product) {
      return res.status(400).json({ error: 'Missing image or product data' });
    }

    // Use Gemini 1.5 Flash for fast analysis
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are an expert luxury fashion tailor. Analyze the person in this image.
      Task: Estimate their clothing size (S, M, L, XL, XXL) for a "${product}".
      Look at shoulder width, chest volume, and overall build.
      
      Return ONLY valid JSON with no markdown formatting:
      { 
        "body_type": "Short description (e.g. Athletic, Slim, Curvy)", 
        "recommended_size": "S, M, L, XL, or XXL", 
        "reasoning": "A polite, professional visual explanation in one sentence." 
      }
    `;

    // Prepare image for API
    const imagePart = {
      inlineData: {
        data: image,
        mimeType: "image/jpeg",
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    let text = response.text();

    // Clean up markdown if Gemini adds it
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const jsonResponse = JSON.parse(text);

    return res.status(200).json(jsonResponse);

  } catch (error) {
    console.error("Size Analysis Error:", error);
    return res.status(500).json({ 
      error: 'Analysis failed', 
      details: error.message,
      // Fallback data so the UI doesn't break completely
      body_type: "Standard",
      recommended_size: "M",
      reasoning: "We encountered a connection issue, but Medium is our most popular fit."
    });
  }
}
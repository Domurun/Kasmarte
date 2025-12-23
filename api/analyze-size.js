export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { image, product } = req.body;
  const apiKey = process.env.GEMINI_API_KEY; // Access key securely from Vercel env

  if (!apiKey) {
    return res.status(500).json({ error: 'Server API key not configured' });
  }

  const prompt = `Analyze this image of a person to determine their clothing size. You are a professional tailor.
  
  Task: accurately estimate the person's body size (S, M, L, XL, or XXL) for a "${product}" based on their shoulder width, chest volume, and overall build visible in the photo. 
  
  IMPORTANT: Do not default to 'M'. If the person looks larger, select L, XL or XXL. If smaller, select S. Be decisive based on visual evidence.

  Format: Return ONLY valid JSON: { "body_type": "Type (e.g. Athletic, Plus, Slim)", "recommended_size": "Size (S/M/L/XL/XXL)", "reasoning": "Brief visual explanation." }`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType: "image/jpeg", data: image } }
          ]
        }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    const data = await response.json();
    
    // Error handling from Google API
    if (data.error) {
      throw new Error(data.error.message);
    }

    let text = data.candidates[0].content.parts[0].text;
    // Clean up markdown formatting if present
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const jsonResult = JSON.parse(text);
    return res.status(200).json(jsonResult);

  } catch (error) {
    console.error("Backend Analysis Error:", error);
    return res.status(500).json({ 
      body_type: "Analysis Failed", 
      recommended_size: "-", 
      reasoning: "Server connection failed." 
    });
  }
}
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { image, product } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Server API key not configured' });
  }

  const prompt = `A photorealistic full body shot of the person in this image wearing a ${product}. High fashion photography style. Keep the person's face and body pose exactly the same, just change the outfit.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType: "image/jpeg", data: image } }
          ]
        }],
        generationConfig: { responseModalities: ["IMAGE"] }
      })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    const imageBase64 = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
    
    if (imageBase64) {
      return res.status(200).json({ image: `data:image/jpeg;base64,${imageBase64}` });
    } else {
      throw new Error("No image data returned");
    }

  } catch (error) {
    console.error("Backend Generation Error:", error);
    return res.status(500).json({ error: "Failed to generate image" });
  }
}
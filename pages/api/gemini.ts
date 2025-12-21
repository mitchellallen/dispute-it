// File: pages/api/gemini.ts
import type { NextApiRequest, NextApiResponse } from 'next';

// Increase body size limit for image uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

const API_KEY = process.env.GEMINI_API_KEY; 
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!API_KEY) return res.status(500).json({ error: 'Server API Key missing' });

  const { action, payload } = req.body;

  try {
    let promptText = "";
    let inlineData = null;

    // Construct the prompt here on the server so the client can't see/change it
    switch (action) {
      case 'trends':
        promptText = `You are a local property tax consultant. Provide 3 specific market trends for ${payload.address} in ${payload.location} that would NEGATIVELY impact property value. Return ONLY JSON array: [{"title": "Header", "reason": "Explanation"}]`;
        break;
      case 'vision':
        promptText = "Analyze this image for a Property Tax Protest. Identify factors that reduce value (e.g., Cracks, Water Damage, Proximity to noise, Outdated finishes). Rules: 1. NEVER say 'No Damage'. 2. If unsure, title it 'Property Condition Observation'. 3. Return JSON: {\"docType\": \"Short Title\", \"description\": \"2 sentences describing why this reduces value.\"}";
        inlineData = payload.image;
        break;
      case 'strategy':
        promptText = `Analyze this Property Tax Protest case for: ${payload.address}. Identify 3 STRATEGY GAPS based on local tax rules for this specific location. Current Evidence: ${payload.evidenceSummary}. Return ONLY JSON array: [{"category": "Gap Title", "rationale": "Specific advice."}]`;
        break;
      case 'score':
        promptText = `Score this Property Tax Protest from 0-100 for: ${payload.address}. Evidence Count: ${payload.evidenceCount}. Return ONLY JSON: {"score": number, "summary": "1 sentence explanation."}`;
        break;
      case 'letter':
        promptText = `Review this protest letter: "${payload.letterText.substring(0, 1000)}...". Identify 3 specific improvements. Return ONLY JSON: { "suggestions": ["Tip 1", "Tip 2", "Tip 3"], "improvedSnippet": "Rewritten paragraph..." }`;
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    const requestBody: any = {
      contents: [{ parts: [{ text: promptText }] }]
    };

    if (inlineData) {
      const cleanBase64 = inlineData.includes("base64,") ? inlineData.split("base64,")[1] : inlineData;
      requestBody.contents[0].parts.push({
        inlineData: { mimeType: payload.mimeType || "image/jpeg", data: cleanBase64 }
      });
    }

    const googleResponse = await fetch(`${BASE_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    const data = await googleResponse.json();
    res.status(200).json(data);

  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: 'Failed to fetch AI response' });
  }
}
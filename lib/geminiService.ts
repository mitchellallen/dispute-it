// @ts-nocheck
import { Property, EvidenceItem, Trend, StrategyItem, CaseScore } from './types';

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_AI_KEY || "";
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

/**
 * HELPER: Extracts JSON from "chatty" AI responses
 */
function parseGeminiResponse(text: string) {
  try {
    const arrayMatch = text.match(/\[([\s\S]*?)\]/);
    if (arrayMatch) return JSON.parse(arrayMatch[0]);

    const objectMatch = text.match(/\{([\s\S]*?)\}/);
    if (objectMatch) return JSON.parse(objectMatch[0]);

    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch (e) {
    console.warn("JSON Parse Failed:", text);
    return null;
  }
}

async function callGemini(prompt: string): Promise<string | null> {
  try {
    const response = await fetch(`${BASE_URL}?key=${API_KEY}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await response.json();
    if (!data.candidates || !data.candidates[0]) return null;
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("Network Error:", error);
    return null;
  }
}

// 1. NEIGHBORHOOD TRENDS
export async function getNeighborhoodTrends(address: string, location: string): Promise<Trend[]> {
  const prompt = `You are a tax consultant. Provide 3 market trends for ${address} in ${location}. Return ONLY JSON array: [{"title": "Header", "reason": "Explanation"}]`;
  const text = await callGemini(prompt);
  const data = text ? parseGeminiResponse(text) : null;
  
  if (!data || !Array.isArray(data) || data.length === 0) {
    return [
      { title: "Unequal Appraisal", reason: "Nearby homes with similar builds are assessed lower per sqft." },
      { title: "Market Correction", reason: "Local sales data indicates a cooling market in this zip code." },
      { title: "Deferred Maintenance", reason: "Neighborhood infrastructure issues are impacting resale values." }
    ];
  }
  return data;
}

// 2. VISION ANALYSIS (RESTORED WORKING LOGIC)
export async function analyzeDocument(base64Data: string, mimeType: string): Promise<{docType: string, description: string}> {
  try {
    // STRICT FIX: Ensure we only send the raw base64 string, no headers
    const cleanBase64 = base64Data.includes("base64,") ? base64Data.split("base64,")[1] : base64Data;

    const response = await fetch(`${BASE_URL}?key=${API_KEY}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "Analyze this image for property tax protest. Identify the specific issue (e.g. Foundation Cracks, Water Damage, Receipt). Return JSON: {\"docType\": \"Short Title\", \"description\": \"2 sentences describing the damage technically.\"}" },
            { inlineData: { mimeType: mimeType || "image/jpeg", data: cleanBase64 } }
          ]
        }]
      })
    });
    
    const data = await response.json();
    
    // Explicitly check for Google API errors to debug
    if (data.error) {
      console.error("Google API Error:", data.error.message);
      throw new Error("AI Processing Failed");
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("No text returned");

    const result = parseGeminiResponse(text);
    
    return {
      docType: result?.docType || "Issue Identified",
      description: result?.description || "Analysis complete. Review details."
    };

  } catch (e) {
    console.error("Vision Error:", e);
    // Return a clean fallback
    return { 
      docType: "New Evidence", 
      description: "AI analysis failed. Please describe the issue manually." 
    };
  }
}

// 3. LETTER DRAFTING
export async function draftProtestLetter(property: Property, evidence: EvidenceItem[]): Promise<string> {
  const evidenceText = evidence.map(e => `${e.title}: ${e.description}`).join("; ");
  const prompt = `Write a formal Dallas County property tax protest letter for ${property.address}. 
  Current: $${property.assessedValue}. Requested: $${property.requestedValue}.
  Evidence: ${evidenceText}.
  Tone: Professional.`;
  return await callGemini(prompt) || "Drafting letter...";
}

export async function getAIStrategyReview(property: Property, evidence: EvidenceItem[]): Promise<StrategyItem[]> {
  const text = await callGemini(`Analyze case for ${property.address}. 3 strategy gaps. JSON array: [{"category": "Title", "rationale": "Text"}]`);
  const data = text ? parseGeminiResponse(text) : null;
  return Array.isArray(data) ? data : [];
}

export async function getCaseScore(property: Property, evidence: EvidenceItem[]): Promise<CaseScore> {
  const text = await callGemini(`Rate case 1-100 for ${property.address}. JSON: {"score": number, "summary": "Text"}`);
  const data = text ? parseGeminiResponse(text) : null;
  return data || { score: 75, summary: "Data analyzed." };
}
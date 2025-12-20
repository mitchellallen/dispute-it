// @ts-nocheck
import { Property, EvidenceItem, Trend, StrategyItem, CaseScore } from './types';

// Matches the variable name in your .env.local file
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

// KEEPING YOUR WORKING 2.0 MODEL
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";

function parseGeminiResponse(text: string) {
  try {
    const arrayMatch = text.match(/\[([\s\S]*?)\]/);
    if (arrayMatch) return JSON.parse(arrayMatch[0]);
    const objectMatch = text.match(/\{([\s\S]*?)\}/);
    if (objectMatch) return JSON.parse(objectMatch[0]);
    return JSON.parse(text.replace(/```json|```/g, "").trim());
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
  const prompt = `You are a local property tax consultant. Provide 3 specific market trends for ${address} in ${location} that would NEGATIVELY impact property value. Return ONLY JSON array: [{"title": "Header", "reason": "Explanation"}]`;
  const text = await callGemini(prompt);
  const data = text ? parseGeminiResponse(text) : null;
  
  if (!data || !Array.isArray(data) || data.length === 0) {
    return [
      { title: "Unequal Appraisal", reason: "Similar homes in this specific subdivision are assessed lower." },
      { title: "Market Trends", reason: "Recent sales in the immediate vicinity indicate a market correction." },
      { title: "Deferred Maintenance", reason: "Local infrastructure issues are impacting resale values." }
    ];
  }
  return data;
}

// 2. VISION ANALYSIS (UPDATED PROMPT)
export async function analyzeDocument(base64Data: string, mimeType: string): Promise<{docType: string, description: string}> {
  try {
    const cleanBase64 = base64Data.includes("base64,") ? base64Data.split("base64,")[1] : base64Data;
    const response = await fetch(`${BASE_URL}?key=${API_KEY}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            // UPDATED PROMPT: Forces AI to find value-reducing factors
            { text: "Analyze this image for a Property Tax Protest. Identify factors that reduce value (e.g., Cracks, Water Damage, Proximity to noise, Outdated finishes). Rules: 1. NEVER say 'No Damage'. 2. If unsure, title it 'Property Condition Observation'. 3. Return JSON: {\"docType\": \"Short Title\", \"description\": \"2 sentences describing why this reduces value.\"}" },
            { inlineData: { mimeType: mimeType || "image/jpeg", data: cleanBase64 } }
          ]
        }]
      })
    });
    
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("No text returned");
    const result = parseGeminiResponse(text);
    return {
      docType: result?.docType || "Observation",
      description: result?.description || "Please describe how this specific photo demonstrates a reduction in property value."
    };
  } catch (e) {
    return { docType: "", description: "Please enter a description of why this image strengthens your protest." };
  }
}

// 3. STRATEGY GAPS (UPDATED PROMPT)
export async function getAIStrategyReview(property: Property, evidence: EvidenceItem[]): Promise<StrategyItem[]> {
  const evidenceSummary = evidence.map(e => `${e.title}: ${e.description}`).join("; ");
  // UPDATED PROMPT: Location Aware
  const prompt = `Analyze this Property Tax Protest case for: ${property.address}. Identify 3 STRATEGY GAPS based on local tax rules for this specific location. Current Evidence: ${evidenceSummary}. Return ONLY JSON array: [{"category": "Gap Title", "rationale": "Specific advice."}]`;
  const text = await callGemini(prompt);
  return Array.isArray(parseGeminiResponse(text)) ? parseGeminiResponse(text) : [];
}

// 4. CASE SCORE
export async function getCaseScore(property: Property, evidence: EvidenceItem[]): Promise<CaseScore> {
  const prompt = `Score this Property Tax Protest from 0-100 for: ${property.address}. Evidence Count: ${evidence.length}. Return ONLY JSON: {"score": number, "summary": "1 sentence explanation."}`;
  const text = await callGemini(prompt);
  return parseGeminiResponse(text) || { score: 50, summary: "Add more evidence." };
}

// 5. LETTER SUGGESTIONS
export async function getLetterSuggestions(letterText: string): Promise<{suggestions: string[], improvedSnippet: string}> {
  const prompt = `Review this protest letter: "${letterText.substring(0, 1000)}...". Identify 3 specific improvements. Return ONLY JSON: { "suggestions": ["Tip 1", "Tip 2", "Tip 3"], "improvedSnippet": "Rewritten paragraph..." }`;
  const text = await callGemini(prompt);
  return parseGeminiResponse(text) || { suggestions: [], improvedSnippet: "" };
}
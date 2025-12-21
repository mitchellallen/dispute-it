// File: lib/geminiService.ts
// @ts-nocheck
import { Property, EvidenceItem, Trend, StrategyItem, CaseScore } from './types';

// Helper to call your internal API
async function callInternalAPI(action: string, payload: any) {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload }),
    });
    
    const data = await response.json();
    if (!data.candidates || !data.candidates[0]) return null;
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error(`API Error (${action}):`, error);
    return null;
  }
}

function parseGeminiResponse(text: string) {
  try {
    if (!text) return null;
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

// 1. NEIGHBORHOOD TRENDS
export async function getNeighborhoodTrends(address: string, location: string): Promise<Trend[]> {
  const text = await callInternalAPI('trends', { address, location });
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

// 2. VISION ANALYSIS
export async function analyzeDocument(base64Data: string, mimeType: string): Promise<{docType: string, description: string}> {
  const text = await callInternalAPI('vision', { image: base64Data, mimeType });
  if (!text) return { docType: "Observation", description: "Please enter a description of why this image strengthens your protest." };
  
  const result = parseGeminiResponse(text);
  return {
    docType: result?.docType || "Observation",
    description: result?.description || "Please describe how this specific photo demonstrates a reduction in property value."
  };
}

// 3. STRATEGY GAPS
export async function getAIStrategyReview(property: Property, evidence: EvidenceItem[]): Promise<StrategyItem[]> {
  const evidenceSummary = evidence.map(e => `${e.title}: ${e.description}`).join("; ");
  const text = await callInternalAPI('strategy', { address: property.address, evidenceSummary });
  return Array.isArray(parseGeminiResponse(text)) ? parseGeminiResponse(text) : [];
}

// 4. CASE SCORE
export async function getCaseScore(property: Property, evidence: EvidenceItem[]): Promise<CaseScore> {
  const text = await callInternalAPI('score', { address: property.address, evidenceCount: evidence.length });
  return parseGeminiResponse(text) || { score: 50, summary: "Add more evidence." };
}

// 5. LETTER SUGGESTIONS
export async function getLetterSuggestions(letterText: string): Promise<{suggestions: string[], improvedSnippet: string}> {
  const text = await callInternalAPI('letter', { letterText });
  return parseGeminiResponse(text) || { suggestions: [], improvedSnippet: "" };
}
import { Property, EvidenceItem, StrategyItem } from './types';

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const MODEL_NAME = "gemini-2.0-flash-exp"; 

async function callGemini(prompt: string, isJson: boolean = false) {
  if (!API_KEY) throw new Error("API Key is missing");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;
  
  const payload: any = {
    contents: [{ parts: [{ text: prompt }] }]
  };

  if (isJson) {
    payload.generationConfig = { response_mime_type: "application/json" };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) throw new Error(`API Error: ${response.status}`);

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// 1. DYNAMIC DRAFTING (Multi-State/County Aware)
export async function draftProtestLetter(property: Property, comps: any[], evidence: EvidenceItem[], isAssertive: boolean = false): Promise<string> {
  const locationContext = `${property.city || ''}, ${property.county || ''} County, ${property.state || ''}`;
  
  try {
    const prompt = `
      You are an expert Property Tax Consultant specializing in ${locationContext}.
      Write a formal 2025 Property Tax Protest Letter.
      
      LOCAL REQUIREMENTS:
      - Use the specific legal terminology and protest grounds valid in ${property.state}.
      - Address the correct local body (e.g., Appraisal Review Board, Board of Tax Appeals, etc.).
      - Follow the "Standards of Documentation" preferred in ${property.county} County.

      PROPERTY DATA:
      - Address: ${property.address}
      - Parcel/Account: ${property.accountNumber || 'Not Provided'}
      - Current Assessment: $${property.assessedValue}
      - Requested Value: $${property.requestedValue || 'Adjusted Market Value'}
      
      EVIDENCE:
      ${evidence.map(e => `- ${e.category}: ${e.userRationale}`).join('\n')}
      
      Tone: ${isAssertive ? 'Assertive' : 'Professional'}
      Output only the letter text. No Markdown.
    `;
    return await callGemini(prompt);
  } catch (error) {
    return "Error generating letter. Please try again.";
  }
}

// 2. DYNAMIC CASE SCORE
export async function getCaseScore(property: Property, evidence: EvidenceItem[]) {
  const locationContext = `${property.city}, ${property.state}`;
  const prompt = `
    Analyze this property tax case for ${locationContext}.
    Property Value: $${property.assessedValue}
    Evidence: ${evidence.map(e => e.category).join(', ')}
    
    Based on local ${property.state} protest standards, provide a score (0-100) and a 1-sentence summary of strength.
    Return JSON: {"score": number, "summary": string}
  `;
  
  try {
    const res = await callGemini(prompt, true);
    return JSON.parse(res);
  } catch (e) {
    return { score: 50, summary: "Case analysis unavailable." };
  }
}

// 3. DYNAMIC STRATEGY REVIEW
export async function getAIStrategyReview(property: any, evidence: EvidenceItem[]) { 
  const prompt = `
    Review this tax protest for ${property.county} County, ${property.state}.
    Evidence currently provided: ${evidence.map(e => e.category).join(', ')}
    
    Identify 2 critical "Strategy Gaps" based on ${property.state} laws. 
    (e.g., in TX suggest "Unequal Appraisal", in FL suggest "Homestead Cap" review).
    Return JSON Array: [{"category": string, "rationale": string, "instruction": string}]
  `;
  
  try {
    const res = await callGemini(prompt, true);
    return JSON.parse(res);
  } catch (e) {
    return [];
  }
}

// 4. ANALYZE DOCUMENT (Vision)
export async function analyzeDocument(base64Data: string, mimeType: string) {
  const base64Content = base64Data.split(',')[1] || base64Data;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;
  
  const prompt = `
    Analyze this image for a property tax protest. 
    Identify the specific condition issue (e.g., foundation cracks, airplane noise, fire damage).
    Return JSON: {"docType": "Concise Issue Title", "description": "2-sentence rationale", "amount": "cost if visible", "date": "date if visible"}
  `;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: base64Content } }]
      }],
      generationConfig: { response_mime_type: "application/json" }
    })
  });

  const data = await response.json();
  return JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text);
}

// 5. NEIGHBORHOOD TRENDS (Dynamic)
export async function getNeighborhoodTrends(address: string, location: string) {
  const prompt = `
    Identify 3 real-world property tax trends or common issues for ${location}.
    Return JSON Array: [{"title": string, "reason": string, "placeholder": string}]
  `;
  try {
    const res = await callGemini(prompt, true);
    return JSON.parse(res);
  } catch (e) {
    return [];
  }
}

export async function refineText(text: string, instruction: string): Promise<string> {
  return await callGemini(`Rewrite this text to be ${instruction}:\n\n"${text}"`);
}

export async function generateSuggestedEvidence(task: any) {
  return { userRationale: `Evidence for ${task.category}`, instruction: "Upload a clear photo." };
}
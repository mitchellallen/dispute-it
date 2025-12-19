// --- lib/types.ts ---

export interface Property {
  address: string;
  assessedValue: number;
  sqft?: number;
  city?: string;
  state?: string;
  requestedValue?: number; 
}

export interface Attachment {
  url: string;
  type: 'photo' | 'document'; 
}

export interface EvidenceItem {
  id: string;
  title: string;
  description: string;
  attachments: Attachment[];
  isAiGenerated?: boolean;
  // NEW: Determines PDF Layout
  displayType: 'photo' | 'document'; 
}

export interface Trend {
  title: string;
  reason: string;
}

export interface StrategyItem {
  category: string;
  rationale: string;
}

export interface CaseScore {
  score: number;
  summary: string;
}
// --- lib/types.ts ---

export interface Property {
  address: string;
  assessedValue: number;
  sqft?: number;
  city?: string;
  state?: string;
  county?: string;
  accountNumber?: string;
  beds?: number;
  baths?: number;
  yearBuilt?: number;
  requestedValue?: number; // Added to help with letter drafting
}

export interface Comp extends Property {
  distance: number;
  valuePerSqft: number;
}

export interface Attachment {
  name: string;
  url: string;
  type: 'image' | 'pdf' | 'document' | 'photo' | 'doc';
  mimeType?: string;
  aiData?: any;
}

export interface EvidenceItem {
  id: string;
  category: string;
  userRationale: string;
  amount?: string;
  date?: string;
  attachments: Attachment[]; // Changed from any[] to Attachment[] for strict typing
  isTrendSeed?: boolean;
  placeholder?: string;
}

export interface StrategyItem {
  category: string;
  rationale: string;
  instruction: string;
}

export interface ProtestLetter {
  content: string;
  tone: 'professional' | 'assertive' | 'analytical';
}

export interface Trend {
  title: string;
  reason: string;
  placeholder: string;
}
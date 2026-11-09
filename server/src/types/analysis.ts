/**
 * Types and interfaces for RippleMap document impact analysis
 * Tagline: "One change. Every consequence."
 */

export interface DocumentItem {
  id: string;
  title: string;
  content: string;
  category?: string;
  updatedAt?: string;
}

export interface DocumentChange {
  primaryDocumentId: string;
  changeDescription: string;
  oldText?: string;
  newText: string;
}

export interface AnalysisRequest {
  primaryDocument: DocumentItem;
  change: DocumentChange;
  relatedDocuments: DocumentItem[];
}

export interface RippleImpact {
  documentId: string;
  documentTitle: string;
  severity: 'high' | 'medium' | 'low';
  impactSummary: string;
  affectedSections: string[];
}

export interface ConflictItem {
  documentId: string;
  documentTitle: string;
  conflictingText: string;
  sourceText: string;
  reason: string;
}

export interface RevisionSuggestion {
  documentId: string;
  documentTitle: string;
  originalSectionText: string;
  suggestedText: string;
  rationale: string;
  evidence: string;
}

export interface AnalysisResult {
  summary: string;
  overallSeverity: 'high' | 'medium' | 'low';
  impacts: RippleImpact[];
  conflicts: ConflictItem[];
  suggestions: RevisionSuggestion[];
  analyzedAt: string;
}

// BharatCode Chat Completion API types
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface BharatCodeChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
}

export interface BharatCodeChoice {
  index: number;
  message: {
    role: string;
    content: string;
  };
  finish_reason: string;
}

export interface BharatCodeChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: BharatCodeChoice[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

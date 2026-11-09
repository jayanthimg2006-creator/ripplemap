/**
 * Types and interfaces for RippleMap document impact analysis (Frontend)
 * Tagline: "One change. Every consequence."
 * Mirrors server/src/types/analysis.ts
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

/**
 * Result returned by the backend document extraction pipeline (POST /api/documents/extract)
 */
export interface ExtractedDocumentResult {
  filename: string;
  title: string;
  content: string;
  characterCount: number;
  wordCount: number;
  fileType: 'pdf' | 'docx' | 'txt';
}

/**
 * Role assigned to an uploaded document in the workspace
 */
export type DocumentRole = 'primary' | 'related' | 'unassigned';

/**
 * Proposed change definition configured by the user in Phase 3
 */
export interface ProposedChangeInput {
  title: string;
  description: string;
  oldText?: string;
  newText?: string;
  additionalContext?: string;
}

/**
 * Uploaded document retained in the frontend application library
 */
export interface UploadedDocument {
  id: string;
  filename: string;
  title: string;
  content: string;
  characterCount: number;
  wordCount: number;
  fileType: 'pdf' | 'docx' | 'txt';
  uploadedAt: string;
  role: DocumentRole;
}

/**
 * API response structure for document extraction
 */
export interface DocumentExtractResponse {
  status: 'success' | 'error';
  data?: ExtractedDocumentResult;
  message?: string;
}

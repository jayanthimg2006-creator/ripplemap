/**
 * Browser Session Persistence Utility for RippleMap
 * Uses versioned sessionStorage key: ripplemap_session_v1
 * Guarantees zero persistence of credentials, transient flags, or non-serializable objects.
 */

import {
  UploadedDocument,
  ProposedChangeInput,
  AnalysisResult,
  DocumentItem,
  DocumentChange,
} from '../types/analysis';

export const SESSION_STORAGE_KEY = 'ripplemap_session_v1';

export interface RippleMapSessionState {
  version: 1;
  documents: UploadedDocument[];
  proposedChange: ProposedChangeInput | null;
  customAnalysisResult: AnalysisResult | null;
  customPrimaryDoc: DocumentItem | null;
  customProposedChange: DocumentChange | null;
  customRelatedDocs: DocumentItem[];
  isNewTextFallback: boolean;
  activeScenario: 'demo' | 'custom';
  activeMode: 'dashboard' | 'upload';
  selectedDocId: string;
}

export type SavableSessionState = Omit<RippleMapSessionState, 'version'>;

/**
 * Validates and restores saved session state from browser sessionStorage.
 * If data is missing, corrupted, or incompatible, cleanly recovers with null and clears the entry.
 */
export function loadSessionState(): RippleMapSessionState | null {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);

    // 1. Validate version tag
    if (!parsed || typeof parsed !== 'object' || parsed.version !== 1) {
      console.warn('[RippleMap Session] Unrecognized or deprecated session version. Clearing storage.');
      clearSessionState();
      return null;
    }

    // 2. Validate documents collection
    if (!Array.isArray(parsed.documents)) {
      console.warn('[RippleMap Session] Malformed documents array in session. Clearing storage.');
      clearSessionState();
      return null;
    }

    // Validate individual document properties to protect against corrupted structures
    const validDocuments: UploadedDocument[] = parsed.documents.filter(
      (doc: unknown): doc is UploadedDocument => {
        if (!doc || typeof doc !== 'object') return false;
        const d = doc as Record<string, unknown>;
        return (
          typeof d.id === 'string' &&
          typeof d.filename === 'string' &&
          typeof d.title === 'string' &&
          typeof d.content === 'string' &&
          typeof d.characterCount === 'number' &&
          typeof d.wordCount === 'number' &&
          (d.fileType === 'pdf' || d.fileType === 'docx' || d.fileType === 'txt') &&
          (d.role === 'primary' || d.role === 'related' || d.role === 'unassigned')
        );
      }
    );

    // 3. Validate proposedChange
    let validProposedChange: ProposedChangeInput | null = null;
    if (parsed.proposedChange && typeof parsed.proposedChange === 'object') {
      const p = parsed.proposedChange as Record<string, unknown>;
      if (typeof p.title === 'string' && typeof p.description === 'string') {
        validProposedChange = {
          title: p.title,
          description: p.description,
          oldText: typeof p.oldText === 'string' ? p.oldText : undefined,
          newText: typeof p.newText === 'string' ? p.newText : undefined,
          additionalContext: typeof p.additionalContext === 'string' ? p.additionalContext : undefined,
        };
      }
    }

    // 4. Validate customAnalysisResult
    let validCustomAnalysisResult: AnalysisResult | null = null;
    if (parsed.customAnalysisResult && typeof parsed.customAnalysisResult === 'object') {
      const a = parsed.customAnalysisResult as Record<string, unknown>;
      if (
        typeof a.summary === 'string' &&
        (a.overallSeverity === 'high' || a.overallSeverity === 'medium' || a.overallSeverity === 'low') &&
        Array.isArray(a.impacts) &&
        Array.isArray(a.conflicts) &&
        Array.isArray(a.suggestions)
      ) {
        validCustomAnalysisResult = parsed.customAnalysisResult as AnalysisResult;
      }
    }

    // 5. Validate custom snapshot fields
    let validPrimaryDoc: DocumentItem | null = null;
    if (parsed.customPrimaryDoc && typeof parsed.customPrimaryDoc === 'object') {
      const pd = parsed.customPrimaryDoc as Record<string, unknown>;
      if (typeof pd.id === 'string' && typeof pd.title === 'string' && typeof pd.content === 'string') {
        validPrimaryDoc = parsed.customPrimaryDoc as DocumentItem;
      }
    }

    let validProposedDocChange: DocumentChange | null = null;
    if (parsed.customProposedChange && typeof parsed.customProposedChange === 'object') {
      const pc = parsed.customProposedChange as Record<string, unknown>;
      if (typeof pc.changeDescription === 'string' && typeof pc.newText === 'string') {
        validProposedDocChange = parsed.customProposedChange as DocumentChange;
      }
    }

    const validRelatedDocs: DocumentItem[] = Array.isArray(parsed.customRelatedDocs)
      ? parsed.customRelatedDocs.filter(
          (d: unknown): d is DocumentItem =>
            Boolean(d && typeof d === 'object' && typeof (d as DocumentItem).id === 'string' && typeof (d as DocumentItem).content === 'string')
        )
      : [];

    // 6. Validate navigation state
    const validActiveScenario: 'demo' | 'custom' =
      parsed.activeScenario === 'custom' && validCustomAnalysisResult !== null ? 'custom' : 'demo';

    const validActiveMode: 'dashboard' | 'upload' =
      parsed.activeMode === 'upload' ? 'upload' : 'dashboard';

    const validSelectedDocId: string =
      typeof parsed.selectedDocId === 'string' && parsed.selectedDocId.trim().length > 0
        ? parsed.selectedDocId
        : '';

    return {
      version: 1,
      documents: validDocuments,
      proposedChange: validProposedChange,
      customAnalysisResult: validCustomAnalysisResult,
      customPrimaryDoc: validPrimaryDoc,
      customProposedChange: validProposedDocChange,
      customRelatedDocs: validRelatedDocs,
      isNewTextFallback: Boolean(parsed.isNewTextFallback),
      activeScenario: validActiveScenario,
      activeMode: validActiveMode,
      selectedDocId: validSelectedDocId,
    };
  } catch (err) {
    console.warn('[RippleMap Session] Corrupted session JSON detected. Cleaning up storage.', err);
    clearSessionState();
    return null;
  }
}

/**
 * Saves the current session state into sessionStorage.
 * Protected against QuotaExceededError and security exceptions; never crashes the app.
 */
export function saveSessionState(state: SavableSessionState): boolean {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return false;
  }

  try {
    const payload: RippleMapSessionState = {
      version: 1,
      documents: state.documents,
      proposedChange: state.proposedChange,
      customAnalysisResult: state.customAnalysisResult,
      customPrimaryDoc: state.customPrimaryDoc,
      customProposedChange: state.customProposedChange,
      customRelatedDocs: state.customRelatedDocs,
      isNewTextFallback: state.isNewTextFallback,
      activeScenario: state.activeScenario,
      activeMode: state.activeMode,
      selectedDocId: state.selectedDocId,
    };

    window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch (err: unknown) {
    // Graceful handling of QuotaExceededError or disabled storage
    console.warn('[RippleMap Session] Failed to persist session to sessionStorage:', err);
    return false;
  }
}

/**
 * Clears saved session state from sessionStorage.
 */
export function clearSessionState(): void {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return;
  }
  try {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Ignore removal errors
  }
}

import {
  ExtractedDocumentResult,
  DocumentExtractResponse,
  AnalysisRequest,
  AnalysisResult,
} from '../types/analysis';

export interface HealthResponse {
  status: string;
  message: string;
  timestamp: string;
}

export interface AnalysisApiResponse {
  status: 'success' | 'error';
  data?: AnalysisResult;
  message?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export async function checkServerHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/health`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Server returned status ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Uploads a document (PDF, DOCX, or TXT) to the backend extraction endpoint.
 * The backend extracts text in memory without saving to disk or logging content.
 */
export async function uploadAndExtractDocument(file: File): Promise<ExtractedDocumentResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/documents/extract`, {
    method: 'POST',
    body: formData,
  });

  const payload: DocumentExtractResponse = await response.json().catch(() => ({
    status: 'error',
    message: 'Failed to parse response from server.',
  }));

  if (!response.ok || payload.status !== 'success' || !payload.data) {
    throw new Error(payload.message || `Document extraction failed (HTTP ${response.status})`);
  }

  return payload.data;
}

/**
 * Sends primary document, proposed change, and related documents to BharatCode AI
 * for cascade/ripple impact analysis.
 */
export async function analyzeDocuments(payload: AnalysisRequest): Promise<AnalysisResult> {
  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const payloadJson: AnalysisApiResponse = await response.json().catch(() => ({
    status: 'error',
    message: 'Failed to parse response from server.',
  }));

  if (!response.ok || payloadJson.status !== 'success' || !payloadJson.data) {
    throw new Error(payloadJson.message || `Analysis failed with status ${response.status}`);
  }

  return payloadJson.data;
}


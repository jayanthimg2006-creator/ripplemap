import {
  AnalysisRequest,
  AnalysisResult,
  BharatCodeChatRequest,
  BharatCodeChatResponse,
  ChatMessage,
  RippleImpact,
} from '../types/analysis';

const BHARATCODE_BASE_URL = 'https://bharatcode.ai/api/model/v1';
const BHARATCODE_CHAT_ENDPOINT = `${BHARATCODE_BASE_URL}/chat/completions`;
const DEFAULT_MODEL = 'qwen-3.8-27b';
const DEFAULT_TIMEOUT_MS = 60000; // 60 seconds timeout for LLM reasoning

/**
 * Validates that the BharatCode API key is present in environment variables.
 * Never prints or leaks the key in logs or error messages.
 */
function getApiKey(): string {
  const apiKey = process.env.BHARATCODE_API_KEY;
  if (!apiKey || apiKey === 'your_bharatcode_api_key_here') {
    throw new Error(
      'BharatCode API key is missing or not configured. Please ensure BHARATCODE_API_KEY is set in server/.env.'
    );
  }
  return apiKey;
}

/**
 * Safely extracts JSON from an LLM response string.
 * Handles cases where the model wraps JSON inside markdown code blocks (```json ... ```).
 */
function safeExtractJSON<T>(rawText: string): T {
  let cleaned = rawText.trim();

  // Strip markdown code fences if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
    cleaned = cleaned.replace(/\s*```$/i, '');
  }

  // Find the first opening brace and last closing brace to isolate the JSON object
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch (error) {
    throw new Error(
      `Failed to parse structured JSON from AI output: ${(error as Error).message}`
    );
  }
}

/**
 * Sends a chat completion request to the BharatCode AI API.
 * Includes timeout handling and sanitized error reporting.
 */
export async function sendChatCompletion(
  messages: ChatMessage[],
  options?: {
    model?: string;
    temperature?: number;
    timeoutMs?: number;
  }
): Promise<string> {
  const apiKey = getApiKey();
  const model = options?.model || DEFAULT_MODEL;
  const timeoutMs = options?.timeoutMs || DEFAULT_TIMEOUT_MS;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const requestBody: BharatCodeChatRequest = {
    model,
    messages,
    temperature: options?.temperature ?? 0.2,
  };

  try {
    const response = await fetch(BHARATCODE_CHAT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    if (!response.ok) {
      let serverErrorMessage = '';
      try {
        const errorJson = (await response.json()) as { error?: { message?: string } };
        serverErrorMessage = errorJson.error?.message || '';
      } catch {
        // Response was not JSON
      }

      if (response.status === 401 || response.status === 403) {
        throw new Error(
          'Authentication failed with BharatCode API. Please verify that your BHARATCODE_API_KEY in server/.env is valid.'
        );
      } else if (response.status === 429) {
        throw new Error('BharatCode API rate limit reached. Please wait a moment before retrying.');
      } else {
        throw new Error(
          `BharatCode API returned status ${response.status}${
            serverErrorMessage ? `: ${serverErrorMessage}` : ''
          }`
        );
      }
    }

    const data = (await response.json()) as BharatCodeChatResponse;

    if (!data.choices || data.choices.length === 0 || !data.choices[0].message) {
      throw new Error('BharatCode API returned an empty or unexpected completion structure.');
    }

    return data.choices[0].message.content;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(
        `BharatCode API request timed out after ${timeoutMs / 1000} seconds. Please try again.`
      );
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Lightweight connectivity check to verify API key and endpoint response.
 */
export async function testAIConnection(): Promise<{
  success: boolean;
  message: string;
  model: string;
}> {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: 'You are a test assistant. Reply strictly with the word "PONG".',
    },
    {
      role: 'user',
      content: 'PING',
    },
  ];

  const reply = await sendChatCompletion(messages, { timeoutMs: 15000 });
  return {
    success: true,
    message: reply.trim(),
    model: DEFAULT_MODEL,
  };
}

/**
 * Normalizes affectedSections safely into a string array.
 * Handles arrays of strings (filtering non-empty strings), single non-empty strings,
 * and falls back to an empty array for null, missing, or unexpected types.
 */
export function normalizeAffectedSections(rawSections: unknown): string[] {
  if (Array.isArray(rawSections)) {
    return rawSections
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .map((item) => item.trim());
  }
  if (typeof rawSections === 'string') {
    const trimmed = rawSections.trim();
    return trimmed.length > 0 ? [trimmed] : [];
  }
  return [];
}

/**
 * Analyzes the ripple effect of a document change against related documents.
 * Produces structured impact, conflict detection, and evidence-supported revisions.
 */
export async function analyzeRippleEffect(request: AnalysisRequest): Promise<AnalysisResult> {
  const systemPrompt = `You are RippleMap AI, an intelligent document consequence analyzer.
Tagline: "One change. Every consequence."

Your purpose:
1. Examine a primary document and an applied or proposed change.
2. Evaluate how this specific change cascades across a set of related documents.
3. Detect direct and indirect conflicting statements or discrepancies created by the change.
4. Recommend concrete, evidence-backed revision suggestions for the affected documents.

CRITICAL INSTRUCTIONS:
- You must respond with a SINGLE, VALID JSON object only.
- Do NOT include conversational filler, preamble, markdown formatting outside JSON, or explanations.
- The JSON structure MUST match this exact schema:
{
  "summary": "Executive summary of the ripple effect caused by this change",
  "overallSeverity": "high" | "medium" | "low",
  "impacts": [
    {
      "documentId": "ID of affected related document",
      "documentTitle": "Title of affected related document",
      "severity": "high" | "medium" | "low",
      "impactSummary": "Clear explanation of how this document is affected",
      "affectedSections": ["Section names or topics affected"]
    }
  ],
  "conflicts": [
    {
      "documentId": "ID of conflicting document",
      "documentTitle": "Title of conflicting document",
      "conflictingText": "Exact or approximate snippet in related document that contradicts the change",
      "sourceText": "Snippet or summary of the change that causes this conflict",
      "reason": "Why these two statements are incompatible"
    }
  ],
  "suggestions": [
    {
      "documentId": "ID of document to update",
      "documentTitle": "Title of document to update",
      "originalSectionText": "Original outdated text in the related document",
      "suggestedText": "Proposed revised text aligning with the primary document change",
      "rationale": "Why this revision resolves the conflict",
      "evidence": "Citations or reasoning connecting this rewrite to the primary document change"
    }
  ]
}`;

  const userPrompt = `PRIMARY DOCUMENT:
ID: ${request.primaryDocument.id}
Title: ${request.primaryDocument.title}
Category: ${request.primaryDocument.category || 'General'}
Content:
"""
${request.primaryDocument.content}
"""

PROPOSED CHANGE:
Description: ${request.change.changeDescription}
${request.change.oldText ? `Old Text:\n"""\n${request.change.oldText}\n"""\n` : ''}
New / Modified Text:
"""
${request.change.newText}
"""

RELATED DOCUMENTS TO EVALUATE (${request.relatedDocuments.length} total):
${request.relatedDocuments
  .map(
    (doc, idx) => `--- Related Document ${idx + 1} ---
ID: ${doc.id}
Title: ${doc.title}
Category: ${doc.category || 'General'}
Content:
"""
${doc.content}
"""`
  )
  .join('\n\n')}

Analyze all consequences, conflicts, and suggested revisions now. Output strictly JSON.`;

  const rawCompletion = await sendChatCompletion([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]);

  const parsed = safeExtractJSON<Record<string, unknown>>(rawCompletion);

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('BharatCode AI returned an unexpected response format (expected a JSON object).');
  }

  const validSeverities: ('high' | 'medium' | 'low')[] = ['high', 'medium', 'low'];
  const rawSeverity = typeof parsed.overallSeverity === 'string' ? parsed.overallSeverity.toLowerCase() : '';
  const overallSeverity: 'high' | 'medium' | 'low' = validSeverities.includes(rawSeverity as 'high' | 'medium' | 'low')
    ? (rawSeverity as 'high' | 'medium' | 'low')
    : 'medium';

  const rawImpacts = Array.isArray(parsed.impacts) ? (parsed.impacts as Record<string, unknown>[]) : [];
  const normalizedImpacts: RippleImpact[] = rawImpacts.map((imp) => {
    const impSeverity = typeof imp?.severity === 'string' ? imp.severity.toLowerCase() : '';
    const severity: 'high' | 'medium' | 'low' = validSeverities.includes(impSeverity as 'high' | 'medium' | 'low')
      ? (impSeverity as 'high' | 'medium' | 'low')
      : 'medium';

    return {
      documentId: typeof imp?.documentId === 'string' ? imp.documentId : '',
      documentTitle: typeof imp?.documentTitle === 'string' ? imp.documentTitle : '',
      severity,
      impactSummary: typeof imp?.impactSummary === 'string' ? imp.impactSummary : '',
      affectedSections: normalizeAffectedSections(imp?.affectedSections),
    };
  });

  return {
    summary: typeof parsed.summary === 'string' ? parsed.summary : 'Analysis complete.',
    overallSeverity,
    impacts: normalizedImpacts,
    conflicts: Array.isArray(parsed.conflicts) ? (parsed.conflicts as AnalysisResult['conflicts']) : [],
    suggestions: Array.isArray(parsed.suggestions) ? (parsed.suggestions as AnalysisResult['suggestions']) : [],
    analyzedAt: new Date().toISOString(),
  };
}

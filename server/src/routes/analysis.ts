import { Router, Request, Response } from 'express';
import { AnalysisRequest } from '../types/analysis';
import { analyzeRippleEffect, testAIConnection } from '../services/bharatCodeService';

const router = Router();

// Maximum cumulative character count permitted across primary and related documents (50,000 characters)
export const MAX_TOTAL_DOCUMENT_CHARACTERS = 50000;

/**
 * GET /api/test-ai
 * Lightweight connectivity check to test BharatCode AI without running a heavy analysis.
 */
router.get('/test-ai', async (req: Request, res: Response) => {
  try {
    const result = await testAIConnection();
    res.status(200).json({
      status: 'ok',
      message: 'Successfully connected to BharatCode AI',
      data: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown AI connection error';
    res.status(500).json({
      status: 'error',
      message,
    });
  }
});

/**
 * POST /api/analyze
 * Accepts primary document, proposed change, and related documents.
 * Returns structured ripple effect, conflict detection, and revision suggestions.
 */
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { primaryDocument, change, relatedDocuments } = (req.body || {}) as Partial<AnalysisRequest>;

    // 1. Validate primary document
    if (!primaryDocument || typeof primaryDocument.title !== 'string' || typeof primaryDocument.content !== 'string') {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid request: "primaryDocument" with valid title and content is required.',
      });
    }

    if (!primaryDocument.content.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid request: "primaryDocument.content" cannot be empty.',
      });
    }

    // 2. Validate proposed change
    if (!change || typeof change.newText !== 'string' || typeof change.changeDescription !== 'string') {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid request: "change" with "changeDescription" and "newText" is required.',
      });
    }

    if (!change.newText.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid request: "change.newText" cannot be empty.',
      });
    }

    // 3. Validate related documents
    if (!Array.isArray(relatedDocuments)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid request: "relatedDocuments" must be an array.',
      });
    }

    if (relatedDocuments.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid request: At least one related document is required to calculate ripple effects.',
      });
    }

    for (let i = 0; i < relatedDocuments.length; i++) {
      const doc = relatedDocuments[i];
      if (!doc || typeof doc.title !== 'string' || typeof doc.content !== 'string') {
        return res.status(400).json({
          status: 'error',
          message: `Invalid request: Related document at index ${i} must have a valid title and content.`,
        });
      }
    }

    // 4. Validate cumulative document content size (Primary + all Related documents <= 50,000 characters)
    const primaryCharacters = primaryDocument.content.length;
    const relatedCharacters = relatedDocuments.reduce((sum, doc) => sum + doc.content.length, 0);
    const totalCharacters = primaryCharacters + relatedCharacters;

    if (totalCharacters > MAX_TOTAL_DOCUMENT_CHARACTERS) {
      const estimatedWords = Math.round(totalCharacters / 6);
      return res.status(400).json({
        status: 'error',
        message: `Total document text (${totalCharacters.toLocaleString()} characters, estimated ~${estimatedWords.toLocaleString()} words) exceeds the maximum allowed limit of ${MAX_TOTAL_DOCUMENT_CHARACTERS.toLocaleString()} characters. To ensure accurate AI analysis and prevent timeouts, please reduce the scope or number of Related documents.`,
        details: {
          totalCharacters,
          maxCharacters: MAX_TOTAL_DOCUMENT_CHARACTERS,
          estimatedWords,
          primaryCharacters,
          relatedCharacters,
        },
      });
    }

    // 5. Run AI analysis through BharatCode service
    const analysisPayload: AnalysisRequest = {
      primaryDocument: {
        id: primaryDocument.id || 'doc-primary',
        title: primaryDocument.title.trim(),
        content: primaryDocument.content.trim(),
        category: primaryDocument.category,
        updatedAt: primaryDocument.updatedAt,
      },
      change: {
        primaryDocumentId: change.primaryDocumentId || primaryDocument.id || 'doc-primary',
        changeDescription: change.changeDescription.trim(),
        oldText: change.oldText ? change.oldText.trim() : undefined,
        newText: change.newText.trim(),
      },
      relatedDocuments: relatedDocuments.map((doc, index) => ({
        id: doc.id || `doc-related-${index + 1}`,
        title: doc.title.trim(),
        content: doc.content.trim(),
        category: doc.category,
        updatedAt: doc.updatedAt,
      })),
    };

    const analysisResult = await analyzeRippleEffect(analysisPayload);

    return res.status(200).json({
      status: 'success',
      data: analysisResult,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred during analysis.';
    return res.status(500).json({
      status: 'error',
      message,
    });
  }
});

export default router;

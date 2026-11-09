import { Router, Request, Response, NextFunction } from 'express';
import multer, { FileFilterCallback } from 'multer';
import { extractTextFromBuffer } from '../services/extractionService';

const router = Router();

// 10 MB maximum upload limit
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

// Use in-memory storage so uploaded files are never written to disk
const storage = multer.memoryStorage();

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const lowerName = file.originalname.toLowerCase();
  const hasValidExt =
    lowerName.endsWith('.pdf') ||
    lowerName.endsWith('.docx') ||
    lowerName.endsWith('.txt');

  if (hasValidExt) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Invalid file type. Only PDF (.pdf), Word (.docx), and Plain Text (.txt) files are supported.'
      )
    );
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1,
  },
  fileFilter,
});

/**
 * POST /api/documents/extract
 * Uploads a single document (PDF, DOCX, or TXT), extracts its text content in memory,
 * and returns metadata without saving the file or logging document content.
 */
router.post(
  '/documents/extract',
  (req: Request, res: Response, next: NextFunction) => {
    upload.single('file')(req, res, (err: unknown) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            status: 'error',
            message: 'File size exceeds the 10 MB limit. Please upload a smaller document.',
          });
        }
        return res.status(400).json({
          status: 'error',
          message: `Upload validation error: ${err.message}`,
        });
      } else if (err instanceof Error) {
        return res.status(400).json({
          status: 'error',
          message: err.message,
        });
      }
      next();
    });
  },
  async (req: Request, res: Response) => {
    try {
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({
          status: 'error',
          message: 'No file received. Please attach a valid document in the "file" field.',
        });
      }

      const result = await extractTextFromBuffer(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      return res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred during document text extraction.';

      return res.status(400).json({
        status: 'error',
        message,
      });
    }
  }
);

export default router;

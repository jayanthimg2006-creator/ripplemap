import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export interface ExtractedDocumentResult {
  filename: string;
  title: string;
  content: string;
  characterCount: number;
  wordCount: number;
  fileType: 'pdf' | 'docx' | 'txt';
}

/**
 * Derives a human-friendly document title from the uploaded filename.
 */
function deriveTitle(filename: string): string {
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  const cleanTitle = nameWithoutExt.replace(/[_-]+/g, ' ').trim();
  return cleanTitle.length > 0 ? cleanTitle : filename;
}

/**
 * Counts words by splitting across whitespace boundaries.
 */
function countWords(text: string): number {
  const matches = text.trim().match(/\S+/g);
  return matches ? matches.length : 0;
}

/**
 * Validates the file buffer header against known magic signatures.
 */
function validateBufferSignature(buffer: Buffer, fileType: 'pdf' | 'docx' | 'txt'): void {
  // Empty buffer check
  if (!buffer || buffer.length === 0) {
    throw new Error('File is empty.');
  }

  // PDF and DOCX require at least 4 bytes for valid format headers
  if ((fileType === 'pdf' || fileType === 'docx') && buffer.length < 4) {
    throw new Error('File is corrupted or too small to be a valid document.');
  }

  if (fileType === 'pdf') {
    // PDF specification allows %PDF anywhere within the first 1024 bytes
    const searchHeader = buffer.subarray(0, 1024);
    const hasPdfHeader = searchHeader.includes(Buffer.from('%PDF'));
    if (!hasPdfHeader) {
      throw new Error('Invalid PDF format: File header does not match PDF specification.');
    }
  } else if (fileType === 'docx') {
    // DOCX is a zip package starting with PK\x03\x04 (0x50, 0x4B, 0x03, 0x04)
    const isZipHeader =
      buffer[0] === 0x50 &&
      buffer[1] === 0x4b &&
      buffer[2] === 0x03 &&
      buffer[3] === 0x04;
    if (!isZipHeader) {
      throw new Error('Invalid DOCX format: File header does not match Microsoft Word document specification.');
    }
  } else if (fileType === 'txt') {
    // Plain text: Verify the first 512 bytes don't contain binary null bytes
    const sampleSize = Math.min(buffer.length, 512);
    for (let i = 0; i < sampleSize; i++) {
      if (buffer[i] === 0) {
        throw new Error('Invalid TXT format: Binary file content detected.');
      }
    }
  }
}

/**
 * Extracts plain text from an in-memory file buffer (PDF, DOCX, or TXT).
 * Processing is performed entirely locally without logging content or saving to disk.
 */
export async function extractTextFromBuffer(
  buffer: Buffer,
  filename: string,
  mimetype?: string
): Promise<ExtractedDocumentResult> {
  const lowerName = filename.toLowerCase();
  let fileType: 'pdf' | 'docx' | 'txt';

  if (lowerName.endsWith('.pdf') || mimetype === 'application/pdf') {
    fileType = 'pdf';
  } else if (
    lowerName.endsWith('.docx') ||
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    fileType = 'docx';
  } else if (lowerName.endsWith('.txt') || mimetype === 'text/plain') {
    fileType = 'txt';
  } else {
    throw new Error('Unsupported file type. Only PDF (.pdf), DOCX (.docx), and TXT (.txt) are allowed.');
  }

  // 1. Validate signature / content headers
  validateBufferSignature(buffer, fileType);

  let rawText = '';

  // 2. Perform local extraction
  if (fileType === 'txt') {
    rawText = buffer.toString('utf-8');
  } else if (fileType === 'docx') {
    try {
      const result = await mammoth.extractRawText({ buffer });
      rawText = result.value || '';
    } catch (docxError: unknown) {
      const msg = docxError instanceof Error ? docxError.message : 'Unknown DOCX parsing error';
      throw new Error(`Failed to extract text from DOCX: ${msg}`);
    }
  } else if (fileType === 'pdf') {
    try {
      const pdfData = await pdfParse(buffer);
      rawText = pdfData.text || '';
    } catch (pdfError: unknown) {
      const msg = pdfError instanceof Error ? pdfError.message : 'Unknown PDF parsing error';
      throw new Error(`Failed to parse PDF document: ${msg}`);
    }
  }

  // 3. Clean and sanitize extracted text
  const cleanedContent = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();

  // 4. Validate non-empty content and handle scanned / image-only PDFs
  if (!cleanedContent || cleanedContent.length === 0) {
    if (fileType === 'pdf') {
      throw new Error(
        'Scanned or image-only PDF detected: No selectable text could be extracted. Please upload a PDF with selectable text.'
      );
    } else {
      throw new Error(`The uploaded ${fileType.toUpperCase()} document contains no extractable text.`);
    }
  }

  return {
    filename,
    title: deriveTitle(filename),
    content: cleanedContent,
    characterCount: cleanedContent.length,
    wordCount: countWords(cleanedContent),
    fileType,
  };
}

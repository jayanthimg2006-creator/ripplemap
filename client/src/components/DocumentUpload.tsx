import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import {
  UploadCloud,
  FileText,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  RotateCcw,
  Loader2,
  ShieldCheck,
  FileCode2,
} from 'lucide-react';
import { ExtractedDocumentResult } from '../types/analysis';
import { uploadAndExtractDocument } from '../services/api';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt'];

export interface DocumentUploadProps {
  onDocumentExtracted?: (doc: ExtractedDocumentResult) => void;
}

export default function DocumentUpload({ onDocumentExtracted }: DocumentUploadProps = {}) {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedDocumentResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Client-side pre-flight file validation
   */
  const validateFile = (file: File): string | null => {
    const lowerName = file.name.toLowerCase();
    const isExtensionValid = ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));

    if (!isExtensionValid) {
      return `Unsupported file format (${file.name}). Please upload a PDF (.pdf), Word document (.docx), or Plain Text (.txt) file.`;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      return `File size (${sizeMb} MB) exceeds the 10 MB maximum limit. Please upload a smaller document.`;
    }

    if (file.size === 0) {
      return `File (${file.name}) is empty (0 bytes). Please upload a valid document with content.`;
    }

    return null;
  };

  /**
   * Core upload handler
   */
  const processUpload = async (file: File) => {
    setErrorMessage(null);
    const validationError = validateFile(file);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setCurrentFile(file);
    setIsLoading(true);

    try {
      const result = await uploadAndExtractDocument(file);
      setExtractedData(result);
      if (onDocumentExtracted) {
        onDocumentExtracted(result);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to extract text from the uploaded document.';
      setErrorMessage(msg);
      setExtractedData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processUpload(file);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processUpload(file);
    }
  };

  const handleCopyText = () => {
    if (!extractedData) return;
    navigator.clipboard.writeText(extractedData.content);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleReset = () => {
    setExtractedData(null);
    setCurrentFile(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Overview & Security Banner */}
      <section className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase font-mono tracking-wider text-cyan-400 font-semibold">
                Milestone 1 & 2 Pipeline
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5" /> In-Memory Processing
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-100">
              Document Ingestion & Text Extraction
            </h2>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-2 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
            <span>Supported:</span>
            <span className="font-mono text-cyan-300">.pdf</span>
            <span className="font-mono text-sky-300">.docx</span>
            <span className="font-mono text-indigo-300">.txt</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-300 font-medium">Max 10 MB</span>
          </div>
        </div>

        <p className="text-sm text-slate-300 mt-4 leading-relaxed">
          Upload organizational policies, service agreements, or engineering runbooks. RippleMap validates
          document structure and extracts raw text locally in-memory with zero disk persistence.
        </p>
      </section>

      {/* Error Alert Display */}
      {errorMessage && (
        <div className="bg-rose-950/40 border border-rose-800/70 rounded-2xl p-4 flex items-start justify-between gap-3 shadow-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-rose-200">Extraction Error</p>
              <p className="text-xs text-rose-300/90 leading-relaxed">{errorMessage}</p>
            </div>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 rounded bg-rose-900/30 border border-rose-800/50 hover:bg-rose-900/50 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Upload Dropzone (When no document extracted yet) */}
      {!extractedData && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isLoading && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200 cursor-pointer ${
            isDragging
              ? 'border-cyan-400 bg-cyan-950/20 shadow-xl shadow-cyan-500/10 scale-[1.005]'
              : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900/80 shadow-lg'
          } ${isLoading ? 'pointer-events-none opacity-80' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            onChange={handleFileChange}
            className="hidden"
          />

          {isLoading ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-6">
              <div className="relative">
                <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-200">
                  Extracting text from {currentFile?.name}...
                </p>
                <p className="text-xs text-slate-400">
                  Processing buffer in-memory with local parser ({currentFile ? formatFileSize(currentFile.size) : ''})
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-cyan-400 shadow-inner">
                <UploadCloud className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-200">
                  Drop your document here, or <span className="text-cyan-400 underline decoration-cyan-500/50 underline-offset-4">browse files</span>
                </p>
                <p className="text-xs text-slate-400">
                  Fast, local extraction for PDF, Word (.docx), and Plain Text (.txt) up to 10 MB
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
                  <FileText className="w-3.5 h-3.5 text-rose-400" /> PDF (.pdf)
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
                  <FileCode2 className="w-3.5 h-3.5 text-sky-400" /> Word (.docx)
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" /> Plain Text (.txt)
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Extracted Document Preview & Metadata (When extracted successfully) */}
      {extractedData && (
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-100 capitalize">
                      {extractedData.title}
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      Saved to Library
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-400">{extractedData.filename}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyText}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-all active:scale-95 shadow-sm"
                >
                  {hasCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied Text
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" /> Copy Text
                    </>
                  )}
                </button>

                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg shadow-sm transition-all active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Upload Another Document
                </button>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <span className="text-slate-500 block mb-0.5">Format</span>
                <span className="font-mono font-semibold uppercase text-cyan-300">
                  {extractedData.fileType}
                </span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <span className="text-slate-500 block mb-0.5">Word Count</span>
                <span className="font-semibold text-slate-200">
                  {extractedData.wordCount.toLocaleString()} words
                </span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <span className="text-slate-500 block mb-0.5">Character Count</span>
                <span className="font-semibold text-slate-200">
                  {extractedData.characterCount.toLocaleString()} chars
                </span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <span className="text-slate-500 block mb-0.5">Storage Mode</span>
                <span className="font-semibold text-emerald-400">In-Memory (0 Disk)</span>
              </div>
            </div>
          </div>

          {/* Extracted Text Viewer */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <h4 className="text-sm font-bold text-slate-200">Extracted Plain-Text Preview</h4>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                Ready for downstream impact analysis
              </span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed max-h-[28rem] overflow-y-auto select-text shadow-inner">
              {extractedData.content}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

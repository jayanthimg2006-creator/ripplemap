import { useState, useEffect, FormEvent } from 'react';
import {
  GitCommit,
  FileEdit,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Target,
  Link2,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  Loader2,
  X,
} from 'lucide-react';
import { UploadedDocument, ProposedChangeInput } from '../types/analysis';

const MAX_TOTAL_DOCUMENT_CHARACTERS = 50000;

export interface ProposedChangeFormProps {
  primaryDocument?: UploadedDocument;
  relatedDocuments: UploadedDocument[];
  savedChange: ProposedChangeInput | null;
  onSaveChange: (change: ProposedChangeInput) => void;
  onClearChange: () => void;
  onTriggerAnalysis?: () => void;
  isAnalyzing?: boolean;
  analysisError?: string | null;
  onClearError?: () => void;
}

export default function ProposedChangeForm({
  primaryDocument,
  relatedDocuments,
  savedChange,
  onSaveChange,
  onClearChange,
  onTriggerAnalysis,
  isAnalyzing = false,
  analysisError = null,
  onClearError,
}: ProposedChangeFormProps) {
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [oldText, setOldText] = useState<string>('');
  const [newText, setNewText] = useState<string>('');
  const [additionalContext, setAdditionalContext] = useState<string>('');

  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});
  const [isReviewOpen, setIsReviewOpen] = useState<boolean>(false);
  const [phase5MessageVisible, setPhase5MessageVisible] = useState<boolean>(false);

  // Sync state if savedChange changes externally
  useEffect(() => {
    if (savedChange) {
      setTitle(savedChange.title || '');
      setDescription(savedChange.description || '');
      setOldText(savedChange.oldText || '');
      setNewText(savedChange.newText || '');
      setAdditionalContext(savedChange.additionalContext || '');
      setIsReviewOpen(true);
    }
  }, [savedChange]);

  const hasPrimary = primaryDocument !== undefined;
  const hasRelated = relatedDocuments.length >= 1;
  const isDocumentSetupComplete = hasPrimary && hasRelated;

  const primaryChars = primaryDocument?.characterCount ?? 0;
  const relatedChars = relatedDocuments.reduce((sum, doc) => sum + (doc.characterCount ?? 0), 0);
  const totalCharacters = primaryChars + relatedChars;
  const isOverSizeLimit = totalCharacters > MAX_TOTAL_DOCUMENT_CHARACTERS;

  const validate = (): boolean => {
    const newErrors: { title?: string; description?: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Change Title is required.';
    } else if (title.trim().length < 5) {
      newErrors.title = 'Change Title must be at least 5 characters.';
    }

    if (!description.trim()) {
      newErrors.description = 'Change Description is required.';
    } else if (description.trim().length < 15) {
      newErrors.description = 'Change Description must be at least 15 characters to provide meaningful context.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setPhase5MessageVisible(false);
    if (onClearError) onClearError();

    if (validate()) {
      const changePayload: ProposedChangeInput = {
        title: title.trim(),
        description: description.trim(),
        oldText: oldText.trim() || undefined,
        newText: newText.trim() || undefined,
        additionalContext: additionalContext.trim() || undefined,
      };

      onSaveChange(changePayload);
      setIsReviewOpen(true);
    }
  };

  const handleReset = () => {
    setTitle('');
    setDescription('');
    setOldText('');
    setNewText('');
    setAdditionalContext('');
    setErrors({});
    setIsReviewOpen(false);
    setPhase5MessageVisible(false);
    if (onClearError) onClearError();
    onClearChange();
  };

  const handleLoadSample = () => {
    const samplePayload: ProposedChangeInput = {
      title: 'Shorten Telemetry and Activity Log Retention from 90 Days to 30 Days',
      description:
        'All customer telemetry, session audit logs, and transaction event records must be stored in cold storage for a maximum of 30 days, after which automated cryptographic purging is executed to comply with revised privacy regulations.',
      oldText:
        'All user activity records and transaction telemetry must be stored in secure active cold storage for a minimum period of 90 days following generation.',
      newText:
        'All user activity records and transaction telemetry must be stored in secure active cold storage for a maximum period of 30 days following generation, after which automated cryptographic purging is executed.',
      additionalContext:
        'Mandated by Corporate Legal & Compliance audit to meet revised data retention regulations (Ticket SEC-4029).',
    };

    setTitle(samplePayload.title);
    setDescription(samplePayload.description);
    setOldText(samplePayload.oldText || '');
    setNewText(samplePayload.newText || '');
    setAdditionalContext(samplePayload.additionalContext || '');
    setErrors({});
    setPhase5MessageVisible(false);
    if (onClearError) onClearError();
    onSaveChange(samplePayload);
  };

  const handleContinueToAnalysis = () => {
    if (isAnalyzing || isOverSizeLimit) return;

    // Validate again in case state was altered
    if (!validate()) {
      setIsReviewOpen(false);
      return;
    }

    const changePayload: ProposedChangeInput = {
      title: title.trim(),
      description: description.trim(),
      oldText: oldText.trim() || undefined,
      newText: newText.trim() || undefined,
      additionalContext: additionalContext.trim() || undefined,
    };
    onSaveChange(changePayload);

    if (onTriggerAnalysis) {
      onTriggerAnalysis();
    } else {
      setPhase5MessageVisible(true);
    }
  };

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <GitCommit className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-100">Proposed Change Specification</h3>
              <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Phase 3
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Formulate the proposed modification to evaluate against the assigned Primary and Related documents
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLoadSample}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-lg transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Load Example Change
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
      </div>

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Change Title (Required) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="change-title" className="text-xs font-bold text-slate-200">
              Change Title <span className="text-rose-400">*</span>
            </label>
            <span className="text-[11px] text-slate-500 font-mono">Summary headline</span>
          </div>

          <input
            id="change-title"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
            }}
            placeholder="e.g., Shorten Log and Telemetry Retention Window to 30 Days"
            className={`w-full bg-slate-950 border px-3.5 py-2.5 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition-colors ${
              errors.title
                ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/30'
                : 'border-slate-800 focus:border-cyan-500/70 focus:ring-1 focus:ring-cyan-500/30'
            }`}
          />

          {errors.title && (
            <p className="text-[11px] text-rose-400 flex items-center gap-1 pt-0.5">
              <Info className="w-3 h-3" /> {errors.title}
            </p>
          )}
        </div>

        {/* Change Description (Required) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="change-description" className="text-xs font-bold text-slate-200">
              Change Description <span className="text-rose-400">*</span>
            </label>
            <span className="text-[11px] text-slate-400 font-mono">
              {description.length} characters
            </span>
          </div>

          <textarea
            id="change-description"
            rows={3}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }));
            }}
            placeholder="e.g., Modifying active cold storage lifecycle policy to automatically purge customer session and telemetry logs at 30 days instead of 90 days for GDPR compliance."
            className={`w-full bg-slate-950 border px-3.5 py-2.5 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition-colors leading-relaxed ${
              errors.description
                ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/30'
                : 'border-slate-800 focus:border-cyan-500/70 focus:ring-1 focus:ring-cyan-500/30'
            }`}
          />

          {errors.description && (
            <p className="text-[11px] text-rose-400 flex items-center gap-1 pt-0.5">
              <Info className="w-3 h-3" /> {errors.description}
            </p>
          )}
        </div>

        {/* Optional Diff Text: Current vs. Proposed Text */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Current / Existing Text */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="old-text" className="text-xs font-bold text-slate-300">
                Current / Existing Text <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <span className="text-[10px] uppercase font-mono text-rose-400">Previous Clause</span>
            </div>

            <textarea
              id="old-text"
              rows={3}
              value={oldText}
              onChange={(e) => setOldText(e.target.value)}
              placeholder="e.g., User activity records and telemetry must be stored for a minimum period of 90 days following generation."
              className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/20 px-3.5 py-2.5 rounded-xl text-xs font-mono text-slate-300 placeholder-slate-600 focus:outline-none transition-colors leading-relaxed"
            />
          </div>

          {/* Proposed / New Text */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="new-text" className="text-xs font-bold text-slate-300">
                Proposed / New Text <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <span className="text-[10px] uppercase font-mono text-emerald-400">Replacement Clause</span>
            </div>

            <textarea
              id="new-text"
              rows={3}
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="e.g., User activity records and telemetry must be stored for a maximum period of 30 days following generation."
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 px-3.5 py-2.5 rounded-xl text-xs font-mono text-slate-300 placeholder-slate-600 focus:outline-none transition-colors leading-relaxed"
            />
            {!newText.trim() && (
              <p className="text-[10px] text-slate-500 italic">
                Optional: If omitted, the Change Description will serve as the proposed change intent for BharatCode AI.
              </p>
            )}
          </div>
        </div>

        {/* Additional Context (Optional) */}
        <div className="space-y-1.5">
          <label htmlFor="additional-context" className="text-xs font-bold text-slate-300">
            Additional Context &amp; Rationale <span className="text-slate-500 font-normal">(Optional)</span>
          </label>

          <input
            id="additional-context"
            type="text"
            value={additionalContext}
            onChange={(e) => setAdditionalContext(e.target.value)}
            placeholder="e.g., Compliance audit mandate for GDPR Article 5(1)(e) data minimization (Ticket SEC-4029)."
            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/70 focus:ring-1 focus:ring-cyan-500/30 px-3.5 py-2.5 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none transition-colors"
          />
        </div>

        {/* Form Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-slate-500">
            <span className="text-rose-400">*</span> Required fields for ripple effect evaluation
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl shadow-md shadow-cyan-600/20 transition-all active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            Review &amp; Prepare Analysis
          </button>
        </div>
      </form>

      {/* Review Section */}
      {isReviewOpen && (
        <div className="pt-6 border-t border-slate-800/80 space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileEdit className="w-4 h-4 text-cyan-400" />
              <h4 className="text-sm font-bold text-slate-100">Change Review &amp; Document Mapping</h4>
            </div>

            <button
              type="button"
              onClick={() => setIsReviewOpen(!isReviewOpen)}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
            >
              {isReviewOpen ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" /> Collapse Review
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" /> Expand Review
                </>
              )}
            </button>
          </div>

          {/* Document Mapping Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Primary Document Mapping Card */}
            <div
              className={`p-4 rounded-xl border ${
                hasPrimary
                  ? 'bg-cyan-950/20 border-cyan-500/40'
                  : 'bg-amber-950/20 border-amber-500/40'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/60 mb-2">
                <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" /> Target Primary Document
                </span>
                {hasPrimary ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    Mapped
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    Required
                  </span>
                )}
              </div>

              {hasPrimary ? (
                <div className="space-y-1">
                  <p className="font-bold text-slate-100 text-sm truncate">{primaryDocument.title}</p>
                  <p className="font-mono text-slate-400 text-[11px] truncate">{primaryDocument.filename}</p>
                  <p className="text-slate-400 text-[11px] pt-1">
                    Format: <span className="uppercase text-cyan-300 font-mono">{primaryDocument.fileType}</span> &bull;{' '}
                    {primaryDocument.wordCount.toLocaleString()} words
                  </p>
                </div>
              ) : (
                <div className="text-amber-300/90 text-[11px] space-y-1">
                  <p className="font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Missing Primary Document
                  </p>
                  <p className="text-slate-400">
                    Please assign 1 Primary Document in the Document Library above before ripple analysis.
                  </p>
                </div>
              )}
            </div>

            {/* Related Documents Mapping Card */}
            <div
              className={`p-4 rounded-xl border ${
                hasRelated
                  ? 'bg-indigo-950/20 border-indigo-500/40'
                  : 'bg-amber-950/20 border-amber-500/40'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/60 mb-2">
                <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-indigo-300 flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5" /> Related Evaluation Scope
                </span>
                {hasRelated ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                    {relatedDocuments.length} Mapped
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    Min 1 Required
                  </span>
                )}
              </div>

              {hasRelated ? (
                <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                  {relatedDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-1.5 bg-slate-950/70 border border-slate-800/80 rounded-lg text-[11px] truncate text-slate-200"
                    >
                      &bull; <span className="font-medium">{doc.title}</span>{' '}
                      <span className="text-slate-500 font-mono">({doc.wordCount} words)</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-amber-300/90 text-[11px] space-y-1">
                  <p className="font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Missing Related Documents
                  </p>
                  <p className="text-slate-400">
                    Please select at least 1 Related Document in the Document Library above to inspect consequences.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Change Review Card */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
            <div>
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-500 block mb-0.5">
                Change Title
              </span>
              <p className="text-sm font-bold text-slate-100">{title}</p>
            </div>

            <div>
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-500 block mb-0.5">
                Change Description
              </span>
              <p className="text-slate-300 leading-relaxed">{description}</p>
            </div>

            {/* Diff Preview or Intent Disclosure */}
            {(oldText || newText) ? (
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-500 block">
                  Clause Comparison Preview
                </span>

                {oldText && (
                  <div className="bg-rose-950/20 border border-rose-900/40 p-2.5 rounded-lg space-y-0.5">
                    <span className="text-[10px] uppercase font-mono font-bold text-rose-400 block">
                      - Current Text
                    </span>
                    <p className="font-mono text-[11px] text-rose-200/90 line-through decoration-rose-500/70 leading-relaxed">
                      {oldText}
                    </p>
                  </div>
                )}

                {newText ? (
                  <div className="bg-emerald-950/20 border border-emerald-900/40 p-2.5 rounded-lg space-y-0.5">
                    <span className="text-[10px] uppercase font-mono font-bold text-emerald-400 block">
                      + Proposed Text
                    </span>
                    <p className="font-mono text-[11px] text-emerald-200/90 leading-relaxed">{newText}</p>
                  </div>
                ) : (
                  <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg space-y-0.5 text-[11px] text-slate-400">
                    <span className="text-[10px] uppercase font-mono font-bold text-cyan-400 block">
                      Proposed Clause Fallback Notice
                    </span>
                    <p>
                      Proposed clause text was omitted. The Change Description will be passed to BharatCode AI as the proposed change intent for evaluation.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="pt-2 border-t border-slate-800/80 bg-slate-900/60 border border-slate-800 p-3 rounded-lg space-y-0.5 text-[11px] text-slate-400">
                <span className="text-[10px] uppercase font-mono font-bold text-cyan-400 block">
                  Proposed Intent Fallback Active
                </span>
                <p>
                  No specific clause diff was provided. BharatCode AI will evaluate consequence ripples based on the Change Description.
                </p>
              </div>
            )}

            {additionalContext && (
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-500 block mb-0.5">
                  Context / Rationale
                </span>
                <p className="text-slate-400 text-[11px]">{additionalContext}</p>
              </div>
            )}
          </div>

          {/* Analysis Error Alert */}
          {analysisError && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/60 text-rose-200 text-xs flex items-start justify-between gap-3 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-rose-200">BharatCode AI Analysis Failed</p>
                  <p className="text-rose-300/90 leading-relaxed">{analysisError}</p>
                </div>
              </div>
              {onClearError && (
                <button
                  type="button"
                  onClick={onClearError}
                  className="text-rose-400 hover:text-rose-200 text-xs p-1 rounded hover:bg-rose-900/30"
                  aria-label="Dismiss error"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Live Analysis Progress Notice */}
          {isAnalyzing && (
            <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/50 text-cyan-200 text-xs flex items-center gap-3 animate-pulse">
              <Loader2 className="w-5 h-5 text-cyan-400 animate-spin flex-shrink-0" />
              <div className="space-y-0.5">
                <p className="font-bold text-slate-100">Connecting to BharatCode AI (qwen-3.8-27b)...</p>
                <p className="text-slate-300">
                  Evaluating cascading consequences across {relatedDocuments.length} related documents. This usually takes 5-15 seconds.
                </p>
              </div>
            </div>
          )}

          {/* Phase 5 Notice Display (Triggered only when no external handler is plugged) */}
          {phase5MessageVisible && !onTriggerAnalysis && (
            <div
              className={`p-4 rounded-xl border text-xs space-y-2 animate-in fade-in duration-200 ${
                isDocumentSetupComplete
                  ? 'bg-cyan-950/30 border-cyan-500/50 text-cyan-200'
                  : 'bg-amber-950/30 border-amber-500/50 text-amber-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <h5 className="font-bold text-sm">
                  {isDocumentSetupComplete
                    ? 'Specification Validated'
                    : 'Action Required: Incomplete Document Setup'}
                </h5>
              </div>

              {isDocumentSetupComplete ? (
                <p className="text-slate-300 leading-relaxed">
                  Your proposed change <strong>&ldquo;{title}&rdquo;</strong> and document mapping (
                  <span className="text-cyan-300 font-semibold">1 Primary</span> &bull;{' '}
                  <span className="text-indigo-300 font-semibold">{relatedDocuments.length} Related</span>) are verified
                  and ready for consequence evaluation.
                </p>
              ) : (
                <p className="text-amber-300/90 leading-relaxed">
                  RippleMap requires exactly <strong>1 Primary Document</strong> and at least{' '}
                  <strong>1 Related Document</strong> before proceeding to ripple analysis. Please return to the Document
                  Library above and assign the necessary roles.
                </p>
              )}
            </div>
          )}

          {/* Document Size Limit Warning */}
          {isOverSizeLimit && (
            <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>
                Document payload exceeds the 50,000-character safety limit ({totalCharacters.toLocaleString()} / 50,000 chars).
                Please unassign or reduce Related documents to proceed with AI analysis.
              </span>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="space-y-1 text-xs">
              <div>
                {isDocumentSetupComplete ? (
                  isOverSizeLimit ? (
                    <span className="text-rose-400 font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" /> Payload size limit exceeded
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Ready for BharatCode AI analysis
                    </span>
                  )
                ) : (
                  <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> 1 Primary &amp; &ge;1 Related document required
                  </span>
                )}
              </div>

              {/* Live Payload Size Indicator */}
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                <span>Payload:</span>
                <span
                  className={
                    isOverSizeLimit
                      ? 'text-rose-400 font-bold'
                      : totalCharacters > 40000
                      ? 'text-amber-300 font-semibold'
                      : 'text-cyan-300 font-medium'
                  }
                >
                  {totalCharacters.toLocaleString()} / 50,000 chars
                </span>
                {totalCharacters > 0 && (
                  <span className="text-slate-500 font-sans">
                    (~{Math.round(totalCharacters / 6).toLocaleString()} words)
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleContinueToAnalysis}
              disabled={isAnalyzing || !isDocumentSetupComplete || isOverSizeLimit}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Evaluating Consequence Ripple...</span>
                </>
              ) : (
                <>
                  <span>Continue to Analysis</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

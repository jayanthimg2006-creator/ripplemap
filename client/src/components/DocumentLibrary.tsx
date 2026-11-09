import { useState } from 'react';
import {
  Files,
  FileText,
  FileCode2,
  Trash2,
  Eye,
  Copy,
  Check,
  X,
  ShieldCheck,
  Clock,
  Target,
  Link2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { UploadedDocument, DocumentRole } from '../types/analysis';

export interface DocumentLibraryProps {
  documents: UploadedDocument[];
  onRemoveDocument: (id: string) => void;
  onSetDocumentRole: (id: string, role: DocumentRole) => void;
}

export default function DocumentLibrary({
  documents,
  onRemoveDocument,
  onSetDocumentRole,
}: DocumentLibraryProps) {
  const [previewDoc, setPreviewDoc] = useState<UploadedDocument | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const primaryDoc = documents.find((d) => d.role === 'primary');
  const relatedDocs = documents.filter((d) => d.role === 'related');
  const unassignedDocs = documents.filter((d) => d.role === 'unassigned');

  const hasPrimary = primaryDoc !== undefined;
  const hasRelated = relatedDocs.length >= 1;
  const isReady = hasPrimary && hasRelated;

  const getFormatBadge = (fileType: 'pdf' | 'docx' | 'txt') => {
    switch (fileType) {
      case 'pdf':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <FileText className="w-3 h-3 text-rose-400" /> PDF
          </span>
        );
      case 'docx':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-sky-500/15 text-sky-300 border border-sky-500/30">
            <FileCode2 className="w-3 h-3 text-sky-400" /> DOCX
          </span>
        );
      case 'txt':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            <FileText className="w-3 h-3 text-indigo-400" /> TXT
          </span>
        );
    }
  };

  const getRoleBadge = (role: DocumentRole) => {
    switch (role) {
      case 'primary':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10">
            <Target className="w-3 h-3 text-cyan-400" /> Primary Document
          </span>
        );
      case 'related':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm shadow-indigo-500/10">
            <Link2 className="w-3 h-3 text-indigo-400" /> Related Document
          </span>
        );
      case 'unassigned':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
            Unassigned
          </span>
        );
    }
  };

  const formatTime = (isoString: string): string => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <section className="space-y-6">
      {/* Document Roles & Readiness Overview Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Files className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100">Document Library &amp; Role Setup</h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  {documents.length} {documents.length === 1 ? 'Document' : 'Documents'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Assign 1 Primary Document (change source) and at least 1 Related Document (consequence targets)
              </p>
            </div>
          </div>

          {/* Readiness Status Indicator */}
          <div>
            {documents.length === 0 ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-500" /> In-Memory Session
              </span>
            ) : isReady ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-500/10">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Ready for Analysis: 1 Primary &bull; {relatedDocs.length} Related
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Setup Incomplete: {hasPrimary ? '1' : '0'} Primary &bull; {relatedDocs.length} Related
              </span>
            )}
          </div>
        </div>

        {/* Roles Distribution Cards (Only when documents are uploaded) */}
        {documents.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Primary Document Summary Card */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                hasPrimary
                  ? 'bg-cyan-950/20 border-cyan-500/40 shadow-sm'
                  : 'bg-slate-950/40 border-slate-800/80 border-dashed'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/60 mb-2">
                <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" /> Primary Document (1 Required)
                </span>
                {hasPrimary && (
                  <button
                    onClick={() => onSetDocumentRole(primaryDoc.id, 'unassigned')}
                    className="text-[10px] text-slate-400 hover:text-slate-200 underline"
                  >
                    Unassign
                  </button>
                )}
              </div>

              {hasPrimary ? (
                <div className="space-y-1">
                  <p className="font-bold text-slate-100 text-sm truncate" title={primaryDoc.title}>
                    {primaryDoc.title}
                  </p>
                  <p className="font-mono text-slate-400 text-[11px] truncate">{primaryDoc.filename}</p>
                  <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                    {getFormatBadge(primaryDoc.fileType)}
                    <span>{primaryDoc.wordCount.toLocaleString()} words</span>
                  </div>
                </div>
              ) : (
                <div className="text-slate-400 space-y-1 py-1">
                  <p className="font-medium text-slate-300">No Primary Document Selected</p>
                  <p className="text-[11px] text-slate-400">
                    Click &ldquo;Set as Primary&rdquo; on the document that will contain the proposed policy/code revision.
                  </p>
                </div>
              )}
            </div>

            {/* Related Documents Summary Card */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                hasRelated
                  ? 'bg-indigo-950/20 border-indigo-500/40 shadow-sm'
                  : 'bg-slate-950/40 border-slate-800/80 border-dashed'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/60 mb-2">
                <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-indigo-300 flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5" /> Related Documents ({relatedDocs.length} Assigned)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Min 1</span>
              </div>

              {hasRelated ? (
                <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                  {relatedDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between gap-2 p-1.5 bg-slate-950/70 border border-slate-800/80 rounded-lg text-[11px]"
                    >
                      <span className="font-medium text-slate-200 truncate" title={doc.title}>
                        {doc.title}
                      </span>
                      <button
                        onClick={() => onSetDocumentRole(doc.id, 'unassigned')}
                        title="Remove from related"
                        className="text-slate-500 hover:text-slate-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-400 space-y-1 py-1">
                  <p className="font-medium text-slate-300">No Related Documents Selected</p>
                  <p className="text-[11px] text-slate-400">
                    Click &ldquo;Add to Related&rdquo; on downstream contracts, SLAs, or runbooks to inspect.
                  </p>
                </div>
              )}
            </div>

            {/* Unassigned / Setup Guidance Card */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 flex flex-col justify-between">
              <div className="pb-2 border-b border-slate-800/60 mb-2 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Files className="w-3.5 h-3.5" /> Unassigned Pool
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                  {unassignedDocs.length}
                </span>
              </div>

              <div className="text-[11px] text-slate-300 space-y-1.5">
                {isReady ? (
                  <p className="text-emerald-300/90 leading-relaxed">
                    &bull; Role setup is complete. Changes to <strong>{primaryDoc?.title}</strong> will ripple across {relatedDocs.length} downstream documents.
                  </p>
                ) : (
                  <p className="text-amber-300/90 leading-relaxed">
                    {!hasPrimary && !hasRelated && '&bull; Select 1 Primary and at least 1 Related Document.'}
                    {!hasPrimary && hasRelated && '&bull; Select 1 Primary Document to trigger the ripple cascade.'}
                    {hasPrimary && !hasRelated && '&bull; Select at least 1 Related Document to evaluate consequences.'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Empty State (When no documents uploaded yet) */}
      {documents.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 border-dashed rounded-2xl p-8 text-center space-y-2">
          <div className="h-12 w-12 rounded-xl bg-slate-800/60 flex items-center justify-center mx-auto text-slate-500">
            <Files className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-300">Your Document Library is Empty</p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Upload PDF, Word (.docx), or Plain Text (.txt) documents using the upload dropzone above.
            Extracted files will be collected here and can be assigned as Primary or Related documents.
          </p>
        </div>
      ) : (
        /* Document Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => {
            const isPrimary = doc.role === 'primary';
            const isRelated = doc.role === 'related';

            return (
              <div
                key={doc.id}
                className={`rounded-2xl p-5 shadow-lg space-y-4 transition-all flex flex-col justify-between border ${
                  isPrimary
                    ? 'border-cyan-500/70 bg-gradient-to-b from-cyan-950/20 via-slate-900 to-slate-900 ring-1 ring-cyan-500/40 shadow-cyan-500/10'
                    : isRelated
                    ? 'border-indigo-500/60 bg-gradient-to-b from-indigo-950/20 via-slate-900 to-slate-900 ring-1 ring-indigo-500/30'
                    : 'border-slate-800 bg-slate-900/90 hover:border-slate-700/80'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Bar: Role Badge, Format Pill, Delete Action */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {getRoleBadge(doc.role)}
                      {getFormatBadge(doc.fileType)}
                    </div>

                    <button
                      onClick={() => onRemoveDocument(doc.id)}
                      title="Remove document from workspace"
                      className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-950/40 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Document Title & Filename */}
                  <div>
                    <h4
                      className="text-sm font-bold text-slate-100 capitalize truncate"
                      title={doc.title}
                    >
                      {doc.title}
                    </h4>
                    <p className="text-xs font-mono text-slate-400 truncate" title={doc.filename}>
                      {doc.filename}
                    </p>
                  </div>

                  {/* Document Statistics */}
                  <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                    <span className="font-semibold text-slate-300">
                      {doc.wordCount.toLocaleString()} <span className="text-slate-500 font-normal">words</span>
                    </span>
                    <span className="text-slate-700">&bull;</span>
                    <span className="font-semibold text-slate-300">
                      {doc.characterCount.toLocaleString()} <span className="text-slate-500 font-normal">chars</span>
                    </span>
                    {doc.uploadedAt && (
                      <>
                        <span className="text-slate-700">&bull;</span>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono ml-auto">
                          <Clock className="w-2.5 h-2.5" /> {formatTime(doc.uploadedAt)}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions Section */}
                <div className="space-y-2 pt-3 border-t border-slate-800/80">
                  {/* Role Assignment Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {/* Primary Button */}
                    <button
                      onClick={() =>
                        onSetDocumentRole(doc.id, isPrimary ? 'unassigned' : 'primary')
                      }
                      className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-medium transition-all text-[11px] ${
                        isPrimary
                          ? 'bg-cyan-600 text-white shadow-sm ring-1 ring-cyan-400'
                          : 'bg-slate-800/80 hover:bg-cyan-950/40 text-slate-300 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/40'
                      }`}
                    >
                      <Target className="w-3 h-3" />
                      {isPrimary ? 'Primary (Active)' : 'Set as Primary'}
                    </button>

                    {/* Related Button */}
                    <button
                      onClick={() =>
                        onSetDocumentRole(doc.id, isRelated ? 'unassigned' : 'related')
                      }
                      className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-medium transition-all text-[11px] ${
                        isRelated
                          ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400'
                          : 'bg-slate-800/80 hover:bg-indigo-950/40 text-slate-300 hover:text-indigo-300 border border-slate-700 hover:border-indigo-500/40'
                      }`}
                    >
                      <Link2 className="w-3 h-3" />
                      {isRelated ? 'Related (Active)' : 'Add to Related'}
                    </button>
                  </div>

                  {/* Secondary Actions: Preview & Unassign */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-medium text-slate-300 hover:text-cyan-200 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      Preview Text
                    </button>

                    {(isPrimary || isRelated) && (
                      <button
                        onClick={() => onSetDocumentRole(doc.id, 'unassigned')}
                        title="Reset document role to unassigned"
                        className="py-1.5 px-2.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Preview Dialog */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/80">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-slate-100 capitalize">
                      {previewDoc.title}
                    </h3>
                    {getRoleBadge(previewDoc.role)}
                    {getFormatBadge(previewDoc.fileType)}
                  </div>
                  <p className="text-xs font-mono text-slate-400">{previewDoc.filename}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyText(previewDoc.content, previewDoc.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-all active:scale-95 shadow-sm"
                >
                  {copiedId === previewDoc.id ? (
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
                  onClick={() => setPreviewDoc(null)}
                  className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Metrics Bar */}
            <div className="grid grid-cols-4 gap-2 px-5 py-2.5 bg-slate-950/50 border-b border-slate-800/80 text-xs">
              <div>
                <span className="text-slate-500 text-[10px] block uppercase font-mono">Role</span>
                <span className="font-semibold capitalize text-slate-200">{previewDoc.role}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block uppercase font-mono">Word Count</span>
                <span className="font-semibold text-slate-200">{previewDoc.wordCount.toLocaleString()} words</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block uppercase font-mono">Character Count</span>
                <span className="font-semibold text-slate-200">{previewDoc.characterCount.toLocaleString()} chars</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block uppercase font-mono">Format</span>
                <span className="font-semibold uppercase text-cyan-300 font-mono">{previewDoc.fileType}</span>
              </div>
            </div>

            {/* Modal Scrollable Text Content */}
            <div className="p-5 flex-1 overflow-y-auto">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed select-text shadow-inner max-h-[50vh] overflow-y-auto">
                {previewDoc.content}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-900/60">
              <span className="text-xs text-slate-500">
                Extracted in-memory &bull; ID: <span className="font-mono text-slate-400">{previewDoc.id}</span>
              </span>
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

import { useState, useEffect } from 'react';
import {
  samplePrimaryDocument,
  sampleChange,
  sampleRelatedDocuments,
  sampleAnalysisResult,
} from './data/mockData';
import {
  Layers,
  FileText,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  ChevronRight,
  Zap,
  Info,
  GitCommit,
  UploadCloud,
  X,
} from 'lucide-react';
import DocumentUpload from './components/DocumentUpload';
import DocumentLibrary from './components/DocumentLibrary';
import ProposedChangeForm from './components/ProposedChangeForm';
import { analyzeDocuments } from './services/api';
import { loadSessionState, saveSessionState } from './utils/sessionStorage';
import {
  UploadedDocument,
  ExtractedDocumentResult,
  DocumentRole,
  ProposedChangeInput,
  DocumentItem,
  DocumentChange,
  AnalysisRequest,
  AnalysisResult,
} from './types/analysis';

export default function App() {
  // Load saved session snapshot on initial mount
  const [initialSession] = useState(() => loadSessionState());

  const [activeMode, setActiveMode] = useState<'dashboard' | 'upload'>(
    () => initialSession?.activeMode ?? 'dashboard'
  );
  const [selectedDocId, setSelectedDocId] = useState<string>(() => {
    if (initialSession?.selectedDocId) {
      return initialSession.selectedDocId;
    }
    return sampleRelatedDocuments[0].id;
  });
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // In-memory document library collection
  const [documents, setDocuments] = useState<UploadedDocument[]>(
    () => initialSession?.documents ?? []
  );

  // Proposed change state
  const [proposedChange, setProposedChange] = useState<ProposedChangeInput | null>(
    () => initialSession?.proposedChange ?? null
  );

  // Phase 5: Real AI Analysis State (Connecting to BharatCode AI)
  const [customAnalysisResult, setCustomAnalysisResult] = useState<AnalysisResult | null>(
    () => initialSession?.customAnalysisResult ?? null
  );
  const [customPrimaryDoc, setCustomPrimaryDoc] = useState<DocumentItem | null>(
    () => initialSession?.customPrimaryDoc ?? null
  );
  const [customProposedChange, setCustomProposedChange] = useState<DocumentChange | null>(
    () => initialSession?.customProposedChange ?? null
  );
  const [customRelatedDocs, setCustomRelatedDocs] = useState<DocumentItem[]>(
    () => initialSession?.customRelatedDocs ?? []
  );
  const [isNewTextFallback, setIsNewTextFallback] = useState<boolean>(
    () => initialSession?.isNewTextFallback ?? false
  );
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [activeScenario, setActiveScenario] = useState<'demo' | 'custom'>(
    () => initialSession?.activeScenario ?? 'demo'
  );

  // Synchronize state changes to sessionStorage (survives accidental page refresh)
  useEffect(() => {
    saveSessionState({
      documents,
      proposedChange,
      customAnalysisResult,
      customPrimaryDoc,
      customProposedChange,
      customRelatedDocs,
      isNewTextFallback,
      activeScenario,
      activeMode,
      selectedDocId,
    });
  }, [
    documents,
    proposedChange,
    customAnalysisResult,
    customPrimaryDoc,
    customProposedChange,
    customRelatedDocs,
    isNewTextFallback,
    activeScenario,
    activeMode,
    selectedDocId,
  ]);

  const primaryDocument = documents.find((d) => d.role === 'primary');
  const relatedDocuments = documents.filter((d) => d.role === 'related');

  const handleDocumentExtracted = (extracted: ExtractedDocumentResult) => {
    setDocuments((prevDocs) => {
      // Guard against duplicate additions from accidental repeated callback executions
      const isDuplicate = prevDocs.some(
        (doc) =>
          doc.filename === extracted.filename &&
          doc.characterCount === extracted.characterCount &&
          doc.content === extracted.content
      );

      if (isDuplicate) {
        return prevDocs;
      }

      const newDoc: UploadedDocument = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        filename: extracted.filename,
        title: extracted.title,
        content: extracted.content,
        characterCount: extracted.characterCount,
        wordCount: extracted.wordCount,
        fileType: extracted.fileType,
        uploadedAt: new Date().toISOString(),
        role: 'unassigned',
      };

      return [...prevDocs, newDoc];
    });
  };

  const handleRemoveDocument = (id: string) => {
    setDocuments((prevDocs) => prevDocs.filter((doc) => doc.id !== id));
  };

  const handleSetDocumentRole = (id: string, role: DocumentRole) => {
    setDocuments((prevDocs) =>
      prevDocs.map((doc) => {
        if (doc.id === id) {
          return { ...doc, role };
        }
        // Rule: Exactly one document can be Primary.
        // If a new Primary Document is selected, the previous Primary Document automatically becomes Unassigned.
        if (role === 'primary' && doc.role === 'primary') {
          return { ...doc, role: 'unassigned' };
        }
        return doc;
      })
    );
  };

  // Trigger BharatCode AI Ripple Analysis
  const handleRunAnalysis = async () => {
    if (!primaryDocument) {
      setAnalysisError('Please assign 1 Primary Document in the Document Library before proceeding to analysis.');
      return;
    }
    if (relatedDocuments.length === 0) {
      setAnalysisError('Please select at least 1 Related Document in the Document Library before proceeding to analysis.');
      return;
    }
    if (!proposedChange || !proposedChange.title.trim() || !proposedChange.description.trim()) {
      setAnalysisError('Please provide a Change Title and Description in the Proposed Change form.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      // Backend requires non-empty newText. If omitted, safely fallback to Change Description with disclosure.
      const fallbackActive = !proposedChange.newText || !proposedChange.newText.trim();
      const resolvedNewText = fallbackActive
        ? proposedChange.description.trim()
        : proposedChange.newText!.trim();

      const payload: AnalysisRequest = {
        primaryDocument: {
          id: primaryDocument.id,
          title: primaryDocument.title,
          content: primaryDocument.content,
          category: primaryDocument.fileType.toUpperCase(),
          updatedAt: primaryDocument.uploadedAt,
        },
        change: {
          primaryDocumentId: primaryDocument.id,
          changeDescription: proposedChange.description.trim(),
          oldText: proposedChange.oldText?.trim() || undefined,
          newText: resolvedNewText,
        },
        relatedDocuments: relatedDocuments.map((doc) => ({
          id: doc.id,
          title: doc.title,
          content: doc.content,
          category: doc.fileType.toUpperCase(),
          updatedAt: doc.uploadedAt,
        })),
      };

      const result = await analyzeDocuments(payload);

      const primaryDocItem: DocumentItem = {
        id: primaryDocument.id,
        title: primaryDocument.title,
        content: primaryDocument.content,
        category: primaryDocument.fileType.toUpperCase(),
        updatedAt: primaryDocument.uploadedAt,
      };

      const changeItem: DocumentChange = {
        primaryDocumentId: primaryDocument.id,
        changeDescription: proposedChange.description.trim(),
        oldText: proposedChange.oldText?.trim() || undefined,
        newText: resolvedNewText,
      };

      const relatedDocItems: DocumentItem[] = relatedDocuments.map((doc) => ({
        id: doc.id,
        title: doc.title,
        content: doc.content,
        category: doc.fileType.toUpperCase(),
        updatedAt: doc.uploadedAt,
      }));

      setCustomAnalysisResult(result);
      setCustomPrimaryDoc(primaryDocItem);
      setCustomProposedChange(changeItem);
      setCustomRelatedDocs(relatedDocItems);
      setIsNewTextFallback(fallbackActive);

      // Transition scenario to custom AI and switch to dashboard mode
      setActiveScenario('custom');
      setActiveMode('dashboard');
      setSelectedDocId(relatedDocItems[0]?.id || '');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Analysis failed. Please check connection to BharatCode AI.';
      setAnalysisError(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Re-run analysis or simulate
  const handleReanalyze = () => {
    if (activeScenario === 'custom' && customAnalysisResult) {
      handleRunAnalysis();
    } else {
      setIsSimulating(true);
      setTimeout(() => {
        setIsSimulating(false);
      }, 600);
    }
  };

  // Resolved active scenario data
  const isCustomActive = activeScenario === 'custom' && customAnalysisResult !== null;

  const currentPrimaryDoc: DocumentItem =
    isCustomActive && customPrimaryDoc ? customPrimaryDoc : samplePrimaryDocument;

  const currentChange: DocumentChange =
    isCustomActive && customProposedChange ? customProposedChange : sampleChange;

  const currentRelatedDocs: DocumentItem[] =
    isCustomActive && customRelatedDocs.length > 0
      ? customRelatedDocs
      : sampleRelatedDocuments;

  const currentAnalysis: AnalysisResult =
    isCustomActive && customAnalysisResult ? customAnalysisResult : sampleAnalysisResult;

  const activeDoc =
    currentRelatedDocs.find((d) => d.id === selectedDocId) || currentRelatedDocs[0];

  // Helper matching functions that match by id OR by title (resilient to LLM formatting)
  const activeImpact = currentAnalysis.impacts.find(
    (i) =>
      i.documentId === activeDoc?.id ||
      (i.documentTitle && activeDoc && i.documentTitle.toLowerCase() === activeDoc.title.toLowerCase()) ||
      (i.documentId && activeDoc && i.documentId.toLowerCase() === activeDoc.title.toLowerCase())
  );

  // Defensive normalization for affectedSections to prevent runtime crashes from malformed AI output
  const safeAffectedSections: string[] = Array.isArray(activeImpact?.affectedSections)
    ? activeImpact.affectedSections
        .filter((sec): sec is string => typeof sec === 'string' && sec.trim().length > 0)
        .map((sec) => sec.trim())
    : typeof activeImpact?.affectedSections === 'string' && (activeImpact.affectedSections as string).trim().length > 0
    ? [(activeImpact.affectedSections as string).trim()]
    : [];

  const activeConflict = currentAnalysis.conflicts.find(
    (c) =>
      c.documentId === activeDoc?.id ||
      (c.documentTitle && activeDoc && c.documentTitle.toLowerCase() === activeDoc.title.toLowerCase()) ||
      (c.documentId && activeDoc && c.documentId.toLowerCase() === activeDoc.title.toLowerCase())
  );

  const activeSuggestion = currentAnalysis.suggestions.find(
    (s) =>
      s.documentId === activeDoc?.id ||
      (s.documentTitle && activeDoc && s.documentTitle.toLowerCase() === activeDoc.title.toLowerCase()) ||
      (s.documentId && activeDoc && s.documentId.toLowerCase() === activeDoc.title.toLowerCase())
  );

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getSeverityBadge = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <ShieldAlert className="w-3 h-3" /> High Severity
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3" /> Medium Severity
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30">
            <Info className="w-3 h-3" /> Low Severity
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur sticky top-0 z-20 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-300 via-sky-200 to-indigo-300 bg-clip-text text-transparent">
                  RippleMap
                </span>
                <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {isCustomActive ? 'Live AI' : 'v1.0 Demo'}
                </span>
              </div>
              <p className="text-xs text-slate-400 italic">
                &ldquo;One change. Every consequence.&rdquo;
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 rounded-full text-xs font-medium">
              <Zap className="w-3.5 h-3.5 text-indigo-400" /> BharatCode Build League
            </div>

            {activeMode === 'dashboard' && (
              <button
                onClick={handleReanalyze}
                disabled={isSimulating || isAnalyzing}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg shadow-sm transition-all active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSimulating || isAnalyzing ? 'animate-spin' : ''}`} />
                {isAnalyzing
                  ? 'Analyzing with AI...'
                  : isCustomActive
                  ? 'Re-run AI Analysis'
                  : 'Re-analyze Ripple'}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mode Switcher Navigation */}
      <nav className="border-b border-slate-800/80 bg-slate-900/40 px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs">
            <button
              onClick={() => setActiveMode('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                activeMode === 'dashboard'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Impact Analysis Dashboard</span>
              {customAnalysisResult && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/50">
                  AI
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveMode('upload')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                activeMode === 'upload'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload &amp; Configure Analysis</span>
              {documents.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-200 border border-cyan-700/60 shadow-sm">
                  {documents.length}
                </span>
              )}
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
            {activeMode === 'dashboard' ? (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {isCustomActive
                  ? 'BharatCode AI Real-Time Analysis'
                  : 'Interactive Policy Demonstration'}
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                Multi-Document Ingestion &amp; Role Mapping
              </span>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {activeMode === 'dashboard' ? (
          <>
            {/* Dashboard Analysis Error Banner */}
            {analysisError && (
              <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/60 text-rose-200 text-xs flex items-start justify-between gap-3 shadow-lg animate-in fade-in">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-rose-200">Analysis Error</p>
                    <p className="text-rose-300/90 leading-relaxed">{analysisError}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAnalysisError(null)}
                  className="text-rose-400 hover:text-rose-200 text-xs p-1 rounded-lg hover:bg-rose-900/40 transition-colors"
                  aria-label="Dismiss analysis error"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Scenario Switcher Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-2xl shadow-md">
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                  Scenario
                </span>
                <span className="text-xs font-semibold text-slate-200">
                  {isCustomActive ? (
                    <span className="flex items-center gap-1.5 text-cyan-300">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      Live Custom Analysis &bull; BharatCode AI (qwen-3.8-27b)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-indigo-300">
                      <Layers className="w-3.5 h-3.5 text-indigo-400" />
                      Interactive Demo Policy Scenario &bull; Retention Window Reduction
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800/80 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setActiveScenario('demo');
                    setSelectedDocId(sampleRelatedDocuments[0].id);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                    !isCustomActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-3 h-3" />
                  Demo Policy (90d &rarr; 30d)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (customAnalysisResult) {
                      setActiveScenario('custom');
                      setSelectedDocId(customRelatedDocs[0]?.id || '');
                    } else {
                      setActiveMode('upload');
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                    isCustomActive
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                  {customAnalysisResult ? 'Custom AI Analysis' : '+ Run Custom AI Analysis'}
                </button>
              </div>
            </div>

            {/* Executive Impact Summary Banner */}
            <section className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs uppercase font-mono tracking-wider text-slate-400 font-semibold">
                      Executive Impact Analysis
                    </span>
                    {getSeverityBadge(currentAnalysis.overallSeverity)}
                    {isCustomActive && (
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        qwen-3.8-27b
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-slate-100">
                    {isCustomActive
                      ? proposedChange?.title || 'Cascading Impact of Proposed Change'
                      : 'Cascading Impact of Data Retention Policy Revision'}
                  </h2>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
                  <ClockIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    Evaluated: {new Date(currentAnalysis.analyzedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <p className="text-sm text-slate-300 mt-4 leading-relaxed max-w-4xl">
                {currentAnalysis.summary}
              </p>

              {/* Quick Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800/60 text-xs">
                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">
                  <span className="text-slate-500 block">Primary Change</span>
                  <span className="font-semibold text-cyan-300 truncate block">
                    {isCustomActive
                      ? currentChange.oldText
                        ? 'Clause Revision'
                        : 'Policy Modification'
                      : '90 Days \u2192 30 Days'}
                  </span>
                </div>
                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">
                  <span className="text-slate-500 block">Related Documents</span>
                  <span className="font-semibold text-slate-200">
                    {currentRelatedDocs.length} Documents Evaluated
                  </span>
                </div>
                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">
                  <span className="text-slate-500 block">Direct Conflicts</span>
                  <span className="font-semibold text-rose-400">
                    {currentAnalysis.conflicts.length} Incompatibilities
                  </span>
                </div>
                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">
                  <span className="text-slate-500 block">Revision Suggestions</span>
                  <span className="font-semibold text-emerald-400">
                    {currentAnalysis.suggestions.length} Evidence-backed
                  </span>
                </div>
              </div>
            </section>

            {/* 2-Column Split Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Primary Document & Change (The Trigger) */}
              <div className="lg:col-span-5 space-y-6">
                {/* Primary Document Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-cyan-400" />
                      <h3 className="text-sm font-bold text-slate-200">Primary Source Document</h3>
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {currentPrimaryDoc.category || 'Primary'}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-cyan-300 truncate">
                    {currentPrimaryDoc.title}
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed max-h-44 overflow-y-auto">
                    {currentPrimaryDoc.content}
                  </div>
                </div>

                {/* Proposed Change Diff Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
                  <div className="flex items-center gap-2">
                    <GitCommit className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-bold text-slate-200">Proposed Change Inspection</h3>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{currentChange.changeDescription}</p>

                  <div className="space-y-2.5 text-xs">
                    {currentChange.oldText && (
                      <div className="bg-rose-950/30 border border-rose-900/50 p-3 rounded-xl text-rose-200/90 space-y-1">
                        <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-rose-400 block">
                          - Previous Policy Text
                        </span>
                        <p className="font-mono text-[11px] line-through decoration-rose-500/70 leading-relaxed">
                          {currentChange.oldText}
                        </p>
                      </div>
                    )}

                    {isCustomActive && isNewTextFallback ? (
                      <div className="bg-cyan-950/30 border border-cyan-800/50 p-3 rounded-xl text-cyan-200/90 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-cyan-400 block">
                            + Proposed Intent (Evaluated by AI)
                          </span>
                          <span className="text-[10px] font-mono text-cyan-300 bg-cyan-900/50 px-2 py-0.5 rounded border border-cyan-700/50">
                            Derived from Description
                          </span>
                        </div>
                        <p className="font-mono text-[11px] leading-relaxed">{currentChange.newText}</p>
                        <p className="text-[10px] text-slate-400 italic pt-1">
                          * Note: Replacement clause was omitted; AI evaluated consequences based on the proposed description.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-emerald-950/30 border border-emerald-900/50 p-3 rounded-xl text-emerald-200/90 space-y-1">
                        <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-emerald-400 block">
                          + Proposed Policy Text
                        </span>
                        <p className="font-mono text-[11px] leading-relaxed">{currentChange.newText}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Interactive Related Documents Selector */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-200">Related Impacted Documents</h3>
                    <span className="text-xs text-slate-500">Select to inspect consequences</span>
                  </div>

                  <div className="space-y-2">
                    {currentRelatedDocs.map((doc) => {
                      const impact = currentAnalysis.impacts.find(
                        (i) =>
                          i.documentId === doc.id ||
                          (i.documentTitle && i.documentTitle.toLowerCase() === doc.title.toLowerCase()) ||
                          (i.documentId && i.documentId.toLowerCase() === doc.title.toLowerCase())
                      );
                      const isSelected = activeDoc?.id === doc.id;

                      return (
                        <button
                          key={doc.id}
                          onClick={() => setSelectedDocId(doc.id)}
                          className={`w-full text-left p-3.5 rounded-xl border transition-all duration-150 flex items-center justify-between ${
                            isSelected
                              ? 'bg-slate-800 border-cyan-500/50 shadow-md ring-1 ring-cyan-500/30'
                              : 'bg-slate-950/70 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                          }`}
                        >
                          <div className="space-y-1 min-w-0 pr-2">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-semibold text-slate-200 truncate">
                                {doc.title}
                              </p>
                              {doc.category && (
                                <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                                  {doc.category}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 line-clamp-1">
                              {impact?.impactSummary || 'Document evaluated in ripple cascade.'}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {impact && getSeverityBadge(impact.severity)}
                            <ChevronRight
                              className={`w-4 h-4 text-slate-500 transition-transform ${
                                isSelected ? 'translate-x-0.5 text-cyan-400' : ''
                              }`}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Ripple Consequences, Conflict, & Suggested Revision */}
              <div className="lg:col-span-7 space-y-6">
                {/* Visual Ripple Cascade Header */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <h3 className="text-sm font-bold text-slate-200">
                        Consequence Inspector:{' '}
                        <span className="text-cyan-300 font-semibold">{activeDoc?.title || 'Selected Document'}</span>
                      </h3>
                    </div>
                    {activeImpact && getSeverityBadge(activeImpact.severity)}
                  </div>

                  {/* Visual Flow diagram: Primary Change -> Impact */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/90 flex flex-col sm:flex-row items-center gap-3 text-xs">
                    <div className="flex-1 bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-center w-full sm:w-auto">
                      <span className="text-[10px] uppercase font-mono text-slate-500 block">
                        Trigger Change
                      </span>
                      <span className="font-semibold text-slate-300 truncate block">
                        {isCustomActive
                          ? proposedChange?.title || currentChange.changeDescription
                          : 'Retention Cut to 30d'}
                      </span>
                    </div>

                    <div className="flex items-center justify-center text-cyan-400">
                      <ArrowRight className="w-5 h-5 hidden sm:block" />
                      <span className="sm:hidden text-slate-600">&darr;</span>
                    </div>

                    <div className="flex-1 bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-center w-full sm:w-auto">
                      <span className="text-[10px] uppercase font-mono text-slate-500 block">
                        Affected Downstream
                      </span>
                      <span className="font-semibold text-slate-300 truncate block">
                        {activeDoc?.title || 'Related Document'}
                      </span>
                    </div>
                  </div>

                  {/* Impact Summary */}
                  {activeImpact ? (
                    <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1.5 text-xs">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold block">
                        Impact Explanation
                      </span>
                      <p className="text-slate-300 leading-relaxed">{activeImpact.impactSummary}</p>
                      {safeAffectedSections.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1.5">
                          {safeAffectedSections.map((sec, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700"
                            >
                              <FileText className="w-3 h-3 text-slate-400" /> {sec}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-400">
                      No explicit impact summary was recorded for this document.
                    </div>
                  )}
                </div>

                {/* Conflict Detection Card */}
                {activeConflict ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                      <h3 className="text-sm font-bold text-slate-200">
                        Direct Conflict Detected in {activeDoc?.title}
                      </h3>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="bg-rose-950/20 border border-rose-900/40 p-3.5 rounded-xl space-y-1">
                        <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-rose-400 block">
                          Contradictory Statement in Current Document
                        </span>
                        <blockquote className="italic font-mono text-[11px] text-rose-200 border-l-2 border-rose-500 pl-2 py-0.5 leading-relaxed">
                          &ldquo;{activeConflict.conflictingText}&rdquo;
                        </blockquote>
                      </div>

                      {activeConflict.sourceText && (
                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                          <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-indigo-400 block">
                            Source Trigger Statement
                          </span>
                          <p className="font-mono text-[11px] text-slate-300">&ldquo;{activeConflict.sourceText}&rdquo;</p>
                        </div>
                      )}

                      <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                        <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 block">
                          Root Cause of Conflict
                        </span>
                        <p className="text-slate-300 leading-relaxed">{activeConflict.reason}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-sm font-bold text-slate-200">
                        No Direct Conflicts Detected
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      No textual contradictions were identified between the proposed change and{' '}
                      <span className="text-slate-200 font-medium">{activeDoc?.title}</span>.
                    </p>
                  </div>
                )}

                {/* Evidence-Supported Revision Suggestion Card */}
                {activeSuggestion ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <h3 className="text-sm font-bold text-slate-200">
                          Evidence-Supported Revision Suggestion
                        </h3>
                      </div>

                      <button
                        onClick={() => handleCopy(activeSuggestion.suggestedText, activeSuggestion.documentId)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-all active:scale-95"
                      >
                        {copiedId === activeSuggestion.documentId ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-400" /> Copy Revision
                          </>
                        )}
                      </button>
                    </div>

                    {/* Proposed Text Box */}
                    <div className="bg-emerald-950/20 border border-emerald-900/40 p-4 rounded-xl space-y-2 text-xs">
                      <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-emerald-400 block">
                        Recommended Rewrite
                      </span>
                      <p className="font-mono text-emerald-200/95 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-emerald-900/30">
                        {activeSuggestion.suggestedText}
                      </p>
                    </div>

                    {/* Rationale & Evidence Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                        <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">
                          Rationale
                        </span>
                        <p className="text-slate-300 leading-relaxed">{activeSuggestion.rationale}</p>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                        <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">
                          Evidence Source
                        </span>
                        <p className="text-slate-300 leading-relaxed">{activeSuggestion.evidence}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-cyan-400" />
                      <h3 className="text-sm font-bold text-slate-200">
                        No Text Revision Required
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      No textual rewrite was recommended for{' '}
                      <span className="text-slate-200 font-medium">{activeDoc?.title}</span>.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-8">
            <DocumentUpload onDocumentExtracted={handleDocumentExtracted} />
            <DocumentLibrary
              documents={documents}
              onRemoveDocument={handleRemoveDocument}
              onSetDocumentRole={handleSetDocumentRole}
            />
            <ProposedChangeForm
              primaryDocument={primaryDocument}
              relatedDocuments={relatedDocuments}
              savedChange={proposedChange}
              onSaveChange={setProposedChange}
              onClearChange={() => setProposedChange(null)}
              onTriggerAnalysis={handleRunAnalysis}
              isAnalyzing={isAnalyzing}
              analysisError={analysisError}
              onClearError={() => setAnalysisError(null)}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 px-6 py-4 text-center text-xs text-slate-500 mt-12">
        <p className="flex items-center justify-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>RippleMap</span> &bull; <span>BharatCode Build League Hackathon</span> &bull;{' '}
          <span className="text-slate-400 italic">&ldquo;One change. Every consequence.&rdquo;</span>
        </p>
      </footer>
    </div>
  );
}

function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

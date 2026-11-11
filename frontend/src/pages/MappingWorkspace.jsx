import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Upload, Loader2, CheckCircle, AlertTriangle,
  ArrowRight, ChevronDown, BarChart2, Eye
} from 'lucide-react';
import { mapTerminology, mapBatch, reviewMapping } from '../services/api';
import CandidateTable from '../components/CandidateTable';

const TERMINOLOGIES = ['SNOMED CT', 'ICD-10-CM', 'MeSH', 'UMLS', 'All'];

const PIPELINE_STEPS = [
  { key: 'processing',  label: 'Clinical Text Processing' },
  { key: 'embedding',   label: 'Semantic Embedding Generation' },
  { key: 'retrieval',   label: 'Vector Database Retrieval' },
  { key: 'ranking',     label: 'Candidate Re-Ranking' },
  { key: 'llm',         label: 'LLM Semantic Reasoning' },
  { key: 'final',       label: 'Final Concept Mapping' },
];

const CONF_COLORS = {
  High:   { badge: 'bg-teal-500/20  text-teal-300  border-teal-500/40',  bar: 'bg-teal-500' },
  Medium: { badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40', bar: 'bg-amber-500' },
  Low:    { badge: 'bg-red-500/20   text-red-300   border-red-500/40',   bar: 'bg-red-500' },
};

function StepIndicator({ step, status }) {
  return (
    <div className="flex items-center gap-3">
      <div className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full border border-slate-600 bg-slate-800">
        {status === 'done'    && <CheckCircle size={16} className="text-teal-400" />}
        {status === 'active'  && <Loader2    size={16} className="text-cyan-400 animate-spin" />}
        {status === 'pending' && <span className="w-2 h-2 rounded-full bg-slate-600" />}
      </div>
      <span className={`text-sm ${status === 'done' ? 'text-teal-300' : status === 'active' ? 'text-cyan-300' : 'text-slate-500'}`}>
        {step.label}
      </span>
    </div>
  );
}

export default function MappingWorkspace({ onNavigate, onMappingResult }) {
  const [text, setText]           = useState('');
  const [notes, setNotes]         = useState('');
  const [terminology, setTerminology] = useState('All');
  const [loading, setLoading]     = useState(false);
  const [pipelineStep, setPipelineStep] = useState(-1);
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState(null);
  const [batchResults, setBatchResults] = useState([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [reviewing, setReviewing] = useState(null); // 'accept' | 'reject'
  const fileRef = useRef(null);

  async function handleMap() {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setPipelineStep(0);

    // Animate pipeline steps progressively
    const totalSteps = PIPELINE_STEPS.length;
    const stepInterval = 400;

    const animPromise = new Promise((resolve) => {
      let step = 0;
      const id = setInterval(() => {
        step++;
        setPipelineStep(step);
        if (step >= totalSteps - 1) { clearInterval(id); resolve(); }
      }, stepInterval);
    });

    try {
      const req = {
        clinical_text: text,
        notes: notes || undefined,
        terminology: terminology === 'All' ? undefined : terminology,
      };
      const [res] = await Promise.all([mapTerminology(req), animPromise]);
      setPipelineStep(PIPELINE_STEPS.length); // all done
      setResult(res);
      onMappingResult?.(res);
    } catch (e) {
      setError(e.message || 'Mapping failed');
      setPipelineStep(-1);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBatchLoading(true);
    try {
      const text = await file.text();
      const terms = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const res = await mapBatch(terms, terminology === 'All' ? undefined : terminology);
      setBatchResults(res.results || []);
    } catch (err) {
      setError(err.message || 'Batch processing failed');
    } finally {
      setBatchLoading(false);
    }
    e.target.value = '';
  }

  async function handleReview(action) {
    if (!result?.id) return;
    setReviewing(action);
    try {
      await reviewMapping(result.id, { status: action === 'accept' ? 'accepted' : 'rejected' });
      setResult(prev => prev ? { ...prev, review_status: action === 'accept' ? 'accepted' : 'rejected' } : prev);
    } catch (err) {
      setError(err.message || 'Review failed');
    } finally {
      setReviewing(null);
    }
  }

  const getStepStatus = (index) => {
    if (pipelineStep < 0) return 'pending';
    if (index < pipelineStep) return 'done';
    if (index === pipelineStep) return loading ? 'active' : 'done';
    return 'pending';
  };

  const best = result?.selected_concept;
  const conf = best ? (CONF_COLORS[result.confidence_level] || CONF_COLORS.Medium) : null;

  return (
    <div className="p-6 min-h-screen bg-[#080D18] text-white">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold">Mapping Workspace</h1>
        <p className="text-sm text-slate-400">Map clinical terms to standardized medical concepts</p>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── LEFT PANEL ─────────────────────────── */}
        <motion.div
          className="lg:w-[420px] shrink-0 space-y-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-5 backdrop-blur space-y-4">
            {/* Clinical text */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Clinical Text *
              </label>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Enter clinical term or phrase (e.g. high blood pressure)"
                rows={4}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/40 resize-none transition-colors"
              />
            </div>

            {/* Clinical notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Clinical Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Additional context or clinical notes..."
                rows={3}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/40 resize-none transition-colors"
              />
            </div>

            {/* Terminology selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Target Terminology
              </label>
              <div className="relative">
                <select
                  value={terminology}
                  onChange={e => setTerminology(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm text-white focus:border-cyan-500 focus:outline-none appearance-none cursor-pointer"
                >
                  {TERMINOLOGIES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            </div>

            {/* Map button */}
            <button
              onClick={handleMap}
              disabled={loading || !text.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 py-3.5 font-semibold text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <BarChart2 size={18} />}
              {loading ? 'Mapping…' : 'Map Terminology'}
            </button>

            {/* CSV upload */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-700" />
              <span className="text-xs text-slate-500">or</span>
              <div className="flex-1 h-px bg-slate-700" />
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={batchLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-800/40 py-3 text-sm text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300 disabled:opacity-50 transition-all"
            >
              {batchLoading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {batchLoading ? 'Processing…' : 'Upload CSV / TXT'}
            </button>
            <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />
          </div>

          {/* Pipeline progress */}
          <AnimatePresence>
            {pipelineStep >= 0 && (
              <motion.div
                className="rounded-2xl border border-cyan-500/20 bg-slate-900/60 p-5 backdrop-blur space-y-3"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">
                  Processing Pipeline
                </p>
                {PIPELINE_STEPS.map((step, i) => (
                  <motion.div
                    key={step.key}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <StepIndicator step={step} status={getStepStatus(i)} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── RIGHT PANEL ────────────────────────── */}
        <div className="flex-1 space-y-5">
          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                className="flex items-center gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 p-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <AlertTriangle size={18} className="text-red-400 shrink-0" />
                <p className="text-sm text-red-300 flex-1">{error}</p>
                <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200 text-xs">Dismiss</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Low confidence warning */}
          <AnimatePresence>
            {result && result.confidence_level === 'Low' && (
              <motion.div
                className="flex items-center gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <AlertTriangle size={18} className="text-amber-400 shrink-0" />
                <p className="text-sm text-amber-300">
                  <strong>Human Review Required</strong> — Low confidence mapping. A clinician should validate this result before use.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Best match */}
          <AnimatePresence>
            {best && (
              <motion.div
                className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-6 backdrop-blur"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-slate-300">Best Match</h2>
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${conf?.badge}`}>
                    {result.confidence_level} Confidence
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-white mb-1">{best.concept_name}</h3>
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-mono text-slate-400 text-sm">{best.concept_id}</span>
                  <span className="rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 px-2.5 py-0.5 text-xs font-medium">
                    {best.terminology}
                  </span>
                </div>

                {/* Similarity bar */}
                <div className="mb-5">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Similarity Score</span>
                    <span className="font-mono">{((best.similarity_score || best.hybrid_score || 0) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${conf?.bar}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${((best.similarity_score || best.hybrid_score || 0) * 100)}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      if (result) {
                        onMappingResult?.(result);
                        onNavigate?.('explainability', result);
                      }
                    }}
                    className="flex items-center gap-2 rounded-xl bg-cyan-500/15 border border-cyan-500/40 px-4 py-2.5 text-sm text-cyan-300 hover:bg-cyan-500/25 transition-all cursor-pointer"
                  >
                    <Eye size={15} /> View Full Explanation
                  </button>
                  <button
                    onClick={() => handleReview('accept')}
                    disabled={!!reviewing || result.review_status === 'accepted'}
                    className="flex items-center gap-2 rounded-xl bg-teal-500/15 border border-teal-500/40 px-4 py-2.5 text-sm text-teal-300 hover:bg-teal-500/25 disabled:opacity-50 transition-all"
                  >
                    {reviewing === 'accept' ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                    {result.review_status === 'accepted' ? 'Accepted ✓' : 'Accept Mapping'}
                  </button>
                  <button
                    onClick={() => handleReview('reject')}
                    disabled={!!reviewing || result.review_status === 'rejected'}
                    className="flex items-center gap-2 rounded-xl bg-red-500/15 border border-red-500/40 px-4 py-2.5 text-sm text-red-300 hover:bg-red-500/25 disabled:opacity-50 transition-all"
                  >
                    {reviewing === 'reject' ? <Loader2 size={15} className="animate-spin" /> : null}
                    {result.review_status === 'rejected' ? 'Rejected ✗' : 'Reject Mapping'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Alternative candidates */}
          <AnimatePresence>
            {result?.candidates && result.candidates.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <CandidateTable candidates={result.candidates} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Batch results */}
          {batchResults.length > 0 && (
            <motion.div
              className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-5 backdrop-blur"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="font-semibold text-slate-300 mb-4">Batch Results ({batchResults.length})</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {batchResults.map((r, i) => (
                  <div key={i} className="rounded-xl border border-slate-700/40 bg-slate-800/40 p-3 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-mono text-cyan-300">{r.original_term}</span>
                      <ArrowRight size={12} className="inline mx-2 text-slate-500" />
                      <span className="text-sm text-white">{r.selected_concept?.concept_name || '—'}</span>
                    </div>
                    <span className="text-xs text-slate-500">{r.selected_concept?.terminology || ''}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Empty state */}
          {!result && !loading && pipelineStep < 0 && batchResults.length === 0 && (
            <motion.div
              className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 py-20 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <FileText size={48} className="text-slate-700 mb-4" />
              <p className="text-slate-500 text-sm">Enter a clinical term and click <strong className="text-slate-400">Map Terminology</strong></p>
              <p className="text-slate-600 text-xs mt-1">Results and explanations will appear here</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

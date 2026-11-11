import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight, CheckCircle, XCircle, Loader2,
  BookOpen, Lightbulb, BarChart2, List, Layers, Clock, Cpu, AlertTriangle
} from 'lucide-react';
import { reviewMapping } from '../services/api';
import EvidencePanel from '../components/EvidencePanel';

const CONF_CALLOUT = {
  High: {
    cls: 'border-teal-500/40  bg-teal-500/10  text-teal-300',
    icon: CheckCircle,
    title: 'High Confidence',
    desc: 'This mapping is highly reliable. Clinician spot-check recommended before use in production systems.',
  },
  Medium: {
    cls: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
    icon: AlertTriangle,
    title: 'Medium Confidence',
    desc: 'Mapping is plausible but should be reviewed by a clinician. Alternative concepts may be equally valid.',
  },
  Low: {
    cls: 'border-red-500/40   bg-red-500/10   text-red-300',
    icon: XCircle,
    title: 'Low Confidence — Human Review Required',
    desc: 'The system could not determine a clear match. A qualified clinician MUST validate this result.',
  },
};

function Section({ icon: Icon, title, children, delay = 0 }) {
  return (
    <motion.section
      className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-6 backdrop-blur"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Icon size={18} className="text-cyan-400" />
        <h2 className="font-semibold text-white">{title}</h2>
      </div>
      {children}
    </motion.section>
  );
}

export default function Explainability({ mapping, selectedMapping, onNavigate }) {
  // Support both mapping prop and selectedMapping prop
  const currentMapping = mapping || selectedMapping;
  const [reviewing, setReviewing] = useState(null);
  const [reviewStatus, setReviewStatus] = useState(currentMapping?.review_status);

  async function handleReview(action) {
    const id = currentMapping?.mapping_id || currentMapping?.id;
    if (!id) return;
    setReviewing(action);
    try {
      await reviewMapping(id, { action: action === 'accept' ? 'accept' : 'reject' });
      setReviewStatus(action === 'accept' ? 'Accepted' : 'Rejected');
    } catch (e) {
      console.error(e);
    } finally {
      setReviewing(null);
    }
  }

  // ── No mapping ───────────────────────────────────────────────────────────────
  if (!currentMapping) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Lightbulb size={56} className="text-slate-700 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No Mapping Selected</h2>
          <p className="text-slate-400 mb-6 max-w-md">
            Perform a mapping in the workspace to view a full explainability report here.
          </p>
          <button
            onClick={() => onNavigate?.('workspace')}
            className="flex items-center gap-2 mx-auto rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 font-semibold text-white cursor-pointer hover:opacity-90 transition-opacity"
          >
            Go to Workspace <ArrowRight size={16} />
          </button>
        </motion.div>
      </div>
    );
  }

  const best = currentMapping.selected_concept || {};
  const confLevel = currentMapping.confidence_label || currentMapping.confidence_level || (currentMapping.confidence_score >= 0.82 ? 'High' : currentMapping.confidence_score >= 0.65 ? 'Medium' : 'Low');
  const conf = CONF_CALLOUT[confLevel] || CONF_CALLOUT.Medium;
  const ConfIcon = conf.icon;
  
  // Alternatives / Candidates normalized list
  const candidates = currentMapping.alternatives || currentMapping.candidates || [];
  const topFive = [best, ...candidates].slice(0, 5);
  const evidence = currentMapping.evidence || [];
  const steps = currentMapping.processing_steps || [];
  const whyAlts = currentMapping.why_alternatives_ranked_lower || [];
  const synonyms = best.synonyms || [];

  return (
    <div className="p-6 min-h-screen bg-[#080D18] text-white space-y-6 max-w-5xl mx-auto pb-16">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <motion.div
        className="rounded-2xl border border-cyan-500/20 bg-slate-900/60 p-6 backdrop-blur"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-wrap items-center gap-3 text-lg font-bold">
          <span className="font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 rounded-lg px-3 py-1">
            "{currentMapping.original_term}"
          </span>
          <motion.div
            animate={{ x: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ArrowRight size={22} className="text-cyan-400" />
          </motion.div>
          <span className="text-white">{best.concept_name}</span>
          <span className="ml-auto font-mono text-sm text-slate-400">ID: {best.concept_id}</span>
        </div>
      </motion.div>

      {/* ── Confidence callout ─────────────────────────────────────────── */}
      <motion.div
        className={`flex items-start gap-3 rounded-2xl border p-5 ${conf.cls}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <ConfIcon size={22} className="shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold mb-0.5">{conf.title} ({Math.round((currentMapping.confidence_score || 0.85) * 100)}%)</p>
          <p className="text-sm opacity-80">{conf.desc}</p>
        </div>
      </motion.div>

      {/* ── Section 1: Selected Concept ────────────────────────────────── */}
      <Section icon={BookOpen} title="Selected Standardized Concept" delay={0.15}>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider">Concept Name</label>
            <p className="text-white font-semibold mt-0.5">{best.concept_name || '—'}</p>
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider">Concept Identifier</label>
            <p className="font-mono text-cyan-300 mt-0.5">{best.concept_id || '—'}</p>
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider">Target Terminology</label>
            <span className="inline-block mt-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 px-3 py-0.5 text-xs font-medium">
              {best.terminology || '—'}
            </span>
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider">Clinical Domain</label>
            <p className="text-slate-300 mt-0.5">{best.domain || '—'}</p>
          </div>
        </div>
        {(best.description || best.definition) && (
          <div className="mt-4">
            <label className="text-xs text-slate-500 uppercase tracking-wider">Authoritative Clinical Definition</label>
            <p className="text-slate-300 text-sm mt-1 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-white/5">
              {best.description || best.definition}
            </p>
          </div>
        )}
        {synonyms.length > 0 && (
          <div className="mt-4">
            <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">Standardized Synonyms & Variants</label>
            <div className="flex flex-wrap gap-2">
              {synonyms.map((s, i) => (
                <span key={i} className="rounded-full bg-slate-800 border border-slate-700 px-3 py-0.5 text-xs text-slate-300">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* ── Section 2: Why Selected ────────────────────────────────────── */}
      {(currentMapping.why_selected || currentMapping.reasoning) && (
        <Section icon={Lightbulb} title="Why This Concept Was Selected" delay={0.2}>
          <blockquote className="border-l-4 border-cyan-500 pl-5 py-2 bg-midnight-950/40 rounded-r-xl">
            <p className="text-slate-200 leading-relaxed text-sm">
              {currentMapping.why_selected || currentMapping.reasoning}
            </p>
          </blockquote>
        </Section>
      )}

      {/* ── Section 3: Semantic Similarity Analysis ────────────────────── */}
      {topFive.length > 0 && (
        <Section icon={BarChart2} title="Semantic Similarity Comparison" delay={0.25}>
          <div className="space-y-3">
            {topFive.map((c, i) => {
              const score = c.similarity_score ?? c.hybrid_score ?? 0;
              return (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium truncate max-w-[70%]">
                      {i === 0 ? '★ ' : `${i + 1}. `} {c.concept_name} [{c.terminology || 'SNOMED CT'}]
                    </span>
                    <span className="font-mono text-cyan-electric">{(score * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${i === 0 ? 'bg-cyan-500' : 'bg-slate-600'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, Math.max(5, score * 100))}%` }}
                      transition={{ duration: 0.8, delay: i * 0.08 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* ── Section 4: Why Alternatives Ranked Lower ───────────────────── */}
      {whyAlts.length > 0 && (
        <Section icon={List} title="Why Alternatives Ranked Lower" delay={0.3}>
          <ol className="space-y-3">
            {whyAlts.map((alt, i) => {
              const textContent = typeof alt === 'string' ? alt : (alt.reason || alt.rejection_reason || JSON.stringify(alt));
              return (
                <motion.li
                  key={i}
                  className="flex gap-4 rounded-xl bg-slate-800/40 border border-slate-700/40 p-3.5"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.07 }}
                >
                  <span className="shrink-0 w-6 h-6 rounded-full bg-slate-700 text-xs font-bold text-slate-300 flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-xs text-slate-300 leading-relaxed">{textContent}</p>
                  </div>
                </motion.li>
              );
            })}
          </ol>
        </Section>
      )}

      {/* ── Section 5: Evidence Panel ──────────────────────────────────── */}
      {evidence.length > 0 && (
        <Section icon={Layers} title="Authoritative Retrieved Evidence" delay={0.35}>
          <EvidencePanel evidence={evidence} />
        </Section>
      )}

      {/* ── Section 6: Processing Pipeline Steps ──────────────────────── */}
      {steps.length > 0 && (
        <Section icon={Clock} title="Processing Pipeline Execution Steps" delay={0.4}>
          <div className="relative pl-6 space-y-4">
            <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-slate-800" />
            {steps.map((st, i) => (
              <div key={i} className="relative flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500 flex items-center justify-center text-[10px] font-mono text-cyan-400 shrink-0 mt-0.5">
                  {st.step_number || i + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">{st.name}</span>
                    <span className="font-mono text-[10px] text-teal-medical bg-teal-medical/10 px-2 py-0.5 rounded border border-teal-medical/20">
                      {st.latency_ms} ms
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{st.details}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Section 7: Reasoning Engine ───────────────────────────────── */}
      {currentMapping.reasoning_engine && (
        <Section icon={Cpu} title="Reasoning Engine Specification" delay={0.45}>
          <div className="flex items-center gap-3">
            <span className="rounded-full border px-3 py-1 text-xs font-mono font-medium bg-teal-500/15 text-teal-300 border-teal-500/40">
              {currentMapping.reasoning_engine}
            </span>
            <span className="text-xs text-slate-400">
              {currentMapping.reasoning_engine.includes('Local')
                ? 'Grounded locally using authoritative vocabulary index.'
                : 'External LLM reasoning grounded on retrieved concepts.'}
            </span>
          </div>
        </Section>
      )}

      {/* ── Accept / Reject ───────────────────────────────────────────── */}
      <motion.div
        className="flex gap-4 pt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <button
          onClick={() => handleReview('accept')}
          disabled={!!reviewing || reviewStatus === 'Accepted'}
          className="flex items-center gap-2 rounded-xl bg-teal-500/15 border border-teal-500/40 px-5 py-3 font-semibold text-teal-300 hover:bg-teal-500/25 disabled:opacity-50 transition-all cursor-pointer"
        >
          {reviewing === 'accept' ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
          {reviewStatus === 'Accepted' ? 'Accepted ✓' : 'Accept Mapping'}
        </button>
        <button
          onClick={() => handleReview('reject')}
          disabled={!!reviewing || reviewStatus === 'Rejected'}
          className="flex items-center gap-2 rounded-xl bg-red-500/15 border border-red-500/40 px-5 py-3 font-semibold text-red-300 hover:bg-red-500/25 disabled:opacity-50 transition-all cursor-pointer"
        >
          {reviewing === 'reject' ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
          {reviewStatus === 'Rejected' ? 'Rejected ✗' : 'Reject Mapping'}
        </button>
      </motion.div>
    </div>
  );
}

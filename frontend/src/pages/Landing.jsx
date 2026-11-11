import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, useAnimation, animate } from 'framer-motion';
import {
  Search, Brain, Zap, Eye, BookOpen, Users,
  ArrowRight, ChevronRight, Activity, Database, Cpu, Code2
} from 'lucide-react';

// ── Animated counter ──────────────────────────────────────────────────────────
function Counter({ target, suffix = '', decimals = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, target, {
      duration: 2,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(decimals ? v.toFixed(decimals) : Math.round(v)),
    });
    return controls.stop;
  }, [inView, target, decimals]);

  return <span ref={ref}>{display}{suffix}</span>;
}

// ── Feature cards data ────────────────────────────────────────────────────────
const FEATURES = [
  { icon: Search,   title: 'Vector Search',        desc: 'FAISS-powered approximate nearest-neighbor search across 60K+ medical concepts in milliseconds.' },
  { icon: Brain,    title: 'Semantic Embedding',   desc: 'SentenceTransformer BioBERT embeddings capture deep clinical semantics beyond keyword matching.' },
  { icon: Cpu,      title: 'LLM Reasoning',        desc: 'Gemini / GPT-4 powered re-ranking validates candidates with clinical reasoning chains.' },
  { icon: Eye,      title: 'Explainable AI',       desc: 'Full transparency: why a concept was selected, evidence sources, and confidence calibration.' },
  { icon: BookOpen, title: 'Multi-Vocabulary',     desc: 'SNOMED CT, ICD-10-CM, MeSH, and UMLS — all from a single unified interface.' },
  { icon: Users,    title: 'Human Review',         desc: 'Built-in accept/reject workflow with audit trail ensures clinician oversight every step.' },
];

const METRICS = [
  { label: 'Top-1 Accuracy',    value: 93.3, suffix: '%', decimals: 1 },
  { label: 'Retrieval Speed',   value: 30,   suffix: 'ms' },
  { label: 'Medical Concepts',  value: 60,   suffix: 'K+' },
  { label: 'Terminology Systems', value: 4,  suffix: '' },
];

const PIPELINE_STEPS = [
  { label: 'Text Processing',    color: 'from-cyan-500 to-cyan-600' },
  { label: 'Embedding',          color: 'from-teal-500 to-teal-600' },
  { label: 'Vector Retrieval',   color: 'from-blue-500 to-blue-600' },
  { label: 'Re-Ranking',         color: 'from-violet-500 to-violet-600' },
  { label: 'LLM Reasoning',      color: 'from-purple-500 to-purple-600' },
];

const ARCH_STEPS = [
  { step: '01', label: 'Clinical Input',          color: 'border-cyan-500',   bg: 'bg-cyan-500/10' },
  { step: '02', label: 'Text Preprocessing',      color: 'border-teal-500',   bg: 'bg-teal-500/10' },
  { step: '03', label: 'Semantic Embeddings',     color: 'border-blue-500',   bg: 'bg-blue-500/10' },
  { step: '04', label: 'Vector DB (FAISS)',       color: 'border-indigo-500', bg: 'bg-indigo-500/10' },
  { step: '05', label: 'LLM Re-ranking',          color: 'border-violet-500', bg: 'bg-violet-500/10' },
  { step: '06', label: 'Standardized Concept',    color: 'border-purple-500', bg: 'bg-purple-500/10' },
];

const TECH_STACK = [
  { label: 'FastAPI',           color: 'bg-teal-500/20   text-teal-300   border-teal-500/40' },
  { label: 'PyTorch',          color: 'bg-orange-500/20 text-orange-300 border-orange-500/40' },
  { label: 'FAISS',            color: 'bg-blue-500/20   text-blue-300   border-blue-500/40' },
  { label: 'SentenceTransformers', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
  { label: 'React',            color: 'bg-sky-500/20    text-sky-300    border-sky-500/40' },
  { label: 'TailwindCSS',      color: 'bg-teal-400/20   text-teal-200   border-teal-400/40' },
];

// ── Hero words animation ───────────────────────────────────────────────────────
const HERO_TEXT = 'Transforming Clinical Language Into Medical Intelligence';

export default function Landing({ onNavigate }) {
  const heroWords = HERO_TEXT.split(' ');

  return (
    <div className="relative min-h-screen overflow-x-hidden text-white bg-[#080D18]">
      {/* Gradient blob */}
      <motion.div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
      >
        <motion.div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(ellipse, #06b6d4 0%, #3b82f6 40%, transparent 70%)' }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.18, 0.26, 0.18] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-6 pt-20 pb-16 text-center">
        <motion.div
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-sm text-cyan-300"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
          AI-Powered Medical Terminology Mapping
        </motion.div>

        <h1 className="mb-6 max-w-5xl text-5xl font-extrabold leading-tight md:text-7xl">
          {heroWords.map((word, i) => (
            <motion.span
              key={i}
              className="inline-block mr-3"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08, duration: 0.5, ease: 'easeOut' }}
            >
              {i < 3 ? (
                <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-400 bg-clip-text text-transparent">
                  {word}
                </span>
              ) : word}
            </motion.span>
          ))}
        </h1>

        <motion.p
          className="mb-10 max-w-2xl text-lg text-slate-400"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          An AI-powered RAG framework for intelligent, accurate, and explainable medical terminology mapping.
        </motion.p>

        <motion.div
          className="mb-16 flex flex-wrap gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.5 }}
        >
          <button
            onClick={() => onNavigate('dashboard')}
            className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-7 py-3.5 font-semibold text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all"
          >
            Explore Platform
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => onNavigate('workspace')}
            className="flex items-center gap-2 rounded-xl border border-cyan-500/50 bg-cyan-500/5 px-7 py-3.5 font-semibold text-cyan-300 hover:bg-cyan-500/15 transition-all"
          >
            Start Mapping
            <ChevronRight size={18} />
          </button>
        </motion.div>

        {/* RAG Pipeline demo */}
        <PipelineDemo />
      </section>

      {/* ── METRICS ──────────────────────────────────────────────── */}
      <section className="px-6 py-20 bg-gradient-to-b from-transparent to-slate-900/40">
        <motion.div
          className="mx-auto max-w-5xl grid grid-cols-2 md:grid-cols-4 gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
        >
          {METRICS.map((m) => (
            <motion.div
              key={m.label}
              className="rounded-2xl border border-cyan-500/20 bg-slate-900/60 p-6 text-center backdrop-blur"
              variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
            >
              <div className="text-4xl font-black bg-gradient-to-r from-cyan-400 to-teal-300 bg-clip-text text-transparent">
                <Counter target={m.value} suffix={m.suffix} decimals={m.decimals} />
              </div>
              <div className="mt-1 text-sm text-slate-400">{m.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <SectionHeader
            tag="Core Capabilities"
            title="Everything you need for clinical NLP"
            sub="Six pillars of enterprise-grade medical terminology mapping."
          />
          <motion.div
            className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          >
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <motion.div
                key={title}
                className="group rounded-2xl border border-slate-700/50 bg-slate-900/50 p-6 backdrop-blur hover:border-cyan-500/40 hover:bg-slate-800/60 transition-all"
                variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
              >
                <div className="mb-4 inline-flex rounded-xl bg-cyan-500/10 p-3 group-hover:bg-cyan-500/20 transition-colors">
                  <Icon size={22} className="text-cyan-400" />
                </div>
                <h3 className="mb-2 font-semibold text-white">{title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── ARCHITECTURE ─────────────────────────────────────────── */}
      <section className="px-6 py-20 bg-slate-900/30">
        <div className="mx-auto max-w-6xl">
          <SectionHeader
            tag="Architecture"
            title="6-Step RAG Pipeline"
            sub="From raw clinical text to standardized concept in milliseconds."
          />
          <div className="mt-12 flex flex-col md:flex-row items-stretch gap-3 overflow-x-auto pb-4">
            {ARCH_STEPS.map((s, i) => (
              <React.Fragment key={s.step}>
                <motion.div
                  className={`flex-1 min-w-[140px] rounded-2xl border ${s.color} ${s.bg} p-5 flex flex-col items-center text-center`}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <span className="text-xs font-mono text-slate-500 mb-1">{s.step}</span>
                  <span className="text-sm font-semibold text-white">{s.label}</span>
                </motion.div>
                {i < ARCH_STEPS.length - 1 && (
                  <div className="hidden md:flex items-center text-slate-600">
                    <ArrowRight size={20} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ── TECH STACK ───────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <SectionHeader
            tag="Technology"
            title="Built on cutting-edge ML infrastructure"
            sub="Production-grade components powering every mapping."
          />
          <div className="mt-10 flex flex-wrap gap-3 justify-center">
            {TECH_STACK.map((t) => (
              <motion.span
                key={t.label}
                className={`rounded-full border px-5 py-2 text-sm font-medium ${t.color}`}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.08 }}
              >
                {t.label}
              </motion.span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer className="border-t border-slate-800 px-6 py-10 text-center">
        <div className="mx-auto max-w-2xl">
          <p className="text-sm text-amber-400/90 bg-amber-500/10 border border-amber-500/30 rounded-xl px-5 py-3">
            ⚠️ <strong>Research Tool Only</strong> — Not for clinical diagnosis. All mappings require clinician review.
          </p>
          <p className="mt-6 text-xs text-slate-600">
            © {new Date().getFullYear()} MedRAG · Built with FastAPI + React · Research Use Only
          </p>
        </div>
      </footer>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionHeader({ tag, title, sub }) {
  return (
    <div className="text-center">
      <motion.span
        className="inline-block mb-3 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-cyan-400"
        initial={{ opacity: 0, y: -10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        {tag}
      </motion.span>
      <motion.h2
        className="text-3xl md:text-4xl font-bold text-white"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
      >
        {title}
      </motion.h2>
      {sub && (
        <motion.p
          className="mt-3 text-slate-400"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          {sub}
        </motion.p>
      )}
    </div>
  );
}

function PipelineDemo() {
  const [active, setActive] = useState(-1);

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      setActive(i);
      i++;
      if (i > PIPELINE_STEPS.length) {
        clearInterval(id);
      }
    }, 700);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      className="w-full max-w-3xl mx-auto rounded-2xl border border-cyan-500/20 bg-slate-900/70 p-6 backdrop-blur"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.8, duration: 0.7 }}
    >
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        {/* Input */}
        <div className="shrink-0 rounded-xl border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-mono text-slate-200 whitespace-nowrap">
          "High blood pressure"
        </div>

        <ArrowRight size={16} className="shrink-0 text-slate-500" />

        {/* Steps */}
        {PIPELINE_STEPS.map((step, i) => (
          <React.Fragment key={step.label}>
            <motion.div
              className={`shrink-0 rounded-xl bg-gradient-to-r ${step.color} px-3 py-2 text-xs font-semibold text-white shadow-lg whitespace-nowrap`}
              initial={{ opacity: 0.3, scale: 0.9 }}
              animate={active >= i ? { opacity: 1, scale: 1 } : { opacity: 0.3, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              {step.label}
            </motion.div>
            {i < PIPELINE_STEPS.length - 1 && (
              <motion.div
                className="shrink-0"
                animate={active > i ? { opacity: 1 } : { opacity: 0.2 }}
              >
                <ArrowRight size={14} className="text-slate-500" />
              </motion.div>
            )}
          </React.Fragment>
        ))}

        <ArrowRight size={16} className="shrink-0 text-slate-500" />

        {/* Output */}
        <motion.div
          className="shrink-0 rounded-xl border border-teal-500/50 bg-teal-500/10 px-4 py-2 text-sm font-mono text-teal-300 whitespace-nowrap"
          animate={active >= PIPELINE_STEPS.length ? { opacity: 1, scale: 1 } : { opacity: 0.3, scale: 0.95 }}
        >
          Hypertension (38341003)
        </motion.div>
      </div>
    </motion.div>
  );
}

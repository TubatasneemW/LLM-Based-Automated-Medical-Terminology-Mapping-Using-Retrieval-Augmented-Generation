import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, FileText } from 'lucide-react';

const SOURCE_STYLES = {
  'SNOMED CT': { bg: 'rgba(6,182,212,0.15)', border: 'rgba(6,182,212,0.4)', text: '#06b6d4' },
  'ICD-10-CM': { bg: 'rgba(20,184,166,0.15)', border: 'rgba(20,184,166,0.4)', text: '#14b8a6' },
  MeSH: { bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.4)', text: '#a78bfa' },
  UMLS: { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)', text: '#fbbf24' },
};

function SourceBadge({ source }) {
  const style = SOURCE_STYLES[source] || { bg: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.2)', text: '#94a3b8' };
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ background: style.bg, border: `1px solid ${style.border}`, color: style.text }}
    >
      {source}
    </span>
  );
}

function RelevanceBar({ score }) {
  const pct = Math.round((score || 0) * 100);
  const color = pct >= 80 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#94a3b8';
  return (
    <div className="flex items-center gap-2 mt-2">
      <span className="text-xs text-white/35">Relevance</span>
      <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7 }}
        />
      </div>
      <span className="text-xs font-mono" style={{ color }}>{pct}%</span>
    </div>
  );
}

function EvidenceItem({ item, index }) {
  const [open, setOpen] = useState(index === 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.3 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Header / trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.03] transition-colors"
      >
        <FileText size={14} className="text-white/30 flex-shrink-0" />
        <SourceBadge source={item.source} />
        <span className="font-mono text-xs text-white/40 flex-shrink-0">{item.identifier}</span>
        <span className="flex-1 font-medium text-sm text-white truncate">{item.title}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} className="text-white/30 flex-shrink-0" />
        </motion.div>
      </button>

      {/* Expandable body */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-4 pb-4 pt-1 border-t border-white/5">
              <p className="text-sm text-white/60 leading-relaxed mb-2">{item.snippet}</p>
              <RelevanceBar score={item.relevance_score} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function EvidencePanel({ evidence = [] }) {
  if (!evidence || evidence.length === 0) {
    return (
      <div
        className="rounded-xl p-6 text-center"
        style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <FileText size={28} className="text-white/15 mx-auto mb-2" />
        <p className="text-white/30 text-sm">No evidence items retrieved</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
          Retrieved Evidence
        </h3>
        <span className="text-xs text-white/30">{evidence.length} sources</span>
      </div>
      {evidence.map((item, i) => (
        <EvidenceItem key={item.identifier || i} item={item} index={i} />
      ))}
    </div>
  );
}

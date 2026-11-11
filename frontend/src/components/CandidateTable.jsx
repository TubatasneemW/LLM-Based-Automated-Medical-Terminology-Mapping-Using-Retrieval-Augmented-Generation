import { motion } from 'framer-motion';
import { Check, X, Trophy } from 'lucide-react';

const rowVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.06, duration: 0.3 },
  }),
};

const TERM_COLORS = {
  'SNOMED CT': { bg: 'rgba(6,182,212,0.12)', border: 'rgba(6,182,212,0.3)', text: '#06b6d4' },
  'ICD-10-CM': { bg: 'rgba(20,184,166,0.12)', border: 'rgba(20,184,166,0.3)', text: '#14b8a6' },
  MeSH: { bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.3)', text: '#a78bfa' },
  UMLS: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', text: '#fbbf24' },
};

function TermBadge({ terminology }) {
  const style = TERM_COLORS[terminology] || { bg: 'rgba(255,255,255,0.07)', border: 'rgba(255,255,255,0.15)', text: '#94a3b8' };
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ background: style.bg, border: `1px solid ${style.border}`, color: style.text }}
    >
      {terminology}
    </span>
  );
}

function ScoreBar({ value }) {
  const pct = Math.round((value || 0) * 100);
  const color = pct >= 80 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />
      </div>
      <span className="text-xs font-mono text-white/60">{(value || 0).toFixed(3)}</span>
    </div>
  );
}

export default function CandidateTable({ candidates = [], onAccept, onReject }) {
  const sorted = [...candidates].sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99)).slice(0, 5);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(6,182,212,0.12)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="px-4 py-3 border-b border-white/5">
        <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider">
          Top Candidates
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-white/5">
              {['Rank', 'Concept Name', 'Concept ID', 'Terminology', 'Hybrid Score', 'Similarity', 'Signals', ''].map((h) => (
                <th key={h} className="px-4 py-2.5 text-xs font-medium text-white/35 uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-white/30 text-sm">
                  No candidates available
                </td>
              </tr>
            )}
            {sorted.map((c, i) => (
              <motion.tr
                key={c.concept_id || i}
                custom={i}
                variants={rowVariants}
                initial="hidden"
                animate="visible"
                className="border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors"
              >
                {/* Rank */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {i === 0 && <Trophy size={12} className="text-yellow-400" />}
                    <span className={`font-mono font-bold ${i === 0 ? 'text-yellow-400' : 'text-white/50'}`}>
                      #{c.rank ?? i + 1}
                    </span>
                  </div>
                </td>

                {/* Concept Name */}
                <td className="px-4 py-3 max-w-[180px]">
                  <span className="text-white text-sm leading-tight line-clamp-2">{c.concept_name}</span>
                </td>

                {/* Concept ID */}
                <td className="px-4 py-3">
                  <span className="font-mono text-cyan-400/80 text-xs">{c.concept_id}</span>
                </td>

                {/* Terminology */}
                <td className="px-4 py-3">
                  <TermBadge terminology={c.terminology} />
                </td>

                {/* Hybrid Score */}
                <td className="px-4 py-3">
                  <ScoreBar value={c.hybrid_score} />
                </td>

                {/* Similarity Score */}
                <td className="px-4 py-3">
                  <ScoreBar value={c.similarity_score} />
                </td>

                {/* Signals */}
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {(c.signals || []).map((sig, si) => (
                      <span
                        key={si}
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(129,140,248,0.1)', color: '#a5b4fc' }}
                      >
                        {sig}
                      </span>
                    ))}
                    {(!c.signals || c.signals.length === 0) && (
                      <span className="text-white/20 text-xs">—</span>
                    )}
                  </div>
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onAccept && onAccept(c)}
                      className="p-1.5 rounded-lg transition-all hover:scale-110"
                      style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}
                      title="Accept"
                    >
                      <Check size={12} className="text-green-400" />
                    </button>
                    <button
                      onClick={() => onReject && onReject(c)}
                      className="p-1.5 rounded-lg transition-all hover:scale-110"
                      style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}
                      title="Reject"
                    >
                      <X size={12} className="text-red-400" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

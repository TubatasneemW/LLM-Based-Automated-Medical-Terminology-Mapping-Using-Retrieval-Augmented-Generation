import { motion } from 'framer-motion';
import { Clock, ExternalLink } from 'lucide-react';

const CONFIDENCE_STYLES = {
  High: { bg: 'rgba(16,185,129,0.15)', border: '#10b981', text: '#10b981' },
  Medium: { bg: 'rgba(245,158,11,0.15)', border: '#f59e0b', text: '#f59e0b' },
  Low: { bg: 'rgba(239,68,68,0.15)', border: '#ef4444', text: '#ef4444' },
};

const STATUS_STYLES = {
  pending: { bg: 'rgba(99,102,241,0.12)', border: '#6366f1', text: '#818cf8' },
  accepted: { bg: 'rgba(16,185,129,0.12)', border: '#10b981', text: '#10b981' },
  rejected: { bg: 'rgba(239,68,68,0.12)', border: '#ef4444', text: '#ef4444' },
};

function formatDate(ts) {
  if (!ts) return '';
  try {
    return new Date(ts).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return ts;
  }
}

export default function MappingCard({ mapping, onClick }) {
  if (!mapping) return null;

  const {
    original_term,
    selected_concept,
    confidence_level,
    similarity_score,
    review_status,
    created_at,
  } = mapping;

  const confidenceStyle = CONFIDENCE_STYLES[confidence_level] || CONFIDENCE_STYLES.Medium;
  const statusStyle = STATUS_STYLES[review_status] || STATUS_STYLES.pending;
  const simPct = similarity_score != null ? Math.round(similarity_score * 100) : null;

  const terminology = selected_concept?.terminology || '';

  return (
    <motion.div
      onClick={onClick}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, boxShadow: '0 8px 32px rgba(6,182,212,0.15)' }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.25 }}
      className="relative rounded-xl p-4 cursor-pointer overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(6,182,212,0.12)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-cyan-400/60 uppercase tracking-widest mb-0.5">Original Term</p>
          <p className="text-white font-semibold text-base truncate">{original_term}</p>
        </div>
        <ExternalLink size={14} className="text-white/20 mt-1 flex-shrink-0" />
      </div>

      {/* Selected concept */}
      {selected_concept && (
        <div
          className="rounded-lg p-3 mb-3"
          style={{ background: 'rgba(6,182,212,0.07)', border: '1px solid rgba(6,182,212,0.15)' }}
        >
          <p className="text-white font-medium text-sm leading-tight mb-1">
            {selected_concept.concept_name}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-mono text-cyan-400/80">{selected_concept.concept_id}</span>
            {terminology && (
              <span
                className="px-2 py-0.5 rounded-full text-xs"
                style={{ background: 'rgba(129,140,248,0.15)', border: '1px solid rgba(129,140,248,0.3)', color: '#a5b4fc' }}
              >
                {terminology}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Scores & badges */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Confidence badge */}
        <span
          className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
          style={{ background: confidenceStyle.bg, border: `1px solid ${confidenceStyle.border}`, color: confidenceStyle.text }}
        >
          {confidence_level} Confidence
        </span>

        {/* Similarity score */}
        {simPct !== null && (
          <span className="text-xs text-white/50 font-mono">
            {simPct}% similarity
          </span>
        )}

        {/* Review status */}
        <span
          className="text-xs font-medium px-2.5 py-0.5 rounded-full capitalize"
          style={{ background: statusStyle.bg, border: `1px solid ${statusStyle.border}`, color: statusStyle.text }}
        >
          {review_status || 'pending'}
        </span>

        {/* Timestamp */}
        {created_at && (
          <span className="flex items-center gap-1 text-xs text-white/30 ml-auto">
            <Clock size={11} />
            {formatDate(created_at)}
          </span>
        )}
      </div>
    </motion.div>
  );
}

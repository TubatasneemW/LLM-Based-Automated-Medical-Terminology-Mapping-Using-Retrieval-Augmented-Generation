import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  History as HistoryIcon, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  ExternalLink,
  ChevronRight,
  Clock,
  Layers,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { getHistory, exportHistoryCSV } from '../services/api';

export default function History({ onNavigate, onMappingResult }) {
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [terminology, setTerminology] = useState('All');
  const [confidence, setConfidence] = useState('All');
  const [status, setStatus] = useState('All');
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const fetchRecords = async (reset = false) => {
    try {
      setLoading(true);
      const curOffset = reset ? 0 : offset;
      const res = await getHistory({
        search: search.trim() || undefined,
        terminology: terminology !== 'All' ? terminology : undefined,
        confidence: confidence !== 'All' ? confidence : undefined,
        status: status !== 'All' ? status : undefined,
        limit,
        offset: curOffset,
      });
      if (res && res.records) {
        if (reset) {
          setRecords(res.records);
          setOffset(limit);
        } else {
          setRecords((prev) => [...prev, ...res.records]);
          setOffset((prev) => prev + limit);
        }
        setTotal(res.total || 0);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords(true);
  }, [terminology, confidence, status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRecords(true);
  };

  const handleExport = () => {
    exportHistoryCSV();
  };

  const handleSelectMapping = (rec) => {
    if (onMappingResult) {
      onMappingResult(rec);
    }
    if (onNavigate) {
      onNavigate('explainability');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-cyan-electric mb-1 text-sm font-mono tracking-wider">
            <HistoryIcon className="w-4 h-4" />
            <span>AUDIT & CLINICAL LOGS</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Terminology Mapping History
          </h1>
          <p className="text-slate-muted text-sm mt-1">
            Browse, filter, inspect, and export all historical medical terminology mappings and clinician decisions.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchRecords(true)}
            className="p-2.5 rounded-xl glass-panel text-slate-300 hover:text-white hover:border-cyan-electric/40 transition-colors"
            title="Refresh history"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-midnight-800 hover:bg-midnight-700 border border-white/10 hover:border-cyan-electric/40 text-xs font-mono text-cyan-electric transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by clinical term, standardized concept, or ID..."
              className="w-full pl-10 pr-4 py-2 bg-midnight-950/80 rounded-xl border border-white/10 focus:border-cyan-electric text-xs text-white placeholder-slate-500 outline-none"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2 bg-cyan-electric text-midnight-950 font-bold text-xs uppercase tracking-wider rounded-xl hover:opacity-90 transition-opacity"
          >
            Search
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/5">
          {/* Terminology Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-mono text-slate-400 uppercase">System:</span>
            <select
              value={terminology}
              onChange={(e) => setTerminology(e.target.value)}
              className="flex-1 bg-midnight-950 px-3 py-1.5 rounded-lg border border-white/10 text-xs text-slate-200 outline-none focus:border-cyan-electric"
            >
              <option value="All">All Vocabularies</option>
              <option value="SNOMED CT">SNOMED CT</option>
              <option value="ICD-10-CM">ICD-10-CM</option>
              <option value="MeSH">MeSH</option>
              <option value="UMLS">UMLS</option>
            </select>
          </div>

          {/* Confidence Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Confidence:</span>
            <select
              value={confidence}
              onChange={(e) => setConfidence(e.target.value)}
              className="flex-1 bg-midnight-950 px-3 py-1.5 rounded-lg border border-white/10 text-xs text-slate-200 outline-none focus:border-cyan-electric"
            >
              <option value="All">All Levels</option>
              <option value="High">High Confidence</option>
              <option value="Medium">Medium Confidence</option>
              <option value="Low">Low / Flagged</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Review:</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="flex-1 bg-midnight-950 px-3 py-1.5 rounded-lg border border-white/10 text-xs text-slate-200 outline-none focus:border-cyan-electric"
            >
              <option value="All">All Decisions</option>
              <option value="Accepted">Accepted</option>
              <option value="Pending">Pending Review</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Record Counter */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
        <span>Showing {records.length} of {total} records</span>
      </div>

      {/* Records List */}
      {records.length > 0 ? (
        <div className="space-y-3">
          {records.map((rec, idx) => {
            const isAccepted = rec.review_status === 'Accepted';
            const isRejected = rec.review_status === 'Rejected';
            const conf = rec.confidence_label || (rec.confidence_score >= 0.82 ? 'High' : rec.confidence_score >= 0.65 ? 'Medium' : 'Low');

            return (
              <motion.div
                key={rec.mapping_id || idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02 }}
                onClick={() => handleSelectMapping(rec)}
                className="glass-panel p-4 rounded-xl border border-white/10 hover:border-cyan-electric/40 cursor-pointer transition-all duration-200 group flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-[10px] text-slate-400 px-2 py-0.5 rounded bg-white/5 border border-white/10">
                      {rec.selected_concept?.terminology || rec.target_terminology || 'SNOMED CT'}
                    </span>
                    <span className="font-mono text-[10px] text-cyan-electric">
                      ID: {rec.selected_concept?.concept_id || 'N/A'}
                    </span>
                    <span className="text-slate-500 text-[10px]">•</span>
                    <span className="text-[10px] text-slate-400 flex items-center space-x-1 font-mono">
                      <Clock className="w-3 h-3 inline" />
                      <span>{rec.timestamp ? new Date(rec.timestamp).toLocaleDateString() : 'Recent'}</span>
                    </span>
                  </div>

                  <div className="flex items-baseline space-x-2">
                    <span className="text-sm font-semibold text-slate-200 group-hover:text-cyan-electric transition-colors">
                      {rec.original_term}
                    </span>
                    <span className="text-xs text-slate-500">→</span>
                    <span className="text-sm font-bold text-white">
                      {rec.selected_concept?.concept_name || 'Mapped Concept'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {/* Confidence Pill */}
                  <div className="text-right">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        conf === 'High'
                          ? 'bg-teal-medical/10 border-teal-medical/30 text-teal-medical'
                          : conf === 'Medium'
                          ? 'bg-cyan-electric/10 border-cyan-electric/30 text-cyan-electric'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                      }`}
                    >
                      {conf} ({Math.round((rec.confidence_score || 0.85) * 100)}%)
                    </span>
                  </div>

                  {/* Status */}
                  <div className="w-24 text-right">
                    <span
                      className={`text-xs font-mono inline-flex items-center space-x-1 ${
                        isAccepted
                          ? 'text-teal-bright'
                          : isRejected
                          ? 'text-rose-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {isAccepted ? (
                        <CheckCircle className="w-3.5 h-3.5" />
                      ) : isRejected ? (
                        <XCircle className="w-3.5 h-3.5" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5" />
                      )}
                      <span>{rec.review_status || 'Pending'}</span>
                    </span>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-electric group-hover:translate-x-1 transition-all" />
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="glass-panel p-12 rounded-2xl text-center border border-white/10 space-y-3">
          <HistoryIcon className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">No Mapping Records Found</h3>
          <p className="text-xs text-slate-muted max-w-sm mx-auto">
            Try adjusting your search query, or run new queries in the Terminology Mapping Workspace.
          </p>
          <button
            onClick={() => onNavigate('workspace')}
            className="px-4 py-2 bg-cyan-electric text-midnight-950 font-bold text-xs uppercase tracking-wider rounded-xl hover:opacity-90 transition-opacity"
          >
            Go To Workspace
          </button>
        </div>
      )}

      {/* Pagination Load More */}
      {records.length < total && (
        <div className="text-center pt-4">
          <button
            onClick={() => fetchRecords(false)}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl glass-panel text-xs font-mono text-cyan-electric border border-cyan-electric/30 hover:bg-midnight-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load More Historical Records'}
          </button>
        </div>
      )}
    </div>
  );
}

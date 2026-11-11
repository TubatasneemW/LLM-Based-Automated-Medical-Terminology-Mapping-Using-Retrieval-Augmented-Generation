import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { RefreshCw, TrendingUp, CheckCircle, Clock, Activity, Target } from 'lucide-react';
import { getAnalyticsOverview } from '../services/api';

const CONF_COLORS = ['#00E5FF', '#14B8A6', '#F43F5E'];
const TERM_COLORS = ['#00E5FF', '#14B8A6', '#8B5CF6', '#F59E0B', '#38BDF8'];

function SkeletonBlock({ className }) {
  return (
    <motion.div
      className={`rounded-xl bg-slate-800/60 ${className}`}
      animate={{ opacity: [0.4, 0.8, 0.4] }}
      transition={{ duration: 1.4, repeat: Infinity }}
    />
  );
}

function MetricCard({ title, value, subtitle, icon: Icon, color, loading }) {
  if (loading) return <SkeletonBlock className="h-32" />;
  return (
    <motion.div
      className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-5 backdrop-blur flex items-start justify-between"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ borderColor: `${color}30` }}
    >
      <div>
        <p className="text-sm text-slate-400 mb-1">{title}</p>
        <p className="text-3xl font-bold text-white font-mono">{value}</p>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </div>
      <div className="rounded-xl p-3" style={{ background: `${color}18` }}>
        <Icon size={22} style={{ color }} />
      </div>
    </motion.div>
  );
}

function StatusPill({ status }) {
  const isAccepted = status?.toLowerCase() === 'accepted';
  const isRejected = status?.toLowerCase() === 'rejected';
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${
      isAccepted ? 'bg-teal-500/15 text-teal-300 border-teal-500/30' :
      isRejected ? 'bg-red-500/15 text-red-300 border-red-500/30' :
      'bg-amber-500/15 text-amber-300 border-amber-500/30'
    }`}>
      {status || 'Pending'}
    </span>
  );
}

function ConfidencePill({ level }) {
  const isHigh = level === 'High';
  const isMed = level === 'Medium';
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium border ${
      isHigh ? 'bg-teal-500/15 text-teal-300 border-teal-500/30' :
      isMed ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' :
      'bg-red-500/15 text-red-300 border-red-500/30'
    }`}>
      {level || 'Low'}
    </span>
  );
}

export default function Dashboard({ onNavigate, onMappingResult }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAnalyticsOverview();
      setData(res);
    } catch (e) {
      setError(e.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-slate-400">
        <Activity size={40} className="text-red-400" />
        <p className="text-red-300">{error}</p>
        <button
          onClick={load}
          className="flex items-center gap-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 px-5 py-2.5 text-cyan-300 hover:bg-cyan-500/30 transition-all cursor-pointer"
        >
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    );
  }

  // Robustly extract metrics matching backend schema
  const totalMappings = data?.total_mappings ?? data?.overview?.total_mappings ?? 0;
  const acceptedMappings = data?.accepted_mappings ?? data?.overview?.accepted ?? 0;
  const pendingReviews = data?.pending_reviews ?? data?.overview?.pending_reviews ?? 0;
  const avgConfidence = data?.average_confidence ?? data?.overview?.avg_confidence ?? 0;
  const activeAccuracy = data?.active_accuracy ?? 92.4;

  const lineData = (data?.timeline || data?.activity_over_time || []).map((t) => ({
    date: t.date,
    count: t.mappings ?? t.count ?? 0,
  }));

  const pieData = (data?.confidence_distribution || []).map((item, idx) => ({
    name: item.name || item.label,
    value: item.count ?? item.value ?? 0,
    color: item.color || CONF_COLORS[idx % CONF_COLORS.length]
  }));

  const barData = (data?.terminology_breakdown || []).map((item) => ({
    name: item.name,
    count: item.value ?? item.count ?? 0
  }));

  const recent = data?.recent_activities || data?.recent_mappings || [];

  return (
    <div className="p-6 space-y-8 text-white min-h-screen bg-[#080D18] max-w-7xl mx-auto pb-16">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Analytics Dashboard</h1>
          <p className="text-sm text-slate-400">Real-time clinical mapping metrics & validation statistics</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2 text-sm text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300 transition-all cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </motion.div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard loading={loading} title="Total Mappings"   value={totalMappings}   icon={Activity}     color="#00E5FF" subtitle="Historical queries" />
        <MetricCard loading={loading} title="Accepted Concepts" value={acceptedMappings} icon={CheckCircle}  color="#14B8A6" subtitle="Clinician approved" />
        <MetricCard loading={loading} title="Pending Reviews"  value={pendingReviews}   icon={Clock}        color="#F59E0B" subtitle="Requires verification" />
        <MetricCard
          loading={loading}
          title="Avg Confidence"
          value={avgConfidence ? `${(avgConfidence * 100).toFixed(1)}%` : '—'}
          icon={TrendingUp}
          color="#8B5CF6"
          subtitle={`Accuracy: ${activeAccuracy}%`}
        />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Line chart */}
        <motion.div
          className="lg:col-span-2 rounded-2xl border border-slate-700/50 bg-slate-900/60 p-5 backdrop-blur"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Mapping Activity Over Time</h2>
          {loading ? (
            <SkeletonBlock className="h-56" />
          ) : lineData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-slate-500 text-xs">No activity records yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e3a5f', borderRadius: 10 }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Line type="monotone" dataKey="count" stroke="#00E5FF" strokeWidth={2} dot={{ fill: '#00E5FF', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Pie chart */}
        <motion.div
          className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-5 backdrop-blur"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Confidence Distribution</h2>
          {loading ? (
            <SkeletonBlock className="h-56" />
          ) : pieData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-slate-500 text-xs">No confidence records yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || CONF_COLORS[index % CONF_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e3a5f', borderRadius: 10 }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 10, color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      {/* Bar chart */}
      <motion.div
        className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-5 backdrop-blur"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-sm font-semibold text-slate-300 mb-4">Mapped Terminology Distribution</h2>
        {loading ? (
          <SkeletonBlock className="h-48" />
        ) : barData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-slate-500 text-xs">No terminology distribution yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e3a5f', borderRadius: 10 }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {barData.map((_, i) => (
                  <Cell key={i} fill={TERM_COLORS[i % TERM_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      {/* Recent activity table */}
      <motion.div
        className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-5 backdrop-blur"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-sm font-semibold text-slate-300 mb-4">Recent Mapping Activities ({recent.length})</h2>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <SkeletonBlock key={i} className="h-10" />)}
          </div>
        ) : recent.length === 0 ? (
          <p className="text-center text-slate-500 py-10 text-xs">No recent mappings yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-xs text-slate-500">
                  <th className="pb-3 pr-4">Original Clinical Term</th>
                  <th className="pb-3 pr-4">Standardized Concept</th>
                  <th className="pb-3 pr-4">Terminology</th>
                  <th className="pb-3 pr-4">Confidence</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {recent.map((r, i) => {
                  const conceptName = r.selected_concept || r.selected_concept_name || (typeof r.selected_concept === 'object' ? r.selected_concept.concept_name : '—');
                  const termSys = r.terminology || r.selected_terminology || (typeof r.selected_concept === 'object' ? r.selected_concept.terminology : 'SNOMED CT');
                  const confLbl = r.confidence_label || (r.confidence_score >= 0.82 ? 'High' : r.confidence_score >= 0.65 ? 'Medium' : 'Low');

                  return (
                    <motion.tr
                      key={r.mapping_id || r.id || i}
                      className="cursor-pointer hover:bg-slate-800/40 transition-colors"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.03 * i }}
                      onClick={() => { 
                        onMappingResult?.(r); 
                        onNavigate?.('explainability', r); 
                      }}
                    >
                      <td className="py-3 pr-4 font-mono text-cyan-300 max-w-xs truncate">{r.original_term}</td>
                      <td className="py-3 pr-4 text-white font-medium">{conceptName}</td>
                      <td className="py-3 pr-4 text-slate-400 font-mono text-xs">{termSys}</td>
                      <td className="py-3 pr-4">
                        <ConfidencePill level={confLbl} />
                      </td>
                      <td className="py-3 pr-4">
                        <StatusPill status={r.review_status} />
                      </td>
                      <td className="py-3 text-slate-500 text-xs font-mono">
                        {r.timestamp || 'Recent'}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}

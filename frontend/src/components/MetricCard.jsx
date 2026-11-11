import { useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

function AnimatedCounter({ value }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => {
    if (typeof value === 'string') return value;
    if (Number.isInteger(value)) return Math.round(v).toLocaleString();
    return v.toFixed(2);
  });

  useEffect(() => {
    const numeric = parseFloat(String(value).replace(/[^0-9.]/g, ''));
    if (!isNaN(numeric)) {
      const controls = animate(count, numeric, { duration: 1.4, ease: 'easeOut' });
      return controls.stop;
    }
  }, [value]);

  if (typeof value === 'string' && isNaN(parseFloat(value))) {
    return <span>{value}</span>;
  }

  return <motion.span>{rounded}</motion.span>;
}

const TrendIcon = ({ trend }) => {
  if (trend === 'up') return <TrendingUp size={14} className="text-green-400" />;
  if (trend === 'down') return <TrendingDown size={14} className="text-red-400" />;
  return <Minus size={14} className="text-gray-400" />;
};

export default function MetricCard({ title, value, subtitle, icon: Icon, color = '#06b6d4', trend }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="relative rounded-xl p-5 overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${color}33`,
        boxShadow: `0 0 20px ${color}18, inset 0 0 20px rgba(0,0,0,0.2)`,
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Glow top-right */}
      <div
        className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20 blur-2xl pointer-events-none"
        style={{ backgroundColor: color }}
      />

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color: `${color}cc` }}>
            {title}
          </p>
          <p className="text-3xl font-bold text-white leading-none mb-1">
            <AnimatedCounter value={value} />
          </p>
          {subtitle && (
            <p className="text-xs text-white/40 mt-1">{subtitle}</p>
          )}
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              <TrendIcon trend={trend} />
              <span className="text-xs text-white/40 capitalize">{trend === 'up' ? 'Improving' : trend === 'down' ? 'Declining' : 'Stable'}</span>
            </div>
          )}
        </div>

        {Icon && (
          <div
            className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ml-3"
            style={{ background: `${color}18`, border: `1px solid ${color}33` }}
          >
            <Icon size={22} style={{ color }} />
          </div>
        )}
      </div>

      {/* Bottom shimmer */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${color}66, transparent)` }}
      />
    </motion.div>
  );
}

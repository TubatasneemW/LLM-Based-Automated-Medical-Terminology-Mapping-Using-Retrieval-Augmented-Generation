import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  LayoutDashboard,
  Wand2,
  Lightbulb,
  Network,
  History,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const NAV_ITEMS = [
  { key: 'landing', label: 'Home', icon: Home },
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'workspace', label: 'Mapping Workspace', icon: Wand2 },
  { key: 'explainability', label: 'Explainability', icon: Lightbulb },
  { key: 'pipeline', label: 'RAG Pipeline', icon: Network },
  { key: 'history', label: 'History', icon: History },
  { key: 'evaluation', label: 'Evaluation', icon: BarChart3 },
];

const sidebarVariants = {
  open: { width: 240, transition: { duration: 0.3, ease: 'easeInOut' } },
  closed: { width: 64, transition: { duration: 0.3, ease: 'easeInOut' } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.07, duration: 0.3 },
  }),
};

export default function Sidebar({ currentPage, onNavigate, collapsed, onToggle }) {
  return (
    <motion.aside
      variants={sidebarVariants}
      animate={collapsed ? 'closed' : 'open'}
      initial="open"
      className="fixed left-0 top-16 bottom-0 z-40 flex flex-col overflow-hidden"
      style={{
        background: 'rgba(8, 13, 24, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRight: '1px solid rgba(6, 182, 212, 0.1)',
      }}
    >
      {/* Nav items */}
      <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
        {NAV_ITEMS.map(({ key, label, icon: Icon }, i) => {
          const isActive = currentPage === key;
          return (
            <motion.button
              key={key}
              custom={i}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              onClick={() => onNavigate(key)}
              className="relative w-full flex items-center gap-3 px-4 py-3 text-left transition-colors group"
              style={{
                color: isActive ? '#06b6d4' : 'rgba(255,255,255,0.55)',
              }}
              whileHover={{ backgroundColor: 'rgba(6,182,212,0.07)' }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Active left border */}
              <AnimatePresence>
                {isActive && (
                  <motion.span
                    key="border"
                    layoutId="active-border"
                    className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r"
                    style={{
                      background: 'linear-gradient(180deg, #06b6d4, #818cf8)',
                      boxShadow: '0 0 8px #06b6d4',
                    }}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    exit={{ scaleY: 0 }}
                    transition={{ duration: 0.25 }}
                  />
                )}
              </AnimatePresence>

              {/* Icon */}
              <span
                className="flex-shrink-0"
                style={{
                  filter: isActive ? 'drop-shadow(0 0 6px #06b6d4)' : 'none',
                }}
              >
                <Icon size={20} />
              </span>

              {/* Label */}
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    key="label"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm font-medium whitespace-nowrap overflow-hidden"
                    style={{ color: isActive ? '#06b6d4' : undefined }}
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="flex items-center justify-center h-12 border-t text-cyan-400/60 hover:text-cyan-400 transition-colors"
        style={{ borderColor: 'rgba(6,182,212,0.1)' }}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </motion.aside>
  );
}

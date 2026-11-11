import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';

const DnaIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M10 4C10 4 14 8 16 12C18 16 22 20 22 20"
      stroke="url(#dna-grad1)"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <path
      d="M22 4C22 4 18 8 16 12C14 16 10 20 10 20"
      stroke="url(#dna-grad2)"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <path d="M11.5 8.5H20.5" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
    <path d="M11 12H21" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
    <path d="M11.5 15.5H20.5" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
    <path
      d="M10 20C10 20 14 24 16 28"
      stroke="url(#dna-grad1)"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <path
      d="M22 20C22 20 18 24 16 28"
      stroke="url(#dna-grad2)"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <path d="M11.5 23.5H20.5" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
    <defs>
      <linearGradient id="dna-grad1" x1="10" y1="4" x2="22" y2="20" gradientUnits="userSpaceOnUse">
        <stop stopColor="#06b6d4" />
        <stop offset="1" stopColor="#7c3aed" />
      </linearGradient>
      <linearGradient id="dna-grad2" x1="22" y1="4" x2="10" y2="20" gradientUnits="userSpaceOnUse">
        <stop stopColor="#7c3aed" />
        <stop offset="1" stopColor="#06b6d4" />
      </linearGradient>
    </defs>
  </svg>
);

export default function Navbar({ onToggleSidebar }) {
  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-16"
      style={{
        background: 'rgba(8, 13, 24, 0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(6, 182, 212, 0.15)',
        boxShadow: '0 4px 32px rgba(0,0,0,0.4)',
      }}
    >
      {/* Left: hamburger + logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors text-cyan-400"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>

        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <DnaIcon />
          <span
            className="text-xl font-bold tracking-wide"
            style={{
              background: 'linear-gradient(90deg, #06b6d4, #818cf8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            MedRAG
          </span>
        </motion.div>
      </div>

      {/* Right: badges */}
      <motion.div
        className="flex items-center gap-3"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        {/* AI Platform badge */}
        <span
          className="text-xs font-semibold px-3 py-1 rounded-full tracking-widest uppercase"
          style={{
            background: 'rgba(6, 182, 212, 0.1)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            color: '#06b6d4',
          }}
        >
          AI Platform
        </span>

        {/* System Online indicator */}
        <div className="flex items-center gap-2 text-xs text-green-400 font-medium">
          <motion.span
            className="inline-block w-2 h-2 rounded-full bg-green-400"
            animate={{ opacity: [1, 0.3, 1], scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          System Online
        </div>
      </motion.div>
    </motion.header>
  );
}

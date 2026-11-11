/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        midnight: {
          950: '#050810',
          900: '#080D18',
          800: '#0B1220',
          700: '#111B30',
          600: '#182744',
        },
        cyan: {
          electric: '#00E5FF',
          glow: '#38BDF8',
        },
        teal: {
          medical: '#14B8A6',
          bright: '#2DD4BF',
        },
        violet: {
          soft: '#8B5CF6',
          glow: '#A855F7',
        },
        slate: {
          muted: '#94A3B8',
          subtle: '#64748B',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow-pulse': 'glow 3s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 15px rgba(0, 229, 255, 0.2)' },
          '100%': { boxShadow: '0 0 30px rgba(0, 229, 255, 0.6), 0 0 15px rgba(20, 184, 166, 0.4)' },
        }
      }
    },
  },
  plugins: [],
}


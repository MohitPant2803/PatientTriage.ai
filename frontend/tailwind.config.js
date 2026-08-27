/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        slate: {
          850: '#131d31',
          900: '#0b1324',
          925: '#080d19',
          950: '#040711',
        },
        clinical: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          850: '#141e33',
          900: '#0b1324',
          950: '#040711',
        },
        esi: {
          1: '#dc2626', // Resuscitation (Red)
          2: '#ea580c', // Emergent (Orange)
          3: '#d97706', // Urgent (Amber)
          4: '#059669', // Less Urgent (Emerald)
          5: '#0284c7', // Non-Urgent (Sky)
        }
      },
      fontFamily: {
        sans: ['Geist', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['Geist Mono', 'JetBrains Mono', 'Menlo', 'Consolas', 'monospace']
      },
      transitionTimingFunction: {
        'tactile': 'cubic-bezier(0.16, 1, 0.3, 1)',
      }
    },
  },
  plugins: [],
}

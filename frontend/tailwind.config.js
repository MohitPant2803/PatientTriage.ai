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
          50: '#f8fafc',
          100: '#f1f5f9',
          150: '#e9eef5',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          850: '#131d31',
          900: '#0f172a',
          950: '#020617',
        },
        clinical: {
          canvas: '#f8fafc',
          card: '#ffffff',
          border: '#e2e8f0',
          'border-subtle': '#edf2f7',
          brand: '#0284c7',
          'brand-dark': '#0369a1',
          'brand-light': '#f0f9ff',
          'brand-border': '#bae6fd',
        },
        esi: {
          1: '#dc2626', // Resuscitation (Red)
          2: '#d97706', // Emergent (Amber)
          3: '#b45309', // Urgent (Warm Ochre)
          4: '#059669', // Less Urgent (Emerald)
          5: '#475569', // Non-Urgent (Slate)
        }
      },
      fontFamily: {
        sans: ['Geist', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['Geist Mono', 'JetBrains Mono', 'Menlo', 'Consolas', 'monospace']
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'modal': '0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.05)',
      },
      transitionTimingFunction: {
        'tactile': 'cubic-bezier(0.16, 1, 0.3, 1)',
      }
    },
  },
  plugins: [],
}

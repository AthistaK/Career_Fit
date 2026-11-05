/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6', // SkillSync Violet Accent
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        dark: {
          bg: '#0B0A19',
          sidebar: '#100E21',
          card: '#19162C',
          surface: '#211D38',
          border: '#2A2548',
          muted: '#A5A1BA',
          text: '#F8FAFC',
          violet: '#8B5CF6',
          lavender: '#A78BFA',
        },
        accent: {
          cyan: '#06b6d4',
          teal: '#0d9488',
          violet: '#8b5cf6',
          lavender: '#a78bfa',
          navy: '#100e21',
        },
        score: {
          high: '#10b981',    // Emerald / Green
          medium: '#f59e0b',  // Amber / Orange
          low: '#f43f5e',     // Rose / Red
          matched: '#10b981',
          partial: '#f59e0b',
          missing: '#f43f5e',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'soft-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.2)',
        'soft': '0 4px 14px 0 rgba(0, 0, 0, 0.25)',
        'soft-md': '0 6px 18px -2px rgba(0, 0, 0, 0.3)',
        'soft-lg': '0 12px 28px -4px rgba(0, 0, 0, 0.35)',
        'glow-violet': '0 0 24px -4px rgba(139, 92, 246, 0.35)',
        'glow-indigo': '0 0 24px -4px rgba(139, 92, 246, 0.35)',
        'glow-cyan': '0 0 24px -4px rgba(6, 182, 212, 0.25)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
}

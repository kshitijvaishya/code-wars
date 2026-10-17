/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#dce8ff',
          200: '#b9d0ff',
          300: '#86aeff',
          400: '#567eff',
          500: '#3a57ff',
          600: '#2232f5',
          700: '#1b22e1',
          800: '#1c21b6',
          900: '#1d2290',
        },
        dark: {
          950: '#08090e',
          900: '#0d0f18',
          800: '#12151f',
          700: '#181b27',
          600: '#1f2333',
          500: '#252a3a',
          400: '#2f3548',
          300: '#3d4460',
          200: '#4e5880',
          100: '#6b78a8',
        },
        accent: {
          green: '#22c55e',
          red: '#ef4444',
          yellow: '#eab308',
          orange: '#f97316',
          purple: '#a855f7',
          cyan: '#06b6d4',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'countdown': 'countdown 1s linear infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};

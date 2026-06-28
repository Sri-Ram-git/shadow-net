/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          50: '#f0f0f0',
          100: '#e0e0e0',
          200: '#c0c0c0',
          300: '#a0a0a0',
          400: '#808080',
          500: '#606060',
          600: '#404040',
          700: '#2a2a2a',
          800: '#1a1a1a',
          900: '#0f0f0f',
          950: '#070707',
        },
        accent: {
          DEFAULT: '#00d4ff',
          50: '#e0f9ff',
          100: '#b8f0ff',
          200: '#70e4ff',
          300: '#28d8ff',
          400: '#00d4ff',
          500: '#00a8cc',
          600: '#008099',
          700: '#005566',
          800: '#003d4d',
          900: '#002633',
        },
        danger: {
          DEFAULT: '#ff4757',
          400: '#ff6b7a',
          500: '#ff4757',
          600: '#cc3946',
        },
        success: {
          DEFAULT: '#2ed573',
          400: '#5ce092',
          500: '#2ed573',
          600: '#25aa5c',
        },
        warning: {
          DEFAULT: '#ffa502',
          400: '#ffbe3a',
          500: '#ffa502',
          600: '#cc8402',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 212, 255, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 212, 255, 0.4)' },
        },
      },
    },
  },
  plugins: [],
};

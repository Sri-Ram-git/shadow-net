/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#050505',
          50: '#0a0a0a',
          100: '#101010',
          200: '#161616',
          300: '#1e1e1e',
          400: '#2a2a2a',
          500: '#363636',
        },
        ink: {
          DEFAULT: '#ffffff',
          50: '#f5f5f5',
          100: '#e5e5e5',
          200: '#cccccc',
          300: '#9a9a9a',
          400: '#666666',
          500: '#444444',
        },
        border: {
          DEFAULT: '#2a2a2a',
          light: '#363636',
          dark: '#1e1e1e',
        },
        signal: {
          red: '#c42b2b',
          green: '#2b7a42',
          amber: '#a67c00',
          blue: '#2b6ba4',
        },
        critical: {
          DEFAULT: '#c42b2b',
          bg: '#1a0808',
        },
        safe: {
          DEFAULT: '#2b7a42',
          bg: '#081a0e',
        },
        warning: {
          DEFAULT: '#a67c00',
          bg: '#1a1400',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Helvetica Neue', 'sans-serif'],
        mono: ['SF Mono', 'JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xl': ['1.75rem', { lineHeight: '2rem', letterSpacing: '-0.01em' }],
        '3xl': ['2rem', { lineHeight: '2.25rem', letterSpacing: '-0.015em' }],
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
        30: '7.5rem',
      },
      maxWidth: {
        content: '1440px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        'fade': 'fadeIn 0.4s ease-out',
        'fade-up': 'fadeUp 0.5s ease-out',
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

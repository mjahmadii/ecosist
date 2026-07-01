/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#e0e8ff',
          200: '#c0ceff',
          300: '#93a8ff',
          400: '#6479ff',
          500: '#3d52ff',
          600: '#2535f5',
          700: '#1d27e0',
          800: '#1e22b4',
          900: '#1e228e',
          950: '#131456',
        },
        accent: {
          cyan: '#00d4ff',
          emerald: '#00c48c',
          amber: '#f59e0b',
          rose: '#f43f5e',
          violet: '#8b5cf6',
          gold: '#d97706',
        },
      },
      fontFamily: {
        sans: ['Vazirmatn', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'mesh-dark': 'radial-gradient(at 40% 20%, hsla(228,100%,74%,0.12) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189,100%,56%,0.08) 0px, transparent 50%)',
        'mesh-light': 'radial-gradient(at 40% 20%, hsla(228,100%,74%,0.06) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189,100%,56%,0.04) 0px, transparent 50%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-left': 'slideInLeft 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fadeIn 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(61, 82, 255, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(61, 82, 255, 0.7), 0 0 40px rgba(61, 82, 255, 0.3)' },
        },
      },
      boxShadow: {
        'glow-brand': '0 0 24px rgba(61, 82, 255, 0.35)',
        'glow-cyan': '0 0 24px rgba(0, 212, 255, 0.35)',
        'glow-emerald': '0 0 24px rgba(0, 196, 140, 0.35)',
        'glow-amber': '0 0 24px rgba(245, 158, 11, 0.35)',
        'glow-rose': '0 0 24px rgba(244, 63, 94, 0.35)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.25)',
        'card-hover': '0 12px 40px rgba(0, 0, 0, 0.4)',
        'card-light': '0 4px 24px rgba(0, 0, 0, 0.08)',
        'card-light-hover': '0 12px 40px rgba(0, 0, 0, 0.14)',
      },
    },
  },
  plugins: [],
};

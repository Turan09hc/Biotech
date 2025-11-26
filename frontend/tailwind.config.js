/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#0B0F1A',
        'dark-card': '#131827',
        'dark-border': '#1F2633',
        'text-primary': '#E8EAEE',
        'text-secondary': '#9199A8',
        'purple-accent': '#A68CFF',
        'purple-light': '#C4B4FF',
        'cyan-accent': '#06B6D4',
        'lime-accent': '#10B981',
        'amber-accent': '#F59E0B',
      },
      fontFamily: {
        'sans': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        'mono': ['Monaco', 'monospace'],
      },
      fontSize: {
        'xs': ['12px', '16px'],
        'sm': ['14px', '20px'],
        'base': ['16px', '24px'],
        'lg': ['18px', '28px'],
        'xl': ['20px', '28px'],
        '2xl': ['24px', '32px'],
        '3xl': ['30px', '36px'],
        '4xl': ['36px', '40px'],
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
      },
      boxShadow: {
        'light': '0 1px 2px rgba(0,0,0,0.05)',
        'md': '0 4px 6px rgba(0,0,0,0.1)',
        'lg': '0 10px 15px rgba(0,0,0,0.1)',
        'xl': '0 20px 25px rgba(0,0,0,0.1)',
        'card': '0 4px 6px rgba(0,0,0,0.1)',
        'glow': '0 0 20px rgba(166, 140, 255, 0.3)',
        'glow-lg': '0 0 40px rgba(166, 140, 255, 0.4)',
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
        '2xl': '32px',
        '3xl': '48px',
      },
      opacity: {
        '5': '0.05',
        '10': '0.1',
        '15': '0.15',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'counter': 'counter 1s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(166, 140, 255, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(166, 140, 255, 0.5)' },
        },
        counter: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      backgroundImage: {
        'gradient-purple': 'linear-gradient(135deg, #A68CFF 0%, #C4B4FF 100%)',
        'gradient-to-purple': 'linear-gradient(to bottom, #A68CFF, transparent)',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}
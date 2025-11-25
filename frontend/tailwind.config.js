/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#0A0F1F',
        'dark-card': '#11172A',
        'dark-text': '#E0E6FF',
        'dark-border': '#1B233A',
        'purple-accent': '#7F5AF0',
        'purple-light': '#9D7FE8',
      },
      boxShadow: {
        card: '0 4px 20px rgba(0, 0, 0, 0.35)',
        glow: '0 0 12px rgba(127, 90, 240, 0.6)',
      },
    },
  },
  plugins: [],
};

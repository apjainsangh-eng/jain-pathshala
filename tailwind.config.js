/** @type {import('tailwindcss').Config} */

// Pathshala palette: kesar (saffron), kumkum (deep red), chandan (sandalwood cream), sona (gold)
const kumkum = {
  50: '#fdf2f3', 100: '#fbe3e6', 200: '#f6c7cd', 300: '#ee9ea8', 400: '#e0687a',
  500: '#c23a52', 600: '#a32640', 700: '#861d35', 800: '#6f1a2f', 900: '#5d1a2c', 950: '#350a16',
};

module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        kumkum,
        // The admin screens were built with "indigo" as their accent; mapping it to kumkum
        // gives every screen the same temple palette without rewriting each class.
        indigo: kumkum,
        kesar: {
          50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74', 400: '#fb923c',
          500: '#f2760e', 600: '#d9600f', 700: '#b34a0c', 800: '#8f3c12', 900: '#743312',
        },
        chandan: { 50: '#fffdf8', 100: '#fdf8ee', 200: '#f8eed9', 300: '#f1dfba', 400: '#e6c88f' },
        sona: { 300: '#f5d77a', 400: '#eec24a', 500: '#d4a017', 600: '#b0820f' },
      },
      fontFamily: {
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-body)', 'serif'],
      },
      boxShadow: {
        temple: '0 10px 30px -12px rgba(134, 29, 53, 0.35)',
      },
    },
  },
  plugins: [],
};

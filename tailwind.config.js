/** @type {import('tailwindcss').Config} */

// Pathshala palette (bright): kesar (sunny saffron), kumkum (raspberry rose), chandan (light cream), sona (sunflower)
const kumkum = {
  50: '#fff0f5', 100: '#ffe0eb', 200: '#ffc1d6', 300: '#ff8fb2', 400: '#f65a8d',
  500: '#ea336f', 600: '#d81b60', 700: '#b0124c', 800: '#85103d', 900: '#640e31', 950: '#3a0519',
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
          50: '#fff8ed', 100: '#ffefd4', 200: '#ffdba8', 300: '#ffc070', 400: '#ff9f3d',
          500: '#ff8418', 600: '#ee6a0b', 700: '#c4530a', 800: '#9a410f', 900: '#7c3610',
        },
        chandan: { 50: '#fffdf9', 100: '#fff8ec', 200: '#fdefd8', 300: '#f9e2bf', 400: '#f2cd92' },
        sona: { 300: '#ffe27a', 400: '#ffd23f', 500: '#f5b700', 600: '#c99400' },
      },
      fontFamily: {
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-body)', 'serif'],
      },
      boxShadow: {
        temple: '0 12px 30px -12px rgba(216, 27, 96, 0.35)',
      },
    },
  },
  plugins: [],
};

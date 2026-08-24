/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        khmer: ['"Kantunruoy Pro"', '"Battambang"', '"Siemreap"', 'sans-serif'],
        sans: ['Inter', '"Kantunruoy Pro"', '"Battambang"', 'sans-serif']
      },
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#16a34a',
          600: '#15803d',
          700: '#166534',
          800: '#14532d',
          900: '#052e16'
        },
        census: {
          blue: '#1e40af',
          gold: '#d97706',
          dark: '#0f172a'
        }
      }
    },
  },
  plugins: [],
}

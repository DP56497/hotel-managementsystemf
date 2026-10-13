/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Outfit"', 'system-ui', '-apple-system', 'sans-serif']
      },
      colors: {
        brand: {
          50: '#f5f7ff',
          500: '#4f46e5',
          600: '#4338ca',
          700: '#3730a3'
        },
        gold: {
          50: '#fffdf5',
          100: '#fef9e3',
          200: '#fcf0be',
          300: '#f9e18b',
          400: '#f4cb48',
          500: '#d97706',
          600: '#b45309',
          700: '#92400e',
          800: '#78350f',
          900: '#451a03'
        }
      },
      boxShadow: {
        premium: '0 20px 60px rgba(79, 70, 229, 0.18)',
        luxury: '0 20px 50px -12px rgba(15, 23, 42, 0.08)',
        'luxury-hover': '0 25px 60px -15px rgba(15, 23, 42, 0.14)',
        'glow-gold': '0 0 30px -5px rgba(217, 119, 6, 0.25)',
        'glow-emerald': '0 0 30px -5px rgba(16, 185, 129, 0.25)'
      }
    }
  },
  plugins: []
};

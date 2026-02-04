/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1B5E20', // เขียวเข้ม
          light: '#2E7D32',
          dark: '#0D3311',
        },
        gold: {
          DEFAULT: '#D4AF37', // ทอง
          light: '#F4D03F',
          dark: '#B7950B',
        },
        cream: {
          DEFAULT: '#FDFBF7', // ขาวครีม
          light: '#FFFFFF',
          dark: '#F5F0E8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Sarabun', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
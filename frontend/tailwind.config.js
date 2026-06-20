/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          light: '#F4F6F0',       // Soft light grey-sage
          DEFAULT: '#92c13e',     // Bright leaf green (#92c13e)
          primary: '#92c13e',     // Bright leaf green
          secondary: '#E8EDE5',   // Soft light sage-gray green tint
          dark: '#FFFFFF',        // Pure white for panels & cards
          darker: '#FAF9F6',      // Root page background (off-white)
          accent: '#d8cd10',      // Logo yellow (#d8cd10)
          border: 'rgba(17, 17, 17, 0.08)', // Thin neutral border
        }
      },
      fontFamily: {
        sans: ['Outfit', '"Plus Jakarta Sans"', 'Manrope', 'sans-serif'],
        serif: ['Lora', 'Playfair Display', 'serif'],
        jakarta: ['"Plus Jakarta Sans"', 'sans-serif'],
        manrope: ['Manrope', 'sans-serif']
      },
      boxShadow: {
        'premium': '0 8px 30px rgba(0, 0, 0, 0.015)',
        'premium-hover': '0 12px 40px rgba(0, 0, 0, 0.03)',
      }
    },
  },
  plugins: [],
}


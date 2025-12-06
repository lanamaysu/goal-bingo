
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./App.tsx",
    "./index.tsx",
    "./components/**/*.{ts,tsx}",
    "./views/**/*.{ts,tsx}",
    "./contexts/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./utils/**/*.{ts,tsx}",
    "./services/**/*.{ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans TC"', 'sans-serif'],
      },
      height: {
        screen: '100dvh',
      },
      minHeight: {
        screen: '100dvh',
      },
      colors: {
        brand: {
          mint: '#B7E5CD',   // Soft Mint (Backgrounds)
          teal: '#4A857E',   // Vintage Teal (Text, Borders, Secondary)
          petrol: '#1F3E4D', // Deep Petrol (Primary Text)
          rust: '#B04A2E',   // Dark Rust (Alerts)
          purple: '#6A4C78', // Deep Vintage Purple (Darker for better contrast)
          dark: '#152b36',   // Deep Dark BG
          surface: '#1F3E4D' // Dark Mode Surface
        }
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInOpacity: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-in-opacity': 'fadeInOpacity 0.3s ease-out',
      }
    },
  },
  plugins: [],
}

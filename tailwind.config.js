
/** @type {import('tailwindcss').Config} */
// Helper to support Tailwind opacity modifiers with CSS variables
const withOpacity = (variable) => ({ opacityValue }) => {
  if (opacityValue !== undefined) {
    return `rgb(var(${variable}) / ${opacityValue})`;
  }
  return `rgb(var(${variable}))`;
};

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
          mint: withOpacity('--brand-mint'),
          teal: withOpacity('--brand-teal'),
          petrol: withOpacity('--brand-petrol'),
          rust: withOpacity('--brand-rust'),
          purple: withOpacity('--brand-purple'),
          dark: withOpacity('--brand-dark'),
          surface: withOpacity('--brand-surface')
        },
        tone: {
          teal: withOpacity('--tone-teal'),
          purple: withOpacity('--tone-purple'),
          rust: withOpacity('--tone-rust')
        },
        accent: withOpacity('--accent')
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

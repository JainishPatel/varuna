/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        varuna: {
          bg: '#fdfbf7',         // Warm organic parchment background
          card: '#ffffff',       // Crisp white cards
          sand: '#f5f0eb',       // Soft sand background accent
          sage: '#15803d',       // Organic forest / sage green
          sageLight: '#f0fdf4',  // Soft sage tint
          terracotta: '#c2410c', // Warm terracotta / clay
          amber: '#d97706',      // Warm wheat amber
          sky: '#0284c7',        // Water sky blue
          slate: '#0f172a',      // Main dark slate text
          muted: '#64748b',      // Muted grey text
          border: '#e2e8f0'      // Soft card border
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      animation: {
        'fadeInUp': 'fadeInUp 0.3s ease-out both',
        'slideInRight': 'slideInRight 0.3s ease-out both',
        'shake': 'shake 0.5s ease-in-out',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '15%, 45%, 75%': { transform: 'translateX(-4px)' },
          '30%, 60%, 90%': { transform: 'translateX(4px)' },
        },
      },
      boxShadow: {
        'v-card': '0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.03)',
        'v-hover': '0 4px 12px -2px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04)',
      }
    },
  },
  plugins: [],
}

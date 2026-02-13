/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",

  ],
  theme: {
    extend: {
      screens: {
        '2xl': '1536px',
        '3xl': '2200px',
      },
      colors: {
        brand: {
          black: '#0f172a',
          orange: '#f97316',
          grey: '#64748b',
          light: '#f8fafc',
          acid: '#84cc16', // Acid Green for success/highlights
          signal: '#ef4444', // Signal Red for alerts
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        tech: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'sharp': '6px 6px 0px #0f172a',
        'sharp-sm': '3px 3px 0px #0f172a',
        'sharp-orange': '6px 6px 0px #f97316',
        'sharp-white': '4px 4px 0px #ffffff',
        'glow': '0 0 30px rgba(249, 115, 22, 0.3)',
      },
      borderWidth: {
        '3': '3px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'pulse-slow': 'pulse 3s infinite',
        'float': 'float 3s ease-in-out infinite',
        'reveal': 'reveal 0.6s cubic-bezier(0.165, 0.84, 0.44, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        reveal: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

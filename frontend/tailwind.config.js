/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        brutal: {
          yellow: '#FFE600',       // High-voltage hero yellow
          'yellow-hover': '#FFD000',
          'yellow-light': '#FFF8B3',
          black: '#0A0A0A',        // Deep structural pitch black
          dark: '#121212',         // Brutalist dark base
          'dark-surface': '#1C1C1C',
          paper: '#F4F0E8',        // Vintage architectural off-white
          white: '#FAFAFA',
          muted: '#6B7280',        // Medium neutral
          'muted-dark': '#9CA3AF',
          border: '#0A0A0A',       // Default solid 2-3px border
          'border-dark': '#E5E7EB',
          accent: '#FF3333',       // Restrained hazard alert crimson
          'accent-hover': '#E62E2E',
          success: '#1B5E20',      // Restrained, muted dark forest green for success states
          'success-light': '#E8F5E9',
        }
      },
      boxShadow: {
        'brutal-sm': '2px 2px 0px #0A0A0A',
        'brutal': '4px 4px 0px #0A0A0A',
        'brutal-lg': '8px 8px 0px #0A0A0A',
        'brutal-hover': '6px 6px 0px #0A0A0A',
        'brutal-active': '1px 1px 0px #0A0A0A',
        'brutal-dark-sm': '2px 2px 0px #FFE600',
        'brutal-dark': '4px 4px 0px #FFE600',
        'brutal-dark-lg': '8px 8px 0px #FFE600',
        'brutal-inset': 'inset 2px 2px 0px #0A0A0A',
      },
      borderWidth: {
        '3': '3px',
      },
      borderRadius: {
        'none': '0px',
        DEFAULT: '0px',
        'full': '9999px',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Space Mono"', 'ui-monospace', 'monospace'],
        display: ['"Space Grotesk"', '"Outfit"', 'Inter', 'sans-serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.04em',
        tighter: '-0.02em',
        widest: '0.12em',
      },
      animation: {
        'marquee': 'marquee 25s linear infinite',
        'marquee-fast': 'marquee 12s linear infinite',
        'pulse-brutal': 'pulse-brutal 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'pulse-brutal': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.4 },
        }
      }
    },
  },
  plugins: [],
}

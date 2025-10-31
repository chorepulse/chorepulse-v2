/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Primary Brand Colors
        'heartbeat-red': '#FF6B6B',
        'warm-orange': '#FFA07A',
        'deep-purple': '#6C63FF',
        'soft-blue': '#4ECDC4',

        // Neutral Colors
        'dark-gray': '#2C3E50',
        'medium-gray': '#7F8C8D',
        'light-gray': '#ECF0F1',

        // Semantic Colors
        'success-green': '#2ECC71',
        'warning-yellow': '#F39C12',
        'info-blue': '#3498DB',

        // Legacy support (map old colors to new)
        'trust-blue': '#4ECDC4',
        'pulse-purple': '#6C63FF',

        // Custom color scales
        'chorepulse': {
          50: '#FFF5F5',
          100: '#FFE5E5',
          200: '#FFCCCC',
          300: '#FFB3B3',
          400: '#FF9999',
          500: '#FF8080',
          600: '#FF6B6B',
          700: '#E65C5C',
          800: '#CC4D4D',
          900: '#B33E3E',
        },

        'pulse': {
          50: '#F5F5FF',
          100: '#E5E5FF',
          200: '#CCCCFF',
          300: '#B3B3FF',
          400: '#9999FF',
          500: '#8080FF',
          600: '#6C63FF',
          700: '#5C54E6',
          800: '#4D45CC',
          900: '#3E36B3',
        }
      },

      backgroundImage: {
        'gradient-ai': 'linear-gradient(135deg, #6C63FF 0%, #4ECDC4 100%)',
        'gradient-cta': 'linear-gradient(135deg, #FF6B6B 0%, #FFA07A 100%)',
        'gradient-celebration': 'radial-gradient(circle, #FFA07A 0%, #FF6B6B 50%, #6C63FF 100%)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },

      fontSize: {
        'hero-mobile': ['36px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '800' }],
        'hero-desktop': ['56px', { lineHeight: '1.2', letterSpacing: '-0.03em', fontWeight: '900' }],
        'display-xl': ['72px', { lineHeight: '1.1', letterSpacing: '-0.04em', fontWeight: '900' }],
        'display-lg': ['60px', { lineHeight: '1.1', letterSpacing: '-0.03em', fontWeight: '800' }],
        'display-md': ['48px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-sm': ['36px', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '700' }],
      },

      fontWeight: {
        'extra-light': '200',
        'light': '300',
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
        'extra-bold': '800',
        'black': '900',
      },

      letterSpacing: {
        'tighter': '-0.05em',
        'tight': '-0.025em',
        'normal': '0',
        'wide': '0.025em',
        'wider': '0.05em',
        'widest': '0.1em',
      },

      borderRadius: {
        'chorepulse': '8px',
        'card': '12px',
        'button': '8px',
        'input': '6px',
      },

      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'button': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'button-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },

      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient': 'gradient 3s ease infinite',
      },

      keyframes: {
        gradient: {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
      },
    },
  },
  plugins: [],
}

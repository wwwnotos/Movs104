/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system', 
          'BlinkMacSystemFont', 
          '"SF Pro Text"', 
          '"Segoe UI"', 
          'Roboto', 
          'sans-serif'
        ],
      },
      colors: {
        background: '#F2F2F7',
        surface: '#FFFFFF',
        primary: '#007AFF',
        secondary: '#E5E5EA',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'card': '0 10px 40px -10px rgba(0, 0, 0, 0.15)',
        'float': '0 20px 40px -5px rgba(0, 0, 0, 0.1)',
        'glow': '0 0 15px rgba(59, 130, 246, 0.3)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      animation: {
        'gradient-x': 'gradient-x 3s ease infinite',
        'spring-up': 'springUp 0.5s cubic-bezier(0.19, 1, 0.22, 1) forwards',
        'spring-in': 'springIn 0.6s cubic-bezier(0.19, 1, 0.22, 1) forwards',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
        springUp: {
          '0%': { transform: 'translateY(100px) scale(0.95)', opacity: '0' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        springIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        }
      }
    }
  },
  plugins: [],
}
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#05050f',
          900: '#0d0d1a',
          800: '#111128',
          700: '#161632',
          600: '#1e1e3f',
          500: '#252550',
        },
        neon: {
          purple: '#b44dff',
          blue: '#4d9fff',
          pink: '#ff4dce',
          cyan: '#4dffee',
          gold: '#ffd700',
        }
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'neon-purple': '0 0 20px rgba(180,77,255,0.5)',
        'neon-blue': '0 0 20px rgba(77,159,255,0.5)',
        'neon-gold': '0 0 20px rgba(255,215,0,0.5)',
        'card': '0 8px 32px rgba(0,0,0,0.4)',
        'glass': '0 4px 24px rgba(0,0,0,0.3)',
      },
      animation: {
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        glowPulse: {
          '0%,100%': { boxShadow: '0 0 10px rgba(180,77,255,0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(180,77,255,0.8)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
      }
    },
  },
  plugins: [],
};

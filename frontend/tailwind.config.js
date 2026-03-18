/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: '#0F0F1A',
        surface: '#1A1A2E',
        'surface-2': '#252540',
        primary: '#6C63FF',
        'primary-dim': 'rgba(108,99,255,0.15)',
        secondary: '#FF6584',
        success: '#43E97B',
        warning: '#FFD93D',
        danger: '#FF6B6B',
        'text-1': '#FFFFFF',
        'text-2': '#8B8FA8',
        'text-3': '#545770',
        border: 'rgba(255,255,255,0.08)',
        'border-strong': 'rgba(255,255,255,0.12)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)',
        'slide-down': 'slideDown 0.3s cubic-bezier(0.16,1,0.3,1)',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { transform: 'translateY(24px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        slideDown: { from: { transform: 'translateY(-16px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        scaleIn: { from: { transform: 'scale(0.94)', opacity: 0 }, to: { transform: 'scale(1)', opacity: 1 } },
        float: { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-8px)' } },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        'glow-primary': '0 0 20px rgba(108,99,255,0.35)',
        'glow-success': '0 0 20px rgba(67,233,123,0.3)',
        'card': '0 4px 24px rgba(0,0,0,0.4)',
        'sheet': '0 -8px 32px rgba(0,0,0,0.6)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #6C63FF 0%, #9B8FFF 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #FF6584 0%, #FF8FA3 100%)',
        'gradient-success': 'linear-gradient(135deg, #43E97B 0%, #38F9D7 100%)',
        'gradient-card': 'linear-gradient(135deg, #1A1A2E 0%, #252540 100%)',
        'gradient-hero': 'linear-gradient(135deg, #0F0F1A 0%, #1A1A3E 50%, #0F0F1A 100%)',
        'shimmer-bg': 'linear-gradient(90deg, #1A1A2E 25%, #252540 50%, #1A1A2E 75%)',
      },
    },
  },
  plugins: [],
}

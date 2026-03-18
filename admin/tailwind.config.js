/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
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
            boxShadow: {
                card: '0 4px 24px rgba(0,0,0,0.35)',
            },
        },
    },
    plugins: [],
}
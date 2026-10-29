/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1B4F9C',
          50: '#EFF5FF',
          100: '#DBE8FE',
          200: '#BFD6FE',
          300: '#93BBFD',
          400: '#6098FA',
          500: '#3B74F6',
          600: '#1B4F9C',
          700: '#1A4585',
          800: '#1A3A6B',
          900: '#1B3359',
          950: '#12203B',
        },
        accent: {
          DEFAULT: '#0EA5E9',
          soft: '#E0F2FE',
        },
        bg: '#F5F7FB',
        card: '#FFFFFF',
        text: {
          DEFAULT: '#0F172A',
          muted: '#64748B',
          soft: '#94A3B8',
        },
        border: {
          DEFAULT: '#E2E8F0',
          soft: '#F1F5F9',
        },
        estado: {
          borrador: '#6B7280',
          regularizar: '#F59E0B',
          pendiente: '#EAB308',
          observada: '#D97706',
          aprobada_jefe: '#4ADE80',
          aprobada_rrhh: '#22C55E',
          en_curso: '#22D3EE',
          ejecutada: '#15803D',
          rechazada: '#EF4444',
          anulada: '#374151',
        },
      },
      fontSize: {
        base: '15px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)',
        card: '0 1px 3px 0 rgb(15 23 42 / 0.05), 0 4px 12px -2px rgb(15 23 42 / 0.06)',
        elevated: '0 4px 6px -1px rgb(15 23 42 / 0.06), 0 10px 24px -4px rgb(15 23 42 / 0.08)',
        glow: '0 0 0 3px rgb(27 79 156 / 0.15)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
      },
      minHeight: {
        button: '44px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.35s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
}

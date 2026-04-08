/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: { light: '#F9F6F0', dark: '#0F1117' },
        surface: { light: '#FFFFFF', dark: '#1C1F2A' },
        surfaceElevated: { light: '#F0EBE0', dark: '#252836' },
        textPrimary: { light: '#1A1A1A', dark: '#F0EBE0' },
        textSecondary: { light: '#6B6B6B', dark: '#9A9BAD' },
        textMuted: { light: '#9A9A9A', dark: '#5C5E70' },
        accent: { DEFAULT: '#4A7C59', soft: '#78A485' },
        liturgical: {
          ordinaryTime: '#4A7C59',
          adventLent: '#6B4E8A',
          christmasEaster: '#C9A84C',
          pentecost: '#B5303C',
          marian: '#3A6EA5',
        },
        success: '#2D7A4F',
        error: '#B5303C',
        warning: '#D4891A',
        sepia: {
          background: '#F5ECD7',
          text: '#3B2A1A',
          surface: '#EDE0C8',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'serif'],
        sans: ['System', 'sans-serif'],
      },
      borderRadius: {
        'card': '16px',
        'button': '12px',
      },
      spacing: {
        'screen': '24px',
        'button-height': '48px',
        'header-height': '60px',
        'tab-height': '65px',
      }
    },
  },
  plugins: [],
}

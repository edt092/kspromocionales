/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // ── KS Design System tokens (marca real: navy + naranja) ──
        ks: {
          navy: '#0F2178',
          'navy-dark': '#091557',
          'navy-mid': '#1A3299',
          'navy-light': '#2B4BC4',
          'navy-wash': '#EDF0FB',
          'navy-ghost': '#F5F7FF',
          orange: '#F5A520',
          'orange-dark': '#D48A0A',
          'orange-light': '#FFBA3D',
          'orange-wash': '#FFF4DC',
        },
        primary: { DEFAULT: '#0F2178', light: '#2B4BC4', dark: '#091557' },
        accent: { DEFAULT: '#F5A520', light: '#FFBA3D', dark: '#D48A0A' },
        midnight: '#0D0D1A',
        'deep-navy': '#091557',
        'whatsapp-green': '#25D366',
      },
      fontFamily: {
        sans: ['var(--font-nunito-sans)', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['var(--font-syne)', 'system-ui', 'sans-serif'],
        display: ['var(--font-syne)', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        float1: {
          '0%,100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-16px) rotate(1.5deg)' },
        },
        float2: {
          '0%,100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(14px) rotate(-1deg)' },
        },
        pulseGreen: {
          '0%': { boxShadow: '0 0 0 0 rgba(37,211,102,0.55)' },
          '60%': { boxShadow: '0 0 0 16px rgba(37,211,102,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(37,211,102,0)' },
        },
        gradientShift: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
      animation: {
        'float-1': 'float1 7s ease-in-out infinite',
        'float-2': 'float2 9s ease-in-out infinite 1s',
        'pulse-green': 'pulseGreen 2.2s cubic-bezier(0.4,0,0.2,1) infinite',
        'gradient-shift': 'gradientShift 5s ease infinite',
      },
      boxShadow: {
        soft: '0 4px 24px -4px rgba(0,26,110,0.08)',
        card: '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)',
        'card-hover': '0 8px 40px -8px rgba(0,26,110,0.25)',
        'orange-glow': '0 0 28px rgba(245,165,32,0.55), 0 4px 20px rgba(245,165,32,0.35)',
        navy: '0 20px 60px -10px rgba(0,26,110,0.4)',
      },
    },
  },
  plugins: [],
};

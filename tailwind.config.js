/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Legacy
        'jj-blue': '#1e3a8a',
        'jj-gold': '#d97706',
        'jj-light': '#eff6ff',
        // ── Jong Jaroen "ส้มทอง" Palette ──────────────
        jj: {
          cream:    '#FFF8E1', // background หลัก
          amber:    '#F9A825', // primary orange-gold
          gold:     '#D4AF37', // deep gold
          deepgold: '#B8860B', // dark gold accent
          orange:   '#FB8C00', // bright orange
          red:      '#E53935', // accent red (ตัวเลขรางวัล)
          warm:     '#FFF3E0', // warm white card bg
          border:   '#FFE082', // gold border
          text:     '#5D4037', // warm brown text
          muted:    '#8D6E63', // muted warm text
        },
      },
      backgroundImage: {
        'jj-gradient':    'linear-gradient(135deg, #F9A825 0%, #D4AF37 100%)',
        'jj-gradient-v':  'linear-gradient(180deg, #F9A825 0%, #D4AF37 100%)',
        'jj-dark':        'linear-gradient(135deg, #E65100 0%, #BF360C 100%)',
        'jj-card':        'linear-gradient(135deg, #FFF8E1 0%, #FFF3E0 100%)',
      },
      fontFamily: {
        thai: ['Sarabun', 'sans-serif'],
      },
      animation: {
        'pulse-gold': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
}

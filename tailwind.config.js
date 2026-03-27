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
                            'brand-primary': '#EE4D2D',
                            'brand-primary-dark': '#D93D1F',
                            'brand-primary-light': '#FFF0ED',
                            'jj-blue': '#1e3a8a',
                            'jj-gold': '#d97706',
                            'jj-light': '#eff6ff',
                            jj: {
                                        cream:    '#FFF8E1',
                                        amber:    '#F9A825',
                                        gold:     '#D4AF37',
                                        deepgold: '#B8860B',
                                        orange:   '#FB8C00',
                                        red:      '#E53935',
                                        warm:     '#FFF3E0',
                                        border:   '#FFE082',
                                        text:     '#5D4037',
                                        muted:    '#8D6E63',
                            },
                  },
                  borderRadius: {
                            'brand':    '2.5rem',
                            'brand-sm': '1.25rem',
                            'brand-xs': '0.75rem',
                  },
                  backgroundImage: {
                            'brand-gradient': 'linear-gradient(135deg, #EE4D2D 0%, #D93D1F 100%)',
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
                            'float':      'float 3s ease-in-out infinite',
                  },
                  keyframes: {
                            float: {
                                        '0%, 100%': { transform: 'translateY(0px)' },
                                        '50%':      { transform: 'translateY(-6px)' },
                            },
                  },
          },
    },
    plugins: [],
}

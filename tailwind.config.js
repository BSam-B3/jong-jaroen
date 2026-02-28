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
                            'jj-blue': '#1e3a8a',
                            'jj-gold': '#d97706',
                            'jj-light': '#eff6ff',
                  },
          },
    },
    plugins: [],
}

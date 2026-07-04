/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#090d16',
        panel: '#101726',
        borderDark: '#1e293b',
        primary: {
          500: '#00f2fe',
          600: '#00c6fb',
        },
        accent: {
          emerald: '#10b981',
          rose: '#f43f5e',
          amber: '#f59e0b',
          violet: '#8b5cf6',
        }
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0, 242, 254, 0.3)',
        'glow-rose': '0 0 20px rgba(244, 63, 94, 0.3)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-panel': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
      }
    },
  },
  plugins: [],
}

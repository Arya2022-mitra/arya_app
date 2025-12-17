module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './shared/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#19c6d6',
        accent: '#19c6d6',
        'accent-2': '#0fb3c2',
        'accent-3': '#0e9caa',
        'muted-accent': '#3dd8e8',
        ivory: '#FFFFE3',
        'deep-blue': '#0a1d3c',
        'royal-blue': '#00008B',
        'royal-light-blue': '#a5b8e1',
        'neo-dark': '#0B0F1A',
        'neon-cyan': '#00FFFF',
        'sky-blue': '#2B9BFF',
        'card-dark': '#0E1A2B'
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        cinzel: ['Cinzel', 'serif'],
        sanskrit: ['"Tiro Devanagari Sanskrit"', 'serif'],
        orbitron: ['Orbitron', 'sans-serif'],
        rajdhani: ['Rajdhani', 'sans-serif']
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    }
  },
  plugins: [require('@tailwindcss/forms')]
};

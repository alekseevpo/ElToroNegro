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
        primary: {
          black: '#000000',
          dark: '#1a1a1a',
          gray: '#2d2d2d',
          'gray-light': '#4a4a4a',
          'gray-lighter': '#6b6b6b',
          'gray-lightest': '#8a8a8a',
        },
        accent: {
          yellow: '#FFD700',
          'yellow-dark': '#FFA500',
          'yellow-light': '#FFE44D',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'sans-serif'],
      },
    },
  },
  plugins: [],
};


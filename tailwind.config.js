/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  plugins: [],

  theme: {
    extend: {},
    screens: {
      'sm': '500px',
      'md': '768px',
      'lg': '1000px',
      'xl': '1200px',
      '2xl': '1536px',

      'max-sm': {'max': '500px'},
      'max-md': {'max': '768px'},
      'max-lg': {'max': '1000px'},
      'max-xl': {'max': '1200px'},

    },
  },
}


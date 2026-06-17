/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        rust: '#c84b2f',
        ink: '#1a1208',
        cream: '#f5f0e8',
        paper: '#ede8df',
      },
    },
  },
  plugins: [],
}

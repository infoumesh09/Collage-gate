/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0d0a16",
        secondary: "#22244b",
        text: "#ffffff",
        "text-secondary": "#d4cee4",
        accent: "#118c7e",
        "accent-dark": "#006289",
      },
      fontFamily: {
        serif: ['"Instrument Serif"', "serif"],
        sans: ['"Saira"', "sans-serif"],
      },
    },
  },
  plugins: [],
}

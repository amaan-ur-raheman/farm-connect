/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#4cae4f",
        background: {
          light: "#f6f7f6",
          dark: "#151d15",
          soft: "#f9fbf9",
        },
        surface: {
          light: "#ffffff",
          dark: "#1e291e",
        },
        agri: {
          green: "#4cae4f",
          slate: "#608562",
          border: "#eaf0ea",
          input: "#f9fbf9",
          text: "#111811",
        }
      },
      fontFamily: {
        manrope: ["Manrope", "sans-serif"],
      },
    },
  },
  plugins: [],
};

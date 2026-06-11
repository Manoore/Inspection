/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#e8f1fb",
          100: "#c6d9f5",
          200: "#8fb4ec",
          300: "#5b90e2",
          400: "#2f72d9",
          500: "#0f4c81",
          600: "#0c3e6b",
          700: "#092f52",
          800: "#062039",
          900: "#031020",
        },
        success: "#16a34a",
        warning: "#d97706",
        danger:  "#dc2626",
        surface: "#f8fafc",
      },
      fontFamily: {
        sans: ["System"],
      },
    },
  },
  plugins: [],
};

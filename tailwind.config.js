/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#C5A059",
          50: "#fdf8ef",
          100: "#f9edd4",
          200: "#f2d9a3",
          300: "#e8c06a",
          400: "#d4aa52",
          500: "#C5A059",
          600: "#a8843a",
          700: "#8a6a2e",
          800: "#6e5226",
          900: "#4e3a1b",
        },
        sidebar: {
          bg: "#1a1a1a",
          hover: "rgba(197,160,89,0.10)",
          active: "rgba(197,160,89,0.18)",
          border: "rgba(197,160,89,0.15)",
        },
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.06)",
        "card-hover": "0 4px 12px 0 rgba(0,0,0,0.10)",
        sidebar: "4px 0 24px rgba(0,0,0,0.25)",
        gold: "0 0 0 3px rgba(197,160,89,0.20)",
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./*.html", "./assets/**/*.html", "./assets/**/*.js"],
  theme: {
    extend: {
      colors: {
        primary: {
          light: "#3B82F6",
          DEFAULT: "#1e3a8a",
          dark: "#0f172a",
        },
        accent: "#F59E0B",
        success: "#10B981",
        danger: "#EF4444",
        "surface-light": "#F9FAFB",
        "surface-dark": "#111827",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
      },
    },
  },
  plugins: [],
};

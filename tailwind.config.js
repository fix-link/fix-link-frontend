/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#0d93f2",
        "background-light": "#f0f5fa",
        "background-dark": "#101b22",
        "accent-gold": "#FFC107",
        "text-light": "#111518",
        "text-dark": "#f5f7f8",
        "subtext-light": "#60798a",
        "subtext-dark": "#a0b1c0",
        "surface-light": "#ffffff",
        "surface-dark": "#1a2833",
        "border-light": "#dbe1e6",
        "border-dark": "#2a3b47"
      },
      fontFamily: {
        display: ["Manrope", "sans-serif"],
      },
      letterSpacing: {
        light: "-0.01em", // tracking-light
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/container-queries"),
  ],
};

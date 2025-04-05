const { fontFamily } = require("tailwindcss/defaultTheme")

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
	],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        // Set Space Grotesk as the primary sans-serif font
        // Keep the default sans-serif stack as fallbacks
        sans: ["Space Grotesk", ...fontFamily.sans],
      },
      colors: {
        // ... existing colors ...
      },
      // ... other extensions like keyframes, animation ...
    },
  },
  plugins: [require("tailwindcss-animate")],
} 
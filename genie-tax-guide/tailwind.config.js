const { fontFamily } = require("tailwindcss/defaultTheme")

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
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
        // Revert back to Space Grotesk
        sans: ["Space Grotesk", ...fontFamily.sans],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Add sidebar colors if needed for utilities
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: {
            DEFAULT: "hsl(var(--sidebar-primary))",
            foreground: "hsl(var(--sidebar-primary-foreground))",
          },
          accent: {
            DEFAULT: "hsl(var(--sidebar-accent))",
            foreground: "hsl(var(--sidebar-accent-foreground))",
          },
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        // From tailwindcss-animate (keep these)
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        // ADD Custom float animations
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(var(--tw-rotate))' },
          '50%': { transform: 'translateY(-6px) rotate(var(--tw-rotate))' },
        },
        'float-alt': {
          '0%, 100%': { transform: 'translateY(0px) rotate(var(--tw-rotate))' },
          '50%': { transform: 'translateY(4px) rotate(var(--tw-rotate))' },
        },
        // ADD Blob animations
        'blob-1': {
           '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
           '33%': { transform: 'translate(30px, -40px) scale(1.1)' },
           '66%': { transform: 'translate(-20px, 25px) scale(0.9)' },
        },
        'blob-2': {
           '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
           '33%': { transform: 'translate(-25px, 35px) scale(0.9)' },
           '66%': { transform: 'translate(40px, -30px) scale(1.1)' },
        },
        // MODIFY Orbit animations for more pronounced movement
        'orbit-1': { // Lime (starts top-right)
          '0%, 100%': { transform: 'translate(0%, 0%) scale(1)' },
          '25%': { transform: 'translate(-20%, 30%) scale(1.05)' }, // Move down-left significantly
          '50%': { transform: 'translate(-40%, 10%) scale(1)' },   // Move more left
          '75%': { transform: 'translate(-15%, -15%) scale(0.95)' }, // Move back up-right 
        },
        'orbit-2': { // Violet (starts bottom-right) - will run in reverse
          '0%, 100%': { transform: 'translate(0%, 0%) scale(1)' },
          '25%': { transform: 'translate(-35%, -25%) scale(0.95)' }, // Move up-left significantly
          '50%': { transform: 'translate(-15%, 25%) scale(1)' },   // Move down-right
          '75%': { transform: 'translate(15%, 10%) scale(1.05)' }, // Move more right 
        }
      },
      animation: {
        // From tailwindcss-animate (keep these)
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        // ADD Custom float animations
        float: 'float 4s ease-in-out infinite',
        'float-alt': 'float-alt 5s ease-in-out infinite',
        'float-slow': 'float 6s ease-in-out infinite',
         // ADD Blob animations
        'blob-1': 'blob-1 25s ease-in-out infinite',
        'blob-2': 'blob-2 30s ease-in-out infinite',
         // ADD Orbit animations
        'orbit-1': 'orbit-1 28s ease-in-out infinite',
        'orbit-2': 'orbit-2 32s ease-in-out infinite reverse',
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
} 
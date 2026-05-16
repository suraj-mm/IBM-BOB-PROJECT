import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0d1117",
          50: "#c9d1d9",
          100: "#b1bac4",
          200: "#8b949e",
          300: "#6e7681",
          400: "#484f58",
          500: "#30363d",
          600: "#21262d",
          700: "#161b22",
          800: "#0d1117",
          900: "#010409",
        },
        accent: {
          blue: "#58a6ff",
          purple: "#bc8cff",
          green: "#3fb950",
          red: "#f85149",
          yellow: "#d29922",
          orange: "#db6d28",
          pink: "#f778ba",
        },
        glass: {
          bg: "rgba(22, 27, 34, 0.7)",
          border: "rgba(255, 255, 255, 0.1)",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "glass-gradient": "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)",
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        neon: "0 0 10px rgba(88, 166, 255, 0.5), 0 0 20px rgba(88, 166, 255, 0.3), 0 0 30px rgba(88, 166, 255, 0.1)",
        "neon-purple": "0 0 10px rgba(188, 140, 255, 0.5), 0 0 20px rgba(188, 140, 255, 0.3), 0 0 30px rgba(188, 140, 255, 0.1)",
        "neon-green": "0 0 10px rgba(63, 185, 80, 0.5), 0 0 20px rgba(63, 185, 80, 0.3), 0 0 30px rgba(63, 185, 80, 0.1)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
        "slide-in-left": "slideInLeft 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "scale-up": "scaleUp 0.2s ease-out",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        glow: "glow 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideInRight: {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideInLeft: {
          "0%": { transform: "translateX(-100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scaleUp: {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 10px rgba(88, 166, 255, 0.5), 0 0 20px rgba(88, 166, 255, 0.3)" },
          "50%": { boxShadow: "0 0 20px rgba(88, 166, 255, 0.8), 0 0 30px rgba(88, 166, 255, 0.5)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

// Made with Bob

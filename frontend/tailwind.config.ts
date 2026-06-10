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
        // Primaire — rouge vif (RentaWay)
        primary: {
          50:  "#fef2f3",
          100: "#fde6e7",
          200: "#fbd0d3",
          300: "#f7a9af",
          400: "#f17a83",
          500: "#e63946",
          600: "#d22a37",
          700: "#b01f2b",
          800: "#921d27",
          900: "#7a1c25",
        },
        // Secondaire — bleu marine
        secondary: {
          50:  "#eef2f7",
          100: "#d5dfe9",
          200: "#a8bdce",
          300: "#7898b1",
          400: "#4c7493",
          500: "#2c5377",
          600: "#1d3557",
          700: "#172a45",
          800: "#121f33",
          900: "#0c1623",
        },
        // Accent — orange chaud
        accent: {
          50:  "#fef6ec",
          100: "#fce7c8",
          200: "#f9d39c",
          300: "#f6bd6f",
          400: "#f4a261",
          500: "#ee8a3a",
          600: "#d97223",
          700: "#b25a1a",
          800: "#8b4716",
          900: "#6e3812",
        },
        // États
        success: "#2dc653",
        danger:  "#e63946",
        // Maroc
        morocco: {
          red:   "#C1272D",
          green: "#006233",
          gold:  "#C8962E",
          sand:  "#F5E6CA",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        arabic: ["Cairo", "sans-serif"],
      },
      boxShadow: {
        soft:  "0 4px 16px rgba(15, 23, 42, 0.06)",
        card:  "0 8px 24px rgba(15, 23, 42, 0.08)",
        lift:  "0 16px 40px rgba(15, 23, 42, 0.12)",
      },
      animation: {
        "fade-in":    "fadeIn 0.4s ease-in-out",
        "slide-up":   "slideUp 0.5s ease-out",
        "slide-down": "slideDown 0.4s ease-out",
        "blob":       "blob 9s infinite",
      },
      keyframes: {
        fadeIn:    { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp:   { "0%": { transform: "translateY(20px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        slideDown: { "0%": { transform: "translateY(-20px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        blob: {
          "0%, 100%": { transform: "translate(0,0) scale(1)" },
          "33%": { transform: "translate(30px,-30px) scale(1.1)" },
          "66%": { transform: "translate(-20px,20px) scale(0.95)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

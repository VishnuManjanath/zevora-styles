import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        cream: {
          50: "#FDFBF8",
          100: "#FAF6F0",
          200: "#F5EDE2",
          300: "#EDE0CE",
        },
        ink: {
          900: "#241F1A",
          800: "#332B23",
          700: "#4A3F34",
          500: "#7A6B5D",
          400: "#9A8C7D",
        },
        terracotta: {
          50: "#FBF0EC",
          100: "#F5DED4",
          400: "#C97D5D",
          500: "#AD5A3B",
          600: "#8F4630",
          700: "#743A28",
        },
        gold: {
          300: "#E4CD9E",
          400: "#CBA968",
          500: "#B0894A",
        },
        sage: {
          400: "#8A9A7E",
          500: "#6F805F",
        },
      },
      fontFamily: {
        display: ["var(--font-cormorant)", "Georgia", "serif"],
        sans: ["var(--font-dmsans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 20px -4px rgba(36, 31, 26, 0.08)",
        card: "0 8px 30px -8px rgba(36, 31, 26, 0.12)",
        lift: "0 20px 50px -12px rgba(36, 31, 26, 0.18)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      letterSpacing: {
        wide2: "0.14em",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        fadeUp: "fadeUp 0.6s ease-out forwards",
        fadeIn: "fadeIn 0.4s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;

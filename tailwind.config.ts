import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

/**
 * Token reka bentuk daripada hp DESIGN.md:
 * kanvas putih, Electric Blue #024ad8 sebagai satu-satunya warna CTA,
 * dakwat hampir-hitam, kad 8–16px radius.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        primary: {
          DEFAULT: "#024ad8",
          bright: "#296ef9",
          deep: "#0e3191",
          soft: "#c9e0fc",
        },
        ink: {
          DEFAULT: "#1a1a1a",
          deep: "#000000",
          soft: "#292929",
        },
        cloud: "#f7f7f7",
        fog: "#e8e8e8",
        steel: "#c2c2c2",
        graphite: "#636363",
        charcoal: "#3d3d3d",
        bloom: {
          coral: "#ff5050",
          rose: "#f9d4d2",
          deep: "#b3262b",
        },
        storm: {
          mist: "#8ebdce",
          deep: "#356373",
        },
      },
      borderRadius: {
        sm: "3px",
        DEFAULT: "4px",
        md: "4px",
        lg: "8px",
        xl: "16px",
      },
      boxShadow: {
        lift: "0 2px 8px rgba(26,26,26,0.08)",
        modal: "0 8px 24px rgba(26,26,26,0.12)",
      },
    },
  },
  plugins: [],
};

export default config;

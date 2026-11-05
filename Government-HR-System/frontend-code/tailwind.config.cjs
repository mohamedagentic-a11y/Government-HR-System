/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Noto Sans Arabic",
          "Cairo",
          "Segoe UI",
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        primary: {
          50:  "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
        },
        secondary: {
          50:  "#fafaf9",
          100: "#f5f5f4",
          200: "#e7e5e4",
          300: "#d6d3d1",
          400: "#a8a29e",
          500: "#78716c",
          600: "#57534e",
          700: "#44403c",
          800: "#292524",
          900: "#1c1917",
        },
        success: {
          50:  "#f0fdf4",
          100: "#dcfce7",
          500: "#22c55e",
          700: "#15803d",
        },
        warning: {
          50:  "#fffbeb",
          100: "#fef3c7",
          500: "#f59e0b",
          700: "#b45309",
        },
        danger: {
          50:  "#fff1f2",
          100: "#ffe4e6",
          500: "#ef4444",
          700: "#b91c1c",
        },
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
        72: "18rem",
        84: "21rem",
        96: "24rem",
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        card: "0 2px 8px 0 rgba(0, 0, 0, 0.08), 0 1px 2px 0 rgba(0, 0, 0, 0.04)",
        "card-hover": "0 4px 16px 0 rgba(0, 0, 0, 0.12), 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
      },
      screens: {
        xs: "480px",
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },
      zIndex: {
        60: "60",
        70: "70",
        80: "80",
        90: "90",
        100: "100",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms")({
      strategy: "class",
    }),
    require("@tailwindcss/typography"),
    function ({ addBase, addUtilities, theme }) {
      addBase({
        ":root": {
          "--color-primary": theme("colors.primary.600"),
          "--color-primary-hover": theme("colors.primary.700"),
        },
        "[dir='rtl']": {
          fontFamily: theme("fontFamily.sans").join(", "),
        },
      });

      addUtilities({
        ".rtl-flip": {
          transform: "scaleX(-1)",
          "[dir='ltr'] &": {
            transform: "none",
          },
        },
        ".text-start": {
          "text-align": "start",
        },
        ".text-end": {
          "text-align": "end",
        },
        ".border-s": {
          "border-inline-start-width": "1px",
        },
        ".border-e": {
          "border-inline-end-width": "1px",
        },
        ".ps-0": { "padding-inline-start": "0" },
        ".pe-0": { "padding-inline-end": "0" },
        ".ms-auto": { "margin-inline-start": "auto" },
        ".me-auto": { "margin-inline-end": "auto" },
        ".rounded-s": { "border-start-start-radius": theme("borderRadius.DEFAULT"), "border-end-start-radius": theme("borderRadius.DEFAULT") },
        ".rounded-e": { "border-start-end-radius": theme("borderRadius.DEFAULT"), "border-end-end-radius": theme("borderRadius.DEFAULT") },
        ".rounded-s-lg": { "border-start-start-radius": theme("borderRadius.lg"), "border-end-start-radius": theme("borderRadius.lg") },
        ".rounded-e-lg": { "border-start-end-radius": theme("borderRadius.lg"), "border-end-end-radius": theme("borderRadius.lg") },
        ".inset-s-0": { "inset-inline-start": "0" },
        ".inset-e-0": { "inset-inline-end": "0" },
      });
    },
  ],
};
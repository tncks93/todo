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
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "#ff385c",
          active: "#e00b41",
          disabled: "#ffd1da",
        },
        canvas: "#ffffff",
        surface: {
          soft: "#f7f7f7",
          strong: "#f2f2f2",
        },
        hairline: {
          DEFAULT: "#dddddd",
          soft: "#ebebeb",
        },
        border: {
          strong: "#c1c1c1",
        },
        ink: "#222222",
        body: "#3f3f3f",
        muted: {
          DEFAULT: "#6a6a6a",
          soft: "#929292",
        },
        error: {
          DEFAULT: "#c13515",
          hover: "#b32505",
        },
      },
      borderRadius: {
        sm: "8px",
        md: "14px",
        xl: "32px",
      },
      boxShadow: {
        card: "rgba(0, 0, 0, 0.02) 0 0 0 1px, rgba(0, 0, 0, 0.04) 0 2px 6px 0, rgba(0, 0, 0, 0.1) 0 4px 8px 0",
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "Circular",
          "-apple-system",
          "system-ui",
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          '"Apple SD Gothic Neo"',
          '"Malgun Gothic"',
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
export default config;

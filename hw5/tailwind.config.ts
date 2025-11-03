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
          DEFAULT: "#1d9bf0",
          hover: "#1a8cd8",
        },
        background: "#000000",
        card: "#16181c",
        border: "#2f3336",
      },
    },
  },
  plugins: [],
};
export default config;


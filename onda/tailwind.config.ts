import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#F5F0E8",
        ink: "#1A1A14",
        sage: "#4A6741",
        "sage-light": "#6B8F62",
        clay: "#C4793A",
        "warm-gray": "#8A8478",
        "onda-border": "#D8D2C4",
        "card-bg": "#FDFAF5",
        "table-header": "#F9F6EF",
        "status-signed": "#E8F5E6",
        "status-pending": "#FFF4E5",
      },
      fontFamily: {
        serif: ["var(--font-dm-serif)", "Georgia", "serif"],
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;

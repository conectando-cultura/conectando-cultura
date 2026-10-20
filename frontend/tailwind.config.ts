import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Poppins", "sans-serif"],
        display: ["Kavoon", "serif"],
        body: ["Montserrat", "sans-serif"],
      },
      colors: {
        brand: {
          orange: "#FF8F50",
          "orange-light": "#FFAA5C",
          ink: "#1B160E",
          gray: "#302D27",
          "gray-light": "#E3E3E1",
          muted: "#6B7D8D",
          bg: "#F4F4F4",
          white: "#FEFEFE",
        },
      },
      borderRadius: {
        "3xl": "24px",
      },
    },
  },
} satisfies Config;

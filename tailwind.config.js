/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1E4D8C",
          light:   "#4A90D9",
          dark:    "#163A6E",
        },
        accent: {
          DEFAULT: "#27AE60",
          light:   "#2ECC71",
        },
        warning: "#E67E22",
        danger:  "#E74C3C",
        surface: {
          DEFAULT: "#F2F4F7",
          dark:    "#1C1C1E",
        },
        card: {
          DEFAULT: "#FFFFFF",
          dark:    "#2C2C2E",
        },
        muted: "#6B7280",
      },
      fontFamily: {
        sans: ["System"],
      },
      borderRadius: {
        xl:  "12px",
        "2xl": "16px",
        "3xl": "24px",
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./src/contexts/**/*.{js,jsx,ts,tsx}",
    "./src/features/**/*.{js,jsx,ts,tsx}",
    "./src/hooks/**/*.{js,jsx,ts,tsx}",
    "./src/pages/**/*.{js,jsx,ts,tsx}",
    "./src/services/**/*.{js,jsx,ts,tsx}",
    "./src/utils/**/*.{js,jsx,ts,tsx}",
    "./src/main.jsx"
  ],
  theme: {
    extend: {
      fontSize: {
        '2xs': '0.625rem', // 10px if base is 16px
      },
    },
  },
  plugins: [],
  // Ensure backdrop utilities work
  corePlugins: {
    backdropFilter: true,
  },
}


/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
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
  // Explicitly enable JIT mode
  mode: 'jit',
}


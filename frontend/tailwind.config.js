/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // This is the magic line
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4F46E5', // Indigo Night
          dark: '#3730A3',
        },
        sidebar: '#0F172A', // Steel Slate
        background: '#F1F5F9', // Ice Blue
        accent: '#059669', // Emerald Mint
      },
    },
  },
  plugins: [],
}
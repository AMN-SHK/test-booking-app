/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF5A5F',
        secondary: '#00A699',
        neutral: '#484848',
      },
      borderRadius: {
        DEFAULT: '12px',
        lg: '16px',
      },
      fontFamily: {
        sans: ['Circular', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}


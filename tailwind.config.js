/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ChatGPT-inspired color palette
        bg: {
          DEFAULT: '#f7f7f8',
          surface: '#ffffff',
        },
        text: {
          DEFAULT: '#0c0c0d',
          secondary: '#6e6e80',
          muted: '#9ca3af',
        },
        primary: {
          DEFAULT: '#10a37f',
          dark: '#0d8a6b',
          light: '#12b88a',
          hover: '#0f9575',
        },
        border: {
          DEFAULT: '#e5e7eb',
          light: '#f3f4f6',
        },
      },
      boxShadow: {
        'chat': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'chat-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'chat-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}


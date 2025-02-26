import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#D4A373',
        secondary: '#FAEDCD',
        accent: '#E9EDC9',
        highlight: '#CCD5AE',
        background: '#FEFAE0',
      },
    },
  },
  plugins: [],
}

export default config

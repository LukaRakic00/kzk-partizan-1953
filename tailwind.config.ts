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
        primary: {
          DEFAULT: '#000000',
          light: '#1a1a1a',
        },
        secondary: {
          DEFAULT: '#ffffff',
          dark: '#f5f5f5',
        },
        accent: {
          DEFAULT: '#ff0000',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        serif: ['var(--font-bebas)', 'sans-serif'],
        inter: ['var(--font-inter)', 'sans-serif'],
        bebas: ['var(--font-bebas)', 'sans-serif'],
        montserrat: ['var(--font-inter)', 'sans-serif'], // Legacy support
        playfair: ['var(--font-bebas)', 'sans-serif'], // Legacy support
      },
    },
  },
  plugins: [],
}
export default config


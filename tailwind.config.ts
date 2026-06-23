import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#1f3a63', deep: '#16294a', ink: '#0e1c34', line: '#2b4a78' },
        gold: { DEFAULT: '#c89b3c', deep: '#a87f27' },
        teal: { DEFAULT: '#2a9d8f', deep: '#1f7167' },
        brick: { DEFAULT: '#c0533f', deep: '#9a3f30' },
        steel: { DEFAULT: '#5b8bbf', deep: '#3f6c9e' },
        paper: '#f5f6f8', mist: '#eaeef4',
      },
      fontFamily: {
        brand: ['"Book Antiqua"', 'Palatino', '"Palatino Linotype"', 'Georgia', 'serif'],
        sans: ['"Segoe UI"', 'system-ui', '-apple-system', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(16,28,52,.08), 0 1px 2px rgba(16,28,52,.05)',
        lift: '0 10px 30px -12px rgba(16,28,52,.28)',
      },
      letterSpacing: { eyebrow: '.18em' },
    },
  },
  plugins: [],
};
export default config;

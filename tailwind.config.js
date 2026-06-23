/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Inter for letters; Roboto for digits — wired via @font-face
        // unicode-range overrides in src/index.css, so any element using these
        // families automatically renders digits in Roboto.
        sans: ['Inter', 'system-ui', 'sans-serif'],
        playfair: ['Inter', 'system-ui', 'sans-serif'],
        amiri: ['Amiri', 'serif'],
      },
      colors: {
        bg: 'var(--bg)',
        topbar: 'var(--topbar)',
        card: 'var(--card)',
        card2: 'var(--card2)',
        border: 'var(--border)',
        border2: 'var(--border2)',
        text: 'var(--text)',
        text2: 'var(--text2)',
        text3: 'var(--text3)',
        gold: 'var(--gold)',
        gold2: 'var(--gold2)',
        'gold-dim': 'var(--gold-dim)',
        'gold-glow': 'var(--gold-glow)',
        up: 'var(--green)',
        down: 'var(--red)',
        blue: 'var(--blue)',
        purple: 'var(--purple)',
        orange: 'var(--orange)',
      },
      boxShadow: {
        card: '0 4px 24px rgba(0,0,0,0.18)',
        gold: '0 0 24px var(--gold-glow)',
      },
    },
  },
  plugins: [],
};

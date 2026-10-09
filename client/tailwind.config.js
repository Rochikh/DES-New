/** @type {import('tailwindcss').Config} */

// Tokens alignés sur la charte « copie corrigée » (skill charte-rochane).
// Les valeurs vivent dans le :root de src/index.css, copié de apps/styles.css.
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // Échelle fermée de la charte : 2 px (tags), 3 px (contrôles), 4 px (cartes).
    // full reste réservé aux points et boutons ronds.
    borderRadius: {
      none: '0',
      sm: '2px',
      DEFAULT: '3px',
      md: '3px',
      lg: 'var(--radius)',
      full: '9999px',
    },
    extend: {
      colors: {
        white: 'var(--white)',
        paper: 'var(--paper)',
        off: 'var(--off)',
        light: 'var(--light)',
        line: 'var(--line)',
        line2: 'var(--line2)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        muted2: 'var(--muted2)',
        accent: {
          DEFAULT: 'var(--accent)',
          light: 'var(--accent-light)',
          hover: 'var(--accent-hover)',
        },
        rouge: 'var(--rouge)',
        seyes: 'var(--seyes)',
      },
      fontFamily: {
        sans: ['var(--font)'],
        display: ['var(--font-display)'],
        mono: ['var(--font-mono)'],
      },
      // Rayons du plugin typography ramenés sur l'échelle fermée
      typography: {
        DEFAULT: { css: { pre: { borderRadius: 'var(--radius)' }, kbd: { borderRadius: '2px' } } },
        sm: { css: { pre: { borderRadius: 'var(--radius)' }, kbd: { borderRadius: '2px' } } },
      },
      boxShadow: {
        // Élément flottant (modales)
        modal: '0 8px 40px rgba(0,0,0,0.14)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

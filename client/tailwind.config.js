/** @type {import('tailwindcss').Config} */

// Système de tokens Argos — palette « veille nocturne » dérivée du mythe
// d'Argos Panoptès (le veilleur aux cent yeux, les yeux du paon).
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // Deux rayons seulement : 8 px (contrôles) et 14 px (cartes, modales).
    // La grille complète est écrasée pour rendre tout autre rayon impossible.
    borderRadius: {
      none: '0',
      sm: '8px',
      DEFAULT: '8px',
      md: '8px',
      lg: '14px',
      xl: '14px',
      '2xl': '14px',
      '3xl': '14px',
      full: '9999px',
    },
    extend: {
      colors: {
        nuit: '#1B2A32',      // fond des en-têtes et du rapport, texte principal
        paon: {
          DEFAULT: '#12676B', // primaire : actions, phase active, radar
          sombre: '#0D4F53',  // hover / actif
        },
        iris: '#C9A227',      // accent unique : l'œil ouvert, avec parcimonie
        ambre: '#8F5D1E',     // mode Critique, alertes douces (jamais de rouge)
        craie: '#F5F3EE',     // fond clair général
        ardoise: '#55606A',   // texte secondaire, icônes
        brume: '#DDD9CF',     // bordures fines, filets
      },
      fontFamily: {
        sans: ['"Source Sans 3 Variable"', 'system-ui', 'sans-serif'],
        serif: ['"Source Serif 4 Variable"', 'Georgia', 'serif'],
      },
      boxShadow: {
        // Élévation unique, réservée aux modales
        modal: '0 8px 24px rgb(27 42 50 / 0.12)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

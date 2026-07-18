import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Charge les variables du fichier .env local
  const env = loadEnv(mode, (process as any).cwd(), '');

  // Sur Vercel, la clé est souvent dans process.env directement.
  // On prend la clé du système (Vercel) OU celle du fichier .env (Local).
  // OPENROUTER_API_KEY est le nom canonique ; les anciens noms restent acceptés.
  const apiKey = process.env.OPENROUTER_API_KEY || env.OPENROUTER_API_KEY
    || process.env.GEMINI_API_KEY || env.GEMINI_API_KEY
    || process.env.API_KEY || env.API_KEY || "";

  return {
    plugins: [react()],
    define: {
      // ATTENTION : la clé est incluse dans le bundle client au build.
      // Réservez le déploiement à un usage privé/pédagogique avec une clé
      // plafonnée, ou placez un proxy serveur devant OpenRouter.
      'process.env.API_KEY': JSON.stringify(apiKey),
      'process.env.GEMINI_API_KEY': JSON.stringify(apiKey)
    },
    build: {
      outDir: 'dist',
    }
  };
});
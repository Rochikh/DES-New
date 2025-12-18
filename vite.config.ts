import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Charge les variables du fichier .env local
  const env = loadEnv(mode, (process as any).cwd(), '');

  // Sur Vercel, la clé est souvent dans process.env directement.
  // On prend la clé du système (Vercel) OU celle du fichier .env (Local)
  const apiKey = process.env.API_KEY || env.API_KEY;

  return {
    plugins: [react()],
    define: {
      // Injection sécurisée de la clé dans le code client
      'process.env.API_KEY': JSON.stringify(apiKey)
    },
    build: {
      outDir: 'dist',
    }
  };
});
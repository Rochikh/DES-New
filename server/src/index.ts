import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { createOpenRouterClient } from './openrouter.js';
import { PORT } from './config.js';

// Charge .env en développement local (en production Docker, l'environnement
// est fourni par docker compose).
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) {
  console.error('OPENROUTER_API_KEY manquante : renseigne-la dans .env ou dans l\'environnement.');
  process.exit(1);
}

const here = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(here, '../../client/dist');

const app = createApp(createOpenRouterClient(apiKey), { clientDist });

app.listen(PORT, () => {
  console.log(`Argos écoute sur le port ${PORT}`);
});

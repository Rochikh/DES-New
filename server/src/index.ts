import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { createDeepSeekClient } from './deepseek.js';
import { createClaudeClient } from './claude.js';
import { PORT } from './config.js';

// Charge .env en développement local (en production Docker, l'environnement
// est fourni par docker compose).
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

const requireEnv = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`${name} manquante : renseigne-la dans .env ou dans l'environnement.`);
    process.exit(1);
  }
  return value;
};

const provider = (process.env.AI_PROVIDER ?? 'deepseek').trim().toLowerCase();
if (provider !== 'claude' && provider !== 'deepseek') {
  console.error(`AI_PROVIDER vaut "${provider}", valeurs acceptées : claude ou deepseek.`);
  process.exit(1);
}

// DeepSeek est toujours requis : fournisseur principal ou repli sur 429 Claude.
const deepseek = createDeepSeekClient(requireEnv('DEEPSEEK_API_KEY'));
const client = provider === 'claude' ? createClaudeClient(requireEnv('ANTHROPIC_API_KEY'), deepseek) : deepseek;

const here = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(here, '../../client/dist');

const app = createApp(client, { clientDist });

app.listen(PORT, () => {
  console.log(`Argos écoute sur le port ${PORT} (fournisseur : ${provider})`);
});

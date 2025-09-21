import fs from 'fs';
import path from 'path';

let loaded = false;

export function loadDotEnvIfPresent(): void {
  if (loaded) return;
  loaded = true;
  try {
    const cwdEnv = path.resolve(process.cwd(), '.env');
    if (!fs.existsSync(cwdEnv)) return;
    const content = fs.readFileSync(cwdEnv, 'utf-8');
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eqIdx = line.indexOf('=');
      if (eqIdx === -1) continue;
      const key = line.slice(0, eqIdx).trim();
      let value = line.slice(eqIdx + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  } catch {
    // ignore .env parsing errors to avoid breaking CLI
  }
}



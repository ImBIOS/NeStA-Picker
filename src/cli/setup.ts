import readline from 'readline';
import { getConfig, setConfig } from '../services/config';

/**
 * Ensures first-run configuration is complete by interactively prompting user.
 * Required: SteamID, Steam Web API key. Optional: OpenRouter API key.
 * Accepts custom stdin/stdout for testability.
 */
export async function ensureInitialSetup(
  stdin: NodeJS.ReadableStream = process.stdin,
  stdout: NodeJS.WritableStream = process.stdout,
): Promise<void> {
  const cfg = getConfig();
  const needsSteamId = !cfg.steamId;
  const needsApiKey = !cfg.apiKey;
  // If both required are present, skip
  if (!needsSteamId && !needsApiKey) return;

  const rl = readline.createInterface({ input: stdin, output: stdout });

  const ask = (q: string) =>
    new Promise<string>((resolve) => {
      rl.question(q, (answer) => resolve(answer.trim()));
    });

  try {
    if (needsSteamId) {
      stdout.write(
        [
          '\nSetup: SteamID (required)\n',
          '- What: Your 17-digit SteamID64.\n',
          '- How to get: Go to your Steam profile and copy the profile URL, then use steamid.io to convert to SteamID64.\n',
          '- Tip: `https://steamid.io/` -> paste your custom URL, copy the SteamID64.\n',
        ].join(''),
      );
      let steamId = '';
      while (!steamId) {
        steamId = await ask('Enter SteamID64 (17 digits): ');
        if (!steamId) stdout.write('SteamID is required.\n');
      }
      setConfig({ steamId });
    }

    if (needsApiKey) {
      stdout.write(
        [
          '\nSetup: Steam Web API Key (required)\n',
          '- What: API key used to access Steam Web API.\n',
          '- How to get: Visit https://steamcommunity.com/dev/apikey, sign in, register any domain (e.g. localhost), copy the key.\n',
        ].join(''),
      );
      let apiKey = '';
      while (!apiKey) {
        apiKey = await ask('Enter Steam Web API key: ');
        if (!apiKey) stdout.write('Steam Web API key is required.\n');
      }
      setConfig({ apiKey });
    }

    // Optional OpenRouter key
    stdout.write(
      [
        '\nSetup: OpenRouter API Key (optional)\n',
        '- What: API key for LLM explanations via OpenRouter.\n',
        '- How to get: https://openrouter.ai/keys.\n',
        '- You can leave this blank to skip.\n',
      ].join(''),
    );
    const openRouterApiKey = await ask('Enter OpenRouter API key (optional): ');
    if (openRouterApiKey) setConfig({ openRouterApiKey });
  } finally {
    rl.close();
  }
}

export default ensureInitialSetup;

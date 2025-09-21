import { User } from '../models/user';
import db from '../lib/db';
import { loadDotEnvIfPresent } from '../lib/env';

/**
 * Retrieves the current user configuration from the database.
 * If no configuration exists, it returns a default User object with an empty steamId.
 * @returns The user configuration.
 */
export function getConfig(): User {
  // Best effort: load .env once in dev/test or when present
  loadDotEnvIfPresent();

  const row = db.prepare('SELECT * FROM users').get() as User | undefined;

  const envSteamId =
    process.env.STEAM_ID || process.env.STEAMID64 || process.env.STEAM_ID64 || process.env.STEAM_STEAMID || '';
  const envApiKey = process.env.STEAM_API_KEY || process.env.STEAM_WEB_API_KEY || process.env.STEAMKEY || undefined;
  const envOpenRouter = process.env.OPENROUTER_API_KEY || undefined;

  // If DB empty or missing fields, hydrate from env without overriding existing DB values
  const effective: User = {
    steamId: (row?.steamId && row.steamId.length > 0 ? row.steamId : envSteamId) || '',
    apiKey: row?.apiKey ?? envApiKey,
    openRouterApiKey: row?.openRouterApiKey ?? envOpenRouter,
  };

  // Persist if DB is empty or we filled any missing field from env
  const shouldPersist = !row || row.steamId !== effective.steamId || row.apiKey !== effective.apiKey || row.openRouterApiKey !== effective.openRouterApiKey;
  if (shouldPersist) {
    db.prepare(
      `INSERT OR REPLACE INTO users (steamId, apiKey, openRouterApiKey)
     VALUES (@steamId, @apiKey, @openRouterApiKey)`,
    ).run(effective);
  }

  return effective;
}

/**
 * Saves or updates the user configuration in the database.
 * @param config A partial User object containing the configuration to be saved.
 */
export function setConfig(config: Partial<User>) {
  const existingConfig = getConfig();
  const newConfig = {
    steamId: config.steamId ?? existingConfig.steamId ?? '',
    apiKey: config.apiKey ?? existingConfig.apiKey,
    openRouterApiKey: config.openRouterApiKey ?? existingConfig.openRouterApiKey,
  };

  db.prepare(
    `INSERT OR REPLACE INTO users (steamId, apiKey, openRouterApiKey)
     VALUES (@steamId, @apiKey, @openRouterApiKey)`,
  ).run(newConfig);
}

import * as S from 'sury';
import db from '../lib/db';
import { loadDotEnvIfPresent } from '../lib/env';
import { User } from '../models/user';
import { UserSchema, UserUpdateSchema } from '../schemas/models';

/**
 * Retrieves the current user configuration from the database.
 * If no configuration exists, it returns a default User object with an empty steamId.
 * @returns The user configuration.
 */
export function getConfig(): User {
  // Best effort: load .env once in dev/test or when present
  loadDotEnvIfPresent();

  const raw = db.prepare('SELECT * FROM users').get();
  let row: User | undefined;
  if (raw) {
    try {
      const data = S.parseOrThrow(
        raw,
        S.schema({
          steamId: S.optional(S.string),
          apiKey: S.optional(S.string),
          openRouterApiKey: S.optional(S.string),
        }),
      );
      row = {
        steamId: data.steamId ?? '',
        apiKey: data.apiKey,
        openRouterApiKey: data.openRouterApiKey,
      };
    } catch {
      // ignore invalid DB content, will be replaced by env-hydrated values
    }
  }

  const envSteamId =
    process.env.STEAM_ID || process.env.STEAMID64 || process.env.STEAM_ID64 || process.env.STEAM_STEAMID || '';
  const envApiKey = process.env.STEAM_API_KEY || process.env.STEAM_WEB_API_KEY || process.env.STEAMKEY || undefined;
  const envOpenRouter = process.env.OPENROUTER_API_KEY || undefined;

  // If DB empty or missing fields, hydrate from env without overriding existing DB values
  const effective = S.parseOrThrow(
    {
      steamId: (row?.steamId && row.steamId.length > 0 ? row.steamId : envSteamId) || '',
      apiKey: row?.apiKey ?? envApiKey,
      openRouterApiKey: row?.openRouterApiKey ?? envOpenRouter,
    },
    UserSchema,
  );

  // Persist if DB is empty or we filled any missing field from env
  const shouldPersist =
    !row ||
    row.steamId !== effective.steamId ||
    row.apiKey !== effective.apiKey ||
    row.openRouterApiKey !== effective.openRouterApiKey;
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
  const input = S.parseOrThrow(config, UserUpdateSchema);
  // Respect explicitly provided undefined values as "clear this field".
  // Preserve existing values only when a key is truly not provided.
  const newConfig = S.parseOrThrow(
    {
      steamId: ('steamId' in input ? input.steamId : existingConfig.steamId) ?? '',
      apiKey: 'apiKey' in input ? input.apiKey : existingConfig.apiKey,
      openRouterApiKey: 'openRouterApiKey' in input ? input.openRouterApiKey : existingConfig.openRouterApiKey,
    },
    UserSchema,
  );

  db.prepare(
    `INSERT OR REPLACE INTO users (steamId, apiKey, openRouterApiKey)
     VALUES (@steamId, @apiKey, @openRouterApiKey)`,
  ).run(newConfig);
}

import https from 'https';
import * as S from 'sury';
import db from '../lib/db';
import { Achievement } from '../models/achievement';
import { Game } from '../models/game';
import { AchievementSchema, GameSchema } from '../schemas/models';
import {
  GameSchemaForGameSchema,
  PlayerAchievementsSchema,
  ResolveVanityUrlSchema,
  SteamGamesResponseSchema,
  UserStatsForGameSchema,
} from '../schemas/steam';

function fetchJson<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        // const status = res.statusCode ?? 0;
        // if (status < 200 || status >= 300) {
        //   reject(new Error(`HTTP ${status} for ${url}`));
        //   return;
        // }
        const chunks: Buffer[] = [];
        res.on('data', (d) => chunks.push(d));
        res.on('end', () => {
          try {
            const json = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
            resolve(json as T);
          } catch (err) {
            reject(err);
          }
        });
      })
      .on('error', reject);
  });
}

function fetchText(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        const status = res.statusCode ?? 0;
        if (status < 200 || status >= 300) {
          reject(new Error(`HTTP ${status} for ${url}`));
          return;
        }
        const chunks: Buffer[] = [];
        res.on('data', (d) => chunks.push(d));
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
      })
      .on('error', reject);
  });
}

export async function resolveVanityUrl(apiKey: string, vanityUrl: string): Promise<string> {
  const url = `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${encodeURIComponent(
    apiKey,
  )}&vanityurl=${encodeURIComponent(vanityUrl)}`;
  const data = await fetchJson<unknown>(url);
  try {
    const parsed = S.parseOrThrow(data, ResolveVanityUrlSchema);
    if (parsed.response?.success === 1 && parsed.response.steamid) return parsed.response.steamid;
  } catch {
    // ignore invalid response
  }
  // If resolution fails, return the input to let upstream decide
  return vanityUrl;
}

/**
 * Fetches a list of games for a given Steam user.
 * @param apiKey The Steam Web API key.
 * @param steamId The Steam ID of the user.
 * @returns A promise that resolves to an array of Game objects.
 */
export async function getGames(apiKey: string, steamId: string): Promise<Game[]> {
  const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${encodeURIComponent(
    apiKey,
  )}&steamid=${encodeURIComponent(steamId)}&include_appinfo=true&include_played_free_games=true`;

  const data = await fetchJson<unknown>(url);
  let gamesRaw: Array<{ appid: number; name?: string }> = [];
  try {
    const parsed = S.parseOrThrow(data, SteamGamesResponseSchema);
    gamesRaw = parsed.response?.games ?? [];
  } catch {
    // ignore invalid response shape
  }
  const games: Game[] = gamesRaw
    .filter(
      (g): g is { appid: number; name: string } =>
        typeof g.appid === 'number' && typeof g.name === 'string' && g.name.length > 0,
    )
    .map((g) => ({ appId: g.appid, name: g.name }));

  const validatedGames = S.parseOrThrow(games, S.array(GameSchema));

  const insert = db.prepare('INSERT OR REPLACE INTO games (appId, name) VALUES (@appId, @name)');
  const tx = db.transaction((items: Game[]) => {
    for (const item of items) insert.run(item);
  });
  tx(validatedGames);

  return validatedGames;
}

/**
 * Fetches a list of achievements for a specific game and user.
 * @param apiKey The Steam Web API key.
 * @param steamId The Steam ID of the user.
 * @param appId The App ID of the game.
 * @returns A promise that resolves to an array of Achievement objects.
 */
export async function getAchievements(apiKey: string, steamId: string, appId: number): Promise<Achievement[]> {
  const schemaUrl = `https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${encodeURIComponent(
    apiKey,
  )}&appid=${appId}`;

  //  http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?appid=440&key=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX&steamid=76561197972495328
  const playerUrl = `https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?key=${encodeURIComponent(
    apiKey,
  )}&steamid=${encodeURIComponent(steamId)}&appid=${appId}&l=english`;

  // Try schema + primary player achievements endpoint first
  const [schema, player] = await Promise.all([fetchJson<unknown>(schemaUrl), fetchJson<unknown>(playerUrl)]);

  let parsedSchema:
    | {
        game?: {
          availableGameStats?: { achievements?: Array<{ name: string; displayName?: string; description?: string }> };
        };
      }
    | undefined;
  let parsedPlayer:
    | {
        playerstats?: {
          achievements?: Array<{ apiname: string; achieved: number; unlocktime?: number }>;
          error?: string;
        };
      }
    | undefined;
  try {
    parsedSchema = S.parseOrThrow(schema, GameSchemaForGameSchema);
  } catch {
    // ignore invalid schema
  }
  try {
    parsedPlayer = S.parseOrThrow(player, PlayerAchievementsSchema);
  } catch {
    // ignore invalid player payload
  }

  const playerError = parsedPlayer?.playerstats?.error;

  if (typeof playerError === 'string' && playerError.toLowerCase().includes('not public')) {
    throw new Error(playerError);
  }

  let playerAchievements: Array<{ apiname: string; achieved: number; unlocktime?: number }> =
    parsedPlayer?.playerstats?.achievements ?? [];

  // Fallback: some titles or privacy settings cause GetPlayerAchievements to omit data
  // Attempt GetUserStatsForGame, which sometimes returns achievements under a different shape
  if (!playerAchievements || playerAchievements.length === 0) {
    const userStatsUrl = `https://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v2/?key=${encodeURIComponent(
      apiKey,
    )}&steamid=${encodeURIComponent(steamId)}&appid=${appId}&l=english`;
    try {
      const altUnknown = await fetchJson<unknown>(userStatsUrl);
      const alt = S.parseOrThrow(altUnknown, UserStatsForGameSchema);
      const altAchievements = alt.playerstats?.achievements ?? [];
      if (altAchievements.length > 0) {
        playerAchievements = altAchievements.map((a) => ({
          apiname: a.name,
          achieved: a.achieved,
          unlocktime: a.unlocktime,
        }));
      }
    } catch {
      // ignore and continue with empty player achievements
    }
  }

  // Fallback 2: Steam Community XML (no API key needed, but we have one). Some games report achievements here
  if (!playerAchievements || playerAchievements.length === 0) {
    const profilePath = /^\d{17}$/.test(steamId) ? `profiles/${steamId}` : `id/${encodeURIComponent(steamId)}`;
    const xmlUrl = `https://steamcommunity.com/${profilePath}/stats/${appId}?xml=1&l=english`;
    try {
      const xml = await fetchText(xmlUrl);
      // Very small, permissive parser to extract <achievements><achievement>...</achievement></achievements>
      // We only need apiname, achieved, and unlocktime
      const items: Array<{ apiname: string; achieved: number; unlocktime?: number }> = [];
      const achievementBlocks = xml.split('<achievement>').slice(1);
      for (const block of achievementBlocks) {
        const nameMatch = block.match(/<apiname>([^<]+)<\/apiname>/i) || block.match(/<name>([^<]+)<\/name>/i);
        const achievedMatch = block.match(/<achieved>(\d+)<\/achieved>/i);
        const unlockMatch = block.match(/<unlockTimestamp>(\d+)<\/unlockTimestamp>/i);
        if (!nameMatch) continue;
        const apiname = nameMatch[1];
        const achieved = achievedMatch ? parseInt(achievedMatch[1], 10) : 0;
        const unlocktime = unlockMatch ? parseInt(unlockMatch[1], 10) : undefined;
        items.push({ apiname, achieved, unlocktime });
      }
      if (items.length > 0) {
        playerAchievements = items;
      }
    } catch {
      // ignore and continue
    }
  }

  const merged: Achievement[] = mergeSchemaAndPlayerAchievements({
    schemaAchievements: parsedSchema?.game?.availableGameStats?.achievements ?? [],
    playerAchievements,
    appId,
  });

  const validatedMerged = S.parseOrThrow(merged, S.array(AchievementSchema));

  const upsert = db.prepare(
    `INSERT OR REPLACE INTO achievements (apiName, gameAppId, displayName, description, achieved, unlockedAt)
     VALUES (@apiName, @gameAppId, @displayName, @description, @achieved, @unlockedAt)`,
  );
  const tx = db.transaction((items: Achievement[]) => {
    for (const item of items)
      upsert.run({
        ...item,
        achieved: item.achieved ? 1 : 0,
        unlockedAt: item.unlockedAt?.toISOString() ?? null,
      });
  });
  tx(validatedMerged);

  return validatedMerged;
}

export function mergeSchemaAndPlayerAchievements(args: {
  schemaAchievements: Array<{ name: string; displayName?: string; description?: string }>;
  playerAchievements: Array<{ apiname: string; achieved: number; unlocktime?: number }>;
  appId: number;
}): Achievement[] {
  const { schemaAchievements, playerAchievements, appId } = args;

  const baseByName = new Map<string, Achievement>();
  for (const s of schemaAchievements) {
    baseByName.set(s.name, {
      apiName: s.name,
      gameAppId: appId,
      displayName: s.displayName ?? s.name,
      description: s.description ?? '',
      achieved: false,
    });
  }

  for (const p of playerAchievements) {
    const unlockedAt = p.unlocktime && p.unlocktime > 0 ? new Date(p.unlocktime * 1000) : undefined;
    const existing = baseByName.get(p.apiname);
    if (existing) {
      existing.achieved = p.achieved === 1;
      existing.unlockedAt = unlockedAt;
    } else {
      baseByName.set(p.apiname, {
        apiName: p.apiname,
        gameAppId: appId,
        displayName: p.apiname,
        description: '',
        achieved: p.achieved === 1,
        unlockedAt,
      });
    }
  }

  return Array.from(baseByName.values());
}

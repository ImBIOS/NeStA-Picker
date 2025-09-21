import https from 'https';
import db from '../lib/db';
import { Achievement } from '../models/achievement';
import { Game } from '../models/game';

function fetchJson<T>(url: string): Promise<T> {
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

export async function resolveVanityUrl(apiKey: string, vanityUrl: string): Promise<string> {
  const url = `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${encodeURIComponent(
    apiKey,
  )}&vanityurl=${encodeURIComponent(vanityUrl)}`;
  type Resp = { response?: { success?: number; steamid?: string } };
  const data = await fetchJson<Resp>(url);
  if (data.response?.success === 1 && data.response.steamid) return data.response.steamid;
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

  type SteamGamesResponse = {
    response?: { games?: Array<{ appid: number; name?: string }> };
  };

  const data = await fetchJson<SteamGamesResponse>(url);
  const games: Game[] = (data.response?.games ?? [])
    .filter((g) => typeof g.appid === 'number' && typeof g.name === 'string' && g.name.length > 0)
    .map((g) => ({ appId: g.appid, name: g.name as string }));

  const insert = db.prepare('INSERT OR REPLACE INTO games (appId, name) VALUES (@appId, @name)');
  const tx = db.transaction((items: Game[]) => {
    for (const item of items) insert.run(item);
  });
  tx(games);

  return games;
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

  const playerUrl = `https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?key=${encodeURIComponent(
    apiKey,
  )}&steamid=${encodeURIComponent(steamId)}&appid=${appId}`;

  type SchemaResp = {
    game?: {
      availableGameStats?: { achievements?: Array<{ name: string; displayName?: string; description?: string }> };
    };
  };
  type PlayerResp = {
    playerstats?: { achievements?: Array<{ apiname: string; achieved: number; unlocktime?: number }> };
  };

  const [schema, player] = await Promise.all([
    fetchJson<SchemaResp>(schemaUrl).catch(() => ({}) as SchemaResp),
    fetchJson<PlayerResp>(playerUrl).catch(() => ({}) as PlayerResp),
  ]);

  const merged: Achievement[] = mergeSchemaAndPlayerAchievements({
    schemaAchievements: schema.game?.availableGameStats?.achievements ?? [],
    playerAchievements: player.playerstats?.achievements ?? [],
    appId,
  });

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
  tx(merged);

  return merged;
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

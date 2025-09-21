import db from '../lib/db';
import logger from '../lib/logger';
import { Achievement } from '../models/achievement';
import { getConfig } from './config';
import { getAchievementsWithPlaywright, getGamesWithPlaywright } from './playwright';
import { getAchievements, getGames, resolveVanityUrl } from './steam';

/**
 * Picks an achievement for the user based on their configuration and available achievements.
 * @returns A promise that resolves to a single Achievement object or null if no achievement can be picked.
 */
export async function pickAchievement(options?: { gameName?: string; random?: boolean }): Promise<Achievement | null> {
  const config = getConfig();
  const hasSteamId = Boolean(config.steamId);
  const hasApiKey = Boolean(config.apiKey);
  if (hasSteamId && hasApiKey) {
    logger.debug('Loaded config: using Steam Web API path', { hasSteamId, hasApiKey });
  } else if (hasSteamId && !hasApiKey) {
    logger.debug('Loaded config: using Playwright scraping path (no Steam API key)', { hasSteamId, hasApiKey });
  } else {
    logger.debug('Loaded config: insufficient configuration (missing SteamID)', { hasSteamId, hasApiKey });
  }
  if (!config.steamId) return null;

  // Resolve vanity ID if needed
  let steamIdToUse = config.steamId;
  if (hasApiKey && steamIdToUse && !/^\d{17}$/.test(steamIdToUse)) {
    try {
      steamIdToUse = await resolveVanityUrl(config.apiKey!, steamIdToUse);
    } catch {
      // fall back to original value
    }
  }

  // Load games first (for filtering and to determine appId)
  const games = hasApiKey ? await getGames(config.apiKey!, steamIdToUse) : await getGamesWithPlaywright();
  logger.debug('Fetched games', { total: games.length });

  const candidateGames = options?.gameName
    ? games.filter((g) => g.name.toLowerCase().includes(options.gameName!.toLowerCase()))
    : games;
  logger.debug('Candidate games after filter', { gameName: options?.gameName, count: candidateGames.length });

  if (candidateGames.length === 0) return null;

  // Iterate games until we find a game with unachieved achievements
  const gameOrder = [...candidateGames];
  if (options?.random) {
    for (let i = gameOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [gameOrder[i], gameOrder[j]] = [gameOrder[j], gameOrder[i]];
    }
  }

  for (const game of gameOrder) {
    logger.debug('Selected game', { appId: game.appId, name: game.name });
    const achievements = hasApiKey
      ? await getAchievements(config.apiKey!, steamIdToUse, game.appId)
      : await getAchievementsWithPlaywright(game.appId);
    logger.debug('Fetched achievements', { total: achievements.length });

    const unachieved = achievements.filter((a) => !a.achieved);
    logger.debug('Unachieved achievements', { count: unachieved.length });
    if (unachieved.length === 0) continue;

    const pick = options?.random ? unachieved[Math.floor(Math.random() * unachieved.length)] : unachieved[0];
    logger.debug('Picked achievement', { apiName: pick.apiName, displayName: pick.displayName });

    db.prepare(`INSERT INTO pick_history (achievementApiName, pickedAt) VALUES (?, datetime('now'))`).run(pick.apiName);
    logger.debug('Recorded pick history');
    return pick;
  }

  return null;
}

/**
 * Lists achievements for the selected or filtered game. Used by --browse.
 */
export async function listAchievements(options?: { gameName?: string }): Promise<Achievement[]> {
  const config = getConfig();
  if (!config.steamId) return [];

  const games = config.apiKey ? await getGames(config.apiKey, config.steamId) : await getGamesWithPlaywright();
  const candidateGames = options?.gameName
    ? games.filter((g) => g.name.toLowerCase().includes(options.gameName!.toLowerCase()))
    : games;

  if (candidateGames.length === 0) return [];

  // For browse, take the first matching game and return its achievements
  const game = candidateGames[0];
  const achievements = config.apiKey
    ? await getAchievements(config.apiKey, config.steamId, game.appId)
    : await getAchievementsWithPlaywright(game.appId);

  return achievements;
}

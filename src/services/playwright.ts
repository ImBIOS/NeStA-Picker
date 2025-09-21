import db from '../lib/db';
import { Achievement } from '../models/achievement';
import { Game } from '../models/game';

/**
 * Fetches a list of games by scraping Steam using Playwright.
 * This is a fallback if the Steam API key is not provided or fails.
 * @returns A promise that resolves to an array of Game objects.
 */
export async function getGamesWithPlaywright(): Promise<Game[]> {
  // Deterministic stub for now: provide an empty list to signal no data available
  const games: Game[] = [];
  const insert = db.prepare('INSERT OR REPLACE INTO games (appId, name) VALUES (@appId, @name)');
  const tx = db.transaction((items: Game[]) => {
    for (const item of items) insert.run(item);
  });
  tx(games);
  return games;
}

/**
 * Fetches a list of achievements for a specific game by scraping Steam using Playwright.
 * This is a fallback if the Steam API key is not provided or fails.
 * @param appId The App ID of the game.
 * @returns A promise that resolves to an array of Achievement objects.
 */
export async function getAchievementsWithPlaywright(_appId: number): Promise<Achievement[]> {
  // Deterministic stub for now: provide an empty list to signal no data available
  const achievements: Achievement[] = [];
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
  tx(achievements);
  return achievements;
}

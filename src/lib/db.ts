import Database from 'better-sqlite3';

const db = new Database('nesta.db');

/**
 * Initializes the database and creates the necessary tables.
 */
export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      steamId TEXT UNIQUE,
      apiKey TEXT UNIQUE,
      openRouterApiKey TEXT UNIQUE
    );

    CREATE TABLE IF NOT EXISTS games (
      appId INTEGER PRIMARY KEY,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS achievements (
      apiName TEXT PRIMARY KEY,
      gameAppId INTEGER NOT NULL,
      displayName TEXT NOT NULL,
      description TEXT,
      achieved BOOLEAN NOT NULL,
      unlockedAt DATETIME,
      FOREIGN KEY (gameAppId) REFERENCES games(appId)
    );

    CREATE TABLE IF NOT EXISTS pick_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      achievementApiName TEXT NOT NULL,
      pickedAt DATETIME NOT NULL,
      FOREIGN KEY (achievementApiName) REFERENCES achievements(apiName)
    );
  `);
}

export default db;

// Ensure React reconciler sees a proper environment
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
// React import not needed; components are created in tests
import { vi } from 'vitest';

type User = { steamId: string; apiKey?: string; openRouterApiKey?: string };
type Game = { appId: number; name: string };
type Achievement = {
  apiName: string;
  gameAppId: number;
  displayName: string;
  description: string;
  achieved: boolean;
  unlockedAt?: string | Date;
};
type PickHistory = { achievementApiName: string; pickedAt: string };

const store = {
  users: [] as User[],
  games: new Map<number, Game>(),
  achievements: new Map<string, Achievement>(),
  pick_history: [] as PickHistory[],
};

class FakeStatement {
  constructor(private sql: string) {}
  run(params?: any) {
    const sql = this.sql;
    if (/INSERT OR REPLACE INTO users/i.test(sql)) {
      const u = params as User;
      store.users.length = 0;
      store.users.push({ steamId: u.steamId ?? '', apiKey: u.apiKey, openRouterApiKey: u.openRouterApiKey });
      return { changes: 1 } as any;
    }
    if (/INSERT OR REPLACE INTO games/i.test(sql)) {
      const g = params as Game;
      store.games.set(g.appId, { appId: g.appId, name: g.name });
      return { changes: 1 } as any;
    }
    if (/INSERT OR REPLACE INTO achievements/i.test(sql)) {
      const a = params as Achievement;
      store.achievements.set(a.apiName, { ...a });
      return { changes: 1 } as any;
    }
    if (/INSERT INTO pick_history/i.test(sql)) {
      const achievementApiName = Array.isArray(params) ? params[0] : params;
      store.pick_history.push({ achievementApiName, pickedAt: new Date().toISOString() });
      return { changes: 1 } as any;
    }
    return { changes: 0 } as any;
  }
  get() {
    const sql = this.sql;
    if (/SELECT \* FROM users/i.test(sql)) {
      return store.users[0];
    }
    return undefined;
  }
  all() {
    const sql = this.sql;
    if (/FROM pick_history/i.test(sql)) {
      const rows = [...store.pick_history]
        .sort((a, b) => (a.pickedAt < b.pickedAt ? 1 : -1))
        .slice(0, 50)
        .map((ph) => ({
          pickedAt: ph.pickedAt,
          achievementApiName: ph.achievementApiName,
          displayName: store.achievements.get(ph.achievementApiName)?.displayName ?? undefined,
        }));
      return rows as any;
    }
    return [] as any[];
  }
}

class FakeDatabase {
  constructor(_filename: string) {}
  exec(_sql: string) {
    // no-op for table creation
  }
  prepare(sql: string) {
    return new FakeStatement(sql) as any;
  }
  transaction<T extends any[]>(fn: (...args: T) => void) {
    return (...args: T) => fn(...args);
  }
}

vi.mock('better-sqlite3', () => ({ default: FakeDatabase }));

// Use actual Ink components; ink-testing-library will capture stdout.

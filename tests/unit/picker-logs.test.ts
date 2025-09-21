import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setLogLevel } from '../../src/lib/logger';
import * as configSvc from '../../src/services/config';
import { pickAchievement } from '../../src/services/picker';
import * as pwSvc from '../../src/services/playwright';
import * as steamSvc from '../../src/services/steam';

describe('Picker debug logging', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setLogLevel('debug');
  });

  it('emits debug logs in development path', async () => {
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(configSvc, 'getConfig').mockReturnValue({ steamId: '123', apiKey: 'k' } as any);
    vi.spyOn(steamSvc, 'getGames').mockResolvedValue([{ appId: 1, name: 'Game A' }] as any);
    vi.spyOn(steamSvc, 'getAchievements').mockResolvedValue([
      { apiName: 'a2', gameAppId: 1, displayName: 'A2', description: '', achieved: false },
    ] as any);

    await pickAchievement();
    const joined = debugSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(joined).toContain('Loaded config: using Steam Web API path');
    expect(joined).toContain('Fetched games');
    expect(joined).toContain('Selected game');
    expect(joined).toContain('Fetched achievements');
    expect(joined).toContain('Picked achievement');
  });

  it('still logs debug for playwright path', async () => {
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(configSvc, 'getConfig').mockReturnValue({ steamId: '123' } as any);
    vi.spyOn(pwSvc, 'getGamesWithPlaywright').mockResolvedValue([{ appId: 1, name: 'Game A' }] as any);
    vi.spyOn(pwSvc, 'getAchievementsWithPlaywright').mockResolvedValue([
      { apiName: 'a3', gameAppId: 1, displayName: 'A3', description: '', achieved: false },
    ] as any);

    await pickAchievement();
    const joined = debugSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(joined).toContain('Loaded config: using Playwright scraping path');
    expect(joined).toContain('Fetched games');
    expect(joined).toContain('Fetched achievements');
    expect(joined).toContain('Picked achievement');
  });

  it('logs insufficient config when missing steamId', async () => {
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(configSvc, 'getConfig').mockReturnValue({ steamId: '', apiKey: 'k' } as any);
    await pickAchievement();
    const joined = debugSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(joined).toContain('Loaded config: insufficient configuration');
  });
});

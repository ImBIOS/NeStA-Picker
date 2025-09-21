import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as configSvc from '../../src/services/config';
import { pickAchievement } from '../../src/services/picker';
import * as pwSvc from '../../src/services/playwright';
import * as steamSvc from '../../src/services/steam';

describe('Picker Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('picks first unachieved achievement using Steam API path', async () => {
    vi.spyOn(configSvc, 'getConfig').mockReturnValue({ steamId: '123', apiKey: 'k' });
    vi.spyOn(steamSvc, 'getGames').mockResolvedValue([{ appId: 1, name: 'Game A' }]);
    vi.spyOn(steamSvc, 'getAchievements').mockResolvedValue([
      { apiName: 'a1', gameAppId: 1, displayName: 'A1', description: '', achieved: true },
      { apiName: 'a2', gameAppId: 1, displayName: 'A2', description: '', achieved: false },
    ]);

    const pick = await pickAchievement();
    expect(pick?.apiName).toBe('a2');
  });

  it('returns null when no games', async () => {
    vi.spyOn(configSvc, 'getConfig').mockReturnValue({ steamId: '123', apiKey: 'k' });
    vi.spyOn(steamSvc, 'getGames').mockResolvedValue([]);

    const pick = await pickAchievement();
    expect(pick).toBeNull();
  });

  it('uses Playwright fallback when no API key', async () => {
    vi.spyOn(configSvc, 'getConfig').mockReturnValue({ steamId: '123' });
    vi.spyOn(pwSvc, 'getGamesWithPlaywright').mockResolvedValue([{ appId: 1, name: 'Game A' }]);
    vi.spyOn(pwSvc, 'getAchievementsWithPlaywright').mockResolvedValue([
      { apiName: 'a3', gameAppId: 1, displayName: 'A3', description: '', achieved: false },
    ]);

    const pick = await pickAchievement();
    expect(pick?.apiName).toBe('a3');
  });

  it('skips games with no unachieved achievements and picks from next game', async () => {
    vi.spyOn(configSvc, 'getConfig').mockReturnValue({ steamId: '123', apiKey: 'k' });
    vi.spyOn(steamSvc, 'getGames').mockResolvedValue([
      { appId: 1, name: 'Game A' },
      { appId: 2, name: 'Game B' },
    ]);
    const getAchievementsSpy = vi.spyOn(steamSvc, 'getAchievements');
    getAchievementsSpy.mockResolvedValueOnce([
      { apiName: 'gA1', gameAppId: 1, displayName: 'GA1', description: '', achieved: true },
    ]);
    getAchievementsSpy.mockResolvedValueOnce([
      { apiName: 'gB1', gameAppId: 2, displayName: 'GB1', description: '', achieved: false },
    ]);

    const pick = await pickAchievement();
    expect(pick?.gameAppId).toBe(2);
    expect(pick?.apiName).toBe('gB1');
  });

  it('resolves vanity Steam IDs before calling Steam API', async () => {
    vi.spyOn(configSvc, 'getConfig').mockReturnValue({ steamId: 'mycustomname', apiKey: 'k' } as any);
    const vanitySpy = vi.spyOn(steamSvc, 'resolveVanityUrl').mockResolvedValue('76561198000000000');
    vi.spyOn(steamSvc, 'getGames').mockResolvedValue([{ appId: 10, name: 'Game X' }]);
    vi.spyOn(steamSvc, 'getAchievements').mockResolvedValue([
      { apiName: 'ax', gameAppId: 10, displayName: 'AX', description: '', achieved: false },
    ]);

    const pick = await pickAchievement();
    expect(vanitySpy).toHaveBeenCalledWith('k', 'mycustomname');
    expect(pick?.apiName).toBe('ax');
  });
});

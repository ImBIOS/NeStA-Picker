import { describe, expect, it } from 'vitest';
import { mergeSchemaAndPlayerAchievements } from '../../src/services/steam';

describe('mergeSchemaAndPlayerAchievements', () => {
  it('returns schema achievements as unachieved when player list is empty', () => {
    const schema = [
      { name: 'ACH_WIN_1', displayName: 'Win One', description: 'Win once' },
      { name: 'ACH_KILL_10', displayName: 'Ten Kills', description: 'Kill ten' },
    ];
    const player: Array<{ apiname: string; achieved: number; unlocktime?: number }> = [];

    const merged = mergeSchemaAndPlayerAchievements({
      schemaAchievements: schema,
      playerAchievements: player,
      appId: 42,
    });

    expect(merged).toHaveLength(2);
    expect(merged.map((a) => a.apiName)).toEqual(['ACH_WIN_1', 'ACH_KILL_10']);
    expect(merged.every((a) => a.achieved === false)).toBe(true);
  });

  it('overlays player achieved state onto schema baseline', () => {
    const schema = [
      { name: 'ACH_X', displayName: 'X', description: 'desc x' },
      { name: 'ACH_Y', displayName: 'Y', description: 'desc y' },
    ];
    const player = [{ apiname: 'ACH_X', achieved: 1, unlocktime: 1_700_000_000 }];

    const merged = mergeSchemaAndPlayerAchievements({
      schemaAchievements: schema,
      playerAchievements: player,
      appId: 7,
    });

    expect(merged).toHaveLength(2);
    const ax = merged.find((a) => a.apiName === 'ACH_X')!;
    expect(ax.achieved).toBe(true);
    expect(ax.unlockedAt).toBeInstanceOf(Date);
    const ay = merged.find((a) => a.apiName === 'ACH_Y')!;
    expect(ay.achieved).toBe(false);
  });

  it('includes player achievements not present in schema', () => {
    const schema = [{ name: 'ACH_IN_SCHEMA', displayName: 'In Schema', description: 'present' }];
    const player = [{ apiname: 'ACH_ONLY_PLAYER', achieved: 0 }];

    const merged = mergeSchemaAndPlayerAchievements({
      schemaAchievements: schema,
      playerAchievements: player,
      appId: 99,
    });

    expect(merged.map((a) => a.apiName).sort()).toEqual(['ACH_IN_SCHEMA', 'ACH_ONLY_PLAYER']);
    const onlyPlayer = merged.find((a) => a.apiName === 'ACH_ONLY_PLAYER')!;
    expect(onlyPlayer.displayName).toBe('ACH_ONLY_PLAYER');
    expect(onlyPlayer.description).toBe('');
    expect(onlyPlayer.achieved).toBe(false);
  });
});

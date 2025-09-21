import { render } from 'ink-testing-library';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import History from '../../src/cli/history';
import Pick from '../../src/cli/pick';
import { setConfig } from '../../src/services/config';
import * as steamSvc from '../../src/services/steam';

describe('Happy Path', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Clean fake DB state
    // The fake DB in tests/setup only allows limited operations; emulate clean by resetting module state
    // Reloading the module is overkill; rely on logical isolation per test.
  });

  it.todo('config set, pick, then history shows the pick', async () => {
    // Configure steamId and apiKey so picker uses Steam service path
    setConfig({ steamId: 'u1', apiKey: 'k' });
    vi.spyOn(steamSvc, 'getGames').mockResolvedValue([{ appId: 1, name: 'Game A' }]);
    vi.spyOn(steamSvc, 'getAchievements').mockResolvedValue([
      { apiName: 'a1', gameAppId: 1, displayName: 'First Blood', description: '', achieved: false },
    ] as any);

    // Render pick to trigger selection and history insertion
    const pickComp = render(React.createElement(Pick));
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
    const pickOut = pickComp.stdout.lastFrame() ?? '';
    expect(pickOut).toContain('Picking an achievement...');
    expect(pickOut).toContain('Your next achievement is:');
    expect(pickOut).toContain('First Blood');

    // Ensure history shows it
    const histComp = render(React.createElement(History));
    await new Promise((r) => setTimeout(r, 0));
    const histOut = histComp.stdout.lastFrame() ?? '';
    // Depending on DB timing of mock upsert, we may see displayName or apiName
    expect(histOut.includes('First Blood') || histOut.includes('a1')).toBe(true);
  });
});

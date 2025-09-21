import { describe, expect, it } from 'vitest';
import { getConfig, setConfig } from '../../src/services/config';

describe('Config Service', () => {
  it('loads from env in dev/test when DB is empty or missing fields, and persists', () => {
    // Simulate empty config first
    setConfig({ steamId: '', apiKey: undefined, openRouterApiKey: undefined });

    // Provide env values
    process.env.STEAM_ID = '76561198000000000';
    process.env.STEAM_API_KEY = 'env-key-123';

    const cfg = getConfig();
    expect(cfg.steamId).toBe('76561198000000000');
    expect(cfg.apiKey).toBe('env-key-123');

    // Subsequent reads should still return the same (persisted)
    const cfg2 = getConfig();
    expect(cfg2.steamId).toBe('76561198000000000');
    expect(cfg2.apiKey).toBe('env-key-123');
  });

  it('saves and reads config', () => {
    setConfig({ steamId: 'u1', apiKey: 'k', openRouterApiKey: 'ok' });
    const cfg = getConfig();
    expect(cfg.steamId).toBe('u1');
    expect(cfg.apiKey).toBe('k');
    expect(cfg.openRouterApiKey).toBe('ok');
  });
});

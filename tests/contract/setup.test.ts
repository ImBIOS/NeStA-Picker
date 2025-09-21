import { PassThrough } from 'stream';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/services/config');

describe('first-run setup wizard', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('prompts for steamId and apiKey with guides, saves, and returns', async () => {
    const { ensureInitialSetup } = await import('../../src/cli/setup');
    const configSvc = await import('../../src/services/config');

    vi.mocked(configSvc.getConfig as any).mockReturnValue({ steamId: '', apiKey: null, openRouterApiKey: null });
    const save = vi.fn();
    vi.mocked(configSvc.setConfig as any).mockImplementation((cfg: any) => save(cfg));

    const stdin = new PassThrough();
    const stdout = new PassThrough();
    let out = '';
    stdout.on('data', (c) => (out += String(c)));

    // Simulate user inputs: steamId, apiKey, skip openrouter (empty)
    const p = ensureInitialSetup(stdin as any, stdout as any);
    // Small delay to let prompts write
    await new Promise((r) => setTimeout(r, 5));
    stdin.write('76561198000000000\n');
    await new Promise((r) => setTimeout(r, 5));
    stdin.write('STEAM_API_KEY_XYZ\n');
    await new Promise((r) => setTimeout(r, 5));
    stdin.write('\n'); // skip openrouter
    await p;

    expect(out.toLowerCase()).toContain('steamid');
    expect(out.toLowerCase()).toContain('steam web api');
    expect(save).toHaveBeenCalledWith({ steamId: '76561198000000000' });
    expect(save).toHaveBeenCalledWith({ apiKey: 'STEAM_API_KEY_XYZ' });
    // optional key may or may not be saved depending on implementation (skip)
  });
});

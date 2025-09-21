import React from 'react';
import TestRenderer from 'react-test-renderer';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Pick from '../../src/cli/pick';
import * as configSvc from '../../src/services/config';
import * as explainSvc from '../../src/services/explain';
import * as picker from '../../src/services/picker';

vi.mock('../../src/services/picker');
vi.mock('../../src/services/config');
vi.mock('../../src/services/explain');

describe('nesta pick auto-exit', () => {
  const originalExit = process.exit as any;
  let exitSpy: any;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.NESTA_AUTO_EXIT = '1';
    // Stub exit to throw so we can assert
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`exit:${code ?? 0}`);
    }) as any);
  });

  it('exits 0 on success', async () => {
    vi.mocked(configSvc.getConfig).mockReturnValue({ steamId: 'u1', apiKey: 'k' } as any);
    vi.mocked(picker.pickAchievement).mockResolvedValue({
      apiName: 'a1',
      gameAppId: 1,
      displayName: 'Win',
      description: '',
      achieved: false,
    } as any);

    try {
      TestRenderer.create(React.createElement(Pick));
      await new Promise((r) => setTimeout(r, 0));
    } catch (e: any) {
      expect(String(e.message)).toBe('exit:0');
    }
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it('exits 1 on error/no config', async () => {
    vi.mocked(configSvc.getConfig).mockReturnValue({ steamId: '', apiKey: null } as any);
    vi.mocked(picker.pickAchievement).mockResolvedValue(null);

    try {
      TestRenderer.create(React.createElement(Pick));
      await new Promise((r) => setTimeout(r, 0));
    } catch (e: any) {
      expect(String(e.message)).toBe('exit:1');
    }
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('waits for explanation and exits 0 when --explain', async () => {
    const argv = [...process.argv];
    process.argv = [argv[0], argv[1], 'pick', '--explain'];
    vi.mocked(configSvc.getConfig).mockReturnValue({ steamId: 'u1', apiKey: 'k' } as any);
    vi.mocked(picker.pickAchievement).mockResolvedValue({
      apiName: 'a1',
      gameAppId: 1,
      displayName: 'Win',
      description: '',
      achieved: false,
    } as any);
    vi.mocked(explainSvc.generateExplanation).mockResolvedValue('Because.');

    try {
      TestRenderer.create(React.createElement(Pick));
      await new Promise((r) => setTimeout(r, 0));
      await new Promise((r) => setTimeout(r, 0));
    } catch (e: any) {
      expect(String(e.message)).toBe('exit:0');
    }
    expect(exitSpy).toHaveBeenCalledWith(0);
    process.argv = argv;
  });
});

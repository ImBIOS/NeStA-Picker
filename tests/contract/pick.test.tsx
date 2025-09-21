import { render } from 'ink-testing-library';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Pick from '../../src/cli/pick';
import * as configSvc from '../../src/services/config';
import * as explainSvc from '../../src/services/explain';
import * as picker from '../../src/services/picker';

vi.mock('../../src/services/picker');
vi.mock('../../src/services/explain');
vi.mock('../../src/services/config');

describe('nesta pick', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.NESTA_AUTO_EXIT; // ensure normal render tests don't auto-exit
  });

  it('renders picked achievement name', async () => {
    vi.mocked(configSvc.getConfig).mockReturnValue({ steamId: 'u1', apiKey: 'k' } as any);
    vi.mocked(picker.pickAchievement).mockResolvedValue({
      apiName: 'a1',
      gameAppId: 1,
      displayName: 'First Blood',
      description: '',
      achieved: false,
    } as any);
    const { stdout } = render(React.createElement(Pick));
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
    expect(stdout.lastFrame() ?? '').toContain('Your next achievement is: First Blood');
  });

  it('renders hint when no achievement found', async () => {
    vi.mocked(configSvc.getConfig).mockReturnValue({ steamId: 'u1', apiKey: 'k' } as any);
    vi.mocked(picker.pickAchievement).mockResolvedValue(null);
    const { stdout } = render(React.createElement(Pick));
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
    expect(stdout.lastFrame() ?? '').toMatch(
      /No suitable achievement found|No suitable achievement found.*Try --random/,
    );
  });

  it('renders explanation when --explain is passed', async () => {
    const argv = [...process.argv];
    process.argv = [argv[0], argv[1], 'pick', '--explain'];
    vi.mocked(configSvc.getConfig).mockReturnValue({ steamId: 'u1', apiKey: 'k' } as any);
    vi.mocked(picker.pickAchievement).mockResolvedValue({
      apiName: 'a1',
      gameAppId: 1,
      displayName: 'First Blood',
      description: '',
      achieved: false,
    } as any);
    vi.mocked(explainSvc.generateExplanation).mockResolvedValue('Because it is quick to attempt.');
    const { stdout } = render(React.createElement(Pick));
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
    const frame = stdout.lastFrame() ?? '';
    expect(frame).toContain('Why: ');
    expect(frame).toContain('Because it is quick to attempt.');
    process.argv = argv;
  });

  it('shows helpful message when steamId present but no apiKey and none found', async () => {
    vi.mocked(picker.pickAchievement).mockResolvedValue(null);
    vi.mocked(configSvc.getConfig).mockReturnValue({ steamId: '123', apiKey: null } as any);
    const { stdout } = render(React.createElement(Pick));
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
    const frame = (stdout.lastFrame() ?? '').toLowerCase();
    expect(frame).toContain('no steam api key');
    expect(frame).toContain('nesta config steam.apikey');
  });

  it('shows clear error when apiKey present but no steamId', async () => {
    vi.mocked(configSvc.getConfig).mockReturnValue({ steamId: '', apiKey: 'k' } as any);
    const { stdout } = render(React.createElement(Pick));
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
    const frame = stdout.lastFrame() ?? '';
    expect(frame.toLowerCase()).toContain('steamid is not configured');
    expect(frame).toContain('nesta config steam.steamId');
  });

  it('shows setup guidance when neither steamId nor apiKey are configured', async () => {
    vi.mocked(configSvc.getConfig).mockReturnValue({ steamId: '', apiKey: null } as any);
    const { stdout } = render(React.createElement(Pick));
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
    const output = stdout.lastFrame() ?? '';
    expect(output.toLowerCase()).toContain('not configured');
    expect(output).toContain('nesta config steam.steamId');
    expect(output).toContain('nesta config steam.apiKey');
  });

  it('renders list when --browse is passed', async () => {
    const argv = [...process.argv];
    process.argv = [argv[0], argv[1], 'pick', '--browse'];
    vi.mocked(configSvc.getConfig).mockReturnValue({ steamId: 'u1', apiKey: 'k' } as any);
    vi.mocked(picker.listAchievements).mockResolvedValue([
      { apiName: 'a1', gameAppId: 1, displayName: 'First Blood', description: '', achieved: false },
      { apiName: 'a2', gameAppId: 1, displayName: 'Rookie', description: '', achieved: true },
    ] as any);
    const { stdout } = render(React.createElement(Pick));
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
    const out = stdout.lastFrame() ?? '';
    expect(out).toContain('First Blood');
    expect(out).toContain('Rookie');
    process.argv = argv;
  });
});

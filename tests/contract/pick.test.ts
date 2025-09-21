import React from 'react';
import TestRenderer from 'react-test-renderer';
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

  function textOf(node: any): string {
    if (node == null) return '';
    if (typeof node === 'string') return node;
    if (Array.isArray(node)) return node.map(textOf).join('');
    return textOf(node.children ?? '');
  }

  it('renders picked achievement name', async () => {
    vi.mocked(configSvc.getConfig).mockReturnValue({ steamId: 'u1', apiKey: 'k' } as any);
    vi.mocked(picker.pickAchievement).mockResolvedValue({
      apiName: 'a1',
      gameAppId: 1,
      displayName: 'First Blood',
      description: '',
      achieved: false,
    } as any);

    const comp = TestRenderer.create(React.createElement(Pick));
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
    const output = textOf(comp.toJSON());
    expect(output).toContain('Your next achievement is: First Blood');
  });

  it('renders hint when no achievement found', async () => {
    vi.mocked(configSvc.getConfig).mockReturnValue({ steamId: 'u1', apiKey: 'k' } as any);
    vi.mocked(picker.pickAchievement).mockResolvedValue(null);
    const comp = TestRenderer.create(React.createElement(Pick));
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
    const output = textOf(comp.toJSON());
    expect(output).toContain('No suitable achievement found');
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
    const comp = TestRenderer.create(React.createElement(Pick));
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
    const output = textOf(comp.toJSON());
    expect(output).toContain('Why: ');
    expect(output).toContain('Because it is quick to attempt.');
    process.argv = argv;
  });

  it('shows helpful message when steamId present but no apiKey and none found', async () => {
    vi.mocked(picker.pickAchievement).mockResolvedValue(null);
    vi.mocked(configSvc.getConfig).mockReturnValue({ steamId: '123', apiKey: null } as any);
    const comp = TestRenderer.create(React.createElement(Pick));
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
    const output = textOf(comp.toJSON());
    expect(output.toLowerCase()).toContain('no steam api key');
    expect(output).toContain('nesta config steam.apiKey');
  });

  it('shows clear error when apiKey present but no steamId', async () => {
    vi.mocked(configSvc.getConfig).mockReturnValue({ steamId: '', apiKey: 'k' } as any);
    const comp = TestRenderer.create(React.createElement(Pick));
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
    const output = textOf(comp.toJSON());
    expect(output.toLowerCase()).toContain('steamid is not configured');
    expect(output).toContain('nesta config steam.steamId');
  });

  it('shows setup guidance when neither steamId nor apiKey are configured', async () => {
    vi.mocked(configSvc.getConfig).mockReturnValue({ steamId: '', apiKey: null } as any);
    const comp = TestRenderer.create(React.createElement(Pick));
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
    const output = textOf(comp.toJSON());
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
    const comp = TestRenderer.create(React.createElement(Pick));
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
    const out = textOf(comp.toJSON());
    expect(out).toContain('First Blood');
    expect(out).toContain('Rookie');
    process.argv = argv;
  });
});

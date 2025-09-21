import React from 'react';
import { render } from 'ink-testing-library';
import { describe, expect, it } from 'vitest';
import Config from '../../src/cli/config';
import { setConfig } from '../../src/services/config';

describe('nesta config', () => {
  it('prints usage when no args', () => {
    const argv = [...process.argv];
    process.argv = [argv[0], argv[1], 'config'];
    const {lastFrame} = render(<Config />);
    const text = typeof lastFrame === 'string' ? lastFrame : JSON.stringify(lastFrame);
    expect(text).toContain('Usage: nesta config <key> [value]');
    process.argv = argv;
  });

  it('sets and reads config values', () => {
    const argv = [...process.argv];
    setConfig({ steamId: 'u1' });
    process.argv = [argv[0], argv[1], 'config', 'steam.steamId'];
    const comp = TestRenderer.create(React.createElement(Config));
    const output = comp.toJSON() as any;
    const text = typeof output === 'string' ? output : JSON.stringify(output);
    expect(text).toContain('u1');
    process.argv = argv;
  });
});

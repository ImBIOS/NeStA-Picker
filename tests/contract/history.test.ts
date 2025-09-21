import React from 'react';
import TestRenderer from 'react-test-renderer';
import { describe, expect, it } from 'vitest';
import History from '../../src/cli/history';
import db from '../../src/lib/db';

describe('nesta history', () => {
  it('shows empty hint when no history', () => {
    const comp = TestRenderer.create(React.createElement(History));
    const output = comp.toJSON() as any;
    const text = typeof output === 'string' ? output : JSON.stringify(output);
    expect(text).toContain('No history yet. Tip: run');
  });

  it('lists recent history entries', () => {
    db.prepare(
      'INSERT OR REPLACE INTO achievements (apiName, gameAppId, displayName, description, achieved, unlockedAt) VALUES (@apiName, @gameAppId, @displayName, @description, @achieved, @unlockedAt)',
    ).run({
      apiName: 'a1',
      gameAppId: 1,
      displayName: 'First Blood',
      description: '',
      achieved: false,
      unlockedAt: null,
    });
    db.prepare("INSERT INTO pick_history (achievementApiName, pickedAt) VALUES (?, datetime('now'))").run('a1');

    const comp = TestRenderer.create(React.createElement(History));
    const output = comp.toJSON() as any;
    const text = typeof output === 'string' ? output : JSON.stringify(output);
    expect(text).toContain('First Blood');
  });
});

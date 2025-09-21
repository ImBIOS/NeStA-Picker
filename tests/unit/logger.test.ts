import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { logger, setLogLevel } from '../../src/lib/logger';

describe('logger', () => {
  const origEnv = process.env.NODE_ENV;
  let logs: string[];
  let infos: string[];
  let warns: string[];
  let errors: string[];

  beforeEach(() => {
    logs = [];
    infos = [];
    warns = [];
    errors = [];
    vi.spyOn(console, 'debug').mockImplementation((...args: any[]) => {
      logs.push(args.join(' '));
    });
    vi.spyOn(console, 'log').mockImplementation((...args: any[]) => {
      infos.push(args.join(' '));
    });
    vi.spyOn(console, 'warn').mockImplementation((...args: any[]) => {
      warns.push(args.join(' '));
    });
    vi.spyOn(console, 'error').mockImplementation((...args: any[]) => {
      errors.push(args.join(' '));
    });
  });

  afterEach(() => {
    process.env.NODE_ENV = origEnv;
    vi.restoreAllMocks();
  });

  it('emits debug in development', () => {
    setLogLevel('debug');
    logger.debug('x');
    expect(logs.join(' ')).toContain('x');
  });

  it('does not emit debug when level is info', () => {
    setLogLevel('info');
    logger.debug('x');
    expect(logs.length).toBe(0);
    logger.info('y');
    expect(infos.join(' ')).toContain('y');
  });
});

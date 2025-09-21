type LogLevel = 'silent' | 'error' | 'warn' | 'info' | 'debug';

function getEnvLogLevel(): LogLevel {
  const override = (process.env.LOG_LEVEL || '').toLowerCase();
  if (override && ['silent', 'error', 'warn', 'info', 'debug'].includes(override)) {
    return override as LogLevel;
  }
  const env = (process.env.NODE_ENV || 'production').toLowerCase();
  if (env === 'development' || env === 'test') return 'debug';
  return 'info';
}

const levelPriority: Record<LogLevel, number> = {
  silent: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
};

let currentLevel: LogLevel = getEnvLogLevel();

export function setLogLevel(level: LogLevel) {
  currentLevel = level;
}

function shouldLog(level: LogLevel): boolean {
  return levelPriority[level] <= levelPriority[currentLevel];
}

export const logger = {
  debug: (...args: unknown[]) => {
    if (shouldLog('debug')) console.debug('[debug]', ...args);
  },
  info: (...args: unknown[]) => {
    if (shouldLog('info')) console.log('[info]', ...args);
  },
  warn: (...args: unknown[]) => {
    if (shouldLog('warn')) console.warn('[warn]', ...args);
  },
  error: (...args: unknown[]) => {
    if (shouldLog('error')) console.error('[error]', ...args);
  },
};

export default logger;

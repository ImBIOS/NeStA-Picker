import { render } from 'ink';
import React from 'react';
import { initDb } from '../lib/db';
import { getConfig } from '../services/config';
import Config from './config';
import History from './history';
import Pick from './pick';
import ensureInitialSetup from './setup';

/**
 * CLI entrypoint for the NeStA-Picker application.
 * Parses the first positional argument as a subcommand and renders the
 * appropriate Ink component. Provides a concise usage help for unknown
 * or missing commands.
 */

initDb();

const command = process.argv[2];

function printUsage() {
  // Keep plain console output here to avoid nested Ink renders
  // when there is no valid command to render.
  console.log(
    [
      'Usage: nesta <command> [options]',
      '',
      'Commands:',
      '  pick [--game <name>] [--random]    Suggest next achievement',
      '  history                            Show pick history',
      '  config <key> [value]               Get/Set configuration',
      '',
      'Examples:',
      '  nesta config steam.steamId 7656119...',
      '  nesta pick --game "Hades"',
      '  nesta pick --random',
    ].join('\n'),
  );
}

if (!command || command === '-h' || command === '--help') {
  printUsage();
} else if (command === 'pick') {
  const cfg = getConfig();
  if (!cfg.steamId || !cfg.apiKey) {
    await ensureInitialSetup();
  }
  process.env.NESTA_AUTO_EXIT = '1';
  render(React.createElement(Pick));
} else if (command === 'history') {
  const cfg = getConfig();
  if (!cfg.steamId || !cfg.apiKey) {
    await ensureInitialSetup();
  }
  process.env.NESTA_AUTO_EXIT = '1';
  render(React.createElement(History));
} else if (command === 'config') {
  render(React.createElement(Config));
} else {
  console.log(`Unknown command: ${command}`);
  printUsage();
}

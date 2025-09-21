import { Text } from 'ink';
import { getConfig, setConfig } from '../services/config';

/**
 * Component for the `nesta config` command.
 * When called with key and value, updates configuration.
 * When called with only key, prints current value.
 * Otherwise prints usage.
 */
export default function Config() {
  const key = process.argv[3];
  const value = process.argv[4];

  if (key && value) {
    // Map dotted keys to service fields
    const mapping: Record<string, string> = {
      'steam.apiKey': 'apiKey',
      'steam.steamId': 'steamId',
      'openrouter.apiKey': 'openRouterApiKey',
    };
    const mappedKey = mapping[key] ?? key;
    // Narrow acceptable keys for type safety
    if (mappedKey === 'steamId') setConfig({ steamId: value });
    else if (mappedKey === 'apiKey') setConfig({ apiKey: value });
    else if (mappedKey === 'openRouterApiKey') setConfig({ openRouterApiKey: value });
    else setConfig({ steamId: value });
    return <Text>Configuration saved.</Text>;
  }

  if (key && !value) {
    const cfg = getConfig();
    const mapping: Record<string, string> = {
      'steam.apiKey': 'apiKey',
      'steam.steamId': 'steamId',
      'openrouter.apiKey': 'openRouterApiKey',
    };
    const mappedKey = mapping[key] ?? key;
    const current =
      mappedKey === 'steamId'
        ? cfg.steamId
        : mappedKey === 'apiKey'
          ? cfg.apiKey
          : mappedKey === 'openRouterApiKey'
            ? cfg.openRouterApiKey
            : undefined;
    return <Text>{String(current ?? '')}</Text>;
  }

  return <Text>Usage: nesta config &lt;key&gt; [value]</Text>;
}

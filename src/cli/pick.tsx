// Return plain strings for testability and keep side effects inside effect
import { Text } from 'ink';
import { useEffect, useState } from 'react';
import { Achievement } from '../models/achievement';
import { getConfig } from '../services/config';
import { generateExplanation } from '../services/explain';
import { listAchievements, pickAchievement } from '../services/picker';

/**
 * Component for the `nesta pick` command.
 * Parses CLI flags and renders the next achievement suggestion or
 * an explanatory message when no suggestion can be made.
 */
export default function Pick() {
  const [achievement, setAchievement] = useState<Achievement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [browseList, setBrowseList] = useState<Achievement[] | null>(null);
  const [explainFlag, setExplainFlag] = useState<boolean>(false);

  useEffect(() => {
    const args = process.argv.slice(3);
    let gameName: string | undefined;
    let random = false;
    let explain = false;
    let browse = false;
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if ((a === '--game' || a === '-g') && i + 1 < args.length) {
        gameName = args[i + 1];
        i++;
      } else if (a === '--random') {
        random = true;
      } else if (a === '--explain') {
        explain = true;
      } else if (a === '--browse') {
        browse = true;
      }
    }

    function getSafeConfig(): { steamId: string; apiKey?: string | null } {
      try {
        const c = getConfig();
        return c || { steamId: '', apiKey: null };
      } catch {
        return { steamId: '', apiKey: null };
      }
    }

    if (browse) {
      Promise.resolve(listAchievements({ gameName }))
        .then((achievements) => {
          if (achievements.length === 0) {
            setAchievement(null);
            const { steamId, apiKey } = getSafeConfig();
            const hasSteamId = Boolean(steamId);
            const hasApiKey = Boolean(apiKey);
            const msg =
              hasSteamId && !hasApiKey
                ? 'No achievements found (using Playwright; no Steam API key). Consider setting one: nesta config steam.apiKey <key>\nTry --game "Name" to filter.'
                : 'No suitable achievement found. Try --game "Name".';
            setError(msg);
            return;
          }
          setBrowseList(achievements);
        })
        .catch((e) => setError(String(e)));
      return;
    }

    Promise.resolve(pickAchievement({ gameName, random }))
      .then(async (a) => {
        if (!a) {
          const { steamId, apiKey } = getSafeConfig();
          const hasSteamId = Boolean(steamId);
          const hasApiKey = Boolean(apiKey);
          const msg = !hasSteamId
            ? 'SteamID is not configured. Set it with: nesta config steam.steamId <id>\nRequired: set Steam API key with: nesta config steam.apiKey <key>'
            : hasSteamId && !hasApiKey
              ? 'No suitable achievement found (using Playwright; no Steam API key). Set an API key for better coverage: nesta config steam.apiKey <key>\nOr try --random or --game "Name".'
              : 'No suitable achievement found from Steam API. Try --random or --game "Name".';
          setError(msg);
          return;
        }
        setAchievement(a);
        if (explain) {
          const why = await generateExplanation(a);
          setExplanation(why);
        }
      })
      .catch((e) => setError(String(e)));
    setExplainFlag(explain);
  }, []);

  // Auto-exit in terminal states
  useEffect(() => {
    const hasTerminalError = Boolean(error);
    const hasBrowseOutput = Array.isArray(browseList);
    const hasAchievementReady = Boolean(achievement) && (!explainFlag || explanation !== null);
    const shouldAutoExit = process.env.NESTA_AUTO_EXIT === '1';
    if (!shouldAutoExit) return;
    if (hasTerminalError) {
      try {
        process.exit(1);
      } catch {
        /* ignore */
      }
    } else if (hasBrowseOutput || hasAchievementReady) {
      try {
        process.exit(0);
      } catch {
        /* ignore */
      }
    }
  }, [error, browseList, achievement, explanation, explainFlag]);

  if (error) {
    return <Text color="red">{error}</Text>;
  }

  if (!achievement && !error && !browseList) {
    return <Text>Picking an achievement...</Text>;
  }

  if (!achievement && !browseList) {
    return <Text>No suitable achievement found. Try --random or --game &quot;Name&quot;.</Text>;
  }

  if (browseList) {
    return <Text>{browseList.map((a) => a.displayName).join('\n')}</Text>;
  }

  if (explanation) {
    return (
      <Text>
        Your next achievement is: {achievement?.displayName}
        {'\n'}Why: {explanation}
      </Text>
    );
  }

  return <Text>Your next achievement is: {achievement?.displayName}</Text>;
}

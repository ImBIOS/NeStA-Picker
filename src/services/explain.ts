import { Achievement } from '../models/achievement';

/**
 * Generates an explanation for why an achievement was picked.
 * Placeholder heuristic; can be replaced with OpenRouter-backed LLM later.
 */
export async function generateExplanation(achievement: Achievement): Promise<string> {
  // Heuristic: prefer unachieved, short name implies early-game tutorial achievement.
  if (!achievement.achieved && achievement.displayName.length <= 12) {
    return 'Likely quick to attempt and builds early momentum.';
  }
  return 'Because it is quick to attempt.';
}

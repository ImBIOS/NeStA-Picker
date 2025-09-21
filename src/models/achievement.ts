/**
 * Represents a Steam achievement.
 */
export interface Achievement {
  apiName: string;
  gameAppId: number;
  displayName: string;
  description: string;
  achieved: boolean;
  unlockedAt?: Date;
}

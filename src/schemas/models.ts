import * as S from 'sury';

export const UserSchema = S.schema({
  steamId: S.string,
  apiKey: S.optional(S.string),
  openRouterApiKey: S.optional(S.string),
});

export const UserUpdateSchema = S.schema({
  steamId: S.optional(S.string),
  apiKey: S.optional(S.string),
  openRouterApiKey: S.optional(S.string),
});

export const GameSchema = S.schema({
  appId: S.number,
  name: S.string,
});

export const AchievementSchema = S.schema({
  apiName: S.string,
  gameAppId: S.number,
  displayName: S.string,
  description: S.string,
  achieved: S.boolean,
  unlockedAt: S.optional(S.instance(Date)),
});

export const PickHistorySchema = S.schema({
  id: S.number,
  achievementApiName: S.string,
  pickedAt: S.instance(Date),
});

export type UserOutput = S.Infer<typeof UserSchema>;
export type GameOutput = S.Infer<typeof GameSchema>;
export type AchievementOutput = S.Infer<typeof AchievementSchema>;
export type PickHistoryOutput = S.Infer<typeof PickHistorySchema>;

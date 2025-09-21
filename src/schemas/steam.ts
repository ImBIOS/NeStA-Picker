import * as S from 'sury';

// ISteamUser/ResolveVanityURL
export const ResolveVanityUrlSchema = S.schema({
  response: S.optional(
    S.schema({
      success: S.optional(S.number),
      steamid: S.optional(S.string),
    }),
  ),
});

// IPlayerService/GetOwnedGames
export const SteamGamesResponseSchema = S.schema({
  response: S.optional(
    S.schema({
      games: S.optional(
        S.array(
          S.schema({
            appid: S.number,
            name: S.optional(S.string),
          }),
        ),
      ),
    }),
  ),
});

// ISteamUserStats/GetSchemaForGame
export const GameSchemaForGameSchema = S.schema({
  game: S.optional(
    S.schema({
      availableGameStats: S.optional(
        S.schema({
          achievements: S.optional(
            S.array(
              S.schema({
                name: S.string,
                displayName: S.optional(S.string),
                description: S.optional(S.string),
              }),
            ),
          ),
        }),
      ),
    }),
  ),
});

// ISteamUserStats/GetPlayerAchievements
export const PlayerAchievementsSchema = S.schema({
  playerstats: S.optional(
    S.schema({
      achievements: S.optional(
        S.array(
          S.schema({
            apiname: S.string,
            achieved: S.number,
            unlocktime: S.optional(S.number),
          }),
        ),
      ),
      error: S.optional(S.string),
      success: S.optional(S.boolean),
    }),
  ),
});

// ISteamUserStats/GetUserStatsForGame
export const UserStatsForGameSchema = S.schema({
  playerstats: S.optional(
    S.schema({
      achievements: S.optional(
        S.array(
          S.schema({
            name: S.string,
            achieved: S.number,
            unlocktime: S.optional(S.number),
          }),
        ),
      ),
    }),
  ),
});

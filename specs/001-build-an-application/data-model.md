# Data Model

## Entities

### User

- **steamId**: `string` (Primary Key) - The user's unique Steam ID.
- **apiKey**: `string` (Optional) - The user's Steam Web API key.
- **openRouterApiKey**: `string` (Optional) - The user's OpenRouter.ai API key.

### Game

- **appId**: `number` (Primary Key) - The game's unique Steam App ID.
- **name**: `string` - The name of the game.

### Achievement

- **apiName**: `string` (Primary Key) - The internal API name of the achievement.
- **gameAppId**: `number` (Foreign Key to Game) - The App ID of the game this achievement belongs to.
- **displayName**: `string` - The public-facing name of the achievement.
- **description**: `string` - The description of the achievement.
- **achieved**: `boolean` - Whether the user has unlocked the achievement.
- **unlockedAt**: `Date` (Optional) - The date the achievement was unlocked.

### PickHistory

- **id**: `number` (Primary Key, Auto-incrementing)
- **achievementApiName**: `string` (Foreign Key to Achievement)
- **pickedAt**: `Date` - The date the achievement was picked.

## Relationships

- A `User` can have many `Game`s.
- A `Game` can have many `Achievement`s.
- A `User` can have many `PickHistory` entries.

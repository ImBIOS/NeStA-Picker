# CLI Contracts

## Commands

### `nesta pick`

Suggests the next achievement to attempt.

- **Usage**: `nesta pick [options]`
- **Options**:
  - `--game <name>`: Filter by game name.
  - `--random`: Pick an achievement at random.
  - `--explain`: Explain why this achievement was picked (requires OpenRouter.ai API key).
  - `--browse`: Browse all achievements instead of picking one.

### `nesta history`

Shows the history of picked achievements.

- **Usage**: `nesta history`

### `nesta config`

Configure the application.

- **Usage**: `nesta config <key> [value]`
- **Keys**:
  - `steam.apiKey`: Your Steam Web API key.
  - `steam.steamId`: Your Steam ID.
  - `openrouter.apiKey`: Your OpenRouter.ai API key.

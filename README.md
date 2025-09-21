# NeStA-Picker — Pick your next Steam achievement fast (CLI)

NeStA-Picker is a fast, zero-fuss CLI that suggests the next Steam achievement to tackle from your library. It reads your owned games and achievement progress via the Steam Web API (or a Playwright fallback), then records your picks so you can keep momentum.

- **Quick suggestion**: one command to pick the next unachieved target
- **Filters by game**: focus on a specific title with `--game`
- **Randomizer**: add variety with `--random`
- **History**: see your last 50 picks
- **Explainer**: short why-this pick message (stubbed, LLM-ready)

## Demo

```bash
# Using pnpx (no installation required)
alias nesta='pnpx https://github.com/ImBIOS/NeStA-Picker'
nesta pick --game "Hades"      # Suggest next achievement for Hades
nesta pick --random             # Suggest a random achievement from your library
nesta history                   # Show last 50 picks
nesta config steam.steamId 7656119...
nesta config steam.apiKey sk-...
```

Note: use `pnpm dlx` if you prefer pnpm.

## Install

Local clone and run:

```bash
pnpm install
pnpm start -- pick --help
```

Or execute via tsx directly (dev):

```bash
pnpm exec tsx src/cli/index.ts pick --random
```

## Usage

```bash
nesta <command> [options]

Commands:
  pick [--game <name>] [--random] [--explain]  Suggest next achievement
  history                                      Show pick history
  config <key> [value]                         Get/Set configuration

Examples:
  nesta config steam.steamId 7656119...
  nesta config steam.apiKey sk-...
  nesta pick --game "Hades"
  nesta pick --random --explain
```

## Configuration

Required for Steam API path:

- `steam.steamId` — your 64-bit SteamID (e.g., 7656119...)
- `steam.apiKey` — Steam Web API key from the Steam developer portal

Optional:

- `openrouter.apiKey` — reserved for future explanation improvements (LLM)

If `steam.apiKey` is not set, NeStA-Picker uses a deterministic Playwright fallback that returns empty results (placeholder). Provide an API key for real data.

## How it works

- Fetch owned games and achievements via Steam API
- Pick the next target (first unachieved by default, random when `--random`)
- Persist pick history in a local SQLite database
- Print a short explanation (heuristic now; pluggable for LLM)

## Commands

- `pick` — Suggests the next achievement. Supports:
  - `--game <name>`: filter by title substring
  - `--random`: randomize game/achievement choice
  - `--explain`: display a short explanation
- `history` — Shows the last 50 picks with timestamps
- `config` — Get/Set config values

## Development

```bash
pnpm install
pnpm exec tsc -p tsconfig.json --noEmit       # type-check
pnpm exec eslint . --fix                      # lint
pnpm exec prettier --write .                  # format
pnpm test                                     # vitest
```

## Performance & constraints

- I/O-bound calls are minimized with batched queries and simple maps
- Streaming/parsing is minimal; SQLite writes are transactional
- Time complexity per pick is dominated by Steam API calls and linear filters

## Roadmap

- [ ] Web UI
- [ ] Real Playwright scraping fallback
- [ ] Smarter heuristics and LLM explanations
- [ ] Scoring based on difficulty/rarity/estimated time
- [ ] Export/share history

## License

See [LICENSE](LICENSE) file.

## Keywords

steam achievement picker, steam cli, choose next steam achievement, backlog tool, gaming productivity, ink cli, node cli, typescript cli, steam api achievements, pick next achievement, completionist

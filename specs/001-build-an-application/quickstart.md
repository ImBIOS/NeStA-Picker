# Quickstart

This guide will walk you through the basic usage of the NeStA-Picker CLI.

## Prerequisites

- Node.js and pnpm installed.
- A Steam account.

## Installation

```bash
pnpx YOUR_GITHUB_REPO
```

## Configuration

Before you can use the tool, you need to configure your Steam ID. You can also provide a Steam Web API key for better performance.

```bash
nesta config steam.steamId YOUR_STEAM_ID
nesta config steam.apiKey YOUR_API_KEY
```

If you want to use the explanation feature, you also need to configure your OpenRouter.ai API key:

```bash
nesta config openrouter.apiKey YOUR_OPENROUTER_API_KEY
```

## Usage

### Pick an Achievement

To get a suggestion for the next achievement to attempt, simply run:

```bash
nesta pick
```

### Pick a Random Achievement

```bash
nesta pick --random
```

### Get an Explanation

```bash
nesta pick --explain
```

### Browse Achievements

```bash
nesta pick --browse
```

### View History

To see the achievements you've picked in the past:

```bash
nesta history
```

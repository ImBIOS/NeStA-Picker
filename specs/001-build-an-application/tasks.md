# Tasks for NeStA-Picker

This file outlines the tasks required to implement the NeStA-Picker CLI.

## Task List

### Phase 1: Setup

- **T001**: [X] Initialize a new TypeScript project with `pnpm init`.
  - **File**: `package.json`
- **T002**: [X] Install core dependencies: `ink`, `kleur`, `playwright`.
  - **File**: `package.json`
- **T003**: [X] Install SQLite dependency `better-sqlite3` and its TypeScript types `@types/better-sqlite3`.
  - **File**: `package.json`
- **T004**: [X] Install development dependencies: `typescript`, `@types/node`, `vitest`.
  - **File**: `package.json`
- **T005**: [X] Configure `tsconfig.json` for the project.
  - **File**: `tsconfig.json`
- **T006**: [X] Set up project structure with `src` and `tests` directories.
  - **Files**: `src/`, `tests/`
- **T007**: [X] Configure ESLint and Prettier for code quality.
  - **Files**: `eslint.config.js`, `.prettierrc.js`

### Phase 2: Tests [P]

- **T008**: [X] [P] Create contract test for `nesta pick` command.
  - **File**: `tests/contract/pick.test.ts`
- **T009**: [X] [P] Create contract test for `nesta history` command.
  - **File**: `tests/contract/history.test.ts`
- **T010**: [X] [P] Create contract test for `nesta config` command.
  - **File**: `tests/contract/config.test.ts`
- **T011**: [X] [P] Create integration test for the main user story.
  - **File**: `tests/integration/happy-path.test.ts`

### Phase 3: Core Implementation

- **T012**: [X] [P] Create data model for `User`.
  - **File**: `src/models/user.ts`
- **T013**: [X] [P] Create data model for `Game`.
  - **File**: `src/models/game.ts`
- **T014**: [X] [P] Create data model for `Achievement`.
  - **File**: `src/models/achievement.ts`
- **T015**: [X] [P] Create data model for `PickHistory`.
  - **File**: `src/models/history.ts`
- **T016**: [X] Implement database initialization and schema migration.
  - **File**: `src/lib/db.ts`
  - **Depends on**: T012, T013, T014, T015
- **T017**: [X] Implement Steam API service to fetch games and achievements.
  - **File**: `src/services/steam.ts`
- **T018**: [X] Implement Playwright scraping service as a fallback.
  - **File**: `src/services/playwright.ts`
- **T019**: [X] Implement achievement picker logic.
  - **File**: `src/services/picker.ts`
  - **Depends on**: T017, T018
- **T020**: [X] Implement configuration service to manage user settings.
  - **File**: `src/services/config.ts`
- **T021**: [X] Implement the `nesta pick` command.
  - **File**: `src/cli/pick.tsx`
  - **Depends on**: T019, T020
  - **Includes**: `--game`, `--random`, `--explain`, `--browse`
- **T022**: [X] Implement the `nesta history` command.
  - **File**: `src/cli/history.tsx`
  - **Depends on**: T016
- **T023**: [X] Implement the `nesta config` command.
  - **File**: `src/cli/config.tsx`
  - **Depends on**: T020
- **T024**: [X] Implement the main CLI entrypoint.
  - **File**: `src/cli/index.ts`
  - **Depends on**: T021, T022, T023

### Phase 4: Integration

- **T025**: [X] Integrate the database service with the models.
  - **Files**: `src/models/*.ts`, `src/lib/db.ts`
- **T026**: [X] Integrate the Steam/Playwright services with the achievement picker.
  - **File**: `src/services/picker.ts`
- **T027**: [X] Integrate the picker service with the `nesta pick` command.
  - **File**: `src/cli/pick.tsx`
- **T028**: [X] Integrate the configuration service with all commands.
  - **Files**: `src/cli/*.tsx`

### Phase 5: Polish [P]

- **T029**: [X] [P] Write unit tests for all services and models.
  - **Files**: `tests/unit/*.test.ts`
- **T030**: [X] [P] Add comprehensive documentation to all functions and classes.
  - **Files**: `src/**/*.ts`, `src/**/*.tsx`
- **T031**: [X] [P] Refine the CLI output for a better user experience.
  - **Files**: `src/cli/*.tsx`
- **T032**: [X] [P] Run type-check, lint, and format checks and fix all errors.

## Parallel Execution

The following tasks can be executed in parallel:

```bash
# Phase 2
/gemini/execute T008 &
/gemini/execute T009 &
/gemini/execute T010 &
/gemini/execute T011 &

# Phase 3 (Models)
/gemini/execute T012 &
/gemini/execute T013 &
/gemini/execute T014 &
/gemini/execute T015 &

# Phase 5
/gemini/execute T029 &
/gemini/execute T030 &
/gemini/execute T031 &
```

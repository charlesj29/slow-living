# CLAUDE.md

**At session start, read `docs/PROGRESS.md`** (status + exact next step), then report where the
project stands and wait for the user's go. The full spec is `PROJECT_BRIEF.md`.

## Project

A games website (React + TypeScript + Three.js via React Three Fiber). Games live under
`/games/...`. First game: **Island**, a seeded, procedurally generated 2D top-down world
(pixel art, 16×16 tiles, orthographic camera).

## Working agreement

- One milestone at a time (M0–M4 in `docs/PROGRESS.md`). Show a short plan and wait for OK
  before coding a milestone.
- Finishing a milestone: `npm run check` passes → docs updated → one conventional commit on
  `master` (docs in the same commit) → short report → stop and wait. Don't push unless asked.
- Ask when a requirement is unclear or a trade-off is real; give a recommendation.
- Package manager: **npm**. New dependencies only if clearly worth it, each recorded in
  `docs/DECISIONS.md`.

## Commands

`npm run dev` · `npm run check` (typecheck + lint + test + build) · `npm run typecheck` ·
`npm run lint` · `npm test` · `npm run build` · `npm run format`

## Architecture rules (enforced by ESLint `no-restricted-imports`, see `eslint.config.js`)

- Layers: **app/pages → ui / render → core**. ui and render don't import each other.
- `src/games/*/core/**` and `src/shared/engine/**`: pure TS. No React, Three.js, R3F,
  react-router; no imports from render/assets/ui/app/pages or the zustand `state` file.
- `src/shared/**` never imports from `src/games/**`.
- app/pages import a game only via its public API (`@/games/<name>`), plus `@/games/catalog`.
- Game state lives in plain mutable objects updated by a fixed-timestep loop; zustand
  (`state.ts`) holds UI-facing state only. React must not re-render per frame.
- Tiles/objects are data-driven registries. Rendering asks the sprite atlas for sprites by key.
- Dispose Three.js geometries/materials/textures on unmount and on regenerate.
- `tests/layer-rules.test.ts` proves the layer rules fire; update it when rules change.

## Conventions

- TypeScript strict + `noUncheckedIndexedAccess`; no `any`. Named exports only (no default
  exports in `src/`). Explicit return types on exported functions (`JSX.Element` for components).
- Files small (~200 lines), one responsibility. Intent-revealing names. Comments explain _why_.
- No magic numbers: game tunables go in `src/games/<game>/core/config.ts`.
- Import alias `@/` → `src/`. Tests: `*.test.ts` next to the code (Vitest, node environment).
- Prettier: single quotes, semicolons, trailing commas, width 100, LF line endings.

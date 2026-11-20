# Decisions

Lightweight decision records. Newest at the bottom. Format: context → decision →
alternatives → consequences.

## D1 — Stack (from the project brief)

- **Context:** long-lived TS project, website shell plus 2D top-down games.
- **Decision:** Vite, React, TypeScript strict, three + @react-three/fiber + @react-three/drei,
  react-router, zustand, simplex-noise (from M1), Vitest, ESLint + Prettier.
- **Alternatives:** Phaser/PixiJS for 2D (rejected in the brief in favour of Three.js inside
  React); Redux (heavier than zustand).
- **Consequences:** versions at M0: Vite 8, React 19.3, react-router 8, three 0.187, R3F 9,
  drei 10, zustand 5, Vitest 5, ESLint 10. `RouterProvider` is imported from
  `react-router/dom` (v8 API).

## D2 — npm instead of pnpm

- **Context:** pnpm was not installed and Node 26 no longer bundles corepack.
- **Decision:** use npm (user's choice).
- **Alternatives:** `npm i -g pnpm`.
- **Consequences:** `package-lock.json` is committed; commands are `npm run <script>`.

## D3 — TypeScript pinned to ~6.0

- **Context:** TypeScript 7 is current, but typescript-eslint 8.73 supports `>=4.8.4 <6.1.0`.
- **Decision:** pin `typescript@~6.0.3`.
- **Alternatives:** TS 7 without typed lint support (unsupported, may break lint).
- **Consequences:** revisit when typescript-eslint supports TS 7.

## D4 — Layer rules with `no-restricted-imports` regex patterns, tested

- **Context:** core must never import render/ui/app; the brief requires lint enforcement.
- **Decision:** one `no-restricted-imports` block per folder glob in `eslint.config.js`, using
  regex patterns matched against the import specifier (covers `@/` aliases and relative
  paths). `tests/layer-rules.test.ts` lints virtual files through the ESLint Node API to prove
  the rules fire.
- **Alternatives:** `eslint-plugin-boundaries` / `eslint-plugin-import` (extra dependencies);
  a fixture file excluded from lint (manual to check).
- **Consequences:** blocks for the same rule must not overlap (later flat-config blocks
  replace earlier ones). New layer folders need a block + test cases.

## D5 — Non-type-checked lint presets

- **Context:** typed linting slows lint and complicates linting virtual files in tests.
- **Decision:** `tseslint.configs.strict` + `stylistic` (no type information).
- **Alternatives:** `strictTypeChecked` (catches floating promises etc., slower).
- **Consequences:** can be upgraded later if async code grows.

## D6 — Game metadata in `src/games/catalog.ts`

- **Context:** the games list page should not pull a game's code (and Three.js) into the main
  bundle just to show a card.
- **Decision:** a plain-data `GAME_CATALOG`. Pages may import it alongside each game's
  public `index.ts`. Game routes are lazy-loaded.
- **Alternatives:** export metadata from each game's `index.ts` (relies on tree-shaking to
  keep Three.js out of the main chunk).
- **Consequences:** adding a game = catalog entry + route + page wrapper.

## D7 — Chunk-size warning limit 1200 kB

- **Context:** the lazy island chunk is ~920 kB minified (~245 kB gzip), almost all three +
  R3F. Vite warns above 500 kB.
- **Decision:** raise `build.chunkSizeWarningLimit` to 1200 kB.
- **Alternatives:** manual vendor chunk for three (still >500 kB alone).
- **Consequences:** the warning will still catch accidental large growth.

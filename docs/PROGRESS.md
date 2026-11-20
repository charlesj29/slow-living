# Progress

## Current status

- **Milestone:** M0 — Foundation ✅ complete. Next: **M1 — World data & generation**.
- **What works:** Vite + React 19 + TS strict app; routes `/`, `/games`, `/games/island`
  (lazy-loaded, empty R3F canvas with an orthographic camera and sea-blue background) and a
  404 page; ESLint with enforced layer rules; Prettier; Vitest (18 tests); all docs created.
- **Exact next step:** present the M1 plan to the user and wait for OK. Expected M1 scope:
  `shared/engine/random.ts` (mulberry32 + seed helpers), tile & object registries, `World`
  data structure, generation pipeline
  (`shapeIsland → assignTerrain → carveLake → placeCabin → scatterTrees → scatterFlowers →
chooseSpawn → validate`) with deterministic retry, tests (determinism, invariants over 50
  seeds, RNG stability), `?seed=` URL param, and a simple coloured-tile render of the map.
  Install `simplex-noise` at the start of M1.

## Milestones

- [x] **M0 — Foundation:** scaffold, ESLint layer rules, Prettier, Vitest, routing, empty
      canvas, docs
- [ ] **M1 — World data & generation:** seeded RNG, registries, world data, pipeline +
      validation, tests, coloured-tile render
- [ ] **M2 — Visuals:** procedural sprite atlas, chunked tilemap, sprites for trees/flowers/
      cabin, depth ordering, animated water, pixel-perfect ortho camera
- [ ] **M3 — Player:** input, 4-direction walk animation, movement + collision with sliding,
      spawn at door, camera follow with bounds
- [ ] **M4 — Polish & handover:** HUD, regenerate key, debug overlay, 60 FPS check, resource
      cleanup check, final docs + roadmap

## Session log

### 2026-11-20 — M0 Foundation

- **Done:** npm project with Vite 8, React 19.3, react-router 8 (data router, game route
  lazy-loaded), three 0.187 + R3F 9 + drei 10, zustand 5, Vitest 5, ESLint 10 (flat config,
  typescript-eslint strict + stylistic, react-hooks, react-refresh, prettier compat),
  Prettier. Layer rules via `no-restricted-imports` regex patterns, covered by
  `tests/layer-rules.test.ts`. `GAME_CATALOG` (`src/games/catalog.ts`) lists games as plain
  data. Zustand UI store stub (`src/games/island/state.ts`, unused until M1/M4).
  `ISLAND_CONFIG` placeholder. `clamp` util + test in `shared/engine`.
- **Decisions:** npm instead of pnpm; TypeScript pinned to `~6.0` (typescript-eslint
  supports `<6.1`); commit milestones straight to `master`; game metadata in a separate
  catalog; chunk-size warning limit raised to 1200 kB. See `docs/DECISIONS.md`.
- **Verified:** typecheck, lint, test, build, format:check pass (no build warnings). Headless
  Chrome against the dev server: `/`, `/games`, `/games/island`, `/nope` all render the
  expected content; island page mounts a three.js r187 canvas filling the game area in sea
  blue; console shows only Vite/React-DevTools info messages, no errors or warnings.
- **Known issues:** none. `@react-three/drei` is installed but not used yet (expected in M2).
  The GitHub remote has both `main` and `master` branches; local work is on `master`.
- **Gotcha:** the original `README.md` was UTF-16; it is now UTF-8. Keep all text files UTF-8
  (Prettier mangles UTF-16). Headless Chrome with `--virtual-time-budget` freezes R3F's
  debounced resize, so screenshots taken that way show a wrongly sized canvas; use
  `--timeout` instead.

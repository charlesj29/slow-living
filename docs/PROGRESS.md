# Progress

## Current status

- **Milestone:** M1 — World data & generation ✅ complete. Next: **M2 — Visuals**.
- **What works:** seeded island generation (`?seed=1234`, word seeds like `?seed=palm`, or a
  random seed shown top-left). Island with natural coastline, deep-sea borders, shallow sea,
  sand beach, grass; one inland lake with shallows and a sand shore; clustered forests (oak
  and pine stands) plus lone trees; flower patches in four colours and grass tufts; a 3×3
  cabin on flat grass with a clear area in front of its door; spawn tile in front of the
  door. Pipeline validated with deterministic retries; a clear error panel if all attempts
  fail. Map drawn as a flat-colour preview (one texel per tile, magenta = spawn) with an
  orthographic camera that fits the whole map. 119 tests.
- **Exact next step:** present the M2 plan to the user and wait for OK. Expected M2 scope:
  procedural pixel-art sprite atlas in `games/island/assets/` (canvas → texture, sprites by
  key) with a reusable atlas interface in `shared/render/`; chunked tilemap (merged geometry
  per chunk with atlas UVs, or a tile-index shader — pick the simplest that hits 60 FPS and
  record it); instanced trees/flowers/tufts; cabin sprite; y-based depth ordering (tree tops
  drawn over things behind them); animated water (frames or shimmer); pixel-perfect
  orthographic camera (integer zoom, snapped position). The M1 `WorldColorMap` and
  `FitMapCamera` get replaced; until M3 adds the follow camera, M2 needs a temporary way to
  look around (e.g. dev-only pan/zoom) — propose this in the plan.

## Milestones

- [x] **M0 — Foundation:** scaffold, ESLint layer rules, Prettier, Vitest, routing, empty
      canvas, docs
- [x] **M1 — World data & generation:** seeded RNG, registries, world data, pipeline +
      validation, tests, coloured-tile render
- [ ] **M2 — Visuals:** procedural sprite atlas, chunked tilemap, sprites for trees/flowers/
      cabin, depth ordering, animated water, pixel-perfect ortho camera
- [ ] **M3 — Player:** input, 4-direction walk animation, movement + collision with sliding,
      spawn at door, camera follow with bounds
- [ ] **M4 — Polish & handover:** HUD, regenerate key, debug overlay, 60 FPS check, resource
      cleanup check, final docs + roadmap

## Session log

### 2026-11-20 — M1 World data & generation

- **Done:**
  - `shared/engine`: `random.ts` (mulberry32 with uint32 state, `createRng`, `deriveSeed`,
    `hashString`, `parseSeed`, `createRandomSeed`), `noise.ts` (seeded fractal simplex noise
    normalised to 0..1), `grid.ts` (index helpers, flood fill, region labelling, multi-source
    distance field with 4- or 8-way neighbourhoods).
  - `games/island/core`: full `IslandConfig`; tile registry (`tiles.ts`, 6 tiles, lake water
    distinct from sea); object registry (`objects.ts`, 2 trees, 4 flowers, grass tuft, cabin
    with door); `World` type; `computeBlockedMask` / `isTileBlocked` collision helpers.
  - Generation: `context.ts` (immutable context, per-step RNG streams), one file per step in
    `generation/steps/`, `validate.ts` (6 checks with issue codes), `pipeline.ts`,
    `generateWorld.ts` (retries with `deriveSeed(seed, 'retry-N')`, typed result).
  - Render/UI: `WorldColorMap` + `worldColorTexture` (DataTexture, nearest filtering,
    disposed on change/unmount), `FitMapCamera` (drei `OrthographicCamera`), `SeedLabel`,
    `GenerationErrorPanel`. Page reads `?seed=` and passes `seed` to `<IslandGame>`.
  - Router: `HydrateFallback` (`RouteLoadingPage`) on the root route.
  - `scripts/browser-check.mjs`: dependency-free headless-Chrome (DevTools protocol) check
    that waits for the canvas in real time, saves a screenshot and prints all console output.
- **Decisions:** D8–D13 in `docs/DECISIONS.md` (simplex-noise, three pinned to 0.182, per-step
  RNG streams, world as flat typed arrays, validation design, M1 preview rendering).
- **Tuning (100 seeds):** 0 failures, ~1.0 attempts on average, ≤30 ms per world, land share
  27–35 %.
- **Verified:** typecheck, lint, 119 tests, build, format:check all pass. Browser (via
  `scripts/browser-check.mjs` against the dev server): `?seed=1234` renders the island in
  ~0.5 s and two loads give pixel-identical screenshots; `?seed=palm` and no-seed render
  different islands with the seed shown; console has only Vite debug + React DevTools info —
  no warnings or errors.
- **Known issues / notes:**
  - M0's browser check missed a react-router "No `HydrateFallback`" warning (output was
    truncated); fixed in M1.
  - three 0.183+ logs a `THREE.Clock` deprecation warning because R3F 9.8 still uses Clock;
    three is pinned to `^0.182.0` until R3F ships a fix (D9).
  - `state.ts` (zustand) is still unused: the seed currently flows as a prop. M4 (regenerate
    key, debug overlay) is the natural point to move seed/debug state into the store.
  - `tree_oak`/`tree_pine` footprints are 1 tile (the trunk). Taller tree sprites in M2 must
    keep collision on the trunk tile and draw the crown above it.

### 2026-11-20 — M0 Foundation

- **Done:** npm project with Vite 8, React 19.3, react-router 8 (data router, game route
  lazy-loaded), three + R3F 9 + drei 10, zustand 5, Vitest 5, ESLint 10 (flat config,
  typescript-eslint strict + stylistic, react-hooks, react-refresh, prettier compat),
  Prettier. Layer rules via `no-restricted-imports` regex patterns, covered by
  `tests/layer-rules.test.ts`. `GAME_CATALOG` (`src/games/catalog.ts`) lists games as plain
  data. Zustand UI store stub. `clamp` util + test in `shared/engine`.
- **Decisions:** npm instead of pnpm; TypeScript pinned to `~6.0` (typescript-eslint
  supports `<6.1`); commit milestones straight to `master`; game metadata in a separate
  catalog; chunk-size warning limit raised to 1200 kB. See `docs/DECISIONS.md`.
- **Verified:** typecheck, lint, test, build pass; all routes rendered in headless Chrome.
- **Gotchas:** keep all text files UTF-8 (the original `README.md` was UTF-16 and Prettier
  mangled it). For browser checks use `scripts/browser-check.mjs`: Chrome's
  `--virtual-time-budget` freezes R3F's debounced resize, and `--timeout` screenshots can
  fire before a lazy route has loaded.

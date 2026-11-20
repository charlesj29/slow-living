# Progress

## Current status

- **Milestone:** M1.5 — Fixed world ✅ complete. Next: **M2 — Visuals** (plan already approved
  by the user on 2026-11-20, including smooth shorelines / autotiling).
- **What works:** opening the site (`/`) shows a full-screen loading screen, then the island,
  full screen, with a small "Games" menu. The island is the same on every visit: it is loaded
  from the committed, baked map file `src/games/island/data/island.map.json` (192×192, seed
  1, chunked, human-readable). It has a natural coastline, a forested peninsula, one lake with
  shallows, sand shore and a wooden dock, a cabin beside the lake, dirt trails from the cabin
  door to the dock and to two beaches, rocks, clustered forests, flower patches and grass
  tufts. `/games` lists the game; `/games/island` redirects to `/`. Dev only: `/?seed=N`
  previews a generated island (badge "Dev preview · seed N"). Still drawn as the flat-colour
  preview. 142 tests.
- **Exact next step:** start M2 (no new plan approval needed; user said "fix this first then
  continue for M2"). Approved M2 plan: procedural pixel-art sprite atlas (sprites painted into
  pixel buffers, packed into one texture, looked up by key; pure packing/lookup in
  `shared/render`), placeholder art 16×16 with tile variants and 3 water frames, trees 16×32
  with collision on the trunk tile, flowers/tufts/rocks/cabin/dock/path sprites; chunked
  tilemap (32×32-tile chunks, merged geometry, atlas UVs); animated water via a time uniform;
  instanced meshes per object sprite; depth from the sprite's base row (depth buffer, no
  sorting); autotiled shorelines (sand↔water, grass↔sand, path edges); pixel-perfect camera
  (integer zoom, snapped position) plus a temporary dev-only pan/zoom (arrows, +/−) until
  M3's follow camera. Tests for packing, lookup, chunk geometry, depth, autotile rules.

## Milestones

- [x] **M0 — Foundation:** scaffold, ESLint layer rules, Prettier, Vitest, routing, empty
      canvas, docs
- [x] **M1 — World data & generation:** seeded RNG, registries, world data, pipeline +
      validation, tests, coloured-tile render
- [x] **M1.5 — Fixed world (user request):** site opens into the world; world loaded from a
      baked, chunked map file; 192×192; trails, dock, rocks; seed tools dev-only
- [ ] **M2 — Visuals:** procedural sprite atlas, chunked tilemap, autotiled shorelines,
      sprites for trees/flowers/rocks/cabin/dock, depth ordering, animated water, pixel-perfect
      ortho camera
- [ ] **M3 — Player:** input, 4-direction walk animation, movement + collision with sliding,
      spawn at door, camera follow with bounds
- [ ] **M4 — Polish & handover:** HUD (controls hint), debug overlay (F3), dev regenerate key
      (R → new dev-preview seed), 60 FPS check, resource cleanup check, final docs + roadmap

## User decisions that override PROJECT_BRIEF.md (2026-11-20)

- The site opens straight into the world at `/` (brief: `/` home, `/games/island` game).
- The world is fixed: always the same layout, loaded from a baked map file (brief: random seed
  unless `?seed=` given, seed shown in the HUD). `?seed=` and `R`-regenerate are dev-only
  authoring tools now.
- Map size 192×192 (brief: 128×128), designed to be pleasant to stroll; the map format must
  allow growing the world later.
- Features chosen by Claude (user delegated): trails, lake dock, rocks; smooth shorelines in
  M2. A stream was rejected because the brief requires the lake not to touch the sea.

## Session log

### 2026-11-20 — M1.5 Fixed world

- **Why:** after M1 the user asked for a consistent world that loads straight in from the
  site URL (no "pick a game → generate"), designed to be beautiful to stroll and ready to be
  expanded later. Answers: open straight into the world; bake into a map file; 192×192;
  features left to Claude.
- **Done:**
  - Registries: tiles `path` (`=`) and `dock` (`#`), a `mapChar` per tile; object `rock`.
  - `shared/engine/pathfinding.ts`: 4-connected A* with a binary heap (+ tests).
  - Generation: `placeDock`, `layPaths`, `scatterRocks` steps; `placeCabin` prefers sites
    near the lake; config retuned for 192×192 (bigger, more irregular lake).
    `validate.ts` → `validateMap(snapshot, rules)` usable on loaded maps; new checks
    `dock-missing`, `trail-unreachable`.
  - Map file: `core/world/mapFile.ts` (format v1, writer, line-per-row formatter),
    `parseMapFile.ts` (strict parser, `MapFileError`), `bakedIsland.ts` (loader),
    `generation/bakeIslandMap.ts` + `scripts/bake-island-map.mjs` (`npm run bake:island`,
    uses Vite's `runnerImport`). Baked seed 1 (picked from ~24 candidates by contact sheets).
  - App: `/` = `WorldPage` (full screen, `SiteMenu`), full-screen `RouteLoadingPage`,
    `IslandRedirectPage` for `/games/island`, `HomePage` removed, catalog points to `/`.
    `IslandGame` takes an optional `devSeed`; `loadWorld.ts` returns a displayable result;
    `WorldErrorPanel`, `DevSeedBadge` replace the old error panel / seed label.
- **Decisions:** D14–D17 in `docs/DECISIONS.md`.
- **Tuning (40 seeds at 192×192):** 0 failures, ~1.03 attempts, ≤80 ms per world.
- **Verified:** typecheck, lint, 142 tests, build, format:check pass. Browser
  (`scripts/browser-check.mjs`, dev server): `/` renders the baked island in ~0.5 s with
  pixel-identical screenshots across loads; `/games/island` redirects and shows the same
  island; `/?seed=11` shows the dev preview badge; `/games` renders the list; console clean
  (no warnings/errors).
- **Known issues / notes:**
  - The map JSON is bundled into the world chunk (~1.0 MB / 260 kB gzip total, under the
    1200 kB warning limit). The generator is bundled too (needed for dev previews; ~20 kB).
  - Re-baking overwrites hand edits to the map file.
  - `/games` → Island card navigates to `/` client-side; the world page has no "back" UI
    besides the Games menu (fine for now).

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

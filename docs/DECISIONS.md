# Decisions

Lightweight decision records. Newest at the bottom. Format: context → decision →
alternatives → consequences.

## D1 — Stack (from the project brief)

- **Context:** long-lived TS project, website shell plus 2D top-down games.
- **Decision:** Vite, React, TypeScript strict, three + @react-three/fiber + @react-three/drei,
  react-router, zustand, simplex-noise (from M1), Vitest, ESLint + Prettier.
- **Alternatives:** Phaser/PixiJS for 2D (rejected in the brief in favour of Three.js inside
  React); Redux (heavier than zustand).
- **Consequences:** versions at M0: Vite 8, React 19.3, react-router 8, three 0.187 (pinned to 0.182 in M1, see D9), R3F 9,
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
- **Consequences:** adding a game = catalog entry + route + page wrapper. (Since D15 the
  island itself lives at `/`.)

## D7 — Chunk-size warning limit 1200 kB

- **Context:** the lazy island chunk is ~920 kB minified (~245 kB gzip), almost all three +
  R3F. Vite warns above 500 kB.
- **Decision:** raise `build.chunkSizeWarningLimit` to 1200 kB.
- **Alternatives:** manual vendor chunk for three (still >500 kB alone).
- **Consequences:** the warning will still catch accidental large growth.

## D8 — `simplex-noise` for procedural generation

- **Context:** coastline, lake edge, forests and flower patches need smooth, seedable noise.
- **Decision:** `simplex-noise` 4 (listed in the brief's stack), seeded through our own
  mulberry32 RNG, wrapped in `shared/engine/noise.ts` (fractal octaves, normalised to 0..1).
- **Alternatives:** writing our own simplex/Perlin (more code to test, no benefit).
- **Consequences:** tiny, dependency-free, tree-shakeable. Only `noise.ts` imports it.

## D9 — three pinned to `^0.182.0`

- **Context:** three r183 deprecated `THREE.Clock` and logs a warning when one is created.
  `@react-three/fiber` 9.8.2 (latest stable) still creates a Clock, so every page load warned.
  The fix is only in R3F 10, which is alpha.
- **Decision:** pin `three` and `@types/three` to `^0.182.0` (which for 0.x means `<0.183`).
- **Alternatives:** accept the console warning (breaks "no console warnings"); R3F 10 alpha.
- **Consequences:** revisit when a stable R3F release stops using Clock.

## D10 — One RNG stream per generation step

- **Context:** with a single shared RNG, changing how many random numbers one step draws
  reshuffles every later step, so tuning trees would move the cabin.
- **Decision:** each step uses `createRng(deriveSeed(seed, stepName))`. Retries use
  `deriveSeed(seed, 'retry-N')`.
- **Alternatives:** one RNG threaded through the context.
- **Consequences:** steps can be tuned in isolation. Determinism still holds per seed.

## D11 — World as flat typed arrays plus an object list

- **Context:** 128×128 tiles; generation, validation (BFS) and rendering all scan the grid.
- **Decision:** `terrain: Uint8Array` (TileId), `occupancy: Int32Array`, `blocked: Uint8Array`,
  row-major, y down; objects as `{ id, kind, x, y }` records. Pipeline steps copy the arrays
  they change (pure steps, ~16 KB copies).
- **Alternatives:** 2D arrays of tile objects (more allocation, slower, harder to serialise).
- **Consequences:** fast and serialisable. Accessors handle `noUncheckedIndexedAccess` with
  `?? fallback`.

## D12 — Validation: independent checks with issue codes; spawn at the door

- **Context:** the brief requires invariants and deterministic retries.
- **Decision:** `validate.ts` runs small checks returning `{ code, message }`. The spawn is the
  tile in front of the door, so "door reachable" is trivially true. A stronger check is added:
  at least `minReachableShare` of walkable land must be reachable from the spawn, so the
  player is never boxed in by forest. Tests re-implement the invariants independently and
  also feed deliberately broken contexts to the validator.
- **Alternatives:** throwing on the first failure (less useful for tuning and error messages).
- **Consequences:** the error panel can list every failed rule; tuning showed 0 failures and
  ~1.0 attempts per seed over 100 seeds.

## D13 — M1 preview rendering: one DataTexture plane

- **Context:** M1 only needs to show the generated map; M2 brings real sprites.
- **Decision:** a single plane textured with a 128×128 `DataTexture` (one texel per tile,
  nearest filtering), colours from the registries' `mapColor`, magenta spawn marker, and a
  drei `OrthographicCamera` zoomed to fit. 1 world unit = 1 source pixel already, which M2's
  pixel-perfect camera builds on.
- **Alternatives:** one mesh per tile (16k meshes, far too slow); building the M2 tilemap now.
- **Consequences:** one draw call, trivially 60 FPS; replaced in M2. `mapColor` stays useful
  for a future minimap.

## D14 — The live world is a baked, chunked map file (user decision)

- **Context:** the user wants the same island on every visit, designed to be pleasant to
  stroll, and expandable later. A fixed seed generated at runtime would silently change the
  whole layout whenever generation code changes.
- **Decision:** the generator becomes an authoring tool. `npm run bake:island [-- seed]`
  writes `src/games/island/data/island.map.json`; the game only parses that file. Format v1:
  square chunks (32×32) with chunk coordinates, terrain rows as strings (one `mapChar` per
  tile), objects as `[kind, localX, localY]`, written one row/object per line. A strict
  parser reports precise errors; a test asserts the committed file passes every invariant.
- **Alternatives:** fixed seed at runtime (fragile); binary/base64 terrain (smaller, but not
  readable or diffable); Tiled editor format (needs an external tool now — possible later).
- **Consequences:** layout is stable and hand-editable; growing the world = adding chunks.
  Re-baking overwrites hand edits. The map JSON is bundled into the world chunk (fine at
  192×192; load chunks on demand if the world becomes much larger).

## D15 — The site opens straight into the world (user decision)

- **Context:** the user doesn't want "choose a game → generate"; visitors should land in the
  world.
- **Decision:** `/` is the full-screen world (lazy route with a full-screen loading screen as
  `HydrateFallback`), with a small floating `SiteMenu` (Games). `/games` stays inside the site
  layout for future games; `/games/island` redirects to `/` keeping the query string (a
  `<Navigate>` component — a loader-only route made react-router warn). `HomePage` removed.
  `?seed=` previews are honoured only when `import.meta.env.DEV`.
- **Alternatives:** home page with a Play button; world behind the home page text.
- **Consequences:** the island's catalog entry points to `/`.

## D16 — 192×192 map, authoring seed 1 (user decision + curation)

- **Context:** the user chose 192×192 (brief default 128×128).
- **Decision:** generator retuned for 192 (noise scales, edge band, bigger and more irregular
  lake, forest scales). Seed 1 picked from ~24 candidates rendered as contact sheets: cabin
  beside the lake, forested peninsula beyond it, sandy western bays, trails crossing north.
- **Consequences:** about 3–4 minutes to walk across at the planned speed.

## D17 — Stroll features: trails, dock, rocks; no stream

- **Context:** the user delegated which features make the island nicer to walk.
- **Decision:** dirt trails (A* with noise-perturbed costs from the cabin door to the dock
  and to the closest and farthest beaches; trails merge because existing trail is cheap;
  only grass becomes path so trails fade into sand), a 4-plank dock built from the shore
  into open lake water on the cabin's side, rock outcrops. Smooth shorelines (autotiling) are
  part of M2. New validation: a dock exists; every trail and dock tile is reachable.
- **Alternatives:** a stream from the lake to the sea — rejected, it breaks the brief's "lake
  does not touch the sea" invariant; a spring-fed stream into the lake looked unmotivated.
- **Consequences:** `shared/engine/pathfinding.ts` (A*) is available for NPCs later.

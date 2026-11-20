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

## D18 — Sprites painted into pixel buffers, one DataTexture atlas, exact colours

- **Context:** the brief asks for code-generated placeholder art behind an atlas interface
  that real sprite sheets can replace later.
- **Decision:** sprites are painted into a pure-TS `PixelCanvas` (no DOM canvas, so painting
  is unit-tested and deterministic), shelf-packed into one power-of-two image with a 1 px
  extruded border (no seams with nearest filtering), uploaded as a `DataTexture`. Rendering
  asks `atlas.frame(key)`; variants use `base.N` keys; animations are horizontal strips.
  The canvas uses R3F's `flat` + `linear` modes so palette colours reach the screen unchanged.
- **Alternatives:** HTML canvas 2D (DOM-only, not testable in Node); per-sprite textures
  (many texture binds, no batching); sRGB pipeline (colours shift slightly unless carefully
  managed).
- **Consequences:** swapping in PNG sheets = produce `SpriteSource`s from images with the same
  keys.

## D19 — Chunked tilemap geometry; water animated in the shader

- **Context:** 192×192 tiles with up to several layers each; must hit 60 FPS.
- **Decision:** one merged `BufferGeometry` per 32×32-tile chunk (36 meshes, frustum-culled),
  one quad per tile layer, a single `ShaderMaterial`. Animated tiles carry a per-vertex u
  stride; one `uFrame` uniform advances all water — no per-frame CPU work or buffer updates.
- **Alternatives:** one mesh per tile (far too many draw calls); a tile-index texture with a
  custom tile shader (fewer vertices but autotile layering gets complex); updating UVs on the
  CPU every frame.
- **Consequences:** ~240 FPS on GPU in headless Chrome. Every animated strip must have
  `WATER_FRAME_COUNT` frames (tested).

## D20 — Smooth shorelines with edge/corner overlays

- **Context:** square terrain edges look blocky; the user delegated "smooth shorelines".
- **Decision:** each tile has an `edgePriority` (grass 3 > sand/path 2 > shallow water 1 >
  deep water 0). A tile gets transparent overlays of each higher neighbour's material: an edge
  piece per touching side and a rounded corner piece for diagonal-only contact. Overlays are
  painted once facing north and rotated. Sand onto water gets a foam fringe, grass a darker
  rim, water-on-water a dither. The dock uses `underlay` (it behaves like lake shallows for
  edges and draws its planks on top).
- **Alternatives:** full 47-tile blob autotiling or marching-squares sets per material pair
  (much more art); dual-grid tiling.
- **Consequences:** adding a material that should spill = an `edgePriority` plus an entry in
  `EDGE_STYLES`. Inner corners are square (two edges overlapping) — acceptable.

## D21 — Objects: instanced meshes, depth from the sprite's base

- **Context:** ~4,000 objects; characters must pass behind tree crowns when above them.
- **Decision:** one `InstancedMesh` per sprite key (about a dozen draw calls), one shared
  `MeshBasicMaterial` with `alphaTest`. Standing sprites get `z = 1 + footYPx × 0.01`
  (`standingSpriteZ`), so the depth buffer orders them by where they touch the ground; flat
  decorations (flowers, tufts) sit at a fixed z under everything standing. No sorting needed.
- **Alternatives:** sorting transparent sprites every frame; render order by y.
- **Consequences:** the player (M3) just uses `standingSpriteZ(feet)`.

## D22 — Pixel-perfect camera: whole device pixels per source pixel

- **Context:** sprites must not blur or shimmer.
- **Decision:** `pixelScale = round(cssPixelScale × devicePixelRatio)` device pixels per world
  unit (zoom = pixelScale / dpr); camera position snapped to `1 / pixelScale` with a half
  device pixel shift when the drawing buffer has an odd size; view clamped to the map. Lives
  in `shared/render` (`pixelPerfect.ts`, `PixelPerfectCamera.tsx`) for other games.
- **Alternatives:** dpr = 1 with CSS `image-rendering: pixelated` (uneven pixels at
  fractional dpr); fractional zoom (blur).
- **Consequences:** zoom changes in whole steps (+/−).

## D23 — Temporary free-look camera in M2

- **Context:** M2 has no player yet, but the whole island must be viewable.
- **Decision:** `FreeLookCamera` (arrow keys/WASD pan, +/− zoom) starting at the spawn, with an
  on-screen hint. Keyboard handling lives in the render layer only because it is temporary.
- **Consequences:** M3 replaces it with core input + a follow camera and deletes
  `FreeLookCamera.tsx` and `ui/LookAroundHint.tsx`.

## D24 — Classic handheld-inspired art style, original and code-painted (user decision)

- **Context:** the user asked for more classic pixel art, using Pokémon Emerald as a style
  reference without plagiarism.
- **Decision:** keep painting every sprite in code, adopting only general traits of the era:
  bright saturated ramps (outline → dark → base → light → highlight), dark coloured outlines,
  clumpy top-left-lit foliage (`assets/foliage.ts`), patterned ground tiles, wave-glyph water.
  No tiles, sprites, palettes or layouts are traced or copied from any game.
- **Consequences:** the atlas keys are unchanged, so real sprite sheets can still replace the
  painted art later.

## D25 — Big trees, mixed forests, crowns kept off reserved tiles

- **Context:** the user wanted trees up to 4 tiles, and forests that are sometimes dense,
  sometimes loose.
- **Decision:** big trees have a 2×1 trunk footprint (blocks) and a 32×32 sprite whose top
  row is walk-behind crown. Dense canopy: big trees on a staggered 2-tile grid where forest
  noise exceeds `denseThreshold` and a low-frequency character noise exceeds
  `characterThreshold`; other forest is a loose big/small mix; meadows get rare trees and
  bushes. Tree crowns may not overhang reserved tiles (trails, cabin yard).
- **Consequences:** forests read as classic canopy walls in places and as groves elsewhere;
  trails and the fence are never hidden.

## D26 — Handheld-like automatic zoom

- **Context:** the user chose a closer, handheld-like view.
- **Decision:** `autoPixelScale(bufferWidth, bufferHeight)` picks the whole-number pixel scale
  that shows about `targetTilesAcross` (20) tiles, reduced if fewer than `minTilesTall` (11)
  rows would fit; +/− adds an offset. Still pixel-perfect (D22).
- **Consequences:** sprites look big and chunky on any screen; M3's follow camera reuses it.

## D27 — One sprite shader for tiles and objects; animated objects

- **Context:** flowers should sway; objects used a plain `MeshBasicMaterial`.
- **Decision:** `spriteMaterial.ts` (renamed from `tilemapMaterial.ts`) supports instancing;
  objects carry an `animStride` attribute like tiles. Tiles and objects use separate material
  instances so water (3 frames) and flowers (4 frames: rest, right, rest, left) keep their
  own timing.
- **Consequences:** any object can animate by being a strip with `FLOWER_FRAME_COUNT` frames.

## D28 — Cabin yard: fence and mailbox as objects

- **Context:** the user picked a fence and mailbox at the cabin.
- **Decision:** a `decorateCabin` step places `fence` objects around the cleared front yard
  (skipping trail tiles, so there is always a gate) and a `mailbox` beside the door. Fence
  sprites are chosen at render time from 16 connection pieces (`objectSpriteKeys.ts`).
- **Consequences:** fences elsewhere later just need `fence` objects; they connect
  automatically.

## D29 — Fixed 60 Hz logic with render interpolation

- **Context:** movement must be frame-rate independent (brief) and smooth on 60–144 Hz screens.
- **Decision:** `advanceClock` runs whole 1/60 s steps from an accumulator (max 5 per frame,
  backlog dropped after stalls, 1e-9 rounding tolerance); the player keeps its previous
  position and rendering interpolates with the leftover fraction.
- **Consequences:** identical results at 30/60/144 fps (tested); systems take `stepSeconds`.

## D30 — Input as ordered actions; 8-way movement, 4-way facing

- **Context:** WASD/arrows with 4-direction facing; sliding along walls needs diagonal input.
- **Decision:** `shared/engine/input.ts` maps key codes to actions and keeps press order; the
  island reads a `MovementIntent` (dx, dy, run, facing = most recently pressed direction).
  Diagonals are normalised to the same speed. Key listeners live in the render layer
  (`useKeyboardInput`); everything else is pure and tested.
- **Alternatives:** grid-locked tile-by-tile movement (classic, but the brief asks for smooth
  movement with sliding).
- **Consequences:** gamepad/touch can feed the same actions later.

## D31 — Collision: feet hitbox, axis-separated, corner nudging

- **Context:** tile collision with smooth movement and wall sliding; the 3/4 view means the
  body may overlap things behind it.
- **Decision:** a 10×6 px hitbox at the feet is tested against `world.blocked` (out of bounds
  = blocked). X then Y move separately; a blocked axis stops flush at the tile edge. When
  walking straight into an obstacle whose corner is within 5 px, the player is nudged
  sideways around it.
- **Consequences:** no snagging on tree edges; big-tree crowns stay walk-behind.

## D32 — Player art as character pixel maps

- **Context:** the character must match the user's choices and the classic style.
- **Decision:** 16×24 frames written as one-character-per-pixel maps with a small palette
  (`assets/playerPixels.ts`): front, back and side upper bodies, three leg poses each; left is
  the mirrored right. Painted into atlas strips `player_<direction>` (stand, left step, right
  step).
- **Consequences:** the character is easy to edit by hand; tests reject malformed maps.

## D33 — Smooth, pixel-perfect follow camera

- **Context:** the camera should follow smoothly yet keep sprites crisp.
- **Decision:** `FollowCamera` eases towards the player's interpolated position (aimed 8 px
  above the feet) with `approach` (frame-rate independent), then `PixelPerfectCamera` snaps and
  clamps. The player sprite is drawn at whole pixels.
- **Consequences:** replaces the temporary free-look camera (D23).

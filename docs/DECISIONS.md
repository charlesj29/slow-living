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

## D34 — Character redesign in a chibi handheld style (user request)

- **Context:** the user shared a classic handheld-RPG hero sprite sheet as the look they want.
- **Decision:** match the style, not the character: chibi proportions, wide overhanging visor,
  side hair tufts, 2-px eyes, thick outline, swinging arms, big backpack — in the user's own
  colours (orange cap/jacket, dark brown hair, brown backpack). Frames are composed from head,
  torso-with-arms and leg parts; symmetric views mirror the step frame.
- **Alternatives:** tracing the reference sprites (not acceptable: copying a game's character).
- **Consequences:** same 16×24 size, keys and walk cycle, so no code outside the pixel maps
  changed.

## D35 — Initial camera: three zoom steps out (user preference)

- **Context:** the user found the handheld-like default (D26) too close; their ideal view was
  the default after pressing "−" three times.
- **Decision:** keep the automatic framing and start with a zoom offset of
  `render.defaultZoomSteps = -3`. This reproduces exactly that view for the user's window,
  whatever its size. Offsets are clamped to the scale limits.
- **Alternatives:** a fixed "tiles across" target — it can't match "three steps out" on every
  window, because the old framing was sometimes height-limited.
- **Consequences:** on small windows the view may reach the minimum scale (1); +/− still work.

## D36 — No site chrome on the island (user decision)

- **Context:** the user wants the URL to "teleport" visitors straight into the game.
- **Decision:** remove the floating "Games" menu (it amended D15). `/` renders only the game
  (canvas + controls hint). `/games` and the catalog stay for future games, reachable by URL.
- **Consequences:** if more games are added, how visitors discover them needs a new decision
  (e.g. an in-game sign or a pause menu).

## D37 — Bigger 5×3 cabin, pinned with an authoring anchor (user request)

- **Context:** the user asked for a slightly bigger cabin (wider, same roof height, two
  windows) with the door still at the top of the trail.
- **Decision:** footprint 5×3 (sprite 80×64), door in the middle tile. `placeCabin` takes an
  optional `cabin.anchor` (authoring hint): pick the suitable site nearest it instead of a
  random one. Anchored at (113, 106) so the door front stays at (115, 109).
- **Alternatives:** re-bake without an anchor — the cabin moved 16 tiles and the dock and
  trails moved with it.
- **Consequences:** landmarks can be pinned while placement rules evolve. Scatter steps still
  use one random stream per step, so reserving different tiles reshuffles nearby rocks,
  trees and flowers (ROADMAP: per-tile hashing would keep them stable).

## D38 — M4 interface and site choices (user decisions)

- **Context:** M4 polish; the user answered a list of questions.
- **Decision:** the controls hint fades (CSS) once `hasStartedWalking` is set; no place name;
  tab title "chilling"; loading screen cycles "Cooking…" / "Doing its magic…"; the F3 overlay
  shows FPS and the player's tile in every build (sampled every 250 ms while open); R is a
  dev-only random preview; the `/games` page, site `Layout`, 404 page and games catalog are
  removed and every unknown address redirects to `/`; touch-first devices see "Best played
  with a keyboard" (pure CSS media query).
- **Alternatives:** the brief's dev-only overlay with collision tiles; keeping a hidden games
  list for future games.
- **Consequences:** zustand now holds two UI flags. Adding another game means re-adding a
  route and choosing how visitors discover it.

## D39 — Dev-only renderer hook for performance and cleanup checks

- **Context:** M4 asks for a 60 FPS check and a resource-cleanup check.
- **Decision:** in dev builds `GameCanvas` sets `window.__islandRenderer` (the WebGL
  renderer); `scripts/browser-check.mjs` reads `renderer.info` via `CHECK_EXPR`.
- **Consequences:** results (M4): 31–34 draw calls, ~26k triangles, 1 texture, 2 programs,
  memory flat across repeated island regenerations; ~240 FPS uncapped on GPU (headless). The
  hook is absent in production (verified).

## D40 — 4-way movement: the last pressed key wins (user decision)

- **Context:** with 8-way movement (D30), holding A+W walked diagonally; the user wants the
  classic feel of one active direction.
- **Decision:** `readMovementIntent` uses only the most recently pressed direction that is
  still held (`latestHeld`): one unit step, no diagonals; releasing it falls back to the
  previous held key; opposite keys don't cancel. Supersedes the 8-way part of D30.
- **Consequences:** wall sliding along diagonals no longer happens in play (the movement
  system still supports it); corner nudging (D31) keeps tight spots easy to walk through.

## D41 — Soft cast shadows as the one blended sprite layer

- **Context:** the visual overhaul reference grounds every object with translucent shadows;
  all sprites so far used hard alpha.
- **Decision:** semi-transparent `shadow_*` sprites drawn at `SHADOW_Z` with
  `createShadowMaterial` (transparent, depth write on, `LessDepth`). Overlapping shadows at
  the same depth reject each other, so they never double-darken; standing sprites (closer to
  the camera) hide shadows under them. Placement per object kind lives in
  `render/objectShadows.ts`.
- **Alternatives:** opaque darker-grass patches baked into sprites (wrong over sand/paths);
  a render-to-texture shadow pass (more machinery for the same look).
- **Consequences:** CLAUDE.md "hard alpha only" now names this exception.

## D42 — Grass patches dithered in the tilemap shader

- **Context:** large meadows looked tiled; a first attempt swapping whole tiles to a darker
  set produced hard square patches.
- **Decision:** a per-tile noise texture sampled with bilinear filtering, compared per art
  pixel against a 4×4 Bayer matrix, shades grass quads (flagged per vertex) by a constant
  factor. Patch edges are pixel-dithered and ignore tile borders.
- **Consequences:** grass pixels in patches are a multiplied tone of the palette colour;
  tunables in `render.grassPatches` (noise, threshold, shade, ditherSpread).

## D43 — Leaf-cluster crowns and a 3-tile-wide giant tree

- **Context:** the reference's trees have dense round crowns made of many small leaf
  clusters; ours were a few big clumps that looked flat.
- **Decision:** crowns are a jittered grid of small clusters plus a rim ring
  (`leafClusters`), lit at two scales (whole crown and each cluster from the top-left); a dark
  crease is drawn only under a cluster that sits behind another, so it reads as layered
  foliage instead of a pebble mosaic. New kind `tree_giant` (48×48 sprite on the same 2×1
  trunk footprint, `trees.giantShare` of the broadleaf big trees). Crown extents per kind
  (`CROWN_EXTENTS` in `scatterTrees`) keep crowns off reserved tiles (fence, trails, yard).
- **Consequences:** collision is unchanged (trunk row only); the giant crown is walk-behind.

## D44 — Reference-style 6×4 cottage (user decision)

- **Context:** the user asked for a bigger cottage in the reference style, door on the same
  trail tile.
- **Decision:** footprint 5×3 → 6×4, sprite 96×96: steep red tiled front gable with
  timber-framed plaster, a side wing with a lower roof and chimney, shuttered windows with
  flower boxes, a stone foundation and steps. The door is at footprint `{x: 2, y: 3}`;
  `cabin.anchor` moved to (113, 105) so the door still opens onto the same trail tile.
  The map was re-baked from the same seed (terrain, trails, dock and spawn unchanged).
- **Consequences:** the cottage blocks 24 tiles; its shadow is a dedicated `shadow_cabin`.

## D45 — Idle breathing as a fourth player frame

- **Context:** refine the explorer without redesigning it (user decision).
- **Decision:** a fourth frame per direction where the head sinks one pixel into the
  shoulders; standing still alternates it with the standing frame every
  `player.breathFrameSeconds` (0.7 s). Outlines softened to dark brown; the player gets a
  soft shadow like every other standing thing (D41).
- **Consequences:** `PLAYER_FRAME_COUNT = 4`; walking resets the idle timer.

## D46 — Rocky ledges as a terrain tile on south-facing sea coasts

- **Context:** the overhaul asked for rocky ledges where grass meets the beach, impassable,
  with beaches still reachable (user decision). No raised plateaus or stairs.
- **Decision:** a new tile `Cliff` (`^` in map files, not walkable, land). `placeLedges`
  runs after the trees (so forests aren't reshuffled) and turns noise-picked runs (≥ 2 tiles)
  of free coastal grass into ledges where the beach below is connected to the sea (never the
  lake shore), away from trails. Runs that would cut a beach off are dropped; validation adds
  `beach-cut-off`. Ledges rank with grass (priority 3) and have no edge art: each piece paints
  its own grass lip, a face of top-left-lit boulders (`paintClumps`, painted on a padded canvas
  so runs join without seams) and its shaded beach foot; ends round off against grass or sand
  (`cliffPieceKey`). `tileLayersAt` now treats a higher neighbour as spilling over only if it
  has edge art, so beach corners beside a ledge still round off.
- **Alternatives:** a ledge object over grass (the grass edge on the beach below would show a
  green rim under the rock); letting the grass edge drape over a lower-priority ledge (ate a
  third of the face's 16 px).
- **Consequences:** the face is one tile high; seed 1 has 43 ledge tiles.

## D47 — House props and woodland litter

- **Context:** the overhaul asked for props by the house and sparse stumps and fallen branches.
- **Decision:** `decorateCabin` places a fixed yard layout (bush, flower pot, barrel, sign,
  stepping stones, wood pile) relative to the cottage, only on free grass inside the reserved
  cabin area, so trails stay clear and no later step's random stream shifts.
  `scatterDeadwood` (after the trees) drops stumps (block, like rocks) and branches (flat,
  walkable, new `ground` category) on free grass with at least `deadwood.minNearbyTrees` trees
  within `deadwood.searchRadiusTiles`.
- **Consequences:** trees, rocks, fence, trails and spawn are identical to Phase 3 after the
  re-bake; only flowers/tufts (placed after the new steps) moved.

## D48 — Smooth player animation driven by distance walked

- **Context:** the user found the idle and walk/run animation sloppy: 3 walk poses on a timer
  (feet slid), running reused them, and breathing snapped the head down every 0.7 s.
- **Decision:** 19 frames per direction (stand, breath, blink, 8-frame walk, 8-frame run),
  composed in `assets/playerFrames.ts` from head/torso/leg parts with a 1 px body bob, new leg
  poses (lifted knee, run stride, tucked airborne pose) and pumping arms; side-view runs lean
  forward, and the airborne frames lift the whole figure a pixel above its shadow. The cycle
  advances with `player.strideDistance` (one cycle per 40 px walking, 60 px running), starting
  one frame in; pushing against an obstacle walks in place. Idle: a 2.6 s breath (the whole
  upper body sinks one pixel, proportions unchanged) and a blink every 3.7 s.
- **Consequences:** `walkFrameSeconds`/`runFrameSeconds`/`breathFrameSeconds` replaced by
  `walkCyclePx`, `runCyclePx`, `breathCycleSeconds`, `breathHoldSeconds`,
  `blinkEverySeconds`, `blinkSeconds`; `Player.animationTime` → `strideDistance`.

## D49 — Background music composed in code with Web Audio (user decision)

- **Context:** the user wanted looping chill music with no royalty or copyright issues and a
  mute button; chose "composed in code" over a CC0 recording, and the top-left corner.
- **Decision:** an original 16-bar lo-fi loop ("Island Breeze": C major, 72 BPM, swung
  eighths; electric-piano chords, bass, music-box melody, brushed drums, vinyl crackle) stored
  as data and synthesized live (`src/shared/audio`). A look-ahead scheduler on the audio clock
  keeps the loop seamless. It starts on the first key press or click (autoplay rules); the
  button and M toggle mute with a fade, the choice is kept in `localStorage`, and the audio
  clock is suspended while muted or while the tab is hidden.
- **Alternatives:** a CC0 audio file (richer sound, ~3–5 MB, a licence to track). No new
  dependency either way.
- **Consequences:** zero download size and no licensing; the sound is synth-like by design.
  The tune is verified by rendering it offline in Chrome (headless checks can't listen).

## D50 — Side-view legs drawn from foot positions

- **Context:** the user found the side walk/run sloppy, the run especially: its two leg shapes
  repeated in both halves of the cycle, so the legs didn't trade places and looked frozen.
- **Decision:** `assets/sideLegs.ts` draws each side frame from a near and a far foot (column and
  lift): 2 px trouser legs from hips a pixel apart, a shoe, automatic outlines, a seam where a
  far shoe meets the near leg. The walk goes contact → down → passing (knee up) → reach and then
  swaps legs; the run reaches further, kicks the back foot up, drives the knee and scissors in
  the air, with the hips set a pixel back so the body leans in. Arms swing against the near leg.
- **Follow-up (user feedback):** feet kicked too high, so every foot lifts at most one pixel
  (two put the shoe right under the waist); in the walk only the swinging foot lifts, as it passes.
- **Consequences:** the hand-drawn side stride/passing/run poses are gone (standing stays
  hand-drawn). Front and back views are unchanged.

## D51 — Lo-fi rebuild of the music, without stutter

- **Context:** the user heard the music as broken/stuttering and asked for full lo-fi with an
  infinite loop that joins beautifully. Causes found: random vinyl clicks read as glitches, a
  hard default compressor pumped on every hit, some notes stopped before their fade finished
  (pops), and the scheduler ran on a page timer that a busy frame can delay.
- **Decision:** a new 32-bar tune (user choice; F major, 75 BPM, swing 0.62, form A A B A′, jazzy
  ii–V chords and a minor iv; ~1:42) with a turnaround, rising pickup and drum fill in the last
  bar. Sound: warm electric piano with tape wobble, deep bass, mellow lead into a dotted-eighth
  echo, boom-bap drums with ghost notes, a muffled master (lowpass 4.2 kHz) with gentle glue
  compression and a soft tape hiss (user choice) instead of crackle. Engine: `musicGraph.ts`
  builds the mix on any context (so tests render the real sound offline), a Web Worker ticker
  with a 0.6 s look-ahead, envelopes that always end at zero, a 3 s fade-in on first start.
- **Consequences:** verified by rendering the whole loop plus the seam offline in Chrome: steady
  loudness (RMS 0.09–0.18 every second, the same across the seam), peak 0.61, no sample jump
  above 0.05 (no clicks). Supersedes the sound and tune parts of D49.

## D52 — Interaction with Space: facing reach, one-shot presses, a message box

- **Context:** the user wants interaction on E, starting with the mailbox ("it is empty"),
  later villagers; messages have no reply choices (user decision).
- **Decision:** interactions are data (`ObjectDefinition.interaction.message`). The target is
  whatever occupies the tile one reach past the feet hitbox in the facing direction, so you
  interact with what you look at. Input gains one-shot presses (`presses`, `consumePress`,
  `clearPresses` at the end of each step) so a tap counts once on the fixed step. An open
  dialog freezes the player; E closes it. The UI mirrors the message through zustand (set only
  on change); a floating "E" keycap sprite (`assets/paintUi.ts`) marks the target.
- **Follow-up (user feedback):** the key moved from E to Space; the floating keycap became a
  small bobbing down-arrow, and the dialog shows a blinking ▼ instead of a key name. The mute
  button drops focus after a click, so Space can't press it again.
- **Consequences:** villagers can reuse the same flow by providing a target and message.

## D53 — Day/night as one shared tint, window lights as hard-alpha overlays

- **Context:** the user asked for a day/night cycle with a button above the music button
  (chose: cycle Auto / Always day / Always night) and the F3 readout moved (chose bottom-left).
- **Decision:** the time of day lives in `GameState` and keeps running in every mode; lighting
  is a pure function of time and mode (long day and night, short warm dawn and dusk, smooth
  keyframes). Every world material multiplies by one shared `uTint` uniform, so relighting is a
  single per-frame write; mode changes ease in. Night windows are overlay sprites derived from
  each building's glass pixels, untinted and shown only while lights are on: they stay hard
  alpha (no blending), unlike a fading glow. The mode is remembered in `localStorage`. A full
  day is 12 real minutes; the game starts in the morning.
- **Consequences:** new buildings get window lights automatically (category `building`);
  materials take an optional `LightingUniforms` (daylight by default, e.g. in tests).

## D54 — A small village with wandering villagers

- **Context:** the user asked for a small village near the cottage: 3 houses in different simple
  styles and villagers (chose 3) who wander only inside the village and say "Hi" when talked to.
- **Decision:** the village is an authoring step (`placeVillage`) after the forests and ledges, at
  the first clear spot among offsets from the cottage (seed 1: the meadow north-west of it). It
  clears only its own patch, so the rest of the island stays as it was; its lane joins the nearest
  existing trail with a short new stretch. The layout lives in `core/world/village.ts` and is read
  back from the houses at runtime for the villagers' area and spawns, so the map format is
  unchanged. Houses: 4×3 footprints, 64×64 sprites (stone + slate roof + chimney, logs + moss
  roof, plaster + thatch), window lights included. Villagers are palette-swapped explorers that
  share player movement/animation; wandering uses A* inside the area, a seeded RNG and mutual
  blocking; talking freezes and turns the villager.
- **Alternatives:** placing the village before the trees (reshuffles every forest); storing a
  village record in the map file (format change for data the houses already imply).
- **Consequences:** re-bake changed 23 tiles (lane, door stubs, one joining tile) and removed 4
  rocks and 2 bushes; trees, trails, dock, spawn unchanged. Validation checks every house door.

## D55 — Fenced village around a green; villagers avoid each other

- **Context:** the user asked for a fence round the village with decorations, wider houses in a
  less linear layout, and villagers that no longer get stuck on each other (bumping into the
  player is fine). Choices: all decorations (well, haystacks, lamp posts, stumps, crates,
  barrels, flower pots, a vegetable patch), houses around a green, one gate to the trail,
  5-tile-wide houses.
- **Decision:** `VILLAGE_LAYOUT` is now a 20×15 fenced square: one house top-middle, two lower
  left and right, door paths to a lane that leaves through the gate onto the trail bend; props
  are listed in the layout and kept off every path. Houses are 5×3 (80×64, symmetric). New
  kinds: well (2×1), haystack, crate, lamp post (lit at night via the new `litAtNight` registry
  flag, which also drives building window lights), crops. The fenced interior is where
  villagers walk (worked out from the first house's position). Wandering separates _occupied_
  tiles (others' current and next tiles: never routed through) from _held goals_ (others'
  destinations: never picked), replans round a villager that blocks the way and only waits for
  the player. A head-on test checks two villagers pass each other.
- **Consequences:** the fenced interior must be clear grass (trail may only touch the margin).
  Re-bake: the village sits north-west of the cottage, the gate on the trail bend; 6 rocks, 3
  bushes and 1 small tree cleared in its patch; the rest of the island is unchanged.

## D56 — Random irregular village; three new villager characters

- **Context:** the user found the village always square with the gate on the left (on every
  seed), wanted 2–3 tiles of space before the fence, and new villager characters instead of
  recoloured explorers. Choices: an irregular outline; the gate towards the nearest trail.
- **Decision:** `generation/villagePlan.ts` plans per seed: an interior of random size with up to
  two notched corners (sometimes an L), the fence traced round it, houses spread out at spots
  whose footprint and roof keep a 2–3 tile gap (diagonal distance) from the fence. `placeVillage`
  finds the best spot near the cottage with summed-area tables (all free grass, edge grass or
  trail, fewest objects cleared), puts the gate on the straight fence stretch nearest an existing
  trail, lays door paths with A* (merging) and decorates by rule, keeping each decoration only
  if every door stays reachable. The world records `village` (interior row spans + gate), saved
  as an optional map-file section, because the outline can no longer be derived. Villagers walk
  that recorded interior. The villagers are three new characters (`assets/villagerParts.ts`): a
  farmer (straw hat, beard, overalls), a girl (red braids, dress, apron) and a baker (chef hat,
  moustache, apron), with their own heads and clothes on the shared body geometry, built by the
  same `buildCharacterMaps` as the explorer (the backpack removed, outline repaired).
- **Consequences:** the map-file format gains an optional `village` section (older files load
  without one). Seed 1: the village sits north-west of the cottage, gate on the west (the trail
  runs there); other seeds put it elsewhere with other gates (tested).

## D57 — Interiors: the game is a set of maps

- **Context:** the portfolio needs buildings you can enter (the studio in M7). M6 starts with the
  cottage; the user chose a locked message for the village houses.
- **Decision:** an interior is a plain `World` (`indoor: true`, `cabin: null`) built from a small
  definition in `core/world/interiors.ts` (tile rows, furniture placed as objects, an entry tile).
  `GameState` keeps all maps (`maps`, `mapId`, a mutable `world`) and a `transition`
  (fade out → swap map and place the player → fade in, `doors.fadeSeconds`); the player stands
  still meanwhile. An object kind with `interior` is entered by walking up into its door tile;
  the island tile in front of the door is remembered and the doormat returns you there, facing
  down. Rendering keys the tilemap, objects and lighting by map id (rebuilt and disposed on each
  swap); `GameLoop` mirrors the map id and the dark phase to zustand, and `ui/ScreenFade` fades a
  black veil by CSS. Indoor lighting blends from neutral day light to warm lamplight by the
  outdoor lights value. Indoors the camera uses the largest whole pixel scale that still fits
  the room plus one tile of margin.
- **Consequences:** rooms are code, not part of the baked map file (they don't depend on the
  seed). New furniture is ordinary registry objects with painted sprites. Villagers are
  simulated only against the island map and drawn only there.

## D58 — A compact 96×96 island; generated islands for everyone

- **Context:** the portfolio should be a short walk, and the user wanted to keep seed generation:
  the best seed as the default, R for another island, for visitors too. The user left the choice
  of the seed to me.
- **Decision:** the map is 96×96. Generation was retuned rather than redesigned: lower sea
  thresholds and a stronger radial pull (land is about 37% of the map), island-scale noise at
  about double frequency, lake radius 6–8, a slightly smaller village searched up to 30 tiles
  from the door, the cabin anchor at the new centre. A validation rule `village-missing` makes
  every accepted island have the village (attempts retry with derived seeds; seeds 1–48 pass,
  most on the first attempt). `scripts/island-overview.mjs` renders a contact sheet from the
  registries' map colours to compare seeds. The default is seed 46. `?seed=N` now works in
  production: `WorldPage` reads it and navigates; `ui/IslandSwitcher` (dice button, R, Home
  shown only away from home) fades the screen and then calls the page's callbacks. A new game
  resets the UI store (outdoors, no message, fade in), so pressing R indoors lands outside.
- **Consequences:** history works (Back returns to the previous island) and islands can be
  shared as links. Generating takes ~40 ms, fine on demand. M7 (the studio) changes the pipeline,
  so the default seed will be re-checked then.

## D59 — The Developer's Studio, paged messages and a content file

- **Context:** the portfolio needs a main building whose objects each show a part of it (M7).
  Charles's CV hasn't arrived; the user chose short placeholder texts, a cosy workshop look and
  no guide villager.
- **Decision:** `studio` is an ordinary building kind with `interior: 'studio'`, so M6's doors
  work unchanged. `placeStudio` runs after the village: it scores spots by how close they are to
  a preferred distance from the cottage door plus objects cleared, keeps two rows clear in front
  of the door and routes a path to the nearest trail. The rectangle sums and the trail route
  moved to `generation/siteSearch.ts` (shared with the village); routes now avoid tiles next to
  a ledge, so no path runs along a drop. Validation requires the studio (`studio-missing`);
  reachability already covers every building's door. Inside, each portfolio piece is its own
  object kind whose `interaction.pages` come from `core/content/studio.ts`, the one file M5 will
  fill. Messages became pages (`Dialog { pages, page }`); one-page messages are unchanged for
  the player. Pieces hung on the back wall are `wallMounted` (their footprint is wall; a test
  checks every piece can be faced from a reachable floor tile).
- **Consequences:** re-baking changed seed 46's layout slightly (the studio and its path);
  seed 46 stays the default. Placeholder texts must be replaced before launch (M5).

## D60 — Guidance: villager hints, signposts and a studio marker

- **Context:** first-time visitors should find the studio without instructions (M9); the user
  skipped the guide villager.
- **Decision:** villager lines are content (`core/content/guidance.ts`): three conversations per
  character, taking turns (`Villager.timesTalked`), the first always naming the studio.
  `{studio}` becomes the compass direction from where the villager stands (8 words; no arrow
  glyphs, since diagonal arrows render badly in system fonts). The interaction settings carry
  `villagerPages` and `signPages` functions instead of a fixed greeting, so core stays pure.
  The `sign` kind is a `signpost`: its text lists the landmarks (`findLandmarks`) further than
  6 tiles away. `placeSignposts` adds a sign outside the village gate. The studio marker is a
  render-only star (untinted, bobbing) shown until `hasVisitedStudio`, which `GameLoop` sets on
  first entering the studio and `ui/StudioVisitMemory` keeps in localStorage.
- **Consequences:** `villagers.greeting` is gone from the config. Signs on any seed point the
  right way without authoring. The visit is remembered per browser (clearing site data shows the
  star again).

## D61 — Portfolio content in a panel; screenshots as blurred WebP in public/

- **Context:** M5 turns the studio's placeholders into Charles's real portfolio, from his CV and
  four screenshot sets; the screenshots showed other people's details (a contact's name and
  phone number, addresses, a colleague's email).
- **Decision:** the content is plain data in `core/content/portfolio.ts` (panels of pages:
  title, subtitle, period, body, bullets, tags, one image, links); facts only from the CV.
  Registry interactions are either message `pages` or a `panel` (`pagePerTile` on the phone
  wall: each frame opens its project). The game opens the panel (`GameState.panel`, player held
  still); `GameLoop` mirrors it to the store; the UI pages and closes it, and
  `closePortfolioPanel` clears pending presses so the closing key can't reopen it. The panel
  is DOM, not canvas: readable text, real links, selectable, accessible. Screenshots were
  blurred and scaled with System.Drawing (lossless intermediates outside the repo) and encoded
  to WebP by headless Chrome (no new dependencies); they and the CV live in `public/portfolio/`
  and are referenced relative to `import.meta.env.BASE_URL`. The phone number stays off the
  site's text (the downloadable CV, chosen by the user, contains it).
- **Consequences:** updating the portfolio means editing one file (and adding images to
  `public/portfolio/`); a test checks every referenced file exists and that no phone number
  appears in the content.

## D62 — Portfolio tone and contact buttons

- **Context:** the user asked for third-person, simple wording, no LinkedIn, an Email button
  that copies the address, a WhatsApp button, and this site listed as an AI-generated project.
- **Decision:** a `PortfolioLink` is either a link (`href`, optional `download`) or a copy
  button (`copy` + `copiedNotice`); the page view copies with the Clipboard API (falling back
  to `execCommand`) and shows a short notice. WhatsApp is a plain `wa.me` link, so the phone
  number now appears in the site (user's choice; this replaces D61's "no phone number"). The
  projects panel has six pages, one per phone; the phone wall is six tiles wide. Tests check
  third-person wording, no LinkedIn, and the contact buttons.
- **Consequences:** updating contact details means editing `EMAIL` / `WHATSAPP` in
  `core/content/portfolio.ts`.

## D63 — Phones: tap to walk, phone framing, a Résumé page, link previews

- **Context:** M10. The user chose tap to walk, a Résumé button with an overlay (the site stays
  one page) and a name + role preview title; on phones the camera should start three zoom steps
  closer than on desktop.
- **Decision:** taps are planned in core (`planTap`: A* over `world.blocked` to the tile, or to
  the best standing spot for an object — the door front for buildings, the floor below wall
  pieces — with an arrival action) and followed step by step (`followWalk`: 4-way, snapping to
  tile centres, running on long routes, giving up when stuck). Small interactive things win a
  tap on the tile above them, because their sprites rise into it. The message box lets taps
  through (`pointer-events: none`) so a tap anywhere turns the page. "Three steps closer" became
  a framing rule rather than a step count: phones aim for ~18 tiles across, so phones with
  different pixel densities look alike. The zoom offset moved to the store so on-screen buttons
  can change it. The Résumé reuses `PortfolioPageView` (one content source) and pauses the game.
  For search engines and no-JS visitors a Vite plugin writes JSON-LD and a `<noscript>` copy of
  the portfolio into `index.html` from the same content. The preview image is JPEG (not every
  link-preview crawler reads WebP).
- **Consequences:** `og:image` is a relative URL until the site has a domain (M11 should make it
  absolute). Mouse clicks also walk on desktop.

## D64 — An open village with a plaza, animals and chimney smoke

- **Context:** the fenced ring made the village feel enclosed; the user chose an open village
  around a plaza with garden fences per house, plus animals, chimney smoke, string lights, a
  market stall and benches.
- **Decision:** the planner's outline stays (per-seed variety) but becomes an invisible area:
  villagers and animals keep to it (minus the strips behind houses, where only a head would show
  above a roof). House lots grew to cover the taller roofs and a front garden. The plaza is the
  open 3×3 spot nearest the doors, preferring a free ring for furnishings; nothing tall stands
  directly above or below the well, so it is never hidden. Garden fences and furnishings are only
  kept if every door stays reachable. The map file keeps its `gate` field, now meaning the
  village entrance (the signpost stands beside it), so older code and files still read. The
  "every trail is reachable" rule skips paving covered by an object. Animals are simple wanderers
  (straight walks between open tiles, no collisions with people) so they never get in the way;
  smoke is render-only, three hard-edged puff sizes on a loop per chimney.
- **Consequences:** generation takes about two attempts per seed on average (seeds 1–30 pass).
  Re-baking changed seed 46's village layout.

## D65 — A pool of house styles; a modern studio

- **Context:** with every building in the cottage style the village looked uniform; the user
  wanted diversity with a chill village vibe, a modern-cosy studio and a cosier cottage.
- **Decision:** houses differ in _shape_ (roof type, porches, materials), not only colour, and
  share one palette and a set of parts (`paintHouseParts.ts`). Footprints and door positions
  stay 5×3 with the door in the middle, so generation, doors and villagers are unchanged. A
  village picks `village.houses` styles from `VILLAGE_HOUSE_KINDS` (shuffled per island), so
  generated islands show different mixes. The studio deliberately breaks with the village
  (shed roof, cladding, glass) to read as the developer's place; its sign's letters use the lamp
  and flame colours, so the night-light overlay makes them glow. Chimney (and flue) tops come
  from the painters, so smoke follows the art.
- **Consequences:** `cottageStyle.ts` was removed (D64's shared cottage look); the cottage keeps
  its own painter. Re-baking changed seed 46's village.

## D66 — Wildlife: simulated ducks, drawn-only insects

- **Context:** the user asked for ducks on the lake, butterflies in the meadows and fireflies at
  night: noticeable, but not too many.
- **Decision:** the ducks react to the player (they paddle away), so they are simulated in core
  like the rabbits (fixed step, the game's rng, `GameState.ducks`). Butterflies and fireflies
  never affect the game, so they are not simulated: the render layer computes their pose from
  the clock (`insectMotion.ts`), like the chimney smoke, with spots chosen deterministically
  from the world (nearest the start first, spread apart). Fireflies reuse the window-light
  material, so they glow untinted and appear exactly when the lamps come on; butterflies hide
  at the same moment. Small numbers: one duck family, 4 butterflies, 3 swarms of 4 fireflies.
- **Consequences:** insects aren't in `GameState` and can't be tested through `stepGame`; their
  pure motion and spot functions have their own tests. They show on the island only.

## D67 — Calm features: code-made nature sounds, weather, an idle tour

- **Context:** the user wants a chill, slow portfolio: ambient sounds, cosier bench sitting, a
  sleeping cat, an ambient camera tour, gentle rain and cloud shadows.
- **Decision:**
  - Nature sounds are synthesised with Web Audio (noise beds and scheduled chirps, trills and
    crackles), like the music: no audio files, nothing to download. The mix is a pure core
    function of place, time, weather and room; the UI samples it on a timer (never per frame).
    One mute button covers music and nature (user choice).
  - Weather and the tour are simulated in core (fixed step, the weather has its own rng so other
    randomness is unchanged). Rain streaks, lake rings and cloud shadows are drawn from the
    weather's intensity and the clock (render only).
  - Cloud shadows reuse the soft-shadow exception (`shadow_*` sprites, `createShadowMaterial`)
    at a depth above the whole world (`CLOUD_SHADOW_Z`), so they darken everything under them;
    the strict depth test stops overlapping clouds darkening twice.
  - The pixel-perfect camera can't zoom smoothly, so sitting eases the camera a little forward
    instead of zooming in.
  - The tour starts after 60 s idle on the island (user choice); a key or tap that ends it is
    swallowed so it only wakes the camera.
- **Consequences:** `GameState` gains `weather`, `idleSeconds`, `tour`, `tourReturn`,
  `tourStops`; long idle simulations in tests now include a tour (the player doesn't move).

## D68 — Village routines by the clock

- **Context:** the user wants slow village living: people with daily rhythms, not decoration.
- **Decision:** each villager gets a role from their outfit (farmer = keeper, girl = night owl,
  baker = baker, who moves into the bakery when there is one) and a schedule of
  `[start, activity]` in the config. A routine step (`updateRoutine`) runs before the existing
  wander step: it switches activity on the clock, gives the villager an errand (a tile, a facing,
  maybe a bench or "go inside"), and the wander code walks the route (errand routes may use any
  open tile; wandering stays in the village). Indoors at night means hidden: skipped for
  drawing, collisions, taps and talking. One night owl stays out (user choice) so guidance never
  disappears. The held day/night mode also holds the village's time.
- **Consequences:** `Villager` gains role, roam, door, activity, errand, atErrand, hidden;
  `sitOn`/`standUp` moved to `core/systems/seat.ts`. Greetings are prepended to conversations,
  so the first-conversation workspace hint still holds.

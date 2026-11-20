# Progress

## Current status

- **Milestone:** M4 — Polish & handover ✅ complete. **All milestones (M0–M4) delivered.**
- **What works:** opening the site (`/`, tab title "chilling") shows a "Cooking…" loading
  screen, then drops you in front of the cabin on the baked 192×192 island, full screen with
  no site chrome. Walk with WASD/arrows, run with Shift, zoom with +/− (starts three steps out,
  the user's preferred view). The controls hint fades after your first steps. F3 shows FPS and
  your tile (dev and production). Dev only: R jumps to a random preview island, `?seed=N`
  previews a seed. Touch devices see "Best played with a keyboard". Every other address
  redirects to `/`. Production console is empty; ~240 FPS on GPU (headless, uncapped);
  renderer memory stays flat across regenerations. 249 tests.
- **Visual overhaul in progress** (user request, `pixel_art_visual_overhaul_prompt.md` + a
  cozy 16-bit reference image): Phases 2–4 done (foundation; trees, cottage, explorer; props,
  stumps/branches, rocky coastal ledges). **Next: Phase 5** — refine against the reference,
  before/after screenshots, final summary (asset list, limitations, gameplay preserved).
- **Still open from M4:** discuss the two items the user deferred until after M4:
  1. **Real-machine performance:** ask the user to run `npm run dev` (or `npm run build` +
     `npm run preview`), press F3, walk around (including zoomed out) and report the FPS.
  2. **GitHub:** nothing has been pushed. Remote `origin` has both `master` and `main`; ask
     which branch to push to (default suggestion: push `master`), then push only on the user's
     go. After that, pick next features from `docs/ROADMAP.md` with the user.

## Milestones

- [x] **M0 — Foundation:** scaffold, ESLint layer rules, Prettier, Vitest, routing, empty
      canvas, docs
- [x] **M1 — World data & generation:** seeded RNG, registries, world data, pipeline +
      validation, tests, coloured-tile render
- [x] **M1.5 — Fixed world (user request):** site opens into the world; world loaded from a
      baked, chunked map file; 192×192; trails, dock, rocks; seed tools dev-only
- [x] **M2 — Visuals:** procedural sprite atlas, chunked tilemap, autotiled shorelines,
      sprites for trees/flowers/rocks/cabin/dock, depth ordering, animated water, pixel-perfect
      ortho camera
- [x] **M2.5 — Classic art pass (user request):** handheld-RPG-inspired original art, big
      2×2 trees, mixed forests, swaying flowers, cabin fence + mailbox, handheld-like zoom
- [x] **M3 — Player:** input, 4-direction walk animation, movement + collision with sliding,
      spawn at door, camera follow with bounds
- [x] **M4 — Polish & handover:** HUD (controls hint), debug overlay (F3), dev regenerate key
      (R → new dev-preview seed), 60 FPS check, resource cleanup check, final docs + roadmap

## User decisions that override PROJECT_BRIEF.md (2026-11-20/21)

- The site opens straight into the world at `/` (brief: `/` home, `/games/island` game).
- The world is fixed: always the same layout, loaded from a baked map file (brief: random seed
  unless `?seed=` given, seed shown in the HUD). `?seed=` and `R`-regenerate are dev-only
  authoring tools now.
- Map size 192×192 (brief: 128×128), designed to be pleasant to stroll; the map format must
  allow growing the world later.
- Classic handheld-RPG-inspired pixel art (Pokémon Emerald as a style reference only, no
  copying); big 2×2 trees; the initial view is three zoom steps out from the ~20-tiles-across
  framing ("press − three times", the user's preferred camera).
- 4-way movement: only the most recently pressed direction key moves the player (no
  diagonals).
- Player character: explorer with a cap, dark brown hair, orange/yellow outfit; walk + hold
  Shift to run. Redrawn in a chunky chibi handheld-RPG style after the user shared a style
  reference (style only — no copying of the reference character).
- No site chrome: no menu on the island, no `/games` page; every address redirects to `/`.
- Debug overlay (F3) shows only FPS and the player's tile, in dev and production (the brief
  asked for collision tiles too, dev only). `R` = dev-only random preview island.
- Controls hint fades after the first walk; no seed or place name on screen; tab title
  "chilling"; loading text "Cooking…" / "Doing its magic…"; touch devices get a keyboard notice.
- Bigger cabin pinned with an authoring anchor (5×3, then a 6×4 reference-style cottage in
  the visual overhaul); camera starts three zoom steps out.
- Features chosen by Claude (user delegated): trails, lake dock, rocks; smooth shorelines in
  M2. A stream was rejected because the brief requires the lake not to touch the sea.

## Session log

### 2026-11-21 — Visual overhaul, Phase 4 (user request)

- **Done:**
  - Props by the cottage (`assets/paintProps.ts`): bush and flower pot beside the door,
    barrel, wooden sign by the trail, two stepping-stone tiles, wood pile beside the wing.
    Placed by `decorateCabin` on free grass in the reserved area only.
  - Woodland litter (`assets/paintDeadwood.ts`, `steps/scatterDeadwood.ts`): 35 stumps and
    74 fallen branches among trees.
  - Rocky ledges: new `Cliff` tile, `steps/placeLedges.ts`, `assets/paintCliff.ts` (boulder
    face, grass lip, shaded beach foot, ends rounded against grass or sand), validation
    `beach-cut-off`. A first brick-like face read as a wall and was redrawn as boulders.
  - Map re-baked from seed 1: terrain differs only by 43 ledge tiles; trees, rocks, fence,
    trails, dock and spawn unchanged.
- **Decisions:** D46–D47.
- **Verified:** typecheck, lint, 281 tests, build pass; screenshots of a ledge (close and
  default zoom) and the cottage yard; console clean; ~240 FPS on GPU.

### 2026-11-21 — Visual overhaul, Phase 3 (user request)

- **Done:**
  - Trees: crowns of many small leaf clusters (`leafClusters`, `paintLeafCrown`), softer
    outlines; oak ×3, pine ×2, small ×2, bush ×3 variants; new 3-tile-wide `tree_giant`
    (48×48, ×2 variants, `trees.giantShare` 0.3) with crown extents kept off reserved tiles.
  - Cottage: 6×4 footprint, 96×96 sprite in the reference style (red tiled gable,
    timber-framed plaster, side wing + chimney, shutters and flower boxes, stone foundation
    and steps); door on the same trail tile (`cabin.anchor` (113, 105)); dedicated shadow.
  - Explorer: same design, dark-brown outline, soft shadow, idle breathing (4th frame).
  - Map re-baked from the same seed: terrain, trails, dock and spawn (115, 109) unchanged.
- **Decisions:** D43–D45.
- **Verified:** typecheck, lint, 267 tests, build pass; screenshots at the default view and
  close-ups (cottage, forest edge); console clean; ~240 FPS on GPU.

### 2026-11-21 — Visual overhaul, Phase 1–2 (user request)

- **Brief:** `pixel_art_visual_overhaul_prompt.md` with a cozy 16-bit farming-RPG reference
  image (style only). User answers: art drawn in code; bigger reference-style cottage (~6×4,
  door on the same trail tile); extras: props by the house, stumps & fallen branches, rocky
  ledges; keep the explorer and refine its style.
- **Phase 1 audit (baseline screenshots):** biggest gaps were no soft shadows, visibly
  repeating grass, flat trees, a basic cabin, blocky paths, few props, heavy outlines, flat
  terrain.
- **Phase 2 done:**
  - Palette retuned (warmer greens, sandier dirt, softer water ramps).
  - Grass tiles: calm base, soft 2-px mottling, sparse tufts; 4 variants.
  - Dirt: lighter, soft mottling, occasional pebble.
  - Grass edges: 2-px wobble, blades poking into paths/sand, softer rim, a dirt shadow
    line; two variants of every edge/corner piece (`edge_<m>_<d>.<v>`), picked per tile.
  - Soft cast shadows: `assets/paintShadows.ts` (semi-transparent ellipses + cabin block),
    `render/objectShadows.ts` (per-kind placement, light from the top-left),
    `createShadowMaterial` (blended, strict depth test = no double darkening),
    `SHADOW_Z`; object shadows in `WorldObjects`, player shadow in `PlayerSprite`; the old
    opaque ground patches inside tree/bush/rock sprites were removed.
  - Dithered grass patches: `render/grassPatches.ts` (per-tile noise texture, bilinear) +
    `render/tilemapMaterial.ts` (4×4 Bayer dither per art pixel, grass quads only via a
    `patchable` vertex flag). A first per-tile version showed hard square patches and was
    replaced.
- **Verified:** typecheck, lint, 265 tests, build pass; screenshots at the default and a
  close zoom; console clean; ~240 FPS.

### 2026-11-21 — 4-way movement (user request)

- **Why:** pressing two keys (e.g. A+W) moved the player diagonally; the user wants only one
  active direction — the last pressed key.
- **Done:** `readMovementIntent` now returns a single unit step for the most recently pressed
  held direction (`latestHeld`); releasing it falls back to the previous held key; opposite
  keys no longer cancel. Movement system unchanged (it still supports diagonals, it just
  isn't asked to); corner nudging still helps slip past obstacles.
- **Verified:** 252 tests (new: latest key wins, fallback on release, opposite keys, no
  diagonal while two keys are held); in the browser D+S held together moved straight down
  from tile (115, 109) to (115, 112).

### 2026-11-21 — M4 Polish & handover

- **User choices (Q&A before M4):** controls hint fades after the first walk; no place-name
  label; tab title "chilling"; loading text "Cooking…" / "Doing its magic…"; F3 shows FPS +
  tile only, in dev _and_ production (no collision-tile view); R = dev-only random preview;
  remove the `/games` page; keyboard notice on touch devices; performance check on the user's
  machine and GitHub push to be discussed after M4.
- **Done:**
  - `state.ts` (zustand): `isDebugOverlayVisible`, `hasStartedWalking` (first real use).
  - `core/game/gameState.ts`: smoothed `framesPerSecond` in `advanceGame`, `playerTile()`;
    `IslandConfig.debug` (FPS smoothing, overlay refresh).
  - `IslandGame` creates the `GameState` and shares it with `GameCanvas` and the overlays;
    `GameLoop` reports the first walk to the store once.
  - UI: `ControlsHint` fades (CSS transition), `DebugOverlay` (F3, samples every 250 ms while
    visible, prevents the browser's F3 find), `KeyboardNotice` (CSS `hover: none` +
    `pointer: coarse`).
  - Site: removed `/games`, `GamesIndexPage`, `Layout`, `NotFoundPage`, `games/catalog.ts`
    and their CSS; catch-all `RedirectToIslandPage` keeps the query string; `RouteLoadingPage`
    cycles the two messages; `index.html` title "chilling"; dev-only R in `WorldPage`.
  - Dev-only `window.__islandRenderer` for checks; `browser-check.mjs` gained `CHECK_EXPR`,
    `PHONE=1`, `MEDIA`, `CHROME_WINDOW`.
  - Docs final pass: README (controls table, run instructions), ARCHITECTURE, DECISIONS
    D38–D39, ROADMAP reorganised, CLAUDE.md.
- **Verified (dev + production preview, headless Chrome on GPU):**
  - Title "chilling"; hint opacity 1 before walking, 0 after; F3 shows "FPS ~239 · Tile 115,
    109"; `/games?seed=5` → `/?seed=5`; unknown paths → `/`; production ignores R and has no
    dev hook; phone emulation shows the keyboard notice, desktop hides it.
  - Performance: ~237–240 FPS (uncapped) at the default view, which on small windows is
    already the widest zoom; 31–34 draw calls, ~26k triangles, 1 texture, 2 shader programs.
  - Cleanup: renderer memory flat across 1 and 5 island regenerations (31–34 geometries,
    1 texture, 2 programs) — no leaks.
  - typecheck, lint, 249 tests, build, format:check pass; production console empty.
- **Known issues / notes:** on portrait phones the view zooms far out (no touch play anyway;
  ROADMAP). Walking _behind_ a crown is unit-tested rather than screenshot-verified.

### 2026-11-20 — Bigger cabin (user request)

- **Why:** the user wanted the cabin a bit bigger: wider body (not a taller roof), only two
  windows, door still opening onto the same trail tile.
- **Done:** cabin footprint 3×3 → 5×3, sprite 48×64 → 80×64, symmetric (door in the middle
  tile, one window each side). New authoring hint `cabin.anchor` (nearest suitable site to a
  tile instead of a random one) keeps the cabin in place: anchor (113, 106), so the door front
  stays at (115, 109). Re-baked seed 1: terrain, trails and dock unchanged; some rocks, trees
  and flowers reshuffled because the wider yard frees/blocks different tiles.
- **Verified:** checks pass; door aligned with the trail in screenshots.

### 2026-11-20 — No site menu on the island (user request)

- **Why:** the user wants visitors to land straight in the game with nothing else on screen.
- **Done:** removed the floating "Games" button (`app/SiteMenu.tsx` and its CSS). The island
  page now shows only the game and the controls hint. `/games` still exists (reachable by
  URL, ready for future games) but nothing links to it from the island.
- **Verified:** checks pass; the page text is only the controls hint; console clean.

### 2026-11-20 — Wider initial camera (user request)

- **Why:** the user found the start view too close; their ideal view is the old default after
  pressing "−" three times.
- **Done:** `render.defaultZoomSteps = -3` in `IslandConfig`; `FollowCamera` starts with that
  offset on top of the automatic `autoPixelScale` framing, so it reproduces exactly that view
  on any window (e.g. 2 device px per art px on a 1080p browser window, ~60 tiles across).
  Zoom offsets now stop at the min/max scale (extra presses no longer pile up).
  `scripts/browser-check.mjs`: `CHROME_WINDOW=1920,1040` sets the window size.
- **Verified:** at 1920×1040 the new default is pixel-identical in framing to the old default
  plus three "−" presses; four "−" then one "+" returns to the default; checks pass.

### 2026-11-20 — Character redesign (user request, before M4)

- **Why:** the user didn't like the first character and shared a classic handheld-RPG hero
  sprite sheet as a style reference. Not copied: kept the user's own colours (orange cap and
  jacket, dark brown hair, brown backpack) and drew a new design; adopted only the style —
  chibi proportions (head + cap ≈ half the height), wide visor overhanging the face, hair
  tufts at the sides, vertical 2-px eyes, thick outline, 3–4-tone shading, swinging arms,
  big backpack in the back view, visor jutting forward in the side view.
- **Done:** `assets/playerPixels.ts` rewritten as head + torso-with-arms + legs parts per
  direction; front/back step frames mirror each other; side has stand / stride / passing with
  the arm swinging forward and back. Reviewed via a 10× preview sheet and in-game screenshots.
- **Verified:** typecheck, lint, all tests, build pass; console clean.
- **Next:** wait for the user to review the character before starting M4.

### 2026-11-20 — M3 Player

- **User choices:** explorer with a cap; dark brown hair; orange/yellow outfit; walk + hold
  Shift to run.
- **Done:**
  - `shared/engine`: `fixedStep.ts` (accumulator clock, capped steps, rounding tolerance),
    `input.ts` (key bindings → actions, press order, multi-key actions, clear on blur),
    `math.approach` (frame-rate independent smoothing).
  - `core`: `entities/player.ts` (plain mutable player, feet hitbox, `playerFootY`),
    `systems/controls.ts` (bindings, `readMovementIntent`), `systems/movement.ts`
    (axis-separated collision, flush contact, corner nudging, map bounds),
    `systems/animation.ts` (walk cycle 1-0-2-0, faster when running),
    `game/gameState.ts` (`createGameState`, `stepGame`, `advanceGame`, interpolation).
  - `assets`: `playerPixels.ts` (16×24 pixel maps: front/back/side, 3 leg frames, mirrored
    left), `paintPlayer.ts` (pixel-map painter + atlas strips `player_<dir>`).
  - `render`: `GameLoop` (fixed steps in `useFrame`), `PlayerSprite` (interpolated,
    pixel-snapped, facing strip + frame, depth from feet), `FollowCamera` (smoothed,
    automatic zoom + offset), `useKeyboardInput`, `spriteGeometry` (shared with objects);
    `FreeLookCamera` and `LookAroundHint` removed; `ui/ControlsHint` added.
  - `scripts/browser-check.mjs`: key combos (`ShiftLeft+ArrowRight:600`).
- **Decisions:** D29–D33 in `docs/DECISIONS.md`.
- **Verified:** typecheck, lint, 244 tests, build, format:check pass. Browser (simulated keys,
  GPU): spawn at the door; walking down the trail with the camera following; walking onto the
  dock and stopping at its end; running blocked by the yard fence; back view through the gate;
  standing in front of an oak trunk; production preview console empty; ~240 FPS.
- **Known issues / notes:** walking _behind_ a crown wasn't captured in a screenshot (depth
  order is unit-tested with the same `standingSpriteZ` function the player uses).
  `state.ts` (zustand) is still unused — M4's debug flag is its first real use.

### 2026-11-20 — M2.5 Classic art pass (user request)

- **Why:** the user liked M2 but wanted more classic pixel art (Pokémon Emerald as a style
  reference only — no copying), with trees up to 4 tiles. Answers: mix of 2×2 big trees and
  1×2 small trees/bushes; forests sometimes dense, sometimes loose; extras: swaying flowers,
  fence + mailbox at the cabin; handheld-like zoom.
- **Done:**
  - Objects: `tree_oak`/`tree_pine` are now big (footprint 2×1 trunk row, 32×32 sprite);
    new `tree_small`, `bush`, `fence`, `mailbox`; categories `bush`, `structure`.
  - Generation: `scatterTrees` rewritten (dense canopy on a staggered 2-tile grid where forest
    cores meet a "dense" character noise; loose big/small mix elsewhere; meadow trees and
    bushes; crowns never overhang reserved tiles so trails and the yard stay visible); new
    `decorateCabin` step (fence around the front yard, trail tiles left open; mailbox by the
    door). Re-baked seed 1: terrain, spawn, cabin and rocks verified identical to M2.
  - Art (`assets/`): new ramp palette, `foliage.ts` clump shader (lit top-left, creases,
    outline), redrawn tiles/water/dock/shorelines (two-tone foam, dark grass rims), big
    oak/pine, small tree, bush, rock, 4-frame swaying flowers, tufts, fence (16 connection
    pieces), mailbox (16×24), outlined cabin with chimney, window boxes and stone step.
  - Render: `spriteMaterial.ts` (one shader for tiles and instanced objects, `uFrame`
    animation), `objectSpriteKeys.ts` (fence connections, stable variants), objects animated;
    `autoPixelScale` in `shared/render/pixelPerfect.ts` (~20 tiles across, ≥11 tall).
- **Decisions:** D24–D28 in `docs/DECISIONS.md`.
- **Verified:** typecheck, lint, 199 tests, build, format:check pass. Browser (dev + production
  preview, GPU): cabin yard, lake/dock, dense and loose forests, meadows inspected via
  screenshots; flowers animate; production console has no messages; ~240 FPS.
- **Known issues / notes:** side fences read as a row of posts (fine for now); trails still
  staircase on diagonals (ROADMAP).

### 2026-11-20 — M2 Visuals

- **Done:**
  - `shared/render`: `pixelCanvas` (pure RGBA painting, rotate, blit), `atlasLayout` (shelf
    packing into a power-of-two image, 1 px border extrusion, animation strips, UVs),
    `spriteAtlas` (DataTexture with nearest filtering, lookup by key, `base.N` variants),
    `pixelPerfect` (pixel scale, zoom, snapping with odd-buffer half-pixel fix, clamping),
    `PixelPerfectCamera` (drei orthographic camera driven by a focus callback).
  - `games/island/assets`: palette, paint helpers, tiles (3 ground variants, 2 water variants ×
    3 frames, dock h/v), shoreline overlays (edge + corner × 4 directions for sand, grass,
    shallow sea, lake shallows), trees 16×32 (2 variants each), flowers, tuft, rocks, cabin
    48×64.
  - Tile registry: `edgePriority` and `underlay` (dock over lake shallows).
  - `games/island/render`: `worldSpace` (map↔world coords, depth), `tileLayers` (base +
    shoreline overlays + dock planks per tile), `tilemapGeometry` (chunk vertex data),
    `tilemapMaterial` (ShaderMaterial; water animated by one `uFrame` uniform), `Tilemap`,
    `objectSprites` + `WorldObjects` (one InstancedMesh per sprite), `spriteCatalog`,
    temporary `FreeLookCamera` + `ui/LookAroundHint`. M1 preview renderer removed.
  - `scripts/browser-check.mjs`: key presses (`ArrowDown:900,Minus`), FPS sample,
    `CHROME_ANGLE=d3d11` for GPU rendering.
- **Decisions:** D18–D23 in `docs/DECISIONS.md`.
- **Verified:** typecheck, lint, 185 tests, build, format:check pass. Browser: dev and
  production preview render the island; production console has no messages at all;
  production ignores `?seed=`; `/games/island` redirects; free-look panning/zoom works via
  simulated keys; GPU render ~240 FPS at default zoom and fully zoomed out (software render
  ~35–40 FPS).
- **Known issues / notes:**
  - Trails are 4-connected, so diagonal stretches look like staircases (ROADMAP: smoothing).
  - A rock directly behind a tree shows only its top outline above the crown — correct depth
    behaviour, but it can read as a grey arc.
  - World chunk is ~1.03 MB (266 kB gzip), under the 1200 kB warning limit.

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

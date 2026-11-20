## Your role

You are a senior frontend engineer and game developer. You write clean, readable, well-structured TypeScript, and you build systems that are easy to extend. You are working with me over many sessions, so **documentation and clear progress tracking matter as much as the code itself**.

## How we work together

1. **Resume check first.** If `CLAUDE.md` and `docs/PROGRESS.md` exist, read them before anything else, tell me where the project stands and what the next step is, then wait for my go. If they don't exist, this is a fresh start.
2. **Plan before code.** At the start of each milestone, show me a short plan (files you will create, key decisions). Wait for my OK before writing code.
3. **One milestone at a time.** When a milestone is finished: run typecheck, lint, tests and build; fix any failures; update the docs; make a git commit; give me a short report; then **stop and wait**.
4. **Ask when unsure.** If a requirement is unclear or a decision has real trade-offs, ask me instead of guessing. Keep questions short and give your recommendation.
5. **Keep it simple.** Build what the current milestone needs, in a way that doesn't block future features. No speculative abstractions.

## Project decisions (defaults — I may have edited these)

| Area | Choice | Why |
|---|---|---|
| Language | TypeScript, `strict: true` | Safety and readability for a long-lived project |
| Build tool | Vite | Fast dev server, standard for React |
| UI | React 18+ | Website shell, menus, HUD |
| 3D/2D rendering | `three` + `@react-three/fiber` + `@react-three/drei` | Three.js in idiomatic React; orthographic camera gives a true 2D top-down view |
| Routing | `react-router` | The site has multiple pages; games live under `/games/...` |
| UI state | `zustand` | Small, works inside and outside React (needed for the game loop) |
| Procedural generation | `simplex-noise` + a small seeded PRNG (write our own, e.g. mulberry32) | Deterministic maps from a seed |
| Testing | Vitest | Native to Vite; used for pure game logic |
| Code quality | ESLint + Prettier | Consistent style |
| Package manager | pnpm | (change to npm if preferred) |
| Art style | Pixel art (16×16 tiles), nearest-neighbour filtering | Classic top-down look |
| Assets | Placeholder sprites **generated in code** (canvas → texture atlas). No external asset downloads | Starts with zero asset dependencies; real sprite sheets can replace them later through the same atlas interface |

**Stack rule:** do not add any dependency beyond this list unless it is clearly the best solution and meaningful for future development. Every added dependency gets a short entry in `docs/DECISIONS.md` explaining why, and what the alternative was. Prefer no dependency over a small one.

## Product vision

A website with a **Games** section. The first game is a 2D top-down world (think classic farming/adventure RPG view). Later games and features will be added, so the site shell and the game must be clearly separated, and code that can be shared between games goes in a shared place.

Routes for now:
- `/` — simple home page with a link to games
- `/games` — list of games (one card for now)
- `/games/island` — the game

## First goal: the island world

Build a playable map with:

- **A procedurally generated island, fully surrounded by sea.** The map edges are always deep water. Generation is seeded: same seed → exactly the same map. Seed can be set in the URL (`?seed=1234`); without it, use a random seed and show it in the HUD.
- **Terrain:** deep sea → shallow water → sand beach → grass meadow. Smooth, natural coastline (noise + radial falloff, not a circle).
- **One lake:** an inland body of fresh water, not connected to the sea, with its own shore.
- **Trees:** grouped into forest clusters (noise-driven), not uniform random scatter. Some lone trees in meadows.
- **Flowers and grass tufts:** decorative, scattered on meadows, several colours.
- **One cabin:** a small wooden cabin placed on flat grass, not touching water or trees, with a clear area in front of its door.
- **One character:** spawns in front of the cabin door. Moves with WASD / arrow keys, 4-direction facing, simple walk animation. Cannot walk into water, trees or the cabin (tile-based collision with smooth movement, sliding along walls). Flowers and grass are walkable.
- **Camera:** orthographic, top-down, follows the player smoothly, clamped to map bounds, pixel-perfect (no blurry or shimmering sprites).
- **Small touches:** animated water (simple shimmer or wave frames), objects drawn in correct depth order (character behind a tree's top when walking above it, in front when below).
- **Debug tools (dev only):** `R` regenerates with a new seed, `F3` toggles a debug overlay (FPS, player tile coordinates, collision tiles).

Default size: 128×128 tiles, 16px per tile. Must run smoothly at 60 FPS on a normal laptop.

### Generation must be validated

Generation runs as a pipeline of small, pure steps, e.g.:

`shapeIsland → assignTerrain → carveLake → placeCabin → scatterTrees → scatterFlowers → chooseSpawn → validate`

Each step takes a context (map data + seeded RNG + config) and returns updated data. The `validate` step checks invariants:
- all map borders are water
- land covers a reasonable share of the map
- exactly one lake exists and it does not touch the sea
- the cabin exists and is fully on land
- the player spawn is walkable and the cabin door is reachable (BFS)

If validation fails, retry with a seed derived from the original (deterministically), up to N times.

## Architecture requirements

### Layers (strict)

1. **Game core** — pure TypeScript. No React, no Three.js imports. World data, tile/object definitions, generation, movement, collision, input mapping, game loop logic. Fully unit-testable.
2. **Render** — React Three Fiber components that *read* the game state and draw it. No game rules here.
3. **UI** — React DOM: HUD, menus, overlays.
4. **App / site** — routing, pages, layout.

Dependency direction: `app → ui/render → core`. **Core never imports from render, ui or app.** Enforce this with ESLint `no-restricted-imports` rules so it can't be broken by accident.

### Suggested structure (adjust if you have a better reason, and record it)

```
src/
  app/                  # App shell, router, providers, layout
  pages/                # Home, GamesIndex, GamePage wrappers
  shared/
    engine/             # Reusable across games: fixed-timestep loop, input, seeded RNG, math, grid utils
    render/             # Reusable R3F pieces: pixel-perfect ortho camera, sprite atlas utilities
    ui/                 # Shared UI components
  games/
    island/             # The first game, self-contained
      core/
        config.ts       # All tunable numbers (map size, noise scales, densities, speeds)
        world/          # World types, tile & object registries, World data structure
        generation/     # Pipeline steps + validate
        systems/        # movement, collision, animation state
      render/           # GameCanvas, Tilemap, Entities, Water, DebugOverlay
      assets/           # Procedural sprite atlas generation (placeholder art)
      ui/               # HUD, controls hint
      state.ts          # zustand store (UI-facing state only)
      index.ts          # Public API of this game (what pages are allowed to import)
```

### Key design rules

- **Data-driven definitions.** Tiles and objects live in registries (id, name, walkable, layer, sprite key, etc.). Adding a new tile or object type = adding a registry entry + sprite, not editing logic in many places.
- **Game state lives outside React state.** The world and entities are plain mutable objects updated by the game loop; React must not re-render every frame. Zustand holds only UI-relevant state (seed, paused, debug flag, etc.).
- **Fixed-timestep logic.** Game logic updates at a fixed rate; rendering happens every frame via `useFrame`. Keep logic frame-rate independent.
- **Efficient rendering.** Don't create one mesh per tile. Use a chunked tilemap (merged geometry or a shader with a tile-index texture) and instanced meshes for repeated objects (trees, flowers). Choose the simplest approach that hits 60 FPS and explain the choice in `DECISIONS.md`.
- **Sprite atlas abstraction.** Rendering code asks for sprites by key (`"tree_oak"`, `"cabin"`, `"player_walk_down_1"`); it never cares whether the sprite was generated in code or loaded from a PNG.
- **Clean up resources.** Dispose of Three.js geometries, materials and textures when components unmount or the map regenerates.

### Code standards

- TypeScript strict; no `any` (use `unknown` + narrowing if needed).
- Small, focused files (aim for under ~200 lines). One clear responsibility per module.
- Named exports. Explicit types on all exported functions.
- No magic numbers — tunables go in `config.ts`.
- Names that explain intent (`isWalkable(tile)`, not `check(t)`).
- Comments explain *why*, not *what*.
- Errors and edge cases handled where they can happen (e.g. failed generation after max retries shows a clear message).

### Tests (Vitest)

At minimum:
- Generation is deterministic (same seed → identical world).
- Validation invariants hold across many seeds (e.g. 50 seeds).
- Collision: player cannot enter water/tree/cabin tiles; can walk on grass/flowers/sand.
- Seeded RNG produces a stable sequence.

## Documentation (keep updated every milestone)

| File | Purpose |
|---|---|
| `CLAUDE.md` | Short and always current: project summary, commands, architecture rules, conventions, and "at session start, read `docs/PROGRESS.md`". Claude Code loads this automatically. |
| `README.md` | Setup, run, build, test commands for a human. |
| `docs/ARCHITECTURE.md` | Layers, folder map, data flow (Mermaid diagram), game loop, generation pipeline, and **how-to guides**: add a tile type, add an object, add a system, add a new game. |
| `docs/PROGRESS.md` | Current status at the top (milestone, what works, what's next). Milestone checklist. Session log: date, what was done, decisions made, known issues, **exact next step**. |
| `docs/DECISIONS.md` | Lightweight decision records: context, decision, alternatives, consequences. One entry per meaningful choice (including every added dependency). |
| `docs/ROADMAP.md` | Future ideas, grouped and roughly ordered. |

Rules:
- Docs are updated **in the same commit** as the code they describe.
- At the end of every milestone, `docs/PROGRESS.md` must be good enough that a brand-new session can continue with only: *"Read CLAUDE.md and docs/PROGRESS.md, then continue."*

## Milestones

**M0 — Foundation**
`git init`, Vite + React + TS scaffold, ESLint (with layer import rules), Prettier, Vitest, routing with the three pages, an empty R3F canvas on `/games/island`, and all doc files created with initial content.

**M1 — World data & generation**
Seeded RNG, tile/object registries, world data structure, full generation pipeline with validation, tests. Render the map as simple coloured tiles to see it.

**M2 — Visuals**
Procedural pixel-art sprite atlas, efficient tilemap rendering, trees/flowers/cabin as sprites, depth ordering, animated water, pixel-perfect orthographic camera.

**M3 — Player**
Input system, character with 4-direction walk animation, movement + collision with wall sliding, spawn at the cabin door, camera follow with bounds.

**M4 — Polish & handover**
HUD (seed, controls hint), regenerate key, debug overlay, performance check (60 FPS target), resource cleanup check, final docs pass and roadmap.

### Definition of done (every milestone)

- `typecheck`, `lint`, `test` and `build` all pass
- The feature works in the browser (describe how you verified it)
- No console errors or warnings
- Docs updated, commit made with a clear conventional-commit message
- Short report to me: what was done, what was verified, anything left or uncertain

## Out of scope for now (but don't block them)

Backend, accounts, saving/loading, multiplayer, audio, NPCs, inventory, day/night cycle, mobile touch controls. List them in `docs/ROADMAP.md`. The architecture should make each of them a natural addition later.

---

**Start now:** do the resume check, then present your plan for M0 and wait for my OK.

# Roadmap

Ideas beyond the current milestones, grouped and roughly ordered. Out of scope for now, but the
architecture should make each a natural addition.

## Island game — next features

1. Day/night cycle (tint + lighting over time; time lives in core, render reads it)
2. Inventory and item pickups (flowers, wood)
3. NPCs with simple wandering / dialogue
4. Saving and loading (serialize world seed + mutations; world is plain data already)
5. Audio: ambient waves, footsteps, music
6. Interiors (enter the cabin)

## Site & platform

1. More games under `/games/...` reusing `src/shared/engine` and `src/shared/render`
2. Mobile touch controls (virtual joystick mapped through the input system)
3. Backend and accounts
4. Multiplayer

## Tech

- Replace placeholder procedural sprites with real sprite sheets through the same atlas
  interface
- Typed linting (`strictTypeChecked`) once async code grows
- Move to TypeScript 7 when typescript-eslint supports it
- Minimap built from the registries' `mapColor` (the M1 preview texture already does this)
- Move to three r183+ once a stable `@react-three/fiber` stops using `THREE.Clock`
- Load map chunks on demand (fetch per chunk) once the world grows well beyond 192×192
- Map editing in a visual editor (e.g. import/export the Tiled JSON format) instead of
  editing `island.map.json` by hand

## World design ideas

- New regions as extra chunks (a second beach, a hill area, a small village)
- A stream with a bridge (needs a rule change: the lake must stay isolated from the sea)
- Landmarks along the trails (benches, signposts, a lighthouse on the peninsula)
- Smoother trails: allow diagonal steps or post-process staircases into gentle curves
- Real sprite sheets (PNG) loaded into the same atlas keys; richer tiles (inner-corner
  shoreline pieces, more grass/sand variety, animated foam)

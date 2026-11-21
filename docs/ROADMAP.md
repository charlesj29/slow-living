# Roadmap

Ideas beyond the delivered milestones, grouped and roughly ordered. None are started; the
architecture is set up so each is a natural addition.

## Island — play

1. Interactions: open the cabin door (interior scene), sit on the dock — E and the mailbox are done
2. ~~Day/night cycle~~ — done (D53); next: lanterns along the trails, stars, fireflies
3. Ambient audio: waves, birds, footsteps (per ground type) — background music is done
4. Inventory and pickups (flowers, shells, wood)
5. NPCs: the village has 3 wandering villagers (D54); next: more dialogue, villagers on the trails
6. Saving (player position, picked-up items; the world itself is already plain data)

## Island — world and art

- New regions as extra map chunks (a second beach, hills, a small village)
- Landmarks along the trails: benches, signposts, a lighthouse on the peninsula
- Smoother trails: allow diagonal steps or turn staircases into gentle curves
- Tall-grass patches, stumps, more flower and tree variety
- Dedicated side-view fence pieces (side fences currently read as a row of posts)
- Inner-corner shoreline pieces and animated foam
- Real sprite sheets (PNG) loaded into the same atlas keys
- A stream with a bridge (needs a rule change: the lake must not touch the sea)

## Controls and devices

- Touch controls (virtual joystick) and gamepad, feeding the same input actions
  (`shared/engine/input.ts`); then drop the "Best played with a keyboard" notice
- Better phone framing (portrait windows currently zoom far out)

## Site

- More games: re-add a games list/route, reuse `shared/engine` and `shared/render`, and decide
  how visitors discover them (the island page has no site menu by design)
- Backend, accounts, multiplayer

## Tech

- Per-tile hashed randomness in scatter steps, so local edits don't reshuffle rocks, trees and
  flowers elsewhere on re-bake
- Load map chunks on demand once the world grows well beyond 192×192
- Visual map editing (e.g. Tiled JSON import/export) instead of editing `island.map.json`
- Minimap from the registries' `mapColor`
- Move to three r183+ once a stable `@react-three/fiber` stops using `THREE.Clock` (D9)
- TypeScript 7 once typescript-eslint supports it; typed linting (`strictTypeChecked`)

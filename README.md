# threejs-project

A small games website built with React, TypeScript and Three.js (via React Three Fiber).
The site opens straight into **Island**, a hand-picked 2D top-down world to stroll around.

## Requirements

- Node.js 22.22+ (developed on Node 26)
- npm 11+

## Setup

```sh
npm install
```

## Commands

| Command                | What it does                                         |
| ---------------------- | ---------------------------------------------------- |
| `npm run dev`          | Start the dev server at http://localhost:5173        |
| `npm run build`        | Typecheck and build for production into `dist/`      |
| `npm run preview`      | Serve the production build locally                   |
| `npm run typecheck`    | TypeScript type check (`tsc -b`)                     |
| `npm run lint`         | ESLint, including architecture layer rules           |
| `npm run format`       | Format all files with Prettier                       |
| `npm run format:check` | Check formatting without writing                     |
| `npm test`             | Run unit tests once (Vitest)                         |
| `npm run test:watch`   | Run tests in watch mode                              |
| `npm run check`        | typecheck + lint + test + build (run before commits) |
| `npm run bake:island`  | Regenerate the island map file from a seed           |

## Pages

- `/` — the island world, full screen (the same island on every visit)
- `/games` — list of games
- `/games/island` — redirects to `/`
- Dev only: `/?seed=1234` (or a word, e.g. `?seed=palm`) previews a freshly generated island

## The island map

The world is loaded from `src/games/island/data/island.map.json`, a baked map file that is
committed to the repo (readable: one character per tile, see `docs/ARCHITECTURE.md`).

- `npm run bake:island -- <seed>` regenerates it from a seed (this replaces hand edits).
- You can also edit the file by hand; `npm test` checks the map is still valid.

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — layers, folder map, data flow, how-to guides
- [docs/PROGRESS.md](docs/PROGRESS.md) — current status and session log
- [docs/DECISIONS.md](docs/DECISIONS.md) — decision records
- [docs/ROADMAP.md](docs/ROADMAP.md) — future ideas
- [PROJECT_BRIEF.md](PROJECT_BRIEF.md) — the original project specification

## Browser check (dev only)

With `npm run dev` running, `node scripts/browser-check.mjs http://localhost:5173/games/island?seed=1234 shot.png`
loads the page in headless Chrome, saves a screenshot and prints all console output. Set
`CHROME_PATH` if Chrome is not in the default Windows location.

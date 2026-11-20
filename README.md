# threejs-project

A small games website built with React, TypeScript and Three.js (via React Three Fiber).
The first game, **Island**, is a procedurally generated 2D top-down world.

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

## Pages

- `/` — home
- `/games` — list of games
- `/games/island` — the Island game. `?seed=1234` (or any word, e.g. `?seed=palm`) picks the
  world; without it a random seed is used and shown top-left

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

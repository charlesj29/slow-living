# Slow Living · Charles

A small browser game built with React, TypeScript and Three.js (via React Three Fiber). Opening
the site drops you straight onto **Island**: a hand-picked, pixel-art 2D top-down world to stroll
around — meadows, forests, trails, a lake with a dock and a cabin.

## Requirements

- Node.js 22.22+ (developed on Node 26)
- npm 11+
- A keyboard (touch devices see a "Best played with a keyboard" notice)

## Setup and run

```sh
npm install      # once
npm run dev      # then open http://localhost:5173/ — stop with Ctrl+C
```

## Controls

| Key                 | Action                                      |
| ------------------- | ------------------------------------------- |
| WASD / arrow keys   | Walk                                        |
| Shift (held)        | Run                                         |
| `+` / `-`           | Zoom in / out                               |
| F3                  | Show / hide FPS and your tile position      |
| R (dev server only) | Jump to a randomly generated preview island |

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

- `/` — the island, full screen, the same island on every visit
- Any other address redirects to `/` (keeping the query string)
- Dev only: `/?seed=1234` (or a word, e.g. `?seed=palm`) previews a freshly generated island

## The island map

The world is loaded from `src/games/island/data/island.map.json`, a baked map file committed to
the repo (readable: one character per tile, see `docs/ARCHITECTURE.md`).

- `npm run bake:island -- <seed>` regenerates it from a seed (this replaces hand edits).
- You can also edit the file by hand; `npm test` checks the map is still valid.
- Tunables (island shape, forests, cabin size and position, camera, speeds) live in
  `src/games/island/core/config.ts`.

## Documentation

- [docs/PROGRESS.md](docs/PROGRESS.md) — current status, user decisions, session log
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — layers, folder map, data flow, how-to guides
- [docs/DECISIONS.md](docs/DECISIONS.md) — decision records
- [docs/ROADMAP.md](docs/ROADMAP.md) — future ideas
- [PROJECT_BRIEF.md](PROJECT_BRIEF.md) — the original project specification

## Browser check (dev only)

With `npm run dev` running:

```sh
node scripts/browser-check.mjs http://localhost:5173/ shot.png 1500 "ArrowDown:900,F3"
```

loads the page in headless Chrome, optionally presses keys (`Code`, `Code:holdMs`,
`ShiftLeft+ArrowRight:600`), saves a screenshot and prints an FPS sample plus all console
output. Options (environment variables): `CHROME_ANGLE=d3d11` renders on the GPU,
`CHROME_WINDOW=1920,1040` sets the window size, `PHONE=1` emulates a touch phone,
`CHECK_EXPR="..."` evaluates an expression in the page (e.g.
`window.__islandRenderer.info.memory` in dev), `CHROME_PATH` points at Chrome.

## Deploying (GitHub Pages)

Every push to `master` runs `.github/workflows/deploy.yml`: install, `npm run check`
(typecheck, lint, tests, build) and, only if all of it passes, publish to GitHub Pages at
`https://<owner>.github.io/<repo>/`. The workflow works out that address from the repo name, so
renaming the repo needs no code change. You can also run it by hand from the **Actions** tab.

One-time setup on GitHub: the repo must be public (free plan), and **Settings → Pages → Build
and deployment → Source** must be set to **GitHub Actions**.

Your own domain: buy it, point its DNS at GitHub Pages (four A records for the bare domain:
`185.199.108.153`, `.109.153`, `.110.153`, `.111.153`; a CNAME `www` → `<owner>.github.io`), enter it
under **Settings → Pages → Custom domain**, and add the repo variable **`PAGES_DOMAIN`** (e.g.
`charlesj.town`, under **Settings → Secrets and variables → Actions → Variables**) so the build
targets the domain's root. Without the variable, builds keep the `/<repo>/` address.

To try a deploy-style build locally (Git Bash: keep it from rewriting the path):
`MSYS_NO_PATHCONV=1 BASE_PATH=/slow-living/ npm run build`, then
`MSYS_NO_PATHCONV=1 npx vite preview --base /slow-living/`.

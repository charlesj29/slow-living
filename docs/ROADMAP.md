# Roadmap

## The goal

The island is **Charles's interactive portfolio**. A mobile engineer's work and story, presented
as a calm, lo-fi place to explore: visitors (recruiters, clients, other developers) land on a
small island, wander through a cosy village whose villagers point them to **the Developer's
Studio**, and inside it discover who Charles is, what he has built and how to reach him. Busy
visitors and phone users get the same content quickly.

Agreed with the user (2026-11-21):

- **Main building: the Developer's Studio**: a cosy interior where every object is a portfolio
  section (see M7).
- **Phones: touch controls + a quick view**: tap to walk and interact, plus a "Résumé" button
  that shows everything as a clean page on any device.
- **Compact island, about 96×96**: short walks, but beach, lake and dock, forest, cliffs, a
  flower meadow, the village and the studio all within reach.
- **Seeds stay**: the island is still generated from a seed. We pick the best-looking seed as
  the default (baked), and **R** generates another island to look at. Every generated island
  always has the village and the studio, so the portfolio is there whatever the seed.
  R works for visitors too (decided 2026-11-21).

## Milestones

Each milestone follows the working agreement: short plan → OK → build → check → docs → commit →
report.

### M5 — Portfolio content ✅ (2026-11-21)

- One easy-to-edit content file with the CV data: profile, projects (role, description, tech,
  screenshots, store and repo links), skills, experience, achievements, education, contact.
  Filled from Charles's CV (to be provided).
- A rich in-game panel for it (title, text, images, links, paging), opened by interactions;
  keyboard and touch friendly. The plain message box stays for short lines.

### M6 — Interiors ✅ (2026-11-21, the cottage)

- Walk through a door into a room and back out (fade transition, spawn by the door, camera
  bounds per room). The world becomes "a set of maps" (island + interiors).
- Interior art: wooden floor, walls and windows, rugs, furniture; lighting follows day/night
  (warm lamps inside at night).

### M7 — The Developer's Studio ✅ (2026-11-21, placeholder texts until M5)

- A new landmark building on the island (bigger than the village houses, its own style) whose
  door leads into the studio interior. The village and studio are always generated together.
- Interactable objects, each opening a portfolio section:
  - 💻 desk with laptop: about me
  - 📱 wall of framed phones: one per app/project
  - 📚 bookshelf: skills and tech stack
  - 🗓️ timeline board: work experience
  - 🏆 trophy shelf: achievements and numbers
  - 🎓 framed certificates: education and certifications
  - 📮 post desk / phone: contact links and CV download

### M8 — Compact island and the default seed ✅ (2026-11-21, seed 46)

- Island size about 96×96; generation tuned so every seed fits beach, lake + dock, forest,
  cliffs, a meadow, the village and the studio within short walks.
- Validation guarantees the studio and village exist and are reachable on every seed.
- Pick the best seed with the user; bake it as the default island.
- R (and a dice button) opens a new island for every visitor; Home goes back; `?seed=` links.
- Done except the studio, which arrives with M7 (its validation then too).

### M9 — Guidance ✅ (2026-11-21, no guide villager)

- Villagers give hints about the studio (a few lines each, varied), instead of only "Hi!".
- A signpost at the village gate and near the start; optionally a guide villager by the spawn.
- A soft marker over the studio until it has been visited (remembered locally).

### M10 — Phones and the quick view ✅ (2026-11-21; real-phone check by Charles)

- Touch controls: tap to walk (path to the tapped tile), tap to interact; better portrait
  framing; drop the "Best played with a keyboard" notice.
- "Résumé" quick view: all portfolio content as a clean, responsive page or overlay with a CV
  download; also readable by search engines.
- Link previews when shared (title, description, image); performance check on real phones.

### M11 — Launch

- Make `og:image` (and add `og:url`) absolute once the domain is known.
- Hosting and deployment (e.g. Vercel, Netlify or GitHub Pages), a custom domain if available,
  optional privacy-friendly analytics.
- Final content pass with Charles, accessibility pass, a launch checklist.

## Later ideas

Not planned yet; kept for after launch.

- Ambient audio: waves, birds, footsteps per ground type
- Stars at night (fireflies and lanterns are in)
- More scenery: a lighthouse on the coast, benches, a stream with a bridge
- Saving (position, visited places)
- Gamepad support
- Minimap from the registries' `mapColor`
- Per-tile hashed randomness in scatter steps, so local edits don't reshuffle rocks, trees and
  flowers elsewhere on re-bake
- Visual map editing (e.g. Tiled JSON import/export)
- More games on the site (the island page has no site menu by design)
- Move to three r183+ once a stable `@react-three/fiber` stops using `THREE.Clock` (D9)
- TypeScript 7 once typescript-eslint supports it; typed linting (`strictTypeChecked`)

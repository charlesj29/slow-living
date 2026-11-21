# Progress

## Current status

- **Milestone:** M4 — Polish & handover ✅ complete. **All milestones (M0–M4) delivered.**
- **What works:** opening the site (`/`, tab title "chilling") shows a "Cooking…" loading
  screen, then drops you in front of the cabin on the baked 96×96 island, full screen with
  no site chrome. Walk with WASD/arrows, run with Shift, zoom with +/− (starts three steps out,
  the user's preferred view). The controls hint fades after your first steps. F3 shows FPS and
  your tile (dev and production). R or the dice button (top-left) visits a random generated island
  (`/?seed=N`, shareable); Home returns to the default island. On phones: tap to walk and interact, + / − zoom buttons, a closer camera. Every other address
  redirects to `/`. Production console is empty; ~240 FPS on GPU (headless, uncapped);
  renderer memory stays flat across regenerations. Smooth character animation (walk, run,
  breathing, blinking) and looping chill music composed in code (top-left mute button / M).
- **Visual overhaul complete** (user request, `pixel_art_visual_overhaul_prompt.md` + a cozy
  16-bit reference image, style only): soft shadows, calmer grass with dithered patches,
  natural paths, leaf-cluster trees + a giant forest tree, a 6×4 reference-style cottage,
  refined explorer with idle breathing, props by the house, stumps and branches, rocky coastal
  ledges, warm palette. The user approved it.
- **Portfolio roadmap (2026-11-21):** M6 Interiors ✅ (walk into the cottage; village house
  doors are locked). M8 Compact island ✅ (96×96, default seed 46, R / dice / Home and
  shareable `?seed=` links for everyone). M7 Developer's Studio ✅ (placeholder texts until
  the CV arrives). M9 Guidance ✅ (villager hints, signposts, studio marker). M5 Portfolio content ✅
  (Charles's CV in the studio's panels). M10 Phones + quick view ✅ (tap to walk, phone
  framing, Résumé page, link previews). **Next:** M11 launch (hosting, domain); agree with the
  user first. Real-phone check is the user's.
- **M4 follow-ups resolved (2026-11-21):** the user measured ~240 FPS with F3 on their laptop;
  the project is pushed to GitHub `origin/master` (the only branch; `main` no longer exists). Push only
  when the user asks. **Next:** pick new work from `docs/ROADMAP.md` with the user.

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
  unless `?seed=` given, seed shown in the HUD). Since M8 visitors can also open generated
  islands (R, dice button, `?seed=`); the baked seed-46 island is home. No seed on screen.
- Map size 96×96 since M8 (first 192×192; brief: 128×128), compact so the portfolio is a short walk; the map format must
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
  asked for collision tiles too, dev only).
- Controls hint fades after the first walk; no seed or place name on screen; tab title
  "chilling"; loading text "Cooking…" / "Doing its magic…"; touch devices get a keyboard notice.
- Bigger cabin pinned with an authoring anchor (5×3, then a 6×4 reference-style cottage in
  the visual overhaul); camera starts three zoom steps out.
- Visual overhaul (2026-11-21): art stays drawn in code; a 6×4 reference-style cottage (door on
  the same trail tile); props by the house, stumps and fallen branches, rocky coastal ledges;
  the explorer keeps its design with refined style (softer outline, soft shadow, breathing).
- Background music composed in code (no files, no licences); mute button top-left plus M.
- The village is generated per seed: an irregular fenced outline, 2–3 tiles of space before
  the fence, the gate on the side facing the nearest trail; villagers are three new characters
  (farmer, girl, baker).
- A small fenced village north-west of the cottage (gate onto the trail): 3 houses 5 tiles wide
  around a green (stone/slate, log/moss, plaster/thatch), a well, haystacks, lamp posts that
  glow at night, a vegetable patch, flower pots, crates, barrels, stumps; 3 villagers who wander
  only inside the fence, avoid each other and (since M9) hint at the studio (no reply choices).
- Day/night: a full day is 12 minutes; a top-left button (above music) cycles Auto / Always
  day / Always night; the F3 readout (top-right) also shows the time.
- Interaction with Space (first E, changed by the user); a small down-arrow marks what you can
  interact with; messages have no reply choices and show a blinking ▼. Mailbox: "It's empty.".
- Features chosen by Claude (user delegated): trails, lake dock, rocks; smooth shorelines in
  M2. A stream was rejected because the brief requires the lake not to touch the sea.

## Session log

### 2026-11-22 — Message text at the top; day length easy to find (user request)

- The message box keeps its steady size, but the text now starts at the top (a one-line message
  sits where a two-line one starts) and the blinking ▼ stays bottom-right.
- `dayNight.dayLengthSeconds` in `core/config.ts` is spelled out with a note (real seconds for
  one full day); the user sets the value.

### 2026-11-22 — "Workspace" everywhere, a bigger message box on desktop (user request)

- Visitor-facing text says "workspace": villager hints (now describing the log lodge with the
  cedar roof and carved sign), the building's name ("Charles's Workspace"), the small
  fireplace's line, image alt texts. Code names (`studio`) stay.
- The message box is larger on desktop (`min-width: 900px` with hover): bigger text, wider,
  more padding, a bigger "more" arrow; phones keep the compact box.
- **Verified:** typecheck, lint, tests, build; browser: the sign's message on desktop and in
  phone emulation.

### 2026-11-22 — Sign names (user request)

- Signposts read "Charles's Cottage", "Charles's Workspace" (the studio) and "The Village"
  (`SIGN_LABELS` in `core/content/guidance.ts`).

### 2026-11-22 — Rounder rabbits with three views, solid; Space-only standing (user request)

- Rabbits are drawn from soft shapes (plump body, round head level with it, ears, cotton tail)
  with an automatic outline, in three views: side (left/right), front (hopping towards the
  viewer) and back (hopping away), each with sit, twitch, two nibble and four squash-and-stretch
  hop frames. They face the way they hop (`RabbitFacing`).
- One white and one brown; their meadow keeps `buildingClearanceTiles` (4) from every building.
  Rabbits are solid (`bumpsIntoRabbit`), never hop onto the player's tile, flee to the free
  neighbouring tile furthest from the player, and after a blocked hop wait a moment
  (`waitTime`) instead of re-rolling their pose every step (the stutter).
- Benches: only Space stands up (a tap too, so phones aren't stuck).
- **Verified:** typecheck, lint, tests, build; sprite sheet of all frames; browser: both rabbits
  away from buildings (side and front views); console clean.

### 2026-11-22 — Wild rabbits, sitting on benches (user request)

- **Rabbits:** two white and two brown (`core/systems/rabbits.ts`, `assets/paintRabbits.ts`,
  `render/RabbitSprites`) live in a meadow 3–9 tiles outside the village (`rabbitMeadow`). They
  idle (sit with an ear twitch, nibble, sit alert), hop a few tiles one tile at a time, and hop
  away from the player. Hand-drawn 16×16 frames: sit, twitch, two nibble frames and a four-frame
  hop (crouch, push off, airborne, land) with a 3 px arc while the shadow stays down. Config:
  `rabbits` (counts, meadow distance, hop timing, flee radius; `enabled`).
- **Benches:** Space (or a tap) on a bench sits down on it (`interaction: { sit: true }`): the
  player moves onto the seat facing out, in a new sitting frame (`PLAYER_FRAMES.sit`: the thigh
  rows dropped), drawn lifted onto the seat with no shadow. Any direction, Space or a tap stands
  up where the player was.
- **Verified:** typecheck, lint, tests (bench and rabbit tests), build; browser: sitting on the
  cottage bench, rabbits round the village (nibbling); console clean.

### 2026-11-22 — No vegetable patch, a studio fireplace, arrows on signs (user request)

- The cottage's vegetable patch is left out for now (the `crops` kind and art stay).
- The studio has a small fireplace (`fireplace_small`, 1×1) between the phone shelf and the
  timeline; it flickers on the fire clock and glows at night.
- Signposts show drawn arrow icons instead of compass words: the text carries
  `[[arrow:<heading>]]` markers (`arrowToken` in `core/systems/compass.ts`) and `ui/DialogBox`
  draws a pixel arrow rotated to the heading (arrow characters render badly in system fonts).
  Villager hints keep words. The controls list hides while a message is open.
- **Verified:** typecheck, lint, tests, build; browser: the cottage sign with arrows, the
  studio fireplace; console clean.

### 2026-11-22 — Single-storey cottage and log-lodge studio (user request)

- The studio is now a compact, single-storey log lodge (112×80): cedar shingle roof, stone
  chimney, a porch with posts, railings, a bench and two lanterns, a carved "</>" sign on the
  wall; no glass wall or modern parts. The cottage is single-storey too (96×80): a flatter
  gable without the attic window, lower roofs, the same canopy, windows and steps. Smoke and the
  sprite-size test follow the new chimney and size.
- **Verified:** typecheck, lint, tests, build; browser screenshots of both.

### 2026-11-22 — Diverse village houses, a modern studio, a cosier cottage (user request)

- **User choices:** four village house styles in a pool (stone farmhouse, log cabin with porch,
  round thatched cottage, baker's shopfront), three picked at random per island; a modern-cosy
  studio; a cosier cottage.
- **Done (D65):** `assets/paintHouses.ts` paints each style with its own shape (hipped slate
  roof and porch posts with ivy; side-gabled mossy roof with porch railing, rocking chair and
  firewood; rounded thatch dome with a round window and leaning chimney; tiled roof over a yellow
  shop with an awning, bread in the window and a hanging sign), from shared parts in
  `assets/paintHouseParts.ts`. New kind `house_bakery` ("Closed for today. Fresh bread
  tomorrow!"); `village.houses` (3) picks from `VILLAGE_HOUSE_KINDS`. The studio
  (`assets/paintStudio.ts`): slanted shed roof with a solar panel, flue and antenna, board
  cladding, a big glass window wall with a lamp and a desk inside, a glass-panelled door, a
  "</>" sign that glows like neon at night. The cottage gets a tiled canopy over the door with a
  hanging basket; `decorateCabin` adds a bench by the steps and a vegetable patch at the side.
  `assets/cottageStyle.ts` (the shared cottage look) is gone. Seed 46 re-baked (village: the
  baker's, the thatched cottage and the log cabin).
- **Verified:** typecheck, lint, tests, build; a sprite sheet of all buildings and browser
  screenshots of the cottage, studio and village; console clean.

### 2026-11-22 — Zoom switch, animals off (user request)

- `render.zoomEnabled` in `core/config.ts`: false keeps the camera at the default framing and
  hides the zoom controls (keys ignored, no phone buttons, no zoom line in the hint). On (true)
  for now; the user tweaks it.
- `animals.enabled: false`: no chickens or cat in the village; the code, art and tests stay
  (the tests switch them on).

### 2026-11-22 — Neutral portfolio wording (user request)

- The studio's texts use neutral, product-style sentences (no "I", no "Charles"), Title Case
  subtitles and short feature bullets, following the user's own Tokoplas text. A test enforces
  it; CLAUDE.md records the preference.

### 2026-11-22 — An open, livelier village (user request)

- **User choices:** an open village (no ring fence) around a plaza, with little garden fences per
  house; animals, chimney smoke (plus string lights) and a market stall with benches.
- **Done (D64):** `placeVillage` rewritten: the village area is recorded but unfenced; each
  house has a picket-fenced front garden with flowers; a 3×3 paved plaza (with a free ring when
  possible) has string lights, the well, a market stall to one side and benches; paths run from
  every door to the plaza and on to the nearest trail; the entrance (stored as `village.gate`)
  is where that path leaves the village. House lots now include two roof rows; villagers and
  animals keep off the strips behind houses (`wanderTiles`). New objects `bench`,
  `market_stall`, `string_lights` (`assets/paintPlaza.ts`); three chickens and a cat
  (`core/systems/animals.ts`, `assets/paintAnimals.ts`, `render/AnimalSprites`); chimney
  smoke (`assets/paintSmoke.ts`, `render/ChimneySmoke`). Validation: paving under an object
  (the well) no longer counts as an unreachable trail. Seed 46 re-baked; seeds 1–30 all get a
  village with a 3×3 plaza (25 with a market stall).
- **Verified:** typecheck, lint, tests, build; browser: the open village, plaza, gardens, cat
  and chickens, smoke from the chimneys; console clean.

### 2026-11-21 — Cottage-style houses and studio (user request)

- `assets/cottageStyle.ts`: the cottage look as a spec-driven painter (tiled or thatched back
  roof, timber-framed front gable over the door, shuttered windows with flower boxes, stone base
  and steps, chimney, lantern). The three village houses (80×80, stone/slate, log/moss,
  plaster/thatch) and the studio (112×96, teal roof, skylight, "</>" sign over the door) use it;
  footprints unchanged. Chimney tops are exported for smoke.
- **Verified:** typecheck, lint, sprite tests, build; browser screenshot of the village and studio.

### 2026-11-21 — Fireplace flames (user request)

- The cottage fireplace flickers: a 4-frame flame strip (`FIRE_FRAME_COUNT`) on its own clock
  (`render.fireFrameSeconds`, 0.14 s) through a second sprite/lights material pair in
  `WorldObjects`; night-light overlays now keep every frame, so the glow flickers too.
- **Verified:** typecheck, lint, tests, build; two screenshots in the cottage show different frames.

### 2026-11-21 — F3 camera readout, controls list (user request)

- F3 also shows the camera: zoom level (pixel scale), zoom step and tiles on screen (`CameraInfo`
  in the store, set by `FollowCamera` when it changes), ready for min/max camera limits later.
- The controls hint is a list (key, action) in the bottom right that dims to 45% after the
  first steps instead of disappearing; on phones the zoom buttons sit above it.
- **Verified:** typecheck, lint, tests, build; browser (desktop with F3, phone emulation).

### 2026-11-21 — M10 Phones and the quick view (portfolio roadmap)

- **User choices:** tap to walk; a Résumé button with an overlay (the site stays one page); link
  previews titled "Charles Jonathan · Software Engineer (Flutter)" (tab title stays "chilling").
  Camera: on phones, the framing the user found perfect (three zoom steps in).
- **Done (D63):** `core/systems/tapToWalk.ts`: a tap (or click) on a tile plans an A* route
  and what to do on arrival (stop, interact, or step into a door); taps just above a small
  interactive thing (villager, sign, mailbox) count for it; keys cancel a walk; a tap turns the
  page of an open message. `render/TapToWalk` turns pointer taps into map points. Phones: the
  camera aims for ~18 tiles across (any pixel density), + / − buttons (zoom offset moved to the
  store), bigger buttons, a touch controls hint; the keyboard notice is gone. The top-left
  buttons are one column. `ui/ResumeView`: the whole portfolio on one scrollable page (game
  paused). `index.html`: description, Open Graph / Twitter preview with `public/og-image.jpg`,
  and (from `core/content/portfolioHtml.ts` via a Vite plugin) schema.org Person data and a
  `<noscript>` copy of the portfolio.
- **Verified:** typecheck, lint, tests, build pass; phone emulation (390×844, touch): framing,
  tap the mailbox (reads it), tap to close, tap the studio (walks in), tap a phone (opens the
  project), Résumé scrolls with all sections; ~240 FPS on the GPU (uncapped); desktop unchanged
  (keyboard hint, no zoom buttons); console clean. Not tested: a real phone, landscape.

### 2026-11-21 — Collapsible project screenshots (user request)

- Each project's screenshot sits behind a "Show screenshots" toggle (collapsed at first, a
  native `<details>`; the image downloads only when opened; the label turns to "Hide
  screenshots").
- **Verified:** typecheck, lint, tests, build pass; in the browser: collapsed with the image not
  loaded, opens and loads on click, label switches; console clean.

### 2026-11-21 — Portfolio wording and contact (user request)

- About me in the third person, short and relaxed; simpler project texts; Poly's page says
  Charles mainly built its brain (the LLM side). LinkedIn removed. Contact: an Email button that
  copies the address (with an "Email copied" notice) and a WhatsApp button (wa.me link with his
  number, his choice). The GEOMATE paper links to its download. A sixth project, "This island"
  (AI-generated / vibe coded), with a screenshot; the wall now has six phones on a display
  shelf, drawn as real phones with tiny app screens (the last shows the island).
- **Verified:** typecheck, lint, tests, build pass; in the browser: the six phones, the island
  project with its screenshot, Email copies and shows the notice, WhatsApp links to the number;
  console clean.

### 2026-11-21 — M5 Portfolio content (portfolio roadmap)

- **Input:** Charles's CV (PDF) and four screenshot sets (Tokoplas, Poly, Seller, Driver apps).
  User choices: blur other people's details in the screenshots; show email + LinkedIn (no
  phone number on the site); offer this CV PDF for download; store links for the Tokoplas app.
  Only the studio changes.
- **Done (D61):** `core/content/portfolio.ts` holds the portfolio (about, five projects, skills,
  experience, highlights, education + publication, contact), all from the CV. Studio pieces
  now open a panel (`ui/PortfolioPanel`: title, details, bullets, tags, screenshot, links;
  ←/→, Space/Enter, Esc, buttons). Each framed phone opens its own project (frames recoloured
  per app). Screenshots blurred (names, phone number, email, addresses), scaled and encoded as
  WebP in `public/portfolio/` with the CV PDF.
- **Verified:** typecheck, lint, tests, build pass; in the browser: phone frame 3 → Tokoplas
  Seller with its screenshot, paging with the arrows, Space through to close, Esc, the contact
  panel with email, LinkedIn and the CV download (served as application/pdf); console clean.

### 2026-11-21 — M9 Guidance (portfolio roadmap)

- **Done (D60):** villagers have three conversations each that take turns, the first one
  pointing to the studio with a compass direction worked out for the island
  (`core/content/guidance.ts`, `core/systems/guidance.ts`). Signposts answer: the cottage's
  sign and a new one outside the village gate (`placeSignposts`) list the landmarks and their
  directions ("The Developer's Studio: east"). A gold star floats over the studio until the
  first visit, remembered in the browser. No guide villager (user choice). Seed 46 re-baked.
- **Verified:** typecheck, lint, tests, build pass; in the browser: the star over the studio,
  the cottage sign's text, the star gone after a visit (remembered); console clean. Villager
  hints are covered by unit tests (walking up to a wandering villager isn't scriptable).

### 2026-11-21 — M7 The Developer's Studio (portfolio roadmap)

- **User choices:** short placeholder texts until the CV arrives; a cosy workshop look (bigger
  than the village houses, sign over the door); no guide villager (M9).
- **Done (D59):** a `studio` building (7×4: plank walls on stone, teal shingle roof with a
  skylight and chimney, workshop windows, a "</>" sign and a lantern; glass glows at night)
  placed by a new `placeStudio` step near the cottage, with a path to the trails; validation
  `studio-missing`. The studio interior (17×12) holds the seven portfolio pieces: framed
  certificates, a wall of framed phones and a timeline board on the back wall (new
  `wallMounted` flag), a tech bookshelf, a trophy shelf, a desk with a laptop and a post desk.
  Messages now have pages (Space turns them); the pieces' texts live in `core/content/studio.ts`.
  Seed 46 re-baked: the studio stands in the meadow east of the cottage.
- **Verified:** typecheck, lint, tests, build pass; seeds 1–48 all get a studio; in the
  browser: walk to the studio, enter, read the laptop (two pages, then closed), night view;
  console clean.

### 2026-11-21 — M8 Compact island and the default seed (portfolio roadmap)

- **Done (D58):** the island is 96×96 (generation retuned: more land, island-scale noise
  doubled, smaller lake and village, wider village search). New validation rule
  `village-missing`, so every seed has the village (retries with derived seeds). New authoring
  tool `npm run overview:island` (contact sheet PNG). Default island: seed 46 (chosen by me,
  as the user asked: village west of the cottage, lake and dock just south, forests round the
  edge, an open meadow east for the studio). R, a dice button and a Home button (top-left,
  with a fade) work for every visitor; generated islands are `/?seed=N` links.
- **Verified:** typecheck, lint, tests, build pass; seeds 1–48 all valid with a village; in the
  browser: home island, dice → new seed + Home button, Home → `/`, R from inside the cottage;
  console clean.

### 2026-11-21 — M6 Interiors (portfolio roadmap)

- **Done (D57):** the game holds a set of maps (`GameState.maps`: the island plus every room in
  `core/world/interiors.ts`). Walking up into a door whose building has `interior` fades out,
  swaps the map and fades in just inside (`core/systems/doors.ts`, `core/game/mapTravel.ts`);
  stepping on the doormat goes back out in front of the door. First room: the cottage (14×10:
  bookshelf, fireplace, bed, floor lamp, rug, table and chairs, plants). New tiles floor, wall,
  doormat; walls pick upper/lower/top art from their neighbours. Indoors the night is warm
  lamplight, not blue; the fire and lamp glow. The camera zooms in until the room fills the
  screen and snaps on door jumps. Village house doors say "It's locked. Someone lives here."
  (buildings answer only at their door). Villagers only exist on the island map.
- **Verified:** typecheck, lint, tests, build pass; in the browser: into the cottage, night
  inside, back out; console clean.
- **Next:** M8, after the user's OK.

### 2026-11-21 — New direction: the island becomes Charles's portfolio (discussion)

- **Goal:** the site is an interactive portfolio for Charles, a mobile engineer. Agreed: a
  Developer's Studio as the main building (interior with interactable portfolio sections),
  touch controls + a quick "Résumé" view for phones and busy visitors, a compact ~96×96 island,
  seeds kept (best seed baked as default, R to generate another; every seed has village +
  studio). Open: whether R is for visitors too. Charles will provide his CV.
- **Roadmap rewritten** (docs/ROADMAP.md): M5 content, M6 interiors, M7 studio, M8 compact
  island + default seed, M9 guidance, M10 phones + quick view, M11 launch.
- **Decided later:** R (a new island) is for visitors too; M6 first, then M8.

### 2026-11-21 — Small update (user request)

- F3 readout moved back to the top-right; the village no longer has a vegetable patch (the crops
  kind and art remain, unused). Map re-baked: only village decorations moved.
- **Verified:** typecheck, lint, 321 tests, build pass; F3 sits top-right in the browser.

### 2026-11-21 — Random village outline and new villagers (user request)

- **Done (D56):** `generation/villagePlan.ts` (random size, notched corners, fence, spread-out
  houses with a 2–3 tile gap); `placeVillage` rewritten (best site, gate towards the nearest
  trail, A* door paths, rule-based decorations with a reachability check); `World.village`
  (interior spans + gate) in the map file; villagers walk the recorded interior; three new
  villager characters in `assets/villagerParts.ts` via a generalised `buildCharacterMaps`.
- **Verified:** typecheck, lint, 321 tests (new: fence encloses the inside with one gate on a
  path, houses keep 2+ tiles from the fence, no decoration on a path, outline and gate side vary
  across seeds, deterministic per seed), build pass; browser: seed 1 plus dev previews of seeds
  7 and 13 (different outlines and gate sides); villager sprite sheets checked; console clean.

### 2026-11-21 — Village improvements (user request)

- **Done (D55):** fenced village (one gate to the trail) with houses around a green; houses
  5×3 (80×64, symmetric); decorations: well, haystacks, lamp posts (glow at night), crops,
  flower pots, crates, barrels, stumps (`assets/paintVillageProps.ts`); `litAtNight` registry
  flag; villagers avoid each other's tiles and destinations and detour instead of waiting.
- **Verified:** typecheck, lint, 314 tests (new: two villagers meeting head-on both get past),
  build pass; browser screenshots of the new village; console clean.

### 2026-11-21 — Part 3 of 3: the village and villagers (user request)

- **Done (D54):** house kinds + `assets/paintHouses.ts`; `core/world/village.ts` (layout, wander
  area, spawns); `steps/placeVillage.ts` (clear site, houses, lane, link to nearest trail) +
  `objectLayerWithout`; validation checks every house door; map re-baked from seed 1 (23 tiles,
  4 rocks + 2 bushes cleared; trees, trails, dock, spawn unchanged); `entities/villager.ts`,
  `systems/wander.ts` (rest, A* inside the village, mutual blocking, talking); interaction
  targets villagers ("Hi!"); villager outfits as palette swaps; `render/CharacterSprite` shared
  by player and villagers, `render/VillagerSprites`.
- **Verified:** typecheck, lint, 313 tests (incl. villagers never leaving their area or walking
  into the player, baked village present), build pass; browser: village at day and night (lit
  windows), villagers wandering, Space next to a villager shows "Hi!" and they turn to face you;
  console clean.
- **Next:** wait for the user to try it; nothing pushed since the user asked last.

### 2026-11-21 — Part 2 of 3: day/night cycle (user request)

- **Done (D53):** `core/systems/dayNight.ts` (time, keyframed lighting, modes, clock label);
  `GameState.timeOfDay`; shared lighting uniforms in every material; `render/DayNightLighting`
  (eased, tints the background); window-light overlays for buildings (`assets/paintLights.ts`,
  `createLightsMaterial`); `ui/DayNightToggle` (top-left, above music; remembered); F3 moved
  bottom-left with a time line.
- **Verified:** typecheck, lint, 308 tests, build pass; browser screenshots of always-day,
  always-night (blue tint, lit windows) and dusk in Auto (warm tint, lights on); console clean.
- **Next:** part 3, the village and villagers.

### 2026-11-21 — Part 1 of 3: interaction with E (user request)

- **Plan agreed with the user (three parts, committed separately):** 1) E interaction and the
  mailbox; 2) day/night cycle with a mode button above the music button (Auto / Always day /
  Always night), F3 readout moved bottom-left; 3) a small village of 3 houses near the cottage
  with 3 villagers who wander inside it and say "Hi!". Messages have no reply choices.
- **Done (D52):** one-shot presses in `shared/engine/input`; `core/systems/interaction.ts`
  (reach in the facing direction); `GameState.interactTarget` / `dialog`; mailbox message;
  `render/InteractPrompt` (floating "E" keycap from `assets/paintUi.ts`); `ui/DialogBox`;
  controls hint now lists E.
- **Verified:** typecheck, lint, 302 tests, build pass; browser: turning to the mailbox shows
  the E bubble, E opens "It's empty.", E again closes it; console clean.
- **Follow-up (user):** interact moved to Space; the "E" bubble became a small down-arrow; the
  dialog shows a blinking ▼ instead of the key; the mute button drops focus after a click.
- **Next:** part 2, the day/night cycle.

### 2026-11-21 — Side-view animation and a lo-fi music rebuild (user request)

- **Why:** walking/running sideways looked sloppy (the running legs seemed not to move), and
  the music sounded broken/stuttering; the user asked for full lo-fi with a seamless loop.
  Choices: a 32-bar loop; a soft tape hiss as texture.
- **Done:**
  - Animation (D50): `assets/sideLegs.ts` draws side legs from foot positions; new 8-frame
    side walk and run where the legs swap each step; arms swing against the near leg. After
    feedback that the feet kicked too high, feet lift at most one pixel.
  - Music (D51): new tune in `assets/chillTune.ts`; `shared/audio` gains `musicGraph.ts`
    (mix shared by the player and offline tests) and `ticker.ts` (Web Worker timer);
    click-free envelopes, gentle compression, hiss instead of crackle, 3 s fade-in.
- **Verified:** typecheck, lint, 296 tests, build pass; side frames checked as text and as
  enlarged sprites; the full loop rendered offline in Chrome (steady levels, seamless seam,
  no clicks); live in the browser: music starts on a key press, M toggles, console clean.

### 2026-11-21 — Smooth character animation and chill music (user request)

- **Why:** the idle and walk/run animation felt sloppy; the user also wanted royalty-free
  looping music with a mute button (chose: composed in code, button top-left).
- **Done:**
  - Animation (D48): `assets/playerFrames.ts` composes 19 frames per direction from the
    existing parts (`playerPixels.ts`, plus new leg poses and pumping arms); 1 px body bob,
    lifted knee, airborne run frame, side-view lean; cycles advance by distance walked (no foot
    sliding; walking in place against obstacles); a slow breath and a blink when idle.
  - Music (D49): `src/shared/audio` (song timing, synth voices, music player) and
    `assets/chillTune.ts` (an original 16-bar lo-fi loop); `ui/MusicToggle` (top-left button,
    M, remembered); "M: music" added to the controls hint.
- **Verified:** typecheck, lint, tests, build pass; sprite sheets checked frame by frame;
  browser: the button and M toggle mute and the choice is stored, console clean; the tune
  rendered offline in Chrome has steady levels (RMS 0.08–0.12), peak 0.46, no gaps.

### 2026-11-21 — Visual overhaul, Phase 5: test and refine (user request)

- **Compared with the reference** at the default gameplay zoom and close up. Fixes: rocks moved
  from cool blue-grey to warm greys (they read as clutter against the warm palette); grass
  patches a touch softer (`render.grassPatches.shade` 0.9 → 0.92).
- **Gameplay re-tested in the browser** (F3 tile readout): the flower pot blocks the way left
  of the door; the trail leads down onto the dock and stops at its end (115, 119); the
  stepping stones are walkable and the yard fence stops the player. Ledges block, their beaches
  are reachable (validation). Controls, zoom, F3 and the hint unchanged.
- **Verified:** typecheck, lint, 281 tests, build pass; console clean; ~240 FPS on GPU.
- **Remaining limitations:** ledges are one tile high (no raised plateaus or stairs); the
  lake's deep/shallow boundary still steps per tile; the dense forest canopy repeats a few
  crown variants; stepping stones pick their layout by position hash, so neighbours can match.

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

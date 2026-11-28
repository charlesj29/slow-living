# What you can configure

Almost everything lives in one file: **`src/games/island/core/config.ts`**.
Change a value, save, and the page updates (`npm run dev`).

**Times of day** are fractions of a day: `0` = midnight, `0.25` = 6 AM, `0.5` = noon,
`0.75` = 6 PM. **Distances** are in tiles (one tile = 16 pixels) unless the name ends in `Px`.

## Quick switches

| Setting                             | What it does                                                     |
| ----------------------------------- | ---------------------------------------------------------------- |
| `render.zoomEnabled`                | Allow zooming with + / − (and the phone zoom buttons).           |
| `touch.controls`                    | Phones: the slide-stick (walk) and the small interact button.    |
| `touch.tapToWalk`                   | Phones: tapping the screen walks there too (off: stick only).    |
| `pointer.clickToWalk`               | Click the screen to walk there (phones always tap to walk).      |
| `tour.enabled`                      | The slow camera tour after a minute without input.               |
| `debug.showClock`                   | The clock at the top right.                                      |
| `debug.alwaysShowFps`               | Always show the FPS, on the live site too (F3: dev server only). |
| `debug.fpsOnly`                     | F3 shows only the FPS (`false`: also tile and camera).           |
| `rabbits.enabled` / `ducks.enabled` | The rabbits near the village / the ducks on the lake.            |
| `animals.enabled`                   | The village chickens and cat (off).                              |

## Time, light and weather

| Setting                           | What it does                                                       |
| --------------------------------- | ------------------------------------------------------------------ |
| `dayNight.dayLengthSeconds`       | How long one full day lasts, in real seconds.                      |
| `dayNight.startTime`              | The time of day a visit starts at.                                 |
| `weather.min/maxClearSeconds`     | How long the dry weather lasts between showers.                    |
| `weather.min/maxRainSeconds`      | How long a shower lasts.                                           |
| `weather.rainTint`, `dropDensity` | How grey the light gets and how heavy the rain looks.              |
| `mist`                            | When the morning mist comes and goes, and how thick it is.         |
| `lanterns`                        | How spread out the lamp posts are when they light up at dusk.      |
| `breeze`                          | How much trees and grass sway, how windy it gets, drifting leaves. |
| `clouds`                          | How many cloud shadows drift by, and how fast.                     |

## Sound

| Setting                 | What it does                                                                                                                             |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `music.volume`          | Music volume (0 to 1).                                                                                                                   |
| `ambience.volume`       | Nature sounds volume, all together.                                                                                                      |
| `ambience.layerVolumes` | Each sound on its own: waves, birds, crickets, rain, fire, chimes, chatter (village voices), steps, bell. Set one to `0` to turn it off. |
| `ambience.bellTimes`    | When the village bell rings.                                                                                                             |

## Life on the island

| Setting                                                     | What it does                                                                          |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `villagerDay`                                               | Each villager's day: from which time they bake, sweep, fish, read, gather or go home. |
| `social`                                                    | How often villagers chat, wave at you and hum at their chores.                        |
| `villagers.walkSpeedTilesPerSecond`                         | How fast villagers stroll.                                                            |
| `rabbits`, `ducks`                                          | How many, how fast, and how shy they are.                                             |
| `butterflies`, `fireflies`                                  | How many, and how they fly or blink.                                                  |
| `player.walkSpeedTilesPerSecond` / `runSpeedTilesPerSecond` | How fast you walk and run.                                                            |
| `tour.idleSeconds`                                          | How long without input before the tour starts.                                        |

## The island's layout

The live island is a saved map file, so layout settings (`village`, `trees`, `lake`, `dock`,
`decorations`, ...) only change it after re-baking: run **`npm run bake:island`**. Re-baking
rebuilds the default island from its seed (`generation.authoringSeed`, 46) and replaces any hand
edits. Islands opened with the dice button use the settings straight away.

## Not in the config file

| What                            | Where                                        |
| ------------------------------- | -------------------------------------------- |
| Portfolio texts (the workspace) | `src/games/island/core/content/portfolio.ts` |
| What villagers and signs say    | `src/games/island/core/content/guidance.ts`  |
| The music                       | `src/games/island/assets/chillTune.ts`       |
| CV and screenshots              | `public/portfolio/`                          |

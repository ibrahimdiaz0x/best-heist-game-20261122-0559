# The Marlow Heist

[![make.fun bounty](https://img.shields.io/badge/make.fun-bounty-7c5cff)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![Prize $50](https://img.shields.io/badge/prize-%2450-gold)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![Game: The Marlow Heist](https://img.shields.io/badge/game-The%20Marlow%20Heist-darkgreen)](https://make.fun/bounty/best-heist-game-20261122-0559)

A top-down gallery heist for the make.fun bounty **"Make the best heist
game"**. One thief, one night, five pieces on display — the Star Sapphire
above them all — three guards walking their beats, two cameras sweeping
the hall, and a siren that climbs every second the thief is seen. Lift
all five pieces, then slip out the exit door before the gallery locks
down.

## How it plays

- **Move** with WASD or the arrow keys. **Shift** sneaks: slower, but
  the siren climbs half as fast while the thief is spotted.
- **Guards** patrol fixed beats with amber vision cones. **Cameras**
  sweep red cones across the wings. Walls and glass vitrines block sight
  as well as feet — read the cones, then move between sweeps.
- Being seen fills the **SIREN** meter; hiding drains it. At 100, or
  when a guard lays hands on the thief, the night ends in **CAUGHT!**
- The **exit door stays locked** until all five pieces are pocketed.
  Reach it after that for a **CLEAN GETAWAY**.
- The score is the haul plus a time bonus: every second spare against
  the 150-second par is worth 8 points.

## Layout

- `game/index.html` — the page; loads the game from `game/src/`.
- `game/src/level.js` — the gallery floor plan: walls, vitrines, loot,
  patrol beats, cameras, the exit door.
- `game/src/engine.js` — the rules, with no knowledge of the screen:
  the clock, movement, sight, the siren, the win and lose conditions.
- `game/src/autopilot.js` — the practice driver: it plans a route on a
  grid and waits out the cones, so the heist can be rehearsed clean.
- `game/src/render.js` — the painter: floor, cones, loot, HUD, screens.
- `game/src/main.js` — the browser bootstrap, keyboard input, and the
  staged scenes (`?scene=start|play|alarm|escape`).
- `main.ts` — the hand-in program: copies `game/` and `screenshots/`
  to the output directory and writes `dossier.json` with the kit's
  `buildDossier`.
- `serve.ts` — a tiny static server for local play-testing.
- `screenshots/` — four renders of the game's own code: title, mid-heist,
  alarm, getaway.

## Play it

```sh
node serve.ts --port 8080
```

Then open <http://127.0.0.1:8080> in desktop Chrome. Press Enter to
begin, R to run it again after a getaway or a capture.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

That writes `out/dossier.json` beside the copied `game/` and
`screenshots/` — the same bytes the scorer rebuilds from the entry.

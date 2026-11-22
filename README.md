# The Marlow Heist

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/ibrahimdiaz0x/best-heist-game-20261122/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/ibrahimdiaz0x/best-heist-game-20261122/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

A top-down stealth heist game that runs fully offline in a desktop browser. One night, one gallery, one thief: slip past the guards' amber vision cones and the sweeping red security cameras, lift the Star Sapphire from the vault, pocket the paintings, idol, pearls and mask on the way, and get out through the south door before the alarm meter fills.

## How to play

- **WASD / arrow keys** — move
- **Shift** — sneak (slower, but the alarm climbs half as fast and guards spot you from less far away)
- **Enter** — start · **P** — pause · **R** — restart after a bust or a getaway

Guards patrol the hall and the wings; step into an amber cone and the alarm climbs, get too close and they chase. Cameras sweep the vault door and the east wing — their red cones feed the alarm too. Stay unseen and the alarm drains. Get grabbed by a guard and the alarm jumps; at 100 the gallery locks down and the run is over. The exit stays locked until the Star Sapphire is in your bag.

## How to run it

```sh
node serve.ts
```

Then open http://localhost:8080. There is no build step and no network — the game runs entirely from its own files.

## What is inside

- `game/index.html` — the page and its canvas.
- `game/src/config.js` — tuning numbers and the gallery floor plan (walls, cases, loot, patrols, cameras).
- `game/src/world.js` — the rules: movement and wall collision, guard patrol and chase, camera sweeps, vision cones with line of sight, the alarm meter, loot and the exit.
- `game/src/render.js` — everything drawn: floor, carpet, cones, cases, loot, guards, cameras, the thief and the HUD.
- `game/src/input.js` — keyboard state.
- `game/src/shots.js` — the staged screenshot scenes (`?shot=start|play|alarm|escape`), each played forward from the real rules by a small autopilot.
- `game/src/main.js` — the frame loop, the screens, and screenshot mode.
- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to the output directory and writes `dossier.json`.
- `screenshots/` — four real renders of the game's own code.

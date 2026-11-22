# The Marlow Heist

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/ibrahimdiaz0x/best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/ibrahimdiaz0x/best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

A top-down stealth heist that runs fully offline in a desktop browser. One night, one gallery, one thief: slip past the watchmen's amber vision cones and the sweeping red security lenses, lift the Star Sapphire from the vault, pocket the paintings, idol, pearls and mask on the way, and get out through the south door before the siren meter fills.

## How to play

- **WASD / arrow keys** — move
- **Shift** — creep (slower, but the siren climbs half as fast and watchmen spot you from less far away)
- **Enter** — start · **P** — pause · **R** — restart after a bust or a getaway

Watchmen patrol the hall and the wings; step into an amber cone and the siren climbs, get too close and they chase. Lenses sweep the vault door and the east wing — their red cones feed the siren too. Stay unseen and the siren drains. Get grabbed by a watchman and the siren jumps; at 100 the gallery locks down and the night is over. The door stays locked until the Star Sapphire is in your bag.

## How to run it

```sh
node serve.ts
```

Then open http://localhost:8080. There is no build step and no network — the game runs entirely from its own files.

## What is inside

- `game/index.html` — the page and its canvas.
- `game/src/config.js` — tuning numbers and the gallery floor plan (barriers, vitrines, swag, patrols, lenses).
- `game/src/world.js` — the rules: movement and wall collision, watchman patrol and chase, lens sweeps, vision cones with line of sight, the siren meter, swag and the door.
- `game/src/render.js` — everything drawn: floor, carpet, cones, vitrines, swag, watchmen, lenses, the thief and the HUD.
- `game/src/input.js` — keyboard state.
- `game/src/random.js` — a seeded random source for deterministic scenes.
- `game/src/shots.js` — the staged screenshot scenes (`?shot=start|play|alarm|escape`), each played forward from the real rules by a small autopilot.
- `game/src/main.js` — the frame loop, the screens, and screenshot mode.
- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to the output directory and writes `dossier.json`.
- `screenshots/` — four real renders of the game's own code.

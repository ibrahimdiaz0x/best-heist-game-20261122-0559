// The screenshot scenes behind ?shot=start|play|alarm|escape. Each one plays
// the real rules forward from a fresh night for a fixed number of steps,
// steered by a small autopilot, so every frame is what a genuine run looks
// like and the same seed always gives the same frame. The autopilot finds
// its way with a breadth-first search over a coarse grid of the gallery
// (barriers and vitrines blocked), so it walks through doorways instead of
// stalling against a vitrine the way a greedy straight-line walk does.

import { BARRIERS, DOOR, ARENA, LENS, VITRINES, WATCHMAN } from './config.js';
import { openNight, advance } from './world.js';

const TICK = 1 / 30;
const START_WAIT = 5;
const PLAY_SPAN = 26;
const ALARM_WALK = 8;
const ALARM_STAND = 14;
const ESCAPE_LIMIT = 150;

const GRID = 32;
const COLS = Math.ceil(ARENA.width / GRID);
const ROWS = Math.ceil(ARENA.height / GRID);

function cellShut(col, row) {
  const x = col * GRID + GRID / 2;
  const y = row * GRID + GRID / 2;
  const margin = 16;
  for (const s of [...BARRIERS, ...VITRINES]) {
    if (x > s.x - margin && x < s.x + s.w + margin && y > s.y - margin && y < s.y + s.h + margin) {
      return true;
    }
  }
  return false;
}

function spotOf(x, y) {
  return {
    col: Math.max(0, Math.min(COLS - 1, Math.floor(x / GRID))),
    row: Math.max(0, Math.min(ROWS - 1, Math.floor(y / GRID))),
  };
}

// Breadth-first search from (fromX, fromY) to (toX, toY); returns the list
// of cell centres to walk through, or null when no route exists.
function planPath(fromX, fromY, toX, toY) {
  const start = spotOf(fromX, fromY);
  const goal = spotOf(toX, toY);
  const key = (c, r) => r * COLS + c;
  const cameFrom = new Map();
  const queue = [start];
  cameFrom.set(key(start.col, start.row), null);
  while (queue.length > 0) {
    const cur = queue.shift();
    if (cur.col === goal.col && cur.row === goal.row) {
      const cells = [];
      let node = cur;
      while (node) {
        cells.unshift({ x: node.col * GRID + GRID / 2, y: node.row * GRID + GRID / 2 });
        node = cameFrom.get(key(node.col, node.row));
      }
      return cells;
    }
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nc = cur.col + dc;
      const nr = cur.row + dr;
      if (nc < 0 || nr < 0 || nc >= COLS || nr >= ROWS) continue;
      if (cellShut(nc, nr)) continue;
      if (cameFrom.has(key(nc, nr))) continue;
      cameFrom.set(key(nc, nr), cur);
      queue.push({ col: nc, row: nr });
    }
  }
  return null;
}

function inLight(world) {
  const { x, y } = world.burglar;
  for (const guard of world.watchmen) {
    const dx = x - guard.x;
    const dy = y - guard.y;
    const dist = Math.hypot(dx, dy);
    if (dist > WATCHMAN.sight) continue;
    const facing = Math.atan2(dy, dx);
    let diff = Math.abs(facing - guard.face) % (Math.PI * 2);
    if (diff > Math.PI) diff = Math.PI * 2 - diff;
    if (diff <= WATCHMAN.halfCone) return true;
  }
  for (const lens of world.lenses) {
    const dx = x - lens.x;
    const dy = y - lens.y;
    const dist = Math.hypot(dx, dy);
    if (dist > LENS.sight) continue;
    const facing = Math.atan2(dy, dx);
    let diff = Math.abs(facing - lens.face) % (Math.PI * 2);
    if (diff > Math.PI) diff = Math.PI * 2 - diff;
    if (diff <= LENS.halfCone) return true;
  }
  return false;
}

// One step toward `goal`, creeping while lit by a cone. When a watchman
// gets close, the thief breaks off and backs away from them instead of
// walking into the patrol — the way a careful player waits a watchman out.
function pilot(world, goal) {
  let nearestGuard = null;
  let nearestDist = Infinity;
  for (const guard of world.watchmen) {
    const d = Math.hypot(guard.x - world.burglar.x, guard.y - world.burglar.y);
    if (d < nearestDist) {
      nearestDist = d;
      nearestGuard = guard;
    }
  }
  if (nearestGuard && nearestDist < 110) {
    const away = Math.atan2(world.burglar.y - nearestGuard.y, world.burglar.x - nearestGuard.x);
    return { dx: Math.cos(away), dy: Math.sin(away), creep: inLight(world) };
  }
  const route = planPath(world.burglar.x, world.burglar.y, goal.x, goal.y);
  let target = goal;
  if (route && route.length > 1) {
    // Skip cells already reached; aim at the next one past the thief.
    let i = 0;
    while (i < route.length - 1 && Math.hypot(route[i].x - world.burglar.x, route[i].y - world.burglar.y) < 20) i += 1;
    target = route[i];
  }
  const dx = target.x - world.burglar.x;
  const dy = target.y - world.burglar.y;
  const len = Math.hypot(dx, dy);
  if (len < 4) return { dx: 0, dy: 0, creep: false };
  return { dx: dx / len, dy: dy / len, creep: inLight(world) };
}

function nearestSwag(world) {
  let goal = null;
  let bestDist = Infinity;
  for (const item of world.swag) {
    if (item.taken) continue;
    const d = Math.hypot(item.x - world.burglar.x, item.y - world.burglar.y);
    if (d < bestDist) {
      bestDist = d;
      goal = item;
    }
  }
  return goal;
}

function runPilot(world, seconds, goalFor) {
  const steps = Math.floor(seconds / TICK);
  for (let i = 0; i < steps; i += 1) {
    if (world.fate !== 'running') break;
    const goal = goalFor(world);
    if (!goal) break;
    advance(world, pilot(world, goal), TICK);
  }
}

function idle(world, seconds) {
  const steps = Math.floor(seconds / TICK);
  for (let i = 0; i < steps; i += 1) {
    if (world.fate !== 'running') break;
    advance(world, { dx: 0, dy: 0, creep: false }, TICK);
  }
}

// The getaway dash: straight for the Star Sapphire, then the south door.
// Used by the escape scene (capped) and by the headless sim harness.
function dashForSapphire(world, maxSeconds) {
  runPilot(world, maxSeconds, (w) => {
    if (w.gemInBag) return { x: DOOR.x + DOOR.w / 2, y: DOOR.y + DOOR.h / 2 };
    const gem = w.swag.find((l) => l.key);
    return gem ?? { x: DOOR.x + DOOR.w / 2, y: DOOR.y + DOOR.h / 2 };
  });
  return world;
}

/**
 * Set `world` to the named scene and return the screen to draw over it.
 * start: the title over a fresh gallery. play: mid-heist, swag in hand.
 * alarm: the thief walks onto the hall watchman's patrol lane and stands in
 * the light while the meter climbs and a watchman closes in. escape: the
 * getaway itself — sapphire taken, thief at the south door.
 */
export function setScene(name, world) {
  if (name === 'play') {
    runPilot(world, PLAY_SPAN, (w) => nearestSwag(w) ?? { x: 640, y: 470 });
    return { screen: 'run' };
  }
  if (name === 'alarm') {
    runPilot(world, ALARM_WALK, () => ({ x: 640, y: 470 }));
    idle(world, ALARM_STAND);
    return { screen: 'run' };
  }
  if (name === 'escape') {
    dashForSapphire(world, ESCAPE_LIMIT);
    return { screen: world.fate === 'escaped' ? 'escaped' : 'run' };
  }
  // start (and anything else): a few seconds of the gallery settling.
  idle(world, START_WAIT);
  return { screen: 'menu' };
}

export { openNight };

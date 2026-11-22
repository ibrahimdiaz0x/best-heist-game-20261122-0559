// The screenshot scenes behind ?shot=start|play|alarm|escape. Each one plays
// the real rules forward from a fresh world for a fixed number of steps,
// steered by a small autopilot, so every frame is what a genuine run looks
// like and the same seed always gives the same frame. The autopilot finds
// its way with a breadth-first search over a coarse grid of the gallery
// (walls and cases blocked), so it walks through doorways instead of
// stalling against a display case the way a greedy straight-line walk does.

import { CAMERA, CASES, EXIT, FIELD, GUARD, WALLS } from './config.js';
import { createWorld, step } from './world.js';

const STEP = 1 / 30;
const START_SECONDS = 5;
const PLAY_SECONDS = 26;
const ALARM_WALK_SECONDS = 8;
const ALARM_STAND_SECONDS = 14;
const ESCAPE_LIMIT_SECONDS = 150;

const CELL = 32;
const COLS = Math.ceil(FIELD.width / CELL);
const ROWS = Math.ceil(FIELD.height / CELL);

function cellBlocked(col, row) {
  const x = col * CELL + CELL / 2;
  const y = row * CELL + CELL / 2;
  const margin = 16;
  for (const s of [...WALLS, ...CASES]) {
    if (x > s.x - margin && x < s.x + s.w + margin && y > s.y - margin && y < s.y + s.h + margin) {
      return true;
    }
  }
  return false;
}

function cellOf(x, y) {
  return {
    col: Math.max(0, Math.min(COLS - 1, Math.floor(x / CELL))),
    row: Math.max(0, Math.min(ROWS - 1, Math.floor(y / CELL))),
  };
}

// Breadth-first search from (fromX, fromY) to (toX, toY); returns the list
// of cell centres to walk through, or null when no route exists.
function findRoute(fromX, fromY, toX, toY) {
  const start = cellOf(fromX, fromY);
  const goal = cellOf(toX, toY);
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
        cells.unshift({ x: node.col * CELL + CELL / 2, y: node.row * CELL + CELL / 2 });
        node = cameFrom.get(key(node.col, node.row));
      }
      return cells;
    }
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nc = cur.col + dc;
      const nr = cur.row + dr;
      if (nc < 0 || nr < 0 || nc >= COLS || nr >= ROWS) continue;
      if (cellBlocked(nc, nr)) continue;
      if (cameFrom.has(key(nc, nr))) continue;
      cameFrom.set(key(nc, nr), cur);
      queue.push({ col: nc, row: nr });
    }
  }
  return null;
}

function thiefLit(world) {
  const { x, y } = world.thief;
  for (const guard of world.guards) {
    const dx = x - guard.x;
    const dy = y - guard.y;
    const dist = Math.hypot(dx, dy);
    if (dist > GUARD.sightRange) continue;
    const facing = Math.atan2(dy, dx);
    let diff = Math.abs(facing - guard.angle) % (Math.PI * 2);
    if (diff > Math.PI) diff = Math.PI * 2 - diff;
    if (diff <= GUARD.sightHalfAngle) return true;
  }
  for (const camera of world.cameras) {
    const dx = x - camera.x;
    const dy = y - camera.y;
    const dist = Math.hypot(dx, dy);
    if (dist > CAMERA.sightRange) continue;
    const facing = Math.atan2(dy, dx);
    let diff = Math.abs(facing - camera.angle) % (Math.PI * 2);
    if (diff > Math.PI) diff = Math.PI * 2 - diff;
    if (diff <= CAMERA.sightHalfAngle) return true;
  }
  return false;
}

// One step toward `goal`, sneaking while lit by a cone. When a guard gets
// close, the thief breaks off and backs away from them instead of walking
// into the patrol — the way a careful player waits a guard out.
function autopilot(world, goal) {
  let nearestGuard = null;
  let nearestDist = Infinity;
  for (const guard of world.guards) {
    const d = Math.hypot(guard.x - world.thief.x, guard.y - world.thief.y);
    if (d < nearestDist) {
      nearestDist = d;
      nearestGuard = guard;
    }
  }
  if (nearestGuard && nearestDist < 110) {
    const away = Math.atan2(world.thief.y - nearestGuard.y, world.thief.x - nearestGuard.x);
    return { dx: Math.cos(away), dy: Math.sin(away), sneak: thiefLit(world) };
  }
  const route = findRoute(world.thief.x, world.thief.y, goal.x, goal.y);
  let target = goal;
  if (route && route.length > 1) {
    // Skip cells already reached; aim at the next one past the thief.
    let i = 0;
    while (i < route.length - 1 && Math.hypot(route[i].x - world.thief.x, route[i].y - world.thief.y) < 20) i += 1;
    target = route[i];
  }
  const dx = target.x - world.thief.x;
  const dy = target.y - world.thief.y;
  const len = Math.hypot(dx, dy);
  if (len < 4) return { dx: 0, dy: 0, sneak: false };
  return { dx: dx / len, dy: dy / len, sneak: thiefLit(world) };
}

function closestLoot(world) {
  let goal = null;
  let bestDist = Infinity;
  for (const item of world.loot) {
    if (item.taken) continue;
    const d = Math.hypot(item.x - world.thief.x, item.y - world.thief.y);
    if (d < bestDist) {
      bestDist = d;
      goal = item;
    }
  }
  return goal;
}

function driveAutopilot(world, seconds, goalFor) {
  const steps = Math.floor(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    if (world.status !== 'playing') break;
    const goal = goalFor(world);
    if (!goal) break;
    step(world, autopilot(world, goal), STEP);
  }
}

function standStill(world, seconds) {
  const steps = Math.floor(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    if (world.status !== 'playing') break;
    step(world, { dx: 0, dy: 0, sneak: false }, STEP);
  }
}

/**
 * Set `world` to the named scene and return the screen to draw over it.
 * start: the title over a fresh gallery. play: mid-heist, loot in hand.
 * alarm: the thief walks onto the hall guard's patrol lane and stands in
 * the light while the meter climbs and a guard closes in. escape: the
 * getaway itself — sapphire taken, thief at the south door.
 */
export function stageShot(name, world) {
  if (name === 'play') {
    driveAutopilot(world, PLAY_SECONDS, (w) => closestLoot(w) ?? { x: 640, y: 470 });
    return { screen: 'play' };
  }
  if (name === 'alarm') {
    driveAutopilot(world, ALARM_WALK_SECONDS, () => ({ x: 640, y: 470 }));
    standStill(world, ALARM_STAND_SECONDS);
    return { screen: 'play' };
  }
  if (name === 'escape') {
    driveAutopilot(world, ESCAPE_LIMIT_SECONDS, (w) => {
      if (w.sapphireTaken) return { x: EXIT.x + EXIT.w / 2, y: EXIT.y + EXIT.h / 2 };
      const sapphire = w.loot.find((l) => l.required);
      return sapphire ?? { x: 640, y: 470 };
    });
    return { screen: world.status === 'won' ? 'won' : 'play' };
  }
  // start (and anything else): a few seconds of the gallery settling.
  const steps = Math.floor(START_SECONDS / STEP);
  for (let i = 0; i < steps; i += 1) step(world, { dx: 0, dy: 0, sneak: false }, STEP);
  return { screen: 'title' };
}

export { createWorld };

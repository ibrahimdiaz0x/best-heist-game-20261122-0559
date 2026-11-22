// The Marlow Heist — the practice driver.
//
// This module plays the game the way a careful thief would: it plans a
// route to the next piece on a coarse grid, then walks it one leg at a
// time, waiting out any leg a patrol or a camera is about to sweep. It
// uses only the engine's own rules (its sight tests, its collision), so
// the browser's staged scenes and the headless practice run prove the
// same thing: the heist can be finished clean from the spec alone.
//
// The driver never touches the screen. It answers one question per tick:
// which way should the thief walk now?

import {
  STEP,
  WALK_SPEED,
  SNEAK_SPEED,
  THIEF_RADIUS,
  seesPoint,
  segmentBlocked,
  circleHitsBlockers,
  distance,
} from './engine.js';

// The planning grid: 20-pixel cells over the gallery floor. A cell is
// walkable when the thief's body fits in it without touching a wall or a
// vitrine.
const CELL = 20;
const GRID_X0 = 42;
const GRID_Y0 = 90;
const GRID_COLS = 61;
const GRID_ROWS = 34;

function cellCenter(col, row) {
  return { x: GRID_X0 + col * CELL, y: GRID_Y0 + row * CELL };
}

function nearestCell(x, y) {
  return {
    col: Math.max(0, Math.min(GRID_COLS - 1, Math.round((x - GRID_X0) / CELL))),
    row: Math.max(0, Math.min(GRID_ROWS - 1, Math.round((y - GRID_Y0) / CELL))),
  };
}

function cellWalkable(gallery, col, row) {
  if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) return false;
  const p = cellCenter(col, row);
  return !circleHitsBlockers(p.x, p.y, THIEF_RADIUS + 2, gallery.blockers);
}

// The closest walkable cell to a point, spiralling outwards when the
// point itself sits inside a wall (a loot piece hung on a vitrine edge,
// the exit door below the floor grid).
function closestWalkableCell(gallery, x, y) {
  const start = nearestCell(x, y);
  for (let ring = 0; ring <= 4; ring++) {
    for (let dc = -ring; dc <= ring; dc++) {
      for (let dr = -ring; dr <= ring; dr++) {
        if (Math.max(Math.abs(dc), Math.abs(dr)) !== ring) continue;
        const col = start.col + dc;
        const row = start.row + dr;
        if (cellWalkable(gallery, col, row)) return { col, row };
      }
    }
  }
  return null;
}

// A* over the grid, eight directions, no cutting corners through a wall.
// Returns the cell centres from start to goal, or null when no route
// exists (which should never happen on this floor).
function astar(gallery, from, to) {
  const start = closestWalkableCell(gallery, from.x, from.y);
  const goal = closestWalkableCell(gallery, to.x, to.y);
  if (!start || !goal) return null;
  const key = (c, r) => r * GRID_COLS + c;
  const open = [{ col: start.col, row: start.row, g: 0, f: 0, parent: null }];
  const best = new Map();
  best.set(key(start.col, start.row), 0);
  const closed = new Set();
  const octile = (a, b) => {
    const dx = Math.abs(a.col - b.col);
    const dy = Math.abs(a.row - b.row);
    return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy);
  };
  while (open.length > 0) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) {
      if (open[i].f < open[bi].f) bi = i;
    }
    const node = open.splice(bi, 1)[0];
    const nodeKey = key(node.col, node.row);
    if (closed.has(nodeKey)) continue;
    closed.add(nodeKey);
    if (node.col === goal.col && node.row === goal.row) {
      const cells = [];
      let cur = node;
      while (cur) {
        cells.unshift(cellCenter(cur.col, cur.row));
        cur = cur.parent;
      }
      return cells;
    }
    for (let dc = -1; dc <= 1; dc++) {
      for (let dr = -1; dr <= 1; dr++) {
        if (dc === 0 && dr === 0) continue;
        const nc = node.col + dc;
        const nr = node.row + dr;
        if (!cellWalkable(gallery, nc, nr)) continue;
        // A diagonal step needs both shoulders clear, or the thief
        // would clip the corner of a wall.
        if (dc !== 0 && dr !== 0) {
          if (!cellWalkable(gallery, node.col + dc, node.row)) continue;
          if (!cellWalkable(gallery, node.col, node.row + dr)) continue;
        }
        const stepCost = dc !== 0 && dr !== 0 ? Math.SQRT2 : 1;
        const g = node.g + stepCost;
        const nk = key(nc, nr);
        if (best.has(nk) && best.get(nk) <= g) continue;
        best.set(nk, g);
        open.push({
          col: nc,
          row: nr,
          g,
          f: g + octile({ col: nc, row: nr }, goal),
          parent: node,
        });
      }
    }
  }
  return null;
}

// Straighten a cell path: from each point, skip ahead to the farthest
// later point with a clear line of sight, so the thief walks diagonals
// across open floor instead of stair-stepping through cells.
function smoothPath(gallery, points) {
  if (points.length <= 2) return points;
  const out = [points[0]];
  let i = 0;
  while (i < points.length - 1) {
    let j = points.length - 1;
    for (; j > i + 1; j--) {
      const a = points[i];
      const b = points[j];
      if (!segmentBlocked(a.x, a.y, b.x, b.y, gallery.blockers)) break;
    }
    out.push(points[j]);
    i = j;
  }
  return out;
}

// The order the driver lifts the pieces in: the two south wings first,
// then the vault at the top, then the east wing, then out the door. It
// is the short way round the hall, and it keeps the vault — the riskiest
// room — for the middle of the run, when the alarm is still silent.
const LIFT_ORDER = [3, 1, 0, 2, 4];

export function createDriver(gallery) {
  return {
    gallery,
    target: null,
    targetKey: null,
    path: [],
    pathIdx: 0,
    waitTicks: 0,
  };
}

// What the driver is after right now: the next piece in the lift order,
// or the exit door once the bag is full.
function currentTarget(driver, state) {
  for (const idx of LIFT_ORDER) {
    const piece = state.loot[idx];
    if (!piece.taken) {
      return { x: piece.x, y: piece.y, kind: 'loot', key: 'loot-' + idx };
    }
  }
  const door = driver.gallery.exit;
  return { x: door.x + door.w / 2, y: door.y + door.h / 2 + 6, kind: 'exit', key: 'exit' };
}

// Is the leg from the thief to `point` safe to walk right now? The
// driver replays the patrols and the camera sweeps over the time the
// walk would take, sampling the path every fifth of a second: if any
// sample would be seen, the leg is not safe yet and the thief waits.
function legSafe(driver, state, point) {
  const gallery = driver.gallery;
  const from = state.thief;
  const dist = distance(from.x, from.y, point.x, point.y);
  const speed = state.alarm > 45 ? SNEAK_SPEED : WALK_SPEED;
  const duration = dist / speed;
  const steps = Math.max(1, Math.ceil(duration / 0.2));
  for (let k = 0; k <= steps; k++) {
    const f = k / steps;
    const px = from.x + (point.x - from.x) * f;
    const py = from.y + (point.y - from.y) * f;
    const at = state.time + duration * f;
    if (seesPoint(gallery, at, px, py)) return false;
  }
  return true;
}

// One tick of driving: which way the thief walks now. The driver
// replans whenever its target changes, walks its route node by node, and
// waits out any leg a cone is about to sweep — unless the thief is
// already seen, in which case standing still only helps the guards.
export function driveStep(driver, state) {
  const idle = { x: 0, y: 0, sneak: false };
  if (state.phase !== 'playing') return idle;
  const target = currentTarget(driver, state);
  if (!driver.target || driver.targetKey !== target.key || driver.path.length === 0) {
    driver.target = target;
    driver.targetKey = target.key;
    const cells = astar(driver.gallery, state.thief, target);
    driver.path = cells ? smoothPath(driver.gallery, cells) : [{ x: target.x, y: target.y }];
    driver.pathIdx = 0;
    driver.waitTicks = 0;
  }
  // Past the last planned node, steer straight at the target itself.
  let node = driver.path[driver.pathIdx];
  if (!node) node = target;
  if (distance(state.thief.x, state.thief.y, node.x, node.y) < 12) {
    driver.pathIdx += 1;
    node = driver.path[driver.pathIdx] || target;
  }
  const seenNow = seesPoint(driver.gallery, state.time, state.thief.x, state.thief.y);
  const sneak = state.alarm > 45;
  if (!seenNow && !legSafe(driver, state, node)) {
    driver.waitTicks += 1;
    if (driver.waitTicks < 360) return idle;
    driver.waitTicks = 0;
  } else {
    driver.waitTicks = 0;
  }
  const dx = node.x - state.thief.x;
  const dy = node.y - state.thief.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len, y: dy / len, sneak };
}

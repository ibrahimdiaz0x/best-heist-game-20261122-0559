// The Marlow Heist — pure game rules.
//
// This module knows nothing about the screen. It owns the clock, the
// thief, the patrols, the cameras, the alarm and the win/lose conditions,
// so the browser loop and the headless practice run step the exact same
// game. Everything is deterministic: patrols and camera sweeps are pure
// functions of the elapsed time, and no randomness is used anywhere, so a
// run replayed from the same inputs always ends the same way.

import { ARENA_W, ARENA_H, allBlockers } from './level.js';

// One fixed step, 60 of them a second. The browser loop and the practice
// run both feed the engine steps of exactly this size.
export const STEP = 1 / 60;

// How fast the thief moves, in pixels per second, walking and sneaking.
export const WALK_SPEED = 168;
export const SNEAK_SPEED = 86;

// The thief's body radius, the reach needed to pocket a piece of loot,
// and how close a guard may come before the grab is instant.
export const THIEF_RADIUS = 13;
export const PICKUP_RADIUS = 30;
export const GRAB_RADIUS = 26;

// Alarm behaviour: how fast being seen fills the meter, how fast hiding
// drains it, and how much sneaking muffles the rise.
export const ALARM_GUARD_RATE = 36;
export const ALARM_CAMERA_RATE = 27;
export const ALARM_DECAY_RATE = 11;
export const ALARM_SNEAK_FACTOR = 0.45;
export const ALARM_CAUGHT_AT = 100;
export const ALARM_HOT_AT = 50;

// The clock the whole score hangs on: finish inside the par window and
// every spare second is worth eight points of time bonus.
export const PAR_SECONDS = 150;
export const TIME_BONUS_PER_SECOND = 8;

export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function distance(ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  return Math.sqrt(dx * dx + dy * dy);
}

// Smallest absolute difference between two headings, in radians.
export function angleDifference(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return Math.abs(d);
}

function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

function segmentsCross(ax, ay, bx, by, cx, cy, dx, dy) {
  const d1 = (dx - cx) * (ay - cy) - (dy - cy) * (ax - cx);
  const d2 = (dx - cx) * (by - cy) - (dy - cy) * (bx - cx);
  const d3 = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  const d4 = (bx - ax) * (dy - ay) - (by - ay) * (dx - ax);
  return ((d1 > 0) !== (d2 > 0)) && ((d3 > 0) !== (d4 > 0));
}

// True when the straight segment between two points cuts through any
// blocker. Touching a corner exactly counts as blocked, which keeps the
// sight tests conservative: a guard never sees through a wall edge.
export function segmentBlocked(x1, y1, x2, y2, blockers) {
  for (const r of blockers) {
    if (pointInRect(x1, y1, r) || pointInRect(x2, y2, r)) return true;
    if (segmentsCross(x1, y1, x2, y2, r.x, r.y, r.x + r.w, r.y)) return true;
    if (segmentsCross(x1, y1, x2, y2, r.x + r.w, r.y, r.x + r.w, r.y + r.h)) return true;
    if (segmentsCross(x1, y1, x2, y2, r.x + r.w, r.y + r.h, r.x, r.y + r.h)) return true;
    if (segmentsCross(x1, y1, x2, y2, r.x, r.y + r.h, r.x, r.y)) return true;
  }
  return false;
}

// True when a circle of radius r centred at (x, y) overlaps a blocker.
export function circleHitsBlockers(x, y, r, blockers) {
  for (const b of blockers) {
    const cx = clamp(x, b.x, b.x + b.w);
    const cy = clamp(y, b.y, b.y + b.h);
    const dx = x - cx;
    const dy = y - cy;
    if (dx * dx + dy * dy < r * r) return true;
  }
  return false;
}

// Slide a circle through the gallery by (dx, dy), in steps of at most two
// pixels so it can never tunnel through a thin wall. Each sub-step tries
// x first, then y, which gives a natural slide along a wall instead of a
// dead stop when the thief walks into it at an angle.
export function slideCircle(pos, dx, dy, r, blockers) {
  const total = Math.sqrt(dx * dx + dy * dy);
  const steps = Math.max(1, Math.ceil(total / 2));
  const sx = dx / steps;
  const sy = dy / steps;
  for (let i = 0; i < steps; i++) {
    const nx = pos.x + sx;
    if (!circleHitsBlockers(nx, pos.y, r, blockers)) pos.x = nx;
    const ny = pos.y + sy;
    if (!circleHitsBlockers(pos.x, ny, r, blockers)) pos.y = ny;
  }
  pos.x = clamp(pos.x, 0, ARENA_W);
  pos.y = clamp(pos.y, 0, ARENA_H);
}

// --- Patrols and cameras: pure functions of the clock ---

// Where a guard stands at a given time, and which way he faces. He walks
// his waypoint loop out and back (a ping-pong beat): the distance he has
// covered wraps every two laps, and past the far end he retraces the same
// ground in reverse, facing the way he came.
export function guardPoseAt(guard, time) {
  const pts = guard.waypoints;
  const legs = [];
  let total = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const len = distance(a[0], a[1], b[0], b[1]);
    legs.push({ a, b, len });
    total += len;
  }
  const cycle = 2 * total;
  let d = (guard.speed * time) % cycle;
  let returning = false;
  if (d > total) {
    d = cycle - d;
    returning = true;
  }
  let covered = 0;
  for (const leg of legs) {
    if (d <= covered + leg.len) {
      const t = leg.len === 0 ? 0 : (d - covered) / leg.len;
      const x = leg.a[0] + (leg.b[0] - leg.a[0]) * t;
      const y = leg.a[1] + (leg.b[1] - leg.a[1]) * t;
      const dirX = returning ? leg.a[0] - leg.b[0] : leg.b[0] - leg.a[0];
      const dirY = returning ? leg.a[1] - leg.b[1] : leg.b[1] - leg.a[1];
      return { x, y, angle: Math.atan2(dirY, dirX) };
    }
    covered += leg.len;
  }
  const last = pts[pts.length - 1];
  return { x: last[0], y: last[1], angle: 0 };
}

// Where a camera points at a given time: a slow pendulum swing around its
// base heading.
export function cameraAngleAt(camera, time) {
  return camera.baseAngle + camera.sweep * Math.sin((2 * Math.PI * time) / camera.period + camera.phase);
}

// Can anything see the point (x, y) right now? A guard or a camera sees
// it when the point is inside the cone's reach and angle and the straight
// line to it crosses no wall or vitrine. Returns { by, who } or null.
export function seesPoint(gallery, time, x, y) {
  const blockers = gallery.blockers;
  for (let i = 0; i < gallery.guards.length; i++) {
    const guard = gallery.guards[i];
    const pose = guardPoseAt(guard, time);
    const d = distance(pose.x, pose.y, x, y);
    if (d >= guard.viewDist) continue;
    const bearing = Math.atan2(y - pose.y, x - pose.x);
    if (angleDifference(bearing, pose.angle) >= guard.halfAngle) continue;
    if (segmentBlocked(pose.x, pose.y, x, y, blockers)) continue;
    return { by: 'guard', who: i };
  }
  for (let i = 0; i < gallery.cameras.length; i++) {
    const camera = gallery.cameras[i];
    const d = distance(camera.x, camera.y, x, y);
    if (d >= camera.viewDist) continue;
    const bearing = Math.atan2(y - camera.y, x - camera.x);
    if (angleDifference(bearing, cameraAngleAt(camera, time)) >= camera.halfAngle) continue;
    if (segmentBlocked(camera.x, camera.y, x, y, blockers)) continue;
    return { by: 'camera', who: i };
  }
  return null;
}

// --- The run itself ---

export function totalLootValue(gallery) {
  return gallery.loot.reduce((sum, piece) => sum + piece.value, 0);
}

export function timeBonusFor(elapsedSeconds) {
  const spare = Math.round(PAR_SECONDS - elapsedSeconds);
  return Math.max(0, spare) * TIME_BONUS_PER_SECOND;
}

// A fresh run, waiting on the title screen. The thief stands at the door,
// the alarm is silent, every piece is still on display.
export function createRun(gallery) {
  return {
    gallery,
    phase: 'title',
    time: 0,
    tick: 0,
    elapsed: 0,
    thief: { x: gallery.start.x, y: gallery.start.y },
    facing: -Math.PI / 2,
    alarm: 0,
    seen: null,
    alarmMode: false,
    loot: gallery.loot.map((piece) => ({ ...piece, taken: false })),
    haul: 0,
    timeBonus: 0,
    finalScore: 0,
    caughtBy: null,
  };
}

export function beginRun(state) {
  state.phase = 'playing';
}

export function exitOpen(state) {
  return state.loot.every((piece) => piece.taken);
}

// One fixed step of the game. input is { x, y, sneak }: the direction
// the thief is told to walk, each component between -1 and 1. Only runs
// while the phase is 'playing'; title, caught and won states are frozen.
export function stepRun(state, input, dt = STEP) {
  if (state.phase !== 'playing') return;
  state.time += dt;
  state.tick += 1;
  state.elapsed = state.time;

  // Walk the thief, sliding along whatever he bumps into.
  const speed = input.sneak ? SNEAK_SPEED : WALK_SPEED;
  let mx = input.x || 0;
  let my = input.y || 0;
  const len = Math.hypot(mx, my);
  if (len > 1) {
    mx /= len;
    my /= len;
  }
  if (mx !== 0 || my !== 0) state.facing = Math.atan2(my, mx);
  slideCircle(state.thief, mx * speed * dt, my * speed * dt, THIEF_RADIUS, state.gallery.blockers);

  // Detection: seen, the siren climbs (slower while sneaking); hidden,
  // it drains away again.
  const seen = seesPoint(state.gallery, state.time, state.thief.x, state.thief.y);
  state.seen = seen;
  if (seen) {
    const rate = seen.by === 'guard' ? ALARM_GUARD_RATE : ALARM_CAMERA_RATE;
    const muffled = input.sneak ? rate * ALARM_SNEAK_FACTOR : rate;
    state.alarm = clamp(state.alarm + muffled * dt, 0, ALARM_CAUGHT_AT);
  } else {
    state.alarm = clamp(state.alarm - ALARM_DECAY_RATE * dt, 0, ALARM_CAUGHT_AT);
  }
  state.alarmMode = state.alarm >= ALARM_HOT_AT || seen !== null;

  // Pocket any piece the thief walks over.
  for (const piece of state.loot) {
    if (!piece.taken && distance(state.thief.x, state.thief.y, piece.x, piece.y) < PICKUP_RADIUS) {
      piece.taken = true;
      state.haul += piece.value;
    }
  }

  // A guard who touches the thief ends the night on the spot.
  for (let i = 0; i < state.gallery.guards.length; i++) {
    const pose = guardPoseAt(state.gallery.guards[i], state.time);
    if (distance(pose.x, pose.y, state.thief.x, state.thief.y) < GRAB_RADIUS) {
      state.phase = 'caught';
      state.caughtBy = 'guard';
      return;
    }
  }
  if (state.alarm >= ALARM_CAUGHT_AT) {
    state.phase = 'caught';
    state.caughtBy = 'alarm';
    return;
  }

  // Every piece pocketed and the thief through the exit door: clean
  // getaway. The score is the haul plus a bonus for every second spare
  // against the par time.
  if (exitOpen(state)) {
    const door = state.gallery.exit;
    if (
      state.thief.x > door.x &&
      state.thief.x < door.x + door.w &&
      state.thief.y > door.y &&
      state.thief.y < door.y + door.h
    ) {
      state.phase = 'won';
      state.timeBonus = timeBonusFor(state.elapsed);
      state.finalScore = state.haul + state.timeBonus;
    }
  }
}

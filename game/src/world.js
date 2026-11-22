// The Marlow Heist — the night's rules, no drawing. step() takes an input
// ({dx, dy, sneak}) and a delta in seconds and moves everything forward: a
// guard patrols its waypoints, watches a cone, and chases when the thief
// gets too close inside it; a camera sweeps its cone and feeds the alarm;
// the alarm drains while the thief stays unseen and ends the run at 100.
// Loot is pocketed by walking over it; the exit opens once the Star
// Sapphire is in the bag.

import {
  ALARM, CAMERA, CAMERAS, CASES, EXIT, FIELD, GUARD, GUARDS, LOOT,
  THIEF, THIEF_START, WALLS,
} from './config.js';

const TAU = Math.PI * 2;

// Smallest signed turn from angle b to angle a, in (-PI, PI].
function wrapDelta(a, b) {
  let d = (a - b) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
}

function wrapAngle(a) {
  return ((a % TAU) + TAU) % TAU;
}

// Does the segment (x1,y1)-(x2,y2) cross rectangle r? Slab test.
function segmentCrossesBox(x1, y1, x2, y2, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tmin = 0;
  let tmax = 1;
  for (const [p, q] of [[-dx, x1 - r.x], [dx, r.x + r.w - x1], [-dy, y1 - r.y], [dy, r.y + r.h - y1]]) {
    if (p === 0) {
      if (q < 0) return false;
    } else {
      const t = q / p;
      if (p < 0) {
        if (t > tmax) return false;
        if (t > tmin) tmin = t;
      } else {
        if (t < tmin) return false;
        if (t < tmax) tmax = t;
      }
    }
  }
  return true;
}

function sightOpen(x1, y1, x2, y2) {
  for (const wall of WALLS) {
    if (segmentCrossesBox(x1, y1, x2, y2, wall)) return false;
  }
  return true;
}

function inViewCone(px, py, ox, oy, facing, range, halfAngle) {
  const dx = px - ox;
  const dy = py - oy;
  const dist = Math.hypot(dx, dy);
  if (dist > range || dist < 1) return dist < 1;
  const toTarget = Math.atan2(dy, dx);
  return Math.abs(wrapDelta(toTarget, facing)) <= halfAngle;
}

// Slide a circle of `radius` along (mx, my) through the solid rectangles,
// one axis at a time so it glides along walls instead of snagging corners.
function slideBody(body, mx, my, radius, solids) {
  const nx = body.x + mx;
  let blocked = false;
  for (const s of solids) {
    if (nx + radius > s.x && nx - radius < s.x + s.w && body.y + radius > s.y && body.y - radius < s.y + s.h) {
      blocked = true;
      break;
    }
  }
  if (!blocked) body.x = nx;
  const ny = body.y + my;
  blocked = false;
  for (const s of solids) {
    if (body.x + radius > s.x && body.x - radius < s.x + s.w && ny + radius > s.y && ny - radius < s.y + s.h) {
      blocked = true;
      break;
    }
  }
  if (!blocked) body.y = ny;
}

export function createWorld(seed = 1) {
  void seed;
  return {
    time: 0,
    status: 'playing', // 'playing' | 'busted' | 'won'
    statusNote: '',
    alarm: 0,
    score: 0,
    lootTaken: 0,
    sapphireTaken: false,
    thief: {
      x: THIEF_START.x,
      y: THIEF_START.y,
      angle: -Math.PI / 2,
      sneaking: false,
      moving: false,
    },
    guards: GUARDS.map((g) => ({
      waypoints: g.waypoints,
      x: g.waypoints[0].x,
      y: g.waypoints[0].y,
      angle: 0,
      targetIndex: 1,
      mode: 'patrol', // 'patrol' | 'chase'
      chaseTimer: 0,
      lastSeenX: 0,
      lastSeenY: 0,
    })),
    cameras: CAMERAS.map((c, i) => ({
      x: c.x,
      y: c.y,
      baseAngle: c.baseAngle,
      angle: c.baseAngle,
      phase: i * 1.7,
    })),
    loot: LOOT.map((l) => ({ ...l, taken: false })),
  };
}

export function lootCount(world) {
  return world.loot.filter((l) => l.taken).length;
}

function guardSpotsThief(world, guard) {
  const range = world.thief.sneaking ? GUARD.sightRange * THIEF.sneakSightShrink : GUARD.sightRange;
  if (!inViewCone(world.thief.x, world.thief.y, guard.x, guard.y, guard.angle, range, GUARD.sightHalfAngle)) {
    return false;
  }
  return sightOpen(guard.x, guard.y, world.thief.x, world.thief.y);
}

function cameraSpotsThief(world, camera) {
  const range = world.thief.sneaking ? CAMERA.sightRange * THIEF.sneakSightShrink : CAMERA.sightRange;
  if (!inViewCone(world.thief.x, world.thief.y, camera.x, camera.y, camera.angle, range, CAMERA.sightHalfAngle)) {
    return false;
  }
  return sightOpen(camera.x, camera.y, world.thief.x, world.thief.y);
}

function stepGuard(world, guard, dt) {
  const thief = world.thief;
  const seen = guardSpotsThief(world, guard);
  const dist = Math.hypot(thief.x - guard.x, thief.y - guard.y);

  if (guard.mode === 'chase') {
    guard.chaseTimer -= dt;
    if (seen) {
      guard.lastSeenX = thief.x;
      guard.lastSeenY = thief.y;
      guard.chaseTimer = GUARD.chaseMemorySeconds;
    }
    const tx = guard.lastSeenX;
    const ty = guard.lastSeenY;
    const d = Math.hypot(tx - guard.x, ty - guard.y);
    if (d > 4) {
      const want = Math.atan2(ty - guard.y, tx - guard.x);
      guard.angle = wrapAngle(guard.angle + wrapDelta(want, guard.angle) * Math.min(1, dt * 6));
      slideBody(guard, Math.cos(guard.angle) * GUARD.chaseSpeed * dt, Math.sin(guard.angle) * GUARD.chaseSpeed * dt, GUARD.radius, WALLS);
    }
    if (guard.chaseTimer <= 0) guard.mode = 'patrol';
    return seen;
  }

  // Patrol: walk to the next waypoint, turning at each end.
  const target = guard.waypoints[guard.targetIndex];
  const d = Math.hypot(target.x - guard.x, target.y - guard.y);
  if (d < 6) {
    guard.targetIndex = (guard.targetIndex + 1) % guard.waypoints.length;
  } else {
    const want = Math.atan2(target.y - guard.y, target.x - guard.x);
    guard.angle = wrapAngle(guard.angle + wrapDelta(want, guard.angle) * Math.min(1, dt * 8));
    slideBody(guard, Math.cos(guard.angle) * GUARD.patrolSpeed * dt, Math.sin(guard.angle) * GUARD.patrolSpeed * dt, GUARD.radius, WALLS);
  }

  if (seen && dist < GUARD.chaseTriggerRange) {
    guard.mode = 'chase';
    guard.chaseTimer = GUARD.chaseMemorySeconds;
    guard.lastSeenX = thief.x;
    guard.lastSeenY = thief.y;
  }
  return seen;
}

export function step(world, input, dt) {
  if (world.status !== 'playing') return;
  world.time += dt;
  const thief = world.thief;

  // --- The thief moves. ---
  const speed = input.sneak ? THIEF.sneakSpeed : THIEF.walkSpeed;
  thief.sneaking = !!input.sneak;
  const len = Math.hypot(input.dx, input.dy);
  thief.moving = len > 0.01;
  if (thief.moving) {
    const nx = (input.dx / len) * speed * dt;
    const ny = (input.dy / len) * speed * dt;
    thief.angle = Math.atan2(input.dy, input.dx);
    slideBody(thief, nx, ny, THIEF.radius, [...WALLS, ...CASES]);
    thief.x = Math.max(THIEF.radius + 24, Math.min(FIELD.width - 24 - THIEF.radius, thief.x));
    thief.y = Math.max(THIEF.radius + 24, Math.min(FIELD.height - 24 - THIEF.radius, thief.y));
  }

  // --- Cameras sweep. ---
  for (const camera of world.cameras) {
    const t = world.time + camera.phase;
    const swing = Math.sin((t / CAMERA.sweepSeconds) * Math.PI * 2) * CAMERA.sweepHalfAngle;
    camera.angle = camera.baseAngle + swing;
  }

  // --- Eyes on the thief, and the alarm answers. ---
  let guardSpotted = false;
  for (const guard of world.guards) {
    if (stepGuard(world, guard, dt)) guardSpotted = true;
    // A guard that reaches the thief ends the run badly.
    if (Math.hypot(thief.x - guard.x, thief.y - guard.y) < GUARD.radius + THIEF.radius + 2) {
      world.alarm = Math.min(ALARM.max, world.alarm + GUARD.touchAlarm);
      // Shove the thief clear and send the guard back to its patrol.
      const away = Math.atan2(thief.y - guard.y, thief.x - guard.x);
      thief.x += Math.cos(away) * 46;
      thief.y += Math.sin(away) * 46;
      guard.mode = 'patrol';
      guard.chaseTimer = 0;
      if (world.alarm >= ALARM.max) {
        world.status = 'busted';
        world.statusNote = 'A guard grabbed you in the hall.';
        return;
      }
    }
  }
  let cameraSpotted = false;
  for (const camera of world.cameras) {
    if (cameraSpotsThief(world, camera)) cameraSpotted = true;
  }
  const sneakFactor = thief.sneaking ? THIEF.sneakAlarmFactor : 1;
  if (guardSpotted) world.alarm += ALARM.guardPerSecond * sneakFactor * dt;
  else if (cameraSpotted) world.alarm += CAMERA.alarmPerSecond * sneakFactor * dt;
  else {
    const late = world.lootTaken >= 3;
    world.alarm -= (late ? ALARM.decayLatePerSecond : ALARM.decayPerSecond) * dt;
  }
  world.alarm = Math.max(0, Math.min(ALARM.max, world.alarm));
  if (world.alarm >= ALARM.max) {
    world.status = 'busted';
    world.statusNote = 'The alarm hit 100 — the gallery locked down.';
    return;
  }

  // --- Loot: walk over it to pocket it. ---
  for (const item of world.loot) {
    if (item.taken) continue;
    if (Math.hypot(thief.x - item.x, thief.y - item.y) < THIEF.radius + 22) {
      item.taken = true;
      world.lootTaken += 1;
      world.score += item.value;
      if (item.required) world.sapphireTaken = true;
    }
  }

  // --- The exit: open once the sapphire is taken. ---
  if (world.sapphireTaken
    && thief.x > EXIT.x && thief.x < EXIT.x + EXIT.w
    && thief.y > EXIT.y - 6 && thief.y < EXIT.y + EXIT.h) {
    const timeBonus = Math.max(0, 600 - Math.floor(world.time)) * 2;
    world.score += timeBonus;
    world.status = 'won';
    world.statusNote = `Clean getaway — ${world.lootTaken} of ${world.loot.length} pieces, time bonus ${timeBonus}.`;
  }
}

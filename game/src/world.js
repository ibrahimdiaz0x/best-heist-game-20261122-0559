// The Marlow Heist — the night's rules, no drawing. advance() takes an
// input ({dx, dy, creep}) and a delta in seconds and moves everything
// forward: a watchman walks his route, watches a cone, and gives chase when
// the thief gets too close inside it; a lens sweeps its cone and feeds the
// siren; the siren drains while the thief stays unseen and ends the run at
// its ceiling. Swag is pocketed by walking over it; the door opens once
// the Star Sapphire is in the bag.

import {
  ARENA, BARRIERS, BURGLAR, DOOR, EYES, LENS, PATROLS, POINTS, SIREN,
  START, SWAG, VITRINES, WATCHMAN,
} from './config.js';

const CIRCLE = Math.PI * 2;

// Smallest signed turn from angle b to angle a, in (-PI, PI].
function shortestTurn(a, b) {
  let d = (a - b) % CIRCLE;
  if (d > Math.PI) d -= CIRCLE;
  if (d < -Math.PI) d += CIRCLE;
  return d;
}

function clampAngle(a) {
  return ((a % CIRCLE) + CIRCLE) % CIRCLE;
}

// Does the segment (x1,y1)-(x2,y2) cross rectangle r? Slab test.
function rayBlocked(x1, y1, x2, y2, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let low = 0;
  let high = 1;
  for (const [p, q] of [[-dx, x1 - r.x], [dx, r.x + r.w - x1], [-dy, y1 - r.y], [dy, r.y + r.h - y1]]) {
    if (p === 0) {
      if (q < 0) return false;
    } else {
      const t = q / p;
      if (p < 0) {
        if (t > high) return false;
        if (t > low) low = t;
      } else {
        if (t < low) return false;
        if (t < high) high = t;
      }
    }
  }
  return true;
}

function lineClear(x1, y1, x2, y2) {
  for (const wall of BARRIERS) {
    if (rayBlocked(x1, y1, x2, y2, wall)) return false;
  }
  return true;
}

function inCone(px, py, ox, oy, facing, range, halfAngle) {
  const dx = px - ox;
  const dy = py - oy;
  const dist = Math.hypot(dx, dy);
  if (dist > range || dist < 1) return dist < 1;
  const toTarget = Math.atan2(dy, dx);
  return Math.abs(shortestTurn(toTarget, facing)) <= halfAngle;
}

// Slide a circle of `radius` along (mx, my) through the solid rectangles,
// one axis at a time so it glides along walls instead of snagging corners.
function glide(body, mx, my, radius, solids) {
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

export function openNight(seed = 1) {
  void seed;
  return {
    clock: 0,
    fate: 'running', // 'running' | 'caught' | 'escaped'
    note: '',
    heat: 0,
    haul: 0,
    pocketed: 0,
    gemInBag: false,
    burglar: {
      x: START.x,
      y: START.y,
      face: -Math.PI / 2,
      sneaking: false,
      moving: false,
    },
    watchmen: PATROLS.map((p) => ({
      route: p.route,
      x: p.route[0].x,
      y: p.route[0].y,
      face: 0,
      leg: 1,
      mode: 'patrol', // 'patrol' | 'chase'
      recall: 0,
      seenX: 0,
      seenY: 0,
    })),
    lenses: EYES.map((c, i) => ({
      x: c.x,
      y: c.y,
      rest: c.rest,
      face: c.rest,
      phase: i * 1.7,
    })),
    swag: SWAG.map((l) => ({ ...l, taken: false })),
  };
}

export function takenCount(world) {
  return world.swag.filter((l) => l.taken).length;
}

function watchmanSees(world, guard) {
  const range = world.burglar.sneaking ? WATCHMAN.sight * BURGLAR.creepSight : WATCHMAN.sight;
  if (!inCone(world.burglar.x, world.burglar.y, guard.x, guard.y, guard.face, range, WATCHMAN.halfCone)) {
    return false;
  }
  return lineClear(guard.x, guard.y, world.burglar.x, world.burglar.y);
}

function lensSees(world, lens) {
  const range = world.burglar.sneaking ? LENS.sight * BURGLAR.creepSight : LENS.sight;
  if (!inCone(world.burglar.x, world.burglar.y, lens.x, lens.y, lens.face, range, LENS.halfCone)) {
    return false;
  }
  return lineClear(lens.x, lens.y, world.burglar.x, world.burglar.y);
}

function moveWatchman(world, guard, dt) {
  const thief = world.burglar;
  const seen = watchmanSees(world, guard);
  const dist = Math.hypot(thief.x - guard.x, thief.y - guard.y);

  if (guard.mode === 'chase') {
    guard.recall -= dt;
    if (seen) {
      guard.seenX = thief.x;
      guard.seenY = thief.y;
      guard.recall = WATCHMAN.memory;
    }
    const tx = guard.seenX;
    const ty = guard.seenY;
    const d = Math.hypot(tx - guard.x, ty - guard.y);
    if (d > 4) {
      const want = Math.atan2(ty - guard.y, tx - guard.x);
      guard.face = clampAngle(guard.face + shortestTurn(want, guard.face) * Math.min(1, dt * 6));
      glide(guard, Math.cos(guard.face) * WATCHMAN.pursuit * dt, Math.sin(guard.face) * WATCHMAN.pursuit * dt, WATCHMAN.radius, BARRIERS);
    }
    if (guard.recall <= 0) guard.mode = 'patrol';
    return seen;
  }

  // Patrol: walk to the next waypoint, turning at each end.
  const target = guard.route[guard.leg];
  const d = Math.hypot(target.x - guard.x, target.y - guard.y);
  if (d < 6) {
    guard.leg = (guard.leg + 1) % guard.route.length;
  } else {
    const want = Math.atan2(target.y - guard.y, target.x - guard.x);
    guard.face = clampAngle(guard.face + shortestTurn(want, guard.face) * Math.min(1, dt * 8));
    glide(guard, Math.cos(guard.face) * WATCHMAN.patrol * dt, Math.sin(guard.face) * WATCHMAN.patrol * dt, WATCHMAN.radius, BARRIERS);
  }

  if (seen && dist < WATCHMAN.chaseWithin) {
    guard.mode = 'chase';
    guard.recall = WATCHMAN.memory;
    guard.seenX = thief.x;
    guard.seenY = thief.y;
  }
  return seen;
}

export function advance(world, input, dt) {
  if (world.fate !== 'running') return;
  world.clock += dt;
  const burglar = world.burglar;

  // --- The burglar moves. ---
  const speed = input.creep ? BURGLAR.creep : BURGLAR.stroll;
  burglar.sneaking = !!input.creep;
  const len = Math.hypot(input.dx, input.dy);
  burglar.moving = len > 0.01;
  if (burglar.moving) {
    const nx = (input.dx / len) * speed * dt;
    const ny = (input.dy / len) * speed * dt;
    burglar.face = Math.atan2(input.dy, input.dx);
    glide(burglar, nx, ny, BURGLAR.radius, [...BARRIERS, ...VITRINES]);
    burglar.x = Math.max(BURGLAR.radius + 24, Math.min(ARENA.width - 24 - BURGLAR.radius, burglar.x));
    burglar.y = Math.max(BURGLAR.radius + 24, Math.min(ARENA.height - 24 - BURGLAR.radius, burglar.y));
  }

  // --- Lenses sweep. ---
  for (const lens of world.lenses) {
    const t = world.clock + lens.phase;
    const swing = Math.sin((t / LENS.sweepTime) * Math.PI * 2) * LENS.sweep;
    lens.face = lens.rest + swing;
  }

  // --- Eyes on the burglar, and the siren answers. ---
  let guardSeen = false;
  for (const guard of world.watchmen) {
    if (moveWatchman(world, guard, dt)) guardSeen = true;
    // A watchman that reaches the burglar ends the night badly.
    if (Math.hypot(burglar.x - guard.x, burglar.y - guard.y) < WATCHMAN.radius + BURGLAR.radius + 2) {
      world.heat = Math.min(SIREN.ceiling, world.heat + WATCHMAN.grabAlarm);
      // Shove the burglar clear and send the watchman back to his route.
      const away = Math.atan2(burglar.y - guard.y, burglar.x - guard.x);
      burglar.x += Math.cos(away) * 46;
      burglar.y += Math.sin(away) * 46;
      guard.mode = 'patrol';
      guard.recall = 0;
      if (world.heat >= SIREN.ceiling) {
        world.fate = 'caught';
        world.note = 'A watchman grabbed you in the hall.';
        return;
      }
    }
  }
  let lensSeen = false;
  for (const lens of world.lenses) {
    if (lensSees(world, lens)) lensSeen = true;
  }
  const creepFactor = burglar.sneaking ? BURGLAR.creepAlarm : 1;
  if (guardSeen) world.heat += SIREN.watchmanRate * creepFactor * dt;
  else if (lensSeen) world.heat += LENS.alarmRate * creepFactor * dt;
  else {
    const late = world.pocketed >= 3;
    world.heat -= (late ? SIREN.coolDownLate : SIREN.coolDown) * dt;
  }
  world.heat = Math.max(0, Math.min(SIREN.ceiling, world.heat));
  if (world.heat >= SIREN.ceiling) {
    world.fate = 'caught';
    world.note = 'The siren hit 100 — the gallery locked down.';
    return;
  }

  // --- Swag: walk over it to pocket it. ---
  for (const item of world.swag) {
    if (item.taken) continue;
    if (Math.hypot(burglar.x - item.x, burglar.y - item.y) < BURGLAR.radius + 22) {
      item.taken = true;
      world.pocketed += 1;
      world.haul += item.worth;
      if (item.key) world.gemInBag = true;
    }
  }

  // --- The door: open once the sapphire is taken. ---
  if (world.gemInBag
    && burglar.x > DOOR.x && burglar.x < DOOR.x + DOOR.w
    && burglar.y > DOOR.y - 6 && burglar.y < DOOR.y + DOOR.h) {
    const bonus = Math.max(0, POINTS.bonusWindow - Math.floor(world.clock)) * POINTS.bonusPerSecond;
    world.haul += bonus;
    world.fate = 'escaped';
    world.note = `Clean getaway — ${world.pocketed} of ${world.swag.length} pieces, time bonus ${bonus}.`;
  }
}

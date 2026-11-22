// The Marlow Heist — everything the eye sees, on one canvas. The gallery is
// top-down: a dark wood floor, a deep-red carpet runner down the hall,
// brass-trimmed walls, glass vitrines, and the two things that matter most
// in a stealth game — the watchmen's amber vision cones and the lenses'
// red ones, painted before the figures so the thief reads as standing in
// the light. The HUD rides along the top: swag, haul, siren meter, clock.

import {
  ARENA, BARRIERS, BURGLAR, DOOR, LENS, PAINT, SIREN, SWAG, VITRINES,
  WATCHMAN,
} from './config.js';

function drawCone(ctx, ox, oy, facing, range, halfAngle, fill, edge) {
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.arc(ox, oy, range, facing - halfAngle, facing + halfAngle);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawSwag(ctx, item, pulse) {
  const x = item.x;
  const y = item.y;
  const glow = 26 + Math.sin(pulse * 3 + item.x) * 5;
  const grad = ctx.createRadialGradient(x, y, 2, x, y, glow);
  grad.addColorStop(0, 'rgba(255, 215, 94, 0.55)');
  grad.addColorStop(1, 'rgba(255, 215, 94, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, glow, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = PAINT.glint;
  ctx.strokeStyle = '#8a6d2f';
  ctx.lineWidth = 2;
  if (item.kind === 'gem') {
    ctx.beginPath();
    ctx.moveTo(x, y - 13);
    ctx.lineTo(x + 11, y);
    ctx.lineTo(x, y + 13);
    ctx.lineTo(x - 11, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (item.kind === 'painting') {
    ctx.fillRect(x - 13, y - 10, 26, 20);
    ctx.strokeRect(x - 13, y - 10, 26, 20);
    ctx.fillStyle = '#7a2e35';
    ctx.fillRect(x - 8, y - 5, 16, 10);
  } else if (item.kind === 'idol') {
    ctx.beginPath();
    ctx.moveTo(x, y - 13);
    ctx.lineTo(x + 9, y + 10);
    ctx.lineTo(x - 9, y + 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y - 15, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (item.kind === 'pearls') {
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath();
      ctx.arc(x + i * 7, y + Math.abs(i) * 3, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#f2ead8';
      ctx.fill();
      ctx.stroke();
    }
  } else {
    // Jade mask: a rounded face with two eye slits.
    ctx.beginPath();
    ctx.ellipse(x, y, 11, 13, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#3fae7a';
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#123326';
    ctx.fillRect(x - 7, y - 4, 5, 3);
    ctx.fillRect(x + 2, y - 4, 5, 3);
  }
}

function drawWatchman(ctx, guard, time) {
  const bob = guard.mode === 'chase' ? Math.sin(time * 14) * 2 : 0;
  ctx.fillStyle = PAINT.uniform;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y + bob, WATCHMAN.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0e1626';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Cap and facing tick.
  ctx.fillStyle = PAINT.cap;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y + bob, WATCHMAN.radius - 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#e8dcc0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y + bob);
  ctx.lineTo(guard.x + Math.cos(guard.face) * (WATCHMAN.radius + 6), guard.y + bob + Math.sin(guard.face) * (WATCHMAN.radius + 6));
  ctx.stroke();
  if (guard.mode === 'chase') {
    ctx.fillStyle = '#ff5a5a';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', guard.x, guard.y - WATCHMAN.radius - 8 + bob);
  }
}

function drawLens(ctx, lens) {
  ctx.save();
  ctx.translate(lens.x, lens.y);
  ctx.rotate(lens.face);
  ctx.fillStyle = '#20242e';
  ctx.fillRect(-4, -7, 22, 14);
  ctx.fillStyle = '#e5484d';
  ctx.beginPath();
  ctx.arc(16, 0, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Wall mount.
  ctx.fillStyle = '#3a3f4a';
  ctx.beginPath();
  ctx.arc(lens.x, lens.y, 6, 0, Math.PI * 2);
  ctx.fill();
}

function drawBurglar(ctx, thief) {
  const r = thief.sneaking ? BURGLAR.radius - 3 : BURGLAR.radius;
  ctx.fillStyle = PAINT.cloak;
  ctx.beginPath();
  ctx.moveTo(thief.x, thief.y - r - 6);
  ctx.lineTo(thief.x + r + 4, thief.y + r);
  ctx.lineTo(thief.x - r - 4, thief.y + r);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PAINT.coat;
  ctx.beginPath();
  ctx.arc(thief.x, thief.y - 2, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0a0e14';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Eyes and facing tick.
  ctx.fillStyle = '#ffd75e';
  ctx.beginPath();
  ctx.arc(thief.x + Math.cos(thief.face - 0.35) * 5, thief.y - 2 + Math.sin(thief.face - 0.35) * 5, 1.8, 0, Math.PI * 2);
  ctx.arc(thief.x + Math.cos(thief.face + 0.35) * 5, thief.y - 2 + Math.sin(thief.face + 0.35) * 5, 1.8, 0, Math.PI * 2);
  ctx.fill();
}

function drawHud(ctx, world) {
  ctx.fillStyle = PAINT.bar;
  ctx.fillRect(0, 0, ARENA.width, 52);
  ctx.strokeStyle = PAINT.brass;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 52);
  ctx.lineTo(ARENA.width, 52);
  ctx.stroke();

  ctx.fillStyle = PAINT.ink;
  ctx.font = 'bold 20px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const taken = world.swag.filter((l) => l.taken).length;
  ctx.fillText(`SWAG ${taken}/${SWAG.length}`, 28, 27);
  ctx.fillText(`HAUL ${world.haul}`, 220, 27);
  const minutes = Math.floor(world.clock / 60);
  const seconds = Math.floor(world.clock % 60).toString().padStart(2, '0');
  ctx.fillText(`TIME ${minutes}:${seconds}`, 430, 27);

  // Siren meter.
  const meterX = 580;
  const meterW = 220;
  ctx.textAlign = 'left';
  ctx.fillText('SIREN', meterX, 27);
  ctx.fillStyle = '#000';
  ctx.fillRect(meterX + 70, 14, meterW, 24);
  const frac = world.heat / SIREN.ceiling;
  ctx.fillStyle = frac > 0.6 ? PAINT.red : PAINT.amber;
  ctx.fillRect(meterX + 70, 14, meterW * frac, 24);
  ctx.strokeStyle = PAINT.ink;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(meterX + 70, 14, meterW, 24);
  if (frac > 0.6) {
    ctx.fillStyle = PAINT.red;
    ctx.font = 'bold 16px Georgia, serif';
    ctx.fillText('!', meterX + 70 + meterW + 10, 27);
  }

  ctx.textAlign = 'right';
  ctx.fillStyle = world.gemInBag ? PAINT.open : PAINT.shut;
  ctx.font = 'bold 16px Georgia, serif';
  ctx.fillText(world.gemInBag ? 'SAPPHIRE SECURED — REACH THE EXIT' : 'STEAL THE STAR SAPPHIRE', ARENA.width - 28, 27);
}

function drawVeil(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(8, 10, 14, 0.78)';
  ctx.fillRect(0, 0, ARENA.width, ARENA.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = accent;
  ctx.font = 'bold 54px Georgia, serif';
  ctx.fillText(title, ARENA.width / 2, 300);
  ctx.fillStyle = PAINT.ink;
  ctx.font = '22px Georgia, serif';
  lines.forEach((line, i) => {
    ctx.fillText(line, ARENA.width / 2, 360 + i * 34);
  });
}

export function paintNight(ctx, world, scene, now) {
  ctx.clearRect(0, 0, ARENA.width, ARENA.height);

  // Floor: wood planks with a carpet runner down the hall.
  ctx.fillStyle = PAINT.boards;
  ctx.fillRect(0, 0, ARENA.width, ARENA.height);
  ctx.strokeStyle = PAINT.plank;
  ctx.lineWidth = 1;
  for (let x = 24; x < ARENA.width; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 24);
    ctx.lineTo(x, ARENA.height - 24);
    ctx.stroke();
  }
  for (let y = 24; y < ARENA.height; y += 64) {
    ctx.beginPath();
    ctx.moveTo(24, y);
    ctx.lineTo(ARENA.width - 24, y);
    ctx.stroke();
  }
  ctx.fillStyle = PAINT.runner;
  ctx.fillRect(440, 252, 400, 488);
  ctx.strokeStyle = PAINT.brass;
  ctx.lineWidth = 3;
  ctx.strokeRect(440, 252, 400, 488);

  // Vision cones first, so figures stand inside the light.
  for (const guard of world.watchmen) {
    drawCone(ctx, guard.x, guard.y, guard.face, WATCHMAN.sight, WATCHMAN.halfCone, PAINT.watchCone, PAINT.watchConeEdge);
  }
  for (const lens of world.lenses) {
    drawCone(ctx, lens.x, lens.y, lens.face, LENS.sight, LENS.halfCone, PAINT.lensCone, PAINT.lensConeEdge);
  }

  // Vitrines.
  for (const c of VITRINES) {
    ctx.fillStyle = PAINT.plinth;
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.fillStyle = 'rgba(127, 179, 200, 0.35)';
    ctx.fillRect(c.x + 4, c.y + 4, c.w - 8, c.h - 8);
    ctx.strokeStyle = PAINT.brass;
    ctx.lineWidth = 2;
    ctx.strokeRect(c.x, c.y, c.w, c.h);
  }

  // Swag still on the floor.
  for (const item of world.swag) {
    if (!item.taken) drawSwag(ctx, item, now);
  }

  // Barriers with a brass top edge.
  for (const w of BARRIERS) {
    ctx.fillStyle = PAINT.stone;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = PAINT.stoneTop;
    if (w.h <= 24) ctx.fillRect(w.x, w.y, w.w, 4);
    else ctx.fillRect(w.x, w.y, 4, w.h);
  }

  // The exit door at the south wall.
  ctx.fillStyle = world.gemInBag ? PAINT.open : PAINT.shut;
  ctx.fillRect(DOOR.x, DOOR.y, DOOR.w, DOOR.h);
  ctx.fillStyle = world.gemInBag ? '#10131a' : '#e8dcc0';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(world.gemInBag ? 'EXIT — GO!' : 'EXIT · LOCKED', DOOR.x + DOOR.w / 2, DOOR.y + DOOR.h / 2);

  for (const lens of world.lenses) drawLens(ctx, lens);
  for (const guard of world.watchmen) drawWatchman(ctx, guard, now);
  drawBurglar(ctx, world.burglar);

  drawHud(ctx, world);

  if (scene === 'menu') {
    drawVeil(ctx, 'THE MARLOW HEIST', [
      'One night. One gallery. One thief.',
      'Lift the Star Sapphire from the vault, grab what else you can,',
      'and slip out the south door before the siren fills.',
      '',
      'WASD / arrows — move      Shift — creep (slower, harder to spot)',
      'Stay out of the amber watchman cones and the red lens sweeps.',
      '',
      'Press Enter to begin',
    ], '#ffd75e');
  } else if (scene === 'caught') {
    drawVeil(ctx, 'CAUGHT', [
      world.note,
      `Swag taken: ${world.swag.filter((l) => l.taken).length} of ${world.swag.length}   ·   Haul: ${world.haul}`,
      '',
      'Press R to try again',
    ], '#e5484d');
  } else if (scene === 'escaped') {
    drawVeil(ctx, 'CLEAN GETAWAY', [
      world.note,
      `Final haul: ${world.haul}`,
      '',
      'Press R to run it again',
    ], '#3ddc84');
  } else if (scene === 'held') {
    drawVeil(ctx, 'HELD UP', ['Press P to keep moving.'], '#e8dcc0');
  }
}

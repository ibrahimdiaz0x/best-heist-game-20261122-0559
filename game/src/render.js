// The Marlow Heist — everything the eye sees, on one canvas. The gallery is
// top-down: a dark wood floor, a deep-red carpet runner down the hall,
// brass-trimmed walls, glass display cases, and the two things that matter
// most in a stealth game — the guards' amber vision cones and the cameras'
// red ones, painted before the figures so the thief reads as standing in
// the light. The HUD rides along the top: loot, score, alarm meter, clock.

import {
  ALARM, CAMERA, CASES, EXIT, FIELD, GUARD, LOOT, PALETTE, THIEF, WALLS,
} from './config.js';

function paintCone(ctx, ox, oy, facing, range, halfAngle, fill, edge) {
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

function paintLoot(ctx, item, pulse) {
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

  ctx.fillStyle = PALETTE.lootGlow;
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

function paintGuard(ctx, guard, time) {
  const bob = guard.mode === 'chase' ? Math.sin(time * 14) * 2 : 0;
  ctx.fillStyle = PALETTE.guard;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y + bob, GUARD.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0e1626';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Cap and facing tick.
  ctx.fillStyle = PALETTE.guardCap;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y + bob, GUARD.radius - 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#e8dcc0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y + bob);
  ctx.lineTo(guard.x + Math.cos(guard.angle) * (GUARD.radius + 6), guard.y + bob + Math.sin(guard.angle) * (GUARD.radius + 6));
  ctx.stroke();
  if (guard.mode === 'chase') {
    ctx.fillStyle = '#ff5a5a';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', guard.x, guard.y - GUARD.radius - 8 + bob);
  }
}

function paintCamera(ctx, camera) {
  ctx.save();
  ctx.translate(camera.x, camera.y);
  ctx.rotate(camera.angle);
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
  ctx.arc(camera.x, camera.y, 6, 0, Math.PI * 2);
  ctx.fill();
}

function paintThief(ctx, thief) {
  const r = thief.sneaking ? THIEF.radius - 3 : THIEF.radius;
  ctx.fillStyle = PALETTE.thiefCloak;
  ctx.beginPath();
  ctx.moveTo(thief.x, thief.y - r - 6);
  ctx.lineTo(thief.x + r + 4, thief.y + r);
  ctx.lineTo(thief.x - r - 4, thief.y + r);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.thief;
  ctx.beginPath();
  ctx.arc(thief.x, thief.y - 2, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0a0e14';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Eyes and facing tick.
  ctx.fillStyle = '#ffd75e';
  ctx.beginPath();
  ctx.arc(thief.x + Math.cos(thief.angle - 0.35) * 5, thief.y - 2 + Math.sin(thief.angle - 0.35) * 5, 1.8, 0, Math.PI * 2);
  ctx.arc(thief.x + Math.cos(thief.angle + 0.35) * 5, thief.y - 2 + Math.sin(thief.angle + 0.35) * 5, 1.8, 0, Math.PI * 2);
  ctx.fill();
}

function paintHud(ctx, world) {
  ctx.fillStyle = PALETTE.hudBar;
  ctx.fillRect(0, 0, FIELD.width, 52);
  ctx.strokeStyle = PALETTE.carpetEdge;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 52);
  ctx.lineTo(FIELD.width, 52);
  ctx.stroke();

  ctx.fillStyle = PALETTE.hudText;
  ctx.font = 'bold 20px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const taken = world.loot.filter((l) => l.taken).length;
  ctx.fillText(`LOOT ${taken}/${LOOT.length}`, 28, 27);
  ctx.fillText(`SCORE ${world.score}`, 220, 27);
  const minutes = Math.floor(world.time / 60);
  const seconds = Math.floor(world.time % 60).toString().padStart(2, '0');
  ctx.fillText(`TIME ${minutes}:${seconds}`, 430, 27);

  // Alarm meter.
  const meterX = 580;
  const meterW = 220;
  ctx.textAlign = 'left';
  ctx.fillText('ALARM', meterX, 27);
  ctx.fillStyle = '#000';
  ctx.fillRect(meterX + 70, 14, meterW, 24);
  const frac = world.alarm / ALARM.max;
  ctx.fillStyle = frac > 0.6 ? PALETTE.alarmHigh : PALETTE.alarmLow;
  ctx.fillRect(meterX + 70, 14, meterW * frac, 24);
  ctx.strokeStyle = PALETTE.hudText;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(meterX + 70, 14, meterW, 24);
  if (frac > 0.6) {
    ctx.fillStyle = PALETTE.alarmHigh;
    ctx.font = 'bold 16px Georgia, serif';
    ctx.fillText('!', meterX + 70 + meterW + 10, 27);
  }

  ctx.textAlign = 'right';
  ctx.fillStyle = world.sapphireTaken ? PALETTE.exitOpen : PALETTE.exitLocked;
  ctx.font = 'bold 16px Georgia, serif';
  ctx.fillText(world.sapphireTaken ? 'SAPPHIRE SECURED — REACH THE EXIT' : 'STEAL THE STAR SAPPHIRE', FIELD.width - 28, 27);
}

function paintOverlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(8, 10, 14, 0.78)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = accent;
  ctx.font = 'bold 54px Georgia, serif';
  ctx.fillText(title, FIELD.width / 2, 300);
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = '22px Georgia, serif';
  lines.forEach((line, i) => {
    ctx.fillText(line, FIELD.width / 2, 360 + i * 34);
  });
}

export function draw(ctx, world, screen, time) {
  ctx.clearRect(0, 0, FIELD.width, FIELD.height);

  // Floor: wood planks with a carpet runner down the hall.
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.strokeStyle = PALETTE.floorTile;
  ctx.lineWidth = 1;
  for (let x = 24; x < FIELD.width; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 24);
    ctx.lineTo(x, FIELD.height - 24);
    ctx.stroke();
  }
  for (let y = 24; y < FIELD.height; y += 64) {
    ctx.beginPath();
    ctx.moveTo(24, y);
    ctx.lineTo(FIELD.width - 24, y);
    ctx.stroke();
  }
  ctx.fillStyle = PALETTE.carpet;
  ctx.fillRect(440, 252, 400, 488);
  ctx.strokeStyle = PALETTE.carpetEdge;
  ctx.lineWidth = 3;
  ctx.strokeRect(440, 252, 400, 488);

  // Vision cones first, so figures stand inside the light.
  for (const guard of world.guards) {
    paintCone(ctx, guard.x, guard.y, guard.angle, GUARD.sightRange, GUARD.sightHalfAngle, PALETTE.guardCone, PALETTE.guardConeEdge);
  }
  for (const camera of world.cameras) {
    paintCone(ctx, camera.x, camera.y, camera.angle, CAMERA.sightRange, CAMERA.sightHalfAngle, PALETTE.cameraCone, PALETTE.cameraConeEdge);
  }

  // Display cases.
  for (const c of CASES) {
    ctx.fillStyle = PALETTE.caseBase;
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.fillStyle = 'rgba(127, 179, 200, 0.35)';
    ctx.fillRect(c.x + 4, c.y + 4, c.w - 8, c.h - 8);
    ctx.strokeStyle = PALETTE.carpetEdge;
    ctx.lineWidth = 2;
    ctx.strokeRect(c.x, c.y, c.w, c.h);
  }

  // Loot still on the floor.
  for (const item of world.loot) {
    if (!item.taken) paintLoot(ctx, item, time);
  }

  // Walls with a brass top edge.
  for (const w of WALLS) {
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = PALETTE.wallTop;
    if (w.h <= 24) ctx.fillRect(w.x, w.y, w.w, 4);
    else ctx.fillRect(w.x, w.y, 4, w.h);
  }

  // The exit door at the south wall.
  ctx.fillStyle = world.sapphireTaken ? PALETTE.exitOpen : PALETTE.exitLocked;
  ctx.fillRect(EXIT.x, EXIT.y, EXIT.w, EXIT.h);
  ctx.fillStyle = world.sapphireTaken ? '#10131a' : '#e8dcc0';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(world.sapphireTaken ? 'EXIT — GO!' : 'EXIT · LOCKED', EXIT.x + EXIT.w / 2, EXIT.y + EXIT.h / 2);

  for (const camera of world.cameras) paintCamera(ctx, camera);
  for (const guard of world.guards) paintGuard(ctx, guard, time);
  paintThief(ctx, world.thief);

  paintHud(ctx, world);

  if (screen === 'title') {
    paintOverlay(ctx, 'THE MARLOW HEIST', [
      'One night. One gallery. One thief.',
      'Lift the Star Sapphire from the vault, grab what else you can,',
      'and slip out the south door before the alarm fills.',
      '',
      'WASD / arrows — move      Shift — sneak (slower, harder to spot)',
      'Stay out of the amber guard cones and the red camera sweeps.',
      '',
      'Press Enter to begin',
    ], '#ffd75e');
  } else if (screen === 'over') {
    paintOverlay(ctx, 'BUSTED', [
      world.statusNote,
      `Loot taken: ${world.loot.filter((l) => l.taken).length} of ${world.loot.length}   ·   Score: ${world.score}`,
      '',
      'Press R to try again',
    ], '#e5484d');
  } else if (screen === 'won') {
    paintOverlay(ctx, 'CLEAN GETAWAY', [
      world.statusNote,
      `Final score: ${world.score}`,
      '',
      'Press R to run it again',
    ], '#3ddc84');
  } else if (screen === 'paused') {
    paintOverlay(ctx, 'PAUSED', ['Press P to keep moving.'], '#e8dcc0');
  }
}
